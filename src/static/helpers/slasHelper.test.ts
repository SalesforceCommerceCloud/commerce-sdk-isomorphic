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
import * as slasHelper from './slasHelper';
import {stringToBase64} from './slasHelper';
import ResponseError from '../responseError';

const codeVerifier = 'code_verifier';

const credentials = {
  username: 'shopper_user_id',
  password: 'shopper_password',
};

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
    authenticateCustomer: authenticateCustomerMock,
    getAccessToken: getAccessTokenMock,
    logoutCustomer: logoutCustomerMock,
    generateCodeChallenge: generateCodeChallengeMock,
    authorizePasswordlessCustomer: authorizePasswordlessCustomerMock,
    getPasswordLessAccessToken: getPasswordLessAccessTokenMock,
  } as unknown as ShopperLogin<{
    shortCode: string;
    organizationId: string;
    clientId: string;
    siteId: string;
  }>);

const mockIsBrowserTrue = {
  isBrowser: true,
};

const mockIsBrowserFalse = {
  isBrowser: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  nock.cleanAll();
});

describe('Create code verifier', () => {
  test('creates 128-character URL-safe string', () => {
    const verifier = slasHelper.createCodeVerifier();

    expect(verifier).toMatch(/[A-Za-z0-9_-]{128}/);
  });
});

describe('Validate the right stringToBase64 function', () => {
  test('btoa runs when inBrowser is true', () => {
    jest.mock('./environment', () => mockIsBrowserTrue);
    expect(slasHelper.stringToBase64('example')).toBe('ZXhhbXBsZQ==');
  });

  test('Custom logic runs when inBrowser is false', () => {
    jest.mock('./environment', () => mockIsBrowserFalse);
    expect(stringToBase64('example')).toBe(
      Buffer.from('example').toString('base64')
    );
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
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

    // slasClient is copied and tries to make an actual API call
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .get(`/shopper/auth/v1/organizations/${organizationId}/oauth2/authorize`)
      .query(true)
      .reply(303, {response_body: 'response_body'}, {location: url});

    const authResponse = await slasHelper.authorize(
      mockSlasClient,
      codeVerifier,
      parameters
    );
    expect(authResponse).toStrictEqual(expectedAuthResponse);
  });

  test('throws error on SLAS callback error response', async () => {
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .get(`/shopper/auth/v1/organizations/${organizationId}/oauth2/authorize`)
      .query(true)
      .reply(303, undefined, {
        Location: '/callback?error=invalid_request',
      })
      .get('/callback?error=invalid_request')
      .reply(200);

    await expect(
      slasHelper.authorize(mockSlasClient, codeVerifier, parameters)
    ).rejects.toThrow(ResponseError);
  });
});

test('throws error on 400 response', async () => {
  const mockSlasClient = createMockSlasClient();
  const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

  nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
    .get(`/shopper/auth/v1/organizations/${organizationId}/oauth2/authorize`)
    .query(true)
    .reply(400, {response_body: 'response_body'}, {location: ''});

  await expect(
    slasHelper.authorize(mockSlasClient, codeVerifier, parameters)
  ).rejects.toThrow(ResponseError);
});

