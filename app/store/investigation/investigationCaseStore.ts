import { create } from "zustand";
import { InvestigationCase } from "@/app/pages/Investigation/Sample Data/InvCasesSampleData";
import { fetchRunsBetween, RunBetweenItemDto, fetchRulesSummary, RulesSummaryItemDto } from '@/app/services/caseServices';

export interface DateRange {
  from: string;
  to: string;
}

export interface PortfolioFilters {
  statusSelected: string[];
  riskStatusSelected: string[];
  methodSelected: string[];
  activeSelected: string[];
  periodSelected: string[];
  dateRange: DateRange;
  sortField: string;
  sortDirection: "asc" | "desc";
  searchQuery: string;
}

export interface WatchlistFilters {
  statusSelected: string[];
  riskStatusSelected: string[];
  methodSelected: string[];
  slaSelected: string[];
  periodSelected: string[];
  dateRange: DateRange;
  sortField: string;
  sortDirection: "asc" | "desc";
  searchQuery: string;
}

interface InvestigationCaseStore {
  investigationCases: InvestigationCase[];
  rulesSummaryCases: InvestigationCase[];
  selectedCaseId: string | null;
  selectedCase: InvestigationCase | null;
  loading: boolean;
  rulesSummaryLoading: boolean;
  error: string | null;
  fetchInvestigationCases: (silent?: boolean) => Promise<void>;
  fetchRulesSummaryCases: (limit?: number, silent?: boolean) => Promise<void>;
  setSelectedCaseId: (caseId: string | null) => void;
  setSelectedCase: (caseObj: InvestigationCase | null) => void;
  addOrUpdateCases: (newCases: InvestigationCase[]) => void;
  clearSelectedCase: () => void;
  portfolioFilters: PortfolioFilters;
  watchlistFilters: WatchlistFilters;
  setPortfolioFilters: (filters: Partial<PortfolioFilters>) => void;
  setWatchlistFilters: (filters: Partial<WatchlistFilters>) => void;
}

