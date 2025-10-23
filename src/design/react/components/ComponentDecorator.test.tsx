/*
 * Copyright (c) 2025, salesforce.com, inc.
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
  fireEvent,
  waitFor,
} from '@testing-library/react';
import {HostApi} from '../../messaging-api/api-types';
import {createHostApi} from '../../messaging-api/host';
import {createReactComponentDesignDecorator} from './ComponentDecorator';
import {ComponentDecoratorProps} from './component.types';
import {PageDesignerProvider} from '../context/PageDesignerProvider';
import {createTestBed} from '../../test/testBed';

// Test component to decorate
const TestComponent: React.FC = ({children}) => (
  <div data-testid="test-component">{children}</div>
);

type Result = RenderResult & {element: HTMLElement; host: HostApi};

describe('design/react/ComponentDecorator', () => {
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
      const DecoratedComponent = createReactComponentDesignDecorator(component);
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
          id: 'test-1',
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
          <DecoratedComponent {...(props as ComponentDecoratorProps<TProps>)}>
            Test Content
          </DecoratedComponent>
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

  describe('when decorating a component', () => {
    it('should render the original component when not in design mode', async () => {
      const {element, getByTestId} = await testBed.render(
        TestComponent,
        {},
        {mode: null}
      );

      expect(getByTestId('test-component')).toBeDefined();
      expect(element).toBeNull();
    });

    it('should render with design wrapper when in design mode', async () => {
      const {element} = await testBed.render(TestComponent);

      expect(element).toBeDefined();
    });

    describe('when the component is a fragment', () => {
      it('should include the corresponding fragment class', async () => {
        const {element} = await testBed.render(TestComponent, {
          designMetadata: {
            id: 'test-1',
            isFragment: true,
            regionDirection: 'row',
            regionId: 'test-region',
          },
        });

        expect(element.classList.contains('pd-design__fragment')).toBe(true);
        expect(element.classList.contains('pd-design__component')).toBe(false);
      });
    });

    describe('when the component is a component', () => {
      it('should include the corresponding component class', async () => {
        const {element} = await testBed.render(TestComponent, {
          designMetadata: {
            id: 'test-1',
            isFragment: false,
            regionDirection: 'row',
            regionId: 'test-region',
          },
        });

        expect(element.classList.contains('pd-design__fragment')).toBe(false);
        expect(element.classList.contains('pd-design__component')).toBe(true);
      });
    });

    describe('when the component is hovered', () => {
      let hostSpy: jest.Mock;

      beforeEach(() => {
        hostSpy = jest.fn();
        testBed.afterRender(({host, element}) => {
          host.on('ComponentHoveredIn', hostSpy);
          fireEvent.mouseEnter(element);
        });
      });
      it('should show the frame', async () => {
        const {element} = await testBed.render(TestComponent);

        expect(element.classList.contains('pd-design__frame--visible')).toBe(
          true
        );
        expect(
          element.classList.contains('pd-design__decorator--hovered')
        ).toBe(true);
      });

      it('should notify the host of the hover', async () => {
        await testBed.render(TestComponent);

        await waitFor(() => {
          expect(hostSpy).toHaveBeenCalledWith(
            expect.objectContaining({componentId: 'test-1'})
          );
        });
      });

      describe('when hovering out of the component', () => {
        let hoverOutSpy: jest.Mock;

        beforeEach(() => {
          hoverOutSpy = jest.fn();
          testBed.afterRender(async ({host, element}) => {
            await waitFor(() => {
              expect(
                element.classList.contains('pd-design__decorator--hovered')
              ).toBe(true);
            });

            host.on('ComponentHoveredOut', hoverOutSpy);
            fireEvent.mouseLeave(element);
          });
        });

        it('should notify the host of the hover out', async () => {
          await testBed.render(TestComponent);

          await waitFor(() => {
            expect(hostSpy).toHaveBeenCalledWith(
              expect.objectContaining({componentId: 'test-1'})
            );
          });
        });

        it('should not show the frame', async () => {
          const {element} = await testBed.render(TestComponent);

          expect(element.classList.contains('pd-design__frame--visible')).toBe(
            false
          );
          expect(
            element.classList.contains('pd-design__decorator--hovered')
          ).toBe(false);
        });
      });
    });

    describe('when the component is selected', () => {
      it('should show the frame', async () => {
        const {element} = await testBed.render(TestComponent);

        element.click();

        expect(element.classList.contains('pd-design__frame--visible')).toBe(
          true
        );
        expect(
          element.classList.contains('pd-design__decorator--selected')
        ).toBe(true);
      });

      it('should notify the host of the selection', async () => {
        const {element, host} = await testBed.render(TestComponent);

        return new Promise<void>(resolve => {
          host.on('ComponentSelected', event => {
            expect(event).toEqual(
              expect.objectContaining({
                componentId: 'test-1',
              })
            );
            resolve();
          });

          element?.click();
        });
      }, 500);
    });

    describe('when the component is deleted', () => {
      let hostSpy: jest.Mock;

      beforeEach(() => {
        hostSpy = jest.fn();
        testBed.afterRender(async ({host, element}) => {
          // Select the component so the frame is shown
          fireEvent.click(element);

          await waitFor(() => {
            expect(
              element.classList.contains('pd-design__frame--visible')
            ).toBe(true);
          });

          host.on('ComponentDeleted', hostSpy);
          const deleteButton = await testBed.findBySelector(
            element,
            '.pd-design__frame__delete-icon'
          );
          fireEvent.click(deleteButton);
        });
      });

      it('should notify the host of the deletion', async () => {
        await testBed.render(TestComponent, {
          designMetadata: {
            id: 'test-1',
            parentId: 'test-parent',
            regionId: 'test-region',
            regionDirection: 'row',
            isFragment: false,
          },
        });

        await waitFor(() => {
          expect(hostSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              componentId: 'test-1',
              sourceComponentId: 'test-parent',
              sourceRegionId: 'test-region',
            })
          );
        });
      });
    });

    describe('when the component is focused', () => {
      let scrollSpy: jest.Mock;

      beforeEach(() => {
        scrollSpy = jest.fn();
        testBed.afterRender(({element, host}) => {
          /* eslint-disable-next-line no-param-reassign */
          element.scrollIntoView = scrollSpy;
          host.focusComponent({componentId: 'test-1'});
        });
      });

      it('should scroll to the component that is focused', async () => {
        await testBed.render(TestComponent);

        await waitFor(() => {
          expect(scrollSpy).toHaveBeenCalled();
        });
      });
    });
  });
});
