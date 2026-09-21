import { API } from "./axios";

// Helper to log API errors but ignore 404 Not Found
const logApiError = (message: string, error: unknown) => {
  if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    const response = errObj["response"];
    if (response && typeof response === "object") {
      const resp = response as Record<string, unknown>;
      const status = resp["status"];
      if (typeof status === "number" && status === 404) {
        return; // ignore 404
      }
    }
  }

  console.error(message, error);
};

// ------------------------------------------------------------------
// Shared helpers: base URL builder and a simple in-memory request cache
// - INVESTIGATION_BASE is computed once from env vars and trimmed of trailing slashes
// - buildCaseUrl / buildCollectionUrl centralize the URL construction
// - cachedGet memoizes in-flight and resolved requests by a key (usually the full URL)
//   so multiple callers can share the same Promise and avoid duplicate network calls.
// - clearCache allows manual invalidation (all or a single key).
// Note: cache only stores the Promise; failed requests remove the cache entry so callers
// can retry.
const INVESTIGATION_BASE = (
  process.env.NEXT_PUBLIC_INVESTIGATION_API_URL || ""
).replace(/\/+$/g, "");

const buildCaseUrl = (caseId: string, suffix: string) => {
  const cleanSuffix = String(suffix || "").replace(/^\/+/, "");
  return INVESTIGATION_BASE
    ? `${INVESTIGATION_BASE}/api/v1/cases/${caseId}/${cleanSuffix}`
    : `/api/v1/cases/${caseId}/${cleanSuffix}`;
};

const buildCollectionUrl = (suffix: string) => {
  const cleanSuffix = String(suffix || "").replace(/^\/+/, "");
  return INVESTIGATION_BASE
    ? `${INVESTIGATION_BASE}/api/v1/${cleanSuffix}`
    : `/api/v1/${cleanSuffix}`;
};

const buildDirectUrl = (suffix: string) => {
  const cleanSuffix = String(suffix || "").replace(/^\/+/, "");
  return INVESTIGATION_BASE
    ? `${INVESTIGATION_BASE}/${cleanSuffix}`
    : `/${cleanSuffix}`;
};

const requestCache = new Map<string, Promise<any>>();

const cachedGet = async <T>(key: string, fn: () => Promise<T>, forceRefresh = false): Promise<T> => {
  if (forceRefresh) {
    requestCache.delete(key);
  }
  if (requestCache.has(key)) {
    return requestCache.get(key) as Promise<T>;
  }

  const p = fn()
    .then((res) => res)
    .catch((err) => {
      // remove failed promise so subsequent calls can retry
      requestCache.delete(key);
      throw err;
    });

  requestCache.set(key, p);
  return p;
};

export const clearCache = (key?: string) => {
  if (key) requestCache.delete(key);
  else requestCache.clear();
};

/**
 * Minimal shape for an investigation case returned by the API.
 * Keep this local and lightweight to avoid coupling; callers may already
 * import a richer type from UI sample-data files.
 */
export interface InvestigationCaseDto {
  caseId: string;
  caseTitle?: string;
  registeredName?: string;
  brandName?: string;
  createdDateTime?: string;
  status?: string;
  assignedTo?: string;
  externalMerchantId?: string;
  lastRunDateTime?: string;
  [key: string]: any;
}