describe('Guest user flow', () => {
  test('retrieves usid and code from location header and generates an access token', async () => {
    const expectedTokenBody = {
      body: {
        client_id: 'client_id',
        channel_id: 'site_id',
        code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
        code_verifier: expect.stringMatching(/./) as string,
        grant_type: 'authorization_code_pkce',
        redirect_uri: 'redirect_uri',
        usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
        dnt: 'false',
      },
    };
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .get(`/shopper/auth/v1/organizations/${organizationId}/oauth2/authorize`)
      .query(true)
      .reply(303, {response_body: 'response_body'}, {location: url});

    const accessToken = await slasHelper.loginGuestUser(
      mockSlasClient,
      parameters
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedTokenBody);
    expect(accessToken).toBe(expectedTokenResponse);
  });

  test('generates an access token using slas private client', async () => {
    const mockSlasClient = createMockSlasClient();

    const accessToken = await slasHelper.loginGuestUserPrivate(
      mockSlasClient,
      parameters,
      credentialsPrivate
    );

    const expectedReqOptions = {
      headers: {
        Authorization: `Basic ${stringToBase64(
          `client_id:${credentialsPrivate.clientSecret}`
        )}`,
      },
      body: {
        grant_type: 'client_credentials',
        channel_id: 'site_id',
        usid: 'usid',
        dnt: 'false',
      },
    };
    expect(getAccessTokenMock).toBeCalledWith(expectedReqOptions);
    expect(accessToken).toBe(expectedTokenResponse);
  });

  test('throws an error when channel_id is not passed into private client', async () => {
    const mockSlasClient = createMockSlasClient();
    const mockSlasClientNoSiteID = {
      ...mockSlasClient,
      clientConfig: {
        parameters: {
          ...mockSlasClient.clientConfig.parameters,
          siteId: undefined, // siteId in client config is used for channel_id
        },
      },
    };

    await expect(
      slasHelper.loginGuestUserPrivate(
        // eslint-disable-next-line
        // @ts-ignore
        mockSlasClientNoSiteID,
        parameters,
        credentialsPrivate
      )
    ).rejects.toThrow(
      'Required argument channel_id is not provided through clientConfig.parameters.siteId'
    );
  });
});

describe('Registered B2C user flow', () => {
  const expectedTokenBody = {
    body: {
      client_id: 'client_id',
      channel_id: 'site_id',
      code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
      code_verifier: expect.stringMatching(/./) as string,
      grant_type: 'authorization_code_pkce',
      organizationId: 'organization_id',
      redirect_uri: 'redirect_uri',
      usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
      dnt: 'false',
    },
  };

  test('uses code challenge and authorization header to generate auth code with slas public client', async () => {
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

    // Mocking slasCopy.authenticateCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .post(`/shopper/auth/v1/organizations/${organizationId}/oauth2/login`)
      .reply(303, {response_body: 'response_body'}, {location: url});

    await slasHelper.loginRegisteredUserB2C(
      mockSlasClient,
      credentials,
      parameters
    );

    expect(getAccessTokenMock).toBeCalledWith(expectedTokenBody);
  });

  test('uses code challenge and authorization header to generate auth code with slas private client', async () => {
    const expectedReqOptions = {
      headers: {
        Authorization: `Basic ${stringToBase64(
          `client_id:${credentialsPrivate.clientSecret}`
        )}`,
      },
      body: {
        client_id: 'client_id',
        code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
        code_verifier: expect.stringMatching(/./) as string,
        grant_type: 'authorization_code_pkce',
        redirect_uri: 'redirect_uri',
        channel_id: 'site_id',
        organizationId: 'organization_id',
        usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
        dnt: 'false',
      },
    };
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;

    // Mocking slasCopy.authenticateCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .post(`/shopper/auth/v1/organizations/${organizationId}/oauth2/login`)
      .reply(303, {response_body: 'response_body'}, {location: url});

    await slasHelper.loginRegisteredUserB2C(
      mockSlasClient,
      credentialsPrivate,
      parameters
    );

    expect(getAccessTokenMock).toBeCalledWith(expectedReqOptions);
  });

  test('loginRegisteredUserB2C stops when authenticateCustomer returns 400', async () => {
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;
    // Mocking slasCopy.authenticateCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .post(`/shopper/auth/v1/organizations/${organizationId}/oauth2/login`)
      .reply(400, {message: 'Oh no!'});

    await expect(
      slasHelper.loginRegisteredUserB2C(mockSlasClient, credentials, parameters)
    ).rejects.toThrow(ResponseError);
  });

  test('loginRegisteredUserB2C stops when authenticateCustomer returns 401', async () => {
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;
    // Mocking slasCopy.authenticateCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .post(`/shopper/auth/v1/organizations/${organizationId}/oauth2/login`)
      .reply(401, {message: 'Oh no!'});

    await expect(
      slasHelper.loginRegisteredUserB2C(mockSlasClient, credentials, parameters)
    ).rejects.toThrow(ResponseError);
  });

  test('loginRegisteredUserB2C stops when authenticateCustomer returns 500', async () => {
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;
    // Mocking slasCopy.authenticateCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .post(`/shopper/auth/v1/organizations/${organizationId}/oauth2/login`)
      .reply(500, {message: 'Oh no!'});

    await expect(
      slasHelper.loginRegisteredUserB2C(mockSlasClient, credentials, parameters)
    ).rejects.toThrow(ResponseError);
  });

  test('loginRegisteredUserB2C does not stop when authenticateCustomer returns 303', async () => {
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;
    // Mocking slasCopy.authenticateCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .post(`/shopper/auth/v1/organizations/${organizationId}/oauth2/login`)
      .reply(303, {message: 'Oh yes!'});

    await expect(
      slasHelper.loginRegisteredUserB2C(mockSlasClient, credentials, parameters)
    ).resolves.not.toThrow(ResponseError);
  });

  test('uses auth code and code verifier to generate JWT with public client', async () => {
    // slasClient is copied and tries to make an actual API call
    const mockSlasClient = createMockSlasClient();
    const {shortCode, organizationId} = mockSlasClient.clientConfig.parameters;
    // Mocking slasCopy.authenticateCustomer
    nock(`https://${shortCode}.api.commercecloud.salesforce.com`)
      .post(`/shopper/auth/v1/organizations/${organizationId}/oauth2/login`)
      .reply(303, {response_body: 'response_body'}, {location: url});

    const accessToken = await slasHelper.loginRegisteredUserB2C(
      mockSlasClient,
      credentials,
      parameters
    );
    expect(accessToken).toStrictEqual(expectedTokenResponse);
  });
});

