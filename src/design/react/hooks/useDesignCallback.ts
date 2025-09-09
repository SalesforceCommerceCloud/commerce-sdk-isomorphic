/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react';
import {useDesignContext} from '../context/DesignContext';

/**
 * A hook that wraps a callback and only calls it if the design mode is active.
 * @param callback - The callback to wrap.
 * @param deps - The dependencies to pass to memoize the callback.
 * @returns The wrapped callback.
 */
export function useDesignCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  deps?: unknown[]
): (...args: TArgs) => TReturn | void {
  const {isDesignMode} = useDesignContext();

  return useCallback(
    (...args: TArgs): TReturn | void =>
      isDesignMode ? callback(...args) : undefined,
    [isDesignMode, ...(deps ?? [])]
  );
}