export interface RunDto {
  id: string;
  merchant_id: string;
  status: string;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantDto {
  id: string;
  name: string;
  website: string;
  gstn?: string | null;
  vpa_ids?: string[] | null;
  mcc_code?: string | null;
  business_category?: string | null;
  business_sub_category?: string | null;
  mobile?: string[] | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RunBetweenItemDto {
  run: RunDto;
  merchant: MerchantDto;
  risk_score: number | null;
}

// --- Merchant Details APIs ---

export interface MerchantDetailSourceData {
  [key: string]: string | string[] | null;
}

export interface MerchantDetailsApiResponse<T = MerchantDetailSourceData> {
  success: boolean;
  message: string;
  data: {
    onboarding_data: T;
    website: T;
    probe_data: T;
  };
}

export interface BusinessIdentityData {
  "Trade / Business Name / Brand Name": string;
  "Legal Name": string;
  "URLs": string;
  "Name in URL": string;
  "Type of Entity": string;
}

export interface BusinessClassificationData {
  mcc: string;
  industry: string;
  segment: string;
  lob: string;
}

export interface RegistrationDetailsData {
  pan: string;
  cin: string;
  gstn: string;
  din: string;
}

export interface AddressDetailsData {
  registered_address: string;
  business_address: string | string[];
}

export interface ContactDetailsData {
  email: string | string[];
  phone: string | string[];
}

export interface KeyPersonnelData {
  owner: string | string[];
  director: string | string[];
}

/**
 * Fetch investigation cases from the backend.
 * Endpoint: GET /api/v1/cases/
 * Returns the array of cases (handles both { cases: [...] } and [...] shapes).
 */
export const fetchCases = async (): Promise<InvestigationCaseDto[]> => {
  try {
    const url = buildCollectionUrl("cases/");

    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    if (!data) return [];

    // Common shapes: { cases: [...] } or [...]
    if (Array.isArray(data)) return data as InvestigationCaseDto[];

    if (data && Array.isArray((data as any).cases))
      return (data as any).cases as InvestigationCaseDto[];

    // Unexpected shape: return empty list and log
    console.warn(
      "[caseServices] fetchCases returned unexpected payload shape",
      data
    );
    return [];
  } catch (error) {
    logApiError("[caseServices] Error fetching cases:", error);
    return [];
  }
};

/**
 * Fetch runs between start and end date.
 * Endpoint: GET /api/v1/run/between
 */
export const fetchRunsBetween = async (
  startDate: string,
  endDate: string,
  forceRefresh = false
): Promise<RunBetweenItemDto[]> => {
  try {
    const cleanSuffix = "run/between";
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/${cleanSuffix}?start_date=${startDate}&end_date=${endDate}`
      : `/${cleanSuffix}?start_date=${startDate}&end_date=${endDate}`;

    const data = await cachedGet(url, async () => {
      const response = await API.get(INVESTIGATION_BASE ? `${INVESTIGATION_BASE}/${cleanSuffix}` : `/${cleanSuffix}`, {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response.data;
    }, forceRefresh);

    if (data && data.success && Array.isArray(data.data)) {
      return data.data as RunBetweenItemDto[];
    }

    return [];
  } catch (error) {
    logApiError("[caseServices] Error fetching runs between:", error);
    return [];
  }
};

export interface AllRunsDetailsItemDto {
  run: RunDto;
  merchant: MerchantDto;
  datastore: any[];
}

export interface AllRunsDetailsApiResponse {
  success: boolean;
  message: string;
  data: AllRunsDetailsItemDto[];
}

/**
 * Fetch all runs details including merchant and datastore (metric) data.
 * Endpoint: GET /merchant_details/all-runs-details
 */
export const fetchAllRunsDetails = async (
  limit: number = 100
): Promise<AllRunsDetailsItemDto[]> => {
  try {
    const cleanSuffix = "merchant_details/all-runs-details";
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/${cleanSuffix}?limit=${limit}`
      : `/${cleanSuffix}?limit=${limit}`;

    const data = await cachedGet(url, async () => {
      const response = await API.get(INVESTIGATION_BASE ? `${INVESTIGATION_BASE}/${cleanSuffix}` : `/${cleanSuffix}`, {
        params: {
          limit,
        },
      });
      return response.data;
    });

    if (data && data.success && Array.isArray(data.data)) {
      return data.data as AllRunsDetailsItemDto[];
    }

    return [];
  } catch (error) {
    logApiError("[caseServices] Error fetching all runs details:", error);
    return [];
  }
};

export interface RuleTriggerDetail {
  step_name: string;
  status: string;
  overall_triggered: string | null;
  category: string | null;
  manual_review: string | null;
  label: string | null;
  updated_at: string;
}

export interface RulesSummaryItemDto {
  run_id: string;
  merchant_id: string;
  run_status: string;
  run_created_at: string;
  run_updated_at: string;
  merchant: {
    id: string;
    name: string;
    website: string;
    mcc_code?: string | null;
    business_category?: string | null;
    business_sub_category?: string | null;
  };
  rules: Record<string, RuleTriggerDetail>;
}

export interface RulesSummaryApiResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    items: RulesSummaryItemDto[];
  };
}

/**
 * Fetch rules summary for all runs.
 * Endpoint: GET /run/rules-summary
 */
export const fetchRulesSummary = async (
  limit: number = 1000,
  forceRefresh = false
): Promise<RulesSummaryItemDto[]> => {
  try {
    const cleanSuffix = "run/rules-summary";
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/${cleanSuffix}?limit=${limit}`
      : `/${cleanSuffix}?limit=${limit}`;

    const data = await cachedGet(url, async () => {
      const response = await API.get(INVESTIGATION_BASE ? `${INVESTIGATION_BASE}/${cleanSuffix}` : `/${cleanSuffix}`, {
        params: {
          limit,
        },
      });
      return response.data;
    }, forceRefresh);

    if (data && data.success && data.data && Array.isArray(data.data.items)) {
      return data.data.items as RulesSummaryItemDto[];
    }

    return [];
  } catch (error) {
    logApiError("[caseServices] Error fetching rules summary:", error);
    return [];
  }
};


/**
 * Fetch three-way-match analysis for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/three-way-match
 */
export interface ThreeWayMatchApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[];
  redFlags?: any[];
  [key: string]: any;
}

export const fetchThreeWayMatch = async (
  caseId: string
): Promise<ThreeWayMatchApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "three-way-match");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as ThreeWayMatchApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching three-way-match for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch external insights for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/external-insights
 */
export interface ExternalInsightsApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // topic/summary entries
  redFlags?: any[];
  [key: string]: any;
}

export const fetchExternalInsights = async (
  caseId: string
): Promise<ExternalInsightsApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "external-insights");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as ExternalInsightsApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching external-insights for ${caseId}:`,
      error
    );
    return null;
  }
};


