/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable import/prefer-default-export */
import {download} from '@commerce-apps/raml-toolkit';

// TODO - THIS IS THE OLD WORKAROUND FOR THE SHOPPER CONTEXT API MODEL NAME CLASH
// DO WE STILL WANT THIS FOR THE OAS GENERATED SDK?

// Editing the name of the Shopper Context API Model so our name is used for generating class name.
// This is hard-coded for now but in the future if we handle the case where type name and title clash better, this can be removed.
// function overwriteShopperContextName(apis: ApiMetadata): void {
//   const shopperContextApi = apis.children.find(
//     api => api.name.original === 'shopper-context'
//   );

//   if (shopperContextApi) {
//     shopperContextApi.name = new Name('shopper-contexts');
//   }
// }

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
  rootPath: string,
  isOAS = false
): Promise<void> {
  const matchedApis = await download.search(`"${name}"`);
  if (!(matchedApis?.length > 0)) {
    throw new Error(`No results in Exchange for '${name}'`);
  }
  const api = matchedApis.find(
    (matchedApi: {assetId: string}) => matchedApi?.assetId === name
  );
  if (!api) {
    throw new Error(`No exact match in Exchange for '${name}'`);
  }
  try {
    await download.downloadRestApis([api], rootPath, isOAS);
  } catch (err: unknown) {
    if (err instanceof Error) {
      err.message = `Failed to download ${name}: ${err.message}`;
    }
    throw err;
  }
}
