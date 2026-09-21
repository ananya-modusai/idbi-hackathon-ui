'use client';

import { FC, useState } from 'react';
import { FileWarning } from 'lucide-react';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { litigationRows, litigationStats } from './complianceSampleData';

const LitigationSection: FC = () => {
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  return (
    <div className="min-w-0">
      <SectionHeaderWithFlags
        title="Litigation & Financial Disputes"
        icon={FileWarning}
        iconColorClass="text-blue-700"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
      />

      <div className="mt-2">
        <KeyMetrics
          hardcodedMetrics={litigationStats}
          isMetricsExpanded={isMetricsExpanded}
          setIsMetricsExpanded={setIsMetricsExpanded}
          showHeader={false}
          gridCols={4}
        />
      </div>

      <div className="mt-4">
        <CustomTableView
          columns={[
            {
              key: 'matter',
              header: 'Matter',
              sortable: true,
              width: '16%',
              render: (v: string) => <span className="font-semibold text-blue-600">{v}</span>,
            },
            { key: 'direction', header: 'Direction', width: '13%' },
            {
              key: 'status',
              header: 'Status',
              width: '9%',
              render: (v: string) => (
                <BubbleTag
                  text={v}
                  color={v === 'Pending' ? 'orangeTextWhiteBg' : 'grayTextWhiteBg'}
                  withBorder={true}
                />
              ),
            },
            { key: 'category', header: 'Category', width: '14%' },
            { key: 'court', header: 'Court / Forum', width: '18%' },
            {
              key: 'caseNo',
              header: 'Case No.',
              width: '18%',
              // case numbers are long unbroken strings, so break anywhere
              render: (v: string) => <span className="break-all">{v}</span>,
            },
            { key: 'latestHearing', header: 'Latest Hearing', sortable: true, width: '12%' },
          ]}
          data={litigationRows}
          className="w-full"
          initialRowLimit={5}
        />
      </div>
    </div>
  );
};

export default LitigationSection;
