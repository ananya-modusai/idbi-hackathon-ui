'use client';

import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useChargebackCaseStore } from '@/app/store/chargeback/chargebackCaseStore';
import CBPageHeader from '../Components/CBPageHeader';
import CustomList, { SortField, SortDirection } from '@/components/custom/CustomList/customList';
import { CustomListItemProps } from '@/components/custom/CustomList/customListItem';
import { SortActionButton } from '@/components/custom/CustomList/SortActionButton';
import { DownloadActionButton } from '@/components/custom/CustomList/DownloadActionButton';
import { History, Mail, Database, FileText, StickyNote, Activity, Copy, Clock } from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { 
  allCaseEvents, 
  CaseEvent, 
  EmailEvent, 
  BankPortalEvent, 
  SFTPEvent, 
  DocEvent, 
  NoteEvent, 
  StatusChangeEvent 
} from '../SampleData/CBCasesSampleData';

interface CBCaseHistoryTabProps {
  merchantId?: string;
  caseId?: string;
}

interface CaseEventItem extends CustomListItemProps {
  originalData: CaseEvent;
  timelineDatetime?: string;
}

const CBCaseHistoryTab: FC<CBCaseHistoryTabProps> = ({ merchantId, caseId }) => {
  const { selectedCase } = useChargebackCaseStore();
  const [caseEvents, setCaseEvents] = useState<CaseEventItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Sort state management
  const [currentSortField, setCurrentSortField] = useState<string>('eventDatetime');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('desc');

  // Handler for sort changes
  const handleSortChange = (fieldKey: string, direction: SortDirection) => {
    setCurrentSortField(fieldKey);
    setCurrentSortDirection(direction);
  };

  // Define sort fields for events
  const sortFields = useMemo<SortField[]>(() => [
    {
      key: 'eventDatetime',
      label: 'Event Time',
      sortFunction: (a, b) => {
        const aData = (a as CaseEventItem).originalData;
        const bData = (b as CaseEventItem).originalData;
        return new Date(aData.eventDatetime).getTime() - new Date(bData.eventDatetime).getTime();
      }
    },
    {
      key: 'eventType',
      label: 'Event Type',
      sortFunction: (a, b) => {
        const aData = (a as CaseEventItem).originalData;
        const bData = (b as CaseEventItem).originalData;
        return aData.eventType.localeCompare(bData.eventType);
      }
    }
  ], []);

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyId = (eventId: string) => {
    navigator.clipboard.writeText(eventId);
  };

  // Helper function to get event type icon
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'Email': return Mail;
      case 'Bank Portal': return Database;
      case 'SFTP': return Database;
      case 'Doc Upload': return FileText;
      case 'Note': return StickyNote;
      case 'Status Change': return Activity;
      default: return History;
    }
  };

  // Helper function to get event type color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'Email': return 'blue';
      case 'Bank Portal': return 'green';
      case 'SFTP': return 'purple';
      case 'Doc Upload': return 'orange';
      case 'Note': return 'yellow';
      case 'Status Change': return 'red';
      default: return 'gray';
    }
  };

  // Helper function to get event details
  const getEventDetails = (event: CaseEvent) => {
    switch (event.eventType) {
      case 'Email':
        const emailEvent = event as EmailEvent;
        return {
          title: emailEvent.emailTitle,
          subtitle: `${emailEvent.emailDirection} • ${emailEvent.senderName}`,
          details: emailEvent.emailSummary
        };
      case 'Bank Portal':
        const bankEvent = event as BankPortalEvent;
        return {
          title: bankEvent.actionType,
          subtitle: `Portal Action • ${bankEvent.bankPortalEventCreatorEmail}`,
          details: `Bank portal action performed`
        };
      case 'SFTP':
        const sftpEvent = event as SFTPEvent;
        return {
          title: 'Document Upload via SFTP',
          subtitle: `SFTP • ${sftpEvent.sftpEventCreatorEmail}`,
          details: `Document ${sftpEvent.uploadedDocId} uploaded`
        };
      case 'Doc Upload':
        const docEvent = event as DocEvent;
        return {
          title: docEvent.docTitle,
          subtitle: `${docEvent.docType} • ${docEvent.uploadChannel}`,
          details: docEvent.docSummary
        };
      case 'Note':
        const noteEvent = event as NoteEvent;
        return {
          title: noteEvent.noteTitle,
          subtitle: `${noteEvent.noteCategory} • ${noteEvent.noteCreatorEmail}`,
          details: noteEvent.noteContent
        };
      case 'Status Change':
        const statusEvent = event as StatusChangeEvent;
        return {
          title: `Status: ${statusEvent.previousStatus} → ${statusEvent.newStatus}`,
          subtitle: `Status Change • ${statusEvent.changedByEmail}`,
          details: statusEvent.changeReason
        };
      default:
        return {
          title: 'Unknown Event',
          subtitle: 'Unknown Type',
          details: 'No details available'
        };
    }
  };

  // Helper function to create event item UI from data
  const createCaseEventItem = useCallback((event: CaseEvent): CaseEventItem => {
    const eventDetails = getEventDetails(event);
    const EventIcon = getEventTypeIcon(event.eventType);
    const eventColor = getEventTypeColor(event.eventType);

    return {
      itemID: event.eventId,
      title: (
        <div className="flex items-center gap-2">
          <EventIcon className={`h-4 w-4 text-${eventColor}-600`} />
          <span className="text-base font-semibold text-gray-800">{eventDetails.title}</span>
          <span className="text-sm text-gray-500">[{event.eventId}]</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              copyId(event.eventId);
            }}
            className="text-blue-500 hover:text-blue-700 flex items-center justify-center h-4"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      subtitle: `${formatDateTime(event.eventDatetime)} • ${eventDetails.subtitle}`,
      mainContent: (
        <div className="mt-2">
          <p className="text-sm text-gray-700">{eventDetails.details}</p>
        </div>
      ),
      bottomLeftContent: undefined,
      bottomRightContent: undefined,
      topRightContent: (
        <div className="flex items-center gap-2">
          <BubbleTag
            text={event.eventType}
            color={eventColor}
            withBorder={true}
          />
        </div>
      ),
      originalData: event,
      themeColor: `text-${eventColor}-600`,
      timelineDatetime: event.eventDatetime
    };
  }, []);

  // Load events for the selected case
  useEffect(() => {
    const loadCaseEvents = async () => {
      if (!selectedCase) {
        setCaseEvents([]);
        return;
      }

      setLoading(true);
      try {
        // Filter events for the selected case
        const eventsForCase = allCaseEvents.filter(event => 
          event.connectedCBCaseId === selectedCase.caseId
        );

        const processedItems = eventsForCase.map(createCaseEventItem);
        setCaseEvents(processedItems);
      } catch (error) {
        console.error('Failed to load case events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCaseEvents();
  }, [selectedCase, createCaseEventItem]);

  // Sorted events based on current sort state
  const sortedCaseEvents = useMemo(() => {
    if (!currentSortField) return caseEvents;
    
    const sortField = sortFields.find(f => f.key === currentSortField);
    if (sortField && sortField.sortFunction) {
      return [...caseEvents].sort((a, b) => {
        const result = sortField.sortFunction!(a, b);
        return currentSortDirection === 'desc' ? -result : result;
      });
    }
    
    return caseEvents;
  }, [caseEvents, currentSortField, currentSortDirection, sortFields]);

  // Filter options
  const eventTypeOptions = [
    { value: 'Email', label: 'Email' },
    { value: 'Bank Portal', label: 'Bank Portal' },
    { value: 'SFTP', label: 'SFTP' },
    { value: 'Doc Upload', label: 'Doc Upload' },
    { value: 'Note', label: 'Note' },
    { value: 'Status Change', label: 'Status Change' },
  ];

  // Filter functions
  const eventTypeFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const eventItem = item as CaseEventItem;
    return selectedValues.includes(eventItem.originalData.eventType);
  };

  const searchFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    const query = selectedValues[0] || '';
    if (!query.trim()) return true;
    
    const eventItem = item as CaseEventItem;
    const searchQuery = query.toLowerCase();
    const event = eventItem.originalData;
    const eventDetails = getEventDetails(event);
    
    return (
      event.eventId.toLowerCase().includes(searchQuery) ||
      event.eventType.toLowerCase().includes(searchQuery) ||
      eventDetails.title.toLowerCase().includes(searchQuery) ||
      eventDetails.subtitle.toLowerCase().includes(searchQuery) ||
      eventDetails.details.toLowerCase().includes(searchQuery)
    );
  };

  const handleItemClick = (item: CustomListItemProps) => {
    const eventItem = item as CaseEventItem;
    console.log('Clicked event:', eventItem.originalData);
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
      className="space-y-6 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {selectedCase ? (
        <motion.div className="space-y-6" variants={itemVariants}>
          <CBPageHeader activeCase={selectedCase} />
          
          {/* Section Header */}
          <motion.div 
            className="mb-4"
            variants={itemVariants}
          >
            <SectionHeaderWithFlags
              title="Case Event History"
              icon={History}
              positiveFlags={[]}
              negativeFlags={[]}
              mildPositiveFlags={[]}
              titleColorClass="text-gray-700"
              iconColorClass="text-gray-700"
              allowCollapse={false}
              initialRowLimit={5}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <CustomList
              items={sortedCaseEvents}
              searchFields={['title', 'subtitle', 'mainContent']}
              onItemClick={handleItemClick}
              showTimeline={true}
              showTimelineDatetime={true}
              showTimelineVisuals={false}
              disableInternalSorting={true}
              showToggleOptionCounts={true}
              initialRowLimit={100}
              animationDuration={0.08}
              loading={loading}
              loaderSpecs={{
                size: 'lg',
                color: 'gray',
                type: 'spinner',
                text: 'Loading case events...',
                textColor: 'gray'
              }}
              primaryFilterGroup={[
                {
                  id: 'search',
                  label: 'Search',
                  type: 'searchbar',
                  options: [],
                  selectedValues: [],
                  onFilterChange: () => {},
                  filterFunction: searchFilterFunction,
                  showLabel: true,
                  searchPlaceholder: 'Search by event ID, type, title, or content...',
                  onSearchChange: () => {},
                  actionElements: (
                    <div className="flex gap-2 items-center">
                      <SortActionButton
                        sortFields={sortFields}
                        currentSortField={currentSortField}
                        currentSortDirection={currentSortDirection}
                        onSortChange={handleSortChange}
                        color="grayTextWhiteBg"
                        border={true}
                      />
                      <DownloadActionButton
                        items={sortedCaseEvents}
                        fields={[
                          'eventId',
                          'eventType',
                          'eventDatetime'
                        ]}
                        listTitle="Case_Event_History"
                        color="grayTextWhiteBg"
                        border={true}
                      />
                    </div>
                  )
                },
              ]}
              secondaryFilterGroups={[
                {
                  id: 'eventType',
                  label: 'Event Type',
                  type: 'togglebuttons',
                  options: eventTypeOptions,
                  selectedValues: [],
                  onFilterChange: () => {},
                  filterFunction: eventTypeFilterFunction,
                  showLabel: true
                },
              ]}
              emptyState={{
                icon: History,
                title: 'No events found',
                description: 'No events found for this case or the current filters.'
              }}
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-12"
          variants={itemVariants}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-400">No Case Selected</h2>
          <p className="text-gray-500">Please select a chargeback case from the Active Context to view details.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CBCaseHistoryTab;
