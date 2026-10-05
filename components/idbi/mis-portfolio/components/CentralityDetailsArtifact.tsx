import React, { useEffect, useState, useRef } from 'react';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { misService as customerService } from '../misData';
import { CentralityDetailItem } from '@/app/types/customerTypes';
import CustomLoader from '@/components/custom/CustomLoader';

interface CentralityDetailsArtifactProps {
  connectorType: string;
  centralityTier: string;
  nodeType: string;
  limit: number;
}

export const CentralityDetailsArtifact: React.FC<CentralityDetailsArtifactProps> = ({ 
  connectorType, 
  centralityTier, 
  nodeType,
  limit
}) => {
  const [rawData, setRawData] = useState<CentralityDetailItem[]>([]);
  const [data, setData] = useState<CentralityDetailItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef<(() => void) | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [hiddenRowIds, setHiddenRowIds] = useState<string[]>([]);

  const storageKey = React.useMemo(
    () => `centrality-hidden-rows::${connectorType}::${centralityTier}::${nodeType}`,
    [connectorType, centralityTier, nodeType]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHiddenRowIds(parsed);
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, [storageKey]);

  useEffect(() => {
    if (!rawData) {
      setData([]);
      return;
    }
    if (hiddenRowIds.length === 0) {
      setData(rawData);
      return;
    }
    const filtered = rawData.filter(item => !hiddenRowIds.includes(item.node_id));
    setData(filtered);
  }, [rawData, hiddenRowIds]);

  const handleOpenInvestigation = (id: string) => {
    window.open(`/Customer/Investigation/${id}`, '_blank');
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const perPage = 100;
        // Fetch first page
        const result = await customerService.getCentralityDetails(
          connectorType, 
          centralityTier, 
          nodeType, 
          1, 
          perPage
        );

        if (!isMounted) return;

        if (result && result.data) {
          setRawData(result.data.slice(0, limit));
          setIsLoading(false); // Page 1 is ready, show it

          // If there are more pages, fetch them in background
          if (result.page < result.total_pages && result.data.length < limit) {
            let allData = [...result.data];
            let currentPage = 2;
            let hasMore = true;

            while (hasMore && allData.length < limit && isMounted) {
              const nextResult = await customerService.getCentralityDetails(
                connectorType, 
                centralityTier, 
                nodeType, 
                currentPage, 
                perPage
              );

              if (nextResult && nextResult.data && isMounted) {
                allData = [...allData, ...nextResult.data];
                setRawData(allData.slice(0, limit));
                
                if (nextResult.page < nextResult.total_pages && allData.length < limit) {
                  currentPage++;
                } else {
                  hasMore = false;
                }
              } else {
                hasMore = false;
              }
            }
          }
        } else {
          setRawData([]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching centrality details:', error);
        if (isMounted) {
          setRawData([]);
          setIsLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [connectorType, centralityTier, nodeType, limit]);

  const isCustomer = nodeType.toUpperCase() === 'CUSTOMER';
  const isPhone = nodeType.toUpperCase() === 'PHONE';
  const isLocation = nodeType.toUpperCase() === 'LOCATION';
  const isGovId = nodeType.toUpperCase() === 'GOV_ID';
  const isEmail = nodeType.toUpperCase() === 'EMAIL';
  const isBankAccount = nodeType.toUpperCase() === 'BANK_ACCOUNT';
  const isUpiId = nodeType.toUpperCase() === 'UPI_ID';
  const isBankBranch = nodeType.toUpperCase() === 'BANK_BRANCH';
  const isIdType = ['PAN', 'DRIVING_LICENSE', 'RATION_CARD', 'TELEPHONE'].includes(nodeType.toUpperCase());

  const columns = [
    ...(isDeleteMode
      ? [{
          key: 'select',
          header: '',
          sortable: false,
          width: '40px',
          render: (_val: any, row: any) => (
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={selectedRowIds.has(row.node_id)}
              onChange={(e) => {
                const next = new Set(selectedRowIds);
                if (e.target.checked) {
                  next.add(row.node_id);
                } else {
                  next.delete(row.node_id);
                }
                setSelectedRowIds(next);
              }}
            />
          )
        }]
      : []),
    { key: 'sno', header: 'Sno.', sortable: false, width: '60px' },
    ...(isLocation ? [
      { key: 'city', header: 'City', sortable: true },
      { key: 'state', header: 'State', sortable: true },
    ] : isGovId ? [
      { key: 'gov_id_type', header: 'Gov ID Type', sortable: true },
      { key: 'gov_id_value', header: 'Gov ID Value', sortable: true },
    ] : isEmail ? [
      { key: 'email', header: 'Email', sortable: true },
    ] : isCustomer ? [
      { 
        key: 'userid', 
        header: 'UserID', 
        sortable: true,
        isClickable: true,
        render: (val: string) => (
          <button 
            onClick={() => handleOpenInvestigation(val)}
            className="text-blue-600 hover:underline font-medium"
          >
            {val}
          </button>
        )
      },
      { key: 'customer_name', header: 'Customer Name', sortable: true },
    ] : isBankAccount ? [
      { key: 'unique_account_id', header: 'Unique Account ID', sortable: true },
    ] : isUpiId ? [
      { key: 'upi_id', header: 'UPI ID', sortable: true },
    ] : isBankBranch ? [
      { key: 'branch_name', header: 'Name', sortable: true },
      { key: 'ifsc', header: 'IFSC', sortable: true },
    ] : [
      { 
        key: 'id', 
        header: (isPhone ? 'Phone Number' : isIdType ? 'Id' : 'Device ID'), 
        sortable: true 
      },
    ]),
    { 
      key: 'count', 
      header: 'Count', 
      sortable: true,
      width: '80px'
    },
    { 
      key: 'cids', 
      header: "CID's", 
      sortable: false,
      isClickable: true,
      render: (val: string[]) => <ExpandableCIDs val={val} onOpenInvestigation={handleOpenInvestigation} />
    },
  ];

  const ExpandableCIDs = ({ val, onOpenInvestigation }: { val: string[], onOpenInvestigation: (id: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
      if (containerRef.current) {
        // Approximate 3 rows height (line-height is usually ~1.5rem/24px, so 3 rows is ~72px)
        if (containerRef.current.scrollHeight > 75) {
          setShowMore(true);
        }
      }
    }, [val]);

    if (!val || val.length === 0) return '-';

    return (
      <div className="relative">
        <div 
          ref={containerRef}
          className={`flex flex-wrap gap-x-1 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-[58px]'}`}
        >
          {val.map((cid, idx) => (
            <React.Fragment key={cid}>
              <button 
                onClick={() => onOpenInvestigation(cid)}
                className="text-blue-600 hover:underline font-medium text-left"
              >
                {cid}
              </button>
              {idx < val.length - 1 && <span className="mr-1">,</span>}
            </React.Fragment>
          ))}
        </div>
        {showMore && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 text-sm font-semibold mt-1 block"
          >
            {isExpanded ? 'Show less' : '...more'}
          </button>
        )}
      </div>
    );
  };

  const tableData = data.map((item, index) => {
    let govIdType = item.properties?.gov_id_type;
    if (!govIdType && item.properties?.data) {
      try {
        const parsedData = typeof item.properties.data === 'string' 
          ? JSON.parse(item.properties.data) 
          : item.properties.data;
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          govIdType = parsedData[0].gov_id_type;
        }
      } catch (e) {
        // Fallback or ignore
      }
    }

    return {
      node_id: item.node_id,
      sno: index + 1,
      city: item.properties?.city,
      state: item.properties?.state,
      gov_id_type: govIdType || '-',
      gov_id_value: item.properties?.gov_id_value || '-',
      email: item.properties?.email || '-',
      userid: item.properties?.userid || '-',
      customer_name: item.properties?.customer_name || '-',
      unique_account_id: item.properties?.unique_account_id || '-',
      upi_id: item.properties?.upi_id || '-',
      branch_name: item.properties?.branch_name || '-',
      ifsc: item.properties?.ifsc || '-',
      id: isPhone 
        ? item.properties?.phone_number 
        : isIdType
        ? item.properties?.gov_id_value
        : (item.properties?.device_id || item.node_id),
      count: item.connected_customer_ids?.length || 0,
      cids: item.connected_customer_ids,
    };
  });

  const handleConfirmDelete = async () => {
    if (selectedRowIds.size === 0) {
      setIsDeleteMode(false);
      return;
    }

    const selectedIds = Array.from(selectedRowIds);
    setIsLoading(true);

    try {
      // Call APIs for each selected node
      // The user wants 2 calls per node: DELETE /neptune/vertex/{id}/with-edges and POST /black-listed-nodes/{id}
      await Promise.all(
        selectedIds.flatMap(id => [
          customerService.deleteNodeWithEdges(id),
          customerService.blacklistNode(id)
        ])
      );

      const merged = Array.from(
        new Set<string>([...hiddenRowIds, ...selectedIds])
      );
      setHiddenRowIds(merged);
      setSelectedRowIds(new Set());
      setIsDeleteMode(false);

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(merged));
          window.dispatchEvent(
            new CustomEvent('centrality-hidden-rows-changed', {
              detail: { storageKey, hiddenIds: merged },
            })
          );
        } catch {
          // ignore storage errors
        }
      }
    } catch (error) {
      console.error('Error during node deletion/blacklisting:', error);
      // Optionally show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const actionButtons = [
    {
      id: 'centrality-delete-rows',
      text: isDeleteMode ? 'Confirm' : "Add Node to Exclusion List",
      color: isDeleteMode ? 'red' as const : 'gray' as const,
      onClick: () => {
        if (!isDeleteMode) {
          setIsDeleteMode(true);
          setSelectedRowIds(new Set());
        } else {
          handleConfirmDelete();
        }
      },
    },
    ...(isDeleteMode
      ? [{
          id: 'centrality-cancel-delete',
          text: 'Cancel',
          color: 'gray' as const,
          onClick: () => {
            setIsDeleteMode(false);
            setSelectedRowIds(new Set());
          },
        }]
      : []),
  ];

  return (
    <div className="bg-white min-h-full flex flex-col p-4">
      <ArtifactHeader
        title={`${centralityTier.charAt(0).toUpperCase() + centralityTier.slice(1)} Centrality - ${nodeType.replace(/_/g, ' ')}`}
        contentIDText="Connector Type"
        contentID={connectorType}
        lastUpdatedAt={new Date()}
        actionButtons={actionButtons}
        onDownloadCSV={tableData.length > 0 ? () => tableRef.current?.() : undefined}
      />

      <div className="mt-6 flex-1">
        <CustomLoader loading={isLoading} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading details...' }}>
          <CustomTableView
            exportRef={tableRef}
            columns={columns}
            data={tableData}
            isExpanded={true}
            initialRowLimit={50}
          />
        </CustomLoader>
      </div>
    </div>
  );
};

export default CentralityDetailsArtifact;