/**
 * Fetch web-analysis data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/web-analysis
 * Example response shapes vary; return raw payload and let callers interpret.
 */
export interface WebAnalysisApiResponse {
  caseId?: string;
  data?: any;
  [key: string]: any;
}

export const fetchWebAnalysis = async (
  caseId: string
): Promise<WebAnalysisApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "web-analysis");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as WebAnalysisApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching web-analysis for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch key metrics for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/key-metrics
 * Returns the raw payload (may be { data: { ... } } or an object directly).
 */
export interface CaseKeyMetricsApiResponse {
  caseId?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

export const fetchCaseKeyMetrics = async (
  caseId: string
): Promise<CaseKeyMetricsApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "key-metrics");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as CaseKeyMetricsApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching key-metrics for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch domain information data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/domain-information
 */
export interface DomainInformationApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // domain information key/value rows
  redFlags?: any[];
  [key: string]: any;
}

export const fetchDomainInformation = async (
  caseId: string
): Promise<DomainInformationApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "domain-information");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as DomainInformationApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching domain-information for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch navigation flow data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/navigation-flow
 */
export interface NavigationFlowApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // navigation flow key/value rows
  redFlags?: any[];
  [key: string]: any;
}

export const fetchNavigationFlow = async (
  caseId: string
): Promise<NavigationFlowApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "navigation-flow");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as NavigationFlowApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching navigation-flow for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch policy data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/policies
 */
export interface PoliciesApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // policy rows with nested fields
  redFlags?: any[];
  [key: string]: any;
}

export const fetchPolicies = async (
  caseId: string
): Promise<PoliciesApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "policies");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as PoliciesApiResponse;
  } catch (error) {
    logApiError(`[caseServices] Error fetching policies for ${caseId}:`, error);
    return null;
  }
};
/**
 * Fetch content analysis data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/content-analysis
 */
export interface ContentAnalysisApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // content analysis key/value rows
  redFlags?: any[];
  [key: string]: any;
}

export const fetchContentAnalysis = async (
  caseId: string
): Promise<ContentAnalysisApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "content-analysis");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as ContentAnalysisApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching content-analysis for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch transaction statistics for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-statistics
 */
export interface TransactionStatisticsRow {
  rowLabel: string;
  keyIcon?: string;
  keyIconColor?: string;
  lifetime?: Record<string, string>;
  past30d?: Record<string, string>;
  past7d?: Record<string, string>;
  past1d?: Record<string, string>;
  [key: string]: any;
}

export interface TransactionStatisticsApiResponse {
  caseId: string;
  data?: TransactionStatisticsRow[];
}

export const fetchTransactionStatistics = async (
  caseId: string
): Promise<TransactionStatisticsApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "transaction-statistics");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionStatisticsApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-statistics for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch products & pricing data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/products-pricing
 */
export interface ProductsPricingApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // products & pricing key/value rows
  redFlags?: any[];
  [key: string]: any;
}

export const fetchProductsPricing = async (
  caseId: string
): Promise<ProductsPricingApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "products-pricing");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as ProductsPricingApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching products-pricing for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch contact & social data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/contact-social
 */
export interface ContactSocialApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // contact/social key/value rows
  redFlags?: any[];
  [key: string]: any;
}

export const fetchContactSocial = async (
  caseId: string
): Promise<ContactSocialApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "contact-social");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as ContactSocialApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching contact-social for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch volume analysis data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/volume-analysis
 */
export interface VolumeAnalysisApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // rows like Total Count / Total Amount with lifetime/past30d/past7d/past1d
  metrics?: any | null;
  redFlags?: any[];
  [key: string]: any;
}

export const fetchVolumeAnalysis = async (
  caseId: string
): Promise<VolumeAnalysisApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "volume-analysis");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as VolumeAnalysisApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching volume-analysis for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch Merchant Details - Business Identity Overview
 * Endpoint: GET /merchant_details/business-identity-overview/{run_id}
 */
export const fetchBusinessIdentityOverview = async (
  runId: string
): Promise<MerchantDetailsApiResponse<BusinessIdentityData> | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/business-identity-overview/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching business-identity-overview for ${runId}:`, error);
    return null;
  }
};

/**
 * Fetch Merchant Details - Business Classification
 * Endpoint: GET /merchant_details/business-classification/{run_id}
 */
export const fetchBusinessClassification = async (
  runId: string
): Promise<MerchantDetailsApiResponse<BusinessClassificationData> | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/business-classification/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching business-classification for ${runId}:`, error);
    return null;
  }
};

