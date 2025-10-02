/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo, useEffect} from 'react';
import {useDesignState} from './useDesignState';

export function useExternalDragHandler(
  regionId: string,
  componentId: string,
  elementRef: React.RefObject<Element>
): void {
  const {
    externalDragState: {
      isDragging,
      x: dragX,
      y: dragY,
      currentDropTarget,
      pendingTargetCommit,
    },
    setCurrentDropTarget,
    commitCurrentDropTarget,
  } = useDesignState();

  // When we start dragging, capture the element's coordinates.
  const coordinates = useMemo(
    () =>
      isDragging && elementRef.current
        ? elementRef.current.getBoundingClientRect()
        : null,
    [elementRef.current, isDragging]
  );

  const isDraggingOverRegion =
    isDragging &&
    coordinates &&
    dragX >= coordinates.x &&
    dragX <= coordinates.x + coordinates.width &&
    dragY >= coordinates.y &&
    dragY <= coordinates.y + coordinates.height;

  useEffect(() => {
    if (isDraggingOverRegion) {
      if (currentDropTarget !== regionId) {
        setCurrentDropTarget(regionId);
      }
    } else if (currentDropTarget === regionId) {
      setCurrentDropTarget('');
    }
  }, [isDraggingOverRegion, currentDropTarget, regionId]);

  useEffect(() => {
    if (pendingTargetCommit && currentDropTarget === regionId) {
      commitCurrentDropTarget(componentId);
    }
  }, [pendingTargetCommit, currentDropTarget, regionId, componentId]);
}
