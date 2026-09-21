'use client';

import { FC, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ComboChart } from '@/components/custom/visualization/ComboChart';
import gstFilings from '@/app/data/staticSnapshots/tarc/gst-filings.json';

// Turnover / tax paid / value addition are NOT in the TARC workbook - every
// sheet of all three xlsx files was searched and only filing dates + status
// exist (see Annexure - GST). These amounts are therefore placeholders keyed to
// the real GSTR-3B periods.
// TODO: swap for the real source; only this map needs to change.
const AMOUNTS: Record<string, { turnover: number; taxPaid: number }> = {
  'Jul 2025': { turnover: 3.9, taxPaid: 0.24 }, 'Aug 2025': { turnover: 4.05, taxPaid: 0.33 },
  'Sep 2025': { turnover: 3.6, taxPaid: 0.32 }, 'Oct 2025': { turnover: 4.55, taxPaid: 0.38 },
  'Nov 2025': { turnover: 4.25, taxPaid: 0.42 }, 'Dec 2025': { turnover: 5.0, taxPaid: 0.53 },
  'Jan 2026': { turnover: 4.0, taxPaid: 0.44 }, 'Feb 2026': { turnover: 3.95, taxPaid: 0.38 },
  'Mar 2026': { turnover: 4.8, taxPaid: 0.42 }, 'Apr 2026': { turnover: 4.15, taxPaid: 0.38 },
  'May 2026': { turnover: 3.9, taxPaid: 0.38 }, 'Jun 2026': { turnover: 4.25, taxPaid: 0.42 },
};

const GstFilingTrendSection: FC = () => {
  const data = useMemo(() => {
    const periods = (gstFilings as any[])
      .filter((f) => f.returnType === 'GSTR3B' && AMOUNTS[f.period])
      .map((f) => f.period);
    const unique = Array.from(new Set(periods)).reverse();

    return unique.map((period) => {
      const { turnover, taxPaid } = AMOUNTS[period];
      return {
        period: period.replace(' 20', "'"),
        Turnover: turnover,
        'Tax Paid': taxPaid,
        'Value Addition %': Number(((taxPaid / turnover) * 100).toFixed(1)),
      };
    });
  }, []);

  return (
    <div className="mt-10 min-w-0">
      <SectionHeaderWithFlags
        title="GST Filing & Performance Trend"
        icon={BarChart3}
        iconColorClass="text-blue-700"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
        titleRightElement={
          <BubbleTag text="Regular taxpayer · monthly · GSTR-3B" color="grayTextWhiteBg" withBorder={true} />
        }
      />

      <div className="mt-2">
        <ComboChart
          data={data}
          xAxisKey="period"
          height={360}
          stacking="normal"
          leftYAxisLabel="Amount (₹ Cr)"
          rightYAxisLabel="Value Addition %"
          getYAxisDomain={() => [0, 'auto'] as any}
          yAxisKeys={[
            { key: 'Turnover', type: 'bar', color: '#1e4d6b' },
            { key: 'Tax Paid', type: 'bar', color: '#3b9fd8' },
            { key: 'Value Addition %', type: 'line', color: '#f59e0b', yAxisId: 'right' },
          ]}
        />
      </div>
    </div>
  );
};

export default GstFilingTrendSection;
