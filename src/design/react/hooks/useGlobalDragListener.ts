/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react';
import {useDesignState} from './useDesignState';

export function useGlobalDragListener(): void {
  const {dropComponent, updateComponentMove} = useDesignState();

  useEffect(() => {
    const dragListener = (event: DragEvent) =>
      updateComponentMove({x: event.clientX, y: event.clientY});
    const dragEndListener = () => dropComponent();

    window.addEventListener('drag', dragListener);
    window.addEventListener('dragend', dragEndListener);

    return () => {
      window.removeEventListener('drag', dragListener);
      window.removeEventListener('dragend', dragEndListener);
    };
  }, [updateComponentMove, dropComponent]);
}
