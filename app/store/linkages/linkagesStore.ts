import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LinkagesCacheEntry {
  data: any[];
  error: string | null;
  timestamp: number;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  fx?: number;
  fy?: number;
}

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface GraphState {
  selectedDegree: string[];
  pruneLowDegreeNodes: boolean;
  strongConnector?: boolean | null; // null = show all, true = strong connector (Yes), false = weak connector (No)
  hiddenNodes?: string[]; // Array of node IDs that are hidden
  isDeleteMode?: boolean; // Whether delete mode is active
}

interface ExpandedState {
  expandedNodes: string[]; // Array of expanded node IDs
  expandedData?: any[]; // Additional data from expansions (optional, can be large)
  expandedNodeLinks: { [nodeId: string]: string[] }; // Map node ID to array of link edgeIds
  expandedNodeChildren: { [nodeId: string]: string[] }; // Map node ID to array of child node IDs
  nodeParents: { [nodeId: string]: string }; // Map child node ID to parent node ID
}

interface LinkagesStore {
  // Cache Neptune data by customer ID
  neptuneDataCache: { [customerId: string]: LinkagesCacheEntry };
  
  // Loading state by customer ID
  loadingStates: { [customerId: string]: boolean };
  
  // Store node positions by customer ID to persist them when switching tabs
  nodePositions: { [customerId: string]: NodePosition[] };
  
  // Store graph state (degree selection, prune settings) by customer ID
  graphStates: { [customerId: string]: GraphState };
  
  // Store expanded linkages state by customer ID to persist when switching tabs
  expandedStates: { [customerId: string]: ExpandedState };
  
  // Store viewport state (x, y, zoom) by customer ID
  viewportStates: { [customerId: string]: ViewportState };
  
  // Cache management functions
  getCachedNeptuneData: (customerId: string, degree?: number) => any[] | null;
  setCachedNeptuneData: (customerId: string, data: any[], error?: string | null, degree?: number) => void;
  setLoadingState: (customerId: string, isLoading: boolean, degree?: number) => void;
  getLoadingState: (customerId: string, degree?: number) => boolean;
  
  // Node position management functions
  getNodePositions: (customerId: string) => NodePosition[] | null;
  setNodePositions: (customerId: string, positions: NodePosition[]) => void;
  clearNodePositions: (customerId?: string) => void;
  
  // Graph state management functions
  getGraphState: (customerId: string) => GraphState | null;
  setGraphState: (customerId: string, state: Partial<GraphState>) => void;
  
  // Hidden nodes management functions
  addHiddenNode: (customerId: string, nodeId: string) => void;
  removeHiddenNode: (customerId: string, nodeId: string) => void;
  getHiddenNodes: (customerId: string) => string[];
  clearHiddenNodes: (customerId: string) => void;
  
  // Delete mode management functions
  setDeleteMode: (customerId: string, isActive: boolean) => void;
  getDeleteMode: (customerId: string) => boolean;
  
  // Expanded state management functions
  getExpandedState: (customerId: string) => ExpandedState | null;
  setExpandedState: (customerId: string, state: Partial<ExpandedState>) => void;
  
  // Viewport state management functions
  getViewportState: (customerId: string) => ViewportState | null;
  setViewportState: (customerId: string, state: ViewportState) => void;
  clearViewportState: (customerId?: string) => void;
  
  // Debug function to check what's in the store
  debugGetExpandedStates: () => { [customerId: string]: ExpandedState };
}

