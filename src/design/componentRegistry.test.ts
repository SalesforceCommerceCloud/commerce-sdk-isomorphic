/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ComponentRegistry} from './componentRegistry';
import {isDesignModeActive} from './modeDetection';

type TestComponent = {name: string};

jest.mock('./modeDetection', () => ({
  isDesignModeActive: jest.fn().mockReturnValue(true),
}));

describe('design/componentRegistry', () => {
  let designMode = false;
  let registry: ComponentRegistry<TestComponent>;

  beforeEach(() => {
    designMode = false;

    (isDesignModeActive as jest.Mock).mockImplementation(() => designMode);

    registry = new ComponentRegistry<TestComponent>({
      designDecorator: component => ({
        ...component,
        name: `${component.name}-design`,
      }),
    });
  });

  describe('when registering a component', () => {
    it('should set the component in the registry', () => {
      registry.registerComponent('test', {name: 'test'});
      expect(registry.getComponent('test')).toEqual({name: 'test'});
    });

    describe('when getting a component in design mode', () => {
      beforeEach(() => {
        designMode = true;
      });

      it('should get the decorated component', () => {
        registry.registerComponent('test', {name: 'test'});
        expect(registry.getComponent('test')).toEqual({
          name: 'test-design',
        });
      });
    });
  });

  describe("when getting a component that doesn't exist in the registry", () => {
    it('should return null', () => {
      expect(registry.getComponent('blorg')).toBeNull();
    });
  });
});
