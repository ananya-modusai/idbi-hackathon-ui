import { VisualizationData } from "@/components/custom/visualization/types";
import { lineChartData, barChartData } from "./sampleDashboardData";
import { sampleStatsData, sampleStatsConfig } from "./sampleStatsData";

// Visualization data structure
export interface Visualization {
  visualization_id: string;
  dashboard_id: string;
  title: string;
  description: string;
  data: VisualizationData[];
  type: "combo" | "stats";
  xAxisKey: string | string[];
  yAxisKeys: {
    key: string;
    color: string;
    label?: string;
    type: "bar" | "line";
    yAxisId?: "left" | "right";
    size?: "big" | "medium" | "small";
    icon?: string;
    rowId?: string;
  }[];
  className: string;
  statSize?: "big" | "medium" | "small";
  statColumns?: number;
  leftYAxisLabel?: string;
  rightYAxisLabel?: string;
  stacking?: string;
}

// Dashboard data structure
export interface Dashboard {
  dashboard_id: string;
  title: string;
  description: string;
  visualizationIds: string[];
  user: string;
}

// Sample stats dashboard data
export const statsData: VisualizationData[] = [
  {
    name: "Current Stats",
    revenue: 1245870,
    profit: 328650,
    customers: 12763,
    conversion: 4.8,
    churn: 2.1,
    growth: 15.7,
    avgOrderValue: 97.6,
    newUsers: 487,
    activeUsers: 8429,
    retention: 76.3,
    satisfaction: 8.9
  }
];

// Monthly comparison data for combo chart
export const monthlyComparisonData: VisualizationData[] = [
  { name: "Jan", month: "Jan", revenue: 423000, growth: 5.2 },
  { name: "Feb", month: "Feb", revenue: 445000, growth: 5.5 },
  { name: "Mar", month: "Mar", revenue: 518000, growth: 7.3 },
  { name: "Apr", month: "Apr", revenue: 590000, growth: 9.8 },
  { name: "May", month: "May", revenue: 610000, growth: 12.5 },
  { name: "Jun", month: "Jun", revenue: 658000, growth: 14.2 },
];

