'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';
import { exportFinancialStatementsToExcel } from '@/app/utils/excelExport';
import { sampleFinancialHealthData, FormattedFinancialData } from './financialHealthSampleData';

type PercentageDisplayMode = 'none' | 'prevYear' | 'baseYear';
type StatementType = 'income' | 'balance' | 'cashflow';

interface FinancialHealthStatementProps {
  merchantId?: string;
}

const FinancialHealthStatement: FC<FinancialHealthStatementProps> = () => {
  const [startYear, setStartYear] = useState<string>("");
  const [percentageMode, setPercentageMode] = useState<PercentageDisplayMode>('prevYear');
  const [activeStatement, setActiveStatement] = useState<StatementType>('income');
  const [numberFormat, setNumberFormat] = useState<'lakhs' | 'crores' | 'millions' | 'raw'>('crores');
  
  const formattedFinancialData = sampleFinancialHealthData;

  useEffect(() => {
    if (formattedFinancialData.length > 0 && !startYear) {
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

  const shouldShowYear = (year: string) => {
    if (!startYear) return true;
    return parseInt(year) >= parseInt(startYear);
  };

  const formatNumber = (num: number, isPercentage = false): string => {
    return "-";
  };

  const getPercentageColor = (percentText: string, metric?: string): string => {
    if (!percentText || percentText === "-") return "text-gray-500";
    
    let value = parseFloat(percentText.replace('+', '').replace('%', ''));
    
    if (value === 0) return "text-gray-500";
    
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
    
    const intensity = Math.min(Math.abs(value) / 20, 1);
    
    if (value > 0) {
      if (intensity < 0.5) {
        return `text-emerald-${Math.round(intensity * 200 + 300)}`;
      } else {
        return "text-emerald-500";
      }
    } else {
      if (intensity < 0.5) {
        return `text-red-${Math.round(intensity * 200 + 300)}`;
      } else {
        return "text-red-500";
      }
    }
  };

  const getPercentageBackgroundColor = (percentText: string, metric?: string): string => {
    if (!percentText || percentText === "-") return "";
    
    let value = parseFloat(percentText.replace('+', '').replace('%', ''));
    
    if (value === 0) return "";

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
    
    if (value > 0) {
      if (value < 5) return "bg-green-50";
      if (value < 10) return "bg-green-100";
      if (value < 20) return "bg-green-200";
      if (value < 30) return "bg-green-300";
      return "bg-green-400";
    } else {
      const absValue = Math.abs(value);
      if (absValue < 5) return "bg-red-50";
      if (absValue < 10) return "bg-red-100";
      if (absValue < 20) return "bg-red-200";
      if (absValue < 30) return "bg-red-300";
      return "bg-red-400";
    }
  };

  const calculatePercentChange = (currentValue: number, comparisonValue: number): string => {
    if (comparisonValue === 0) return "-";
    const diff = currentValue - comparisonValue;
    const percentChange = (diff / Math.abs(comparisonValue)) * 100;
    return `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
  };

  const getComparisonValue = (
    yearData: FormattedFinancialData, 
    prevYearData: FormattedFinancialData | null, 
    baseYearData: FormattedFinancialData | null, 
    metric: keyof FormattedFinancialData
  ): string | null => {
    return null;
  };

  const renderMetricRow = (
    label: string, 
    metric: keyof FormattedFinancialData, 
    isTotal = false, 
    isSubtotal = false,
    isPercentage = false,
    isIndented = false
  ) => {
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
          const prevYearData = index > 0 ? formattedFinancialData[index - 1] : null;
          const percentChange = getComparisonValue(yearData, prevYearData, baseYearData, metric);
          const bgColorClass = percentChange ? getPercentageBackgroundColor(percentChange, metric as string) : "";
          
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
                      'Current Assets': '',
                      'Current Investments': formatNumber(yearData.currentInvestments),
                      'Inventories': formatNumber(yearData.inventories),
                      'Trade Receivables': formatNumber(yearData.tradeReceivables),
                      'Cash & Bank Balances': formatNumber(yearData.cashAndBankBalances),
                      'Short Term Loans & Advances': formatNumber(yearData.shortTermLoansAndAdvances),
                      'Other Current Assets': formatNumber(yearData.otherCurrentAssets),
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 whitespace-nowrap"
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

export default FinancialHealthStatement;
