import { API } from './cuAxios';
import {
  CustomerOverviewData,
  CustomerFinancialData,
  AccountHistoryData,
  LoansData,
  ConnectedUsersData,
  HighLevelStatsResponse,
  LinkageStatsResponse,
  LinkageListResponse,
  CentralityStatsResponse,
  CommunityStatsResponse,
  RecencyStatsResponse,
  CentralityDetailsResponse,
  CommunityDetailsResponse,
  CommunityArtifactItem,
  CommunityArtifactsResponse,
  LinkageMetricsV2Response,
  LinkageArtifactItem,
  LinkageArtifactsResponse,
  LinkageArtifactsData,
  RiskDistributionResponse,
  LinkageStatsGraphResponse,
  RecencyStatsData,
  RecencyDetailsData,
  CentralityStatsData,
  CentralityStatsItem,
} from '@/app/types/customerTypes';

const createEmptyCentralityItem = (): CentralityStatsItem => ({
  CUSTOMER: 0,
  GOV_ID: 0,
  PHONE: 0,
  EMAIL: 0,
  LOCATION: 0,
  DEVICE: 0,
  BANK_ACCOUNT: 0,
  UPI_ID: 0,
  BANK_BRANCH: 0,
  PAN: 0,
  PASSPORT: 0,
  VOTER_ID: 0,
  DRIVING_LICENSE: 0,
  RATION_CARD: 0,
  TELEPHONE: 0,
  ELECTRICITY_BILL: 0,
  CREDIT_CARD: 0,
  DEBIT_CARD: 0,
  OTHER: 0,
});

interface CustomerResponse {
  id: string;
  name: string;
}

