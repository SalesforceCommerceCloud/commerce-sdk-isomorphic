/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react';
import {render} from '@testing-library/react';
import {createReactComponentDesignDecorator} from './components/ComponentDecorator';
import {PageDesignerProvider} from './context/PageDesignerProvider';

// Test component to decorate
const TestComponent: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <div data-testid="test-component">{children}</div>
);

describe('design/react/decorator', () => {
  let DecoratedComponent: ReturnType<
    typeof createReactComponentDesignDecorator<any>
  >;

  beforeEach(() => {
    DecoratedComponent = createReactComponentDesignDecorator(TestComponent);
  });

  describe('when decorating a component', () => {
    it('should return a React component function', () => {
      expect(typeof DecoratedComponent).toBe('function');
    });

    it('should render the original component when not in design mode', () => {
      const {getByTestId} = render(
        <PageDesignerProvider targetOrigin="https://pagedesigner.salesforce.com">
          <DecoratedComponent id="test-1" name="Test Component">
            Test Content
          </DecoratedComponent>
        </PageDesignerProvider>
      );

      expect(getByTestId('test-component')).toBeInTheDocument();
    });

    it('should render with design wrapper when in design mode', () => {
      // Mock URL to simulate design mode
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = {...originalLocation, search: '?mode=EDIT'};

      const {container} = render(
        <PageDesignerProvider targetOrigin="https://pagedesigner.salesforce.com">
          <DecoratedComponent id="test-1" name="Test Component">
            Test Content
          </DecoratedComponent>
        </PageDesignerProvider>
      );

      expect(
        container.querySelector('[data-component-id="test-1"]')
      ).toBeInTheDocument();

      // Restore original location
      window.location = originalLocation;
    });
  });
});
