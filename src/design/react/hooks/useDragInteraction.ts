/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback, useEffect} from 'react';
import {useInteraction} from './useInteraction';
import type {NodeToTargetMapEntry} from '../context/DesignStateContext';
import {isComponentTypeAllowedInRegion} from '../utils/regionUtils';

export interface DropTarget extends NodeToTargetMapEntry {
  beforeComponentId?: string;
  afterComponentId?: string;
  insertType?: 'before' | 'after';
  insertComponentId?: string;
  regionId: string;
  regionDirection: 'row' | 'column';
}

export interface DragInteraction {
  dragState: {
    isDragging: boolean;
    x: number;
    y: number;
    currentDropTarget: DropTarget | null;
    pendingTargetCommit: boolean;
    componentType?: string;
    sourceComponentId?: string;
    sourceRegionId?: string;
    rectCache: WeakMap<Element, DOMRect>;
  };
  commitCurrentDropTarget: () => void;
  startComponentMove: (componentId: string, regionId: string) => void;
  updateComponentMove: (params: {x: number; y: number}) => void;
  dropComponent: () => void;
  cancelDrag: () => void;
}

function getInsertionType({
  cache,
  node,
  x,
  y,
  direction,
}: {
  cache: WeakMap<Element, DOMRect>;
  node: Element;
  x: number;
  y: number;
  direction: 'row' | 'column';
}): 'before' | 'after' {
  const rect = cache.get(node) ?? node.getBoundingClientRect();

  cache.set(node, rect);

  if (direction === 'row') {
    const midX = rect.left + rect.width / 2;

    return x < midX ? 'before' : 'after';
  }

  const midY = rect.top + rect.height / 2;

  return y < midY ? 'before' : 'after';
}

