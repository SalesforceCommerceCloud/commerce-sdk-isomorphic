/**
 * @jest-environment node
 */
/* eslint header/header: "off" */
/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ShopperLogin, TokenResponse} from '../../lib/shopperLogin';
import * as slasHelper from './slasHelper';

const codeVerifier = 'code_verifier';

const credentials = {
  username: 'shopper_user_id',
  password: 'shopper_password',
};

const expectedTokenResponse: TokenResponse = {
  access_token: 'access_token',
  id_token: 'id_token',
  refresh_token: 'refresh_token',
  expires_in: 0,
  token_type: 'token_type',
  usid: 'usid',
  customer_id: 'customer_id',
  enc_user_id: 'enc_user_id',
};

const parameters = {
  redirectURI: 'redirect_uri',
  refreshToken: 'refresh_token',
  usid: 'usid',
};

const url =
  'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o';

const authenticateCustomerMock = jest.fn(() => ({url}));

const authorizeCustomerMock = jest.fn(() => ({url}));

const getAccessTokenMock = jest.fn(() => expectedTokenResponse);

const logoutCustomerMock = jest.fn(() => expectedTokenResponse);

const createMockSlasClient = () =>
  ({
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
  }>);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Create code verifier', () => {
  test('creates 128-character URL-safe string', () => {
    const verifier = slasHelper.createCodeVerifier();

    expect(verifier).toMatch(/[A-Za-z0-9_-]{128}/);
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
  const expectedRecord = {
    code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
    usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
  };

  const expectedNoQueryParamsRecord = {
    code: '',
    usid: '',
  };

  const noQueryParamsUrl = 'https://localhost:3000/callback?';

  test('extracts code and usid from url', () => {
    const record = slasHelper.getCodeAndUsidFromUrl(url);
    expect(record).toStrictEqual(expectedRecord);
  });

  test('evaluates code and usid as empty strings when called with no query params', () => {
    const record = slasHelper.getCodeAndUsidFromUrl(noQueryParamsUrl);
    expect(record).toStrictEqual(expectedNoQueryParamsRecord);
  });
});

describe('Authorize user', () => {
  const expectedAuthResponse = {
    code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
    url,
    usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
  };
  test('hits the authorize endpoint and receives authorization code', async () => {
    const authResponse = await slasHelper.authorize(
      createMockSlasClient(),
      codeVerifier,
      parameters
    );
    expect(authorizeCustomerMock).toHaveBeenCalled();
    expect(authResponse).toStrictEqual(expectedAuthResponse);
  });

  test('hits the authorize endpoint and does not receive authorization code', async () => {
    const mockSlasClient = createMockSlasClient();
    mockSlasClient.authorizeCustomer = jest.fn().mockResolvedValue({url: ''});
    await expect(
      slasHelper.authorize(mockSlasClient, codeVerifier, parameters)
    ).rejects.toThrow('Authorization failed');
  });
});

describe('Guest user flow', () => {
  const expectedOptions = {
    fetchOptions: {redirect: 'manual'},
    parameters: {
      client_id: 'client_id',
      code_challenge: expect.stringMatching(/./) as string,
      hint: 'guest',
      organizationId: 'organization_id',
      redirect_uri: 'redirect_uri',
      response_type: 'code',
      usid: 'usid',
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
    await slasHelper.loginGuestUser(createMockSlasClient(), parameters);
    expect(authorizeCustomerMock).toBeCalledWith(expectedOptions, true);
  });

  test('uses auth code and code verifier to generate JWT', async () => {
    const accessToken = await slasHelper.loginGuestUser(
      createMockSlasClient(),
      parameters
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedTokenBody);
    expect(accessToken).toStrictEqual(expectedTokenResponse);
  });
});
describe('Registered B2C user flow', () => {
  const expectedOptions = {
    body: {
      channel_id: 'site_id',
      client_id: 'client_id',
      code_challenge: expect.stringMatching(/./) as string,
      redirect_uri: 'redirect_uri',
      usid: 'usid',
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
    await slasHelper.loginRegisteredUserB2C(
      createMockSlasClient(),
      credentials,
      parameters
    );
    expect(authenticateCustomerMock).toBeCalledWith(expectedOptions, true);
  });

  test('uses auth code and code verifier to generate JWT', async () => {
    const accessToken = await slasHelper.loginRegisteredUserB2C(
      createMockSlasClient(),
      credentials,
      parameters
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedTokenBody);
    expect(accessToken).toStrictEqual(expectedTokenResponse);
  });
});

describe('Refresh Token', () => {
  const expectedBody = {
    body: {
      client_id: 'client_id',
      grant_type: 'refresh_token',
      refresh_token: 'refresh_token',
    },
  };

  test('refreshes the token', () => {
    const token = slasHelper.refreshAccessToken(
      createMockSlasClient(),
      parameters
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedBody);
    expect(token).toStrictEqual(expectedTokenResponse);
  });
});

describe('Logout', () => {
  const expectedOptions = {
    parameters: {
      client_id: 'client_id',
      channel_id: 'site_id',
      refresh_token: 'refresh_token',
    },
  };

  test('logs out the customer', () => {
    const token = slasHelper.logout(createMockSlasClient(), parameters);
    expect(logoutCustomerMock).toBeCalledWith(expectedOptions);
    expect(token).toStrictEqual(expectedTokenResponse);
  });
});
