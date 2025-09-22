/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export class Deferred<TValue> {
  private internalResolve!: (value: TValue | PromiseLike<TValue>) => void;

  private internalReject!: (reason?: unknown) => void;

  readonly promise = new Promise<TValue>((resolve, reject) => {
    this.internalResolve = resolve;
    this.internalReject = reject;
  });

  resolve(value: TValue | PromiseLike<TValue>): void {
    this.internalResolve(value);
  }

  reject(reason?: unknown): void {
    this.internalReject(reason);
  }
}
