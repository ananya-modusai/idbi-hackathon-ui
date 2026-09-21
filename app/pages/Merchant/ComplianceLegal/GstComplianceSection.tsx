'use client';

import { FC } from 'react';
import { ShieldCheck } from 'lucide-react';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { Button } from '@/components/ui/button';
import { gstComplianceRows } from './complianceSampleData';

const GstComplianceSection: FC = () => {
  return (
    <div className="min-w-0">
      <SectionHeaderWithFlags
        title="GST Compliance"
        icon={ShieldCheck}
        iconColorClass="text-blue-700"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
        rightActions={
          <Button
            variant="outline"
            size="sm"
            className="w-auto text-sm px-4 h-9 whitespace-nowrap shrink-0 text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            View Filing History
          </Button>
        }
      />

      <div className="mt-2">
        <CustomTableView
          columns={[
            {
              key: 'gstin',
              header: 'GSTIN',
              sortable: true,
              width: '19.71%',
              render: (v: string) => <span className="font-semibold text-blue-600">{v}</span>,
            },
            { key: 'state', header: 'State', sortable: true, width: '8.82%' },
            {
              key: 'status',
              header: 'Status',
              width: '8.78%',
              render: (value: string) => (
                <BubbleTag
                  text={value}
                  color={value === 'Active' ? 'greenTextWhiteBg' : 'redTextWhiteBg'}
                  withBorder={true}
                />
              ),
            },
            { key: 'taxpayerType', header: 'Taxpayer Type', width: '13.28%' },
            {
              key: 'returnType',
              header: 'Latest Return',
              width: '17.86%',
              render: (v: string, row: Record<string, any>) => `${v} · ${row.taxPeriod}`,
            },
            { key: 'latestFiling', header: 'Latest Filing', sortable: true, width: '16.33%' },
            {
              key: 'filingStatus',
              header: 'Filing Status',
              width: '15.23%',
              render: (v: string) => (
                <span className={v === 'Filed on time' ? 'text-gray-700' : 'text-orange-600'}>{v}</span>
              ),
            },
          ]}
          data={gstComplianceRows}
          className="w-full"
          initialRowLimit={10}
        />
      </div>
    </div>
  );
};

export default GstComplianceSection;
