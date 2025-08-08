/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import {downloadLatestApis} from './utils';

dotenv.config();

if (!process.env.ANYPOINT_USERNAME || !process.env.ANYPOINT_PASSWORD) {
  throw new Error(
    'Please ensure that ANYPOINT_USERNAME and ANYPOINT_PASSWORD environment variables have been set.'
  );
}

const OLD_APIS_PATH = path.join(__dirname, '../temp/oldApis');
const PRODUCTION_API_PATH = path.join(__dirname, '../apis');

// TODO: clean up this function
/**
 * Recursively removes all files ending in '-internal.yaml' from a directory and its subdirectories
 * @param directoryPath - The path to the directory to process
 */
function removeInternalOas(directoryPath: string): void {
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
      removeInternalOas(fullPath);
    } else if (stat.isFile() && item.endsWith('-internal.yaml')) {
      // Remove internal files
      fs.removeSync(fullPath);
      console.log(`Removed internal file: ${fullPath}`);
    }
  });
}

// DOWNLOAD PRODUCTION DATA
fs.moveSync(PRODUCTION_API_PATH, OLD_APIS_PATH, {overwrite: true});
fs.ensureDirSync(PRODUCTION_API_PATH);

downloadLatestApis(
  'category:Visibility = "External" category:"SDK Type" = "Commerce" category:"SDK Type" = "Isomorphic"',
  PRODUCTION_API_PATH
)
  .then(() => {
    // Remove internal files after download is complete
    removeInternalOas(OLD_APIS_PATH);
    removeInternalOas(PRODUCTION_API_PATH);
  })
  .catch(error => console.log('Error downloading APIs' ,error));
