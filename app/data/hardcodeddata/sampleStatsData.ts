import { VisualizationData } from "@/components/custom/visualization/types";

// Sample data for stats visualization
export const sampleStatsData: VisualizationData[] = [
  {
    name: "Sample Stats",
    revenue: 1245870,
    profit: 328650,
    totalCustomers: 12763,
    activeUsers: 8429,
    avgOrderValue: 97.6,
    conversionRate: 4.8,
    churnRate: 2.1,
    growthRate: 15.7,
    satisfaction: 8.9,
    newUsers: 487
  }
];

// Sample configuration for stats visualization
export const sampleStatsConfig = {
  type: "stats" as const,
  xAxisKey: "name",
  yAxisKeys: [
    // Big stats (first row)
    {
      key: "revenue",
      color: "#4CAF50",
      label: "Revenue ($)",
      size: "big" as const,
      icon: "TrendingUp",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-1"
    },
    {
      key: "profit",
      color: "#2196F3",
      label: "Profit ($)",
      size: "big" as const,
      icon: "Wallet",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-1"
    },

    // Medium stats (second row)
    {
      key: "totalCustomers",
      color: "#9C27B0",
      label: "Total Customers",
      size: "medium" as const,
      icon: "Users",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-2"
    },
    {
      key: "activeUsers",
      color: "#FF9800",
      label: "Active Users",
      size: "medium" as const,
      icon: "Activity",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-2"
    },
    {
      key: "avgOrderValue",
      color: "#795548",
      label: "Avg Order Value ($)",
      size: "medium" as const,
      icon: "ShoppingCart",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-2"
    },

    // Small stats (third row)
    {
      key: "conversionRate",
      color: "#E91E63",
      label: "Conversion (%)",
      size: "small" as const,
      icon: "Repeat",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-3"
    },
    {
      key: "churnRate",
      color: "#F44336",
      label: "Churn (%)",
      size: "small" as const,
      icon: "ArrowDownLeft",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-3"
    },
    {
      key: "growthRate",
      color: "#4CAF50",
      label: "Growth (%)",
      size: "small" as const,
      icon: "TrendingUp",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-3"
    },
    {
      key: "satisfaction",
      color: "#2196F3",
      label: "Satisfaction",
      size: "small" as const,
      icon: "Smile",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-3"
    },
    {
      key: "newUsers",
      color: "#00BCD4",
      label: "New Users (30d)",
      size: "small" as const,
      icon: "UserPlus",
      type: "bar" as const,
      yAxisId: "left" as const,
      rowId: "row-3"
    }
  ]
};
