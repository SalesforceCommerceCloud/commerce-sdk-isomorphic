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

// DOWNLOAD PRODUCTION DATA
fs.moveSync(PRODUCTION_API_PATH, OLD_APIS_PATH, {overwrite: true});
fs.ensureDirSync(PRODUCTION_API_PATH);

// eslint-disable-next-line no-console
downloadLatestApis(PRODUCTION_API_PATH).catch(console.error);
