/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {BaseUriParameters, PathParameters} from 'lib/helpers';
import TemplateURL from '../templateUrl';
import type {FetchOptions} from '../clientConfig';
import ResponseError from '../responseError';
import {fetch} from './environment';
import {ClientConfigInit} from '../clientConfig';

/**
 * A wrapper function around fetch designed for making requests using the SDK
 * @param url - The url of the resource that you wish to fetch
 * @param options? - An object containing any custom settings you want to apply to the request
 * @param options.method? - The request HTTP operation. The available options are: 'GET', 'POST', 'PATCH', 'PUT', and 'DELETE'. 'GET' is the default if no method is provided.
 * @param options.headers? - Headers that are added to the request. Authorization header should be in this argument or in the clientConfig.headers
 * @param options.body? - Body that is used for the request
 * @param clientConfig? - Client Configuration object used by the SDK with properties that can affect the fetch call
 * @param clientConfig.headers? - Additional headers that are added to the request. Authorization header should be in this argument or in the options?.headers. options?.headers will override any duplicate properties.
 * @param clientConfig.fetchOptions? - fetchOptions that are passed onto the fetch request
 * @param clientConfig.throwOnBadResponse? - flag that when set true will throw a response error if the fetch request fails
 * @param rawResponse? - Flag to return the raw response from the fetch call. True for raw response object, false for the data from the response
 * @returns Raw response or data from response based on rawResponse argument from fetch call
 */
export const runFetchHelper = async <Params extends BaseUriParameters>(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    headers?: {
      authorization?: string;
    } & {[key: string]: string};
    // TODO: probably need to fix this type
    body?:
      | {[key: string]: unknown}
      | URLSearchParams
      | (BodyInit & (BodyInit | null));
  },
  clientConfig?: ClientConfigInit<Params>,
  rawResponse?: boolean
): Promise<Response | unknown> => {
  const headers: Record<string, string> = {
    ...clientConfig?.headers,
    ...options?.headers,
  };

  const requestOptions: FetchOptions = {
    ...clientConfig?.fetchOptions,
    headers,
    // TODO: probably need to fix this type
    body: options?.body as unknown as FormData & URLSearchParams,
    method: options?.method ?? 'GET',
  };

  const response = await fetch(url, requestOptions);
  if (rawResponse) {
    return response;
  }
  if (
    clientConfig?.throwOnBadResponse &&
    !response.ok &&
    response.status !== 304
  ) {
    throw new ResponseError(response);
  } else {
    const text = await response.text();
    // It's ideal to get "{}" for an empty response body, but we won't throw if it's truly empty
    return (text ? JSON.parse(text) : {}) as unknown | Response;
  }
};

export interface CustomParams {
  apiName: string;
  apiVersion?: string;
  endpointPath: string;
  organizationId: string;
  shortCode: string;
  [key: string]: unknown;
}

/**
 * A helper function designed to make calls to a custom API endpoint
 * For more information about custom APIs, please refer to the [API documentation](https://developer.salesforce.com/docs/commerce/commerce-api/guide/custom-apis.html?q=custom+API)
 * @param options - An object containing any custom settings you want to apply to the request
 * @param options.method? - The request HTTP operation. The available options are: 'GET', 'POST', 'PATCH', 'PUT', and 'DELETE'. 'GET' is the default if no method is provided.
 * @param options.parameters? - Query parameters that are added to the request
 * @param options.headers? - Headers that are added to the request. Authorization header should be in this parameter or in the clientConfig.headers
 * @param options.body? - Body that is used for the request
 * @param clientConfig - Client Configuration object used by the SDK with properties that can affect the fetch call
 * @param clientConfig.parameters - Path parameters used for custom API endpoints. The required properties are: apiName, endpointPath, organizationId, and shortCode. An error will be thrown if these are not provided.
 * @param clientConfig.headers? - Additional headers that are added to the request. Authorization header should be in this argument or in the options?.headers. options?.headers will override any duplicate properties.
 * @param clientConfig.fetchOptions? - fetchOptions that are passed onto the fetch request
 * @param clientConfig.throwOnBadResponse? - flag that when set true will throw a response error if the fetch request fails
 * @param rawResponse? - Flag to return the raw response from the fetch call. True for raw response object, false for the data from the response
 * @returns Raw response or data from response based on rawResponse argument from fetch call
 */
export const callCustomEndpoint = async (
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    parameters?: {
      [key: string]: string | number | boolean | string[] | number[];
    };
    headers?: {
      authorization?: string;
    } & {[key: string]: string};
    // TODO: probably need to fix this type
    body?:
      | {[key: string]: unknown}
      | URLSearchParams
      | (BodyInit & (BodyInit | null));
  },
  clientConfig: ClientConfigInit<CustomParams>,
  rawResponse?: boolean
): Promise<Response | unknown> => {
  const requiredArgs = [
    'apiName',
    'endpointPath',
    'organizationId',
    'shortCode',
  ];
  requiredArgs.forEach(arg => {
    if (!clientConfig.parameters[arg]) {
      throw new Error(
        `Missing required property in clientConfig.parameters: ${arg}`
      );
    }
  });

  const clientConfigCopy: ClientConfigInit<CustomParams> = {
    ...clientConfig,
    baseUri:
      'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}',
  };

  if (!clientConfigCopy.parameters?.apiVersion) {
    clientConfigCopy.parameters.apiVersion = 'v1';
  }

  const url = new TemplateURL(
    '/organizations/{organizationId}/{endpointPath}',
    clientConfigCopy.baseUri as string,
    {
      pathParams: clientConfigCopy.parameters as unknown as PathParameters,
      queryParams: options.parameters,
      origin: clientConfig.proxy,
    }
  );

  return runFetchHelper(url.toString(), options, clientConfigCopy, rawResponse);
};
