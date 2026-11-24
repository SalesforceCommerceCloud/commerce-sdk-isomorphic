---
name: release
description: Cut a release of commerce-sdk-isomorphic for a target ECOM version. Walks the releaser through updating specs from the ECOM source, reviewing the generated diff, building, testing, choosing the version, regenerating the CHANGELOG and docs, and opening the release PR. Use when preparing a new SDK release.
---

# Release commerce-sdk-isomorphic

A guide for the person cutting a release. It does not automate anything: it tells you what to run, what to check, and when to stop. Each step ends with a check. If the check fails, stop and use the [common failures](#common-failures) table before going on.

Background on how specs are fetched and verified is in [docs/ecom-spec-contract.md](../../../docs/ecom-spec-contract.md).

## 1. Prerequisites

- **Tooling.** Yarn 1.x (1.22.22), the Node version in `.nvmrc`, a JDK on your PATH (OpenAPI generation needs it), and `oasdiff` on your PATH (`yarn updateApis` runs `yarn diffApis`, which needs it).
- **Network.** The ECOM source is reachable only from an authorized network. Confirm you can reach it before you start.
- **Local `.env`.** Copy `.env.example` to `.env` (gitignored, never commit it). Set:
  - `ECOM_REPO_URL`: required.
  - `ECOM_BUNDLES_ROOT`: required.
  - `ECOM_OAS_REF`: leave empty unless the SDK maintainers tell you to set it. When set, it overrides the ref the script would derive from the target version. A leftover value silently changes where a release's specs come from, so clear it as soon as you no longer need it.

  Ask the SDK maintainers' team for the values. They are not in this repo, and you should not write them into any file that is committed, a PR description, or a commit message.
- **Target.** Know which ECOM version this release targets (for example `27.1`) and which SDK version it will be, if you already know it.

Check: `yarn install` finishes, and `.env` has both required variables.

## 2. Update the specs

First read the comment lines at the top of `api-versions.txt`. If one records a hand-supplied bundle that a full refresh would replace, find out whether the target ECOM bundle for that API has caught up. If it has not, stop and ask the SDK maintainers. Do not run the full refresh below; they will tell you which APIs to update individually instead. A full refresh over a hand-supplied bundle silently drops a deliberate correction that earlier releases shipped.

```
yarn updateApis --ecom-version <XX.Y>
```

This fetches every API listed in `api-versions.txt`, verifies each bundle against its manifest, rewrites `apis/`, updates the `# APIs for ECOM vXX.Y` header in `api-versions.txt`, and then runs `yarn diffApis`. If any fetch or check fails, `apis/` is left as it was.

If the maintainers told you to set `ECOM_OAS_REF`, the flag cannot be used: the script refuses `--ecom-version` while `ECOM_OAS_REF` is set. Instead, edit the `# APIs for ECOM vXX.Y` header in `api-versions.txt` by hand to the target version, then run `yarn updateApis` with no flags.

Read the log:

- `Resolved <ref> to ECOM commit <sha>` must name the ref you intend. If `ECOM_OAS_REF` is set, the script prints a warning before fetching. Make sure that is deliberate.
- `Staged <n> API(s)`: `<n>` must equal the number of keys in `api-versions.txt`.
- Write down the ref and the commit SHA. They go in the release PR so the release is reproducible.

If the release adds an API, or a new major version of one, add its `<key>=<location>` line to `api-versions.txt` first, then re-run. The location is the API's directory under the ECOM bundles directory. Ask the maintainers if you do not know it.

Check: the run ended without an error, and the resolved ref is the one you meant.

## 3. Review the diff for breaking changes

`updateApis` exits 0 even when the specs differ from the previous release. Read `temp/diffApis.txt` yourself, and read the `apis/` diff in git. The report file only exists when differences were found; if it is missing, the log said `diffApis found no differences`.

- Removed or renamed endpoints, removed or newly required parameters, and changed response shapes are breaking. Note each one for the CHANGELOG and for choosing the version in step 4.
- If a spec change looks wrong rather than intended, stop and raise it with the SDK maintainers. Do not edit files in `apis/` by hand: the next update replaces them.

Check: you can describe in one sentence per API what changed.

## 4. Choose the version

This SDK versions to track the Commerce APIs it wraps. Pick the bump like this:

- **Patch:** spec or SDK fixes with no new surface.
- **Minor:** new endpoints, new APIs, new optional parameters, and breaking changes that come only from an API change.
- **Major:** reserved for changes to how the SDK itself is structured or used.

When an API change breaks callers but the release is still minor, say so prominently in the CHANGELOG (a breaking-changes section with a migration example) and recommend pinning to an exact version. If you are unsure, ask the maintainers before bumping.

Set `version` in `package.json` to the new version now. Generation writes it into the SDK's version metadata (the `User-Agent` string), so bumping after the build means you test a different version than the one that ships.

Check: the new version in `package.json` matches the version you will use for the branch name and the CHANGELOG heading in the next steps.

## 5. Generate and build

```
yarn clean
yarn renderTemplates
yarn build:lib
```

Open the generated `src/lib/<apiName>/apis/DefaultApi.ts` for the APIs that changed. New endpoints and new parameters should be present where the diff said they would be.

If the build fails with a type error in generated code (for example a type name that is used but never declared), stop. That usually means the SDK's generator templates do not yet handle a construct in the new spec, not that the spec is wrong. Raise it with the SDK maintainers instead of patching generated output.

Check: `yarn build:lib` finishes with no errors.

## 6. Test

```
yarn test
```

This runs lint, style lint, depcheck and the bundle size check (`pretest`), then type checks, unit tests, export tests, workflow tests and the React environment tests.

Check: `yarn test` passes. A failure in an area you did not touch still blocks the release. Find out why before going on.

## 7. Regenerate the CHANGELOG table and docs

1. Add a new top section to `CHANGELOG.md`: a `## vX.Y.Z` heading followed by a blank line. The version table script writes into the first `##` section it finds, so the heading must exist first.
2. Run `yarn doc`. It rebuilds the API Versions table inside that top section from the folders in `apis/`, then regenerates the typedoc output in `docs/`. Typedoc empties `docs/` first, so it also deletes the handwritten `docs/ecom-spec-contract.md`. Restore it with `git restore docs/ecom-spec-contract.md`.
3. Add the rest of the release notes under the heading: what changed, and any breaking-changes section from step 4.

The release workflow reads this section for the GitHub release notes.

Check: the top `## vX.Y.Z` section has the API Versions table and your notes, `git status` shows regenerated files under `docs/`, and `docs/ecom-spec-contract.md` is not listed as deleted.

## 8. Open the release PR

1. Create the branch `release/vX.Y.Z` from the up-to-date default branch. The release workflows only run for branches named exactly this way. If you ran the earlier steps on the default branch, `git switch -c release/vX.Y.Z` carries your uncommitted changes onto the new branch. Never commit them to the default branch.
2. Commit the changes (`api-versions.txt`, `apis/`, `package.json`, `CHANGELOG.md`, `docs/`). All commits must be signed.
3. Open a PR into the default branch. In the description, include the ECOM ref and commit SHA from step 2, and a summary of any breaking changes.

Before you push, check that these three agree on `X.Y.Z`: the branch name, `version` in `package.json`, and the top `## vX.Y.Z` heading in `CHANGELOG.md`. The release workflow fails the release if they differ.

After the PR merges, the workflows create the tag and the GitHub release from the CHANGELOG section, then publish to npm. Watch the workflow runs to confirm both finish.

## Common failures

| Symptom | Likely cause | What to do |
|---|---|---|
| `updateApis` fails immediately about `ECOM_REPO_URL` or `ECOM_BUNDLES_ROOT` | `.env` missing or the variable is empty | Re-copy `.env.example` to `.env` and fill both values. Ask the maintainers' team for them. |
| `Could not resolve host` during fetch | Not on an authorized network | Connect to the network that can reach the ECOM source and retry. CI cannot run this step. |
| `couldn't find remote ref` | The resolved ref does not exist yet, or `ECOM_OAS_REF` is mistyped | Check the ref in the log line. Ask the maintainers which ref to use. `apis/` is unchanged. |
| The run fails before touching `apis/`, saying the manifest or bundle is missing | The ref exists but does not carry bundles for an API | Ask the maintainers which ref carries the bundles. Do not work around it. |
| Bundle SHA-256 mismatch | ECOM's bundles were not regenerated after a spec source change | Stop. The ECOM side has to regenerate and commit the bundles. |
| The log warns that `ECOM_OAS_REF` is set | A leftover or deliberate override | Confirm it is deliberate. If not, clear it and re-run so the release comes from the intended ref. |
| `yarn updateApis` fails at the diff step | `oasdiff` is missing or not on your PATH. `apis/` is already updated at this point; only the diff report is missing. | Install `oasdiff` and make sure it is on your PATH, then re-run. |
| `--ecom-version cannot be used while ECOM_OAS_REF is set` | `ECOM_OAS_REF` is set in `.env` | Clear it and use the flag, or keep it and set the header by hand as described in step 2. |
| `yarn build:lib` fails with a type error in generated code | A generator template does not handle a construct in the new spec | Stop and raise it with the maintainers. Do not hand-edit generated files. |
| `yarn doc` leaves the API Versions table out of the release section | The new `## vX.Y.Z` heading was not added before running it | Add the heading and blank line at the top of `CHANGELOG.md`, then re-run `yarn doc`. |
| Release workflow fails with a version mismatch | Branch name, `package.json` and CHANGELOG heading disagree | Fix whichever differs and push to the same branch. |
