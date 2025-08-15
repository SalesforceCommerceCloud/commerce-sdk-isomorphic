/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {
  ClientApi,
  ClientConfiguration,
  ClientEventNameMapping,
  HostEventNameMapping,
  WithMeta,
} from './api-types';
import type {ClientAcknowledgedEvent} from './domain-types';
import {Messenger} from './messenger';

/**
 * Factory function to create a ClientApi instance.
 *
 * @public
 * @param _config - Configuration object for the client API (currently unused).
 * @returns {ClientApi} An instance of the ClientApi interface.
 */
export function createClientApi({
  emitter,
  id,
  forwardedKeys = [],
  logger,
}: ClientConfiguration): ClientApi {
  const messenger = new Messenger<ClientEventNameMapping, HostEventNameMapping>(
    {
      source: 'client',
      id,
      emitter,
      logger,
    }
  );
  const subscriptions: (() => void)[] = [];

  let isReady = false;
  let isConnected = false;
  let connectionTimeoutId: number | null = null;
  let hostConfig: ClientAcknowledgedEvent | null = null;

  const clearConnectionTimeout = () => {
    if (connectionTimeoutId) {
      clearTimeout(connectionTimeoutId);
      connectionTimeoutId = null;
    }
  };

  return {
    addComponentToRegion: messenger.toEmitter('ComponentAddedToRegion'),
    moveComponentToRegion: messenger.toEmitter('ComponentMovedToRegion'),
    startComponentDrag: messenger.toEmitter('ComponentDragStarted'),
    hoverInToComponent: messenger.toEmitter('ComponentHoveredIn'),
    hoverOutOfComponent: messenger.toEmitter('ComponentHoveredOut'),
    selectComponent: messenger.toEmitter('ComponentSelected'),
    deselectComponent: messenger.toEmitter('ComponentDeselected'),
    deleteComponent: messenger.toEmitter('ComponentDeleted'),
    notifyWindowScrollChanged: messenger.toEmitter('WindowScrollChanged'),
    notifyClientReady: messenger.toEmitter('ClientReady'),
    notifyError: messenger.toEmitter('Error'),
    connect: ({
      interval = 1_000,
      timeout = 60_000,
      prepareClient = () => Promise.resolve(),
      onHostConnected,
      onError,
    }: {
      interval?: number;
      timeout?: number;
      prepareClient?: () => Promise<void>;
      onHostConnected?: (event: ClientAcknowledgedEvent) => void;
      onError?: (error: Error) => void;
    } = {}) => {
      if (isConnected) {
        onHostConnected?.(hostConfig as ClientAcknowledgedEvent);

        return;
      }

      const expirationTime = Date.now() + timeout;

      messenger.connect();

      subscriptions.push(
        messenger.on('ClientAcknowledged', event => {
          if (event.meta.hostId === messenger.getRemoteId()) {
            // We've already been acknowledged by the host in this case.
            return;
          }

          hostConfig = event;
          messenger.setRemoteId(event.meta.hostId as string);
          clearConnectionTimeout();

          prepareClient()
            .then(() => {
              isReady = true;
              messenger.emit('ClientReady', {clientId: id});
              onHostConnected?.(hostConfig as ClientAcknowledgedEvent);
            })
            .catch(error => onError?.(error));
        })
      );

      const checkInitialization = () => {
        if (Date.now() > expirationTime) {
          throw new Error(
            `Timed out after waiting ${timeout}ms for host connection`
          );
        }

        messenger.emit(
          'ClientInitialized',
          {clientId: id, forwardedKeys},
          {requireRemoteId: false}
        );
        connectionTimeoutId = setTimeout(
          () => checkInitialization(),
          interval
        ) as unknown as number;
      };

      isConnected = true;
      checkInitialization();
    },
    on: <TEvent extends keyof ClientEventNameMapping>(
      eventName: TEvent,
      handler: (
        handlerEvent: Readonly<WithMeta & ClientEventNameMapping[TEvent]>
      ) => void
    ) =>
      messenger.on(eventName, event => {
        // Don't receive any events besides the acknowledged event until the client is ready
        if (eventName === 'ClientAcknowledged' || isReady) {
          handler(event);
        }
      }),
    disconnect: () => {
      clearConnectionTimeout();
      messenger.emit('ClientDisconnected', {clientId: id});
      isConnected = false;
      subscriptions.forEach(unsubscribe => unsubscribe());
      messenger.disconnect();
    },
    getRemoteId: () => messenger.getRemoteId(),
  };
}
