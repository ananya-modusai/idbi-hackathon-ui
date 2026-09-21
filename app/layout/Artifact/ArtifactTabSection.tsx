/**
 * Tab Bar Management Component
 * 
 * Implements a complete browser-like tab bar with:
 * 1. Navigation Controls
 *    - Back/Forward buttons
 *    - Navigation state management
 * 
 * 2. Tab List Features
 *    - Horizontal scrolling for many tabs
 *    - New tab button
 *    - Tab overflow handling
 * 
 * 3. Tab Operations
 *    - Add new blank tab
 *    - Tab selection
 *    - Tab removal
 *    - Tab reordering
 * 
 * 4. Scroll Behavior
 *    - Auto-scroll to new tabs
 *    - Smooth scrolling animations
 */

import * as React from "react"
import { Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Artifact } from './Artifact'
import { ArtifactTab } from './ArtifactTab'
import { TabNavigation } from './ArtifactTabNavigation'
import { useTabManager } from './hooks/useTabManager'
import { useScrollHelper } from './hooks/useScrollHelper'
import { useArtifactStore } from '@/app/store/artifact/artifactStore'

export function ArtifactTabsSection() {
  const { tabs, activeTabId, setActiveTabId, addTab, removeTab, moveTab, canGoBack, canGoForward, setCollapsed, uiRefreshKey, forceActivateTab } = useArtifactStore();
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const { scrollToTab } = useScrollHelper(tabsContainerRef);

  // Scroll to active tab when it changes
  React.useEffect(() => {
    if (activeTabId) {
      scrollToTab(activeTabId);
    }
  }, [activeTabId, scrollToTab, uiRefreshKey]);

  // Object.entries can error if tabs is not iterable, add a safety check
  const checkForMismatchedContent = React.useCallback((tabId: string, state: any) => {
    // Check if there could be any remaining cached components for other tabs
    // that might interfere with proper tab switching
    if (!Array.isArray(state.tabs)) return;
    
    state.tabs.forEach((tab: any) => {
      if (tab.id !== tabId && tab.cachedContent && tab.cachedContent.props) {
        const cachedTabId = tab.cachedContent.props['data-tab-id'];
        
        // If this tab has content belonging to the tab we're trying to activate,
        // clear it to prevent content from appearing in multiple tabs
        if (cachedTabId === tabId) {
          console.warn(`Found tab ${tab.id} with content for tab ${tabId}. Clearing its cache.`);
          state.updateTab(tab.id, { cachedContent: undefined });
        }
      }
    });
  }, []);
  
  const handleTabClick = React.useCallback((tabId: string) => {
    // Prevent tab click handling during state updates
    if (tabId === activeTabId) {
      console.log("Tab already active, no need to reactivate");
      return;
    }
    
    // Use a synchronous function to handle the tab click, then schedule state updates
    const initiateTabSwitch = () => {
      // Get the current state and the tab we're activating
      const state = useArtifactStore.getState();
      const tabToActivate = state.tabs.find(tab => tab.id === tabId);
      
      if (!tabToActivate) {
        console.error(`Tab with id ${tabId} not found`);
        return;
      }
      
      // Schedule mismatched content check to run after current render cycle
      setTimeout(() => {
        checkForMismatchedContent(tabId, state);
        
        // Activate the tab after checks are complete
        setActiveTabId(tabId);
        setCollapsed(false);
        
        // Verify activation worked in the next tick
        setTimeout(() => {
          const currentState = useArtifactStore.getState();
          if (currentState.activeTabId !== tabId) {
            console.log("Tab switch verification failed - retrying direct state access");
            useArtifactStore.setState({ 
              activeTabId: tabId,
              uiRefreshKey: currentState.uiRefreshKey + 5,
              isCollapsed: false
            });
          }
          
          // Use force activate as backup
          if (typeof currentState.forceActivateTab === 'function') {
            currentState.forceActivateTab(tabId);
          }
        }, 50);
      }, 0);
    };
    
    // Start the tab switching process
    initiateTabSwitch();
  }, [activeTabId, setActiveTabId, setCollapsed, checkForMismatchedContent]);

  const handleAddBlankTab = React.useCallback(() => {
    const newTabId = `tab-${Date.now()}`;
    addTab({
      id: newTabId,
      title: 'New Tab',
      renderArtifact: () => <div>Blank Artifact</div>,
    });
    // Ensure panel is expanded when a new tab is added
    setCollapsed(false);
  }, [addTab, setCollapsed]);

  const handleRemoveTab = React.useCallback((tabId: string, event: React.SyntheticEvent) => {
    console.log("Removing tab:", tabId);
    // Ensure the event doesn't propagate to parent elements
    event.stopPropagation();
    if (event.nativeEvent && typeof event.nativeEvent.stopImmediatePropagation === 'function') {
      event.nativeEvent.stopImmediatePropagation();
    }
    
    // Remove the tab
    removeTab(tabId);
  }, [removeTab]);

  return (
    <div className="border-b">
      <div className="flex items-center">
        <TabNavigation 
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onNavigate={() => {}}
        />

        <div className="flex-1 max-w-[calc(100%-4rem)] overflow-x-auto thin-scrollbar">
          <div ref={tabsContainerRef} className="flex items-center w-max py-1"> 
            {tabs.map((tab, index) => (
              <ArtifactTab
                key={tab.id}
                tab={tab}
                index={index}
                activeTabId={activeTabId}
                onTabClick={handleTabClick}
                onRemoveTab={handleRemoveTab}   
                onMoveTab={moveTab}
              />
            ))}
            <div
              onClick={handleAddBlankTab}
              className={cn(
                'flex items-center justify-center',
                'px-2 py-0.5 h-8',
                'hover:bg-blue-50/50 cursor-pointer',
                'transition-colors duration-150'
              )}
              title="New Tab"
            >
              <Plus className="w-3 h-3 text-gray-400 hover:text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
