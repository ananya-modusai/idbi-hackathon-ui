'use client';

import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import CustomList, { SortField, SortDirection } from '@/components/custom/CustomList/customList';
import { CustomListItemProps } from '@/components/custom/CustomList/customListItem';
import { SortActionButton } from '@/components/custom/CustomList/SortActionButton';
import { DownloadActionButton } from '@/components/custom/CustomList/DownloadActionButton';
import { SelectItemsActionButton } from '@/components/custom/CustomList/SelectItemsActionButton';
import { BulkActionButtons } from '@/components/custom/CustomList/BulkActionButtons';
import { Bell, Copy, ChevronRight } from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { ChargebackCase, chargebackCasesSampleData } from '../SampleData/CBCasesSampleData';
import { CBActionPopup } from '../Components/CBActionPopup';
import { useChargebackNavigation } from '@/app/hooks/useChargebackNavigation';
import { generateChargebackBubbleTags } from '../Components/CBBubbleTagSpecs';

interface CBNotificationsTabProps {
  merchantId?: string;
}

interface ChargebackNotificationItem extends CustomListItemProps {
  originalData: ChargebackCase;
  timelineDatetime?: string;
}

const CBNotificationsTab: FC<CBNotificationsTabProps> = ({ merchantId }) => {
  const [chargebackCases, setChargebackCases] = useState<ChargebackNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Sort state management
  const [currentSortField, setCurrentSortField] = useState<string>('createdDateTime');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('desc');

  // Selection state management
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showActionPopup, setShowActionPopup] = useState(false);

  // Handler for sort changes
  const handleSortChange = (fieldKey: string, direction: SortDirection) => {
    setCurrentSortField(fieldKey);
    setCurrentSortDirection(direction);
  };

  // Selection handlers
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedItems(new Set()); // Clear selections when exiting select mode
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedItems.size === sortedChargebackCases.length) {
      setSelectedItems(new Set()); // Deselect all
    } else {
      const allIds = new Set(sortedChargebackCases.map(item => item.itemID));
      setSelectedItems(allIds); // Select all
    }
  };

  const handleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSubmitSelected = () => {
    setShowActionPopup(true);
  };

  const handleCancelSelection = () => {
    setIsSelectMode(false);
    setSelectedItems(new Set()); // Clear selections when canceling
  };

  // Define sort fields for chargeback cases
  const sortFields = useMemo<SortField[]>(() => [
    {
      key: 'createdDateTime',
      label: 'Created Date',
      sortFunction: (a, b) => {
        const aData = (a as ChargebackNotificationItem).originalData;
        const bData = (b as ChargebackNotificationItem).originalData;
        return new Date(aData.createdDateTime).getTime() - new Date(bData.createdDateTime).getTime();
      }
    },
    {
      key: 'chargebackAmount',
      label: 'Amount',
      sortFunction: (a, b) => {
        const aData = (a as ChargebackNotificationItem).originalData;
        const bData = (b as ChargebackNotificationItem).originalData;
        return aData.chargebackAmount - bData.chargebackAmount;
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortFunction: (a, b) => {
        const aData = (a as ChargebackNotificationItem).originalData;
        const bData = (b as ChargebackNotificationItem).originalData;
        const statusOrder = { 'Open': 0, 'In Progress': 1, 'Closed': 2 };
        return statusOrder[aData.status] - statusOrder[bData.status];
      }
    },
    {
      key: 'queueType',
      label: 'Queue Type',
      sortFunction: (a, b) => {
        const aData = (a as ChargebackNotificationItem).originalData;
        const bData = (b as ChargebackNotificationItem).originalData;
        const queueOrder = { 'Manual Review': 0, 'Quick Review': 1, 'Auto Approve': 2 };
        return queueOrder[aData.queueType] - queueOrder[bData.queueType];
      }
    },
    {
      key: 'merchantName',
      label: 'Merchant Name',
      sortFunction: (a, b) => {
        const aData = (a as ChargebackNotificationItem).originalData;
        const bData = (b as ChargebackNotificationItem).originalData;
        return aData.merchantName.localeCompare(bData.merchantName);
      }
    }
  ], []);

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyId = (caseId: string) => {
    navigator.clipboard.writeText(caseId);
  };

  // Helper function to create chargeback notification item UI from data
  const createChargebackNotificationItem = useCallback((data: ChargebackCase): ChargebackNotificationItem => {
    return {
      itemID: data.caseId,
      title: (
        <div className="flex items-center gap-2">
          {isSelectMode && (
            <input
              type="checkbox"
              checked={selectedItems.has(data.caseId)}
              onChange={(e) => {
                e.stopPropagation();
                handleItemSelection(data.caseId);
              }}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          )}
          <span className="text-base font-semibold text-blue-600 uppercase">{data.merchantName}</span>
          <span className="text-gray-400 text-lg">|</span>
          <span className="text-base font-semibold text-gray-700">{data.caseTitle}</span>
          <span className="text-sm text-gray-500">[{data.caseId}]</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              copyId(data.caseId);
            }}
            className="text-blue-500 hover:text-blue-700 flex items-center justify-center h-4"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      subtitle: undefined,
      mainContent: (
        <div className="-mt-3">
          <span className="text-sm text-gray-500">
            Assigned: <span className="text-blue-600">{data.assignedTo}</span>
          </span>
        </div>
      ),
      bottomLeftContent: undefined,
      bottomRightContent: undefined,
      topRightContent: (
        <div className="flex items-center gap-2 flex-wrap">
          {generateChargebackBubbleTags(data).map((bubbleTag, index) => (
            <BubbleTag
              key={index}
              text={bubbleTag.text}
              color={bubbleTag.color}
              withBorder={bubbleTag.withBorder}
            />
          ))}
        </div>
      ),
      rightMainIcon: ChevronRight,
      originalData: data,
      themeColor: 'text-blue-600',
      timelineDatetime: data.createdDateTime
    };
  }, [isSelectMode, selectedItems, handleItemSelection]);

  // Load chargeback cases data
  useEffect(() => {
    const loadChargebackCases = async () => {
      setLoading(true);
      try {
        // Simulate API call - in real implementation, filter by merchantId if provided
        const filteredCases = merchantId 
          ? chargebackCasesSampleData.filter(caseData => caseData.merchantName.toLowerCase().includes(merchantId.toLowerCase()))
          : chargebackCasesSampleData;

        const processedItems = filteredCases.map(createChargebackNotificationItem);
        setChargebackCases(processedItems);
      } catch (error) {
        console.error('Failed to load chargeback cases:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChargebackCases();
  }, [merchantId, createChargebackNotificationItem]);

  // Sorted chargeback cases based on current sort state
  const sortedChargebackCases = useMemo(() => {
    if (!currentSortField) return chargebackCases;
    
    const sortField = sortFields.find(f => f.key === currentSortField);
    if (sortField && sortField.sortFunction) {
      return [...chargebackCases].sort((a, b) => {
        const result = sortField.sortFunction!(a, b);
        return currentSortDirection === 'desc' ? -result : result;
      });
    }
    
    return chargebackCases;
  }, [chargebackCases, currentSortField, currentSortDirection, sortFields]);

  // Filter options
  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Closed', label: 'Closed' },
  ];

  const queueTypeOptions = [
    { value: 'Manual Review', label: 'Manual Review' },
    { value: 'Quick Review', label: 'Quick Review' },
    { value: 'Auto Approve', label: 'Auto Approve' },
  ];

  const channelOptions = [
    { value: 'Bank Portal', label: 'Bank Portal' },
    { value: 'Email', label: 'Email' },
    { value: 'SFTP', label: 'SFTP' },
  ];

  const reconStatusOptions = [
    { value: 'Reconciled', label: 'Reconciled' },
    { value: 'Not Reconciled', label: 'Not Reconciled' },
  ];

  const createdDateOptions = [
    { value: '1d', label: '1d' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ];

  const mineOptions = [
    { value: 'mine', label: 'Mine' },
  ];

  // Get unique merchant names for multiselect
  const merchantNameOptions = useMemo(() => {
    const uniqueMerchants = [...new Set(chargebackCases.map(item => item.originalData.merchantName))];
    return uniqueMerchants.map(merchant => ({
      value: merchant,
      label: merchant
    }));
  }, [chargebackCases]);

  // Filter functions
  const statusFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const chargebackItem = item as ChargebackNotificationItem;
    return selectedValues.includes(chargebackItem.originalData.status);
  };

  const queueTypeFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const chargebackItem = item as ChargebackNotificationItem;
    return selectedValues.includes(chargebackItem.originalData.queueType);
  };

  const channelFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const chargebackItem = item as ChargebackNotificationItem;
    return selectedValues.includes(chargebackItem.originalData.caseChannel);
  };

  const reconStatusFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const chargebackItem = item as ChargebackNotificationItem;
    return selectedValues.includes(chargebackItem.originalData.reconStatus.overallStatus);
  };

  const createdDateFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const chargebackItem = item as ChargebackNotificationItem;
    const createdDate = new Date(chargebackItem.originalData.createdDateTime);
    const now = new Date();
    
    return selectedValues.some(value => {
      switch (value) {
        case '1d':
          return (now.getTime() - createdDate.getTime()) <= (24 * 60 * 60 * 1000);
        case '7d':
          return (now.getTime() - createdDate.getTime()) <= (7 * 24 * 60 * 60 * 1000);
        case '30d':
          return (now.getTime() - createdDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    });
  };

  const merchantNameFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const chargebackItem = item as ChargebackNotificationItem;
    return selectedValues.includes(chargebackItem.originalData.merchantName);
  };

  const mineFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const chargebackItem = item as ChargebackNotificationItem;
    return selectedValues.includes('mine') ? chargebackItem.originalData.assignedTo === 'john.smith@PA.com' : true;
  };

  const searchFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    const query = selectedValues[0] || '';
    if (!query.trim()) return true;
    
    const chargebackItem = item as ChargebackNotificationItem;
    const searchQuery = query.toLowerCase();
    const data = chargebackItem.originalData;
    
    return (
      data.caseId.toLowerCase().includes(searchQuery) ||
      data.caseTitle.toLowerCase().includes(searchQuery) ||
      data.merchantName.toLowerCase().includes(searchQuery) ||
      data.assignedTo.toLowerCase().includes(searchQuery) ||
      data.status.toLowerCase().includes(searchQuery) ||
      data.queueType.toLowerCase().includes(searchQuery) ||
      data.caseChannel.toLowerCase().includes(searchQuery) ||
      data.CBReason.cardType.toLowerCase().includes(searchQuery) ||
      data.CBReason.code.toLowerCase().includes(searchQuery) ||
      data.reconStatus.overallStatus.toLowerCase().includes(searchQuery) ||
      data.chargebackAmount.toString().includes(searchQuery)
    );
  };

  const { navigateToChargebackWorkspace } = useChargebackNavigation();

  const handleItemClick = (item: CustomListItemProps) => {
    const chargebackItem = item as ChargebackNotificationItem;
    console.log('Clicked chargeback case:', chargebackItem.originalData);
    navigateToChargebackWorkspace(chargebackItem.originalData.caseId);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="w-full px-2 pb-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section Header */}
      <motion.div 
        className="mb-4"
        variants={itemVariants}
      >
        <SectionHeaderWithFlags
          title="Chargeback Notifications"
          icon={Bell}
          positiveFlags={[]}
          negativeFlags={[]}
          mildPositiveFlags={[]}
          titleColorClass="text-blue-700"
          iconColorClass="text-blue-700"
          allowCollapse={false}
          initialRowLimit={5}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <CustomList
          items={sortedChargebackCases}
          searchFields={['title', 'subtitle']}
          onItemClick={handleItemClick}
          showTimeline={true}
          showTimelineDatetime={true}
          showTimelineVisuals={false}
          disableInternalSorting={true}
          showToggleOptionCounts={true}
          initialRowLimit={200}
          animationDuration={0.08}
          loading={loading}
          loaderSpecs={{
            size: 'lg',
            color: 'blue',
            type: 'spinner',
            text: 'Loading chargeback cases...',
            textColor: 'blue'
          }}
        primaryFilterGroup={[
          {
            id: 'merchantName',
            label: 'Merchant Name',
            type: 'multiselect',
            options: merchantNameOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: merchantNameFilterFunction,
            showLabel: true,
            actionElements: (
              <div className="flex gap-2 items-center">
                {isSelectMode ? (
                  <BulkActionButtons
                    allSelected={selectedItems.size === sortedChargebackCases.length}
                    selectedCount={selectedItems.size}
                    totalCount={sortedChargebackCases.length}
                    onToggleSelectAll={handleToggleSelectAll}
                    onCancel={handleCancelSelection}
                    onSubmit={handleSubmitSelected}
                    color="blueTextWhiteBg"
                    border={true}
                  />
                ) : (
                  <>
                    <SortActionButton
                      sortFields={sortFields}
                      currentSortField={currentSortField}
                      currentSortDirection={currentSortDirection}
                      onSortChange={handleSortChange}
                      color="blueTextWhiteBg"
                      border={true}
                    />
                    <DownloadActionButton
                      items={sortedChargebackCases}
                      fields={[
                        'caseId',
                        'caseTitle',
                        'merchantName',
                        'createdDateTime',
                        'chargebackAmount',
                        'status',
                        'queueType',
                        'caseChannel',
                        'assignedTo'
                      ]}
                      listTitle="Chargeback_Notifications"
                      color="blueTextWhiteBg"
                      border={true}
                    />
                    <SelectItemsActionButton
                      onToggleSelectMode={handleToggleSelectMode}
                      color="blueTextWhiteBg"
                      border={true}
                    />
                  </>
                )}
              </div>
            )
          },
          {
            id: 'search',
            label: 'Search',
            type: 'searchbar',
            options: [],
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: searchFilterFunction,
            showLabel: true,
            searchPlaceholder: 'Search by case ID, title, merchant, assignee, status, reason code, or any field...',
            onSearchChange: () => {},
          },
        ]}
        secondaryFilterGroups={[
          {
            id: 'status',
            label: 'Status',
            type: 'togglebuttons',
            options: statusOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: statusFilterFunction,
            showLabel: true
          },
          {
            id: 'queueType',
            label: 'Queue Type',
            type: 'togglebuttons',
            options: queueTypeOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: queueTypeFilterFunction,
            showLabel: true
          },
          {
            id: 'createdDate',
            label: 'Created',
            type: 'togglebuttons',
            options: createdDateOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: createdDateFilterFunction,
            showLabel: true
          },
          {
            id: 'mine',
            label: 'Assigned',
            type: 'togglebuttons',
            options: mineOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: mineFilterFunction,
            showLabel: true
          },
        ]}
        tertiaryFilterGroups={[
          {
            id: 'channel',
            label: 'Channel',
            type: 'togglebuttons',
            options: channelOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: channelFilterFunction,
            showLabel: true
          },
          {
            id: 'reconStatus',
            label: 'Reconciliation Status',
            type: 'togglebuttons',
            options: reconStatusOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: reconStatusFilterFunction,
            showLabel: true
          }
        ]}
          emptyState={{
            icon: Bell,
            title: 'No chargeback cases found',
            description: 'No chargeback cases match the current filters.'
          }}
        />
      </motion.div>

      {/* Action Popup for selected items */}
      <CBActionPopup
        isOpen={showActionPopup}
        onClose={() => setShowActionPopup(false)}
        selectedCaseIds={Array.from(selectedItems)}
      />
    </motion.div>
  );
};

export default CBNotificationsTab;
