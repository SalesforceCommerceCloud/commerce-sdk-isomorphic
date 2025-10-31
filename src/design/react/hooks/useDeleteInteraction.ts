/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useInteraction} from './useInteraction';
import {ComponentDeletedEvent, EventPayload} from '../../messaging-api';

export interface DeleteInteraction {
  deleteComponent: (componentId: EventPayload<ComponentDeletedEvent>) => void;
}

export function useDeleteInteraction({
  selectedComponentId,
  setSelectedComponent,
}: {
  selectedComponentId: string | null;
  setSelectedComponent: (componentId: string) => void;
}): DeleteInteraction {
  const {deleteComponent} = useInteraction({
    initialState: null,
    eventHandlers: {},
    actions: (_state, _setState, clientApi) => ({
      deleteComponent: (event: EventPayload<ComponentDeletedEvent>) => {
        clientApi?.deleteComponent(event);

        // When a component is deleted, we want to make sure it's no longer selected.
        if (selectedComponentId === event.componentId) {
          setSelectedComponent('');
        }
      },
    }),
  });

  return {
    deleteComponent,
  };
}
