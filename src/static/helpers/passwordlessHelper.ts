/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperLogin, TokenResponse} from '../../lib/shopperLogin';
import {createCodeVerifier, stringToBase64} from './slasHelper';

/**
 * Function to send passwordless login token
 * **Note** At the moment, passwordless is only supported on private client
 * @param slasClient a configured instance of the ShopperLogin SDK client.
 * @param credentials - the id and password and clientSecret (if applicable) to login with.
 * @param credentials.clientSecret? - secret associated with client ID
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.callbackURI? - URI to send the passwordless login token to. Must be listed in your SLAS configuration. Required when mode is callback
 * @param parameters.usid? - Unique Shopper Identifier to enable personalization.
 * @param parameters.userid - User Id for login
 * @param parameters.locale - The locale of the template. Not needed for the callback mode
 * @param parameters.mode - Medium of sending login token
 * @returns Promise of Response or Object
 */
export async function authorizePasswordless(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  credentials: {
    clientSecret: string;
  },
  parameters: {
    callbackURI?: string;
    usid?: string;
    userid: string;
    locale?: string;
    mode: string;
  }
): Promise<Response | Object> {
  const authHeaderIdSecret = `Basic ${stringToBase64(
    `${slasClient.clientConfig.parameters.clientId}:${credentials.clientSecret}`
  )}`;
  const tokenBody = {
    user_id: parameters.userid,
    mode: parameters.mode,
    ...(parameters.locale && {locale: parameters.locale}),
    ...(parameters.usid && {usid: parameters.usid}),
    channel_id: slasClient.clientConfig.parameters.siteId,
    ...(parameters.callbackURI && {callback_uri: parameters.callbackURI}),
  };

  return slasClient.authorizePasswordlessCustomer({
    headers: {
      Authorization: authHeaderIdSecret,
    },
    parameters: {
      organizationId: slasClient.clientConfig.parameters.organizationId,
    },
    body: tokenBody,
  });
}

/**
 * Function to login user with passwordless login token
 * **Note** At the moment, passwordless is only supported on private client
 * @param slasClient a configured instance of the ShopperLogin SDK client.
 * @param credentials - the id and password and clientSecret (if applicable) to login with.
 * @param credentials.clientSecret? - secret associated with client ID
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.callbackURI? - URI to send the passwordless login token to. Must be listed in your SLAS configuration. Required when mode is callback
 * @param parameters.pwdlessLoginToken - Passwordless login token
 * @param parameters.dnt? - Optional parameter to enable Do Not Track (DNT) for the user.
 * @returns Promise of Response or Object
 */
export async function getPasswordLessAccessToken(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  credentials: {
    clientSecret: string;
  },
  parameters: {
    pwdlessLoginToken: string;
    dnt?: string;
  } 
): Promise<TokenResponse> {
    const codeVerifier = createCodeVerifier();
    const authHeaderIdSecret = `Basic ${stringToBase64(
        `${slasClient.clientConfig.parameters.clientId}:${credentials.clientSecret}`
    )}`;

    const tokenBody = {
        grant_type: 'client_credentials',
        hint: 'pwdless_login',
        pwdless_login_token: parameters.pwdlessLoginToken,
        code_verifier: codeVerifier,
        ...(parameters.dnt && {dnt: parameters.dnt}),
    };
    return slasClient.getPasswordLessAccessToken({
        headers: {
        Authorization: authHeaderIdSecret,
        },
        parameters: {
            organizationId: slasClient.clientConfig.parameters.organizationId,
        },
        body: tokenBody,
    });
}
