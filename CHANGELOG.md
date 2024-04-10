# CHANGELOG

## v1.13.1

#### Bug fixes

- Fix the missing `offset` and `limit` paramters in Shopper Search

## v1.13.0
- Update APIs for [Shopper Search](https://developer.salesforce.com/docs/commerce/commerce-api/references/about-commerce-api/about.html#282024)

## v1.12.0

#### API Added

  | **Endpoint Name** | **Description** |
  | ------------- |-------------|
  |getUrlMapping | Gets URL mapping information for a URL that a shopper clicked or typed in. The mapping information is based on URL rules and redirects set up in Business Manager. For more information about prerequisites and sample usage, see [URL Resolution](/docs/commerce/commerce-api/guide/url-resolution.html). You can customize the behavior of this endpoint by using hooks. See the hooks for getUrlMapping in the [Hook List](https://developer.salesforce.com/docs/commerce/commerce-api/guide/hook_list.html). |

## v1.11.0

#### Enhancements

* Add support for Shopper Login (SLAS) prviate client with helper functions [#148](https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/pull/140)
  * ⚠️ WARNING ⚠️: Users should be extremely cautious about using the SLAS private client helper functions in the browser as it can expose your client secret 
* Add support for custom query parameters [#139](https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/pull/139)

## v1.10.4

#### Bug fixes

- Mark `expand` query parameter for `getProduct` endpoint as optional instead of required

## v1.10.3

#### Bug fixes

- Fix `expand` query parameter for `shopper-products`
- Remove `retrieveCredQualityUserInfo` endpoint from `shopper-login` as this functionality was removed from SLAS

## v1.10.2

#### Documentation
- Descriptions for certain `shopper-login` and `shopper-context` operations have been updated on [generated documentation site](https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/)

## v1.10.1

#### Bug fixes

- The 'To is not a function' [issue](https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/issues/122) is fixed.

## v1.10.0

#### Enhancements

- Cookies are disabled by default.
- The cross-fetch dependency has been removed. Now commerce-sdk-isomorphic uses native fetch in browser and node-fetch library in node. This has potential impact for client implementations. Passing `fetchOptions: {redirect: 'manual'}` as called on the server-side to prevent following of redirects prior to this upgrade had no effect on the client because `cross-fetch` used `XMLHttpRequest` and was silently ignored. The new approach respects this `redirect: 'manual'` directive, potentially causing redirects on the client (given these optional parameters) to not be followed, which breaks flows including the SLAS `authorizeCustomer` method, which could fail with an `opaqueredirect` error.

#### API Added

*Shopper Baskets*

* New Endpoints

  | **Endpoint Name** | **Description** |
  | ------------- |-------------|
  | updateAsAgentBasket | Marks a basket as an agent basket. |
  | addPriceAdjustmentToBasket | Adds a custom manual price adjustment to the basket. |
  | removePriceAdjustmentFromBasket | Removes a custom manual price adjustment from the basket. |
  | updatePriceAdjustmentInBasket | Updates a custom manual price adjustment on the basket. |
  | updateAsStorefrontBasket | Marks a basket as a storefront basket. |

## v1.9.0

### API Added

* The [Shopper Experience](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=Summary) API has been added to the SDK.

## v1.8.0

#### API Changes

*Shopper Login*

* New Endpoints

  | **Endpoint Name** | **Description** |
  | ------------- |-------------|
  | getSessionBridgeAccessToken | Get a shopper JWT access token for a registered customer using session bridge |
  | getTrustedAgentAuthorizationToken | Obtains a new agent on behalf authorization token for a registered customer |
  | getTrustedAgentAccessToken | Get a shopper JWT access token for a registered customer using a trusted agent (Merchant) |

#### Enhancements

* SLAS helpers support the `channel_id` (`siteId`) parameter

## v1.7.1

#### Bug fixes

* Fix SLAS callback error handling
* Fix SLAS logout function

## v1.7.0

* Export API type definitions. They are available as top-level exports, following the pattern `<API Name>Types`.

Example usage:

```typescript
import {ShopperBaskets, ShopperBasketsTypes} from "commerce-sdk-isomorphic"

const basketsClient = new ShopperBaskets(config)
const basket: ShopperBasketsTypes.Basket = await basketsClient.getBasket({ basketId: "some-basket" })
```

## v1.6.0

#### API Changes

*Shopper Login*

* New Endpoints

  | **Endpoint Name** | **Description** |
  | ------------- |-------------|
  | getPasswordResetToken | Request a reset password token |
  | resetPassword | Creates a new password |

#### Enchancements

* More error handling has been added in the SLAS helpers

#### Bug fixes

* SLAS helper `loginRegisteredUserB2C` no longer calls `redirectURI` when running server side

#### Documentation

* `README` updated to explicitly note lack of CORS support for SCAPI

## v1.5.2

### New Features

* If the `throwOnBadResponse` flag is set, the error thrown now includes the full HTTP response object.

### Bug Fixes

* An error about invalid user-agent is no longer printed to console when making requests in a browser.

## v1.5.1

#### Documentation

* Replaced links to the [Commerce Cloud Developer Center](https://developer.commercecloud.com/s/salesforce-developer-center) with links to the new [Salesforce Developer Portal](https://developer.salesforce.com/docs/commerce/commerce-api).

#### Bug Fixes

* SLAS Login Helper no longer requests `redirect_uri` when running server-side

## v1.5.0

#### New Features

* SLAS helper functions have been added.
* New client configuration setting `throwOnBadResponse`. When set to true, responses other than `2xx` and `304` will throw an error.

#### New APIs

* *Shopper Context* has been added to the SDK.

#### API Changes

*Shopper Login*

* New Endpoints

  | **Endpoint Name** | **Description** |
  | ------------- |-------------|
  | authorizePasswordlessCustomer | Logs a customer in using Core with their customer profiles loaded in ECOM. Allows the user to authenticate when their identity provider (Core) is down. |
  | getPasswordLessAccessToken | Evaluate the `pwdless_token` and issue the shopper token (JWT). |

#### Bug Fixes

* Added support for `application/x-www-form-urlencoded` request bodies.
  * SLAS endpoints now work out of the box

## v1.4.0

#### New Features

* TypeScript type definitions are now exported! :tada:
* Any parameter for any method can now be specified in the client configuration.
  * Parameters not used by an endpoint will now be ignored, rather than included.
* A custom user agent is now sent with requests (node.js only)

#### API Changes

*Shopper Baskets*

* New endpoints

| **Endpoint Name** | **Description** |
| ------------- |-------------|
| transferBasket | Transfer the previous shopper's basket to the current shopper by updating the basket's owner. No other values change. You must obtain the shopper authorization token via SLAS, and it must contain both the previous and current shopper IDs. |
| mergeBasket | Merge data from the previous shopper's basket into the current shopper's active basket and delete the previous shopper's basket. This endpoint doesn't merge Personally Identifiable Information (PII). You must obtain the shopper authorization token via SLAS, and it must contain both the previous and current shopper IDs. After the merge, all basket amounts are recalculated and totaled, including lookups for prices, taxes, shipping, and promotions. |
| updatePaymentInstrumentInBasket | Success, the response body contains the basket with the updated payment instrument. |

*Shopper Login*

* New endpoints

| **Endpoint Name** | **Description** |
| ------------- |-------------|
| retrieveCredQualityUserInfo | Retrieve credential quality statistics for a user. |

## v1.3.0

#### New APIs

* *Shopper Discovery Search* has been added to the SDK.

#### API Changes

*Shopper Login*

* New operation: `getTrustedSystemAccessToken`

## v1.2.0

#### API Changes

*Shopper Customers*

* New operations
  * registerExternalProfile
  * getExternalProfile

## v1.1.2

* Fixed issue causing endpoints that accept array values to not properly set `Content-Type` header to `application/json`.

## v1.1.1

* Fixed issue causing `shortCode` to not be properly set

## v1.1.0

#### **API Changes**

*Shopper Baskets API*

* Endpoint Added
  * organizations/{organizationId}/baskets/{basketId}/price-books

*Shopper Login API*

* Endpoint Added
  * organizations/{organizationId}/oauth2/logout
* customer_id and enc_user_id were added to the TokenResponse type
* LoginRequest type was added
* Query param uuid for /organizations/{organizationId}/oauth2/authorize was renamed to usid
