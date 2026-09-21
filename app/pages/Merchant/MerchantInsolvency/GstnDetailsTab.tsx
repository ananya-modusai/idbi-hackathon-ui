'use client';

import { FC, useState } from 'react';
import { FileText } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { CustomTableView, Column } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import gstnDetailsData from '@/app/data/staticSnapshots/tarc/gstn-details.json';

// Ported from the underwriting product's GSTN Details section
// (InvMerchantOverviewTab.tsx), fed from the same investigation-service
// GSTN_DETAILS step, fetched live for TARC and frozen as a static snapshot.

const formatDate = (v: string | null | undefined) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v.split('T')[0] || v;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface HsnEntry {
  code: string;
  description: string;
}

const GstnDetailsTab: FC = () => {
  // Codes open a dialog listing each code against its description, so the
  // table cell stays compact without losing the descriptive text.
  const [hsnDialog, setHsnDialog] = useState<{ gstin: string; entries: HsnEntry[] } | null>(null);

  const records = gstnDetailsData.gstn_records || [];

  const tableData = records.map((record: any, idx: number) => {
    // legal_name only exists on the enrichment payload, not on `details`
    const online = record.raw?.enrichment_details?.online_provider?.details;
    const merchantName = online?.legal_name?.value || record.details?.legal_name || '';
    const gstin = record.gstin || '';
    const pan = record.details?.pan || '';
    const registrationDate = record.details?.registration_date || '';
    const status = record.details?.status || '';
    const hsnDetails = record.hsn_details || [];
    const sources = record.discovery?.paths
      ? Array.from(
          new Set(
            record.discovery.paths
              .map((p: any) => p.source)
              .filter(Boolean)
              .filter((s: string) => s.toLowerCase() !== 'payu')
              .map((s: string) => (s.toLowerCase() === 'probe' ? 'MCA' : s))
          )
        )
      : [];

    return {
      key: gstin || String(idx),
      merchantName,
      gstin,
      pan,
      registrationDate,
      status,
      hsnDetails,
      sources,
    };
  });

  const columns: Column[] = [
    {
      key: 'merchantName',
      header: 'Merchant Name',
      width: '18%',
      render: (v: string) => <span className="font-semibold text-blue-600">{v || '—'}</span>,
    },
    {
      key: 'gstin',
      header: 'GSTN',
      width: '16%',
      render: (v: string) => <span className="font-semibold text-blue-600">{v || '—'}</span>,
    },
    { key: 'pan', header: 'PAN', width: '12%', render: (v: string) => <span className="text-gray-700 font-medium">{v || '—'}</span> },
    {
      key: 'registrationDate',
      header: 'Reg. Date',
      width: '12%',
      render: (v: string) => formatDate(v),
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (v: string) => (v ? <BubbleTag text={v} color={v.toLowerCase() === 'active' ? 'green' : 'red'} withBorder /> : '—'),
    },
    {
      key: 'hsnDetails',
      header: 'HSN / SAC Codes',
      width: '22%',
      render: (v: any[], row: Record<string, any>) => {
        const entries: HsnEntry[] = (v || [])
          .map((hsn) => ({
            code: hsn.hsncd || hsn.saccd || '',
            description: hsn.gdes || hsn.sdes || '',
          }))
          .filter((e) => e.code || e.description);
        if (entries.length === 0) return <span className="text-gray-400">—</span>;

        const open = () => setHsnDialog({ gstin: row.gstin || '', entries });
        const shown = entries.slice(0, 4);
        const rest = entries.length - shown.length;

        return (
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {shown.map((e, idx) => (
              <button
                key={idx}
                type="button"
                onClick={open}
                title={e.description || undefined}
                className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-600 hover:bg-blue-100 hover:underline transition-colors"
              >
                {e.code || '—'}
              </button>
            ))}
            {rest > 0 && (
              <button
                type="button"
                onClick={open}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                +{rest} more
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'sources',
      header: 'Sources',
      width: '10%',
      render: (v: string[]) => {
        if (!v || v.length === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {v.map((src) => (
              <BubbleTag key={src} text={String(src).toUpperCase()} color="blue" withBorder />
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="mt-10 min-w-0">
      <SectionHeaderWithFlags
        title="GSTN Details"
        icon={FileText}
        iconColorClass="text-blue-700"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
      />
      <div className="mt-2">
        <CustomTableView columns={columns} data={tableData} className="w-full" initialRowLimit={tableData.length} />
      </div>

      <Dialog open={!!hsnDialog} onOpenChange={(open) => !open && setHsnDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">
              HSN / SAC Codes{hsnDialog?.gstin ? ` - ${hsnDialog.gstin}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <CustomTableView
              columns={[
                {
                  key: 'code',
                  header: 'Code',
                  width: '18%',
                  render: (v: string) => (
                    <span className="font-bold text-blue-600">{v || '—'}</span>
                  ),
                },
                { key: 'description', header: 'Description', width: '82%' },
              ]}
              data={hsnDialog?.entries || []}
              className="w-full"
              initialRowLimit={hsnDialog?.entries.length || 0}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GstnDetailsTab;
