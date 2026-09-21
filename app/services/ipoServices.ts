import { API } from './axios';

// Financial Metrics API interfaces
export interface FinancialMetricItem {
  label: string;
  value: string;
  numerical_value: number;
  icon: string;
  description: string;
}

export interface FinancialMetricsDataSource {
  nature: string | null;
  filing_standard: string | null;
  filing_type: string | null;
}

export interface FinancialMetricsData {
  company_id: string;
  listing_id: string;
  company_name: string;
  listing_type: string;
  financial_year: string;
  metrics: FinancialMetricItem[];
  data_source: FinancialMetricsDataSource;
}

export interface FinancialMetricsResponse {
  success: boolean;
  message: string;
  data: FinancialMetricsData;
}

// Financial Comparison API interfaces
export interface FinancialComparisonItem {
  particular: string;
  mca_value: number | null;
  drhp_value: number | null;
  difference: number | null;
  percentage_difference: number | null;
  category: string;
  is_total_row: boolean;
  is_sub_item: boolean;
}

export interface FinancialComparisonSummary {
  total_comparisons: number;
  items_with_differences: number;
  average_difference: number;
  ipo_financial_year: string;
  probe_financial_year: string;
  comparison_date: string;
  merchant_match_method: string;
  merchant_found: boolean;
  merchant_name: string;
  merchant_id: string;
}

export interface FinancialComparisonResponse {
  success: boolean;
  message: string;
  data: FinancialComparisonItem[];
  labels_map: Record<string, string>;
  comparison_summary: FinancialComparisonSummary;
}

interface CompanyListResponse {
  companies: {
    id: string;
    legal_name: string;
    cin: string;
  }[];
  total: number;
  skip: number;
  limit: number;
}

