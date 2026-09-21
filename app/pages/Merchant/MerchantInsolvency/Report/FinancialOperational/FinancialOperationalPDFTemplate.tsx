'use client';

import React from 'react';
import { Building2, BarChart3, LineChart, TrendingUp } from 'lucide-react';
import { MerchantItemType } from '@/app/types';
import './FinancialOperationalPDFTemplate.css';
import SectionHeader from '../components/SectionHeader';
// getTagCategory removed - not used in this template
import Metrics from '../components/Metrics';

interface FinancialMetric {
  label: string;
  value: string | number;
  icon: string;
}

interface RevenueDataPoint {
  name: string;
  year: string;
  revenue: number;
  profit: number;
  cashFlow: number;
}

interface RedFlag {
  id: string;
  description?: string;
  severity?: string;
  rule_type?: string;
  rule_name?: string;
}

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

interface FinancialOperationalPDFTemplateProps {
  activeMerchant: MerchantItemType;
  financialMetrics: FinancialMetric[];
  revenueData: RevenueDataPoint[];
  formattedFinancialData: FormattedFinancialData[];
  startYear: string;
  numberFormat: string;
  activeStatement: 'income' | 'balance' | 'cashflow';
  merchantIndustry?: {
    industry: string;
    risk_segment: string;
  } | null;
  redFlags?: RedFlag[];
}

