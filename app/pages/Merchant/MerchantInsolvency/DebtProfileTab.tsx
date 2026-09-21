'use client';

import { FC, useState } from 'react';
import { Landmark } from 'lucide-react';
import { CustomTableView, Column } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import debtProfileData from '@/app/data/tarc_rerun_peer_comparison/debt_profile.json';

type NatureMode = 'consolidated' | 'standalone';

const formatValue = (value: number | null | undefined) => {
  if (value == null) return '—';
  const formatted = Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `(${formatted})` : formatted;
};

const ROWS: {
  key: string;
  label: string;
  unit: string;
  italic?: boolean;
  /** subtotal row, highlighted */
  subtotal?: boolean;
  tooltip?: string;
}[] = [
  { key: 'longTerm', label: 'Long-term Borrowings', unit: '₹ Cr' },
  { key: 'shortTerm', label: 'Short-term Borrowings', unit: '₹ Cr' },
  {
    key: 'total',
    label: 'Total Borrowings',
    unit: '₹ Cr',
    subtotal: true,
    tooltip: 'Long-term Borrowings + Short-term Borrowings',
  },
  { key: 'financeCost', label: 'Finance Cost', unit: '₹ Cr', italic: true },
  {
    key: 'debtToEquity',
    label: 'Debt-to-Equity',
    unit: 'Times',
    italic: true,
    tooltip: 'Total Debt divided by Shareholders\u2019 Equity',
  },
  {
    key: 'interestCoverage',
    label: 'Interest Coverage',
    unit: 'Times',
    italic: true,
    tooltip: 'Earnings available to service interest divided by Finance Cost',
  },
];

// Cell content is stretched back over the td's px-4 py-3 so a highlight fills
// the whole cell rather than just hugging the text.
const CELL_BLEED = 'block -mx-4 -my-3 px-4 py-3';

const DebtProfileTab: FC = () => {
  const [nature, setNature] = useState<NatureMode>('consolidated');
  const years = [...debtProfileData.years].sort((a, b) => parseInt(a) - parseInt(b));
  const series = debtProfileData[nature] as Record<string, Record<string, number> | undefined>;

  const columns: Column[] = [
    {
      key: 'particulars',
      header: 'Financial Metric',
      width: '26%',
      render: (v: string, row: any) => (
        <span
          title={row.tooltip || undefined}
          className={`${CELL_BLEED} text-blue-800 font-semibold ${row.italic ? 'italic' : ''} ${
            row.subtotal ? 'bg-blue-50/70' : ''
          } ${row.tooltip ? 'cursor-help' : ''}`}
        >
          {v}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      width: '10%',
      render: (v: string, row: any) => (
        <span className={`${CELL_BLEED} ${row.subtotal ? 'bg-blue-50/70 font-semibold' : ''}`}>{v}</span>
      ),
    },
    ...years.map((y) => ({
      key: `fy_${y}`,
      header: `FY${y.slice(-2)}`,
      align: 'right' as const,
      width: `${(64 / years.length).toFixed(2)}%`,
      render: (_: any, row: any) => {
        const value = row[`fy_${y}`] as number | null | undefined;
        const negative = typeof value === 'number' && value < 0;
        // light red where interest coverage falls below 1.00
        const weakCoverage =
          row.metricKey === 'interestCoverage' && typeof value === 'number' && value < 1;
        return (
          <span
            className={`${CELL_BLEED} text-right ${row.subtotal ? 'bg-blue-50/70 font-semibold' : ''} ${
              weakCoverage ? 'bg-red-50' : ''
            } ${negative ? 'text-red-600' : ''}`}
          >
            {formatValue(value)}
          </span>
        );
      },
    })),
  ];

  const data = ROWS.map((r) => {
    const row: Record<string, any> = {
      particulars: r.label,
      unit: r.unit,
      italic: r.italic,
      subtotal: r.subtotal,
      tooltip: r.tooltip,
      metricKey: r.key,
    };
    years.forEach((y) => {
      row[`fy_${y}`] = series[r.key]?.[y];
    });
    return row;
  });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-6 w-6 text-blue-600" />
          <p className="text-lg font-semibold text-blue-700">Debt Analysis</p>
          <BubbleTag
            text="Period: Financial year ending 31 March"
            color="grayTextWhiteBg"
            withBorder={true}
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['consolidated', 'standalone'] as NatureMode[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setNature(opt)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                nature === opt ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full border-b border-gray-200 mt-2 mb-4" />

      <CustomTableView columns={columns} data={data} className="w-full" initialRowLimit={data.length} />
    </div>
  );
};

export default DebtProfileTab;
