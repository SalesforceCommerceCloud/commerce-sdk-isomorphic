/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import path from 'path';
import fs from 'fs-extra';

export const API_VERSIONS_FILE = path.join(__dirname, '../api-versions.txt');
const MISSING_HEADER_MESSAGE =
  'api-versions.txt is missing the "# APIs for ECOM vXX.Y" header';

/**
 * Recursively removes all files ending in '-internal.yaml' from a directory and its subdirectories
 * @param directoryPath - The path to the directory to process
 * @param depth - The depth of the directory to process, we limit the depth to 3 to avoid infinite recursion
 */
export function removeInternalOas(directoryPath: string, depth = 0): void {
  if (depth > 3) {
    console.warn(
      `Reached maximum depth (${depth}) for directory: ${directoryPath}`
    );
    return;
  }

  if (!fs.existsSync(directoryPath)) {
    console.warn(`Directory does not exist: ${directoryPath}`);
    return;
  }

  const items = fs.readdirSync(directoryPath);

  items.forEach(item => {
    const fullPath = path.join(directoryPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      removeInternalOas(fullPath, depth + 1);
    } else if (stat.isFile() && item.endsWith('-internal.yaml')) {
      // Remove internal files
      fs.removeSync(fullPath);
      console.log(`Removed internal file: ${fullPath}`);
    }
  });
}

const ECOM_VERSION_HEADER = /^#\s*APIs for ECOM v(\d+\.\d+)\s*$/m;

/**
 * Extracts the ECOM release (e.g. "26.11") from the `# APIs for ECOM v26.11`
 * header of api-versions.txt content.
 * @throws if the header is missing, since the ECOM ref cannot be derived without it
 */
export function parseEcomVersion(apiVersionsContent: string): string {
  const match = ECOM_VERSION_HEADER.exec(apiVersionsContent);
  if (!match) {
    throw new Error(MISSING_HEADER_MESSAGE);
  }
  return match[1];
}

/**
 * Rewrites the ECOM release in the api-versions.txt header, leaving every other
 * line untouched.
 * @throws if the header is missing
 */
export function setEcomVersionHeader(
  apiVersionsContent: string,
  ecomVersion: string
): string {
  if (!ECOM_VERSION_HEADER.test(apiVersionsContent)) {
    throw new Error(MISSING_HEADER_MESSAGE);
  }
  return apiVersionsContent.replace(
    ECOM_VERSION_HEADER,
    `# APIs for ECOM v${ecomVersion}`
  );
}

/**
 * Reads `--ecom-version 27.1` or `--ecom-version=27.1` from the command line.
 * @returns the version, or undefined when the flag is absent
 * @throws if the flag is present with a value that is not `<major>.<minor>`
 */
export function parseEcomVersionArg(argv: string[]): string | undefined {
  const flag = '--ecom-version';
  const index = argv.findIndex(
    arg => arg === flag || arg.startsWith(`${flag}=`)
  );
  if (index === -1) {
    return undefined;
  }
  const value = argv[index].startsWith(`${flag}=`)
    ? argv[index].slice(flag.length + 1)
    : argv[index + 1];
  if (!value || !/^\d+\.\d+$/.test(value)) {
    throw new Error(
      `${flag} must look like 27.1, received ${value ?? 'nothing'}`
    );
  }
  return value;
}

export type SingleApiSelection = {apis: string[]; ref: string};

function readFlagValues(argv: string[], flag: string): string[] {
  const values: string[] = [];
  argv.forEach((arg, index) => {
    if (arg.startsWith(`${flag}=`)) {
      values.push(arg.slice(flag.length + 1));
    } else if (arg === flag) {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error(`${flag} needs a value`);
      }
      values.push(next);
    }
  });
  return values;
}

/**
 * Reads `--api <key> [--api <key>...] --ref <git ref>` from the command line, which
 * selects a partial update of just the named APIs from an arbitrary ECOM ref.
 * @returns the selection, or undefined when neither flag is present
 * @throws if only one of the flags is given, a value is missing, or it is combined
 * with `--ecom-version` (a release refresh and a partial update are different modes)
 */
export function parseSingleApiArgs(
  argv: string[]
): SingleApiSelection | undefined {
  const apis = readFlagValues(argv, '--api');
  const refs = readFlagValues(argv, '--ref');
  if (apis.length === 0 && refs.length === 0) {
    return undefined;
  }
  if (apis.length === 0) {
    throw new Error('--ref requires at least one --api');
  }
  if (refs.length === 0) {
    throw new Error('--api requires --ref');
  }
  if (parseEcomVersionArg(argv) !== undefined) {
    throw new Error('--api/--ref cannot be combined with --ecom-version');
  }
  return {apis, ref: refs[refs.length - 1]};
}

/**
 * Maps an ECOM release to the git branch that carries its OAS sources.
 */
export function ecomRefForVersion(ecomVersion: string): string {
  return `release.${ecomVersion}`;
}

// `<type>/<family>/<api>/vN` under the ECOM bundles directory. Restricting the
// characters keeps the value safe to hand to `git sparse-checkout` and stops it
// pointing outside the bundles directory.
const BUNDLE_PATH = /^[a-z0-9_-]+(\/[a-z0-9_-]+){2}\/v\d+$/;

export type AllowListedApi = {apiName: string; bundlePath: string};

/**
 * Reads api-versions.txt: one `<assetId>-vN=<type>/<family>/<api>/vN` line per API
 * the SDK ships. The key is the SDK's name for the API, the value is where ECOM
 * publishes its bundle, so updates fetch exactly those directories.
 * @throws if the file is missing or a line's location is malformed or names a
 * different major version than its key
 */
export function readApiVersions(): AllowListedApi[] {
  if (!fs.existsSync(API_VERSIONS_FILE)) {
    throw new Error(`API versions file not found at: ${API_VERSIONS_FILE}`);
  }

  const content = fs.readFileSync(API_VERSIONS_FILE, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const [apiName, bundlePath = ''] = line.split('=').map(s => s.trim());
      const keyVersion = /-(v\d+)$/.exec(apiName)?.[1];
      if (
        !BUNDLE_PATH.test(bundlePath) ||
        !keyVersion ||
        !bundlePath.endsWith(`/${keyVersion}`)
      ) {
        throw new Error(
          `api-versions.txt: ${apiName} must map to its ECOM bundle location, <type>/<family>/<api>/${
            keyVersion ?? 'vN'
          }, received "${bundlePath}"`
        );
      }
      return {apiName, bundlePath};
    });
}