export const customerService = {
  getCustomerList: async (page = 1, limit = 200, name?: string, sortBy?: string, sortOrder?: string, force = false, userId?: string, status?: string, cachedStatus?: boolean) => {
    // include name, sortBy, sortOrder, userId, status and cachedStatus in cache key so searches and sorts are cached separately
    const key = `${page}::${limit}::${name ?? ''}::${sortBy ?? ''}::${sortOrder ?? ''}::${userId ?? ''}::${status ?? ''}::${cachedStatus ?? ''}`;
    (customerService.__caches as any).customerList = (customerService.__caches as any).customerList ?? {};
    (customerService.__promiseMaps as any).customerList = (customerService.__promiseMaps as any).customerList ?? {};

    const cache = (customerService.__caches as any).customerList as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).customerList as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) {
      return cache[key];
    }

    if (promises[key]) {
      return promises[key];
    }

    promises[key] = (async () => {
      try {
        const params: Record<string, any> = {
          page,
          limit
        };

        if (userId) {
          params.userId = userId;
        } else if (name) {
          params.name = name;
        }

        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;
        if (status) params.status = status;
        if (cachedStatus !== undefined) params.cachedStatus = cachedStatus;

        const resp: any = await API.get(`/customers`, { params });

        const payload = resp?.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        const wrapper = payload?.data;
        const items: any[] = Array.isArray(wrapper?.data) ? wrapper.data : (Array.isArray(wrapper) ? wrapper : []);

        const mapped = items.map((customer: any) => ({
          value: customer.userid || customer.id || customer.userId || '',
          label: customer.name || customer.basic_details_name || customer.label || '',
          _raw: customer
        }));

        cache[key] = {
          items: mapped,
          metadata: {
            total: wrapper?.total ?? 0,
            page: wrapper?.page ?? page,
            limit: wrapper?.limit ?? limit,
            totalPages: wrapper?.totalPages ?? 1,
            totalHighRiskCount: wrapper?.total_high_risk_count ?? 0,
            totalMediumRiskCount: wrapper?.total_medium_risk_count ?? 0,
            totalLowRiskCount: wrapper?.total_low_risk_count ?? 0,
            totalCachedCount: wrapper?.total_cached_count ?? 0,
            totalUncachedCount: wrapper?.total_uncached_count ?? 0
          }
        };
        return cache[key];
      } catch (err) {
        console.error('[customerService] getCustomerList error', err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  __caches: {},
  __promiseMaps: {},

  getCustomerOverview: async (customerId: string, force = false) => {
    const key = customerId;
    // initialize caches/promiseMaps containers if missing
    (customerService.__caches as any).overview = (customerService.__caches as any).overview ?? {};
    (customerService.__promiseMaps as any).overview = (customerService.__promiseMaps as any).overview ?? {};

    const cache = (customerService.__caches as any).overview as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).overview as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) {
      return cache[key];
    }

    if (promises[key]) {
      return promises[key];
    }

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/${customerId}`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        // If endpoint not present (404) we swallow and store null to avoid noisy logs
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerOverview error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  getCustomerFinancial: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).financial = (customerService.__caches as any).financial ?? {};
    (customerService.__promiseMaps as any).financial = (customerService.__promiseMaps as any).financial ?? {};
    const cache = (customerService.__caches as any).financial as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).financial as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/${customerId}/financial`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerFinancial error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  getCustomerAccountHistory: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).accountHistory = (customerService.__caches as any).accountHistory ?? {};
    (customerService.__promiseMaps as any).accountHistory = (customerService.__promiseMaps as any).accountHistory ?? {};
    const cache = (customerService.__caches as any).accountHistory as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).accountHistory as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/${customerId}/account-history`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerAccountHistory error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  getCustomerLoans: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).loans = (customerService.__caches as any).loans ?? {};
    (customerService.__promiseMaps as any).loans = (customerService.__promiseMaps as any).loans ?? {};
    const cache = (customerService.__caches as any).loans as Record<string, any[] | null>;
    const promises = (customerService.__promiseMaps as any).loans as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/${customerId}/loans`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerLoans error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  getCustomerConnectedUsers: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).connectedUsers = (customerService.__caches as any).connectedUsers ?? {};
    (customerService.__promiseMaps as any).connectedUsers = (customerService.__promiseMaps as any).connectedUsers ?? {};
    const cache = (customerService.__caches as any).connectedUsers as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).connectedUsers as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/${customerId}/connected-users`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerConnectedUsers error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch pincode-analysis for a customer (geographical risk distribution)
  getCustomerPincodeAnalysis: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).pincodeAnalysis = (customerService.__caches as any).pincodeAnalysis ?? {};
    (customerService.__promiseMaps as any).pincodeAnalysis = (customerService.__promiseMaps as any).pincodeAnalysis ?? {};
    const cache = (customerService.__caches as any).pincodeAnalysis as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).pincodeAnalysis as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/${customerId}/pincode-analysis`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerPincodeAnalysis error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch financial news / external insights for a customer
  getCustomerFinancialNewsInsights: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).financialNewsInsights = (customerService.__caches as any).financialNewsInsights ?? {};
    (customerService.__promiseMaps as any).financialNewsInsights = (customerService.__promiseMaps as any).financialNewsInsights ?? {};
    const cache = (customerService.__caches as any).financialNewsInsights as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).financialNewsInsights as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/financial-news-insights/${customerId}`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        // API returns { status, data: { customerId, pincode, insights: [...] } }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerFinancialNewsInsights error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch state-wise DPD metrics: GET /metrics/dpd/state-wise
  getDpdStateWise: async (force = false) => {
    const key = 'metrics::dpd::state-wise';
    (customerService.__caches as any).dpdStateWise = (customerService.__caches as any).dpdStateWise ?? {};
    (customerService.__promiseMaps as any).dpdStateWise = (customerService.__promiseMaps as any).dpdStateWise ?? {};
    const cache = (customerService.__caches as any).dpdStateWise as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).dpdStateWise as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/metrics/dpd/state-wise`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        // API returns wrapper: { status, data: { success, count, data: [...] } }
        const wrapper = payload?.data ?? payload;
        cache[key] = wrapper ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getDpdStateWise error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch account activity / metrics for a customer (bank + credit card + summary table)
  getCustomerMetricsActivity: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).metricsActivity = (customerService.__caches as any).metricsActivity ?? {};
    (customerService.__promiseMaps as any).metricsActivity = (customerService.__promiseMaps as any).metricsActivity ?? {};
    const cache = (customerService.__caches as any).metricsActivity as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).metricsActivity as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/metrics/activity/${customerId}`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerMetricsActivity error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch financial metrics for a customer (EMI burden, CC spend dependence, etc.)
  getCustomerMetricsFinancial: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).metricsFinancial = (customerService.__caches as any).metricsFinancial ?? {};
    (customerService.__promiseMaps as any).metricsFinancial = (customerService.__promiseMaps as any).metricsFinancial ?? {};
    const cache = (customerService.__caches as any).metricsFinancial as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).metricsFinancial as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/metrics/financial/${customerId}`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerMetricsFinancial error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch monthly metrics for a customer for a given type (e.g. 'credit_behaviour')
  getCustomerMetricsMonthly: async (type: string, customerId: string, force = false) => {
    const key = `${type}::${customerId}`;
    (customerService.__caches as any).metricsMonthly = (customerService.__caches as any).metricsMonthly ?? {};
    (customerService.__promiseMaps as any).metricsMonthly = (customerService.__promiseMaps as any).metricsMonthly ?? {};
    const cache = (customerService.__caches as any).metricsMonthly as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).metricsMonthly as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/metrics/monthly/${type}/${customerId}`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? payload;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerMetricsMonthly error for ${type}/${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch bank accounts and credit cards for a customer: GET /overview/{customerId}/accounts-cards
  getCustomerAccountsCards: async (customerId: string, force = false) => {
    const key = customerId;
    (customerService.__caches as any).accountsCards = (customerService.__caches as any).accountsCards ?? {};
    (customerService.__promiseMaps as any).accountsCards = (customerService.__promiseMaps as any).accountsCards ?? {};
    const cache = (customerService.__caches as any).accountsCards as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).accountsCards as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/overview/${customerId}/accounts-cards`);
        const payload: any = response.data;
        // API shape: { status, data: { bankAccounts: [...], creditCards: [...] } }
        const wrapper = payload?.data ?? payload;
        // Normalize to an object containing bankAccounts and creditCards arrays
        const result = wrapper?.data ?? wrapper;
        cache[key] = result ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerAccountsCards error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch ledger/messages for a customer: GET /ledger/{customerId}
  // Returns the messages array (not wrapped) or null on error.
  getCustomerLedger: async (customerId: string, page = 1, limit = 100, force = false) => {
    const key = `${customerId}::ledger::${page}::${limit}`;
    (customerService.__caches as any).ledger = (customerService.__caches as any).ledger ?? {};
    (customerService.__promiseMaps as any).ledger = (customerService.__promiseMaps as any).ledger ?? {};
    const cache = (customerService.__caches as any).ledger as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).ledger as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/ledger/${customerId}`, {
          params: { page, limit }
        });
  const payload: any = response.data;
  // Return the full wrapper (payload.data or payload) so callers can access
  // pagination metadata when available (messages + totalPages etc.).
  const wrapper = payload?.data ?? payload;
  cache[key] = wrapper;
  return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          // swallow 404 and store null
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCustomerLedger error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  getNeptuneLinkages: async (
    customerId: string, 
    degree: number, 
    isStrongConnector: boolean,
    prevDegreeNodeIds: string[] = [],
    limitPerNodeTraversals: number = 20,
    nodeExclusionList: string[] = []
  ) => {
    try {
      const body = {
        degree,
        prev_degree_node_ids: prevDegreeNodeIds,
        limit_per_node_traversals: limitPerNodeTraversals,
        node_exclusion_list: nodeExclusionList,
        is_strong_connector: isStrongConnector
      };

      const response = await API.post(`/neptune/customer-graph/${customerId}/paginated`, body);
      const payload = response?.data as any;
      if (payload?.status === 'failed') {
        return null;
      }
      return payload?.data || payload || null;
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (typeof status === 'number' && status === 404) {
        return null;
      }
      console.error(`[customerService] getNeptuneLinkages error for ${customerId}:`, err);
      return null;
    }
  },

  // Fetch adjacent nodes for a specific node: GET /neptune/adjacent-nodes/{nodeid}
  getNeptuneAdjacentNodes: async (nodeId: string) => {
    try {
      const response = await API.get(`/neptune/adjacent-nodes/${nodeId}`);
      const payload = response?.data as any;
      if (payload?.status === 'failed') {
        return null;
      }
      return payload?.data || payload || null;
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (typeof status === 'number' && status === 404) {
        return null;
      }
      console.error(`[customerService] getNeptuneAdjacentNodes error for ${nodeId}:`, err);
      return null;
    }
  },

  // Fetch loans for multiple users: POST /overview/loans/multiple-users
  getCustomerLoansMultipleUsers: async (userIds: string[], force = false) => {
    const key = userIds.sort().join('::');
    (customerService.__caches as any).loansMultipleUsers = (customerService.__caches as any).loansMultipleUsers ?? {};
    (customerService.__promiseMaps as any).loansMultipleUsers = (customerService.__promiseMaps as any).loansMultipleUsers ?? {};
    const cache = (customerService.__caches as any).loansMultipleUsers as Record<string, any[] | null>;
    const promises = (customerService.__promiseMaps as any).loansMultipleUsers as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.post(`/overview/loans/multiple-users`, {
          userIds: userIds
        });
        const payload: any = response.data;
        if (payload?.status === 'failed') {
          cache[key] = [];
          return [];
        }
        // API returns { status: 'success', data: { loans: [...] } }
        const loans = payload?.data?.loans ?? payload?.loans ?? [];
        cache[key] = Array.isArray(loans) ? loans : [];
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = [];
          return [];
        }
        console.error(`[customerService] getCustomerLoansMultipleUsers error:`, err);
        cache[key] = [];
        return [];
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch loans + network metrics for a set of connected users:
  // POST /overview/loans/network-metrics
  getLoansNetworkMetrics: async (userid: string, degree: number, connectedUserIds: string[], isStrongConnector?: boolean, force = false) => {
    // Build a cache key that is stable for the same logical inputs
    const normalizedIds = Array.isArray(connectedUserIds) ? [...connectedUserIds].map(String).sort() : [];
    const key = `loans::network-metrics::${String(userid)}::${Number(degree) || 0}::${normalizedIds.join('::')}::${isStrongConnector ?? 'default'}`;

    (customerService.__caches as any).loansNetworkMetrics = (customerService.__caches as any).loansNetworkMetrics ?? {};
    (customerService.__promiseMaps as any).loansNetworkMetrics = (customerService.__promiseMaps as any).loansNetworkMetrics ?? {};
    const cache = (customerService.__caches as any).loansNetworkMetrics as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).loansNetworkMetrics as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.post(`/overview/loans/network-metrics`, {
          userid,
          degree,
          connectedUserIds: normalizedIds,
          is_strong_connector: isStrongConnector
        });
        const payload: any = response.data;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        // API returns { status: 'success', data: { loans: [...], metrics: {...} } }
        const wrapper = payload?.data ?? payload;
        cache[key] = wrapper ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getLoansNetworkMetrics error for ${userid}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch high-level stats for the dashboard: GET /user-stats/high-level
  getHighLevelStats: async (force = false) => {
    const key = 'user-stats::high-level';
    (customerService.__caches as any).highLevelStats = (customerService.__caches as any).highLevelStats ?? {};
    (customerService.__promiseMaps as any).highLevelStats = (customerService.__promiseMaps as any).highLevelStats ?? {};
    const cache = (customerService.__caches as any).highLevelStats as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).highLevelStats as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/high-level`);
        const payload = response.data as HighLevelStatsResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getHighLevelStats error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch linkage stats: GET /user-stats/linkage/stats?connectorType=strong|all
  getLinkageStats: async (connectorType: string, force = false) => {
    const key = `user-stats::linkage::${connectorType}`;
    (customerService.__caches as any).linkageStats = (customerService.__caches as any).linkageStats ?? {};
    (customerService.__promiseMaps as any).linkageStats = (customerService.__promiseMaps as any).linkageStats ?? {};
    const cache = (customerService.__caches as any).linkageStats as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).linkageStats as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/linkage/stats`, {
          params: { connectorType }
        });
        const payload = response.data as LinkageStatsResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getLinkageStats error for ${connectorType}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch Linkage Stats Graph
  getLinkageStatsGraph: async (force = false) => {
    const key = `user-stats::linkage-stats::graph`;
    (customerService.__caches as any).linkageStatsGraph = (customerService.__caches as any).linkageStatsGraph ?? {};
    (customerService.__promiseMaps as any).linkageStatsGraph = (customerService.__promiseMaps as any).linkageStatsGraph ?? {};
    const cache = (customerService.__caches as any).linkageStatsGraph as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).linkageStatsGraph as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/linkage-stats/graph`);
        const payload = response.data as LinkageStatsGraphResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getLinkageStatsGraph error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch linkage list: GET /user-stats/linkage/list
  getLinkageList: async (connectorType: string, linkageCategory: string, page = 1, limit = 100, force = false) => {
    const key = `user-stats::linkage::list::${connectorType}::${linkageCategory}::${page}::${limit}`;
    (customerService.__caches as any).linkageList = (customerService.__caches as any).linkageList ?? {};
    (customerService.__promiseMaps as any).linkageList = (customerService.__promiseMaps as any).linkageList ?? {};
    const cache = (customerService.__caches as any).linkageList as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).linkageList as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/linkage/list`, {
          params: { connectorType, linkage_category: linkageCategory, page, limit }
        });
        const payload = response.data as any; // LinkageListResponse
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getLinkageList error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch linkage list v2: GET /user-stats/linkage/list/v2
  getLinkageListV2: async (connectorType: string, linkageCategory: string, page = 1, limit = 100, force = false, userid?: string, name?: string) => {
    const key = `user-stats::linkage::list::v2::${connectorType}::${linkageCategory}::${page}::${limit}::${userid ?? ''}::${name ?? ''}`;
    (customerService.__caches as any).linkageListV2 = (customerService.__caches as any).linkageListV2 ?? {};
    (customerService.__promiseMaps as any).linkageListV2 = (customerService.__promiseMaps as any).linkageListV2 ?? {};
    const cache = (customerService.__caches as any).linkageListV2 as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).linkageListV2 as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const params: Record<string, any> = { connectorType, linkage_category: linkageCategory, page, limit };
        if (userid) params.userid = userid;
        if (name) params.name = name;

        const response = await API.get(`/user-stats/linkage/list/v2`, {
          params
        });
        const payload = response.data as any; // LinkageListResponseV2
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getLinkageListV2 error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch linkage metrics v2: GET /user-stats/linkage/list/v2/metrics
  getLinkageMetricsV2: async (connectorType: string, linkageCategory: string, force = false) => {
    const key = `user-stats::linkage::list::v2::metrics::${connectorType}::${linkageCategory}`;
    (customerService.__caches as any).linkageMetricsV2 = (customerService.__caches as any).linkageMetricsV2 ?? {};
    (customerService.__promiseMaps as any).linkageMetricsV2 = (customerService.__promiseMaps as any).linkageMetricsV2 ?? {};
    const cache = (customerService.__caches as any).linkageMetricsV2 as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).linkageMetricsV2 as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/linkage/list/v2/metrics`, {
          params: { connectorType, linkage_category: linkageCategory }
        });
        const payload = response.data as LinkageMetricsV2Response;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getLinkageMetricsV2 error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch centrality stats: GET /user-stats/centrality/stats?connectorType=strong|all
  getCentralityStats: async (connectorType: string, force = false) => {
    const key = `user-stats::centrality::${connectorType}`;
    (customerService.__caches as any).centralityStats = (customerService.__caches as any).centralityStats ?? {};
    (customerService.__promiseMaps as any).centralityStats = (customerService.__promiseMaps as any).centralityStats ?? {};
    const cache = (customerService.__caches as any).centralityStats as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).centralityStats as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/centrality/stats`, {
          params: { connectorType }
        });
        const payload = response.data as CentralityStatsResponse;
        if (payload?.status === 'failed') {
          const emptyStats: CentralityStatsData = {
            connector_type: connectorType,
            none_centrality: createEmptyCentralityItem(),
            small_centrality: createEmptyCentralityItem(),
            medium_centrality: createEmptyCentralityItem(),
            large_centrality: createEmptyCentralityItem(),
            mega_centrality: createEmptyCentralityItem()
          };
          cache[key] = emptyStats;
          return emptyStats;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const emptyStats: CentralityStatsData = {
          connector_type: connectorType,
          none_centrality: createEmptyCentralityItem(),
          small_centrality: createEmptyCentralityItem(),
          medium_centrality: createEmptyCentralityItem(),
          large_centrality: createEmptyCentralityItem(),
          mega_centrality: createEmptyCentralityItem()
        };
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = emptyStats;
          return emptyStats;
        }
        console.error(`[customerService] getCentralityStats error for ${connectorType}:`, err);
        cache[key] = emptyStats;
        return emptyStats;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch community stats: GET /user-stats/community/stats?communitySize=...&connectorType=...
  getCommunityStats: async (communitySize: string, connectorType: string, force = false) => {
    const key = `user-stats::community::${communitySize}::${connectorType}`;
    (customerService.__caches as any).communityStats = (customerService.__caches as any).communityStats ?? {};
    (customerService.__promiseMaps as any).communityStats = (customerService.__promiseMaps as any).communityStats ?? {};
    const cache = (customerService.__caches as any).communityStats as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).communityStats as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/community/stats`, {
          params: { communitySize, connectorType }
        });
        const payload = response.data as CommunityStatsResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCommunityStats error for ${communitySize}/${connectorType}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch recency stats: GET /user-stats/recency/stats?timeFrame=...
  getRecencyStats: async (timeFrame: string, force = false) => {
    const key = `user-stats::recency::${timeFrame}`;
    (customerService.__caches as any).recencyStats = (customerService.__caches as any).recencyStats ?? {};
    (customerService.__promiseMaps as any).recencyStats = (customerService.__promiseMaps as any).recencyStats ?? {};
    const cache = (customerService.__caches as any).recencyStats as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).recencyStats as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/recency/stats`, {
          params: { timeFrame }
        });
        const payload = response.data as RecencyStatsResponse;
        if (payload?.status === 'failed') {
          const emptyStats: RecencyStatsData = {
            time_frame: timeFrame,
            new_customer_nodes: 0,
            new_loans_count: 0,
            new_loans_amount: 0,
            new_customer_customer_connections: 0
          };
          cache[key] = emptyStats;
          return emptyStats;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const emptyStats: RecencyStatsData = {
          time_frame: timeFrame,
          new_customer_nodes: 0,
          new_loans_count: 0,
          new_loans_amount: 0,
          new_customer_customer_connections: 0
        };
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = emptyStats;
          return emptyStats;
        }
        console.error(`[customerService] getRecencyStats error for ${timeFrame}:`, err);
        cache[key] = emptyStats;
        return emptyStats;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch recency details: GET /user-stats/recency/details?timeFrame=...&page=...&limit=...
  getRecencyDetails: async (timeFrame: string, page = 1, limit = 20, force = false) => {
    const key = `user-stats::recency::details::${timeFrame}::${page}::${limit}`;
    (customerService.__caches as any).recencyDetails = (customerService.__caches as any).recencyDetails ?? {};
    (customerService.__promiseMaps as any).recencyDetails = (customerService.__promiseMaps as any).recencyDetails ?? {};
    const cache = (customerService.__caches as any).recencyDetails as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).recencyDetails as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/recency/details`, {
          params: { timeFrame, page, limit }
        });
        const payload = response.data as any; // RecencyDetailsResponse
        if (payload?.status === 'failed') {
          const emptyDetails: RecencyDetailsData = {
            time_frame: timeFrame,
            base_date: new Date().toISOString().split('T')[0],
            window_start: '',
            window_end: '',
            page: page,
            limit: limit,
            total_count: 0,
            total_pages: 0,
            data: []
          };
          cache[key] = emptyDetails;
          return emptyDetails;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const emptyDetails: RecencyDetailsData = {
          time_frame: timeFrame,
          base_date: new Date().toISOString().split('T')[0],
          window_start: '',
          window_end: '',
          page: page,
          limit: limit,
          total_count: 0,
          total_pages: 0,
          data: []
        };
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = emptyDetails;
          return emptyDetails;
        }
        console.error(`[customerService] getRecencyDetails error for ${timeFrame}:`, err);
        cache[key] = emptyDetails;
        return emptyDetails;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },


  // Fetch centrality details: GET /user-stats/centrality/details
  getCentralityDetails: async (connectorType: string, centralityTier: string, nodeType: string, page = 1, limit = 100, force = false) => {
    const key = `user-stats::centrality::details::${connectorType}::${centralityTier}::${nodeType}::${page}::${limit}`;
    (customerService.__caches as any).centralityDetails = (customerService.__caches as any).centralityDetails ?? {};
    (customerService.__promiseMaps as any).centralityDetails = (customerService.__promiseMaps as any).centralityDetails ?? {};
    const cache = (customerService.__caches as any).centralityDetails as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).centralityDetails as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/centrality/details`, {
          params: { connectorType, centralityTier, nodeType, page, limit }
        });
        const payload = response.data as CentralityDetailsResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCentralityDetails error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch community details: GET /user-stats/community/details
  getCommunityDetails: async (communitySize: string, connectorType: string, page = 1, limit = 100, force = false) => {
    const key = `user-stats::community::details::${communitySize}::${connectorType}::${page}::${limit}`;
    (customerService.__caches as any).communityDetails = (customerService.__caches as any).communityDetails ?? {};
    (customerService.__promiseMaps as any).communityDetails = (customerService.__promiseMaps as any).communityDetails ?? {};
    const cache = (customerService.__caches as any).communityDetails as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).communityDetails as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/community/details`, {
          params: { communitySize, connectorType, page, limit }
        });
        const payload = response.data as CommunityDetailsResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCommunityDetails error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch community artifacts (members of a community): GET /user-stats/community/artifacts
  // Now accepts optional page and limit params to support pagination on the backend.
  getCommunityArtifacts: async (communityId: string, page = 1, limit = 100, force = false) => {
    const key = `user-stats::community::artifacts::${communityId}::${page}::${limit}`;
    (customerService.__caches as any).communityArtifacts = (customerService.__caches as any).communityArtifacts ?? {};
    (customerService.__promiseMaps as any).communityArtifacts = (customerService.__promiseMaps as any).communityArtifacts ?? {};
    const cache = (customerService.__caches as any).communityArtifacts as Record<string, CommunityArtifactItem[] | null>;
    const promises = (customerService.__promiseMaps as any).communityArtifacts as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/community/artifacts`, {
          params: { communityId, page, limit }
        });
        const payload = response.data as any;

        // Normalise a few common API shapes to always return an array of CommunityArtifactItem
        // Acceptable shapes:
        //  - response.data is an array
        //  - response.data.data is an array
        //  - response.data.items is an array
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }

        let items: any = null;
        if (Array.isArray(payload)) items = payload;
        else if (Array.isArray(payload?.data)) items = payload.data;
        else if (Array.isArray(payload?.data?.data)) items = payload.data.data;
        else if (Array.isArray(payload?.items)) items = payload.items;
        else if (Array.isArray(payload?.data?.items)) items = payload.data.items;
        else items = null;

        cache[key] = items ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getCommunityArtifacts error for ${communityId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Fetch linkage artifacts: GET /user-stats/linkage/list/v2/artifacts
  getLinkageArtifacts: async (customerId: string, connectorType: string, linkageType: string, page = 1, limit = 100, force = false) => {
    const key = `user-stats::linkage::artifacts::${customerId}::${connectorType}::${linkageType}::${page}::${limit}`;
    (customerService.__caches as any).linkageArtifacts = (customerService.__caches as any).linkageArtifacts ?? {};
    (customerService.__promiseMaps as any).linkageArtifacts = (customerService.__promiseMaps as any).linkageArtifacts ?? {};
    const cache = (customerService.__caches as any).linkageArtifacts as Record<string, LinkageArtifactsData | null>;
    const promises = (customerService.__promiseMaps as any).linkageArtifacts as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/user-stats/linkage/list/v2/artifacts`, {
          params: { customerId, connectorType, linkageType, page, limit }
        });
        const payload = response.data as LinkageArtifactsResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        const wrapper = payload?.data;
        // Normalize to LinkageArtifactsData structure even if it's a flat array
        cache[key] = Array.isArray(wrapper) 
          ? { data: wrapper, total_count: wrapper.length, page: 1, limit: wrapper.length, total_pages: 1 } as LinkageArtifactsData 
          : wrapper ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getLinkageArtifacts error for ${customerId}:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch risk distribution data: GET /user-stats/risk-distribution
  getRiskDistribution: async (force = false) => {
    const key = 'user-stats::risk-distribution';
    (customerService.__caches as any).riskDistribution = (customerService.__caches as any).riskDistribution ?? {};
    (customerService.__promiseMaps as any).riskDistribution = (customerService.__promiseMaps as any).riskDistribution ?? {};
    const cache = (customerService.__caches as any).riskDistribution as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).riskDistribution as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get('/user-stats/risk-distribution');
        const payload = response.data as RiskDistributionResponse;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error('[customerService] getRiskDistribution error:', err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },
  // Fetch blacklisted nodes: GET /black-listed-nodes
  getBlacklistedNodes: async (force = false) => {
    const key = 'black-listed-nodes';
    (customerService.__caches as any).blacklistedNodes = (customerService.__caches as any).blacklistedNodes ?? {};
    (customerService.__promiseMaps as any).blacklistedNodes = (customerService.__promiseMaps as any).blacklistedNodes ?? {};
    const cache = (customerService.__caches as any).blacklistedNodes as Record<string, any | null>;
    const promises = (customerService.__promiseMaps as any).blacklistedNodes as Record<string, Promise<any> | null>;

    if (!force && cache[key] !== undefined) return cache[key];
    if (promises[key]) return promises[key];

    promises[key] = (async () => {
      try {
        const response = await API.get(`/black-listed-nodes`);
        const payload = response.data as any;
        if (payload?.status === 'failed') {
          cache[key] = null;
          return null;
        }
        cache[key] = payload?.data ?? null;
        return cache[key];
      } catch (err) {
        const status = (err as any)?.response?.status;
        if (typeof status === 'number' && status === 404) {
          cache[key] = null;
          return null;
        }
        console.error(`[customerService] getBlacklistedNodes error:`, err);
        cache[key] = null;
        return null;
      } finally {
        promises[key] = null;
      }
    })();

    return promises[key];
  },

  // Delete node with edges: DELETE /neptune/vertex/{id}/with-edges
  deleteNodeWithEdges: async (nodeId: string) => {
    try {
      const response = await API.delete(`/neptune/vertex/${nodeId}/with-edges`);
      return response.data;
    } catch (err) {
      console.error(`[customerService] deleteNodeWithEdges error for ${nodeId}:`, err);
      throw err;
    }
  },

  // Blacklist node: POST /black-listed-nodes/{id}
  blacklistNode: async (nodeId: string) => {
    try {
      const response = await API.post(`/black-listed-nodes/${nodeId}`);
      return response.data;
    } catch (err) {
      console.error(`[customerService] blacklistNode error for ${nodeId}:`, err);
      throw err;
    }
  },

  // Patch blacklisted node status: PATCH /black-listed-nodes/{id}
  patchBlacklistedNode: async (nodeId: string, status: string) => {
    try {
      const response = await API.patch(`/black-listed-nodes/${nodeId}`, {
        blacklist_status: status.toLowerCase()
      });
      return response.data;
    } catch (err) {
      console.error(`[customerService] patchBlacklistedNode error for ${nodeId}:`, err);
      throw err;
    }
  }
};
