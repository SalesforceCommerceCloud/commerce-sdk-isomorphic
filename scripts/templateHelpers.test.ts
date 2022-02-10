/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {amf} from '@commerce-apps/raml-toolkit';
import {
  addNamespace,
  formatForTsDoc,
  getPathParameterTypeMapFromEndpoints,
  getQueryParameterTypeMapFromEndpoints,
  getParameterTypes,
  isAllowedTrait,
  loud,
} from './templateHelpers';
import {ASSET_OBJECT_MAP} from './config';

/** Technically, `type` could be much more, but for tests this will do. AMF is tricky. */
const createParameter = (name: string, type: 'string' | 'boolean') => {
  const param = new amf.model.domain.Parameter();
  param.withName(name);
  const schema = new amf.model.domain.ScalarShape();
  schema.withDataType(`http://www.w3.org/2001/XMLSchema#${type}`);
  param.withSchema(schema);
  return param;
};

beforeAll(async () => amf.AMF.init());

describe('When adding namespaces to individual content (types)', () => {
  it('Prefixes the namespace successfully ', () => {
    expect(addNamespace('foo', 'types')).toStrictEqual('types.foo');
  });

  it('Will not prefix void with a namespace', () => {
    expect(addNamespace('void', 'types')).toStrictEqual('void');
  });

  it('Will not prefix object with a namespace', () => {
    expect(addNamespace('object', 'types')).toStrictEqual('object');
  });

  it('Will not prefix Object with a namespace', () => {
    expect(addNamespace('object', 'types')).toStrictEqual('object');
  });

  it('Throws an error when content is not a string', () => {
    // The type assertion is required to test the implementation when the types are violated
    const content = null as unknown as string;
    expect(() => addNamespace(content, 'types')).toThrow('Invalid content');
  });

  it('Throws an error when the type is not a valid string', () => {
    // The type assertion is required to test the implementation when the types are violated
    const namespace = null as unknown as string;
    expect(() => addNamespace('Foo', namespace)).toThrow('Invalid namespace');
  });

  it('Throws an error when the type is empty string', () => {
    expect(() => addNamespace(' ', 'types')).toThrow('Empty type found');
  });
});

describe('When adding namespaces to elements in a complex content (an array)', () => {
  it('Prefixes each element with a namespace', () => {
    expect(addNamespace('Array<Foo | Baa>', 'types')).toStrictEqual(
      'Array<types.Foo | types.Baa>'
    );
  });

  it('Correctly parses three elements in an array', () => {
    expect(addNamespace('Array<Foo | Baa | Bar>', 'types')).toStrictEqual(
      'Array<types.Foo | types.Baa | types.Bar>'
    );
  });

  it('Throws an error when the array is empty', () => {
    expect(() => addNamespace('Array<>', 'types')).toThrow(
      'Array type has no content'
    );
  });

  it('Throws an error when adding a type to an empty array element', () => {
    expect(() => addNamespace('Array<Foo | | Baa>', 'types')).toThrow(
      'Empty type found'
    );
  });
});

describe('Test formatForTsDoc template help function', () => {
  it('returns empty string for empty string', () => {
    expect(formatForTsDoc('')).toStrictEqual('');
  });

  it('returns "test" for "test"', () => {
    expect(formatForTsDoc('test')).toStrictEqual('test');
  });

  it('returns already escaped tag', () => {
    expect(formatForTsDoc('this is a \\<tag\\>')).toStrictEqual(
      'this is a \\<tag\\>'
    );
  });

  it('returns escaped tag in brackets', () => {
    expect(formatForTsDoc('my {<tag>}')).toStrictEqual('my \\{\\<tag\\>\\}');
  });

  it('returns escaped tag for html', () => {
    expect(formatForTsDoc('this is a <tag>')).toStrictEqual(
      'this is a \\<tag\\>'
    );
  });

  it('returns escaped brackets for brackets', () => {
    expect(formatForTsDoc('this is {escaped}')).toStrictEqual(
      'this is \\{escaped\\}'
    );
  });

  it('returns unescaped newlines for escapeed newlines', () => {
    expect(formatForTsDoc('this is a newline\\n')).toStrictEqual(
      'this is a newline\n'
    );
  });

  it('returns newlines for newlines', () => {
    expect(formatForTsDoc('this is a newline\n')).toStrictEqual(
      'this is a newline\n'
    );
  });

  it('returns unescaped tabs for escaped tabs', () => {
    expect(formatForTsDoc('this is a\\ttab')).toStrictEqual('this is a tab');
  });

  it('returns tabs for tabs', () => {
    expect(formatForTsDoc('this is a\ttab')).toStrictEqual('this is a\ttab');
  });

  it('returns leading whitespace for 1 space in front', () => {
    expect(formatForTsDoc('\n this is an indented line')).toStrictEqual(
      '\n this is an indented line'
    );
  });

  it('returns leading whitespace for 3 spaces in front', () => {
    expect(formatForTsDoc('\n   this is an indented line')).toStrictEqual(
      '\n   this is an indented line'
    );
  });

  it('returns collapsed leading whitespace for 5 spaces in front', () => {
    expect(formatForTsDoc('\n     this is an indented line')).toStrictEqual(
      '\n   this is an indented line'
    );
  });

  it('returns whitespace for 5 spaces in middle', () => {
    expect(formatForTsDoc('\nthis is a spaced     line')).toStrictEqual(
      '\nthis is a spaced     line'
    );
  });
});

