"use client";

import { FC, useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plane,
  Activity,
  Building,
  Store,
  TrendingUp,
  Users,
  AlertTriangle,
  Calendar,
  ArrowLeftRight,
  Wallet,
  CircleCheck,
  FileCheck,
  Puzzle,
  ShieldCheck,
  MapPin,
  Factory,
  Clock,
  FileWarning,
  ExternalLink,
} from "lucide-react";
import { useActiveContext } from "@/app/layout/ActiveContext/useActiveContext";
import { useMerchantIdStore } from "@/app/store/merchant/merchantIdStore";
import { ReportableSection } from "@/app/pages/ReportGeneration/utils/ReportSectionHelpers";
import InsolvencyPageHeader from "./Components/InsolvencyPageHeader";
import ProbabilityOfDefault from "./Components/ProbabilityOfDefault";
import KeyCreditInsightsSection from "./KeyCreditInsightsSection";
import OverviewPDFTemplate from "./Report/Overview/OverviewPDFTemplate";
import {
  generateOverviewPDF,
  generateFullReportPDF,
  preparePDFElement,
} from "./Report/utils/pdfUtils";
import { KeyMetric } from "@/app/types";
import { Visualization } from "@/components/custom/visualization";
import SectionHeaderWithRedFlags from "@/components/custom/SectionHeaderWithRedFlags";
import { KeyMetrics } from "@/components/custom/KeyMetrics";
import { API } from "@/app/services/axios";
import {
  RedFlag,
  useInvestigationRedFlagsStore,
} from "@/app/store/merchant/InvestigationRedFlagsStore";
import { industryService } from "@/app/services/industryServices";
import {
  monthlyMetricsData,
  transactionsConfig,
  chargebacksConfig,
  balanceConfig,
  financialStatsData,
} from "./SampleData/sampleData";
import {
  allRedFlags,
  financialRedFlags,
  operationalRedFlags,
  legalRedFlags,
  marketRedFlags,
  transactionRedFlags,
} from "./SampleData/redFlagsSampleData";
import { useInvestigationOverviewStore } from "@/app/store/merchant/investigationOverviewStore";
import { useInsolvencyRedFlags } from "./InsolvencyRedFlagsTab";
import {
  categorizeRedFlags,
  getRedFlagDisplayName,
} from "./SampleData/syntheticTagsMapping";
import html2canvas from "html2canvas";
import { RiskAssessmentParagraph } from "@/components/custom/RiskAssessmentParagraph";
import React from "react";
import { RiskAssessmentSection } from "./Components/RiskAssessmentSection";
import ExecutiveSummaryFlags from "./Components/ExecutiveSummaryFlags";
import { PDFSectionWrapper } from "@/components/custom/PDFSectionWrapper";
import CustomLoader from "@/components/custom/CustomLoader";
import FullReportPDFTemplate from "./Report/FullReport/FullReportPDFTemplate";
// generateFullReportPDF is now provided by centralized pdf utils
import { metricsService } from "@/app/services/metricsService";
import { merchantService } from "@/app/services/merchantServices";
import { insolvencyExternalInsightsConfig } from "@/components/custom/ExternalInsights";
import { Star } from "lucide-react";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { watchlistService, WatchlistItem } from "@/app/services/watchlistServices";
import { useProfileStore } from "@/app/store/authentication/profileStore";
import { useRiskMetricsStore } from "@/app/store/merchant/riskMetricsStore";

interface CompanyMetric {
  label: string;
  value: string | number;
  icon: string;
}

interface CompanyMetricsResponse {
  success: boolean;
  message: string;
  data: CompanyMetric[];
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

interface ExecutiveSummaryResponse {
  success: boolean;
  message: string;
  data: {
    summary_data: string;
  };
}

// Simple wrapper for visualization components
const ReportVisualization = ({ config, data, title, chartRef }: any) => {
  return (
    <div ref={chartRef}>
      <Visualization
        {...config}
        data={data}
        className="w-full"
        isEnclosedInCard={true}
        title={title}
        height={250}
        isLivePreview={false}
        onUpdate={(updatedProps) => {
          console.log("Visualization updated:", updatedProps);
          // Here you could update the config or data if needed
          // For now, just log the changes
        }}
      />
    </div>
  );
};

interface InsolvencyOverviewTabProps {
  merchantId?: string;
}

const InsolvencyOverviewTab: FC<InsolvencyOverviewTabProps> = ({
  merchantId: propMerchantId,
}) => {
  const { activeContexts } = useActiveContext();
  const { merchantIdList, selectedMerchantId } = useMerchantIdStore();
  const { organizationId, fetchProfile } = useProfileStore();
  const { metrics: riskMetrics } = useRiskMetricsStore();
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(false);
  const [isIndustryExpanded, setIsIndustryExpanded] = useState(false);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetric[]>([]);
  const { fetchTransactionMetrics, transactionMetrics } =
    useInvestigationOverviewStore();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);
  const [metricsSelectionMode, setMetricsSelectionMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<number>>(
    new Set()
  );
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [merchantIndustry, setMerchantIndustry] = useState<{
    industry: string;
    risk_segment: string;
  } | null>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);

