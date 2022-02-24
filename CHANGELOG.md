# CHANGELOG

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
  - SLAS endpoints now work out of the box
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
