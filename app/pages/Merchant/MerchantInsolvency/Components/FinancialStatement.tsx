'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInsolvencyFinancialStore } from '@/app/store/merchant/insolvencyFinancialStore';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Loader2, Download } from 'lucide-react';
import { exportFinancialStatementsToExcel } from '@/app/utils/excelExport';

// Define the percentage display options
type PercentageDisplayMode = 'none' | 'prevYear' | 'baseYear';
type StatementType = 'income' | 'balance' | 'cashflow';

interface FinancialStatementProps {
  merchantId?: string;
}

interface FinancialData {
  share_capital: number;
  operating_profit: number;
  profit_before_tax: number;
  reserves_and_surplus: number;
  other_income: number;
  depreciation: number;
  interest: number;
  revenue_from_operations: number;
  total_operating_cost: number;
  total_cost_of_materials_consumed: number;
  total_employee_benefit_expense: number;
  total_other_expenses: number;
  profit_after_tax: number;
  stated_on: string;
  [key: string]: any;
}

interface FinancialsResponse {
  success: boolean;
  message: string;
  data: FinancialData[];
}

// Helper to transform API financial data to our display format
interface FormattedFinancialData {
  name: string;
  // Income Statement fields
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
  
  // Balance Sheet fields
  // Assets
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
  
  // Liabilities
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
  
