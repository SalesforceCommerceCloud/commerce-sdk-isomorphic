/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {ComponentDecoratorProps} from './component.types';
import {DesignComponent} from './DesignComponent';
import {usePageDesignerMode} from '../context/PageDesignerProvider';

/**
 * Creates a higher-order component that wraps React components with design-time functionality.
 * In design mode, adds visual indicators, selection handling, and host communication.
 * In normal mode, renders the component unchanged for optimal performance.
 *
 * @template TProps - The props type of the component being decorated
 * @param Component - The React component to wrap with design functionality
 * @returns A new component with design-time capabilities
 */
export function createReactComponentDesignDecorator<TProps>(
  Component: React.ComponentType<TProps>
): (props: ComponentDecoratorProps<TProps>) => JSX.Element {
  return (props: ComponentDecoratorProps<TProps>) => {
    const {designMetadata, children, ...componentProps} = props;

    // Only use design context if in design mode
    const {isDesignMode} = usePageDesignerMode();

    return isDesignMode ? (
      <DesignComponent designMetadata={designMetadata}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...(componentProps as unknown as TProps)}>
          {children}
        </Component>
      </DesignComponent>
    ) : (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Component {...(componentProps as unknown as TProps)}>
        {children}
      </Component>
    );
  };
}
