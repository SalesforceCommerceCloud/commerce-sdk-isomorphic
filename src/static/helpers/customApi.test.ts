/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock';
import {callCustomEndpoint, CustomParams} from './customApi';
import * as fetchHelper from './fetchHelper';
import ClientConfig from '../clientConfig';

describe('callCustomEndpoint', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  const clientConfig = new ClientConfig<CustomParams>({
    parameters: {
      shortCode: 'short_code',
      organizationId: 'organization_id',
      clientId: 'client_id',
      siteId: 'site_id',
    },
  });

  const options = {
    method: 'POST',
    parameters: {
      queryParam1: 'query parameter 1',
      queryParam2: 'query parameter 2',
    },
    customApiPathParameters: {
      apiName: 'api_name',
      apiVersion: 'v2',
      endpointPath: 'endpoint_path',
    },
    headers: {
      authorization: 'Bearer token',
    },
    body: {
      data: 'data',
    },
  };

  test('throws an error when required path parameters are not passed', () => {
    const copyOptions = {
      ...options,
      // omit endpointPath
      customApiPathParameters: {
        apiName: 'api_name',
      },
    };

    expect(async () => {
      // eslint-disable-next-line
      // @ts-ignore <-- we know it'll complain since we removed endpointPath
      await callCustomEndpoint({options: copyOptions, clientConfig});
    })
      .rejects.toThrow(
        'Missing required property needed in args.options.customApiPathParameters or args.clientConfig.parameters: endpointPath'
      )
      .finally(() => 'resolve promise');
  });

  test('sets api version to "v1" if not provided', async () => {
    const copyOptions = {
      ...options,
      // omit apiVersion
      customApiPathParameters: {
        endpointPath: 'endpoint_path',
        apiName: 'api_name',
      },
    };

    const {shortCode, organizationId} = clientConfig.parameters;
    const {apiName, endpointPath} = copyOptions.customApiPathParameters;

    const nockBasePath = `https://${shortCode}.api.commercecloud.salesforce.com`;
    const nockEndpointPath = `/custom/${apiName}/v1/organizations/${
      organizationId as string
    }/${endpointPath}`;
    nock(nockBasePath).post(nockEndpointPath).query(true).reply(200);

    const expectedUrl = `${
      nockBasePath + nockEndpointPath
    }?queryParam1=query+parameter+1&queryParam2=query+parameter+2`;
    const doFetchSpy = jest.spyOn(fetchHelper, 'doFetch');

    const response = (await callCustomEndpoint({
      options: copyOptions,
      clientConfig,
      rawResponse: true,
    })) as Response;

    expect(response.status).toBe(200);
    expect(doFetchSpy).toBeCalledTimes(1);
    expect(doFetchSpy).toBeCalledWith(
      expectedUrl,
      copyOptions,
      expect.anything(),
      true
    );
    expect(expectedUrl).toContain('/v1/');
  });

  test('doFetch is called with the correct arguments', async () => {
    const {shortCode, organizationId} = clientConfig.parameters;
    const {apiName, endpointPath} = options.customApiPathParameters;

    const nockBasePath = `https://${shortCode}.api.commercecloud.salesforce.com`;
    const nockEndpointPath = `/custom/${apiName}/v2/organizations/${
      organizationId as string
    }/${endpointPath}`;
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
    await callCustomEndpoint({options, clientConfig, rawResponse: true});
    expect(doFetchSpy).toBeCalledTimes(1);
    expect(doFetchSpy).toBeCalledWith(
      expectedUrl,
      options,
      expectedClientConfig,
      true
    );
  });

  test('uses path params from options and clientConfig, prioritizing options', async () => {
    const copyClientConfig = {
      ...clientConfig,
      // Only shortCode will be used
      parameters: {
        endpointPath: 'clientConfig_endpoint_path',
        apiName: 'clientConfig_api_name',
        shortCode: 'clientconfig_shortcode',
        apiVersion: 'v2',
        organizationId: 'clientConfig_organizationId',
      },
    };

    const copyOptions = {
      ...options,
      // these parameters will be prioritzed
      customApiPathParameters: {
        endpointPath: 'customApiPathParameters_endpoint_path',
        apiName: 'customApiPathParameters_api_name',
        apiVersion: 'v3',
        organizationId: 'customApiPathParameters_organizationId',
      },
    };

    // nock interception should be using custom API path parameters from options
    const {apiName, endpointPath, organizationId, apiVersion} =
      copyOptions.customApiPathParameters;
    // except shortcode since we didn't implement it in copyOptions.customApiPathParameters
    const {shortCode} = copyClientConfig.parameters;

    const nockBasePath = `https://${shortCode}.api.commercecloud.salesforce.com`;
    const nockEndpointPath = `/custom/${apiName}/${apiVersion}/organizations/${organizationId}/${endpointPath}`;
    nock(nockBasePath).post(nockEndpointPath).query(true).reply(200);

    // expected URL is a mix of both params
    const expectedUrl = `${
      nockBasePath + nockEndpointPath
    }?queryParam1=query+parameter+1&queryParam2=query+parameter+2`;

    const doFetchSpy = jest.spyOn(fetchHelper, 'doFetch');
    await callCustomEndpoint({
      options: copyOptions,
      clientConfig: copyClientConfig,
    });
    expect(doFetchSpy).toBeCalledTimes(1);
    expect(doFetchSpy).toBeCalledWith(
      expectedUrl,
      expect.anything(),
      expect.anything(),
      undefined
    );
  });
});
