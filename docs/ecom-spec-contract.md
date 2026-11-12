# ECOM spec source contract

How this repo reads SCAPI OAS specs from the ECOM monorepo. Run with `yarn updateApis`.

ECOM's build bundles each API into one self-contained spec and commits it to a bundles
directory, next to a `manifest.json` recording the API's name, major version, schema version,
status and the SHA-256 of each bundle. This repo copies the public bundle; it does not bundle
ECOM's source files itself.

## Configuration

This repo is public and the ECOM remote is internal, so its location is never committed.
`ECOM_REPO_URL` and `ECOM_BUNDLES_ROOT` are required and the script fails if either is unset:

| Variable | Meaning |
|---|---|
| `ECOM_REPO_URL` | Git remote URL of the ECOM monorepo |
| `ECOM_BUNDLES_ROOT` | Path of the SCAPI bundles directory inside that repo |
| `ECOM_OAS_REF` | Optional. Overrides the ref derived from `api-versions.txt` |

Put them in a local `.env` at the repo root (gitignored; copy `.env.example`). `updateApis` loads it with `dotenv`.

## Usage

`yarn updateApis` has two modes. Both fetch the listed bundles from ECOM, rebuild the generator input in
`apis/`, and then run `yarn diffApis` (a non-zero exit there means differences were found,
see `temp/diffApis.txt`). Output is built in `temp/stagedApis` and copied into `apis/` only
after the whole run succeeds, so a failed or interrupted run leaves `apis/` as it was. The
previous contents are kept in `temp/oldApis`.

Each API's bundle is checked before anything is staged. The run fails if the ref has no
`manifest.json` at the API's location, the manifest names a different API or major version,
the API is internal-only, or the bundle's SHA-256 does not match the manifest (ECOM's bundles
were not regenerated after a source change).

### Refresh every API for an ECOM release

```
yarn updateApis                       # release named by the api-versions.txt header
yarn updateApis --ecom-version 27.1   # release.27.1, and rewrites the header to v27.1
```

Precedence for the ref: `ECOM_OAS_REF`, then `--ecom-version`, then the header. If
`ECOM_OAS_REF` overrides `--ecom-version` the script warns, because the header would then
claim a release the specs did not come from.

### Update only some APIs, from any ref (for API developers)

To test a spec change on your ECOM branch without moving the whole SDK to that branch, first
make sure your branch carries an up-to-date bundle for the API. This repo reads only the
committed bundle, never the spec sources, so a source change on your branch is invisible here
until you regenerate the bundles with ECOM's bundle task and commit the result. ECOM's CI
rejects stale bundles, and so does the SHA-256 check above. Then push the branch (or note the
tag or commit SHA) and run:

```
yarn updateApis --api shopper-baskets-oas-v1 --ref my-feature-branch
```

- `--ref` is a branch, tag or commit SHA. A branch is the usual choice. The spec's
  `info.version` is only a label inside whatever the ref contains, so the ref, not a
  version number, is what selects the spec.
- `--api` takes the `<assetId>-vN` key and can be repeated. The key must already be in
  `api-versions.txt`; add it there first for a new API.
- `--api` and `--ref` must be given together and cannot be combined with `--ecom-version`.
- Only the named APIs are rebuilt. The old folder for each (found by the `assetId` and
  `apiVersion` in its `exchange.json`, since folder names embed the spec version) is
  replaced, and every other folder in `apis/` is untouched. The header is not rewritten.
- Each rebuilt `exchange.json` records `ecomRef` and `ecomCommit`, so a mixed result is
  visible in the diff.

Then regenerate and test: `yarn renderTemplates`, `yarn build:lib`, `yarn test:unit`.
To go back, run the release refresh.

A release must come from one release branch. Before cutting a release, run the release
refresh and check that every `apis/*/exchange.json` has the same `ecomRef`, equal to the
header's release branch.

## Decisions

### Ref
The ref is derived from the `# APIs for ECOM vXX.Y` header in `api-versions.txt`
as `release.XX.Y` (`resolveEcomOasRef` in `scripts/ecom-oas.ts`). `ECOM_OAS_REF=<ref>`
overrides it, for example `ECOM_OAS_REF=master`.

