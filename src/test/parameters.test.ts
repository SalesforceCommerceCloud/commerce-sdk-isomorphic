/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock';
import {ShopperCustomers} from '../lib/shopperCustomers';

const SITE_ID = 'SITE_ID';
const CLIENT_ID = 'CLIENT_ID';
const SHORT_CODE = 'SHORT_CODE';
const ORGANIZATION_ID = 'ORGANIZATION_ID';

const MOCK_RESPONSE = {mockResponse: true};

describe('Parameters', () => {
  beforeEach(() =>
    nock(`https://${SHORT_CODE}.api.commercecloud.salesforce.com`)
      .post(
        `/customer/shopper-customers/v1/organizations/${ORGANIZATION_ID}/customers/actions/login`
      )
      .query({siteId: SITE_ID, clientId: CLIENT_ID})
      .reply(200, MOCK_RESPONSE)
  );

  it('can all be specified in config (no method parameters object)', async () => {
    const customersClient = new ShopperCustomers({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
        siteId: SITE_ID,
      },
    });

    const response = await customersClient.authorizeCustomer({
      body: {type: 'guest'},
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can all be specified in config (empty method parameters object)', async () => {
    const customersClient = new ShopperCustomers({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
        siteId: SITE_ID,
      },
    });

    const response = await customersClient.authorizeCustomer({
      parameters: {},
      body: {type: 'guest'},
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can all be specified in method', async () => {
    const customersClient = new ShopperCustomers({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
      },
    });

    const response = await customersClient.authorizeCustomer({
      parameters: {
        siteId: SITE_ID,
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
      },
      body: {type: 'guest'},
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can be mixed across config and method', async () => {
    const customersClient = new ShopperCustomers({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        siteId: SITE_ID,
      },
    });

    const response = await customersClient.authorizeCustomer({
      parameters: {
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
      },
      body: {type: 'guest'},
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('can be set in method to override config', async () => {
    const customersClient = new ShopperCustomers({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
        siteId: SITE_ID,
        organizationId: 'will be replaced',
        clientId: 'this one too',
      },
    });

    const response = await customersClient.authorizeCustomer({
      parameters: {
        organizationId: ORGANIZATION_ID,
        clientId: CLIENT_ID,
      },
      body: {type: 'guest'},
    });

    expect(response).toEqual(MOCK_RESPONSE);
  });

  it('will throw if a required parameter is missing', async () => {
    nock.cleanAll(); // Not needed for this test

    const customersClient = new ShopperCustomers({
      parameters: {
        // shortCode is a base URI parameter, not path/query, so it *must* be in the config
        shortCode: SHORT_CODE,
      },
    });

    // Type assertion is used because we're violating the type to test the implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(customersClient.authorizeCustomer({} as any)).rejects.toEqual(
      new Error('Missing required path parameter: organizationId')
    );
  });
});
