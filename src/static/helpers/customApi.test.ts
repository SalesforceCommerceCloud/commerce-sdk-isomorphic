/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock';
import {callCustomEndpoint} from './customApi';
import * as fetchHelper from './fetchHelper';
import ClientConfig from '../clientConfig';
import {CustomParams} from '../../lib/helpers';

describe('callCustomEndpoint', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  const clientConfigParameters: CustomParams = {
    shortCode: 'short_code',
    organizationId: 'organization_id',
    clientId: 'client_id',
    siteId: 'site_id',
    apiName: 'api_name',
    apiVersion: 'v2',
    endpointPath: 'endpoint_path',
  };

  const options = {
    method: 'POST',
    parameters: {
      queryParam1: 'query parameter 1',
      queryParam2: 'query parameter 2',
    },
    headers: {
      authorization: 'Bearer token',
    },
    body: {
      data: 'data',
    },
  };

  test('throws an error when required path parameters are not passed', () => {
    // separate apiName using spread since we can't use 'delete' operator as it isn't marked as optional
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {apiName, ...copyClientConfigParams} = clientConfigParameters;

    const clientConfig = new ClientConfig({
      parameters: copyClientConfigParams,
    });

    expect(async () => {
      // eslint-disable-next-line
      // @ts-ignore <-- we know it'll complain since we removed apiName
      await callCustomEndpoint(options, clientConfig);
    })
      .rejects.toThrow(
        'Missing required property in clientConfig.parameters: apiName'
      )
      .finally(() => 'resolve promise');
  });

  test('sets api version to "v1" if not provided', async () => {
    const copyClientConfigParams = {...clientConfigParameters};
    delete copyClientConfigParams.apiVersion;

    const clientConfig = new ClientConfig({
      parameters: copyClientConfigParams,
    });

    const {shortCode, apiName, organizationId, endpointPath} =
      clientConfig.parameters;

    const nockBasePath = `https://${shortCode}.api.commercecloud.salesforce.com`;
    const nockEndpointPath = `/custom/${apiName}/v1/organizations/${organizationId}/${endpointPath}`;
    nock(nockBasePath).post(nockEndpointPath).query(true).reply(200);

    const expectedUrl = `${
      nockBasePath + nockEndpointPath
    }?queryParam1=query+parameter+1&queryParam2=query+parameter+2`;
    const doFetchSpy = jest.spyOn(fetchHelper, 'doFetch');

    const response = (await callCustomEndpoint(
      options,
      clientConfig,
      true
    )) as Response;

    expect(response.status).toBe(200);
    expect(doFetchSpy).toBeCalledTimes(1);
    expect(doFetchSpy).toBeCalledWith(
      expectedUrl,
      options,
      expect.anything(),
      true
    );
    expect(expectedUrl).toContain('/v1/');
  });

  test('doFetch is called with the correct arguments', async () => {
    const clientConfig = new ClientConfig({
      parameters: clientConfigParameters,
    });

    const {shortCode, apiName, organizationId, endpointPath} =
      clientConfig.parameters;

    const nockBasePath = `https://${shortCode}.api.commercecloud.salesforce.com`;
    const nockEndpointPath = `/custom/${apiName}/v2/organizations/${organizationId}/${endpointPath}`;
    nock(nockBasePath).post(nockEndpointPath).query(true).reply(200);

    const expectedUrl = `${
      nockBasePath + nockEndpointPath
    }?queryParam1=query+parameter+1&queryParam2=query+parameter+2`;
    const expectedClientConfig = {
      ...clientConfig,
      baseUri:
        'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}',
    };

    const doFetchSpy = jest.spyOn(fetchHelper, 'doFetch');
    await callCustomEndpoint(options, clientConfig, true);
    expect(doFetchSpy).toBeCalledTimes(1);
    expect(doFetchSpy).toBeCalledWith(
      expectedUrl,
      options,
      expectedClientConfig,
      true
    );
  });
});
