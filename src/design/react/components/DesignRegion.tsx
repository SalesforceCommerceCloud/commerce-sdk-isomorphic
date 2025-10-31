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
import {useComponentContext} from '../context/ComponentContext';
import {useDesignState} from '../hooks/useDesignState';
import {isComponentTypeAllowedInRegion} from '../utils/regionUtils';

export function DesignRegion(
  props: RegionDecoratorProps<unknown>
): JSX.Element {
  const {designMetadata, children} = props;
  const {
    name,
    regionDirection = 'column',
    id,
    componentIds,
    componentTypeInclusions,
    componentTypeExclusions,
  } = designMetadata;
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const classes = useRegionDecoratorClasses({
    regionId: id,
    componentTypeInclusions,
    componentTypeExclusions,
  });
  const labels = useLabels();
  const {componentId: parentComponentId} = useComponentContext() ?? {};
  const {dragState} = useDesignState();

  useNodeToTargetStore({
    type: 'region',
    nodeRef,
    parentId: parentComponentId,
    componentIds,
    componentId: parentComponentId ?? '',
    regionId: id,
    regionDirection,
    componentTypeInclusions,
    componentTypeExclusions,
  });

  const context = React.useMemo<RegionContextType>(
    () => ({regionId: id, regionDirection, componentIds}),
    [id, regionDirection, componentIds]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const isComponentAllowed = isComponentTypeAllowedInRegion(
      dragState.componentType,
      componentTypeInclusions,
      componentTypeExclusions
    );

    if (isComponentAllowed) {
      event.preventDefault();
    }
  };

  return (
    <div className={classes} ref={nodeRef} onDragOver={handleDragOver}>
      <DesignFrame
        name={name ?? labels.defaultRegionName ?? 'Region'}
        parentId={parentComponentId}
        regionId={id}
        showToolbox={false}
      />
      <RegionContext.Provider value={context}>
        {children}
      </RegionContext.Provider>
    </div>
  );
}
