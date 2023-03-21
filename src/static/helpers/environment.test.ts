/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nodeFetch from 'node-fetch';
import {isNode, hasFetchAvailable, fetch} from './environment';

/* Just testing the node environment, testing the browser environment is too complex within the test cases. */

describe('Fetch', () => {
  test('Runs node-fetch if node', () => {
    expect(isNode).toBe(true);
    expect(hasFetchAvailable).toBe(false);
    expect(fetch).toBe(nodeFetch);
  });
});
