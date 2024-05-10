/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock';
import {ShopperSearch} from '../lib/shopperSearch';

const SITE_ID = 'SITE_ID';
const CLIENT_ID = 'CLIENT_ID';
const SHORT_CODE = 'SHORT_CODE';
const ORGANIZATION_ID = 'ORGANIZATION_ID';

const MOCK_RESPONSE = {mockResponse: true};

describe('Parameters', () => {
  beforeEach(() =>
    nock(`https://${SHORT_CODE}.api.commercecloud.salesforce.com`)
      .get(
        `/search/shopper-search/v1/organizations/${ORGANIZATION_ID}/product-search`
      )
      .query({siteId: SITE_ID})
      .reply(200, MOCK_RESPONSE)
  );

  it('can all be specified in config (no method parameters object)', async () => {
    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
        siteId: SITE_ID,
      },
    });

    const response = await searchClient.productSearch();

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can all be specified in config (empty method parameters object)', async () => {
    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
        siteId: SITE_ID,
      },
    });

    const response = await searchClient.productSearch({
      parameters: {},
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can all be specified in method', async () => {
    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        // clientId is not a valid path/query parameter for the API, so we'll keep it in the config
        clientId: CLIENT_ID,
      },
    });

    const response = await searchClient.productSearch({
      parameters: {
        siteId: SITE_ID,
        organizationId: ORGANIZATION_ID,
      },
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can be mixed across config and method', async () => {
    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        // clientId is not a valid path/query parameter for the API, so we'll keep it in the config
        clientId: CLIENT_ID,
        siteId: SITE_ID,
      },
    });

    const response = await searchClient.productSearch({
      parameters: {
        organizationId: ORGANIZATION_ID,
      },
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can be set in method to override config', async () => {
    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        // clientId is not a valid path/query parameter for the API, so we'll keep it in the config
        clientId: CLIENT_ID,
        siteId: 'this one too',
        organizationId: 'will be replaced',
      },
    });

    const response = await searchClient.productSearch({
      parameters: {
        organizationId: ORGANIZATION_ID,
        siteId: SITE_ID,
      },
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('will throw if a required parameter is missing', async () => {
    nock.cleanAll(); // Not needed for this test

    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
      },
    });

    // Type assertion is used because we're violating the type to test the implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(searchClient.productSearch({} as any)).rejects.toEqual(
      new Error('Missing required path parameter: organizationId')
    );
  });

  it('allow custom query params', async () => {
    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
        siteId: SITE_ID,
      },
    });

    const options = {
      parameters: {
        c_validCustomParam: 'custom_param',
      },
      body: {type: 'guest'},
    };

    nock(`https://${SHORT_CODE}.api.commercecloud.salesforce.com`)
      .get(
        `/search/shopper-search/v1/organizations/${ORGANIZATION_ID}/product-search`
      )
      .query({
        siteId: SITE_ID,
        c_validCustomParam: 'custom_param',
      })
      .reply(200, MOCK_RESPONSE);

    const response = await searchClient.productSearch(options);

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('warns user when an invalid parameter is passed', async () => {
    const searchClient = new ShopperSearch({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
        siteId: SITE_ID,
      },
    });

    const options = {
      parameters: {
        invalidParameter: 'this should prompt a warning',
      },
      body: {type: 'guest'},
    };

    const warnSpy = jest.spyOn(console, 'warn');
    const response = await searchClient.productSearch(options);

    expect(response).toEqual(MOCK_RESPONSE);
    expect(warnSpy).toHaveBeenCalledWith(
      'Invalid Parameter for productSearch: invalidParameter'
    );
  });
});
