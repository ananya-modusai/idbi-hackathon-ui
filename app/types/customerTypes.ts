// Customer-related API types (moved out of app/types.ts)
export interface CustomerOverviewData {
  status: string;
  userid: string;
  name: string;
  risk_level: string;
  age: number | null;
  gender: string | null;
  device_type: string | null;
  location: {
    city: string | null;
    state: string | null;
  } | null;
}

// ---------------------- Customer Financial ----------------------
export interface CustomerFinancialData {
  status: string;
  cibil_score: number;
  cibil_delta: number;
  emis_past_due: number;
  current_dpd: number;
  last_payment_date: string | null;
  outstanding_loan: number;
}

// ---------------------- Account History ----------------------
export interface AccountHistoryData {
  status: string;
  account_tenure: string;
  loans_disbursed: number;
  total_disbursed_amount: number;
  early_repayments: number;
  avg_repayment_timeliness: string;
  max_historical_dpd: number;
}

// ---------------------- Loans ----------------------
export interface LoansData {
  status: string;
  loans: {
    loan_id: string;
    disbursal_date: string;
    loan_amount: number;
    total_installments: number;
    loan_status: string;
    repayment_timeline: {
      installment_no: number;
      amount: number;
      due_date: string;
      repayment_date: string;
      repayment_mode: string | null;
      delay_in_payment_days: string;
      is_emi_paid: boolean;
    }[];
  }[];
}


// ---------------------- Connected Users (placeholder) ----------------------
export interface ConnectedUsersData {
  status: string;
  devices_logged_in: number;
  user_sharing_devices: number;
  connected_users: {
    risk: string | null;
    user_id: string;
    outstanding_loan: number;
    cibil_score: number;
    emis_past_due: number;
    current_dpd: number;
    loans: {
      loan_id: string;
      disbursal_date: string;
      loan_amount: number;
      total_installments: number;
      loan_status: string | null;
      repayment_timeline: {
        installment_no: number;
        amount: number;
        due_date: string;            
        repayment_date: string | null;
        repayment_mode: string | null;
        delay: string;               
      }[];
    }[];
  }[];
}

// ---------------------- Metrics / Activity ----------------------
export interface BankActivityItem {
  period: string; // e.g. '2025-09'
  inflow: number;
  outflow: number;
  net: number;
}

export interface CreditCardActivityItem {
  period: string;
  spends: number;
  credit_card_payment: number;
  net: number;
}

export interface SummaryTableRow {
  particular: string;
  values: { period: string; value: string }[];
}

export interface MetricsActivityData {
  bank_activity: BankActivityItem[];
  credit_card_activity: CreditCardActivityItem[];
  summary_table: SummaryTableRow[];
}

export interface MetricsActivityResponse {
  status: string;
  data: MetricsActivityData;
}

// ---------------------- Monthly Metrics (credit_behaviour etc.) ----------------------
export interface MonthlyMetricPoint {
  customer_id: string;
  month: string; // e.g. '2024-07-01'
  metric_value: string | number;
}

export interface MonthlyMetricResult {
  metric: string; // metric key/name
  data: MonthlyMetricPoint[];
}

export interface MonthlyMetricsData {
  success: boolean;
  metricsExecuted: number;
  results: MonthlyMetricResult[];
  errors: number;
}

export interface MonthlyMetricsResponse {
  status: string;
  data: MonthlyMetricsData;
}

// ---------------------- Pincode Analysis (geographical risk) ----------------------
export interface RepaymentStatusItem {
  range: string; // e.g. "<= 0 Days"
  percentage: number;
}

export interface PincodeAnalysisRow {
  month: string; // e.g. '2025-11'
  loan_count: number;
  total_loan_amount: number;
  state_portfolio_share_percent: number;
  dpd_15_plus_loan_amount: number;
  dpd_15_plus_percent_of_loan_amount: number;
}

export interface PincodeAnalysisData {
  region: string;
  repayment_status: RepaymentStatusItem[];
  pincode_analysis: PincodeAnalysisRow[];
}

export interface PincodeAnalysisResponse {
  status: string;
  data: PincodeAnalysisData;
}

// ---------------------- High-Level Stats ----------------------
export interface HighLevelStatsData {
  total_customers: number;
  total_loans_count: number;
  total_loans_amount: number;
  oldest_loan_date: string;
  latest_loan_date: string;
  smallest_loan_amount: number;
  largest_loan_amount: number;
  default_customers_pct: number;
  high_risk_customers_pct: number;
  medium_risk_customers_pct: number;
  // Added for the IDBI demo tiles — present in the shaped fixture, not in the
  // upstream API response, hence optional.
  avg_financial_health_score?: number;
  avg_financial_health_band?: string;
  new_to_bank_customers?: number;
  existing_customers?: number;
  new_to_bank_pct?: number;
  existing_pct?: number;
}

