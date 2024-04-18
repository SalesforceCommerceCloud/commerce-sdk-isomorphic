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
import {isBrowser, fetch} from './environment';
import {ClientConfigInit} from '../clientConfig';

// TODO: check if you can pull out version in javascript, that way this doesn't have to be an .hbs file
// import { USER_AGENT_HEADER, USER_AGENT_VALUE } from "../version";
const USER_AGENT_HEADER = 'user-agent';
const USER_AGENT_VALUE = 'commerce-sdk-isomorphic@1.13.1';

// TODO: add js/tsdoc comment
export const runFetchHelper = async <Params extends BaseUriParameters>( // TODO: also potentially extend { baseUri: string }
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    parameters?: {
      [key: string]: string | number | boolean | string[] | number[];
    };
    path: string;
    headers?: {
      authorization?: string;
    } & {[key: string]: string};
    // TODO: probably need to fix this type
    body?:
      | {[key: string]: unknown}
      | URLSearchParams
      | (BodyInit & (BodyInit | null));
  },
  clientConfig: ClientConfigInit<Params>,
  rawResponse?: boolean
): Promise<Response | string> => {
  const url = new TemplateURL(options.path, clientConfig.baseUri as string, {
    pathParams: clientConfig.parameters as unknown as PathParameters,
    queryParams: options?.parameters,
    origin: clientConfig.proxy,
  });

  const headers: Record<string, string> = {
    ...clientConfig?.headers,
    ...options?.headers,
  };

  // TODO: potentially pull this out of helper method
  // and leave it in the template
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
    // TODO: probably need to fix this type
    body: options.body as unknown as FormData & URLSearchParams,
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
    return (text ? JSON.parse(text) : {}) as string | Response;
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

// TODO: add js/tsdoc comment
export const callCustomEndpoint = async (
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
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
): Promise<Response | string> => {
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

  return runFetchHelper(
    {
      ...options,
      path: '/organizations/{organizationId}/{endpointPath}',
    },
    clientConfigCopy,
    rawResponse
  );
};
