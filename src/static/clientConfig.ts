/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type { RequestInit as NodeRequestInit } from 'node-fetch';
import type { UrlParameters } from './commonParameters';

// eslint-disable-next-line no-undef
type FetchOptions = RequestInit & NodeRequestInit;

export interface ClientConfigInit {
  baseUri?: string;
  proxy?: string;
  headers?: { [key: string]: string };
  parameters?: UrlParameters;
  fetchOptions?: FetchOptions;
  // eslint-disable-next-line no-unused-vars
  transformRequest?: (data: any, headers: { [key: string]: string }) => Required<FetchOptions>['body'];
}

/**
 * Configuration parameters common to Commerce SDK clients
 */
export default class ClientConfig implements ClientConfigInit {
  public baseUri?: string;

  public proxy?: string;

  public headers: { [key: string]: string };

  public parameters: UrlParameters;

  public fetchOptions: FetchOptions;

  public transformRequest: NonNullable<ClientConfigInit['transformRequest']>;

  constructor(config: ClientConfigInit = ClientConfig.defaults) {
    this.headers = { ...config.headers };
    this.parameters = { ...config.parameters };
    this.fetchOptions = { ...config.fetchOptions };
    this.transformRequest = config.transformRequest || ClientConfig.defaults.transformRequest;

    // Optional properties
    if (config.baseUri) {
      this.baseUri = config.baseUri;
    }
    if (config.proxy) {
      this.proxy = config.proxy;
    }
  }

  static readonly defaults: Pick<Required<ClientConfigInit>, 'transformRequest'> = {
    /**
     * If data is a plain object, converts it to JSON and sets the Content-Type header
     * to application/json. All other data is returned unmodified.
     * @param data - Data to transform
     * @returns A JSON string or the unmodified data
     */
    transformRequest<T>(data: T, headers: { [key: string]: string }): T | string {
      if (data == null || typeof data !== 'object') {
        return data;
      }
      const proto = Object.getPrototypeOf(data);
      if (proto === null || proto === Object.prototype) {
        // eslint-disable-next-line no-param-reassign
        headers['Content-Type'] = 'application/json';
        return JSON.stringify(data);
      }
      return data;
    },
  };
}
