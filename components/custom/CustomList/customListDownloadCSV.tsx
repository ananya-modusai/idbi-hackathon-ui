import React from 'react';
import { motion } from 'framer-motion';
import { getTextColorClass } from '@/components/custom/CustomColorScheme';
import { CustomListItemProps } from './customListItem';
import { LedgerColumn } from './customListLedger';

interface CustomListDownloadCSVProps {
  items: CustomListItemProps[];
  showCSVExport?: boolean;
  showTimeline?: boolean;
  showTimelineDatetime?: boolean;
  showTimelineVisuals?: boolean;
  showLedgerColumns?: boolean;
  ledgerColumns?: LedgerColumn[];
  listTitle?: string;
  selectedItem?: string | null;
  handleItemClick?: (item: CustomListItemProps) => void;
}

// Function to extract text content from React nodes
const extractTextFromReactNode = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join(' ');
  if (React.isValidElement(node)) {
    const children = node.props.children;
    return extractTextFromReactNode(children);
  }
  return '';
};

// Function to convert data to CSV
const convertToCSV = (
  items: CustomListItemProps[],
  showTimeline: boolean,
  showTimelineDatetime: boolean,
  showTimelineVisuals: boolean,
  showLedgerColumns: boolean,
  ledgerColumns?: LedgerColumn[],
  selectedItem?: string | null,
  handleItemClick?: (item: CustomListItemProps) => void
) => {
  if (items.length === 0) return '';

  // Define headers based on available data
  const headers: string[] = ['Item ID'];
  
  // Add timeline headers if timeline is enabled
  if (showTimeline) {
    if (showTimelineDatetime) {
      headers.push('Date', 'Time');
    }
    if (showTimelineVisuals) {
      headers.push('Timeline Icon');
    }
  }

  // Add list item headers
  headers.push('Title', 'Subtitle', 'Type', 'Datetime', 'Theme Color');

  // Add ledger headers if ledger is enabled
  if (showLedgerColumns && ledgerColumns) {
    ledgerColumns.forEach(column => {
      headers.push(column.label);
    });
  }

  // Create CSV header row
  let csvContent = headers.join(',') + '\n';

  // Add data rows
  items.forEach(item => {
    const row: string[] = [];

    // Item ID
    row.push(item.itemID || '');

    // Timeline data
    if (showTimeline) {
      if (showTimelineDatetime) {
        const timelineDate = item.datetime || '';
        if (timelineDate) {
          const date = new Date(timelineDate);
          row.push(date.toLocaleDateString());
          row.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          row.push('', '');
        }
      }
      if (showTimelineVisuals) {
        row.push(item.timelineIcon ? 'Yes' : 'No');
      }
    }

    // List item data
    row.push(
      extractTextFromReactNode(item.title || ''),
      item.subtitle || '',
      item.type || '',
      item.datetime || '',
      item.themeColor || ''
    );

    // Ledger data
    if (showLedgerColumns && ledgerColumns) {
      ledgerColumns.forEach(column => {
        try {
          // Create a TimelineItemProps object from CustomListItemProps
          const timelineItem = {
            ...item,
            selected: selectedItem === item.itemID,
            onClick: () => handleItemClick?.(item)
          };
          const value = column.renderValue(timelineItem);
          row.push(extractTextFromReactNode(value));
        } catch (error) {
          row.push('');
        }
      });
    }

    // Escape and join the row
    const escapedRow = row.map(cell => {
      const stringValue = String(cell).replace(/"/g, '""');
      return /[,\n"]/.test(stringValue) ? `"${stringValue}"` : stringValue;
    });
    
    csvContent += escapedRow.join(',') + '\n';
  });

  return csvContent;
};

// Function to download CSV
const downloadCSV = (
  items: CustomListItemProps[],
  showTimeline: boolean,
  showTimelineDatetime: boolean,
  showTimelineVisuals: boolean,
  showLedgerColumns: boolean,
  ledgerColumns?: LedgerColumn[],
  listTitle?: string,
  selectedItem?: string | null,
  handleItemClick?: (item: CustomListItemProps) => void
) => {
  const csvContent = convertToCSV(
    items,
    showTimeline,
    showTimelineDatetime,
    showTimelineVisuals,
    showLedgerColumns,
    ledgerColumns,
    selectedItem,
    handleItemClick
  );
  
  if (!csvContent) {
    alert('No data to export.');
    return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const filename = listTitle ? `${listTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv` : 'list_data.csv';
  
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const CustomListDownloadCSV: React.FC<CustomListDownloadCSVProps> = ({
  items,
  showCSVExport = false,
  showTimeline = false,
  showTimelineDatetime = true,
  showTimelineVisuals = true,
  showLedgerColumns = false,
  ledgerColumns,
  listTitle,
  selectedItem,
  handleItemClick
}) => {
  if (!showCSVExport || items.length === 0) {
    return null;
  }

  const handleDownloadClick = () => {
    downloadCSV(
      items,
      showTimeline,
      showTimelineDatetime,
      showTimelineVisuals,
      showLedgerColumns,
      ledgerColumns,
      listTitle,
      selectedItem,
      handleItemClick
    );
  };

  return (
    <button 
      onClick={handleDownloadClick}
      className={`flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${getTextColorClass('blue')}`}
      title="Export as CSV"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download CSV
    </button>
  );
};

export default CustomListDownloadCSV;
