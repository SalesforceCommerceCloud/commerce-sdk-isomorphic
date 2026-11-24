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
import childProcess, {execFileSync} from 'child_process';
import {
  BundledApi,
  envWithoutGitRepoVariables,
  fetchEcomBundles,
  findApiFolders,
  getEcomBundlesRoot,
  loadBundledApi,
  replaceApis,
  resolveEcomOasRef,
  stageApi,
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
    fs.writeFileSync(
      path.join(apisDir, name, `${assetId}-${apiVersion}-public.yaml`),
      ''
    );
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

  it('ignores folders without a spec file', () => {
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
      publicSpec: path.join(bundlesRoot, bundlePath, publicFile),
    });
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

describe('stageApi', () => {
  let workDir: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-'));
  });

  afterEach(() => {
    fs.removeSync(workDir);
  });

  it('writes only the public spec, without ECOM internal header comments', () => {
    const publicSpec = path.join(workDir, 'bundle.yaml');
    fs.writeFileSync(
      publicSpec,
      '# internal source path\n# internal build command\nopenapi: 3.0.3\n# kept\n'
    );
    const api: BundledApi = {
      assetId: 'shopper-baskets-oas',
      apiVersion: 'v1',
      version: '1.12.3',
      publicSpec,
    };
    const stagedDir = path.join(workDir, 'staged');

    expect(stageApi(api, stagedDir)).toBe('shopper-baskets-oas-1.12.3');

    const folder = path.join(stagedDir, 'shopper-baskets-oas-1.12.3');
    expect(fs.readdirSync(folder)).toEqual([
      'shopper-baskets-oas-v1-public.yaml',
    ]);
    expect(
      fs.readFileSync(
        path.join(folder, 'shopper-baskets-oas-v1-public.yaml'),
        'utf-8'
      )
    ).toBe('openapi: 3.0.3\n# kept\n');
  });
});

describe('replaceApis', () => {
  let workDir: string;
  let stagedDir: string;
  let apisDir: string;
  let backupDir: string;

  const writeApi = (root: string, assetId: string, version: string) => {
    const folder = path.join(root, `${assetId}-${version}`);
    fs.ensureDirSync(folder);
    fs.writeFileSync(path.join(folder, `${assetId}-v1-public.yaml`), version);
  };

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'replace-'));
    stagedDir = path.join(workDir, 'staged');
    apisDir = path.join(workDir, 'apis');
    backupDir = path.join(workDir, 'old');
    writeApi(apisDir, 'a-oas', '1.0.0');
    writeApi(apisDir, 'b-oas', '1.0.0');
    writeApi(stagedDir, 'a-oas', '1.1.0');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.removeSync(workDir);
  });

  it('replaces only the named keys on a partial update and backs up the old state', () => {
    replaceApis({stagedDir, apisDir, backupDir, keys: ['a-oas-v1']});

    expect(fs.readdirSync(apisDir).sort()).toEqual([
      'a-oas-1.1.0',
      'b-oas-1.0.0',
    ]);
    expect(fs.readdirSync(backupDir).sort()).toEqual([
      'a-oas-1.0.0',
      'b-oas-1.0.0',
    ]);
  });

  it('empties the apis directory first on a full refresh', () => {
    replaceApis({stagedDir, apisDir, backupDir});

    expect(fs.readdirSync(apisDir)).toEqual(['a-oas-1.1.0']);
  });

  it('restores the apis directory and rethrows when copying fails', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const realCopySync = fs.copySync.bind(fs);
    let calls = 0;
    jest.spyOn(fs, 'copySync').mockImplementation(((
      src: string,
      dest: string
    ) => {
      calls += 1;
      // First call is the backup, second is the staged copy.
      if (calls === 2) {
        throw new Error('disk full');
      }
      realCopySync(src, dest);
    }) as typeof fs.copySync);

    expect(() => replaceApis({stagedDir, apisDir, backupDir})).toThrow(
      'disk full'
    );
    expect(fs.readdirSync(apisDir).sort()).toEqual([
      'a-oas-1.0.0',
      'b-oas-1.0.0',
    ]);
  });
});

