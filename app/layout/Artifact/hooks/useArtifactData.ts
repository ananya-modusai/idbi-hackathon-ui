import { useState, useEffect } from 'react';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';

/**
 * A custom hook for handling artifact data loading and caching.
 * 
 * @param tabId - The ID of the current tab
 * @param fetchData - Function to fetch data for this artifact
 * @param dependencies - Array of dependencies that should trigger refetching (optional)
 * @returns An object containing the loaded data, loading state, and error state
 */
export function useArtifactData<T>(
  tabId: string,
  fetchData: () => Promise<T>,
  dependencies: any[] = []
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { tabs, uiRefreshKey } = useArtifactStore();
  const tab = tabs.find(t => t.id === tabId);
  
  // Initialize with cached data if available
  const [data, setData] = useState<T | undefined>(
    tab?.cachedData as T | undefined
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get latest tab state in case it changed
        const currentStore = useArtifactStore.getState();
        const currentTab = currentStore.tabs.find(t => t.id === tabId);
        
        // If data is already loaded and the tab is marked as loaded, skip fetching
        // We also need to ensure this isn't a forced refresh
        if (currentTab?.dataLoaded && currentTab?.cachedData) {
          console.log(`Using cached data for tab ${tabId}`);
          setData(currentTab.cachedData as T);
          return;
        }
        
        console.log(`Fetching fresh data for tab ${tabId}`);
        setLoading(true);
        setError(null);
        
        // Fetch the data
        const result = await fetchData();
        
        // Check if we still have the same tab ID before updating
        // This prevents race conditions if the tab changed during fetching
        if (useArtifactStore.getState().activeTabId === tabId) {
          // Update local state
          setData(result);
          
          // Cache the data in the store
          useArtifactStore.getState().updateTab(tabId, {
            cachedData: result,
            dataLoaded: true
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading artifact data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };
    
    loadData();
  // Include uiRefreshKey in dependencies to trigger refresh when it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, uiRefreshKey, ...dependencies]);
  
  return { data, loading, error, setData };
} 