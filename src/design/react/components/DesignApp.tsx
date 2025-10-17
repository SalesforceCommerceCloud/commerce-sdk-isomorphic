/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useGlobalDragListener} from '../hooks/useGlobalDragListener';

/**
 * Containes any global setup logic for the design layer.
 */
export const DesignApp = ({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element => {
  useGlobalDragListener();

  return <>{children}</>;
};