/**
 * Fetch Merchant Details - Registration Details
 * Endpoint: GET /merchant_details/registration-details/${runId}
 */
export const fetchRegistrationDetails = async (
  runId: string
): Promise<MerchantDetailsApiResponse<RegistrationDetailsData> | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/registration-details/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching registration-details for ${runId}:`, error);
    return null;
  }
};

/**
 * Fetch Merchant Details - Address Details
 * Endpoint: GET /merchant_details/address-details/${runId}
 */
export const fetchAddressDetails = async (
  runId: string
): Promise<MerchantDetailsApiResponse<AddressDetailsData> | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/address-details/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching address-details for ${runId}:`, error);
    return null;
  }
};

/**
 * Fetch Merchant Details - Contact Details
 * Endpoint: GET /merchant_details/contact-details/${runId}
 */
export const fetchContactDetails = async (
  runId: string
): Promise<MerchantDetailsApiResponse<ContactDetailsData> | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/contact-details/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching contact-details for ${runId}:`, error);
    return null;
  }
};

/**
 * Fetch Merchant Details - Key Personnel
 * Endpoint: GET /merchant_details/key-personnel/${runId}
 */
export const fetchKeyPersonnel = async (
  runId: string
): Promise<MerchantDetailsApiResponse<KeyPersonnelData> | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/key-personnel/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching key-personnel for ${runId}:`, error);
    return null;
  }
};

export interface MerchantWebAnalysisData {
  language_support: string | null;
  website_certificate: {
    final_url: string;
    status_code: number;
    https_enabled: boolean;
    response_time: string;
    ssl_certificate_valid: boolean;
  };
  copyright_line: string | null;
  is_sub_domain: boolean;
}

export interface MerchantWebAnalysisResponse {
  success: boolean;
  message: string;
  data: MerchantWebAnalysisData;
}

/**
 * Fetch Merchant Details - Web Analysis
 * Endpoint: GET /merchant_details/web-analysis/{run_id}
 */
export const fetchMerchantWebAnalysis = async (
  runId: string
): Promise<MerchantWebAnalysisResponse | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/web-analysis/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching web-analysis for ${runId}:`, error);
    return null;
  }
};
/**
 * Fetch transaction status data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-status
 */
export interface TransactionStatusApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // rows with lifetime/past30d/past7d/past1d each containing allTxn/succTxn/unsuccTxn
  redFlags?: any[];
  [key: string]: any;
}

export const fetchTransactionStatus = async (
  caseId: string
): Promise<TransactionStatusApiResponse | null> => {
  if (!caseId) return null;
  try {
    // Use the more detailed breakdown endpoint which returns per-status lifetime/past30d/past7d/past1d
    // (replaced previous `transaction-status` endpoint with `transaction-status-breakdown`)
    const url = buildCaseUrl(caseId, "transaction-status-breakdown");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionStatusApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-status for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch transaction mode data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-mode-breakdown
 */
export interface TransactionModeApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // rows similar to other transaction analysis sections
  redFlags?: any[];
  [key: string]: any;
}

export const fetchTransactionMode = async (
  caseId: string
): Promise<TransactionModeApiResponse | null> => {
  if (!caseId) return null;
  try {
    // Use the more detailed breakdown endpoint which returns per-mode lifetime/past30d/past7d/past1d
    const url = buildCaseUrl(caseId, "transaction-mode-breakdown");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionModeApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-mode for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch VPA analysis data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/vpa-analysis
 */
export interface VpaAnalysisApiResponse {
  caseId: string;
  vpaAnalysis: {
    overall_label: string;
    overall_summary: string;
    vpa_results: Array<{
      subrule?: string;
      reasoning?: string;
      triggered?: boolean;
      flags?: string[];
      details?: any;
    }>;
  };
  merchantUpiIds?: string[];
}

export const fetchVpaAnalysis = async (
  caseId: string
): Promise<VpaAnalysisApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "vpa-analysis");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as VpaAnalysisApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching vpa-analysis for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch transaction currency data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-currency
 */
export interface TransactionCurrencyApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[];
  redFlags?: any[];
  [key: string]: any;
}

export const fetchTransactionCurrency = async (
  caseId: string
): Promise<TransactionCurrencyApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "transaction-currency");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionCurrencyApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-currency for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch transaction gateway data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-gateway-breakdown
 */
export interface TransactionGatewayApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[];
  redFlags?: any[];
  [key: string]: any;
}

export const fetchTransactionGateway = async (
  caseId: string
): Promise<TransactionGatewayApiResponse | null> => {
  if (!caseId) return null;
  try {
    // Use the more detailed breakdown endpoint which returns per-gateway lifetime/past30d/past7d/past1d
    const url = buildCaseUrl(caseId, "transaction-gateway-breakdown");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionGatewayApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-gateway for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch transaction time data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-time
 */
export interface TransactionTimeApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[];
  redFlags?: any[];
  [key: string]: any;
}

export const fetchTransactionTime = async (
  caseId: string
): Promise<TransactionTimeApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "transaction-time");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionTimeApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-time for ${caseId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch transaction proxy data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-proxy
 */
export interface TransactionProxyApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[];
  redFlags?: any[];
  [key: string]: any;
}

export const fetchTransactionProxy = async (
  caseId: string
): Promise<TransactionProxyApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "transaction-proxy");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionProxyApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-proxy for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch transaction ledger (paginated) for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-ledger?limit=&offset=
 * Returns shape: { items: [...], total, limit, offset }
 */
export interface TransactionLedgerApiResponse {
  caseId?: string;
  items?: any[];
  total?: number;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

export const fetchTransactionLedger = async (
  caseId: string,
  params?: { limit?: number; offset?: number }
): Promise<TransactionLedgerApiResponse | null> => {
  if (!caseId) return null;
  try {
    const suffix = `transaction-ledger`;
    const url =
      buildCaseUrl(caseId, suffix) +
      (params
        ? `?${new URLSearchParams(
          Object.entries(params).reduce((acc: any, [k, v]) => {
            if (typeof v !== "undefined") acc[k] = String(v);
            return acc;
          }, {})
        ).toString()}`
        : "");

    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionLedgerApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-ledger for ${caseId}:`,
      error
    );
    return null;
  }
};
/**
 * Fetch transaction region data for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/transaction-region
 */
