import { TemplateURL } from "./templateUrl";

it.each([
  ['simple', 'http://example.com', 'http://example.com/simple'],
  ['simple', 'https://example.com', 'https://example.com/simple'],
  ['/simple', 'https://example.com', 'https://example.com/simple'],
  ['simple', 'https://example.com/', 'https://example.com/simple'],
  ['/simple', 'https://example.com/', 'https://example.com/simple'],
  ['longer/path', 'https://example.com', 'https://example.com/longer/path']
])('combines %s and %s into %s', (url, base, expected) => {
  expect((new TemplateURL(url, base)).toString()).toBe(expected);
});

it.each([
  ['{sub}', 'http://example.com', { pathParams: { sub: 'one' }}, 'http://example.com/one'],
  ['/{sub}', 'http://example.com', { pathParams: { sub: 'one' }}, 'http://example.com/one'],
  ['/simple/{sub}', 'http://example.com', { pathParams: { sub: 'one' }}, 'http://example.com/simple/one'],
  ['{sub}/{sub2}', 'http://example.com', { pathParams: { sub: 'one', sub2: 'two' }}, 'http://example.com/one/two'],
  ['{sub}/{sub2}', 'http://{baseParam}.example.com', { pathParams: { baseParam: 'short', sub: 'one', sub2: 'two' }}, 'http://short.example.com/one/two'],
])('combines %s, %s and %s into %s', (url, base, parameters, expected) => {
  expect((new TemplateURL(url, base, parameters)).toString()).toBe(expected);
});