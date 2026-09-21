import { API } from './axios';
import { MerchantItemType } from '@/app/types/merchant';
import { MerchantProfileType } from '@/app/types';
import { cachedRequest } from './requestCache';

const metricCache = new Map<string, any>();

export const merchantService = {
getMerchantList: async (skip: number = 0, limit: number = 500): Promise<MerchantItemType[]> => {
  try {
    const data = await cachedRequest('GET', '/api/v1/users/merchants', { 
      params: { skip, limit } 
    });
    
    // Handle the API response structure and transform to expected format
    if (data && Array.isArray(data)) {
      return data.map((merchant: any) => ({
        id: merchant.merchant_id || merchant.id || '',
        cin: merchant.cin || null,
        legalName: merchant.legal_name || '',
        tradeName: merchant.trade_name || '',
        industry: merchant.industry || undefined,
        createdAt: merchant.created_at || '',
        updatedAt: merchant.updated_at || ''
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching merchant list:', error);
    throw error; // Re-throw to handle in store
  }
},

  // Get detailed merchant data
  getMerchantDetails: async (merchantId: string): Promise<MerchantProfileType> => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}`);
  },

  // from here MerchantInvestigation services
  // Get merchant investigations
  // getMerchantInvestigations: async (merchantId: string) => {
  //   const response = await API.get(`/api/v1/merchants/${merchantId}/investigations`);
  //   return response.data;
  // },

  // Add more endpoints as needed
  getMerchantCompliance: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/compliance`);
  },

  getMerchantFinancials: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/financials`);
  },


  // const metricCache = new Map<string, any>();

  getMerchantKeyMetrics: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/key-metrics`);
  },


  // getMerchantKeyMetrics: async (merchantId: string) => {
  //   const response = await API.get(`/api/v1/merchants/${merchantId}/key-metrics`);
  //   return response.data;
  // },

  getMerchantTransactionMetrics: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/transaction-metrics`);
  },

  // getMerchantTransactionMetrics: async (merchantId: string) => {
  //   const response = await API.get(`/api/v1/merchants/${merchantId}/transaction-metrics`);
  //   return response.data;
  // },

  // get risk assessment
  getMerchantRiskAssessment: async (merchantId: string) => {
    try {
      return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/risk-assessment`);
    } catch (error: any) {
      console.error('Risk assessment fetch error:', error);
      // Create a more informative error object that includes any details from the server
      const errorMessage = error.response?.data?.detail || error.message || 'Error fetching risk assessment';
      
      // Rethrow a more informative error that can be handled by consuming components
      const enhancedError = new Error(errorMessage);
      // Add the original error information
      (enhancedError as any).originalError = error;
      (enhancedError as any).status = error.response?.status;
      
      throw enhancedError;
    }
  },

  getMerchantSummary: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/summary`);
  },


  getMerchantRedFlags: async (merchantId: string, versionNo?: string) => {
    const params: { version_no?: string } = {};
    if (versionNo) {
      params.version_no = versionNo;
    }
    return await cachedRequest('GET', `/api/v1/merchant-red-flags/merchant/${merchantId}`, { params });
  },

  // get merchant red flags
  // getMerchantRedFlags: async (merchantId: string) => {
  //   const response = await API.get(`/api/v1/merchant-red-flags/merchant/${merchantId}`);
  //   return response.data;
  // },

  getMerchantNetwork: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/linkages`);
  },

  getMerchantDigitalInformation: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/digital-information`);
  },

  // from here Activity services
  getMerchantEventTimeline: async (merchantId: string) => {
    const response = await API.get(`/api/v1/merchants/${merchantId}/timeline`);
    return response.data;
  },

  getDocumentsUploaded: async (merchantId: string) => {
    const response = await API.get(`/api/v1/merchants/${merchantId}/documents-uploaded`);
    return response.data;
  },

  getMerchantPaymentChannels: async (merchantId: string) => {
    const response = await API.get(`/api/v1/merchants/${merchantId}/payment-channels`);
    return response.data;
  },

  getMerchantCommunications: async (merchantId: string) => {
    const response = await API.get(`/api/v1/merchants/${merchantId}/communications`);
    return response.data;
  },

  getMerchantTransactions: async (merchantId: string) => {
    const response = await API.get(`/api/v1/merchants/${merchantId}/transactions`);
    return response.data;
  },

  getMerchantPayouts: async (merchantId: string) => {
    const response = await API.get(`/api/v1/merchants/${merchantId}/payouts`);
    return response.data;
  },

//   getMerchantExternalData: async (merchantId: string) => {
//   // Create a unique cache key combining merchantId and product
//   const cacheKey = `${merchantId}:insolvency`;
  
//   // Return cached data if available
//   if (metricCache.has(cacheKey)) {
//     return metricCache.get(cacheKey);
//   }
  
//   // Fetch fresh data if not cached
//   const response = await API.post(`/api/v1/credit-insolvency/getExternalData`, {
//     merchant_id: merchantId,
//     product: "insolvency" // Hardcoded as per your original
//   });
  
//   // Cache the response
//   metricCache.set(cacheKey, response.data);
//   return response.data;
// },

// getMerchantExternalData: async (merchantId: string) => {
//   if (metricCache.has(merchantId)) {
//     return metricCache.get(merchantId);
//   }
  
//   const response = await API.post(`/api/v1/credit-insolvency/getExternalData`, {
//     merchant_id: merchantId,
//     product: "insolvency" // Hardcoded as per your original
//   });
//   return response.data;
//  },

  // External insights data for insolvency analysis
  getMerchantExternalData: async (merchantId: string, date?: string) => {
    const requestBody: { merchant_id: string; product: string; date?: string } = {
      merchant_id: merchantId,
      product: "insolvency"
    };
    
    // Add date to request body if provided (format: YYYY-MM-DD)
    if (date) {
      requestBody.date = date;
    }
    
    return await cachedRequest('POST', `/api/v1/credit-insolvency/getExternalData`, { data: requestBody });
  },
  
  // Get audit report insights data for insolvency analysis

  // Get audit report insights data for insolvency analysis
  getMerchantAuditReportInsights: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/credit-insolvency/${merchantId}/getAuditDisclosures`);
  },


  // getMerchantAuditReportInsights: async (merchantId: string) => {
  //   const response = await API.get(`/api/v1/credit-insolvency/${merchantId}/getFlagsFromAuditorDisclosures`);
  //   return response.data;
  // },

  // Get annual report insights data for insolvency analysis

  // Get annual report insights data for insolvency analysis
  getMerchantAnnualReportInsights: async (merchantId: string) => {
    return await cachedRequest('GET', `/api/v1/credit-insolvency/${merchantId}/getAnnualReportInsights`);
  },


  // getMerchantAnnualReportInsights: async (merchantId: string) => {
  //   const response = await API.get(`/api/v1/credit-insolvency/${merchantId}/getAnnualReportInsights`);
  //   return response.data;
  // },

