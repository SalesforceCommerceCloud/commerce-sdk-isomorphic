/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path';
import fs from 'fs-extra';
import {updateApis} from './utils';
import {API_LIST} from './config';

const OLD_APIS_PATH = path.join(__dirname, '../temp/oldApis');
const PRODUCTION_API_PATH = path.join(__dirname, '../apis');

// DOWNLOAD PRODUCTION DATA
fs.moveSync(PRODUCTION_API_PATH, OLD_APIS_PATH, {overwrite: true});
fs.ensureDirSync(PRODUCTION_API_PATH);

API_LIST.forEach(name => {
  // eslint-disable-next-line no-console
  updateApis(name, /production/i, PRODUCTION_API_PATH).catch(console.error);
});
