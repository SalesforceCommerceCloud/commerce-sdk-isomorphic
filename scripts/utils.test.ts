/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {download, generate} from '@commerce-apps/raml-toolkit';
import {
  registerHelpers,
  registerPartials,
  setupApis,
  updateApis,
} from './utils';

const Handlebars = generate.HandlebarsWithAmfHelpers;
const API_DIRECTORY = `${__dirname}/../apis`;
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const pkg: {version: string} = require('../package.json');

describe('registerHelper', () => {
  it('registers our custom helpers', () => {
    expect(Object.keys(Handlebars.helpers)).not.toEqual(
      expect.arrayContaining(['addNamespace', 'formatForTsDoc'])
    );

    registerHelpers();

    expect(Object.keys(Handlebars.helpers)).toEqual(
      expect.arrayContaining(['addNamespace', 'formatForTsDoc'])
    );
  });
});

describe('registerPartials', () => {
  it('registers our partials', () => {
    expect(Object.keys(Handlebars.partials)).not.toEqual(
      expect.arrayContaining(['dtoPartial', 'operationsPartial'])
    );

    registerPartials();

    expect(Object.keys(Handlebars.partials)).toEqual(
      expect.arrayContaining(['dtoPartial', 'operationsPartial'])
    );
  });
});

describe('setupApis', () => {
  it('loads our API modes', async () => {
    // Don't need to perform the init, and doing so will cause timeout.
    jest.spyOn(generate.ApiMetadata.prototype, 'init').mockResolvedValue();

    const apis = await setupApis(
      API_DIRECTORY,
      `${__dirname}/../renderedTemplates`
    );

    expect(apis.name.original).toEqual('apis');
    expect(apis.metadata.sdkVersion).toContain(pkg.version);
    const children = apis.children.map(child => child.name.original);
    expect(children).toEqual(
      expect.arrayContaining([
        'shopper-baskets',
        'shopper-customers',
        'shopper-products',
        'shopper-search',
      ])
    );
  });
});

describe('test updateApis script', () => {
  it('throws error when no results', async () => {
    await expect(
      updateApis('noResults', /production/i, '/tmp')
    ).rejects.toThrow("No results in Exchange for 'noResults'");
  });

  it('throws error when no exact match', async () => {
    await expect(updateApis('noMatch', /production/i, '/tmp')).rejects.toThrow(
      "No exact match in Exchange for 'noMatch'"
    );
  });

  it('downloads when exact match', async () => {
    await expect(
      updateApis('shopper-customers', /production/i, '/tmp')
    ).resolves.toBeUndefined();
  });

  it('throws error when download fails', async () => {
    jest
      .spyOn(download, 'downloadRestApis')
      .mockRejectedValue(new Error('It failed.'));
    await expect(
      updateApis('shopper-customers', /production/i, '/tmp')
    ).rejects.toThrow('Failed to download shopper-customers: It failed.');
  });
});
