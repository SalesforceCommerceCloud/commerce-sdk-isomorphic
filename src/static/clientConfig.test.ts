/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import ClientConfig, { ClientConfigInit } from './clientConfig';

describe('ClientConfig constructor', () => {
  test('will throw if missing shortCode parameter', () => {
  // Type assertion is necessary because we're violating the type to test the implementation
    expect(() => new ClientConfig({} as ClientConfigInit<any>)).toThrow('Missing required parameter: shortCode');
  });

  test('creates an instance from an init object', () => {
  // `init` is Required<> to ensure that all init options are tested
    const init: Required<ClientConfigInit<any>> = {
      baseUri: 'https://example.com',
      fetchOptions: { keepalive: false },
      headers: { authorization: 'token' },
      parameters: { param: 'param', shortCode: 'shortCode' },
      proxy: 'https://proxy.com',
      transformRequest: (v) => v,
    };
    expect(new ClientConfig(init)).toEqual({ ...init });
  });

  test('can clone another instance', () => {
    const originalConfig = new ClientConfig({
      baseUri: 'http://www.example.com',
      proxy: 'http://www.proxy.com',
      headers: { authorization: 'token', 'Accept-Language': 'en-US,en;q=0.5' },
      parameters: { shortCode: 'shortCode', p1: 'v1', p2: 2 },
      fetchOptions: { timeout: 20 },
    });

    const newConfig = new ClientConfig(originalConfig);
    expect(newConfig).not.toBe(originalConfig);
    expect(newConfig).toEqual(originalConfig);

    // We want to make sure we're cloning by value and not reference
    newConfig.baseUri = 'updated';
    expect(newConfig.baseUri).not.toEqual(originalConfig.baseUri);

    newConfig.proxy = 'new proxy';
    expect(newConfig.proxy).not.toEqual(originalConfig.proxy);

    newConfig.headers.authorization = 'newToken';
    expect(newConfig.headers.authorization).not.toEqual(originalConfig.headers.authorization);

    newConfig.parameters.p1 = 'new value';
    expect(newConfig.parameters.p1).not.toEqual(originalConfig.parameters.p1);

    newConfig.fetchOptions = { timeout: 400 };
    expect(newConfig.fetchOptions.timeout).not.toEqual(originalConfig.fetchOptions.timeout);
  });
});

describe('ClientConfig defaults', () => {
  describe('transform request', () => {
    const transform = ClientConfig.defaults.transformRequest;
    let headers: { [key: string]: string };

    beforeEach(() => {
      headers = {};
    });

    test('does not modify body or headers for primitive values', () => {
      expect(transform(null, headers)).toBeNull();
      expect(headers).toEqual({});

      expect(transform(undefined, headers)).toBeUndefined();
      expect(headers).toEqual({});

      expect(transform('a string', headers)).toBe('a string');
      expect(headers).toEqual({});
    });

    test('does not modify body or headers for non-plain objects', () => {
      const blob = new Blob();
      expect(transform(blob, headers)).toBe(blob);
      expect(headers).toEqual({});
    });

    test('converts plain objects to JSON and sets Content-Type header', () => {
      expect(transform({ plain: 'object' }, headers)).toBe('{"plain":"object"}');
      expect(headers).toEqual({ 'Content-Type': 'application/json' });

      headers = {};
      expect(transform(Object.create(null), headers)).toBe('{}');
      expect(headers).toEqual({ 'Content-Type': 'application/json' });
    });

    test('converts arrays to JSON and sets Content-Type header', () => {
      expect(transform([1, 2, 3], headers)).toBe('[1,2,3]');
      expect(headers).toEqual({ 'Content-Type': 'application/json' });
    });
  });
});
