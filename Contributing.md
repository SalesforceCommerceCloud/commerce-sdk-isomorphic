# Contributing to commerce-sdk-isomorphic

We welcome contributions to commerce-sdk-isomorphic! To ensure that your contributions are addressed in a timely manner, keep the following guidelines in mind.

> **Contributor License Agreement (CLA)**:
>
> All external contributors must sign the [Contributor License Agreement](https://cla.salesforce.com/sign-cla) (CLA). A prompt to sign the agreement appears whenever a pull request is submitted.

## Building

> Recommended: use Yarn 1.x (1.22.22). Newer Yarn versions are not fully supported
> Requirement: Java/JDK must be installed and on your PATH (OpenAPI generation depends on it).

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

## Preview Releases

### Nightly preview

- Nightly preview releases run automatically from the `preview` branch every night at midnight Pacific Time (08:00 UTC).
- The npm dist-tag is `preview`.
- Version format is `<base>-nightly-<UTC timestamp>`, for example: `4.0.0-nightly-20251007080238`.

### Merging to `preview`

#### Update APIs:
Update the version file in `api-versions.txt` to the version you want to test or add a new API. Use the API version from your API release or branch build.

Alternatively, you can run `yarn updateApiVersion` to update the `api-versions.txt` file with the latest API version snapshots for the APIs listed in the file.

#### Update and Check SDK before merging:

Before merging any changes into `preview`, SDK generation must pass locally:

```
yarn install
yarn clean
yarn renderTemplates
yarn build:lib
yarn test
```

- Verify generated output under `src/lib/<apiName>/apis/DefaultApi.ts`:
  - New endpoints exist
  - New parameters are present where expected

If generation or build fails, fix issues before opening/merging a PR to `preview`.

For guidance on adding new API features or introducing new APIs, see [Adding or Updating APIs](#adding-or-updating-apis).

## Adding or Updating APIs

### New API features (existing APIs)

- Locate the API’s OAS directory: `apis/<api-name>-oas-<version>/`
- Edit or replace the public OAS file (keep the same filename), for example:
  - `apis/shopper-products-oas-1.0.37/shopper-products-oas-v1-public.yaml`

### New APIs

- Create a new directory: `apis/<api-name>-oas-<version>/` (e.g., `apis/shopper-test-oas-1.0.1`)
- Add the following files:
  - `exchange.json` (example):

    ```
    {
      "main": "shopper-products-oas-v1-public.yaml",
      "name": "Shopper Products OAS",
      "groupId": "893f605e-10e2-423a-bdb4-f952f56eb6d8",
      "assetId": "shopper-products-oas",
      "version": "1.0.37",
      "classifier": "oas",
      "tags": [],
      "descriptorVersion": "1.0.0",
      "organizationId": "893f605e-10e2-423a-bdb4-f952f56eb6d8",
      "apiVersion": "v1"
    }
    ```

  - Main OAS file named `<api-name>-oas-v1-public.yaml` (e.g., `shopper-products-oas-v1-public.yaml`)



## Usage

An example React App is available at `./src/environment/App` directory. To use the sample application, configure these parameters in `./src/environment/config.js` file.

> **Note:** These are required parameters.

| Parameter      | Description                                                                |
| -------------- | :------------------------------------------------------------------------- |
| clientId       | ID of the client account created with Salesforce Commerce.                 |
| organizationId | The unique identifier for your Salesforce identity.                        |
| shortCode      | Region-specific merchant ID.                                               |
| siteId         | Name of the site to access data from, for example, RefArch or SiteGenesis. |

```javascript
/**
 * Configure required parameters
 *
 * To learn more about the parameters please refer to https://developer.salesforce.com/docs/commerce/commerce-api/guide/get-started.html
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

Launch the sample application using `yarn start`. Access the sample application using a new browser window at this URL `localhost:3000`.

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
