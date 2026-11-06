/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import path from 'path';
import fs from 'fs-extra';
import {
  fetchEcomOasTree,
  discoverEcomApis,
  assetIdFromTitle,
  bundleSpec,
  substituteDescription,
  ECOM_OAS_REF,
} from './ecom-oas';
import {readApiVersions, removeInternalOas} from './utils';

// Where the reshaped, generator-ready API directories land - same as the
// Anypoint path, so `renderTemplates` is identical regardless of source.
const PRODUCTION_API_PATH = path.join(__dirname, '../apis');
const OLD_APIS_PATH = path.join(__dirname, '../temp/oldApis');
const ECOM_CHECKOUT_PATH = path.join(__dirname, '../temp/ecom-oas');

/**
 * Populates `apis/` from the ECOM monorepo instead of Anypoint Exchange.
 *
 * `api-versions.txt` stays the allow-list of which APIs to ship: an ECOM-discovered
 * API is only staged if its `<assetId>-vN` appears in that file, so this migration
 * does not silently pull in APIs the SDK does not currently expose. The pinned
 * version in that file is not used to resolve an artifact anymore (the version now
 * comes from the spec's `info.version`); it remains the source of the allow-list.
 */
async function updateApisFromEcom(): Promise<void> {
  const allowList = new Set(readApiVersions().map(({apiName}) => apiName));

  try {
    if (fs.existsSync(PRODUCTION_API_PATH)) {
      console.log(`Backing up existing APIs to ${OLD_APIS_PATH}`);
      await fs.move(PRODUCTION_API_PATH, OLD_APIS_PATH, {overwrite: true});
    }
    await fs.ensureDir(PRODUCTION_API_PATH);

    console.log(`Fetching ECOM OAS tree at ref ${ECOM_OAS_REF}`);
    const oasRoot = fetchEcomOasTree(ECOM_CHECKOUT_PATH);

    const discovered = discoverEcomApis(oasRoot);
    console.log(`Discovered ${discovered.length} API(s) in the ECOM tree`);

    const staged: string[] = [];
    const skipped: string[] = [];

    discovered.forEach(api => {
      const assetId = assetIdFromTitle(api.title);
      const allowKey = `${assetId}-${api.apiVersion}`;
      if (!allowList.has(allowKey)) {
        skipped.push(`${api.relPath} (${allowKey} not in api-versions.txt)`);
        return;
      }

      const folderName = `${assetId}-${api.version}`;
      const targetDir = path.join(PRODUCTION_API_PATH, folderName);
      fs.ensureDirSync(targetDir);

      const bundledName = `${assetId}-${api.apiVersion}-public.yaml`;
      const bundledPath = path.join(targetDir, bundledName);
      bundleSpec(api.rootSpec, bundledPath);
      substituteDescription(bundledPath, path.dirname(api.rootSpec));

      const exchange = {
        main: bundledName,
        name: `${api.title} OAS`,
        assetId,
        version: api.version,
        classifier: 'oas',
        apiVersion: api.apiVersion,
      };
      fs.writeJSONSync(path.join(targetDir, 'exchange.json'), exchange, {
        spaces: 2,
      });

      staged.push(`${allowKey} -> ${folderName}`);
    });

    console.log(`\nStaged ${staged.length} API(s):`);
    staged.forEach(line => console.log(`  ${line}`));
    if (skipped.length) {
      console.log(`\nSkipped ${skipped.length} discovered API(s):`);
      skipped.forEach(line => console.log(`  ${line}`));
    }

    const missing = [...allowList].filter(
      key => !staged.some(line => line.startsWith(`${key} `))
    );
    if (missing.length) {
      throw new Error(
        `These APIs are in api-versions.txt but were not found in the ECOM tree: ${missing.join(
          ', '
        )}`
      );
    }

    console.log('\nECOM API update completed successfully');
  } catch (error) {
    console.error(
      'Error during ECOM API update:',
      error instanceof Error ? error.message : String(error)
    );
    if (fs.existsSync(OLD_APIS_PATH)) {
      console.log('Restoring APIs from backup...');
      await fs.move(OLD_APIS_PATH, PRODUCTION_API_PATH, {overwrite: true});
    }
    process.exit(1);
  }
}

updateApisFromEcom()
  .then(() => {
    removeInternalOas(OLD_APIS_PATH);
    removeInternalOas(PRODUCTION_API_PATH);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
