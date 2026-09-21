import { create } from 'zustand';
import { dashboards as initialDashboards, visualizations, Visualization } from '@/app/data/hardcodeddata/dashboardStructures';
import { v4 as uuidv4 } from 'uuid';

interface DashboardStore {
  dashboards: typeof initialDashboards;
  
  // Dashboard actions
  addVisualizationToDashboard: (dashboardId: string, visualizationId: string) => void;
  createNewDashboard: (title: string, description: string) => string;
  getDashboardById: (dashboardId: string) => typeof initialDashboards[string] | undefined;
  addNewVisualizationToDashboard: (dashboardId: string, visualization: Visualization) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  dashboards: { ...initialDashboards },
  
  addVisualizationToDashboard: (dashboardId: string, visualizationId: string) => {
    set((state) => {
      const dashboard = state.dashboards[dashboardId];
      if (!dashboard) return state;
      
      // Check if visualization already exists in dashboard
      if (dashboard.visualizationIds.includes(visualizationId)) {
        return state;
      }
      
      return {
        dashboards: {
          ...state.dashboards,
          [dashboardId]: {
            ...dashboard,
            visualizationIds: [...dashboard.visualizationIds, visualizationId]
          }
        }
      };
    });
  },
  
  createNewDashboard: (title: string, description: string) => {
    const newDashboardId = `dash-${uuidv4().substring(0, 6)}`;
    
    set((state) => ({
      dashboards: {
        ...state.dashboards,
        [newDashboardId]: {
          dashboard_id: newDashboardId,
          title,
          description,
          visualizationIds: [],
          user: "admin@example.com"
        }
      }
    }));
    
    return newDashboardId;
  },
  
  getDashboardById: (dashboardId: string) => {
    return get().dashboards[dashboardId];
  },
  
  addNewVisualizationToDashboard: (dashboardId: string, visualization: Visualization) => {
    const visualizationId = visualization.visualization_id;
    
    set((state) => {
      // Add to dashboards
      const dashboard = state.dashboards[dashboardId];
      if (!dashboard) return state;
      
      return {
        dashboards: {
          ...state.dashboards,
          [dashboardId]: {
            ...dashboard,
            visualizationIds: [...dashboard.visualizationIds, visualizationId]
          }
        }
      };
    });
  }
})); 