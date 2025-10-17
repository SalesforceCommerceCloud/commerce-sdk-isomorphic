/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, {useRef, useCallback} from 'react';
import {useDesignContext} from '../context/DesignContext';
import {ComponentDecoratorProps} from './component.types';
import {useComponentDecoratorClasses} from '../hooks/useComponentDecoratorClasses';
import {useDesignCallback} from '../hooks/useDesignCallback';
import {useDesignState} from '../hooks/useDesignState';
import {useFocusedComponentHandler} from '../hooks/useFocusedComponentHandler';
import {useComponentType} from '../hooks/useComponentType';
import {useNodeToTargetStore} from '../hooks/useNodeToTargetStore';
import {DesignFrame} from './DesignFrame';

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
    const {id, name, isFragment, parentId, regionId, regionDirection} =
      designMetadata;
    const componentId = id;
    const componentName = name || 'Component';
    const dragRef = useRef<HTMLDivElement>(null);

    // Only use design context if in design mode
    const {isDesignMode} = useDesignContext();
    const {
      selectedComponentId,
      hoveredComponentId,
      setSelectedComponent,
      setHoveredComponent,
      deleteComponent,
      startComponentMove,
    } = useDesignState();
    const componentType = useComponentType(componentId);

    useFocusedComponentHandler(componentId, dragRef);
    useNodeToTargetStore({
      type: 'component',
      nodeRef: dragRef,
      parentId,
      regionId,
      regionDirection,
      componentId,
    });

    const handleMouseEnter = useDesignCallback(
      () => setHoveredComponent(componentId),
      [setHoveredComponent, componentId]
    );

    const handleMouseLeave = useDesignCallback(
      () => setHoveredComponent(null),
      [setHoveredComponent]
    );

    const handleClick = useDesignCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedComponent(componentId);
      },
      [setSelectedComponent, componentId]
    );

    const handleDelete = useCallback(() => {
      deleteComponent({
        componentId,
        sourceComponentId: parentId ?? '',
        sourceRegionId: regionId ?? '',
      });
    }, [deleteComponent, componentId]);

    const showFrame = [selectedComponentId, hoveredComponentId].includes(
      componentId
    );

    const classes = useComponentDecoratorClasses({
      componentId,
      isFragment: Boolean(isFragment),
    });

    if (!isDesignMode) {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Component {...props} />;
    }

    // TODO: For the frame label, when there is not enough space above the component to display it, we
    // need to display it inside the container instead.

    return (
      <div
        ref={dragRef}
        className={classes}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-component-id={componentId}
        data-component-name={componentName}>
        {showFrame && (
          <DesignFrame
            componentId={componentId}
            name={componentName}
            parentId={parentId}
            regionId={regionId}
          />
        )}
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...(componentProps as unknown as TProps)}>
          {children}
        </Component>
      </div>
    );
  };
}
