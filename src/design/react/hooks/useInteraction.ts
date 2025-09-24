/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect} from 'react';
import {ClientApi} from '../../messaging-api';

export interface EventHandler<T = any> {
  eventName: string;
  handler: (event: T, setState: (newState: unknown) => void) => void;
}

export interface InteractionConfig<TState, TActions> {
  /** Initial state value */
  initialState: TState;
  /** Event handlers to register with the client API */
  eventHandlers: EventHandler[];
  /** Action creators that return functions to interact with the client API */
  actions: (
    state: TState,
    setState: (newState: TState) => void,
    clientApi: ClientApi | null
  ) => TActions;
}

/**
 * Base hook that provides common interaction patterns for design-time functionality.
 * Reduces boilerplate by handling state management, event listeners, and cleanup.
 *
 * @param isDesignMode - Whether design mode is active
 * @param clientApi - Client API for host communication
 * @param config - Configuration object defining the interaction behavior
 * @returns Object containing state and action methods
 */
export function useInteraction<
  TState,
  TActions extends Record<string, (...args: any[]) => any>
>(
  isDesignMode: boolean,
  clientApi: ClientApi,
  config: InteractionConfig<TState, TActions>
): {state: TState} & TActions {
  const [state, setState] = useState<TState>(config.initialState);

  useEffect(() => {
    if (!isDesignMode || !clientApi) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {}; // Return empty cleanup function for consistency
    }

    const unsubscribeFunctions = config.eventHandlers.map(
      ({eventName, handler}) =>
        clientApi.on(eventName as unknown, (event: unknown) =>
          handler(event, setState)
        )
    );

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [isDesignMode, clientApi]);

  const actions = config.actions(state, setState, clientApi);

  return {state, ...actions} as {state: TState} & TActions;
}
