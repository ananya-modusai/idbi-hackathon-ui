import { API } from './axios';
import { AxiosError } from 'axios';
import { industryService } from './industryServices';

interface APIErrorResponse {
  detail?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface WatchlistItem {
  id: string;
  organization_id: string;
  merchant_id: string;
  is_added_to_watchlist: boolean;
  frequency_to_refresh_probedata: 'Monthly' | 'Weekly' | 'Daily';
  frequency_to_refresh_external_insights: 'Monthly' | 'Weekly' | 'Daily';
  frequency_to_refresh_annual_report: 'Yearly';
  last_updated_date_probedata: string | null;
  last_updated_date_external_insights: string | null;
  last_updated_date_annual_report: string | null;
  is_active: boolean;
  watchlist_added_date: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  industry: string;
  risk_segment: string;
  pd_score: number;
  // Optional computed metrics returned by watchlist API
  cpv_score?: number;
  tpv_score?: number;
  collateral_score?: number;
  lgd_rate?: number;
  industry_add?: number;
  sentiment_score?: number;
  financial_pd_score?: number;
  financial_breakdown?: {
    growth?: number;
    liquidity?: number;
    leverage?: number;
    other?: number;
    raw?: Record<string, unknown>;
  };
  merchant_info: {
    legal_name: string;
    trade_name: string;
    cin: string;
  };
}

export interface AddToWatchlistRequest {
  organization_id: string;
  merchant_id: string;
  frequency_to_refresh_probedata: 'Monthly' | 'Weekly' | 'Daily';
  frequency_to_refresh_external_insights: 'Monthly' | 'Weekly' | 'Daily';
  frequency_to_refresh_annual_report: 'Yearly';
}
// Simple in-memory cache to avoid repeating watchlist API calls.
// Keyed by organizationId. We also keep a map of pending promises so
// concurrent requests for the same org dedupe to a single network call.
const watchlistCache = new Map<string, WatchlistItem[]>();
const watchlistPending = new Map<string, Promise<any>>();

export const watchlistService = {
  // Get merchants in watchlist for an organization
  getOrganizationWatchlist: async (organizationId: string) => {
    // Return cached value if present
    if (watchlistCache.has(organizationId)) {
      return {
        success: true,
        data: watchlistCache.get(organizationId) as WatchlistItem[],
      };
    }

    // If a request is already in-flight for this org, return the same promise
    if (watchlistPending.has(organizationId)) {
      return watchlistPending.get(organizationId);
    }

    const promise = (async () => {
      try {
        const response = await API.get(`/api/v1/watchlist/${organizationId}`);
        const data = response.data as WatchlistItem[];
        // Cache the successful response
        watchlistCache.set(organizationId, data);
        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        const axiosError = error as AxiosError<APIErrorResponse>;
        const errorResponse = axiosError.response?.data;
        const errorMessage =
          errorResponse?.detail || errorResponse?.message || (error as Error).message || 'Failed to fetch watchlist';

        return {
          success: false,
          error: errorMessage,
          errorDetails: errorResponse,
          statusCode: axiosError.response?.status,
        };
      } finally {
        // remove pending entry once resolved (success or fail)
        watchlistPending.delete(organizationId);
      }
    })();

    watchlistPending.set(organizationId, promise);
    return promise;
  },

  addToWatchlist: async (data: AddToWatchlistRequest) => {
    try {
      const response = await API.post('/api/v1/watchlist/add', data);
      // Invalidate cache for the organization so callers will fetch latest data
      try {
        watchlistCache.delete(data.organization_id);
      } catch (e) {
        // ignore
      }
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      const axiosError = error as AxiosError<APIErrorResponse>;
      const errorResponse = axiosError.response?.data;
      const errorMessage = errorResponse?.detail || errorResponse?.message || (error as Error).message || 'Failed to add to watchlist';
      
      return {
        success: false,
        error: errorMessage,
        errorDetails: errorResponse,
        statusCode: axiosError.response?.status
      };
    }
  },

  updateFrequency: async (organizationId: string, merchantId: string, data: {
    frequency_to_refresh_probedata: 'Monthly' | 'Weekly' | 'Daily';
    frequency_to_refresh_external_insights: 'Monthly' | 'Weekly' | 'Daily';
    frequency_to_refresh_annual_report: 'Yearly';
  }) => {
    try {
      const response = await API.put(`/api/v1/watchlist/${organizationId}/${merchantId}/frequency`, data);
      // Invalidate cache for the organization so callers will fetch latest data
      try {
        watchlistCache.delete(organizationId);
      } catch (e) {
        // ignore
      }
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating frequencies:', error);
      const axiosError = error as AxiosError<APIErrorResponse>;
      const errorResponse = axiosError.response?.data;
      const errorMessage = errorResponse?.detail || errorResponse?.message || (error as Error).message || 'Failed to update frequencies';
      
      return {
        success: false,
        error: errorMessage,
        errorDetails: errorResponse,
        statusCode: axiosError.response?.status
      };
    }
  },

  changeMerchantIndustry: async (merchantId: string, data: { industry_id: string }) => {
    try {
      const response = await API.post(`/api/v1/merchants/${merchantId}/changeIndustry`, data);
      // Mutation may affect watchlist entries for multiple orgs; clear entire cache to be safe
      try {
        watchlistCache.clear();
      } catch (e) {
        // ignore
      }
      // Clear in-memory industryService cache for this merchant as well
      try {
        industryService.clearMerchantIndustryCache(merchantId);
      } catch (e) {
        // ignore
      }
      return {
        success: response.data?.status ?? false,
        error: !response.data?.status ? response.data?.message : null,
        data: response.data || null
      };
    } catch (error) {
      console.error('Error changing merchant industry:', error);
      const axiosError = error as AxiosError<APIErrorResponse>;
      const errorResponse = axiosError.response?.data;
      const errorMessage = errorResponse?.detail || errorResponse?.message || (error as Error).message || 'Failed to change industry';
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }
  }
  ,
  // Allow manual invalidation from other code if needed
  invalidateOrganizationWatchlistCache: (organizationId?: string) => {
    if (organizationId) {
      watchlistCache.delete(organizationId);
    } else {
      watchlistCache.clear();
    }
  }
};

// Synchronous cache accessors (useful for components that want to avoid
// triggering an async network call when data may already be available).
export const getCachedOrganizationWatchlist = (
  organizationId: string
): WatchlistItem[] | undefined => {
  return watchlistCache.get(organizationId);
};

export const getCachedWatchlistItem = (
  organizationId: string,
  merchantId: string
): WatchlistItem | undefined => {
  const list = watchlistCache.get(organizationId);
  return list ? list.find((i) => i.merchant_id === merchantId) : undefined;
};
