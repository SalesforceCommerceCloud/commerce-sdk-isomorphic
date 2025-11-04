/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useDesignState} from './useDesignState';
import {NodeToTargetMapEntry} from '../context/DesignStateContext';

export function useNodeToTargetStore({
  parentId,
  componentId,
  regionId,
  regionDirection,
  nodeRef,
  type,
  componentIds,
  componentTypeInclusions,
  componentTypeExclusions,
}: Partial<NodeToTargetMapEntry> & {
  nodeRef: React.RefObject<Element>;
}): void {
  const {nodeToTargetMap} = useDesignState();

  React.useEffect(() => {
    if (nodeRef.current) {
      nodeToTargetMap.set(nodeRef.current, {
        parentId,
        componentId,
        regionId,
        regionDirection,
        type,
        componentIds,
        componentTypeInclusions,
        componentTypeExclusions,
      } as NodeToTargetMapEntry);
    }
  }, [
    nodeRef.current,
    parentId,
    componentId,
    regionId,
    type,
    componentIds,
    nodeToTargetMap,
    componentTypeInclusions,
    componentTypeExclusions,
  ]);
}
