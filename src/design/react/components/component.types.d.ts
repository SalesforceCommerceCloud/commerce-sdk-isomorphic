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
      /**
       * The id of the component or region.
       */
      id: string;
      /**
       * Whether the component is a fragment.
       */
      isFragment: boolean;
      /**
       * The name of the component or region.
       */
      name?: string;
      /**
       * The id of the parent component if it exists.
       */
      parentId?: string;
    };
  } & TProps
>;

export type RegionDecoratorProps<TProps> = React.PropsWithChildren<
  {
    designMetadata: {
      /**
       * The id of the component or region.
       */
      id: string;
      /**
       * The direction of the region or the region the component belongs to.
       */
      regionDirection: 'row' | 'column';
      /**
       * The name of the component or region.
       */
      name?: string;
      /**
       * The id of the parent component if it exists.
       */
      parentId?: string;
      /**
       * A list of component ids that are part of this region.
       */
      componentIds: string[];
    };
  } & TProps
>;
