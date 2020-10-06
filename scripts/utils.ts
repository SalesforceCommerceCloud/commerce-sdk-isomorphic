/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { generate, download } from '@commerce-apps/raml-toolkit';
import path from 'path';

import * as templateHelpers from './templateHelpers';

const TEMPLATE_DIRECTORY = `${__dirname}/../templates`;
const { registerPartial, loadApiDirectory } = generate;
type ApiMetadata = generate.ApiMetadata;
type ApiModel = generate.ApiModel;

// -------HELPER REGISTRATION-------
const Handlebars = generate.HandlebarsWithAmfHelpers;

// eslint-disable-next-line import/no-extraneous-dependencies
require('handlebars-helpers')({ handlebars: Handlebars });

/**
 * Register the custom helpers defined in our pipeline
 */
export function registerHelpers(): void {
  const helpers: {[key: string]: Handlebars.HelperDelegate} = templateHelpers;
  const keys:string[] = Object.keys(helpers);
  keys.forEach((helper) => Handlebars.registerHelper(helper, helpers[helper]));
}

/**
 * Register any customer partials we have in our pipeline
 */
export function registerPartials(): void {
  registerPartial(
    'dtoPartial',
    path.join(TEMPLATE_DIRECTORY, 'dtoPartial.ts.hbs'),
  );
  registerPartial(
    'operationsPartial',
    path.join(TEMPLATE_DIRECTORY, 'operations.ts.hbs'),
  );
}

function addTemplates(
  apis: ApiMetadata,
  outputBasePath: string,
): ApiMetadata {
  apis.addTemplate(
    path.join(TEMPLATE_DIRECTORY, 'index.ts.hbs'),
    path.join(outputBasePath, 'index.ts'),
  );

  apis.children.forEach((api: ApiMetadata) => {
    api.addTemplate(
      path.join(TEMPLATE_DIRECTORY, 'client.ts.hbs'),
      path.join(outputBasePath, `${api.name.lowerCamelCase}.ts`),
    );
  });
  return apis;
}

/**
 * Primary driver, loads the apis and templates associated with those apis.
 *
 * @param inputDir - Directory for input
 * @param outputDir - Directory for output
 *
 * @returns - The a promise to have the ApiMetaData tree ready to be rendered
 */
export async function setupApis(
  inputDir: string,
  outputDir: string,
): Promise<ApiMetadata> {
  let apis = loadApiDirectory(inputDir);
  await apis.init();

  apis = addTemplates(apis, outputDir);
  return apis;
}

/**
 * Searches for an API by name and downloads it to a folder.
 *
 * NOTE: Coverage passes without this function being covered.
 *  We should have some followup to figure out how to cover it.
 *  Ive spent hours trying to mock download
 *
 * @param name - Api name to search for
 * @param deployment - What deployment to build for
 * @param rootPath - Root path to download to
 *
 * @returns a promise that we will complete
 */
export async function updateApis(
  name: string,
  deployment: RegExp,
  rootPath: string,
): Promise<void> {
  const matchedApis = await download.search(`"${name}"`, deployment);
  if (!(matchedApis?.length > 0)) {
    throw new Error(`No results in Exchange for '${name}'`);
  }
  const api = matchedApis.find((matchedApi) => matchedApi?.assetId === name);
  if (!api) {
    throw new Error(`No exact match in Exchange for '${name}'`);
  }
  await download.downloadRestApis([api], rootPath);
}