export interface TransactionRegionApiResponse {
  caseId: string;
  analysisCategory?: string;
  data?: any[]; // rows similar to other transaction analysis sections
  redFlags?: any[];
  [key: string]: any;
}

export const fetchTransactionRegion = async (
  caseId: string
): Promise<TransactionRegionApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "transaction-region");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as TransactionRegionApiResponse;
  } catch (error) {
    logApiError(
      `[caseServices] Error fetching transaction-region for ${caseId}:`,
      error
    );
    return null;
  }
};


export interface StepDto {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DatastoreEntryApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    run_id: string;
    step_id: string;
    step_name: string;
    status: string;
    data: {
      platforms: {
        [key: string]: {
          source?: string;
          platform?: string;
          not_found?: boolean;
          found?: boolean;
          reviews?: any[];
          [key: string]: any;
        };
      };
      timestamp: string;
      found_on_website: string[];
      found_via_search: string[];
    };
    error_message: string;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Fetch all steps.
 * Endpoint: GET /step/
 */
export const fetchSteps = async (limit: number = 100): Promise<StepDto[]> => {
  try {
    const url = `${INVESTIGATION_BASE}/step/?limit=${limit}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(`${INVESTIGATION_BASE}/step/`, { params: { limit } });
      return response.data;
    });
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    logApiError("[caseServices] Error fetching steps:", error);
    return [];
  }
};

/**
 * Fetch datastore entry for a run and step.
 * Endpoint: GET /run/{runId}/datastore/{stepId}
 */
export const fetchDatastoreEntry = async (
  runId: string,
  stepId: string
): Promise<DatastoreEntryApiResponse | null> => {
  if (!runId || !stepId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/run/${runId}/datastore/${stepId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    // If 404, might not be generated yet
    if ((error as any)?.response?.status === 404) return null;
    logApiError(`[caseServices] Error fetching datastore entry for run ${runId} and step ${stepId}:`, error);
    return null;
  }
};

/**
 * Fetch product image analysis for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/product-image-analysis
 */
export interface ReverseImageApiResponse {
  success: boolean;
  message: string;
  data: {
    reverse_image: any;
  };
}

/**
 * Fetch merchant reverse image details.
 * Endpoint: GET /merchant_details/reverse-image/{run_id}
 */
export const fetchReverseImageSearch = async (
  runId: string
): Promise<ReverseImageApiResponse | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/reverse-image/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching reverse-image for ${runId}:`, error);
    return null;
  }
};

/**
 * Fetch Merchant Details - Scam Intelligence
 * Endpoint: GET /merchant_details/scam-intelligence/{runId}
 */
export const fetchScamIntelligence = async (
  runId: string
): Promise<any | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/scam-intelligence/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching scam-intelligence for ${runId}:`, error);
    return null;
  }
};

/**
 * Fetch Merchant Details - Decisioning
 * Endpoint: GET /merchant_details/decisioning/${runId}
 */
export const fetchDecisioning = async (
  runId: string
): Promise<any | null> => {
  if (!runId) return null;
  try {
    const url = `${INVESTIGATION_BASE}/merchant_details/decisioning/${runId}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });
    return data;
  } catch (error) {
    logApiError(`[caseServices] Error fetching decisioning for ${runId}:`, error);
    return null;
  }
};

/**
 * Delete a specific run by ID.
 * Endpoint: DELETE /run/id/{id}
 */
