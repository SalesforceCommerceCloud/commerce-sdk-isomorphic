/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';

export interface RegionContextType {
  regionId: string;
  regionDirection: 'row' | 'column';
  componentIds: string[];
}

export const RegionContext = React.createContext<RegionContextType | null>(
  null
);

export const useRegionContext = (): RegionContextType | null =>
  React.useContext(RegionContext);
