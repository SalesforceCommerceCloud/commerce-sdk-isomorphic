# CHANGELOG

## v1.2.0
#### New API
*SLAS (Shopper Login & API Authentication Service) Administration* is now supported in the SDK

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
