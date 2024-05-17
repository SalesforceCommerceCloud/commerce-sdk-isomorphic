/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {customRandom, urlAlphabet} from 'nanoid';
import seedrandom, {PRNG} from 'seedrandom';
import {isBrowser} from './environment';

import {
  ShopperLogin,
  TokenRequest,
  TokenResponse,
} from '../../lib/shopperLogin';
import ResponseError from '../responseError';

interface CryptoLib {
  digestStringAsync?: (
    digest: string,
    data: string,
    options: {encoding: string}
  ) => Promise<string>;
  default: typeof import('crypto');
}

export const stringToBase64 = isBrowser
  ? btoa
  : (unencoded: string): string => Buffer.from(unencoded).toString('base64');

/**
 * Parse out the code and usid from a redirect url
 * @param urlString A url that contains `code` and `usid` query parameters, typically returned when calling a Shopper Login endpoint
 * @returns An object containing the code and usid.
 */
export const getCodeAndUsidFromUrl = (
  urlString: string
): {code: string; usid: string} => {
  const url = new URL(urlString);
  const urlParams = new URLSearchParams(url.search);
  const usid = urlParams.get('usid') ?? '';
  const code = urlParams.get('code') ?? '';

  return {
    code,
    usid,
  };
};

/**
 * Adds entropy to nanoid() using seedrandom to ensure that the code_challenge sent to SCAPI by Google's crawler browser is unique.
 * Solves the issue with Google's crawler getting the same result from nanoid() in two different runs, which results in the same PKCE code_challenge being used twice.
 */
const nanoid = (): string => {
  const rng: PRNG = seedrandom(String(+new Date()), {entropy: true});
  return customRandom(urlAlphabet, 128, size =>
    new Uint8Array(size).map(() => 256 * rng())
  )();
};

/**
 * Creates a random string to use as a code verifier. This code is created by the client and sent with both the authorization request (as a code challenge) and the token request.
 * @returns code verifier
 */
export const createCodeVerifier = (): string => nanoid();

/**
 * Encodes a code verifier to a code challenge to send to the authorization endpoint
 * @param codeVerifier random string to use as a code verifier
 * @returns code challenge
 */
export const generateCodeChallenge = async (
  codeVerifier: string
): Promise<string> => {
  const urlSafe = (input: string) =>
    input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  let challenge = '';
  // Cannot easily test browser functions. Integration test runs in the jsdom test environment which can only mimic certain browser functionality
  // The window.crypto check is to see if code is being executed in the jsdom test environment or an actual browser to allow our test to successfully run
  /* istanbul ignore next */
  if (isBrowser && window.crypto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)));
    challenge = urlSafe(base64Digest);
  } else {
    const crypto: CryptoLib = await import('crypto');

    if (
      typeof navigator !== 'undefined' &&
      navigator.product === 'ReactNative'
    ) {
      const base64Digest = await crypto.digestStringAsync?.(
        'SHA-256',
        codeVerifier,
        {
          encoding: 'base64',
        }
      );

      challenge = base64Digest ? urlSafe(base64Digest) : '';
    } else {
      challenge = urlSafe(
        crypto.default
          .createHash('sha256')
          .update(codeVerifier)
          .digest('base64')
      );
    }
  }

  /* istanbul ignore next */
  if (challenge.length === 0) {
    throw new Error('Problem generating code challenge');
  }

  return challenge;
};

/**
 * Wrapper for the authorization endpoint. For federated login (3rd party IDP non-guest), the caller should redirect the user to the url in the url field of the returned object. The url will be the login page for the 3rd party IDP and the user will be sent to the redirectURI on success. Guest sessions return the code and usid directly with no need to redirect.
 * @param slasClient a configured instance of the ShopperLogin SDK client
 * @param codeVerifier - random string created by client app to use as a secret in the request
 * @param parameters - Request parameters used by the `authorizeCustomer` endpoint.
 * @param parameters.redirectURI - the location the client will be returned to after successful login with 3rd party IDP. Must be registered in SLAS.
 * @param parameters.hint? - optional string to hint at a particular IDP. Guest sessions are created by setting this to 'guest'
 * @param parameters.usid? - optional saved SLAS user id to link the new session to a previous session
 * @returns login url, user id and authorization code if available
 */
