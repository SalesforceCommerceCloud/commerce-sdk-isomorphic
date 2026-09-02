/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock';
import {ShopperDeliveryEstimates} from '../lib';

describe('ShopperDeliveryEstimates', () => {
  beforeEach(nock.cleanAll);

  it('serializes the delivery-estimates request parameters and headers', async () => {
    const scope = nock('https://SHORT_CODE.api.commercecloud.salesforce.com', {
      reqheaders: {
        authorization: 'Bearer token',
        'correlation-id': 'delivery-estimates-test',
        sfdc_usid: '550e8400-e29b-41d4-a716-446655440000',
        sfdc_dw_dnt: '1',
        sfdc_shopper_context: 'trusted-context',
      },
    })
      .get(
        '/product/shopper-delivery-estimates/v1/organizations/ORGANIZATION_ID/delivery-estimates'
      )
      .query({
        siteId: 'SITE_ID',
        productIds: 'sku-a',
        postalCode: '94105',
        countryCode: 'US',
        personalized: 'none',
      })
      .reply(200, {productDeliveryEstimates: []});

    const client = new ShopperDeliveryEstimates({
      parameters: {
        shortCode: 'SHORT_CODE',
        organizationId: 'ORGANIZATION_ID',
        siteId: 'SITE_ID',
      },
      headers: {
        authorization: 'Bearer token',
        'correlation-id': 'delivery-estimates-test',
      },
      throwOnBadResponse: true,
    });

    await client.getDeliveryEstimates({
      parameters: {
        productIds: ['sku-a'],
        postalCode: '94105',
        countryCode: 'US',
        personalized: 'none',
      },
      headers: {
        sfdc_usid: '550e8400-e29b-41d4-a716-446655440000',
        sfdc_dw_dnt: '1',
        sfdc_shopper_context: 'trusted-context',
      },
    });

    expect(scope.isDone()).toBe(true);
  });
});
