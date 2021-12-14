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
  transformRequest?: <T>(
    data: T,
    headers: {[key: string]: string}
  ) => Required<FetchOptions>['body'];
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
  }

  static readonly defaults: Pick<
    Required<ClientConfigInit<never>>,
    'transformRequest'
  > = {
    /**
     * If data is a plain object or an array, it is converted to JSON and the Content-Type header is
     * set to application/json. All other data is returned unmodified.
     * @param data - Data to transform
     * @returns A JSON string or the unmodified data
     */
    transformRequest<T>(
      data: T,
      headers: {[key: string]: string}
    ): Required<FetchOptions>['body'] {
      // NOTE: These type assertions are NOT safe, but I plan on immediately replacing this
      // implementation in a follow-up PR.
      if (data == null || typeof data !== 'object') {
        return data as unknown as Required<FetchOptions>['body'];
      }
      const proto: unknown = Object.getPrototypeOf(data);
      if (Array.isArray(data) || proto === Object.prototype || proto === null) {
        // eslint-disable-next-line no-param-reassign
        headers['Content-Type'] = 'application/json';
        return JSON.stringify(data);
      }
      return data as unknown as Required<FetchOptions>['body'];
    },
  };
}
