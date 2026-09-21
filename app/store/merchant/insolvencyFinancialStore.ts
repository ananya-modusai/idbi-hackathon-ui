import { create } from 'zustand';
import { merchantService } from '@/app/services/merchantServices';

interface FinancialStatementData {
  success: boolean;
  message: string;
  data: any[]; // Financial data array from the API
}

interface MetricData {
  metrics: Array<{
    [key: string]: string | number | null; // Dynamic year keys + metric properties
    metric: string;
    metric_code: string;
    description: string;
  }>;
  years: number[];
}

interface InsolvencyFinancialStore {
  financialsData: FinancialStatementData | null;
  metricsData: MetricData | null;
  loading: boolean;
  error: string | null;
  fetchFinancialsData: (merchantId: string) => Promise<void>;
  fetchMetricsData: (merchantId: string) => Promise<void>;
}

export const useInsolvencyFinancialStore = create<InsolvencyFinancialStore>((set) => ({
  financialsData: null,
  metricsData: null,
  loading: false,
  error: null,
  fetchFinancialsData: async (merchantId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await merchantService.getMerchantFinancialTable(merchantId);

      // Normalize response shape so components can rely on financialsData.data being an array
      // Some API clients return the array directly while others return { success, message, data }
      if (Array.isArray(response)) {
        set({ financialsData: { success: true, message: 'OK', data: response }, loading: false });
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        set({ financialsData: response, loading: false });
      } else {
        // Unknown shape — still store something useful and avoid breaking components
        set({ financialsData: { success: false, message: 'Unexpected financial data format', data: [] }, loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch financial statement data', 
        loading: false 
      });
    }
  },
  fetchMetricsData: async (merchantId: string) => {
    try {
      console.log('Store: Starting to fetch metrics for merchant:', merchantId);
      set({ loading: true, error: null });
      const response = await merchantService.getMerchantMetricsByYear(merchantId);
      console.log('Store: Metrics API response:', response);
      set({ metricsData: response, loading: false });
    } catch (error) {
      console.error('Store: Error fetching metrics:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch metrics data', 
        loading: false 
      });
    }
  }
}));