export const deleteRun = async (runId: string): Promise<boolean> => {
  if (!runId) return false;
  try {
    const cleanSuffix = `run/id/${runId}`;
    const url = buildDirectUrl(cleanSuffix);
    const response = await API.delete(url);
    return response.status === 200 || response.status === 204;
  } catch (error) {
    logApiError(`[caseServices] Error deleting run ${runId}:`, error);
    return false;
  }
};

/**
 * Fetch all merchants.
 * Endpoint: GET /merchant/
 */
export const fetchMerchants = async (limit: number = 1000): Promise<MerchantDto[]> => {
  try {
    const url = `${INVESTIGATION_BASE}/merchant/?limit=${limit}`;
    const data = await cachedGet(url, async () => {
      const response = await API.get(`${INVESTIGATION_BASE}/merchant/`, { params: { limit } });
      return response.data;
    });

    if (data && data.success && Array.isArray(data.data)) {
      return data.data as MerchantDto[];
    }
    return [];
  } catch (error) {
    logApiError("[caseServices] Error fetching merchants:", error);
    return [];
  }
};

export const caseService = {
  fetchCases,
  fetchThreeWayMatch,
  fetchExternalInsights,
  fetchDomainInformation,
  fetchNavigationFlow,
  fetchContactSocial,
  fetchPolicies,
  fetchContentAnalysis,
  fetchTransactionStatus,
  fetchTransactionMode,
  fetchTransactionRegion,
  fetchTransactionCurrency,
  fetchTransactionGateway,
  fetchTransactionTime,
  fetchTransactionProxy,
  fetchTransactionLedger,
  fetchVolumeAnalysis,
  fetchSteps,
  fetchDatastoreEntry,
  fetchBusinessIdentityOverview,
  fetchBusinessClassification,
  fetchRegistrationDetails,
  fetchAddressDetails,
  fetchContactDetails,
  fetchKeyPersonnel,
  fetchReverseImageSearch,
  fetchScamIntelligence,
  fetchDecisioning,
  fetchMerchantWebAnalysis,
  deleteRun,
  fetchMerchants,
};


/**
 * Fetch linkages for a given case.
 * Endpoint: GET /api/v1/cases/{case_id}/linkages
 */
export interface LinkagesApiResponse {
  status: string;
  data: {
    success: boolean;
    userid: string;
    currentDegree: number;
    nextDegree: number;
    nodeCount: number;
    edgeCount: number;
    nodes: any[];
    edges: any[];
  };
}

export const fetchLinkages = async (
  caseId: string
): Promise<LinkagesApiResponse | null> => {
  if (!caseId) return null;
  try {
    const url = buildCaseUrl(caseId, "linkages");
    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as LinkagesApiResponse;
  } catch (error) {
    logApiError(`[caseServices] Error fetching linkages for ${caseId}:`, error);
    return null;
  }
};

// --- Run Analysis APIs ---

export interface RunAnalysisStep {
  step_id: string;
  step_name: string;
  status: string;
  started_at: string;
  finished_at: string;
  duration: string;
  error: string | null;
}

export interface RunAnalysisData {
  run_id: string;
  merchant: {
    name: string;
    website: string;
  };
  status: string;
  start_time: string;
  end_time: string;
  duration: string;
  error_message: string;
  progress: {
    total_steps: number;
    completed: number;
    failed: number;
    processing: number;
    percent: number;
  };
  steps: RunAnalysisStep[];
}

export interface RunAnalysisResponse {
  success: boolean;
  message: string;
  data: RunAnalysisData;
}

/**
 * Fetch detailed analysis of a run execution.
 * Endpoint: GET /api/v1/run/{run_id}/analysis
 */
export const fetchRunAnalysis = async (
  runId: string,
  skipCache: boolean = false
): Promise<RunAnalysisResponse | null> => {
  if (!runId) return null;
  try {
    const cleanSuffix = `run/${runId}/analysis`;
    const url = buildDirectUrl(cleanSuffix);

    if (skipCache) clearCache(url);

    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as RunAnalysisResponse;
  } catch (error) {
    logApiError(`[caseServices] Error fetching run-analysis for ${runId}:`, error);
    return null;
  }
};

