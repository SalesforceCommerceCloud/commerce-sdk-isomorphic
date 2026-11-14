/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import {
  findApiFolders,
  getEcomBundlesRoot,
  loadBundledApi,
  resolveEcomOasRef,
} from './ecom-oas';
import {readApiVersions} from './utils';

describe('resolveEcomOasRef', () => {
  const originalRef = process.env.ECOM_OAS_REF;

  beforeEach(() => {
    delete process.env.ECOM_OAS_REF;
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue('# APIs for ECOM v26.9\nfoo-oas-v1=shopper/foo/foo/v1');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalRef === undefined) {
      delete process.env.ECOM_OAS_REF;
    } else {
      process.env.ECOM_OAS_REF = originalRef;
    }
  });

  it('uses the release in the api-versions header by default', () => {
    expect(resolveEcomOasRef()).toBe('release.26.9');
  });

  it('prefers an explicit version over the header', () => {
    expect(resolveEcomOasRef('27.1')).toBe('release.27.1');
  });

  it('prefers ECOM_OAS_REF over both', () => {
    process.env.ECOM_OAS_REF = ' master ';
    expect(resolveEcomOasRef('27.1')).toBe('master');
  });
});

describe('getEcomBundlesRoot', () => {
  const original = process.env.ECOM_BUNDLES_ROOT;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ECOM_BUNDLES_ROOT;
    } else {
      process.env.ECOM_BUNDLES_ROOT = original;
    }
  });

  it('trims whitespace and trailing slashes so sparse-checkout paths join cleanly', () => {
    process.env.ECOM_BUNDLES_ROOT = ' some/bundles//\n';
    expect(getEcomBundlesRoot()).toBe('some/bundles');
  });

  it('fails with a pointer to the docs when unset', () => {
    delete process.env.ECOM_BUNDLES_ROOT;
    expect(() => getEcomBundlesRoot()).toThrow('ECOM_BUNDLES_ROOT is not set');
  });
});

describe('committed api-versions.txt', () => {
  it('maps every API to a bundle location exactly once', () => {
    const apis = readApiVersions();
    expect(apis.length).toBeGreaterThan(0);
    expect(new Set(apis.map(({apiName}) => apiName)).size).toBe(apis.length);
    expect(new Set(apis.map(({bundlePath}) => bundlePath)).size).toBe(
      apis.length
    );
  });
});

describe('findApiFolders', () => {
  let apisDir: string;

  const writeFolder = (name: string, assetId: string, apiVersion: string) => {
    fs.ensureDirSync(path.join(apisDir, name));
    fs.writeJSONSync(path.join(apisDir, name, 'exchange.json'), {
      assetId,
      apiVersion,
    });
  };

  beforeEach(() => {
    apisDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apis-'));
  });

  afterEach(() => {
    fs.removeSync(apisDir);
  });

  it('matches by assetId and apiVersion, not by folder name', () => {
    writeFolder('shopper-baskets-oas-1.9.0', 'shopper-baskets-oas', 'v1');
    writeFolder('shopper-baskets-oas-2.1.0', 'shopper-baskets-oas', 'v2');
    writeFolder('shopper-payments-oas-1.1.0', 'shopper-payments-oas', 'v1');

    expect(findApiFolders(apisDir, 'shopper-baskets-oas-v1')).toEqual([
      path.join(apisDir, 'shopper-baskets-oas-1.9.0'),
    ]);
  });

  it('returns nothing when the API has no folder yet', () => {
    writeFolder('shopper-payments-oas-1.1.0', 'shopper-payments-oas', 'v1');
    expect(findApiFolders(apisDir, 'shopper-baskets-oas-v1')).toEqual([]);
  });

  it('ignores folders without an exchange.json', () => {
    fs.ensureDirSync(path.join(apisDir, 'stray'));
    expect(findApiFolders(apisDir, 'shopper-baskets-oas-v1')).toEqual([]);
  });

  it('returns nothing when the apis directory does not exist', () => {
    expect(findApiFolders(path.join(apisDir, 'missing'), 'a-oas-v1')).toEqual(
      []
    );
  });
});