export async function authorize(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  codeVerifier: string,
  parameters: {
    redirectURI: string;
    hint?: string;
    usid?: string;
  }
): Promise<{code: string; url: string; usid: string}> {
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Create a copy to override specific fetchOptions
  const slasClientCopy = new ShopperLogin(slasClient.clientConfig);

  // set manual redirect on server since node allows access to the location
  // header and it skips the extra call. In the browser, only the default
  // follow setting allows us to get the url.
  /* istanbul ignore next */
  slasClientCopy.clientConfig.fetchOptions = {
    ...slasClient.clientConfig.fetchOptions,
    redirect: isBrowser ? 'follow' : 'manual',
  };

  const options = {
    parameters: {
      client_id: slasClient.clientConfig.parameters.clientId,
      channel_id: slasClient.clientConfig.parameters.siteId,
      code_challenge: codeChallenge,
      ...(parameters.hint && {hint: parameters.hint}),
      organizationId: slasClient.clientConfig.parameters.organizationId,
      redirect_uri: parameters.redirectURI,
      response_type: 'code',
      ...(parameters.usid && {usid: parameters.usid}),
    },
  };

  const response = await slasClientCopy.authorizeCustomer(options, true);
  const redirectUrlString = response.headers?.get('location') || response.url;
  const redirectUrl = new URL(redirectUrlString);
  const searchParams = Object.fromEntries(redirectUrl.searchParams.entries());

  // url is a read only property we unfortunately cannot mock out using nock
  // meaning redirectUrl will not have a falsy value for unit tests
  /* istanbul ignore next */
  if (response.status >= 400 || searchParams.error) {
    throw new ResponseError(response);
  }

  return {url: redirectUrlString, ...getCodeAndUsidFromUrl(redirectUrlString)};
}

/**
 * A single function to execute the ShopperLogin Private Client Guest Login as described in the [API documentation](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-private-client.html).
 * **Note**: this func can run on client side. Only use this one when the slas client secret is secured.
 * @param slasClient - a configured instance of the ShopperLogin SDK client
 * @param credentials - client secret used for authentication
 * @param credentials.clientSecret - secret associated with client ID
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.usid? - Unique Shopper Identifier to enable personalization.
 * @returns TokenResponse
 */
export async function loginGuestUserPrivate(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  parameters: {
    usid?: string;
  },
  credentials: {
    clientSecret: string;
  }
): Promise<TokenResponse> {
  const authorization = `Basic ${stringToBase64(
    `${slasClient.clientConfig.parameters.clientId}:${credentials.clientSecret}`
  )}`;

  const options = {
    headers: {
      Authorization: authorization,
    },
    body: {
      grant_type: 'client_credentials',
      ...(parameters.usid && {usid: parameters.usid}),
    },
  };

  return slasClient.getAccessToken(options);
}

/**
 * A single function to execute the ShopperLogin Public Client Guest Login with proof key for code exchange flow as described in the [API documentation](https://developer.salesforce.com/docs/commerce/commerce-api/references?meta=shopper-login:Summary).
 * @param slasClient a configured instance of the ShopperLogin SDK client.
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.redirectURI - Per OAuth standard, a valid app route. Must be listed in your SLAS configuration. On server, this will not be actually called. On browser, this will be called, but ignored.
 * @param parameters.usid? - Unique Shopper Identifier to enable personalization.
 * @returns TokenResponse
 */
export async function loginGuestUser(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  parameters: {
    redirectURI: string;
    usid?: string;
  }
): Promise<TokenResponse> {
  const codeVerifier = createCodeVerifier();

  const authResponse = await authorize(slasClient, codeVerifier, {
    redirectURI: parameters.redirectURI,
    hint: 'guest',
    ...(parameters.usid && {usid: parameters.usid}),
  });

  const tokenBody: TokenRequest = {
    client_id: slasClient.clientConfig.parameters.clientId,
    channel_id: slasClient.clientConfig.parameters.siteId,
    code: authResponse.code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code_pkce',
    redirect_uri: parameters.redirectURI,
    usid: authResponse.usid,
  };

  return slasClient.getAccessToken({body: tokenBody});
}

/**
 * A single function to execute the ShopperLogin Public Client Registered User B2C Login with proof key for code exchange flow as described in the [API documentation](https://developer.salesforce.com/docs/commerce/commerce-api/references?meta=shopper-login:Summary).
 * **Note**: this func can run on client side. Only use private slas when the slas client secret is secured.
 * @param slasClient a configured instance of the ShopperLogin SDK client.
 * @param credentials - the id and password and clientSecret (if applicable) to login with.
 * @param credentials.username - the id of the user to login with.
 * @param credentials.password - the password of the user to login with.
 * @param credentials.clientSecret? - secret associated with client ID
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.redirectURI - Per OAuth standard, a valid app route. Must be listed in your SLAS configuration. On server, this will not be actually called. On browser, this will be called, but ignored.
 * @param parameters.usid? - Unique Shopper Identifier to enable personalization.
 * @returns TokenResponse
 */
