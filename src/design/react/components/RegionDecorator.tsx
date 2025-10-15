/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useDesignContext} from '../context/DesignContext';
import {ComponentDecoratorProps} from './component.types';
import {useRegionDecoratorClasses} from '../hooks/useRegionDecoratorClasses';
import {useNodeToTargetStore} from '../hooks/useNodeToTargetStore';

export function createReactRegionDesignDecorator<TProps>(
  Region: React.ComponentType<TProps>
): (props: ComponentDecoratorProps<TProps>) => JSX.Element {
  return (props: ComponentDecoratorProps<TProps>) => {
    const {designMetadata, children, ...componentProps} = props;
    const {isDesignMode} = useDesignContext();
    const nodeRef = React.useRef<HTMLDivElement>(null);
    const classes = useRegionDecoratorClasses({regionId: designMetadata.id});

    useNodeToTargetStore({
      type: 'region',
      nodeRef,
      parentId: designMetadata.parentId,
      componentId: designMetadata.parentId as string,
      regionId: designMetadata.id,
      regionDirection: designMetadata.regionDirection,
    });

    if (!isDesignMode) {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Region {...props} />;
    }

    return (
      <div className={classes} ref={nodeRef}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Region {...(componentProps as unknown as TProps)}>{children}</Region>
      </div>
    );
  };
}
