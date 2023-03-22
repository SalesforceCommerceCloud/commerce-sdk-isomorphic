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
    // eslint-disable-next-line global-require, @typescript-eslint/no-unsafe-return
    return require('node-fetch');
  }

  if (!hasFetchAvailable)
    throw new Error(
      'Bad environment: it is not a node environment but fetch is not defined'
    );

  return globalObject.fetch;
})();
