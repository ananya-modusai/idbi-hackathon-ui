import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useArtifactData } from './hooks/useArtifactData';

interface ArtifactDataWrapperProps<T> {
  tabId: string;
  fetchData: () => Promise<T>;
  dependencies?: any[];
  render: (data: T) => ReactNode;
  renderLoading?: () => ReactNode;
  renderError?: (error: Error) => ReactNode;
}

/**
 * A wrapper component that handles data loading and caching for artifact components.
 * This simplifies implementation of artifacts that need to fetch and cache data.
 */
export function ArtifactDataWrapper<T>({
  tabId, 
  fetchData, 
  dependencies = [],
  render,
  renderLoading,
  renderError
}: ArtifactDataWrapperProps<T>) {
  // Use our custom hook for data loading
  const { data, loading, error } = useArtifactData<T>(tabId, fetchData, dependencies);
  
  // Show loading state
  if (loading) {
    return renderLoading ? renderLoading() : (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Loading content...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return renderError ? renderError(error) : (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-2 max-w-md p-4">
          <p className="text-red-500 font-medium">Error loading content</p>
          <p className="text-sm text-gray-500">{error.message}</p>
          <p className="text-xs text-gray-400 mt-4">
            Try refreshing the content using the refresh button in the top navigation bar.
          </p>
        </div>
      </div>
    );
  }
  
  // Data is ready to render
  if (data) {
    return <>{render(data)}</>;
  }
  
  // Fallback (should rarely happen)
  return (
    <div className="text-center p-4 text-gray-500">
      No content available
    </div>
  );
} 