import { ReactNode } from "react";

export type StatSize = "big" | "medium" | "small";

export type SeriesType = "bar" | "line";

export interface VisualizationSeries {
  key: string;
  color: string;
  type?: SeriesType;
  yAxisId?: "left" | "right";
  label?: string;
  size?: StatSize;
  icon?: string;
  rowId?: string;
}

export interface VisualizationData {
  [key: string]: any;
  name?: string;
}

export interface VisualizationProps {
  type: "combo" | "stats";
  data: VisualizationData[];
  title?: string;
  description?: string;
  xAxisKey: string | string[];
  xAxisLabel?: string;
  yAxisKeys: VisualizationSeries[];
  className?: string;
  visualizationId?: string;
  dashboardId?: string;
  onEdit?: () => void;
  onRefresh?: () => void;
  onUpdate?: (updatedProps: Partial<VisualizationProps>) => void;
  isLivePreview?: boolean;
  livePreviewConfig?: any;
  isActive?: boolean;
  rightYAxisLabel?: string;
  leftYAxisLabel?: string;
  onAddToDashboard?: () => void;
  customHeaderComponent?: ReactNode;
  // Optional rich content to show as an info popover next to the title (similar to StatCard.infoContent)
  infoContent?: ReactNode;
  isEnclosedInCard?: boolean;
  isTitleATabSectionHeader?: boolean;
  height?: number;
  showGridlines?: boolean;
  showXAxisLabel?: boolean;
  showYAxisLabel?: boolean;
  showXTicks?: boolean;
  showYTicks?: boolean;
  showCAGRview?: boolean;
  defaultView?: "visualization" | "data" | "code";
  isCodeEditable?: boolean;
  stacking?: string;
  activeView?: "visualization" | "data" | "code";
  onViewChange?: (view: "visualization" | "data" | "code") => void;
  hideHeaderControls?: boolean;
  showStackedPercentages?: boolean;
  showLabels?: boolean;
  labelFormatter?: (value: any, entry: any) => string;
  stackTotalFormatter?: (total: number) => string;
  useColorFromData?: boolean;
  showLegend?: boolean;
  darkAxes?: boolean;
  barSize?: number;
  showVerticalGridlines?: boolean;
  yAxisTickCount?: number;
  legendPosition?: 'top' | 'bottom';
  tooltipValueFormatter?: (value: any, name: string) => string;
  yAxisTickFormatter?: (value: any) => string;
}

export interface ChartProps {
  data: VisualizationData[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisKeys: VisualizationSeries[];

  height?: number;
  showGridlines?: boolean;
  showXAxisLabel?: boolean;
  showYAxisLabel?: boolean;
  showXTicks?: boolean;
  showYTicks?: boolean;
  leftYAxisLabel?: string;
  rightYAxisLabel?: string;
  getYAxisDomain: (data: VisualizationData[], yAxisKeys: VisualizationSeries[]) => [number, 'auto'];
  showLabels?: boolean;
  labelFormatter?: (value: any, entry: any) => string;
  showStackedPercentages?: boolean;
  stackTotalFormatter?: (total: number) => string;
  useColorFromData?: boolean;
  showLegend?: boolean;
  darkAxes?: boolean;
  barSize?: number;
  showVerticalGridlines?: boolean;
  yAxisTickCount?: number;
  legendPosition?: 'top' | 'bottom';
  tooltipValueFormatter?: (value: any, name: string) => string;
  yAxisTickFormatter?: (value: any) => string;
}