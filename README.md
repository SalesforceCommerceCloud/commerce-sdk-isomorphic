# commerce-sdk-isomorphic

This SDK provides a Browser & Node.js JavaScript client for calling [B2C Commerce Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/overview).

_For a Node.js only SDK that can also access Admin APIs checkout [Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk)._

## :warning: Planned API Changes :warning:

### Shopper Context

Starting July 31st 2024, all endpoints in the Shopper context API will require the `siteId` parameter for new customers. This field is marked as optional for backward compatibility and will be changed to mandatory tentatively by January 2025. You can read more about the planned change [here](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-context?meta=Summary) in the notes section.

### Shopper Login (SLAS)

SLAS will soon require new tenants to pass `channel_id` as an argument for retrieving guest access tokens. You can read more about the planned change [here](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas.html#guest-tokens).

Please be aware that existing tenants are on a temporary allow list and will see no immediate disruption to service.  We do ask that all users seek to adhere to the `channel_id` requirement before the end of August to enhance your security posture before the holiday peak season.

In practice, we recommend:

- For customers using the SLAS helpers with a public client, it is recommended to upgrade to at least `v1.8.0` of the `commerce-sdk-isomorphic`.
- For customers using the SLAS helpers with a private client, it is recommended to upgrade to `v3.0.0` of the `commerce-sdk-isomorphic`.

## :warning: Planned SDK Changes :warning:

### Encoding path parameters

In the next major version release, the SDK will encode special characters (UTF-8 based on SCAPI guidelines) in path parameters by default. Please see the [Encoding special characters](#encoding-special-characters) section for more details.

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

#### `throwOnBadResponse`

When `true`, the SDK throws an `Error` on responses whose status is not 2xx or 304. By default, the value of this flag is `false` for backwards compatibility. Below is an example for accessing the error object via `e.response.json()`.

```js
const config = {
  throwOnBadResponse: true
  // rest of the config object...
};

const shopperSearch = new ShopperSearch({
  ...config
});

// in an async function
try {
  const searchResult = await shopperSearch.productSearch({
    parameters: { q: "shirt" },
  });
} catch (e) {
  const error = await e.response.json();
  console.log(error);
  // error is the JSON object - {error: ",,,"}
}
```

#### Additional Config Settings

* `headers`: Headers to include with API requests.

#### Custom Query Parameters

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

#### Custom APIs

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

#### Encoding special characters

The SDK currently single encodes special characters for query parameters in UTF-8 format based on SCAPI guidelines. However, the SDK does NOT encode path parameters, and will require the developer to encode any path parameters with special characters.

Additionally, SCAPI has special characters that should be double encoded, specifically `%` and `,`:
- `%` should always be double encoded
- `,` should be double encoded when used as part of an ID/parameter string, and single encoded when used to differentiate items in a list 

There is a helper function called `encodeSCAPISpecialCharacters` that can be utilized to single encode the SCAPI special characters and no other special characters.

Here's an example where the `getCategory/getCategories` endpoints are called with a `categoryID` with special characters:
```javascript
import pkg from "commerce-sdk-isomorphic";
const { helpers, ShopperProducts } = pkg;

const clientConfig = {
  parameters: {
    clientId: "<your-client-id>",
    organizationId: "<your-org-id>",
    shortCode: "<your-short-code>",
    siteId: "<your-site-id>",
  }
};

const shopperProducts = new ShopperProducts({
  ...clientConfig,
  headers: {authorization: `Bearer <insert_access_token>`}
});

const categoryId = "SpecialCharacter,%$^@&$;()!123Category";
// "SpecialCharacter%2C%25$^@&$;()!123Category"
const scapiSpecialEncodedId = helpers.encodeSCAPISpecialCharacters(categoryId);


// id is a path parameter for API call:
// <base-url>/product/shopper-products/v1/organizations/{organizationId}/categories/{id}
const categoryResult = await shopperProducts.getCategory({
  parameters: {
    // Path parameters are NOT encoded by the SDK, so we have to single encode special characters
    // and the SCAPI special characters will end up double encoded
    id: encodeURIComponent(scapiSpecialEncodedId),
  }
});

console.log("categoryResult: ", categoryResult);

// `ids` are a query parameter and comma delimited to separate category IDs
const categoriesResult = await shopperProducts.getCategories({
  parameters: {
    // No need to use `encodeURIComponent` as query parameters are single encoded by the SDK
    // So the SCAPI special characters will end up double encoded as well
    // Commas that separate items in a list will end up single encoded
    ids: `${scapiSpecialEncodedId},${scapiSpecialEncodedId}`,
  }
});

console.log("categoriesResult: ", categoriesResult);
```

**NOTE: In the next major version release, path parameters will be single encoded by default**

## License Information

The Commerce SDK Isomorphic is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.
