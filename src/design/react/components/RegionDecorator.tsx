/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useDesignContext} from '../context/DesignContext';
import {ComponentDecoratorProps} from './component.types';

export function createReactRegionDesignDecorator<TProps>(
  Region: React.ComponentType<TProps>
): (props: ComponentDecoratorProps<TProps>) => JSX.Element {
  return (props: ComponentDecoratorProps<TProps>) => {
    const {children, ...componentProps} = props;
    const {isDesignMode} = useDesignContext();

    if (!isDesignMode) {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Region {...props} />;
    }

    return (
      <div className="pd-region">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Region {...(componentProps as TProps)}>{children}</Region>
      </div>
    );
  };
}