describe('authorizePasswordless is working', () => {
  test('Correct parameters are used to call SLAS Client authorize', async () => {
    const mockSlasClient = createMockSlasClient();
    const {clientId, organizationId, siteId} =
      mockSlasClient.clientConfig.parameters;

    const parametersAuthorizePasswordless = {
      callbackURI: 'www.something.com/callback',
      usid: 'a_usid',
      userid: 'a_userid',
      locale: 'a_locale',
      mode: 'callback',
    };
    const authHeaderExpected = `Basic ${slasHelper.stringToBase64(
      `${clientId}:${credentialsPrivate.clientSecret}`
    )}`;
    await slasHelper.authorizePasswordless(
      mockSlasClient,
      credentialsPrivate,
      parametersAuthorizePasswordless
    );
    const expectedReqOptions = {
      headers: {
        Authorization: authHeaderExpected,
      },
      parameters: {
        organizationId,
      },
      body: {
        user_id: parametersAuthorizePasswordless.userid,
        mode: parametersAuthorizePasswordless.mode,
        locale: parametersAuthorizePasswordless.locale,
        channel_id: siteId,
        callback_uri: parametersAuthorizePasswordless.callbackURI,
        usid: parametersAuthorizePasswordless.usid,
      },
    };
    expect(authorizePasswordlessCustomerMock).toBeCalledWith(
      expectedReqOptions,
      true
    );
  });
  test('Throw when required parameters missing', async () => {
    const mockSlasClient = {
      clientConfig: {
        parameters: {
          shortCode: 'short_code',
          organizationId: 'organization_id',
          clientId: 'client_id',
        },
      },
      authorizePasswordlessCustomer: authorizePasswordlessCustomerMock,
      getPasswordLessAccessToken: getPasswordLessAccessTokenMock,
    } as unknown as ShopperLogin<{
      shortCode: string;
      organizationId: string;
      clientId: string;
      siteId: string;
    }>;
    const parametersAuthorizePasswordless = {
      callbackURI: 'www.something.com/callback',
      usid: 'a_usid',
      userid: 'a_userid',
      locale: 'a_locale',
      mode: 'callback',
    };
    await expect(
      slasHelper.authorizePasswordless(
        mockSlasClient,
        credentialsPrivate,
        parametersAuthorizePasswordless
      )
    ).rejects.toThrow(
      'Required argument channel_id is not provided through clientConfig.parameters.siteId'
    );
  });
});