describe('Test loud template helper function', () => {
  it("returns 'FOO' for 'foo' input", () => {
    expect(loud('foo')).toBe('FOO');
  });

  it("returns 'FOO' for 'FOO' input", () => {
    expect(loud('FOO')).toBe('FOO');
  });

  it("returns '' for '' input", () => {
    expect(loud('')).toBe('');
  });
});

describe('Allowed trait check', () => {
  it('returns true for upper camel case names', () => {
    const trait = new amf.model.domain.Trait();
    trait.withName('OffsetPaginated');
    expect(isAllowedTrait(trait)).toBe(true);
  });

  it('returns true for lower camel case names', () => {
    const trait = new amf.model.domain.Trait();
    trait.withName('offsetPaginated');
    expect(isAllowedTrait(trait)).toBe(true);
  });

  it('returns false for kebab case names', () => {
    const trait = new amf.model.domain.Trait();
    trait.withName('offset-paginated');
    expect(isAllowedTrait(trait)).toBe(false);
  });

  it('returns false for snake case names', () => {
    const trait = new amf.model.domain.Trait();
    trait.withName('offset_paginated');
    expect(isAllowedTrait(trait)).toBe(false);
  });

  it('returns false for multi-word names', () => {
    const trait = new amf.model.domain.Trait();
    trait.withName('offset paginated');
    expect(isAllowedTrait(trait)).toBe(false);
  });
});

describe('getParameterTypes', () => {
  it('converts a list of parameters to a type map', () => {
    expect(
      getParameterTypes([
        createParameter('name', 'string'),
        createParameter('flag', 'boolean'),
      ])
    ).toEqual({
      name: 'string',
      flag: 'boolean',
    });
  });

  it('merges duplicate parameters', () => {
    expect(
      getParameterTypes([
        createParameter('name', 'string'),
        createParameter('name', 'string'),
      ])
    ).toEqual({
      name: 'string',
    });
  });

  it('preserves all types for duplicate names but different types', () => {
    expect(
      getParameterTypes([
        createParameter('anything', 'string'),
        createParameter('anything', 'boolean'),
      ])
    ).toEqual({
      anything: 'string | boolean',
    });
  });

  it('returns an empty object for an empty list', () => {
    expect(getParameterTypes([])).toEqual({});
  });
});

describe('getPathParameterTypeMapFromEndpoints', () => {
  const createEndpoint = (parameters: amf.model.domain.Parameter[]) => {
    const endpoint = new amf.model.domain.EndPoint();
    endpoint.withParameters(parameters);
    return endpoint;
  };

  it('converts a list of endpoints to a map of types from the path parameters', () => {
    expect(
      getPathParameterTypeMapFromEndpoints([
        createEndpoint([createParameter('name', 'string')]),
        createEndpoint([createParameter('flag', 'boolean')]),
      ])
    ).toEqual({
      name: 'string',
      flag: 'boolean',
    });
  });

  it('merges duplicate parameters across endpoints', () => {
    expect(
      getPathParameterTypeMapFromEndpoints([
        createEndpoint([createParameter('name', 'string')]),
        createEndpoint([createParameter('name', 'string')]),
      ])
    ).toEqual({
      name: 'string',
    });
  });

  it('preserves all types for duplicate names but different types across endpoints', () => {
    expect(
      getPathParameterTypeMapFromEndpoints([
        createEndpoint([createParameter('name', 'string')]),
        createEndpoint([createParameter('name', 'boolean')]),
      ])
    ).toEqual({
      name: 'string | boolean',
    });
  });

  it('returns an empty object for an empty list', () => {
    expect(getPathParameterTypeMapFromEndpoints([])).toEqual({});
  });
});

describe('getQueryParameterTypeMapFromEndpoints', () => {
  const createEndpoint = (parameters: amf.model.domain.Parameter[]) => {
    const endpoint = new amf.model.domain.EndPoint();
    endpoint.withOperations(
      parameters.map(param => {
        const req = new amf.model.domain.Request();
        req.withQueryParameters([param]);
        const op = new amf.model.domain.Operation();
        op.withRequest(req);
        return op;
      })
    );
    return endpoint;
  };

  it('converts a list of endpoints to a map of types from the query parameters', () => {
    expect(
      getQueryParameterTypeMapFromEndpoints([
        createEndpoint([createParameter('name', 'string')]),
        createEndpoint([createParameter('flag', 'boolean')]),
      ])
    ).toEqual({
      name: 'string',
      flag: 'boolean',
    });
  });

  it('merges duplicate parameters across endpoints', () => {
    expect(
      getQueryParameterTypeMapFromEndpoints([
        createEndpoint([createParameter('name', 'string')]),
        createEndpoint([createParameter('name', 'string')]),
      ])
    ).toEqual({
      name: 'string',
    });
  });

  it('preserves all types for duplicate names but different types across endpoints', () => {
    expect(
      getQueryParameterTypeMapFromEndpoints([
        createEndpoint([createParameter('name', 'string')]),
        createEndpoint([createParameter('name', 'boolean')]),
      ])
    ).toEqual({
      name: 'string | boolean',
    });
  });

  it('returns an empty object for an empty list', () => {
    expect(getQueryParameterTypeMapFromEndpoints([])).toEqual({});
  });

  it('works when an operation has no requests', () => {
    new amf.model.domain.EndPoint().withOperations([
      new amf.model.domain.Operation(),
    ]);
  });
});
