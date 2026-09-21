import { VisualizationData, VisualizationSeries, StatSize } from "@/components/custom/visualization/types";

// Sample manufacturing data for insolvency overview
export const manufacturingStatsData: VisualizationData[] = [
  {
    name: "Current Stats",
    // First row: Production metrics
    productionEfficiency: 87.5,    // Production efficiency percentage
    defectRate: 2.3,              // Defect rate percentage
    machineUtilization: 92.1,     // Machine utilization percentage
    qualityScore: 94.8,           // Quality score out of 100
    
    // Second row: Financial metrics
    inventoryTurnover: 4.2,       // Inventory turnover ratio
    costPerUnit: 156.8,           // Cost per unit in currency
    wastePercentage: 3.7,         // Waste percentage
    energyEfficiency: 88.4,        // Energy efficiency score
  }
];

// Configuration for the stats visualization
export const manufacturingStatsConfig = {
  type: "stats" as const,
  xAxisKey: "name",
  yAxisKeys: [
    // First row: Production metrics
    { 
      key: "productionEfficiency", 
      color: "#4CAF50", 
      label: "Production Efficiency (%)", 
      size: "small" as StatSize, 
      icon: "Activity" 
    },
    { 
      key: "defectRate", 
      color: "#F44336", 
      label: "Defect Rate (%)", 
      size: "small" as StatSize, 
      icon: "AlertTriangle" 
    },
    { 
      key: "machineUtilization", 
      color: "#2196F3", 
      label: "Machine Utilization (%)", 
      size: "small" as StatSize, 
      icon: "Settings" 
    },
    { 
      key: "qualityScore", 
      color: "#9C27B0", 
      label: "Quality Score", 
      size: "small" as StatSize, 
      icon: "Award" 
    },
    
    // Second row: Financial metrics
    { 
      key: "inventoryTurnover", 
      color: "#FF9800", 
      label: "Inventory Turnover", 
      size: "small" as StatSize, 
      icon: "RefreshCw" 
    },
    { 
      key: "costPerUnit", 
      color: "#795548", 
      label: "Cost per Unit (₹)", 
      size: "small" as StatSize, 
      icon: "DollarSign" 
    },
    { 
      key: "wastePercentage", 
      color: "#607D8B", 
      label: "Waste (%)", 
      size: "small" as StatSize, 
      icon: "Trash2" 
    },
    { 
      key: "energyEfficiency", 
      color: "#00BCD4", 
      label: "Energy Efficiency (%)", 
      size: "small" as StatSize, 
      icon: "Zap" 
    }
  ] as VisualizationSeries[]
};

// Mock data for monthly metrics
export const monthlyMetricsData: VisualizationData[] = [
  { 
    name: "Jan 2024",
    transactionCount: 1250,
    transactionAmount: 450000,
    chargebackCount: 45,
    chargebackAmount: 18000,
    balanceCount: 850,
    balanceAmount: 320000
  },
  { 
    name: "Feb 2024",
    transactionCount: 1380,
    transactionAmount: 495000,
    chargebackCount: 38,
    chargebackAmount: 15200,
    balanceCount: 920,
    balanceAmount: 345000
  },
  { 
    name: "Mar 2024",
    transactionCount: 1520,
    transactionAmount: 540000,
    chargebackCount: 42,
    chargebackAmount: 16800,
    balanceCount: 980,
    balanceAmount: 360000
  },
  { 
    name: "Apr 2024",
    transactionCount: 1450,
    transactionAmount: 520000,
    chargebackCount: 35,
    chargebackAmount: 14000,
    balanceCount: 950,
    balanceAmount: 350000
  },
  { 
    name: "May 2024",
    transactionCount: 1600,
    transactionAmount: 580000,
    chargebackCount: 48,
    chargebackAmount: 19200,
    balanceCount: 1050,
    balanceAmount: 380000
  },
  { 
    name: "Jun 2024",
    transactionCount: 1680,
    transactionAmount: 600000,
    chargebackCount: 52,
    chargebackAmount: 20800,
    balanceCount: 1100,
    balanceAmount: 400000
  }
];

// Configuration for transactions visualization
export const transactionsConfig = {
  type: "combo" as const,
  xAxisKey: "name",
  yAxisKeys: [
    { 
      key: "transactionCount", 
      color: "#4CAF50", 
      label: "Transaction Count", 
      type: "bar" as const,
      yAxisId: "left"
    },
    { 
      key: "transactionAmount", 
      color: "#2196F3", 
      label: "Transaction Amount (₹)", 
      type: "line" as const,
      yAxisId: "right"
    }
  ] as VisualizationSeries[],
  leftYAxisLabel: "Count",
  rightYAxisLabel: "Amount (₹)"
};

