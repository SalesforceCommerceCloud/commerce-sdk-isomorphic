/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';

export type ComponentDecoratorProps = {
  id: string;
  name?: string;
  children?: React.ReactNode;
  [key: string]: any;
};