describe('getPasswordLessAccessToken is working', () => {
  test('Correct parameters are used to call SLAS Client helper', async () => {
    const mockSlasClient = createMockSlasClient();
    const {clientId, organizationId} = mockSlasClient.clientConfig.parameters;

    const parametersPasswordlessToken = {
      pwdlessLoginToken: '123456',
      dnt: '1',
    };
    const authHeaderExpected = `Basic ${slasHelper.stringToBase64(
      `${clientId}:${credentialsPrivate.clientSecret}`
    )}`;
    await slasHelper.getPasswordLessAccessToken(
      mockSlasClient,
      credentialsPrivate,
      parametersPasswordlessToken
    );
    const expectedReqOptions = {
      headers: {
        Authorization: authHeaderExpected,
      },
      parameters: {
        organizationId,
      },
      body: {
        dnt: parametersPasswordlessToken.dnt,
        code_verifier: expect.stringMatching(/./) as string,
        grant_type: 'client_credentials',
        hint: 'pwdless_login',
        pwdless_login_token: parametersPasswordlessToken.pwdlessLoginToken,
      },
    };
    expect(getPasswordLessAccessTokenMock).toBeCalledWith(expectedReqOptions);
  });
  test('Throw when required parameters missing', async () => {
    const mockSlasClient = {
      clientConfig: {
        parameters: {
          shortCode: 'short_code',
          clientId: 'client_id',
        },
      },
      authorizePasswordlessCustomer: authorizePasswordlessCustomerMock,
      getPasswordLessAccessToken: getPasswordLessAccessTokenMock,
    } as unknown as ShopperLogin<{
      shortCode: string;
      organizationId: string;
      clientId: string;
      siteId: string;
    }>;
    const parametersPasswordlessToken = {
      pwdlessLoginToken: '123456',
      dnt: '1',
    };
    await expect(
      slasHelper.getPasswordLessAccessToken(
        mockSlasClient,
        credentialsPrivate,
        parametersPasswordlessToken
      )
    ).rejects.toThrow(
      'Required argument organizationId is not provided through clientConfig.parameters.organizationId'
    );
  });
});

describe('Refresh Token', () => {
  test('refreshes the token with slas public client', () => {
    const expectedBody = {
      body: {
        client_id: 'client_id',
        channel_id: 'site_id',
        grant_type: 'refresh_token',
        refresh_token: 'refresh_token',
        dnt: 'false',
      },
    };
    const token = slasHelper.refreshAccessToken(
      createMockSlasClient(),
      parameters
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedBody);
    expect(token).toStrictEqual(expectedTokenResponse);
  });

  test('refreshes the token with slas private client', () => {
    const expectedReqOpts = {
      headers: {
        Authorization: `Basic ${stringToBase64(
          `client_id:${credentialsPrivate.clientSecret}`
        )}`,
      },
      body: {
        grant_type: 'refresh_token',
        client_id: 'client_id',
        channel_id: 'site_id',
        refresh_token: parameters.refreshToken,
        dnt: 'false',
      },
    };
    const token = slasHelper.refreshAccessToken(
      createMockSlasClient(),
      parameters,
      {
        clientSecret: credentialsPrivate.clientSecret,
      }
    );
    expect(getAccessTokenMock).toBeCalledWith(expectedReqOpts);
    expect(token).toStrictEqual(expectedTokenResponse);
  });
});

describe('Logout', () => {
  const expectedOptions = {
    headers: {
      Authorization: 'Bearer access_token',
    },
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
