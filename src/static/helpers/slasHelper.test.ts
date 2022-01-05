/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as slasHelper from './slasHelper';
import {ShopperLogin} from '../../lib/shopperLogin';

const authenticateCustomerMock = jest.fn(options => ({
  url: 'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
}));

const authorizeCustomerMock = jest.fn(options => ({
  url: 'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
}));

const getAccessTokenMock = jest.fn(options => ({access_token: 'access_token'})); // TODO: replace with proper access token

const mockSlasClient = {
  clientConfig: {
    parameters: {
      organizationId: '',
      clientId: '',
      siteId: '',
    },
  },
  authenticateCustomer: authenticateCustomerMock,
  authorizeCustomer: authorizeCustomerMock,
  getAccessToken: getAccessTokenMock,
} as unknown as ShopperLogin<{
  shortCode: string;
  organizationId: string;
  clientId: string;
  siteId: string;
}>;

const mockParameters = {
  codeVerifier: '',
  shopperUserId: 'shopperUserID',
  shopperPassword: 'shopperPassword',
  redirectURI: '',
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

  test('hits the authorize endpoint and recieves authorization code', async () => {
    const authCode = (
      await slasHelper.authorize(mockSlasClient, mockParameters)
    ).code;
    expect(authorizeCustomerMock).toHaveBeenCalled();
    expect(authCode).toBe(expectedCode);
  });
});

describe('Guest user flow', () => {
  test('uses code challenge to generate auth code', async () => {
    await slasHelper.loginGuestUser(mockSlasClient, mockParameters);

    // Pulling out the arguments to test
    const parametersArg = (
      authorizeCustomerMock.mock.calls[0][0] as Parameters<
        ShopperLogin<any>['authorizeCustomer'] // TODO: replace any with proper type
      >[0]
    )?.parameters;

    // required query parameters
    // expect(parametersArg?.hint).toBe('guest'); TODO: revise this line
    expect(parametersArg?.response_type).toBe('code');
    expect(parametersArg).toHaveProperty('client_id');
    expect(parametersArg).toHaveProperty('code_challenge');
    expect(parametersArg).toHaveProperty('redirect_uri');

    expect(authorizeCustomerMock).toBeCalled();
  });

  test('uses auth code and code verifier to generate JWT', async () => {
    const accessToken = await slasHelper.loginGuestUser(
      mockSlasClient,
      mockParameters
    );

    // Pulling out the arguments to test
    const tokenBodyArg = (
      getAccessTokenMock.mock.calls[0][0] as Parameters<
        ShopperLogin<any>['getAccessToken']
      >[0]
    ).body;

    // No authorization header is required
    // required query parameters
    expect(tokenBodyArg.grant_type).toBe('authorization_code_pkce');
    expect(tokenBodyArg).toHaveProperty('code_verifier');
    expect(tokenBodyArg).toHaveProperty('code');
    expect(tokenBodyArg).toHaveProperty('client_id');
    expect(tokenBodyArg).toHaveProperty('redirect_uri');

    expect(accessToken).toStrictEqual({access_token: 'access_token'});
  });
});
describe('Registered B2C user flow', () => {
  const base64regEx =
    /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

  test('uses code challenge and authorization header to generate auth code', async () => {
    await slasHelper.loginRegisteredUserB2C(mockSlasClient, mockParameters);

    // Pulling out the arguments to test
    const optionsArg = authenticateCustomerMock.mock.calls[0][0] as Parameters<
      ShopperLogin<any>['authenticateCustomer']
    >[0];

    // Authorization header must be base64 encoded
    expect(optionsArg.headers).toHaveProperty('Authorization');
    expect(optionsArg.headers?.Authorization?.split(' ')[1]).toMatch(
      base64regEx
    );

    // required query parameters
    expect(optionsArg.body).toHaveProperty('code_challenge');
    expect(optionsArg.body).toHaveProperty('channel_id');
    expect(optionsArg.body).toHaveProperty('client_id');
    expect(optionsArg.body).toHaveProperty('redirect_uri');

    expect(authenticateCustomerMock).toBeCalled();
  });

  test('uses auth code and code verifier to generate JWT', async () => {
    const accessToken = await slasHelper.loginRegisteredUserB2C(
      mockSlasClient,
      mockParameters
    );

    // Pulling out the arguments to test
    const tokenBodyArg = (
      getAccessTokenMock.mock.calls[0][0] as Parameters<
        ShopperLogin<any>['getAccessToken']
      >[0]
    ).body;

    // required query parameters
    expect(tokenBodyArg.grant_type).toBe('authorization_code_pkce');
    expect(tokenBodyArg).toHaveProperty('code_verifier');
    expect(tokenBodyArg).toHaveProperty('code');
    expect(tokenBodyArg).toHaveProperty('client_id');
    expect(tokenBodyArg).toHaveProperty('redirect_uri');

    expect(accessToken).toStrictEqual({access_token: 'access_token'});
  });
});
