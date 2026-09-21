'use client';

import { FC } from 'react';
import { Users } from 'lucide-react';
import SectionHeaderWithFlags from '@/components/custom/SectionHeaderWithFlags';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { Button } from '@/components/ui/button';
import { epfoComplianceRows } from './complianceSampleData';

const EpfoComplianceSection: FC = () => {
  return (
    <div className="min-w-0">
      <SectionHeaderWithFlags
        title="EPFO Compliance"
        icon={Users}
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
            View Payment History
          </Button>
        }
      />

      <div className="mt-2">
        <CustomTableView
          columns={[
            {
              key: 'establishment',
              header: 'Establishment',
              width: '15.18%',
              render: (v: string) => <span className="font-semibold text-blue-600">{v}</span>,
            },
            { key: 'entityName', header: 'Entity Name', width: '22.00%' },
            { key: 'latestWageMonth', header: 'Latest Wage Month', width: '15.40%', align: 'center' },
            { key: 'employees', header: 'Employees', width: '9.48%', align: 'center' },
            { key: 'contribution', header: 'Contribution', width: '11.38%', align: 'center' },
            { key: 'paymentDate', header: 'Payment Date', width: '13.28%', align: 'center' },
            { key: 'status', header: 'Status', width: '13.28%', align: 'center' },
          ]}
          data={epfoComplianceRows}
          className="w-full"
          initialRowLimit={10}
        />
      </div>
    </div>
  );
};

export default EpfoComplianceSection;
