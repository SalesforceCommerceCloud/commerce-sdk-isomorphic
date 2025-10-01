/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState} from 'react';
import {ClientApi, ClientEventNameMapping} from '../../messaging-api';
import {useDesignContext} from '../context/DesignContext';

export interface EventHandler<
  TState,
  TName extends keyof ClientEventNameMapping
> {
  handler: (
    event: ClientEventNameMapping[TName],
    setState: (newState: TState) => void
  ) => void;
}

export interface InteractionConfig<TState, TActions> {
  /** Initial state value */
  initialState: TState | (() => TState);
  /** Event handlers to register with the client API */
  eventHandlers?: {
    [TKey in keyof ClientEventNameMapping]?: EventHandler<TState, TKey>;
  };
  /** Action creators that return functions to interact with the client API */
  actions?: (
    state: TState,
    setState: (newState: TState) => void,
    clientApi: ClientApi | null
  ) => TActions;
}

/**
 * Base hook that provides common interaction patterns for design-time functionality.
 * Reduces boilerplate by handling state management, event listeners, and cleanup.
 *
 * @param config - Configuration object defining the interaction behavior
 * @returns Object containing state and action methods
 */
export function useInteraction<
  TState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TActions extends Record<string, (...args: any[]) => any>
>(config: InteractionConfig<TState, TActions>): {state: TState} & TActions {
  const [state, setState] = useState<TState>(config.initialState);
  const {isDesignMode, clientApi} = useDesignContext();

  useEffect(() => {
    if (!isDesignMode || !clientApi) {
      return () => {
        // Return empty cleanup function for consistency
      };
    }

    const unsubscribeFunctions = Object.entries(config.eventHandlers ?? {}).map(
      ([eventName, entry]) =>
        clientApi.on(eventName as keyof ClientEventNameMapping, event =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entry.handler(event as any, setState)
        )
    );

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [isDesignMode, clientApi]);

  const actions =
    config.actions?.(state, setState, clientApi ?? null) ?? ({} as TActions);

  return {state, ...actions};
}
