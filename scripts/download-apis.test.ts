/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {execSync} from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import {downloadApisWithAnypointCli} from './download-apis';

// Mock dependencies before importing the module
jest.mock('child_process');
jest.mock('fs-extra');
jest.mock('adm-zip');

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const MockedAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;

describe('download-apis', () => {
  const mockApiId =
    '893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets-oas/1.9.0';
  const mockTargetDir = '/path/to/target';
  const mockOrgId = '893f605e-10e2-423a-bdb4-f952f56eb6d8';
  const mockTempDir = path.join(process.cwd(), 'temp', 'downloads');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANYPOINT_USERNAME = 'test-user';
    process.env.ANYPOINT_PASSWORD = 'test-pass';

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock file system operations
    mockedFs.readdir.mockResolvedValue(['api-asset.zip'] as any);
    mockedFs.remove.mockResolvedValue(undefined as void);

    // Mock execSync
    mockedExecSync.mockReturnValue(Buffer.from(''));

    // Mock AdmZip
    const mockZipInstance = {
      extractAllTo: jest.fn(),
    } as unknown as AdmZip;
    MockedAdmZip.mockImplementation(() => mockZipInstance);
  });

  afterEach(() => {
    delete process.env.ANYPOINT_USERNAME;
    delete process.env.ANYPOINT_PASSWORD;
    jest.restoreAllMocks();
  });

  describe('downloadApisWithAnypointCli', () => {
    it('should successfully download and extract API', async () => {
      await downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId);

      // Verify temp directory was created
      expect(mockedFs.ensureDir).toHaveBeenCalledWith(mockTempDir);

      // Verify anypoint-cli command was executed
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('anypoint-cli-v4 exchange:asset:download'),
        expect.objectContaining({
          stdio: 'inherit',
          cwd: process.cwd(),
          env: process.env,
        })
      );

      // Verify command includes credentials and org ID
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--username 'test-user'"),
        expect.any(Object)
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--password 'test-pass'"),
        expect.any(Object)
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining(`--organization=${mockOrgId}`),
        expect.any(Object)
      );

      // Verify zip file was read
      expect(mockedFs.readdir).toHaveBeenCalledWith(mockTempDir);

      // Verify target directory was created
      expect(mockedFs.ensureDir).toHaveBeenCalledWith(mockTargetDir);

      // Verify zip was extracted
      expect(MockedAdmZip).toHaveBeenCalledWith(
        path.join(mockTempDir, 'api-asset.zip')
      );

      // Verify temp directory was cleaned up
      expect(mockedFs.remove).toHaveBeenCalledWith(mockTempDir);

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Successfully downloaded and extracted')
      );
    });

    it('should handle empty credentials gracefully', async () => {
      delete process.env.ANYPOINT_USERNAME;
      delete process.env.ANYPOINT_PASSWORD;

      await downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId);

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--username ''"),
        expect.any(Object)
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining("--password ''"),
        expect.any(Object)
      );
    });

    it('should throw error when anypoint-cli command fails', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Command execution failed');
      });

      await expect(
        downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId)
      ).rejects.toThrow(
        'Failed to download API 893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets-oas/1.9.0: potential reasons: api or version does not exist, wrong credentials, wrong organization ID'
      );

      // Verify temp directory was still created
      expect(mockedFs.ensureDir).toHaveBeenCalledWith(mockTempDir);
    });

    it('should throw error when no zip file is found', async () => {
      mockedFs.readdir.mockResolvedValue(['not-a-zip.txt', 'readme.md'] as any);

      await expect(
        downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId)
      ).rejects.toThrow(
        `Failed to download API ${mockApiId}: No zip file found in ${mockTempDir}`
      );
    });

    it('should find zip file among multiple files', async () => {
      mockedFs.readdir.mockResolvedValue([
        'readme.md',
        'api-asset.zip',
        'other-file.txt',
      ] as any);

      await downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId);

      expect(MockedAdmZip).toHaveBeenCalledWith(
        path.join(mockTempDir, 'api-asset.zip')
      );
    });

    it('should handle errors during zip extraction', async () => {
      const mockZipInstance = {
        extractAllTo: jest.fn(() => {
          throw new Error('Extraction failed');
        }),
      } as unknown as AdmZip;
      MockedAdmZip.mockImplementation(() => mockZipInstance);

      await expect(
        downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId)
      ).rejects.toThrow(
        'Failed to download API 893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets-oas/1.9.0: Extraction failed'
      );
    });

    it('should handle errors during cleanup', async () => {
      mockedFs.remove.mockRejectedValueOnce(new Error('Cleanup failed'));

      await expect(
        downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId)
      ).rejects.toThrow(
        'Failed to download API 893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets-oas/1.9.0: Cleanup failed'
      );
    });

    it('should handle non-Error exceptions from execSync', async () => {
      mockedExecSync.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'String error';
      });

      await expect(
        downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId)
      ).rejects.toThrow(
        'Failed to download API 893f605e-10e2-423a-bdb4-f952f56eb6d8/shopper-baskets-oas/1.9.0: potential reasons: api or version does not exist, wrong credentials, wrong organization ID'
      );
    });

    it('should handle non-Error exceptions from other operations', async () => {
      mockedFs.readdir.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'Non-error exception';
      });

      await expect(
        downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId)
      ).rejects.toThrow(`Failed to download API ${mockApiId}`);
    });

    it('should use correct temp directory path', async () => {
      const expectedTempDir = path.join(process.cwd(), 'temp', 'downloads');

      await downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId);

      expect(mockedFs.ensureDir).toHaveBeenCalledWith(expectedTempDir);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining(expectedTempDir),
        expect.any(Object)
      );
    });

    it('should pass correct parameters to anypoint-cli command', async () => {
      await downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId);

      const expectedCmd = `anypoint-cli-v4 exchange:asset:download ${mockApiId} ${mockTempDir} --username 'test-user' --password 'test-pass' --organization=${mockOrgId}`;

      expect(mockedExecSync).toHaveBeenCalledWith(
        expectedCmd,
        expect.objectContaining({
          stdio: 'inherit',
          cwd: process.cwd(),
          env: process.env,
        })
      );
    });

    it('should log download progress', async () => {
      await downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId);

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        `Downloading API ${mockApiId} using anypoint-cli...`
      );
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Extracting api-asset.zip')
      );
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Successfully downloaded and extracted')
      );
    });

    it('should extract zip with overwrite flag', async () => {
      const mockExtractAllTo = jest.fn();
      const mockZipInstance = {
        extractAllTo: mockExtractAllTo,
      } as unknown as AdmZip;
      MockedAdmZip.mockImplementation(() => mockZipInstance);

      await downloadApisWithAnypointCli(mockApiId, mockTargetDir, mockOrgId);

      expect(mockExtractAllTo).toHaveBeenCalledWith(mockTargetDir, true);
    });
  });
});
