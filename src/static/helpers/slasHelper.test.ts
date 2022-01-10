/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as slasHelper from './slasHelper';
import {ShopperLogin} from '../../lib/shopperLogin';

const authenticateCustomerMock = jest.fn(() => ({
  url: 'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
}));

const authorizeCustomerMock = jest.fn(() => ({
  url: 'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
}));

const getAccessTokenMock = jest.fn(() => ({
  access_token: 'access_token',
}));

const logoutCustomerMock = jest.fn(() => ({
  token_response: 'token_response',
}));

const mockSlasClient = {
  clientConfig: {
    parameters: {
      organizationId: 'organization_id',
      clientId: 'client_id',
      siteId: 'site_id',
    },
  },
  authenticateCustomer: authenticateCustomerMock,
  authorizeCustomer: authorizeCustomerMock,
  getAccessToken: getAccessTokenMock,
  logoutCustomer: logoutCustomerMock,
} as unknown as ShopperLogin<{
  shortCode: string;
  organizationId: string;
  clientId: string;
  siteId: string;
}>;

const parameters = {
  codeVerifier: 'code_verifier',
  shopperUserId: 'shopper_user_id',
  shopperPassword: 'shopper_password',
  redirectURI: 'redirect_uri',
  refreshToken: 'refresh_token',
};

describe('Create code verifier', () => {
  test('creates string greater between 43 and 128 char per standard', () => {
    const verifier = slasHelper.createCodeVerifier();

    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });
});

describe('Generate code challenge', () => {
  const verifier =
    'XVv3DJSzPDdbcVsrcs-4KuUtMYhvd6fxS0Gtbu_gv-UaVKo80w8WKA1gitXhC-DMW0H_mOtUNJhecfTwb-n_dXQWz8Ay6iWZWoeSBPfwgzP_pblgQr4eqodqeYNxfdWv';
  const expectedChallenge = 'AH8WaHxbEtoZuFw-rw2YS9SazhKJilGoESoSlICXsQw';

  test('generates correct code challenge for verifier', async () => {
    const challenge = await slasHelper.generateCodeChallenge(verifier);
    expect(challenge).toBe(expectedChallenge);
  });
});

describe('Get code and usid', () => {
  const url =
    'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o';

  const expectedRecord = {
    code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
    url,
    usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
  };

  test('extracts code and usid from url', () => {
    const record = slasHelper.getCodeAndUsidFromUrl(url);
    expect(record).toStrictEqual(expectedRecord);
  });
});

describe('Authorize user', () => {
  const expectedCode = 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o';

  test('hits the authorize endpoint and receives authorization code', async () => {
    const authCode = (await slasHelper.authorize(mockSlasClient, parameters))
      .code;
    expect(authorizeCustomerMock).toHaveBeenCalled();
    expect(authCode).toBe(expectedCode);
  });
});

describe('Guest user flow', () => {
  const expectedOptions = {
    parameters: {
      client_id: 'client_id',
      code_challenge: expect.stringMatching(/./) as string,
      hint: 'guest',
      organizationId: 'organization_id',
      redirect_uri: 'redirect_uri',
      response_type: 'code',
    },
  };

  const expectedTokenBody = {
    body: {
      client_id: 'client_id',
      code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
      code_verifier: expect.stringMatching(/./) as string,
      grant_type: 'authorization_code_pkce',
      redirect_uri: 'redirect_uri',
      usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
    },
  };

  test('uses code challenge to generate auth code', async () => {
    await slasHelper.loginGuestUser(mockSlasClient, parameters);
    expect(authorizeCustomerMock).toBeCalledWith(expectedOptions, true);
  });

  test('uses auth code and code verifier to generate JWT', async () => {
    const accessToken = await slasHelper.loginGuestUser(
      mockSlasClient,
      parameters
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedTokenBody);
    expect(accessToken).toStrictEqual({access_token: 'access_token'});
  });
});
describe('Registered B2C user flow', () => {
  const base64regEx =
    /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

  const expectedOptions = {
    body: {
      channel_id: 'site_id',
      client_id: 'client_id',
      code_challenge: expect.stringMatching(/./) as string,
      redirect_uri: 'redirect_uri',
    },
    headers: {
      Authorization: 'Basic c2hvcHBlcl91c2VyX2lkOnNob3BwZXJfcGFzc3dvcmQ=', // must be base64 encoded
    },
    parameters: {
      organizationId: 'organization_id',
    },
  };

  const expectedTokenBody = {
    body: {
      client_id: 'client_id',
      code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
      code_verifier: expect.stringMatching(/./) as string,
      grant_type: 'authorization_code_pkce',
      organizationId: 'organization_id',
      redirect_uri: 'redirect_uri',
      usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
    },
  };

  test('uses code challenge and authorization header to generate auth code', async () => {
    await slasHelper.loginRegisteredUserB2C(mockSlasClient, parameters);
    // Authorization header must be base64 encoded
    expect(expectedOptions.headers.Authorization.split(' ')[1]).toMatch(
      base64regEx
    );
    expect(authenticateCustomerMock).toBeCalledWith(expectedOptions, true);
  });

  test('uses auth code and code verifier to generate JWT', async () => {
    const accessToken = await slasHelper.loginRegisteredUserB2C(
      mockSlasClient,
      parameters
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedTokenBody);
    expect(accessToken).toStrictEqual({access_token: 'access_token'});
  });
});

describe('Refresh Token', () => {
  const expectedToken = {access_token: 'access_token'};

  const expectedBody = {
    body: {
      client_id: 'client_id',
      grant_type: 'refresh_token',
      refresh_token: 'refresh_token',
    },
  };

  test('refreshes the token', () => {
    const token = slasHelper.refreshToken(mockSlasClient, parameters);
    expect(getAccessTokenMock).toBeCalledWith(expectedBody);
    expect(token).toStrictEqual(expectedToken);
  });
});

describe('Logout', () => {
  const expectedToken = {token_response: 'token_response'};

  const expectedOptions = {
    parameters: {
      client_id: 'client_id',
      channel_id: 'site_id',
      refresh_token: 'refresh_token',
    },
  };

  test('logs out the customer', () => {
    const token = slasHelper.logout(mockSlasClient, parameters);
    expect(logoutCustomerMock).toBeCalledWith(expectedOptions);
    expect(token).toStrictEqual(expectedToken);
  });
});
