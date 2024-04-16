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

export const runFetchHelper = async (
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    parameters?: {[key: string]: any}; // query parameters
    path: string;
    headers?: {
      authorization: string;
    } & {[key: string]: string};
    body?: {[key: string]: any};
  },
  clientConfig: ClientConfigInit<CustomParams>, // TODO: update Params
  rawResponse?: boolean
): Promise<Response> => {
  const url = new TemplateURL(
    options.path,
    clientConfig?.baseUri as string, // TODO: potentially make an arg
    {
      pathParams: clientConfig.parameters,
      queryParams: options?.parameters,
      origin: clientConfig.proxy,
    }
  );

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
    // It's ideal to get "{}" for an empty response body, but we won't throw if it's truly empty
    return text ? JSON.parse(text) : {};
  }
};

export interface CustomParams {
  apiName: string;
  apiVersion?: string;
  endpointPath: string;
  organizationId: string;
  shortCode: string;
  [key: string]: any;
}

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

  const clientConfigCopy = {...clientConfig};
  clientConfigCopy.baseUri = CUSTOM_BASE_URI;
  if (!clientConfigCopy.parameters.apiVersion) {
    clientConfigCopy.parameters.apiVersion = 'v1';
  }

  return runFetchHelper(
    {
      ...options,
      path: CUSTOM_PATH,
    },
    clientConfigCopy,
    rawResponse
  );
};
