'use client';

import React from 'react';
import { MerchantItemType } from '@/app/types';
import OverviewPDFTemplate from '../Overview/OverviewPDFTemplate';
import MetricsPDFTemplate from '../Metrics/MetricsPDFTemplate';
import FinancialOperationalPDFTemplate from '../FinancialOperational/FinancialOperationalPDFTemplate';
import ExternalInsightsPDFTemplate from '../ExternalInsights/ExternalInsightsPDFTemplate';
import RedFlagsPDFTemplate from '../RedFlags/RedFlagsPDFTemplate';

// Minimal copies of types used by sub-templates
interface CompanyMetric {
  label: string;
  value: string | number;
  icon: string;
}

interface CompanyData {
  company_name: string;
  about_the_company: string;
  source_urls: string[];
}

interface IndustryData {
  about_the_industry: string;
  is_industry_risky: string;
  justification: string;
}

interface ProcessedMetric {
  id: string;
  name: string;
  type: string;
  icon: string;
  normalRange: { min: number; max: number } | null;
  historicalValues: (number | null)[];
  relativeValues: (number | null)[];
  thresholdSign: string;
  threshold1: number | null;
  threshold2: number | null;
  formula: string;
  impactOnCompany: string;
  industryMedian?: number;
  category?: string | number;
}

interface RevenueDataPoint {
  name: string;
  year: string;
  revenue: number;
  profit: number;
  cashFlow: number;
}

interface FormattedFinancialData {
  name: string;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  researchAndDevelopment: number;
  salesAndMarketing: number;
  generalAndAdmin: number;
  totalOperatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  otherIncome: number;
  incomeTaxes: number;
  netIncome: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  sharesOutstanding: number;
  earningsPerShare: number;
  tangibleAssets: number;
  intangibleAssets: number;
  capitalWorkInProgress: number;
  noncurrentInvestments: number;
  longTermLoansAndAdvances: number;
  otherNoncurrentAssets: number;
  currentInvestments: number;
  inventories: number;
  tradeReceivables: number;
  cashAndBankBalances: number;
  shortTermLoansAndAdvances: number;
  otherCurrentAssets: number;
  totalAssets: number;
  shareCapital: number;
  reservesAndSurplus: number;
  longTermBorrowings: number;
  otherLongTermLiabilities: number;
  longTermProvisions: number;
  shortTermBorrowings: number;
  tradePayables: number;
  otherCurrentLiabilities: number;
  shortTermProvisions: number;
  totalLiabilities: number;
  profitBeforeTax: number;
  financeCostAndDepreciation: number;
  currentAndNonCurrentAssets: number;
  currentAndNonCurrentLiabilities: number;
  otherOperatingAdjustments: number;
  cashFlowFromOperatingActivities: number;
  purchaseOfAssets: number;
  saleOfAssets: number;
  incomeFromAssets: number;
  otherInvestingAdjustments: number;
  cashFlowFromInvestingActivities: number;
  repaymentOfCapitalAndBorrowings: number;
  raisingCapitalAndBorrowings: number;
  interestAndDividendsPaid: number;
  otherFinancingAdjustments: number;
  cashFlowFromFinancingActivities: number;
  cashAndCashEquivalentsBeforeExchange: number;
  adjustmentsToCashAndEquivalents: number;
  cashAndCashEquivalents: number;
  cashAtEndOfPeriod: number;
}

interface InsightItem {
  title: string;
  summary: string;
  date: string;
  source?: string;
  sources?: string | string[];
  source_urls?: string[];
  risk_segment?: 'severe' | 'high' | 'medium';
  tag?: 'redflag' | string;
  severity?: 'severe' | 'high' | 'medium' | 'low' | 'good' | 'veryGood' | string;
  risk_level?: string;
  insight?: string;
  created_at?: string;
  year?: string | number;
  filename?: string;
  page_number?: string | number;
  bare_text?: string;
  financial_year?: string | number;
  [key: string]: unknown;
}

interface RedFlagItem {
  id: string;
  description?: string;
  severity?: string;
  rule_type?: string;
  rule_name?: string;
  rule_code?: string;
  created_at?: string;
  metric_values?: Record<string, number | string>;
}

