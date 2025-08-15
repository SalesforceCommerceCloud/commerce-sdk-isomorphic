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
} from './api-types.js';
import {Messenger} from './messenger.js';
/**
 * Factory function to create a HostApi instance.
 *
 * @public
 * @param {HostConfiguration} config - Configuration object for the host API.
 * @returns {HostApi} An instance of the HostApi interface.
 */
export function createHostApi({emitter, id}: HostConfiguration): HostApi {
  const messenger = new Messenger<HostEventNameMapping, ClientEventNameMapping>(
    {
      source: 'host',
      id,
      emitter,
    }
  );

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
    notifyPageSettingsChanged: messenger.toEmitter('PageSettingsChanged'),
    notifyMediaChanged: () => messenger.emit('MediaChangedEvent', {}),
    notifyError: messenger.toEmitter('Error'),
    connect: () =>
      new Promise<void>(resolve => {
        messenger.connect();
        messenger.on('ClientInitialized', event => {
          if (event.meta.clientId !== messenger.getRemoteId()) {
            messenger.setRemoteId(event.meta.clientId as string);
            messenger.emit('ClientAcknowledged', {});
          }

          resolve();
        });
      }),
    on: <TEvent extends keyof HostEventNameMapping>(
      event: TEvent,
      handler: (
        handlerEvent: Readonly<WithMeta & HostEventNameMapping[TEvent]>
      ) => void
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => messenger.on(event as any, handler as any),
    disconnect: () => messenger.disconnect(),
    getRemoteId: () => messenger.getRemoteId(),
  };
}
