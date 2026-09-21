import React, { ComponentType } from 'react';
import { ArtifactDataWrapper } from './ArtifactDataWrapper';

/**
 * Higher Order Component that wraps a component with our data loading system.
 * This makes it easy to convert existing components to use the caching system.
 * 
 * @param Component The component to wrap
 * @param getTabId Function to extract tab ID from props
 * @param fetchData Function to fetch the data needed by the component
 * @param getDependencies Function to extract dependencies from props
 */
export function withArtifactData<P extends object, T>(
  Component: ComponentType<P & { data: T }>,
  getTabId: (props: P) => string,
  fetchData: (props: P) => Promise<T>,
  getDependencies: (props: P) => any[] = () => []
) {
  return function WithArtifactData(props: P) {
    const tabId = getTabId(props);
    
    return (
      <ArtifactDataWrapper
        tabId={tabId}
        fetchData={() => fetchData(props)}
        dependencies={getDependencies(props)}
        render={(data) => <Component {...props} data={data} />}
      />
    );
  };
} 