'use client';

import { FC, useState } from 'react';
import { FileWarning } from 'lucide-react';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { msmeRows, msmeSummary } from './complianceSampleData';

const MsmeDelaysSection: FC = () => {
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  return (
    <div className="min-w-0">
      <SectionHeaderWithFlags
        title="MSME Payment Delays"
        icon={FileWarning}
        iconColorClass="text-blue-700"
        titleColorClass="text-blue-700"
        positiveFlags={[]}
        negativeFlags={[]}
        allowCollapse={false}
      />

      <div className="mt-2">
        <KeyMetrics
          hardcodedMetrics={[
            { label: 'Reporting Period', value: msmeSummary.reportingPeriod, icon: 'CalendarClock' },
            { label: 'Suppliers', value: msmeSummary.suppliers, icon: 'Users' },
            { label: 'Total Amount Due', value: msmeSummary.totalAmountDue, icon: 'Banknote' },
          ]}
          isMetricsExpanded={isMetricsExpanded}
          setIsMetricsExpanded={setIsMetricsExpanded}
          showHeader={false}
          gridCols={3}
        />
      </div>

      <div className="mt-2">
        <CustomTableView
          columns={[
            {
              key: 'supplier',
              header: 'Supplier',
              sortable: true,
              render: (v: string) => <span className="font-semibold text-blue-600">{v}</span>,
            },
            { key: 'pan', header: 'PAN' },
            { key: 'amountDue', header: 'Amount Due', sortable: true, align: 'right' },
          ]}
          data={msmeRows}
          className="w-full"
          initialRowLimit={5}
        />
      </div>
    </div>
  );
};

export default MsmeDelaysSection;
