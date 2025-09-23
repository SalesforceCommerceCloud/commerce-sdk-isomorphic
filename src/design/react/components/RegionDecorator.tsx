/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import { useDesignContext } from '../context/DesignContext';
import { ComponentDecoratorProps } from './component.types';

export const createReactRegionDesignDecorator =
  <TProps extends ComponentDecoratorProps>(
    Region: React.ComponentType<TProps>
  ): ((props: TProps) => JSX.Element) =>
  (props: TProps) => {
    const { id, name, children, ...componentProps } = props;

    const designContext = useDesignContext();
    const isDesignMode = designContext?.isDesignMode;

    if (!isDesignMode) {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Region {...props} />;
    }

    return (
      <div className="pd-region">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Region {...componentProps}>{children}</Region>
      </div>
    );
  };
