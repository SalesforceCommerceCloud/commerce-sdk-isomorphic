# Page Designer Messaging API

A TypeScript-based messaging system for real-time communication between client (PWA, SFRA, etc...) and host applications (Page Designer), designed for component management, drag-and-drop operations, and synchronized state updates.

## Quick Start

### Client Setup

```typescript
import { createClientApi, ClientApi } from '@commerce-sdk-isomorphic/design';

// Create client API instance
const clientApi: ClientApi = createClientApi({
  emitter: {
    postMessage: event => window.parent.postMessage(event),
    addEventListener: handler => {
      window.addEventListener('message', handler);

      return () => window.removeEventListener('message', handler);
    }
  }
});

// Initialize connection with host
await clientApi.connect();

// Listen for component selection events
clientApi.on('ComponentSelected', event => {
  console.log('Event type:', event.eventType); // ComponentSelected
  console.log('Component selected:', event.componentId);
});

// Listen for property changes
clientApi.on('ComponentPropertiesChanged', event => {
  console.log('Properties updated for component:', event.componentId, event.properties);
});
```

### Host Setup

```typescript
import { createHostApi, HostApi } from '@commerce-sdk-isomorphic/design';

// Create host API instance
const iframe = document.querySelector('iframe');
const hostApi: HostApi = createHostApi({
  emitter: {
    postMessage: (event) => iframe.contentWindow.postMessage(event),
    addEventListener: (handler) => window.addEventListener('message', handler);
  }
});

// Listen for client initialization
await hostApi.connect();

// Listen for component events
hostApi.on('ComponentSelected', (event) => {
  console.log('Component selected by client:', event.componentId);
});

// Update component properties
hostApi.setComponentProperties({
  componentId: 'component-123',
  properties: {
    backgroundColor: 'blue',
    text: 'Updated content'
  }
});
```

## Configuration

### Forwarded Keys

By default, the following keys are forwarded from host to client:

- `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` - Navigation
- `Delete` - Deletion

You can customize this list during client construction:

```typescript
const clientApi = createClientApi({
  clientId: 'custom-editor',
  forwardedKeys: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab']
});
await clientApi.connect();
```

### Connection Retry

The client automatically retries connection until acknowledged:

```typescript
await clientApi.connect({
  interval: 2_000, // Retry every 2 seconds
  timeout: 60_000 // Throw an error after a minute
});
```

### Events

Events are messages sent between the host (Page Designer) and client (your application) to keep them in sync.

#### What Are Events?

Events notify you about things that have already happened. They're like news broadcasts - they tell you what occurred, but don't tell you what to do about it:

- **Events describe what happened**: Actions that have already occurred (e.g., "a component was selected")
- **Events are not commands**: They don't tell you what to do next - your code decides
- **Events use past tense names**: "ComponentSelected" not "SelectComponent"

#### Event Classification

**Where They're Used (Targets):**

- **client** - Events your client listens for (sent from host)
- **host** - Events the Page Designer listens for (sent from your client)
- **isomorphic** - Events both sides can send and receive

**How Stable They Are (Stability Levels):**

- **development** - Still being built, might change - use with caution
- **preview** - Ready for testing but could have breaking changes
- **stable** - Production-ready, won't break your code
- **deprecated** - Will be removed - time to update

#### Example

```typescript
// Listen for when a component gets selected
clientApi.on('ComponentSelected', event => {
  // Event tells you: "Component ABC123 was selected"
  console.log('User selected component:', event.componentId);

  // You decide what to do with that information
  highlightComponent(event.componentId);
});
```

The event system delivers messages reliably between your app and Page Designer - what you do with those messages is up to you.
