/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react';
import {NodeToTargetMapEntry} from '../context/DesignStateContext';

export type ComponentDiscoveryResult = NodeToTargetMapEntry & {node: Element};

/**
 * Returns a utility for discovering components and regions at a given
 * x, y coordinates.
 * @param nodeToTargetMap - The map of nodes to target entries.
 */
export function useComponentDiscovery({
  nodeToTargetMap,
}: {
  nodeToTargetMap: WeakMap<Element, NodeToTargetMapEntry>;
}): (query: {
  x: number;
  y: number;
  filter?: (entry: NodeToTargetMapEntry) => boolean;
}) => ComponentDiscoveryResult[] {
  return useCallback(
    ({x, y, filter = () => true}) => {
      const nodeStack = document.elementsFromPoint(x, y);
      const results: ComponentDiscoveryResult[] = [];

      for (let i = 0; i < nodeStack.length; i += 1) {
        const node = nodeStack[i];
        const entry = nodeToTargetMap.get(node);

        if (entry && filter(entry)) {
          results.push({...entry, node});
        }
      }

      return results;
    },
    [nodeToTargetMap]
  );
}
