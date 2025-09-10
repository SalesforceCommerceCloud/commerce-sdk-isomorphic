/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';

export function createReactDesignDecorator(): (
  component: React.ReactElement
) => React.ReactElement {
  // TODO: Implement design decorator for React components.
  return (component: React.ReactElement) => <>{component}</>;
}
