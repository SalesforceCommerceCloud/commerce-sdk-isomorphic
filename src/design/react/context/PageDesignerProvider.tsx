/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Suspense, lazy, useMemo, createContext, useContext} from 'react';
import {isDesignModeActive, isPreviewModeActive} from '../../modeDetection';

// Lazy load the context providers so that they are only loaded when needed and don't impact runtime performance
const LazyDesignProvider = lazy(() =>
  import('./DesignContext').then(module => ({
    default: module.DesignProvider,
  }))
);

const LazyPreviewProvider = lazy(() =>
  import('./PreviewContext').then(module => ({
    default: module.PreviewProvider,
  }))
);

// Fallback component for loading states
const LoadingFallback: React.FC = () => null;

// PageDesigner context to expose mode information to children
type PageDesignerContextType = {
  isDesignMode: boolean;
  isPreviewMode: boolean;
};

const PageDesignerContext = createContext<PageDesignerContextType>({
  isDesignMode: false,
  isPreviewMode: false,
});

// Hook to access PageDesigner mode information
export const usePageDesignerMode = (): PageDesignerContextType =>
  useContext(PageDesignerContext);

type PageDesignerProviderProps = {
  children: React.ReactNode;
  targetOrigin: string;
};

export const PageDesignerProvider = ({
  children,
  targetOrigin,
}: PageDesignerProviderProps): JSX.Element => {
  const contextValue = useMemo(
    () => ({
      isDesignMode: isDesignModeActive(),
      isPreviewMode: isPreviewModeActive(),
    }),
    []
  );
  const {isDesignMode, isPreviewMode} = contextValue;

  if (isDesignMode && !targetOrigin) {
    throw new Error(
      'PageDesignerProvider: targetOrigin is required when in design mode for security reasons. ' +
        'This should be the origin of the host application that contains this iframe '
    );
  }

  // If no special mode is active, just render children without loading contexts
  if (!isDesignMode && !isPreviewMode) {
    return <>{children}</>;
  }

  let content = children;

  if (isPreviewMode) {
    content = (
      <Suspense fallback={<LoadingFallback />}>
        <LazyPreviewProvider>{content}</LazyPreviewProvider>
      </Suspense>
    );
  }

  if (isDesignMode) {
    content = (
      <Suspense fallback={<LoadingFallback />}>
        <LazyDesignProvider targetOrigin={targetOrigin}>
          {content}
        </LazyDesignProvider>
      </Suspense>
    );
  }

  return (
    <PageDesignerContext.Provider value={contextValue}>
      {content}
    </PageDesignerContext.Provider>
  );
};
