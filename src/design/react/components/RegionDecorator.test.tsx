/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  render as tlRender,
  RenderResult,
  cleanup as tlCleanup,
  act,
  waitFor,
} from '@testing-library/react';
import {HostApi} from '../../messaging-api/api-types';
import {createHostApi} from '../../messaging-api/host';
import {createReactRegionDesignDecorator} from './RegionDecorator';
import {ComponentDecoratorProps} from './component.types';
import {PageDesignerProvider} from '../context/PageDesignerProvider';
import {createTestBed} from '../../test/testBed';

// Test component to decorate
const TestRegion: React.FC = ({children}) => (
  <div data-testid="test-region">{children}</div>
);

type Result = RenderResult & {element: HTMLElement; host: HostApi};

describe('design/react/RegionDecorator', () => {
  // Mock document.elementsFromPoint for drag and drop tests
  const mockElementsFromPoint = jest.fn();

  beforeEach(() => {
    // Reset the mock before each test
    mockElementsFromPoint.mockClear();

    // Mock document.elementsFromPoint
    Object.defineProperty(document, 'elementsFromPoint', {
      value: mockElementsFromPoint,
      writable: true,
    });
  });

  const testBed = createTestBed({
    renderer: async <TProps,>(
      component: React.FC<TProps>,
      props: Partial<ComponentDecoratorProps<TProps>> = {},
      {
        mode = 'EDIT',
        waitForHost = true,
      }: {
        mode?: 'EDIT' | 'PREVIEW' | null;
        waitForHost?: boolean;
      } = {}
    ) => {
      const DecoratedComponent = createReactRegionDesignDecorator(component);
      const host = testBed.setupHost();

      if (mode) {
        const originalLocation = window.location;

        Reflect.deleteProperty(window, 'location');
        window.location = {
          ...originalLocation,
          search: `?mode=${mode}`,
        } as string & Location;

        testBed.cleanup(() => {
          window.location = originalLocation as string & Location;
        });
      }

      const designMetadata =
        props.designMetadata ??
        ({
          id: 'test-region-1',
        } as unknown as ComponentDecoratorProps<TProps>['designMetadata']);

      Object.assign(props, {designMetadata});

      const connectionPromise = new Promise<void>((resolve, reject) => {
        host.connect({
          configFactory: () =>
            Promise.resolve({components: {}, componentTypes: {}, labels: {}}),
          onClientConnected: () => resolve(),
          onError: () => reject(),
        });
      });

      const result = tlRender(
        <PageDesignerProvider clientId="test1" targetOrigin="*">
          <DecoratedComponent {...(props as ComponentDecoratorProps<TProps>)} />
        </PageDesignerProvider>
      );

      if (mode !== null && waitForHost) {
        await act(() => connectionPromise);
      }

      const finalResult = Object.assign(result, {
        host,
        element: result.container.querySelector('.pd-design__decorator'),
      }) as Result;

      return finalResult;
    },
    methods: {
      findBySelector: (element: HTMLElement, selector: string) =>
        waitFor(() => {
          const node = element.querySelector(selector);

          expect(node).toBeDefined();

          return node as HTMLElement;
        }),
      setupHost: () => {
        const emitter: Parameters<typeof createHostApi>[0]['emitter'] = {
          postMessage: (message: any) => window.postMessage(message, '*'),
          addEventListener: handler => {
            const listener = (event: MessageEvent) => handler(event.data);

            window.parent.addEventListener('message', listener);

            return () => window.parent.removeEventListener('message', listener);
          },
        };

        const host = createHostApi({emitter, id: 'test-host'});

        testBed.cleanup(() => host.disconnect());

        return host;
      },
    },
  });

  beforeEach(() => {
    testBed.cleanup(() => tlCleanup());
  });

  describe('when decorating a region', () => {
    it('should render the original region when not in design mode', async () => {
      const {element, getByTestId} = await testBed.render(
        TestRegion,
        {},
        {mode: null}
      );

      expect(getByTestId('test-region')).toBeDefined();
      expect(element).toBeNull();
    });

    it('should render with design wrapper when in design mode', async () => {
      const {element} = await testBed.render(TestRegion);

      expect(element).toBeDefined();
      expect(element.classList.contains('pd-design__decorator')).toBe(true);
      expect(element.classList.contains('pd-design__region')).toBe(true);
    });

    it('should render the region component inside the wrapper', async () => {
      const {getByTestId} = await testBed.render(TestRegion);

      expect(getByTestId('test-region')).toBeDefined();
    });

    describe('when external drag is active', () => {
      /*
       * DO NOT DELETE THIS COMMENT - This test was generated using AI.
       * Model used: Claude Sonnet 4
       */
      it('should add hovered class when region becomes the current drop target', async () => {
        const {element, host} = await testBed.render(TestRegion, {
          designMetadata: {
            id: 'test-region-1',
            regionDirection: 'row',
            regionId: 'test-region-1',
            isFragment: false,
          },
        });

        // Initially, the hovered class should NOT be present
        expect(element.classList.contains('pd-design__region--hovered')).toBe(
          false
        );

        // Mock getBoundingClientRect to simulate region position
        const mockRect = {
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          top: 50,
          left: 50,
          bottom: 150,
          right: 250,
          toJSON: () => ({}),
        };
        Object.defineProperty(element, 'getBoundingClientRect', {
          value: () => mockRect,
          writable: true,
        });

        // Mock elementsFromPoint to return the region element when dragged over it
        mockElementsFromPoint.mockImplementation((x: number, y: number) => {
          // Return the region element when coordinates are within bounds
          if (x >= 50 && x <= 250 && y >= 50 && y <= 150) {
            return [element, document.body];
          }
          return [document.body];
        });

        // Simulate drag started event
        act(() => {
          host.startComponentDrag({
            componentType: 'dragged-component',
          });
        });

        // After drag starts, hovered class should still NOT be present
        expect(element.classList.contains('pd-design__region--hovered')).toBe(
          false
        );

        // Simulate drag moved to coordinates within the region bounds
        act(() => {
          host.notifyClientWindowDragMoved({
            componentType: 'dragged-component',
            x: 100, // Within region bounds
            y: 75, // Within region bounds
          });
        });

        // Now the hovered class should be present
        await waitFor(() => {
          expect(element.classList.contains('pd-design__region--hovered')).toBe(
            true
          );
        });
      });

      /*
       * DO NOT DELETE THIS COMMENT - This test was generated using AI.
       * Model used: Claude Sonnet 4
       */
      it('should remove hovered class when drag moves outside region bounds', async () => {
        const {element, host} = await testBed.render(TestRegion, {
          designMetadata: {
            id: 'test-region-1',
            regionDirection: 'row',
            regionId: 'test-region-1',
            isFragment: false,
          },
        });

        // Mock getBoundingClientRect to simulate region position
        const mockRect = {
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          top: 50,
          left: 50,
          bottom: 150,
          right: 250,
          toJSON: () => ({}),
        };
        Object.defineProperty(element, 'getBoundingClientRect', {
          value: () => mockRect,
          writable: true,
        });

        // Mock elementsFromPoint to return the region element when dragged over it
        mockElementsFromPoint.mockImplementation((x: number, y: number) => {
          // Return the region element when coordinates are within bounds
          if (x >= 50 && x <= 250 && y >= 50 && y <= 150) {
            return [element, document.body];
          }
          return [document.body];
        });

        // Start drag and move to region to set hovered state
        act(() => {
          host.startComponentDrag({
            componentType: 'dragged-component',
          });
        });

        act(() => {
          host.notifyClientWindowDragMoved({
            componentType: 'dragged-component',
            x: 100, // Within region bounds
            y: 75, // Within region bounds
          });
        });

        // Verify hovered class is present
        await waitFor(() => {
          expect(element.classList.contains('pd-design__region--hovered')).toBe(
            true
          );
        });

        // Move drag outside region bounds
        act(() => {
          host.notifyClientWindowDragMoved({
            componentType: 'dragged-component',
            x: 300, // Outside region bounds
            y: 200, // Outside region bounds
          });
        });

        // Hovered class should be removed
        await waitFor(() => {
          expect(element.classList.contains('pd-design__region--hovered')).toBe(
            false
          );
        });
      });
    });

    describe('region decorator classes', () => {
      /*
       * DO NOT DELETE THIS COMMENT - This test was generated using AI.
       * Model used: Claude Sonnet 4
       */
      it('should include base decorator and region classes', async () => {
        const {element} = await testBed.render(TestRegion);

        expect(element.classList.contains('pd-design__decorator')).toBe(true);
        expect(element.classList.contains('pd-design__region')).toBe(true);
      });
    });
  });
});
