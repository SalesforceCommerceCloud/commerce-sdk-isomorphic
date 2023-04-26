/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nodeFetch from 'node-fetch';
import {isNode, fetch} from './environment';

const TIMEOUT = 7000; // 7 seconds

/* Just testing the node environment, testing the browser environment is too complex within the test cases. */

describe('Fetch', () => {
  test('Runs node-fetch if node', () => {
    expect(isNode).toBe(true);
    expect(fetch).toBe(nodeFetch);
  });
  test('Make sure the fetch that is imported is actually a function and not an object', () => {
    expect(typeof fetch).toBe('function');
  });
  test('fetch actually works', () => {
    fetch('https://example.com')
    .then((res) => {
      expect(res.status).toBe(200);
    }).catch((err) => {
      fail(err);
    });
  }, TIMEOUT);
});
