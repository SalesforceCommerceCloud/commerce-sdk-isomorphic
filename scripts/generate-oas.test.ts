/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs-extra';
import path from 'path';
import {generateFromOas} from '@commerce-apps/raml-toolkit';
import Handlebars from 'handlebars';
import {
  resolveApiName,
  getAPIDetailsFromExchange,
  generateSDKs,
  generateIndex,
  main,
  generateVersionFile,
  getAllAPIDirectories,
} from './generate-oas';

// Mock dependencies
jest.mock('fs-extra');

jest.mock('@commerce-apps/raml-toolkit', () => ({
  generateFromOas: {
    generateFromOas: jest.fn(),
  },
}));

describe('generate-oas', () => {
  const mockApiDirectory = '/mock/api/directory';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up Handlebars spy
    jest.spyOn(Handlebars, 'compile');

    // Mock fs-extra methods
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readJSONSync as jest.Mock).mockReturnValue({
      main: 'api.yaml',
      assetId: 'shopper-orders-oas',
      name: 'Shopper Orders OAS',
      apiVersion: 'v1',
    });
    (fs.statSync as jest.Mock).mockReturnValue({isFile: () => true});
    (fs.readdir as jest.Mock).mockImplementation((dir, callback) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      callback(null, ['shopper-orders']);
    });
    (fs.readFileSync as jest.Mock).mockReturnValue('template content');
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    (fs.copySync as jest.Mock).mockImplementation(() => {});
    (fs.lstatSync as jest.Mock).mockReturnValue({isDirectory: () => true});
  });

  describe('Main execution', () => {
    it('should process all API directories and generate SDKs', () => {
      process.env.COMMERCE_SDK_INPUT_DIR = mockApiDirectory;
      process.env.PACKAGE_VERSION = '1.0.0';

      main();

      expect(fs.copySync).toHaveBeenCalledWith(
        path.join(__dirname, '../src/static'),
        path.join(__dirname, '../src/lib'),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        {filter: expect.any(Function)}
      );
      expect(fs.readdir).toHaveBeenCalledWith(
        mockApiDirectory,
        expect.any(Function)
      );
    });
  });

  describe('resolveApiName', () => {
    it('should handle special case for Shopper Baskets OAS', () => {
      const result = resolveApiName('Shopper Baskets OAS', 'v2');
      expect(result).toBe('ShopperBasketsV2');
    });

    it('should handle special case for Shopper Seo OAS', () => {
      const result = resolveApiName('Shopper Seo OAS', 'v1');
      expect(result).toBe('ShopperSEO');
    });

    it('should handle regular API names', () => {
      const result = resolveApiName('Shopper Orders OAS', 'v1');
      expect(result).toBe('ShopperOrders');
    });
  });

  describe('getAPIDetailsFromExchange', () => {
    it('should return correct API details from exchange.json', () => {
      const result = getAPIDetailsFromExchange(
        path.join(mockApiDirectory, 'shopperOrders')
      );
      expect(result).toEqual({
        filepath: path.join(mockApiDirectory, 'shopperOrders', 'api.yaml'),
        filename: 'api.yaml',
        directoryName: 'shopperOrders',
        name: 'Shopper Orders OAS',
        apiName: 'ShopperOrders',
      });
    });

    it('should throw error when exchange.json does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      expect(() => getAPIDetailsFromExchange('nonexistent')).toThrow(
        'Exchange file does not exist'
      );
    });
  });

  describe('generateSDKs', () => {
    it('should generate SDK for shopper API', () => {
      const apiSpecDetail = {
        filepath: '/path/to/shopper/api.yaml',
        filename: 'api.yaml',
        name: 'Test API',
        directoryName: 'test-api',
        apiName: 'TestAPI',
      };

      generateSDKs(apiSpecDetail);

      expect(generateFromOas.generateFromOas).toHaveBeenCalledWith({
        inputSpec: '/path/to/shopper/api.yaml',
        outputDir: path.join(__dirname, '../src/lib/test-api'),
        templateDir: path.join(__dirname, '../templatesOas'),
        flags: '--reserved-words-mappings delete=delete',
      });
    });

    it('should not generate SDK for non-api files', () => {
      const apiSpecDetail = {
        filepath: '/path/to/shopper/not-api.yaml',
        filename: '/not-api.yaml',
        name: 'Not API',
        directoryName: 'none',
        apiName: 'NotAPI',
      };

      (fs.statSync as jest.Mock).mockReturnValueOnce({isFile: () => false});
      generateSDKs(apiSpecDetail);

      expect(generateFromOas.generateFromOas).not.toHaveBeenCalled();
    });

    it('should not generate SDK for non-shopper API', () => {
      const apiSpecDetail = {
        filepath: '/path/to/non/api.yaml',
        filename: 'api.yaml',
        name: 'Non Shopper API',
        directoryName: 'none',
        apiName: 'NonShopper',
      };

      (fs.statSync as jest.Mock).mockReturnValueOnce({isFile: () => true});
      generateSDKs(apiSpecDetail);

      expect(generateFromOas.generateFromOas).not.toHaveBeenCalled();
    });
  });

  describe('generateIndex', () => {
    it('should generate index file with correct context', () => {
      const context = {
        children: [
          {
            name: 'Test API',
            apiName: 'TestAPI',
          },
        ],
      };

      generateIndex(context);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(__dirname, '../src/lib/index.ts'),
        expect.any(String)
      );
    });
  });

  describe('generateVersionFile', () => {
    it('should generate version file', () => {
      process.env.PACKAGE_VERSION = '1.0.0';

      generateVersionFile();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(__dirname, '../src/lib/version.ts'),
        expect.any(String)
      );
    });
  });

  describe('getAllDirectories', () => {
    it('should return all directories in the given path', () => {
      // Mock nested directory structure
      (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
        if (dirPath === mockApiDirectory) {
          return ['shopper-orders', 'shopper-baskets', 'admin'];
        }
        if (dirPath.endsWith('admin')) {
          return ['customers', 'products'];
        }
        if (dirPath.endsWith('customers')) {
          return ['nested-folder'];
        }
        return [];
      });

      (fs.lstatSync as jest.Mock).mockImplementation((itemPath: string) => ({
        isDirectory: () => !itemPath.includes('.'),
      }));

      const result = getAllAPIDirectories(mockApiDirectory);

      expect(result).toEqual([
        'shopper-orders',
        'shopper-baskets',
        'admin',
        'admin/customers',
        'admin/customers/nested-folder',
        'admin/products',
      ]);
    });

    it('should handle errors gracefully when directory cannot be read', () => {
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = getAllAPIDirectories('/invalid/path');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: Could not read directory /invalid/path:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
