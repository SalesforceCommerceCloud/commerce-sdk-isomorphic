/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock';
// eslint-disable-next-line no-use-before-define
import React from 'react';
import {render} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import App from './App';
import config from '../config';

beforeEach(async () => {
  nock.cleanAll();
});

describe('environment > App', () => {
  it('renders without crashing', async () => {
    nock('https://localhost:3000')
    .get(`/shopper/auth/v1/organizations/${config.parameters.organizationId}/oauth2/authorize`)
    .query(true)
    .reply(
      200,
      {
        access_token: 'access_token'
      }
    );

    nock('https://localhost:3000')
    .post(`/shopper/auth/v1/organizations/${config.parameters.organizationId}/oauth2/token`)
    .reply(
      200,
    );

    // Specific response to be returned by search
    const mockSearchResponse = {
      limit: 1,
      hits: [
        {
          currency: 'USD',
          hitType: 'bundle',
          image: {
            alt: 'Playstation 3 Bundle, , large',
            disBaseLink:
              'https://localhost/on/demandware.static/-/Sites-electronics-m-catalog/default/dw794b23a6/images/large/sony-ps3-bundle.jpg',
            link: 'https://localhost/on/demandware.static/-/Sites-electronics-m-catalog/default/dw794b23a6/images/large/sony-ps3-bundle.jpg',
            title: 'Playstation 3 Bundle, ',
          },
          orderable: true,
          price: 449.0,
          productId: 'sony-ps3-bundleM',
          productName: 'Playstation 3 Bundle',
          productType: {
            bundle: true,
            option: true,
          },
          representedProduct: {
            id: 'sony-ps3-consoleM',
          },
          representedProducts: [
            {
              id: 'sony-ps3-consoleM',
            },
          ],
        },
      ],
      query: 'sony',
      offset: 0,
      total: 27,
    };

    nock('https://localhost:3000')
      .get(
        `/search/shopper-search/v1/organizations/${config.parameters.organizationId}/product-search?siteId=${config.parameters.siteId}&q=sony`
      )
      .reply(200, mockSearchResponse, {
        'content-type': 'application-json charset=UTF-8',
      });

    /**
     * `asFragment`:
     * @see https://testing-library.com/docs/react-testing-library/api#asfragment
     */
    const {asFragment, findByText} = render(<App />);

    /**
     * Basic snapshot test to make sure, that rendered component
     * matches expected footprint.
     */
    expect(await findByText('Playstation 3 Bundle'));
    expect(await findByText('sony-ps3-bundleM', {exact: false}));
    expect(asFragment()).toMatchSnapshot();
  });
});
