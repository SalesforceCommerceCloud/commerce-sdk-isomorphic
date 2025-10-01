/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {
  HostApi,
  HostConfiguration,
  ClientEventNameMapping,
  HostEventNameMapping,
  WithMeta,
  ConfigFactory,
} from './api-types';
import {Messenger} from './messenger';

const defaultConfigFactory: ConfigFactory = () =>
  Promise.resolve({components: {}, componentTypes: {}, labels: {}});
/**
 * Factory function to create a HostApi instance.
 *
 * @public
 * @param {HostConfiguration} config - Configuration object for the host API.
 * @returns {HostApi} An instance of the HostApi interface.
 */
export function createHostApi({
  emitter,
  id,
  logger,
}: HostConfiguration): HostApi {
  const messenger = new Messenger<HostEventNameMapping, ClientEventNameMapping>(
    {
      source: 'host',
      id,
      emitter,
      logger,
    }
  );
  const subscriptions: (() => void)[] = [];
  let isConnected = false;

  return {
    addComponentToRegion: messenger.toEmitter('ComponentAddedToRegion'),
    moveComponentToRegion: messenger.toEmitter('ComponentMovedToRegion'),
    startComponentDrag: messenger.toEmitter('ComponentDragStarted'),
    hoverInToComponent: messenger.toEmitter('ComponentHoveredIn'),
    hoverOutOfComponent: messenger.toEmitter('ComponentHoveredOut'),
    selectComponent: messenger.toEmitter('ComponentSelected'),
    deselectComponent: messenger.toEmitter('ComponentDeselected'),
    deleteComponent: messenger.toEmitter('ComponentDeleted'),
    forwardKeyPress: messenger.toEmitter('HostKeyPressed'),
    notifyClientWindowDragDropped: messenger.toEmitter(
      'ClientWindowDragDropped'
    ),
    notifyClientWindowDragEntered: messenger.toEmitter(
      'ClientWindowDragEntered'
    ),
    notifyClientWindowDragMoved: messenger.toEmitter('ClientWindowDragMoved'),
    notifyClientWindowDragExited: messenger.toEmitter('ClientWindowDragExited'),
    setComponentProperties: messenger.toEmitter('ComponentPropertiesChanged'),
    notifyWindowScrollChanged: messenger.toEmitter('WindowScrollChanged'),
    notifyPageSettingsChanged: messenger.toEmitter('PageSettingsChanged'),
    notifyMediaChanged: () => messenger.emit('MediaChangedEvent', {}),
    notifyClientWindowBoundsHoverOver: messenger.toEmitter(
      'ClientWindowBoundsHoverOver'
    ),
    notifyClientWindowBoundsHoverOut: messenger.toEmitter(
      'ClientWindowBoundsHoverOut'
    ),
    notifyError: messenger.toEmitter('Error'),
    focusComponent: messenger.toEmitter('ComponentFocused'),
    connect: ({
      configFactory = defaultConfigFactory,
      onClientConnected,
      onClientDisconnected,
      onError,
    }: {
      configFactory: ConfigFactory;
      onClientConnected?: (clientId: string) => void;
      onClientDisconnected?: (clientId: string) => void;
      onError?: (error: Error) => void;
    }) => {
      if (isConnected) {
        onClientConnected?.(messenger.getRemoteId() as string);

        return;
      }

      messenger.connect();

      subscriptions.push(
        messenger.on('ClientDisconnected', event => {
          if (event.meta.clientId === messenger.getRemoteId()) {
            messenger.setRemoteId(undefined);
          }

          onClientDisconnected?.(event.meta.clientId as string);
        })
      );

      subscriptions.push(
        messenger.on('ClientInitialized', event => {
          const remoteId = messenger.getRemoteId();

          // If the same client tries reconnecting, we should allow it.
          // If there is no remote id, we should allow any client to connect.
          if ((remoteId && event.meta.clientId === remoteId) || !remoteId) {
            messenger.setRemoteId(event.meta.clientId as string);

            configFactory()
              .then(config => {
                messenger.emit('ClientAcknowledged', config);

                return messenger.toPromise('ClientReady');
              })
              .then(({clientId}) => {
                if (clientId !== messenger.getRemoteId()) {
                  throw new Error('Client id mismatch');
                }

                return clientId;
              })
              .then(clientId => onClientConnected?.(clientId))
              .catch(error => onError?.(error));
          }
        })
      );

      isConnected = true;
    },
    on: <TEvent extends keyof HostEventNameMapping>(
      event: TEvent,
      handler: (
        handlerEvent: Readonly<WithMeta & HostEventNameMapping[TEvent]>
      ) => void
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => messenger.on(event as any, handler as any),
    disconnect: () => {
      isConnected = false;
      messenger.disconnect();
      subscriptions.forEach(unsubscribe => unsubscribe());
    },
    getRemoteId: () => messenger.getRemoteId(),
  };
}
