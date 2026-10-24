/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import {execSync} from 'child_process';
import path from 'path';
import fs from 'fs-extra';

/**
 * ECOM is becoming the source of truth for SCAPI OAS definitions: the specs move
 * out of per-apiFamily Anypoint Exchange artifacts and into the ECOM monorepo
 * (commerce/digital) under a single source tree. This module fetches those specs
 * and reshapes them into the on-disk form the generator already consumes -
 * `apis/<assetId>-<version>/` holding one bundled spec plus an `exchange.json`
 * descriptor - so `generate-oas.ts` needs no changes.
 *
 * Two shape differences between the ECOM source and an Exchange artifact are
 * bridged here:
 *   1. ECOM stores the spec unbundled (a root file plus `$ref`s into per-API and
 *      shared component files); the generator needs one self-contained file, so we
 *      bundle with Redocly.
 *   2. ECOM has no `exchange.json`; we synthesize it from the spec's `info` block
 *      and its path in the tree.
 */

// git.soma monorepo that will hold the specs once the migration lands.
export const ECOM_REPO_URL =
  'https://git.soma.salesforce.com/commerce/digital.git';

// Root of the SCAPI OAS source tree inside the ECOM checkout.
export const ECOM_OAS_ROOT = 'source/bc_wapi/javasource/resources/scapi/oas';

// Which ref to pull specs from. Defaults to the migration feature branch while
// the work is in POC; override once it merges to a release branch / master.
export const ECOM_OAS_REF =
  process.env.ECOM_OAS_REF || 'tle.W-23538652.oas-local-build';

export type EcomApi = {
  // Path relative to ECOM_OAS_ROOT, e.g. "product/shopper_products/v1".
  relPath: string;
  // Absolute path to the API's root spec file.
  rootSpec: string;
  // vN directory name, e.g. "v1".
  apiVersion: string;
  // Human title from the spec's info.title, e.g. "Shopper Products".
  title: string;
  // SemVer from the spec's info.version, e.g. "1.11.1".
  version: string;
};

/**
 * Sparse, shallow-checks out only the OAS source tree from the ECOM monorepo into
 * `targetDir`. Avoids cloning all of ECOM - we fetch a single directory subtree at
 * one ref. Returns the absolute path to the checked-out OAS root.
 */
export function fetchEcomOasTree(targetDir: string): string {
  fs.removeSync(targetDir);
  fs.ensureDirSync(targetDir);

  const run = (cmd: string): void => {
    execSync(cmd, {cwd: targetDir, stdio: 'inherit'});
  };

  run('git init -q');
  run(`git remote add origin ${ECOM_REPO_URL}`);
  run('git config core.sparseCheckout true');
  run('git sparse-checkout init --cone');
  run(`git sparse-checkout set ${ECOM_OAS_ROOT}`);
  run(`git fetch --depth 1 origin ${ECOM_OAS_REF}`);
  run('git checkout -q FETCH_HEAD');

  return path.join(targetDir, ECOM_OAS_ROOT);
}

/**
 * Reads a scalar off the top-level `info` block of an OAS file without a full YAML
 * parse - the values we need (title, version) are simple one-line scalars and the
 * files are large, so a targeted match keeps this dependency-free.
 */
function readInfoScalar(specText: string, key: string): string | undefined {
  // Match "  <key>: <value>" at two-space indent (inside the info block).
  const match = new RegExp(`^ {2}${key}:\\s*(.+)$`, 'm').exec(specText);
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : undefined;
}

/**
 * Walks the checked-out OAS tree and returns every real API root - a
 * `<family>/<api>/vN/` directory holding a `.redocly.yaml` and exactly one
 * non-Redocly root YAML file. Component libraries (`shared_components`) are skipped
 * structurally, mirroring ECOM's own discovery rules.
 */
