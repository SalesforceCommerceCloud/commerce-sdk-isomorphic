# commerce-sdk-isomorphic

This SDK provides a Browser & Node.js JavaScript client for calling [B2C Commerce Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/overview).

_For a Node.js only SDK that can also access Admin APIs checkout [Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk)._

## Getting Started

### Requirements

- Node `^12.x`, `^14.x`, `^16.x`, `^18.x`
- The SDK requires B2C Commerce API (SCAPI) to be configured. For more info see [Getting started with SCAPI](https://developer.salesforce.com/docs/commerce/commerce-api/guide/get-started.html).

### Installation

```bash
npm install commerce-sdk-isomorphic
```

### Usage

```javascript
import {helpers, ShopperLogin, ShopperSearch} from 'commerce-sdk-isomorphic';

const config = {
  // SCAPI does not support CORS, so client side requests must use a reverse proxy.
  proxy: 'https://localhost:3000',
  parameters: {
    clientId: '<your-client-id>',
    organizationId: '<your-org-id>',
    shortCode: '<your-short-code>',
    siteId: '<your-site-id>',
  },
};

const {access_token} = await helpers.loginGuestUser(
  new ShopperLogin(config),
  {redirectURI: `${config.proxy}/callback`}
);

const shopperSearch = new ShopperSearch({
  ...config,
  headers: {authorization: `Bearer ${access_token}`},
});

const searchResult = await shopperSearch.productSearch({
  parameters: {q: 'shirt'},
});
```

#### Fetch Options

You can configure how the SDK makes requests using the `fetchOptions` parameter. It is passed to [node-fetch](https://github.com/node-fetch/node-fetch/1#api) on the server and [whatwg-fetch](https://github.github.io/fetch/) on browser.

```javascript
const https = require("https");

const config = {
  fetchOptions: {
    // By default, requests made using the SDK do not include cookies.
    credentials: "include",
    timeout: 2000,
    agent: new https.agent({ keepAlive: true }),
  },
};
```

For more info, refer to the [documentation site](https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/).

#### Additional Config Settings

* `headers`: Headers to include with API requests.
* `throwOnBadResponse`: When `true`, the SDK throws an `Error` on responses whose status is not 2xx or 304.

### Custom Query Parameters

You can pass custom query parameters through the SDK to be used in [B2C Commerce API Hooks](https://developer.salesforce.com/docs/commerce/commerce-api/guide/extensibility_via_hooks.html). Custom query parameters must begin with `c_`:

```javascript
const searchResult = await shopperSearch.productSearch({
  parameters: {
    q: 'shirt',
    c_paramkey: '<param-value>'
  },
});
```

Invalid query parameters that are not a part of the API and do not follow the `c_` custom query parameter convention are filtered from the request with a warning.

### Custom APIs

The SDK supports calling [B2C Commerce Custom APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/custom-apis.html) with a helper function, `callCustomEndpoint`:

```javascript
import pkg from "commerce-sdk-isomorphic";
const { helpers } = pkg;

const clientConfig = {
  parameters: {
    clientId: "<your-client-id>",
    organizationId: "<your-org-id>",
    shortCode: "<your-short-code>",
    siteId: "<your-site-id>",
  },
  // If not provided, it'll use the default production URI:
  // 'https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}'
  // path parameters should be wrapped in curly braces like the default production URI
  baseUri: "<your-base-uri>",
};

// Required params: apiName, endpointPath, shortCode, organizaitonId
// Required path params can be passed into:
// options.customApiPathParameters or clientConfig.parameters
const customApiPathParameters = {
  apiName: "loyalty-info",
  apiVersion: "v1", // defaults to v1 if not provided
  endpointPath: "customers",
};

const accessToken = "<INSERT ACCESS TOKEN HERE>";

await helpers.callCustomEndpoint({
  options: {
    method: "GET",
    parameters: {
      queryParameter: "queryParameter1",
    },
    headers: {
      // Content-Type is defaulted to application/json if not provided
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    customApiPathParameters,
  },
  clientConfig,
});

await helpers.callCustomEndpoint({
  options: {
    method: "POST",
    parameters: {
      queryParameter: "queryParameter1",
    },
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    customApiPathParameters,
    body: JSON.stringify({ data: "data" }),
  },
  clientConfig,
});
```

For more documentation about this helper function, please refer to the [commerce-sdk-isomorphic docs](https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/helpers.html).

## License Information

The Commerce SDK Isomorphic is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.
