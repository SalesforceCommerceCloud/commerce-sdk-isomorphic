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
import {ShopperLogin} from '../../lib/shopperLogin';
import * as slasHelper from './slasHelper';
import {
  authorizePasswordless,
  getPasswordLessAccessToken,
} from './passwordlessHelper';

type slasHelperType = typeof slasHelper;
// Mock the module
jest.mock('./slasHelper', () => {
  const actualUtils = jest.requireActual<slasHelperType>('./slasHelper');
  const createCodeVerifierMock = jest.fn(() => 'code_verifier');
  return {
    ...actualUtils,
    createCodeVerifier: createCodeVerifierMock, // Mock the specific function
  };
});

const authorizePasswordlessCustomerMock = jest.fn();
const getPasswordLessAccessTokenMock = jest.fn();

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
    authorizePasswordlessCustomer: authorizePasswordlessCustomerMock,
    getPasswordLessAccessToken: getPasswordLessAccessTokenMock,
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

describe('authorizePasswordless is working', () => {
  test('Correct parameters are used to call SLAS Client authorize', async () => {
    const mockSlasClient = createMockSlasClient();
    const {clientId, organizationId, siteId} =
      mockSlasClient.clientConfig.parameters;

    const credentials = {
      clientSecret: 'slas_private_secret',
    };
    const parameters = {
      callbackURI: 'www.something.com/callback',
      usid: 'a_usid',
      userid: 'a_userid',
      locale: 'a_locale',
      mode: 'callback',
    };
    const authHeaderExpected = `Basic ${slasHelper.stringToBase64(
      `${clientId}:${credentials.clientSecret}`
    )}`;
    await authorizePasswordless(mockSlasClient, credentials, parameters);
    const expectedReqOptions = {
      headers: {
        Authorization: authHeaderExpected,
      },
      parameters: {
        organizationId,
      },
      body: {
        user_id: parameters.userid,
        mode: parameters.mode,
        locale: parameters.locale,
        channel_id: siteId,
        callback_uri: parameters.callbackURI,
        usid: parameters.usid,
      },
    };
    expect(authorizePasswordlessCustomerMock).toBeCalledWith(
      expectedReqOptions, 
      true
    );
  });
});

describe('getPasswordLessAccessToken is working', () => {
  test('Correct parameters are used to call SLAS Client authorize', async () => {
    const mockSlasClient = createMockSlasClient();
    const {clientId, organizationId} = mockSlasClient.clientConfig.parameters;

    const credentials = {
      clientSecret: 'slas_private_secret',
    };
    const parameters = {
      pwdlessLoginToken: '123456',
      dnt: '1',
    };
    const authHeaderExpected = `Basic ${slasHelper.stringToBase64(
      `${clientId}:${credentials.clientSecret}`
    )}`;
    await getPasswordLessAccessToken(mockSlasClient, credentials, parameters);
    const expectedReqOptions = {
      headers: {
        Authorization: authHeaderExpected,
      },
      parameters: {
        organizationId,
      },
      body: {
        dnt: parameters.dnt,
        code_verifier: 'code_verifier',
        grant_type: 'client_credentials',
        hint: 'pwdless_login',
        pwdless_login_token: parameters.pwdlessLoginToken,
      },
    };
    expect(getPasswordLessAccessTokenMock).toBeCalledWith(expectedReqOptions);
  });
});
