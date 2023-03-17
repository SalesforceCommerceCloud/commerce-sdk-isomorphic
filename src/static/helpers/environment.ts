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

export const hasFetchAvailable =
  typeof global.fetch === 'function' && typeof global.Request === 'function';
