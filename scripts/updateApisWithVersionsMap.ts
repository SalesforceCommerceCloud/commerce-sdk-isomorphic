/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import {downloadApisWithAnypointCli} from './utils';

dotenv.config();

// Constants
const ORG_ID = '893f605e-10e2-423a-bdb4-f952f56eb6d8';
const API_VERSIONS_FILE = path.join(__dirname, '../api-versions.txt');
const PRODUCTION_API_PATH = path.join(__dirname, '../apis');
const OLD_APIS_PATH = path.join(__dirname, '../temp/oldApis');

/**
 * Reads the API versions from the api-versions.txt file
 * @returns Array of { apiName, version } objects
 */
function readApiVersions(): Array<{apiName: string; version: string}> {
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

/**
 * Main function to update APIs based on versions in api-versions.txt
 */
async function updateApisWithVersionsMap(): Promise<void> {
  // Check for required environment variables
  if (!process.env.ANYPOINT_USERNAME || !process.env.ANYPOINT_PASSWORD) {
    throw new Error(
      'Please ensure that ANYPOINT_USERNAME and ANYPOINT_PASSWORD environment variables are set.'
    );
  }

  try {
    // Create a backup of existing APIs
    if (fs.existsSync(PRODUCTION_API_PATH)) {
      console.log(`Backing up existing APIs to ${OLD_APIS_PATH}`);
      await fs.move(PRODUCTION_API_PATH, OLD_APIS_PATH, {overwrite: true});
    }

    // Ensure target directory exists
    await fs.ensureDir(PRODUCTION_API_PATH);

    // Read API versions and download each one
    const apiVersions = readApiVersions();

    // Process all API versions in sequence
    await apiVersions.reduce(async (previousPromise, {apiName, version}) => {
      // Wait for the previous API to finish processing
      await previousPromise;

      const apiId = `${ORG_ID}/${apiName}/${version}`;
      console.log(`Processing API: ${apiId}`);

      try {
        const apiFolderName = `${apiName}-${version}`;
        await downloadApisWithAnypointCli(
          apiId,
          path.join(PRODUCTION_API_PATH, apiFolderName)
        );
        console.log(`Successfully updated ${apiName} to version ${version}`);
      } catch (error) {
        console.error(
          `Error updating ${apiName} (${version}):`,
          error instanceof Error ? error.message : String(error)
        );
        // Continue with other APIs even if one fails
      }
    }, Promise.resolve());

    console.log('API update process completed successfully');
  } catch (error) {
    console.error(
      'Error during API update process:',
      error instanceof Error ? error.message : String(error)
    );

    // Restore from backup if something went wrong
    if (fs.existsSync(OLD_APIS_PATH) && !fs.existsSync(PRODUCTION_API_PATH)) {
      console.log('Restoring APIs from backup...');
      await fs.move(OLD_APIS_PATH, PRODUCTION_API_PATH, {overwrite: true});
    }

    process.exit(1);
  }
}

/**
 * Recursively removes all files ending in '-internal.yaml' from a directory and its subdirectories
 * @param directoryPath - The path to the directory to process
 * @param depth - The depth of the directory to process, we limit the depth to 3 to avoid infinite recursion
 */
function removeInternalOas(directoryPath: string, depth = 0): void {
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

// Execute the main function
updateApisWithVersionsMap()
  .then(() => {
    // Remove internal files after download is complete
    removeInternalOas(OLD_APIS_PATH);
    removeInternalOas(PRODUCTION_API_PATH);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
