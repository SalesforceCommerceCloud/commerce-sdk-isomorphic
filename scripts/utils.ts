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
 * @param rootPath - Root path to download to
 *
 * @returns a promise that we will complete
 */
export async function downloadLatestApis(rootPath: string): Promise<void> {
  const searchQuery =
    'category:Visibility = "External" category:"SDK Type" = "Commerce" category:"SDK Type" = "Isomorphic"';
  const matchedApis = await download.search(searchQuery, undefined, true);
  if (!(matchedApis?.length > 0)) {
    throw new Error(`No results in Exchange for '${searchQuery}'`);
  }
  try {
    await download.downloadRestApis(matchedApis, rootPath, true);
  } catch (err: unknown) {
    if (err instanceof Error) {
      err.message = `Failed to download API specs: ${err.message}`;
    }
    throw err;
  }
}
