/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useInteraction} from './useInteraction';

export interface ExternalDragInteraction {
  externalDragState: {
    isDragging: boolean;
    componentType: string;
    x: number;
    y: number;
    currentDropTarget: string | null;
    pendingTargetCommit: boolean;
  };
  setCurrentDropTarget: (regionId: string) => void;
  commitCurrentDropTarget: (targetComponentId: string) => void;
}

export function useExternalDragInteraction(): ExternalDragInteraction {
  const {
    state: dragState,
    setCurrentDropTarget,
    commitCurrentDropTarget,
  } = useInteraction({
    initialState: {
      isDragging: false,
      componentType: '',
      x: 0,
      y: 0,
      currentDropTarget: null as string | null,
      pendingTargetCommit: false,
    },
    eventHandlers: {
      ComponentDragStarted: {
        handler: (event, setState) => {
          setState(prevState => ({
            ...prevState,
            componentType: event.componentType,
            x: event.x ?? 0,
            y: event.y ?? 0,
            isDragging: true,
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
          }));
        },
      },
      ClientWindowDragDropped: {
        handler: (event, setState) => {
          setState(prevState => ({
            ...prevState,
            x: event.x,
            y: event.y,
            isDragging: false,
            pendingTargetCommit: true,
          }));
        },
      },
    },
    actions: (state, setState, clientApi) => ({
      setCurrentDropTarget: (regionId: string) => {
        setState(prevState => ({
          ...prevState,
          currentDropTarget: regionId,
        }));
      },
      commitCurrentDropTarget: (targetComponentId: string) => {
        clientApi?.addComponentToRegion({
          componentProperties: {},
          componentType: state.componentType,
          targetComponentId,
          targetRegionId: state.currentDropTarget ?? '',
        });
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

  return {
    externalDragState: dragState,
    setCurrentDropTarget,
    commitCurrentDropTarget,
  };
}
