/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react';
import {ClientApi} from '../../messaging-api';
import {useInteraction} from './useInteraction';

export interface HoverInteraction {
  hoveredComponentId: string | null;
  setHoveredComponent: (componentId: string | null) => void;
}

/**
 * Custom hook that manages component hover state and handles
 * client-host communication for hover events.
 *
 * @param isDesignMode - Whether design mode is active
 * @param clientApi - Client API for host communication
 * @returns Hover state and interaction methods
 */
export function useHoverInteraction(
  isDesignMode: boolean,
  clientApi: ClientApi
): HoverInteraction {
  const {state: hoveredComponentId, setHoveredComponent} = useInteraction(
    isDesignMode,
    clientApi,
    {
      initialState: null,
      eventHandlers: [
        {
          eventName: 'ComponentHoveredIn',
          handler: (event: {componentId: string}, setState) => {
            setState(event.componentId);
          },
        },
        {
          eventName: 'ComponentHoveredOut',
          handler: (event, setState) => {
            setState(null);
          },
        },
      ],
      actions: (state, setState, actionClientApi) => ({
        setHoveredComponent: useCallback(
          (componentId: string | null) => {
            setState(componentId);
            if (actionClientApi) {
              if (componentId) {
                actionClientApi.hoverInToComponent({componentId});
              } else if (state) {
                // Use the current hovered component for hover out
                actionClientApi.hoverOutOfComponent({
                  componentId: state,
                });
              }
            }
          },
          [actionClientApi, setState, state]
        ),
      }),
    }
  );

  return {
    hoveredComponentId,
    setHoveredComponent,
  };
}
