/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useDesignContext} from '../context/DesignContext';
import {ComponentDecoratorProps} from './component.types';
import {useExternalDragHandler} from '../hooks/useExternalDragHandler';
import {useRegionDecoratorClasses} from '../hooks/useRegionDecoratorClasses';

export function createReactRegionDesignDecorator<TProps>(
  Region: React.ComponentType<TProps>
): (props: ComponentDecoratorProps<TProps>) => JSX.Element {
  return (props: ComponentDecoratorProps<TProps>) => {
    const {designMetadata, children, ...componentProps} = props;
    const {isDesignMode} = useDesignContext();
    const nodeRef = React.useRef<HTMLDivElement>(null);
    const classes = useRegionDecoratorClasses({regionId: designMetadata.id});

    useExternalDragHandler(
      designMetadata.id,
      designMetadata.parentId ?? '',
      nodeRef
    );

    if (!isDesignMode) {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Region {...props} />;
    }

    return (
      <div className={classes} ref={nodeRef}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Region {...(componentProps as TProps)}>{children}</Region>
      </div>
    );
  };
}
