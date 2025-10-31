/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react';
import {useDesignState} from './useDesignState';
import {useThrottledCallback} from './useThrottledCallback';

const FPS_60 = 1000 / 60;

export function useGlobalDragListener(): void {
  const {dropComponent, updateComponentMove, cancelDrag} = useDesignState();
  const dragListener = useThrottledCallback(
    (event: DragEvent) =>
      updateComponentMove({x: event.clientX, y: event.clientY}),
    FPS_60,
    [updateComponentMove]
  );

  useEffect(() => {
    const dragEndListener = () => dropComponent();
    const mouseUpListener = () => cancelDrag();

    window.addEventListener('dragover', dragListener);
    window.addEventListener('dragend', dragEndListener);
    // We need to make sure we cancel dragging on mouseup since we
    // we are using mousedown to start dragging or else it would stay in a dragging
    // state from regular click events.
    window.addEventListener('mouseup', mouseUpListener);

    return () => {
      window.removeEventListener('dragover', dragListener);
      window.removeEventListener('dragend', dragEndListener);
      window.removeEventListener('mouseup', mouseUpListener);
    };
  }, [dropComponent, cancelDrag, dragListener]);
}
