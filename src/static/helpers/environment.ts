/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {FetchFunction} from '../clientConfig';

/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const isBrowser =
  typeof window === 'object' && typeof window.document === 'object';

export const isNode =
  typeof process === 'object' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node === 'string';

export const globalObject = isBrowser ? window : globalThis;

export const hasFetchAvailable = typeof globalObject.fetch === 'function';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const fetch: FetchFunction = (() => {
  if (isNode) {
    // .default is added because the newer versions of babel doesn't get the default export automatically for require().
    // eslint-disable-next-line global-require, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
    return require('node-fetch').default;
  }

  // difficult to test in node environment
  /* istanbul ignore next */
  if (!hasFetchAvailable)
    throw new Error(
      'Bad environment: it is not a node environment but fetch is not defined'
    );
  let lazyFetch: FetchFunction;
  const browserFetch: FetchFunction = (...args) => {
    if (!lazyFetch) {
      lazyFetch = globalObject.fetch;
    }
    return lazyFetch.apply(globalObject, args);
  };
  return browserFetch;
})();
