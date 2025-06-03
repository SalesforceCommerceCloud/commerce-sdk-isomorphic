/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Makes a type easier to read.
 */
type Prettify<T> = NonNullable<{
  [K in keyof T]: T[K];
}>;

/**
 * Generates the types required on a method, based on those provided in the config.
 */
export type CompositeParameters<
  MethodParameters extends Record<string, unknown>,
  ConfigParameters extends Record<string, unknown>
> = Prettify<
  Omit<MethodParameters, keyof ConfigParameters> & Partial<MethodParameters>
>;

/**
 * If an object has a `parameters` property, and the `parameters` object has required properties,
 * then the `parameters` property on the root object is marked as required.
 */
export type RequireParametersUnlessAllAreOptional<
  T extends {parameters?: Record<string, unknown>}
> = Record<string, never> extends NonNullable<T['parameters']>
  ? T
  : Prettify<T & Required<Pick<T, 'parameters'>>>;

/**
 * Template parameters used in the base URI of all API endpoints. `version` will default to `"v1"`
 * if not specified.
 */
export interface BaseUriParameters {
  shortCode: string;
  version?: string; // Optional, will default to "v1" if not provided.
}

export type LocaleCode = {[key: string]: any};

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
  [key: string]: string | number | boolean | string[] | number[] | LocaleCode;
}

/**
 * Generic interface for all parameter types.
 */
export type UrlParameters = PathParameters | QueryParameters;

/**
 * Custom query parameter type with any string prefixed with `c_` as the key and the allowed
 * types for query parameters for the value.
 */
export type CustomQueryParameters = {
  [key in `c_${string}`]: string | number | boolean | string[] | number[];
};

/**
 * Custom body request type with any string prefixed with `c_` as the key and the allowed
 * types for the value.
 */
export type CustomRequestBody = {
  [key in `c_${string}`]:
    | string
    | number
    | boolean
    | string[]
    | number[]
    | {[key: string]: unknown};
};

// TODO: replace any types with proper types
// TODO: see if there's a way to fix the types for tests
export interface ISlasClient {
  authenticateCustomer(
    options: {
      parameters?: {
        organizationId?: string;
      } & { [key in `c_${string}`]: any };
      retrySettings?: any;
      headers?: { [key: string]: string };
      fetchOptions?: RequestInit;
      body: any;
    },
    rawResponse?: boolean
  ): Promise<Response | void>;

  authorizeCustomer(
    options?: {
      parameters?: {
        organizationId?: string;
        redirect_uri: string;
        response_type: string;
        client_id: string;
        scope?: string;
        state?: string;
        usid?: string;
        hint?: string;
        channel_id?: string;
        code_challenge: string;
      } & { [key in `c_${string}`]: any };
      retrySettings?: any;
      fetchOptions?: RequestInit;
      headers?: { [key: string]: string };
    },
    rawResponse?: boolean
  ): Promise<Response | void>;

  getAccessToken(
    options: {
      parameters?: {
        organizationId?: string;
      } & { [key in `c_${string}`]: any };
      retrySettings?: any;
      fetchOptions?: RequestInit;
      headers?: { [key: string]: string };
      body: any;
    },
    rawResponse?: boolean
  ): Promise<Response | any>;

  logoutCustomer(
    options?: {
      parameters?: {
        organizationId?: string;
        client_id: string;
        refresh_token: string;
        channel_id?: string;
      } & { [key in `c_${string}`]: any };
      retrySettings?: any;
      fetchOptions?: RequestInit;
      headers?: { [key: string]: string };
    },
    rawResponse?: boolean
  ): Promise<Response | any>;

  getPasswordLessAccessToken(
    options?: RequireParametersUnlessAllAreOptional<{
        parameters?: CompositeParameters<{
            organizationId: string;
        } & { [key in `c_${string}`]: any }, any>
        headers?: { [key: string]: string },
        body: {
            grant_type: string;
            hint: string;
            pwdless_login_token: string;
            client_id?: string;
            code_verifier?: string;
        }
    }>
  ): Promise<any>;

  authorizePasswordlessCustomer(
    options?: RequireParametersUnlessAllAreOptional<{
        parameters?: CompositeParameters<{
            organizationId: string;
        } & { [key in `c_${string}`]: any }, any>,
        headers?: { [key: string]: string },
        body: {
            user_id: string;
            mode: string;
            locale?: string;
            usid?: string;
            channel_id: string;
            callback_uri?: string;
        }
    }>,
    rawResponse?: boolean
): Promise<Response | string>;

  clientConfig: any;
}
