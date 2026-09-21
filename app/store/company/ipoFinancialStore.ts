import { create } from 'zustand';
import { ipoService } from '@/app/services/ipoServices';
import type { GraphDataResponse } from '@/app/services/ipoServices';

interface FinancialStatementData {
  success: boolean;
  message: string;
  data: any[]; // Financial data array from the API
}

interface IpoFinancialStore {
  financialsData: FinancialStatementData | null;
  graphData: GraphDataResponse | null;
  loading: boolean;
  error: string | null;
  fetchFinancialsData: (companyId: string) => Promise<void>;
  fetchGraphData: (companyId: string) => Promise<void>;
  getChartData: () => any[]; // Helper method to get data for charts
  setFinancialData: (data: FinancialStatementData) => void; // Method to set data from external sources
}

export const useIpoFinancialStore = create<IpoFinancialStore>((set, get) => ({
  financialsData: null,
  graphData: null,
  loading: false,
  error: null,
  fetchFinancialsData: async (companyId: string) => {
    const currentState = get();
    
    // Don't fetch if we already have data
    if (currentState.financialsData?.data && currentState.financialsData.data.length > 0) {
      return;
    }
    
    try {
      set({ loading: true, error: null });
      const response = await ipoService.getCompanyFinancialTable(companyId);
      
      // Transform the API response to the expected format
      if (response.success && response.data && response.data.pdf) {
        const transformedData = Object.keys(response.data.pdf).map(dateKey => {
          // Extract year from date (e.g., "2024-12-31" -> "2024")
          const year = dateKey.split('-')[0];
          // Extract month (01-12) and convert to short month name (e.g., "Jan", "Feb")
          const monthNumber = dateKey.split('-')[1];
          let monthLabel = "";
          if (monthNumber) {
            // Create a date object to leverage locale-based month formatting
            const tmpDate = new Date(`${year}-${monthNumber}-01`);
            monthLabel = tmpDate.toLocaleString('default', { month: 'short' });
          }
          // Combine month label with year for display purposes (e.g., "Dec 2024")
          const displayLabel = monthLabel ? `${monthLabel} ${year}` : year;
          const yearData = response.data.pdf[dateKey];
          
          return {
            year,
            label: displayLabel, // Human-readable period label (e.g., "Dec 2024")
            date: dateKey,       // Full date string (yyyy-mm-dd)
            'Profit and Loss': yearData['Profit and Loss'] || {},
            'Assets and Liabilities': yearData['Assets and Liabilities'] || {},
            'Cash Flow': yearData['Cash Flow'] || {} // Now including cash flow data
          };
        }).sort((a, b) => a.date.localeCompare(b.date));
        
        const financialDataForStore = {
          success: true,
          message: response.message || 'Financial data fetched successfully',
          data: transformedData
        };
        
        set({ financialsData: financialDataForStore, loading: false });
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch financial statement data', 
        loading: false 
      });
    }
  },
  fetchGraphData: async (companyId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await ipoService.getCompanyGraphData(companyId);
      set({ graphData: response, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch graph data',
        loading: false
      });
    }
  },
  getChartData: () => {
    const state = get();
    if (state.graphData) {
      // Use the graph data if available
      const allYears = new Set([
        ...state.graphData.revenue.map(d => d.year),
        ...state.graphData.profit.map(d => d.year),
        ...state.graphData.cashflow.map(d => d.year)
      ]);
      
      return Array.from(allYears).sort().map(year => {
        const revenueData = state.graphData?.revenue.find(d => d.year === year);
        const profitData = state.graphData?.profit.find(d => d.year === year);
        const cashflowData = state.graphData?.cashflow.find(d => d.year === year);
        
        return {
          name: year,
          year: year,
          revenue: revenueData?.value || 0,
          profit: profitData?.value || 0,
          cashFlow: cashflowData?.value || 0
        };
      });
    }
    
    // Fallback to old data if graph data is not available
    if (!state.financialsData?.data) return [];
    
    return state.financialsData.data.map(item => {
      const year = item.year;
      const profitLoss = item['Profit and Loss'] || {};
      
      return {
        name: year,
        year: year,
        revenue: profitLoss.Revenue?.['Total Income'] || profitLoss.Revenue?.['Revenue from operations'] || 0,
        profit: profitLoss['Profit/(Loss) for the period'] || 0,
        cashFlow: 0 // API doesn't provide cash flow data yet
      };
    });
  },
  setFinancialData: (data: FinancialStatementData) => {
    const currentState = get();
    
    // Only set data if it's valid and not overwriting better data
    if (data && data.data && data.data.length > 0) {
      // Check if we're trying to overwrite comprehensive data with simple data
      const hasCurrentComprehensiveData = currentState.financialsData?.data?.some(item => 
        item['Profit and Loss'] && item['Cash Flow']
      );
      
      const hasNewComprehensiveData = data.data.some(item => 
        item['Profit and Loss'] && item['Cash Flow']
      );
      
      // Only update if:
      // 1. No current data exists, OR
      // 2. New data is comprehensive (has P&L and Cash Flow), OR  
      // 3. Current data is not comprehensive but new data is
      if (!currentState.financialsData || 
          !hasCurrentComprehensiveData || 
          hasNewComprehensiveData) {
        set({ financialsData: data });
      }
    }
  }
}));
