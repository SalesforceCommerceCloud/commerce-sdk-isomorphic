/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Import node-fetch polyfill for Jest tests
import fetch from 'node-fetch';

// Make fetch available globally for tests
// eslint-disable-next-line
(global as any).fetch = fetch;
