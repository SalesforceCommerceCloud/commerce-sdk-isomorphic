/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Main Provider
export {
  PageDesignerProvider,
  usePageDesignerMode,
} from './context/PageDesignerProvider';

export {useDesignContext} from './context/DesignContext';
export type {DesignContextType} from './context/DesignContext';

// Components
export {createReactComponentDesignDecorator} from './components/ComponentDecorator';
export {createReactRegionDesignDecorator} from './components/RegionDecorator';
