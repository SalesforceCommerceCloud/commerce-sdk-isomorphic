/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { useState, useEffect, useCallback } from 'react';
import { ClientApi } from '../../messaging-api';

export interface DesignState {
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  setSelectedComponent: (componentId: string) => void;
  setHoveredComponent: (componentId: string | null) => void;
}

/**
 * Custom hook that manages design-time component state and handles
 * client-host communication for component selection and hover events.
 */
export function useDesignState(
  isDesignMode: boolean,
  clientApi: ClientApi | null
): DesignState {
  const [selectedComponentId, setSelectedComponentState] = useState<
    string | null
  >(null);
  const [hoveredComponentId, setHoveredComponentState] = useState<
    string | null
  >(null);

  // Set up event listeners for design mode communication
  useEffect(() => {
    if (!isDesignMode || !clientApi) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {}; // Return empty cleanup function for consistency
    }

    const unsubscribeComponentSelected = clientApi.on(
      'ComponentSelected',
      event => {
        setSelectedComponentState(event.componentId);
      }
    );

    const unsubscribeComponentDeselected = clientApi.on(
      'ComponentDeselected',
      event => {
        setSelectedComponentState(null);
      }
    );

    const unsubscribeComponentHoveredIn = clientApi.on(
      'ComponentHoveredIn',
      event => {
        setHoveredComponentState(event.componentId);
      }
    );

    const unsubscribeComponentHoveredOut = clientApi.on(
      'ComponentHoveredOut',
      event => {
        setHoveredComponentState(null);
      }
    );

    return () => {
      unsubscribeComponentSelected();
      unsubscribeComponentDeselected();
      unsubscribeComponentHoveredIn();
      unsubscribeComponentHoveredOut();
    };
  }, [isDesignMode, clientApi]);

  // Handler for selecting a component (sends event to host)
  const setSelectedComponent = useCallback(
    (componentId: string) => {
      setSelectedComponentState(componentId);
      if (clientApi) {
        clientApi.selectComponent({ componentId });
      }
    },
    [clientApi]
  );

  // Handler for hovering over a component (sends event to host)
  const setHoveredComponent = useCallback(
    (componentId: string | null) => {
      setHoveredComponentState(componentId);
      if (clientApi) {
        if (componentId) {
          clientApi.hoverInToComponent({ componentId });
        } else if (hoveredComponentId) {
          // Use the current hovered component for hover out
          clientApi.hoverOutOfComponent({
            componentId: hoveredComponentId,
          });
        }
      }
    },
    [clientApi, hoveredComponentId]
  );

  return {
    selectedComponentId,
    hoveredComponentId,
    setSelectedComponent,
    setHoveredComponent,
  };
}
