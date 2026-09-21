'use client';

import { FC, useMemo, useState } from 'react';
import { Link2, Download, Search } from 'lucide-react';
import { CustomTableView, Column } from '@/components/custom/CustomTableView';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { SingleSelectFilter } from '@/components/custom/SingleSelectFilter';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import loanExposureData from '@/app/data/tarc_rerun_peer_comparison/loan_exposure.json';


const formatCrore = (value: number | null | undefined) =>
  value == null ? '—' : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;

interface ChargeEvent {
  date: string;
  status: string;
  amount: number | null;
  propertyType?: string | null;
}

interface FlatCharge {
  chargeId: number;
  lender: string;
  amountCr: number | null;
  status: string;
  createdOn: string | null;
  satisfiedOn: string | null;
  latestEvent: string | null;
  latestEventDate: string | null;
  securitySummary: string;
  events: ChargeEvent[];
  instrumentDescription: string | null;
  interestRate: string | null;
  termsOfPayment: string | null;
  propertyParticulars: string | null;
  extentAndOperation: string | null;
  otherTerms: string | null;
  filingDate: string | null;
}

// Charges are filed and amended per-charge, independent of the loan/lender
// grouping used in Credit Exposure. Flatten every charge across every loan into
// its own row (one row per Charge ID, not per event) so status, latest event
// and security detail can be inspected at the charge level as filed with MCA.
// The export only carries the full legal particulars ("First ranking pari passu
// charge created over land admeasuring 36 Bighas..."), which is unreadable in a
// table cell. These are the plain-language summaries for the charges on record;
// anything unlisted falls back to a phrase derived from the MCA property types.
const SECURITY_SUMMARY: Record<string, string> = {
  '101080145': 'Immovable property, pledged shares and hypothecated assets',
  '101077479': 'Property, pledged shares, inventory, receivables and book debts',
  '101014126': 'Pledged shares in TARC Projects and Echo Buildtech and identified escrow accounts',
  '100755546': 'Motor vehicle',
  '100620589': 'Motor vehicle',
  '100620588': 'Motor vehicle',
};

const deriveSecurity = (events: { propertyType?: string | null }[]): string => {
  const types = new Set<string>();
  for (const e of events) {
    for (const part of String(e.propertyType || '').split(',')) {
      // drop the parenthetical detail and the "Category - " prefix
      const cleaned = part.replace(/\([^)]*\)/g, '').split(' - ').pop()?.trim();
      if (cleaned && cleaned !== '-' && cleaned.toLowerCase() !== 'others') types.add(cleaned);
    }
  }
  const list = Array.from(types);
  if (list.length === 0) return '—';
  return list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
};

const flattenCharges = (): FlatCharge[] => {
  const rows: FlatCharge[] = [];
  for (const loan of loanExposureData.loans) {
    for (const charge of loan.charges) {
      const sortedEvents = [...charge.events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const creationEvent = sortedEvents.find((e) => e.status === 'Creation') || sortedEvents[0];
      const latestEvent = sortedEvents[sortedEvents.length - 1];

      const chargeKey = String(charge.chargeId).split('.')[0];
      const securitySummary = SECURITY_SUMMARY[chargeKey] || deriveSecurity(sortedEvents);

      rows.push({
        chargeId: charge.chargeId,
        lender: loan.lender,
        amountCr: charge.amountCr,
        status: charge.status,
        createdOn: creationEvent?.date || null,
        satisfiedOn: sortedEvents.find((e) => e.status === 'Satisfaction')?.date || null,
        latestEvent: latestEvent?.status || null,
        latestEventDate: latestEvent?.date || null,
        securitySummary,
        events: sortedEvents,
        instrumentDescription: charge.instrumentDescription != null ? String(charge.instrumentDescription) : null,
        interestRate: charge.interestRate != null ? String(charge.interestRate) : null,
        termsOfPayment: charge.termsOfPayment != null ? String(charge.termsOfPayment) : null,
        propertyParticulars: charge.propertyParticulars != null ? String(charge.propertyParticulars) : null,
        extentAndOperation: charge.extentAndOperation != null ? String(charge.extentAndOperation) : null,
        otherTerms: charge.otherTerms != null ? String(charge.otherTerms) : null,
        filingDate: charge.filingDate != null ? String(charge.filingDate) : null,
      });
    }
  }
  return rows;
};

const EVENT_COLOR: Record<string, string> = {
  Creation: 'bg-blue-50 text-blue-700',
  Modification: 'bg-amber-50 text-amber-700',
  Satisfaction: 'bg-green-50 text-green-700',
};

const SECURITY_SUMMARY_TRUNCATE_LENGTH = 80;

// Security text can run to full legal-description paragraphs, which broke the
// table's row height / column width when shown in full. Collapse it to a
// single truncated line with its own Show more/less toggle, independent of
// the section's row-level pagination.
const SecuritySummaryCell: FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);

  if (text === '—' || text.length <= SECURITY_SUMMARY_TRUNCATE_LENGTH) {
    return <span className="text-xs text-gray-600 block w-full min-w-0 break-words">{text}</span>;
  }

  return (
    <div className="w-full min-w-0">
      <span className={`text-xs text-gray-600 block ${expanded ? '' : 'truncate'}`}>{text}</span>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="text-xs font-medium text-blue-600 hover:text-blue-700 mt-0.5"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
};

