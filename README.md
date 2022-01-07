# commerce-sdk-isomorphic

[![CircleCI][circleci-image]][circleci-url]

The Salesforce Commerce SDK Isomorphic allows easy interaction with the Salesforce B2C Commerce platform Shopper APIs through a lightweight SDK that works both on browsers and nodejs applications. For a more robust SDK, which includes our B2C Data APIS and Shopper APIs, see [our Node.js Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk).

## Getting Started

### Requirements

- Node `^12.x`, `^14.x`, or `^16.x`

### Installation

```bash
npm install commerce-sdk-isomorphic
```

### Usage

> **Note:** These are required parameters.

| Parameter      | Description                                                |
| -------------- | :--------------------------------------------------------- |
| clientId       | ID of the client account created with Salesforce Commerce. |
| organizationId | The unique identifier for your Salesforce identity.        |
| shortCode      | Region specific merchant ID.                               |
| siteId         | A unique site ID (for example, RefArch or SiteGenesis).    |

```javascript
/**
 * Configure required parameters
 *
 * To learn more about the parameters please refer to https://developer.commercecloud.com/s/article/CommerceAPI-Get-Started
 */
import {helpers, ShopperLogin, ShopperSearch} from 'commerce-sdk-isomorphic';

// Create a configuration to use when creating API clients
const config = {
  proxy: 'https://localhost:3000', // Routes API calls through a proxy when set
  headers: {},
  parameters: {
    clientId: '<your-client-id>',
    organizationId: '<your-org-id>',
    shortCode: '<your-short-code>',
    siteId: '<your-site-id>',
  },
  throwOnBadResponse: true,
};

const shopperLogin = new ShopperLogin(config);
// Execute Public Client OAuth with PKCE to acquite guest tokens
const {access_token, refresh_token} = await helpers.loginGuestUser(
  shopperLogin,
  {redirectURI: `${config.proxy}/callback`} // Callback URL must be configured in SLAS Admin
);

const shopperSearch = new ShopperSearch(config);
shopperSearch.clientConfig.headers.authorization = `Bearer ${access_token}`;

const searchResult = await shopperSearch.productSearch({
  parameters: {q: 'shirt'},
});
```

### Advanced options

Commerce SDK Isomorphic supports advanced [Fetch API options](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) by a simple configuration.
This sample code shows how to configure HTTP timeout and agent options.

```javascript
/**
 * Configure advanced timeout and agent parameters
 *
 * To learn more about the parameters please refer to https://developer.commercecloud.com/s/article/CommerceAPI-Get-Started
 */
// Create a configuration to use when creating API clients
const https = require('https');

const config = {
  proxy: 'https://localhost:3000',
  headers: {},
  parameters: {
    clientId: '<your-client-id>',
    organizationId: '<your-org-id>',
    shortCode: '<your-short-code>',
    siteId: '<your-site-id>',
  },
  fetchOptions: {
    timeout: 2000, //request times out after 2 seconds
    agent: new https.agent({
      // a custom http agent
      keepAlive: true,
    }),
  },
};
```

### Additional Config Settings

_throwOnBadResponse:_ Default value is false. When set to true, the sdk will throw an Error on responses with statuses that are not 2xx or 304.

### Public Client Shopper Login helpers

A collection of helper functions are available in this SDK to simply [Public
Client Shopper Login OAuth
flows](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice#public-client-use-cases). See sample code above for guest login.

## License Information

The Commerce SDK Isomorphic is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.

<!-- Markdown link & img dfn's -->

[circleci-image]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-isomorphic.svg?style=svg&circle-token=379eaa6f00e0840e10dd80585b2b045d02a8f3b7
[circleci-url]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-isomorphic
