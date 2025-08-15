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
} from './api-types';
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
}: ClientConfiguration): ClientApi {
  const messenger = new Messenger<ClientEventNameMapping, HostEventNameMapping>(
    {
      source: 'client',
      id,
      emitter,
    }
  );

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
    notifyError: messenger.toEmitter('Error'),
    connect: ({
      interval = 1_000,
      timeout = 60_000,
    }: {interval?: number; timeout?: number} = {}) =>
      new Promise<void>(resolve => {
        const expirationTime = Date.now() + timeout;

        messenger.connect();

        const unsubscribe = messenger.on('ClientAcknowledged', event => {
          messenger.setRemoteId(event.meta.hostId as string);
          unsubscribe();
          clearConnectionTimeout();
          resolve();
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
      }),
    on: (event, handler) => messenger.on(event, handler),
    destroy: () => {
      clearConnectionTimeout();
      messenger.destroy();
    },
    getRemoteId: () => messenger.getRemoteId(),
  };
}
