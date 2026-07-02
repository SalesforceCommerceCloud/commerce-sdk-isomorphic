/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * Guards the package `exports` map that makes named imports resolve, e.g.
 * `import { ShopperLogin } from 'commerce-sdk-isomorphic'`. Removing the
 * `exports` field breaks named-import resolution for bundlers and tooling that
 * honor it — this proves it via Node self-referencing, which only works when
 * the field is present.
 *
 * Runs under `node --test`, not jest: jest 26's resolver ignores the `exports`
 * field, so a jest test passes whether or not the field exists and would lock
 * nothing. Node's own resolver is the one real consumers use.
 */

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

test('package self-resolves by name through the exports map (require condition)', () => {
  const sdk = require('commerce-sdk-isomorphic');
  assert.equal(typeof sdk.ShopperLogin, 'function');
  assert.equal(typeof sdk.helpers, 'object');
  assert.equal(typeof sdk.ClientConfig, 'function');
});

test('the import condition resolves to the ESM bundle', async () => {
  const resolved = await import.meta.resolve('commerce-sdk-isomorphic');
  assert.match(resolved, /index\.esm\.js$/);
});
