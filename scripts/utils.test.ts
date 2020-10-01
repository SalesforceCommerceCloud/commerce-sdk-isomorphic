/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { registerHelpers, registerPartials, setupApis, updateApis } from "./utils";

import { generate } from "@commerce-apps/raml-toolkit";

const Handlebars = generate.HandlebarsWithAmfHelpers;
const API_DIRECTORY = `${__dirname}/../apis`;

describe("registerHelper", () => {
  it("registers our custom helpers", () => {
    expect(Object.keys(Handlebars.helpers)).not.toEqual(
      expect.arrayContaining([
        "addNamespace",
        "getObjectIdByAssetId",
        "formatForTsDoc",
        "isCommonPathParameter",
        "isCommonQueryParameter",
      ])
    );

    registerHelpers();

    expect(Object.keys(Handlebars.helpers)).toEqual(
      expect.arrayContaining([
        "addNamespace",
        "getObjectIdByAssetId",
        "formatForTsDoc",
        "isCommonPathParameter",
        "isCommonQueryParameter",
      ])
    );
  });
});

describe("registerPartials", () => {
  it("registers our partials", () => {
    expect(Object.keys(Handlebars.partials)).not.toEqual(
      expect.arrayContaining([
        "dtoPartial",
        "operationsPartial",
      ])
    );

    registerPartials();

    expect(Object.keys(Handlebars.partials)).toEqual(
      expect.arrayContaining([
        "dtoPartial",
        "operationsPartial",
      ])
    );
  });
});

describe("setupApis", () => {
  it("loads our API modes", async function () {
    // Don't need to perform the init, and doing so will cause timeout.
    jest.spyOn(generate.ApiMetadata.prototype, 'init').mockResolvedValue();

    const apis = await setupApis(
      API_DIRECTORY,
      `${__dirname}/../renderedTemplates`
    );

    expect(apis.name.original).toEqual('apis');
    const children = apis.children.map((child) => child.name.original);
    expect(children).toEqual(
      expect.arrayContaining([
        "pricing",
        "customer",
        "checkout",
        "search",
        "product"
      ])
    );
  });
});

describe("test updateApis script", () => {
  it("throws error when no results", async function () {
    await expect(updateApis('noResults', /production/i, '/tmp'))
      .rejects.toThrow("No results in Exchange for 'noResults'");
  });

  it("throws error when no exact match", async function () {
    await expect(updateApis('noMatch', /production/i, '/tmp'))
      .rejects.toThrow("No exact match in Exchange for 'noMatch'");
  });

  it("downloads when exact match", async function () {
    return await expect(updateApis('shopper-customers', /production/i, '/tmp'))
      .resolves.toBeUndefined();
  });
});