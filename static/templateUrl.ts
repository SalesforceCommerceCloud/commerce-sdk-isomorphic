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
    pathParams?: { [key: string]: string },
    queryParams?: { [key: string]: any }
  ) {
    super(TemplateURL.renderTemplateUri(`${base}/${url}`, pathParams));
    this.addQueryParams(queryParams);
  }

  /**
   * Add append an object literal of query parameters to the URL object. Arrays
   * are allowed and are appended using the "repeat" convention where the \{ a:
   * ["1", "2"] \} becomes "?a=1&a=2"
   */
  addQueryParams(queryParams: { [key: string]: any }): void {
    if (queryParams) {
      Object.keys(queryParams).forEach((key) => {
        if (Array.isArray(queryParams[key])) {
          for (let i = 0; i < queryParams[key].length; i++) {
            this.searchParams.append(key, queryParams[key][i]);
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
    parameters: { [key: string]: string }
  ): string {
    return template.replace(
      /\{([^\}]+)\}/g,
      (match, param) => parameters[param]
    );
  }
}
