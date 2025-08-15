/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  HostApi,
  HostConfiguration,
  ClientEventNameMapping,
  HostEventNameMapping,
} from './api-types';
import {Messenger} from './messenger';
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
    on: (event, handler) => messenger.on(event, handler),
    destroy: () => messenger.destroy(),
    getRemoteId: () => messenger.getRemoteId(),
  };
}
