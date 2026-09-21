import { create } from 'zustand';

export interface ActiveTab {
  id: string;
  name: string;
  type: 'merchant' | 'customer' | 'case'; // Extensible for future use
}

interface ActiveTabsStore {
  activeTabs: ActiveTab[];
  currentActiveTabId: string | null;
  addTab: (tab: ActiveTab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string | null) => void;
  clearAllTabs: () => void;
  hasTab: (tabId: string) => boolean;
  updateTabName: (tabId: string, newName: string) => void;
}

export const useActiveTabsStore = create<ActiveTabsStore>((set, get) => ({
  activeTabs: [],
  currentActiveTabId: null,
  
  addTab: (tab: ActiveTab) => {
    const { activeTabs, currentActiveTabId } = get();
    // Check if tab already exists
    const existingTab = activeTabs.find(t => t.id === tab.id);
    if (!existingTab) {
      const newTabs = [...activeTabs, tab];
      set({ 
        activeTabs: newTabs,
        currentActiveTabId: tab.id // Set the new tab as active
      });
    } else {
      // If tab exists, just make it active and update name if different
      if (existingTab.name !== tab.name) {
        const updatedTabs = activeTabs.map(t => 
          t.id === tab.id ? { ...t, name: tab.name } : t
        );
        set({ activeTabs: updatedTabs });
      }
      set({ currentActiveTabId: tab.id });
    }
  },
  
  removeTab: (tabId: string) => {
    const { activeTabs, currentActiveTabId } = get();
    const newTabs = activeTabs.filter(tab => tab.id !== tabId);
    
    let newActiveTabId = currentActiveTabId;
    
    // If we're removing the currently active tab, switch to another tab
    if (currentActiveTabId === tabId) {
      if (newTabs.length > 0) {
        // Find the next tab (or first tab if removed was last)
        const removedIndex = activeTabs.findIndex(tab => tab.id === tabId);
        const nextIndex = removedIndex < newTabs.length ? removedIndex : newTabs.length - 1;
        newActiveTabId = newTabs[nextIndex]?.id || null;
      } else {
        newActiveTabId = null;
      }
    }
    
    set({ 
      activeTabs: newTabs,
      currentActiveTabId: newActiveTabId
    });
  },
  
  setActiveTab: (tabId: string | null) => {
    set({ currentActiveTabId: tabId });
  },
  
  clearAllTabs: () => {
    set({ activeTabs: [], currentActiveTabId: null });
  },
  
  hasTab: (tabId: string) => {
    const { activeTabs } = get();
    return activeTabs.some(tab => tab.id === tabId);
  },
  
  updateTabName: (tabId: string, newName: string) => {
    const { activeTabs } = get();
    const updatedTabs = activeTabs.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    );
    set({ activeTabs: updatedTabs });
  }
}));
