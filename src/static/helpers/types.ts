/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type CompositeParameters<
  MethodParameters extends Record<string, unknown>,
  ConfigParameters extends Record<string, unknown>
> = Omit<MethodParameters, keyof ConfigParameters> & Partial<MethodParameters>;

export type RequireParametersUnlessAllAreOptional<
  T extends {parameters?: Record<string, unknown>}
> = Record<string, never> extends NonNullable<T['parameters']>
  ? T
  : T & Required<Pick<T, 'parameters'>>;

/**
 * Template parameters used in the base URI of all API endpoints. `version` will default to `"v1"`
 * if not specified.
 */
export interface BaseUriParameters {
  shortCode: string;
  version?: string; // Optional, will default to "v1" if not provided.
}

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
