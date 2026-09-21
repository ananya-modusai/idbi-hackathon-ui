import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import { useState } from 'react';

interface TabNavigationProps {
  canGoBack: boolean | undefined;
  canGoForward: boolean | undefined;
  onNavigate: (direction: 'back' | 'forward') => void;
}

export function TabNavigation({ canGoBack, canGoForward, onNavigate }: TabNavigationProps) {
  const { activeTabId } = useArtifactStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle refresh click - clear cached content to force re-render
  const handleRefresh = () => {
    if (!activeTabId || isRefreshing) return;
    
    // Show loading state
    setIsRefreshing(true);
    
    // Get current store state
    const state = useArtifactStore.getState();
    const activeTab = state.tabs.find(tab => tab.id === activeTabId);
    
    if (activeTab) {
      console.log(`Refreshing tab ${activeTabId} - clearing all caches`);
      
      // Clear cached content and data loading flag to force full re-rendering
      state.updateTab(activeTabId, { 
        cachedContent: undefined,
        dataLoaded: false,
        cachedData: undefined
      });
      
      // Use a significant increase to the refresh key to ensure the component re-renders
      useArtifactStore.setState({ 
        uiRefreshKey: state.uiRefreshKey + 10 
      });
      
      // Force a re-render with a slight delay for safer state updates
      setTimeout(() => {
        // Force tab activation to ensure it properly refreshes
        if (typeof state.forceActivateTab === 'function') {
          state.forceActivateTab(activeTabId);
        }
        
        // Reset the loading state after a short delay to give feedback
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      }, 50);
    } else {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="flex items-center px-1 space-x-0.5">
      <button
        onClick={() => onNavigate('back')}
        disabled={!canGoBack}
        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </button>
      <button
        onClick={() => onNavigate('forward')}
        disabled={!canGoForward}
        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </button>
      <button
        onClick={handleRefresh}
        disabled={!activeTabId}
        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${isRefreshing ? 'bg-blue-50' : ''}`}
        title="Refresh content"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'text-blue-500 animate-spin' : 'text-gray-500'}`} />
      </button>
    </div>
  );
} 