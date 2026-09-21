import { create } from 'zustand';
import { API } from '@/app/services/axios';

interface BankCreditRating {
  bank_credit_rating: string;
  rating_agency: string;
  rating_date: string;
  rating_type: string;
  source: string;
}

interface RiskMetrics {
  cpv_daily: number;
  tpv_daily: number;
  collateral: number;
  lgd_rate: number;
  add_days: number | null;
  pd_score: number | null;
  recovery_rate_on_default: number;
  risk_segmentation: string | null;
  conglomerate_risk?: string | null;
  moat_market_leadership?: string | null;
  mrm_cpv?: number | null;
  mrm_tpv?: number | null;
  mrm_collateral?: number | null;
  mrm_lgd?: number | null;
  merchant_id?: string;
  bank_credit_ratings?: BankCreditRating[];
}

interface RiskMetricsStore {
  metrics: RiskMetrics | null;
  loading: boolean;
  error: string | null;
  // date is optional and should be an ISO date string (YYYY-MM-DD)
  fetchRiskMetrics: (merchantId: string, versionNo?: number | null, date?: string | null, forceRefresh?: boolean) => Promise<void>;
  updateRiskMetrics: (merchantId: string, updateData: Partial<RiskMetrics>) => Promise<void>;
}


const riskMetricsCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache duration

export const useRiskMetricsStore = create<RiskMetricsStore>((set, get) => ({
  metrics: null,
  loading: false,
  error: null,

  // Create a cache outside the store

  updateRiskMetrics: async (merchantId: string, updateData: Partial<RiskMetrics>) => {
    if (!merchantId) return;
    
    try {
      // Convert field names to metric_type format
      const fieldName = Object.keys(updateData)[0];
      const fieldValue = Object.values(updateData)[0];
      
      // Map field names to metric types
      const metricTypeMap: Record<string, string> = {
        'cpv_daily': 'CPV_DAILY',
        'tpv_daily': 'TPV_DAILY',
        'collateral': 'COLLATERAL'
      };
      
      const payload = {
        metric_type: metricTypeMap[fieldName] || fieldName.toUpperCase(),
        metric_value: fieldValue
      };
      
      const response = await API.post(`/api/v1/credit-insolvency/${merchantId}/editMetrics`, payload);
      
      if (response.data?.success) {
        // Update local state immediately
        const currentMetrics = get().metrics;
        if (currentMetrics) {
          set({ 
            metrics: { ...currentMetrics, ...updateData },
            error: null 
          });
        }
        
        // Refresh from API to ensure consistency. Force a network call to avoid
        // returning stale cached metrics immediately after an update.
        await get().fetchRiskMetrics(merchantId, undefined, undefined, true);
      }
    } catch (error: any) {
      console.error('Risk metrics update error:', error);
      let errorMessage = 'Failed to update risk metrics';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      set({ error: errorMessage });
    }
  },

  // In your store (assuming Zustand)
fetchRiskMetrics: async (merchantId: string, versionNo?: number | null, date?: string | null, forceRefresh?: boolean) => {
  if (!merchantId) return;

  // Create cache key that includes version number and date if provided
  const cacheKey = `${merchantId}` + (versionNo ? `_v${versionNo}` : "") + (date ? `_d${date}` : "");

  // Check cache first (unless caller requested a forced refresh)
  const cached = riskMetricsCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    set({ 
      metrics: cached.data,
      loading: false,
      error: null
    });
    return;
  }

  try {
    set({ loading: true, error: null });
    
    const params: { version_no?: string; date?: string } = {};
    if (versionNo !== null && versionNo !== undefined) {
      params.version_no = versionNo.toString();
    }
    if (date) {
      params.date = date;
    }

    const response = await API.get(`/api/v1/credit-insolvency/${merchantId}/getRiskMetrics`, { params });
      console.debug('[riskMetricsStore] getRiskMetrics response', response?.data);

    if (!response.data?.data) {
      // Fallback to cache if available
      if (cached?.data) {
        set({
          metrics: cached.data,
          loading: false,
          error: 'No fresh data - showing cached metrics'
        });
      } else {
        set({ 
          metrics: null, 
          loading: false, 
          error: 'No risk metrics data available' 
        });
      }
      return;
    }
    
    // Normalize API response to a consistent shape consumed by UI
    const respData = response.data.data || {};
    const normalized: any = { ...respData, merchant_id: merchantId };

    // Some API variants return `final_pd`, others `pd_score`. Normalize both so UI can read either.
    if (respData.final_pd !== undefined && respData.final_pd !== null) {
      normalized.final_pd = respData.final_pd;
      if (normalized.pd_score === undefined || normalized.pd_score === null) {
        normalized.pd_score = respData.final_pd;
      }
    } else if (respData.pd_score !== undefined && respData.pd_score !== null) {
      normalized.pd_score = respData.pd_score;
      if (normalized.final_pd === undefined || normalized.final_pd === null) {
        normalized.final_pd = respData.pd_score;
      }
    }

    // Keep PD values as returned by the API (no conversion).

    // Ensure MRM prefixed fields are present if server returns alternative keys
    if (respData.mrm_lgd !== undefined && (normalized.mrm_lgd === undefined || normalized.mrm_lgd === null)) {
      normalized.mrm_lgd = respData.mrm_lgd;
    }

    // Cache and set state using the normalized object
    riskMetricsCache.set(cacheKey, {
      data: normalized,
      timestamp: Date.now()
    });

    set({ 
      metrics: normalized, 
      loading: false 
    });
    
  } catch (error: any) {
    console.error('Risk metrics fetch error:', error);
    
    // Fallback to cache if available
    if (cached?.data) {
      set({
        metrics: cached.data,
        loading: false,
        error: 'API failed - showing cached metrics'
      });
    } else {
      let errorMessage = 'Failed to fetch risk metrics';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      set({ 
        error: errorMessage, 
        loading: false, 
        metrics: null 
      });
    }
  }
},
  
  // fetchRiskMetrics: async (merchantId: string) => {
  //   if (!merchantId) return;
  //   try {
  //     set({ loading: true, error: null });
  //     const response = await API.get(`/api/v1/credit-insolvency/${merchantId}/getRiskMetrics`);
      
  //     // Check if we have valid data
  //     if (!response.data || !response.data.data) {
  //       set({ 
  //         metrics: null, 
  //         loading: false, 
  //         error: 'No risk metrics data available for this merchant' 
  //       });
  //       return;
  //     }
      
  //     set({ metrics: response.data.data, loading: false });
  //   } catch (error: any) {
  //     console.error('Risk metrics fetch error:', error);
  //     let errorMessage = 'Failed to fetch risk metrics';
      
  //     // Extract more detailed error information if available
  //     if (error.response?.data?.detail) {
  //       errorMessage = `Error: ${error.response.data.detail}`;
  //     } else if (error.message) {
  //       errorMessage = `Error: ${error.message}`;
  //     }
      
  //     set({ error: errorMessage, loading: false, metrics: null });
  //   }
  // },
})); 