export function useDragInteraction({
  nodeToTargetMap,
}: {
  nodeToTargetMap: WeakMap<Element, NodeToTargetMapEntry>;
}): DragInteraction {
  const getNearestComponentAndRegion = useCallback(
    (
      x: number,
      y: number
    ): {
      component: (NodeToTargetMapEntry & {node: Element}) | null;
      region: (NodeToTargetMapEntry & {node: Element}) | null;
    } => {
      const nodeStack = document.elementsFromPoint(x, y);
      let component: (NodeToTargetMapEntry & {node: Element}) | null = null;
      let region: (NodeToTargetMapEntry & {node: Element}) | null = null;

      for (let i = 0; i < nodeStack.length; i += 1) {
        const node = nodeStack[i];
        const entry = nodeToTargetMap.get(node);

        if (entry?.type === 'component') {
          component = {...entry, node};
        } else if (entry?.type === 'region') {
          region = {...entry, node};
          // Once we find a region we need to exit.
          break;
        }
      }

      return {component, region};
    },
    [nodeToTargetMap]
  );

  const getInsertionComponentIds = (
    componentId: string,
    region: NodeToTargetMapEntry & {node: Element}
  ): [string | undefined, string | undefined] => {
    const componentIndex = region.componentIds.indexOf(componentId);

    return [
      region.componentIds[componentIndex - 1],
      region.componentIds[componentIndex + 1],
    ];
  };

  const getCurrentDropTarget = useCallback(
    (
      x: number,
      y: number,
      rectCache: WeakMap<Element, DOMRect>,
      componentType?: string
    ): DropTarget | null => {
      const {component, region} = getNearestComponentAndRegion(x, y);

      if (region) {
        // If component type is not allowed, don't return a drop target
        if (
          isComponentTypeAllowedInRegion(
            componentType,
            region.componentTypeInclusions || [],
            region.componentTypeExclusions || []
          )
        ) {
          return null;
        }

        const insertType = component
          ? getInsertionType({
              cache: rectCache,
              node: component.node,
              x,
              y,
              direction: region.regionDirection,
            })
          : 'after';

        const [beforeComponentId, afterComponentId] = component
          ? getInsertionComponentIds(component.componentId, region)
          : [];

        // If we find a component before a region, it means we are dropping over a component.
        // If no component is found before a region, it means we are dropping over an empty region.
        return {
          type: component ? 'component' : 'region',
          regionId: region.regionId,
          regionDirection: region.regionDirection,
          componentIds: region.componentIds,
          componentId: component?.componentId ?? '',
          parentId: region.parentId,
          beforeComponentId,
          afterComponentId,
          insertComponentId: component?.componentId,
          insertType,
          componentTypeInclusions: region.componentTypeInclusions,
          componentTypeExclusions: region.componentTypeExclusions,
        };
      }

      return null;
    },
    [nodeToTargetMap]
  );

  const {
    state: dragState,
    commitCurrentDropTarget,
    updateComponentMove,
    startComponentMove,
    dropComponent,
    cancelDrag,
  } = useInteraction({
    initialState: {
      isDragging: false,
      componentType: '',
      sourceComponentId: undefined as string | undefined,
      sourceRegionId: undefined as string | undefined,
      x: 0,
      y: 0,
      currentDropTarget: null as DropTarget | null,
      pendingTargetCommit: false,
      rectCache: new WeakMap<Element, DOMRect>(),
    } as DragInteraction['dragState'],
    eventHandlers: {
      ComponentDragStarted: {
        handler: (event, setState) => {
          setState(prevState => ({
            ...prevState,
            componentType: event.componentType,
            sourceComponentId: undefined,
            sourceRegionId: undefined,
            x: 0,
            y: 0,
            isDragging: true,
            currentDropTarget: null,
            pendingTargetCommit: false,
            rectCache: new WeakMap<Element, DOMRect>(),
          }));
        },
      },
      ClientWindowDragExited: {
        handler: (_, setState) => {
          setState(prevState => ({
            ...prevState,
            componentType: '',
            x: 0,
            y: 0,
            isDragging: false,
            currentDropTarget: null,
            pendingTargetCommit: false,
          }));
        },
      },
      ClientWindowDragMoved: {
        handler: (event, setState) => {
          setState(prevState => ({
            ...prevState,
            x: event.x,
            y: event.y,
            isDragging: true,
            currentDropTarget: getCurrentDropTarget(
              event.x,
              event.y,
              prevState.rectCache,
              prevState.componentType
            ),
          }));
        },
      },
      ClientWindowDragDropped: {
        handler: (_, setState) => {
          setState(prevState => ({
            ...prevState,
            isDragging: false,
            pendingTargetCommit: true,
          }));
        },
      },
    },
    actions: (state, setState, clientApi) => ({
      cancelDrag: () => {
        setState(prevState => ({
          ...prevState,
          x: 0,
          y: 0,
          isDragging: false,
        }));
      },
      updateComponentMove: ({x, y}: {x: number; y: number}) => {
        setState(prevState => ({
          ...prevState,
          x,
          y,
          currentDropTarget: getCurrentDropTarget(
            x,
            y,
            state.rectCache,
            state.componentType
          ),
        }));
      },
      dropComponent: () => {
        setState(prevState => ({
          ...prevState,
          isDragging: false,
          pendingTargetCommit: true,
        }));
      },
      startComponentMove: (componentId: string, regionId: string) => {
        setState(prevState => ({
          ...prevState,
          x: 0,
          y: 0,
          sourceComponentId: componentId,
          sourceRegionId: regionId,
          isDragging: true,
          rectCache: new WeakMap<Element, DOMRect>(),
        }));
      },
      commitCurrentDropTarget: () => {
        if (state.currentDropTarget) {
          // If we have a source component id, then we are moving a component to a different region.
          if (state.sourceComponentId) {
            clientApi?.moveComponentToRegion({
              componentId: state.sourceComponentId,
              sourceRegionId: state.sourceRegionId ?? '',
              insertType: state.currentDropTarget.insertType,
              insertComponentId: state.currentDropTarget.insertComponentId,
              beforeComponentId: state.currentDropTarget.beforeComponentId,
              afterComponentId: state.currentDropTarget.afterComponentId,
              targetRegionId: state.currentDropTarget.regionId,
              targetComponentId: state.currentDropTarget.parentId ?? '',
            });
            // If we have a component type, then we are adding a new component to a region.
          } else if (state.componentType) {
            clientApi?.addComponentToRegion({
              insertType: state.currentDropTarget.insertType,
              insertComponentId: state.currentDropTarget.insertComponentId,
              componentProperties: {},
              componentType: state.componentType,
              targetComponentId: state.currentDropTarget.parentId ?? '',
              beforeComponentId: state.currentDropTarget.beforeComponentId,
              afterComponentId: state.currentDropTarget.afterComponentId,
              targetRegionId: state.currentDropTarget.regionId,
            });
          }
        }

        setState(prevState => ({
          ...prevState,
          x: 0,
          y: 0,
          componentType: '',
          sourceComponentId: undefined,
          sourceRegionId: undefined,
          currentDropTarget: null,
          pendingTargetCommit: false,
        }));
      },
    }),
  });

  useEffect(() => {
    if (dragState.pendingTargetCommit) {
      commitCurrentDropTarget();
    }
  }, [dragState.pendingTargetCommit]);

  return {
    dragState,
    commitCurrentDropTarget,
    startComponentMove,
    updateComponentMove,
    dropComponent,
    cancelDrag,
  };
}
