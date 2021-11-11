/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K; }[keyof T];
export type PartialSubset<T extends object, K extends keyof any> = Omit<T, K> & Partial<T>;
