/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {DesignStateContext, DesignState} from '../context/DesignStateContext';

/**
 * Custom hook that manages design-time component state by composing
 * individual interaction hooks for better maintainability and testability.
 *
 * @param isDesignMode - Whether design mode is active
 * @param clientApi - Client API for host communication
 * @returns Combined design state from all interactions
 */
export const useDesignState = (): DesignState =>
  React.useContext(DesignStateContext);
