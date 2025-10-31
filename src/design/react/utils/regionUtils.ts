/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Checks if a component type is allowed in a region based on inclusion and exclusion rules.
 *
 * @param componentType - The type of component being checked
 * @param componentTypeInclusions - Array of allowed component types (if empty, all types are allowed by default)
 * @param componentTypeExclusions - Array of forbidden component types
 * @returns true if the component type is allowed, false otherwise
 */
export function isComponentTypeAllowedInRegion(
  componentType: string | undefined,
  componentTypeInclusions: string[],
  componentTypeExclusions: string[]
): boolean {
  if (!componentType) {
    return false;
  }

  if (componentTypeExclusions?.includes(componentType)) {
    return false;
  }

  // If there are inclusions specified, the component type must be in the list
  if (componentTypeInclusions?.length > 0) {
    return componentTypeInclusions.includes(componentType);
  }

  return true;
}