export const useInvestigationCaseStore = create<InvestigationCaseStore>((set, get) => ({
  investigationCases: [],
  portfolioFilters: {
    statusSelected: [],
    riskStatusSelected: [],
    methodSelected: [],
    activeSelected: ["Yes"],
    periodSelected: ["All"],
    dateRange: { from: "", to: "" },
    sortField: "createdDate",
    sortDirection: "desc",
    searchQuery: "",
  },
  watchlistFilters: {
    statusSelected: [],
    riskStatusSelected: [],
    methodSelected: [],
    slaSelected: [],
    periodSelected: ["All"],
    dateRange: { from: "", to: "" },
    sortField: "createdDate",
    sortDirection: "desc",
    searchQuery: "",
  },
  setPortfolioFilters: (filters) => set((state) => ({
    portfolioFilters: { ...state.portfolioFilters, ...filters }
  })),
  setWatchlistFilters: (filters) => set((state) => ({
    watchlistFilters: { ...state.watchlistFilters, ...filters }
  })),
  rulesSummaryCases: [],
  selectedCaseId: null,
  selectedCase: null,
  loading: false,
  rulesSummaryLoading: false,
  error: null,
  
  setSelectedCaseId: (caseId: string | null) => {
    const selectedCase = caseId 
      ? get().investigationCases.find(invCase => String(invCase.caseId) === String(caseId)) || null
      : null;
    set({ selectedCaseId: caseId, selectedCase });
  },

  setSelectedCase: (caseObj: InvestigationCase | null) => {
    set({ 
      selectedCase: caseObj, 
      selectedCaseId: caseObj ? caseObj.caseId : null 
    });
  },

  addOrUpdateCases: (newCases: InvestigationCase[]) => {
    const currentCases = [...get().investigationCases];
    newCases.forEach(newCase => {
      const idx = currentCases.findIndex(c => String(c.caseId) === String(newCase.caseId));
      if (idx !== -1) {
        currentCases[idx] = { ...currentCases[idx], ...newCase };
      } else {
        currentCases.push(newCase);
      }
    });

    // Also update selectedCase if it was updated in the list
    const selectedId = get().selectedCaseId;
    const updatedSelectedCase = selectedId 
      ? currentCases.find(c => String(c.caseId) === String(selectedId)) || null 
      : null;

    set({ investigationCases: currentCases, selectedCase: updatedSelectedCase });
  },
    
  clearSelectedCase: () => 
    set({ selectedCase: null, selectedCaseId: null }),
    
  fetchInvestigationCases: async (silent = false) => {
    try {
      if (!silent) set({ loading: true, error: null });

      const startDate = "2026-04-15";
      const endDate = new Date().toISOString().split('T')[0];
      const runs = await fetchRunsBetween(startDate, endDate, silent);

      const cases: InvestigationCase[] = runs.map((r: RunBetweenItemDto) => ({
        caseId: r.run.id,
        registeredName: r.merchant.name,
        websiteUrl: r.merchant.website,
        externalMerchantId: r.run.merchant_id,
        lastRunDateTime: r.run.updated_at,
        status: r.run.status,
        brandName: "",
        createdDateTime: r.run.created_at,
        assignedTo: "Me",
        // Keep original data for reference
        ...r
      } as any));

      // If a case is already selected, try to resolve it against the newly
      // fetched list so selectedCase stays consistent.
      const selectedCaseId = get().selectedCaseId;
      const selectedCase = selectedCaseId ? cases.find(c => String(c.caseId) === String(selectedCaseId)) || null : null;

      set({
        investigationCases: cases,
        selectedCase: selectedCase,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching investigation cases:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch investigation cases',
        loading: false,
      });
    }
  },

  fetchRulesSummaryCases: async (limit = 1000, silent = false) => {
    try {
      if (!silent) set({ rulesSummaryLoading: true, error: null });

      // Load runs from 'between' API if not already fetched so we can join risk data by run_id
      let currentCases = get().investigationCases;
      if (currentCases.length === 0) {
        const startDate = "2026-04-15";
        const endDate = new Date().toISOString().split('T')[0];
        const runs = await fetchRunsBetween(startDate, endDate, silent);
        
        currentCases = runs.map((r: RunBetweenItemDto) => ({
          caseId: r.run.id,
          registeredName: r.merchant.name,
          websiteUrl: r.merchant.website,
          externalMerchantId: r.run.merchant_id,
          lastRunDateTime: r.run.updated_at,
          status: r.run.status,
          brandName: "",
          createdDateTime: r.run.created_at,
          assignedTo: "Me",
          ...r
        } as any));
        
        set({ investigationCases: currentCases });
      }

      const items = await fetchRulesSummary(limit, silent);

      const cases: InvestigationCase[] = items.map((r: RulesSummaryItemDto) => {
        const matchedCase = currentCases.find(c => String(c.caseId) === String(r.run_id));
        return {
          ...r,
          caseId: r.run_id,
          registeredName: r.merchant.name,
          websiteUrl: r.merchant.website,
          externalMerchantId: r.merchant_id,
          lastRunDateTime: r.run_updated_at,
          status: r.run_status as any,
          brandName: "",
          createdDateTime: r.run_created_at,
          assignedTo: "Me",
          risk_score: (matchedCase as any)?.risk_score ?? (matchedCase as any)?.riskScore ?? null,
          priority_flag: (matchedCase as any)?.priority_flag ?? null,
          risk_report: (matchedCase as any)?.risk_report ?? null,
          fraud_commentary: (matchedCase as any)?.fraud_commentary ?? (matchedCase as any)?.fraud_commentry ?? null,
          fraud_commentry: (matchedCase as any)?.fraud_commentry ?? (matchedCase as any)?.fraud_commentary ?? null,
          run: (matchedCase as any)?.run ?? null,
        } as any;
      });

      set({
        rulesSummaryCases: cases,
        rulesSummaryLoading: false,
      });
    } catch (error) {
      console.error('Error fetching rules summary cases:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch rules summary cases',
        rulesSummaryLoading: false,
      });
    }
  },
}));

