# commerce-sdk-react

[![CircleCI][circleci-image]][circleci-url]

The Salesforce Commerce SDK for React allows easy interaction with the Salesforce B2C Commerce platform Shopper APIs.

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

Commerce SDK React supports advanced [Fetch API options](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) by a simple configuration. 
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
### ECMAScript Modules

Applications that run on Node.js v13 and above can import commerce-sdk-react as [ECMAScript Modules](https://nodejs.org/docs/latest-v13.x/api/esm.html#esm_ecmascript_modules). 
You can import the SDK using `import CommerceSdkReact from "commerce-sdk-react";` syntax on Node.js v13 and above. Node will treat the files ending with `.mjs` as ES module by default or when the nearest parent package.json file contains a top-level field "type" with a value of "module". 
Refer to [Enabling ECMAScript Modules](https://nodejs.org/docs/latest-v13.x/api/esm.html#esm_enabling) for additional information to enable ES module support.

For Node.js v12 and below only `require` is supported. 

## Testing

Two types of tests occur when running `yarn test`. First, unit tests are executed with jest including an enforced coverage level. This is all tests not contained within the sample app path of `src/environment`. If that passes, tests within the sample app path are executed using the `react-scripts` configuration. These allow for testing of the SDK within a sample React application.

## License Information

The Commerce SDK for React is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.

<!-- Markdown link & img dfn's -->
[circleci-image]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-react.svg?style=svg&circle-token=379eaa6f00e0840e10dd80585b2b045d02a8f3b7
[circleci-url]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-react
