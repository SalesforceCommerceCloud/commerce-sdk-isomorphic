/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import ClientConfig, { ClientConfigInit } from './clientConfig';

test('that empty clientConfig is created', () => {
  const expected: ClientConfig = {
    fetchOptions: {},
    headers: {},
    parameters: {},
    transformRequest: ClientConfig.defaults.transformRequest,
  };
  expect(new ClientConfig()).toEqual(expected);
});

test('should be created from init object', () => {
  // `init` is Required to ensure that all init options are tested
  const init: Required<ClientConfigInit> = {
    baseUri: 'https://example.com',
    fetchOptions: { keepalive: false },
    headers: { authorization: 'token' },
    parameters: { param: 'param' },
    proxy: 'https://proxy.com',
    transformRequest: (v) => v,
  };
  expect(new ClientConfig(init)).toEqual({ ...init });
});

test('the empty ClientConfig can be cloned', () => {
  const originalConfig = new ClientConfig();
  expect(new ClientConfig(originalConfig)).not.toBe(originalConfig);
  expect(new ClientConfig(originalConfig)).toEqual(originalConfig);
});

test('that clientConfig clones correctly', () => {
  const originalConfig = new ClientConfig();
  originalConfig.baseUri = 'http://www.example.com';
  originalConfig.proxy = 'http://www.proxy.com';
  originalConfig.headers = { authorization: 'token', 'Accept-Language': 'en-US,en;q=0.5' };
  originalConfig.parameters = { p1: 'v1', p2: 2 };
  originalConfig.fetchOptions = { timeout: 20 };

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

test('default transform request should only transform plain objects', () => {
  const transform = ClientConfig.defaults.transformRequest;
  let headers = {};
  // non-objects should not be modified, and should not modify headers
  expect(transform(null, headers)).toBeNull();
  expect(headers).toEqual({});
  expect(transform(undefined, {})).toBeUndefined();
  expect(headers).toEqual({});
  expect(transform('a string', {})).toBe('a string');
  expect(headers).toEqual({});
  // instances of classes should not be modified
  const blob = new Blob();
  expect(transform(blob, {})).toBe(blob);
  expect(headers).toEqual({});
  // plain objects should be converted to JSON and set Content-Type to stuff
  expect(transform({ plain: 'object' }, headers)).toBe('{"plain":"object"}');
  expect(headers).toEqual({ 'Content-Type': 'application/json' });
  headers = {};
  const protoless = Object.create(null);
  expect(transform(protoless, headers)).toBe('{}');
  expect(headers).toEqual({ 'Content-Type': 'application/json' });
});
