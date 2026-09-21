import { VisualizationData } from "@/components/custom/visualization/types";

// Sample data for the visualizations
export const lineChartData: VisualizationData[] = [
  { name: "Jan", month: "Jan", users: 400, sessions: 240 },
  { name: "Feb", month: "Feb", users: 300, sessions: 139 },
  { name: "Mar", month: "Mar", users: 200, sessions: 980 },
  { name: "Apr", month: "Apr", users: 278, sessions: 390 },
  { name: "May", month: "May", users: 189, sessions: 480 },
  { name: "Jun", month: "Jun", users: 239, sessions: 380 },
  { name: "Jul", month: "Jul", users: 349, sessions: 430 },
];

export const barChartData: VisualizationData[] = [
  { name: "Category A", category: "Category A", value: 400 },
  { name: "Category B", category: "Category B", value: 300 },
  { name: "Category C", category: "Category C", value: 200 },
  { name: "Category D", category: "Category D", value: 278 },
  { name: "Category E", category: "Category E", value: 189 },
]; 