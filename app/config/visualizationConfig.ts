export interface VisualizationType {
  value: string;
  label: string;
  icon: string;
}

export interface ChartType {
  value: string;
  label: string;
}

export interface ScaleType {
  value: string;
  label: string;
}

export interface YAxisPosition {
  value: string;
  label: string;
}

export interface StackingOption {
  value: string;
  label: string;
}

export interface DataLabelMode {
  value: string;
  label: string;
}

export interface FormatOption {
  value: string;
  label: string;
  example: string;
}

export interface AggregationOption {
  value: string;
  label: string;
}

export interface SeriesConfiguration {
  key: string;
  label?: string;
  color: string;
  type?: "bar" | "line";
  yAxisId?: "left" | "right";
  aggregation?: string;
  groupBy?: string;
}

export interface GroupByConfiguration {
  primaryField: string;
  secondaryField?: string;
  separator?: string;
}

export interface VisualizationConfig {
  visualizationTypes: VisualizationType[];
  chartTypes: ChartType[];
  scaleTypes: ScaleType[];
  yAxisPositions: YAxisPosition[];
  stackingOptions: StackingOption[];
  groupByOptions: { value: string; label: string; }[];
  aggregationOptions: AggregationOption[];
  dataLabelModes: DataLabelMode[];
  formatOptions: {
    numberFormats: FormatOption[];
    percentFormats: FormatOption[];
    dateFormats: FormatOption[];
  };
  defaultColors: string[];
  defaultSettings: {
    general: {
      visualizationType: string;
      horizontalChart: boolean;
      stacking: string;
      normalizeToPercentage: boolean;
      missingNullHandling: string;
    };
    xAxis: {
      column: string;
      title: string;
      scaleType: string;
      showAxisLine: boolean;
      showTickMarks: boolean;
      showGridLines: boolean;
    };
    yAxis: {
      title: string;
      scaleType: string;
      showAxisLine: boolean;
      showTickMarks: boolean;
      showGridLines: boolean;
    };
    series: SeriesConfiguration[];
    colors: {
      useDefaultPalette: boolean;
      customColors: any[];
    };
    dataLabels: {
      show: boolean;
      mode: string;
      numberFormat: string;
      percentFormat: string;
      dateFormat: string;
    };
  };
}

// Standardized visualization data structure
export interface StandardVisualizationData {
  type: "line" | "bar" | "combo" | "stats";
  data: any[];
  title?: string;
  description?: string;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisKeys: {
    key: string;
    label?: string;
    color: string;
    type?: "bar" | "line";
    yAxisId?: "left" | "right";
    size?: "big" | "medium" | "small";
    icon?: string;
  }[];
  visualizationId?: string;
  dashboardId?: string;
  settings?: {
    general?: {
      visualizationType?: string;
      horizontalChart?: boolean;
      stacking?: string;
      normalizeToPercentage?: boolean;
      showDataLabels?: boolean;
      numberFormat?: string;
      percentFormat?: string;
      dateFormat?: string;
      dataLabelMode?: string;
    };
    xAxis?: {
      title?: string;
      scaleType?: string;
      showAxisLine?: boolean;
      showTickMarks?: boolean;
      showGridLines?: boolean;
    };
    yAxis?: {
      title?: string;
      scaleType?: string;
      showAxisLine?: boolean;
      showTickMarks?: boolean;
      showGridLines?: boolean;
    };
    colors?: {
      useDefaultPalette?: boolean;
      customColors?: string[];
    };
  };
}

export const visualizationConfig: VisualizationConfig = {
  visualizationTypes: [
    { value: "combo", label: "Combo", icon: "BarChart3" },
    { value: "bar", label: "Bar", icon: "BarChart" },
    { value: "line", label: "Line", icon: "LineChart" },
    { value: "area", label: "Area", icon: "AreaChart" },
    { value: "stats", label: "Stats", icon: "Activity" }
  ],
  chartTypes: [
    { value: "bar", label: "Bar" },
    { value: "line", label: "Line" }
  ],
  scaleTypes: [
    { value: "linear", label: "Linear" },
    { value: "log", label: "Logarithmic" },
    { value: "time", label: "Time" }
  ],
  yAxisPositions: [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" }
  ],
  stackingOptions: [
    { value: "none", label: "None" },
    { value: "normal", label: "Normal" },
    { value: "percent", label: "Percent" }
  ],
  groupByOptions: [
    { value: "none", label: "None" }
  ],
  aggregationOptions: [
    { value: "sum", label: "Sum" },
    { value: "count", label: "Count" },
    { value: "avg", label: "Average" },
    { value: "min", label: "Minimum" },
    { value: "max", label: "Maximum" }
  ],
  dataLabelModes: [
    { value: "automatic", label: "Automatic" },
    { value: "inside", label: "Inside" },
    { value: "outside", label: "Outside" },
    { value: "hidden", label: "Hidden" }
  ],
  formatOptions: {
    numberFormats: [
      { value: "", label: "Default", example: "1234.56" },
      { value: "0,0", label: "Thousands separator", example: "1,235" },
      { value: "0,0.00", label: "Two decimal places", example: "1,234.56" },
      { value: "0.0a", label: "Abbreviated", example: "1.2k" }
    ],
    percentFormats: [
      { value: "0|0.00%", label: "Default percent", example: "12.34%" },
      { value: "0%", label: "Whole percent", example: "12%" },
      { value: "0.0%", label: "One decimal", example: "12.3%" }
    ],
    dateFormats: [
      { value: "YYYY-MM-DD", label: "Date only", example: "2024-01-15" },
      { value: "YYYY-MM-DD HH:mm", label: "Date and time", example: "2024-01-15 14:30" },
      { value: "MMM DD, YYYY", label: "Month name", example: "Jan 15, 2024" }
    ]
  },
  defaultColors: [
    "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#f97316", "#84cc16", "#ec4899", "#6b7280"
  ],
  defaultSettings: {
    general: {
      visualizationType: "combo",
      horizontalChart: false,
      stacking: "none",
      normalizeToPercentage: false,
      missingNullHandling: "0"
    },
    xAxis: {
      column: "",
      title: "",
      scaleType: "linear",
      showAxisLine: true,
      showTickMarks: true,
      showGridLines: true
    },
    yAxis: {
      title: "",
      scaleType: "linear",
      showAxisLine: true,
      showTickMarks: true,
      showGridLines: true
    },
    series: [],
    colors: {
      useDefaultPalette: true,
      customColors: []
    },
    dataLabels: {
      show: false,
      mode: "automatic",
      numberFormat: "",
      percentFormat: "0|0.00%",
      dateFormat: "YYYY-MM-DD HH:mm"
    }
  }
};