// Configuration for chargebacks visualization
export const chargebacksConfig = {
  type: "combo" as const,
  xAxisKey: "name",
  yAxisKeys: [
    { 
      key: "chargebackCount", 
      color: "#F44336", 
      label: "Chargeback Count", 
      type: "bar" as const,
      yAxisId: "left"
    },
    { 
      key: "chargebackAmount", 
      color: "#FF9800", 
      label: "Chargeback Amount (₹)", 
      type: "line" as const,
      yAxisId: "right"
    }
  ] as VisualizationSeries[],
  leftYAxisLabel: "Count",
  rightYAxisLabel: "Amount (₹)"
};

// Configuration for balance visualization
export const balanceConfig = {
  type: "combo" as const,
  xAxisKey: "name",
  yAxisKeys: [
    { 
      key: "balanceCount", 
      color: "#9C27B0", 
      label: "Balance Count", 
      type: "bar" as const,
      yAxisId: "left"
    },
    { 
      key: "balanceAmount", 
      color: "#00BCD4", 
      label: "Balance Amount (₹)", 
      type: "line" as const,
      yAxisId: "right"
    }
  ] as VisualizationSeries[],
  leftYAxisLabel: "Count",
  rightYAxisLabel: "Amount (₹)"
};

// Financial stats data for insolvency overview
export const financialStatsData: VisualizationData[] = [
  {
    name: "Current Stats",
    // Key financial metrics
    revenue: 2500000,           // Monthly revenue
    profitMargin: 15.8,         // Profit margin percentage
    operatingExpenses: 850000,  // Monthly operating expenses
    cashFlow: 420000,           // Monthly cash flow
    debtToEquity: 1.8,          // Debt to equity ratio
    currentRatio: 2.1,          // Current ratio
    returnOnAssets: 8.5,        // Return on assets percentage
    workingCapital: 950000      // Working capital
  }
];

// Configuration for the financial stats visualization
export const financialStatsConfig = {
  type: "stats" as const,
  xAxisKey: "name",
  yAxisKeys: [
    { 
      key: "revenue", 
      color: "#4CAF50", 
      label: "Monthly Revenue (₹)", 
      size: "small" as StatSize, 
      icon: "TrendingUp" 
    },
    { 
      key: "profitMargin", 
      color: "#2196F3", 
      label: "Profit Margin (%)", 
      size: "small" as StatSize, 
      icon: "Percent" 
    },
    { 
      key: "operatingExpenses", 
      color: "#F44336", 
      label: "Operating Expenses (₹)", 
      size: "small" as StatSize, 
      icon: "Wallet" 
    },
    { 
      key: "cashFlow", 
      color: "#9C27B0", 
      label: "Cash Flow (₹)", 
      size: "small" as StatSize, 
      icon: "DollarSign" 
    },
    { 
      key: "debtToEquity", 
      color: "#FF9800", 
      label: "Debt to Equity", 
      size: "small" as StatSize, 
      icon: "Scale" 
    },
    { 
      key: "currentRatio", 
      color: "#795548", 
      label: "Current Ratio", 
      size: "small" as StatSize, 
      icon: "Activity" 
    },
    { 
      key: "returnOnAssets", 
      color: "#607D8B", 
      label: "ROA (%)", 
      size: "small" as StatSize, 
      icon: "TrendingUp" 
    },
    { 
      key: "workingCapital", 
      color: "#00BCD4", 
      label: "Working Capital (₹)", 
      size: "small" as StatSize, 
      icon: "DollarSign" 
    }
  ] as VisualizationSeries[]
};

// 5-year historical data for financial trends
export const historicalFinancialData: VisualizationData[] = [
  { 
    name: "2019",
    year: "2019",
    revenue: 18500000,
    profit: 2750000,
    cashFlow: 3200000
  },
  { 
    name: "2020",
    year: "2020",
    revenue: 17200000,  // Dip due to pandemic
    profit: 2450000,    // Lower profit due to reduced revenue
    cashFlow: 2800000   // Reduced cash flow
  },
  { 
    name: "2021",
    year: "2021",
    revenue: 21500000,  // Recovery and growth
    profit: 3100000,    // Improved profit margin
    cashFlow: 3600000   // Better cash flow
  },
  { 
    name: "2022",
    year: "2022",
    revenue: 22800000,  // Continued growth
    profit: 2950000,    // Slight dip in profit due to inflation
    cashFlow: 3400000   // Cash flow affected by market conditions
  },
  { 
    name: "2023",
    year: "2023",
    revenue: 25000000,  // Strong growth
    profit: 3750000,    // Improved profitability
    cashFlow: 4200000   // Strong cash flow
  },
  { 
    name: "2024",
    year: "2024",
    revenue: 27000000,  // Continued growth
    profit: 4050000,    // Maintaining profit growth
    cashFlow: 4500000   // Sustained cash flow
  }
];

