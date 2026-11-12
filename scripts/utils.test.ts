/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs-extra';
import path from 'path';
import {
  ecomRefForVersion,
  parseEcomVersion,
  parseEcomVersionArg,
  parseSingleApiArgs,
  readApiVersions,
  rejectUnknownArgs,
  setEcomVersionHeader,
} from './utils';

jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockApiVersionsFile = path.join(__dirname, '../api-versions.txt');

describe('readApiVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads each key and its bundle location, skipping comments and blanks', () => {
    mockedFs.readFileSync.mockReturnValue(`# APIs for ECOM v27.1
shopper-baskets-oas-v1=shopper/checkout/shopper-baskets/v1

  shopper-baskets-oas-v2 = shopper/checkout/shopper-baskets/v2
auth-oas-v1=shopper/shopper/auth/v1
`);

    expect(readApiVersions()).toEqual([
      {
        apiName: 'shopper-baskets-oas-v1',
        bundlePath: 'shopper/checkout/shopper-baskets/v1',
      },
      {
        apiName: 'shopper-baskets-oas-v2',
        bundlePath: 'shopper/checkout/shopper-baskets/v2',
      },
      {apiName: 'auth-oas-v1', bundlePath: 'shopper/shopper/auth/v1'},
    ]);
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      mockApiVersionsFile,
      'utf-8'
    );
  });

  it('throws when the file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);

    expect(() => readApiVersions()).toThrow(
      `API versions file not found at: ${mockApiVersionsFile}`
    );
  });

  it.each([
    ['a missing location', 'shopper-baskets-oas-v1='],
    ['a semantic version', 'shopper-baskets-oas-v1=1.12.0'],
    ['a parent-directory segment', 'shopper-baskets-oas-v1=../shopper/v1'],
    ['an absolute path', 'shopper-baskets-oas-v1=/shopper/checkout/v1'],
    ['a shell metacharacter', 'shopper-baskets-oas-v1=shopper/a;b/v1'],
    [
      'a version that differs from the key',
      'shopper-baskets-oas-v1=shopper/checkout/shopper-baskets/v2',
    ],
  ])('rejects %s', (_label, line) => {
    mockedFs.readFileSync.mockReturnValue(line);

    expect(() => readApiVersions()).toThrow('shopper-baskets-oas-v1');
  });

  it.each([
    [
      'a repeated key',
      'shopper-baskets-oas-v1=shopper/checkout/shopper-baskets/v1\nshopper-baskets-oas-v1=shopper/checkout/baskets/v1',
      'shopper-baskets-oas-v1',
    ],
    [
      'a repeated location',
      'shopper-baskets-oas-v1=shopper/checkout/shopper-baskets/v1\nbaskets-oas-v1=shopper/checkout/shopper-baskets/v1',
      'shopper/checkout/shopper-baskets/v1',
    ],
  ])('rejects %s', (_label, content, repeated) => {
    mockedFs.readFileSync.mockReturnValue(content);

    expect(() => readApiVersions()).toThrow(
      `api-versions.txt lists ${repeated} more than once`
    );
  });
});

describe('parseEcomVersion', () => {
  it('extracts the release from the header', () => {
    expect(parseEcomVersion('# APIs for ECOM v26.11\nfoo-oas-v1=1.0.0')).toBe(
      '26.11'
    );
  });

  it('throws when the header is missing', () => {
    expect(() => parseEcomVersion('foo-oas-v1=1.0.0')).toThrow(
      'missing the "# APIs for ECOM vXX.Y" header'
    );
  });
});

describe('ecomRefForVersion', () => {
  it('maps a release to its branch', () => {
    expect(ecomRefForVersion('27.1')).toBe('release.27.1');
  });
});

describe('parseEcomVersionArg', () => {
  it('reads the space-separated form', () => {
    expect(parseEcomVersionArg(['--ecom-version', '27.1'])).toBe('27.1');
  });

  it('reads the equals form', () => {
    expect(parseEcomVersionArg(['--ecom-version=27.2'])).toBe('27.2');
  });

  it('returns undefined when the flag is absent', () => {
    expect(parseEcomVersionArg(['--other', 'x'])).toBeUndefined();
  });

  it.each([['27'], ['v27.1'], ['27.1.0'], ['master']])(
    'rejects the malformed version %s',
    value => {
      expect(() => parseEcomVersionArg(['--ecom-version', value])).toThrow(
        'must look like 27.1'
      );
    }
  );

  it('rejects a flag with no value', () => {
    expect(() => parseEcomVersionArg(['--ecom-version'])).toThrow(
      'must look like 27.1'
    );
  });
});

