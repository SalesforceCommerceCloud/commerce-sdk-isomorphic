/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as slasHelper from './slasHelper';

describe('Create code verifier', () => {
  test('creates string greater between 43 and 128 char per standard', () => {
    const verifier = slasHelper.createCodeVerifier();

    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });
});

describe('Generate code challenge', () => {
  const verifier =
    'XVv3DJSzPDdbcVsrcs-4KuUtMYhvd6fxS0Gtbu_gv-UaVKo80w8WKA1gitXhC-DMW0H_mOtUNJhecfTwb-n_dXQWz8Ay6iWZWoeSBPfwgzP_pblgQr4eqodqeYNxfdWv';
  const expectedChallenge = 'AH8WaHxbEtoZuFw-rw2YS9SazhKJilGoESoSlICXsQw';

  test('generates correct code challenge for verifier', async () => {
    const challenge = await slasHelper.generateCodeChallenge(verifier);
    expect(challenge).toBe(expectedChallenge);
  });
});

describe('Get code and usid', () => {
  const url =
    'https://localhost:3000/callback?usid=048adcfb-aa93-4978-be9e-09cb569fdcb9&code=J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o';

  const expectedRecord = {
    code: 'J2lHm0cgXmnXpwDhjhLoyLJBoUAlBfxDY-AhjqGMC-o',
    url,
    usid: '048adcfb-aa93-4978-be9e-09cb569fdcb9',
  };

  test('extracts code and usid from url', () => {
    const record = slasHelper.getCodeAndUsidFromUrl(url);
    expect(record).toStrictEqual(expectedRecord);
  });
});
