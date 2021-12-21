/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {RequestInit as NodeRequestInit} from 'node-fetch';
import {BaseUriParameters} from './helpers';

/**
 * Alias for `RequestInit` from TypeScript's DOM lib, to more clearly differentiate
 * it from the `RequestInit` provided by node-fetch.
 */
type BrowserRequestInit = RequestInit;
/**
 * Any properties supported in either the browser or node are accepted.
 * Using the right properties in the right context is left to the user.
 */
export type FetchOptions = NodeRequestInit & BrowserRequestInit;

/**
 * Base options that can be passed to the `ClientConfig` class.
 */
export interface ClientConfigInit<Params extends BaseUriParameters> {
  baseUri?: string;
  proxy?: string;
  headers?: {[key: string]: string};
  parameters: Params;
  fetchOptions?: FetchOptions;
  transformRequest?: (
    data: unknown,
    headers: {[key: string]: string}
  ) => Required<FetchOptions>['body'];
  throwOnBadResponse?: boolean;
}

/**
 * Configuration parameters common to Commerce SDK clients
 */
export default class ClientConfig<Params extends BaseUriParameters>
  implements ClientConfigInit<Params>
{
  public baseUri?: string;

  public proxy?: string;

  public headers: {[key: string]: string};

  public parameters: Params;

  public fetchOptions: FetchOptions;

  public transformRequest: NonNullable<
    ClientConfigInit<Params>['transformRequest']
  >;

  public throwOnBadResponse: boolean;

  constructor(config: ClientConfigInit<Params>) {
    this.headers = {...config.headers};
    this.parameters = {...config.parameters};
    // shortCode is required in the type, but we still check that it is present for the JS users
    if (!this.parameters.shortCode) {
      throw new Error('Missing required parameter: shortCode');
    }
    this.fetchOptions = {...config.fetchOptions};
    this.transformRequest =
      config.transformRequest || ClientConfig.defaults.transformRequest;

    // Optional properties
    if (config.baseUri) {
      this.baseUri = config.baseUri;
    }
    if (config.proxy) {
      this.proxy = config.proxy;
    }
    this.throwOnBadResponse = !!config.throwOnBadResponse;
  }

  static readonly defaults: Pick<
    Required<ClientConfigInit<never>>,
    'transformRequest'
  > = {
    /**
     * If the `Content-Type` header is `application/json`, the data is converted to a JSON string.
     * If the `Content-Type` header is `application/x-www-form-urlencoded`, the data is converted to
     * a `URLSearchParams` object.
     * In all other cases, the data is returned unmodified.
     * @param data - Data to transform
     * @returns A payload appropriate for the specified `Content-Type` header
     */
    transformRequest(data, headers) {
      switch (headers['Content-Type']) {
        case 'application/json': {
          return JSON.stringify(data);
        }
        case 'application/x-www-form-urlencoded': {
          // Only SLAS uses this content type, and all of their payloads are Record<string, string>.
          // Future APIs are unlikely to use this content type. Additionally, URLSearchParams
          // actually accepts Record<string, unknown> and converts the values to strings.
          // Therefore, this type assertion isn't *strictly* safe, but is unlikely to cause issues.
          return new URLSearchParams(data as Record<string, string>);
        }
        default: {
          // This type assertion isn't safe. However, this default case will not occur with the
          // currently known APIs, as they all use a Content-Type already specified. Rather than
          // throwing in this case, we return the data unmodified, to be more flexible in case there
          // are different content types in future APIs.
          return data as Required<FetchOptions>['body'];
        }
      }
    },
  };
}
