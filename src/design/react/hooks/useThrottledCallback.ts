/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useRef, useCallback} from 'react';

export function useThrottledCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  interval: number,
  deps: unknown[] = []
): (...args: TArgs) => TReturn | void {
  const lastCallTime = useRef<number>(0);

  return useCallback(
    (...args: TArgs): TReturn | void => {
      const now = Date.now();

      if (now >= lastCallTime.current + interval) {
        lastCallTime.current = now;

        callback(...args);
      }
    },
    [callback, interval, ...deps]
  );
}
