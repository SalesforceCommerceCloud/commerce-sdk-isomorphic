/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const originalModule = jest.requireActual('@commerce-apps/raml-toolkit');

const mockSearch = jest.fn(name => {
  if (name === '"noResults"') {
    return Promise.resolve([]);
  }
  return [
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-customers/0.0.23',
      name: 'Shopper Customers',
      description:
        'Allow customers to manage their own profiles and product lists.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-customers',
      version: '0.0.23',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-07-16T16:50:59.901Z',
        md5: 'b8d5da9ceb1b4ee43b9df23136b57a16',
        sha1: 'da9f4a08db954afdfbd38ea223b11ec0c8cafd93',
        mainFile: 'shopper-customers.raml',
      },
    },
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets/0.2.0',
      name: 'Shopper Baskets',
      description: 'Build a checkout experience.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-baskets',
      version: '0.2.0',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-08-24T14:52:29.191Z',
        md5: '7584cee65c375f4d088d2034b95aaf94',
        sha1: 'e3f91b2d7840d4aad5a8b094f0505bb0a54b842e',
        mainFile: 'shopper-baskets.raml',
      },
    },
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-promotions/1.0.18',
      name: 'Shopper Promotions',
      description: 'View details for active promotions.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-promotions',
      version: '1.0.18',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-07-31T01:43:46.017Z',
        md5: '407edbd3254193ac971f86654fe4ff08',
        sha1: '10dd9abe5d1b73ac45908566d3fdf5f88e7eb338',
        mainFile: 'shopper-promotions.raml',
      },
    },
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-gift-certificates/1.0.9',
      name: 'Shopper Gift Certificates',
      description: 'Obtain details about a gift certificate.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-gift-certificates',
      version: '1.0.9',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-07-31T01:38:22.653Z',
        md5: '1444f33f78ba55853db8065d7b59a355',
        sha1: '34cead614fa5aae4eca6f92dbe2bd588116741d0',
        mainFile: 'shopper-gift-certificates.raml',
      },
    },
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-orders/0.0.27',
      name: 'Shopper Orders',
      description:
        'Finish the shopper checkout experience resulting in an order.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-orders',
      version: '0.0.27',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-07-14T07:59:38.867Z',
        md5: '9bfb2ffb1f13490abb621a65f0aae8a9',
        sha1: '67782086e5b22529538531ddf6cd0560db3c8eef',
        mainFile: 'shopper-orders.raml',
      },
    },
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-search/1.0.23',
      name: 'Shopper Search',
      description: 'Search for products and provide search suggestions.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-search',
      version: '1.0.23',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-07-09T21:36:39.706Z',
        md5: 'b1121c3504a52f0047838b94b11ada6d',
        sha1: '39e0de3bd6bd15d9e8e5419072a3d3302d5ff879',
        mainFile: 'shopper-search.raml',
      },
    },
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-products/0.0.13',
      name: 'Shopper Products',
      description: 'Display product details across your storefront.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-products',
      version: '0.0.13',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-06-23T16:20:46.015Z',
        md5: '3aaa7f75f4aa0df208071f67002eefe8',
        sha1: '3369b6e0ff45e55958d197d6d0745c2b4308e2b8',
        mainFile: 'shopper-products.raml',
      },
    },
    {
      id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-stores/1.0.6',
      name: 'Shopper Stores',
      description: 'Search for a specific store or stores in an area.',
      updatedDate: undefined,
      groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
      assetId: 'shopper-stores',
      version: '1.0.6',
      categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
      },
      fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://short.url/test',
        createdDate: '2020-03-04T21:21:53.897Z',
        md5: '71c62720733e1628823724255b4309ac',
        sha1: 'd8b9baa92f3dd3f8d63b0732117422ce695c1226',
        mainFile: 'shopper-stores.raml',
      },
    },
  ];
});

const mockDownloadRestApis = jest.fn();

module.exports = {
  ...originalModule,
  download: {
    ...originalModule.download,
    downloadRestApis: mockDownloadRestApis,
    search: mockSearch,
  },
};
