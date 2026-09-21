
'use client';

import { FC, useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Visualization } from '@/components/custom/visualization';
import { VisualizationData } from '@/components/custom/visualization/types';
import FinancialStatement from './Components/FinancialStatement';
import { 
  revenueTrendConfig,
  profitTrendConfig,
  cashFlowTrendConfig
} from './SampleData/sampleData';
import { BarChart3, LineChart } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import { useInsolvencyFinancialStore } from '@/app/store/merchant/insolvencyFinancialStore';
import { merchantService } from '@/app/services/merchantServices';
import { useInvestigationRedFlagsStore } from '@/app/store/merchant/InvestigationRedFlagsStore';
import { useInsolvencyRedFlags } from './InsolvencyRedFlagsTab';
import InsolvencyPageHeader from './Components/InsolvencyPageHeader';
import { getTagCategory } from './SampleData/syntheticTagsMapping';
import CustomLoader from '@/components/custom/CustomLoader';
import FinancialOperationalPDFTemplate from './Report/FinancialOperational/FinancialOperationalPDFTemplate';
import { generateFinancialOperationalPDF } from './Report/utils/pdfUtils';
import { industryService } from '@/app/services/industryServices';

interface FinancialMetric {
  label: string;
  value: number;
  icon: string;
}

interface InsolvencyFinancialOperationalTabProps {
  merchantId?: string;
}

