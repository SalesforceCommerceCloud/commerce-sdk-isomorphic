const originalModule = jest.requireActual('@commerce-apps/raml-toolkit');

const mockSearch = jest.fn((name, deployment) => {
  if (name === '"noResults"') {
      return Promise.resolve([]);
  }
  return [
    {
        id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-customers/0.0.23',
        name: 'Shopper Customers',
        description: 'Allow customers to manage their own profiles and product lists.',
        updatedDate: undefined,
        groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
        assetId: 'shopper-customers',
        version: '0.0.23',
        categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/e691d5473ba0bea7de3cddf93413ca7450b7b88b70f9f95ea987dfc4c1ca7af8.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143144Z&X-Amz-Expires=86400&X-Amz-Signature=7f7939d35335413531b9acd44ddeba268f387bed7f035d1d1c2e9cc00494950d&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-customers-0.0.23-raml.zip',
        createdDate: '2020-07-16T16:50:59.901Z',
        md5: 'b8d5da9ceb1b4ee43b9df23136b57a16',
        sha1: 'da9f4a08db954afdfbd38ea223b11ec0c8cafd93',
        mainFile: 'shopper-customers.raml'
        }
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
        'CC API Visibility': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/7ded055f1bafb773fcc3bb849c127c3e827e8abecc4731cbcf753c9a4a18c5d1.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143145Z&X-Amz-Expires=86400&X-Amz-Signature=fd38415b310ad8a482b94333ee3bf95563f091933d7cfa0d33f624f527e4b153&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-baskets-0.2.0-raml.zip',
        createdDate: '2020-08-24T14:52:29.191Z',
        md5: '7584cee65c375f4d088d2034b95aaf94',
        sha1: 'e3f91b2d7840d4aad5a8b094f0505bb0a54b842e',
        mainFile: 'shopper-baskets.raml'
        }
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
        'CC API Visibility': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/19abc83c01ed28a88ca0602247eda416f92fe465634a9881c0a6bd3a33410288.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143144Z&X-Amz-Expires=86400&X-Amz-Signature=f22ba7a6193d753df00bd06db3e206236fd9dc2d07ec4277fe1b1a279595302b&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-promotions-1.0.18-raml.zip',
        createdDate: '2020-07-31T01:43:46.017Z',
        md5: '407edbd3254193ac971f86654fe4ff08',
        sha1: '10dd9abe5d1b73ac45908566d3fdf5f88e7eb338',
        mainFile: 'shopper-promotions.raml'
        }
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
        'CC API Visibility': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/053a6ba28a4e54eab0814c821b4643a19e6609143ebee9d19f3ff54e8d983614.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143144Z&X-Amz-Expires=86400&X-Amz-Signature=3f39cd5f0362f5cdaa892742a992fa9220ad8894f2cd5a000faef32b7f92308b&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-gift-certificates-1.0.9-raml.zip',
        createdDate: '2020-07-31T01:38:22.653Z',
        md5: '1444f33f78ba55853db8065d7b59a355',
        sha1: '34cead614fa5aae4eca6f92dbe2bd588116741d0',
        mainFile: 'shopper-gift-certificates.raml'
        }
    },
    {
        id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-orders/0.0.27',
        name: 'Shopper Orders',
        description: 'Finish the shopper checkout experience resulting in an order.',
        updatedDate: undefined,
        groupId: '893f605e-10e2-423a-bdb4-f952f56eb6d8',
        assetId: 'shopper-orders',
        version: '0.0.27',
        categories: {
        'API layer': [Array],
        'CC API Family': [Array],
        'CC Version Status': [Array],
        'CC API Visibility': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/c3ac53800f622b5a1c8fa06c3060b02b0aa97f75a2d04c1c26a235996728bed3.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143144Z&X-Amz-Expires=86400&X-Amz-Signature=3abcd6f451d092ae92ae2681eba21125074c3633bf5d628e994d95168d52fe28&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-orders-0.0.27-raml.zip',
        createdDate: '2020-07-14T07:59:38.867Z',
        md5: '9bfb2ffb1f13490abb621a65f0aae8a9',
        sha1: '67782086e5b22529538531ddf6cd0560db3c8eef',
        mainFile: 'shopper-orders.raml'
        }
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
        'CC API Visibility': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/edcfe92a862a80cfbde3c0bd2c1907999028ecac087357bcfcb3251e75e41d51.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143144Z&X-Amz-Expires=86400&X-Amz-Signature=4531f58a51894629d3fb300f4506e7eed5f6ddc4468fa5ce9e3e447e711e03a4&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-search-1.0.23-raml.zip',
        createdDate: '2020-07-09T21:36:39.706Z',
        md5: 'b1121c3504a52f0047838b94b11ada6d',
        sha1: '39e0de3bd6bd15d9e8e5419072a3d3302d5ff879',
        mainFile: 'shopper-search.raml'
        }
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
        'CC API Visibility': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/684beca8f4728db3612a49494ecc44a1c153fc2cfd4923096ab0f8b78b9405ed.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143144Z&X-Amz-Expires=86400&X-Amz-Signature=f7de0a038cd132507dab1d0042572c496c2de3185b962c2895c7ff14a4e9a582&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-products-0.0.13-raml.zip',
        createdDate: '2020-06-23T16:20:46.015Z',
        md5: '3aaa7f75f4aa0df208071f67002eefe8',
        sha1: '3369b6e0ff45e55958d197d6d0745c2b4308e2b8',
        mainFile: 'shopper-products.raml'
        }
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
        'CC Version Status': [Array]
        },
        fatRaml: {
        classifier: 'fat-raml',
        packaging: 'zip',
        externalLink: 'https://exchange2-asset-manager-kprod.s3.amazonaws.com/893f605e-10e2-423a-bdb4-f952f56eb6d8/c7687e3a3b31fbfe2beb9acc4b4f05ca762c5873c0ced4a70cd493b963d29d24.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJTBQMSKYL2HXJA4A%2F20201001%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20201001T143144Z&X-Amz-Expires=86400&X-Amz-Signature=ef18ffe1d3545dd620e0ef23e85dab0b61c6267078590174d85a1ae3b94ac377&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3Dshopper-stores-1.0.6-raml.zip',
        createdDate: '2020-03-04T21:21:53.897Z',
        md5: '71c62720733e1628823724255b4309ac',
        sha1: 'd8b9baa92f3dd3f8d63b0732117422ce695c1226',
        mainFile: 'shopper-stores.raml'
        }
    }
    ];
});

const mockDownloadRestApis = jest.fn();

module.exports = {
  ...originalModule,
  download: {
    ...originalModule.download,
    downloadRestApis: mockDownloadRestApis,
    search: mockSearch
  }
};
