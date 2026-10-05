import React, { useRef } from 'react';
import { Users } from 'lucide-react';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { formatIndianNumber } from '@/utils/utils';

interface CommunityDetailsArtifactProps {
  title: string;
  data?: any[];
}

export const CommunityDetailsArtifact: React.FC<CommunityDetailsArtifactProps> = ({ title, data = [] }) => {
  const tableRef = useRef<(() => void) | null>(null);
  const communityTableColumns = [
    { key: 'sno', header: 'Sno.', sortable: false },
    { 
      key: 'community_id', 
      header: 'Community ID', 
      sortable: true,
      render: (val: any) => (
        <span className="text-xs font-mono text-gray-500">{val}</span>
      )
    },
    { 
      key: 'customer_count', 
      header: 'Connected Customers', 
      sortable: true,
      render: (val: any) => formatIndianNumber(val)
    },
    { 
      key: 'default_customer_count', 
      header: 'Defaulters', 
      sortable: true,
      render: (val: any) => formatIndianNumber(val)
    },
    { 
      key: 'total_loan_amount_inr', 
      header: 'Loan Exposure', 
      sortable: true,
      render: (val: any) => val ? `₹${val.toLocaleString('en-IN')}` : '-'
    },
    { 
      key: 'default_customer_pct', 
      header: 'Default %', 
      sortable: true,
      render: (val: any) => `${val}%`
    },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col p-6">
      <ArtifactHeader
        title={title}
        onDownloadCSV={data.length > 0 ? () => tableRef.current?.() : undefined}
      />
      
      <div className="mt-6 flex items-center space-x-2 mb-6 text-gray-900">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <Users className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-gray-500">Community Statistics Breakdown</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
        <CustomTableView
          exportRef={tableRef}
          columns={communityTableColumns}
          data={data}
          initialRowLimit={50}
          isExpanded={true}
        />
      </div>
    </div>
  );
};
