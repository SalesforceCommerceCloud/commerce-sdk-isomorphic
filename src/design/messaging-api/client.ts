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
} from './api-types.js';
import type {ClientAcknowledgedEvent} from './domain-types.js';
import {Messenger} from './messenger.js';
import {Deferred} from './deferred.js';

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
  let connectDeferred: Deferred<ClientAcknowledgedEvent | null>;
  const messenger = new Messenger<ClientEventNameMapping, HostEventNameMapping>(
    {
      source: 'client',
      id,
      emitter,
      logger,
    }
  );

  let isReady = false;
  let connectionTimeoutId: number | null = null;

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
    }: {
      interval?: number;
      timeout?: number;
      prepareClient?: () => Promise<void>;
    } = {}) => {
      const expirationTime = Date.now() + timeout;

      connectDeferred?.resolve(null);
      connectDeferred = new Deferred<ClientAcknowledgedEvent | null>();
      messenger.connect();

      const unsubscribe = messenger.on('ClientAcknowledged', event => {
        messenger.setRemoteId(event.meta.hostId as string);
        unsubscribe();
        clearConnectionTimeout();

        prepareClient()
          .then(() => {
            isReady = true;
            messenger.emit('ClientReady', {clientId: id});
            connectDeferred.resolve(event);
          })
          .catch(error => connectDeferred.reject(error));
      });

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

      checkInitialization();

      return connectDeferred.promise;
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
      messenger.disconnect();
      connectDeferred?.resolve(null);
    },
    getRemoteId: () => messenger.getRemoteId(),
  };
}
