/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export interface TestBed<TResults, TArgs extends unknown[] = []> {
  afterRender: (
    fn: (result: TResults, ...args: TArgs) => void | Promise<void>
  ) => void;
  beforeRender: (fn: (...args: TArgs) => void | Promise<void>) => void;
  render: (...args: TArgs) => Promise<TResults>;
  cleanup: (fn: (...args: TArgs) => void | Promise<void>) => void;
}

export interface TestBedConfig<
  TResults,
  TMethods,
  TArgs extends unknown[] = []
> {
  renderer: (...args: TArgs) => TResults | Promise<TResults>;
  methods?: TMethods;
}

/**
 * Simple test bed implementation for testing that handles logic for cleanup,
 * before and after render hooks, and rendering.
 * The test bed should be created during test discovery (within a describe block),
 * not within a test since it registers before and after hooks.
 * @param config - The configuration for the test bed
 * @returns The test bed
 * @example
 * describe('test bed', () => {
 *   const testBed = createTestBed({
 * .   renderer: (props) => render(<MyComponent {...props} />)
 *   });
 *
 *   it('should render the component', async () => {
 *     const { findByText } = await testBed.render({ name: 'test' });
 *
 *     expect(findByText('test')).toBeDefined();
 *   }
 * });
 */
export function createTestBed<TResults, TMethods, TArgs extends unknown[] = []>(
  config: TestBedConfig<TResults, TMethods, TArgs>
): TestBed<TResults, TArgs> & TMethods {
  let beforeRenderFns: ((...args: TArgs) => void | Promise<void>)[] = [];
  let afterRenderFns: ((
    result: TResults,
    ...args: TArgs
  ) => void | Promise<void>)[] = [];
  let cleanupFns: ((...args: TArgs) => void | Promise<void>)[] = [];
  let currentArgs: TArgs;

  beforeEach(() => {
    currentArgs = undefined as unknown as TArgs;
    beforeRenderFns = [];
    afterRenderFns = [];
    cleanupFns = [];
  });

  afterEach(async () => {
    await cleanupFns.reduce(
      (acc, fn) => acc.then(() => fn(...currentArgs)),
      Promise.resolve()
    );
  });

  return {
    ...config.methods,
    beforeRender: (fn: (...args: TArgs) => void | Promise<void>) => {
      beforeRenderFns.push(fn);
    },
    afterRender: (
      fn: (result: TResults, ...args: TArgs) => void | Promise<void>
    ) => {
      afterRenderFns.push(fn);
    },
    cleanup: (fn: (...args: TArgs) => void | Promise<void>) => {
      cleanupFns.push(fn);
    },
    render: async (...args: TArgs): Promise<TResults> => {
      currentArgs = args;

      await beforeRenderFns.reduce(
        (acc, fn) => acc.then(() => fn(...args)),
        Promise.resolve()
      );

      const results = await config.renderer(...args);

      await afterRenderFns.reduce(
        (acc, fn) => acc.then(() => fn(results, ...args)),
        Promise.resolve()
      );

      return results;
    },
  } as unknown as TestBed<TResults, TArgs> & TMethods;
}
