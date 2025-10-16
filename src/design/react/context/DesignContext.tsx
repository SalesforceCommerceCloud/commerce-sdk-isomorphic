/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';
import '../../styles/base.css';
import {
  createClientApi,
  ClientApi,
  IsomorphicConfiguration,
  ClientAcknowledgedEvent,
  EventPayload,
} from '../../messaging-api';
import {isDesignModeActive} from '../../modeDetection';
import {DesignStateProvider} from './DesignStateContext';

const noop = () => {
  /* noop */
};

/**
 * Type definition for the Design Context
 * Extends DesignState with additional design-time properties
 */
export interface DesignContextType {
  /** Whether design mode is currently active */
  isDesignMode: boolean;
  /** Client API for host communication */
  clientApi?: ClientApi;
  /** Whether the client is connected to the host */
  isConnected: boolean;
  /** The page designer config */
  pageDesignerConfig: EventPayload<ClientAcknowledgedEvent> | null;
}

export const DesignContext = React.createContext<DesignContextType>({
  isDesignMode: false,
  isConnected: false,
  pageDesignerConfig: null,
});

/**
 * Provider component that enables design-time functionality for child components.
 * Sets up client-host communication and manages component selection state.
 *
 * @param children - Child components to wrap with design functionality
 * @param targetOrigin - Target origin for postMessage communication
 * @param clientId - Id for the client API
 * @returns JSX element wrapping children with design context
 */
export const DesignProvider = ({
  children,
  targetOrigin,
  clientId,
  clientConnectionTimeout,
  clientConnectionInterval,
  clientLogger = noop,
}: React.PropsWithChildren<{
  targetOrigin: string;
  clientId: string;
  clientConnectionTimeout?: number;
  clientConnectionInterval?: number;
  clientLogger?: IsomorphicConfiguration['logger'];
}>): JSX.Element => {
  const isDesignMode = isDesignModeActive();
  const [isConnected, setIsConnected] = React.useState(false);
  const [pageDesignerConfig, setPageDesignerConfig] =
    React.useState<ClientAcknowledgedEvent | null>(null);

  const clientApi = React.useMemo(
    () =>
      createClientApi({
        logger: clientLogger,
        emitter: {
          postMessage: message =>
            window.parent.postMessage(message, targetOrigin),
          addEventListener: handler => {
            const listener = (event: MessageEvent) => handler(event.data);

            window.addEventListener('message', listener);

            return () => window.removeEventListener('message', listener);
          },
        },
        id: clientId,
      }),
    [targetOrigin, clientId]
  );

  React.useEffect(() => {
    // This will poll the host for a connection until the client is acknowledged.
    clientApi.connect({
      timeout: clientConnectionTimeout,
      interval: clientConnectionInterval,
      onHostConnected: event => {
        setPageDesignerConfig(event);
        setIsConnected(true);
      },
      onError: () => {
        // TODO: Figure out how to handle this.
      },
    });

    return () => {
      clientApi.disconnect();
      setPageDesignerConfig(null);
      setIsConnected(false);
    };
  }, [clientApi]);

  // Use the extracted state management hook
  const contextValue = React.useMemo<DesignContextType>(
    () => ({
      isDesignMode,
      clientApi,
      isConnected,
      pageDesignerConfig,
    }),
    [isDesignMode, clientApi, isConnected, pageDesignerConfig]
  );

  return (
    <DesignContext.Provider value={contextValue}>
      <DesignStateProvider>{children}</DesignStateProvider>
    </DesignContext.Provider>
  );
};

DesignProvider.defaultProps = {
  clientLogger: noop,
  clientConnectionTimeout: 60_000,
  clientConnectionInterval: 1_000,
};

/**
 * Custom hook to access the design context
 * Provides access to design mode state and component selection functionality
 *
 * @returns The current design context
 */
export const useDesignContext = (): DesignContextType =>
  React.useContext(DesignContext);
