import { create } from "zustand";
import { ChargebackCase, chargebackCasesSampleData } from "@/app/pages/Chargebacks/SampleData/CBCasesSampleData";

interface ChargebackCaseStore {
  chargebackCases: ChargebackCase[];
  selectedCaseId: string | null;
  selectedCase: ChargebackCase | null;
  loading: boolean;
  error: string | null;
  fetchChargebackCases: () => Promise<void>;
  setSelectedCaseId: (caseId: string | null) => void;
  clearSelectedCase: () => void;
}

export const useChargebackCaseStore = create<ChargebackCaseStore>((set, get) => ({
  chargebackCases: [],
  selectedCaseId: null,
  selectedCase: null,
  loading: false,
  error: null,
  
  setSelectedCaseId: (caseId: string | null) => {
    const selectedCase = caseId 
      ? get().chargebackCases.find(cbCase => cbCase.caseId === caseId) || null
      : null;
    set({ selectedCaseId: caseId, selectedCase });
  },
    
  clearSelectedCase: () => 
    set({ selectedCase: null, selectedCaseId: null }),
    
  fetchChargebackCases: async () => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call with sample data
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set({ 
        chargebackCases: chargebackCasesSampleData,
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching chargeback cases:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch chargeback cases', 
        loading: false 
      });
    }
  },
}));
