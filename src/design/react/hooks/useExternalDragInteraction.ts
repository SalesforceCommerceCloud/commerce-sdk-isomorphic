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

export interface ExternalDragInteraction {
  externalDragState: {
    isDragging: boolean;
    componentType: string;
    x: number;
    y: number;
    currentDropTarget: DropTarget | null;
    pendingTargetCommit: boolean;
  };
  commitCurrentDropTarget: () => void;
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

export function useExternalDragInteraction(): ExternalDragInteraction {
  const {nodeToTargetMap} = useDesignState();
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

  const {state: dragState, commitCurrentDropTarget} = useInteraction({
    initialState: {
      isDragging: false,
      componentType: '',
      x: 0,
      y: 0,
      currentDropTarget: null as DropTarget | null,
      pendingTargetCommit: false,
    },
    eventHandlers: {
      ComponentDragStarted: {
        handler: (event, setState) => {
          setState(prevState => ({
            ...prevState,
            componentType: event.componentType,
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
      commitCurrentDropTarget: () => {
        if (state.currentDropTarget) {
          clientApi?.addComponentToRegion({
            insertType: state.currentDropTarget.insertType,
            insertComponentId: state.currentDropTarget.insertComponentId,
            componentProperties: {},
            componentType: state.componentType,
            targetComponentId: state.currentDropTarget.componentId,
            targetRegionId: state.currentDropTarget.regionId,
          });
        }

        setState(prevState => ({
          ...prevState,
          x: 0,
          y: 0,
          componentType: '',
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
    externalDragState: dragState,
    commitCurrentDropTarget,
  };
}
