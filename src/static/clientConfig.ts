/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type { RequestInit as NodeRequestInit } from 'node-fetch';
import type { UrlParameters } from './commonParameters';

// eslint-disable-next-line no-undef
type BrowserRequestInit = RequestInit; // alias for clarity

export interface ClientConfigInit {
  baseUri?: string;
  proxy?: string;
  headers?: { [key: string]: string };
  parameters?: UrlParameters;
  fetchOptions?: BrowserRequestInit & NodeRequestInit;
}

/**
 * Configuration parameters common to Commerce SDK clients
 */
export default class ClientConfig implements ClientConfigInit {
  public baseUri?: string;

  public proxy?: string;

  public headers: { [key: string]: string };

  public parameters: UrlParameters;

  public fetchOptions: BrowserRequestInit & NodeRequestInit;

  constructor(config = ClientConfig.defaults) {
    this.headers = { ...config.headers };
    this.parameters = { ...config.parameters };
    this.fetchOptions = { ...config.fetchOptions };

    // Optional properties
    if (config.baseUri) {
      this.baseUri = config.baseUri;
    }
    if (config.proxy) {
      this.proxy = config.proxy;
    }
  }

  static readonly defaults: ClientConfigInit = {};
}
