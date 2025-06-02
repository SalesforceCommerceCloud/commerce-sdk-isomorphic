/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import {generateFromOas, download} from '@commerce-apps/raml-toolkit';
import Handlebars from 'handlebars';

type ApiSpecDetail = {
  filepath: string;
  filename: string;
  name: string;
  apiName: string;
  directoryName: string;
};

const DEFAULT_API_DIRECTORY = path.join(__dirname, '../apis');
const STATIC_DIRECTORY = path.join(__dirname, '../src/static');
const TARGET_DIRECTORY = path.join(__dirname, '../src/lib');
const TEMPLATE_DIRECTORY = path.join(__dirname, '../templatesOas');
const INDEX_TEMPLATE_LOCATION = path.join(
  __dirname,
  '../templates/index.ts.hbs'
);
const VERSION_TEMPLATE_LOCATION = path.join(
  __dirname,
  '../templates/version.ts.hbs'
);

export function resolveApiName(name: string): string {
  // Special cases for shopper-orders and shopper-seo where the API name has different casing then the name in exchange.json
  if (name === 'Shopper orders OAS') {
    return 'ShopperOrders';
  }
  if (name === 'Shopper Seo OAS') {
    return 'ShopperSEO';
  }
  return name.replace(/\s+/g, '').replace('OAS', '');
}

export function getAPIDetailsFromExchange(directory: string): ApiSpecDetail {
  const exchangePath = path.join(directory, 'exchange.json');
  if (fs.existsSync(exchangePath)) {
    const exchangeConfig = fs.readJSONSync(exchangePath) as download.ExchangeConfig;
    return {
      filepath: path.join(directory, exchangeConfig.main),
      filename: exchangeConfig.main,
      directoryName: exchangeConfig.assetId.replace('-oas', ''),
      name: exchangeConfig.name,
      apiName: resolveApiName(exchangeConfig.name),
    };
  }
  throw new Error(`Exchange file does not exist for ${directory}`);
}

export function generateSDKs(apiSpecDetail: ApiSpecDetail): void {
  const {filepath, name, directoryName} = apiSpecDetail;
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

export function generateIndex(context: {
  children: ApiSpecDetail[] | {name: string; apiName: string}[];
}): void {
  const indexTemplate = fs.readFileSync(INDEX_TEMPLATE_LOCATION, 'utf8');
  const generatedIndex = Handlebars.compile(indexTemplate)(context);
  fs.writeFileSync(`${TARGET_DIRECTORY}/index.ts`, generatedIndex);
}

export function generateVersionFile(): void {
  const version = process.env.PACKAGE_VERSION || 'unknown';
  const versionTemplate = fs.readFileSync(VERSION_TEMPLATE_LOCATION, 'utf8');
  const generatedVersion = Handlebars.compile(versionTemplate)({
    metadata: {sdkVersion: version},
  });
  fs.writeFileSync(`${STATIC_DIRECTORY}/version.ts`, generatedVersion);
}

export function copyStaticFiles(): void {
  const skipTestFiles = (src: string): boolean => !/\.test\.[a-z]+$/.test(src);
  fs.copySync(STATIC_DIRECTORY, TARGET_DIRECTORY, {filter: skipTestFiles});
}

export function main(): void {
  console.log('Starting OAS generation script');
  const apiDirectory = process.env.COMMERCE_SDK_INPUT_DIR
    ? path.resolve(process.env.COMMERCE_SDK_INPUT_DIR)
    : DEFAULT_API_DIRECTORY;

  fs.readdir(apiDirectory, (err: Error, directories: string[]) => {
    if (err) {
      console.error('Error reading api directory:', err);
      return;
    }

    const apiSpecDetails: ApiSpecDetail[] = [];
    const subDirectories: string[] = directories.filter((directory: string) =>
      fs.lstatSync(path.join(apiDirectory, directory)).isDirectory()
    );
    subDirectories.forEach((directory: string) => {
      const details = getAPIDetailsFromExchange(
        path.join(apiDirectory, directory)
      );
      apiSpecDetails.push(details);
    });

    apiSpecDetails.forEach((apiSpecDetail: ApiSpecDetail) => {
      generateSDKs(apiSpecDetail);
    });

    generateIndex({children: apiSpecDetails});
    generateVersionFile();
    copyStaticFiles();

    console.log(
      `OAS generation script completed. Files outputted to ${TARGET_DIRECTORY}`
    );
  });
}

main();
