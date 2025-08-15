/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useDesignState} from './useDesignState';

/**
 * Focuses a component when the focused component id matches the component id.
 * @param componentId - The id of the component to focus.
 * @param nodeRef - The ref object to the node to focus.
 */
export function useFocusedComponentHandler(
  componentId: string,
  nodeRef: React.RefObject<Element>
): void {
  const {focusedComponentId, focusComponent} = useDesignState();

  React.useEffect(() => {
    if (focusedComponentId === componentId && nodeRef.current) {
      focusComponent(nodeRef.current);
    }
  }, [focusedComponentId, componentId, focusComponent]);
}
