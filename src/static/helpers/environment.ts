/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {FetchFunction} from '../clientConfig';

export const isBrowser =
  typeof window === 'object' && typeof window.document === 'object';

export const isNode =
  typeof process === 'object' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node === 'string';

export const globalObject = isBrowser ? window : globalThis;

export const hasFetchAvailable = typeof globalObject.fetch === 'function';

// We used to synchronously `require('node-fetch')` here, but that breaks the
// generated ESM bundle (`lib/index.esm.js`). Modern Node runtimes refuse to load
// files that contain `require()` alongside ESM syntax (error: ERR_AMBIGUOUS_MODULE_SYNTAX).
// To keep a single source that works for both CommonJS and ESM consumers, we
// lazily import the polyfill the first time `fetch` is called when running in
// Node. Browsers (and Node 18+ with native fetch) still hit the global fetch.
let cachedFetch: FetchFunction | undefined;
let loadingPromise: Promise<FetchFunction> | undefined;

// TODO: Adopt native fetch in the next major version.
// Using the built-in fetch (Node 18+) caused downstream unit tests that rely on
// `nock` to fail because `nock` hooks into the core HTTP/HTTPS modules, while
// the native fetch implementation leverages undici instead. Until we can roll
// out a coordinated breaking change, we continue to use the node-fetch
// polyfill so existing tests keep passing.
export const fetch: FetchFunction = ((...args: Parameters<FetchFunction>) => {
  if (cachedFetch) {
    // Polyfill already resolved once; delegate immediately.
    return cachedFetch(...args);
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      if (isNode) {
        // Running in Node without a cached polyfill. Dynamically import
        // `node-fetch` so bundlers emit an ESM-friendly `import()` call
        // (CommonJS outputs still rewrite this into a deferred require).
        const mod = await import('node-fetch');
        // Older node-fetch versions export the function as default; newer ones
        // may export it as the module value. Handle both cases.
        const nodeFetch = (mod.default ?? mod) as unknown as FetchFunction;
        cachedFetch = nodeFetch;
        return nodeFetch;
      }

      // Browser (or any environment with a native fetch). If fetch is missing
      // we surface the same runtime error that existed before.
      if (!hasFetchAvailable)
        throw new Error(
          'Bad environment: it is not a node environment but fetch is not defined'
        );

      // Bind to preserve the expected `this` (global) when fetch executes.
      cachedFetch = globalObject.fetch.bind(globalObject) as FetchFunction;
      return cachedFetch;
    })();
  }

  // First invocation: wait for the async loader before delegating to the real fetch.
  return loadingPromise.then(fn => fn(...args));
}) as FetchFunction;
