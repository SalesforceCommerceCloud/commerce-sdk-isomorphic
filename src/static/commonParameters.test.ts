/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { commonParameterPositions } from './commonParameters';

test('that commonParameterPositions is importable and not empty', () => {
  expect(commonParameterPositions).toEqual(expect.anything());
});