// Configuration for revenue trend visualization
export const revenueTrendConfig = {
  type: "combo" as const,
  xAxisKey: "year",
  xAxisLabel: "Year",
  yAxisKeys: [
    { 
      key: "revenue", 
      color: "#4CAF50", 
      label: "Annual Revenue (₹)", 
      type: "line" as const
    }
  ] as VisualizationSeries[],
  leftYAxisLabel: "Revenue (₹)",
  showGridlines: false,
  showXAxisLabel: true,
  showYAxisLabel: true,
  showXTicks: true,
  showYTicks: false
};

// Configuration for profit trend visualization
export const profitTrendConfig = {
  type: "combo" as const,
  xAxisKey: "year",
  xAxisLabel: "Year",
  yAxisKeys: [
    { 
      key: "profit", 
      color: "#2196F3", 
      label: "Annual Profit (₹)", 
      type: "line" as const
    }
  ] as VisualizationSeries[],
  leftYAxisLabel: "Profit (₹)",
  showGridlines: false,
  showXAxisLabel: true,
  showYAxisLabel: true,
  showXTicks: true,
  showYTicks: false
};

// Configuration for cash flow trend visualization
export const cashFlowTrendConfig = {
  type: "combo" as const,
  xAxisKey: "year",
  xAxisLabel: "Year",
  yAxisKeys: [
    { 
      key: "cashFlow", 
      color: "#9C27B0", 
      label: "Cash Flow from Operations (₹)", 
      type: "line" as const
    }
  ] as VisualizationSeries[],
  leftYAxisLabel: "Cash Flow (₹)",
  showGridlines: false,
  showXAxisLabel: true,
  showYAxisLabel: true,
  showXTicks: true,
  showYTicks: false
};

// Income Statement data for 6 years
export const incomeStatementData: VisualizationData[] = [
  {
    name: "2019",
    // Revenue section
    revenue: 18500000,
    costOfSales: 9250000,
    grossProfit: 9250000,
    
    // Operating expenses
    researchAndDevelopment: 1850000,
    salesAndMarketing: 2775000,
    generalAndAdmin: 1480000,
    totalOperatingExpenses: 6105000,
    
    // Income and taxes
    operatingIncome: 3145000,
    interestExpense: 370000,
    otherIncome: 55000,
    incomeTaxes: 705000,
    netIncome: 2125000,
    
    // Calculated metrics
    grossMargin: 50.0,
    operatingMargin: 17.0,
    netMargin: 11.5,
    
    // Per share data
    sharesOutstanding: 5000000,
    earningsPerShare: 0.43
  },
  {
    name: "2020",
    // Revenue section
    revenue: 17200000,
    costOfSales: 8772000,
    grossProfit: 8428000,
    
    // Operating expenses
    researchAndDevelopment: 1720000,
    salesAndMarketing: 2408000,
    generalAndAdmin: 1376000,
    totalOperatingExpenses: 5504000,
    
    // Income and taxes
    operatingIncome: 2924000,
    interestExpense: 430000,
    otherIncome: 40000,
    incomeTaxes: 633500,
    netIncome: 1900500,
    
    // Calculated metrics
    grossMargin: 49.0,
    operatingMargin: 17.0,
    netMargin: 11.0,
    
    // Per share data
    sharesOutstanding: 5050000,
    earningsPerShare: 0.38
  },
  {
    name: "2021",
    // Revenue section
    revenue: 21500000,
    costOfSales: 10750000,
    grossProfit: 10750000,
    
    // Operating expenses
    researchAndDevelopment: 2150000,
    salesAndMarketing: 3225000,
    generalAndAdmin: 1612500,
    totalOperatingExpenses: 6987500,
    
    // Income and taxes
    operatingIncome: 3762500,
    interestExpense: 410000,
    otherIncome: 75000,
    incomeTaxes: 857625,
    netIncome: 2569875,
    
    // Calculated metrics
    grossMargin: 50.0,
    operatingMargin: 17.5,
    netMargin: 12.0,
    
    // Per share data
    sharesOutstanding: 5100000,
    earningsPerShare: 0.50
  },
  {
    name: "2022",
    // Revenue section
    revenue: 22800000,
    costOfSales: 11856000,
    grossProfit: 10944000,
    
    // Operating expenses
    researchAndDevelopment: 2508000,
    salesAndMarketing: 3420000,
    generalAndAdmin: 1710000,
    totalOperatingExpenses: 7638000,
    
    // Income and taxes
    operatingIncome: 3306000,
    interestExpense: 456000,
    otherIncome: 68000,
    incomeTaxes: 729500,
    netIncome: 2188500,
    
    // Calculated metrics
    grossMargin: 48.0,
    operatingMargin: 14.5,
    netMargin: 9.6,
    
    // Per share data
    sharesOutstanding: 5150000,
    earningsPerShare: 0.43
  },
  {
    name: "2023",
    // Revenue section
    revenue: 25000000,
    costOfSales: 12500000,
    grossProfit: 12500000,
    
    // Operating expenses
    researchAndDevelopment: 2750000,
    salesAndMarketing: 3750000,
    generalAndAdmin: 1875000,
    totalOperatingExpenses: 8375000,
    
    // Income and taxes
    operatingIncome: 4125000,
    interestExpense: 500000,
    otherIncome: 125000,
    incomeTaxes: 937500,
    netIncome: 2812500,
    
    // Calculated metrics
    grossMargin: 50.0,
    operatingMargin: 16.5,
    netMargin: 11.25,
    
    // Per share data
    sharesOutstanding: 5200000,
    earningsPerShare: 0.54
  },
  {
    name: "2024",
    // Revenue section
    revenue: 27000000,
    costOfSales: 13500000,
    grossProfit: 13500000,
    
    // Operating expenses
    researchAndDevelopment: 2970000,
    salesAndMarketing: 4050000,
    generalAndAdmin: 2025000,
    totalOperatingExpenses: 9045000,
    
    // Income and taxes
    operatingIncome: 4455000,
    interestExpense: 540000,
    otherIncome: 135000,
    incomeTaxes: 1012500,
    netIncome: 3037500,
    
    // Calculated metrics
    grossMargin: 50.0,
    operatingMargin: 16.5,
    netMargin: 11.25,
    
    // Per share data
    sharesOutstanding: 5250000,
    earningsPerShare: 0.58
  }
];