interface CompanyAboutResponse {
  company_id: string;
  legal_name: string;
  about_company: string;
  description: string;
  website: string;
  email: string;
  contact_email: string;
  contact_phone: string;
  registered_address: {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  business_address: {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

interface IndustryResponse {
  company_id: string;
  legal_name: string;
  about_industry: string;
  classification: string;
}

export interface ListingDetails {
  listing_date: string;
  listing_type: string;
  eligibility_type: string;
  document_type: string;
  offer_size: number;
  document_id: string;
  listing_details: {
    segment: string;
    exchange: string;
    listing_fee: number;
  };
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface ListingsResponse {
  company_id: string;
  company_name: string;
  listings: ListingDetails[];
}

export interface OfferingDetailsResponse {
  offeringId: string;
  legalName: string;
  securityType: string;
  documentType: string;
  offeringDate: string;
  eligibilityType: string;
  issueType: string;
  totalIssueSize: string;
  eFilingStatus: string;
  activeCompliance: string;
  companyIncorporationDate: string;
  businessAge: string;
  designatedExchange: string;
  auditQualifications: number;
  issueDetails: null | {
    // Add structure if needed in the future
  };
}

export interface CompanyOfferingDetailsResponse {
  offeringId: string;
  legalName: string;
  securityType: string;
  documentType: string;
  offeringDate: string;
  eligibilityType: string;
  issueType: string;
  totalIssueSize: string;
  totalOfferAmount: string;
  eFilingStatus: string;
  activeCompliance: string;
  companyIncorporationDate: string;
  businessAge: string;
  designatedExchange: string;
  auditQualifications: number;
  issueDetails: null | any;
}

export interface DisclosedPeer {
  name: string;
  disclosure_status: string;
  listing_status: string;
  website: string;
  description: string;
  revenue: string;
  valuation: string;
  geography: string;
  primary_products_services: string;
}

export interface ExternalPeer {
  name: string;
  listing_status: string;
  revenue_from_operations_in_million_inr: number | null;
  face_value_per_equity_share: string;
  closing_price_inr: number | string;
  closing_price_date: string;
  pe_ratio: number | string;
  eps_basic_inr: number;
  eps_diluted_inr: number;
  ronw_percent: number;
  nav_per_equity_share_inr: number;
}

export interface PeerComparisonResponse {
  disclosed_peers: DisclosedPeer[];
  external_peers: ExternalPeer[];
  disclosed_labels_map: {
    [key: string]: string;
  };
  external_labels_map: {
    [key: string]: string;
  };
}

export interface ManagementPromotersResponse {
  data: Array<{
    sr_no: number;
    name: string;
    age: number;
    pan: string;
    aadhar: string;
    bank_account: string;
    designation: string;
    date_of_appointment: string;
    date_of_cessation: string | null;
    promoter_y_n: string;
    promoter_group_y_n: string;
    director_y_n: string;
    kmp_y_n: string;
    wilful_defaulter_list_y_n: string;
    sebi_debarred_y_n: string;
    disqualified_under_companies_act_y_n: string;
    relationship: string;
    basis_of_inclusion: string;
    additional_information?: string;
  }>;
  labels_map: {
    [key: string]: string;
  };
}

export interface OfferDocumentReviewResponse {
  data: OfferDocumentReviewItem[];
  labels_map: {
    [key: string]: string;
  };
}

export interface OfferDocumentReviewItem {
  id: string;
  section_of_offer_document: string;
  page_no: string;
  original_text_excerpt: string;
  review_content: string;
  review_type: string;
}

export interface ComplianceRequirement {
  requirementID: string;
  requirement: string;
  ICDRCitation: string;
  status: string;
  isCompliant: boolean;
  bccl_disclosure: string;
  independent_check: string;
  page_number: string;
  compliance_notes: string;
  assessment_date: string | null;
  assessed_by: string;
}

export interface ComplianceCheck {
  checkType: string;
  requirements: ComplianceRequirement[];
}

export interface ComplianceDetailsResponse {
  regulationType: string;
  checks: ComplianceCheck[];
}

export interface CapitalStructureItem {
  name: string;
  type: string;
  num_shares_held: number;
  percentage_of_total_shares: number;
  entity_type: string;
  holding_type: string;
  shareholding_movement: string;
}

export type CapitalStructureResponse = CapitalStructureItem[];

// Graph data interfaces
export interface GraphDataPoint {
  year: string;
  value: number;
}

export interface GraphDataResponse {
  revenue: GraphDataPoint[];
  profit: GraphDataPoint[];
  cashflow: GraphDataPoint[];
}

// Cache for storing company list responses with a TTL of 5 minutes
const companiesCache = (() => {
  const cache = new Map<string, { data: CompanyListResponse; timestamp: number }>();
  const TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (!item) return undefined;
      
      const now = Date.now();
      if (now - item.timestamp > TTL) {
        cache.delete(key);
        return undefined;
      }
      
      return item.data;
    },
    set: (key: string, data: CompanyListResponse) => {
      cache.set(key, { data, timestamp: Date.now() });
    }
  };
})();

/**
 * Fetch all companies for IPO with pagination and caching
 */
export const fetchIpoCompanies = async (
  skip = 0, 
  limit = 100,
  merchantId?: string
): Promise<CompanyListResponse> => {
  // Create cache key including merchantId if provided
  const cacheKey = merchantId ? 
    `${merchantId}_${skip}_${limit}` : 
    `${skip}_${limit}`;
  
  // Check cache first
  const cachedData = companiesCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await API.get(`/api/v1/ipo/companies`, {
      params: { skip, limit }
    });
    const data = response.data;
    companiesCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching IPO companies:', error);
    const emptyResponse: CompanyListResponse = { 
      companies: [], 
      total: 0, 
      skip, 
      limit 
    };
    return emptyResponse;
  }
};

/**
 * Fetch detailed information about a specific company
 */
export const fetchCompanyAbout = async (companyId: string): Promise<CompanyAboutResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/about`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching company details for ${companyId}:`, error);
    return null;
  }
};

/**
 * Fetch industry details for a specific company
 */
export const fetchCompanyIndustry = async (companyId: string): Promise<IndustryResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/industry`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching industry details for ${companyId}:`, error);
    return null;
  }
};

/**
 * Fetch listings for a specific company
 */
