'use client';

import { FC } from 'react';
import { FileText } from 'lucide-react';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { BubbleTag } from '@/components/custom/BubbleTag';
import gstFilings from '@/app/data/staticSnapshots/tarc/gst-filings.json';

// Real data: Annexure - GST sheet of the TARC workbook (176 filings).
const GstReturnsSection: FC = () => {
  return (
    <div className="min-w-0">
      <SectionHeaderWithFlags
        title="GST Returns & Filing"
        icon={FileText}
        iconColorClass="text-blue-700"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
        titleRightElement={
          <BubbleTag text="GST · Annexure" color="grayTextWhiteBg" withBorder={true} />
        }
      />

      <div className="mt-2">
        <CustomTableView
          columns={[
            { key: 'period', header: 'Period', sortable: true, width: '16.66%' },
            {
              key: 'returnType',
              header: 'Return Type',
              width: '16.66%',
              render: (v: string) => <span className="font-semibold text-blue-600">{v}</span>,
            },
            { key: 'gstin', header: 'GSTIN', width: '16.66%' },
            { key: 'dueDate', header: 'Due Date', width: '16.66%' },
            { key: 'filedOn', header: 'Filed On', sortable: true, width: '16.66%' },
            {
              key: 'status',
              header: 'Status',
              width: '16.66%',
              // last column: keep the badge at the right edge so the table does
              // not end in a block of empty space
              align: 'right',
              render: (v: string, row: Record<string, any>) => (
                <BubbleTag
                  text={v}
                  color={row.onTime ? 'greenTextWhiteBg' : 'redTextWhiteBg'}
                  withBorder={true}
                />
              ),
            },
          ]}
          data={gstFilings as any[]}
          className="w-full"
          initialRowLimit={10}
        />
      </div>
    </div>
  );
};

export default GstReturnsSection;
