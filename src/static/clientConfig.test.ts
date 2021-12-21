/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {BaseUriParameters} from 'lib/helpers';
import ClientConfig, {ClientConfigInit} from './clientConfig';

describe('ClientConfig constructor', () => {
  test('will throw if missing shortCode parameter', () => {
    // Type assertion is necessary because we're violating the type to test the implementation
    expect(
      () => new ClientConfig({} as ClientConfigInit<BaseUriParameters>)
    ).toThrow('Missing required parameter: shortCode');
  });

  test('creates an instance from an init object', () => {
    const parameters = {param: 'param', shortCode: 'shortCode'};
    // `init` is Required<> to ensure that all init options are tested
    const init: Required<ClientConfigInit<typeof parameters>> = {
      baseUri: 'https://example.com',
      fetchOptions: {keepalive: false},
      headers: {authorization: 'token'},
      parameters,
      proxy: 'https://proxy.com',
      transformRequest: ClientConfig.defaults.transformRequest,
      throwOnBadResponse: false,
    };
    expect(new ClientConfig(init)).toEqual({...init});
  });

  test('can clone another instance', () => {
    const originalConfig = new ClientConfig({
      baseUri: 'http://www.example.com',
      proxy: 'http://www.proxy.com',
      headers: {authorization: 'token', 'Accept-Language': 'en-US,en;q=0.5'},
      parameters: {shortCode: 'shortCode', p1: 'v1', p2: 2},
      fetchOptions: {timeout: 20},
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
    expect(newConfig.headers.authorization).not.toEqual(
      originalConfig.headers.authorization
    );

    newConfig.parameters.p1 = 'new value';
    expect(newConfig.parameters.p1).not.toEqual(originalConfig.parameters.p1);

    newConfig.fetchOptions = {timeout: 400};
    expect(newConfig.fetchOptions.timeout).not.toEqual(
      originalConfig.fetchOptions.timeout
    );
  });
});

describe('ClientConfig defaults', () => {
  describe('transform request', () => {
    const transform = ClientConfig.defaults.transformRequest;

    test('converts to JSON for Content-Type application/json', () => {
      expect(
        transform({json: true}, {'Content-Type': 'application/json'})
      ).toEqual('{"json":true}');
    });

    test('creates a URLSearchParams object for Content-Type application/x-www-form-urlencoded', () => {
      const actual = transform(
        {url: 'search', params: true},
        {'Content-Type': 'application/x-www-form-urlencoded'}
      );
      expect(actual).toBeInstanceOf(URLSearchParams);
      // Wrapping in a Map so that .toEqual will work properly
      expect(new Map(actual as URLSearchParams)).toEqual(
        new Map([
          ['url', 'search'],
          ['params', 'true'],
        ])
      );
    });

    test('does nothing for unknown Content-Type', () => {
      const input = {some: 'input'};
      expect(transform(input, {})).toBe(input);
    });
  });
});
