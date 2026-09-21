// Sample metrics data for insolvency overview
// Each metric contains: id, name, type, acceptableRangeMin, acceptableRangeMax, historicalValues (5 years), formula, impactOnCompany

export interface MetricSample {
  id: string;
  name: string;
  type: string;
  icon: string;
  normalRange: {
    min: number;
    max: number;
  };
  historicalValues: number[]; // 5 years backwards
  formula: string;
  impactOnCompany: string;
  category?: string;
}

export const metricsSampleData: MetricSample[] = [
  {
    id: 'current_ratio',
    name: 'Current Ratio',
    type: 'Liquidity',
    icon: 'DollarSign',
    normalRange: {
      min: 1.2,
      max: 2.0,
    },
    historicalValues: [2.5, 3.6, 4.4, 5.7, 8.8],
    formula: 'Current Assets / Current Liabilities',
    impactOnCompany: 'A fundamental measure of the company\'s short-term financial health and ability to pay immediate obligations. A ratio below the acceptable range indicates potential liquidity issues that could lead to difficulties paying suppliers and meeting short-term debt obligations. Conversely, a ratio significantly above 2.0 might suggest inefficient use of current assets, potentially tying up capital that could be better invested in growth opportunities or returned to shareholders. Regular monitoring helps identify trends that could impact working capital management and operational efficiency.',
    category: 'decimal'
  },
  
  {
    id: 'inventory_turnover',
    name: 'Inventory Turnover',
    type: 'Efficiency',
    icon: 'Package',
    normalRange: {
      min: 4.0,
      max: 12.0,
    },
    historicalValues: [6.5, 6.8, 6.2, 6.7, 6.9],
    formula: 'Cost of Goods Sold / Average Inventory',
    impactOnCompany: 'Reflects inventory management efficiency and working capital utilization. Low turnover may indicate excess inventory, tying up capital and increasing storage costs.'
  },
  {
    id: 'receivables_turnover',
    name: 'Receivables Turnover',
    type: 'Efficiency',
    icon: 'CreditCard',
    normalRange: {
      min: 4.0,
      max: 15.0,
    },
    historicalValues: [5.2, 5.0, 4.8, 5.1, 5.3],
    formula: 'Net Credit Sales / Average Accounts Receivable',
    impactOnCompany: 'Indicates effectiveness of credit and collection policies. Low turnover suggests collection issues or lenient credit terms, impacting working capital.'
  },
  {
    id: 'operating_cycle',
    name: 'Operating Cycle',
    type: 'Efficiency',
    icon: 'RotateCcw',
    normalRange: {
      min: 30,
      max: 100,
    },
    historicalValues: [85, 88, 82, 86, 84],
    formula: 'Days Inventory Outstanding + Days Sales Outstanding',
    impactOnCompany: 'Measures time required to convert investments in inventory and receivables into cash. Longer cycles indicate higher working capital requirements.'
  },
  {
    id: 'debt_service_coverage',
    name: 'Debt Service Coverage Ratio',
    type: 'Solvency',
    icon: 'Shield',
    normalRange: {
      min: 1.25,
      max: 5.0,
    },
    historicalValues: [1.4, 1.35, 1.3, 1.45, 1.4],
    formula: 'Operating Income / Total Debt Service',
    impactOnCompany: 'Critical indicator of ability to service all debt obligations. Ratios near minimum levels suggest vulnerability to business disruptions.'
  },
  {
    id: 'fixed_charge_coverage',
    name: 'Fixed Charge Coverage Ratio',
    type: 'Solvency',
    icon: 'Lock',
    normalRange: {
      min: 1.5,
      max: 4.0,
    },
    historicalValues: [1.8, 1.7, 1.6, 1.9, 1.8],
    formula: '(EBIT + Fixed Charges) / (Fixed Charges + Interest)',
    impactOnCompany: 'Measures ability to meet fixed payment obligations including leases and preferred dividends. Low coverage indicates vulnerability to fixed cost burden.'
  },
  {
    id: 'equity_multiplier',
    name: 'Equity Multiplier',
    type: 'Leverage',
    icon: 'TrendingUp',
    normalRange: {
      min: 1.5,
      max: 3.0,
    },
    historicalValues: [2.2, 2.3, 2.1, 2.4, 2.2],
    formula: 'Total Assets / Total Equity',
    impactOnCompany: 'Indicates degree of financial leverage in asset financing. Higher multipliers suggest greater reliance on debt, amplifying both potential returns and risks.'
  },
  {
    id: 'return_on_invested_capital',
    name: 'Return on Invested Capital',
    type: 'Profitability',
    icon: 'Crosshair',
    normalRange: {
      min: 10.0,
      max: 25.0,
    },
    historicalValues: [12.5, 12.8, 12.2, 13.0, 12.7],
    formula: 'NOPAT / Invested Capital',
    impactOnCompany: 'Key measure of value creation and capital allocation efficiency. Returns below cost of capital indicate value destruction requiring strategic review.'
  },
  {
    id: 'economic_value_added',
    name: 'Economic Value Added',
    type: 'Profitability',
    icon: 'Plus',
    normalRange: {
      min: 0,
      max: 1000000,
    },
    historicalValues: [250000, 280000, 260000, 300000, 290000],
    formula: 'NOPAT - (Invested Capital × WACC)',
    impactOnCompany: 'Measures true economic profit after accounting for all capital costs. Negative EVA indicates value destruction requiring strategic review of operations and investments.'
  },
  {
    id: 'working_capital_turnover',
    name: 'Working Capital Turnover',
    type: 'Efficiency',
    icon: 'RotateCcw',
    normalRange: {
      min: 4.0,
      max: 12.0,
    },
    historicalValues: [4.5, 4.3, 4.2, 4.6, 4.4],
    formula: 'Sales / Average Working Capital',
    impactOnCompany: 'Indicates efficiency in using working capital to support sales. Low turnover suggests inefficient working capital management or over-investment in current assets.'
  },
  {
    id: 'defensive_interval',
    name: 'Defensive Interval Ratio',
    type: 'Liquidity',
    icon: 'Clock',
    normalRange: {
      min: 90,
      max: 365,
    },
    historicalValues: [110, 105, 100, 115, 108],
    formula: '(Cash + Marketable Securities + Receivables) / Daily Operating Expenses',
    impactOnCompany: 'Measures how long company can operate on liquid assets without additional funding. Short intervals indicate vulnerability to disruptions.'
  },
  {
    id: 'sustainable_growth',
    name: 'Sustainable Growth Rate',
    type: 'Growth',
    icon: 'BarChart3',
    normalRange: {
      min: 5.0,
      max: 15.0,
    },
    historicalValues: [8.5, 8.8, 8.2, 9.0, 8.7],
    formula: 'ROE × (1 - Dividend Payout Ratio)',
    impactOnCompany: 'Indicates maximum growth rate achievable without external financing. Low rates may signal limited internal growth capacity requiring strategic review.'
  },
  {
    id: 'cash_conversion',
    name: 'Cash Conversion Ratio',
    type: 'Efficiency',
    icon: 'Zap',
    normalRange: {
      min: 0.8,
      max: 1.2,
    },
    historicalValues: [0.85, 0.83, 0.82, 0.86, 0.84],
    formula: 'Operating Cash Flow / Net Income',
    impactOnCompany: 'Measures quality of earnings and cash generation efficiency. Low conversion rates may indicate earnings quality issues or working capital management problems.'
  },
  {
    id: 'market_value_added',
    name: 'Market Value Added',
    type: 'Market',
    icon: 'TrendingUp',
    normalRange: {
      min: 0,
      max: 2000000,
    },
    historicalValues: [500000, 520000, 480000, 550000, 530000],
    formula: 'Market Value - Invested Capital',
    impactOnCompany: 'Indicates market\'s assessment of management\'s value creation ability. Negative MVA suggests market skepticism about future prospects requiring strategic review.'
  },
  {
    id: 'altman_z',
    name: 'Altman Z Score',
    type: 'Solvency',
    icon: 'AlertTriangle',
    normalRange: {
      min: 2.6,
      max: 5.0,
    },
    historicalValues: [3.1, 2.9, 2.7, 2.8, 3.0],
    formula: '1.2*(Working Capital/Total Assets) + 1.4*(Retained Earnings/Total Assets) + 3.3*(EBIT/Total Assets) + 0.6*(Market Value of Equity/Total Liabilities) + 1.0*(Sales/Total Assets)',
    impactOnCompany: 'A comprehensive indicator of financial health and bankruptcy risk. Scores below 1.8 indicate high risk of financial distress within two years, requiring immediate attention to capital structure and operations. Scores between 1.8 and 2.6 suggest a gray area requiring careful monitoring and potential restructuring. Higher scores demonstrate strong financial stability, providing confidence to stakeholders and supporting favorable financing terms.'
  },
  {
    id: 'debt_equity',
    name: 'Debt to Equity Ratio',
    type: 'Leverage',
    icon: 'Calculator',
    normalRange: {
      min: 0,
      max: 1.5,
    },
    historicalValues: [1.2, 1.3, 1.1, 1.4, 1.2],
    formula: 'Total Debt / Total Equity',
    impactOnCompany: 'Measures financial leverage. High ratio signals higher risk and possible difficulty in obtaining financing.'
  },
  {
    id: 'gross_margin',
    name: 'Gross Margin',
    type: 'Profitability',
    icon: 'Percent',
    normalRange: {
      min: 30.0,
      max: 70.0,
    },
    historicalValues: [35, 33, 32, 36, 34],
    formula: '(Revenue - Cost of Goods Sold) / Revenue',
    impactOnCompany: 'Shows core profitability. Low margin may indicate pricing or cost issues.'
  },
  {
    id: 'return_on_assets',
    name: 'Return on Assets (ROA)',
    type: 'Efficiency',
    icon: 'Activity',
    normalRange: {
      min: 5.0,
      max: 20.0,
    },
    historicalValues: [7.2, 6.8, 7.0, 7.5, 7.1],
    formula: 'Net Income / Total Assets',
    impactOnCompany: 'Indicates how efficiently assets are used to generate profit.'
  },
  {
    id: 'interest_coverage',
    name: 'Interest Coverage Ratio',
    type: 'Solvency',
    icon: 'Shield',
    normalRange: {
      min: 2.0,
      max: 8.0,
    },
    historicalValues: [3.5, 3.2, 2.8, 3.0, 3.3],
    formula: 'EBIT / Interest Expense',
    impactOnCompany: 'Shows ability to pay interest on debt. Low ratio signals risk of default.'
  },
  {
    id: 'quick_ratio',
    name: 'Quick Ratio',
    type: 'Liquidity',
    icon: 'Zap',
    normalRange: {
      min: 1.0,
      max: 2.5,
    },
    historicalValues: [1.1, 1.2, 1.0, 1.3, 1.2],
    formula: '(Current Assets - Inventory) / Current Liabilities',
    impactOnCompany: 'Measures ability to meet short-term obligations without selling inventory.'
  },
  {
    id: 'operating_margin',
    name: 'Operating Margin',
    type: 'Profitability',
    icon: 'TrendingUp',
    normalRange: {
      min: 10.0,
      max: 30.0,
    },
    historicalValues: [12.5, 13.0, 12.0, 13.5, 12.8],
    formula: 'Operating Income / Revenue',
    impactOnCompany: 'Shows operational efficiency and profitability.'
  },
  {
    id: 'cash_conversion_cycle',
    name: 'Cash Conversion Cycle',
    type: 'Efficiency',
    icon: 'RotateCw',
    normalRange: {
      min: 20,
      max: 60,
    },
    historicalValues: [55, 58, 53, 57, 56],
    formula: 'Days Inventory Outstanding + Days Sales Outstanding - Days Payable Outstanding',
    impactOnCompany: 'Measures how quickly a company converts investments into cash. Shorter cycle is better.'
  },
  {
    id: 'working_capital',
    name: 'Working Capital',
    type: 'Liquidity',
    icon: 'DollarSign',
    normalRange: {
      min: 0,
      max: 1000000,
    },
    historicalValues: [250000, 260000, 240000, 255000, 265000],
    formula: 'Current Assets - Current Liabilities',
    impactOnCompany: 'Indicates available resources for day-to-day operations. Negative value signals liquidity problems.'
  },
];

