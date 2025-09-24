/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react';
import {ClientApi} from '../../messaging-api';
import {useInteraction} from './useInteraction';

export interface SelectInteraction {
  selectedComponentId: string | null;
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
export function useSelectInteraction(
  isDesignMode: boolean,
  clientApi: ClientApi
): SelectInteraction {
  const {state: selectedComponentId, setSelectedComponent} = useInteraction(
    isDesignMode,
    clientApi,
    {
      initialState: null,
      eventHandlers: [
        {
          eventName: 'ComponentSelected',
          handler: (event: {componentId: string}, setState) => {
            setState(event.componentId);
          },
        },
        {
          eventName: 'ComponentDeselected',
          handler: (event, setState) => {
            setState(null);
          },
        },
      ],
      actions: (state, setState, actionClientApi) => ({
        setSelectedComponent: useCallback(
          (componentId: string) => {
            setState(componentId);
            if (actionClientApi) {
              actionClientApi.selectComponent({componentId});
            }
          },
          [actionClientApi, setState]
        ),
      }),
    }
  );

  return {
    selectedComponentId,
    setSelectedComponent,
  };
}
