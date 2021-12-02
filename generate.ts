/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';

import {copySync} from 'fs-extra';
import {generate} from '@commerce-apps/raml-toolkit';

import {registerHelpers, registerPartials, setupApis} from './scripts/utils';

const API_DIRECTORY = process.env.COMMERCE_SDK_INPUT_DIR
  ? path.resolve(process.env.COMMERCE_SDK_INPUT_DIR)
  : path.join(__dirname, 'apis');
const OUTPUT_DIRECTORY = path.join(__dirname, 'src/lib');
const STATIC_DIRECTORY = path.join(__dirname, 'src/static');

registerHelpers();
registerPartials();

// eslint-disable-next-line no-console
console.log(`Creating SDK for ${API_DIRECTORY}`);

const skipTestFiles = (src: string): boolean => !/\.test\.[a-z]+$/.test(src);
copySync(STATIC_DIRECTORY, OUTPUT_DIRECTORY, {filter: skipTestFiles});

setupApis(API_DIRECTORY, OUTPUT_DIRECTORY).then((apis: generate.ApiMetadata) =>
  apis.render()
);
