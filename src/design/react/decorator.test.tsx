/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react';
import {createReactDesignDecorator} from './decorator';

describe('design/react/decorator', () => {
  let decorator: ReturnType<typeof createReactDesignDecorator>;

  beforeEach(() => {
    decorator = createReactDesignDecorator();
  });

  describe('when decorating a component', () => {
    it('should return a React component', () => {
      expect(decorator(<div>Test</div>)).toBeInstanceOf(Object);
    });
  });
});
