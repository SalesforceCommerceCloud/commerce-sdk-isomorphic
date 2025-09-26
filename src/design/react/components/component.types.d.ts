/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';

export type ComponentDecoratorProps<TProps> = React.PropsWithChildren<
  {
    designMetadata: {
      id: string;
      name?: string;
      parentId?: string;
      regionId?: string;
      isFragment?: boolean;
    };
  } & TProps
>;
