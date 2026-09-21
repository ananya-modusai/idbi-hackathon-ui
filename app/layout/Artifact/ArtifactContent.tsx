/**
 * Content Display Component
 *
 * Handles the main content area of the artifact panel, similar to a browser's viewport.
 *
 * Features:
 * 1. Collapsible content with animations
 * 2. Tab bar integration
 * 3. Scrollable content area
 * 4. Different states for content display:
 *    - Empty state (no artifacts)
 *    - Blank tab state
 *    - Artifact content state
 * 5. Custom artifact rendering system
 * 6. Content caching system to prevent re-fetching
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { ArtifactTabsSection } from "./ArtifactTabSection"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useArtifactStore, Tab } from "@/app/store/artifact/artifactStore"

export function ArtifactContent() {
  const { tabs, activeTabId, isCollapsed, tabRef, uiRefreshKey } = useArtifactStore();

  // Debug logging
  React.useEffect(() => {
    console.log('ArtifactContent render - tabs:', tabs.length, 'activeTabId:', activeTabId, 'isCollapsed:', isCollapsed);
  }, [tabs, activeTabId, isCollapsed]);

  // Use a ref to store rendered components to prevent re-renders
  const renderedComponentsRef = React.useRef<Record<string, JSX.Element>>({});

  // Keep track of tab IDs to verify content matches
  const tabIdRef = React.useRef<string | null>(null);

  // Find active tab safely with useEffect + useState for better responsiveness
  const [activeTab, setActiveTab] = React.useState<Tab | undefined>(() => {
    // Initialize with the current active tab to avoid blank flash
    const tab = tabs.find((tab) => tab.id === activeTabId);

    // Set initial tab ID reference
    if (tab) {
      tabIdRef.current = tab.id;
    }

    return tab;
  });

  // Clear all rendered components when active tab changes to force correct rendering
  React.useEffect(() => {
    // If the active tab ID has changed, force fresh rendering
    if (activeTabId !== tabIdRef.current) {
      console.log(`Active tab changed from ${tabIdRef.current} to ${activeTabId}, forcing fresh render`);

      // Clear any transition states to prevent showing previous content
      setPrevTabContent(null);
      setTransitionState('idle');

      // Update our reference
      tabIdRef.current = activeTabId;
    }
  }, [activeTabId]);

  // Update active tab whenever the tabs or activeTabId changes
  React.useEffect(() => {
    console.log("ArtifactContent: activeTabId changed", {
      activeTabId,
      availableTabs: tabs.map(t => ({ id: t.id, title: t.title }))
    });

    const tab = tabs.find((tab) => tab.id === activeTabId);

    // Clear the rendered component for the active tab when uiRefreshKey changes
    // This ensures the refresh button works correctly
    if (activeTabId && renderedComponentsRef.current[activeTabId]) {
      console.log(`Clearing cached component for tab ${activeTabId} due to refresh`);
      delete renderedComponentsRef.current[activeTabId];
    }

    // Update the tab ID reference to ensure content matches title
    if (tab) {
      tabIdRef.current = tab.id;
    } else {
      tabIdRef.current = null; // Clear the reference if no tab is active
    }

    setActiveTab(tab);
  }, [tabs, activeTabId, uiRefreshKey]);

  // Only render content when visible
  const shouldRenderContent = !isCollapsed && activeTab;

  // Add a verification check to ensure proper tab ID association
  const verifyTabContent = React.useCallback((tab: Tab, content: JSX.Element) => {
    try {
      // Add a data attribute to the content for verification
      const contentWithId = React.cloneElement(content, {
        'data-tab-id': tab.id,
        'data-tab-title': tab.title,
        key: tab.id // Ensure React treats this as a new element
      });

      return contentWithId;
    } catch (error) {
      console.error(`Failed to clone element for tab ${tab.id}:`, error);
      return content; // Return original content if cloning fails
    }
  }, []);

  // Pre-render all tabs once to avoid flashing when switching between tabs
  React.useEffect(() => {
    // Pre-render all tabs that have not been rendered yet
    tabs.forEach(tab => {
      if (!renderedComponentsRef.current[tab.id] && !tab.cachedContent) {
        // Don't actually render, just prepare the cache
        try {
          // Generate content in the background
          setTimeout(() => {
            if (!renderedComponentsRef.current[tab.id] && !tab.cachedContent) {
              console.log(`Pre-rendering content for tab ${tab.id} in background`);
              const content = tab.renderArtifact();

              // Add verification data
              const verifiedContent = verifyTabContent(tab, content);

              renderedComponentsRef.current[tab.id] = verifiedContent;

              // Store in tab's cache as well
              useArtifactStore.getState().updateTab(tab.id, {
                cachedContent: verifiedContent,
                dataLoaded: true
              });
            }
          }, 0);
        } catch (error) {
          console.error(`Error pre-rendering tab ${tab.id}:`, error);
        }
      }
    });
  }, [tabs, verifyTabContent]);

  // Generate content only if needed, otherwise use cached content
  const renderContent = React.useCallback(() => {
    if (!activeTab) return null;

    // We should not be calling setState during render
    // Instead, use useEffect to handle these state updates

    // If this tab ID already has a rendered component in our ref cache, use it
    if (renderedComponentsRef.current[activeTab.id]) {
      console.log(`Using cached rendered component for tab ${activeTab.id}`);
      return renderedComponentsRef.current[activeTab.id];
    }

    // If we have cached content, use it
    if (activeTab.cachedContent) {
      console.log(`Using cached content for tab ${activeTab.id}`);
      // Don't setState during render - just return cached content
      // Store in the ref for future renders
      renderedComponentsRef.current[activeTab.id] = activeTab.cachedContent;
      return activeTab.cachedContent;
    }

    // Otherwise, generate new content
    console.log(`Generating new content for tab ${activeTab.id}`);
    try {
      const content = activeTab.renderArtifact();

      // Add verification data
      const verifiedContent = verifyTabContent(activeTab, content);

      // Store in our local ref cache to prevent re-rendering
      renderedComponentsRef.current[activeTab.id] = verifiedContent;

      // Use useEffect to update the store state (moved to useEffect below)
      return verifiedContent;
    } catch (error) {
      console.error(`Error rendering content for tab ${activeTab.id}:`, error);
      return <div>Error rendering content</div>;
    }
  }, [activeTab, verifyTabContent]);

  // Move store updates outside of render
  React.useEffect(() => {
    if (activeTab && renderedComponentsRef.current[activeTab.id]) {
      // Update the store with cached content if needed
      if (!activeTab.cachedContent) {
        useArtifactStore.getState().updateTab(activeTab.id, {
          cachedContent: renderedComponentsRef.current[activeTab.id],
          dataLoaded: true
        });
      }
    }
  }, [activeTab]);

  // Clear cache for a tab when it's removed
  React.useEffect(() => {
    const oldTabIds = Object.keys(renderedComponentsRef.current);
    const currentTabIds = tabs.map(tab => tab.id);

    // Remove cached content for tabs that no longer exist
    oldTabIds.forEach(id => {
      if (!currentTabIds.includes(id)) {
        delete renderedComponentsRef.current[id];
      }
    });

    // If we had tabs before but now have none, clear previous content
    if (tabs.length === 0 && oldTabIds.length > 0) {
      setPrevTabContent(null);
      setTransitionState('idle');
    }
  }, [tabs]);

  // Keep track of the previous active tab content for smooth transitions
  const [prevTabContent, setPrevTabContent] = React.useState<JSX.Element | null>(null);
  const [transitionState, setTransitionState] = React.useState<'idle' | 'switching'>('idle');
  const previousTabIdRef = React.useRef<string | null>(null);

  // Smoothly transition between tabs
  React.useEffect(() => {
    if (!activeTab) {
      // When there's no active tab, clear the previous content after a delay
      const timeoutId = setTimeout(() => {
        setPrevTabContent(null);
        setTransitionState('idle');
      }, 200);

      return () => clearTimeout(timeoutId);
    }

    // If the tab ID changed, capture the previous content
    if (previousTabIdRef.current && previousTabIdRef.current !== activeTab.id) {
      // If we had a previous tab, store its content
      if (renderedComponentsRef.current[previousTabIdRef.current]) {
        setPrevTabContent(renderedComponentsRef.current[previousTabIdRef.current]);
        setTransitionState('switching');
      }

      // After a short delay, finish the transition
      const timeoutId = setTimeout(() => {
        setTransitionState('idle');
      }, 200);

      return () => clearTimeout(timeoutId);
    }

    // Store the new tab ID for future comparison
    previousTabIdRef.current = activeTab.id;
  }, [activeTab]);

  // Ensure we always have the rendered content of the active tab
  React.useEffect(() => {
    if (activeTab && !isCollapsed) {
      // Ensure the active tab's content is rendered and cached
      if (!renderedComponentsRef.current[activeTab.id]) {
        console.log(`Ensuring content is cached for active tab ${activeTab.id}`);

        try {
          // Render the content
          const content = activeTab.renderArtifact();
          const verifiedContent = verifyTabContent(activeTab, content);

          // Store in both caches
          renderedComponentsRef.current[activeTab.id] = verifiedContent;

          useArtifactStore.getState().updateTab(activeTab.id, {
            cachedContent: verifiedContent,
            dataLoaded: true
          });
        } catch (error) {
          console.error(`Error caching content for tab ${activeTab.id}:`, error);
        }
      }
    }
  }, [activeTab, isCollapsed, verifyTabContent]);

  return (
    <div className={cn(
      "relative flex flex-col h-full",
      "transition-opacity duration-300 ease-in-out",
      isCollapsed ? "opacity-0" : "opacity-100"
    )}>
      <div ref={tabRef}>
        <ArtifactTabsSection />
      </div>

      <ScrollArea className="flex-1 relative">
        {/* Always keep a container for both current and previous content */}
        <div className="relative w-full h-full">
          {/* Current tab content */}
          {activeTab && (
            <div
              className={cn(
                "absolute inset-0 p-4 pl-6 transition-all duration-200",
                transitionState === 'switching'
                  ? "opacity-0 transform translate-y-2"
                  : "opacity-100 transform translate-y-0"
              )}
              data-active-tab-id={activeTab.id}
            >
              {renderContent()}
            </div>
          )}

          {/* Previous tab content for smooth transition */}
          {prevTabContent && (
            <div
              className={cn(
                "absolute inset-0 p-4 pl-6 transition-all duration-200",
                transitionState === 'switching'
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-2 pointer-events-none"
              )}
              data-prev-tab-id={previousTabIdRef.current}
            >
              {prevTabContent}
            </div>
          )}

          {/* Empty state - only show when truly empty and not transitioning */}
          {!activeTab && !prevTabContent && (
            <div className="h-full w-full flex items-center justify-center p-4">
              <div className="text-center">
                <div className="space-y-3 text-gray-500 gap-2">
                  <p className="text-lg">No artifacts to display</p>
                  <p className="text-sm">Click on an item in the workspace to view its details</p>
                </div>
              </div>
            </div>
            // <div className="absolute inset-0 p-4 pl-6 h-full flex flex-col items-center justify-center text-gray-500 gap-2">
            //   <p>No artifacts to display</p>
            //   <p className="text-sm">Click on an item in the workspace to view its details</p>
            // </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}