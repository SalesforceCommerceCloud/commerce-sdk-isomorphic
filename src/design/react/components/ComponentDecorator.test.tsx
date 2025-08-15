/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  render as tlRender,
  RenderResult,
  cleanup as tlCleanup,
} from '@testing-library/react';
import {HostApi} from '../../messaging-api/api-types';
import {createHostApi} from '../../messaging-api/host';
import {createReactComponentDesignDecorator} from './ComponentDecorator';
import {ComponentDecoratorProps} from './component.types';
import {PageDesignerProvider} from '../context/PageDesignerProvider';

// Test component to decorate
const TestComponent: React.FC = ({children}) => (
  <div data-testid="test-component">{children}</div>
);

describe('design/react/ComponentDecorator', () => {
  let cleanup: (() => void)[];

  function setupHost(): HostApi {
    const emitter: Parameters<typeof createHostApi>[0]['emitter'] = {
      postMessage: (message: any) => window.postMessage(message, '*'),
      addEventListener: handler => {
        const listener = (event: MessageEvent) => handler(event.data);

        window.parent.addEventListener('message', listener);

        return () => window.parent.removeEventListener('message', listener);
      },
    };

    const host = createHostApi({emitter, id: 'test-host'});

    cleanup.push(() => host.disconnect());

    return host;
  }

  async function render<TProps>(
    Component: React.FC<TProps>,
    props: Partial<ComponentDecoratorProps<TProps>> = {},
    {
      mode = 'EDIT',
      waitForHost = true,
    }: {
      mode?: 'EDIT' | 'PREVIEW' | null;
      waitForHost?: boolean;
    } = {}
  ): Promise<RenderResult & {element: HTMLElement | null; host: HostApi}> {
    const DecoratedComponent = createReactComponentDesignDecorator(Component);
    const host = setupHost();

    if (mode) {
      const originalLocation = window.location;

      Reflect.deleteProperty(window, 'location');
      window.location = {
        ...originalLocation,
        search: `?mode=${mode}`,
      } as string & Location;

      cleanup.push(() => {
        window.location = originalLocation as string & Location;
      });
    }

    const designMetadata =
      props.designMetadata ??
      ({
        id: 'test-1',
      } as unknown as ComponentDecoratorProps<TProps>['designMetadata']);

    Object.assign(props, {designMetadata});

    const connectionPromise = new Promise<void>((resolve, reject) => {
      host.connect({
        configFactory: () =>
          Promise.resolve({components: {}, componentTypes: {}}),
        onClientConnected: () => resolve(),
        onError: () => reject(),
      });
    });

    const result = tlRender(
      <PageDesignerProvider clientId="test1" targetOrigin="*">
        <DecoratedComponent {...(props as ComponentDecoratorProps<TProps>)}>
          Test Content
        </DecoratedComponent>
      </PageDesignerProvider>
    );

    if (mode !== null && waitForHost) {
      await connectionPromise;
    }

    return Object.assign(result, {
      host,
      element: result.container.querySelector('.pd-design--decorator'),
    }) as RenderResult & {element: HTMLElement | null; host: HostApi};
  }

  beforeEach(() => {
    cleanup = [];
  });

  afterEach(async () => {
    cleanup.forEach(fn => fn());
    await tlCleanup();
  });

  describe('when decorating a component', () => {
    it('should render the original component when not in design mode', async () => {
      const {element, getByTestId} = await render(
        TestComponent,
        {},
        {mode: null}
      );

      expect(getByTestId('test-component')).toBeDefined();
      expect(element).toBeNull();
    });

    it('should render with design wrapper when in design mode', async () => {
      const {element} = await render(TestComponent);

      expect(element).toBeDefined();
    });

    describe('when the component is a fragment', () => {
      it('should include the corresponding fragment class', async () => {
        const {element} = await render(TestComponent, {
          designMetadata: {id: 'test-1', isFragment: true},
        });

        expect(element?.classList.contains('pd-design--fragment')).toBe(true);
        expect(element?.classList.contains('pd-design--component')).toBe(false);
      });
    });

    describe('when the component is a component', () => {
      it('should include the corresponding fragment class', async () => {
        const {element} = await render(TestComponent, {
          designMetadata: {id: 'test-1', isFragment: false},
        });

        expect(element?.classList.contains('pd-design--fragment')).toBe(false);
        expect(element?.classList.contains('pd-design--component')).toBe(true);
      });
    });

    describe('when the component is selected', () => {
      it('should show the frame', async () => {
        const {element} = await render(TestComponent);

        element?.click();

        expect(element?.classList.contains('pd-design--show-frame')).toBe(true);
        expect(element?.classList.contains('pd-design--selected')).toBe(true);
      });
    });
  });
});
