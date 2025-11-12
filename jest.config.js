/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
  collectCoverageFrom: [
    'src/static/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx,ts,tsx}',
    '!scripts/generate.ts',
    '!scripts/generateFileList.ts',
    '!scripts/updateApis.ts',
    '!scripts/generateVersionTable.ts',
    '!scripts/fileList.ts',
    '!<rootDir>/node_modules/',
  ],
  coverageReporters: ['text'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
