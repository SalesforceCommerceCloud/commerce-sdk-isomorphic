/**
 * @jest-environment node
 */
/* eslint header/header: "off", max-lines:"off" */
/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock';
import {ShopperLogin, TokenResponse} from '../../lib/shopperLogin';
import loginIDPUser from './IDPLoginHelper';
import {stringToBase64} from './slasHelper';
import ResponseError from '../responseError';

const credentialsPublic = {};

const credentialsPrivate = {
  username: 'shopper_user_id',
  password: 'shopper_password',
  clientSecret: 'slas_private_secret',
};

const expectedTokenResponse: TokenResponse = {
  access_token: 'access_token',
  id_token: 'id_token',
  refresh_token: 'refresh_token',
  expires_in: 0,
  refresh_token_expires_in: 0,
  token_type: 'token_type',
  usid: 'usid',
  customer_id: 'customer_id',
  enc_user_id: 'enc_user_id',
  idp_access_token: 'idp',
};

const parameters = {
  accessToken: 'access_token',
  redirectURI: 'redirect_uri',
  refreshToken: 'refresh_token',
  usid: 'usid',
  hint: 'hint',
  dnt: false,
};

const url =
  'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o';

const authenticateCustomerMock = jest.fn(() => ({url}));

const getAccessTokenMock = jest.fn(() => expectedTokenResponse);
const logoutCustomerMock = jest.fn(() => expectedTokenResponse);
const generateCodeChallengeMock = jest.fn(() => 'code_challenge');

const createMockSlasClient = () =>
  ({
    clientConfig: {
      parameters: {
        shortCode: 'short_code',
        organizationId: 'organization_id',
        clientId: 'client_id',
        siteId: 'site_id',
      },
    },
    authenticateCustomer: authenticateCustomerMock,
    getAccessToken: getAccessTokenMock,
    logoutCustomer: logoutCustomerMock,
    generateCodeChallenge: generateCodeChallengeMock,
  } as unknown as ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>);

beforeEach(() => {
  jest.clearAllMocks();
  nock.cleanAll();
});

describe('Social login user flow', () => {
  test('loginIDPUser does not stop when authorizeCustomer returns 303', async () => {
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

    // Mock authorizeCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .get(`/shopper/auth/v1/organizations/${organizationId}/oauth2/authorize`)
      .query(true)
      .reply(303, {message: 'Oh yes!'});

    await expect(
      loginIDPUser(mockSlasClient, credentialsPublic, parameters)
    ).resolves.not.toThrow(ResponseError);
  });

  test('generates an access token using slas private client', async () => {
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

    // Mock authorizeCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .get(`/shopper/auth/v1/organizations/${organizationId}/oauth2/authorize`)
      .query(true)
      .reply(303, {message: 'Oh yes!'});

    const accessToken = await loginIDPUser(
      mockSlasClient,
      credentialsPrivate,
      parameters
    );

    const expectedReqOptions = {
      headers: {
        Authorization: `Basic ${stringToBase64(
          `client_id:${credentialsPrivate.clientSecret}`
        )}`,
      },
      body: {
        grant_type: 'authorization_code_pkce',
        redirect_uri: 'redirect_uri',
        client_id: 'client_id',
        channel_id: 'site_id',
        usid: 'usid',
        code_verifier: expect.stringMatching(/./) as string,
        code: expect.any(String) as string,
        dnt: 'false',
      },
    };
    expect(getAccessTokenMock).toBeCalledWith(expectedReqOptions);
    expect(accessToken).toBe(expectedTokenResponse);
  })
});