// Income statement configuration for visualization
export const incomeStatementConfig = {
  type: "stats" as const,
  xAxisKey: "name",
  yAxisKeys: [
    // Revenue section
    { key: "revenue", color: "#4CAF50", label: "Revenue", size: "small" as StatSize, icon: "TrendingUp" },
    { key: "costOfSales", color: "#F44336", label: "Cost of Sales", size: "small" as StatSize, icon: "ArrowDown" },
    { key: "grossProfit", color: "#2196F3", label: "Gross Profit", size: "small" as StatSize, icon: "TrendingUp" },
    
    // Operating expenses
    { key: "researchAndDevelopment", color: "#9C27B0", label: "R&D", size: "small" as StatSize, icon: "Search" },
    { key: "salesAndMarketing", color: "#FF9800", label: "Sales & Marketing", size: "small" as StatSize, icon: "Users" },
    { key: "generalAndAdmin", color: "#607D8B", label: "G&A", size: "small" as StatSize, icon: "ClipboardList" },
    { key: "totalOperatingExpenses", color: "#F44336", label: "Total Operating Expenses", size: "small" as StatSize, icon: "DollarSign" },
    
    // Income and taxes
    { key: "operatingIncome", color: "#4CAF50", label: "Operating Income", size: "small" as StatSize, icon: "TrendingUp" },
    { key: "interestExpense", color: "#F44336", label: "Interest Expense", size: "small" as StatSize, icon: "ArrowDown" },
    { key: "otherIncome", color: "#4CAF50", label: "Other Income", size: "small" as StatSize, icon: "Plus" },
    { key: "incomeTaxes", color: "#F44336", label: "Income Taxes", size: "small" as StatSize, icon: "FileText" },
    { key: "netIncome", color: "#4CAF50", label: "Net Income", size: "small" as StatSize, icon: "DollarSign" },
    
    // Calculated metrics
    { key: "grossMargin", color: "#2196F3", label: "Gross Margin (%)", size: "small" as StatSize, icon: "Percent" },
    { key: "operatingMargin", color: "#2196F3", label: "Operating Margin (%)", size: "small" as StatSize, icon: "Percent" },
    { key: "netMargin", color: "#2196F3", label: "Net Margin (%)", size: "small" as StatSize, icon: "Percent" },
    
    // Per share data
    { key: "sharesOutstanding", color: "#9E9E9E", label: "Shares Outstanding", size: "small" as StatSize, icon: "Hash" },
    { key: "earningsPerShare", color: "#2196F3", label: "EPS", size: "small" as StatSize, icon: "DollarSign" }
  ] as VisualizationSeries[]
};
