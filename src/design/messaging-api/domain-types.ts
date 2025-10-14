/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
interface WithBaseEvent {
  eventType: string;
  // Add any properties that apply to all events
}
/**
 * @inline
 * @hidden
 */
interface WithComponentId {
  /**
   * The id of the component that the event is related to.
   */
  componentId: string;
}

/**
 * @inline
 * @hidden
 */
interface WithClientVector {
  /**
   * The x position of the event.
   * The position is relative to the client window and does not take any scrolling into account.
   */
  x: number;
  /**
   * The y position of the event.
   * The position is relative to the client window and does not take any scrolling into account.
   */
  y: number;
}

/**
 * The default keys that are forwarded from the host to the client.
 * @hidden
 */
export type DefaultForwardedKeys =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Delete';

/**
 * Information about a component on the page.
 */
export interface ComponentInfo {
  /**
   *  The unique id of the component.
   */
  id: string;
  /**
   * The component type.
   */
  type: string;
}

/**
 * Information about a component type.
 */
export interface ComponentType {
  /**
   * The unique id of the component type.
   */
  id: string;
  /**
   * The name of the component type.
   */
  name: string;
  /**
   * The image of the component type.
   */
  image: string;
}

/// ////////////////////////////////////////////////////////////////
/// Host Events - Events that are subscribed to on the host side. //
/// ////////////////////////////////////////////////////////////////

/**
 * Emitted by the client to establish a connection with the host.
 * This event should be emitted by the client on an interval until a ClientAcknowledgedEvent is received from the host.
 *
 * - If there is already a registered client with the host with the same client name,
 *   the old client will be replaced with the new one.
 * - If there is already a registered client with the host with a different client id,
 *   an error will be thrown.
 *
 * A client is a 1 to 1 with a host.
 *
 * ```mermaid
 * sequenceDiagram
 *     Client->>Host: ClientInitializedEvent
 *     Host->>Client: ClientAcknowledgedEvent
 *     Client->>Host: ClientReadyEvent
 *     activate Client
 *     Client->>Host: ComponentSelectedEvent
 *     Host->>Client: ComponentPropertiesChangedEvent
 * ```
 *
 * If the host is not ready to register the client, the client should retry at an interval until the host is ready.
 *
 * ```mermaid
 * sequenceDiagram
 *     Client-->>Host: ClientInitializedEvent
 *     Client-->>Host: ClientInitializedEvent
 *     Client->>Host: ClientInitializedEvent
 *     Host->>Client: ClientAcknowledgedEvent
 *     Client->>Host: ClientReadyEvent
 *     activate Client
 *     Client->>Host: ComponentSelectedEvent
 *     Host->>Client: ComponentPropertiesChangedEvent
 * ```
 *
 * @see {ClientAcknowledgedEvent}
 * @target host
 * @group Events
 */
export interface ClientInitializedEvent extends WithBaseEvent {
  eventType: 'ClientInitialized';
  /**
   * The id to use for the client.
   */
  clientId: string;
  /**
   * The keys that are forwarded from the host to the client.
   */
  forwardedKeys?: string[];
  // Put any client-specific config here
}

export interface ClientReady extends WithBaseEvent {
  eventType: 'ClientReady';
  /**
   * The id to use for the client.
   */
  clientId: string;
}

/**
 * Emitted by the client after ClientReady to provide the page type mapping.
 * This event communicates the mapping of route paths to page type names,
 * allowing the host to associate routes with their corresponding page types
 * for design-time functionality.
 *
 * @target host
 * @group Events
 */
export interface PageTypeMapReady extends WithBaseEvent {
  eventType: 'PageTypeMapReady';
  /**
   * The id of the client.
   */
  clientId: string;
  /**
   * A mapping of route paths to page type names (in camelCase).
   * Example: { "/": "homePage", "/product/:productId": "productDetailPage" }
   */
  pageTypeMap: Record<string, string>;
}

/**
 * Emits when a client disconnects from the host.
 * This event may not fire depending on the circumstances of the disconnect.
 * For example, if a crash occurs in the client environment, the event may not fire.
 * @target host
 * @group Events
 */
