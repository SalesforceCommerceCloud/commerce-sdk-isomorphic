# commerce-sdk-isomorphic

[![CircleCI][circleci-image]][circleci-url]

The Salesforce Commerce SDK Isomorphic allows easy interaction with the Salesforce B2C Commerce platform Shopper APIs through a lightweight SDK that works both on browsers and nodejs applications.  If you are looking for a more fully features SDK...' to "For a more robust SDK, which includes our B2C Data APIS and Shopper APIs, see [our Node.js Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk).

## Building

To create the SDK package:

```
# Install dependencies needed to run generation
$ yarn install

# Parse API files, render templates to src/lib folder and copy static files to src/lib
$ yarn run renderTemplates

# Launch sample application
$ yarn start

# Transpile and minify
$ yarn build:lib

# Run tests
$ yarn test
```

## Usage 

An example React App is available at `./src/environment/App` directory. To use the sample application, configure these parameters in `./src/environment/config.js` file.

> **Note:** These are required parameters.

| Parameter      | Description                                                                                                                             |
| -------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| clientId       | ID of the client account created with Salesforce Commerce.                                                                              |
| organizationId | The unique identifier for your Salesforce identity.                                                                                     |
| shortCode      | Region specific merchant ID.                                                                                                            |
| siteId         | A unique site ID (for example, RefArch or SiteGenesis).                                                                                 |

```javascript
/**
 * Configure required parameters
 * 
 * To learn more about the parameters please refer to https://developer.commercecloud.com/s/article/CommerceAPI-Get-Started
 */
// Create a configuration to use when creating API clients
const config = {
    proxy: 'https://localhost:3000',
    headers: {},
    parameters: {
      clientId: '<your-client-id>',
      organizationId: '<your-org-id>',
      shortCode: '<your-short-code>',
      siteId: '<your-site-id>'
    }
}
```
Launch the sample application using `yarn start`. Access the sample application using a new browser window at this url `localhost:3000`. 

### Advanced options

Commerce SDK Isomorphic supports advanced [Fetch API options](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) by a simple configuration. 
This sample code shows how to configure HTTP timeout and agent options in `./src/environment/config.js` file

```javascript
 /**
  * Configure advanced timeout and agent parameters
  * 
  * To learn more about the parameters please refer to https://developer.commercecloud.com/s/article/CommerceAPI-Get-Started
  */
 // Create a configuration to use when creating API clients
const https = require("https");

const config = {
    proxy: 'https://localhost:3000',
    headers: {},
    parameters: {
        clientId: '<your-client-id>',
        organizationId: '<your-org-id>',
        shortCode: '<your-short-code>',
        siteId: '<your-site-id>'
    },
    fetchOptions: {
      timeout: 2000, //request times out after 2 seconds
      agent: new https.agent({ // a custom http agent
        keepAlive: true
      })
    } 
}
 ```

## Testing

Two types of tests occur when running `yarn test`. First, unit tests are executed with jest including an enforced coverage level. This is all tests not contained within the sample app path of `src/environment`. If that passes, tests within the sample app path are executed using the `react-scripts` configuration. These allow for testing of the SDK within a sample React application.

## License Information

The Commerce SDK Isomorphic is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.

<!-- Markdown link & img dfn's -->
[circleci-image]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-isomorphic.svg?style=svg&circle-token=379eaa6f00e0840e10dd80585b2b045d02a8f3b7
[circleci-url]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-isomorphic