describe('envWithoutGitRepoVariables', () => {
  const originalEnv = {...process.env};

  afterEach(() => {
    Object.keys(process.env).forEach(name => {
      if (!(name in originalEnv)) {
        delete process.env[name];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  it('removes the variables that point git at another repository', () => {
    process.env.GIT_DIR = '/hook/repo/.git';
    process.env.GIT_WORK_TREE = '/hook/repo';
    process.env.GIT_INDEX_FILE = '/hook/repo/.git/index';

    const env = envWithoutGitRepoVariables();

    expect(env.GIT_DIR).toBeUndefined();
    expect(env.GIT_WORK_TREE).toBeUndefined();
    expect(env.GIT_INDEX_FILE).toBeUndefined();
  });

  it('keeps authentication, transport and config variables so ECOM fetches can still authenticate', () => {
    const preserved = {
      GIT_ASKPASS: '/path/to/askpass',
      GIT_SSH_COMMAND: 'ssh -i /path/to/key',
      GIT_TERMINAL_PROMPT: '0',
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.extraHeader',
      GIT_CONFIG_VALUE_0: 'Authorization: placeholder',
      GIT_CONFIG_PARAMETERS: "'http.extraHeader=Authorization: placeholder'",
    };
    Object.assign(process.env, preserved);

    expect(envWithoutGitRepoVariables()).toMatchObject(preserved);
  });
});

describe('fetchEcomBundles', () => {
  const bundlesRoot = 'bundles';
  const bundlePath = 'shopper/checkout/shopper-baskets/v1';
  const originalEnv = {...process.env};
  let workDir: string;
  let commit: string;

  const git = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, {
      cwd,
      env: envWithoutGitRepoVariables(),
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .toString()
      .trim();

  beforeAll(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fetch-'));
    const origin = path.join(workDir, 'origin');
    fs.ensureDirSync(path.join(origin, bundlesRoot, bundlePath));
    fs.ensureDirSync(path.join(origin, bundlesRoot, 'other/dir/api/v1'));
    fs.writeFileSync(
      path.join(origin, bundlesRoot, bundlePath, 'manifest.json'),
      '{}'
    );
    fs.writeFileSync(
      path.join(origin, bundlesRoot, 'other/dir/api/v1/manifest.json'),
      '{}'
    );
    git(origin, 'init', '-q', '-b', 'main');
    git(origin, 'config', 'uploadpack.allowFilter', 'true');
    git(origin, 'config', 'uploadpack.allowAnySHA1InWant', 'true');
    git(origin, 'add', '.');
    git(
      origin,
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '-q',
      '--no-gpg-sign',
      '-m',
      'bundles'
    );
    commit = git(origin, 'rev-parse', 'HEAD');
    process.env.ECOM_REPO_URL = `file://${origin}`;
    process.env.ECOM_BUNDLES_ROOT = bundlesRoot;
  });

  afterAll(() => {
    process.env = originalEnv;
    fs.removeSync(workDir);
  });

  it('checks out only the requested bundles and reports the resolved commit', () => {
    const target = path.join(workDir, 'checkout');

    const result = fetchEcomBundles(target, 'main', [bundlePath]);

    expect(result.commit).toBe(commit);
    expect(result.bundlesPath).toBe(path.join(target, bundlesRoot));
    expect(
      fs.existsSync(path.join(result.bundlesPath, bundlePath, 'manifest.json'))
    ).toBe(true);
    expect(fs.existsSync(path.join(result.bundlesPath, 'other'))).toBe(false);
  });

  // Jest hands tests a copy of process.env that child processes never see, so the
  // only way to observe the scrubbing is through the env passed to git.
  it('does not pass a hook-inherited GIT_DIR on to git', () => {
    process.env.GIT_DIR = '/hook/repo/.git';
    const execSpy = jest.spyOn(childProcess, 'execFileSync');

    try {
      fetchEcomBundles(path.join(workDir, 'checkout-under-hook'), 'main', [
        bundlePath,
      ]);

      expect(execSpy).toHaveBeenCalled();
      execSpy.mock.calls.forEach(([, , options]) => {
        expect(options?.env).toBeDefined();
        expect(options?.env).not.toHaveProperty('GIT_DIR');
      });
    } finally {
      execSpy.mockRestore();
      delete process.env.GIT_DIR;
    }
  });

  it('fails with an actionable message when the ref does not exist', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      fetchEcomBundles(path.join(workDir, 'missing-ref'), 'no-such-ref', [
        bundlePath,
      ])
    ).toThrow('Could not fetch no-such-ref from ECOM');
  });
});
