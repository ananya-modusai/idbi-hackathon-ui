

import { API } from './axios';

export interface Industry {
  industry_id: string;
  industry_name: string;
  risk_segment: string;
  industry_add?: number;
  merchant_count?: number;
  last_updated?: string;
}

export interface MerchantIndustry {
  industry: string;
  risk_segment: string;
  risk_percentage: number;
}

interface IndustryResponse {
  status: boolean;
  message: string;
  data: Industry[];
}

interface MerchantIndustryResponse {
  status: boolean;
  message: string;
  data: MerchantIndustry;
}

export const industryService = {
  // internal cache to store in-flight promises and resolved results per merchant
  _merchantIndustryPromises: new Map<string, Promise<MerchantIndustry | null>>(),
  _merchantIndustryCache: new Map<string, MerchantIndustry | null>(),
  _industryAddPromises: new Map<string, Promise<number | null>>(),
  _industryAddCache: new Map<string, number | null>(),

  // Clears cached data for a merchant or all merchants when no id provided
  clearMerchantIndustryCache: (merchantId?: string) => {
    if (merchantId) {
      industryService._merchantIndustryCache.delete(merchantId);
      industryService._merchantIndustryPromises.delete(merchantId);
      industryService._industryAddCache.delete(merchantId);
      industryService._industryAddPromises.delete(merchantId);
    } else {
      industryService._merchantIndustryCache.clear();
      industryService._merchantIndustryPromises.clear();
      industryService._industryAddCache.clear();
      industryService._industryAddPromises.clear();
    }
  },
  updateIndustryData: async (industryId: string, data: { industry_add: number; risk_segment: string }) => {
    try {
      const response = await API.put(`/api/v1/industries/editIndustryData`, {
        industry_id: industryId,
        risk_segment: data.risk_segment,
        industry_add: data.industry_add
      });
      return {
        success: response.data.status,
        error: !response.data.status ? response.data.message : null,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error updating industry data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  },

  getAllIndustries: async (): Promise<Industry[]> => {
    try {
      const response = await API.get<IndustryResponse>('/api/v1/credit-insolvency/merchants/all_industries');
      if (response.data.status && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching industries:', error);
      return [];
    }
  },

  getMerchantIndustry: (merchantId: string): Promise<MerchantIndustry | null> => {
    // return cached resolved value if present
    if (industryService._merchantIndustryCache.has(merchantId)) {
      return Promise.resolve(industryService._merchantIndustryCache.get(merchantId) || null);
    }

    // if there's an in-flight request, return the same promise
    if (industryService._merchantIndustryPromises.has(merchantId)) {
      return industryService._merchantIndustryPromises.get(merchantId)!;
    }

    // otherwise start the request and store the promise so concurrent callers share it
    const promise = (async () => {
      try {
        const response = await API.get<MerchantIndustryResponse>(`/api/v1/merchants/${merchantId}/industry-risk-segment`);
        if (response.data.status && response.data.data) {
          industryService._merchantIndustryCache.set(merchantId, response.data.data);
          return response.data.data;
        }
        industryService._merchantIndustryCache.set(merchantId, null);
        return null;
      } catch (error) {
        console.error('Error fetching merchant industry:', error);
        industryService._merchantIndustryCache.set(merchantId, null);
        return null;
      } finally {
        // once settled, remove the in-flight promise reference
        industryService._merchantIndustryPromises.delete(merchantId);
      }
    })();

    industryService._merchantIndustryPromises.set(merchantId, promise);
    return promise;
  },

  getIndustryAdd: (merchantId: string): Promise<number | null> => {
    // return cached resolved value if present
    if (industryService._industryAddCache.has(merchantId)) {
      return Promise.resolve(industryService._industryAddCache.get(merchantId) || null);
    }

    // if there's an in-flight request, return the same promise
    if (industryService._industryAddPromises.has(merchantId)) {
      return industryService._industryAddPromises.get(merchantId)!;
    }

    // otherwise start the request and store the promise so concurrent callers share it
    const promise = (async () => {
      try {
        const response = await API.get(`/api/v1/merchants/${merchantId}/industry-add`);
        const addValueRaw = response?.data?.data?.add_data;
        let addValue: number | null = null;
        if (typeof addValueRaw === "number") {
          addValue = addValueRaw;
        } else if (typeof addValueRaw === "string") {
          const parsed = Number(addValueRaw);
          addValue = !isNaN(parsed) ? parsed : null;
        }
        industryService._industryAddCache.set(merchantId, addValue);
        return addValue;
      } catch (error) {
        console.error('Error fetching industry add:', error);
        industryService._industryAddCache.set(merchantId, null);
        return null;
      } finally {
        // once settled, remove the in-flight promise reference
        industryService._industryAddPromises.delete(merchantId);
      }
    })();

    industryService._industryAddPromises.set(merchantId, promise);
    return promise;
  },

  changeMerchantIndustry: async (merchantId: string, data: { industry_id: string }) => {
    try {
      const response = await API.post(`/api/v1/merchants/${merchantId}/changeIndustry`, data);
      return {
        success: response.data.status,
        error: !response.data.status ? response.data.message : null
      };
    } catch (error) {
      console.error('Error changing merchant industry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
