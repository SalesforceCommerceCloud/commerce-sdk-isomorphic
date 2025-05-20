/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import {generateFromOas} from '@commerce-apps/raml-toolkit';

type ExchangeConfig = {
  dependencies?: {
    version: string;
    assetId: string;
    groupId: string;
  }[];
  version: string;
  originalFormatVersion: string;
  apiVersion: string;
  descriptorVersion: string;
  classifier: string;
  main: string;
  assetId: string;
  groupId: string;
  organizationId: string;
  name: string;
  tags: string[];
};

const API_DIRECTORY = process.env.COMMERCE_SDK_INPUT_DIR
  ? path.resolve(process.env.COMMERCE_SDK_INPUT_DIR)
  : path.join(__dirname, '../apis');
const STATIC_DIRECTORY = path.join(__dirname, '../src/static');
const TARGET_DIRECTORY = path.join(__dirname, '../src/lib');
const TEMPLATE_DIRECTORY = path.join(__dirname, '../templatesOas');

function getAPIDetailsFromExchange(directory: string) {
  const exchangePath = path.join(API_DIRECTORY, directory, 'exchange.json');
  if (fs.existsSync(exchangePath)) {
    const exchangeConfig = fs.readJSONSync(exchangePath) as ExchangeConfig;
    return {
      filepath: path.join(API_DIRECTORY, directory, exchangeConfig.main),
      filename: exchangeConfig.main,
      name: exchangeConfig.name,
    };
  }
  throw new Error(`Exchange file does not exist for ${directory}`);
}

function generateSDKs(apiSpecDetail: {
  filepath: string;
  filename: string;
  name: string;
}) {
  const {filepath, filename, name} = apiSpecDetail;
  if (fs.statSync(filepath).isFile() && filepath.includes('shopper')) {
    try {
      console.log(`Generating SDK for ${name}`);
      const outputDir = `${TARGET_DIRECTORY}/${filename.split('-oas')[0]}`;
      generateFromOas.generateFromOas({
        inputSpec: `${filepath}`,
        outputDir: `${outputDir}`,
        templateDir: `${TEMPLATE_DIRECTORY}`,
        skipValidateSpec: true,
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.error(`Error generating SDK for ${name}: ${error}`);
    }
  }
}

console.log('Starting OAS generation script');
const skipTestFiles = (src: string): boolean => !/\.test\.[a-z]+$/.test(src);
fs.copySync(STATIC_DIRECTORY, TARGET_DIRECTORY, {filter: skipTestFiles});
fs.readdir(API_DIRECTORY, (err: Error, directories: string[]) => {
  if (err) {
    console.error('Error reading api directory:', err);
    return;
  }

  const apiSpecDetails: {filepath: string; filename: string; name: string}[] =
    [];
  const subDirectories: string[] = directories.filter((directory: string) =>
    fs.lstatSync(path.join(API_DIRECTORY, directory)).isDirectory()
  );
  subDirectories.forEach((directory: string) => {
    const details = getAPIDetailsFromExchange(directory);
    apiSpecDetails.push(details);
  });

  apiSpecDetails.forEach(
    (apiSpecDetail: {filepath: string; filename: string; name: string}) => {
      generateSDKs(apiSpecDetail);
    }
  );

  console.log(
    `OAS generation script completed. Files outputted to ${TARGET_DIRECTORY}`
  );
});
