import { create } from 'zustand';

interface LivePreviewConfig {
  type: 'combo' | 'stats';
  data: any[];
  title?: string;
  description?: string;
  xAxisKey: string | string[];
  yAxisKeys: any[];
  leftYAxisLabel?: string;
  rightYAxisLabel?: string;
  groupBy?: string;
  errorColumn?: string;
  stacking?: string;
  normalization?: boolean;
  missingNullHandling?: string;
}

interface LivePreviewStore {
  // Map of visualization ID to live preview config
  livePreviewConfigs: Record<string, LivePreviewConfig>;
  
  // Cache of original visualization data from API to preserve during edits
  dataCache: Record<string, any[]>;

  // Actions
  setLivePreviewConfig: (visualizationId: string, config: LivePreviewConfig) => void;
  clearLivePreviewConfig: (visualizationId: string) => void;
  clearAllLivePreviewConfigs: () => void;
  getLivePreviewConfig: (visualizationId: string) => LivePreviewConfig | undefined;
  
  // Data cache actions
  cacheOriginalData: (visualizationId: string, data: any[]) => void;
  getOriginalData: (visualizationId: string) => any[] | undefined;
  clearDataCache: (visualizationId: string) => void;
}

export const useLivePreviewStore = create<LivePreviewStore>((set, get) => ({
  livePreviewConfigs: {},
  dataCache: {},

  setLivePreviewConfig: (visualizationId: string, config: LivePreviewConfig) => {
    // Check if the config has actually changed before updating state
    const currentConfig = get().livePreviewConfigs[visualizationId];

    // Skip update if configs are equal (shallow comparison for performance)
    if (currentConfig === config) return;

    // More comprehensive comparison to catch all property changes
    if (currentConfig && config) {
      const sameType = currentConfig.type === config.type;
      const sameTitle = currentConfig.title === config.title;
      const sameDescription = currentConfig.description === config.description;
      const sameDataLength = currentConfig.data?.length === config.data?.length;
      const sameXAxis = JSON.stringify(currentConfig.xAxisKey) === JSON.stringify(config.xAxisKey);
      const sameYAxis = JSON.stringify(currentConfig.yAxisKeys) === JSON.stringify(config.yAxisKeys);
      const sameStacking = currentConfig.stacking === config.stacking;
      const sameLeftYAxisLabel = currentConfig.leftYAxisLabel === config.leftYAxisLabel;
      const sameRightYAxisLabel = currentConfig.rightYAxisLabel === config.rightYAxisLabel;
      const sameGroupBy = currentConfig.groupBy === config.groupBy;
      const sameErrorColumn = currentConfig.errorColumn === config.errorColumn;
      const sameNormalization = currentConfig.normalization === config.normalization;
      const sameMissingNullHandling = currentConfig.missingNullHandling === config.missingNullHandling;

      // Only skip update if ALL properties are the same
      if (sameType && sameTitle && sameDescription && sameDataLength && sameXAxis && sameYAxis &&
          sameStacking && sameLeftYAxisLabel && sameRightYAxisLabel && sameGroupBy &&
          sameErrorColumn && sameNormalization && sameMissingNullHandling) {
        return;
      }
    }

    // Cache the original data if it's the first time setting a config for this visualization
    if (!currentConfig && config.data && config.data.length > 0) {
      get().cacheOriginalData(visualizationId, [...config.data]);
    }

    // Ensure we use cached data if available (to preserve original data)
    const cachedData = get().dataCache[visualizationId];
    const configToSet = cachedData ? { ...config, data: cachedData } : config;

    // Only update if the config is different
    set((state) => ({
      livePreviewConfigs: {
        ...state.livePreviewConfigs,
        [visualizationId]: configToSet
      }
    }));
  },

  clearLivePreviewConfig: (visualizationId: string) => {
    set((state) => {
      const { [visualizationId]: removed, ...rest } = state.livePreviewConfigs;
      return {
        livePreviewConfigs: rest
      };
    });
  },

  clearAllLivePreviewConfigs: () => {
    set({ livePreviewConfigs: {} });
  },

  getLivePreviewConfig: (visualizationId: string) => {
    return get().livePreviewConfigs[visualizationId];
  },

  // Data cache methods
  cacheOriginalData: (visualizationId: string, data: any[]) => {
    if (!data || data.length === 0) return;
    
    set((state) => ({
      dataCache: {
        ...state.dataCache,
        [visualizationId]: data
      }
    }));
  },

  getOriginalData: (visualizationId: string) => {
    return get().dataCache[visualizationId];
  },

  clearDataCache: (visualizationId: string) => {
    set((state) => {
      const { [visualizationId]: removed, ...rest } = state.dataCache;
      return {
        dataCache: rest
      };
    });
  }
}));
