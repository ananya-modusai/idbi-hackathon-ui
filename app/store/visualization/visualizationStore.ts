import { create } from 'zustand';
import { visualizations as initialVisualizations, Visualization } from '@/app/data/hardcodeddata/dashboardStructures';

interface VisualizationStore {
  visualizations: Record<string, Visualization>;
  
  // Visualization actions
  updateVisualization: (visualizationId: string, updates: Partial<Visualization>) => void;
  getVisualizationById: (visualizationId: string) => Visualization | undefined;
  createVisualization: (visualization: Visualization) => void;
  deleteVisualization: (visualizationId: string) => void;
}

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  visualizations: { ...initialVisualizations },
  
  updateVisualization: (visualizationId: string, updates: Partial<Visualization>) => {
    set((state) => {
      const existingViz = state.visualizations[visualizationId];
      if (!existingViz) {
        console.warn(`Visualization ${visualizationId} not found`);
        return state;
      }
      
      return {
        visualizations: {
          ...state.visualizations,
          [visualizationId]: {
            ...existingViz,
            ...updates
          }
        }
      };
    });
  },
  
  getVisualizationById: (visualizationId: string) => {
    return get().visualizations[visualizationId];
  },
  
  createVisualization: (visualization: Visualization) => {
    set((state) => ({
      visualizations: {
        ...state.visualizations,
        [visualization.visualization_id]: visualization
      }
    }));
  },
  
  deleteVisualization: (visualizationId: string) => {
    set((state) => {
      const { [visualizationId]: deleted, ...rest } = state.visualizations;
      return {
        visualizations: rest
      };
    });
  }
}));