export interface HighLevelStatsResponse {
  status: string;
  data: HighLevelStatsData;
}
// ---------------------- Linkage Stats ----------------------
export interface LinkageStatsData {
  connector_type: string;
  total_customer_nodes: number;
  total_attribute_nodes: number;
  avg_attributes_per_customer_1st_deg: number;
  unconnected_customers_count: number;
  unconnected_customers_pct: number;
  deg2_plus_connected_count: number;
  deg2_plus_connected_pct: number;
  deg4_plus_connected_count: number;
  deg4_plus_connected_pct: number;
  deg6_plus_connected_count: number;
  deg6_plus_connected_pct: number;
  unconnected_customers_loan: number;
  deg2_plus_connected_loan: number;
  deg4_plus_connected_loan: number;
  deg6_plus_connected_loan: number;
}

export interface LinkageStatsResponse {
  status: string;
  data: LinkageStatsData;
}

export interface LinkageStatsGraphData {
  all: {
    "2": number;
    "4": number;
    "6": number;
    "no_link": number;
  };
  strong: {
    "2": number;
    "4": number;
    "6": number;
    "no_link": number;
  };
}

export interface LinkageStatsGraphResponse {
  status: string;
  data: LinkageStatsGraphData;
}

// ---------------------- Linkage List ----------------------
export interface LinkageListItem {
  userid: string;
  linkage_category: string;
  linked_2nd_degree_customer_ids: string[];
  linked_4th_degree_customer_ids: string[];
  linked_6th_degree_customer_ids: string[];
  loan_amount?: number;
  unpaid_amount?: number;
  dpd?: number;
}

export interface LinkageListData {
  connector_type: string;
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  data: LinkageListItem[];
}

export interface LinkageListResponse {
  status: string;
  data: LinkageListData;
}

// ---------------------- Linkage List V2 ----------------------
export interface LinkageListItemV2 {
  userid: string;
  name: string;
  linked_individuals: number;
  loan_exposure: number;
  avg_cibil: number;
  avg_delay: number;
  defaulter: number;
  risk_indicator: string | null;
  connected_individuals?: {
    "2": string[];
    "4": string[];
    "6": string[];
  };
}

export interface LinkageListDataV2 {
  connector_type: string;
  linkage_category: string;
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  data: LinkageListItemV2[];
}

export interface LinkageListResponseV2 {
  status: string;
  data: LinkageListDataV2;
}

// ---------------------- Linkage Metrics V2 ----------------------
export interface LinkageMetricsV2Data {
  total_count: number;
  loan_exposure_range: [number, number];
  cibil_range: [number, number];
  defaulter_range: [number, number];
}

export interface LinkageMetricsV2Response {
  status: string;
  data: LinkageMetricsV2Data;
}

// ---------------------- Linkage Artifacts ----------------------
export interface LinkageArtifactItem {
  customer_id: string;
  name: string;
  risk_indicator: string | null;
  cibil_score: string;
  active_loan: string | null;
  total_installments?: string | number;
  loan_status?: string | null;
  repayment_timeline?: any[];
  maximum_delay: string;
  loan_id?: string;
  disbursal_date?: string;
  loan_amount?: number;
  loans?: {
    loan_id: string;
    disbursal_date: string;
    loan_amount: number;
    total_installments: number;
    loan_status: string | null;
    repayment_timeline: {
      installment_no: number;
      amount: number;
      due_date: string;
      repayment_date: string | null;
      repayment_mode: string | null;
      delay_in_payment_days: string;
      is_emi_paid: boolean;
    }[];
  }[];
}

export interface LinkageArtifactsData {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  data: LinkageArtifactItem[];
}

export interface LinkageArtifactsResponse {
  status: string;
  data: LinkageArtifactItem[] | LinkageArtifactsData;
}

export interface LinkedIndividualsArtifactProps {
  customerName: string;
  customerId: string;
  connectorType?: 'all' | 'strong';
}

// ---------------------- Centrality Stats ----------------------
export interface CentralityStatsItem {
  CUSTOMER: number;
  GOV_ID: number;
  PHONE: number;
  EMAIL: number;
  LOCATION: number;
  DEVICE: number;
  BANK_ACCOUNT: number;
  UPI_ID: number;
  BANK_BRANCH: number;
  PAN: number;
  PASSPORT: number;
  VOTER_ID: number;
  DRIVING_LICENSE: number;
  RATION_CARD: number;
  TELEPHONE: number;
  ELECTRICITY_BILL: number;
  CREDIT_CARD: number;
  DEBIT_CARD: number;
  OTHER: number;
}