// Sample visualizations
export const visualizations: Record<string, Visualization> = {
  "viz-001": {
    visualization_id: "viz-001",
    dashboard_id: "dash-001",
    title: "User Activity Over Time",
    description: "Monthly user counts and sessions",
    data: lineChartData,
    type: "combo",
    xAxisKey: "month",
    yAxisKeys: [
      { key: "users", color: "#8884d8", type: "line", yAxisId: "left" },
      { key: "sessions", color: "#82ca9d", type: "line", yAxisId: "right" },
    ],
    className: "w-full",
    leftYAxisLabel: "Users",
    rightYAxisLabel: "Sessions"
  },
  "viz-002": {
    visualization_id: "viz-002",
    dashboard_id: "dash-001",
    title: "Category Distribution",
    description: "Values by category",
    data: barChartData,
    type: "combo",
    xAxisKey: "category",
    yAxisKeys: [
      { key: "value", color: "#8884d8", type: "bar", yAxisId: "left" },
    ],
    className: "w-full",
    leftYAxisLabel: "Value"
  },
  "viz-003": {
    visualization_id: "viz-003",
    dashboard_id: "dash-003",
    title: "Conversion Rates by Channel",
    description: "Conversion percentages across marketing channels",
    data: [
      { name: "Social Media", channel: "Social Media", rate: 3.2, target: 3.5 },
      { name: "Email", channel: "Email", rate: 5.7, target: 5.0 },
      { name: "Organic Search", channel: "Organic Search", rate: 4.1, target: 4.0 },
      { name: "Paid Search", channel: "Paid Search", rate: 2.8, target: 3.0 },
      { name: "Direct", channel: "Direct", rate: 6.3, target: 6.0 }
    ],
    type: "combo",
    xAxisKey: "channel",
    yAxisKeys: [
      { key: "rate", color: "#ff7300", type: "bar", yAxisId: "left" },
      { key: "target", color: "#82ca9d", type: "line", yAxisId: "right" }
    ],
    className: "w-full",
    leftYAxisLabel: "Rate (%)",
    rightYAxisLabel: "Target (%)"
  },
  "viz-004": {
    visualization_id: "viz-004",
    dashboard_id: "dash-003",
    title: "Revenue Growth Trends",
    description: "Quarterly revenue over the past year",
    data: [
      { name: "Q1", quarter: "Q1", revenue: 125000, target: 120000, growth: 4.2 },
      { name: "Q2", quarter: "Q2", revenue: 165000, target: 150000, growth: 5.5 },
      { name: "Q3", quarter: "Q3", revenue: 190000, target: 180000, growth: 6.8 },
      { name: "Q4", quarter: "Q4", revenue: 220000, target: 210000, growth: 7.2 }
    ],
    type: "combo",
    xAxisKey: "quarter",
    yAxisKeys: [
      { key: "revenue", color: "#82ca9d", type: "bar", yAxisId: "left" },
      { key: "target", color: "#ffc658", type: "line", yAxisId: "left" },
      { key: "growth", color: "#ff7300", type: "line", yAxisId: "right" }
    ],
    className: "w-full",
    leftYAxisLabel: "Amount ($)",
    rightYAxisLabel: "Growth (%)"
  },
  "viz-005": {
    visualization_id: "viz-005",
    dashboard_id: "dash-003",
    title: "Customer Satisfaction Scores",
    description: "Average satisfaction ratings by department",
    data: [
      { name: "Support", department: "Support", score: 8.7, target: 8.5, trend: 8.2 },
      { name: "Sales", department: "Sales", score: 7.9, target: 8.0, trend: 7.5 },
      { name: "Product", department: "Product", score: 8.3, target: 8.5, trend: 8.0 },
      { name: "Billing", department: "Billing", score: 7.5, target: 7.8, trend: 7.2 },
      { name: "Training", department: "Training", score: 8.8, target: 8.5, trend: 8.5 }
    ],
    type: "combo",
    xAxisKey: "department",
    yAxisKeys: [
      { key: "score", color: "#8884d8", type: "bar", yAxisId: "left" },
      { key: "target", color: "#82ca9d", type: "line", yAxisId: "left" },
      { key: "trend", color: "#ff7300", type: "line", yAxisId: "right" }
    ],
    className: "w-full",
    leftYAxisLabel: "Score",
    rightYAxisLabel: "Trend"
  },
  "viz-007": {
    visualization_id: "viz-007",
    dashboard_id: "dash-003",
    title: "Transaction Analysis by Date and City",
    description: "Combo graph with transaction sum (bar), transaction count (line), and XYZ values",
    data: [
      { date: "2024-01-15", city: "New York", transactions: 125000, transactionCount: 450, xyz: 85000 },
      { date: "2024-01-15", city: "New York", transactions: 130000, transactionCount: 420, xyz: 88000 },
      { date: "2024-01-16", city: "New York", transactions: 135000, transactionCount: 520, xyz: 92000 },
      { date: "2024-01-17", city: "New York", transactions: 142000, transactionCount: 485, xyz: 88000 },
      { date: "2024-01-15", city: "Los Angeles", transactions: 98000, transactionCount: 380, xyz: 72000 },
      { date: "2024-01-16", city: "Los Angeles", transactions: 105000, transactionCount: 420, xyz: 78000 },
      { date: "2024-01-17", city: "Los Angeles", transactions: 112000, transactionCount: 395, xyz: 81000 },
      { date: "2024-01-15", city: "Chicago", transactions: 87000, transactionCount: 320, xyz: 65000 },
      { date: "2024-01-16", city: "Chicago", transactions: 94000, transactionCount: 365, xyz: 70000 },
      { date: "2024-01-17", city: "Chicago", transactions: 89000, transactionCount: 340, xyz: 68000 },
      { date: "2024-01-18", city: "New York", transactions: 148000, transactionCount: 510, xyz: 95000 },
      { date: "2024-01-18", city: "Los Angeles", transactions: 118000, transactionCount: 410, xyz: 85000 },
      { date: "2024-01-18", city: "Chicago", transactions: 92000, transactionCount: 355, xyz: 71000 }
    ],
    type: "combo",
    xAxisKey: ["date", "city"], // Array of fields to combine for X-axis
    yAxisKeys: [
      {
        key: "transactions",
        color: "#4f46e5",
        label: "Transaction Sum",
        type: "bar",
        yAxisId: "left"
      },
      {
        key: "transactionCount",
        color: "#ef4444",
        label: "Transaction Count",
        type: "line",
        yAxisId: "right"
      },
      {
        key: "xyz",
        color: "#10b981",
        label: "XYZ Values",
        type: "bar",
        yAxisId: "left"
      }
    ],
    className: "w-full",
    leftYAxisLabel: "Amount ($)",
    rightYAxisLabel: "Count"
  },
  "viz-006": {
    visualization_id: "viz-006",
    dashboard_id: "dash-004",
    title: "System Uptime Performance",
    description: "Daily uptime percentage over last 30 days",
    data: [
      { name: "Week 1", week: "Week 1", uptime: 99.98, target: 99.95, incidents: 1 },
      { name: "Week 2", week: "Week 2", uptime: 99.95, target: 99.95, incidents: 2 },
      { name: "Week 3", week: "Week 3", uptime: 99.99, target: 99.95, incidents: 0 },
      { name: "Week 4", week: "Week 4", uptime: 100.00, target: 99.95, incidents: 0 }
    ],
    type: "combo",
    xAxisKey: "week",
    yAxisKeys: [
      { key: "uptime", color: "#0088FE", type: "line", yAxisId: "left" },
      { key: "target", color: "#82ca9d", type: "line", yAxisId: "left" },
      { key: "incidents", color: "#ff7300", type: "bar", yAxisId: "right" }
    ],
    className: "w-full",
    leftYAxisLabel: "Uptime (%)",
    rightYAxisLabel: "Incidents"
  },

  // Stats dashboard visualizations
  "viz-stats-demo": {
    visualization_id: "viz-stats-demo",
    dashboard_id: "dash-stats",
    title: "Stats Visualization Demo",
    description: "Mixed-size stats visualization with custom grid layout",
    data: sampleStatsData,
    type: "stats",
    xAxisKey: "name",
    yAxisKeys: sampleStatsConfig.yAxisKeys,
    className: "w-full"
  },

  // Stacked visualization demo
  "viz-stacked-demo": {
    visualization_id: "viz-stacked-demo",
    dashboard_id: "dash-stacked",
    title: "Stacked Transaction Summary by Date, City and Mode",
    description: "Stacked bars showing transaction amounts by mode with count lines",
    data: [
      { date: "2024-01-15", city: "New York", cardTransactions: 4200, cashTransactions: 5800, cardCount: 3.2, cashCount: 4.1 },
      { date: "2024-01-15", city: "Chicago", cardTransactions: 3100, cashTransactions: 4200, cardCount: 2.8, cashCount: 3.5 },
      { date: "2024-01-16", city: "New York", cardTransactions: 3800, cashTransactions: 5100, cardCount: 3.5, cashCount: 4.3 },
      { date: "2024-01-16", city: "Chicago", cardTransactions: 2900, cashTransactions: 3900, cardCount: 2.6, cashCount: 3.2 },
      { date: "2024-01-17", city: "New York", cardTransactions: 4500, cashTransactions: 6200, cardCount: 3.8, cashCount: 4.6 },
      { date: "2024-01-17", city: "Chicago", cardTransactions: 3300, cashTransactions: 4500, cardCount: 3.0, cashCount: 3.8 },
      { date: "2024-01-18", city: "New York", cardTransactions: 4100, cashTransactions: 5500, cardCount: 3.4, cashCount: 4.2 }
    ],
    type: "combo",
    xAxisKey: ["date", "city"], // Combined X-axis grouping
    yAxisKeys: [
      {
        key: "cardTransactions",
        color: "#f59e0b", // Card transactions - yellow/orange
        label: "Card",
        type: "bar",
        yAxisId: "left"
      },
      {
        key: "cashTransactions",
        color: "#ef4444", // Cash transactions - red/orange
        label: "Cash",
        type: "bar",
        yAxisId: "left"
      },
      {
        key: "cardCount",
        color: "#06b6d4", // Card count line - blue
        label: "Card Count",
        type: "line",
        yAxisId: "right"
      },
      {
        key: "cashCount",
        color: "#10b981", // Cash count line - green
        label: "Cash Count",
        type: "line",
        yAxisId: "right"
      }
    ],
    className: "w-full",
    leftYAxisLabel: "Sum of Transactions",
    rightYAxisLabel: "Count of Transactions",
    stacking: "normal" // This will make the bars stack
  }
};

