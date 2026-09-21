import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prepareVisualizationData } from "@/app/utils/dataProcessing";
import { VisualizationProps } from "./types";
import { ComboChart } from "./ComboChart";
import { StatsDisplay } from "./StatsDisplay";
import { VisualizationHeader } from "./VisualizationHeader";
import { DataView } from "./DataView";
import { CodeView } from "./CodeView";


export function Visualization({
  type,
  data,
  title,
  description,
  xAxisKey,
  yAxisKeys,
  className,
  visualizationId,
  dashboardId,
  onEdit,
  onRefresh,
  onUpdate,
  isLivePreview = false,
  livePreviewConfig,
  isActive = false,
  rightYAxisLabel,
  leftYAxisLabel,
  onAddToDashboard,
  customHeaderComponent,
  isEnclosedInCard = true,
  isTitleATabSectionHeader = false,
  height = 300,
  showGridlines = false,
  showXAxisLabel = true,
  showYAxisLabel = true,
  showXTicks = true,
  showYTicks = true,
  showCAGRview = false,
  defaultView = "visualization",
  isCodeEditable = false,
  stacking = "none",
  hideCodeTab = false,
  hideAllTabs = false,
  hideRefreshButton = false,
}: VisualizationProps) {
  // Ensure defaultView is not "code" when hideCodeTab is true
  // When hideAllTabs is true, always use "visualization" as default
  const safeDefaultView = hideAllTabs 
    ? "visualization" 
    : (hideCodeTab && defaultView === "code" ? "visualization" : defaultView);
  const [activeView, setActiveView] = useState<"visualization" | "data" | "code">(safeDefaultView);

  // Process data if xAxisKey is an array (combination of fields)
  const processedData = Array.isArray(xAxisKey)
    ? prepareVisualizationData(data, xAxisKey)
    : data;

  // Determine the actual dataKey for charts (always 'name' for processed data)
  const actualXAxisKey = Array.isArray(xAxisKey) ? 'name' : xAxisKey;

  const getYAxisDomain = (data: any[], yAxisKeys: any[]): [number, 'auto'] => {
    let min = Infinity;
    yAxisKeys.forEach(({ key }) => {
      data.forEach((d) => {
        const value = Number(d[key]);
        if (!isNaN(value) && value < min) min = value;
      });
    });
    if (min === Infinity) min = 0;
    return [Math.floor(min * 0.98), 'auto'];
  };

  const generateCode = () => {
    return ""; // Return empty string for now
  };



  const renderVisualizationContent = () => {
    // Use live preview config if available, otherwise use original props
    const currentConfig = isLivePreview && livePreviewConfig ? livePreviewConfig : {
      type,
      data,
      title,
      description,
      xAxisKey,
      yAxisKeys,
      leftYAxisLabel,
      rightYAxisLabel,
      stacking
    };

    // Process data based on current config
    const currentProcessedData = Array.isArray(currentConfig.xAxisKey)
      ? prepareVisualizationData(currentConfig.data, 
          // If xAxisKey is an array with a single item, extract it for processing
          Array.isArray(currentConfig.xAxisKey) && currentConfig.xAxisKey.length === 1 
            ? currentConfig.xAxisKey[0] 
            : currentConfig.xAxisKey)
      : currentConfig.data;

    // For API format, xAxisKey might be an array with a single string
    // Handle this case for correct chart rendering
    const currentActualXAxisKey = Array.isArray(currentConfig.xAxisKey) 
      ? currentConfig.xAxisKey.length === 1
        ? currentConfig.xAxisKey[0] // Use the single item if it's a single-item array
        : 'name'                   // Use 'name' for multi-key groupings
      : currentConfig.xAxisKey;    // Use as-is for string xAxisKey

    // If hideAllTabs is true, always show visualization regardless of activeView
    const viewToRender = hideAllTabs ? "visualization" : activeView;

    switch (viewToRender) {
      case "visualization":
        if (currentConfig.type === "stats") {
          return (
            <div className="w-full">
              <StatsDisplay
                data={currentConfig.data}
                yAxisKeys={currentConfig.yAxisKeys}
                isEnclosedInCard={isEnclosedInCard}
              />
            </div>
          );
        }

        return (
          <div className="relative">
            <ComboChart
              data={currentProcessedData}
              xAxisKey={currentActualXAxisKey}
              yAxisKeys={currentConfig.yAxisKeys}
              height={height}
              showGridlines={showGridlines}
              showXAxisLabel={showXAxisLabel}
              showYAxisLabel={showYAxisLabel}
              showXTicks={showXTicks}
              showYTicks={showYTicks}
              leftYAxisLabel={currentConfig.leftYAxisLabel}
              rightYAxisLabel={currentConfig.rightYAxisLabel}
              getYAxisDomain={getYAxisDomain}
              stacking={currentConfig.stacking || "none"}
            />
          </div>
        );

      case "data":
        return <DataView data={processedData} />;

      case "code":
        // If hideCodeTab is true, fall back to visualization view
        if (hideCodeTab) {
          return (
            <div className="relative">
              <ComboChart
                data={currentProcessedData}
                xAxisKey={currentActualXAxisKey}
                yAxisKeys={currentConfig.yAxisKeys}
                height={height}
                showGridlines={showGridlines}
                showXAxisLabel={showXAxisLabel}
                showYAxisLabel={showYAxisLabel}
                showXTicks={showXTicks}
                showYTicks={showYTicks}
                leftYAxisLabel={currentConfig.leftYAxisLabel}
                rightYAxisLabel={currentConfig.rightYAxisLabel}
                getYAxisDomain={getYAxisDomain}
                stacking={currentConfig.stacking || "none"}
              />
            </div>
          );
        }
        return <CodeView code={generateCode()} isEditable={isCodeEditable} />;

      default:
        return null;
    }
  };

  const renderContent = () => (
    <div className={`pt-2 pb-4${isEnclosedInCard ? ' px-4' : ''}`}>
      {renderVisualizationContent()}
    </div>
  );

  if (!isEnclosedInCard) {
    return (
      <div className={`${className} ${isLivePreview ? 'relative live-preview-container' : ''}`}>
        {/* Live Preview Tag */}
        {isLivePreview && (
          <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
            Live Preview
          </div>
        )}
        <VisualizationHeader
          title={title}
          description={description}
          visualizationId={visualizationId}
          isTitleATabSectionHeader={isTitleATabSectionHeader}
          onEdit={onEdit}
          onRefresh={onRefresh}
          customHeaderComponent={customHeaderComponent}
          activeView={activeView}
          onViewChange={setActiveView}
          hideCodeTab={hideCodeTab}
          hideAllTabs={hideAllTabs}
          hideRefreshButton={hideRefreshButton}
        />
        <div>
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <Card className={`${className} ${isActive ? 'border-2 border-blue-500' : ''} ${isLivePreview ? 'relative live-preview-container' : ''}`}>
      {/* Live Preview Tag */}
      {isLivePreview && (
        <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
          Live Preview
        </div>
      )}
      <CardHeader className="px-4 py-3 pb-0">
        <VisualizationHeader
          title={title}
          description={description}
          visualizationId={visualizationId}
          isTitleATabSectionHeader={isTitleATabSectionHeader}
          onEdit={onEdit}
          onRefresh={onRefresh}
          customHeaderComponent={customHeaderComponent}
          activeView={activeView}
          onViewChange={setActiveView}
          hideCodeTab={hideCodeTab}
          hideAllTabs={hideAllTabs}
          hideRefreshButton={hideRefreshButton}
        />
      </CardHeader>
      <CardContent className="p-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}