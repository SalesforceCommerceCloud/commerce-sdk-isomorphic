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
import {useRegionContext} from '../context/RegionContext';
import {
  ComponentContext,
  ComponentContextType,
  useComponentContext,
} from '../context/ComponentContext';
import {useComponentDiscovery} from '../hooks/useComponentDiscovery';

export function DesignComponent(
  props: ComponentDecoratorProps<unknown>
): JSX.Element {
  const {designMetadata, children} = props;
  const {id, name, isFragment} = designMetadata;
  const componentId = id;
  const componentName = name || 'Component';
  const dragRef = useRef<HTMLDivElement>(null);
  const {regionId, regionDirection} = useRegionContext() ?? {};
  const {componentId: parentComponentId} = useComponentContext() ?? {};
  const {nodeToTargetMap} = useDesignState();

  const {
    selectedComponentId,
    hoveredComponentId,
    setSelectedComponent,
    setHoveredComponent,
    dragState: {isDragging, sourceComponentId: draggingSourceComponentId},
  } = useDesignState();

  const isDraggingComponent =
    isDragging && draggingSourceComponentId === componentId;

  useFocusedComponentHandler(componentId, dragRef);
  useNodeToTargetStore({
    type: 'component',
    nodeRef: dragRef,
    parentId: parentComponentId,
    regionId,
    regionDirection,
    componentId,
  });

  const discoverComponents = useComponentDiscovery({
    nodeToTargetMap,
  });

  const handleMouseEnter = useDesignCallback(
    () => setHoveredComponent(componentId),
    [setHoveredComponent, componentId]
  );

  const handleMouseLeave = useDesignCallback(
    (event: React.MouseEvent) => {
      // If we hover off a component, we could still be hovering over a parent component
      // that contains that child. In this instance, the mouse enter doesn't fire and that parent
      // would not be highlighted. Everytime we leave a component, we check
      // if we are hovering over a component at those coordinates. If we are,
      // we set the hovered component to that component.
      const components = discoverComponents({
        x: event.clientX,
        y: event.clientY,
        filter: entry => entry.type === 'component',
      });

      setHoveredComponent(components[0]?.componentId ?? null);
    },
    [setHoveredComponent, nodeToTargetMap]
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

  const context = React.useMemo<ComponentContextType>(
    () => ({componentId: id, name}),
    [id, name]
  );

  // Makes the component a drop target.
  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      // If we are moving a component, don't let it be droppable on itself.
      if (draggingSourceComponentId !== componentId) {
        event.preventDefault();
      }
    },
    [draggingSourceComponentId, componentId]
  );

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events */
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    <div
      ref={dragRef}
      className={classes}
      draggable={isDraggingComponent}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-component-id={componentId}
      data-component-name={componentName}>
      <div className="pd-design__component__drop-target" />
      <DesignFrame
        showFrame={showFrame}
        componentId={componentId}
        name={componentName}
        parentId={parentComponentId}
        regionId={regionId}>
        <ComponentContext.Provider value={context}>
          {children}
        </ComponentContext.Provider>
      </DesignFrame>
    </div>
  );
}