  // Full report: metrics state
  const [processedMetrics, setProcessedMetrics] = useState<any[]>([]);
  const [metricsStartYear, setMetricsStartYear] = useState<number>(2020);
  const [availableYears, setAvailableYears] = useState<number[]>([2020, 2021, 2022, 2023, 2024]);
  const [metricsNumberFormat, setMetricsNumberFormat] = useState<string>("₹");

  // Full report: financial state
  const [financialMetrics, setFinancialMetrics] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [formattedFinancialData, setFormattedFinancialData] = useState<any[]>(
    []
  );
  const [finStartYear, setFinStartYear] = useState<string>("2020");
  const [finNumberFormat, setFinNumberFormat] = useState<string>("raw");
  const [activeStatement, setActiveStatement] = useState<
    "income" | "balance" | "cashflow"
  >("income");

  // Full report: external insights state
  const [insightsData, setInsightsData] = useState<Record<string, any[]>>({});
  const [redFlagsData, setRedFlagsData] = useState<Record<string, any[]>>({});

  // Get red flags data from the store
  const { fetchFlagsList } = useInvestigationRedFlagsStore();
  const flagsList = useInsolvencyRedFlags();

  // The flagged-directors rule is not wanted on the Company section. Filtered by
  // rule_code rather than blanking the section, so any other company-level flag
  // still surfaces here.
  const companyFlagsList = useMemo(
    () => flagsList.filter((f: any) => f?.rule_code !== 'rule_mer_directors_kpm_flags'),
    [flagsList]
  );
  
  // Watchlist data for PDF
  const [watchlistItem, setWatchlistItem] = useState<WatchlistItem | null>(null);
  
