import { FC } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from 'react';

type GraphViewType = 'line' | 'bar';

interface GraphArtifactProps {
  graph: {
    type?: string;
    data?: any; // Can be either graph_specs format or direct data array
    xAxisKey?: string;
    yAxisKeys?: any[];
    title?: string;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
        <p className="text-gray-600 text-xs mb-1">
          {label}
        </p>
        <p className="text-indigo-600 text-sm font-medium">
          {`${payload[0].name}: ${payload[0].value.toLocaleString()}`}
        </p>
      </div>
    );
  }
  return null;
};


export const GraphArtifact: FC<GraphArtifactProps> = ({ graph }) => {
  const [viewType, setViewType] = useState<GraphViewType>('line');

  console.log('Graph:', graph);

  // Add null checks and fallbacks
  if (!graph || !graph.data) {
    console.error('Invalid graph data structure:', graph);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Error: Invalid graph data structure</p>
        <pre className="text-xs text-red-500 mt-2 overflow-auto">
          {JSON.stringify(graph, null, 2)}
        </pre>
      </div>
    );
  }

  // Determine data format and extract chart data
  let chartData: any[] = [];
  let title = '';
  let yAxisTitle = '';

  // Check if it's the old graph_specs format
  if (graph.data.graph_specs) {
    const specs = graph.data.graph_specs;
    console.log('Using graph_specs format:', specs);

    if (!specs.x_axis || !specs.y_axis || !specs.x_axis.values || !specs.y_axis.values) {
      console.error('Missing required axis data in graph_specs:', specs);
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-600 text-sm">Error: Missing axis data in graph_specs format</p>
          <pre className="text-xs text-yellow-500 mt-2 overflow-auto">
            {JSON.stringify(specs, null, 2)}
          </pre>
        </div>
      );
    }

    chartData = specs.x_axis.values.map((timestamp: number, index: number) => ({
      timestamp,
      value: specs.y_axis.values[index] || 0
    }));
    title = specs.title || 'Chart';
    yAxisTitle = specs.y_axis.title || 'Value';
  }
  // Check if it's the new visualization format (array of data)
  else if (Array.isArray(graph.data)) {
    console.log('Using visualization format:', graph.data);

    if (!graph.xAxisKey || !graph.yAxisKeys || graph.yAxisKeys.length === 0) {
      console.error('Missing xAxisKey or yAxisKeys for visualization format:', graph);
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-600 text-sm">Error: Missing axis configuration for visualization format</p>
          <pre className="text-xs text-yellow-500 mt-2 overflow-auto">
            {JSON.stringify(graph, null, 2)}
          </pre>
        </div>
      );
    }

    // Transform visualization data to chart format
    chartData = graph.data.map((item: any) => ({
      timestamp: item[graph.xAxisKey!],
      value: item[graph.yAxisKeys![0].key || graph.yAxisKeys![0]] || 0
    }));
    title = graph.title || 'Chart';
    yAxisTitle = graph.yAxisKeys[0].label || graph.yAxisKeys[0].key || graph.yAxisKeys[0] || 'Value';
  }
  else {
    console.error('Unknown data format:', graph.data);
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600 text-sm">Error: Unknown data format</p>
        <pre className="text-xs text-yellow-500 mt-2 overflow-auto">
          {JSON.stringify(graph, null, 2)}
        </pre>
      </div>
    );
  }

  console.log('Chart Data:', chartData);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-base">{title}</h3>
        <Tabs
          defaultValue="line"
          value={viewType}
          onValueChange={(value) => setViewType(value as GraphViewType)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="line" className="text-xs px-3">
              Line Chart
            </TabsTrigger>
            <TabsTrigger value="bar" className="text-xs px-3">
              Bar Chart
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 35, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              dy={10}
            />
            <YAxis
              dataKey="value"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              dx={-10}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`;
                }
                return value;
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 3 }}
              activeDot={{ r: 5, fill: '#4f46e5' }}
              name={yAxisTitle}
              opacity={viewType === 'line' ? 1 : 0}
            />
            <Area
              type="monotone"
              dataKey="value"
              fill="url(#colorValue)"
              strokeWidth={0}
              opacity={viewType === 'line' ? 1 : 0}
              isAnimationActive={false}
              name=""
            />

            <Bar
              dataKey="value"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              name={yAxisTitle}
              opacity={viewType === 'bar' ? 1 : 0}
            />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
          />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};