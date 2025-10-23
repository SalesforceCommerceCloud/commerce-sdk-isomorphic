/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {ComponentDecoratorProps} from './component.types';
import {useRegionDecoratorClasses} from '../hooks/useRegionDecoratorClasses';
import {useNodeToTargetStore} from '../hooks/useNodeToTargetStore';
import {DesignFrame} from './DesignFrame';
import {useLabels} from '../hooks/useLabels';

export function DesignRegion(
  props: ComponentDecoratorProps<unknown>
): JSX.Element {
  const {designMetadata, children} = props;
  const {name, parentId, regionDirection = 'column', regionId} = designMetadata;
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const classes = useRegionDecoratorClasses({regionId});
  const labels = useLabels();

  useNodeToTargetStore({
    type: 'region',
    nodeRef,
    parentId,
    componentId: parentId as string,
    regionId,
    regionDirection,
  });

  return (
    <div className={classes} ref={nodeRef}>
      <DesignFrame
        name={name ?? labels.defaultRegionName ?? 'Region'}
        parentId={parentId}
        regionId={regionId}
        showToolbox={false}
      />
      {children}
    </div>
  );
}
