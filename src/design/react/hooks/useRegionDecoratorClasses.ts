/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useDesignState} from './useDesignState';

export function useRegionDecoratorClasses({
  regionId,
}: {
  regionId: string;
}): string {
  const {
    dragState: {currentDropTarget},
  } = useDesignState();

  const isHovered = regionId && currentDropTarget?.regionId === regionId;

  return [
    'pd-design__decorator',
    'pd-design__region',
    isHovered && 'pd-design__region--hovered pd-design__frame--visible',
  ]
    .filter(Boolean)
    .join(' ');
}
