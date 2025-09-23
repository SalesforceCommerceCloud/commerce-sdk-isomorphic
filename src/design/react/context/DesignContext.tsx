/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, { createContext, useMemo } from 'react';
import { createClientApi, ClientApi } from '../../messaging-api';
import { isDesignModeActive } from '../../modeDetection';
import { useDesignState, DesignState } from '../hooks/useDesignState';

/**
 * Type definition for the Design Context
 * Extends DesignState with additional design-time properties
 */
export interface DesignContextType extends DesignState {
  /** Whether design mode is currently active */
  isDesignMode: boolean;
  /** Client API for host communication */
  clientApi: ClientApi;
}

export const DesignContext = createContext<DesignContextType | undefined>(
  undefined
);

/**
 * Provider component that enables design-time functionality for child components.
 * Sets up client-host communication and manages component selection state.
 * 
 * @param children - Child components to wrap with design functionality
 * @param targetOrigin - Target origin for postMessage communication (defaults to '*')
 * @returns JSX element wrapping children with design context
 */
export const DesignProvider = ({
  children,
  targetOrigin = '*',
}: {
  children: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  targetOrigin?: string;
}): JSX.Element => {
  const isDesignMode = isDesignModeActive();

  const clientApi = React.useMemo(
    () =>
      createClientApi({
        emitter: {
          postMessage: message => window.postMessage(message, targetOrigin),
          addEventListener: handler => {
            window.addEventListener(
              'message',
              handler as unknown as EventListener
            );

            return () =>
              window.removeEventListener(
                'message',
                handler as unknown as EventListener
              );
          },
        },
        id: 'client-app',
      }),
    [targetOrigin]
  );

  // Use the extracted state management hook
  const designState = useDesignState(isDesignMode, clientApi);

  const contextValue = useMemo<DesignContextType>(
    () => ({
      isDesignMode,
      clientApi,
      selectedComponentId: designState.selectedComponentId,
      hoveredComponentId: designState.hoveredComponentId,
      setSelectedComponent: designState.setSelectedComponent,
      setHoveredComponent: designState.setHoveredComponent,
    }),
    [
      isDesignMode,
      clientApi,
      designState.selectedComponentId,
      designState.hoveredComponentId,
      designState.setSelectedComponent,
      designState.setHoveredComponent,
    ]
  );

  return (
    <DesignContext.Provider value={contextValue}>
      {children}
    </DesignContext.Provider>
  );
};

/**
 * Custom hook to access the design context
 * Provides access to design mode state and component selection functionality
 * 
 * @returns The current design context
 * @throws Error if used outside of a DesignProvider
 */
export const useDesignContext = (): DesignContextType => {
  const context = React.useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesignContext must be used within a DesignProvider');
  }
  return context;
};
