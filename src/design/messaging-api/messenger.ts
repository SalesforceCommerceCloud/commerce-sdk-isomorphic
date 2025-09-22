/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {EventHandler, MessageEmitter, Source} from './api-types.js';

export type Logger = (message: unknown, source: 'host' | 'client') => void;

/**
 * Handles the basic logic for event emitting and receiving between a client and a host.
 *
 * The `Messenger` class manages a single connection to a source event emitter,
 * allowing for the sending and receiving of typed events between two parties (e.g., client and host).
 * It distinguishes events based on their source, ensuring that only events from the opposite source are processed.
 *
 * @template TInMapping - The mapping of incoming event names to their payload types.
 * @template TOutMapping - The mapping of outgoing event names to their payload types.
 */
export class Messenger<TInMapping, TOutMapping> {
  private readonly source: Source;

  private readonly id: string;

  private readonly emitter: MessageEmitter<TInMapping, TOutMapping>;

  private readonly handlers = new Map<
    keyof TInMapping,
    EventHandler<TInMapping>[]
  >();

  private remoteId?: string;

  private readonly logger: Logger;

  private unsubscribe?: () => void;

  constructor({
    source,
    id,
    emitter,
    logger = () => {
      // Noop
    },
  }: {
    source: Source;
    id: string;
    emitter: MessageEmitter<TInMapping, TOutMapping>;
    logger?: Logger;
  }) {
    this.source = source;
    this.id = id;
    this.emitter = emitter;
    this.logger = logger;
  }

  /**
   * Connects the given emitter. This ensures only a single connection to the provided emitter.
   *
   * This method registers a listener for events from the opposite source.
   * It ensures that only events from the opposite source are processed.
   */
  connect(): void {
    // Unsubscribe if this is called again.
    this.unsubscribe?.();

    this.unsubscribe = this.emitter.addEventListener(event => {
      if (event.meta?.pdMessagingApi && event.meta.source !== this.source) {
        this.logger(event, this.source === 'host' ? 'client' : 'host');

        [event.eventType, 'Event'].forEach(eventType => {
          this.handlers
            .get(eventType as keyof TInMapping)
            ?.forEach(handler =>
              handler(event as Parameters<EventHandler<TInMapping>>[0])
            );
        });
      }
    });
  }

  /**
   * Returns the id of the connected remote.
   */
  getRemoteId(): string | undefined {
    return this.remoteId;
  }

  /**
   * Sets the id of the connected remote.
   */
  setRemoteId(remoteId: string): void {
    this.remoteId = remoteId;
  }

  /**
   * Emits an event to the connected remote.
   * This attaches metadata to each event that is emitted.
   *
   * @param eventName - The event to emit.
   * @param data - The data to emit.
   * @param options - The options for the event.
   * @param options.requireRemoteId - Whether to require a remote id to be set before emitting the event.
   */
  emit<TEvent extends keyof TOutMapping>(
    eventType: TEvent,
    data: Omit<TOutMapping[TEvent], 'eventType'>,
    {requireRemoteId = true}: {requireRemoteId?: boolean} = {}
  ): void {
    if (requireRemoteId && !this.remoteId) {
      return;
    }

    const event = {
      ...data,
      eventType,
      meta: {
        hostId: this.source === 'host' ? this.id : this.remoteId,
        clientId: this.source === 'client' ? this.id : this.remoteId,
        source: this.source,
        pdMessagingApi: true as const,
      },
    };

    this.logger(event, this.source);

    this.emitter.postMessage(event);
  }

  /**
   * Subscribes to an event from the connected remote.
   *
   * @param event - The event to subscribe to.
   * @param handler - The handler to call when the event is emitted.
   * @returns A function to unsubscribe from the event.
   */
  on<TEvent extends keyof TInMapping>(
    event: TEvent,
    handler: EventHandler<TInMapping, TEvent>
  ): () => void {
    const handlers = this.handlers.get(event) ?? [];

    handlers.push(handler as EventHandler<TInMapping>);
    this.handlers.set(event, handlers);

    return () => {
      const eventHandlers = this.handlers.get(event) ?? [];
      const index = eventHandlers.indexOf(handler as EventHandler<TInMapping>);

      if (index > -1) {
        eventHandlers.splice(index, 1);
      }

      if (eventHandlers.length === 0) {
        this.handlers.delete(event);
      }
    };
  }

  /**
   * Returns a function that emits an event to the connected remote.
   *
   * @param eventName - The event to emit.
   * @returns A function that emits an event to the connected remote.
   */
  toEmitter<TEvent extends keyof TOutMapping>(
    eventName: TEvent
  ): (event: Omit<TOutMapping[TEvent], 'eventType'>) => void {
    return (event: Omit<TOutMapping[TEvent], 'eventType'>) => {
      this.emit(eventName, event);
    };
  }

  toPromise<TEvent extends keyof TInMapping>(
    eventName: TEvent
  ): Promise<TInMapping[TEvent]> {
    return new Promise<TInMapping[TEvent]>(resolve => {
      const unsub = this.on(eventName, event => {
        unsub();
        resolve(event as TInMapping[TEvent]);
      });
    });
  }

  /**
   * Disconnects the messenger.
   */
  disconnect(): void {
    this.unsubscribe?.();
    this.handlers.clear();
    this.remoteId = undefined;
    this.unsubscribe = undefined;
  }
}
