'use client';

import { FC, useMemo, useState } from 'react';
import { Wallet, Landmark, TrendingUp, CreditCard, ExternalLink } from 'lucide-react';
import { CustomTableView, Column } from '@/components/custom/CustomTableView';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { SingleSelectFilter } from '@/components/custom/SingleSelectFilter';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import loanExposureData from '@/app/data/tarc_rerun_peer_comparison/loan_exposure.json';

type StatusFilter = 'All' | 'Active' | 'Closed';

const formatCrore = (value: number | null | undefined) =>
  value == null ? '—' : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;

const StatCard: FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-full bg-blue-50/70 border border-blue-100/50 flex items-center justify-center text-blue-600 shadow-inner flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-500 tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-xl font-bold text-gray-900 leading-none">{value}</span>
        {sub && <span className="text-[11px] text-gray-400 font-normal truncate">{sub}</span>}
      </div>
    </div>
  </div>
);

const TIMELINE_COLORS: Record<string, string> = {
  Creation: 'bg-blue-400',
  Modification: 'bg-amber-300',
  Satisfaction: 'bg-green-300',
};

const RepaymentTimeline: FC<{ timeline: { date: string; status: string; chargeId: number }[] }> = ({ timeline }) => {
  if (!timeline.length) return <span className="text-gray-400 text-xs">—</span>;
  // Charge events arrive unordered; read left-to-right in date order.
  const sorted = [...timeline].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return (
    <div className="flex flex-wrap items-center gap-0.5 py-1 min-w-0">
      {sorted.map((e, idx) => {
        const color = TIMELINE_COLORS[e.status] || 'bg-gray-300';
        const tooltipText = `Charge: ${e.chargeId}\nEvent: ${e.status}\nDate: ${e.date}`;
        return (
          <div key={idx} className="relative group inline-block">
            <div className={`${color} w-5 h-5 flex-shrink-0 cursor-pointer`} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-2 py-1.5 whitespace-pre z-50 pointer-events-none shadow-lg min-w-[140px] text-center border border-gray-700/50">
              {tooltipText}
              <div className="w-1.5 h-1.5 bg-gray-900 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-gray-700/50" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LoanExposureTab: FC = () => {
  const artifactStore = useArtifactStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [lenderFilter, setLenderFilter] = useState<string>('All');

  const loans = loanExposureData.loans;
  const companyWide = loanExposureData.companyWide;

  const openLoanArtifact = (loan: (typeof loans)[number]) => {
    const artifactId = `loan-${loan.lender.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    artifactStore.addTab({
      id: artifactId,
      title: loan.lender,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader title={loan.lender} />
          <ArtifactSectionCollapsible title="Details" defaultOpen>
            <CustomTableView
              columns={[
                { key: 'field', header: 'Field' },
                { key: 'value', header: 'Value', align: 'right' },
              ]}
              data={[
                { field: 'Status', value: loan.status },
                { field: 'Product', value: loan.product },
                { field: 'Start Date', value: loan.startDate },
                { field: 'Secured Amount', value: formatCrore(loan.securedAmountCr) },
                { field: 'Interest Rate', value: loan.interestRate || '—' },
                { field: 'Terms of Payment', value: loan.termsOfPayment || '—' },
                { field: 'Assets', value: String(loan.assetsCount) },
                { field: 'Satisfied', value: String(loan.satisfiedCount) },
                { field: 'Not Satisfied', value: String(loan.notSatisfiedCount) },
              ]}
              className="w-full"
            />
          </ArtifactSectionCollapsible>

          <ArtifactSectionCollapsible title={`Charges (${loan.charges.length})`} defaultOpen>
            <CustomTableView
              columns={[
                { key: 'chargeId', header: 'Charge ID' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (v: string) => <BubbleTag text={v} color={v === 'Open' ? 'green' : 'gray'} />,
                },
                { key: 'amountCr', header: 'Amount', align: 'right', render: (v: number | null) => formatCrore(v) },
                { key: 'interestRate', header: 'Interest Rate', render: (v: string | null) => v || '—' },
                { key: 'instrumentDescription', header: 'Instrument', render: (v: string | null) => v || '—' },
              ]}
              data={loan.charges}
              className="w-full"
            />
          </ArtifactSectionCollapsible>

          <ArtifactSectionCollapsible title={`Event History (${loan.timeline.length})`} defaultOpen>
            <CustomTableView
              columns={[
                { key: 'chargeId', header: 'Charge ID' },
                { key: 'date', header: 'Date' },
                {
                  key: 'status',
                  header: 'Event',
                  render: (v: string) => (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        v === 'Creation' ? 'bg-blue-50 text-blue-700' : v === 'Modification' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {v}
                    </span>
                  ),
                },
              ]}
              data={loan.timeline}
              className="w-full"
            />
          </ArtifactSectionCollapsible>

          {loan.charges.some((c) => c.propertyParticulars || c.extentAndOperation || c.otherTerms) && (
            <ArtifactSectionCollapsible title="Security Detail" defaultOpen={false}>
              <div className="flex flex-col gap-4">
                {loan.charges
                  .filter((c) => c.propertyParticulars || c.extentAndOperation || c.otherTerms)
                  .map((c) => (
                    <div key={c.chargeId} className="border-b pb-3 last:border-b-0">
                      <p className="text-sm font-semibold text-gray-800 mb-1">Charge {c.chargeId}</p>
                      {c.propertyParticulars && (
                        <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Property Particulars:</span> {c.propertyParticulars}</p>
                      )}
                      {c.extentAndOperation && (
                        <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Extent & Operation:</span> {c.extentAndOperation}</p>
                      )}
                      {c.otherTerms && (
                        <p className="text-xs text-gray-600"><span className="font-medium">Other Terms:</span> {c.otherTerms}</p>
                      )}
                    </div>
                  ))}
              </div>
            </ArtifactSectionCollapsible>
          )}
        </div>
      ),
    });
  };

  // counts shown as chips beside each lender option
  const lenderCounts = useMemo(() => {
    const counts: Record<string, number> = { All: loans.length };
    loans.forEach((l: any) => {
      if (l?.lender) counts[l.lender] = (counts[l.lender] || 0) + 1;
    });
    return counts;
  }, [loans]);

  const lenders = useMemo(() => Array.from(new Set(loans.map((l) => l.lender))).sort(), [loans]);

  const activeCount = loans.filter((l) => l.status === 'Active').length;
  const closedCount = loans.filter((l) => l.status === 'Closed').length;
  const totalSanctioned = loans.reduce((sum, l) => sum + (l.securedAmountCr || 0), 0);

  const filteredLoans = loans.filter((l) => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (lenderFilter !== 'All' && l.lender !== lenderFilter) return false;
    return true;
  });

  const columns: Column[] = [
    {
      key: 'status',
      width: '9%',
      header: 'Status',
      render: (v: string) => <BubbleTag text={v} color={v === 'Active' ? 'green' : 'red'} />,
    },
    { key: 'startDate', header: 'Start Date', width: '10%' },
    { key: 'lender', header: 'Lender', width: '16%', render: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'product', header: 'Product', width: '13%', render: (v: string) => <BubbleTag text={v} color="blue" /> },
    {
      key: 'securedAmountCr',
      width: '11%',
      header: 'Secured Amount',
      align: 'right',
      render: (v: number) => formatCrore(v),
    },
    {
      key: 'interestRate',
      header: 'Interest %',
      width: '9%',
      align: 'right',
      render: (v: string | null) => (v && v !== '-' ? v : '—'),
    },
    {
      key: 'timeline',
      width: '13%',
      header: 'Repayment Timeline',
      render: (v: { date: string; status: string; chargeId: number }[]) => <RepaymentTimeline timeline={v} />,
    },
    {
      key: 'collateral',
      width: '11%',
      header: 'Collateral',
      render: (_: any, row: any) => (
        <div className="text-xs text-gray-600 leading-tight">
          <div>{row.assetsCount} Asset{row.assetsCount !== 1 ? 's' : ''}</div>
          {row.satisfiedCount > 0 && <div className="text-green-600">{row.satisfiedCount} Satisfied</div>}
          {row.notSatisfiedCount > 0 && <div className="text-amber-600">{row.notSatisfiedCount} Not Satisfied</div>}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: '8%',
      align: 'right',
      render: (_: any, row: any) => (
        <button
          onClick={() => openLoanArtifact(row)}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="mt-4">
      <SectionHeaderWithFlags
        title="Loan Exposure"
        icon={Wallet}
        iconColorClass="text-blue-700"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
      />

      {/* Stat cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={<Wallet className="h-5 w-5 text-blue-600" />}
          label="Total Loans"
          value={String(loans.length)}
          sub={`${activeCount} active · ${closedCount} closed`}
        />
        <StatCard
          icon={<Landmark className="h-5 w-5 text-blue-600" />}
          label="Sanctioned Amount"
          value={formatCrore(totalSanctioned)}
          sub={`across ${lenders.length} lenders`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          label="Outstanding"
          value={formatCrore(companyWide.totalOutstandingBorrowingsCr)}
          sub={`total borrowings, ${loanExposureData.asOf}`}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-blue-600" />}
          label="Monthly EMI"
          value={formatCrore(companyWide.avgMonthlyFinanceCostCr)}
          sub="avg. interest servicing (FY25)"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-[220px] flex-shrink-0">
          <SingleSelectFilter
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Closed', value: 'Closed' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            optionCounts={{ All: loans.length, Active: activeCount, Closed: closedCount }}
          />
        </div>
        <div className="flex-1 min-w-[200px] max-w-[420px]">
          <SingleSelectFilter
            options={[
              { label: 'All Lenders', value: 'All' },
              ...lenders.map((l) => ({ label: l, value: l })),
            ]}
            value={lenderFilter}
            onChange={setLenderFilter}
            optionCounts={lenderCounts}
          />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-shrink-0">
          <span className="flex items-center gap-1"><span className="h-3 w-3 bg-blue-400 inline-block" /> Creation</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 bg-amber-300 inline-block" /> Modification</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 bg-green-300 inline-block" /> Satisfaction</span>
        </div>
      </div>

      <CustomTableView columns={columns} data={filteredLoans} className="w-full" initialRowLimit={10} />
    </div>
  );
};

export default LoanExposureTab;
