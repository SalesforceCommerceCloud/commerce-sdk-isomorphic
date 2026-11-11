# ECOM spec source contract

How this repo reads SCAPI OAS specs from the ECOM monorepo instead of Anypoint Exchange.
Run with `yarn updateApisFromEcom`.

## Configuration

This repo is public and the ECOM remote is internal, so its location is never committed.
Both values are required environment variables and the script fails if either is unset:

| Variable | Meaning |
|---|---|
| `ECOM_REPO_URL` | Git remote URL of the ECOM monorepo |
| `ECOM_OAS_ROOT` | Path of the SCAPI OAS source tree inside that repo |
| `ECOM_OAS_REF` | Optional. Overrides the ref derived from `api-versions.txt` |

Put them in a local `.env` at the repo root (gitignored; copy `.env.example`), the same way
the Anypoint credentials were provided before. `updateApisFromEcom` loads it with `dotenv`.

## Decisions

### Ref
The ref is derived from the `# APIs for ECOM vXX.Y` header in `api-versions.txt`
as `release.XX.Y` (`resolveEcomOasRef` in `scripts/ecom-oas.ts`). `ECOM_OAS_REF=<ref>`
overrides it, for example `ECOM_OAS_REF=master`.

**Today no ECOM release branch carries the OAS tree.** `release.26.2` through
`release.26.11` contain zero files under the OAS root, and `release.27.1` is not cut yet.
Only `master` has it. Until `release.27.1` is cut, the script must run with
`ECOM_OAS_REF=master`, and releases built from `master` are not reproducible from a ref
alone. The script logs the resolved commit SHA on every run for that reason.

### Bundling
The consumer bundles with stock Redocly (`scripts/ecom-redocly.yaml`) and synthesizes
`exchange.json`, so `generate-oas.ts` is unchanged. This does not depend on any ECOM build output.

### Versioning
`api-versions.txt` keeps the ECOM release in its header (the ref selector) and its
`<assetId>-vN` keys (the allow-list). The per-API SemVer pins are no longer used to
resolve an artifact. The version comes from each spec's `info.version`.

### Auth
Fetching is an HTTPS sparse, shallow `git fetch` against the ECOM remote. Run it locally:
the ECOM host is only reachable from inside the company network, and a GitHub-hosted runner
fails with `Could not resolve host`, so a CI secret cannot work there. Credentials go in
`ECOM_REPO_URL` (`https://<user>:<token>@<host>/<org>/<repo>.git`) in the local `.env`. Use a
fine-grained token limited to the ECOM repo with read-only Contents access. Running the update
in CI would need a runner inside the network.

## Measured result (master @ 86ee0fab, 2026-11-10)

- All 17 allow-listed APIs were discovered, bundled and staged. None were missing.
- Every API moved to a newer spec version than the Anypoint-sourced `apis/`, for example
  `shopper-products` 1.12.0 to 1.15.0 and `shopper-baskets` v2 2.12.0 to 2.13.6.
  `master` is ahead of the v26.9 pins.
- `yarn diffApis` reports 34 errors (breaking changes) across context, customers, payments,
  products and search, and about 1,600 warnings. Most warnings are removed optional rate-limit
  response headers. Most of this is expected spec drift between versions, but it has not been
  separated from bundler differences: the earlier proof of concept observed stock Redocly
  naming a colliding schema differently from ECOM's own bundler (`ProductPromotion2` vs
  `SchemasProductPromotion`), which changes generated type names. Compare against ECOM's
  bundled output before treating stock Redocly as equivalent.
- `yarn renderTemplates` succeeds and `yarn test:unit` passes (224 tests).
- `yarn build:lib` failed on `shopperSeo` with `Cannot find name 'ScopeEnum'`. shopper-seo
  1.5.0 (the Anypoint-sourced pin was 1.3.0) adds `page-meta-tags/{scope}`, the first path
  parameter in any spec that is an inline enum. `templatesOas/apis.parameters.mustache`
  rendered it with the bare name `ScopeEnum`, while `apis.enum.mustache` declares
  `GetPageMetaTagsScopeEnum`. **The cause is the SDK generator template, not the ECOM source
  or the Redocly bundling.** Any source for that spec version would hit it. A one-line
  template fix (tracked as a separate follow-up) makes `yarn build:lib` pass
  against the `master` specs.
- commerce-sdk (Node) has its own generator and templates and was not checked for the same
  problem.