//   getMerchantFinancialTable: async (merchantId: string) => {
//   if (metricCache.has(merchantId)) {
//     return metricCache.get(merchantId);
//   }
  
//   const response = await API.get(`/api/v1/credit-insolvency/${merchantId}/financialsTable`);
//   metricCache.set(merchantId, response.data);
//   return response.data;
//  },
  
  // Get financial table data for insolvency analysis with caching
  getMerchantFinancialTable: async (merchantId: string, versionNo?: string) => {
    const params: { version_no?: string } = {};
    if (versionNo) {
      params.version_no = versionNo;
    }
    return await cachedRequest('GET', `/api/v1/credit-insolvency/${merchantId}/financialsTable`, { params });
  },

  // Get merchant metrics by year for insolvency analysis
  getMerchantMetricsByYear: async (merchantId: string, versionNo?: string) => {
    const params: { merchant_id: string; version_no?: string } = { merchant_id: merchantId };
    if (versionNo) {
      params.version_no = versionNo;
    }
    return await cachedRequest('GET', `/api/v1/metrics/display-metrics-by-year`, { params });
  },

  // Get merchant versions for insolvency analysis
  getMerchantVersions: async (merchantId: string) => {
    try {
      return await cachedRequest('GET', `/api/v1/credit-insolvency/${merchantId}/versions`);
    } catch (error) {
      console.error('Error fetching merchant versions:', error);
      throw error;
    }
  },

  // Get company metrics for insolvency analysis with version support
  getCompanyMetrics: async (merchantId: string, versionNo?: string) => {
    try {
      const params: { version_no?: string } = {};
      if (versionNo) {
        params.version_no = versionNo;
      }
      return await cachedRequest('GET', `/api/v1/credit-insolvency/${merchantId}/getCompanyMetrics`, { params });
    } catch (error) {
      console.error('Error fetching company metrics:', error);
      throw error;
    }
  },

  // Get risk metrics for insolvency analysis with version support
  getRiskMetrics: async (merchantId: string, versionNo?: string, date?: string) => {
    try {
      const params: { version_no?: string; date?: string } = {};
      if (versionNo) {
        params.version_no = versionNo;
      }
      if (date) {
        params.date = date;
      }
      return await cachedRequest('GET', `/api/v1/credit-insolvency/${merchantId}/getRiskMetrics`, { params });
    } catch (error) {
      console.error('Error fetching risk metrics:', error);
      throw error;
    }
  },

  // Get financial metrics for insolvency analysis with version support
  getMerchantFinancialMetrics: async (merchantId: string, versionNo?: string) => {
    try {
      const params: { version_no?: string } = {};
      if (versionNo) {
        params.version_no = versionNo;
      }
      return await cachedRequest('GET', `/api/v1/merchants/${merchantId}/financial-metrics`, { params });
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      throw error;
    }
  },

  // Edit merchant metrics for insolvency analysis
  editMetrics: async (
    merchantId: string,
    data: {
      cpv_daily: number;
      tpv_daily: number;
      collateral: number;
      date: string;
      version: number;
    }
  ) => {
    try {
      const response = await API.post(
        `/api/v1/credit-insolvency/${merchantId}/editMetrics`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error editing metrics:', error);
      throw error;
    }
  },

  // Delete merchant metrics for insolvency analysis
  deleteMetrics: async (metricId: string) => {
    try {
      const response = await API.delete(
        `/api/v1/credit-insolvency/risk_metrics/${metricId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting metrics:', error);
      throw error;
    }
  },

  // Update risk metrics for insolvency analysis
  updateRiskMetrics: async (
    metricId: string,
    data: {
      cpv: number;
      tpv: number;
      collateral: number;
      lgd: number;
      version_no: number;
    }
  ) => {
    try {
      const response = await API.put(
        `/api/v1/credit-insolvency/risk_metrics/${metricId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating risk metrics:', error);
      throw error;
    }
  },
};