export const fetchCompanyListings = async (companyId: string): Promise<ListingsResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching listings for ${companyId}:`, error);
    return null;
  }
};

/**
 * Fetch offering details for a specific listing
 */
export const fetchOfferingDetails = async (listingId: string): Promise<OfferingDetailsResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/listings/${listingId}/offering-details`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching offering details for listing ${listingId}:`, error);
    return null;
  }
};

/**
 * Fetch company-specific offering details for a listing
 */
export const fetchCompanyOfferingDetails = async (companyId: string, listingId: string): Promise<CompanyOfferingDetailsResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/offering-details`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching company offering details for company ${companyId}, listing ${listingId}:`, error);
    return null;
  }
};

export interface IssueDetailsResponse {
  offeringId: string;
  legalName: string;
  securityType: string;
  documentType: string;
  offeringDate: string;
  eligibilityType: string;
  issueType: string;
  totalIssueSize: string;
  eFilingStatus: string;
  activeCompliance: string;
  companyIncorporationDate: string;
  businessAge: string;
  designatedExchange: string;
  auditQualifications: number;
  issueDetails: {
    freshIssue: {
      numberOfShares: string;
      faceValue: string;
      aggregatingAmount: string;
    } | null;
    offerForSale: {
      numberOfShares: string;
      faceValue: string;
      aggregatingAmount: string;
    } | null;
  };
  data: {
    object_of_issue: Array<{
      reason: string;
      amount: string;
    }> | null;
    selling_shareholder: {
      details: Array<{
        waca: number;
        current_shares: number;
        shares_selling: number;
        percent_of_offer: number | null;
        shareholder_name: string;
        percent_of_shares_offered: number | null;
        current_shareholding_percent: number;
        resultant_shareholding_percent: number | null;
      }>;
      total_shareholders: number;
      total_current_shares: number;
      total_shares_selling: number;
    } | null;
  };
}

/**
 * Fetch issue details for a specific company and listing
 */
export const fetchIssueDetails = async (companyId: string, listingId: string): Promise<IssueDetailsResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/offering-details`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching issue details for company ${companyId}, listing ${listingId}:`, error);
    return null;
  }
};

/**
 * Fetch peer comparison data for a specific company listing
 */
export const fetchPeerComparison = async (companyId: string, listingId: string): Promise<PeerComparisonResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/peer-comparison`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching peer comparison for company ${companyId}, listing ${listingId}:`, error);
    return null;
  }
};

/**
 * Fetch management and promoters details for a specific company listing
 */
export const fetchManagementPromoters = async (companyId: string, listingId: string): Promise<ManagementPromotersResponse | null> => {
  try {
    console.log(`Fetching management and promoters for company ${companyId}, listing ${listingId}`);
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/management-promoters`);
    console.log('Management and promoters API response:', response.data);
    
    // Validate the response structure
    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.data)) {
        console.log(`Found ${response.data.data.length} management and promoter records`);
      } else {
        console.warn('API response does not contain expected data array:', response.data);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching management and promoters for company ${companyId}, listing ${listingId}:`, error);
    return null;
  }
};

/**
 * Fetch offer document review details for a specific company and listing
 */
export const fetchOfferDocumentReview = async (companyId: string, listingId: string): Promise<OfferDocumentReviewResponse | null> => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/offer-document-review`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching offer document review for company ${companyId}, listing ${listingId}:`, error);
    return null;
  }
};

/**
 * Fetch compliance details for a specific company and listing
 */
export const fetchComplianceDetails = async (companyId: string, listingId: string): Promise<ComplianceDetailsResponse | null> => {
  try {
    console.log(`Fetching compliance details for company ${companyId}, listing ${listingId}`);
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/compliance-details`);
    console.log('Compliance details API response:', response.data);
    
    // Validate the response structure
    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.checks)) {
        console.log(`Found ${response.data.checks.length} compliance check types`);
      } else {
        console.warn('API response does not contain expected checks array:', response.data);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching compliance details for company ${companyId}, listing ${listingId}:`, error);
    return null;
  }
};

/**
 * Fetch capital structure data for a specific company and listing
 */
export const fetchCapitalStructure = async (companyId: string, listingId: string): Promise<CapitalStructureResponse | null> => {
  try {
    console.log(`Fetching capital structure for company ${companyId}, listing ${listingId}`);
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/listing/${listingId}/capital-structure`);
    console.log('Capital structure API response:', response.data);
    
    // Validate the response structure
    if (response.data && response.data.success && Array.isArray(response.data.data.capital_structure)) {
      console.log(`Found ${response.data.data.capital_structure.length} shareholders`);
      return response.data.data.capital_structure;
    } else {
      console.warn('API response does not contain expected structure:', response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching capital structure for company ${companyId}, listing ${listingId}:`, error);
    return null;
  }
};

/**
 * Fetch external insights data for IPO analysis
 */
export const fetchCompanyExternalData = async (companyId: string) => {
  try {
    const response = await API.post(`/api/v1/credit-insolvency/getExternalData`, {
      merchant_id: companyId,
      product: "insolvency"
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching external data for company ${companyId}:`, error);
    throw error;
  }
};

