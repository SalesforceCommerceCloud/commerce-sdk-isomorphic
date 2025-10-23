/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef} from 'react';
import {ComponentDecoratorProps} from './component.types';
import {useComponentDecoratorClasses} from '../hooks/useComponentDecoratorClasses';
import {useDesignCallback} from '../hooks/useDesignCallback';
import {useDesignState} from '../hooks/useDesignState';
import {useFocusedComponentHandler} from '../hooks/useFocusedComponentHandler';
import {useNodeToTargetStore} from '../hooks/useNodeToTargetStore';
import {DesignFrame} from './DesignFrame';

export function DesignComponent(
  props: ComponentDecoratorProps<unknown>
): JSX.Element {
  const {designMetadata, children} = props;
  const {id, name, isFragment, parentId, regionId, regionDirection} =
    designMetadata;
  const componentId = id;
  const componentName = name || 'Component';
  const dragRef = useRef<HTMLDivElement>(null);

  const {
    selectedComponentId,
    hoveredComponentId,
    setSelectedComponent,
    setHoveredComponent,
    dragState: {isDragging},
  } = useDesignState();

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

  const showFrame =
    [selectedComponentId, hoveredComponentId].includes(componentId) &&
    !isDragging;

  const classes = useComponentDecoratorClasses({
    componentId,
    isFragment: Boolean(isFragment),
  });

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events */
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    <div
      ref={dragRef}
      className={classes}
      draggable="true"
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
      {children}
    </div>
  );
}
