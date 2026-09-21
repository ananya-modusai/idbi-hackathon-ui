import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { CustomListItemProps } from './customListItem';
import { getColorClasses, ColorScheme } from '@/components/custom/CustomColorScheme';
import { exportToExcel } from '@/app/utils/excelExport';

interface DownloadActionButtonProps {
  items: CustomListItemProps[];
  fields: string[]; // Array of field names to include in the export
  listTitle?: string;
  color?: ColorScheme;
  border?: boolean;
  showLabel?: boolean;
}

export const DownloadActionButton: React.FC<DownloadActionButtonProps> = ({
  items,
  fields,
  listTitle,
  color = 'blueTextWhiteBg',
  border = true,
  showLabel = false
}) => {
  // Function to download Excel
  const handleDownloadClick = () => {
    if (items.length === 0) {
      alert('No data to export.');
      return;
    }

    const filename = 'Modus AI * PayU - Insolvency.xlsx';
    exportToExcel(items, filename);
  };

  // Get color classes and border styling
  const colorClasses = getColorClasses(color);
  const borderStyle = border ? {
    borderColor: 'currentColor',
    borderWidth: '2px',
    borderStyle: 'solid'
  } : {};

  return (
    <div className="flex items-center gap-3">
      {showLabel && (
        <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Export</span>
      )}
      
      <button
        onClick={handleDownloadClick}
        className={`px-3 h-10 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${colorClasses}`}
        style={{ minWidth: 'fit-content', ...borderStyle }}
        title="Export as Excel"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </button>
    </div>
  );
};
