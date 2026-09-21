'use client';

import { FC, useMemo, useState } from 'react';
import { Building2, Download, Search, Info } from 'lucide-react';
import { CustomTableView, Column } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import groupCompaniesData from '@/app/data/tarc_rerun_peer_comparison/group_companies.json';

type FilterType = 'All' | 'Subsidiary' | 'WithCharges';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'All' },
  { label: 'Subsidiaries', value: 'Subsidiary' },
  { label: 'With Charges', value: 'WithCharges' },
];

const formatCrore = (value: number | null | undefined) =>
  value == null ? '—' : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;

const formatChargesValue = (value: number | null | undefined) =>
  value == null ? '—' : value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });


const GroupCompaniesTab: FC = () => {
  const artifactStore = useArtifactStore();
  const [filter, setFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');

  const companies = groupCompaniesData.companies;

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (filter === 'Subsidiary' && c.relationship !== 'Subsidiary') return false;
      if (filter === 'WithCharges' && !(c.chargesCr && c.chargesCr > 0)) return false;
      if (search && !c.company.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [companies, filter, search]);

  const downloadCsv = () => {
    const header = ['Company', 'Relationship', 'Ownership', 'Status', 'Active Compliance', 'Paid-up Capital', 'Registered Charges (₹ Cr)'];
    const rows = filteredCompanies.map((c) => [
      c.company,
      c.relationship,
      c.ownershipPct != null ? `${c.ownershipPct}%` : '',
      c.status,
      c.activeCompliance,
      c.paidUpCapitalCr ?? '',
      c.chargesCr ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'group_companies.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openCompanyArtifact = (company: (typeof companies)[number]) => {
    const artifactId = `group-company-${company.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    artifactStore.addTab({
      id: artifactId,
      title: company.company,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader title={company.company} />
          <ArtifactSectionCollapsible title="Details" defaultOpen>
            <CustomTableView
              columns={[
                { key: 'field', header: 'Field' },
                { key: 'value', header: 'Value', align: 'right' },
              ]}
              data={[
                { field: 'Relationship', value: company.relationship },
                { field: 'Corporate Type', value: company.corporateType },
                { field: 'Ownership', value: company.ownershipPct != null ? `${company.ownershipPct}%` : '—' },
                { field: 'Status', value: company.status },
                { field: 'Active Compliance', value: company.activeCompliance },
                { field: 'Paid-up Capital', value: formatCrore(company.paidUpCapitalCr) },
                { field: 'Registered Charges (₹ Cr)', value: formatChargesValue(company.chargesCr) },
                { field: 'Country / City', value: company.countryCity || '—' },
                { field: 'Incorporated', value: company.incorporationDate || '—' },
                ...(company.remarks ? [{ field: 'Remarks', value: company.remarks }] : []),
              ]}
              className="w-full"
            />
          </ArtifactSectionCollapsible>
        </div>
      ),
    });
  };

  const columns: Column[] = [
    {
      key: 'company',
      header: 'Company Name',
      width: '32%',
      // spec has no Action column, so the name carries the artifact drill-in
      render: (v: string, row: any) => (
        <button
          onClick={() => openCompanyArtifact(row)}
          className="text-blue-700 font-semibold hover:text-blue-800 hover:underline text-left"
        >
          {v}
        </button>
      ),
    },
    { key: 'relationship', header: 'Relationship', width: '15%' },
    {
      key: 'ownershipPct',
      header: 'Ownership (%)',
      width: '14%',
      align: 'center',
      render: (v: number | null) => (v != null ? `${v}%` : '—'),
    },
    {
      key: 'chargesCr',
      header: (
        <span className="inline-flex items-center gap-1">
          Registered Charges (₹ Cr)
          <span
            title="Total value of charges registered against the entity, based on available corporate records."
            className="cursor-help"
          >
            <Info className="h-3.5 w-3.5 text-gray-400" />
          </span>
        </span>
      ),
      width: '24%',
      align: 'center',
      render: (v: number | null) => formatChargesValue(v),
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (v: string) => <BubbleTag text={v} color={v === 'Active' ? 'green' : 'gray'} />,
    },
  ];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <p className="text-lg font-semibold text-blue-700">Group Companies</p>
        </div>
          <button
            onClick={downloadCsv}
            title="Export group companies"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-blue-600" />
            <span>Export CSV</span>
        </button>
      </div>
      <div className="w-full border-b border-gray-200 mt-2 mb-4" />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Show</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === f.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search group company..."
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
      </div>


      <CustomTableView columns={columns} data={filteredCompanies} className="w-full" initialRowLimit={5} />
    </div>
  );
};

export default GroupCompaniesTab;
