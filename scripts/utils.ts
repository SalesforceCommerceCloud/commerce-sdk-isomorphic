/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {generate, download} from '@commerce-apps/raml-toolkit';
import addHelpers from 'handlebars-helpers';
import path from 'path';
import {readJsonSync} from 'fs-extra';

import {Name} from '@commerce-apps/raml-toolkit/lib/common/structures/name';
import {ApiModel} from '@commerce-apps/raml-toolkit/lib/generate';
import * as templateHelpers from './templateHelpers';

const PROJECT_ROOT = path.join(__dirname, '..');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');

const TEMPLATE_DIRECTORY = `${__dirname}/../templates`;
const {registerPartial, loadApiDirectory} = generate;
type ApiMetadata = generate.ApiMetadata;

// -------HELPER REGISTRATION-------
const Handlebars = generate.HandlebarsWithAmfHelpers;

addHelpers({handlebars: Handlebars});

/**
 * Register the custom helpers defined in our pipeline
 */
export function registerHelpers(): void {
  const helpers: {[key: string]: Handlebars.HelperDelegate} = templateHelpers;
  const keys: string[] = Object.keys(helpers);
  keys.forEach(helper => Handlebars.registerHelper(helper, helpers[helper]));
}

/**
 * Register any customer partials we have in our pipeline
 */
export function registerPartials(): void {
  registerPartial(
    'dtoPartial',
    path.join(TEMPLATE_DIRECTORY, 'dtoPartial.ts.hbs')
  );
  registerPartial(
    'operationsPartial',
    path.join(TEMPLATE_DIRECTORY, 'operations.ts.hbs')
  );
}

function addTemplates(apis: ApiMetadata, outputBasePath: string): ApiMetadata {
  apis.addTemplate(
    path.join(TEMPLATE_DIRECTORY, 'index.ts.hbs'),
    path.join(outputBasePath, 'index.ts')
  );

  // add version template
  apis.addTemplate(
    path.join(TEMPLATE_DIRECTORY, 'version.ts.hbs'),
    path.join(outputBasePath, 'version.ts')
  );

  apis.children.forEach((api: ApiMetadata) => {
    api.addTemplate(
      path.join(TEMPLATE_DIRECTORY, 'client.ts.hbs'),
      path.join(outputBasePath, `${api.name.lowerCamelCase}.ts`)
    );
  });
  return apis;
}

// Editing the name of the Shopper Context API Model so our name is used for generating class name.
// This is hard-coded for now but in the future if we handle the case where type name and title clash better, this can be removed.
function overwriteShopperContextName(apis: ApiMetadata): void {
  const shopperContextApi = apis.children.find(
    api => api.name.original === 'shopper-context'
  );

  if (shopperContextApi) {
    shopperContextApi.name = new Name('shopper-contexts');
  }
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
  outputDir: string
): Promise<ApiMetadata> {
  let apis = loadApiDirectory(inputDir);
  // SDK version is not API metadata, so it is not included in the file, but it
  // is necessary for generating the SDK (as part of the user agent header).
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  apis.metadata.sdkVersion = await readJsonSync(PACKAGE_JSON).version;

  // TODO: @W-13013140. After this work is done, this function can be safely removed.
  overwriteShopperContextName(apis);

  // We are calling the init for children (which will call loadModel) since we can pass the updateName parameter as false (default was true).
  // We only call init(false) on shopper-context api so that our title overwrite can be reflected on the parsed api model.
  await Promise.all(
    apis.children.map(api =>
      api.name.original === 'shopper-contexts'
        ? (api as ApiModel).init(false)
        : api.init()
    )
  );

  apis = addTemplates(apis, outputDir);
  return apis;
}

/**
 * Searches for an API by name and downloads it to a folder.
 *
 * @deprecated Use `downloadLatestApis` instead.
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
  rootPath: string
): Promise<void> {
  console.warn('updateApis is deprecated. Use downloadLatestApis instead.');

  const matchedApis = await download.search(`"${name}"`, deployment);
  if (!(matchedApis?.length > 0)) {
    throw new Error(`No results in Exchange for '${name}'`);
  }
  const api = matchedApis.find(matchedApi => matchedApi?.assetId === name);
  if (!api) {
    throw new Error(`No exact match in Exchange for '${name}'`);
  }
  try {
    await download.downloadRestApis([api], rootPath);
  } catch (err: unknown) {
    if (err instanceof Error) {
      err.message = `Failed to download ${name}: ${err.message}`;
    }
    throw err;
  }
}

/**
 * Searches for an API by name and downloads it to a folder.
 *
 * NOTE: Coverage passes without this function being covered.
 *  We should have some followup to figure out how to cover it.
 *  Ive spent hours trying to mock download
 *
 * @param name - Api name to search for
 * @param rootPath - Root path to download to
 *
 * @returns a promise that we will complete
 */
export async function downloadLatestApis(
  name: string,
  rootPath: string
): Promise<void> {
  const matchedApis = await download.search(`"${name}"`);
  if (!(matchedApis?.length > 0)) {
    throw new Error(`No results in Exchange for '${name}'`);
  }
  const api = matchedApis.find(matchedApi => matchedApi?.assetId === name);
  if (!api) {
    throw new Error(`No exact match in Exchange for '${name}'`);
  }
  try {
    await download.downloadRestApis([api], rootPath);
  } catch (err: unknown) {
    if (err instanceof Error) {
      err.message = `Failed to download ${name}: ${err.message}`;
    }
    throw err;
  }
}
