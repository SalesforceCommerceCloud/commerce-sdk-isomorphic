/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {RegionDecoratorProps} from './component.types';
import {DesignRegion} from './DesignRegion';
import {usePageDesignerMode} from '../context/PageDesignerProvider';

export function createReactRegionDesignDecorator<TProps>(
  Region: React.ComponentType<TProps>
): (props: RegionDecoratorProps<TProps>) => JSX.Element {
  return (props: RegionDecoratorProps<TProps>) => {
    const {designMetadata, children, ...componentProps} = props;
    const {isDesignMode} = usePageDesignerMode();

    return isDesignMode ? (
      <DesignRegion designMetadata={designMetadata}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Region {...(componentProps as unknown as TProps)}>{children}</Region>
      </DesignRegion>
    ) : (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Region {...(componentProps as unknown as TProps)}>{children}</Region>
    );
  };
}
