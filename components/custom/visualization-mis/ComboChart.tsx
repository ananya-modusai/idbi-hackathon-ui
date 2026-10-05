import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from "recharts";
import { ChartProps } from "./types";

interface ComboChartProps extends ChartProps {
  stacking?: string;
}

export function ComboChart({
  data,
  xAxisKey,
  xAxisLabel,
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
  showLabels = false,
  labelFormatter,
  useColorFromData = false,
  showLegend = true,
  darkAxes = false,
  barSize = 40,
  showStackedPercentages = false,
  stackTotalFormatter,
  showVerticalGridlines = false,
  yAxisTickCount,
  legendPosition = 'top',
  tooltipValueFormatter,
  yAxisTickFormatter,
}: ComboChartProps) {
  const leftAxisKeys = yAxisKeys.filter(series => series.yAxisId !== "right");
  const rightAxisKeys = yAxisKeys.filter(series => series.yAxisId === "right");

  const axisLineStyle = darkAxes ? { stroke: '#4b5563', strokeWidth: 1 } : false;
  const tickLineStyle = darkAxes ? { stroke: '#4b5563' } : false;
  const tickStyle = { fontSize: 14, fill: darkAxes ? '#374151' : '#6b7280' };
  const labelStyle = { fontSize: 14, fontWeight: 600, fill: darkAxes ? '#374151' : '#6b7280' };

    return (
    <ResponsiveContainer width="100%" height={height}>
      {/* Remove gaps between adjacent bar series by setting barGap and barCategoryGap to 0 */}
      <ComposedChart data={data} margin={{ bottom: 32, top: 30, left: 30, right: 30 }} barGap={0}>
        {showGridlines && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={showVerticalGridlines} 
            stroke="#e5e7eb" 
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          tick={showXTicks ? tickStyle : false}
          axisLine={axisLineStyle}
          tickLine={tickLineStyle}
          dy={darkAxes ? 0 : 10}
          label={showXAxisLabel && xAxisLabel ? {
            value: xAxisLabel,
            position: 'insideBottom',
            offset: -20,
            style: labelStyle
          } : undefined}
        />

        <YAxis
          yAxisId="left"
          orientation="left"
          tick={showYTicks ? tickStyle : false}
          axisLine={axisLineStyle}
          tickLine={tickLineStyle}
          label={showYAxisLabel && leftYAxisLabel ? {
            value: leftYAxisLabel,
            angle: -90,
            position: 'left',
            offset: 15,
            style: { ...labelStyle, textAnchor: 'middle' }
          } : undefined}
          domain={getYAxisDomain(data, leftAxisKeys)}
          tickCount={yAxisTickCount}
          tickFormatter={yAxisTickFormatter}
        />
        {rightAxisKeys.length > 0 && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={showYTicks ? tickStyle : false}
            axisLine={axisLineStyle}
            tickLine={tickLineStyle}
            label={showYAxisLabel && rightYAxisLabel ? {
              value: rightYAxisLabel,
              angle: 90,
              position: 'right',
              offset: 15,
              style: { ...labelStyle, textAnchor: 'middle' }
            } : undefined}
            tickFormatter={yAxisTickFormatter}
          />
        )}
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
                  <p className="font-medium text-gray-900">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                      {entry.name}: {tooltipValueFormatter 
                        ? tooltipValueFormatter(entry.value, entry.name as string) 
                        : (entry.value?.toLocaleString() ?? 'N/A')}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
          cursor={{ fill: '#f3f4f6' }}
        />
        {showLegend && (
          <Legend 
            wrapperStyle={{ fontSize: 11, paddingTop: legendPosition === 'bottom' ? 0 : 10, paddingBottom: legendPosition === 'bottom' ? 0 : 20 }} 
            verticalAlign={legendPosition} 
            align="center" 
            iconType="circle"
          />
        )}
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
                radius={showStackedPercentages ? 0 : [4, 4, 0, 0]}
                barSize={barSize}
              >
                {showLabels && (
                  <LabelList 
                    dataKey={key} 
                    position={showStackedPercentages ? "center" : "top"} 
                    content={(props: any) => {
                      const { x, y, width, height, value, index } = props;
                      const entry = data[index];
                      const labelText = labelFormatter ? labelFormatter(value, entry) : String(value);

                      if (showStackedPercentages) {
                        // Calculate total for this index
                        const total = yAxisKeys
                          .filter(s => s.type === "bar" || !s.type)
                          .reduce((sum, s) => sum + (Number(entry[s.key]) || 0), 0);
                        
                        const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                        const isTopMetric = key === yAxisKeys.filter(s => s.type === "bar" || !s.type).slice(-1)[0].key;

                        return (
                          <g>
                            {/* Percentage inside the segment */}
                            {height > 15 && (
                              <text 
                                x={x + width / 2} 
                                y={y + height / 2} 
                                fill="white" 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                fontSize={10} 
                                fontWeight="600"
                              >
                                {percent}%
                              </text>
                            )}
                            
                            {/* Total value on top of the entire stack */}
                            {isTopMetric && (
                              <text 
                                x={x + width / 2} 
                                y={y - 12} 
                                textAnchor="middle" 
                                fontSize={11} 
                                fontWeight="700"
                              >
                                <tspan fill="#4b5563">
                                  {stackTotalFormatter 
                                    ? stackTotalFormatter(total) 
                                    : total.toLocaleString()}
                                </tspan>
                              </text>
                            )}
                          </g>
                        );
                      }
                      
                      // Split "20(30%)" into "20" and "(30%)"
                      const match = labelText.match(/^(.*?)(\(.*?\))$/);
                      if (match) {
                        return (
                          <text 
                            x={x + width / 2} 
                            y={y - 12} 
                            textAnchor="middle" 
                            fontSize={11} 
                            fontWeight="600"
                          >
                            <tspan fill="#4b5563">{match[1]}</tspan>
                            <tspan fill="#9ca3af">{match[2]}</tspan>
                          </text>
                        );
                      }

                      return (
                        <text 
                          x={x + width / 2} 
                          y={y - 12} 
                          fill="#4b5563" 
                          textAnchor="middle" 
                          fontSize={11} 
                          fontWeight="600"
                        >
                          {labelText}
                        </text>
                      );
                    }}
                  />
                )}
                {useColorFromData && data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || color} />
                ))}
              </Bar>
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