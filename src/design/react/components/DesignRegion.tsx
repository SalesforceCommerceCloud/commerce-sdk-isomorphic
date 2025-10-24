/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {RegionDecoratorProps} from './component.types';
import {useRegionDecoratorClasses} from '../hooks/useRegionDecoratorClasses';
import {useNodeToTargetStore} from '../hooks/useNodeToTargetStore';
import {DesignFrame} from './DesignFrame';
import {useLabels} from '../hooks/useLabels';
import {RegionContext, RegionContextType} from '../context/RegionContext';

export function DesignRegion(
  props: RegionDecoratorProps<unknown>
): JSX.Element {
  const {designMetadata, children} = props;
  const {
    name,
    parentId,
    regionDirection = 'column',
    id,
    componentIds,
  } = designMetadata;
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const classes = useRegionDecoratorClasses({regionId: id});
  const labels = useLabels();

  useNodeToTargetStore({
    type: 'region',
    nodeRef,
    parentId,
    componentIds,
    componentId: parentId as string,
    regionId: id,
    regionDirection,
  });

  const context = React.useMemo<RegionContextType>(
    () => ({regionId: id, regionDirection, componentIds}),
    [id, regionDirection, componentIds]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) =>
    event.preventDefault();

  return (
    <div className={classes} ref={nodeRef} onDragOver={handleDragOver}>
      <DesignFrame
        name={name ?? labels.defaultRegionName ?? 'Region'}
        parentId={parentId}
        regionId={id}
        showToolbox={false}
      />
      <RegionContext.Provider value={context}>
        {children}
      </RegionContext.Provider>
    </div>
  );
}
