import { create } from 'zustand';
import { ipoService } from '@/app/services/ipoServices';
import type { FinancialComparisonResponse, FinancialComparisonItem } from '@/app/services/ipoServices';

interface FinancialComparisonStore {
  comparisonData: FinancialComparisonResponse | null;
  loading: boolean;
  error: string | null;
  fetchFinancialComparison: (companyId: string, listingId: string) => Promise<void>;
  clearData: () => void;
}

export const useFinancialComparisonStore = create<FinancialComparisonStore>((set, get) => ({
  comparisonData: null,
  loading: false,
  error: null,

  fetchFinancialComparison: async (companyId: string, listingId: string) => {
    // Don't fetch if we already have data for the same company/listing
    const currentData = get().comparisonData;
    if (currentData?.comparison_summary?.merchant_id === companyId && 
        currentData?.data && currentData.data.length > 0) {
      return;
    }

    try {
      set({ loading: true, error: null });
      const response = await ipoService.getFinancialComparison(companyId, listingId);
      
      if (response.success && response.data) {
        set({ comparisonData: response, loading: false });
      } else {
        throw new Error(response.message || 'Failed to fetch financial comparison data');
      }
    } catch (error) {
      let errorMessage = 'An error occurred while fetching financial comparison data';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Financial comparison data not found for this company and listing';
        } else if (error.message.includes('500') || error.message.includes('Backend server error')) {
          errorMessage = 'Backend server error. Please try again later';
        } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to the backend server. Please ensure the backend is running';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('Error fetching financial comparison data:', error);
      set({ 
        error: errorMessage,
        loading: false 
      });
    }
  },

  clearData: () => {
    set({ comparisonData: null, error: null, loading: false });
  }
}));
