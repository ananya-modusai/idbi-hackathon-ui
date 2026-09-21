import { API } from './axios';

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  type: string;
  created_by: string;
  count: number;
}

// Interface for visualization data items
export interface VisualizationData {
  [key: string]: any;
}

export interface Visualization {
  id: string;
  title: string;
  description: string;
  config: {
    type: "combo" | "stats";
    xAxisKey: string | string[];
    className: string;
    yAxisKeys: {
      key: string;
      type: "line" | "bar";
      color: string;
      yAxisId?: "left" | "right";
    }[];
    leftYAxisLabel?: string;
    rightYAxisLabel?: string;
  };
  code_type: string;
  code: string | null;
  query: string;
  data: string; // Data as a JSON string from API
  created_by: string;
}

// Extended interface with parsed data
export interface ParsedVisualization extends Omit<Visualization, 'data'> {
  data: VisualizationData[]; // Data parsed as an array of objects
}

export interface DashboardDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  visualizations: ParsedVisualization[]; // Using the parsed version
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: Dashboard[];
}

export interface DashboardDetailResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    description: string;
    type: string;
    visualizations: Visualization[]; // Using the original API version
  };
}

/**
 * Fetches all dashboards from the API
 * @returns Promise with dashboard data
 */
export const getAllDashboards = async (): Promise<Dashboard[]> => {
  try {
    const response = await API.get<DashboardResponse>('/api/v1/dashboard/get_all_dashboards');
    
    if (response.data.success) {
      return response.data.data;
    } else {
      console.error('Error fetching dashboards:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return [];
  }
};

/**
 * Fetches a single dashboard by ID with visualization data
 * @param id Dashboard ID
 * @returns Promise with detailed dashboard data including visualizations
 */
export const getDashboardById = async (id: string): Promise<DashboardDetail | null> => {
  try {
    const response = await API.get<DashboardDetailResponse>(`/api/v1/dashboard/get_dashboard/${id}`);
    
    if (response.data.success) {
      // Parse visualization data strings to JSON objects
      const dashboardData = response.data.data;
      
      // Transform each visualization's data from string to JSON object
      const parsedVisualizations = dashboardData.visualizations.map(viz => ({
        ...viz,
        data: JSON.parse(viz.data) as VisualizationData[] // Parse the data string to JSON
      }));
      
      // Return dashboard with parsed visualizations
      return {
        ...dashboardData,
        visualizations: parsedVisualizations
      };
    } else {
      console.error(`Error fetching dashboard with ID ${id}:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching dashboard with ID ${id}:`, error);
    return null;
  }
};

/**
 * Updates a visualization with new configuration while preserving original data
 * @param dashboardId Dashboard ID
 * @param visualizationId Visualization ID
 * @param updates Partial visualization updates
 * @returns Promise with updated visualization
 */
export const updateVisualization = async (
  dashboardId: string,
  visualizationId: string, 
  updates: Partial<Visualization>
): Promise<ParsedVisualization | null> => {
  try {
    // First, get the current visualization to preserve data if needed
    const dashboard = await getDashboardById(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard with ID ${dashboardId} not found`);
    }
    
    const currentViz = dashboard.visualizations.find(v => v.id === visualizationId);
    if (!currentViz) {
      throw new Error(`Visualization with ID ${visualizationId} not found`);
    }
    
    // Prepare request payload according to API format
    const payload = {
      visualization_id: visualizationId,
      dashboard_id: dashboardId,
      title: updates.title || currentViz.title,
      description: updates.description || currentViz.description,
      config: updates.config || currentViz.config,
      code_type: updates.code_type || currentViz.code_type,
      code: updates.code || currentViz.code,
      query: updates.query || currentViz.query
    };
    
    // Send update to API
    const response = await API.post<{success: boolean; message: string; data: Visualization}>(
      `/api/v1/dashboard/save-update-visualization`,
      payload
    );
    
    if (response.data.success) {
      // Parse the response data
      const updatedViz = response.data.data;
      return {
        ...updatedViz,
        data: JSON.parse(updatedViz.data) as VisualizationData[]
      };
    } else {
      console.error(`Error updating visualization with ID ${visualizationId}:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`Error updating visualization with ID ${visualizationId}:`, error);
    return null;
  }
};

/**
 * Creates a new dashboard
 * @param name Dashboard name
 * @param description Dashboard description (optional)
 * @returns Promise with the created dashboard data
 */
export const createDashboard = async (
  name: string,
  description: string
): Promise<Dashboard | null> => {
  try {
    const response = await API.post<{success: boolean; message: string; data: Dashboard}>(
      '/api/v1/dashboard/create-dashboard',
      { name, description }
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      console.error('Error creating dashboard:', response.data.message);
      throw new Error(response.data.message || 'Failed to create dashboard');
    }
  } catch (error) {
    console.error('Error creating dashboard:', error);
    throw error;
  }
};

/**
 * Deletes a dashboard by ID
 * @param dashboardId ID of the dashboard to delete
 * @returns Promise with success status
 */
export const deleteDashboard = async (dashboardId: string): Promise<boolean> => {
  try {
    const response = await API.get<{success: boolean; message: string}>(
      `/api/v1/dashboard/delete-dashboard/${dashboardId}`
    );
    
    if (response.data.success) {
      return true;
    } else {
      console.error(`Error deleting dashboard with ID ${dashboardId}:`, response.data.message);
      throw new Error(response.data.message || 'Failed to delete dashboard');
    }
  } catch (error) {
    console.error(`Error deleting dashboard with ID ${dashboardId}:`, error);
    throw error;
  }
}; 