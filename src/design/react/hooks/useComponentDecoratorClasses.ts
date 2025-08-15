/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useDesignState} from './useDesignState';

export function useComponentDecoratorClasses({
  componentId,
  isFragment,
}: {
  componentId: string;
  isFragment: boolean;
}): string {
  const {selectedComponentId, hoveredComponentId} = useDesignState();

  const isSelected = selectedComponentId === componentId;
  const isHovered = hoveredComponentId === componentId;
  const showFrame = isSelected || isHovered;

  return [
    'pd-design--decorator',
    isFragment ? 'pd-design--fragment' : 'pd-design--component',
    showFrame && 'pd-design--show-frame',
    isSelected && 'pd-design--selected',
    isHovered && 'pd-design--hovered',
  ]
    .filter(Boolean)
    .join(' ');
}