  // Cash Flow fields
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

const FinancialStatement: FC<FinancialStatementProps> = ({ merchantId: propMerchantId }) => {
  const { financialsData, loading, error, fetchFinancialsData } = useInsolvencyFinancialStore();
  const { selectedMerchantId } = useMerchantIdStore();
  const { activeContexts } = useActiveContext();
  const merchantId = useMemo(() => propMerchantId || activeContexts?.merchant || selectedMerchantId, [propMerchantId, activeContexts, selectedMerchantId]);
  
  const [startYear, setStartYear] = useState<string>("");
  const [percentageMode, setPercentageMode] = useState<PercentageDisplayMode>('prevYear');
  const [activeStatement, setActiveStatement] = useState<StatementType>('income');
  const [numberFormat, setNumberFormat] = useState<'lakhs' | 'crores' | 'millions' | 'raw'>('crores');
  
  // Fetch financial data when the component mounts or when the merchant ID changes
  useEffect(() => {
    const loadData = async () => {
      if (merchantId) {
        try {
          await fetchFinancialsData(merchantId);
        } catch (err) {
          console.error('Error loading financial data:', err);
        }
      }
    };
    
    loadData();
  }, [fetchFinancialsData, merchantId]);
  
  // Transform API data to the format our UI needs
  const formattedFinancialData = useMemo(() => {
    // Check if financialsData exists and has valid data
    if (!financialsData || !financialsData.data || !Array.isArray(financialsData.data) || financialsData.data.length === 0) {
      return [];
    }

    return financialsData.data.map(item => {
      // Extract year from the date
      const year = new Date(item.year).getFullYear().toString();
      
      // Income Statement calculations
      const revenue = item.net_revenue || 0;
      const costOfSales = (item.total_cost_of_materials_consumed || 0) + (item.total_purchases_of_stock_in_trade || 0) + (item.total_changes_in_inventories_or_finished_goods || 0);
      const grossProfit = revenue - costOfSales;
      const totalOperatingExpenses = (item.total_operating_cost || 0) - costOfSales;
      
      // Calculate margins as percentages
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
        generalAndAdmin: totalOperatingExpenses - (item.total_employee_benefit_expense || 0) - (item.total_other_expenses || 0) ,
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
        // Assets
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
        
        // Liabilities
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
  }, [financialsData]);
  
  // Set default start year after data is loaded
  useEffect(() => {
    if (formattedFinancialData.length > 0 && !startYear) {
      // Set to the earliest year by default
      setStartYear(formattedFinancialData[0].name);
    }
  }, [formattedFinancialData, startYear]);
  
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

  // Get all years and check if a year should be shown based on the selected start year
  const shouldShowYear = (year: string) => {
    if (!startYear) return true;
    return parseInt(year) >= parseInt(startYear);
  };

  // Format numbers with appropriate formatting
  const formatNumber = (num: number, isPercentage = false): string => {
    if (isPercentage) {
      const formatted = num.toFixed(1);
      return `${formatted === '-0.0' ? '0.0' : formatted}%`;
    }
    
    const formatter = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });

    const absNum = Math.abs(num);
    
    const formatValue = (val: number) => {
      const formatted = formatter.format(val);
      return formatted === '-0' ? '0' : formatted;
    };
    
    switch (numberFormat) {
      case 'raw':
        return `₹${formatValue(num)}`;
      case 'lakhs':
        return `₹${formatValue(num / 100000)}L`;
      case 'crores':
        return `₹${formatValue(num / 10000000)}Cr`;
      case 'millions':
        return `₹${formatValue(num / 1000000)}M`;
      default:
        return `₹${formatValue(num)}`;
    }
  };

  // Get percentage color based on value
  const getPercentageColor = (percentText: string, metric?: string): string => {
    if (!percentText || percentText === "-") return "text-gray-500";
    
    // Extract numeric value from percentage text (remove + and % signs)
    let value = parseFloat(percentText.replace('+', '').replace('%', ''));
    
    if (value === 0) return "text-gray-500";
    
    // Determine if this metric should have inverted color logic (Increase = Red)
    // Only applies to Income Statement expense-related metrics
    if (activeStatement === 'income') {
      const invertedMetrics = [
        'costOfSales', 
        'researchAndDevelopment', 
        'salesAndMarketing', 
        'generalAndAdmin', 
        'totalOperatingExpenses',
        'interestExpense',
        'incomeTaxes'
      ];
      if (invertedMetrics.includes(metric || '')) {
        value = -value;
      }
    }
    
    // Determine color intensity based on magnitude (capped at ±20%)
    const intensity = Math.min(Math.abs(value) / 20, 1);
    
    if (value > 0) {
      // Green gradient for positive values
      if (intensity < 0.5) {
        return `text-emerald-${Math.round(intensity * 200 + 300)}`;
      } else {
        return "text-emerald-500";
      }
    } else {
      // Red gradient for negative values
      if (intensity < 0.5) {
        return `text-red-${Math.round(intensity * 200 + 300)}`;
      } else {
        return "text-red-500";
      }
    }
  };

  // Get percentage background color based on value
  const getPercentageBackgroundColor = (percentText: string, metric?: string): string => {
    if (!percentText || percentText === "-") return "";
    
    // Extract numeric value from percentage text (remove + and % signs)
    let value = parseFloat(percentText.replace('+', '').replace('%', ''));
    
    if (value === 0) return "";

    // Determine if this metric should have inverted color logic (Increase = Red)
    // Only applies to Income Statement expense-related metrics
    if (activeStatement === 'income') {
      const invertedMetrics = [
        'costOfSales', 
        'researchAndDevelopment', 
        'salesAndMarketing', 
        'generalAndAdmin', 
        'totalOperatingExpenses',
        'interestExpense',
        'incomeTaxes'
      ];
      if (invertedMetrics.includes(metric || '')) {
        value = -value;
      }
    }
    
    // Determine color intensity based on magnitude
    if (value > 0) {
      // Green gradient for positive values
      if (value < 5) return "bg-green-50";
      if (value < 10) return "bg-green-100";
      if (value < 20) return "bg-green-200";
      if (value < 30) return "bg-green-300";
      return "bg-green-400";
    } else {
      // Red gradient for negative values
      const absValue = Math.abs(value);
      if (absValue < 5) return "bg-red-50";
      if (absValue < 10) return "bg-red-100";
      if (absValue < 20) return "bg-red-200";
      if (absValue < 30) return "bg-red-300";
      return "bg-red-400";
    }
  };

  // Calculate percentage change relative to another year
  const calculatePercentChange = (currentValue: number, comparisonValue: number): string => {
    if (comparisonValue === 0) return "-";
    
    // Perform simple value-based comparison for all statements per user request
    // Increase in value -> + sign, decrease -> - sign
    const diff = currentValue - comparisonValue;
    const percentChange = (diff / Math.abs(comparisonValue)) * 100;
    
    return `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
  };

  // Get the appropriate comparison value based on the percentage mode
  const getComparisonValue = (
    yearData: FormattedFinancialData, 
    prevYearData: FormattedFinancialData | null, 
    baseYearData: FormattedFinancialData | null, 
    metric: keyof FormattedFinancialData
  ): string | null => {
    if (percentageMode === 'none') return null;
    if (yearData.name === startYear) return null;
    if (metric === "grossMargin" || metric === "operatingMargin" || metric === "netMargin") return null;
    
    const currentValue = Number(yearData[metric]);

    if (percentageMode === 'prevYear' && prevYearData) {
      const prevValue = Number(prevYearData[metric]);
      // If the displayed values are the same, don't show a percentage change
      if (formatNumber(currentValue) === formatNumber(prevValue)) return null;
      return calculatePercentChange(currentValue, prevValue);
    }
    
    if (percentageMode === 'baseYear' && baseYearData) {
      const baseValue = Number(baseYearData[metric]);
      // If the displayed values are the same, don't show a percentage change
      if (formatNumber(currentValue) === formatNumber(baseValue)) return null;
      return calculatePercentChange(currentValue, baseValue);
    }
    
    return null;
  };

  // Render a metric row with all years of data
  const renderMetricRow = (
    label: string, 
    metric: keyof FormattedFinancialData, 
    isTotal = false, 
    isSubtotal = false,
    isPercentage = false,
    isIndented = false
  ) => {
    // Find the base year data for relative calculations
    const baseYearData = formattedFinancialData.find(data => data.name === startYear) || null;
    
    return (
      <TableRow className={`${isTotal ? "font-bold" : ""} ${isSubtotal ? "font-semibold" : ""}`}>
        <TableCell className={cn(
          "sticky left-0 bg-white py-3",
          isIndented && "pl-6"
        )}>
          {label}
        </TableCell>
        {formattedFinancialData.map((yearData, index) => {
          // Get previous year data for relative calculations
          const prevYearData = index > 0 ? formattedFinancialData[index - 1] : null;
          
          // Calculate the percentage change if applicable
          const percentChange = getComparisonValue(yearData, prevYearData, baseYearData, metric);
          const bgColorClass = percentChange ? getPercentageBackgroundColor(percentChange, metric as string) : "";
          
          // Get text color based on percentage for better contrast
          const getTextColor = () => {
            if (!percentChange) return "";
            return getPercentageColor(percentChange, metric as string);
          };
          
          return (
            <TableCell 
              key={yearData.name} 
              className={cn(
                "text-right py-3",
                "min-h-[3.5rem]",
                shouldShowYear(yearData.name) ? '' : 'opacity-0',
                bgColorClass
              )}
            >
              <div className="flex flex-col items-end justify-center h-full">
                <div>
                  {formatNumber(Number(yearData[metric]), isPercentage)}
                </div>
                {percentageMode !== 'none' ? (
                  percentChange ? (
                    <span className={cn("text-xs italic font-medium", getTextColor())}>
                      {percentChange}
                    </span>
                  ) : (
                    <div className="text-xs invisible">&nbsp;</div>
                  )
                ) : (
                  <div className="text-xs invisible">&nbsp;</div>
                )}
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  // Render placeholder content for balance sheet and cash flow
  const renderPlaceholderContent = (title: string) => (
    <div className="py-10 px-6 text-center">
      <h3 className="text-lg font-medium text-gray-500">{title} data coming soon</h3>
      <p className="text-sm text-gray-400 mt-2">This financial statement is currently in development</p>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500">Loading financial data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-10 px-6 text-center">
        <h3 className="text-lg font-medium text-red-500">Error loading financial data</h3>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  // No data state - check for specific "Financials table not found" message
  if (!formattedFinancialData.length) {
    // Check if the error is specifically about financials table not found
    const isFinancialsNotFound = financialsData?.success === false && 
      financialsData?.message === "Financials table not found";
    
    if (isFinancialsNotFound) {
      return (
        <div className="py-10 px-6 text-center">
          <h3 className="text-lg font-medium text-gray-500">Financials not available</h3>
          <p className="text-sm text-gray-400 mt-2">Financial statements are currently not available for this company</p>
        </div>
      );
    }
    
    return (
      <div className="py-10 px-6 text-center">
        <h3 className="text-lg font-medium text-gray-500">No financial data available</h3>
        <p className="text-sm text-gray-400 mt-2">Financial statements could not be found for this company</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card className="relative border-0 shadow-none">

          <CardHeader className="pb-2 pt-4 px-0">
            {/* First Row: Statement tabs on left, Excel button on right */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full mb-4">
  <div className="flex flex-col md:flex-row justify-start items-start md:items-center gap-4">
    <span className="text-md font-medium text-blue-600 whitespace-nowrap">Financial Statement</span>
    <div className="w-full md:w-auto">
      <div className="flex bg-gray-100 rounded-lg p-1 w-full">
        {[
          { value: 'income', label: 'Income Statement' },
          { value: 'balance', label: 'Balance Sheet' },
          { value: 'cashflow', label: 'Cashflow Statement' }
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setActiveStatement(option.value as StatementType)}
            className={`px-6 py-2 text-md font-medium rounded-md transition-colors flex-1 whitespace-nowrap ${
              activeStatement === option.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>

  <button
    onClick={() => {
      // Prepare data for all three statements
      const exportData = {
        income: formattedFinancialData.map(yearData => ({
          Year: yearData.name,
          'Revenue and Profitability': '',
          'Revenue from Operations': formatNumber(yearData.revenue),
          'Cost of Sales': formatNumber(yearData.costOfSales),
          'Gross Profit': formatNumber(yearData.grossProfit),
          'Gross Profit Margin (%)': yearData.grossMargin.toFixed(2) + '%',
          
          'Operating Expenses': '',
          'Research & Development': formatNumber(yearData.researchAndDevelopment),
          'Sales & Marketing': formatNumber(yearData.salesAndMarketing),
          'General & Administrative': formatNumber(yearData.generalAndAdmin),
          'Total Operating Expenses': formatNumber(yearData.totalOperatingExpenses),
          
          'Operating Performance': '',
          'Operating Income (EBIT)': formatNumber(yearData.operatingIncome),
          'Operating Margin (%)': yearData.operatingMargin.toFixed(2) + '%',
          'Interest Expense': formatNumber(yearData.interestExpense),
          'Other Income': formatNumber(yearData.otherIncome),
          'Income Taxes': formatNumber(yearData.incomeTaxes),
          'Net Income': formatNumber(yearData.netIncome),
          'Net Profit Margin (%)': yearData.netMargin.toFixed(2) + '%',
          
          'Per Share Data': '',
          'Shares Outstanding': formatNumber(yearData.sharesOutstanding),
          'Earnings Per Share': formatNumber(yearData.earningsPerShare),
        })),
        
        balance: formattedFinancialData.map(yearData => ({
          Year: yearData.name,
          'Assets': '',
          'Non-Current Assets': '',
          'Tangible Assets': formatNumber(yearData.tangibleAssets),
          'Intangible Assets': formatNumber(yearData.intangibleAssets),
          'Capital Work in Progress': formatNumber(yearData.capitalWorkInProgress),
          'Non-Current Investments': formatNumber(yearData.noncurrentInvestments),
          'Long Term Loans & Advances': formatNumber(yearData.longTermLoansAndAdvances),
          'Other Non-Current Assets': formatNumber(yearData.otherNoncurrentAssets),
          // 'Total Non-Current Assets': formatNumber(yearData.tangibleAssets + yearData.intangibleAssets + yearData.capitalWorkInProgress + yearData.noncurrentInvestments + yearData.longTermLoansAndAdvances + yearData.otherNoncurrentAssets),
          
          'Current Assets': '',
          'Current Investments': formatNumber(yearData.currentInvestments),
          'Inventories': formatNumber(yearData.inventories),
          'Trade Receivables': formatNumber(yearData.tradeReceivables),
          'Cash & Bank Balances': formatNumber(yearData.cashAndBankBalances),
          'Short Term Loans & Advances': formatNumber(yearData.shortTermLoansAndAdvances),
          'Other Current Assets': formatNumber(yearData.otherCurrentAssets),
          // 'Total Current Assets': formatNumber(yearData.currentInvestments + yearData.inventories + yearData.tradeReceivables + yearData.cashAndBankBalances + yearData.otherCurrentAssets),
          'Total Assets': formatNumber(yearData.totalAssets),
          
          'Liabilities': '',
          'Shareholders Funds': '',
          'Share Capital': formatNumber(yearData.shareCapital),
          'Reserves & Surplus': formatNumber(yearData.reservesAndSurplus),
          
          'Non-Current Liabilities': '',
          'Long Term Borrowings': formatNumber(yearData.longTermBorrowings),
          'Other Long Term Liabilities': formatNumber(yearData.otherLongTermLiabilities),
          'Long Term Provisions': formatNumber(yearData.longTermProvisions),
          
          'Current Liabilities': '',
          'Short Term Borrowings': formatNumber(yearData.shortTermBorrowings),
          'Trade Payables': formatNumber(yearData.tradePayables),
          'Other Current Liabilities': formatNumber(yearData.otherCurrentLiabilities),
          'Short Term Provisions': formatNumber(yearData.shortTermProvisions),
          'Total Liabilities': formatNumber(yearData.totalLiabilities),
        })),
        
        cashflow: formattedFinancialData.map(yearData => ({
          Year: yearData.name,
          'Operating Activities': '',
          'Profit Before Tax': formatNumber(yearData.profitBeforeTax),
          'Finance Cost & Depreciation': formatNumber(yearData.financeCostAndDepreciation),
          'Adjustments for Current & Non-Current Assets': formatNumber(yearData.currentAndNonCurrentAssets),
          'Adjustments for Current & Non-Current Liabilities': formatNumber(yearData.currentAndNonCurrentLiabilities),
          'Other Operating Adjustments': formatNumber(yearData.otherOperatingAdjustments),
          'Net Cash from Operations': formatNumber(yearData.cashFlowFromOperatingActivities),
          
          'Investing Activities': '',
          'Purchase of Assets': formatNumber(yearData.purchaseOfAssets),
          'Sale of Assets': formatNumber(yearData.saleOfAssets),
          'Income from Assets': formatNumber(yearData.incomeFromAssets),
          'Other Investing Adjustments': formatNumber(yearData.otherInvestingAdjustments),
          'Net Cash from Investing': formatNumber(yearData.cashFlowFromInvestingActivities),
          
          'Financing Activities': '',
          'Repayment of Capital & Borrowings': formatNumber(yearData.repaymentOfCapitalAndBorrowings),
          'Raising Capital & Borrowings': formatNumber(yearData.raisingCapitalAndBorrowings),
          'Interest & Dividends Paid': formatNumber(yearData.interestAndDividendsPaid),
          'Other Financing Adjustments': formatNumber(yearData.otherFinancingAdjustments),
          'Net Cash from Financing': formatNumber(yearData.cashFlowFromFinancingActivities),
          
          'Cash Position': '',
          'Cash & Equivalents Before Exchange': formatNumber(yearData.cashAndCashEquivalentsBeforeExchange),
          'Exchange Rate Adjustments': formatNumber(yearData.adjustmentsToCashAndEquivalents),
          'Net Change in Cash': formatNumber(yearData.cashAndCashEquivalents),
          'Cash at End of Period': formatNumber(yearData.cashAtEndOfPeriod),
        }))
      };
      
      exportFinancialStatementsToExcel(exportData, `Financial_Statements_${new Date().toISOString().split('T')[0]}`);
    }}
    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap"
  >
    <Download className="h-4 w-4" />
    Excel
  </button>
</div>
            
            {/* Second Row: Format, Base Year, and Show Relative controls on the right */}
            <div className="flex flex-col md:flex-row justify-start items-start md:items-center gap-4 w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Format</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { value: 'raw', label: 'Raw' },
                    { value: 'lakhs', label: '₹ L' },
                    { value: 'crores', label: '₹ Cr' },
                    { value: 'millions', label: '₹ M' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setNumberFormat(option.value as 'lakhs' | 'crores' | 'millions' | 'raw')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        numberFormat === option.value
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Base Year</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {formattedFinancialData.map(data => (
                    <button
                      key={data.name}
                      onClick={() => setStartYear(data.name)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        startYear === data.name
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {data.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Show Relative</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { value: 'none', label: 'No' },
                    { value: 'prevYear', label: 'Prev Year' },
                    { value: 'baseYear', label: 'Base Year' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setPercentageMode(option.value as PercentageDisplayMode)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        percentageMode === option.value
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              
            </div>
          </CardHeader>


          {/* <CardHeader className="pb-2 pt-4 px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full">
              <div className="w-full md:w-auto">
                <div className="flex bg-gray-100 rounded-lg p-1 w-full">
                  {[
                    { value: 'income', label: 'Income Statement' },
                    { value: 'balance', label: 'Balance Sheet' },
                    { value: 'cashflow', label: 'Cashflow Statement' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setActiveStatement(option.value as StatementType)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1 truncate ${
                        activeStatement === option.value
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Format</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {[
                      { value: 'raw', label: 'Raw' },
                      { value: 'lakhs', label: '₹ L' },
                      { value: 'crores', label: '₹ Cr' },
                      { value: 'millions', label: '₹ M' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setNumberFormat(option.value as 'lakhs' | 'crores' | 'millions' | 'raw')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          numberFormat === option.value
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Base Year</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {formattedFinancialData.map(data => (
                      <button
                        key={data.name}
                        onClick={() => setStartYear(data.name)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          startYear === data.name
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {data.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Show Relative</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {[
                      { value: 'none', label: 'No' },
                      { value: 'prevYear', label: 'Prev Year' },
                      { value: 'baseYear', label: 'Base Year' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setPercentageMode(option.value as PercentageDisplayMode)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          percentageMode === option.value
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Prepare data for all three statements
                    const exportData = {
                      income: formattedFinancialData.map(yearData => ({
                        Year: yearData.name,
                        'A. Revenue and Profitability': '',
                        'Revenue from Operations': formatNumber(yearData.revenue),
                        'Cost of Sales': formatNumber(yearData.costOfSales),
                        'Gross Profit': formatNumber(yearData.grossProfit),
                        'Gross Profit Margin (%)': yearData.grossMargin.toFixed(2) + '%',
                        
                        'B. Operating Expenses': '',
                        'Research & Development': formatNumber(yearData.researchAndDevelopment),
                        'Sales & Marketing': formatNumber(yearData.salesAndMarketing),
                        'General & Administrative': formatNumber(yearData.generalAndAdmin),
                        'Total Operating Expenses': formatNumber(yearData.totalOperatingExpenses),
                        
                        'C. Operating Performance': '',
                        'Operating Income (EBIT)': formatNumber(yearData.operatingIncome),
                        'Operating Margin (%)': yearData.operatingMargin.toFixed(2) + '%',
                        'Interest Expense': formatNumber(yearData.interestExpense),
                        'Other Income': formatNumber(yearData.otherIncome),
                        'Income Taxes': formatNumber(yearData.incomeTaxes),
                        'Net Income': formatNumber(yearData.netIncome),
                        'Net Profit Margin (%)': yearData.netMargin.toFixed(2) + '%',
                        
                        'D. Per Share Data': '',
                        'Shares Outstanding': formatNumber(yearData.sharesOutstanding),
                        'Earnings Per Share': formatNumber(yearData.earningsPerShare),
                      })),
                      
                      balance: formattedFinancialData.map(yearData => ({
                        Year: yearData.name,
                        'A. Assets': '',
                        'Non-Current Assets': '',
                        'Tangible Assets': formatNumber(yearData.tangibleAssets),
                        'Intangible Assets': formatNumber(yearData.intangibleAssets),
                        'Capital Work in Progress': formatNumber(yearData.capitalWorkInProgress),
                        'Non-Current Investments': formatNumber(yearData.noncurrentInvestments),
                        'Long Term Loans & Advances': formatNumber(yearData.longTermLoansAndAdvances),
                        'Other Non-Current Assets': formatNumber(yearData.otherNoncurrentAssets),
                        // 'Total Non-Current Assets': formatNumber(yearData.tangibleAssets + yearData.intangibleAssets + yearData.capitalWorkInProgress + yearData.noncurrentInvestments + yearData.longTermLoansAndAdvances + yearData.otherNoncurrentAssets),
                        
                        'Current Assets': '',
                        'Current Investments': formatNumber(yearData.currentInvestments),
                        'Inventories': formatNumber(yearData.inventories),
                        'Trade Receivables': formatNumber(yearData.tradeReceivables),
                        'Cash & Bank Balances': formatNumber(yearData.cashAndBankBalances),
                        'Short Term Loans & Advances': formatNumber(yearData.shortTermLoansAndAdvances),
                        'Other Current Assets': formatNumber(yearData.otherCurrentAssets),
                        // 'Total Current Assets': formatNumber(yearData.currentInvestments + yearData.inventories + yearData.tradeReceivables + yearData.cashAndBankBalances + yearData.otherCurrentAssets),
                        'Total Assets': formatNumber(yearData.totalAssets),
                        
                        'B. Liabilities': '',
                        'Shareholders Funds': '',
                        'Share Capital': formatNumber(yearData.shareCapital),
                        'Reserves & Surplus': formatNumber(yearData.reservesAndSurplus),
                        
                        'Non-Current Liabilities': '',
                        'Long Term Borrowings': formatNumber(yearData.longTermBorrowings),
                        'Other Long Term Liabilities': formatNumber(yearData.otherLongTermLiabilities),
                        'Long Term Provisions': formatNumber(yearData.longTermProvisions),
                        
                        'Current Liabilities': '',
                        'Short Term Borrowings': formatNumber(yearData.shortTermBorrowings),
                        'Trade Payables': formatNumber(yearData.tradePayables),
                        'Other Current Liabilities': formatNumber(yearData.otherCurrentLiabilities),
                        'Short Term Provisions': formatNumber(yearData.shortTermProvisions),
                        'Total Liabilities': formatNumber(yearData.totalLiabilities),
                      })),
                      
                      cashflow: formattedFinancialData.map(yearData => ({
                        Year: yearData.name,
                        'A. Operating Activities': '',
                        'Profit Before Tax': formatNumber(yearData.profitBeforeTax),
                        'Finance Cost & Depreciation': formatNumber(yearData.financeCostAndDepreciation),
                        'Adjustments for Current & Non-Current Assets': formatNumber(yearData.currentAndNonCurrentAssets),
                        'Adjustments for Current & Non-Current Liabilities': formatNumber(yearData.currentAndNonCurrentLiabilities),
                        'Other Operating Adjustments': formatNumber(yearData.otherOperatingAdjustments),
                        'Net Cash from Operations': formatNumber(yearData.cashFlowFromOperatingActivities),
                        
                        'B. Investing Activities': '',
                        'Purchase of Assets': formatNumber(yearData.purchaseOfAssets),
                        'Sale of Assets': formatNumber(yearData.saleOfAssets),
                        'Income from Assets': formatNumber(yearData.incomeFromAssets),
                        'Other Investing Adjustments': formatNumber(yearData.otherInvestingAdjustments),
                        'Net Cash from Investing': formatNumber(yearData.cashFlowFromInvestingActivities),
                        
                        'C. Financing Activities': '',
                        'Repayment of Capital & Borrowings': formatNumber(yearData.repaymentOfCapitalAndBorrowings),
                        'Raising Capital & Borrowings': formatNumber(yearData.raisingCapitalAndBorrowings),
                        'Interest & Dividends Paid': formatNumber(yearData.interestAndDividendsPaid),
                        'Other Financing Adjustments': formatNumber(yearData.otherFinancingAdjustments),
                        'Net Cash from Financing': formatNumber(yearData.cashFlowFromFinancingActivities),
                        
                        'D. Cash Position': '',
                        'Cash & Equivalents Before Exchange': formatNumber(yearData.cashAndCashEquivalentsBeforeExchange),
                        'Exchange Rate Adjustments': formatNumber(yearData.adjustmentsToCashAndEquivalents),
                        'Net Change in Cash': formatNumber(yearData.cashAndCashEquivalents),
                        'Cash at End of Period': formatNumber(yearData.cashAtEndOfPeriod),
                      }))
                    };
                    
                    exportFinancialStatementsToExcel(exportData, `Financial_Statements_${new Date().toISOString().split('T')[0]}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </button>
              </div>
            </div>
          </CardHeader> */}
          <CardContent className="px-0">
            {activeStatement === 'income' && (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 py-2">Metric</TableHead>
                      {formattedFinancialData.map(yearData => (
                        <TableHead 
                          key={yearData.name} 
                          className={cn(
                            "text-right py-2",
                            shouldShowYear(yearData.name) ? '' : 'opacity-0'
                          )}
                        >
                          {yearData.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Revenue Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Revenue & Cost of Sales</TableCell>
                    </TableRow>
                    {renderMetricRow("Revenue", "revenue", false, true)}
                    {renderMetricRow("Cost of Sales", "costOfSales", false, false, false, true)}
                    {renderMetricRow("Gross Profit", "grossProfit", false, true)}
                    {renderMetricRow("Gross Margin", "grossMargin", false, false, true)}
                    
                    {/* Operating Expenses Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Operating Expenses</TableCell>
                    </TableRow>
                    {renderMetricRow("Research & Development", "researchAndDevelopment", false, false, false, true)}
                    {renderMetricRow("Sales & Marketing", "salesAndMarketing", false, false, false, true)}
                    {renderMetricRow("General & Administrative", "generalAndAdmin", false, false, false, true)}
                    {renderMetricRow("Total Operating Expenses", "totalOperatingExpenses", false, true)}
                    
                    {/* Income Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Income & Taxes</TableCell>
                    </TableRow>
                    {renderMetricRow("Operating Income", "operatingIncome", false, true)}
                    {renderMetricRow("Operating Margin", "operatingMargin", false, false, true)}
                    {renderMetricRow("Interest Expense", "interestExpense", false, false, false, true)}
                    {renderMetricRow("Other Income", "otherIncome", false, false, false, true)}
                    {renderMetricRow("Income Taxes", "incomeTaxes", false, false, false, true)}
                    {renderMetricRow("Net Income", "netIncome", true)}
                    {renderMetricRow("Net Margin", "netMargin", false, false, true)}
                    
                    {/* Per Share Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Per Share Data</TableCell>
                    </TableRow>
                    {renderMetricRow("Shares Outstanding", "sharesOutstanding", false, false, false, true)}
                    {renderMetricRow("Earnings Per Share", "earningsPerShare", false, true)}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {activeStatement === 'balance' && (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 py-2">Metric</TableHead>
                      {formattedFinancialData.map(yearData => (
                        <TableHead 
                          key={yearData.name} 
                          className={cn(
                            "text-right py-2",
                            shouldShowYear(yearData.name) ? '' : 'opacity-0'
                          )}
                        >
                          {yearData.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Assets Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Assets</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5 pl-6">Non-Current Assets</TableCell>
                    </TableRow>
                    {renderMetricRow("Tangible Assets", "tangibleAssets", false, false, false, true)}
                    {renderMetricRow("Intangible Assets", "intangibleAssets", false, false, false, true)}
                    {renderMetricRow("Capital Work in Progress", "capitalWorkInProgress", false, false, false, true)}
                    {renderMetricRow("Non-Current Investments", "noncurrentInvestments", false, false, false, true)}
                    {renderMetricRow("Long Term Loans & Advances", "longTermLoansAndAdvances", false, false, false, true)}
                    {renderMetricRow("Other Non-Current Assets", "otherNoncurrentAssets", false, false, false, true)}
                    
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5 pl-6">Current Assets</TableCell>
                    </TableRow>
                    {renderMetricRow("Current Investments", "currentInvestments", false, false, false, true)}
                    {renderMetricRow("Inventories", "inventories", false, false, false, true)}
                    {renderMetricRow("Trade Receivables", "tradeReceivables", false, false, false, true)}
                    {renderMetricRow("Cash & Bank Balances", "cashAndBankBalances", false, false, false, true)}
                    {renderMetricRow("Short Term Loans & Advances", "shortTermLoansAndAdvances", false, false, false, true)}
                    {renderMetricRow("Other Current Assets", "otherCurrentAssets", false, false, false, true)}
                    {renderMetricRow("Total Assets", "totalAssets", true)}
                    
                    {/* Liabilities Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Liabilities</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5 pl-6">Shareholders' Funds</TableCell>
                    </TableRow>
                    {renderMetricRow("Share Capital", "shareCapital", false, false, false, true)}
                    {renderMetricRow("Reserves & Surplus", "reservesAndSurplus", false, false, false, true)}
                    
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5 pl-6">Non-Current Liabilities</TableCell>
                    </TableRow>
                    {renderMetricRow("Long Term Borrowings", "longTermBorrowings", false, false, false, true)}
                    {renderMetricRow("Other Long Term Liabilities", "otherLongTermLiabilities", false, false, false, true)}
                    {renderMetricRow("Long Term Provisions", "longTermProvisions", false, false, false, true)}
                    
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5 pl-6">Current Liabilities</TableCell>
                    </TableRow>
                    {renderMetricRow("Short Term Borrowings", "shortTermBorrowings", false, false, false, true)}
                    {renderMetricRow("Trade Payables", "tradePayables", false, false, false, true)}
                    {renderMetricRow("Other Current Liabilities", "otherCurrentLiabilities", false, false, false, true)}
                    {renderMetricRow("Short Term Provisions", "shortTermProvisions", false, false, false, true)}
                    {renderMetricRow("Total Liabilities", "totalLiabilities", true)}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {activeStatement === 'cashflow' && (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 py-2">Metric</TableHead>
                      {formattedFinancialData.map(yearData => (
                        <TableHead 
                          key={yearData.name} 
                          className={cn(
                            "text-right py-2",
                            shouldShowYear(yearData.name) ? '' : 'opacity-0'
                          )}
                        >
                          {yearData.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Operating Activities Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Cash Flow from Operating Activities</TableCell>
                    </TableRow>
                    {renderMetricRow("Profit Before Tax", "profitBeforeTax", false, false, false, true)}
                    {renderMetricRow("Adjustments for Finance Cost & Depreciation", "financeCostAndDepreciation", false, false, false, true)}
                    {renderMetricRow("Adjustments for Current & Non-Current Assets", "currentAndNonCurrentAssets", false, false, false, true)}
                    {renderMetricRow("Adjustments for Current & Non-Current Liabilities", "currentAndNonCurrentLiabilities", false, false, false, true)}
                    {renderMetricRow("Other Adjustments", "otherOperatingAdjustments", false, false, false, true)}
                    {renderMetricRow("Cash Generated from Operations", "cashFlowFromOperatingActivities", true)}
                    
                    {/* Investing Activities Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Cash Flow from Investing Activities</TableCell>
                    </TableRow>
                    {renderMetricRow("Purchase of Assets", "purchaseOfAssets", false, false, false, true)}
                    {renderMetricRow("Sale of Assets", "saleOfAssets", false, false, false, true)}
                    {renderMetricRow("Income from Assets", "incomeFromAssets", false, false, false, true)}
                    {renderMetricRow("Other Adjustments", "otherInvestingAdjustments", false, false, false, true)}
                    {renderMetricRow("Cash Used in Investing Activities", "cashFlowFromInvestingActivities", true)}
                    
                    {/* Financing Activities Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Cash Flow from Financing Activities</TableCell>
                    </TableRow>
                    {renderMetricRow("Repayment of Capital & Borrowings", "repaymentOfCapitalAndBorrowings", false, false, false, true)}
                    {renderMetricRow("Raising Capital & Borrowings", "raisingCapitalAndBorrowings", false, false, false, true)}
                    {renderMetricRow("Interest & Dividends Paid", "interestAndDividendsPaid", false, false, false, true)}
                    {renderMetricRow("Other Adjustments", "otherFinancingAdjustments", false, false, false, true)}
                    {renderMetricRow("Cash Used in Financing Activities", "cashFlowFromFinancingActivities", true)}
                    
                    {/* Net Change in Cash Section */}
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={formattedFinancialData.length + 1} className="font-semibold sticky left-0 bg-slate-50 py-1.5">Net Change in Cash & Cash Equivalents</TableCell>
                    </TableRow>
                    {renderMetricRow("Cash & Cash Equivalents Before Exchange Rate Changes", "cashAndCashEquivalentsBeforeExchange", false, false, false, true)}
                    {renderMetricRow("Adjustments to Cash & Cash Equivalents", "adjustmentsToCashAndEquivalents", false, false, false, true)}
                    {renderMetricRow("Net Increase/Decrease in Cash & Cash Equivalents", "cashAndCashEquivalents", true)}
                    {renderMetricRow("Cash & Cash Equivalents at End of Period", "cashAtEndOfPeriod", true)}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default FinancialStatement;
