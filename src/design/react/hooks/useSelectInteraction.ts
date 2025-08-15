/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useInteraction} from './useInteraction';

export interface SelectInteraction {
  selectedComponentId: string;
  setSelectedComponent: (componentId: string) => void;
}

/**
 * Custom hook that manages component selection state and handles
 * client-host communication for selection events.
 *
 * @param isDesignMode - Whether design mode is active
 * @param clientApi - Client API for host communication
 * @returns Selection state and interaction methods
 */
export function useSelectInteraction(): SelectInteraction {
  const {state: selectedComponentId, setSelectedComponent} = useInteraction({
    initialState: '',
    eventHandlers: {
      ComponentSelected: {
        handler: (event, setState) => {
          setState(event.componentId);
        },
      },
      ComponentDeselected: {
        handler: (_, setState) => {
          setState('');
        },
      },
    },
    actions: (_state, setState, clientApi) => ({
      setSelectedComponent: (componentId: string) => {
        setState(componentId);
        clientApi?.selectComponent({componentId});
      },
    }),
  });

  return {
    selectedComponentId,
    setSelectedComponent,
  };
}
