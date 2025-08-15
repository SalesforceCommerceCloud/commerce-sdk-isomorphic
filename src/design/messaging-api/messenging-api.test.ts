/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/unbound-method */
import {
  ClientApi,
  ClientEventNameMapping,
  HostApi,
  HostEventNameMapping,
  MessageEmitter,
} from './api-types';
import {createClientApi} from './client';
import {createHostApi} from './host';

type AnyFunction = (...args: unknown[]) => unknown;
describe('Messaging API', () => {
  let hostWindow: Element;
  let clientWindow: Element;
  let clientEmitter: MessageEmitter<
    ClientEventNameMapping,
    HostEventNameMapping
  >;
  let hostEmitter: MessageEmitter<HostEventNameMapping, ClientEventNameMapping>;
  let host: HostApi;
  let client: ClientApi;

  beforeEach(() => {
    hostWindow = document.createElement('div');
    clientWindow = document.createElement('div');
    clientEmitter = {
      postMessage: event =>
        clientWindow.dispatchEvent(new CustomEvent('message', {detail: event})),
      addEventListener: handler => {
        const boundHandler = (event: CustomEvent) => handler(event.detail);
        clientWindow.addEventListener(
          'message',
          boundHandler as unknown as EventListener
        );

        return () =>
          clientWindow.removeEventListener(
            'message',
            boundHandler as unknown as EventListener
          );
      },
    };
    hostEmitter = {
      postMessage: event =>
        clientWindow.dispatchEvent(new CustomEvent('message', {detail: event})),
      addEventListener: handler => {
        const boundHandler = (event: CustomEvent) => handler(event.detail);
        hostWindow.addEventListener(
          'message',
          boundHandler as unknown as EventListener
        );
        return () =>
          hostWindow.removeEventListener(
            'message',
            boundHandler as unknown as EventListener
          );
      },
    };

    // Simulate a browser window receiving messages from the client
    clientWindow.addEventListener('message', ((
      event: CustomEvent<{meta: {source: string}}>
    ) => {
      if (event.detail.meta.source === 'client') {
        hostWindow.dispatchEvent(
          new CustomEvent('message', {detail: event.detail})
        );
      }
    }) as unknown as EventListener);

    host = createHostApi({emitter: hostEmitter, id: 'test-host'});
    client = createClientApi({emitter: clientEmitter, id: 'test-client'});

    jest.useFakeTimers();
  });

  afterEach(() => {
    host.destroy();
    client.destroy();
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    describe('when the client is initialized before the host', () => {
      it('should create a connection between the host and the client', async () => {
        const clientConnectionPromise = client.connect();

        jest.advanceTimersByTime(1500);

        const hostConnectionPromise = host.connect();

        jest.advanceTimersByTime(1500);

        await expect(
          Promise.all([clientConnectionPromise, hostConnectionPromise])
        ).resolves;
        expect(client.getRemoteId()).toBe('test-host');
        expect(host.getRemoteId()).toBe('test-client');
      });
    });

    describe('when an event is emitted on the client before the host', () => {
      it('should not emit the event', () => {
        jest.spyOn(clientWindow, 'dispatchEvent');
        client.connect();
        client.selectComponent({componentId: 'test-component' as string});
        expect(clientWindow.dispatchEvent).not.toHaveBeenCalledWith(
          'message',
          expect.objectContaining({
            detail: expect.objectContaining({
              eventType: 'ComponentSelected',
            }) as unknown,
          })
        );
      });
    });

    describe('when the host is initialized before the client', () => {
      it('should create a connection between the host and the client', async () => {
        const hostConnectionPromise = host.connect();
        const clientConnectionPromise = client.connect();

        await expect(
          Promise.all([clientConnectionPromise, hostConnectionPromise])
        ).resolves;
        expect(client.getRemoteId()).toBe('test-host');
        expect(host.getRemoteId()).toBe('test-client');
      });
    });

    describe('when the client times out waiting for the host to connect', () => {
      let now: number;

      beforeEach(() => {
        now = 1000;
        jest.spyOn(Date, 'now').mockImplementation(() => now);
      });

      it('should throw an error', () => {
        expect(() => {
          client.connect({timeout: 5_000});
          now = 10_000;
          jest.advanceTimersByTime(10_000);
        }).toThrow(/Timed out/g);
      });
    });

    describe('when connecting multiple times', () => {
      it('should only maintain a single connection', async () => {
        await expect(Promise.all([client.connect(), host.connect()])).resolves;
        await expect(Promise.all([client.connect(), host.connect()])).resolves;
        await expect(Promise.all([client.connect(), host.connect()])).resolves;

        const spy = jest.fn();

        host.on('ComponentSelected', spy);
        client.selectComponent({componentId: 'test-component'});
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when connected', () => {
    beforeEach(async () => {
      await Promise.all([host.connect(), client.connect()]);
    });

    describe('when events are received from a different source', () => {
      it('should not call the handler', () => {
        const spy = jest.fn();

        host.on('ComponentSelected', spy);
        hostWindow.dispatchEvent(
          new CustomEvent('message', {
            detail: {eventType: 'ComponentSelected'},
          })
        );

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when an event is emitted on the client', () => {
      it('should emit the event on the host', done => {
        host.on('ComponentSelected', event => {
          expect(event).toEqual({
            eventType: 'ComponentSelected',
            componentId: 'test-component',
            meta: {
              source: 'client',
              clientId: 'test-client',
              hostId: 'test-host',
              pdMessagingApi: true,
            },
          });
          done();
        });
        client.selectComponent({componentId: 'test-component'});
      });
    });

    describe('when an event is emitted on the host', () => {
      it('should emit the event on the client', done => {
        client.on('ComponentSelected', event => {
          expect(event).toEqual({
            eventType: 'ComponentSelected',
            componentId: 'test-component',
            meta: {
              source: 'host',
              clientId: 'test-client',
              hostId: 'test-host',
              pdMessagingApi: true,
            },
          });
          done();
        });
        host.selectComponent({componentId: 'test-component'});
      });
    });
    describe('when unsubscribing from an event', () => {
      it('should not emit the event', () => {
        let callCount = 0;

        const unsubscribe = client.on('ComponentSelected', () => {
          callCount += 1;
        });

        host.selectComponent({componentId: 'test-component'});
        expect(callCount).toBe(1);
        host.selectComponent({componentId: 'test-component'});
        expect(callCount).toBe(2);
        unsubscribe();
        host.selectComponent({componentId: 'test-component'});
        expect(callCount).toBe(2);
      });
    });

    describe('when emitting an event that is handled by both the client and the host', () => {
      it('should not emit the event on the same source', () => {
        const spy = jest.fn();
        const clientSpy = jest.fn();

        host.on('ComponentSelected', spy);
        client.on('ComponentSelected', clientSpy);
        host.selectComponent({componentId: 'test-component'});
        expect(clientSpy).toHaveBeenCalledTimes(1);
        expect(spy).not.toHaveBeenCalled();

        client.selectComponent({componentId: 'test-component'});
        expect(clientSpy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('when there are no event listeners for an event', () => {
      it('should not error on the remote connection', () => {
        expect(() =>
          client.selectComponent({componentId: 'test-component'})
        ).not.toThrow();
      });
    });

    describe('when there are multiple subscriptions to the same event', () => {
      it('should invoke all handlers', () => {
        const spy1 = jest.fn();
        const spy2 = jest.fn();

        host.on('ComponentSelected', spy1);
        host.on('ComponentSelected', spy2);
        client.selectComponent({componentId: 'test-component'});
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
      });

      describe('when unsubscribing from an event', () => {
        it('should only unsubscribe for that subscription', () => {
          const spy1 = jest.fn();
          const spy2 = jest.fn();

          const unsub1 = host.on('ComponentSelected', spy1);
          const unsub2 = host.on('ComponentSelected', spy2);
          client.selectComponent({componentId: 'test-component'});
          expect(spy1).toHaveBeenCalledTimes(1);
          expect(spy2).toHaveBeenCalledTimes(1);

          unsub1();
          client.selectComponent({componentId: 'test-component'});
          expect(spy1).toHaveBeenCalledTimes(1);
          expect(spy2).toHaveBeenCalledTimes(2);

          unsub2();
          client.selectComponent({componentId: 'test-component'});
          expect(spy1).toHaveBeenCalledTimes(1);
          expect(spy2).toHaveBeenCalledTimes(2);
        });
      });

      describe('when unsubscribing from an event multiple times', () => {
        it('should not throw an error', () => {
          const spy1 = jest.fn();
          const unsub1 = host.on('ComponentSelected', spy1);

          client.selectComponent({componentId: 'test-component'});
          expect(spy1).toHaveBeenCalledTimes(1);

          unsub1();
          client.selectComponent({componentId: 'test-component'});
          expect(spy1).toHaveBeenCalledTimes(1);

          expect(() => unsub1()).not.toThrow();
        });
      });
    });

    describe.each`
      method                         | eventName                   | payload
      ${'addComponentToRegion'}      | ${'ComponentAddedToRegion'} | ${{componentId: 'test-component', componentSpecifier: 'test-specifier', componentProperties: {test: 'value'}, targetComponentId: 'target-component', targetRegionId: 'test-region'}}
      ${'moveComponentToRegion'}     | ${'ComponentMovedToRegion'} | ${{componentId: 'test-component', targetComponentId: 'target-component', targetRegionId: 'target-region', sourceRegionId: 'source-region', sourceComponentId: 'source-component'}}
      ${'startComponentDrag'}        | ${'ComponentDragStarted'}   | ${{componentId: 'test-component', x: 100, y: 200}}
      ${'hoverInToComponent'}        | ${'ComponentHoveredIn'}     | ${{componentId: 'test-component'}}
      ${'hoverOutOfComponent'}       | ${'ComponentHoveredOut'}    | ${{componentId: 'test-component'}}
      ${'selectComponent'}           | ${'ComponentSelected'}      | ${{componentId: 'test-component'}}
      ${'deselectComponent'}         | ${'ComponentDeselected'}    | ${{componentId: 'test-component'}}
      ${'deleteComponent'}           | ${'ComponentDeleted'}       | ${{componentId: 'test-component', sourceComponentId: 'source-component', sourceRegionId: 'source-region'}}
      ${'notifyWindowScrollChanged'} | ${'WindowScrollChanged'}    | ${{scrollX: 100, scrollY: 200}}
      ${'notifyError'}               | ${'Error'}                  | ${{message: 'Test error message', code: 'TEST_ERROR'}}
    `(
      'when $method is called on the client',
      ({
        method,
        eventName,
        payload,
      }: {
        method: keyof ClientApi & keyof HostApi;
        eventName: keyof ClientEventNameMapping & keyof HostEventNameMapping;
        payload: Record<string, unknown>;
      }) => {
        it('should emit the event on the host', done => {
          host.on(eventName, event => {
            expect(event).toEqual({
              ...payload,
              eventType: eventName,
              meta: {
                source: 'client',
                clientId: 'test-client',
                hostId: 'test-host',
                pdMessagingApi: true,
              },
            });
            done();
          });

          (client[method] as AnyFunction)(payload);
        });
      }
    );

    describe.each`
      method                             | eventName                       | payload
      ${'addComponentToRegion'}          | ${'ComponentAddedToRegion'}     | ${{componentId: 'test-component', componentSpecifier: 'test-specifier', componentProperties: {test: 'value'}, targetComponentId: 'target-component', targetRegionId: 'test-region'}}
      ${'moveComponentToRegion'}         | ${'ComponentMovedToRegion'}     | ${{componentId: 'test-component', targetComponentId: 'target-component', targetRegionId: 'target-region', sourceRegionId: 'source-region', sourceComponentId: 'source-component'}}
      ${'startComponentDrag'}            | ${'ComponentDragStarted'}       | ${{componentId: 'test-component', x: 100, y: 200}}
      ${'hoverInToComponent'}            | ${'ComponentHoveredIn'}         | ${{componentId: 'test-component'}}
      ${'hoverOutOfComponent'}           | ${'ComponentHoveredOut'}        | ${{componentId: 'test-component'}}
      ${'selectComponent'}               | ${'ComponentSelected'}          | ${{componentId: 'test-component'}}
      ${'deselectComponent'}             | ${'ComponentDeselected'}        | ${{componentId: 'test-component'}}
      ${'deleteComponent'}               | ${'ComponentDeleted'}           | ${{componentId: 'test-component', sourceComponentId: 'source-component', sourceRegionId: 'source-region'}}
      ${'forwardKeyPress'}               | ${'HostKeyPressed'}             | ${{key: 'ArrowUp'}}
      ${'notifyClientWindowDragDropped'} | ${'ClientWindowDragDropped'}    | ${{componentId: 'test-component', x: 100, y: 200}}
      ${'notifyClientWindowDragEntered'} | ${'ClientWindowDragEntered'}    | ${{componentId: 'test-component', x: 100, y: 200}}
      ${'notifyClientWindowDragMoved'}   | ${'ClientWindowDragMoved'}      | ${{componentId: 'test-component', x: 100, y: 200}}
      ${'notifyClientWindowDragExited'}  | ${'ClientWindowDragExited'}     | ${{componentId: 'test-component', x: 100, y: 200}}
      ${'setComponentProperties'}        | ${'ComponentPropertiesChanged'} | ${{componentId: 'test-component', properties: {test: 'value'}}}
      ${'notifyPageSettingsChanged'}     | ${'PageSettingsChanged'}        | ${{settings: {theme: 'dark'}}}
      ${'notifyMediaChanged'}            | ${'MediaChangedEvent'}          | ${{}}
      ${'notifyError'}                   | ${'Error'}                      | ${{message: 'Test error message', code: 'TEST_ERROR'}}
    `(
      'when $method is called on the host',
      ({
        method,
        eventName,
        payload,
      }: {
        method: keyof HostApi & keyof ClientApi;
        eventName: keyof HostEventNameMapping & keyof ClientEventNameMapping;
        payload: Record<string, unknown>;
      }) => {
        it('should emit the event on the client', done => {
          client.on(eventName, event => {
            expect(event).toEqual({
              ...payload,
              eventType: eventName,
              meta: {
                source: 'host',
                clientId: 'test-client',
                hostId: 'test-host',
                pdMessagingApi: true,
              },
            });
            done();
          });

          (host[method] as AnyFunction)(payload);
        });
      }
    );
  });
});
