import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, TrendingUp, Wallet, Users, ShoppingCart, Repeat, ArrowDownLeft, Smile, UserPlus } from "lucide-react";
import { VisualizationData, VisualizationSeries } from "./types";

interface StatsDisplayProps {
  data: VisualizationData[];
  yAxisKeys: VisualizationSeries[];
  isEnclosedInCard?: boolean;
}

export function StatsDisplay({ data, yAxisKeys, isEnclosedInCard = true }: StatsDisplayProps) {
  const statData = data[0] || {};

  const sizeClasses = {
    big: "text-3xl font-bold",
    medium: "text-xl font-semibold",
    small: "text-base font-medium"
  };

  const labelSizeClasses = {
    big: "text-sm text-gray-500 font-medium",
    medium: "text-sm text-gray-500 font-medium",
    small: "text-xs text-gray-500 font-medium"
  };

  const iconMap = {
    TrendingUp,
    Wallet,
    Users,
    Activity,
    ShoppingCart,
    Repeat,
    ArrowDownLeft,
    Smile,
    UserPlus,
  };

  // Group stats by rowId to maintain row separation, then sort by rowId
  const groupedByRow = yAxisKeys.reduce((acc, series) => {
    const rowId = (series as any).rowId || 'default-row';
    if (!acc[rowId]) {
      acc[rowId] = [];
    }
    acc[rowId].push(series);
    return acc;
  }, {} as Record<string, VisualizationSeries[]>);

  // Sort rows by rowId to maintain consistent order
  const sortedRows = Object.keys(groupedByRow).sort().map(rowId => ({
    rowId,
    stats: groupedByRow[rowId],
    size: groupedByRow[rowId][0]?.size || 'small' // Use the size from the first stat in the row
  }));

  const renderStatCard = ({ key, color, label, size = "small", icon }: VisualizationSeries) => {
    const IconComponent = icon && iconMap[icon as keyof typeof iconMap] ? iconMap[icon as keyof typeof iconMap] : Activity;
    return (
      <Card key={key} className={`${isEnclosedInCard ? "p-4" : "py-4 px-2"}`}>
        <div className="flex flex-row items-center h-full min-h-[56px]">
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
              <IconComponent size={18} style={{ color }} />
            </div>
          </div>
          <div className="flex flex-col justify-center ml-3">
            <span className={cn(labelSizeClasses[size as keyof typeof labelSizeClasses])}>{label || key}</span>
            <span className={cn(sizeClasses[size as keyof typeof sizeClasses], "mt-0.5")} style={{ color }}>
              {typeof statData[key] === 'number'
                ? Number(statData[key]).toLocaleString()
                : statData[key]}
            </span>
          </div>
        </div>
      </Card>
    );
  };

  const getGridCols = (size: string, count: number) => {
    switch (size) {
      case 'big':
        return count > 1 ? 'grid-cols-2' : 'grid-cols-1';
      case 'medium':
        if (count > 3) return 'grid-cols-4';
        if (count > 2) return 'grid-cols-3';
        return 'grid-cols-2';
      case 'small':
      default:
        return 'grid-cols-5';
    }
  };

  return (
    <div className="space-y-6 w-full">
      {sortedRows.map((row) => (
        <div key={row.rowId} className={cn(
          "grid gap-4 w-full",
          getGridCols(row.size, row.stats.length)
        )}>
          {row.stats.map(stat => renderStatCard({ ...stat, size: row.size as any }))}
        </div>
      ))}
    </div>
  );
}