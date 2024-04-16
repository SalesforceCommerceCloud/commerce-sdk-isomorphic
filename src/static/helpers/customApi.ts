/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {BaseUriParameters} from 'lib/helpers';
import TemplateURL from '../templateUrl';
import type {FetchOptions} from '../clientConfig';
import ResponseError from '../responseError';
import {isBrowser, fetch} from './environment';
import ClientConfig, {ClientConfigInit} from '../clientConfig';

// TODO: check if you can pull out version in javascript, that way this doesn't have to be an .hbs file
// import { USER_AGENT_HEADER, USER_AGENT_VALUE } from "../version";
const USER_AGENT_HEADER = 'user-agent';
const USER_AGENT_VALUE = 'commerce-sdk-isomorphic@1.13.1';

// export const runFetchHelper = async (
//   url: string,
//   options?: {
//     [key: string]: any;
//   }
// ): Promise<Response> => {

// };

export interface CustomParams {
  apiName: string;
  apiVersion?: string;
  endpointPath: string;
  organizationId: string;
  shortCode: string;
  [key: string]: any;
}

// what clientConfig should look like
// clientConfig: {
//     proxy?: string,
//     fetchOptions?: FetchOptions,
//     throwOnBadResponse?: boolean,
//     // path parameters
//     parameters: {
//         apiName: string;
//         apiVersion?: string; // default to v1 if not provided
//         endpointPath: string;
//         organizationId: string;
//         shortCode: string;
//     },
//     headers?: {[key: string]: string},
//     transformRequest?: NonNullable<
//         ClientConfigInit<CustomPathParams>['transformRequest']
//     >;
// };

// eslint-disable-next-line
export const callCustomEndpoint = async (
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    parameters?: {[key: string]: any}; // query parameters
    headers?: {
      authorization: string;
    } & {[key: string]: string};
    body?: {[key: string]: any};
  },
  clientConfig: ClientConfigInit<CustomParams>,
  rawResponse?: boolean
): Promise<Response | string> => {
  const CUSTOM_BASE_URI =
    'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}';
  const CUSTOM_PATH = '/organizations/{organizationId}/{endpointPath}';
  const pathParams = {...clientConfig.parameters};

  if (!pathParams.apiVersion) {
    pathParams.apiVersion = 'v1';
  }

  const url = new TemplateURL(CUSTOM_PATH, CUSTOM_BASE_URI, {
    pathParams,
    queryParams: options.parameters,
    origin: clientConfig.proxy,
  });

  const headers: Record<string, string> = {
    ...clientConfig?.headers,
    ...options?.headers,
  };

  if (!isBrowser) {
    // Browsers forbid setting a custom user-agent header
    headers[USER_AGENT_HEADER] = [
      headers[USER_AGENT_HEADER],
      USER_AGENT_VALUE,
    ].join(' ');
  }

  const requestOptions: FetchOptions = {
    ...clientConfig.fetchOptions,
    headers,
    // TODO: eventually remove this
    // @ts-ignore
    body: options.body,
    // body: clientConfig.transformRequest(options.body, headers),
    method: options.method,
  };

  const response = await fetch(url.toString(), requestOptions);
  if (rawResponse) {
    return response;
  }
  if (
    clientConfig.throwOnBadResponse &&
    !response.ok &&
    response.status !== 304
  ) {
    throw new ResponseError(response);
  } else {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }
};
