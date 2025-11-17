/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {execSync} from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import {
  readApiVersions,
  writeApiVersions,
  getMajorVersion,
  parseApiName,
  getLatestVersion,
  updateApiVersions,
} from './updateApiVersions';

// Mock dependencies before importing the module
jest.mock('child_process');
jest.mock('fs-extra');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const ORG_ID = '893f605e-10e2-423a-bdb4-f952f56eb6d8';

describe('updateApiVersions', () => {
  const mockApiVersionsFile = path.join(__dirname, '../api-versions.txt');
  const mockApiVersionsContent = `shopper-baskets-oas-v1=1.9.0
shopper-baskets-oas-v2=2.1.0
shopper-payments-oas-v1=1.1.0`;

  const mockExchangeResponseV1 = {
    versions: [
      {version: '1.9.5', createdDate: '2025-10-24'},
      {version: '1.9.0', createdDate: '2025-08-01'},
      {version: '2.1.0', createdDate: '2025-09-01'},
      {version: '2.0.0', createdDate: '2025-07-01'},
    ],
    id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets-oas/1.9.0',
    name: 'Shopper Baskets OAS',
  };

  const mockExchangeResponseV2 = {
    versions: [
      {version: '2.2.0', createdDate: '2025-10-25'},
      {version: '2.1.0', createdDate: '2025-09-01'},
      {version: '1.9.5', createdDate: '2025-10-24'},
      {version: '1.9.0', createdDate: '2025-08-01'},
    ],
    id: '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets-oas/2.1.0',
    name: 'Shopper Baskets OAS',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANYPOINT_USERNAME = 'test-user';
    process.env.ANYPOINT_PASSWORD = 'test-pass';

    // Mock file system operations
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(mockApiVersionsContent);
    mockedFs.writeFileSync.mockImplementation(() => undefined);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    delete process.env.ANYPOINT_USERNAME;
    delete process.env.ANYPOINT_PASSWORD;
    jest.restoreAllMocks();
  });

  describe('readApiVersions', () => {
    it('should read and parse api-versions.txt correctly', () => {
      const result = readApiVersions();

      expect(mockedFs.existsSync).toHaveBeenCalledWith(mockApiVersionsFile);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        mockApiVersionsFile,
        'utf-8'
      );
      expect(result).toEqual([
        {apiName: 'shopper-baskets-oas-v1', version: '1.9.0'},
        {apiName: 'shopper-baskets-oas-v2', version: '2.1.0'},
        {apiName: 'shopper-payments-oas-v1', version: '1.1.0'},
      ]);
    });

    it('should filter out empty lines and comments', () => {
      const contentWithComments = `# This is a comment
shopper-baskets-oas-v1=1.9.0

shopper-baskets-oas-v2=2.1.0
# Another comment
shopper-payments-oas-v1=1.1.0

`;
      mockedFs.readFileSync.mockReturnValue(contentWithComments);

      const result = readApiVersions();

      expect(result).toEqual([
        {apiName: 'shopper-baskets-oas-v1', version: '1.9.0'},
        {apiName: 'shopper-baskets-oas-v2', version: '2.1.0'},
        {apiName: 'shopper-payments-oas-v1', version: '1.1.0'},
      ]);
    });

    it('should throw error when file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => readApiVersions()).toThrow(
        `API versions file not found at: ${mockApiVersionsFile}`
      );
    });

    it('should handle whitespace around api names and versions', () => {
      const contentWithWhitespace = `shopper-baskets-oas-v1  =  1.9.0
  shopper-baskets-oas-v2=2.1.0  `;
      mockedFs.readFileSync.mockReturnValue(contentWithWhitespace);

      const result = readApiVersions();

      expect(result).toEqual([
        {apiName: 'shopper-baskets-oas-v1', version: '1.9.0'},
        {apiName: 'shopper-baskets-oas-v2', version: '2.1.0'},
      ]);
    });
  });

  describe('writeApiVersions', () => {
    it('should write API versions to file correctly', () => {
      const apiVersions = [
        {apiName: 'shopper-baskets-oas-v1', version: '1.9.5'},
        {apiName: 'shopper-baskets-oas-v2', version: '2.2.0'},
      ];

      writeApiVersions(apiVersions);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockApiVersionsFile,
        'shopper-baskets-oas-v1=1.9.5\nshopper-baskets-oas-v2=2.2.0\n',
        'utf-8'
      );
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        `Updated ${mockApiVersionsFile}`
      );
    });

    it('should handle empty array', () => {
      writeApiVersions([]);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockApiVersionsFile,
        '\n',
        'utf-8'
      );
    });

    it('should handle single API version', () => {
      const apiVersions = [
        {apiName: 'shopper-baskets-oas-v1', version: '1.9.0'},
      ];

      writeApiVersions(apiVersions);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockApiVersionsFile,
        'shopper-baskets-oas-v1=1.9.0\n',
        'utf-8'
      );
    });
  });

  describe('getMajorVersion', () => {
    it('should extract major version from version string', () => {
      expect(getMajorVersion('1.9.0')).toBe(1);
      expect(getMajorVersion('2.1.0')).toBe(2);
      expect(getMajorVersion('10.5.3')).toBe(10);
      expect(getMajorVersion('0.1.0')).toBe(0);
    });

    it('should handle version strings with different formats', () => {
      expect(getMajorVersion('1.9')).toBe(1);
      expect(getMajorVersion('2')).toBe(2);
      expect(getMajorVersion('3.0.0-beta')).toBe(3);
    });

    it('should return 0 for invalid version strings', () => {
      expect(getMajorVersion('invalid')).toBe(0);
      expect(getMajorVersion('')).toBe(0);
      expect(getMajorVersion('v1.0.0')).toBe(0);
    });
  });

  describe('parseApiName', () => {
    it('should parse API name with version suffix correctly', () => {
      expect(parseApiName('shopper-baskets-oas-v1')).toEqual({
        baseName: 'shopper-baskets-oas',
        versionSuffix: 'v1',
      });

      expect(parseApiName('shopper-baskets-oas-v2')).toEqual({
        baseName: 'shopper-baskets-oas',
        versionSuffix: 'v2',
      });

      expect(parseApiName('shopper-payments-oas-v1')).toEqual({
        baseName: 'shopper-payments-oas',
        versionSuffix: 'v1',
      });
    });

    it('should handle API names with multiple hyphens', () => {
      expect(parseApiName('shopper-customer-product-lists-v1')).toEqual({
        baseName: 'shopper-customer-product-lists',
        versionSuffix: 'v1',
      });
    });

    it('should handle API names without version suffix', () => {
      expect(parseApiName('shopper-baskets-oas')).toEqual({
        baseName: 'shopper-baskets-oas',
        versionSuffix: null,
      });
    });

    it('should handle API names with double-digit version suffixes', () => {
      expect(parseApiName('shopper-baskets-oas-v10')).toEqual({
        baseName: 'shopper-baskets-oas',
        versionSuffix: 'v10',
      });
    });
  });

  describe('getLatestVersion', () => {
    it('should return latest version for the same major version', () => {
      mockedExecSync.mockReturnValue(JSON.stringify(mockExchangeResponseV1));

      const result = getLatestVersion(
        'shopper-baskets-oas-v1',
        '1.9.0',
        ORG_ID
      );

      expect(result).toBe('1.9.5');
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('anypoint-cli-v4 exchange:asset:describe'),
        expect.any(Object)
      );
    });

    it('should filter versions by major version correctly', () => {
      mockedExecSync.mockReturnValue(JSON.stringify(mockExchangeResponseV2));

      const result = getLatestVersion(
        'shopper-baskets-oas-v2',
        '2.1.0',
        ORG_ID
      );

      expect(result).toBe('2.2.0');
    });

    it('should return null when no versions found', () => {
      const emptyResponse = {
        versions: [],
        id: 'test-id',
        name: 'Test API',
      };
      mockedExecSync.mockReturnValue(JSON.stringify(emptyResponse));

      const result = getLatestVersion(
        'shopper-baskets-oas-v1',
        '1.9.0',
        ORG_ID
      );

      expect(result).toBeNull();
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'No versions found for shopper-baskets-oas-v1'
      );
    });

    it('should return null when no versions match major version', () => {
      const responseWithDifferentMajor = {
        versions: [
          {version: '2.0.0', status: 'published', createdDate: '2025-09-01'},
          {version: '2.1.0', status: 'published', createdDate: '2025-09-01'},
        ],
        id: 'test-id',
        name: 'Test API',
      };
      mockedExecSync.mockReturnValue(
        JSON.stringify(responseWithDifferentMajor)
      );

      const result = getLatestVersion(
        'shopper-baskets-oas-v1',
        '1.9.0',
        ORG_ID
      );

      expect(result).toBeNull();
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'No versions found for shopper-baskets-oas-v1 with major version 1'
      );
    });

    it('should handle execSync errors gracefully', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = getLatestVersion(
        'shopper-baskets-oas-v1',
        '1.9.0',
        ORG_ID
      );

      expect(result).toBeNull();
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching latest version for shopper-baskets-oas-v1:',
        'Command failed'
      );
    });

    it('should use credentials from environment variables', () => {
      process.env.ANYPOINT_USERNAME = 'custom-user';
      process.env.ANYPOINT_PASSWORD = 'custom-pass';
      mockedExecSync.mockReturnValue(JSON.stringify(mockExchangeResponseV1));

      getLatestVersion('shopper-baskets-oas-v1', '1.9.0', ORG_ID);

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--username 'custom-user'"),
        expect.any(Object)
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--password 'custom-pass'"),
        expect.any(Object)
      );
    });

    it('should handle missing credentials gracefully', () => {
      delete process.env.ANYPOINT_USERNAME;
      delete process.env.ANYPOINT_PASSWORD;
      mockedExecSync.mockReturnValue(JSON.stringify(mockExchangeResponseV1));

      getLatestVersion('shopper-baskets-oas-v1', '1.9.0', ORG_ID);

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--username ''"),
        expect.any(Object)
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--password ''"),
        expect.any(Object)
      );
    });
  });

  describe('updateApiVersions', () => {
    it('should throw error when environment variables are missing', () => {
      delete process.env.ANYPOINT_USERNAME;
      delete process.env.ANYPOINT_PASSWORD;

      expect(() => updateApiVersions()).toThrow(
        'Please ensure that ANYPOINT_USERNAME and ANYPOINT_PASSWORD environment variables are set.'
      );
    });

    it('should update API versions when newer versions are available', () => {
      mockedExecSync
        .mockReturnValueOnce(JSON.stringify(mockExchangeResponseV1)) // For v1
        .mockReturnValueOnce(JSON.stringify(mockExchangeResponseV2)) // For v2
        .mockReturnValueOnce(
          JSON.stringify({
            versions: [
              {
                version: '1.1.0',
                status: 'published',
                createdDate: '2025-08-01',
              },
            ],
            id: 'test-id',
            name: 'Shopper Payments',
          })
        ); // For payments

      updateApiVersions();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockApiVersionsFile,
        expect.stringContaining('shopper-baskets-oas-v1=1.9.5'),
        'utf-8'
      );
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockApiVersionsFile,
        expect.stringContaining('shopper-baskets-oas-v2=2.2.0'),
        'utf-8'
      );
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 update(s)')
      );
    });
  });
});
