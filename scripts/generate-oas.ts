/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import {generateFromOas} from '@commerce-apps/raml-toolkit';
import Handlebars from 'handlebars';

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

type ApiSpecDetail = {
  filepath: string;
  filename: string;
  name: string;
  apiName: string;
  directoryName: string;
};

const API_DIRECTORY = process.env.COMMERCE_SDK_INPUT_DIR
  ? path.resolve(process.env.COMMERCE_SDK_INPUT_DIR)
  : path.join(__dirname, '../apis');
const STATIC_DIRECTORY = path.join(__dirname, '../src/static');
const TARGET_DIRECTORY = path.join(__dirname, '../src/lib');
const TEMPLATE_DIRECTORY = path.join(__dirname, '../templatesOas');
const INDEX_TEMPLATE_LOCATION = path.join(
  __dirname,
  '../templates/index.ts.hbs'
);

function resolveApiName(name: string) {
  // Special cases for shopper-orders and shopper-seo where the API name has different casing then the name in exchange.json
  if (name === 'Shopper orders OAS') {
    return 'ShopperOrders';
  }
  if (name === 'Shopper Seo OAS') {
    return 'ShopperSEO';
  }

  // Remove all whitespace and replace 'OAS' with an empty string
  return name.replace(/\s+/g, '').replace('OAS', '');
}

function getAPIDetailsFromExchange(directory: string) {
  const exchangePath = path.join(API_DIRECTORY, directory, 'exchange.json');
  if (fs.existsSync(exchangePath)) {
    const exchangeConfig = fs.readJSONSync(exchangePath) as ExchangeConfig;
    return {
      filepath: path.join(API_DIRECTORY, directory, exchangeConfig.main),
      filename: exchangeConfig.main,
      directoryName: exchangeConfig.assetId.replace('-oas', ''),
      name: exchangeConfig.name,
      apiName: resolveApiName(exchangeConfig.name),
    };
  }
  throw new Error(`Exchange file does not exist for ${directory}`);
}

function generateSDKs(apiSpecDetail: ApiSpecDetail) {
  const {filepath, name, directoryName, apiName} = apiSpecDetail;
  console.log(apiName);
  if (fs.statSync(filepath).isFile() && filepath.includes('shopper')) {
    try {
      console.log(`Generating SDK for ${name}`);
      const outputDir = `${TARGET_DIRECTORY}/${directoryName}`;
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

function generateIndex(context: any) {
  const indexTemplate = fs.readFileSync(INDEX_TEMPLATE_LOCATION, 'utf8');
  const generatedIndex = Handlebars.compile(indexTemplate)(context);
  fs.writeFileSync(`${TARGET_DIRECTORY}/index.ts`, generatedIndex);
}

console.log('Starting OAS generation script');
const skipTestFiles = (src: string): boolean => !/\.test\.[a-z]+$/.test(src);
fs.copySync(STATIC_DIRECTORY, TARGET_DIRECTORY, {filter: skipTestFiles});
fs.readdir(API_DIRECTORY, (err: Error, directories: string[]) => {
  if (err) {
    console.error('Error reading api directory:', err);
    return;
  }

  const apiSpecDetails: ApiSpecDetail[] = [];
  const subDirectories: string[] = directories.filter((directory: string) =>
    fs.lstatSync(path.join(API_DIRECTORY, directory)).isDirectory()
  );
  subDirectories.forEach((directory: string) => {
    const details = getAPIDetailsFromExchange(directory);
    apiSpecDetails.push(details);
  });

  apiSpecDetails.forEach((apiSpecDetail: ApiSpecDetail) => {
    generateSDKs(apiSpecDetail);
  });

  generateIndex({children: apiSpecDetails});

  console.log(
    `OAS generation script completed. Files outputted to ${TARGET_DIRECTORY}`
  );
});