export interface DatastoreItem {
  id: string;
  run_id: string;
  step_id: string;
  step_name: string;
  data: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RunDatastoreResponse {
  success: boolean;
  message: string;
  data: DatastoreItem[];
}

/**
 * Fetch datastore entries for a run execution.
 * Endpoint: GET /run/{run_id}/datastore
 */
export const fetchRunDatastore = async (
  runId: string,
  skipCache: boolean = false
): Promise<RunDatastoreResponse | null> => {
  if (!runId) return null;
  try {
    const cleanSuffix = `run/${runId}/datastore`;
    const url = buildDirectUrl(cleanSuffix);

    if (skipCache) clearCache(url);

    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as RunDatastoreResponse;
  } catch (error) {
    logApiError(`[caseServices] Error fetching run-datastore for ${runId}:`, error);
    return null;
  }
};

/**
 * Create a new merchant.
 * Endpoint: POST /merchant/create
 */
export const createMerchant = async (data: {
  name: string;
  website: string;
  gstn?: string;
  vpa_ids?: string[];
  mcc_code?: string;
  business_category?: string;
  business_sub_category?: string;
  mobile?: string[];
  address?: string;
}) => {
  try {
    const url = buildDirectUrl("merchant/create");
    const response = await API.post(url, data);
    return response.data;
  } catch (error) {
    logApiError("[caseServices] Error creating merchant:", error);
    throw error;
  }
};

/**
 * Upload merchant document (bulk upload).
 * Endpoint: POST /merchant/upload-doc
 */
export const uploadMerchantDoc = async (file: File) => {
  try {
    const url = buildDirectUrl("merchant/upload-doc");
    const formData = new FormData();
    formData.append("file", file);
    const response = await API.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    logApiError("[caseServices] Error uploading merchant doc:", error);
    throw error;
  }
};


/**
 * Enqueue merchant(s) for processing.
 * Endpoint: POST /merchant/enqueue
 * Enqueue query parameters: mid (single string) or mids (array of strings)
 */
export const enqueueMerchant = async (mid?: string, mids?: string[]) => {
  try {
    const params = new URLSearchParams();
    if (mid) params.append("mid", mid);
    if (mids) {
      mids.forEach((id) => params.append("mids", id));
    }

    const url = buildDirectUrl("merchant/enqueue");
    const fullUrl = `${url}?${params.toString()}`;

    // Sending empty body as per script requirements
    const response = await API.post(fullUrl, {});
    return response.data;
  } catch (error) {
    logApiError("[caseServices] Error enqueuing merchant:", error);
    throw error;
  }
};

// --- Banned Category APIs ---

export interface BannedCategoryDto {
  content: string;
  id: string;
  type?: string;
  created_at: string;
  updated_at: string;
}

export interface BannedCategoryApiResponse {
  success: boolean;
  message: string;
  data: BannedCategoryDto[];
}

/**
 * Fetch list of restricted/banned categories.
 * Endpoint: GET /banned-category/
 */
export const fetchBannedCategories = async (type?: string): Promise<BannedCategoryApiResponse | null> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const url = `${baseUrl}/banned-category/` + (type ? `?type=${type}` : "");

    const data = await cachedGet(url, async () => {
      const response = await API.get(`${baseUrl}/banned-category/`, { params: type ? { type } : undefined });
      return response.data;
    });

    return data as BannedCategoryApiResponse;
  } catch (error) {
    logApiError("[caseServices] Error fetching banned categories:", error);
    return null;
  }
};

/**
 * Clears the cache for banned categories.
 */
export const clearBannedCategoriesCache = (type?: string) => {
  const baseUrl = INVESTIGATION_BASE;
  const url = `${baseUrl}/banned-category/` + (type ? `?type=${type}` : "");
  clearCache(url);
};

/**
 * Updates an existing banned category.
 */
export const updateBannedCategory = async (id: string, content: string, type?: string): Promise<any> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const response = await API.put(`${baseUrl}/banned-category/${id}`, { content, type });
    return response.data;
  } catch (error) {
    logApiError(`[caseServices] Error updating banned category ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a banned category.
 */
export const deleteBannedCategory = async (id: string): Promise<any> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const response = await API.delete(`${baseUrl}/banned-category/${id}`);
    return response.data;
  } catch (error) {
    logApiError(`[caseServices] Error deleting banned category ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new banned category.
 */
export const createBannedCategory = async (content: string, type?: string): Promise<any> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const response = await API.post(`${baseUrl}/banned-category/create`, { content, type });
    return response.data;
  } catch (error) {
    logApiError(`[caseServices] Error creating banned category:`, error);
    throw error;
  }
};

export interface FlaggedMerchantDto {
  legal_name: string;
  pan: string;
  cin: string[];
  gstn: string[];
  contact_numbers: string[];
  email_ids: string[];
  directors: Array<Record<string, any>>;
  website_urls: string[];
  uid: string;
  created_at: string;
  updated_at: string;
}

export interface FlaggedMerchantApiResponse {
  success: boolean;
  message: string;
  data: FlaggedMerchantDto[];
}

/**
 * Fetch flagged merchants list.
 * Endpoint: GET /flagged-merchant/
 */
