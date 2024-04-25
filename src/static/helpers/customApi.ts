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
  apiName?: string;
  apiVersion?: string;
  endpointPath?: string;
  organizationId?: string;
  shortCode: string;
  [key: string]: unknown;
}

/**
 * A helper function designed to make calls to a custom API endpoint
 * For more information about custom APIs, please refer to the [API documentation](https://developer.salesforce.com/docs/commerce/commerce-api/guide/custom-apis.html)
 * @param args - Argument object containing data used for custom API request
 * @param args.options - An object containing any custom settings you want to apply to the request
 * @param args.options.method? - The request HTTP operation. 'GET' is the default if no method is provided.
 * @param args.options.parameters? - Query parameters that are added to the request
 * @param args.options.customApiPathParameters? - Path parameters used for custom API. Required path parameters (apiName, endpointPath, organizationId, and shortCode) can be in this object, or args.clientConfig.parameters. apiVersion is defaulted to 'v1' if not provided.
 * @param args.options.headers? - Headers that are added to the request. Authorization header should be in this parameter or in the clientConfig.headers. If "Content-Type" is not provided, it will be defaulted to "application/json".
 * @param args.options.body? - Body that is used for the request
 * @param args.clientConfig - Client Configuration object used by the SDK with properties that can affect the fetch call
 * @param args.clientConfig.parameters - Path parameters used for custom API endpoints. The required properties are: apiName, endpointPath, organizationId, and shortCode. An error will be thrown if these are not provided.
 * @param args.clientConfig.headers? - Additional headers that are added to the request. Authorization header should be in this argument or in the options?.headers. options?.headers will override any duplicate properties.
 * @param args.clientConfig.baseUri? - baseUri used for the request, where the path parameters are wrapped in curly braces. Default value is 'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}'
 * @param args.clientConfig.fetchOptions? - fetchOptions that are passed onto the fetch request
 * @param args.clientConfig.throwOnBadResponse? - flag that when set true will throw a response error if the fetch request fails (returns with a status code outside the range of 200-299 or 304 redirect)
 * @param args.clientConfig.proxy? - Routes API calls through a proxy when set
 * @param args.rawResponse? - Flag to return the raw response from the fetch call. True for raw response object, false for the data from the response
 * @returns Raw response or data from response based on rawResponse argument from fetch call
 */
export const callCustomEndpoint = async (args: {
  options: {
    method?: string;
    parameters?: {
      [key: string]: string | number | boolean | string[] | number[];
    };
    customApiPathParameters?: {
      apiName?: string;
      apiVersion?: string;
      endpointPath?: string;
      organizationId?: string;
      shortCode?: string;
    };
    headers?: {
      authorization?: string;
    } & {[key: string]: string};
    body?: BodyInit | globalThis.BodyInit | unknown;
  };
  clientConfig: ClientConfigInit<CustomParams>;
  rawResponse?: boolean;
}): Promise<Response | unknown> => {
  const {options, clientConfig, rawResponse} = args;

  const requiredArgs = [
    'apiName',
    'endpointPath',
    'organizationId',
    'shortCode',
  ];

  const pathParams: Record<string, unknown> = {
    ...clientConfig.parameters,
    ...options?.customApiPathParameters,
  };

  requiredArgs.forEach(arg => {
    if (!pathParams[arg]) {
      throw new Error(
        `Missing required property needed in options.customApiPathParameters or clientConfig.parameters: ${arg}`
      );
    }
  });

  if (!pathParams.apiVersion) {
    pathParams.apiVersion = 'v1';
  }

  const defaultBaseUri =
    'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}';

  let clientConfigCopy = clientConfig;
  if (!clientConfig.baseUri) {
    clientConfigCopy = {
      ...clientConfig,
      baseUri: defaultBaseUri,
    };
  }

  let contentTypeKey;
  let optionsCopy = options;

  // Look for Content-Type header
  if (options.headers) {
    contentTypeKey = Object.keys(options.headers).find(
      key => key.toLowerCase() === 'content-type'
    );
  }

  // If Content-Type header does not exist, we default to "Content-Type": "application/json"
  if (!contentTypeKey) {
    optionsCopy = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    };
  }

  const url = new TemplateURL(
    '/organizations/{organizationId}/{endpointPath}',
    clientConfigCopy.baseUri as string,
    {
      pathParams: pathParams as PathParameters,
      queryParams: optionsCopy.parameters,
      origin: clientConfigCopy.proxy,
    }
  );

  return doFetch(url.toString(), optionsCopy, clientConfigCopy, rawResponse);
};
