/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback, useEffect, useMemo} from 'react';
import {useInteraction} from './useInteraction';
import {useDesignState} from './useDesignState';
import type {NodeToTargetMapEntry} from '../context/DesignStateContext';

export interface DropTarget extends NodeToTargetMapEntry {
  insertType?: 'before' | 'after';
  insertComponentId?: string;
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
  };
  commitCurrentDropTarget: () => void;
  startComponentMove: (componentId: string, regionId: string) => void;
  updateComponentMove: (params: {x: number; y: number}) => void;
  dropComponent: () => void;
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
}): 'before' | 'after' | undefined {
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
  const rectCache = useMemo(() => new WeakMap<Element, DOMRect>(), []);
  const getCurrentDropTarget = useCallback(
    (x: number, y: number): DropTarget | null => {
      const nodeStack = document.elementsFromPoint(x, y);

      for (let i = 0; i < nodeStack.length; i += 1) {
        const node = nodeStack[i];
        const entry = nodeToTargetMap.get(node);

        if (entry) {
          const isComponent = entry.type === 'component';
          const insertComponentId = isComponent ? entry.componentId : undefined;
          const insertType = getInsertionType({
            cache: rectCache,
            node,
            x,
            y,
            direction: entry.regionDirection,
          });

          return {
            ...entry,
            insertComponentId,
            insertType,
          };
        }
      }

      return null;
    },
    [nodeToTargetMap, rectCache]
  );

  const {
    state: dragState,
    commitCurrentDropTarget,
    updateComponentMove,
    startComponentMove,
    dropComponent,
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
            currentDropTarget: getCurrentDropTarget(event.x, event.y),
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
      updateComponentMove: ({x, y}: {x: number; y: number}) => {
        setState(prevState => ({
          ...prevState,
          x,
          y,
          currentDropTarget: getCurrentDropTarget(x, y),
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
        }));
      },
      commitCurrentDropTarget: () => {
        if (state.currentDropTarget) {
          // If we have a source component id, then we are moving a component to a different region.
          if (state.sourceComponentId) {
            clientApi?.moveComponentToRegion({
              componentId: state.sourceComponentId,
              sourceRegionId: state.sourceRegionId ?? '',
              targetComponentId: state.currentDropTarget.componentId,
              targetRegionId: state.currentDropTarget.regionId,
            });
            // If we have a component type, then we are adding a new component to a region.
          } else if (state.componentType) {
            clientApi?.addComponentToRegion({
              insertType: state.currentDropTarget.insertType,
              insertComponentId: state.currentDropTarget.insertComponentId,
              componentProperties: {},
              componentType: state.componentType,
              targetComponentId: state.currentDropTarget.componentId,
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
  };
}
