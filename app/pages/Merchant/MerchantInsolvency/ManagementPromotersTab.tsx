'use client';

import { FC, useMemo } from 'react';
import { Users, Download, ExternalLink } from 'lucide-react';
import { CustomTableView, Column } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import managementData from '@/app/data/tarc_rerun_peer_comparison/management_promoters.json';
// management_promoters.json carries no asOf of its own; the sibling exports in
// the same MCA snapshot share one reporting date, so take it from there rather
// than hardcoding a date here.
import capitalStructureData from '@/app/data/tarc_rerun_peer_comparison/capital_structure.json';
import { formatAsOf } from '@/app/utils/formatAsOf';



const ManagementPromotersTab: FC = () => {
  const artifactStore = useArtifactStore();

  const people = managementData.people;




  const downloadCsv = () => {
    const header = ['Name', 'Role', 'DIN', 'Appointment Date', 'Status', 'Other Directorships', 'Business Interests'];
    const rows = people.map((p) => [
      p.name,
      p.role,
      p.din || '',
      p.appointmentDate || '',
      p.status,
      p.otherDirectorshipsCount,
      p.businessInterestsCount,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'management_and_promoters.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPersonArtifact = (person: (typeof people)[number]) => {
    const artifactId = `person-${person.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    artifactStore.addTab({
      id: artifactId,
      title: person.name,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader title={person.name} />
          <ArtifactSectionCollapsible title="Details" defaultOpen>
            <CustomTableView
              columns={[
                { key: 'field', header: 'Field' },
                {
                  key: 'value',
                  header: 'Value',
                  align: 'right',
                  render: (v: string, row: any) => (row.field === 'Flags' ? <span className="text-red-600">{v}</span> : v),
                },
              ]}
              data={[
                { field: 'Role', value: person.role },
                { field: 'DIN', value: person.din || '—' },
                { field: 'Appointment Date', value: person.appointmentDate || '—' },
                { field: 'Status', value: person.status },
                ...(person.flags ? [{ field: 'Flags', value: person.flags }] : []),
              ]}
              className="w-full"
            />
          </ArtifactSectionCollapsible>

          <ArtifactSectionCollapsible title={`Other Directorships (${person.otherDirectorshipsCount})`} defaultOpen={person.otherDirectorshipsCount > 0}>
            {person.otherDirectorships.length === 0 ? (
              <div className="text-sm text-gray-500">No other directorships on record.</div>
            ) : (
              <CustomTableView
                columns={[
                  { key: 'company', header: 'Company', render: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
                  { key: 'cin', header: 'CIN / LLPIN' },
                  { key: 'type', header: 'Type' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (v: string) => <BubbleTag text={v} color={v === 'Active' ? 'green' : 'gray'} />,
                  },
                  { key: 'incorporationDate', header: 'Incorporated' },
                ]}
                data={person.otherDirectorships}
                className="w-full"
                initialRowLimit={5}
              />
            )}
          </ArtifactSectionCollapsible>

          <ArtifactSectionCollapsible title={`Business Interests (${person.businessInterestsCount})`} defaultOpen={person.businessInterestsCount > 0}>
            {person.businessInterests.length === 0 ? (
              <div className="text-sm text-gray-500">No proprietorships on record.</div>
            ) : (
              <CustomTableView
                columns={[
                  { key: 'legalName', header: 'Legal Name', render: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (v: string) => <BubbleTag text={v} color={v === 'Active' ? 'green' : 'gray'} />,
                  },
                ]}
                data={person.businessInterests}
                className="w-full"
                initialRowLimit={5}
              />
            )}
          </ArtifactSectionCollapsible>
        </div>
      ),
    });
  };

  // Shareholding is not on the management export; join it from the capital
  // structure shareholder list by name. Anyone not listed holds nothing.
  const shareholdingByName = useMemo(() => {
    const map = new Map<string, number>();
    (capitalStructureData.shareholders || []).forEach((sh: any) => {
      if (sh?.name) map.set(String(sh.name).trim().toUpperCase(), Number(sh.shareholdingPct) || 0);
    });
    return map;
  }, []);

  const columns: Column[] = [
    {
      key: 'name',
      header: 'Name',
      render: (v: string) => <span className="text-blue-700 font-semibold">{v}</span>,
    },
    { key: 'role', header: 'Role' },
    { key: 'din', header: 'DIN', render: (v: string | null) => v || '—' },
    {
      key: 'name',
      header: 'Shareholding (%)',
      render: (_: any, row: any) =>
        `${(shareholdingByName.get(String(row.name || '').trim().toUpperCase()) ?? 0).toFixed(2)}%`,
    },
    {
      key: 'otherDirectorshipsCount',
      header: 'Other Directorships',
      render: (v: number) => (v > 0 ? `${v} entities` : '—'),
    },
    {
      key: 'businessInterestsCount',
      header: 'Business Interests',
      render: (v: number) => (v > 0 ? `${v} proprietorship${v > 1 ? 's' : ''}` : '—'),
    },
    {
      key: 'action',
      header: 'Details',
      render: (_: any, row: any) => (
        <button
          onClick={() => openPersonArtifact(row)}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <p className="text-lg font-semibold text-blue-700">Management, Promoters &amp; Linkages</p>
          {capitalStructureData.asOf && (
            <BubbleTag
              text={formatAsOf(capitalStructureData.asOf)}
              color="grayTextWhiteBg"
              withBorder={true}
            />
          )}
        </div>
          <button
            onClick={downloadCsv}
            title="Export management details"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-blue-600" />
            <span>Export CSV</span>
        </button>
      </div>
      <div className="w-full border-b border-gray-200 mt-2 mb-4" />

      <CustomTableView columns={columns} data={people} className="w-full" initialRowLimit={5} />
    </div>
  );
};

export default ManagementPromotersTab;
