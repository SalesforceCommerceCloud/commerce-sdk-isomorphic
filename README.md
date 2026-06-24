# commerce-sdk-isomorphic

This SDK provides a Browser & Node.js JavaScript client for calling [B2C Commerce Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/overview).

_For a Node.js only SDK that can also access Admin APIs checkout [Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk)._

## Documentation

An auto-generated [documentation site](https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/) provides comprehensive reference for all available endpoints and types across API classes. Following the v4.0.0 release, the underlying SDK file structure has been reorganized, introducing additional layers of imports/exports that may affect navigation.

### Navigating the Documentation

**For API Classes:**

1. **Accessing API Classes:** Click on the API class name (e.g., `shopperProducts`) on the right hand side
2. **Viewing Endpoints:** Scroll to the `Classes` section and click the corresponding API class link (e.g., `ShopperProducts`) to see available endpoints and their parameters
3. **Type Definitions:** Scroll to the `Type aliases` section for available types

**Utility Classes:** Utility classes and methods such as `clientConfig` and `helpers` maintain the same structure as previous versions.

**NOTES:** 

1. **Type Access**: API class types are accessible through the `<api_class>Types` namespace (e.g., `ShopperProductsTypes`). Individual types can be accessed as `ShopperProductsTypes.Product`.

2. **Type References**: The `References` section under API classes in the generated documentation may show duplicate entries. This occurs because types are exported both at their original definition and under the API class namespace. Both references point to the same underlying type definition.

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

### Migration off node-fetch

`node-fetch@2` is maintenance-only, and the upstream Node.js fix for the keep-alive regression (see [Node.js version compatibility](#nodejs-version-compatibility)) works around but does not remove the underlying `node-fetch` heuristic. A future release will replace `node-fetch` on the server path with the Node.js built-in `fetch` (available in Node 18 and later, which the SDK's current `^20.x`/`^22.x` requirement already satisfies). This will change how custom `agent` options work (built-in `fetch` is backed by undici and does not accept an `http.Agent`/`https.Agent`), and continue to honor a caller-supplied fetch via the [`fetch` client-config option](#custom-fetch-function).

## Getting Started

### Requirements

- Node `^20.x` or `^22.x`
- The SDK requires B2C Commerce API (SCAPI) to be configured. For more info see [Getting started with SCAPI](https://developer.salesforce.com/docs/commerce/commerce-api/guide/get-started.html).

### Node.js version compatibility

A regression in Node.js 24.17.0 and 22.23.0 caused libraries built on `node-fetch@2` to throw false `ERR_STREAM_PREMATURE_CLOSE` ("Premature close") errors when reusing keep-alive connections under load. The security fix in those releases added a listener to the socket `'data'` event, which `node-fetch@2` misreads as a truncated response ([nodejs/node#63989](https://github.com/nodejs/node/issues/63989)). It is most likely to surface on gzip-compressed, chunked responses such as large SCAPI product or search payloads.

> **Note:** commerce-sdk-isomorphic **is** affected on the server (Node.js) path, because it makes HTTP requests using `node-fetch@2`. Browser builds use the platform `fetch` and are not affected. (The companion [Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk), whose HTTP layer is `make-fetch-happen`, is not affected.)

To resolve it, upgrade to a Node.js release that contains the [upstream fix](https://github.com/nodejs/node/pull/64004): on the 24.x line use 24.18.0 or later (avoid 24.17.0); on the 22.x line use 22.23.1 or later (avoid 22.23.0). Versions before the regression (24.16.0 and earlier, 22.22.x and earlier) do not have this bug, but they also predate the security fix it shipped alongside, so upgrade forward rather than downgrading.

If you cannot change your Node.js version, avoid enabling keep-alive on the agent you pass through [`fetchOptions`](#fetch-options) (the bug only occurs when a pooled socket is reused). This removes connection pooling and adds a TLS handshake per request.

Newer "Current"-line releases (Node 26.x) that shipped the same security patch are affected as well. As of June 24, 2026 no fixed 26.x release had shipped; check the [Node 26.x changelog](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V26.md) for a release that contains the [upstream fix](https://github.com/nodejs/node/pull/64004). For production, prefer an LTS line (24.x or 22.x) on the fixed versions above.

References:

- Regression: [nodejs/node#63989](https://github.com/nodejs/node/issues/63989) · Upstream fix: [nodejs/node#64004](https://github.com/nodejs/node/pull/64004)
- Fixed releases: [v24.18.0](https://github.com/nodejs/node/releases/tag/v24.18.0), [v22.23.1](https://github.com/nodejs/node/releases/tag/v22.23.1)
- Underlying `node-fetch` issue (open): [node-fetch#1767](https://github.com/node-fetch/node-fetch/issues/1767)

### Installation

```bash
# This package uses yarn, if you don't have yarn:
# npm install -g yarn
yarn install commerce-sdk-isomorphic
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

const {access_token} = await helpers.loginGuestUser({
  slasClient: new ShopperLogin(config),
  parameters: {redirectURI: `${config.proxy}/callback`}
});

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

#### `throwOnMaintenanceHeader`

When `true`, the SDK automatically detects maintenance mode by checking the `sfdc_maintenance` response header. If the header value is `'system'` or `'site'`, the SDK throws a `MaintenanceError` with status 503. This is useful for handling scheduled maintenance windows and displaying appropriate messaging to users. By default, this flag is `false` for backwards compatibility.

```js
import {ShopperProducts, helpers} from 'commerce-sdk-isomorphic';
const {MaintenanceError} = helpers;

const config = {
  throwOnMaintenanceHeader: true,
  // rest of the config object...
};

const shopperProducts = new ShopperProducts(config);

// in an async function
try {
  const product = await shopperProducts.getProduct({
    parameters: {id: 'product-id'},
  });
} catch (e) {
  if (e instanceof MaintenanceError) {
    console.log(`Service in maintenance: ${e.maintenanceType}`); // 'system' or 'site'
    console.log(`Status: ${e.status}`); // 503
    // Display maintenance page to user
  } else {
    // Handle other errors
    console.error('API error:', e);
  }
}
```

**Note:** The maintenance check occurs before other error handling and applies even when using `rawResponse: true`.

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

#### Custom Fetch function

You can provide your own custom fetch function to intercept, log, or modify all SDK requests. This is useful for:
- **Request/Response Logging**: Track all API calls for debugging and monitoring
- **Request Interception**: Add custom headers, modify request URLs, or implement custom retry logic
- **Error Handling**: Add custom error processing or transformation before responses reach your application
- **Performance Monitoring**: Measure request/response times and track API performance metrics

**Example with Logging:**
```javascript
// Custom fetch function with detailed logging
const customFetch = async (url, options) => {
  console.log(`[SDK Request] ${options?.method || 'GET'} ${url}`);
  console.log('[SDK Request Headers]', options?.headers);
  if (options?.body) {
    console.log('[SDK Request Body]', options.body);
  }
  
  const startTime = Date.now();
  const response = await fetch(url, options);
  const duration = Date.now() - startTime;
  
  console.log(`[SDK Response] ${response.status} ${response.statusText} (${duration}ms)`);
  console.log('[SDK Response Headers]', Object.fromEntries(response.headers.entries()));
  
  return response;
};

const config = {
  parameters: {
    clientId: '<your-client-id>',
    organizationId: '<your-org-id>',
    shortCode: '<your-short-code>',
    siteId: '<your-site-id>',
  },
  fetch: customFetch,
};
```

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
    // No need to use `encodeURIComponent` as query parameters are single encoded by the SDK
    // So the SCAPI special characters will end up double encoded as well
    id: scapiSpecialEncodedId,
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
