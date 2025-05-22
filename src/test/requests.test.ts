/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock';
import {BaseUriParameters} from 'lib/helpers';
import {
  ShopperLoginPathParameters,
  ShopperLoginQueryParameters,
  ShopperLogin,
} from '../lib/shopper-login';
import ClientConfig, {ClientConfigInit} from '../static/clientConfig';
import {ShopperBaskets} from '../lib/shopper-baskets';

const config: ClientConfigInit<
  ShopperLoginPathParameters &
    BaseUriParameters &
    ShopperLoginQueryParameters &
    Record<string, unknown>
> = {
  baseUri:
    'https://SHORT_CODE.api.commercecloud.salesforce.com/shopper/auth/v1',
  fetchOptions: {keepalive: false},
  headers: {authorization: 'token'},
  parameters: {
    shortCode: 'SHORT_CODE',
    organizationId: 'ORGANIZATION_ID',
  },
  transformRequest: ClientConfig.defaults.transformRequest,
  throwOnBadResponse: false,
};

describe('Requests with body', () => {
  beforeEach(nock.cleanAll);

  it('sends correct media type for urlencoded endpoints', async () => {
    const body = {
      token: 'TOKEN',
      token_type_hint: 'REFRESH_TOKEN',
    };
    const scope = nock(
      'https://SHORT_CODE.api.commercecloud.salesforce.com/shopper/auth/v1',
      {
        reqheaders: {'content-type': 'application/x-www-form-urlencoded'},
      }
    )
      .filteringRequestBody(requestBody => {
        // Putting the assertion here isn't ideal, but it's the only place I can find that nock
        // exposes the raw contents of the request body. (The body provided to `.post` has already
        // been parsed to an object, so we can't use that to detect the type.)
        expect(requestBody).toEqual(
          'token=TOKEN&token_type_hint=REFRESH_TOKEN'
        );
        return requestBody;
      })
      .post('/organizations/ORGANIZATION_ID/oauth2/revoke', body)
      .reply(200);

    const client = new ShopperLogin(config);
    await client.revokeToken({body});
    expect(scope.isDone()).toBe(true);
  });

  it('sends correct media type for JSON endpoints', async () => {
    const body = {query: 'pants'};
    const scope = nock('https://short_code.api.commercecloud.salesforce.com')
      .filteringRequestBody(requestBody => {
        expect(requestBody).toEqual('{"query":"pants"}');
        return requestBody;
      })
      .post('/shopper/auth/v1/organizations/ORGANIZATION_ID/baskets', body)
      .query({siteId: 'SITE_ID'})
      .matchHeader('Content-Type', 'application/json')
      .reply(200);

    const client = new ShopperBaskets(config);
    await client.createBasket({parameters: {siteId: 'SITE_ID'}, body});
    expect(scope.isDone()).toBe(true);
  });
});
