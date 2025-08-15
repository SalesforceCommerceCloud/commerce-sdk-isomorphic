/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useSelectInteraction} from '../hooks/useSelectInteraction';
import {useHoverInteraction} from '../hooks/useHoverInteraction';
import {useDeleteInteraction} from '../hooks/useDeleteInteraction';
import {useFocusInteraction} from '../hooks/useFocusInteraction';
import {ComponentDeletedEvent, EventPayload} from '../../messaging-api';

const noop = () => {
  /* noop */
};

export interface DesignState {
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  setSelectedComponent: (componentId: string) => void;
  setHoveredComponent: (componentId: string | null) => void;
  deleteComponent: (event: EventPayload<ComponentDeletedEvent>) => void;
  focusComponent: (node: Element) => void;
  focusedComponentId: string | null;
}

export const DesignStateContext = React.createContext<DesignState>({
  selectedComponentId: '',
  hoveredComponentId: null,
  setSelectedComponent: noop,
  setHoveredComponent: noop,
  deleteComponent: noop,
  focusComponent: noop,
  focusedComponentId: null,
});

export const DesignStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const selectInteraction = useSelectInteraction();
  const hoverInteraction = useHoverInteraction();
  const deleteInteraction = useDeleteInteraction({
    selectedComponentId: selectInteraction.selectedComponentId,
    setSelectedComponent: selectInteraction.setSelectedComponent,
  });
  const focusInteraction = useFocusInteraction({
    setSelectedComponent: selectInteraction.setSelectedComponent,
  });

  const state = React.useMemo(
    () => ({
      ...deleteInteraction,
      ...selectInteraction,
      ...hoverInteraction,
      ...focusInteraction,
    }),
    [deleteInteraction, selectInteraction, hoverInteraction, focusInteraction]
  );

  return (
    <DesignStateContext.Provider value={state}>
      {children}
    </DesignStateContext.Provider>
  );
};
