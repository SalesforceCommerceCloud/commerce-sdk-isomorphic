/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {BaseUriParameters} from '.';
import type {FetchOptions} from '../clientConfig';
import ResponseError from '../responseError';
import {fetch} from './environment';
import {ClientConfigInit} from '../clientConfig';

/**
 * A wrapper function around fetch designed for making requests using the SDK
 * @param url - The url of the resource that you wish to fetch
 * @param options? - An object containing any custom settings you want to apply to the request
 * @param options.method? - The request HTTP operation. 'GET' is the default if no method is provided.
 * @param options.headers? - Headers that are added to the request. Authorization header should be in this argument or in the clientConfig.headers
 * @param options.body? - Body that is used for the request
 * @param clientConfig? - Client Configuration object used by the SDK with properties that can affect the fetch call
 * @param clientConfig.headers? - Additional headers that are added to the request. Authorization header should be in this argument or in the options?.headers. options?.headers will override any duplicate properties.
 * @param clientConfig.fetchOptions? - fetchOptions that are passed onto the fetch request
 * @param clientConfig.throwOnBadResponse? - flag that when set true will throw a response error if the fetch request fails
 * @param rawResponse? - Flag to return the raw response from the fetch call. True for raw response object, false for the data from the response
 * @returns Raw response or data from response based on rawResponse argument from fetch call
 */
// eslint-disable-next-line import/prefer-default-export
export const runFetchHelper = async <Params extends BaseUriParameters>(
  url: string,
  options?: {
    method?: string;
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
    ...(options?.body &&
      ({body: options.body} as unknown as FormData & URLSearchParams)),
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
