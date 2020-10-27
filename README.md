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

## License Information

The Commerce SDK for React is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.

<!-- Markdown link & img dfn's -->
[circleci-image]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-react.svg?style=svg&circle-token=c68cee5cb20ee75f00cbda1b0eec5b5484c58b2a
[circleci-url]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-react