export const industryMedians: Record<string, Record<string, number>> = {
  'Manufacturing': {
    current_ratio: 1.8,
    inventory_turnover: 8.2,
    receivables_turnover: 6.5,
    operating_cycle: 95,
    debt_service_coverage: 2.1,
    fixed_charge_coverage: 2.3,
    equity_multiplier: 2.8,
    return_on_invested_capital: 14.2,
    economic_value_added: 450000,
    working_capital_turnover: 5.8,
    defensive_interval: 125,
    sustainable_growth: 9.5,
    cash_conversion: 0.92,
    market_value_added: 750000,
    altman_z: 3.2,
    debt_equity: 1.3,
    gross_margin: 38.5,
    return_on_assets: 8.5,
    interest_coverage: 4.2,
    quick_ratio: 1.4,
    operating_margin: 15.2,
    cash_conversion_cycle: 75,
    working_capital: 400000
  },
  'Retail': {
    current_ratio: 1.4,
    inventory_turnover: 12.5,
    receivables_turnover: 8.8,
    operating_cycle: 65,
    debt_service_coverage: 1.8,
    fixed_charge_coverage: 2.0,
    equity_multiplier: 2.2,
    return_on_invested_capital: 11.8,
    economic_value_added: 320000,
    working_capital_turnover: 7.2,
    defensive_interval: 95,
    sustainable_growth: 7.8,
    cash_conversion: 0.88,
    market_value_added: 520000,
    altman_z: 2.9,
    debt_equity: 1.1,
    gross_margin: 42.0,
    return_on_assets: 6.8,
    interest_coverage: 3.5,
    quick_ratio: 1.2,
    operating_margin: 12.5,
    cash_conversion_cycle: 45,
    working_capital: 280000
  },
  'Technology': {
    current_ratio: 2.2,
    inventory_turnover: 15.8,
    receivables_turnover: 12.2,
    operating_cycle: 45,
    debt_service_coverage: 3.2,
    fixed_charge_coverage: 3.8,
    equity_multiplier: 1.8,
    return_on_invested_capital: 18.5,
    economic_value_added: 680000,
    working_capital_turnover: 9.5,
    defensive_interval: 180,
    sustainable_growth: 12.5,
    cash_conversion: 0.95,
    market_value_added: 1200000,
    altman_z: 3.8,
    debt_equity: 0.8,
    gross_margin: 65.0,
    return_on_assets: 12.5,
    interest_coverage: 6.8,
    quick_ratio: 1.8,
    operating_margin: 22.5,
    cash_conversion_cycle: 30,
    working_capital: 550000
  }
};

