/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {isComponentTypeAllowedInRegion} from './regionUtils';

describe('regionUtils', () => {
  describe('isComponentTypeAllowedInRegion', () => {
    it.each([
      // Undefined/empty componentType cases
      [undefined, [], [], false, 'undefined componentType'],
      ['', [], [], false, 'empty string componentType'],
      [
        undefined,
        ['Button'],
        [],
        false,
        'undefined componentType with inclusions',
      ],

      // Exclusions cases
      [
        'Image',
        [],
        ['Image', 'Video'],
        false,
        'componentType in exclusions list',
      ],
      [
        'Button',
        ['Button', 'Text'],
        ['Button', 'Image'],
        false,
        'componentType in exclusions even if in inclusions',
      ],
      [
        'Button',
        [],
        ['Image', 'Video'],
        true,
        'componentType not in exclusions and no inclusions',
      ],

      // Inclusions cases
      [
        'Button',
        ['Button', 'Text'],
        [],
        true,
        'componentType in inclusions list',
      ],
      [
        'Image',
        ['Button', 'Text'],
        [],
        false,
        'componentType not in inclusions list',
      ],
      [
        'Button',
        ['Button', 'Text'],
        ['Image', 'Video'],
        true,
        'componentType in inclusions and not in exclusions',
      ],

      // Empty restrictions cases
      [
        'AnyComponent',
        [],
        [],
        true,
        'both inclusions and exclusions are empty',
      ],
      ['Button', [], [], true, 'no restrictions - Button'],
      ['Text', [], [], true, 'no restrictions - Text'],
      ['Image', [], [], true, 'no restrictions - Image'],
      ['Video', [], [], true, 'no restrictions - Video'],
      ['CustomComponent', [], [], true, 'no restrictions - CustomComponent'],
    ])(
      'should return %s for %s (%s)',
      (componentType, inclusions, exclusions, expected, description) => {
        const result = isComponentTypeAllowedInRegion(
          componentType,
          inclusions,
          exclusions
        );
        expect(result).toBe(expected);
      }
    );
  });
});
