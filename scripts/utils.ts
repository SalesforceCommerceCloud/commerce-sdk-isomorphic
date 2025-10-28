/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable import/prefer-default-export */
import {download} from '@commerce-apps/raml-toolkit';
import {execSync} from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';

/**
 * Searches for an API by name and downloads it to a folder.
 *
 * NOTE: Coverage passes without this function being covered.
 *  We should have some followup to figure out how to cover it.
 *  Ive spent hours trying to mock download
 *
 * @param searchQuery - Query to search exchange
 * @param rootPath - Root path to download to
 *
 * @returns a promise that we will complete
 */
export async function downloadLatestApis(
  searchQuery: string,
  rootPath: string
): Promise<void> {
  const matchedApis = await download.search(searchQuery, undefined, true);
  if (!(matchedApis?.length > 0)) {
    throw new Error(`No results in Exchange for '${searchQuery}'`);
  }
  try {
    await download.downloadRestApis(matchedApis, rootPath, true);
  } catch (err: unknown) {
    if (err instanceof Error) {
      err.message = `Failed to download API specs: ${err.message}`;
    }
    throw err;
  }
}

/**
 * Downloads API assets using anypoint-cli-v4 and extracts them to the target directory.
 *
 * @param apiId - The API ID in Anypoint Exchange
 * @param targetDir - Directory where the API assets should be extracted
 * @param options - Optional parameters
 * @param options.anypointCliPath - Path to anypoint-cli-v4 executable (default: 'anypoint-cli-v4')
 * @param options.extract - Whether to extract the downloaded assets (default: true)
 * @param options.overwrite - Whether to overwrite existing files (default: true)
 *
 * @returns Promise that resolves when the download and extraction is complete
 */
export async function downloadApisWithAnypointCli(
  apiId: string,
  targetDir: string,
  options: {
    anypointCliPath?: string;
    extract?: boolean;
    overwrite?: boolean;
  } = {}
): Promise<void> {
  const {
    anypointCliPath = 'anypoint-cli-v4',
    extract = true,
    overwrite = true,
  } = options;

  try {
    // Create a temporary directory for the download
    const tempDir = path.join(process.cwd(), 'temp', 'downloads');
    await fs.ensureDir(tempDir);

    // Build the command with proper quoting for special characters
    const username = process.env.ANYPOINT_USERNAME || '';
    const password = process.env.ANYPOINT_PASSWORD || '';

    const cmd = `${anypointCliPath} exchange:asset:download ${apiId} ${tempDir} --username '${username}' --password '${password}'`;

    // Execute the command
    console.log(`Downloading API ${apiId} using anypoint-cli...`);
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });

    // Find the downloaded zip file
    const files = await fs.readdir(tempDir);
    const zipFile: string | undefined = files.find((file: string) =>
      file.endsWith('.zip')
    );

    if (!zipFile) {
      throw new Error(`No zip file found in ${tempDir}`);
    }

    const zipPath = path.join(tempDir, zipFile);
    console.log(`Extracting ${zipFile} to ${targetDir}...`);

    // Extract the zip file
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const zip = new AdmZip(zipPath);

    // Ensure target directory exists
    await fs.ensureDir(targetDir);

    // Extract all contents to target directory
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    zip.extractAllTo(targetDir, overwrite);

    // Clean up temporary files
    await fs.remove(tempDir);

    console.log(
      `Successfully downloaded and extracted API ${apiId} to ${targetDir}`
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download API ${apiId}: ${error.message}`);
    }
    throw new Error(`Failed to download API ${apiId}`);
  }
}
