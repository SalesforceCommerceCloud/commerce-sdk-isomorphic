/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs-extra';
import path from 'path';
import {readApiVersions} from './utils';

jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockApiVersionsFile = path.join(__dirname, '../api-versions.txt');
const mockApiVersionsContent = `shopper-baskets-oas-v1=1.9.0
shopper-baskets-oas-v2=2.1.0
shopper-payments-oas-v1=1.1.0`;

describe('readApiVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(mockApiVersionsContent);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