   // Selected date/version from page header
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedVersionNo, setSelectedVersionNo] = useState<number | null>(null);
  const [showIndustrialMaterials, setShowIndustrialMaterials] = useState(true);

  // Executive Summary Red Flags Data - Generated from API data
  const executiveSummaryRedFlags = useMemo(() => {
    const categorizedFlags = categorizeRedFlags(flagsList);

    // If no flags from API, return empty arrays
    if (flagsList.length === 0) {
      return {
        financialRedFlags: [],
        externalRedFlags: [],
      };
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getFullYear()} ${date.toLocaleString("default", {
        month: "short",
      })}`;
    };

    const formatValue = (
      values: Record<string, string | number> | null | undefined
    ): string | null => {
      if (!values) return null;
      const value = Object.values(values)[0];
      return value === "N/A" ? null : value?.toString() || null;
    };

    return {
      financialRedFlags: categorizedFlags.financial.slice(0, 3).map((flag) => ({
        created_at: flag.created_at,
        title: getRedFlagDisplayName(flag),
        mainValue: formatValue(flag.metric_values),
        keyInsight: flag.description || "Financial risk detected",
        impactOnCompany: "Risk level: " + flag.severity,
        severity: flag.severity as "Severe" | "High" | "Medium" | "Low",
      })),
      externalRedFlags: categorizedFlags.external.slice(0, 3).map((flag) => ({
        created_at: flag.created_at,
        title: getRedFlagDisplayName(flag),
        mainValue: formatValue(flag.metric_values),
        keyInsight: flag.description || "External risk detected",
        impactOnCompany: "Risk level: " + flag.severity,
        severity: flag.severity as "Severe" | "High" | "Medium" | "Low",
      })),
    };
  }, [flagsList]);

  const merchantId = useMemo(
    () => propMerchantId || activeContexts?.merchant || selectedMerchantId,
    [propMerchantId, activeContexts, selectedMerchantId]
  );
  const activeMerchant = merchantIdList.find((m) => m.id === merchantId);

  // Synchronously reset the risk metrics store whenever the merchantId changes.
  // This prevents child components from receiving or syncing with stale data 
  // from the previous merchant during the transition.
  const [lastResetMerchantId, setLastResetMerchantId] = useState(merchantId);
  if (lastResetMerchantId !== merchantId) {
    setLastResetMerchantId(merchantId);
    setSelectedDate("");
    setSelectedVersionNo(null);
    setCompanyMetrics([]);
    setCompanyData(null);
    setIndustryData(null);
    setExecutiveSummary(null);
    setMerchantIndustry(null);
    setWatchlistItem(null);
    useRiskMetricsStore.setState({ metrics: null, error: null, loading: true });
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Helper function to ensure numbers
  const toNumber = (value: string | number): number => {
    return typeof value === "string" ? parseFloat(value) : value;
  };

  // Visualization configs array
  const visualizationConfigs = [
    { key: "transactions", config: transactionsConfig, title: "Transactions" },
    { key: "chargebacks", config: chargebacksConfig, title: "Chargebacks" },
    { key: "balance", config: balanceConfig, title: "Balance" },
  ];
  // Refs and images for each visualization
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [chartImages, setChartImages] = useState<{
    [key: string]: string | null;
  }>({});

  useEffect(() => {
    const fetchCompanyMetrics = async () => {
      if (!merchantId) return;

      try {
        const { data } = await API.get<CompanyMetricsResponse>(
          `/api/v1/credit-insolvency/${merchantId}/getCompanyMetrics`
        );
        if (data.success) {
          setCompanyMetrics(data.data);
        }
      } catch (error) {
        console.error("Error fetching company metrics:", error);
      }
    };

    fetchCompanyMetrics();
  }, [merchantId]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!merchantId) return;
      try {
        await fetchTransactionMetrics(merchantId);
      } catch (error) {
        console.error("Error fetching transaction metrics:", error);
      }
    };

    fetchMetrics();
  }, [merchantId, fetchTransactionMetrics]);

  useEffect(() => {
    if (transactionMetrics?.data) {
      setCompanyMetrics(transactionMetrics.data);
    }
  }, [transactionMetrics]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!merchantId) return;

      try {
        const { data } = await API.get(
          `/api/v1/credit-insolvency/${merchantId}/aboutTheCompany`
        );
        if (data.success) {
          setCompanyData(data.data);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      }
    };

    fetchCompanyData();
  }, [merchantId]);

  // useEffect(() => {
  //   const fetchIndustryData = async () => {
  //     if (!merchantId) return;

  //     try {
  //       const { data } = await API.get(
  //         `/api/v1/credit-insolvency/${merchantId}/aboutIndustryAndRisk`
  //       );
  //       if (data.success) {
  //         setIndustryData(data.data);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching industry data:", error);
  //     }
  //   };

  //   fetchIndustryData();
  // }, [merchantId]);

  // Fetch watchlist data for PDF
  useEffect(() => {
    const fetchWatchlistData = async () => {
      if (!organizationId || !merchantId) {
        // Fetch profile if organizationId is not available
        if (!organizationId) {
          fetchProfile();
        }
        return;
      }

      try {
        const result = await watchlistService.getOrganizationWatchlist(organizationId);
        if (result.success && result.data) {
          const matchingItem = result.data.find(
            (item: WatchlistItem) => item.merchant_id === merchantId
          );
          setWatchlistItem(matchingItem || null);
        }
      } catch (error) {
        console.error("Error fetching watchlist data:", error);
        setWatchlistItem(null);
      }
    };

    fetchWatchlistData();
  }, [organizationId, merchantId, fetchProfile]);

  // Full report: fetch metrics (processed) for Metrics section
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!merchantId) return;
      try {
        const response = await metricsService.getMetricsByYear(merchantId);
        const apiMetrics = response.metrics || [];

        // Determine available years from API data
        const yearSet = new Set<number>();
        apiMetrics.forEach(metric => {
            Object.keys(metric).forEach(key => {
                if (/^\d{4}$/.test(key)) {
                    yearSet.add(parseInt(key));
                }
            });
        });
        const dynamicYears = yearSet.size > 0 ? Array.from(yearSet).sort((a, b) => a - b) : [2020, 2021, 2022, 2023, 2024];
        setAvailableYears(dynamicYears);
        
        if (dynamicYears.length > 0) {
            setMetricsStartYear(dynamicYears[0]);
        }

        const processed = apiMetrics.map((apiMetric: any) => {
          const historicalValues: (number | null)[] = [];
          dynamicYears.forEach((year) => {
            const yearValue = apiMetric[year.toString()];
            if (
              yearValue !== "-" &&
              yearValue !== undefined &&
              yearValue !== null
            ) {
              historicalValues.push(Number(yearValue));
            } else {
              historicalValues.push(null);
            }
          });

          let normalRange;
          if (
            apiMetric.threshold_1 !== null &&
            apiMetric.threshold_1 !== undefined &&
            apiMetric.threshold_2 !== null &&
            apiMetric.threshold_2 !== undefined
          ) {
            if (apiMetric.threshold_redflag_sign === ">") {
              normalRange = {
                min: -Infinity,
                max: Number(apiMetric.threshold_1),
              };
            } else {
              normalRange = {
                min: Number(apiMetric.threshold_1),
                max: Infinity,
              };
            }
          } else {
            normalRange = null;
          }

          const calculateRelativeToNormalRange = (
            value: number | null
          ): number | null => {
            if (value === null || value === undefined || isNaN(value))
              return null;
            const sign = apiMetric.threshold_redflag_sign;
            if (
              sign === "-" ||
              apiMetric.threshold_1 === null ||
              apiMetric.threshold_1 === undefined ||
              apiMetric.threshold_2 === null ||
              apiMetric.threshold_2 === undefined
            ) {
              return null;
            }
            const threshold =
              sign === ">" ? normalRange?.max ?? 0 : normalRange?.min ?? 0;
            if (sign === ">") {
              return value > threshold
                ? ((value - (threshold as number)) / (threshold as number)) *
                    100
                : 0;
            } else {
              return value < threshold
                ? (((threshold as number) - value) / (threshold as number)) *
                    100
                : 0;
            }
          };

          const relativeValues = historicalValues.map(
            calculateRelativeToNormalRange
          );

          return {
            id: apiMetric.metric_code,
            name: apiMetric.metric,
            type: "Financial",
            icon: "BarChart3",
            normalRange,
            historicalValues,
            relativeValues,
            thresholdSign: apiMetric.threshold_redflag_sign,
            threshold1:
              apiMetric.threshold_1 !== null
                ? Number(apiMetric.threshold_1)
                : null,
            threshold2:
              apiMetric.threshold_2 !== null
                ? Number(apiMetric.threshold_2)
                : null,
            formula: apiMetric.formula,
            impactOnCompany: apiMetric.description,
            industryMedian: apiMetric.industry_median,
            category: apiMetric.category,
            bucket: (() => {
              const b = (apiMetric.bucket || apiMetric.Bucket || "").toLowerCase();
              if (b.includes('leverage') || b.includes('solvency')) return "Leverage Risk";
              if (b.includes('growth')) return "Growth Risk";
              if (b.includes('liquid')) return "Liquidity Risk";
              return "Others";
            })()
          };
        });
        const BUCKET_ORDER = ["Leverage Risk", "Growth Risk", "Liquidity Risk", "Others"];
        const sortedProcessed = [...processed].sort((a, b) => {
          const indexA = BUCKET_ORDER.indexOf(a.bucket || "Others");
          const indexB = BUCKET_ORDER.indexOf(b.bucket || "Others");
          
          const finalIndexA = indexA === -1 ? 99 : indexA;
          const finalIndexB = indexB === -1 ? 99 : indexB;

          if (finalIndexA !== finalIndexB) {
            return finalIndexA - finalIndexB;
          }
          return a.name.localeCompare(b.name);
        });

        setProcessedMetrics(sortedProcessed);
      } catch (err) {
        console.error("Failed to fetch metrics for full report:", err);
        setProcessedMetrics([]);
      }
    };

    fetchMetrics();
  }, [merchantId]);

  // Full report: fetch financial metrics and statements
  useEffect(() => {
    const fetchFinancials = async () => {
      if (!merchantId) return;
      try {
        // Financial metrics summary
        const { data } = await API.get(
          `/api/v1/merchants/${merchantId}/financial-metrics`
        );
        setFinancialMetrics(data || []);

        // Financial statements table
        const tableResp = await merchantService.getMerchantFinancialTable(
          merchantId
        );
        const dataArr = Array.isArray(tableResp?.data) ? tableResp.data : [];

        const revData = dataArr
          .map((item: any) => {
            const year = new Date(item.year).getFullYear().toString();
            return {
              name: year,
              year: year,
              revenue: item.net_revenue || 0,
              profit: item.profit_after_tax || 0,
              cashFlow: item.cash_flows_from_used_in_operating_activities || 0,
            };
          })
          .sort((a: any, b: any) => parseInt(a.year) - parseInt(b.year));
        setRevenueData(revData);

        const formatted = dataArr
          .map((item: any) => {
            const year = new Date(item.year).getFullYear().toString();
            const revenue = item.net_revenue || 0;
            const costOfSales = (item.total_cost_of_materials_consumed || 0) + (item.total_purchases_of_stock_in_trade || 0) + (item.total_changes_in_inventories_or_finished_goods || 0);
            const grossProfit = revenue - costOfSales;
            const totalOperatingExpenses =
              (item.total_operating_cost || 0) - costOfSales;
            const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
            const operatingIncome = item.operating_profit || 0;
            const operatingMargin =
              revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
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
              generalAndAdmin:
                totalOperatingExpenses -
                (item.total_employee_benefit_expense || 0) -
                (item.total_other_expenses || 0),
              totalOperatingExpenses,
              operatingIncome,
              interestExpense: item.interest || 0,
              otherIncome: item.other_income || 0,
              incomeTaxes: 0,
              netIncome,
              grossMargin,
              operatingMargin,
              netMargin,
              sharesOutstanding: item.share_capital
                ? item.share_capital / 10
                : 0,
              earningsPerShare:
                item.share_capital && item.share_capital > 0
                  ? netIncome / (item.share_capital / 10)
                  : 0,

              // Balance Sheet
              tangibleAssets: item.tangible_assets || 0,
              intangibleAssets: item.intangible_assets || 0,
              capitalWorkInProgress:
                item.tangible_assets_capital_work_in_progress || 0,
              noncurrentInvestments: item.noncurrent_investments || 0,
              longTermLoansAndAdvances: item.long_term_loans_and_advances || 0,
              otherNoncurrentAssets: item.other_noncurrent_assets || 0,
              currentInvestments: item.current_investments || 0,
              inventories: item.inventories || 0,
              tradeReceivables: item.trade_receivables || 0,
              cashAndBankBalances: item.cash_and_bank_balances || 0,
              shortTermLoansAndAdvances:
                item.short_term_loans_and_advances || 0,
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
              financeCostAndDepreciation:
                item.adjustment_for_finance_cost_and_depreciation || 0,
              currentAndNonCurrentAssets:
                item.adjustment_for_current_and_non_current_assets || 0,
              currentAndNonCurrentLiabilities:
                item.adjustment_for_current_and_non_current_liabilities || 0,
              otherOperatingAdjustments:
                item.other_adjustments_in_operating_activities || 0,
              cashFlowFromOperatingActivities:
                item.cash_flows_from_used_in_operating_activities || 0,
              purchaseOfAssets: item.cash_outflow_from_purchase_of_assets || 0,
              saleOfAssets: item.cash_inflow_from_sale_of_assets || 0,
              incomeFromAssets: item.income_from_assets || 0,
              otherInvestingAdjustments:
                item.other_adjustments_in_investing_activities || 0,
              cashFlowFromInvestingActivities:
                item.cash_flows_from_used_in_investing_activities || 0,
              repaymentOfCapitalAndBorrowings:
                item.cash_outflow_from_repayment_of_capital_and_borrowings || 0,
              raisingCapitalAndBorrowings:
                item.cash_inflow_from_raisng_capital_and_borrowings || 0,
              interestAndDividendsPaid: item.interest_and_dividends_paid || 0,
              otherFinancingAdjustments:
                item.other_adjustments_in_financing_activities || 0,
              cashFlowFromFinancingActivities:
                item.cash_flows_from_used_in_financing_activities || 0,
              cashAndCashEquivalentsBeforeExchange:
                item.incr_decr_in_cash_cash_equv_before_effect_of_excg_rate_changes ||
                0,
              adjustmentsToCashAndEquivalents:
                item.adjustments_to_cash_and_cash_equivalents || 0,
              cashAndCashEquivalents: item.incr_decr_in_cash_cash_equv || 0,
              cashAtEndOfPeriod: item.cash_flow_statement_at_end_of_period || 0,
            };
          })
          .sort((a: any, b: any) => parseInt(a.name) - parseInt(b.name));

        setFormattedFinancialData(formatted);
        if (formatted.length > 0 && !finStartYear) {
          setFinStartYear(formatted[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch financials for full report:", err);
        setFinancialMetrics([]);
        setRevenueData([]);
        setFormattedFinancialData([]);
      }
    };

    fetchFinancials();
  }, [merchantId]);

  // Full report: fetch external insights
  useEffect(() => {
    const fetchExternalInsightsData = async () => {
      if (!merchantId) return;
      try {
        const rawData = await merchantService.getMerchantExternalData(
          merchantId
        );
        let auditData: any = null;
        let annualData: any = null;
        try {
          auditData = await merchantService.getMerchantAuditReportInsights(
            merchantId
          );
        } catch {}
        try {
          annualData = await merchantService.getMerchantAnnualReportInsights(
            merchantId
          );
        } catch {}

        const transformed = insolvencyExternalInsightsConfig.dataTransformer({
          main: rawData,
          audit: auditData || undefined,
          annual: annualData || undefined,
        });
        setInsightsData(transformed);

        const sectionRedFlags: Record<string, any[]> = {};
        Object.keys(transformed).forEach((sectionKey) => {
          const items = transformed[sectionKey] || [];
          if (items.length > 0) {
            sectionRedFlags[sectionKey] =
              insolvencyExternalInsightsConfig.redFlagMapper(
                sectionKey,
                items,
                merchantId
              );
          }
        });
        setRedFlagsData(sectionRedFlags);
      } catch (err) {
        console.error(
          "Failed to fetch external insights for full report:",
          err
        );
        setInsightsData({});
        setRedFlagsData({});
      }
    };

    fetchExternalInsightsData();
  }, [merchantId]);

  // Fetch red flags when component mounts or when merchantId changes
  useEffect(() => {
    if (merchantId) {
      fetchFlagsList(merchantId);
    }
  }, [merchantId, fetchFlagsList]);

  // Fetch merchant industry data
  useEffect(() => {
    const fetchMerchantIndustry = async () => {
      if (activeMerchant?.id) {
        const industryData = await industryService.getMerchantIndustry(
          activeMerchant.id
        );
        setMerchantIndustry(industryData);
      }
    };

    fetchMerchantIndustry();
  }, [activeMerchant?.id]);

  useEffect(() => {
    // Capture chart images after a short delay to ensure charts are rendered
    const timeout = setTimeout(() => {
      // Inject style to hide .hide-for-pdf elements
      const style = document.createElement("style");
      style.innerHTML = ".hide-for-pdf { display: none !important; }";
      document.head.appendChild(style);

      visualizationConfigs.forEach(({ key }) => {
        const ref = chartRefs.current[key];
        if (ref) {
          html2canvas(ref).then((canvas) => {
            setChartImages((prev) => ({
              ...prev,
              [key]: canvas.toDataURL("image/png"),
            }));
          });
        }
      });

      // Remove the style after a short delay to ensure all captures are done
      setTimeout(() => {
        document.head.removeChild(style);
      }, 500);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [monthlyMetricsData]);

  // Fetch executive summary
  // useEffect(() => {
  //   const fetchExecutiveSummary = async () => {
  //     if (!merchantId) return;
  //     try {
  //       const { data } = await API.get<ExecutiveSummaryResponse>(`/api/v1/credit-insolvency/${merchantId}/executiveSummary`);
  //       if (data.success) {
  //         setExecutiveSummary(data.data.summary_data);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching executive summary:', error);
  //     }
  //   };
  //   fetchExecutiveSummary();
  // }, [merchantId]);

  // Handle report generation for specific sections
  const handleSectionReport = (
    sectionType: string,
    data: any,
    reportId?: string,
    isNewReport?: boolean
  ) => {
    // Add detailed logging to help with debugging
    console.log(`Handling report for section ${sectionType}`, {
      sectionType,
      dataKeys: Object.keys(data),
      dataValues: JSON.stringify(data),
      reportId,
      isNewReport,
    });

    const reportSectionRef = document.querySelector(
      `[data-report-section="${sectionType}"]`
    );

    if (reportSectionRef) {
      console.log(`Found report section element for ${sectionType}`);

      if (reportId) {
        // Add to existing report
        console.log(
          `Dispatching add-to-report event for ${sectionType} to report ${reportId}`
        );

        const event = new CustomEvent("add-to-report", {
          detail: { type: sectionType, data, reportId },
          bubbles: true,
        });
        reportSectionRef.dispatchEvent(event);
      } else if (isNewReport) {
        // Create new report
        console.log(`Dispatching generate-report event for ${sectionType}`);

        const event = new CustomEvent("generate-report", {
          detail: { type: sectionType, data },
          bubbles: true,
        });
        reportSectionRef.dispatchEvent(event);
      }
    } else {
      console.error(
        `Report section element not found for type: ${sectionType}`
      );
    }
  };

  // Handle metrics selection
  const handleMetricsSelectionChange = (
    selected: boolean,
    metric: any,
    index: number
  ) => {
    setSelectedMetrics((prev) => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(index);
      } else {
        newSelection.delete(index);
      }
      return newSelection;
    });
  };

  // Toggle metrics selection mode
  const toggleMetricsSelectionMode = () => {
    setMetricsSelectionMode(!metricsSelectionMode);
    if (metricsSelectionMode) {
      // Clear selection when exiting selection mode
      setSelectedMetrics(new Set());
    }
  };

  // Helper function to extract domain from URL
  const extractDomain = (url: string) => {
    try {
      const domain = new URL(
        url.startsWith("http") ? url : `https://${url}`
      ).hostname.replace("www.", "");
      return domain;
    } catch {
      return url;
    }
  };

  // Create a dynamic data object that updates with selection
  const dynamicMetricsData = React.useMemo(() => {
    const metricsToReport =
      metricsSelectionMode && selectedMetrics.size > 0
        ? companyMetrics.filter((_, index) => selectedMetrics.has(index))
        : companyMetrics;

    return {
      companyMetrics: metricsToReport,
      keyMetricList: { key_metrics: metricsToReport },
      title: "Company Metrics",
    };
  }, [companyMetrics, metricsSelectionMode, selectedMetrics]);

  // Handle PDF generation
  const handleGenerateReport = async () => {
    if (!activeMerchant || !pdfTemplateRef.current) {
      console.error("Missing required data for PDF generation");
      return;
    }

    try {
      await generateOverviewPDF(
        pdfTemplateRef.current,
        activeMerchant.legalName,
        merchantIndustry, // Pass the industry object
        activeMerchant.cin || activeMerchant.id, // Pass the CIN
        {
          filename: `${activeMerchant.legalName.replace(
            /[^a-z0-9]/gi,
            " "
          )} Overview Report.pdf`,
          runDate: selectedDate || null,
        }
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleGenerateFullReport = async () => {
    if (!activeMerchant || !fullReportRef.current) {
      console.error("Missing required data for Full Report PDF generation");
      return;
    }

    try {
      await generateFullReportPDF(
        fullReportRef.current,
        activeMerchant.legalName,
        merchantIndustry || undefined,
        activeMerchant.cin || activeMerchant.id,
        {
          filename: `${activeMerchant.legalName.replace(
            /[^a-z0-9]/gi,
            " "
          )} Full Report.pdf`,
          // Ensure the server header uses the same run date selected in the UI
          runDate: selectedDate || null,
        }
      );
    } catch (error) {
      console.error("Error generating Full Report PDF:", error);
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
            { id: "executive-summary", title: "Executive Summary" },
            {
              id: "default-probability",
              title: "Probability of Default Analysis",
            },
            { id: "company-overview", title: "Company Overview" },
            { id: "company-metrics", title: "Company Metrics" },
            { id: "industry-overview", title: "About Industry" },
          ]}
          onGenerateReport={handleGenerateReport}
          onGenerateFullReport={handleGenerateFullReport}
          onDateChange={(date, versionNo) => {
            setSelectedDate(date);
            setSelectedVersionNo(versionNo);
          }}
        />
      ) : (
        <CustomLoader
          loading={true}
          specs={{
            type: "spinner",
            size: "lg",
            color: "blue",
            text: "Loading merchant information...",
          }}
        />
      )}

      {/* <motion.div 
        variants={itemVariants} 
        id="executive-summary"
        className="executive-summary"
        data-pdf-section
      >
        <CustomLoader 
          loading={flagsList.length === 0}
          specs={{
            type: 'spinner',
            size: 'md',
            color: 'blue',
            text: 'Loading executive summary...'
          }}
        >
          <ExecutiveSummaryFlags
            financialRedFlags={executiveSummaryRedFlags.financialRedFlags}
            externalRedFlags={executiveSummaryRedFlags.externalRedFlags}
          />
        </CustomLoader>
      </motion.div> */}

      <motion.div
        variants={itemVariants}
        className="space-y-4"
        id="company-overview"
      >
        {/* <ReportableSection type="company-overview" data={{ companyData }}> */}
        <SectionHeaderWithRedFlags
          redFlags={companyFlagsList}
          title="Company"
          icon={Building2}
          iconColorClass="text-blue-600"
          redFlag_recepient_id="insolvency_overview_company"
          //onReport={(reportId, isNewReport) => handleSectionReport("company-overview", { companyData }, reportId, isNewReport)}
        />
        <div className="text-gray-600 leading-relaxed">
          {companyData ? (
            <>
              <p className="py-2">
                {companyData.about_the_company
                  .split(". ")
                  .slice(0, 2)
                  .join(". ")}
                .{" "}
                {!isCompanyExpanded && (
                  <button
                    onClick={() => setIsCompanyExpanded(true)}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Read More
                  </button>
                )}
              </p>
              {isCompanyExpanded && (
                <>
                  <p className="mt-2">
                    {companyData.about_the_company
                      .split(". ")
                      .slice(2)
                      .join(". ")}{" "}
                    <button
                      onClick={() => setIsCompanyExpanded(false)}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Show Less
                    </button>
                  </p>
                  {companyData.source_urls &&
                    companyData.source_urls.length > 0 && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Sources:
                          <span className="flex flex-wrap gap-1 ml-1">
                            {companyData.source_urls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center"
                              >
                                {extractDomain(url)}
                                {index < companyData.source_urls.length - 1 && (
                                  <span className="text-gray-400 mx-1">•</span>
                                )}
                              </a>
                            ))}
                          </span>
                        </span>
                      </div>
                    )}
                </>
              )}
            </>
          ) : (
            <CustomLoader
              loading={true}
              specs={{
                type: "spinner",
                size: "md",
                color: "blue",
                text: "Loading company information...",
              }}
            />
          )}
        </div>
        {/* </ReportableSection> */}

        <div id="company-metrics">
          {/* <ReportableSection
            type="key-stats" 
            data={dynamicMetricsData}
          > */}
          <SectionHeaderWithRedFlags
            redFlags={flagsList}
            title="Company Metrics"
            icon={Activity}
            iconColorClass="text-blue-600"
            redFlag_recepient_id="insolvency_overview_company_metrics"
          />
          <div className="mt-2">
            <CustomLoader
              loading={companyMetrics.length === 0}
              specs={{
                type: "spinner",
                size: "md",
                color: "blue",
                text: "Loading company metrics...",
              }}
            >
              <KeyMetrics
                keyMetricList={{ key_metrics: companyMetrics }}
                isMetricsExpanded={isMetricsExpanded}
                setIsMetricsExpanded={setIsMetricsExpanded}
                showHeader={false}
                selectionMode={metricsSelectionMode}
                selectedMetrics={selectedMetrics}
                onSelectionChange={handleMetricsSelectionChange}
                onToggleSelectionMode={toggleMetricsSelectionMode}
              />
            </CustomLoader>
          </div>
          {/* </ReportableSection> */}
        </div>

        <motion.div variants={itemVariants} id="default-probability">
          {/* <ReportableSection type="default-probability" data={{ merchantId: merchantId || '' }}> */}
          <SectionHeaderWithRedFlags
            redFlags={flagsList}
            title="Probability of Default Analysis"
            icon={AlertTriangle}
            iconColorClass="text-blue-600"
            redFlag_recepient_id="insolvency_overview_pdAnalysis"
            showRedFlagsInHeader={false}
            // onReport={(reportId, isNewReport) => handleSectionReport("default-probability", { merchantId: merchantId || '' }, reportId, isNewReport)}
          />
          <CustomLoader
            loading={!merchantId}
            specs={{
              type: "spinner",
              size: "md",
              color: "blue",
              text: "Loading probability of default analysis...",
            }}
          >
            <ProbabilityOfDefault
              key={merchantId}
              merchantId={merchantId || ""}
              versionNo={selectedVersionNo}
              date={selectedDate || undefined}
              showIndustrialMaterials={showIndustrialMaterials}
              onToggleChange={setShowIndustrialMaterials}
              watchlistItem={watchlistItem}
            />
          </CustomLoader>
          {/* </ReportableSection> */}
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <KeyCreditInsightsSection merchantId={merchantId || ""} />
      </motion.div>

      {/* <motion.div variants={itemVariants} className="space-y-4" id="industry-overview">
        <ReportableSection type="industry-overview" data={{ industryData }}>
          <SectionHeaderWithRedFlags
            redFlags={flagsList}
            title="About Industry"
            icon={Factory}
            iconColorClass="text-blue-600"
            redFlag_recepient_id="insolvency_overview_aboutIndustry"

          />
          <div className="text-gray-600 leading-relaxed">
            {industryData ? (
              <>
                <p className="py-2">
                  {industryData.about_the_industry.split('. ').slice(0, 2).join('. ')}.{' '}
                  {!isIndustryExpanded && (
                    <button
                      onClick={() => setIsIndustryExpanded(true)}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Read More
                    </button>
                  )}
                </p>
                {isIndustryExpanded && (
                  <>
                    <p className="mt-2">
                      {industryData.about_the_industry.split('. ').slice(2).join('. ')}{' '}
                      <button
                        onClick={() => setIsIndustryExpanded(false)}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        Show Less
                      </button>
                    </p>
                    {industryData.is_industry_risky === 'yes' && (
                      <RiskAssessmentParagraph
                        title="Industry Risk Assessment"
                        justification={industryData.justification}
                        riskLevel="high"
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <CustomLoader 
                loading={true} 
                specs={{
                  type: 'spinner',
                  size: 'md',
                  color: 'blue',
                  text: 'Loading industry information...'
                }}
              />
            )}
          </div>
        </ReportableSection>
      </motion.div> */}

      {/* <motion.div variants={itemVariants}>
        <CustomLoader
          loading={companyMetrics.length === 0}
          specs={{
            type: "spinner",
            size: "md",
            color: "blue",
            text: "Loading risk assessment...",
          }}
        >
          <RiskAssessmentSection
            riskAssessment={null}
            keyMetricList={{ key_metrics: [] }}
          />
        </CustomLoader>
      </motion.div> */}

      {/* TODO: Add transaction metrics back in when we have the data */}
      {/* <motion.div variants={itemVariants}>
        <ReportableSection type="transaction-metrics" data={{ transactionMetrics }}>
          <SectionHeaderWithRedFlags
            redFlags={flagsList}
            title="Transaction Metrics"
            icon={Activity}
            iconColorClass="text-blue-600"
            redFlag_recepient_id="insolvency_overview_transactionMetrics"

          />
          <div className="mt-4">
            <KeyMetrics
              keyMetricList={{ key_metrics: transactionMetrics }}
              isMetricsExpanded={isMetricsExpanded}
              setIsMetricsExpanded={setIsMetricsExpanded}
              showHeader={false}
            />
          </div>
        </ReportableSection>
      </motion.div> */}

      {/* Credit Rating Section moved to the "Debt & Credit" sidebar entry (see DebtCreditTab.tsx) */}

      {/* <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-4">
          {visualizationConfigs.map(({ key, config, title }) => (
            <motion.div key={key} variants={itemVariants}>
              <ReportableSection
                type="transactions-visualizations"
                title={title}
                data={{
                  title,
                  chartImage: chartImages[key] || null,
                  config,
                  data: monthlyMetricsData,
                }}
              >
                <ReportVisualization
                  config={config}
                  data={monthlyMetricsData}
                  title={title}
                  chartRef={(el: HTMLDivElement | null) => (chartRefs.current[key] = el)}
                />
              </ReportableSection>
            </motion.div>
          ))}
        </div>
      </motion.div> */}

      {/* Hidden PDF Template */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={pdfTemplateRef}>
          {activeMerchant && (
            <OverviewPDFTemplate
              runDate={selectedDate}
              activeMerchant={activeMerchant}
              companyData={companyData}
              industryData={industryData}
              companyMetrics={companyMetrics}
              merchantId={merchantId || ""}
              merchantIndustry={merchantIndustry}
              flagsList={flagsList}
              watchlistItem={watchlistItem}
              versionNo={selectedVersionNo}
              date={selectedDate || undefined}
              showIndustrialMaterials={showIndustrialMaterials}
            />
          )}
        </div>

        <div ref={fullReportRef}>
          {activeMerchant && (
            <FullReportPDFTemplate
              activeMerchant={activeMerchant}
              merchantIndustry={merchantIndustry}
              overview={{
                companyData: companyData,
                industryData: industryData,
                companyMetrics: companyMetrics,
                merchantId: merchantId || "",
                flagsList: flagsList,
                watchlistItem: watchlistItem,
              }}
              metrics={{
                processedMetrics: processedMetrics,
                startYear: metricsStartYear,
                availableYears: availableYears,
                numberFormat: metricsNumberFormat,
              }}
              financial={{
                financialMetrics: financialMetrics,
                revenueData: revenueData,
                formattedFinancialData: formattedFinancialData,
                startYear: finStartYear,
                numberFormat: finNumberFormat,
                activeStatement: activeStatement,
                redFlags: flagsList.map((flag) => ({
                  id: flag.id,
                  description: flag.description,
                  severity: flag.severity,
                  rule_type: flag.rule_type,
                  rule_name: flag.rule_name,
                  rule_code: flag.rule_code,
                  created_at: flag.created_at,
                  metric_values: flag.metric_values
                    ? Object.fromEntries(
                        Object.entries(flag.metric_values).map(
                          ([key, value]) => [
                            key,
                            typeof value === "string" && !isNaN(Number(value))
                              ? Number(value)
                              : value,
                          ]
                        )
                      )
                    : undefined,
                })),
              }}
              external={{
                insightsData: insightsData,
                redFlagsData: redFlagsData,
              }}
              redFlags={{
                items: flagsList.map((flag) => ({
                  id: flag.id,
                  description: flag.description,
                  severity: flag.severity,
                  rule_type: flag.rule_type,
                  rule_name: flag.rule_name,
                  rule_code: flag.rule_code,
                  created_at: flag.created_at,
                  metric_values: flag.metric_values
                    ? Object.fromEntries(
                        Object.entries(flag.metric_values).map(
                          ([key, value]) => [
                            key,
                            typeof value === "string" && !isNaN(Number(value))
                              ? Number(value)
                              : value,
                          ]
                        )
                      )
                    : undefined,
                })),
              }}
              versionNo={selectedVersionNo}
              date={selectedDate || undefined}
              showIndustrialMaterials={showIndustrialMaterials}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InsolvencyOverviewTab;
