/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock';
import {Response} from 'node-fetch';
import * as environment from './environment';
import ClientConfig from '../clientConfig';
import {doFetch, transferParams, ParameterKey} from './fetchHelper';

describe('doFetch', () => {
  const basePath = 'https://short_code.api.commercecloud.salesforce.com';
  const endpointPath =
    '/checkout/shopper-baskets/v1/organizations/organization_id/baskets';
  const url = `${basePath + endpointPath}?siteId=site_id`;

  const clientConfig = new ClientConfig({
    parameters: {
      shortCode: 'short_code',
      organizationId: 'organization_id',
      clientId: 'client_id',
      siteId: 'site_id',
    },
    fetchOptions: {
      cache: 'no-cache',
    },
  });

  const options = {
    method: 'POST',
    headers: {
      authorization: 'Bearer token',
    },
    body: {
      data: 'data',
    },
  };

  const responseBody = {message: 'request has matched'};

  beforeEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  test('uses headers from both clientConfig and headers object', async () => {
    const copyOptions = {
      ...options,
      headers: {
        ...options.headers,
        optionsOnlyHeader: 'optionsOnlyHeader',
        repeatHeader: 'options.headers',
      },
    };

    const copyClientConfig = {
      ...clientConfig,
      headers: {
        ...clientConfig.headers,
        clientConfigOnlyHeader: 'clientConfigOnlyHeader',
        repeatHeader: 'clientConfig.headers', // this should get overwritten
      },
    };

    const expectedHeaders = {
      authorization: 'Bearer token',
      optionsOnlyHeader: 'optionsOnlyHeader',
      clientConfigOnlyHeader: 'clientConfigOnlyHeader',
      repeatHeader: 'options.headers',
      // we should not see this header as repeatHeader in options should override this one
      // repeatHeader: 'clientConfig.headers',
    };

    nock(basePath, {
      reqheaders: expectedHeaders,
    })
      .post(endpointPath)
      .query({siteId: 'site_id'})
      .reply(200, responseBody);

    const spy = jest.spyOn(environment, 'fetch');

    const response = await doFetch(url, copyOptions, copyClientConfig);
    expect(response).toEqual(responseBody);
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({headers: expectedHeaders})
    );
  });

  test('returns raw response when rawResponse flag is passed as true', async () => {
    nock(basePath)
      .post(endpointPath)
      .query({siteId: 'site_id'})
      .reply(200, responseBody);

    const response = (await doFetch(
      url,
      options,
      clientConfig,
      true
    )) as Response;
    expect(response instanceof Response).toBe(true);

    const data = (await response.json()) as Record<string, string>;
    expect(data).toEqual(responseBody);
  });

  test('throws error when clientConfig.throwOnBadResponse is true and fetch call fails', () => {
    nock(basePath).post(endpointPath).query({siteId: 'site_id'}).reply(400);

    const copyClientConfig = {...clientConfig, throwOnBadResponse: true};
    expect(async () => {
      await doFetch(url, options, copyClientConfig);
    })
      .rejects.toThrow('400 Bad Request')
      .finally(() => 'resolve promise');
  });

  test('returns data from response when rawResponse flag is passed as false or not passed', async () => {
    nock(basePath).post(endpointPath).query(true).reply(200, responseBody);

    const data = await doFetch(url, options, clientConfig, false);
    expect(data).toEqual(responseBody);
  });

  test('passes on fetchOptions from clientConfig to fetch call', async () => {
    nock(basePath).post(endpointPath).query(true).reply(200, responseBody);

    const spy = jest.spyOn(environment, 'fetch');
    await doFetch(url, options, clientConfig, false);
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(
      expect.any(String),
      expect.objectContaining(clientConfig.fetchOptions)
    );
  });
});

describe('transferParams', () => {
  const optionParams = {
    // organizationId and siteId are not defined here
    id: 'id',
    inventoryIds: 'inventoryIds',
    expand: ['expand1', 'expand2'],
    allImages: true,
    perPricebook: true,
    select: 'select',
    currency: 'currency',
    locale: 'locale',
  };

  const configParameters = {
    shortCode: 'short_code',
    organizationId: 'organization_id',
    clientId: 'client_id',
    siteId: 'site_id',
  };

  const getProductRequired = ['organizationId', 'id'];

  const currentParamKeys: Array<ParameterKey> = [
    {
      parameterName: 'organizationId',
      isQueryParameter: false,
    },
    {
      parameterName: 'id',
      isQueryParameter: false,
    },
    {
      parameterName: 'inventoryIds',
      isQueryParameter: true,
    },
    {
      parameterName: 'expand',
      isQueryParameter: true,
    },
    {
      parameterName: 'allImages',
      isQueryParameter: true,
    },
    {
      parameterName: 'perPricebook',
      isQueryParameter: true,
    },
    {
      parameterName: 'select',
      isQueryParameter: true,
    },
    {
      parameterName: 'currency',
      isQueryParameter: true,
    },
    {
      parameterName: 'locale',
      isQueryParameter: true,
    },
    {
      parameterName: 'siteId',
      isQueryParameter: true,
    },
  ];

  test('transferParams successfully populates the query and path parameters object', () => {
    const queryParameters = {};
    const pathParameters = {};

    transferParams({
      optionParams,
      configParams: configParameters,
      queryParams: queryParameters,
      pathParams: pathParameters,
      paramKeys: currentParamKeys,
      requiredParamKeys: getProductRequired,
    });

    const expectedQueryParameters = {
      allImages: true,
      currency: 'currency',
      expand: ['expand1', 'expand2'],
      inventoryIds: 'inventoryIds',
      locale: 'locale',
      perPricebook: true,
      siteId: 'site_id',
      select: 'select',
    };

    const expectedPathParameters = {
      id: 'id',
      organizationId: 'organization_id',
    };

    expect(queryParameters).toEqual(expectedQueryParameters);
    expect(pathParameters).toEqual(expectedPathParameters);
  });

  test('transferParams throws error when required parameter is not passed', () => {
    const queryParameters = {};
    const pathParameters = {};

    // remove id from optionParams
    const {id, ...newOptionParams} = optionParams;

    expect(() =>
      transferParams({
        optionParams: newOptionParams,
        configParams: configParameters,
        queryParams: queryParameters,
        pathParams: pathParameters,
        paramKeys: currentParamKeys,
        requiredParamKeys: getProductRequired,
      })
    ).toThrowError('Missing required parameter: id');
  });
});
