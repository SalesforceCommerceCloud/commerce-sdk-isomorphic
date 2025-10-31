/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback, useEffect, useRef} from 'react';
import {useInteraction} from './useInteraction';
import type {NodeToTargetMapEntry} from '../context/DesignStateContext';
import {
  ComponentDiscoveryResult,
  useComponentDiscovery,
} from './useComponentDiscovery';

// The height of the scroll buffer on the top and bottom of the window
// as a percentage of the window height.
const SCROLL_BUFFER_HEIGHT_PERCENTAGE = 15;
const SCROLL_BUFFER_MIN_HEIGHT_IN_PIXELS = 50;
// The interval at which the window will scroll within the buffer.
// More often means a smoother experience.
const SCROLL_INTERVAL_IN_MS = 1000 / 60; // 60fps
// The multiplier applied to the scroll factor.
// The scroll factor is a value between 0 and 1 that determines how much to scroll.
// This value will be the maximum amount of pixels that will be scrolled in a singal frame.
const SCROLL_BASE_AMOUNT_IN_PIXELS = 50;

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
    scrollDirection: 0 | 1 | -1;
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
  const discoverComponents = useComponentDiscovery({
    nodeToTargetMap,
  });
  const getNearestComponentAndRegion = useCallback(
    (
      x: number,
      y: number
    ): {
      component: ComponentDiscoveryResult | null;
      region: ComponentDiscoveryResult | null;
    } => {
      const stack = discoverComponents({x, y});
      let component: ComponentDiscoveryResult | null = null;
      let region: ComponentDiscoveryResult | null = null;

      for (let i = 0; i < stack.length; i += 1) {
        const entry = stack[i];

        // We need a region id and direction for this to be a target.
        if (entry.regionId && entry.regionDirection) {
          if (entry.type === 'component') {
            component = entry;
          } else if (entry.type === 'region') {
            region = entry;
            // Once we find a region we need to exit.
            break;
          }
        }
      }

      return {component, region};
    },
    [discoverComponents]
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
      rectCache: WeakMap<Element, DOMRect>
    ): DropTarget | null => {
      const {component, region} = getNearestComponentAndRegion(x, y);

      if (region) {
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
        };
      }

      return null;
    },
    [nodeToTargetMap]
  );

  const computeScrollFactor = ({
    y,
    windowHeight,
  }: {
    y: number;
    windowHeight: number;
  }) => {
    const bufferHeight = Math.max(
      windowHeight * (SCROLL_BUFFER_HEIGHT_PERCENTAGE / 100),
      SCROLL_BUFFER_MIN_HEIGHT_IN_PIXELS
    );
    const bottomBufferStart = windowHeight - bufferHeight;

    if (y > bottomBufferStart) {
      return (y - bottomBufferStart) / bufferHeight;
    }

    if (y < bufferHeight) {
      return (y - bufferHeight) / bufferHeight;
    }

    return 0;
  };

  const computeScrollDirection = (factor: number) => {
    if (factor > 0) {
      return 1;
    }

    if (factor < 0) {
      return -1;
    }

    return 0;
  };

  const scrollFactorRef = useRef(0);

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
          scrollFactorRef.current = 0;

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
            scrollDirection: computeScrollDirection(scrollFactorRef.current),
            rectCache: new WeakMap<Element, DOMRect>(),
          }));
        },
      },
      ClientWindowDragExited: {
        handler: (_, setState) => {
          scrollFactorRef.current = 0;

          setState(prevState => ({
            ...prevState,
            componentType: '',
            x: 0,
            y: 0,
            isDragging: false,
            currentDropTarget: null,
            scrollDirection: 0,
            pendingTargetCommit: false,
          }));
        },
      },
      ClientWindowDragMoved: {
        handler: (event, setState) => {
          scrollFactorRef.current = computeScrollFactor({
            y: event.y,
            windowHeight: window.innerHeight,
          });

          setState(prevState => ({
            ...prevState,
            x: event.x,
            y: event.y,
            isDragging: true,
            scrollDirection: computeScrollDirection(scrollFactorRef.current),
            currentDropTarget: getCurrentDropTarget(
              event.x,
              event.y,
              dragState.rectCache
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
        scrollFactorRef.current = 0;

        setState(prevState => ({
          ...prevState,
          x: 0,
          y: 0,
          scrollDirection: 0,
          isDragging: false,
        }));
      },
      updateComponentMove: ({x, y}: {x: number; y: number}) => {
        scrollFactorRef.current = computeScrollFactor({
          y,
          windowHeight: window.innerHeight,
        });

        setState(prevState => ({
          ...prevState,
          x,
          y,
          scrollDirection: computeScrollDirection(scrollFactorRef.current),
          currentDropTarget: getCurrentDropTarget(x, y, state.rectCache),
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
        scrollFactorRef.current = 0;

        setState(prevState => ({
          ...prevState,
          x: 0,
          y: 0,
          sourceComponentId: componentId,
          sourceRegionId: regionId,
          isDragging: true,
          scrollDirection: 0,
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

        scrollFactorRef.current = 0;

        setState(prevState => ({
          ...prevState,
          x: 0,
          y: 0,
          componentType: '',
          scrollDirection: 0,
          sourceComponentId: undefined,
          sourceRegionId: undefined,
          currentDropTarget: null,
          pendingTargetCommit: false,
        }));
      },
    }),
  });

  // Commits the current drop target if we are pending a target commit.
  useEffect(() => {
    if (dragState.pendingTargetCommit) {
      commitCurrentDropTarget();
    }
  }, [dragState.pendingTargetCommit]);

  // Starts scrolling the window when the drag state scroll factor is not 0.
  useEffect(() => {
    if (dragState.scrollDirection !== 0) {
      const interval = setInterval(() => {
        window.scrollBy(
          0,
          scrollFactorRef.current * SCROLL_BASE_AMOUNT_IN_PIXELS
        );
      }, SCROLL_INTERVAL_IN_MS);

      return () => clearInterval(interval);
    }

    return () => {
      // noop
    };
  }, [dragState.scrollDirection, scrollFactorRef]);

  return {
    dragState,
    commitCurrentDropTarget,
    startComponentMove,
    updateComponentMove,
    dropComponent,
    cancelDrag,
  };
}
