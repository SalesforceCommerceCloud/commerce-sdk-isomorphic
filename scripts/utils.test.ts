/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {download} from '@commerce-apps/raml-toolkit';
import {
  downloadLatestApis,
} from './utils';

describe('test downloadLatestApis script', () => {
  it('throws error when no results', async () => {
    await expect(downloadLatestApis('noResults', '/tmp')).rejects.toThrow(
      "No results in Exchange for 'noResults'"
    );
  });

  it('throws error when no exact match', async () => {
    await expect(downloadLatestApis('noMatch', '/tmp')).rejects.toThrow(
      "No exact match in Exchange for 'noMatch'"
    );
  });

  it('downloads when exact match', async () => {
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
