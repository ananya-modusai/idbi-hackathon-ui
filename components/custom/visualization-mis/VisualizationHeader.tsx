import { CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Pencil, RefreshCw, Info } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

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
  // Optional rich content to show as an info popover next to the title
  infoContent?: ReactNode;
}

export function VisualizationHeader({
  title,
  description,
  visualizationId,
  isTitleATabSectionHeader = false,
  onEdit,
  onRefresh,
  customHeaderComponent,
  infoContent,
  activeView,
  onViewChange,
}: VisualizationHeaderProps) {
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showInfo && infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showInfo]);
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
          {title && !isTitleATabSectionHeader && (
            <div className="flex items-center gap-2 min-w-0">
              <CardTitle className="truncate">{title}</CardTitle>
              {infoContent && (
                <div className="relative" ref={infoRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                    className="pl-0 rounded hover:bg-gray-100"
                    aria-label="Show visualization info"
                    type="button"
                  >
                    <Info className="h-4 w-4 text-gray-400" />
                  </button>
                  {showInfo && (
                    <div className="absolute z-50 right-0 left-0 mt-2 w-56 bg-white border rounded shadow p-3 text-sm text-gray-700">
                      {infoContent}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {title && isTitleATabSectionHeader && (
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600 mr-1" />
              <span className="text-lg font-semibold text-black">{title}</span>
              {infoContent && (
                <div className="relative" ref={infoRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                    className="pl-0 rounded hover:bg-gray-100"
                    aria-label="Show visualization info"
                    type="button"
                  >
                    <Info className="h-4 w-4 text-gray-400" />
                  </button>
                  {showInfo && (
                    <div className="absolute z-50 left-0 mt-2 w-56 bg-white border rounded shadow p-3 text-sm text-gray-700">
                      {infoContent}
                    </div>
                  )}
                </div>
              )}
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
          <button
            onClick={handleRefreshClick}
            className="flex items-center gap-1 px-3 py-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full border border-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={14} />
            <span className="text-xs font-medium">Refresh</span>
          </button>
          <Tabs
            value={activeView}
            onValueChange={(value) => onViewChange(value as "visualization" | "data" | "code")}
            className="w-fit"
          >
            <TabsList className="h-7 bg-gray-100">
              {/* <TabsTrigger value="code" className="text-xs px-3 py-1">Code</TabsTrigger> */}
              <TabsTrigger value="data" className="text-xs px-3 py-1">Data</TabsTrigger>
              <TabsTrigger value="visualization" className="text-xs px-3 py-1">Visualization</TabsTrigger>
            </TabsList>
          </Tabs>
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