interface FullReportPDFTemplateProps {
  activeMerchant: MerchantItemType;
  merchantIndustry?: { industry: string; risk_segment: string } | null;
  overview: {
    companyData: CompanyData | null;
    industryData: IndustryData | null;
    companyMetrics: CompanyMetric[];
    merchantId: string;
    flagsList: any[];
    watchlistItem?: any | null;
  };
  versionNo?: number | null;
  date?: string | null;
  metrics: {
    processedMetrics: ProcessedMetric[];
    startYear: number;
    availableYears: number[];
    numberFormat: string;
  };
  financial: {
    financialMetrics: { label: string; value: number | string; icon: string }[];
    revenueData: RevenueDataPoint[];
    formattedFinancialData: FormattedFinancialData[];
    startYear: string;
    numberFormat: string;
    activeStatement: 'income' | 'balance' | 'cashflow';
    redFlags: RedFlagItem[];
  };
  external: {
    insightsData: Record<string, InsightItem[]>;
    redFlagsData: Record<string, RedFlagItem[]>;
  };
  redFlags: {
    items: RedFlagItem[];
  };
  showIndustrialMaterials?: boolean;
}

const FullReportPDFTemplate: React.FC<FullReportPDFTemplateProps> = ({
  activeMerchant,
  merchantIndustry,
  overview,
  metrics,
  financial,
  external,
  redFlags,
  versionNo,
  date,
  showIndustrialMaterials
}) => {
  return (
    <div style={{ width: '100%', maxWidth: '1122px', margin: '0 auto', background: 'white', boxSizing: 'border-box' }}>
      {/* Overview Section */}
      <div>
        <OverviewPDFTemplate
          activeMerchant={activeMerchant}
          companyData={overview.companyData}
          industryData={overview.industryData}
          companyMetrics={overview.companyMetrics}
          merchantId={overview.merchantId}
          merchantIndustry={merchantIndustry || undefined}
          flagsList={overview.flagsList}
          watchlistItem={overview.watchlistItem}
          versionNo={versionNo}
          date={date}
          showIndustrialMaterials={showIndustrialMaterials}
        />
      </div>

      {/* Page break between sections */}
      <div style={{ pageBreakAfter: 'always' }} />

      {/* Metrics Section */}
      <div>
        <MetricsPDFTemplate
          activeMerchant={activeMerchant}
          processedMetrics={metrics.processedMetrics}
          startYear={metrics.startYear}
          availableYears={metrics.availableYears}
          numberFormat={metrics.numberFormat}
          merchantIndustry={merchantIndustry || undefined}
        />
      </div>

      <div style={{ pageBreakAfter: 'always' }} />

      {/* Financial & Operational Section */}
      <div>
        <FinancialOperationalPDFTemplate
          activeMerchant={activeMerchant}
          financialMetrics={financial.financialMetrics}
          revenueData={financial.revenueData}
          formattedFinancialData={financial.formattedFinancialData}
          startYear={financial.startYear}
          numberFormat={financial.numberFormat}
          activeStatement={financial.activeStatement}
          merchantIndustry={merchantIndustry || undefined}
          redFlags={financial.redFlags}
        />
      </div>

      <div style={{ pageBreakAfter: 'always' }} />

      {/* External Insights Section */}
      <div>
        <ExternalInsightsPDFTemplate
          activeMerchant={activeMerchant}
          insightsData={external.insightsData}
          redFlagsData={Object.fromEntries(
            Object.entries(external.redFlagsData).map(([key, flags]) => [
              key,
              flags.map(flag => ({
                id: flag.id,
                merchant_id: activeMerchant.id,
                rule_code: flag.rule_code || '',
                description: flag.description || '',
                severity: flag.severity || 'medium',
                metric_values: flag.metric_values || null,
                metric_data_timestamp: null,
                notes: null,
                created_at: flag.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                rule_name: flag.rule_name,
                rule_description: undefined,
                rule_type: flag.rule_type || '',
                rule_severity: undefined,
                rule_fraud_type: undefined,
                importance: 0,
                timestamp: flag.created_at || new Date().toISOString(),
                flag_type: flag.rule_type || '',
                text: flag.description || '',
                rule: undefined
              }))
            ])
          )}
          merchantIndustry={merchantIndustry || undefined}
        />
      </div>

      <div style={{ pageBreakAfter: 'always' }} />

      {/* Red Flags Section */}
      <div>
        <RedFlagsPDFTemplate
          activeMerchant={activeMerchant}
          redFlags={redFlags.items}
          merchantIndustry={merchantIndustry || undefined}
        />
      </div>
    </div>
  );
};

export default FullReportPDFTemplate;
