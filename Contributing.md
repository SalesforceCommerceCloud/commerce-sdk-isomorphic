# Contributing to commerce-sdk-isomorphic

We welcome contributions to commerce-sdk-isomorphic! To ensure that your contributions are addressed in a timely manner, keep the following guidelines in mind.

> **Contributor License Agreement (CLA)**:
>
> All external contributors must sign the [Contributor License Agreement](https://cla.salesforce.com/sign-cla) (CLA). A prompt to sign the agreement appears whenever a pull request is submitted.

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

| Parameter      | Description                                                |
| -------------- | :--------------------------------------------------------- |
| clientId       | ID of the client account created with Salesforce Commerce. |
| organizationId | The unique identifier for your Salesforce identity.        |
| shortCode      | Region specific merchant ID.                               |
| siteId         | A unique site ID (for example, RefArch or SiteGenesis).    |

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
    siteId: '<your-site-id>',
  },
};
```

Launch the sample application using `yarn start`. Access the sample application using a new browser window at this url `localhost:3000`.

## Testing

Two types of tests occur when running `yarn test`. First, unit tests are executed with jest including an enforced coverage level. This is all tests not contained within the sample app path of `src/environment`. If that passes, tests within the sample app path are executed using the `react-scripts` configuration. These allow for testing of the SDK within a sample React application.

## Issues

If you’re experiencing an issue, check the open issues first. If someone hasn’t already raised the same issue, file a new issue with a description of the problem and describe the steps to reproduce it. If you require an urgent response to your issue, file a support ticket with [Salesforce Commerce Cloud](https://help.salesforce.com/). You can also create an issue to request a new feature.

## Submit a Pull Request

> **Note**: All your commits must be signed. To learn how to set up commit signing, see this help doc from GitHub: [Managing Commit Signature Verification](https://docs.github.com/en/authentication/managing-commit-signature-verification).

1. Create an issue.
2. Create a fork of this repository.
3. Create a branch off the `main` branch.
4. Add your changes to your branch.
5. Create a pull request against the `main` branch.

## Best Practices

- To reduce merge conflicts, squash and rebase your branch before submitting your pull request.
- In your pull request, include:
  - A brief description of the problem and your solution
  - Steps to reproduce
  - Screenshots
  - Error logs (if applicable)
- Make sure that your code builds successfully and passes the unit tests.
- Monitor your pull requests. Respond in a timely manner to any comments, questions, and change requests.

## Review Process

After submitting a pull request, the team will review it and consider it for merging.

The team periodically closes any abandoned pull requests that they find.