const FinancialOperationalPDFTemplate: React.FC<FinancialOperationalPDFTemplateProps> = ({
  financialMetrics,
  revenueData,
  formattedFinancialData,
  startYear,
  numberFormat,
  // redFlags omitted - not used in this template
}) => {
  // Format numbers with appropriate formatting
  // formatNumber: formats a numeric value for tables and charts.
  // If `isForTable` is true we hide decimals when the (possibly scaled)
  // value has no fractional component. For percentages we show 1 decimal
  // only when needed, otherwise no decimals.
  const formatNumber = (num: number, isPercentage = false, isForTable = false): string => {
    if (num === null || num === undefined || isNaN(num)) {
      return '-';
    }

    // Helper: detect if a value has a fractional part
    const hasFraction = (v: number) => Math.abs(v - Math.trunc(v)) > 1e-9;

    if (isPercentage) {
      // Show one decimal only when value actually has a fractional part.
      const showDecimal = hasFraction(num);
      const formatted = showDecimal ? num.toFixed(1) : Math.trunc(num).toString();
      // Handle negative zero
      const cleaned = (formatted === '-0.0' || formatted === '-0') ? formatted.replace('-', '') : formatted;
      return `${cleaned}%`;
    }

    // Determine scaled value depending on requested numberFormat so we can
    // decide whether to show decimals for table cells (eg. lakhs/crores scaling).
    let scaled = num;
    switch (numberFormat) {
      case 'lakhs':
        scaled = num / 100000;
        break;
      case 'crores':
        scaled = num / 10000000;
        break;
      case 'millions':
        scaled = num / 1000000;
        break;
      // raw and default keep original num
      default:
        scaled = num;
    }

    // Decide fraction digits: for table formatting only show decimals when
    // the scaled value has a fractional part; otherwise show no decimals.
    const showFraction = isForTable ? hasFraction(scaled) : true;
    const maximumFractionDigits = showFraction ? 2 : 0;
    const minimumFractionDigits = showFraction ? 0 : 0;

    const formatter = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits,
      minimumFractionDigits,
    });

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

  // Format financial metrics values - mirror main UI behavior
  const formatMetricValue = (value: string | number): string => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : '-';
    }

    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        return '-';
      }
      return value.toString();
    }

    return '-';
  };


  // Simple inline SVG line chart to mimic UI visualization
  const renderLineChart = (
    title: string,
    seriesLabel: string,
    color: string,
    valueKey: keyof RevenueDataPoint
  ) => {
    const data = revenueData;
  // Reduce width so three charts fit comfortably on an A4 landscape grid
  // (keeps height similar but allows for small value labels). Using a
  // responsive approach would be better long-term, but a modest fixed
  // decrease fixes the right-side clipping issue quickly.
  const width = 260;
  const height = 160;
    const padding = { t: 20, r: 16, b: 28, l: 36 };

    const values = data.map(d => Number(d[valueKey]) || 0);
    const years = data.map(d => d.year);

    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 0);
    const yMin = minVal === maxVal ? minVal - 1 : minVal;
    const yMax = minVal === maxVal ? maxVal + 1 : maxVal;

    const xScale = (i: number) => {
      const n = Math.max(data.length - 1, 1);
      return padding.l + (i * (width - padding.l - padding.r)) / n;
    };
    const yScale = (v: number) => {
      return padding.t + (yMax - v) * (height - padding.t - padding.b) / (yMax - yMin || 1);
    };

    // Build a smooth curved path using Catmull–Rom to Bezier conversion
    const pts: Array<[number, number]> = values.map((v, i) => [xScale(i), yScale(v)]);
    let pathD = '';
    if (pts.length > 0) {
      pathD = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
      }
    }

    return (
      <div className="pdf-chart-container">
        <h3 className="pdf-chart-title" style={{ textAlign: 'left' }}>{title}</h3>
        <svg width={width} height={height}>
          {/* Axes */}
          <line x1={padding.l} y1={height - padding.b} x2={width - padding.r} y2={height - padding.b} stroke="#9ca3af" strokeWidth={1} />
          <line x1={padding.l} y1={padding.t} x2={padding.l} y2={height - padding.b} stroke="#9ca3af" strokeWidth={1} />

          {/* Ticks and labels for X */}
          {years.map((y, i) => (
            <g key={y}>
              <line x1={xScale(i)} y1={height - padding.b} x2={xScale(i)} y2={height - padding.b + 4} stroke="#9ca3af" />
              <text x={xScale(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="#6b7280">{y}</text>
            </g>
          ))}

          {/* Trend line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth={2} />

          {/* Points */}
          {values.map((v, i) => (
            <g key={`${i}-${v}`}>
              <circle cx={xScale(i)} cy={yScale(v)} r={3} fill="#fff" stroke={color} strokeWidth={2} />
              {/* Value label above the point */}
              <text
                x={xScale(i)}
                y={yScale(v) - 8}
                textAnchor="middle"
                fontSize={6}
                fill={color}
                fontWeight={600}
              >
                {formatNumber(Number(values[i] || 0))}
              </text>
            </g>
          ))}
        </svg>
        {/* Legend */}
        {/* <div className="pdf-legend" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#374151' }}>{seriesLabel}</span>
        </div> */}
      </div>
    );
  };

  // Severity helpers removed - red flags not rendered in this template

  // Red flags rendering is not used in this template; helper functions kept minimal for potential reuse

  // Check if a year should be shown based on the selected start year
  const shouldShowYear = (year: string) => {
    // Show all available years in the PDF by default. Previously this filtered out
    // years older than `startYear` which caused older data (eg. 2019) to be hidden
    // in some merchants. If you need a filter UI later we can re-introduce it, but
    // for PDF exports we want to include all provided years.
    return true;
  };

  // Render a metric row for financial statements
  const renderMetricRow = (
    label: string, 
    metric: keyof FormattedFinancialData, 
    isTotal = false, 
    isSubtotal = false,
    isPercentage = false,
    isIndented = false,
    uniqueKey?: string
  ) => {
    const rowKey = uniqueKey || `${label}-${metric}`;
    return (
      <tr key={rowKey} className={`pdf-statement-row ${isTotal ? 'pdf-total-row' : ''} ${isSubtotal ? 'pdf-subtotal-row' : ''}`}>
        <td className={`pdf-statement-label ${isIndented ? 'pdf-indented' : ''}`}>
          {label}
        </td>
        {formattedFinancialData.map((yearData) => (
          <td key={yearData.name} className={`pdf-statement-value ${shouldShowYear(yearData.name) ? '' : 'pdf-hidden'}`}>
            {formatNumber(Number(yearData[metric]), isPercentage, true)}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="pdf-financial-template">
      {/* Header */}
      {/* <div className="pdf-header">
        <div className="pdf-header-content">
          <div className="pdf-title-section">
            <h1 className="pdf-main-title">{activeMerchant.legalName}</h1>
            <div className="pdf-subtitle-section">
              {merchantIndustry && (
                <span className={`pdf-industry-tag ${
                  merchantIndustry.risk_segment === 'Medium' ? 'medium-risk' : 
                  merchantIndustry.risk_segment === 'High' ? 'high-risk' : 
                  merchantIndustry.risk_segment === 'Low' ? 'low-risk' : 
                  'default-risk'
                }`}>
                  {merchantIndustry.industry}
                </span>
              )}
              <span className="pdf-cin">CIN {activeMerchant.cin || activeMerchant.id}</span>
            </div>
          </div>
          <div className="pdf-report-info">
            <h2 className="pdf-report-title">Financial & Operational Report</h2>
            <p className="pdf-report-date">Generated on {new Date().toLocaleDateString()}</p>
            <p className="pdf-report-period">Base Year: {startYear}</p>
          </div>
        </div>
      </div> */}

      {/* Financial Metrics + Financial Trends */}
      <div className="pdf-watermarked-group">
        {/* Financial Metrics Section */}
        <div className="pdf-section">
          <SectionHeader title="Financial Metrics" Icon={LineChart} />
          <div className="pdf-section-content">
            {financialMetrics.length > 0 ? (
              <Metrics
                metrics={financialMetrics.map(m => ({ label: m.label, value: formatMetricValue(m.value), icon: m.icon }))}
                layout="table"
                columns={4}
                truncateLength={40}
              />
            ) : (
              <p className="pdf-no-data">No financial metrics data available.</p>
            )}
          </div>
        </div>

        {/* Financial Visualizations Section */}
        <div className="pdf-section">
          <SectionHeader title="Financial Trends" Icon={TrendingUp} />
          <div className="pdf-section-content">
            {revenueData.length > 0 ? (
              <div className="pdf-charts-grid">
                {renderLineChart('Revenue Trend (₹)', 'Annual Revenue (₹)', '#10b981', 'revenue')}
                {renderLineChart('Profit Trend (₹)', 'Annual Profit (₹)', '#3b82f6', 'profit')}
                {renderLineChart('Cash Flow from Operations Trend (₹)', 'Cash Flow from Operations (₹)', '#8b5cf6', 'cashFlow')}
              </div>
            ) : (
              <p className="pdf-no-data">No financial trend data available.</p>
            )}
          </div>
        </div>

      </div>

      {/* Financial Statements Section (styled like Overview) */}
      {/* <div className="pdf-section">
        <div className="pdf-section-header">
          <h2 className="pdf-section-title">Financial Statements</h2>
        </div>
        // {renderRedFlags(filteredStatementFlags)}
      </div> */}

  {/* Income Statement Section */}
  <div className="pdf-section pdf-page-break pdf-income-statement">
  <SectionHeader title="Income Statement" Icon={BarChart3} />
        {formattedFinancialData.length > 0 ? (
          <div className="pdf-statement-table-wrapper">
            <div className="pdf-section-content">
              <div className="pdf-statement-container">
                <table className="pdf-statement-table pdf-statement-table--compact">
                <thead>
                  <tr>
                    <th className="pdf-statement-header">Metric</th>
                    {formattedFinancialData.map(yearData => (
                      <th key={yearData.name} className={`pdf-year-header ${shouldShowYear(yearData.name) ? '' : 'pdf-hidden'}`}>
                        {yearData.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="pdf-section-divider">
                    <td colSpan={formattedFinancialData.length + 1}>Revenue & Cost of Sales</td>
                  </tr>
                  {renderMetricRow("Revenue", "revenue", false, true)}
                  {renderMetricRow("Cost of Sales", "costOfSales", false, false, false)}
                  {renderMetricRow("Gross Profit", "grossProfit", false, true)}
                  {renderMetricRow("Gross Margin", "grossMargin", false, false, true)}
                  
                  <tr className="pdf-section-divider">
                    <td colSpan={formattedFinancialData.length + 1}>Operating Expenses</td>
                  </tr>
                  {renderMetricRow("Research & Development", "researchAndDevelopment", false, false, false)}
                  {renderMetricRow("Sales & Marketing", "salesAndMarketing", false, false, false)}
                  {renderMetricRow("General & Administrative", "generalAndAdmin", false, false, false)}
                  {renderMetricRow("Total Operating Expenses", "totalOperatingExpenses", false, true)}
                  
                  <tr className="pdf-section-divider">
                    <td colSpan={formattedFinancialData.length + 1}>Income & Taxes</td>
                  </tr>
                  {renderMetricRow("Operating Income", "operatingIncome", false, true)}
                  {renderMetricRow("Operating Margin", "operatingMargin", false, false, true)}
                  {renderMetricRow("Interest Expense", "interestExpense", false, false, false)}
                  {renderMetricRow("Other Income", "otherIncome", false, false, false)}
                  {renderMetricRow("Income Taxes", "incomeTaxes", false, false, false)}
                  {renderMetricRow("Net Income", "netIncome", true)}
                  {renderMetricRow("Net Margin", "netMargin", false, false, true)}
                  
                  {/* <tr className="pdf-section-divider">
                    <td colSpan={formattedFinancialData.length + 1}>Per Share Data</td>
                  </tr> */}
                  {renderMetricRow("Shares Outstanding", "sharesOutstanding", false, false, false)}
                  {renderMetricRow("Earnings Per Share", "earningsPerShare", false, true)}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="pdf-section-content"><p className="pdf-no-data">No income statement data available.</p></div>
        )}
      </div>

  {/* Balance Sheet Section */}
  <div className="pdf-section pdf-page-break">
  <SectionHeader title="Balance Sheet" Icon={Building2} />
        <div className="pdf-section-content">
          {formattedFinancialData.length > 0 ? (
            <div className="pdf-statement-container">
              {/* Assets table (up to Total Assets) */}
              <div className="pdf-statement-table-wrapper">
                <table className="pdf-statement-table">
                  <thead>
                    <tr>
                      <th className="pdf-statement-header">Metric</th>
                      {formattedFinancialData.map(yearData => (
                        <th key={yearData.name} className={`pdf-year-header ${shouldShowYear(yearData.name) ? '' : 'pdf-hidden'}`}>
                          {yearData.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1}>Assets</td>
                    </tr>
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1} className="pdf-subsection">Non-Current Assets</td>
                    </tr>
                    {renderMetricRow("Tangible Assets", "tangibleAssets", false, false, false)}
                    {renderMetricRow("Intangible Assets", "intangibleAssets", false, false, false)}
                    {renderMetricRow("Capital Work in Progress", "capitalWorkInProgress", false, false, false)}
                    {renderMetricRow("Non-Current Investments", "noncurrentInvestments", false, false, false)}
                    {renderMetricRow("Long Term Loans & Advances", "longTermLoansAndAdvances", false, false, false)}
                    {renderMetricRow("Other Non-Current Assets", "otherNoncurrentAssets", false, false, false)}
                    
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1} className="pdf-subsection">Current Assets</td>
                    </tr>
                    {renderMetricRow("Current Investments", "currentInvestments", false, false, false)}
                    {renderMetricRow("Inventories", "inventories", false, false, false)}
                    {renderMetricRow("Trade Receivables", "tradeReceivables", false, false, false)}
                    {renderMetricRow("Cash & Bank Balances", "cashAndBankBalances", false, false, false)}
                    {renderMetricRow("Short Term Loans & Advances", "shortTermLoansAndAdvances", false, false, false)}
                    {renderMetricRow("Other Current Assets", "otherCurrentAssets", false, false, false)}
                    {renderMetricRow("Total Assets", "totalAssets", true)}
                  </tbody>
                </table>
              </div>

              {/* Liabilities table (remaining rows) */}
              <div className="pdf-statement-table-wrapper pdf-page-break">
                <table className="pdf-statement-table">
                  <thead>
                    <tr>
                      <th className="pdf-statement-header">Metric</th>
                      {formattedFinancialData.map(yearData => (
                        <th key={yearData.name} className={`pdf-year-header ${shouldShowYear(yearData.name) ? '' : 'pdf-hidden'}`}>
                          {yearData.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1}>Liabilities</td>
                    </tr>
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1} className="pdf-subsection">Shareholders&apos; Funds</td>
                    </tr>
                    {renderMetricRow("Share Capital", "shareCapital", false, false, false)}
                    {renderMetricRow("Reserves & Surplus", "reservesAndSurplus", false, false, false)}
                    
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1} className="pdf-subsection">Non-Current Liabilities</td>
                    </tr>
                    {renderMetricRow("Long Term Borrowings", "longTermBorrowings", false, false, false)}
                    {renderMetricRow("Other Long Term Liabilities", "otherLongTermLiabilities", false, false, false)}
                    {renderMetricRow("Long Term Provisions", "longTermProvisions", false, false, false)}
                    
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1} className="pdf-subsection">Current Liabilities</td>
                    </tr>
                    {renderMetricRow("Short Term Borrowings", "shortTermBorrowings", false, false, false)}
                    {renderMetricRow("Trade Payables", "tradePayables", false, false, false)}
                    {renderMetricRow("Other Current Liabilities", "otherCurrentLiabilities", false, false, false)}
                    {renderMetricRow("Short Term Provisions", "shortTermProvisions", false, false, false)}
                    {renderMetricRow("Total Liabilities", "totalLiabilities", true)}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="pdf-no-data">No balance sheet data available.</p>
          )}
        </div>
      </div>

      {/* Cash Flow Statement Section */}
      <div className="pdf-section pdf-page-break">
        <SectionHeader title="Cash Flow Statement" Icon={BarChart3} />
        <div className="pdf-section-content">
          {formattedFinancialData.length > 0 ? (
            <div className="pdf-statement-container">
              {/* Operating + Investing Activities table (up to Cash Used in Investing Activities) */}
              <div className="pdf-statement-table-wrapper">
                <table className="pdf-statement-table">
                  <thead>
                    <tr>
                      <th className="pdf-statement-header">Metric</th>
                      {formattedFinancialData.map(yearData => (
                        <th key={yearData.name} className={`pdf-year-header ${shouldShowYear(yearData.name) ? '' : 'pdf-hidden'}`}>
                          {yearData.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1}>Cash Flow from Operating Activities</td>
                    </tr>
                    {renderMetricRow("Profit Before Tax", "profitBeforeTax", false, false, false)}
                    {renderMetricRow("Adjustments for Finance Cost & Depreciation", "financeCostAndDepreciation", false, false, false)}
                    {renderMetricRow("Adjustments for Current & Non-Current Assets", "currentAndNonCurrentAssets", false, false, false)}
                    {renderMetricRow("Adjustments for Current & Non-Current Liabilities", "currentAndNonCurrentLiabilities", false, false, false)}
                    {renderMetricRow("Other Adjustments", "otherOperatingAdjustments", false, false, false)}
                    {renderMetricRow("Cash Generated from Operations", "cashFlowFromOperatingActivities", true)}
                    
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1}>Cash Flow from Investing Activities</td>
                    </tr>
                    {renderMetricRow("Purchase of Assets", "purchaseOfAssets", false, false, false)}
                    {renderMetricRow("Sale of Assets", "saleOfAssets", false, false, false)}
                    {renderMetricRow("Income from Assets", "incomeFromAssets", false, false, false)}
                    {renderMetricRow("Other Adjustments", "otherInvestingAdjustments", false, false, false)}
                    {renderMetricRow("Cash Used in Investing Activities", "cashFlowFromInvestingActivities", true)}
                  </tbody>
                </table>
              </div>

              {/* Financing Activities and remainder table */}
              <div className="pdf-statement-table-wrapper pdf-page-break">
                <table className="pdf-statement-table">
                  <thead>
                    <tr>
                      <th className="pdf-statement-header">Metric</th>
                      {formattedFinancialData.map(yearData => (
                        <th key={yearData.name} className={`pdf-year-header ${shouldShowYear(yearData.name) ? '' : 'pdf-hidden'}`}>
                          {yearData.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1}>Cash Flow from Financing Activities</td>
                    </tr>
                    {renderMetricRow("Repayment of Capital & Borrowings", "repaymentOfCapitalAndBorrowings", false, false, false)}
                    {renderMetricRow("Raising Capital & Borrowings", "raisingCapitalAndBorrowings", false, false, false)}
                    {renderMetricRow("Interest & Dividends Paid", "interestAndDividendsPaid", false, false, false)}
                    {renderMetricRow("Other Adjustments", "otherFinancingAdjustments", false, false, false)}
                    {renderMetricRow("Cash Used in Financing Activities", "cashFlowFromFinancingActivities", true)}
                    
                    <tr className="pdf-section-divider">
                      <td colSpan={formattedFinancialData.length + 1}>Net Change in Cash & Cash Equivalents</td>
                    </tr>
                    {renderMetricRow("Cash & Cash Equivalents Before Exchange Rate Changes", "cashAndCashEquivalentsBeforeExchange", false, false, false)}
                    {renderMetricRow("Adjustments to Cash & Cash Equivalents", "adjustmentsToCashAndEquivalents", false, false, false)}
                    {renderMetricRow("Net Increase/Decrease in Cash & Cash Equivalents", "cashAndCashEquivalents", true)}
                    {renderMetricRow("Cash & Cash Equivalents at End of Period", "cashAtEndOfPeriod", true)}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="pdf-no-data">No cash flow statement data available.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      {/* <div className="pdf-footer">
        <p>This report contains confidential financial and operational information.</p>
        <p>© {new Date().getFullYear()} Insolvency Analysis Platform</p>
      </div> */}
    </div>
  );
};

export default FinancialOperationalPDFTemplate;