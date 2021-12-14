/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {PathParameters, QueryParameters} from './helpers';

export default class TemplateURL extends URL {
  /**
   * @param url -
   * @param base -
   */
  constructor(
    url: string,
    base: string,
    parameters?: {
      pathParams?: PathParameters;
      queryParams?: QueryParameters;
      origin?: string;
    }
  ) {
    super(
      TemplateURL.renderTemplateUri(
        `${base}/${url}`.replace(/\/\/+/g, '/'),
        parameters?.pathParams
      )
    );
    this.addQueryParams(parameters?.queryParams);
    if (parameters?.origin) {
      this.replaceOrigin(parameters?.origin);
    }
  }

  /**
   * Replace the origin (protocol/host) portion of the URL with a new origin.
   * The path portion is retained and concatenated with any path included in the
   * new origin. Thee primary use of this function is to use a proxy.
   *
   * @param newOriginString - The new origin to substitute (ex: https://example.com)
   */
  replaceOrigin(newOriginString: string): void {
    const newOriginUrl = new URL(newOriginString);
    this.protocol = newOriginUrl.protocol;
    this.host = newOriginUrl.host;
    this.pathname = `${newOriginUrl.pathname}/${this.pathname}`.replace(
      /\/\/+/g,
      '/'
    );
  }

  /**
   * Add append an object literal of query parameters to the URL object. Arrays
   * are allowed and are appended using the "repeat" convention where the \{ a:
   * ["1", "2"] \} becomes "?a=1&a=2"
   */
  addQueryParams(queryParams?: QueryParameters): void {
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const param = queryParams[key];
        if (Array.isArray(param)) {
          for (let i = 0; i < param.length; i += 1) {
            this.searchParams.append(key, String(param[i]));
          }
        } else {
          this.searchParams.append(key, String(param));
        }
      });
    }
  }

  /**
   * Replace bracketed URL template parameters with values from parameters object
   *
   * @param template - The URL template string to make substitutions in
   * @param parameters - The object literal that provides the values to substitute
   *
   * @returns String URL with substitutions made
   */
  static renderTemplateUri(
    template: string,
    parameters?: PathParameters
  ): string {
    return parameters
      ? template.replace(
          /\{([^\}]+)\}/g /* eslint-disable-line no-useless-escape */,
          (match, param: string) => String(parameters[param])
        )
      : template;
  }
}
