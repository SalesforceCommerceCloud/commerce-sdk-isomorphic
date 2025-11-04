/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nodeFetch from 'node-fetch';
import {isNode, fetch} from './environment';

const TIMEOUT = 7000; // 7 seconds

jest.mock('node-fetch', () => {
  const actual = jest.requireActual<typeof import('node-fetch')>('node-fetch');
  const impl = (actual.default ?? actual) as (
    ...args: unknown[]
  ) => Promise<unknown>;
  const mock = jest.fn((...args: unknown[]) => impl(...args));
  return Object.assign(mock, {default: mock});
});

/* Just testing the node environment, testing the browser environment is too complex within the test cases. */
describe('Fetch', () => {
  const nodeFetchMock = nodeFetch as unknown as jest.Mock;

  beforeEach(() => {
    nodeFetchMock.mockClear();
  });

  test('delegates to node-fetch in node environments', async () => {
    expect(isNode).toBe(true);
    await fetch('https://example.com');
    expect(nodeFetchMock).toHaveBeenCalled();
  });
  test('Make sure the fetch that is imported is actually a function and not an object', () => {
    expect(typeof fetch).toBe('function');
  });
  test('reuses the resolved polyfill after the first call', async () => {
    await fetch('https://example.com?first');
    expect(nodeFetchMock).toHaveBeenCalledTimes(1);

    await fetch('https://example.com?second');
    expect(nodeFetchMock).toHaveBeenCalledTimes(2);
  });
  test(
    'fetch actually works',
    () => {
      fetch('https://example.com')
        .then(res => {
          expect(res.status).toBe(200);
        })
        .catch(err => {
          fail(err);
        });
    },
    TIMEOUT
  );
});