export const useLinkagesStore = create(
  persist(
    (set, get) => ({
      neptuneDataCache: {},
      loadingStates: {},
      nodePositions: {},
      graphStates: {},
      expandedStates: {},
      viewportStates: {},

  getCachedNeptuneData: (customerId: string, degree?: number) => {
    const state = get() as LinkagesStore;
    const buildKey = (d?: number) => `${customerId}::degree=${typeof d === 'number' ? d : 'all'}`;

    // Try exact match first
    const exactKey = buildKey(degree);
    let entry = state.neptuneDataCache[exactKey];

    const cacheValidityMs = 5 * 60 * 1000;

    const isEntryExpired = (e: LinkagesCacheEntry | undefined) => {
      if (!e) return true;
      return Date.now() - e.timestamp > cacheValidityMs;
    };

    if (entry && !isEntryExpired(entry)) {
      return entry.data;
    }

    // IMPORTANT: Do NOT use superset cache for degree-specific requests
    // This causes issues where degree 2 request gets degree 3 data, and all edges
    // are marked with degree 3, breaking the filter logic.
    // Only use exact match to ensure correct degree filtering.
    
    // If no suitable cached entry found, and exact key existed but was expired,
    // remove the expired exact entry to keep cache clean.
    if (state.neptuneDataCache[exactKey]) {
      const { [exactKey]: _, ...rest } = state.neptuneDataCache;
      set({ neptuneDataCache: rest });
    }

    return null;
  },

  setCachedNeptuneData: (customerId: string, data: any[], error: string | null = null, degree?: number) => {
    const key = `${customerId}::degree=${typeof degree === 'number' ? degree : 'all'}`;
    set((state: LinkagesStore) => ({
      neptuneDataCache: {
        ...state.neptuneDataCache,
        [key]: {
          data,
          error,
          timestamp: Date.now()
        }
      }
    }));
  },

  setLoadingState: (customerId: string, isLoading: boolean, degree?: number) => {
    const key = `${customerId}::degree=${typeof degree === 'number' ? degree : 'all'}`;
    set((state: LinkagesStore) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: isLoading
      }
    }));
  },

  getLoadingState: (customerId: string, degree?: number) => {
    const state = get() as LinkagesStore;
    const key = `${customerId}::degree=${typeof degree === 'number' ? degree : 'all'}`;
    return state.loadingStates[key] ?? false;
  },

  getNodePositions: (customerId: string) => {
    const state = get() as LinkagesStore;
    return state.nodePositions[customerId] ?? null;
  },

  setNodePositions: (customerId: string, positions: NodePosition[]) => {
    set((state: LinkagesStore) => ({
      nodePositions: {
        ...state.nodePositions,
        [customerId]: positions
      }
    }));
  },

  clearNodePositions: (customerId?: string) => {
    if (customerId) {
      const state = get() as LinkagesStore;
      const { [customerId]: _, ...rest } = state.nodePositions;
      const { [customerId]: __, ...restViewport } = state.viewportStates;
      set({ 
        nodePositions: rest,
        viewportStates: restViewport
      });
    } else {
      set({ 
        nodePositions: {},
        viewportStates: {}
      });
    }
  },

  getGraphState: (customerId: string) => {
    const state = get() as LinkagesStore;
    return state.graphStates[customerId] || null;
  },

  setGraphState: (customerId: string, newState: Partial<GraphState>) => {
    set((state: LinkagesStore) => {
      const currentState = state.graphStates[customerId] || {
        selectedDegree: ['first'],
        pruneLowDegreeNodes: true,
        strongConnector: true, // true = strong connector (Yes) by default
        hiddenNodes: [],
        isDeleteMode: false,
      };
      return {
        graphStates: {
          ...state.graphStates,
          [customerId]: {
            ...currentState,
            ...newState
          }
        }
      };
    });
  },

  addHiddenNode: (customerId: string, nodeId: string) => {
    set((state: LinkagesStore) => {
      const currentState = state.graphStates[customerId] || {
        selectedDegree: ['first'],
        pruneLowDegreeNodes: true,
        strongConnector: true,
        hiddenNodes: [],
        isDeleteMode: false,
      };
      const hiddenNodes = currentState.hiddenNodes || [];
      if (!hiddenNodes.includes(nodeId)) {
        hiddenNodes.push(nodeId);
      }
      return {
        graphStates: {
          ...state.graphStates,
          [customerId]: {
            ...currentState,
            hiddenNodes
          }
        }
      };
    });
  },

  removeHiddenNode: (customerId: string, nodeId: string) => {
    set((state: LinkagesStore) => {
      const currentState = state.graphStates[customerId] || {
        selectedDegree: ['first'],
        pruneLowDegreeNodes: true,
        strongConnector: true,
        hiddenNodes: [],
        isDeleteMode: false,
      };
      const hiddenNodes = (currentState.hiddenNodes || []).filter((id: string) => id !== nodeId);
      return {
        graphStates: {
          ...state.graphStates,
          [customerId]: {
            ...currentState,
            hiddenNodes
          }
        }
      };
    });
  },

  getHiddenNodes: (customerId: string) => {
    const state = get() as LinkagesStore;
    const graphState = state.graphStates[customerId];
    return graphState?.hiddenNodes || [];
  },

  clearHiddenNodes: (customerId: string) => {
    set((state: LinkagesStore) => {
      const currentState = state.graphStates[customerId];
      if (!currentState) return state;
      return {
        graphStates: {
          ...state.graphStates,
          [customerId]: {
            ...currentState,
            hiddenNodes: [],
            isDeleteMode: false
          }
        }
      };
    });
  },

  setDeleteMode: (customerId: string, isActive: boolean) => {
    set((state: LinkagesStore) => {
      const currentState = state.graphStates[customerId] || {
        selectedDegree: ['first'],
        pruneLowDegreeNodes: true,
        strongConnector: true,
        hiddenNodes: [],
        isDeleteMode: false,
      };
      return {
        graphStates: {
          ...state.graphStates,
          [customerId]: {
            ...currentState,
            isDeleteMode: isActive
          }
        }
      };
    });
  },

  getDeleteMode: (customerId: string) => {
    const state = get() as LinkagesStore;
    const graphState = state.graphStates[customerId];
    return graphState?.isDeleteMode || false;
  },

  getExpandedState: (customerId: string) => {
    const state = get() as LinkagesStore;
    return state.expandedStates[customerId] || null;
  },

  setExpandedState: (customerId: string, newState: Partial<ExpandedState>) => {
    set((state: LinkagesStore) => {
      const currentState = state.expandedStates[customerId] || {
        expandedNodes: [],
        expandedNodeLinks: {},
        expandedNodeChildren: {},
        nodeParents: {}
      };
      return {
        expandedStates: {
          ...state.expandedStates,
          [customerId]: {
            ...currentState,
            ...newState
          }
        }
      };
    });
  },
  
  debugGetExpandedStates: () => {
    const state = get() as LinkagesStore;
    return state.expandedStates;
  },

  getViewportState: (customerId: string) => {
    const state = get() as LinkagesStore;
    return state.viewportStates[customerId] || null;
  },

  setViewportState: (customerId: string, viewport: ViewportState) => {
    // Defer the state update to avoid "Cannot update a component while rendering a different component" warning
    // This is necessary because this function is called from ForceGraph2D's zoom callback during render
    setTimeout(() => {
      set((state: LinkagesStore) => ({
        viewportStates: {
          ...state.viewportStates,
          [customerId]: viewport
        }
      }));
    }, 0);
  },

  clearViewportState: (customerId?: string) => {
    if (customerId) {
      const state = get() as LinkagesStore;
      const { [customerId]: _, ...rest } = state.viewportStates;
      set({ viewportStates: rest });
    } else {
      set({ viewportStates: {} });
    }
  },
    }) as any,
    {
      // Renamed to orphan state persisted under the old key. nodePositions and
      // viewportStates are saved per customer and survive reloads, so a viewport
      // captured while the graph was broken (e.g. panned ~950px off the nodes)
      // kept being restored and the canvas looked empty even once the data was
      // correct. Bump this suffix whenever the graph data shape changes.
      name: 'linkages-store-v8',
      partialize: (state: any) => ({
        // Don't persist selectedDegree so it resets to default ['first'] on browser refresh
        graphStates: Object.entries(state.graphStates).reduce((acc: any, [customerId, graphState]: any) => {
          acc[customerId] = {
            ...graphState,
            selectedDegree: undefined // Exclude selectedDegree from persistence
          };
          return acc;
        }, {}),
        nodePositions: state.nodePositions,
        expandedStates: state.expandedStates,
        viewportStates: state.viewportStates,
      })
    }
  )
);
