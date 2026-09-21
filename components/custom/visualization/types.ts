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
  /** When true, hides the code tab from the visualization header */
  hideCodeTab?: boolean;
  /** When true, hides all tabs (Code, Data, Visualization) and keeps only visualization view */
  hideAllTabs?: boolean;
  /** When true, hides the refresh button */
  hideRefreshButton?: boolean;
}

export interface ChartProps {
  data: VisualizationData[];
  xAxisKey: string;
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
}