export async function loginRegisteredUserB2C(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  credentials: {
    username: string;
    password: string;
    clientSecret?: string;
  },
  parameters: {
    redirectURI: string;
    usid?: string;
  }
): Promise<TokenResponse> {
  const codeVerifier = createCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Create a copy to override specific fetchOptions
  const slasClientCopy = new ShopperLogin(slasClient.clientConfig);

  // set manual redirect on server since node allows access to the location
  // header and it skips the extra call. In the browser, only the default
  // follow setting allows us to get the url.
  /* istanbul ignore next */
  slasClientCopy.clientConfig.fetchOptions = {
    ...slasClient.clientConfig.fetchOptions,
    redirect: isBrowser ? 'follow' : 'manual',
  };

  const authorization = `Basic ${stringToBase64(
    `${credentials.username}:${credentials.password}`
  )}`;

  const options = {
    headers: {
      Authorization: authorization,
    },
    parameters: {
      organizationId: slasClient.clientConfig.parameters.organizationId,
    },
    body: {
      redirect_uri: parameters.redirectURI,
      client_id: slasClient.clientConfig.parameters.clientId,
      code_challenge: codeChallenge,
      channel_id: slasClient.clientConfig.parameters.siteId,
      ...(parameters.usid && {usid: parameters.usid}),
    },
  };

  const response = await slasClientCopy.authenticateCustomer(options, true);
  const redirectUrlString = response.headers?.get('location') || response.url;
  const redirectUrl = new URL(redirectUrlString);
  const searchParams = Object.fromEntries(redirectUrl.searchParams.entries());

  if (response.status >= 400 || searchParams.error) {
    throw new ResponseError(response);
  }

  const authResponse = getCodeAndUsidFromUrl(redirectUrlString);
  const tokenBody = {
    client_id: slasClient.clientConfig.parameters.clientId,
    channel_id: slasClient.clientConfig.parameters.siteId,
    code: authResponse.code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code_pkce',
    organizationId: slasClient.clientConfig.parameters.organizationId,
    redirect_uri: parameters.redirectURI,
    usid: authResponse.usid,
  };
  // using slas private client
  if (credentials.clientSecret) {
    const authHeaderIdSecret = `Basic ${stringToBase64(
      `${slasClient.clientConfig.parameters.clientId}:${credentials.clientSecret}`
    )}`;

    const optionsToken = {
      headers: {
        Authorization: authHeaderIdSecret,
      },
      body: tokenBody,
    };
    return slasClient.getAccessToken(optionsToken);
  }
  // default is to use slas public client
  return slasClient.getAccessToken({body: tokenBody});
}

/**
 * Exchange a refresh token for a new access token.
 * **Note**: this func can run on client side. Only use private slas when the slas client secret is secured.
 * @param slasClient a configured instance of the ShopperLogin SDK client.
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.refreshToken - a valid refresh token to exchange for a new access token (and refresh token).
 * @param credentials - the clientSecret (if applicable) to login with.
 * @param credentials.clientSecret - secret associated with client ID
 * @returns TokenResponse
 */
export function refreshAccessToken(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  parameters: {refreshToken: string},
  credentials?: {clientSecret?: string}
): Promise<TokenResponse> {
  const body = {
    grant_type: 'refresh_token',
    refresh_token: parameters.refreshToken,
    client_id: slasClient.clientConfig.parameters.clientId,
    channel_id: slasClient.clientConfig.parameters.siteId,
  };

  if (credentials && credentials.clientSecret) {
    const authorization = `Basic ${stringToBase64(
      `${slasClient.clientConfig.parameters.clientId}:${credentials.clientSecret}`
    )}`;
    const options = {
      headers: {
        Authorization: authorization,
      },
      body,
    };
    return slasClient.getAccessToken(options);
  }

  return slasClient.getAccessToken({body});
}

/**
 * Logout a shopper. The shoppers access token and refresh token will be revoked and if the shopper authenticated with ECOM the OCAPI JWT will also be revoked.
 * @param slasClient a configured instance of the ShopperLogin SDK client.
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.accessToken - a valid access token to exchange for a new access token (and refresh token).
 * @param parameters.refreshToken - a valid refresh token to exchange for a new access token (and refresh token).
 * @returns TokenResponse
 */
export function logout(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  parameters: {
    accessToken: string;
    refreshToken: string;
  }
): Promise<TokenResponse> {
  return slasClient.logoutCustomer({
    headers: {
      Authorization: `Bearer ${parameters.accessToken}`,
    },
    parameters: {
      refresh_token: parameters.refreshToken,
      client_id: slasClient.clientConfig.parameters.clientId,
      channel_id: slasClient.clientConfig.parameters.siteId,
    },
  });
}
