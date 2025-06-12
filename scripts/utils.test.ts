/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {download} from '@commerce-apps/raml-toolkit';
import {downloadLatestApis} from './utils';

describe('test downloadLatestApis script', () => {
  it('downloads when match', async () => {
    jest.spyOn(download, 'downloadRestApis').mockResolvedValue('');

    await expect(
      downloadLatestApis('shopper-customers', '/tmp')
    ).resolves.toBeUndefined();
  });

  it('throws error when download fails', async () => {
    jest
      .spyOn(download, 'downloadRestApis')
      .mockRejectedValue(new Error('It failed.'));
    await expect(
      downloadLatestApis('shopper-customers', '/tmp')
    ).rejects.toThrow('Failed to download shopper-customers: It failed.');
  });
});
