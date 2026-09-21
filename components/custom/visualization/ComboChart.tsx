import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartProps } from "./types";

interface ComboChartProps extends ChartProps {
  stacking?: string;
}

export function ComboChart({
  data,
  xAxisKey,
  yAxisKeys,
  height = 400,
  showGridlines = false,
  showXAxisLabel = true,
  showYAxisLabel = true,
  showXTicks = true,
  showYTicks = true,
  leftYAxisLabel,
  rightYAxisLabel,
  getYAxisDomain,
  stacking = "none",
}: ComboChartProps) {
  const leftAxisKeys = yAxisKeys.filter(series => series.yAxisId !== "right");
  const rightAxisKeys = yAxisKeys.filter(series => series.yAxisId === "right");

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ bottom: 32 }}>
        {showGridlines && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis
          dataKey={xAxisKey}
          tick={showXTicks ? { fontSize: 11 } : false}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tick={showYTicks ? { fontSize: 11 } : false}
          label={showYAxisLabel && leftYAxisLabel ? {
            value: leftYAxisLabel,
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 11 }
          } : undefined}
          domain={getYAxisDomain(data, leftAxisKeys)}
        />
        {rightAxisKeys.length > 0 && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={showYTicks ? { fontSize: 11 } : false}
            label={showYAxisLabel && rightYAxisLabel ? {
              value: rightYAxisLabel,
              angle: 90,
              position: 'insideRight',
              style: { fontSize: 11 }
            } : undefined}
          />
        )}
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
                  <p className="font-medium">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                      {entry.name}: {entry.value?.toLocaleString() ?? 'N/A'}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" align="center" />
        {yAxisKeys.map(({ key, color, type = "bar", yAxisId = "left", label }) => {
          if (type === "bar") {
            // Determine stackId based on stacking setting only, ignoring yAxisId
            let stackId = undefined;
            if (stacking === "normal" || stacking === "percent") {
              // Use a single stack ID for all bars to ensure proper stacking across all axes
              stackId = "stackAll";
            }

            return (
              <Bar
                key={key}
                dataKey={key}
                name={label || key}
                fill={color}
                yAxisId={yAxisId}
                stackId={stackId}
              />
            );
          } else {
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label || key}
                stroke={color}
                activeDot={{ r: 8 }}
                yAxisId={yAxisId}
                strokeWidth={2}
              />
            );
          }
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
}