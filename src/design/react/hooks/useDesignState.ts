/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ClientApi} from '../../messaging-api';
import {useSelectInteraction} from './useSelectInteraction';
import {useHoverInteraction} from './useHoverInteraction';

export interface DesignState {
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  setSelectedComponent: (componentId: string) => void;
  setHoveredComponent: (componentId: string | null) => void;
}

/**
 * Custom hook that manages design-time component state by composing
 * individual interaction hooks for better maintainability and testability.
 *
 * @param isDesignMode - Whether design mode is active
 * @param clientApi - Client API for host communication
 * @returns Combined design state from all interactions
 */
export function useDesignState(
  isDesignMode: boolean,
  clientApi: ClientApi
): DesignState {
  const selectInteraction = useSelectInteraction(isDesignMode, clientApi);
  const hoverInteraction = useHoverInteraction(isDesignMode, clientApi);

  return {
    ...selectInteraction,
    ...hoverInteraction,
  };
}
