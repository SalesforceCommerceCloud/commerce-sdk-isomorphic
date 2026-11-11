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
Fetching is an HTTPS sparse, shallow `git fetch` against the ECOM remote. Run it locally: the
ECOM host is only reachable from inside the company network, and a GitHub-hosted runner fails
with `Could not resolve host`, so a CI secret cannot work there. Locally no token is needed:
a plain `https://<host>/<org>/<repo>.git` URL in `ECOM_REPO_URL` authenticates with the
developer's existing git credentials. Running the update in CI would need a runner inside the
network plus a read-only credential for the ECOM repo.

## Releasing for an ECOM version

Each SDK release targets one ECOM release. Specs for that release come from the ECOM branch
`release.XX.Y`, which `updateApisFromEcom` derives from the `api-versions.txt` header.

1. **Set the target.** Change the header to `# APIs for ECOM vXX.Y` (for example `v27.1`,
   later `v27.2`). The ref becomes `release.27.1`, then `release.27.2`.
2. **Check the ref exists and carries the specs.** Run `git ls-remote "$ECOM_REPO_URL" release.XX.Y`;
   it must print a line. If the branch is missing, the update fails with git's
   `couldn't find remote ref` error. A branch that exists can still lack the OAS tree: the
   update then stages nothing, so confirm the next step's count.
3. **Until the release branch carries the specs,** set `ECOM_OAS_REF=master` in `.env`.
   Remove it as soon as the branch does. A leftover override silently pulls `master` for a
   release that should come from its branch.
4. **Run `yarn updateApisFromEcom` and read the log.** `Resolved <ref> to ECOM commit <sha>`
   must name the ref you intend (`release.XX.Y`, not `master`). The number of staged APIs
   must equal the number of keys in `api-versions.txt`.
5. **Update the allow-list if the API set changed.** Add a `<assetId>-vN` key for a new API or
   a new major version of one. The value after `=` is no longer read; the SDK and the
   CHANGELOG version table take versions from the staged specs, so a stale value there does
   not change what ships.
6. **Record provenance in the release PR:** the ref and commit SHA from the log. A patched
   ECOM release branch moves, and the SHA is what makes the release reproducible.
7. **Patch releases of the same ECOM release** re-run the same steps against the same
   branch; any spec changes arrive through `info.version`.

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
