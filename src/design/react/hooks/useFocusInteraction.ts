/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useInteraction} from './useInteraction';

export interface FocusInteraction {
  focusedComponentId: string | null;
  focusComponent: (node: Element) => void;
}

export function useFocusInteraction({
  setSelectedComponent,
}: {
  setSelectedComponent: (componentId: string) => void;
}): FocusInteraction {
  const {state: focusedComponentId, focusComponent} = useInteraction({
    initialState: null as string | null,
    eventHandlers: {
      ComponentFocused: {
        handler: (event, setState) => {
          setSelectedComponent('');
          setState(event.componentId);
        },
      },
    },
    actions: (_state, setState) => ({
      focusComponent: (node: Element) => {
        node.scrollIntoView();
        setState(null);
      },
    }),
  });

  return {
    focusedComponentId,
    focusComponent,
  };
}
