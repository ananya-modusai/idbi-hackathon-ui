'use client';

import { FC, useState } from 'react';
import { Landmark, Download, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { formatAsOf } from '@/app/utils/formatAsOf';
import capitalStructureData from '@/app/data/tarc_rerun_peer_comparison/capital_structure.json';

interface BreakdownRow {
  category: string;
  numberOfShares: number;
  percentage: number;
}

// The export carries MCA's numbered category strings; the spec wants them split
// into a category and a subcategory.
const CATEGORY_MAP: Record<string, { category: string; subcategory: string }> = {
  '(i) Indian': { category: 'Individual / HUF', subcategory: 'Indian' },
  '(ii) Non-resident Indian (others)': {
    category: 'Individual / HUF',
    subcategory: 'Non-resident Indian',
  },
  '3. Insurance companies': { category: 'Insurance Company', subcategory: '—' },
  '5. Financial institutions': { category: 'Financial Institution', subcategory: '—' },
  '6. Foreign institutional investors': {
    category: 'Foreign Institutional Investor',
    subcategory: '—',
  },
  '7. Mutual Funds': { category: 'Mutual Fund', subcategory: '—' },
  '9. Body corporate (not mentioned above)': { category: 'Body Corporate', subcategory: '—' },
  '10. Others': { category: 'Others', subcategory: '—' },
};

const splitCategory = (raw: string) =>
  CATEGORY_MAP[raw] || { category: raw.replace(/^[\d(]+[).]?\s*/, ''), subcategory: '—' };

const CapitalStructureTab: FC = () => {
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [expandedPromoter, setExpandedPromoter] = useState(false);
  const [expandedPublic, setExpandedPublic] = useState(false);
  const { summary, promoterBreakdown, publicBreakdown } = capitalStructureData;

  const promoterSubtotal = {
    numberOfShares: promoterBreakdown.reduce((sum, r) => sum + r.numberOfShares, 0),
    percentage: promoterBreakdown.reduce((sum, r) => sum + r.percentage, 0),
  };
  const publicSubtotal = {
    numberOfShares: publicBreakdown.reduce((sum, r) => sum + r.numberOfShares, 0),
    percentage: publicBreakdown.reduce((sum, r) => sum + r.percentage, 0),
  };

  const downloadCsv = () => {
    const header = ['Category', 'Sub-category', 'Number of Shares', 'Shareholding'];
    const rows: (string | number)[][] = [
      ['Promoter', 'Subtotal', promoterSubtotal.numberOfShares, `${promoterSubtotal.percentage.toFixed(2)}%`],
      ...promoterBreakdown.map((r) => ['Promoter', r.category, r.numberOfShares, `${r.percentage}%`]),
      ['Public', 'Subtotal', publicSubtotal.numberOfShares, `${publicSubtotal.percentage.toFixed(2)}%`],
      ...publicBreakdown.map((r) => ['Public', r.category, r.numberOfShares, `${r.percentage}%`]),
      ['Total', '', summary.totalEquityShares, '100.00%'],
    ];
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shareholding_structure.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderChildRow = (group: string, row: BreakdownRow, key: string) => {
    const { category, subcategory } = splitCategory(row.category);
    return (
      <tr key={key} className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-2.5 text-sm text-gray-600">{group}</td>
        <td className="px-4 py-2.5 text-sm text-gray-700">{category}</td>
        <td className="px-4 py-2.5 text-sm text-gray-700">{subcategory}</td>
        <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{row.numberOfShares.toLocaleString('en-IN')}</td>
        <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{row.percentage.toFixed(2)}%</td>
      </tr>
    );
  };

  const renderParentRow = (
    label: string,
    subtotal: { numberOfShares: number; percentage: number },
    isExpanded: boolean,
    onToggle: () => void
  ) => (
    <tr
      onClick={onToggle}
      className="bg-blue-50/60 hover:bg-blue-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-2.5 text-sm font-semibold text-blue-700">
        <span className="inline-flex items-center gap-1.5">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {label} Subtotal
        </span>
      </td>
      <td className="px-4 py-2.5" />
      <td className="px-4 py-2.5" />
      <td className="px-4 py-2.5 text-sm font-semibold text-gray-800 text-right">{subtotal.numberOfShares.toLocaleString('en-IN')}</td>
      <td className="px-4 py-2.5 text-sm font-semibold text-gray-800 text-right">{subtotal.percentage.toFixed(2)}%</td>
    </tr>
  );

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-6 w-6 text-blue-600" />
          <p className="text-lg font-semibold text-blue-700">Capital Overview</p>
        </div>
        <button
          onClick={downloadCsv}
          title="Export shareholder details"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap"
        >
          <Download className="h-4 w-4 text-blue-600" />
          <span>Export CSV</span>
        </button>
      </div>
      <div className="w-full border-b border-gray-200 mt-2 mb-4" />

      <div className="mb-6">
        <KeyMetrics
          hardcodedMetrics={[
            { label: 'Authorised Capital', value: `₹${summary.authorisedCapitalCr.toFixed(2)} Cr`, icon: 'Landmark' },
            { label: 'Paid-up Capital', value: `₹${summary.paidUpCapitalCr.toFixed(2)} Cr`, icon: 'Banknote' },
            { label: 'Promoter Holding', value: `${summary.promoterHoldingPct}%`, icon: 'PieChart' },
            { label: 'Total Equity Shares', value: summary.totalEquityShares.toLocaleString('en-IN'), icon: 'FileText' },
          ]}
          isMetricsExpanded={isMetricsExpanded}
          setIsMetricsExpanded={setIsMetricsExpanded}
          showHeader={false}
          gridCols={4}
        />
      </div>

      <SectionHeaderWithFlags
        title="Shareholding Structure"
        icon={Users}
        iconColorClass="text-blue-600"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
        titleRightElement={
          capitalStructureData.asOf ? (
            <BubbleTag
              text={formatAsOf(capitalStructureData.asOf)}
              color="grayTextWhiteBg"
              withBorder={true}
            />
          ) : undefined
        }
      />
      <div className="mt-3">
        <div className="border rounded-md overflow-hidden shadow-sm w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[18%]">Ownership Group</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[24%]">Shareholder Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[24%]">Shareholder Subcategory</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-[18%]">Number of Shares</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-[16%]">Holding %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expandedPromoter && promoterBreakdown.map((r, i) => renderChildRow('Promoter', r, `promoter-${i}`))}
                {renderParentRow('Promoter', promoterSubtotal, expandedPromoter, () => setExpandedPromoter((v) => !v))}
                {expandedPublic && publicBreakdown.map((r, i) => renderChildRow('Public', r, `public-${i}`))}
                {renderParentRow('Public', publicSubtotal, expandedPublic, () => setExpandedPublic((v) => !v))}
                <tr className="bg-gray-100">
                  <td className="px-4 py-2.5 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-2.5" />
                  <td className="px-4 py-2.5" />
                  <td className="px-4 py-2.5 text-sm font-bold text-gray-900 text-right">{summary.totalEquityShares.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 text-sm font-bold text-gray-900 text-right">
                    {(promoterSubtotal.percentage + publicSubtotal.percentage).toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapitalStructureTab;
