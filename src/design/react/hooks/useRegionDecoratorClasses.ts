/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react';
import {useDesignState} from './useDesignState';
import {isComponentTypeAllowedInRegion} from '../utils/regionUtils';

export function useRegionDecoratorClasses({
  regionId,
  componentTypeInclusions,
  componentTypeExclusions,
}: {
  regionId: string;
  componentTypeInclusions: string[];
  componentTypeExclusions: string[];
}): string {
  const {
    dragState: {currentDropTarget, componentType},
  } = useDesignState();

  const isHovered = regionId && currentDropTarget?.regionId === regionId;

  const isComponentAllowed = useMemo(
    () =>
      isComponentTypeAllowedInRegion(
        componentType,
        componentTypeInclusions,
        componentTypeExclusions
      ),
    [componentType, componentTypeInclusions, componentTypeExclusions]
  );

  // Only show hover state if the region is hovered and the component is allowed
  const shouldShowHover = isHovered && isComponentAllowed;

  return [
    'pd-design__decorator',
    'pd-design__region',
    shouldShowHover && 'pd-design__region--hovered',
  ]
    .filter(Boolean)
    .join(' ');
}