/**
 * Fetch audit report insights (flags from auditor disclosures) for IPO analysis
 */
export const fetchCompanyAuditReportInsights = async (companyId: string) => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/getFlagsFromAuditorDisclosures`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching audit report insights for company ${companyId}:`, error);
    throw error;
  }
};

/**
 * Fetch annual report insights for IPO analysis
 */
export const fetchCompanyAnnualReportInsights = async (companyId: string) => {
  try {
    const response = await API.get(`/api/v1/ipo/companies/${companyId}/getAnnualReportInsights`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching annual report insights for company ${companyId}:`, error);
    throw error;
  }
};

// IPO service object similar to merchantService for consistent API
export const ipoService = {
  // External insights data for IPO analysis
  getCompanyExternalData: fetchCompanyExternalData,
  
  // Get audit report insights data for IPO analysis
  getCompanyAuditReportInsights: fetchCompanyAuditReportInsights,
  
  // Get annual report insights data for IPO analysis
  getCompanyAnnualReportInsights: fetchCompanyAnnualReportInsights,
  
  // Get service providers with companies data for IPO entities
  getAllEntities: async () => {
    try {
      const response = await API.get('/api/v1/ipo/get-all-entities');
      return response.data;
    } catch (error) {
      console.error('Error fetching service providers with companies:', error);
      throw error;
    }
  },

  // Get service providers for a specific listing
  getServiceProviders: async (listingId: string, companyId: string) => {
    try {
      const response = await API.get(`/api/v1/ipo/get-all-entities?listing_id=${listingId}&company_id=${companyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching service providers for listing ${listingId} and company ${companyId}:`, error);
      throw error;
    }
  },
  
  // Get financial table data for IPO analysis
  getCompanyFinancialTable: async (companyId: string) => {
    try {
      const response = await API.get(`/api/v1/ipo/companies/${companyId}/financialsTable`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching financial table for company ${companyId}:`, error);
      throw error;
    }
  },

  // Get financial comparison data for IPO analysis
  getFinancialComparison: async (companyId: string, listingId: string): Promise<FinancialComparisonResponse> => {
    try {
      const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/financial-comparison`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching financial comparison for company ${companyId}, listing ${listingId}:`, error);
      throw error;
    }
  },
  
  // Get financial metrics for IPO analysis
  getCompanyFinancialMetrics: async (companyId: string, listingId: string) => {
    try {
      const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/financial-metrics`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching financial metrics for company ${companyId}, listing ${listingId}:`, error);
      throw error;
    }
  },

  // Get valuation metrics for IPO analysis
  getCompanyValuationMetrics: async (companyId: string, listingId: string) => {
    try {
      const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/valuation-metrics`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching valuation metrics for company ${companyId}, listing ${listingId}:`, error);
      throw error;
    }
  },

  // Get compliance details for a specific company and listing
  getComplianceDetails: async (companyId: string, listingId: string) => {
    try {
      const response = await API.get(`/api/v1/ipo/companies/${companyId}/listings/${listingId}/compliance-details`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching compliance details for company ${companyId}, listing ${listingId}:`, error);
      throw error;
    }
  },

  // Get issue details for a specific company and listing
  getIssueDetails: fetchIssueDetails,

  // Get graph data for IPO analysis
  getCompanyGraphData: async (companyId: string) => {
    try {
      const response = await API.get(`/api/v1/ipo/companies/${companyId}/graph-data`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching graph data for company ${companyId}:`, error);
      throw error;
    }
  },
};