export interface ClientDisconnectedEvent extends WithBaseEvent {
  eventType: 'ClientDisconnected';
  /**
   * The id of the client that disconnected.
   */
  clientId: string;
}

/// /////////////////////////////////////////////////////////////////
// Client Events - Events that are subscribed on the client side. //
/// /////////////////////////////////////////////////////////////////

/**
 * Emits from the host to the client to acknowledge that the client has been initialized.
 * This event must be received by the client before any other events can be emitted from the client.
 * @target client
 * @group Events
 */
export interface ClientAcknowledgedEvent extends WithBaseEvent {
  eventType: 'ClientAcknowledged';
  // Any specifics we want the client to know upon initialization should live here.
  /**
   * The components by id that are in the component tree.
   */
  components: Record<string, ComponentInfo>;
  /**
   * A map of component types by id.
   */
  componentTypes: Record<string, ComponentType>;
  /**
   * A map of labels by translation key. These labels will be in the locale of the user.
   */
  labels: Record<string, string>;
  /**
   * The locale to use on the client.
   */
  locale?: string;
}

/**
 * Emits when dragging from the host enters the client window.
 * @target client
 * @group Events
 */
export interface ClientWindowDragEnteredEvent
  extends WithBaseEvent,
    WithClientVector,
    WithComponentId {
  eventType: 'ClientWindowDragEntered';
}
/**
 * Emits when dragging from the host moves over the client window.
 * @target client
 * @group Events
 */
export interface ClientWindowDragMovedEvent
  extends WithBaseEvent,
    WithClientVector,
    WithComponentId {
  eventType: 'ClientWindowDragMoved';
}
/**
 * Emits when dragging from the host exits the client window.
 * @target client
 * @group Events
 */
export interface ClientWindowDragExitedEvent
  extends WithBaseEvent,
    WithClientVector,
    WithComponentId {
  eventType: 'ClientWindowDragExited';
}
/**
 * Emits when dragging from the host is released over the client window.
 * @target client
 * @group Events
 */
export interface ClientWindowDragDroppedEvent
  extends WithBaseEvent,
    WithClientVector,
    WithComponentId {
  eventType: 'ClientWindowDragDropped';
}
/**
 * Emits when a component's properties change.
 * @target client
 * @group Events
 */
export interface ComponentPropertiesChangedEvent<
  TProps extends Record<string, unknown> = Record<string, unknown>
> extends WithBaseEvent,
    WithComponentId {
  eventType: 'ComponentPropertiesChanged';
  /**
   * The new properties of the component.
   */
  properties: TProps;
}
/**
 * Emits when a component is focused.
 * @target client
 * @group Events
 */
export interface ComponentFocusedEvent extends WithBaseEvent, WithComponentId {
  eventType: 'ComponentFocused';
}
/**
 * Event emitted from the host to the client when a key is pressed.
 * Used to forward keypress events from the host environment to the client.
 *
 * @template TKey - The type of key being forwarded.
 * @target client
 * @group Events
 */
export interface HostKeyPressedEvent<TKey extends string = DefaultForwardedKeys>
  extends WithBaseEvent {
  eventType: 'HostKeyPressed';
  key: TKey;
}
/**
 * Emits when the page settings are modified within the host.
 * @target client
 * @group Events
 */
export interface PageSettingsChangedEvent<
  TSettings extends Record<string, unknown> = Record<string, unknown>
> extends WithBaseEvent {
  eventType: 'PageSettingsChanged';
  settings: TSettings;
}
/**
 * Emits when the media is changed on the host.
 * Media would include images, videos, style sheets, etc.
 * @target client
 * @group Events
 */
export interface MediaChangedEvent extends WithBaseEvent {
  eventType: 'MediaChanged';
}

/**
 * Emits when the user's cursor hovers over the bounds of the client window.
 * Used to indicate that the pointer has entered a sensitive boundary area.
 * @target client
 */
export interface ClientWindowBoundsHoverOverEvent extends WithBaseEvent {
  eventType: 'ClientWindowBoundsHoverOver';
  /**
   * The distance in pixels from the window edge where the hover occurred.
   */
  delta: number;
}