const InsolvencyFinancialOperationalTab: FC<InsolvencyFinancialOperationalTabProps> = ({ merchantId: propMerchantId }) => {
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetric[]>([]);
  const { financialsData } = useInsolvencyFinancialStore();
  const { selectedMerchantId, merchantIdList } = useMerchantIdStore();
  const { activeContexts } = useActiveContext();
  const merchantId = useMemo(() => propMerchantId || activeContexts?.merchant || selectedMerchantId, [propMerchantId, activeContexts, selectedMerchantId]);
  const { fetchFlagsList } = useInvestigationRedFlagsStore();
  const flagsList = useInsolvencyRedFlags();
  
  // PDF-related state
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const [merchantIndustry, setMerchantIndustry] = useState<{ industry: string; risk_segment: string } | null>(null);
  // Selected date/version from page header (used as runDate for PDFs)
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [formattedFinancialData, setFormattedFinancialData] = useState<any[]>([]);
  const [startYear, setStartYear] = useState<string>('2020');
  const [numberFormat, setNumberFormat] = useState<string>('crores');
  const [activeStatement, setActiveStatement] = useState<'income' | 'balance' | 'cashflow'>('income');

  // Helper function to map red flags to SectionHeaderWithFlags categories
  const mapRedFlagsToCategories = (redFlags: any[], filterRecipientId?: string) => {
    // Filter flags by recipient ID if provided
    const filteredFlags = filterRecipientId 
      ? redFlags.filter(flag => flag.rule_type === filterRecipientId)
      : redFlags;

    // Map flags to AssessmentFlag structure and categorize by severity
    const mappedFlags = filteredFlags.map(flag => ({
      id: flag.id,
      description: flag.description || '',
      isPositive: false, // Red flags are negative by default
      category: getTagCategory(flag.rule_type || ''), // Use mapped category instead of raw rule_type
      severity: (flag.severity?.toLowerCase() || 'medium') as 'severe' | 'high' | 'medium' | 'neutral' | 'good' | 'veryGood',
      redFlag_recipient_id: flag.rule_type
    }));

    // Categorize by severity
    const categorized = {
      extremeNegativeFlags: mappedFlags.filter(f => f.severity === 'severe'),
      negativeFlags: mappedFlags.filter(f => f.severity === 'high'),
      mildNegativeFlags: mappedFlags.filter(f => f.severity === 'medium'),
      neutralFlags: mappedFlags.filter(f => f.severity === 'neutral'),
      mildPositiveFlags: [] as any[],
      positiveFlags: [] as any[]
    };

    return categorized;
  };
  
  const activeMerchant = merchantIdList.find(m => m.id === merchantId);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const revenueData = useMemo(() => {
    if (!financialsData?.data || financialsData.data.length === 0) {
      return [];
    }

    return financialsData.data.map(item => {
      // Extract year from the date
      const year = new Date(item.year).getFullYear().toString();
      
      return {
        name: year,
        year: year,
        revenue: item.net_revenue || 0,
        profit: item.profit_after_tax || 0,
        cashFlow: item.cash_flows_from_used_in_operating_activities || 0
      };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [financialsData?.data]);

  // Fetch merchant industry data
  useEffect(() => {
    const fetchMerchantIndustry = async () => {
      if (activeMerchant?.id) {
        const industryData = await industryService.getMerchantIndustry(activeMerchant.id);
        setMerchantIndustry(industryData);
      }
    };

    fetchMerchantIndustry();
  }, [activeMerchant?.id]);

  // Transform financial data for PDF
  useEffect(() => {
    if (financialsData?.data && Array.isArray(financialsData.data) && financialsData.data.length > 0) {
      const formatted = financialsData.data.map(item => {
        const year = new Date(item.year).getFullYear().toString();
        const revenue = item.net_revenue || 0;
        const costOfSales = (item.total_cost_of_materials_consumed || 0) + (item.total_purchases_of_stock_in_trade || 0) + (item.total_changes_in_inventories_or_finished_goods || 0);
        const grossProfit = revenue - costOfSales;
        const totalOperatingExpenses = (item.total_operating_cost || 0) - costOfSales;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const operatingIncome = item.operating_profit || 0;
        const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
        const netIncome = item.profit_after_tax || 0;
        const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
        
        return {
          name: year,
          // Income Statement
          revenue,
          costOfSales,
          grossProfit,
          researchAndDevelopment: item.total_employee_benefit_expense || 0,
          salesAndMarketing: item.total_other_expenses || 0,
          generalAndAdmin: totalOperatingExpenses - (item.total_employee_benefit_expense || 0) - (item.total_other_expenses || 0),
          totalOperatingExpenses,
          operatingIncome,
          interestExpense: item.interest || 0,
          otherIncome: item.other_income || 0,
          incomeTaxes: 0,
          netIncome,
          grossMargin,
          operatingMargin,
          netMargin,
          sharesOutstanding: item.share_capital ? item.share_capital / 10 : 0,
          earningsPerShare: item.share_capital && item.share_capital > 0 ? (netIncome / (item.share_capital / 10)) : 0,
          
          // Balance Sheet
          tangibleAssets: item.tangible_assets || 0,
          intangibleAssets: item.intangible_assets || 0,
          capitalWorkInProgress: item.tangible_assets_capital_work_in_progress || 0,
          noncurrentInvestments: item.noncurrent_investments || 0,
          longTermLoansAndAdvances: item.long_term_loans_and_advances || 0,
          otherNoncurrentAssets: item.other_noncurrent_assets || 0,
          currentInvestments: item.current_investments || 0,
          inventories: item.inventories || 0,
          tradeReceivables: item.trade_receivables || 0,
          cashAndBankBalances: item.cash_and_bank_balances || 0,
          shortTermLoansAndAdvances: item.short_term_loans_and_advances || 0,
          otherCurrentAssets: item.other_current_assets || 0,
          totalAssets: item.given_assets_total || 0,
          shareCapital: item.share_capital || 0,
          reservesAndSurplus: item.reserves_and_surplus || 0,
          longTermBorrowings: item.long_term_borrowings || 0,
          otherLongTermLiabilities: item.other_long_term_liabilities || 0,
          longTermProvisions: item.long_term_provisions || 0,
          shortTermBorrowings: item.short_term_borrowings || 0,
          tradePayables: item.trade_payables || 0,
          otherCurrentLiabilities: item.other_current_liabilities || 0,
          shortTermProvisions: item.short_term_provisions || 0,
          totalLiabilities: item.given_liabilities_total || 0,
          
          // Cash Flow Statement
          profitBeforeTax: item.profit_before_tax_cf || 0,
          financeCostAndDepreciation: item.adjustment_for_finance_cost_and_depreciation || 0,
          currentAndNonCurrentAssets: item.adjustment_for_current_and_non_current_assets || 0,
          currentAndNonCurrentLiabilities: item.adjustment_for_current_and_non_current_liabilities || 0,
          otherOperatingAdjustments: item.other_adjustments_in_operating_activities || 0,
          cashFlowFromOperatingActivities: item.cash_flows_from_used_in_operating_activities || 0,
          purchaseOfAssets: item.cash_outflow_from_purchase_of_assets || 0,
          saleOfAssets: item.cash_inflow_from_sale_of_assets || 0,
          incomeFromAssets: item.income_from_assets || 0,
          otherInvestingAdjustments: item.other_adjustments_in_investing_activities || 0,
          cashFlowFromInvestingActivities: item.cash_flows_from_used_in_investing_activities || 0,
          repaymentOfCapitalAndBorrowings: item.cash_outflow_from_repayment_of_capital_and_borrowings || 0,
          raisingCapitalAndBorrowings: item.cash_inflow_from_raisng_capital_and_borrowings || 0,
          interestAndDividendsPaid: item.interest_and_dividends_paid || 0,
          otherFinancingAdjustments: item.other_adjustments_in_financing_activities || 0,
          cashFlowFromFinancingActivities: item.cash_flows_from_used_in_financing_activities || 0,
          cashAndCashEquivalentsBeforeExchange: item.incr_decr_in_cash_cash_equv_before_effect_of_excg_rate_changes || 0,
          adjustmentsToCashAndEquivalents: item.adjustments_to_cash_and_cash_equivalents || 0,
          cashAndCashEquivalents: item.incr_decr_in_cash_cash_equv || 0,
          cashAtEndOfPeriod: item.cash_flow_statement_at_end_of_period || 0
        };
      }).sort((a, b) => parseInt(a.name) - parseInt(b.name));
      
      setFormattedFinancialData(formatted);
      
      // Set default start year
      if (formatted.length > 0 && !startYear) {
        setStartYear(formatted[0].name);
      }
    }
  }, [financialsData, startYear]);

  // Combine both financial data fetches into a single useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!merchantId) return;

      try {
        // Fetch financial metrics via merchantService to reuse caching/deduplication
        const data = await merchantService.getMerchantFinancialMetrics(merchantId);
        setFinancialMetrics(data || []);
        
        // Only fetch financial statements if we don't have them yet
        const store = useInsolvencyFinancialStore.getState();
        if (!store.financialsData?.data) {
          await store.fetchFinancialsData(merchantId);
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      }
    };

    fetchData();
  }, [merchantId]);

  useEffect(() => {
    if (merchantId) {
      fetchFlagsList(merchantId);
    }
  }, [merchantId, fetchFlagsList]);

  // Handle PDF generation
  const handleGenerateReport = async () => {
    if (!activeMerchant || !pdfTemplateRef.current) {
      console.error('Missing required data for PDF generation');
      return;
    }

    try {
      await generateFinancialOperationalPDF(
        pdfTemplateRef.current,
        activeMerchant.legalName,
        merchantIndustry, // Pass the industry object
        activeMerchant.cin || activeMerchant.id, // Pass the CIN
        {
          filename: `${activeMerchant.legalName.replace(/[^a-z0-9]/gi, ' ')} Financial & Operational Report.pdf`
            , runDate: selectedDate || null
        }
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <motion.div 
      className="space-y-6 px-2 min-w-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {activeMerchant ? (
        <InsolvencyPageHeader
          activeMerchant={activeMerchant}
          sections={[
            { id: 'financial-metrics', title: 'Financial Metrics' },
            { id: 'financial-visualizations', title: 'Financial Visualizations' },
            { id: 'financial-statements', title: 'Financial Statements' }
          ]}
          onGenerateReport={handleGenerateReport}
          onDateChange={(date) => setSelectedDate(date)}
        />
      ) : (
        <CustomLoader 
          loading={true}
          specs={{
            type: 'spinner',
            size: 'lg',
            color: 'blue',
            text: 'Loading merchant information...'
          }}
        />
      )}
      
      <motion.div variants={itemVariants}>
        {(() => {
          const categorizedFlags = mapRedFlagsToCategories(flagsList, "insolvency_financial_financialMetrics");
          return (
            <SectionHeaderWithFlags 
              extremeNegativeFlags={categorizedFlags.extremeNegativeFlags}
              negativeFlags={categorizedFlags.negativeFlags}
              mildNegativeFlags={categorizedFlags.mildNegativeFlags}
              neutralFlags={categorizedFlags.neutralFlags}
              mildPositiveFlags={categorizedFlags.mildPositiveFlags}
              positiveFlags={categorizedFlags.positiveFlags}
              title="Financial Metrics"
              icon={LineChart}
              iconColorClass="text-blue-600"
              titleColorClass="text-blue-700"
              flagTypeOrderList={['extremeNegative', 'negative', 'mildNegative', 'neutral']}
            />
          );
        })()}
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <CustomLoader 
          loading={financialMetrics.length === 0}
          specs={{
            type: 'spinner',
            size: 'md',
            color: 'blue',
            text: 'Loading financial metrics...'
          }}
        >
          <KeyMetrics
            keyMetricList={{ key_metrics: financialMetrics }}
            isMetricsExpanded={isMetricsExpanded}
            setIsMetricsExpanded={setIsMetricsExpanded}
            showHeader={false}
          />
        </CustomLoader>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <Visualization
            {...revenueTrendConfig}
            data={revenueData}
            title="Revenue Trend"
            isEnclosedInCard={true}
            showCAGRview={true}
            hideCodeTab={true}
            hideAllTabs={true}
            hideRefreshButton={true}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Visualization
            {...profitTrendConfig}
            data={revenueData}
            title="Profit Trend"
            isEnclosedInCard={true}
            showCAGRview={true}
            hideAllTabs={true}
            hideRefreshButton={true}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Visualization
            {...cashFlowTrendConfig}
            data={revenueData}
            title="Cash Flow from Operations Trend"
            isEnclosedInCard={true}
            showCAGRview={true}
            hideAllTabs={true}
            hideRefreshButton={true} 
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        {(() => {
          const categorizedFlags = mapRedFlagsToCategories(flagsList, "insolvency_financial_financialStatements");
          return (
            <SectionHeaderWithFlags 
              extremeNegativeFlags={categorizedFlags.extremeNegativeFlags}
              negativeFlags={categorizedFlags.negativeFlags}
              mildNegativeFlags={categorizedFlags.mildNegativeFlags}
              neutralFlags={categorizedFlags.neutralFlags}
              mildPositiveFlags={categorizedFlags.mildPositiveFlags}
              positiveFlags={categorizedFlags.positiveFlags}
              title="Financial Statements"
              icon={BarChart3}
              iconColorClass="text-blue-600"
              titleColorClass="text-blue-700"
              flagTypeOrderList={['extremeNegative', 'negative', 'mildNegative', 'neutral']}
            />
          );
        })()}
        <div className="mt-4">
          <FinancialStatement merchantId={merchantId || undefined} />
        </div>
      </motion.div>

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={pdfTemplateRef}>
          {activeMerchant && (
            <FinancialOperationalPDFTemplate
              activeMerchant={activeMerchant}
              financialMetrics={financialMetrics}
              revenueData={revenueData}
              formattedFinancialData={formattedFinancialData}
              startYear={startYear}
              numberFormat={numberFormat}
              activeStatement={activeStatement}
              merchantIndustry={merchantIndustry}
              redFlags={flagsList}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InsolvencyFinancialOperationalTab;
