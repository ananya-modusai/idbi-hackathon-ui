export interface MerchantItemType {
  id: string;
  cin?: string | null; // Making CIN optional since it might not be available for all merchants
  legalName: string;
  tradeName: string;
  industry?: string; // Industry field for merchant classification
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistMerchantData {
  merchantName: string;
  merchantId: string;
  mid: string;
  cin?: string;
  monitoringFrequency: 'Daily' | 'Weekly' | 'Monthly';
  status: string;
  industry: string;
  industryRiskSegment?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High' | 'Severe';
  // final_pd is the canonical PD value returned by newer watchlist APIs
  final_pd?: number;
  pdScore: number;
  addedDate?: string;
  lastUpdatedDate?: string;
  cpv_score?: number; // Daily Chargeback Payment Volume
  tpv_score?: number; // Total Payment Volume
  collateral_score?: number;
  industry_add?: number; // Industry Average Delivery Days
  lgd_rate?: number; // Loss Given Default
  pd_score?: number; // Probability of Default
}

export interface MerchantOverviewData {
  cpv: number;
  tpv: number;
  collateral: number;
  industryADD: number;
  pdScore: number;
  lgd: number;
}
