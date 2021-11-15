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

/**
 * Template parameters used in the base URI of all API endpoints. `version` will default to `"v1"`
 * if not specified.
 */
export interface CommonBaseUriParameters {
  // `shortCode` is required because all APIs need it, and it can only be specified in the config.
  shortCode: string;
  // `version` is optional because it will default to `v1`.
  version?: string;
}

/**
 * Template parameters used in the path of many API endpoints.
 */
export interface CommonPathParameters {
  organizationId?: string;
}

/**
 * Query parameters that are used by many API endpoints.
 */
export interface CommonQueryParameters {
  clientId?: string;
  siteId?: string;
}

/**
 * Parameters that are commonly used by many API endpoints.
 */
export type CommonParameters =
  & CommonBaseUriParameters
  & CommonPathParameters
  & CommonQueryParameters;

/**
 * Generic interface for path parameters.
 */
export interface PathParameters {
  [key: string]: string | number | boolean;
}

/**
 * Generic interface for query parameters.
 */
export interface QueryParameters {
  [key: string]: string | number | boolean | string[] | number[];
}

/**
 * Generic interface for all parameter types.
 */
export type UrlParameters = PathParameters | QueryParameters;