**Today no ECOM release branch carries the bundles.** `release.26.11` has no bundle
manifests, and `release.27.1` is not cut yet.
Only `master` has it. Until `release.27.1` is cut, the script must run with
`ECOM_OAS_REF=master`, and releases built from `master` are not reproducible from a ref
alone. The script logs the resolved commit SHA on every run for that reason.

### Bundling
The generator needs one self-contained file per API: it cannot load ECOM's multi-file
sources, whose `$ref`s use a `file.yaml/#/...` form its parser resolves one directory too
deep. ECOM's bundles already are that file, and the public bundle is produced by ECOM's own
bundler config and decorators, which strip internal-only content and resolve description
placeholders. Using it means the SDK sees the same spec as every other ECOM consumer.
`exchange.json` is synthesized from the manifest, so `generate-oas.ts` is unchanged.

### Versioning
`api-versions.txt` keeps the ECOM release in its header (the ref selector) and one
`<assetId>-vN=<type>/<family>/<api>/vN` line per API the SDK ships. The key is the SDK's name
for the API (the allow-list), and the value is where ECOM publishes its bundle, so an update
fetches exactly those directories and never searches the tree. The spec version comes from
the manifest's `schemaVersion`.

### Auth
Fetching is an HTTPS sparse, shallow `git fetch` against the ECOM remote. Run it locally: the
ECOM host is only reachable from inside the company network, and a GitHub-hosted runner fails
with `Could not resolve host`, so a CI secret cannot work there. Locally no token is needed:
a plain `https://<host>/<org>/<repo>.git` URL in `ECOM_REPO_URL` authenticates with the
developer's existing git credentials. Running the update in CI would need a runner inside the
network plus a read-only credential for the ECOM repo.

## Releasing for an ECOM version

Each SDK release targets one ECOM release. Specs for that release come from the ECOM branch
`release.XX.Y`, which `updateApis` derives from the `api-versions.txt` header.

1. **Set the target.** Change the header to `# APIs for ECOM vXX.Y` (for example `v27.1`,
   later `v27.2`). The ref becomes `release.27.1`, then `release.27.2`.
2. **Check the ref exists and carries the specs.** Run `git ls-remote "$ECOM_REPO_URL" release.XX.Y`;
   it must print a line. If the branch is missing, the update fails with git's
   `couldn't find remote ref` error. A branch that exists can still lack the bundles: the
   update then fails before touching `apis/`.
3. **Until the release branch carries the specs,** set `ECOM_OAS_REF=master` in `.env`.
   Remove it as soon as the branch does. A leftover override silently pulls `master` for a
   release that should come from its branch.
4. **Run `yarn updateApis --ecom-version XX.Y` and read the log.** The flag also rewrites the
   `api-versions.txt` header. `Resolved <ref> to ECOM commit <sha>`
   must name the ref you intend (`release.XX.Y`, not `master`). The number of staged APIs
   must equal the number of keys in `api-versions.txt`.
5. **Update the allow-list if the API set changed.** Add a
   `<assetId>-vN=<type>/<family>/<api>/vN` line for a new API or a new major version of one.
   The location is the API's directory under the ECOM bundles directory.
6. **Record provenance in the release PR:** the ref and commit SHA from the log. A patched
   ECOM release branch moves, and the SHA is what makes the release reproducible.
7. **Patch releases of the same ECOM release** re-run the same steps against the same
   branch; any spec changes arrive through the manifests' `schemaVersion`.

## Measured result (master @ e2737085, 2026-11-12)

- All 17 allow-listed APIs were fetched, verified against their manifest SHA-256 and staged.
- A single-API run (`--api shopper-seo-oas-v1 --ref master`) replaced only that API's folder;
  the other 16 were byte-identical. A missing ref failed with `apis/` untouched.
- `yarn renderTemplates` succeeds. Generated output differs from the specs committed today:
  every API moves to a newer version, and ECOM's decorators add some enum types (for example
  `GetBasketPersonalizedEnum`).
- `yarn build:lib` fails on `shopperSeo` with `Cannot find name 'ScopeEnum'`. shopper-seo
  1.5.x adds `page-meta-tags/{scope}`, the first path parameter in any spec that is an inline
  enum. `templatesOas/apis.parameters.mustache` renders it with the bare name `ScopeEnum`,
  while `apis.enum.mustache` declares `GetPageMetaTagsScopeEnum`. The cause is the SDK
  generator template, not the ECOM source; a one-line template fix is tracked as a separate
  follow-up.
