import React, { useState } from 'react';
import CustomList from './customList';
import { FilterOption } from './customListFilter';
import { ListActionButton } from '../ActionButton';
import { ListStat } from './customListStats';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Settings,
  ExternalLink,
  Download,
  BarChart3
} from 'lucide-react';

// Test data
const testItems = [
  {
    itemID: '1',
    title: 'Test Item 1',
    subtitle: 'Subtitle 1',
    mainContent: 'This is test content for item 1',
    timestamp: '2024-01-15T10:30:00Z',
    originalData: {
      smsType: 'Purchase',
      infoType: 'Outflow',
      eventSubtype: 'Credit Card',
      timestamp: '2024-01-15T10:30:00Z'
    }
  },
  {
    itemID: '2',
    title: 'Test Item 2',
    subtitle: 'Subtitle 2',
    mainContent: 'This is test content for item 2',
    timestamp: '2024-01-16T14:20:00Z',
    originalData: {
      smsType: 'Money Transfer',
      infoType: 'Inflow',
      eventSubtype: 'UPI',
      timestamp: '2024-01-16T14:20:00Z'
    }
  }
];

const TestLayout: React.FC = () => {
  const [smsTypeValues, setSmsTypeValues] = useState<string[]>([]);
  const [infoTypeValues, setInfoTypeValues] = useState<string[]>([]);
  const [eventSubtypeValues, setEventSubtypeValues] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframeValues, setTimeframeValues] = useState<string[]>(['All']);
  const [fromDateTime, setFromDateTime] = useState<string>('');
  const [toDateTime, setToDateTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // For testing loader functionality

  // Filter options
  const smsTypeOptions: FilterOption[] = [
    { value: 'Purchase', label: 'Purchase', icon: DollarSign },
    { value: 'Money Transfer', label: 'Money Transfer', icon: Users },
    { value: 'Payment', label: 'Payment', icon: DollarSign },
    { value: 'Investment', label: 'Investment', icon: DollarSign }
  ];

  const infoTypeOptions: FilterOption[] = [
    { value: 'Outflow', label: 'Outflow', icon: DollarSign },
    { value: 'Inflow', label: 'Inflow', icon: DollarSign },
    { value: 'Application', label: 'Application', icon: Settings }
  ];

  const eventSubtypeOptions: FilterOption[] = [
    { value: 'Credit Card', label: 'Credit Card', icon: DollarSign },
    { value: 'UPI', label: 'UPI', icon: DollarSign },
    { value: 'NEFT', label: 'NEFT', icon: DollarSign }
  ];

  const timeframeOptions: FilterOption[] = [
    { value: '1w', label: '1w', icon: Clock },
    { value: '1m', label: '1m', icon: Clock },
    { value: '1y', label: '1y', icon: Clock },
    { value: '2024', label: '2024', icon: Calendar }
  ];

  // Action buttons
  const actionButtons: ListActionButton[] = [
    {
      id: 'export',
      text: 'Export',
      icon: Download,
      color: 'blue',
      onClick: () => console.log('Export clicked'),
      alignment: 'right',
      filterRow: 'primary',
      border: true
    },
    {
      id: 'analyze',
      text: 'Analyze',
      icon: BarChart3,
      color: 'green',
      onClick: () => console.log('Analyze clicked'),
      alignment: 'right',
      filterRow: 'primary',
      border: true
    }
  ];

  // List stats
  const listStats: ListStat[] = [
    {
      id: 'count',
      label: 'items',
      value: testItems.length,
      icon: DollarSign,
      color: 'gray',
      alignment: 'right',
      filterRow: 'primary',
      border: true
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CustomList Layout Test</h1>
      <p className="text-gray-600 mb-4">
        This demonstrates the width calculation and alignment rules:
      </p>
      <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
        <li><strong>Type-1:</strong> togglebuttons, togglebar, listStats, actionButtons - content-based width</li>
        <li><strong>Type-2:</strong> multiselect, searchbar, timeselect - equal remaining space</li>
        <li><strong>Alignment:</strong> left, right, center for Type-1; always expanded for Type-2</li>
        <li><strong>Primary Row:</strong> Type-1 filter on left, stats and actions on right</li>
        <li><strong>Secondary Row:</strong> Type-2 filters expand equally</li>
        <li><strong>Tertiary Row:</strong> Type-1 filter on right, Type-2 filter expands</li>
      </ul>

      <CustomList
        items={testItems}
        loading={isLoading}
        loaderSpecs={{
          size: 'lg',
          color: 'blue',
          type: 'spinner',
          text: 'Loading test data...',
          textColor: 'blue'
        }}
        primaryFilterGroup={[{
          id: 'smsType',
          label: 'Type',
          type: 'togglebar',
          options: smsTypeOptions,
          selectedValues: smsTypeValues,
          onFilterChange: setSmsTypeValues,
          alignment: 'left',
          actionButtons: actionButtons,
          listStats: listStats
        }]}
        secondaryFilterGroups={[{
          id: 'eventSubtype',
          label: 'Subtype',
          type: 'multiselect',
          options: eventSubtypeOptions,
          selectedValues: eventSubtypeValues,
          onFilterChange: setEventSubtypeValues,
          alignment: 'expanded'
        }, {
          id: 'infoType',
          label: 'Info',
          type: 'multiselect',
          options: infoTypeOptions,
          selectedValues: infoTypeValues,
          onFilterChange: setInfoTypeValues,
          alignment: 'expanded'
        }, {
          id: 'search',
          label: 'Search',
          type: 'searchbar',
          options: [],
          selectedValues: [],
          onFilterChange: () => {},
          alignment: 'expanded',
          searchPlaceholder: 'Search messages...',
          onSearchChange: setSearchQuery
        }]}
        tertiaryFilterGroups={[{
          id: 'timeframe',
          label: 'Timeframes',
          type: 'togglebar',
          options: timeframeOptions,
          selectedValues: timeframeValues,
          onFilterChange: setTimeframeValues,
          alignment: 'right'
        }, {
          id: 'datetime',
          label: 'Date Range',
          type: 'timeselect',
          options: [],
          selectedValues: [],
          onFilterChange: () => {},
          alignment: 'expanded',
          fromDateTime: fromDateTime,
          toDateTime: toDateTime,
          onDateTimeChange: (from: string, to: string) => {
            setFromDateTime(from);
            setToDateTime(to);
          }
        }]}
        enableSearch={false}
        enableMultiSelect={false}
        onItemClick={(item) => console.log('Item clicked:', item)}
      />
    </div>
  );
};

export default TestLayout; 