export function discoverEcomApis(oasRoot: string): EcomApi[] {
  const apis: EcomApi[] = [];

  const families = fs
    .readdirSync(oasRoot)
    .filter(
      name =>
        name !== 'shared_components' &&
        fs.statSync(path.join(oasRoot, name)).isDirectory()
    );

  families.forEach(family => {
    const familyDir = path.join(oasRoot, family);
    fs.readdirSync(familyDir)
      .filter(
        apiName =>
          apiName !== 'shared_components' &&
          fs.statSync(path.join(familyDir, apiName)).isDirectory()
      )
      .forEach(apiName => {
        const apiDir = path.join(familyDir, apiName);
        fs.readdirSync(apiDir)
          .filter(
            versionDir =>
              /^v\d+$/.test(versionDir) &&
              fs.statSync(path.join(apiDir, versionDir)).isDirectory()
          )
          .forEach(versionDir => {
            const vDir = path.join(apiDir, versionDir);
            const entries = fs.readdirSync(vDir);
            if (!entries.includes('.redocly.yaml')) {
              return;
            }
            const rootYaml = entries.find(
              f => f.endsWith('.yaml') && !f.startsWith('.redocly')
            );
            if (!rootYaml) {
              return;
            }
            const rootSpec = path.join(vDir, rootYaml);
            const specText = fs.readFileSync(rootSpec, 'utf-8');
            apis.push({
              relPath: path.join(family, apiName, versionDir),
              rootSpec,
              apiVersion: versionDir,
              title: readInfoScalar(specText, 'title') || apiName,
              version: readInfoScalar(specText, 'version') || '0.0.0',
            });
          });
      });
  });

  return apis;
}

/**
 * Derives the Exchange-style asset id the SDK generator keys on from the spec
 * title. "Shopper Products" -> "shopper-products-oas". This matches the assetId
 * carried in the Exchange `exchange.json` files today, so the generator's
 * name-resolution logic is unchanged.
 */
export function assetIdFromTitle(title: string): string {
  return `${title.trim().toLowerCase().replace(/\s+/g, '-')}-oas`;
}

/**
 * Bundles an unbundled ECOM spec into a single self-contained file with Redocly.
 * We deliberately bundle with a stock Redocly config rather than the ECOM
 * `.redocly.yaml` (which extends a ruleset vendored under ECOM's buildSrc that
 * isn't part of the OAS subtree) - a consumer only needs `$ref` resolution, not
 * ECOM's lint ruleset. Returns the path to the bundled file.
 */
export function bundleSpec(rootSpec: string, outFile: string): void {
  fs.ensureDirSync(path.dirname(outFile));
  execSync(
    `redocly bundle ${rootSpec} -o ${outFile} --config ${path.join(
      __dirname,
      'ecom-redocly.yaml'
    )}`,
    {stdio: 'inherit'}
  );
}

/**
 * ECOM specs carry the operation-description text as a `<name.md>` placeholder that
 * ECOM's build-time Redocly decorator substitutes from the sibling markdown file.
 * Stock Redocly does not run that decorator, so we substitute the top-level
 * `info.description` placeholder from its `.md` file here. Leaves the spec
 * unchanged when there is no placeholder.
 */
export function substituteDescription(specFile: string, specDir: string): void {
  let spec = fs.readFileSync(specFile, 'utf-8');
  const placeholder = /^ {2}description:\s*<(.+\.md)>$/m.exec(spec);
  if (!placeholder) {
    return;
  }
  const mdPath = path.join(specDir, placeholder[1]);
  if (!fs.existsSync(mdPath)) {
    console.warn(
      `Description placeholder ${placeholder[1]} has no matching file in ${specDir}; leaving as-is`
    );
    return;
  }
  const md = fs.readFileSync(mdPath, 'utf-8');
  const block = md
    .split('\n')
    .map(line => `    ${line}`)
    .join('\n');
  spec = spec.replace(placeholder[0], `  description: |-\n${block}`);
  fs.writeFileSync(specFile, spec);
}