/**
 * Emits when the user's cursor leaves the bounds of the client window.
 * Used to indicate that the pointer has exited a sensitive boundary area.
 * @target client
 */
export interface ClientWindowBoundsHoverOutEvent extends WithBaseEvent {
  eventType: 'ClientWindowBoundsHoverOut';
}

/// ////////////////////////////////////////////////////////////////////////////
// Isomorphic Events - Events that are subscribed to on both client and host side. //
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Emits when the clients window is scrolled.
 * @target host
 * @group Events
 */
export interface WindowScrollChangedEvent extends WithBaseEvent {
  eventType: 'WindowScrollChanged';
  /**
   * The horizontal scroll position of the window.
   */
  scrollX?: number;
  /**
   * The vertical scroll position of the window.
   */
  scrollY?: number;
}

/**
 * Emits when a component is moved to a different region of a component.
 * @target isomorphic
 * @group Events
 */
export interface ComponentMovedToRegionEvent
  extends WithBaseEvent,
    WithComponentId {
  eventType: 'ComponentMovedToRegion';
  /**
   * The id of the component where this component is being moved to.
   */
  targetComponentId: string;
  /**
   * The id of the region that the component is being moved to.
   */
  targetRegionId: string;
  /**
   * The region that the component is being moved from.
   */
  sourceRegionId: string;
  /**
   * The id of the component that the component was moved from.
   */
  sourceComponentId: string;
}
/**
 * Emits when a component is hovered over.
 * @target isomorphic
 * @group Events
 */
export interface ComponentHoveredInEvent
  extends WithBaseEvent,
    WithComponentId {
  eventType: 'ComponentHoveredIn';
}
/**
 * Emits when a component is hovered out of.
 * @target isomorphic
 * @group Events
 */
export interface ComponentHoveredOutEvent
  extends WithBaseEvent,
    WithComponentId {
  eventType: 'ComponentHoveredOut';
}
/**
 * Emits when a component is selected.
 * @target isomorphic
 * @group Events
 */
export interface ComponentSelectedEvent extends WithBaseEvent, WithComponentId {
  eventType: 'ComponentSelected';
}
/**
 * Emits when a component is deselected.
 * @target isomorphic
 * @group Events
 */
export interface ComponentDeselectedEvent
  extends WithBaseEvent,
    WithComponentId {
  eventType: 'ComponentDeselected';
}
/**
 * Emits when a component is deleted.
 * @target isomorphic
 * @group Events
 */
export interface ComponentDeletedEvent extends WithBaseEvent, WithComponentId {
  eventType: 'ComponentDeleted';
  /**
   * The id of the component that the component was deleted from.
   */
  sourceComponentId: string;
  /**
   * The region that the component was deleted from.
   */
  sourceRegionId: string;
}
/**
 * Emits when a component is added to a region of a component.
 * @template TProps - The type of the component properties.
 * @target isomorphic
 * @group Events
 */
export interface ComponentAddedToRegionEvent<
  TProps extends Record<string, unknown> = Record<string, unknown>
> extends WithBaseEvent,
    WithComponentId {
  eventType: 'ComponentAddedToRegion';
  /**
   * The specifier of the component to add.
   * This will be used to lookup the component in the registry.
   */
  componentSpecifier: string;
  /**
   * The properties of the component to add.
   * These will be used to initialize the component.
   */
  componentProperties: TProps;
  /**
   * The id of the component that owns the region this component is being added to.
   */
  targetComponentId: string;
  /**
   * The id of the region that the component is being added to.
   */
  targetRegionId: string;
}
/**
 * Emits when a component drag starts from the host or client.
 * @target isomorphic
 * @group Events
 */
export interface ComponentDragStartedEvent
  extends WithBaseEvent,
    WithComponentId,
    Partial<WithClientVector> {
  eventType: 'ComponentDragStarted';
}
/**
 * Emits when an error occurs.
 * @target isomorphic
 * @group Events
 */
export interface ErrorEvent extends WithBaseEvent {
  eventType: 'Error';
  /**
   * The error message.
   */
  message: string;
  /**
   * TODO: Add error codes if we need the app to recover from the error.
   * Add once scenarios are defined.
   */
  code?: unknown;
}