export interface CentralityStatsData {
  connector_type: string;
  none_centrality: CentralityStatsItem;
  small_centrality: CentralityStatsItem;
  medium_centrality: CentralityStatsItem;
  large_centrality: CentralityStatsItem;
  mega_centrality: CentralityStatsItem;
}

export interface CentralityStatsResponse {
  status: string;
  data: CentralityStatsData;
}

// ---------------------- Community Stats ----------------------
export interface CommunityStatsData {
  community_size: string;
  connector_type: string;
  no_of_communities: number;
  highest_exposure_community_inr: number;
  highest_default_community_pct: number;
  at_risk_communities_count: number;
}

export interface CommunityStatsResponse {
  status: string;
  data: CommunityStatsData;
}
// ---------------------- Risk Distribution ----------------------
export interface RiskDistributionItem {
  total_customers: number;
  defaulter_count: number;
  non_defaulter_count: number;
  total_loan_exposure: number;
  defaulter_loan_exposure: number;
  non_defaulter_loan_exposure: number;
}

export interface RiskDistributionData {
  [key: string]: RiskDistributionItem;
}

export interface RiskDistributionResponse {
  status: string;
  data: RiskDistributionData;
}
// ---------------------- Recency Stats ----------------------
export interface RecencyStatsData {
  time_frame: string;
  new_customer_nodes: number;
  new_loans_count: number;
  new_loans_amount: number;
  new_customer_customer_connections: number;
}

export interface RecencyStatsResponse {
  status: string;
  data: RecencyStatsData;
}
// ---------------------- Centrality Details ----------------------
export interface CentralityDetailItem {
  node_id: string;
  node_type: string;
  connection_count: number;
  connected_customer_ids: string[];
  properties: Record<string, any>;
}

export interface CentralityDetailsData {
  connector_type: string;
  centrality_tier: string;
  node_type_filter: string;
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  data: CentralityDetailItem[];
}

export interface CentralityDetailsResponse {
  status: string;
  data: CentralityDetailsData;
}
// ---------------------- Community Details ----------------------
export interface CommunityDetailItem {
  community_id: string;
  customer_count: number;
  customer_ids: string[];
  attributes_count: number;
  attributes: {
    nodeIds: string[];
  };
  total_loan_amount_inr: number;
  total_outstanding_loan_inr: number | null;
  default_customer_count: number;
  default_customer_pct: number;
  strong_connector_customer_count: number;
  strong_connector_customer_ids: string[];
  strong_connector_attributes_count: number;
  strong_connector_attributes: {
    nodeIds: string[];
  };
  strong_connector_total_loan_amount_inr: number;
  strong_connector_total_outstanding_loan_inr: number | null;
  strong_connector_default_customer_count: number;
  strong_connector_default_customer_pct: number;
  is_at_risk: boolean;
  is_community_at_risk: boolean;
}

export interface CommunityDetailsData {
  community_size: string;
  connector_type: string;
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  data: CommunityDetailItem[];
}

export interface CommunityDetailsResponse {
  status: string;
  data: CommunityDetailsData;
}

// ---------------------- Community Artifacts ----------------------
export interface CommunityArtifactItem {
  customer_id: string;
  name: string;
  risk_indicator: string | null;
  cibil_score: string;
  active_loan: string | null;
  maximum_delay: string;
  total_installments?: string | number;
  loan_status?: string | null;
  repayment_timeline?: any[];
  loan_id?: string;
  disbursal_date?: string;
  loan_amount?: number;
  loans?: {
    loan_id: string;
    disbursal_date: string;
    loan_amount: number;
    total_installments: number;
    loan_status: string | null;
    repayment_timeline: {
      installment_no: number;
      amount: number;
      due_date: string;
      repayment_date: string | null;
      repayment_mode: string | null;
      delay_in_payment_days: string;
      is_emi_paid: boolean;
    }[];
  }[];
}


export interface CommunityArtifactsResponse {
  status: string;
  data: CommunityArtifactItem[];
}
// ---------------------- Recency Details ----------------------
export interface RecencyDetailItem {
  customer_id: string;
  name: string;
  risk: string;
  cibil: string;
  loan_amount: number;
  loan_count: number;
  linked_customers: string[];
}


export interface RecencyDetailsData {
  time_frame: string;
  base_date: string;
  window_start: string;
  window_end: string;
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  data: RecencyDetailItem[];
}

export interface RecencyDetailsResponse {
  status: string;
  data: RecencyDetailsData;
}