describe('setEcomVersionHeader', () => {
  it('replaces the version and keeps every other line', () => {
    const before = '# APIs for ECOM v26.9\n# note\nfoo-oas-v1=1.0.0\n';
    expect(setEcomVersionHeader(before, '27.1')).toBe(
      '# APIs for ECOM v27.1\n# note\nfoo-oas-v1=1.0.0\n'
    );
  });

  it('keeps the line break when a blank line follows the header', () => {
    const before = '# APIs for ECOM v26.9\n\nfoo-oas-v1=1.0.0\n';
    expect(setEcomVersionHeader(before, '27.1')).toBe(
      '# APIs for ECOM v27.1\n\nfoo-oas-v1=1.0.0\n'
    );
  });

  it('throws when the header is missing', () => {
    expect(() => setEcomVersionHeader('foo-oas-v1=1.0.0', '27.1')).toThrow(
      'missing the "# APIs for ECOM vXX.Y" header'
    );
  });
});

describe('parseSingleApiArgs', () => {
  it('returns undefined when neither flag is present', () => {
    expect(parseSingleApiArgs(['--ecom-version', '27.1'])).toBeUndefined();
  });

  it('reads one api and a ref in the space-separated form', () => {
    expect(
      parseSingleApiArgs([
        '--api',
        'shopper-baskets-oas-v1',
        '--ref',
        'my-branch',
      ])
    ).toEqual({apis: ['shopper-baskets-oas-v1'], ref: 'my-branch'});
  });

  it('reads the equals form and repeated --api', () => {
    expect(
      parseSingleApiArgs([
        '--api=shopper-baskets-oas-v1',
        '--api',
        'shopper-baskets-oas-v2',
        '--ref=abc123',
      ])
    ).toEqual({
      apis: ['shopper-baskets-oas-v1', 'shopper-baskets-oas-v2'],
      ref: 'abc123',
    });
  });

  it('rejects --api without --ref', () => {
    expect(() => parseSingleApiArgs(['--api', 'a-oas-v1'])).toThrow(
      '--api requires --ref'
    );
  });

  it('rejects --ref without --api', () => {
    expect(() => parseSingleApiArgs(['--ref', 'master'])).toThrow(
      '--ref requires at least one --api'
    );
  });

  it('rejects a flag with no value', () => {
    expect(() => parseSingleApiArgs(['--api', '--ref', 'master'])).toThrow(
      '--api needs a value'
    );
    expect(() => parseSingleApiArgs(['--api', 'a-oas-v1', '--ref'])).toThrow(
      '--ref needs a value'
    );
  });

  it('rejects combining with --ecom-version', () => {
    expect(() =>
      parseSingleApiArgs([
        '--api',
        'a-oas-v1',
        '--ref',
        'master',
        '--ecom-version',
        '27.1',
      ])
    ).toThrow('cannot be combined with --ecom-version');
  });
});

describe('rejectUnknownArgs', () => {
  it.each([
    [[]],
    [['--ecom-version', '27.1']],
    [['--api', 'a-oas-v1', '--api=b-oas-v1', '--ref', 'my-branch']],
  ])('accepts known flags and their values: %j', argv => {
    expect(() => rejectUnknownArgs(argv)).not.toThrow();
  });

  it.each([
    [['--apis', 'a-oas-v1', '--ref', 'my-branch'], '--apis'],
    [['--ecom-verison', '27.1'], '--ecom-verison'],
    [['a-oas-v1'], 'a-oas-v1'],
    [['--ref', 'my-branch', 'extra'], 'extra'],
  ])(
    'rejects a mistyped or stray argument so it cannot fall through to a full refresh: %j',
    (argv, bad) => {
      expect(() => rejectUnknownArgs(argv)).toThrow(`Unknown argument ${bad}`);
    }
  );
});