// Sample dashboards
export const dashboards: Record<string, Dashboard> = {
  // System Dashboards
  "dash-system-001": {
    dashboard_id: "dash-system-001",
    title: "System Overview",
    description: "Core system metrics and performance indicators",
    visualizationIds: ["viz-006"],
    user: "System"
  },
  "dash-system-002": {
    dashboard_id: "dash-system-002",
    title: "Resource Monitor",
    description: "CPU, memory, and disk usage statistics",
    visualizationIds: ["viz-001"],
    user: "System"
  },
  "dash-system-003": {
    dashboard_id: "dash-system-003",
    title: "Security Dashboard",
    description: "Security metrics and threat detection",
    visualizationIds: ["viz-002"],
    user: "System"
  },

  // Custom Dashboards
  "dash-001": {
    dashboard_id: "dash-001",
    title: "Main Analytics Dashboard",
    description: "Overview of key metrics and user activity",
    visualizationIds: ["viz-001", "viz-002"],
    user: "john.doe@example.com"
  },
  "dash-002": {
    dashboard_id: "dash-002",
    title: "Performance Dashboard",
    description: "Detailed performance metrics",
    visualizationIds: ["viz-001"],
    user: "sarah.smith@example.com"
  },
  "dash-003": {
    dashboard_id: "dash-003",
    title: "Business Intelligence Dashboard",
    description: "Key business metrics and customer insights",
    visualizationIds: ["viz-003", "viz-004", "viz-005", "viz-007"],
    user: "alex.wong@example.com"
  },
  "dash-004": {
    dashboard_id: "dash-004",
    title: "Operations Overview",
    description: "System performance and health metrics",
    visualizationIds: ["viz-006"],
    user: "emily.chen@example.com"
  },
  "dash-stats": {
    dashboard_id: "dash-stats",
    title: "Stats Visualization Demo",
    description: "Showcasing the new stats visualization type",
    visualizationIds: ["viz-stats-demo"],
    user: "david.johnson@example.com"
  },
  "dash-stacked": {
    dashboard_id: "dash-stacked",
    title: "Stacked Visualization Demo",
    description: "Showcasing the new stacked visualization type with combo charts",
    visualizationIds: ["viz-stacked-demo"],
    user: "sarah.wilson@example.com"
  }
};

// Current dashboard ID for initial load
export const currentDashboardId = "dash-stats";