/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock';
import {FetchOptions} from '../static/clientConfig';
import {ClientConfigInit, ShopperCustomers, ShopperSearch} from '../lib';
import config from '../environment/config';

type TestConfigParameters = typeof config.parameters;

/**
 * Validation of integration and use of cross-fetch when run in a node environment.
 * As these tests want to ensure the correct integration of cross-fetch, responses are mocked
 * out at the http layer via nock.
 * Both POST and GET are exercised to ensure compatibility.
 */

const customerClient = new ShopperCustomers(config);
const searchClient = new ShopperSearch(config);

beforeEach(() => nock.cleanAll());

test('test getting a token with a post operation', async () => {
  nock('https://localhost:3000')
    .post(
      `/customer/shopper-customers/v1/organizations/${config.parameters.organizationId}/customers/actions/login`
    )
    .query({
      siteId: config.parameters.siteId,
      clientId: config.parameters.clientId,
    })
    .reply(
      200,
      {
        authType: 'guest',
        customerId: 'test-customer-id',
        preferredLocale: 'en_US',
      },
      {Authorization: 'Bearer test-auth'}
    );

  //  Start by requesting an authorization
  const authResponse = await customerClient.authorizeCustomer(
    {body: {type: 'guest'}},
    true
  );
  // Get the authorization token and validate it is correct
  const token = authResponse.headers.get('authorization');
  expect(token).toEqual('Bearer test-auth');
});

test('test getting a token without a proxy', async () => {
  nock('https://short_code.api.commercecloud.salesforce.com')
    .post(
      `/customer/shopper-customers/v1/organizations/${config.parameters.organizationId}/customers/actions/login`
    )
    .query({
      siteId: config.parameters.siteId,
      clientId: config.parameters.clientId,
    })
    .reply(
      200,
      {
        authType: 'guest',
        customerId: 'test-customer-id',
        preferredLocale: 'en_US',
      },
      {Authorization: 'Bearer test-auth'}
    );

  const proxylessConfig: ClientConfigInit<TestConfigParameters> = {...config};
  delete proxylessConfig.proxy;
  const client = new ShopperCustomers(proxylessConfig);

  //  Start by requesting an authorization
  const authResponse = await client.authorizeCustomer(
    {body: {type: 'guest'}},
    true
  );
  // Get the authorization token and validate it is correct
  const token = authResponse.headers.get('authorization');
  expect(token).toEqual('Bearer test-auth');
});

test('test getting a token with an invalid short code', async () => {
  nock('https://invalid-short-code.api.commercecloud.salesforce.com')
    .post(
      `/customer/shopper-customers/v1/organizations/${config.parameters.organizationId}/customers/actions/login`
    )
    .query({
      siteId: config.parameters.siteId,
      clientId: config.parameters.clientId,
    })
    .replyWithError('ENOTFOUND-TEST');

  const proxylessConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    parameters: {
      ...config.parameters,
      shortCode: 'invalid-short-code',
    },
  };
  delete proxylessConfig.proxy;
  const client = new ShopperCustomers(proxylessConfig);

  await expect(
    client.authorizeCustomer({body: {type: 'guest'}}, true)
  ).rejects.toEqual({
    // Did this test fail? It's stable for a build, but flaky across builds. Try swapping which
    // `message` line is commented out. The order of the query parameters gets swapped.
    // TODO: Either stop this from happening or just change the assertion to be more flexible.
    // message: 'request to https://invalid-short-code.api.commercecloud.salesforce.com/customer/shopper-customers/v1/organizations/ORGANIZATION_ID/customers/actions/login?siteId=SITE_ID&clientId=CLIENT_ID failed, reason: ENOTFOUND-TEST',
    message:
      'request to https://invalid-short-code.api.commercecloud.salesforce.com/customer/shopper-customers/v1/organizations/ORGANIZATION_ID/customers/actions/login?clientId=CLIENT_ID&siteId=SITE_ID failed, reason: ENOTFOUND-TEST',
    type: 'system',
  });
});

test('performing a search with a get operation', async () => {
  // Specific response to be returned by search
  const mockSearchResponse = {
    limit: 1,
    hits: [
      {
        currency: 'USD',
        hitType: 'bundle',
        image: {
          alt: 'Playstation 3 Bundle, , large',
          disBaseLink:
            'https://localhost/on/demandware.static/-/Sites-electronics-m-catalog/default/dw794b23a6/images/large/sony-ps3-bundle.jpg',
          link: 'https://localhost/on/demandware.static/-/Sites-electronics-m-catalog/default/dw794b23a6/images/large/sony-ps3-bundle.jpg',
          title: 'Playstation 3 Bundle, ',
        },
        orderable: true,
        price: 449.0,
        productId: 'sony-ps3-bundleM',
        productName: 'Playstation 3 Bundle',
        productType: {
          bundle: true,
          option: true,
        },
        representedProduct: {
          id: 'sony-ps3-consoleM',
        },
        representedProducts: [
          {
            id: 'sony-ps3-consoleM',
          },
        ],
      },
    ],
    query: 'sony',
    offset: 0,
    total: 27,
  };

  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(200, mockSearchResponse, {
      'content-type': 'application-json charset=UTF-8',
    });

  const searchResponse = await searchClient.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  expect(searchResponse).toEqual(mockSearchResponse);
});

