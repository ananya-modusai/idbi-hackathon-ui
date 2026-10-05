import React, { useRef } from 'react';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { CustomTableView } from '@/components/custom/CustomTableView';

export interface ConnectionDetail {
  sno: number;
  customer: string;
  cid2: string;
  cid4: string;
  cid6: string;
}

interface ConnectionsArtifactProps {
  customerName: string;
  connections: ConnectionDetail[];
}

export const ConnectionsArtifact: React.FC<ConnectionsArtifactProps> = ({ customerName, connections }) => {
  const tableRef = useRef<(() => void) | null>(null);
  const columns = [
    { key: 'sno', header: 'Sno', sortable: false, width: '60px' },
    { key: 'customer', header: 'Customers', sortable: true },
    { key: 'cid2', header: "CID's - 2nd Degree", sortable: false },
    { key: 'cid4', header: 'CID - 4th Degree', sortable: false },
    { key: 'cid6', header: 'CID - 6th Degree', sortable: false },
  ];

  return (
    <div className="bg-white min-h-full flex flex-col">
      <ArtifactHeader
        title="Connections"
        contentIDText="Customer"
        contentID={customerName}
        lastUpdatedAt={new Date()}
        onDownloadCSV={connections.length > 0 ? () => tableRef.current?.() : undefined}
      />

      <div className="mt-4 flex-1">
        <CustomTableView
          exportRef={tableRef}
          columns={columns}
          data={connections}
          isExpanded={true}
          initialRowLimit={10}
        />
      </div>
    </div>
  );
};

export default ConnectionsArtifact;