const ChargesTab: FC = () => {
  const artifactStore = useArtifactStore();
  const [lenderFilter, setLenderFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'Open' | 'Satisfied'>('Open');

  const allCharges = useMemo(() => flattenCharges(), []);
  // counts shown as chips beside each charge-holder option
  const lenderCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allCharges.length };
    allCharges.forEach((c: any) => {
      if (c?.lender) counts[c.lender] = (counts[c.lender] || 0) + 1;
    });
    return counts;
  }, [allCharges]);

  const lenders = useMemo(() => Array.from(new Set(allCharges.map((c) => c.lender))).sort(), [allCharges]);

  const filteredCharges = useMemo(() => {
    return allCharges
      .filter((c) => lenderFilter === 'All' || c.lender === lenderFilter)
      .filter((c) => !search || c.lender.toLowerCase().includes(search.toLowerCase()) || String(c.chargeId).includes(search));
  }, [allCharges, lenderFilter, search]);

  const downloadCsv = () => {
    const header = ['Charge Holder', 'Charge ID', 'Amount (Cr)', 'Status', 'Created On', 'Latest Event', 'Latest Event Date', 'Security Summary'];
    const rows = filteredCharges.map((c) => [
      c.lender,
      c.chargeId,
      c.amountCr ?? '',
      c.status,
      c.createdOn || '',
      c.latestEvent || '',
      c.latestEventDate || '',
      c.securitySummary,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'charges.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openChargeArtifact = (charge: FlatCharge) => {
    const artifactId = `charge-${charge.chargeId}`;
    artifactStore.addTab({
      id: artifactId,
      title: `Charge ${charge.chargeId}`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader title={`Charge ${charge.chargeId} — ${charge.lender}`} />
          <ArtifactSectionCollapsible title="Details" defaultOpen>
            <CustomTableView
              columns={[
                { key: 'field', header: 'Field' },
                { key: 'value', header: 'Value', align: 'right' },
              ]}
              data={[
                { field: 'Charge ID', value: String(charge.chargeId) },
                { field: 'Charge Holder', value: charge.lender },
                { field: 'Amount', value: formatCrore(charge.amountCr) },
                { field: 'Status', value: charge.status },
                { field: 'Filing Date', value: charge.filingDate || '—' },
                { field: 'Interest Rate', value: charge.interestRate || '—' },
                { field: 'Terms of Payment', value: charge.termsOfPayment || '—' },
                { field: 'Instrument Description', value: charge.instrumentDescription || '—' },
              ]}
              className="w-full"
            />
          </ArtifactSectionCollapsible>

          <ArtifactSectionCollapsible title={`Event History (${charge.events.length})`} defaultOpen>
            <CustomTableView
              columns={[
                { key: 'date', header: 'Date' },
                {
                  key: 'status',
                  header: 'Event',
                  render: (v: string) => (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${EVENT_COLOR[v] || 'bg-gray-50 text-gray-600'}`}>{v}</span>
                  ),
                },
                { key: 'amount', header: 'Amount', align: 'right', render: (v: number | null) => formatCrore(v) },
                { key: 'propertyType', header: 'Property Type', render: (v: string | null) => v || '—' },
              ]}
              data={charge.events}
              className="w-full"
            />
          </ArtifactSectionCollapsible>

          {(charge.propertyParticulars || charge.extentAndOperation || charge.otherTerms) && (
            <ArtifactSectionCollapsible title="Security Detail" defaultOpen={false}>
              <div className="flex flex-col gap-2">
                {charge.propertyParticulars && (
                  <p className="text-xs text-gray-600"><span className="font-medium">Property Particulars:</span> {charge.propertyParticulars}</p>
                )}
                {charge.extentAndOperation && (
                  <p className="text-xs text-gray-600"><span className="font-medium">Extent & Operation:</span> {charge.extentAndOperation}</p>
                )}
                {charge.otherTerms && (
                  <p className="text-xs text-gray-600"><span className="font-medium">Other Terms:</span> {charge.otherTerms}</p>
                )}
              </div>
            </ArtifactSectionCollapsible>
          )}
        </div>
      ),
    });
  };

  // newest first: open charges by creation, satisfied by satisfaction date
  const byDateDesc = (key: 'createdOn' | 'satisfiedOn') => (a: any, b: any) => {
    const ta = a[key] ? new Date(a[key]).getTime() : 0;
    const tb = b[key] ? new Date(b[key]).getTime() : 0;
    return tb - ta;
  };

  const openCharges = useMemo(
    () => filteredCharges.filter((c) => c.status === 'Open').sort(byDateDesc('createdOn')),
    [filteredCharges]
  );
  const satisfiedCharges = useMemo(
    () => filteredCharges.filter((c) => c.status !== 'Open').sort(byDateDesc('satisfiedOn')),
    [filteredCharges]
  );

  const amountCol = {
    key: 'amountCr',
    header: 'Registered Charge Amount (₹ Cr)',
    align: 'center' as const,
    render: (v: number | null, row: any) => {
      if (typeof v !== 'number') return '—';
      const fmt = (n: number) =>
        n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      // a Modification event can restate the registered amount
      const modified = (row.events || []).find(
        (e: any) => e.status === 'Modification' && typeof e.amount === 'number' && e.amount !== v
      );
      return modified ? `${fmt(v)} at creation; modified to ${fmt(modified.amount)}` : fmt(v);
    },
  };
  const idCol = {
    key: 'chargeId',
    header: 'Charge ID',
    render: (v: any, row: any) => (
      <button
        onClick={() => openChargeArtifact(row)}
        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
      >
        {v ? String(v).split('.')[0] : '—'}
      </button>
    ),
  };
  const holderCol = { key: 'lender', header: 'Charge Holder' };

  const openColumns: Column[] = [
    { ...idCol, width: '12%' },
    { ...holderCol, width: '18%' },
    { ...amountCol, width: '16%' },
    { key: 'createdOn', header: 'Created On', width: '12%', render: (v: string | null) => v || '—' },
    {
      key: 'latestEvent',
      header: 'Latest Event',
      width: '16%',
      render: (v: string | null, row: any) => {
        if (!v) return '—';
        const verb = v === 'Creation' ? 'Created' : v === 'Modification' ? 'Modified' : v;
        return row.latestEventDate ? `${verb} · ${row.latestEventDate}` : verb;
      },
    },
    { key: 'interestRate', header: 'Interest Rate', width: '10%', render: (v: string | null) => v || '—' },
    { key: 'securitySummary', header: 'Security', width: '16%', render: (v: string) => <SecuritySummaryCell text={v} /> },
  ];

  const satisfiedColumns: Column[] = [
    { ...idCol, width: '16%' },
    { ...holderCol, width: '30%' },
    { ...amountCol, width: '22%' },
    { key: 'createdOn', header: 'Created On', width: '16%', render: (v: string | null) => v || '—' },
    { key: 'satisfiedOn', header: 'Satisfied On', width: '16%', render: (v: string | null) => v || '—' },
  ];



  return (
    <div className="mt-10 min-w-0">
      <SectionHeaderWithFlags
        title="Registered Charge &amp; Security"
        icon={Link2}
        iconColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
        rightActions={
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {([
                { value: 'Open' as const, label: `Open Charges (${openCharges.length})` },
                { value: 'Satisfied' as const, label: `Satisfied Charges (${satisfiedCharges.length})` },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); setView(opt.value); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    view === opt.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
            onClick={downloadCsv}
            title="Export charges"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4 text-blue-600" />
            <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* filter row sits below the header, like Related Party Transactions */}
      <div className="flex flex-wrap items-center gap-3 mt-3 mb-4">
        <div className="flex-1 min-w-[200px] max-w-[420px]">
          <SingleSelectFilter
            options={[
              { label: 'All Charge Holders', value: 'All' },
              ...lenders.map((l) => ({ label: l, value: l })),
            ]}
            value={lenderFilter}
            onChange={setLenderFilter}
            optionCounts={lenderCounts}
          />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search charges..."
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {view === 'Open' ? (
        <CustomTableView columns={openColumns} data={openCharges} className="w-full" initialRowLimit={10} />
      ) : (
        <CustomTableView columns={satisfiedColumns} data={satisfiedCharges} className="w-full" initialRowLimit={10} />
      )}
    </div>
  );
};

export default ChargesTab;
