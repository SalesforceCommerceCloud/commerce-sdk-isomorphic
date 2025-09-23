/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Utility functions for detecting active design/preview modes
 */

export const getUrlMode = (): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('mode');
};

export const isDesignModeActive = (): boolean => getUrlMode() === 'EDIT';

export const isPreviewModeActive = (): boolean => getUrlMode() === 'PREVIEW';

