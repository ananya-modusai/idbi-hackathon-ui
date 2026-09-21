import { CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Pencil, RefreshCw } from "lucide-react";
import { ReactNode } from "react";

interface VisualizationHeaderProps {
  title?: string;
  description?: string;
  visualizationId?: string;
  isTitleATabSectionHeader?: boolean;
  onEdit?: () => void;
  onRefresh?: () => void;
  customHeaderComponent?: ReactNode;
  activeView: "visualization" | "data" | "code";
  onViewChange: (view: "visualization" | "data" | "code") => void;
  hideCodeTab?: boolean;
  hideAllTabs?: boolean;
  hideRefreshButton?: boolean;
}

export function VisualizationHeader({
  title,
  description,
  visualizationId,
  isTitleATabSectionHeader = false,
  onEdit,
  onRefresh,
  customHeaderComponent,
  activeView,
  onViewChange,
  hideCodeTab = false,
  hideAllTabs = false,
  hideRefreshButton = false,
}: VisualizationHeaderProps) {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="pb-1 pt-1">
      <div className="flex justify-between items-center w-full">
        <div>
          {title && !isTitleATabSectionHeader && <CardTitle>{title}</CardTitle>}
          {title && isTitleATabSectionHeader && (
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600 mr-1" />
              <span className="text-lg font-semibold text-black">{title}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-[0.1875rem]">
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1 px-3 py-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full border border-gray-200 transition-colors"
              title="Edit visualization"
            >
              <Pencil size={14} />
              <span className="text-xs font-medium">Edit</span>
            </button>
          )}
          {customHeaderComponent}
          {!hideRefreshButton && (
            <button
              onClick={handleRefreshClick}
              className="flex items-center gap-1 px-3 py-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full border border-gray-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={14} />
              <span className="text-xs font-medium">Refresh</span>
            </button>
          )}
          {!hideAllTabs && (
            <Tabs
              value={activeView}
              onValueChange={(value) => onViewChange(value as "visualization" | "data" | "code")}
              className="w-fit"
            >
              <TabsList className="h-7 bg-gray-100">
                {!hideCodeTab && <TabsTrigger value="code" className="text-xs px-3 py-1">Code</TabsTrigger>}
                <TabsTrigger value="data" className="text-xs px-3 py-1">Data</TabsTrigger>
                <TabsTrigger value="visualization" className="text-xs px-3 py-1">Visualization</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {visualizationId && (
          <span className="text-sm text-gray-400">ID: {visualizationId}</span>
        )}
        {description && <CardDescription className="mt-0">{description}</CardDescription>}
      </div>
    </div>
  );
} 