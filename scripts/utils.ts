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

/**
 * Maps an ECOM release to the git branch that carries its OAS sources.
 */
export function ecomRefForVersion(ecomVersion: string): string {
  return `release.${ecomVersion}`;
}

/**
 * Reads the API versions from the api-versions.txt file
 * @returns Array of { apiName, version } objects
 */
export function readApiVersions(): Array<{apiName: string; version: string}> {
  if (!fs.existsSync(API_VERSIONS_FILE)) {
    throw new Error(`API versions file not found at: ${API_VERSIONS_FILE}`);
  }

  const content = fs.readFileSync(API_VERSIONS_FILE, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const [apiName, version] = line.split('=').map(s => s.trim());
      return {apiName, version};
    });
}
