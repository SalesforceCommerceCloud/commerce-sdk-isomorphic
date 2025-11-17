/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import {execSync} from 'child_process';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import {API_VERSIONS_FILE, ORG_ID, readApiVersions} from './utils';

dotenv.config();

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
 * Writes updated API versions back to the api-versions.txt file
 * @param apiVersions - Array of { apiName, version } objects
 */
export function writeApiVersions(
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
export function getMajorVersion(version: string): number {
  const match = /^(\d+)/.exec(version);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Parses an API name to extract base name and version suffix
 * @param apiNameWithSuffix - API name with optional version suffix (e.g., 'shopper-baskets-oas-v1')
 * @returns Object with baseName and versionSuffix (e.g., {baseName: 'shopper-baskets-oas', versionSuffix: 'v1'})
 */
export function parseApiName(apiNameWithSuffix: string): {
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
 * @param orgId
 * @returns The latest version string for the same major version
 */
export function getLatestVersion(
  apiNameWithSuffix: string,
  currentVersion: string,
  orgId: string
): string | null {
  const username = process.env.ANYPOINT_USERNAME || '';
  const password = process.env.ANYPOINT_PASSWORD || '';

  // Parse the API name to get base name (without version suffix)
  const {baseName} = parseApiName(apiNameWithSuffix);
  const currentMajorVersion = getMajorVersion(currentVersion);

  // Use current version to query the asset (any version works to get all versions)
  const assetId = `${orgId}/${baseName}/${currentVersion}`;
  const cmd = `anypoint-cli-v4 exchange:asset:describe ${assetId} -o json --username '${username}' --password '${password}' --organization=${orgId}`;

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
export function updateApiVersions(): void {
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
      const latestVersion = getLatestVersion(apiName, version, ORG_ID);

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

// Execute the main function only if this file is run directly
/* istanbul ignore next */
if (require.main === module) {
  try {
    updateApiVersions();
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}
