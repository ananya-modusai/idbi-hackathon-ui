/**
 * Tab Management Hook
 * 
 * Implements a comprehensive browser-like tab system with the following features:
 * 
 * 1. Tab Creation & Management:
 *    - Creates new tabs from artifacts (like opening links in browser)
 *    - Supports blank tabs (like browser's "New Tab") 
 *    - Enables duplicate tabs via Ctrl/Cmd + Click (like browser's duplicate tab)
 *    - Prevents accidental duplicate tabs with 100ms cooldown
 *    - Sequential tab IDs for predictable ordering
 * 
 * 2. History Management Per Tab:
 *    - Each tab maintains its own history stack
 *    - Supports back/forward navigation within each tab
 *    - History is pruned when navigating to new content mid-stack
 *    - Tracks current position in history via historyIndex
 * 
 * 3. Tab State Management:
 *    - Tracks active tab and its content
 *    - Maintains URL-like paths for each tab
 *    - Handles blank tab conversion when content is loaded
 *    - Preserves tab order and state during reordering
 *    - Preserves tab content when switching between tabs
 * 
 * 4. Special Behaviors:
 *    - Auto-scrolls to newly created tabs
 *    - Handles tab removal with smart focus management
 *    - Supports drag-and-drop reordering
 *    - Maintains tab state during collapse/expand
 *    - Quick tab navigation with keyboard shortcuts
 * 
 * 5. Browser-like Features:
 *    - Tab overflow with horizontal scrolling
 *    - Visual feedback during drag operations
 *    - Active tab highlighting
 *    - Tab close buttons
 *    - New tab button
 *    - Back/forward navigation buttons
 *    - Quick tab switching buttons
 * 
 * Usage:
 * const { tabs, activeTabId, handleHistoryNavigation, ... } = useTabManager({
 *   onTabChange: (tab) => void,
 *   artifact: Artifact | null
 * });
 */

import * as React from "react"
import { Tab, useArtifactStore } from '@/app/store/artifact/artifactStore';
import { useScrollHelper } from './useScrollHelper';

interface UseTabManagerProps {
  onTabChange: (tab: Tab | undefined) => void;
  artifact: any | null;
}

