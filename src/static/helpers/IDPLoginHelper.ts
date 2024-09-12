/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {stringToBase64, createCodeVerifier, authorize} from './slasHelper';
import {
  ShopperLogin,
  TokenRequest,
  TokenResponse,
} from '../../lib/shopperLogin';

/**
 * A single function to execute the ShopperLogin External IDP Login with proof key for code exchange flow as described in the [API documentation](https://developer.salesforce.com/docs/commerce/commerce-api/references?meta=shopper-login:Summary).
 * **Note**: this func can run on client side. Only use private slas when the slas client secret is secured.
 * @param slasClient a configured instance of the ShopperLogin SDK client.
 * @param credentials - the clientSecret (if applicable) to login with.
 * @param credentials.clientSecret? - secret associated with client ID
 * @param parameters - parameters to pass in the API calls.
 * @param parameters.redirectURI - Per OAuth standard, a valid app route. Must be listed in your SLAS configuration. On server, this will not be actually called. On browser, this will be called, but ignored.
 * @param parameters.hint - Name of an identity provider (IDP) to redirect to
 * @param parameters.usid? - Unique Shopper Identifier to enable personalization.
 * @param parameters.dnt? - Optional parameter to enable Do Not Track (DNT) for the user.
 * @returns TokenResponse
 */
async function loginIDPUser(
  slasClient: ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>,
  credentials: {
    clientSecret?: string;
  },
  parameters: {
    redirectURI: string;
    hint: string;
    usid?: string;
    dnt?: boolean;
  }
): Promise<TokenResponse> {
  const codeVerifier = createCodeVerifier();

  const authResponse = await authorize(slasClient, codeVerifier, {
    redirectURI: parameters.redirectURI,
    hint: parameters.hint,
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
    ...(parameters.dnt !== undefined && {dnt: parameters.dnt.toString()}),
  };

  // Using private client
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

  return slasClient.getAccessToken({body: tokenBody});
}

export default loginIDPUser;
