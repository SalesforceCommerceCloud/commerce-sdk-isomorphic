/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useCallback, useRef} from 'react';
import './ComponentDecorator.css';
import {useDesignContext} from '../context/DesignContext';
import {ComponentDecoratorProps} from './component.types';

/**
 * Creates a higher-order component that wraps React components with design-time functionality.
 * In design mode, adds visual indicators, selection handling, and host communication.
 * In normal mode, renders the component unchanged for optimal performance.
 *
 * @template TProps - The props type of the component being decorated
 * @param Component - The React component to wrap with design functionality
 * @returns A new component with design-time capabilities
 */
export const createReactComponentDesignDecorator =
  <TProps extends ComponentDecoratorProps>(
    Component: React.ComponentType<TProps>
  ): ((props: TProps) => JSX.Element) =>
  (props: TProps) => {
    const {id, name, isFragment, children, ...componentProps} = props;
    const componentId = id;
    const componentName = name || 'Component';
    const dragRef = useRef<HTMLDivElement>(null);

    // Only use design context if in design mode
    const designContext = useDesignContext();
    const isDesignMode = Boolean(designContext?.isDesignMode);

    if (!isDesignMode || !designContext) {
      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Component {...props} />;
    }

    const {
      selectedComponentId,
      setSelectedComponent,
      hoveredComponentId,
      setHoveredComponent,
    } = designContext;

    const handleMouseEnter = useCallback(() => {
      if (isDesignMode) {
        setHoveredComponent(componentId);
      }
    }, [isDesignMode, setHoveredComponent, componentId]);

    const handleMouseLeave = useCallback(() => {
      if (isDesignMode) {
        setHoveredComponent(null);
      }
    }, [isDesignMode, setHoveredComponent]);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (isDesignMode) {
          e.stopPropagation();
          setSelectedComponent(componentId);
        }
      },
      [isDesignMode, setSelectedComponent, componentId]
    );

    const isSelected = selectedComponentId === componentId;
    const isHovered = hoveredComponentId === componentId;
    const showFrame = isSelected || isHovered;
    const classNames = [];

    if (isFragment) {
      classNames.push('pd-design-fragment');
    } else {
      classNames.push('pd-design-component');
    }

    if (showFrame) {
      classNames.push('show-frame');
    }
    if (isSelected) {
      classNames.push('selected');
    }
    if (isHovered) {
      classNames.push('hovered');
    }
    const classes = classNames.join(' ');

    return (
      <div
        ref={dragRef}
        className={classes}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-component-id={componentId}
        data-component-name={componentName}>
        {showFrame && (
          <div className="component-label">
            <span className="component-name">
              {componentName} ({componentId})
            </span>
            <div className="toolbox">
              <button className="toolbox-button" title="Delete component">
                <svg
                  className="delete-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        <Component {...componentProps}>{children}</Component>
      </div>
    );
  };
