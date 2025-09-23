/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, { useCallback, useRef, useMemo } from 'react';
import styles from '../../css/design.module.css';
import { useDesignContext } from '../context/DesignContext';
import { ComponentDecoratorProps } from './component.types';

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
    const { id, name, children, ...componentProps } = props;
    const componentId = id;
    const componentName = name || 'Component';
    const dragRef = useRef<HTMLDivElement>(null);

    // Memoize component props to avoid unnecessary re-renders
    const memoizedComponentProps = useMemo(
      () => componentProps,
      [componentProps]
    );

    // Only use design context if in design mode
    const designContext = useDesignContext();
    const isDesignMode = designContext?.isDesignMode;

    if (!isDesignMode) {
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

    // Memoize class names to avoid string concatenation on every render
    const classes = useMemo(() => {
      const classNames = [styles.pdDesignComponent];
      if (showFrame) classNames.push(styles.showFrame);
      if (isSelected) classNames.push(styles.selected);
      if (isHovered) classNames.push(styles.hovered);
      return classNames.join(' ');
    }, [showFrame, isSelected, isHovered]);

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
          <div
            className={`${styles.componentLabel} ${
              showFrame ? styles.showFrame : ''
            }`}>
            <span className={styles.componentName}>
              {componentName} ({componentId})
            </span>
            <div className={styles.toolbox}>
              <button
                className={styles.toolboxButton}
                title="Delete component">
                <svg
                  className={styles.deleteIcon}
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
        <Component {...memoizedComponentProps}>{children}</Component>
      </div>
    );
  };
