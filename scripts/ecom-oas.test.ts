/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs-extra';
import {resolveEcomOasRef} from './ecom-oas';

describe('resolveEcomOasRef', () => {
  const originalRef = process.env.ECOM_OAS_REF;

  beforeEach(() => {
    delete process.env.ECOM_OAS_REF;
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue('# APIs for ECOM v26.9\nfoo-oas-v1=1.0.0');
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
