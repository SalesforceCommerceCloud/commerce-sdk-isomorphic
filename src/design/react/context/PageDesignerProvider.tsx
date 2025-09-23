/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {
  Suspense,
  lazy,
  useMemo,
  createContext,
  useContext,
} from 'react';
import {
  isDesignModeActive,
  isPreviewModeActive,
} from '../../modeDetection';

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

const PageDesignerContext = createContext<PageDesignerContextType | null>(null);

// Hook to access PageDesigner mode information
export const usePageDesignerMode = (): PageDesignerContextType => {
  const context = useContext(PageDesignerContext);
  if (!context) {
    // Return default values if not within PageDesignerProvider
    return {
      isDesignMode: false,
      isPreviewMode: false,
    };
  }
  return context;
};

type PageDesignerProviderProps = {
  children: React.ReactNode;
};

export const PageDesignerProvider = ({
  children,
}: PageDesignerProviderProps): JSX.Element => {
  const { isDesignMode, isPreviewMode } = useMemo(
    () => ({
      isDesignMode: isDesignModeActive(),
      isPreviewMode: isPreviewModeActive(),
    }),
    []
  );

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
        <LazyDesignProvider>{content}</LazyDesignProvider>
      </Suspense>
    );
  }

  return (
    <PageDesignerContext.Provider value={{ isDesignMode, isPreviewMode }}>
      {content}
    </PageDesignerContext.Provider>
  );
};
