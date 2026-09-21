'use client';

import { FC, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Download, AlertCircle } from 'lucide-react';
import financialStatements from '@/app/data/tarc_rerun_peer_comparison/financial_statements.json';

// Ported from ipo-compliance-nse/listing-compliance-ui's PeerFinancialStatement.tsx,
// with the live usePeerFinancialStore/useCompanyStore/useIpoFinancialStore data
// sources replaced by the static financial_statements.json snapshot for TARC.

type PercentageDisplayMode = 'none' | 'prevYear' | 'relativeToPeers';
type StatementType = 'income' | 'balance' | 'cashflow';
type NumberFormatMode = '₹L' | '₹Cr' | '₹M' | '₹';
type NatureType = 'STANDALONE' | 'CONSOLIDATED';

const peerFinancials = financialStatements.data;

const PeerFinancialAnalysisTab: FC = () => {
  const years = useMemo(() => [...peerFinancials.years].sort((a, b) => parseInt(a) - parseInt(b)), []);

  const [selectedYear, setSelectedYear] = useState<string>(years[years.length - 1]);
  const [percentageMode, setPercentageMode] = useState<PercentageDisplayMode>('prevYear');
  const [activeStatement, setActiveStatement] = useState<StatementType>('income');
  const [numberFormat, setNumberFormat] = useState<NumberFormatMode>('₹Cr');
  const [activeNature, setActiveNature] = useState<NatureType>('STANDALONE');

  // CSV Export Logic
  const handleExportCSV = () => {
    if (!selectedYear) return;
    const currentYearData = peerFinancials.by_year.find((y) => y.year === selectedYear);
    if (!currentYearData) return;

    const companies = currentYearData.companies;
    const header = ['Metric', ...companies.map((c) => c.display_name)];
    const csvRows: string[][] = [header];

    const sections = [
      {
        name: 'INCOME STATEMENT',
        metrics: [
          { label: 'Revenue', key: 'revenue' },
          { label: 'Cost of Sales', key: 'costOfSales' },
          { label: 'Gross Profit', key: 'grossProfit' },
          { label: 'Gross Margin (%)', key: 'grossMargin' },
          { label: 'Research & Development', key: 'researchAndDevelopment' },
          { label: 'Sales & Marketing', key: 'salesAndMarketing' },
          { label: 'General & Administrative', key: 'generalAndAdmin' },
          { label: 'Total Operating Expenses', key: 'totalOperatingExpenses' },
          { label: 'Operating Income', key: 'operatingIncome' },
          { label: 'Operating Margin (%)', key: 'operatingMargin' },
          { label: 'Interest Expense', key: 'interestExpense' },
          { label: 'Other Income', key: 'otherIncome' },
          { label: 'Net Income', key: 'netIncome' },
          { label: 'Net Margin (%)', key: 'netMargin' },
          { label: 'Shares Outstanding', key: 'sharesOutstanding' },
          { label: 'Earnings Per Share', key: 'earningsPerShare' },
        ],
      },
      {
        name: 'BALANCE SHEET',
        metrics: [
          { label: 'Tangible Assets', key: 'tangibleAssets' },
          { label: 'Intangible Assets', key: 'intangibleAssets' },
          { label: 'Capital Work in Progress', key: 'capitalWorkInProgress' },
          { label: 'Non-Current Investments', key: 'noncurrentInvestments' },
          { label: 'Long Term Loans & Advances', key: 'longTermLoansAndAdvances' },
          { label: 'Other Non-Current Assets', key: 'otherNoncurrentAssets' },
          { label: 'Current Investments', key: 'currentInvestments' },
          { label: 'Inventories', key: 'inventories' },
          { label: 'Trade Receivables', key: 'tradeReceivables' },
          { label: 'Cash & Bank Balances', key: 'cashAndBankBalances' },
          { label: 'Short Term Loans & Advances', key: 'shortTermLoansAndAdvances' },
          { label: 'Other Current Assets', key: 'otherCurrentAssets' },
          { label: 'Total Assets', key: 'totalAssets' },
          { label: 'Share Capital', key: 'shareCapital' },
          { label: 'Reserves & Surplus', key: 'reservesAndSurplus' },
          { label: 'Long Term Borrowings', key: 'longTermBorrowings' },
          { label: 'Other Long Term Liabilities', key: 'otherLongTermLiabilities' },
          { label: 'Long Term Provisions', key: 'longTermProvisions' },
          { label: 'Short Term Borrowings', key: 'shortTermBorrowings' },
          { label: 'Trade Payables', key: 'tradePayables' },
          { label: 'Other Current Liabilities', key: 'otherCurrentLiabilities' },
          { label: 'Short Term Provisions', key: 'shortTermProvisions' },
          { label: 'Total Liabilities', key: 'totalLiabilities' },
        ],
      },
      {
        name: 'CASH FLOW STATEMENT',
        metrics: [
          { label: 'Profit Before Tax', key: 'profitBeforeTax' },
          { label: 'Adjustments for Finance Cost & Depreciation', key: 'financeCostAndDepreciation' },
          { label: 'Adjustments for Current & Non-Current Assets', key: 'currentAndNonCurrentAssets' },
          { label: 'Adjustments for Current & Non-Current Liabilities', key: 'currentAndNonCurrentLiabilities' },
          { label: 'Other Adjustments', key: 'otherOperatingAdjustments' },
          { label: 'Cash Generated from Operations', key: 'cashFlowFromOperatingActivities' },
          { label: 'Purchase of Assets', key: 'purchaseOfAssets' },
          { label: 'Sale of Assets', key: 'saleOfAssets' },
          { label: 'Income from Assets', key: 'incomeFromAssets' },
          { label: 'Other Adjustments', key: 'otherInvestingAdjustments' },
          { label: 'Cash Used in Investing Activities', key: 'cashFlowFromInvestingActivities' },
          { label: 'Repayment of Capital & Borrowings', key: 'repaymentOfCapitalAndBorrowings' },
          { label: 'Raising Capital & Borrowings', key: 'raisingCapitalAndBorrowings' },
          { label: 'Interest & Dividends Paid', key: 'interestAndDividendsPaid' },
          { label: 'Other Adjustments', key: 'otherFinancingAdjustments' },
          { label: 'Cash Used in Financing Activities', key: 'cashFlowFromFinancingActivities' },
          { label: 'Cash & Equivalents Before Exchange Rate Changes', key: 'cashAndCashEquivalentsBeforeExchange' },
          { label: 'Adjustments to Cash & Cash Equivalents', key: 'adjustmentsToCashAndEquivalents' },
          { label: 'Net Increase/Decrease in Cash & Cash Equivalents', key: 'cashAndCashEquivalents' },
          { label: 'Cash & Cash Equivalents at End of Period', key: 'cashAtEndOfPeriod' },
        ],
      },
    ];

    sections.forEach((section) => {
      csvRows.push([]);
      csvRows.push([section.name]);
      section.metrics.forEach((metric) => {
        const rowValues = companies.map((company) => {
          const val = getMetricValue(company, metric.key);
          return val !== null ? String(val) : '';
        });
        csvRows.push([metric.label, ...rowValues]);
      });
    });

    const csvContent = csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Peer_Comparison_Financial_Statements_${activeNature.toLowerCase()}_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value as any)) {
      return '-';
    }
    if ((value as number) === 0) {
      return '0';
    }

    let displayValue = value as number;
    let suffix = '';

    switch (numberFormat) {
      case '₹L':
        displayValue = displayValue / 100000;
        suffix = 'L';
        break;
      case '₹Cr':
        displayValue = displayValue / 10000000;
        suffix = 'Cr';
        break;
      case '₹M':
        displayValue = displayValue / 1000000;
        suffix = 'M';
        break;
      case '₹':
      default:
        break;
    }

    const formatter = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: numberFormat === '₹' ? 0 : 2,
      maximumFractionDigits: 2,
    });
    const formattedValue = formatter.format(displayValue);
    if (numberFormat === '₹') {
      return formattedValue;
    }
    return `₹${formattedValue}${suffix}`;
  };

  const getMetricValue = (company: any, metric: string): number | null => {
    const sectionsArray = company.sections || [];
    const natureSection = Array.isArray(sectionsArray)
      ? sectionsArray.find((s: any) => s.nature === activeNature)
      : null;

    if (!natureSection) return null;

    const sectionData = natureSection.sections || {};

    const income = sectionData['Income Statement'] || {};
    const balance = sectionData['Balance Sheet'] || {};
    const cashflow = sectionData['Cash Flow Statement'] || {};

    switch (metric) {
      case 'revenue':
        return income.net_revenue ?? null;
      case 'costOfSales':
        return income.total_cost_of_materials_consumed ?? null;
      case 'grossProfit': {
        const rev = income.net_revenue;
        const cos = income.total_cost_of_materials_consumed;
        if (rev === undefined || rev === null) return null;
        return rev - (cos || 0);
      }
      case 'grossMargin': {
        const rev = income.net_revenue;
        const cos = income.total_cost_of_materials_consumed;
        if (!rev) return null;
        const gp = rev - (cos || 0);
        return (gp / rev) * 100;
      }
      case 'researchAndDevelopment':
        return income.total_employee_benefit_expense ?? null;
      case 'salesAndMarketing':
        return income.total_other_expenses ?? null;
      case 'totalOperatingExpenses': {
        const toc = income.total_operating_cost;
        const cos = income.total_cost_of_materials_consumed;
        if (toc === undefined || toc === null) return null;
        return toc - (cos || 0);
      }
      case 'generalAndAdmin': {
        const toc = income.total_operating_cost;
        const cos = income.total_cost_of_materials_consumed;
        if (toc === undefined || toc === null) return null;
        const toe = toc - (cos || 0);
        const rd = income.total_employee_benefit_expense || 0;
        const sm = income.total_other_expenses || 0;
        return toe - rd - sm;
      }
      case 'operatingIncome':
        return income.operating_profit ?? null;
      case 'operatingMargin': {
        const rev = income.net_revenue;
        const oi = income.operating_profit;
        if (!rev || oi === undefined || oi === null) return null;
        return (oi / rev) * 100;
      }
      case 'interestExpense':
        return income.interest ?? null;
      case 'otherIncome':
        return income.other_income ?? null;
      case 'incomeTaxes':
        return null;
      case 'netIncome':
        return income.profit_after_tax ?? null;
      case 'netMargin': {
        const rev = income.net_revenue;
        const ni = income.profit_after_tax;
        if (!rev || ni === undefined || ni === null) return null;
        return (ni / rev) * 100;
      }
      case 'sharesOutstanding':
        return balance.share_capital ? balance.share_capital / 10 : null;
      case 'earningsPerShare': {
        const ni = income.profit_after_tax;
        const sc = balance.share_capital;
        if (ni === undefined || ni === null || !sc) return null;
        return ni / (sc / 10);
      }

      case 'tangibleAssets':
        return balance.tangible_assets ?? null;
      case 'intangibleAssets':
        return balance.intangible_assets ?? null;
      case 'capitalWorkInProgress':
        return balance.tangible_assets_capital_work_in_progress ?? null;
      case 'noncurrentInvestments':
        return balance.noncurrent_investments ?? null;
      case 'longTermLoansAndAdvances':
        return balance.long_term_loans_and_advances ?? null;
      case 'otherNoncurrentAssets':
        return balance.other_noncurrent_assets ?? null;
      case 'currentInvestments':
        return balance.current_investments ?? null;
      case 'inventories':
        return balance.inventories ?? null;
      case 'tradeReceivables':
        return balance.trade_receivables ?? null;
      case 'cashAndBankBalances':
        return balance.cash_and_bank_balances ?? null;
      case 'shortTermLoansAndAdvances':
        return balance.short_term_loans_and_advances ?? null;
      case 'otherCurrentAssets':
        return balance.other_current_assets ?? null;
      case 'totalAssets':
        return balance.given_assets_total ?? null;

      case 'shareCapital':
        return balance.share_capital ?? null;
      case 'reservesAndSurplus':
        return balance.reserves_and_surplus ?? null;
      case 'longTermBorrowings':
        return balance.long_term_borrowings ?? null;
      case 'otherLongTermLiabilities':
        return balance.other_long_term_liabilities ?? null;
      case 'longTermProvisions':
        return balance.long_term_provisions ?? null;
      case 'shortTermBorrowings':
        return balance.short_term_borrowings ?? null;
      case 'tradePayables':
        return balance.trade_payables ?? null;
      case 'otherCurrentLiabilities':
        return balance.other_current_liabilities ?? null;
      case 'shortTermProvisions':
        return balance.short_term_provisions ?? null;
      case 'totalLiabilities':
        return balance.given_liabilities_total ?? null;

      case 'profitBeforeTax':
        return cashflow.profit_before_tax_cf ?? null;
      case 'financeCostAndDepreciation':
        return cashflow.adjustment_for_finance_cost_and_depreciation ?? null;
      case 'currentAndNonCurrentAssets':
        return cashflow.adjustment_for_current_and_non_current_assets ?? null;
      case 'currentAndNonCurrentLiabilities':
        return cashflow.adjustment_for_current_and_non_current_liabilities ?? null;
      case 'otherOperatingAdjustments':
        return cashflow.other_adjustments_in_operating_activities ?? null;
      case 'cashFlowFromOperatingActivities':
        return cashflow.cash_flows_from_used_in_operating_activities ?? null;
      case 'purchaseOfAssets':
        return cashflow.cash_outflow_from_purchase_of_assets ?? null;
      case 'saleOfAssets':
        return cashflow.cash_inflow_from_sale_of_assets ?? null;
      case 'incomeFromAssets':
        return cashflow.income_from_assets ?? null;
      case 'otherInvestingAdjustments':
        return cashflow.other_adjustments_in_investing_activities ?? null;
      case 'cashFlowFromInvestingActivities':
        return cashflow.cash_flows_from_used_in_investing_activities ?? null;
      case 'repaymentOfCapitalAndBorrowings':
        return cashflow.cash_outflow_from_repayment_of_capital_and_borrowings ?? null;
      case 'raisingCapitalAndBorrowings':
        return cashflow.cash_inflow_from_raisng_capital_and_borrowings ?? null;
      case 'interestAndDividendsPaid':
        return cashflow.interest_and_dividends_paid ?? null;
      case 'otherFinancingAdjustments':
        return cashflow.other_adjustments_in_financing_activities ?? null;
      case 'cashFlowFromFinancingActivities':
        return cashflow.cash_flows_from_used_in_financing_activities ?? null;
      case 'cashAndCashEquivalentsBeforeExchange':
        return cashflow.incr_decr_in_cash_cash_equv_before_effect_of_excg_rate_changes ?? null;
      case 'adjustmentsToCashAndEquivalents':
        return cashflow.adjustments_to_cash_and_cash_equivalents ?? null;
      case 'cashAndCashEquivalents':
        return cashflow.incr_decr_in_cash_cash_equv ?? null;
      case 'cashAtEndOfPeriod':
        return cashflow.cash_flow_statement_at_end_of_period ?? null;

      default:
        return null;
    }
  };

  const calculatePercentageChange = (currentValue: number | null, baseValue: number | null) => {
    if (currentValue === null || baseValue === null || baseValue === 0) return null;
    const change = ((currentValue - baseValue) / Math.abs(baseValue)) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getPercentageBackgroundColor = (percentText: string): string => {
    if (!percentText || percentText === '-') return '';
    const value = parseFloat(percentText.replace('+', '').replace('%', ''));
    if (value === 0) return '';
    if (value > 0) {
      if (value < 5) return 'bg-green-50';
      if (value < 10) return 'bg-green-100';
      if (value < 20) return 'bg-green-200';
      if (value < 30) return 'bg-green-300';
      return 'bg-green-400';
    }
    const absValue = Math.abs(value);
    if (absValue < 5) return 'bg-red-50';
    if (absValue < 10) return 'bg-red-100';
    if (absValue < 20) return 'bg-red-200';
    if (absValue < 30) return 'bg-red-300';
    return 'bg-red-400';
  };

  const getPercentageTextColor = (percentText: string): string => {
    if (!percentText || percentText === '-') return 'text-gray-500';
    const value = parseFloat(percentText.replace('+', '').replace('%', ''));
    if (value === 0) return 'text-gray-500';
    return value > 0 ? 'text-green-700' : 'text-red-700';
  };

  const renderIcon = (key: string) => {
    const iconList = [
      'BarChart3', 'TrendingUp', 'PieChart', 'Activity', 'DollarSign',
      'Percent', 'Briefcase', 'LineChart', 'Target', 'Zap',
      'Layers', 'Globe', 'Cpu', 'Shield', 'HardDrive', 'Scale',
      'Wallet', 'Landmark', 'Coins', 'Banknote', 'CreditCard',
      'ClipboardList', 'Home', 'Key', 'RefreshCw', 'Microscope',
      'GitPullRequest', 'History', 'ArrowDownCircle', 'Receipt',
    ];

    const iconMap: { [key: string]: string } = {
      revenue: 'BarChart3', costOfSales: 'ShoppingCart', grossProfit: 'TrendingUp', grossMargin: 'Percent',
      researchAndDevelopment: 'Microscope', salesAndMarketing: 'Target', generalAndAdmin: 'Briefcase',
      totalOperatingExpenses: 'Calculator', operatingIncome: 'Activity', operatingMargin: 'PieChart',
      interestExpense: 'Percent', otherIncome: 'PlusCircle', incomeTaxes: 'Receipt', netIncome: 'DollarSign',
      netMargin: 'LineChart', sharesOutstanding: 'Layers', earningsPerShare: 'Zap',
      tangibleAssets: 'Home', intangibleAssets: 'Key', capitalWorkInProgress: 'Hammer',
      noncurrentInvestments: 'Landmark', longTermLoansAndAdvances: 'Handshake', otherNoncurrentAssets: 'Files',
      currentInvestments: 'TrendingUp', inventories: 'ClipboardList', tradeReceivables: 'FileText',
      cashAndBankBalances: 'Banknote', shortTermLoansAndAdvances: 'Clock', otherCurrentAssets: 'PlusSquare',
      totalAssets: 'Globe', shareCapital: 'Landmark', reservesAndSurplus: 'Coins', longTermBorrowings: 'Wallet',
      otherLongTermLiabilities: 'Shield', longTermProvisions: 'Lock', shortTermBorrowings: 'CreditCard',
      tradePayables: 'FileText', otherCurrentLiabilities: 'AlertCircle', shortTermProvisions: 'Timer',
      totalLiabilities: 'ShieldAlert', profitBeforeTax: 'BarChart', financeCostAndDepreciation: 'ArrowDownCircle',
      currentAndNonCurrentAssets: 'Layers', currentAndNonCurrentLiabilities: 'HardDrive',
      otherOperatingAdjustments: 'RefreshCw', cashFlowFromOperatingActivities: 'Activity',
      purchaseOfAssets: 'ShoppingCart', saleOfAssets: 'DollarSign', incomeFromAssets: 'TrendingUp',
      otherInvestingAdjustments: 'PlusCircle', cashFlowFromInvestingActivities: 'Briefcase',
      repaymentOfCapitalAndBorrowings: 'MinusCircle', raisingCapitalAndBorrowings: 'PlusCircle',
      interestAndDividendsPaid: 'Percent', otherFinancingAdjustments: 'GitPullRequest',
      cashFlowFromFinancingActivities: 'Zap', cashAndCashEquivalentsBeforeExchange: 'History',
      adjustmentsToCashAndEquivalents: 'Cpu', cashAndCashEquivalents: 'TrendingUp', cashAtEndOfPeriod: 'Flag',
    };

    const getHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const iconName = iconMap[key] || iconList[getHash(key) % iconList.length];
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.BarChart3;

    return <IconComponent size={16} className="text-blue-700" />;
  };

  const currentYearData = peerFinancials.by_year.find((y) => y.year === selectedYear);
  const displayCompanies = currentYearData?.companies || [];

  const hasDataForActiveNature = useMemo(() => {
    if (!displayCompanies || displayCompanies.length === 0) return false;
    return displayCompanies.some((company: any) => {
      const sectionsArray = company.sections || [];
      return Array.isArray(sectionsArray) && sectionsArray.some((s: any) => s.nature === activeNature);
    });
  }, [displayCompanies, activeNature]);

  const companyColumnHasData = useMemo(() => {
    return displayCompanies.map((company: any) => {
      const sectionsArray = company.sections || [];
      return Array.isArray(sectionsArray) && sectionsArray.some((s: any) => s.nature === activeNature);
    });
  }, [displayCompanies, activeNature]);

  const statementRowsDefinition = useMemo(() => {
    if (activeStatement === 'income') {
      return [
        { type: 'header', label: 'Revenue & Cost of Sales' },
        { type: 'metric', label: 'Revenue', metric: 'revenue', isTotal: false, isSubtotal: true },
        { type: 'metric', label: 'Cost of Sales', metric: 'costOfSales', isIndented: true },
        { type: 'metric', label: 'Gross Profit', metric: 'grossProfit', isSubtotal: true },
        { type: 'metric', label: 'Gross Margin', metric: 'grossMargin', isPercentage: true },
        { type: 'header', label: 'Operating Expenses' },
        { type: 'metric', label: 'Research & Development', metric: 'researchAndDevelopment', isIndented: true },
        { type: 'metric', label: 'Sales & Marketing', metric: 'salesAndMarketing', isIndented: true },
        { type: 'metric', label: 'General & Administrative', metric: 'generalAndAdmin', isIndented: true },
        { type: 'metric', label: 'Total Operating Expenses', metric: 'totalOperatingExpenses', isSubtotal: true },
        { type: 'header', label: 'Income & Taxes' },
        { type: 'metric', label: 'Operating Income', metric: 'operatingIncome', isSubtotal: true },
        { type: 'metric', label: 'Operating Margin', metric: 'operatingMargin', isPercentage: true },
        { type: 'metric', label: 'Interest Expense', metric: 'interestExpense', isIndented: true },
        { type: 'metric', label: 'Other Income', metric: 'otherIncome', isIndented: true },
        { type: 'metric', label: 'Income Taxes', metric: 'incomeTaxes', isIndented: true },
        { type: 'metric', label: 'Net Income', metric: 'netIncome', isTotal: true },
        { type: 'metric', label: 'Net Margin', metric: 'netMargin', isPercentage: true },
        { type: 'header', label: 'Per Share Data' },
        { type: 'metric', label: 'Shares Outstanding', metric: 'sharesOutstanding', isIndented: true },
        { type: 'metric', label: 'Earnings Per Share', metric: 'earningsPerShare', isSubtotal: true },
      ];
    }
    if (activeStatement === 'balance') {
      return [
        { type: 'header', label: 'Assets' },
        { type: 'header', label: 'Non-Current Assets', isSubHeader: true },
        { type: 'metric', label: 'Tangible Assets', metric: 'tangibleAssets', isIndented: true },
        { type: 'metric', label: 'Intangible Assets', metric: 'intangibleAssets', isIndented: true },
        { type: 'metric', label: 'Capital Work in Progress', metric: 'capitalWorkInProgress', isIndented: true },
        { type: 'metric', label: 'Non-Current Investments', metric: 'noncurrentInvestments', isIndented: true },
        { type: 'metric', label: 'Long Term Loans & Advances', metric: 'longTermLoansAndAdvances', isIndented: true },
        { type: 'metric', label: 'Other Non-Current Assets', metric: 'otherNoncurrentAssets', isIndented: true },
        { type: 'header', label: 'Current Assets', isSubHeader: true },
        { type: 'metric', label: 'Current Investments', metric: 'currentInvestments', isIndented: true },
        { type: 'metric', label: 'Inventories', metric: 'inventories', isIndented: true },
        { type: 'metric', label: 'Trade Receivables', metric: 'tradeReceivables', isIndented: true },
        { type: 'metric', label: 'Cash & Bank Balances', metric: 'cashAndBankBalances', isIndented: true },
        { type: 'metric', label: 'Short Term Loans & Advances', metric: 'shortTermLoansAndAdvances', isIndented: true },
        { type: 'metric', label: 'Other Current Assets', metric: 'otherCurrentAssets', isIndented: true },
        { type: 'metric', label: 'Total Assets', metric: 'totalAssets', isTotal: true },
        { type: 'header', label: 'Liabilities' },
        { type: 'header', label: "Shareholders' Funds", isSubHeader: true },
        { type: 'metric', label: 'Share Capital', metric: 'shareCapital', isIndented: true },
        { type: 'metric', label: 'Reserves & Surplus', metric: 'reservesAndSurplus', isIndented: true },
        { type: 'header', label: 'Non-Current Liabilities', isSubHeader: true },
        { type: 'metric', label: 'Long Term Borrowings', metric: 'longTermBorrowings', isIndented: true },
        { type: 'metric', label: 'Other Long Term Liabilities', metric: 'otherLongTermLiabilities', isIndented: true },
        { type: 'metric', label: 'Long Term Provisions', metric: 'longTermProvisions', isIndented: true },
        { type: 'header', label: 'Current Liabilities', isSubHeader: true },
        { type: 'metric', label: 'Short Term Borrowings', metric: 'shortTermBorrowings', isIndented: true },
        { type: 'metric', label: 'Trade Payables', metric: 'tradePayables', isIndented: true },
        { type: 'metric', label: 'Other Current Liabilities', metric: 'otherCurrentLiabilities', isIndented: true },
        { type: 'metric', label: 'Short Term Provisions', metric: 'shortTermProvisions', isIndented: true },
        { type: 'metric', label: 'Total Liabilities', metric: 'totalLiabilities', isTotal: true },
      ];
    }
    return [
      { type: 'header', label: 'Cash Flow from Operating Activities' },
      { type: 'metric', label: 'Profit Before Tax', metric: 'profitBeforeTax', isIndented: true },
      { type: 'metric', label: 'Adjustments for Finance Cost & Depreciation', metric: 'financeCostAndDepreciation', isIndented: true },
      { type: 'metric', label: 'Adjustments for Current & Non-Current Assets', metric: 'currentAndNonCurrentAssets', isIndented: true },
      { type: 'metric', label: 'Adjustments for Current & Non-Current Liabilities', metric: 'currentAndNonCurrentLiabilities', isIndented: true },
      { type: 'metric', label: 'Other Adjustments', metric: 'otherOperatingAdjustments', isIndented: true },
      { type: 'metric', label: 'Cash Generated from Operations', metric: 'cashFlowFromOperatingActivities', isTotal: true },
      { type: 'header', label: 'Cash Flow from Investing Activities' },
      { type: 'metric', label: 'Purchase of Assets', metric: 'purchaseOfAssets', isIndented: true },
      { type: 'metric', label: 'Sale of Assets', metric: 'saleOfAssets', isIndented: true },
      { type: 'metric', label: 'Income from Assets', metric: 'incomeFromAssets', isIndented: true },
      { type: 'metric', label: 'Other Adjustments', metric: 'otherInvestingAdjustments', isIndented: true },
      { type: 'metric', label: 'Cash Used in Investing Activities', metric: 'cashFlowFromInvestingActivities', isTotal: true },
      { type: 'header', label: 'Cash Flow from Financing Activities' },
      { type: 'metric', label: 'Repayment of Capital & Borrowings', metric: 'repaymentOfCapitalAndBorrowings', isIndented: true },
      { type: 'metric', label: 'Raising Capital & Borrowings', metric: 'raisingCapitalAndBorrowings', isIndented: true },
      { type: 'metric', label: 'Interest & Dividends Paid', metric: 'interestAndDividendsPaid', isIndented: true },
      { type: 'metric', label: 'Other Adjustments', metric: 'otherFinancingAdjustments', isIndented: true },
      { type: 'metric', label: 'Cash Used in Financing Activities', metric: 'cashFlowFromFinancingActivities', isTotal: true },
      { type: 'header', label: 'Net Change in Cash & Cash Equivalents' },
      { type: 'metric', label: 'Cash & Equivalents Before Exchange Rate Changes', metric: 'cashAndCashEquivalentsBeforeExchange', isIndented: true },
      { type: 'metric', label: 'Adjustments to Cash & Cash Equivalents', metric: 'adjustmentsToCashAndEquivalents', isIndented: true },
      { type: 'metric', label: 'Net Increase/Decrease in Cash & Cash Equivalents', metric: 'cashAndCashEquivalents', isTotal: true },
      { type: 'metric', label: 'Cash & Cash Equivalents at End of Period', metric: 'cashAtEndOfPeriod', isTotal: true },
    ];
  }, [activeStatement]);

  return (
    <div className="relative min-w-0">
      <div className="pb-2">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-3 w-full justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Statement</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { value: 'income', label: 'Income Statement' },
                  { value: 'balance', label: 'Balance Sheet' },
                  { value: 'cashflow', label: 'Cash Flow Statement' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setActiveStatement(option.value as StatementType)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeStatement === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Nature</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['STANDALONE', 'CONSOLIDATED'] as NatureType[]).map((n) => (
                  <button
                    key={n}
                    onClick={() => setActiveNature(n)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeNature === n ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {n.charAt(0) + n.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap"
              title="Export CSV"
            >
              <Download className="h-4 w-4 text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Format</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { value: '₹', label: 'Raw' },
                  { value: '₹L', label: '₹ L' },
                  { value: '₹M', label: '₹ M' },
                  { value: '₹Cr', label: '₹ Cr' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setNumberFormat(option.value as NumberFormatMode)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      numberFormat === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Select Year</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {years.map((year, index) => (
                  <button
                    key={`year-filter-${year}-${index}`}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedYear === year ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Comparison</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { value: 'none', label: 'No' },
                  { value: 'prevYear', label: 'Relative to Prev Year' },
                  { value: 'relativeToPeers', label: 'Relative to Peers' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPercentageMode(option.value as PercentageDisplayMode)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      percentageMode === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2">
        {!hasDataForActiveNature ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200 my-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.02)]">
            <AlertCircle className="w-10 h-10 mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 capitalize">No {activeNature.toLowerCase()} Data Available</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">
              We couldn't find any {activeNature.toLowerCase()} financial statements for the selected comparison in {selectedYear}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full border-b">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10 py-2 min-w-[300px]">Metric</TableHead>
                  {displayCompanies.map((company, index) => {
                    const hasData = companyColumnHasData[index];
                    return (
                      <TableHead
                        key={`company-header-${company.cin || index}`}
                        className={cn('text-right py-2', !hasData && 'w-[180px] min-w-[180px] max-w-[180px] text-center')}
                      >
                        {company.display_name}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {statementRowsDefinition.map((row, rowIndex) => {
                  const totalRows = statementRowsDefinition.length;

                  if (row.type === 'header') {
                    return (
                      <TableRow key={`header-row-${rowIndex}`} className="bg-slate-50">
                        <TableCell
                          className={cn(
                            'font-semibold sticky left-0 bg-slate-50 py-1.5 text-left text-gray-900',
                            (row as any).isSubHeader && 'pl-6 text-sm text-gray-700'
                          )}
                        >
                          {row.label}
                        </TableCell>
                        {displayCompanies.map((company, companyIndex) => {
                          const hasData = companyColumnHasData[companyIndex];
                          if (!hasData) {
                            if (rowIndex === 0) {
                              return (
                                <TableCell
                                  key={`empty-col-${company.cin || companyIndex}`}
                                  rowSpan={totalRows}
                                  className="bg-slate-50/30 border-l border-r border-slate-200 text-center align-top p-0 relative w-[180px] min-w-[180px] max-w-[180px]"
                                >
                                  <div className="absolute inset-0 flex flex-col items-center justify-start pt-12 px-2">
                                    <div className="flex flex-col items-center gap-4">
                                      <div className="p-2 bg-slate-100/80 rounded-full text-slate-400">
                                        <AlertCircle className="h-5 w-5" />
                                      </div>
                                      <div
                                        className="flex flex-col items-center justify-start"
                                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                      >
                                        <span className="text-sm font-semibold text-slate-500 select-none whitespace-nowrap">
                                          {activeNature === 'CONSOLIDATED' ? 'Consolidated' : 'Standalone'} financial statements were not available for this company
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              );
                            }
                            return null;
                          }
                          return <TableCell key={`header-empty-cell-${company.cin || companyIndex}`} className="bg-slate-50 py-1.5" />;
                        })}
                      </TableRow>
                    );
                  }

                  const { label, metric, isTotal, isSubtotal, isIndented } = row as any;
                  if (!selectedYear) return null;

                  const yearIndex = years.indexOf(selectedYear);
                  const prevYear = yearIndex > 0 ? years[yearIndex - 1] : null;
                  const prevYearData = prevYear ? peerFinancials.by_year.find((y) => y.year === prevYear) : null;

                  return (
                    <TableRow key={`metric-row-${metric}-${rowIndex}`} className={cn(isTotal ? 'font-bold' : '', isSubtotal ? 'font-semibold' : '')}>
                      <TableCell className={cn('sticky left-0 bg-white z-10 py-2 min-w-[300px]', isIndented && 'pl-8')}>
                        <div className="flex items-center gap-2">
                          {renderIcon(metric!)}
                          <span className={cn('font-medium text-gray-700', (isTotal || isSubtotal) && 'font-bold text-gray-900')}>{label}</span>
                        </div>
                      </TableCell>
                      {displayCompanies.map((company, companyIndex) => {
                        const hasData = companyColumnHasData[companyIndex];
                        if (!hasData) return null;

                        let percentChange: string | null = null;
                        const companyValue = getMetricValue(company, metric!);

                        if (percentageMode === 'relativeToPeers' && company.kind !== 'current_company') {
                          const ourCompany = displayCompanies.find((c) => c.kind === 'current_company');
                          const ourValue = getMetricValue(ourCompany, metric!);
                          percentChange = calculatePercentageChange(companyValue, ourValue);
                        } else if (percentageMode === 'prevYear' && prevYearData) {
                          const prevCompany = prevYearData.companies.find((c) => c.cin === company.cin);
                          const prevValue = getMetricValue(prevCompany, metric!);
                          percentChange = calculatePercentageChange(companyValue, prevValue);
                        }

                        const cellBackgroundColor = percentChange ? getPercentageBackgroundColor(percentChange) : isTotal || isSubtotal ? 'bg-slate-50/50' : '';
                        const percentageTextColor = percentChange ? getPercentageTextColor(percentChange) : '';

                        return (
                          <TableCell key={`metric-cell-${metric}-${company.cin || companyIndex}`} className={cn('text-right py-2', cellBackgroundColor)}>
                            <div className="flex flex-col items-end justify-center h-full">
                              <div>{formatNumber(companyValue)}</div>
                              {percentageMode !== 'none' ? (
                                percentChange ? (
                                  <span className={cn('text-xs italic font-medium', percentageTextColor)}>{percentChange}</span>
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
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerFinancialAnalysisTab;
