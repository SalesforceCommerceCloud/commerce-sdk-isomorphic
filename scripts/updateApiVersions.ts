/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {execSync} from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

// Constants
const ORG_ID = '893f605e-10e2-423a-bdb4-f952f56eb6d8';
const API_VERSIONS_FILE = path.join(__dirname, '../api-versions.txt');

// Types for Anypoint Exchange API response
interface AssetVersion {
  version: string;
  status: string;
  createdDate: string;
}

interface ExchangeAssetDescribeResponse {
  versions: AssetVersion[];
  id: string;
  name: string;
}

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
 * Writes updated API versions back to the api-versions.txt file
 * @param apiVersions - Array of { apiName, version } objects
 */
function writeApiVersions(
  apiVersions: Array<{apiName: string; version: string}>
): void {
  const content = apiVersions
    .map(({apiName, version}) => `${apiName}=${version}`)
    .join('\n');
  fs.writeFileSync(API_VERSIONS_FILE, `${content}\n`, 'utf-8');
  console.log(`Updated ${API_VERSIONS_FILE}`);
}

/**
 * Extracts the major version number from a version string
 * @param version - Version string (e.g., '1.9.0', '2.1.0')
 * @returns Major version number
 */
function getMajorVersion(version: string): number {
  const match = /^(\d+)/.exec(version);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parses an API name to extract base name and version suffix
 * @param apiNameWithSuffix - API name with optional version suffix (e.g., 'shopper-baskets-oas-v1')
 * @returns Object with baseName and versionSuffix (e.g., {baseName: 'shopper-baskets-oas', versionSuffix: 'v1'})
 */
function parseApiName(apiNameWithSuffix: string): {
  baseName: string;
  versionSuffix: string | null;
} {
  const match = /^(.+?)-(v\d+)$/.exec(apiNameWithSuffix);
  if (match) {
    return {
      baseName: match[1],
      versionSuffix: match[2],
    };
  }
  return {
    baseName: apiNameWithSuffix,
    versionSuffix: null,
  };
}

/**
 * Gets the latest version of an API from Anypoint Exchange for a specific major version
 * @param apiNameWithSuffix - The API name with version suffix (e.g., 'shopper-baskets-oas-v1')
 * @param currentVersion - The current version to compare against
 * @returns The latest version string for the same major version
 */
function getLatestVersion(
  apiNameWithSuffix: string,
  currentVersion: string
): string | null {
  const username = process.env.ANYPOINT_USERNAME || '';
  const password = process.env.ANYPOINT_PASSWORD || '';

  // Parse the API name to get base name (without version suffix)
  const {baseName, versionSuffix} = parseApiName(apiNameWithSuffix);
  const currentMajorVersion = getMajorVersion(currentVersion);

  // Use current version to query the asset (any version works to get all versions)
  const assetId = `${ORG_ID}/${baseName}/${currentVersion}`;
  const cmd = `anypoint-cli-v4 exchange:asset:describe ${assetId} -o json --username '${username}' --password '${password}'`;

  try {
    console.log(`Checking latest version for ${apiNameWithSuffix}`);
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer to handle large JSON responses
    });

    const response = JSON.parse(output) as ExchangeAssetDescribeResponse;

    if (!response.versions || response.versions.length === 0) {
      console.warn(`No versions found for ${apiNameWithSuffix}`);
      return null;
    }

    // Filter for versions matching the same major version
    const applicableVersions = response.versions.filter(
      v => getMajorVersion(v.version) === currentMajorVersion
    );

    if (applicableVersions.length === 0) {
      console.warn(
        `No versions found for ${apiNameWithSuffix} with major version ${currentMajorVersion}`
      );
      return null;
    }

    const latestVersion = applicableVersions[0].version;

    return latestVersion;
  } catch (error) {
    console.error(
      `Error fetching latest version for ${apiNameWithSuffix}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Main function to check and update API versions
 */
function updateApiVersions(): void {
  // Check for required environment variables
  if (!process.env.ANYPOINT_USERNAME || !process.env.ANYPOINT_PASSWORD) {
    throw new Error(
      'Please ensure that ANYPOINT_USERNAME and ANYPOINT_PASSWORD environment variables are set.'
    );
  }

  try {
    console.log('Reading current API versions...\n');
    const apiVersions = readApiVersions();

    // Check each API for latest version
    const updatedVersions = apiVersions.map(({apiName, version}) => {
      const latestVersion = getLatestVersion(apiName, version);

      if (latestVersion && latestVersion !== version) {
        return {
          apiName,
          version: latestVersion,
          updated: true,
        };
      }
      return {
        apiName,
        version,
        updated: false,
      };
    });

    // Summary
    const updatesAvailable = updatedVersions.filter(v => v.updated);

    if (updatesAvailable.length > 0) {
      console.log(`\n✨ Found ${updatesAvailable.length} update(s):\n`);
      updatesAvailable.forEach(({apiName, version}) => {
        const oldVersion =
          apiVersions.find(v => v.apiName === apiName)?.version || 'unknown';
        console.log(`  ${apiName}: ${oldVersion} → ${version}`);
      });

      // Write updated versions to file
      console.log('\n📝 Updating api-versions.txt...');
      writeApiVersions(
        updatedVersions.map(({apiName, version}) => ({apiName, version}))
      );
      console.log('\n✅ API versions file updated successfully!');
    } else {
      console.log('\n✅ All APIs are up to date!');
    }

    // print APIs without updates
    const noUpdates = updatedVersions.filter(v => !v.updated);
    if (noUpdates.length > 0) {
      console.log('\nNo updates available for the following APIs:\n');
      noUpdates.forEach(({apiName, version}) => {
        console.log(`  ${apiName}: ${version}`);
      });
    }
  } catch (error) {
    console.error(
      'Error during version check:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Execute the main function
try {
  updateApiVersions();
} catch (error) {
  console.error('Unhandled error:', error);
  process.exit(1);
}
