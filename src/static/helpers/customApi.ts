/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import TemplateURL from '../templateUrl';
import type {FetchOptions} from '../clientConfig';

// TODO: implement
// export const runFetchHelper = async (
//   url: string,
//   options?: {
//     [key: string]: any;
//   }
// ): Promise<Response> => {

// };

// eslint-disable-next-line
export const callCustomEndpoint = async (
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    clientConfig: {
      parameters: {
        // path parameters
        apiName: string;
        apiVersion?: string; // default to v1 if not provided
        endpointPath: string;
        organizationId: string;
        shortCode: string;
      };
      proxy?: string;
      fetchOptions?: FetchOptions;
    };
    parameters?: {[key: string]: any}; // query parameters
    headers?: {
      Authorization: string;
    } & {[key: string]: string};
    body?: {[key: string]: any};
  }
  //   rawResponse?: boolean
): Promise<Response> => {
  // https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}/organizations/{organizationId}/{endpointPath}
  //  static readonly defaultBaseUri = "https://{shortCode}.api.commercecloud.salesforce.com/search/shopper-search/{version}/";
  const CUSTOM_BASE_URI =
    'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}';
  const CUSTOM_PATH = '/organizations/{organizationId}/{endpointPath}';
  const pathParams = {...options.clientConfig.parameters};
  if (!pathParams.apiVersion) {
    pathParams.apiVersion = 'v1';
  }

  const url = new TemplateURL(CUSTOM_PATH, CUSTOM_BASE_URI, {
    pathParams,
    queryParams: options.parameters,
    origin: options.clientConfig.proxy,
  });

  const requestOptions = {
    ...options.clientConfig.fetchOptions,
    // TODO: this.clientConfig.transformRequest(options.body, headers)
    body: options.body as BodyInit,
    headers: options.headers,
    method: options.method,
  };

  const response = await fetch(url.toString(), requestOptions);
  //   if (rawResponse) {
  //     return response;
  //   }
  //   const text = await response.text();
  //   return text ? JSON.parse(text) : {};
  return response;
};
