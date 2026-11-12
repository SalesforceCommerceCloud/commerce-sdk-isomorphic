/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import {execSync, spawnSync} from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import {
  fetchEcomBundles,
  loadBundledApi,
  resolveEcomOasRef,
  findApiFolders,
} from './ecom-oas';
import {
  API_VERSIONS_FILE,
  parseEcomVersionArg,
  parseSingleApiArgs,
  readApiVersions,
  rejectUnknownArgs,
  setEcomVersionHeader,
} from './utils';

dotenv.config();

// Where the reshaped, generator-ready API directories land; `renderTemplates`
// reads from here.
const PRODUCTION_API_PATH = path.join(__dirname, '../apis');
const OLD_APIS_PATH = path.join(__dirname, '../temp/oldApis');
const STAGED_APIS_PATH = path.join(__dirname, '../temp/stagedApis');
const ECOM_CHECKOUT_PATH = path.join(__dirname, '../temp/ecom-oas');

/**
 * Populates `apis/` from the ECOM monorepo.
 *
 * `api-versions.txt` is the allow-list of which APIs to ship, and records where
 * ECOM publishes each one's bundle, so only those directories are fetched. New ECOM
 * APIs are not exposed by the SDK until someone adds them there.
 *
 * Two modes:
 * - Release refresh (default): every allow-listed API is refreshed from the release
 *   branch named by the `# APIs for ECOM vXX.Y` header, `--ecom-version`, or
 *   `ECOM_OAS_REF`.
 * - Partial update (`--api <key> --ref <ref>`): only the named APIs are refreshed,
 *   from any ECOM ref, and every other folder in `apis/` is left untouched.
 *
 * Output is built in a staging directory and copied into `apis/` only once every
 * fetch and check has succeeded, so those failures never touch `apis/`. If the final
 * copy fails, `apis/` is restored from the backup in `temp/oldApis`.
 */
function updateApis(): void {
  const argv = process.argv.slice(2);
  rejectUnknownArgs(argv);
  const ecomVersion = parseEcomVersionArg(argv);
  const partial = parseSingleApiArgs(argv);
  const allowList = new Map(
    readApiVersions().map(({apiName, bundlePath}) => [apiName, bundlePath])
  );

  try {
    const requested = partial
      ? [...new Set(partial.apis)]
      : [...allowList.keys()];
    const unknown = requested.filter(key => !allowList.has(key));
    if (unknown.length) {
      throw new Error(
        `${unknown.join(
          ', '
        )} not in api-versions.txt; add it there first so the SDK is meant to ship it`
      );
    }
    const bundlePaths = requested.map(key => allowList.get(key) as string);

    const ref = partial ? partial.ref : resolveEcomOasRef(ecomVersion);
    console.log(`Fetching ${requested.length} ECOM bundle(s) at ref ${ref}`);
    const bundlesRoot = fetchEcomBundles(ECOM_CHECKOUT_PATH, ref, bundlePaths);
    const sha = execSync('git rev-parse HEAD', {cwd: ECOM_CHECKOUT_PATH})
      .toString()
      .trim();
    console.log(`Resolved ${ref} to ECOM commit ${sha}`);

    fs.removeSync(STAGED_APIS_PATH);
    fs.ensureDirSync(STAGED_APIS_PATH);

    // Load every bundle before staging any, so one bad API fails the run up front.
    const apis = requested.map((key, index) =>
      loadBundledApi(bundlesRoot, key, bundlePaths[index])
    );

    console.log(`\nStaged ${apis.length} API(s):`);
    apis.forEach(api => {
      const folderName = `${api.assetId}-${api.version}`;
      const targetDir = path.join(STAGED_APIS_PATH, folderName);
      const specName = `${api.assetId}-${api.apiVersion}-public.yaml`;
      fs.ensureDirSync(targetDir);
      fs.copySync(api.publicSpec, path.join(targetDir, specName));
      fs.writeJSONSync(
        path.join(targetDir, 'exchange.json'),
        {
          main: specName,
          name: api.name,
          assetId: api.assetId,
          version: api.version,
          classifier: 'oas',
          apiVersion: api.apiVersion,
          ecomRef: ref,
          ecomCommit: sha,
        },
        {spaces: 2}
      );
      console.log(`  ${api.assetId}-${api.apiVersion} -> ${folderName}`);
    });

    // Kept for `diffApis`, which compares it against the new `apis/`.
    fs.removeSync(OLD_APIS_PATH);
    fs.ensureDirSync(PRODUCTION_API_PATH);
    fs.copySync(PRODUCTION_API_PATH, OLD_APIS_PATH);

    try {
      if (partial) {
        requested.forEach(key => {
          findApiFolders(PRODUCTION_API_PATH, key).forEach(dir =>
            fs.removeSync(dir)
          );
        });
      } else {
        fs.emptyDirSync(PRODUCTION_API_PATH);
      }
      fs.copySync(STAGED_APIS_PATH, PRODUCTION_API_PATH);
    } catch (error) {
      console.error('Restoring apis/ from temp/oldApis...');
      fs.removeSync(PRODUCTION_API_PATH);
      fs.copySync(OLD_APIS_PATH, PRODUCTION_API_PATH);
      throw error;
    }

    if (!partial && process.env.ECOM_OAS_REF?.trim()) {
      console.warn(
        `WARNING: ECOM_OAS_REF=${ref} overrode the release branch, so these specs are not from the ECOM release named in api-versions.txt. Unset it before a release.`
      );
    }
    if (ecomVersion) {
      fs.writeFileSync(
        API_VERSIONS_FILE,
        setEcomVersionHeader(
          fs.readFileSync(API_VERSIONS_FILE, 'utf-8'),
          ecomVersion
        )
      );
      console.log(`Set the api-versions.txt header to ECOM v${ecomVersion}`);
    }

    console.log('\nECOM API update completed successfully');
  } catch (error) {
    console.error(
      'Error during ECOM API update:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

try {
  updateApis();
  // Run here rather than chained in package.json: yarn appends command-line
  // arguments to the end of the script string, so `--ecom-version` would reach
  // diffApis instead of this script. diffApis exits 1 when it finds differences, which
  // is the expected outcome of an update; anything else means the diff itself failed.
  const diff = spawnSync('yarn', ['diffApis'], {stdio: 'inherit'});
  if (diff.status === 0 || diff.status === 1) {
    console.log(
      `diffApis ${
        diff.status === 0 ? 'found no differences' : 'found differences'
      }, see temp/diffApis.txt`
    );
  } else {
    console.error(
      `diffApis failed (exit ${String(
        diff.status
      )}); apis/ is updated but not diffed`
    );
    process.exit(1);
  }
} catch (error) {
  console.error('Unhandled error:', error);
  process.exit(1);
}
