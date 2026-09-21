import React from 'react';
import { Visualization } from './visualization';
import { VisualizationData, VisualizationSeries } from './visualization/types';
import { ArtifactHeader } from './ArtifactHeader';

export const SQLEditorArtifact: React.FC = () => {
  // Sample data for code and data metrics
  const statsData: VisualizationData[] = [{
    name: "Current Stats",
    totalQueries: 156,
    activeConnections: 8,
    avgQueryTime: 0.45,
    cacheHitRate: 92.5,
    dataSize: 2.4,
    queryComplexity: 3.2
  }];

  const series: VisualizationSeries[] = [
    {
      key: "totalQueries",
      color: "#2563eb", // blue
      label: "Total Queries",
      size: "big",
      icon: "Activity"
    },
    {
      key: "activeConnections",
      color: "#16a34a", // green
      label: "Active Connections",
      size: "medium",
      icon: "Users"
    },
    {
      key: "avgQueryTime",
      color: "#dc2626", // red
      label: "Avg Query Time (s)",
      size: "medium",
      icon: "TrendingUp"
    },
    {
      key: "cacheHitRate",
      color: "#9333ea", // purple
      label: "Cache Hit Rate (%)",
      size: "small",
      icon: "Repeat"
    },
    {
      key: "dataSize",
      color: "#ea580c", // orange
      label: "Data Size (GB)",
      size: "small",
      icon: "Wallet"
    },
    {
      key: "queryComplexity",
      color: "#0891b2", // cyan
      label: "Query Complexity",
      size: "small",
      icon: "ShoppingCart"
    }
  ];

  const editorId = "SQL-EDITOR-2024-001"; // New editor ID for tracking
  const lastUpdated = new Date(); // Using current time as last updated time

  return (
    <div className="h-[70vh] overflow-auto">
      <div className="max-w-3xl mx-auto space-y-3">
        <ArtifactHeader 
          title="SQL Editor Metrics"
          contentIDText="Editor ID"
          contentID={editorId}
          lastUpdatedAt={lastUpdated}
        />
        <div className="space-y-4">
          <Visualization
            type="stats"
            data={statsData}
            xAxisKey="name"
            yAxisKeys={series}
            title="Performance Overview"
            description="Current metrics for SQL editor usage and performance"
            isEnclosedInCard={true}
            defaultView="code"
            isCodeEditable={true}
          />
        </div>
      </div>
    </div>
  );
};
