/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { nanoid } from 'nanoid';

import { ShopperLogin, TokenRequest, TokenResponse } from '../../lib/shopperLogin';

/**
 * Determine if execution is client or server side
 */
export const onClient = typeof window !== 'undefined';

/**
 * Parse out the code and usid from a redirect url
 * @param urlString The url returned from calling ShopperLogin that contains a code and usid as parameters
 * @returns an object with keys for the code, usid and url
 */
export const getCodeAndUsidFromUrl = (
  urlString: string
): Record<string, string> => {
  const url: URL = new URL(urlString);
  const urlParams: URLSearchParams = new URLSearchParams(url.search);
  const usid: string = urlParams.get('usid') || '';
  const code: string = urlParams.get('code') || '';

  return {
    code,
    url: urlString,
    usid,
  };
};

/**
 * Creates a random string to use as a code verifier. This code is created by the client and sent with both the authorization request (as a code challenge) and the token request.
 * @returns code verifier
 */
export const createCodeVerifier = (): string => nanoid(128);

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
  try {
    // Cannot test browser functions
    /* istanbul ignore next */
    if (window.crypto.subtle.digest !== undefined) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)));
      challenge = urlSafe(base64Digest);
    }
  } catch (e) {
    const crypto = await import('crypto');
    challenge = urlSafe(
      crypto.default.createHash('sha256').update(codeVerifier).digest('base64')
    );
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
 * @param parameters -
 *   codeVerifier - random string created by client app to use as a secret in the request
 *   redirectURI - the location the client will be returned to after successful login with 3rd party IDP. Must be registered in SLAS.
 *   hint? - optional string to hint at a partitcular IDP. Guest sessions are created by setting this to 'guest'
 *   usid? - optional saved SLAS user id to link the new session to a previous session
 * @returns login url, user id and authorization code if available
 */
export async function authorize(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
  }>,
  parameters: {
    codeVerifier: string;
    redirectURI: string;
    hint?: string;
    usid?: string;
  }
): Promise<Record<string, string>> {
  const codeChallenge = await generateCodeChallenge(parameters.codeVerifier);

  const options = {
    parameters: {
      client_id: slasClient.clientConfig.parameters.clientId,
      code_challenge: codeChallenge,
      ...(parameters.hint && {hint: parameters.hint}),
      organizationId: slasClient.clientConfig.parameters.organizationId,
      redirect_uri: parameters.redirectURI,
      response_type: 'code',
      ...(parameters.usid && {usid: parameters.usid}),
    },
    // set manual redirect on server since node allows access to the location
    // header and it skips the extra call. In the browser, only the default
    // follow setting allows us to get the url.
    ...(!onClient && {fetchOptions: {redirect: 'manual'}}),
  };

  const response = await slasClient.authorizeCustomer(options, true);

  const redirectUrl = response?.url || response?.headers?.get('location');
  if (!redirectUrl) {
    throw new Error('Authorization failed');
  }

  return getCodeAndUsidFromUrl(redirectUrl);
}

/**
 * @param slasClient a configured instance of the ShopperLogin SDK client
 * @param parameters -
 *  redirectURI: string;
 *  usid?: string;
 * @returns TokenResponse object
 */
export async function loginGuestUser(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
  }>,
  parameters: {
    redirectURI: string;
    usid?: string;
  }
): Promise<TokenResponse> {
  const codeVerifier = createCodeVerifier();

  const authResponse = await authorize(slasClient, {
    codeVerifier,
    redirectURI: parameters.redirectURI,
    hint: 'guest',
    ...(parameters.usid && {usid: parameters.usid}),
  });

  const tokenBody: TokenRequest = {
    client_id: slasClient.clientConfig.parameters.clientId,
    code: authResponse.code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code_pkce',
    redirect_uri: parameters.redirectURI,
    usid: authResponse.usid,
  };

  return slasClient.getAccessToken({body: tokenBody});
}

/**
 * @param slasClient a configured instance of the ShopperLogin SDK client
 * @param parameters -
 *  shopperUserId: the id of the user to login with;
 *  shopperPassword: the password of the user to login with;
 *  redirectURI: a registered redirect URI to return;
 *  usid?: an existing usid to continue a session;
 * @returns TokenResponse object
 */
export async function loginRegisteredUserB2C(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  parameters: {
    shopperUserId: string;
    shopperPassword: string;
    redirectURI: string;
    usid?: string;
  }
): Promise<TokenResponse> {
  const codeVerifier = createCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authorization = `Basic ${btoa(
    `${parameters.shopperUserId}:${parameters.shopperPassword}`
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

  const response = await slasClient.authenticateCustomer(options, true);

  const authResponse = getCodeAndUsidFromUrl(response.url);

  const tokenBody = {
    client_id: slasClient.clientConfig.parameters.clientId,
    code: authResponse.code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code_pkce',
    organizationId: slasClient.clientConfig.parameters.organizationId,
    redirect_uri: parameters.redirectURI,
    usid: authResponse.usid,
  };

  return slasClient.getAccessToken({body: tokenBody});
}

/**
 * Exchange a refresh token for a new access token.
 * @param slasClient a configured instance of the ShopperLogin SDK client
 * @param slasRefreshToken
 * @returns
 */
export function refreshToken(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
  }>,
  parameters: {refreshToken: string}
): Promise<TokenResponse> {
  const body = {
    grant_type: 'refresh_token',
    refresh_token: parameters.refreshToken,
    client_id: slasClient.clientConfig.parameters.clientId,
  };

  return slasClient.getAccessToken({body});
}

export function logout(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  parameters: {refreshToken: string}
): Promise<TokenResponse> {
  return slasClient.logoutCustomer({
    parameters: {
      refresh_token: parameters.refreshToken,
      client_id: slasClient.clientConfig.parameters.clientId,
      channel_id: slasClient.clientConfig.parameters.siteId,
    },
  });
}
