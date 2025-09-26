/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useInteraction} from './useInteraction';

export interface HoverInteraction {
  hoveredComponentId: string | null;
  setHoveredComponent: (componentId: string | null) => void;
}

/**
 * Custom hook that manages component hover state and handles
 * client-host communication for hover events.
 *
 * @returns Hover state and interaction methods
 */
export function useHoverInteraction(): HoverInteraction {
  const {state: hoveredComponentId, setHoveredComponent} = useInteraction({
    initialState: null as string | null,
    eventHandlers: {
      ComponentHoveredIn: {
        handler: (event, setState) => setState(event.componentId),
      },
      ComponentHoveredOut: {
        handler: (_, setState) => setState(null),
      },
    },
    actions: (state, setState, clientApi) => ({
      setHoveredComponent: (componentId: string | null) => {
        setState(componentId);

        if (componentId) {
          clientApi?.hoverInToComponent({componentId});
        } else if (state) {
          // Use the current hovered component for hover out
          clientApi?.hoverOutOfComponent({
            componentId: state,
          });
        }
      },
    }),
  });

  return {
    hoveredComponentId,
    setHoveredComponent,
  };
}