test('should use timeout from fetch options and throw timeout error', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .delayConnection(400)
    .reply(200, {}, {'content-type': 'application-json charset=UTF-8'});

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    fetchOptions: {
      timeout: 200,
    },
  };

  expect.assertions(1);
  const client = new ShopperSearch(clientConfig);
  await expect(
    client.productSearch({
      parameters: {q: 'sony'},
      headers: {authorization: 'Bearer test-auth'},
    })
  ).rejects.toEqual({
    message:
      'network timeout at: https://localhost:3000/search/shopper-search/v1/organizations/ORGANIZATION_ID/product-search?siteId=SITE_ID&q=sony',
    type: 'request-timeout',
  });
});

test('should use timeout from fetch options and succeed when service responds quicker', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(200, {}, {'content-type': 'application-json charset=UTF-8'});

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    fetchOptions: {
      timeout: 1000,
    },
  };

  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });
  expect(response).toEqual({});
});

test('should use default value when timeout is not configured in fetch options and succeed', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .delayConnection(400)
    .reply(200, {}, {'content-type': 'application-json charset=UTF-8'});

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    fetchOptions: {},
  };

  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });
  expect(response).toEqual({});
});

test('should not fail when arbitrary parameters are configured in fetchOptions', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(200, {}, {'content-type': 'application-json charset=UTF-8'});

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    fetchOptions: {
      somekey: 'some value',
      timeout: 1000,
    } as FetchOptions, // Type assertion required because we are deliberately violating the type
  };

  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });
  expect(response).toEqual({});
});

test('throws on error responses', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(
      400,
      {content: 'not empty'},
      {'content-type': 'application-json charset=UTF-8'}
    );

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    throwOnBadResponse: true,
  };
  const client = new ShopperSearch(clientConfig);
  const responsePromise = client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  await expect(responsePromise).rejects.toEqual(
    new Error('Error 400: Bad Request')
  );
});

test('do not throw in 200 response', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(
      200,
      {content: 'not empty'},
      {'content-type': 'application-json charset=UTF-8'}
    );

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    throwOnBadResponse: true,
  };
  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch<boolean>({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  expect(response).toEqual({content: 'not empty'});
});

test('do not throw in 2xx response', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(
      212,
      {content: 'not empty'},
      {'content-type': 'application-json charset=UTF-8'}
    );

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    throwOnBadResponse: true,
  };
  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  expect(response).toEqual({content: 'not empty'});
});

test('do not throw in 304 response', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(
      304,
      {content: 'not empty'},
      {'content-type': 'application-json charset=UTF-8'}
    );

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    throwOnBadResponse: true,
  };
  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  expect(response).toEqual({content: 'not empty'});
});

test('do not throw in empty body', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(200);

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    throwOnBadResponse: true,
  };
  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  expect(response).toEqual({});
});

test('handle void methods', async () => {
  nock('https://localhost:3000')
    .post(
      `/customer/shopper-customers/v1/organizations/${config.parameters.organizationId}/customers/password/actions/reset`
    )
    .query({
      siteId: config.parameters.siteId,
    })
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(204);

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    throwOnBadResponse: true,
  };
  const client = new ShopperCustomers(clientConfig);
  const response = await client.resetPassword({
    headers: {
      authorization: 'Bearer test-auth',
    },
    body: {
      resetToken: 'R1e2s3e4t5T6o7k8e9n0',
      login: 'janedoe@test.com',
      newPassword: 'p@assword2',
    },
  });
  expect(response).toBeUndefined();
});

test('throwOnBadResponse flag does not throw if false', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(
      400,
      {content: 'not empty'},
      {'content-type': 'application-json charset=UTF-8'}
    );

  const clientConfig: ClientConfigInit<TestConfigParameters> = {
    ...config,
    throwOnBadResponse: false,
  };
  const client = new ShopperSearch(clientConfig);
  const response = await client.productSearch<boolean>({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  expect(response).toEqual({content: 'not empty'});
});

test('throwOnBadResponse flag defaults to false', async () => {
  nock('https://localhost:3000')
    .get(
      `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
    )
    .matchHeader('authorization', 'Bearer test-auth')
    .reply(
      400,
      {content: 'not empty'},
      {'content-type': 'application-json charset=UTF-8'}
    );

  const client = new ShopperSearch({...config});
  const response = await client.productSearch({
    parameters: {q: 'sony'},
    headers: {authorization: 'Bearer test-auth'},
  });

  expect(response).toEqual({content: 'not empty'});
});
