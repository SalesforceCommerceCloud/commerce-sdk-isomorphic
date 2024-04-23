/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {BodyInit} from 'node-fetch';
import {PathParameters} from './types';
import {doFetch} from './fetchHelper';
import TemplateURL from '../templateUrl';
import {ClientConfigInit} from '../clientConfig';

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
 * @param options.method? - The request HTTP operation. 'GET' is the default if no method is provided.
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
    method?: string;
    parameters?: {
      [key: string]: string | number | boolean | string[] | number[];
    };
    headers?: {
      authorization?: string;
    } & {[key: string]: string};
    // TODO: probably need to fix this type
    body?: BodyInit | unknown;
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

  return doFetch(url.toString(), options, clientConfigCopy, rawResponse);
};
