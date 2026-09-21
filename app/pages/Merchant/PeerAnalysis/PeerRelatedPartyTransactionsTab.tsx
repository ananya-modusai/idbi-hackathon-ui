'use client';

import { FC, useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AlertCircle, Download, TrendingUp, TrendingDown, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { SingleSelectFilter } from '@/components/custom/SingleSelectFilter';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import rptDetailJson from '@/app/data/tarc_rerun_peer_comparison/related_party_transactions_detail.json';

// Real per-related-party breakdown from TARC's MCA "Related Party Transactions"
// filing (279 disclosed line items). Design ported from listing-compliance-ui's
// RPTStatement.tsx (Card/Table layout, Format/Year pill toggles, sticky first
// column, per-cell YoY badges, Export CSV) with the axes flipped: that
// reference has transaction type as rows and companies as columns; here each
// related party is a row and Revenue/Expense/Others are columns, pivoted from
// the 134 raw type-specific rows down to 76 unique parties. All filters,
// search, export and the row-level drawer are kept as they were.

type NumberFormatMode = '₹' | '₹L' | '₹M' | '₹Cr';
type RptType = 'Revenue' | 'Expense' | 'Others';

const RPT_COLUMNS: { key: RptType; label: string }[] = [
  { key: 'Revenue', label: 'Revenue' },
  { key: 'Expense', label: 'Expenses' },
  { key: 'Others', label: 'Others' },
];

const rptData = rptDetailJson;

interface PartyRow {
  relatedParty: string;
  relationship: string;
  entityType: string;
  byYearByType: Partial<Record<RptType, Record<string, number | undefined>>>;
}

// Pivot the 134 (party, transactionType) rows into one row per unique party.
const partyRows: PartyRow[] = (() => {
  const map = new Map<string, PartyRow>();
  for (const t of rptData.transactions) {
    const key = `${t.relatedParty}__${t.relationship}__${t.entityType}`;
    if (!map.has(key)) {
      map.set(key, {
        relatedParty: t.relatedParty,
        relationship: t.relationship,
        entityType: t.entityType,
        byYearByType: {},
      });
    }
    map.get(key)!.byYearByType[t.transactionType as RptType] = t.byYear as unknown as Record<string, number | undefined>;
  }
  return Array.from(map.values());
})();

const PeerRelatedPartyTransactionsTab: FC = () => {
  const artifactStore = useArtifactStore();
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [numberFormat, setNumberFormat] = useState<NumberFormatMode>('₹Cr');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const ROW_LIMIT = 5;

  // counts shown as chips beside each relationship option
  const relationshipCounts = useMemo(() => {
    const counts: Record<string, number> = { All: rptData.transactions.length };
    rptData.transactions.forEach((t: any) => {
      if (t?.relationship) counts[t.relationship] = (counts[t.relationship] || 0) + 1;
    });
    return counts;
  }, []);

  const years = useMemo(() => [...rptData.years].sort((a, b) => parseInt(a) - parseInt(b)), []);

  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[years.length - 1]);
    }
  }, [years, selectedYear]);

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    if (value === 0) return '0';

    let displayValue = value;
    let suffix = '';

    switch (numberFormat) {
      case '₹L':
        displayValue = value / 100_000;
        suffix = ' L';
        break;
      case '₹M':
        displayValue = value / 1_000_000;
        suffix = ' M';
        break;
      case '₹Cr':
        // source amounts are already in Rs. Crore
        suffix = ' Cr';
        break;
      default:
        displayValue = value * 10_000_000;
        break;
    }

    const formatter = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: numberFormat === '₹' ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return `${formatter.format(displayValue)}${suffix}`;
  };

  const yearIdx = years.indexOf(selectedYear);
  const prevYear = yearIdx > 0 ? years[yearIdx - 1] : null;

  const calcYoY = (byYear: Record<string, number | undefined> | undefined): { pct: string; positive: boolean } | null => {
    if (!prevYear || !byYear) return null;
    const current = byYear[selectedYear];
    const prevVal = byYear[prevYear];
    if (current == null || !prevVal) return null;
    const pct = ((current - prevVal) / Math.abs(prevVal)) * 100;
    return { pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 };
  };

  const rowsForYear = useMemo(() => {
    return partyRows
      .filter((p) => RPT_COLUMNS.some((c) => p.byYearByType[c.key]?.[selectedYear] != null))
      .filter((p) => relationshipFilter === 'All' || p.relationship === relationshipFilter)
      .filter((p) => transactionTypeFilter === 'All' || p.byYearByType[transactionTypeFilter as RptType]?.[selectedYear] != null)
      .filter((p) => !search || p.relatedParty.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const totalA = RPT_COLUMNS.reduce((sum, c) => sum + (a.byYearByType[c.key]?.[selectedYear] ?? 0), 0);
        const totalB = RPT_COLUMNS.reduce((sum, c) => sum + (b.byYearByType[c.key]?.[selectedYear] ?? 0), 0);
        return totalB - totalA;
      });
  }, [selectedYear, relationshipFilter, transactionTypeFilter, search]);

  useEffect(() => {
    setShowAll(false);
  }, [selectedYear, relationshipFilter, transactionTypeFilter, search]);

  const visibleRows = showAll ? rowsForYear : rowsForYear.slice(0, ROW_LIMIT);

  const columnTotal = (key: RptType) =>
    rowsForYear.reduce((sum, p) => sum + (p.byYearByType[key]?.[selectedYear] ?? 0), 0);
  const grandTotal = RPT_COLUMNS.reduce((sum, c) => sum + columnTotal(c.key), 0);

  const handleExportCSV = () => {
    if (rowsForYear.length === 0) return;
    const header = ['Related Party', 'Relationship', ...RPT_COLUMNS.map((c) => `${c.label} (${selectedYear})`), 'Total'];
    const rows = rowsForYear.map((p) => {
      const values = RPT_COLUMNS.map((c) => p.byYearByType[c.key]?.[selectedYear] ?? 0);
      const total = values.reduce((s, v) => s + v, 0);
      return [p.relatedParty, p.relationship, ...values.map(String), String(total)];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RPT_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const openPartyArtifact = (p: PartyRow) => {
    const artifactId = `rpt-${p.relatedParty}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const latestYears = years.slice(-3);
    const typeRows = RPT_COLUMNS.filter((c) => p.byYearByType[c.key]);

    artifactStore.addTab({
      id: artifactId,
      title: p.relatedParty,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={
              <span className="inline-flex items-center gap-2">
                {p.relatedParty}
                <BubbleTag text={p.relationship} color="grayTextWhiteBg" withBorder={true} />
              </span>
            }
          />
          <ArtifactSectionCollapsible title="Transactions by Year (₹ Cr)" defaultOpen>
            <CustomTableView
              columns={[
                { key: 'type', header: 'Type' },
                ...latestYears.map((y) => ({
                  key: y,
                  header: y,
                  align: 'right' as const,
                  render: (v: number | undefined) => (v != null ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'),
                })),
              ]}
              data={typeRows.map((c) => ({
                type: c.label,
                ...Object.fromEntries(latestYears.map((y) => [y, p.byYearByType[c.key]?.[y]])),
              }))}
              className="w-full"
            />
          </ArtifactSectionCollapsible>
        </div>
      ),
    });
  };

  return (
    <div className="relative min-w-0">
      <div className="pb-2">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Format</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['₹', '₹L', '₹M', '₹Cr'] as NumberFormatMode[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setNumberFormat(opt)}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        numberFormat === opt ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {opt === '₹' ? 'Raw' : opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Select Year</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        selectedYear === year ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Type</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['All', ...rptData.transactionTypes].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTransactionTypeFilter(t)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                      transactionTypeFilter === t
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap self-end md:self-auto ml-auto flex-shrink-0"
            >
              <Download className="h-4 w-4 text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[260px] flex-shrink-0">
              <SingleSelectFilter
                options={[
                  { label: 'All Relationships', value: 'All' },
                  ...rptData.relationships.map((r) => ({ label: r, value: r })),
                ]}
                value={relationshipFilter}
                onChange={setRelationshipFilter}
                optionCounts={relationshipCounts}
              />
            </div>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search related party..."
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {rowsForYear.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200 my-4">
            <AlertCircle className="w-10 h-10 mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700">No RPT Data Available</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">No related party transactions found for {selectedYear} matching the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full border-b">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10 py-2 min-w-[240px]">Related Party</TableHead>
                  <TableHead className="py-2">Relationship</TableHead>
                  {RPT_COLUMNS.map((c) => (
                    <TableHead key={c.key} className="text-right py-2">{c.label}</TableHead>
                  ))}
                  <TableHead className="text-right py-2">Total</TableHead>
                  <TableHead className="py-2">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleRows.map((p, idx) => {
                  const rowTotal = RPT_COLUMNS.reduce((sum, c) => sum + (p.byYearByType[c.key]?.[selectedYear] ?? 0), 0);

                  return (
                    <TableRow key={`${p.relatedParty}-${idx}`}>
                      <TableCell className="sticky left-0 bg-white z-10 py-3 min-w-[240px]">
                        <span className="font-medium text-gray-800">{p.relatedParty}</span>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-600">{p.relationship}</TableCell>

                      {RPT_COLUMNS.map((c) => {
                        const byYear = p.byYearByType[c.key];
                        const value = byYear?.[selectedYear];
                        const yoy = calcYoY(byYear);

                        return (
                          <TableCell key={c.key} className={cn('text-right py-3', yoy ? (yoy.positive ? 'bg-green-50' : 'bg-red-50') : '')}>
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-gray-800">{formatNumber(value)}</span>
                              {yoy && (
                                <span
                                  className={cn(
                                    'text-xs italic font-medium flex items-center gap-0.5',
                                    yoy.positive ? 'text-green-700' : 'text-red-700'
                                  )}
                                >
                                  {yoy.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {yoy.pct}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-right py-3 font-semibold text-gray-900">{formatNumber(rowTotal)}</TableCell>

                      <TableCell className="py-3">
                        <button
                          onClick={() => openPartyArtifact(p)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                <TableRow className="bg-slate-50/80 border-t-2 border-slate-200">
                  <TableCell className="sticky left-0 bg-slate-50 z-10 py-3 font-bold text-gray-900">Total RPT</TableCell>
                  <TableCell className="py-3" />
                  {RPT_COLUMNS.map((c) => (
                    <TableCell key={c.key} className="text-right py-3 font-bold text-gray-900">{formatNumber(columnTotal(c.key))}</TableCell>
                  ))}
                  <TableCell className="text-right py-3 font-bold text-gray-900">{formatNumber(grandTotal)}</TableCell>
                  <TableCell className="py-3" />
                </TableRow>
              </TableBody>
            </Table>
            {rowsForYear.length > ROW_LIMIT && (
              <div className="flex justify-center py-3 border-t">
                <button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showAll ? (
                    <>Show Less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show More ({rowsForYear.length - ROW_LIMIT} more) <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerRelatedPartyTransactionsTab;
