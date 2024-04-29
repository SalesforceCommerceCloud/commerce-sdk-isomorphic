# commerce-sdk-isomorphic

The Salesforce Commerce SDK (Isomorphic) allows easy interaction with the B2C Commerce platform’s Shopper APIs on the Node.js runtime and works both in browsers and Node applications. For a Node-based SDK that can access the Admin APIs in addition to the Shopper APIs, see the main [Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk). 

## Getting Started

### Requirements

- Node `^12.x`, `^14.x`, `^16.x`, `^18.x` or `^20.x`


### Installation

```bash
npm install commerce-sdk-isomorphic
```

### Usage

> **Note:** These are required parameters.

| Parameter      | Description                                                                |
| -------------- | :------------------------------------------------------------------------- |
| clientId       | ID of the client account created with Salesforce Commerce.                 |
| organizationId | The unique identifier for your Salesforce identity.                        |
| shortCode      | Region-specific merchant ID.                                               |
| siteId         | Name of the site to access data from, for example, RefArch or SiteGenesis. |


### Configure the Isomorphic SDK


```javascript
/**
 * Configure required parameters
 *
 * To learn more about the parameters please refer to https://developer.salesforce.com/docs/commerce/commerce-api/guide/get-started.html
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
// Execute Public Client OAuth with PKCE to acquire guest tokens
const {access_token, refresh_token} = await helpers.loginGuestUser(
  shopperLogin,
  {redirectURI: `${config.proxy}/callback`} // Callback URL must be configured in SLAS Admin
);

// Execute Private Client OAuth with PKCE to acquire guest tokens
// ***WARNING*** Be cautious about using this function in the browser as you may end up exposing your client secret
// only use it when you know your slas client secret is secured
// const {access_token, refresh_token} = await helpers.loginGuestUserPrivate(
//   shopperLogin,
//   {}, {clientSecret: '<your-slas-client-secret>'}
// );

const shopperSearch = new ShopperSearch({
  ...config,
  headers: {authorization: `Bearer ${access_token}`},
});

const searchResult = await shopperSearch.productSearch({
  parameters: {q: 'shirt'},
});
```

#### CORS

The Salesforce Commerce API (SCAPI) does not support CORS, so a proxy must be used to be able to use the SDK.

### Advanced Options

Commerce SDK Isomorphic supports Fetch API options for [node-fetch](https://github.com/node-fetch/node-fetch/1#api) on server and [whatwg-fetch](https://github.github.io/fetch/) on browser with a simple configuration.
This sample code shows how to configure HTTP timeout and agent options.

```javascript
/**
 * Configure advanced timeout and agent parameters
 *
 * To learn more about the parameters please refer to the [Salesforce Developer Center](https://developer.salesforce.com/docs/commerce/commerce-api).
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

_headers:_ A collection of key/value string pairs representing additional headers to include with API requests.

_throwOnBadResponse:_ Default value is false. When set to true, the SDK throws an Error on responses with statuses that are not 2xx or 304.

### Public/Private Client Shopper Login (SLAS) helpers

A collection of helper functions are available in this SDK to simplify [Public/Private Client Shopper Login OAuth flows](https://developer.salesforce.com/docs/commerce/commerce-api/references?meta=shopper-login:Summary). See sample code above for guest login.

**⚠️ WARNING ⚠️**
Users should be extremely cautious about using the SLAS private client helper functions in the browser as it can expose your client secret. Ensure that your client secret is secured before running the function client side.

### Custom Query Parameters

With the introduction of [hooks for Commerce APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/extensibility_via_hooks.html), customers can pass custom query parameters through the SDK to be used in their custom hook. Custom query parameters must begin with `c_`:

```javascript
const searchResult = await shopperSearch.productSearch({
  parameters: {
    q: 'shirt',
    c_paramkey: '<param-value>'
  },
});
```

Invalid query parameters that are not a part of the API and do not follow the `c_` custom query parameter convention will be filtered from the request and a warning will be displayed.

### Custom APIs

The SDK supports calling [custom APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/custom-apis.html) with a helper function, `callCustomEndpoint`.

Example usage:

```javascript
import pkg from 'commerce-sdk-isomorphic';
const { helpers } = pkg;

// client configuration parameters
const clientConfigExample = {
  parameters: {
    clientId: "<your-client-id>",
    organizationId: "<your-org-id>",
    shortCode: "<your-short-code>",
    siteId: "<your-site-id>",
  }
};

// Required params: apiName, endpointPath, shortCode, organizaitonId
// Required path params can be passed into:
// options.customApiPathParameters or clientConfig.parameters
const customApiArgs = { 
  apiName: 'loyalty-info',
  apiVersion: 'v1', // defaults to v1 if not provided
  endpointPath: 'customers'
}

const accessToken = '<INSERT ACCESS TOKEN HERE>';

let getResponse = await helpers.callCustomEndpoint({
  options: {
    method: 'GET',
    parameters: {
      queryParameter: 'queryParameter1',
    },
    headers: {
      // Content-Type is defaulted to application/json if not provided
      'Content-Type': 'application/json',
      authorization: `Bearer ${access_token}`
    },
    customApiPathParameters: customApiArgs
  }, 
  clientConfig: clientConfigExample,
  // Flag to retrieve raw response or data from helper function
  rawResponse: false, 
})

let postResponse = await helpers.callCustomEndpoint({
  options: {
    method: 'POST',
    parameters: {
      queryParameter: 'queryParameter1',
    },
    headers: {
      authorization: `Bearer ${access_token}`
    },
    customApiPathParameters: customApiArgs,
    body: JSON.stringify({ data: 'data' })
  }, 
  clientConfig: clientConfigExample,
  // Flag to retrieve raw response or data from helper function
  rawResponse: false, 
})

console.log('get response: ', getResponse)
console.log('post response: ', postResponse)
```

For more documentation about this helper function, please refer to the [commerce-sdk-isomorphic docs](https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/helpers.html).

For more information about custom APIs, please refer to the [Salesforce Developer Docs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/custom-apis.html)

## License Information

The Commerce SDK Isomorphic is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.
