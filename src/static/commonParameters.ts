/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Common parameters are the set of values that are often shared across SDK
 * client configurations.
 */
export const commonParameterPositions = {
  baseUriParameters: ['shortCode', 'version'],
  pathParameters: ['organizationId'],
  queryParameters: ['clientId', 'siteId'],
};

export type CommonParameters = {
  clientId?: string;
  organizationId?: string;
  shortCode?: string;
  siteId?: string;
  version?: string;
};

export interface PathParameters {
  [key: string]: string | number | boolean;
}

export interface QueryParameters {
  [key: string]: string | number | boolean | string[] | number[];
}

export type UrlParameters = PathParameters | QueryParameters;