export const fetchFlaggedMerchants = async (
  limit: number = 1000,
  forceRefresh = false
): Promise<FlaggedMerchantDto[]> => {
  try {
    const cleanSuffix = "flagged-merchant/";
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/${cleanSuffix}?limit=${limit}`
      : `/${cleanSuffix}?limit=${limit}`;

    const data = await cachedGet(url, async () => {
      const response = await API.get(INVESTIGATION_BASE ? `${INVESTIGATION_BASE}/${cleanSuffix}` : `/${cleanSuffix}`, {
        params: {
          limit,
        },
      });
      return response.data;
    }, forceRefresh);

    if (data && data.success && Array.isArray(data.data)) {
      return data.data as FlaggedMerchantDto[];
    }

    return [];
  } catch (error) {
    logApiError("[caseServices] Error fetching flagged merchants:", error);
    return [];
  }
};

/**
 * Create a new flagged merchant.
 * Endpoint: POST /flagged-merchant/create
 */
export const createFlaggedMerchant = async (payload: {
  legal_name: string;
  pan: string;
  cin: string[];
  gstn: string[];
  contact_numbers: string[];
  email_ids: string[];
  directors: Array<Record<string, any>>;
  website_urls: string[];
}): Promise<any> => {
  try {
    const cleanSuffix = "flagged-merchant/create";
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/${cleanSuffix}`
      : `/${cleanSuffix}`;
    const response = await API.post(url, payload);
    return response.data;
  } catch (error) {
    logApiError("[caseServices] Error creating flagged merchant:", error);
    throw error;
  }
};

/**
 * Bulk delete flagged merchants by uids.
 * Endpoint: POST /flagged-merchant/bulk-delete
 */
export const bulkDeleteFlaggedMerchants = async (uids: string[]): Promise<any> => {
  try {
    const cleanSuffix = "flagged-merchant/bulk-delete";
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/${cleanSuffix}`
      : `/${cleanSuffix}`;
    const response = await API.post(url, { ids: uids });
    return response.data;
  } catch (error) {
    logApiError("[caseServices] Error bulk deleting flagged merchants:", error);
    throw error;
  }
};

/**
 * Update flagged merchant by uid.
 * Endpoint: PUT /flagged-merchant/{uid}
 */
export const updateFlaggedMerchant = async (
  uid: string,
  payload: {
    legal_name: string;
    pan: string;
    cin: string[];
    gstn: string[];
    contact_numbers: string[];
    email_ids: string[];
    directors: Array<Record<string, any>>;
    website_urls: string[];
  }
): Promise<any> => {
  try {
    const cleanSuffix = `flagged-merchant/${uid}`;
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/${cleanSuffix}`
      : `/${cleanSuffix}`;
    const response = await API.put(url, payload);
    return response.data;
  } catch (error) {
    logApiError("[caseServices] Error updating flagged merchant:", error);
    throw error;
  }
};

export interface ContextDto {
  id: string;
  context_text: string;
  metadata_user: string;
  metadata_system?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContextApiResponse {
  success: boolean;
  message: string;
  data: ContextDto[];
}

/**
 * Fetch list of context entries.
 * Endpoint: GET /context/
 */
export const fetchContexts = async (): Promise<ContextApiResponse | null> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const url = `${baseUrl}/context/`;

    const data = await cachedGet(url, async () => {
      const response = await API.get(url);
      return response.data;
    });

    return data as ContextApiResponse;
  } catch (error) {
    logApiError("[caseServices] Error fetching contexts:", error);
    return null;
  }
};

/**
 * Clears the cache for contexts.
 */
export const clearContextsCache = () => {
  const baseUrl = INVESTIGATION_BASE;
  const url = `${baseUrl}/context/`;
  clearCache(url);
};

/**
 * Updates an existing context.
 * Endpoint: PUT /context/{id}
 */
export const updateContext = async (
  id: string,
  payload: {
    context_text: string;
    metadata_user: string;
    is_active: boolean;
  }
): Promise<any> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const response = await API.put(`${baseUrl}/context/${id}`, payload);
    return response.data;
  } catch (error) {
    logApiError(`[caseServices] Error updating context ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a context entry.
 * Endpoint: DELETE /context/{id}
 */
export const deleteContext = async (id: string): Promise<any> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const response = await API.delete(`${baseUrl}/context/${id}`);
    return response.data;
  } catch (error) {
    logApiError(`[caseServices] Error deleting context ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new context entry.
 * Endpoint: POST /context/create
 */
export const createContext = async (
  payload: {
    context_text: string;
    metadata_user: string;
    is_active: boolean;
  }
): Promise<any> => {
  try {
    const baseUrl = INVESTIGATION_BASE;
    const response = await API.post(`${baseUrl}/context/create`, payload);
    return response.data;
  } catch (error) {
    logApiError(`[caseServices] Error creating context:`, error);
    throw error;
  }
};

/**
 * Execute RF/GF/MR/RISK_SCORE steps for an existing pipeline run.
 * Endpoint: POST /run-rules/execute
 */
export const executeRules = async (
  pipelineId: string,
  stepNames: string[]
): Promise<any> => {
  try {
    const url = INVESTIGATION_BASE
      ? `${INVESTIGATION_BASE}/run-rules/execute`
      : `/run-rules/execute`;
    const response = await API.post(url, {
      pipeline_id: pipelineId,
      step_names: stepNames,
    });
    return response.data;
  } catch (error) {
    logApiError("[caseServices] Error executing rules:", error);
    throw error;
  }
};