describe('loadBundledApi', () => {
  let bundlesRoot: string;
  const bundlePath = 'shopper/checkout/shopper-baskets/v1';
  const publicFile = 'shopper-baskets-oas-v1-public-1.12.3-current.yaml';
  const specText = 'openapi: 3.0.3\ninfo:\n  title: Shopper Baskets\n';

  const writeBundle = (manifestOverrides: Record<string, unknown> = {}) => {
    const dir = path.join(bundlesRoot, bundlePath);
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, publicFile), specText);
    fs.writeJSONSync(path.join(dir, 'manifest.json'), {
      apiType: 'shopper',
      apiFamily: 'checkout',
      apiName: 'shopper-baskets',
      apiVersion: 'v1',
      schemaVersion: '1.12.3',
      status: 'current',
      internalOnly: false,
      artifacts: {
        public: {
          path: `${bundlePath}/${publicFile}`,
          sha256: crypto.createHash('sha256').update(specText).digest('hex'),
        },
      },
      ...manifestOverrides,
    });
  };

  beforeEach(() => {
    bundlesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bundles-'));
  });

  afterEach(() => {
    fs.removeSync(bundlesRoot);
  });

  it('describes the public bundle from its manifest', () => {
    writeBundle();

    expect(
      loadBundledApi(bundlesRoot, 'shopper-baskets-oas-v1', bundlePath)
    ).toEqual({
      assetId: 'shopper-baskets-oas',
      apiVersion: 'v1',
      version: '1.12.3',
      name: 'Shopper Baskets OAS',
      publicSpec: path.join(bundlesRoot, bundlePath, publicFile),
    });
  });

  it('names auth the way the generator expects', () => {
    writeBundle({apiName: 'auth'});

    expect(loadBundledApi(bundlesRoot, 'auth-oas-v1', bundlePath).name).toBe(
      'Auth OAS'
    );
  });

  it('fails when the ref has no bundle at that location', () => {
    expect(() =>
      loadBundledApi(bundlesRoot, 'shopper-baskets-oas-v1', bundlePath)
    ).toThrow(`No bundle manifest for shopper-baskets-oas-v1 at ${bundlePath}`);
  });

  it('fails when the manifest names a different API', () => {
    writeBundle({apiName: 'shopper-orders'});

    expect(() =>
      loadBundledApi(bundlesRoot, 'shopper-baskets-oas-v1', bundlePath)
    ).toThrow('describes shopper-orders-oas-v1');
  });

  it('refuses an internal-only API', () => {
    writeBundle({internalOnly: true, artifacts: {}});

    expect(() =>
      loadBundledApi(bundlesRoot, 'shopper-baskets-oas-v1', bundlePath)
    ).toThrow('internal-only');
  });

  it.each([
    ['another directory', `shopper/checkout/shopper-orders/v1/${publicFile}`],
    [
      'a parent-directory segment',
      `${bundlePath}/../../shopper-orders/v1/${publicFile}`,
    ],
  ])(
    "refuses an artifact path outside the API's own bundle directory: %s",
    (_label, artifactPath) => {
      writeBundle({
        artifacts: {public: {path: artifactPath, sha256: 'x'}},
      });

      expect(() =>
        loadBundledApi(bundlesRoot, 'shopper-baskets-oas-v1', bundlePath)
      ).toThrow(`outside ${bundlePath}`);
    }
  );

  it('refuses a schema version that is not semantic', () => {
    writeBundle({schemaVersion: undefined});

    expect(() =>
      loadBundledApi(bundlesRoot, 'shopper-baskets-oas-v1', bundlePath)
    ).toThrow('schema version');
  });

  it('fails when the public bundle does not match its recorded hash', () => {
    writeBundle();
    fs.appendFileSync(path.join(bundlesRoot, bundlePath, publicFile), 'x');

    expect(() =>
      loadBundledApi(bundlesRoot, 'shopper-baskets-oas-v1', bundlePath)
    ).toThrow('does not match the SHA-256');
  });
});
