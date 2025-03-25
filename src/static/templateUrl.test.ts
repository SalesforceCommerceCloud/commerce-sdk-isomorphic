/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import TemplateURL from './templateUrl';

it.each([
  ['simple', 'http://example.com', 'http://example.com/simple'],
  ['simple', 'https://example.com', 'https://example.com/simple'],
  ['/simple', 'https://example.com', 'https://example.com/simple'],
  ['simple', 'https://example.com/', 'https://example.com/simple'],
  ['/simple', 'https://example.com/', 'https://example.com/simple'],
  ['longer/path', 'https://example.com', 'https://example.com/longer/path'],
])('combines %s and %s into %s', (url, base, expected) => {
  expect(new TemplateURL(url, base).toString()).toBe(expected);
});

it.each([
  [
    '{sub}',
    'http://example.com',
    {pathParams: {sub: 'one'}},
    'http://example.com/one',
  ],
  [
    '/{sub}',
    'http://example.com',
    {pathParams: {sub: 'one'}},
    'http://example.com/one',
  ],
  [
    '/simple/{sub}',
    'http://example.com',
    {pathParams: {sub: 'one'}},
    'http://example.com/simple/one',
  ],
  [
    '{sub}/{sub2}',
    'http://example.com',
    {pathParams: {sub: 'one', sub2: 'two'}},
    'http://example.com/one/two',
  ],
  [
    '{sub}/{sub2}',
    'http://{baseParam}.example.com',
    {pathParams: {baseParam: 'short', sub: 'one', sub2: 'two'}},
    'http://short.example.com/one/two',
  ],
  [
    '/categories/{id}',
    'http://example.com',
    {pathParams: {id: 'womens;,%$^@$(!3'}},
    'http://example.com/categories/womens%253B%252C%2525%2524%255E%2540%2524(!3',
  ],
])('combines %s, %s and %s into %s', (url, base, parameters, expected) => {
  expect(new TemplateURL(url, base, parameters).toString()).toBe(expected);
});

it.each([
  [
    'simple',
    'http://example.com',
    {queryParams: {sub: 'one'}},
    'http://example.com/simple?sub=one',
  ],
  [
    'simple',
    'http://example.com',
    {queryParams: {sub: ['one', 'two']}},
    'http://example.com/simple?sub=one%2Ctwo',
  ],
  [
    'simple',
    'http://example.com',
    {
      queryParams: {
        refine: ['price=(0..150)', 'c_refinementColor=Red'], // refine is a special case and will be a repeated query param
        expand: ['availability', 'images'], // default will be comma separated
      },
    },
    'http://example.com/simple?refine=price%3D%280..150%29&refine=c_refinementColor%3DRed&expand=availability%2Cimages',
    // URI decoded: http://example.com/simple?refine=price=(0..150)&refine=c_refinementColor=Red&expand=availability,images
  ],
])('combines %s, %s and %s into %s', (url, base, parameters, expected) => {
  expect(new TemplateURL(url, base, parameters).toString()).toBe(expected);
});

it.each([
  [
    'simple',
    'http://example.com',
    {origin: 'https://mydomain.test'},
    'https://mydomain.test/simple',
  ],
  [
    'simple',
    'http://example.com/basepath',
    {origin: 'https://mydomain.test'},
    'https://mydomain.test/basepath/simple',
  ],
  [
    'simple',
    'http://example.com',
    {origin: 'https://localhost:8080'},
    'https://localhost:8080/simple',
  ],
])('combines %s, %s and %s into %s', (url, base, parameters, expected) => {
  expect(new TemplateURL(url, base, parameters).toString()).toBe(expected);
});
