import { create } from 'zustand';
import { merchantService } from '@/app/services/merchantServices';

export interface RedFlag {
  merchant_id: string;
  rule_code: string;
  description: string;
  severity: string;
  metric_values: Record<string, string> | null;
  metric_data_timestamp: string | null;
  notes: string | null;
  id: string;
  created_at: string;
  updated_at: string;
  rule_name?: string;
  rule_description?: string;
  rule_type: string;
  rule_severity?: string;
  rule_fraud_type?: string;
  rule?: any;
}

interface InvestigationRedFlagsState {
  flagsList: RedFlag[];
  filterTypes: string[];
  filterSeverities: string[];
  setFilterTypes: (types: string[]) => void;
  setFilterSeverities: (severities: string[]) => void;
  clearFilters: () => void;
  fetchFlagsList: (merchantId: string) => Promise<void>;
}

export const useInvestigationRedFlagsStore = create<InvestigationRedFlagsState>((set) => ({
  flagsList: [],
  filterTypes: [],
  filterSeverities: [],
  
  setFilterTypes: (types: string[]) => set({ filterTypes: types }),
  setFilterSeverities: (severities: string[]) => set({ filterSeverities: severities }),
  
  clearFilters: () => set({ filterTypes: [], filterSeverities: [] }),
  
  fetchFlagsList: async (merchantId: string) => {
    const flagsList = await merchantService.getMerchantRedFlags(merchantId);
    set({ flagsList });
  }
}));