export function useTabManager({ onTabChange, artifact }: UseTabManagerProps) {
  const [tabs, setTabs] = React.useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = React.useState<string | null>(null);
  const [nextTabId, setNextTabId] = React.useState(1);
  const lastProcessedArtifactRef = React.useRef<{ id: string; timestamp: number } | null>(null);
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  // Calculate history state
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const canGoBack = activeTab && activeTab.historyIndex && activeTab.historyIndex > 0;
  const canGoForward = activeTab && activeTab.historyIndex && activeTab.history && activeTab.historyIndex < activeTab.history.length - 1;

  const createNewTab = React.useCallback((artifact: any): Tab => {
    const tabId = `tab-${nextTabId}`;
    setNextTabId(prev => prev + 1);
    return {
      id: tabId,
      title: artifact.title,
      artifact: artifact,
      currentUrl: `/artifact/${artifact.id}`,
      history: [artifact],
      historyIndex: 0,
      locked: true,
      renderArtifact: () => <div>Loading...</div>
    };
  }, [nextTabId]);

  const createBlankTab = React.useCallback((): Tab => {
    const tabId = `tab-${nextTabId}`;
    setNextTabId(prev => prev + 1);
    return {
      id: tabId,
      title: 'New Tab',
      artifact: null,
      currentUrl: '/blank',
      history: [],
      historyIndex: -1,
      isBlank: true,
      locked: false,
      renderArtifact: () => <div>Blank Tab</div>
    };
  }, [nextTabId]);

  const { scrollToEnd } = useScrollHelper(tabsContainerRef);

  // Update current tab with history only if not locked
  const updateTabWithHistory = React.useCallback((currentTab: Tab, newArtifact: any): Tab => {
    if (currentTab.locked) {
      return currentTab;
    }

    // If current tab is blank, convert it to a regular tab
    if (currentTab.isBlank) {
      return {
        ...currentTab,
        isBlank: false,
        title: newArtifact.title,
        artifact: newArtifact,
        currentUrl: `/artifact/${newArtifact.id}`,
        history: [newArtifact],
        historyIndex: 0,
        locked: true
      };
    }
    
    // Otherwise update history by truncating future entries and adding new one
    if (!currentTab.history || typeof currentTab.historyIndex !== 'number') {
      return {
        ...currentTab,
        title: newArtifact.title,
        artifact: newArtifact,
        currentUrl: `/artifact/${newArtifact.id}`,
        history: [newArtifact],
        historyIndex: 0
      };
    }
    const newHistory = [...currentTab.history.slice(0, currentTab.historyIndex + 1), newArtifact];
    return {
      ...currentTab,
      title: newArtifact.title,
      artifact: newArtifact,
      currentUrl: `/artifact/${newArtifact.id}`,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }, []);

  // Handle new artifacts
  React.useEffect(() => {
    if (!artifact) return;
    
    const now = Date.now();
    
    if (lastProcessedArtifactRef.current && 
        lastProcessedArtifactRef.current.id === artifact.id && 
        now - lastProcessedArtifactRef.current.timestamp < 100) {
      return;
    }

    lastProcessedArtifactRef.current = { id: artifact.id, timestamp: now };
    
    setTabs(currentTabs => {
      const existingTab = currentTabs.find(tab => tab.artifact?.id === artifact.id);
      if (existingTab) {
        queueMicrotask(() => setActiveTabId(existingTab.id));
        return currentTabs;
      }
      
      const newTab = createNewTab(artifact);
      queueMicrotask(() => {
        setActiveTabId(newTab.id);
        scrollToEnd();
      });
      return [...currentTabs, newTab];
    });
  }, [artifact, createNewTab, scrollToEnd]);

  // Notify parent of tab changes when activeTab changes
  React.useEffect(() => {
    if (activeTab) {
      onTabChange(activeTab);
    }
  }, [activeTab, onTabChange]);

  const handleHistoryNavigation = React.useCallback((direction: 'back' | 'forward') => {
    setTabs(currentTabs => {
      const activeTab = currentTabs.find(tab => tab.id === activeTabId);
      if (!activeTab?.history?.length || typeof activeTab.historyIndex !== 'number') return currentTabs;

      const newIndex = direction === 'back' 
        ? Math.max(0, activeTab.historyIndex - 1)
        : Math.min(activeTab.history.length - 1, activeTab.historyIndex + 1);

      if (newIndex === activeTab.historyIndex) return currentTabs;

      const historicalArtifact = activeTab.history[newIndex];
      const updatedTab = {
        ...activeTab,
        historyIndex: newIndex,
        artifact: historicalArtifact,
        title: historicalArtifact.title,
        currentUrl: `/artifact/${historicalArtifact.id}`
      };

      const updatedTabs = currentTabs.map(tab => 
        tab.id === activeTabId ? updatedTab : tab
      );

      queueMicrotask(() => {
        onTabChange(updatedTab);
      });

      return updatedTabs;
    });
  }, [activeTabId, onTabChange]);

  const handleRemoveTab = React.useCallback((tabId: string, event: React.SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    setTabs(currentTabs => {
      const remainingTabs = currentTabs.filter(tab => tab.id !== tabId);
      
      // If we're removing the active tab, select a new one
      if (activeTabId === tabId) {
        const tabIndex = currentTabs.findIndex(tab => tab.id === tabId);
        const newActiveTab = remainingTabs[tabIndex - 1] || remainingTabs[0];
        queueMicrotask(() => {
          setActiveTabId(newActiveTab?.id || null);
          onTabChange(newActiveTab || undefined);
        });
      }
      
      return remainingTabs;
    });
  }, [activeTabId, onTabChange]);

  const moveTab = React.useCallback((dragIndex: number, hoverIndex: number) => {
    setTabs(prevTabs => {
      const updatedTabs = [...prevTabs];
      const [removed] = updatedTabs.splice(dragIndex, 1);
      updatedTabs.splice(hoverIndex, 0, removed);
      return updatedTabs;
    });
  }, []);

  const switchToNextTab = React.useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTabId(tabs[nextIndex].id);
  }, [tabs, activeTabId]);

  const switchToPreviousTab = React.useCallback(() => {
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTabId(tabs[prevIndex].id);
  }, [tabs, activeTabId]);

  return {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    canGoBack,
    canGoForward,
    createNewTab,
    createBlankTab,
    handleHistoryNavigation,
    handleRemoveTab,
    moveTab,
    tabsContainerRef,
    switchToNextTab,
    switchToPreviousTab
  };
}