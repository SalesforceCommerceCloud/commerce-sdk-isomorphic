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
import {runFetchHelper} from './fetchHelper';

describe('runFetchHelper', () => {
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
    headers: {
      clientConfigHeader: 'clientConfigHeader',
      repeatHeader: 'clientConfig.headers',
    },
    fetchOptions: {
      cache: 'no-cache',
    },
  });

  const options = {
    method: 'POST',
    headers: {
      authorization: 'Bearer token',
      repeatHeader: 'options.headers',
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
    nock(basePath, {
      reqheaders: {
        authorization: 'Bearer token',
        repeatHeader: 'options.headers', // options header takes priority
        clientConfigHeader: 'clientConfigHeader',
      },
    })
      .post(endpointPath)
      .query({siteId: 'site_id'})
      .reply(200, responseBody);

    const response = await runFetchHelper(url, options, clientConfig);
    expect(response).toEqual(responseBody);
  });

  test('returns raw response when rawResponse flag is passed as true', async () => {
    nock(basePath)
      .post(endpointPath)
      .query({siteId: 'site_id'})
      .reply(200, responseBody);

    const response = (await runFetchHelper(
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
      await runFetchHelper(url, options, copyClientConfig);
    })
      .rejects.toThrow('400 Bad Request')
      .finally(() => 'resolve promise');
  });

  test('returns data from response when rawResponse flag is passed as false or not passed', async () => {
    nock(basePath).post(endpointPath).query(true).reply(200, responseBody);

    const data = await runFetchHelper(url, options, clientConfig, false);
    expect(data).toEqual(responseBody);
  });

  test('passes on fetchOptions from clientConfig to fetch call', async () => {
    nock(basePath).post(endpointPath).query(true).reply(200, responseBody);

    const spy = jest.spyOn(environment, 'fetch');
    await runFetchHelper(url, options, clientConfig, false);
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(
      expect.any(String),
      expect.objectContaining(clientConfig.fetchOptions)
    );
  });
});
