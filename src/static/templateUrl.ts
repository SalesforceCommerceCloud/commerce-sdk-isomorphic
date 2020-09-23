/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 *
 */
export class TemplateURL extends URL {
  /**
   * @param url -
   * @param base -
   */
  constructor(
    url: string,
    base?: string,
    parameters?: {
      pathParams?: { [key: string]: unknown },
      queryParams?: { [key: string]: unknown },
      origin?: string
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
   * The path portition is retained and concated with any path included in the
   * new origin. Thee primary use of this function is to use a proxy.
   * 
   * @param newOriginString - The new origin to substitute (ex: https://example.com)
   */
  replaceOrigin(newOriginString: string) {
    const newOriginUrl = new URL(newOriginString);
    this.protocol = newOriginUrl.protocol;
    this.host = newOriginUrl.host;
    this.pathname = `${newOriginUrl.pathname}/${this.pathname}`.replace(/\/\/+/g, '/');
  }

  /**
   * Add append an object literal of query parameters to the URL object. Arrays
   * are allowed and are appended using the "repeat" convention where the \{ a:
   * ["1", "2"] \} becomes "?a=1&a=2"
   */
  addQueryParams(queryParams: { [key: string]: unknown }): void {
    if (queryParams) {
      Object.keys(queryParams).forEach((key) => {
        if (Array.isArray(queryParams[key])) {
          for (let i = 0; i < (queryParams[key] as unknown[]).length; i++) {
            this.searchParams.append(key, queryParams[key][i].toString());
          }
        } else {
          this.searchParams.append(key, queryParams[key].toString());
        }
      });
    }
  }

  /**
   * Replace bracketed URL template paramters with values from parameters object
   * 
   * @param template - The URL template string to make substitutions in
   * @param parameters - The object literal that provides the values to substitute
   * 
   * @returns String URL with substitutions made
   */
  static renderTemplateUri(
    template: string,
    parameters: { [key: string]: unknown }
  ): string {
    return template.replace(
      /\{([^\}]+)\}/g,
      (match, param) => parameters[param].toString()
    );
  }
}
