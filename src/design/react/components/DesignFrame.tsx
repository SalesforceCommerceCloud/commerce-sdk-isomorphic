/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import {useComponentType} from '../hooks/useComponentType';
import {DeleteToolboxButton} from './DeleteToolboxButton';
import {MoveToolboxButton} from './MoveToolboxButton';
import {useDesignState} from '../hooks/useDesignState';
import {useLabels} from '../hooks/useLabels';

export const DesignFrame = ({
  componentId,
  name,
  parentId,
  regionId,
  showToolbox = true,
}: {
  componentId?: string;
  name: string;
  parentId?: string;
  regionId?: string;
  showToolbox?: boolean;
}): JSX.Element => {
  const componentType = useComponentType(componentId ?? '');
  const {deleteComponent, startComponentMove} = useDesignState();
  const labels = useLabels();
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const handleDelete = React.useCallback(
    () =>
      componentId &&
      deleteComponent({
        componentId,
        sourceComponentId: parentId ?? '',
        sourceRegionId: regionId ?? '',
      }),
    [deleteComponent, componentId]
  );

  const handleMouseDown = React.useCallback(() => {
    if (componentId && regionId) {
      startComponentMove(componentId, regionId);
    }
  }, []);

  // TODO: For the frame label, when there is not enough space above the component to display it, we
  // need to display it inside the container instead.
  return (
    <div className="pd-design__frame" ref={nodeRef}>
      <div className="pd-design__frame__label">
        {componentType?.image && (
          <span className="pd-design__icon">
            <img src={componentType.image} alt="" />
          </span>
        )}
        <span className="pd-design__frame__name">{name}</span>
      </div>
      {showToolbox && (
        <div className="pd-design__frame__toolbox">
          <MoveToolboxButton
            title={labels.moveComponent ?? 'Move component'}
            onMouseDown={handleMouseDown}
          />
          <DeleteToolboxButton
            title={labels.deleteComponent ?? 'Delete component'}
            onClick={handleDelete}
          />
        </div>
      )}
    </div>
  );
};

DesignFrame.defaultProps = {
  parentId: undefined,
  componentId: undefined,
  showToolbox: true,
  regionId: undefined,
};
