import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { CustomListItemProps } from './customListItem';
import { getColorClasses, ColorScheme } from '@/components/custom/CustomColorScheme';
import { exportToExcel } from '@/app/utils/excelExport';

interface DownloadActionButtonProps {
  items: CustomListItemProps[];
  fields?: string[]; // Optional: Array of field names to include in export
  listTitle?: string;
  color?: ColorScheme;
  border?: boolean;
  showLabel?: boolean;
  /** Extra classes for the button, e.g. to widen its padding. */
  className?: string;
}

export const DownloadActionButton: React.FC<DownloadActionButtonProps> = ({
  items,
  listTitle,
  color = 'blueTextWhiteBg',
  border = true,
  showLabel = false,
  className = ''
}) => {

  const [isExporting, setIsExporting] = useState(false);

  // Function to download Excel
  const handleDownloadClick = async () => {
    if (items.length === 0) {
      alert('No data to export.');
      return;
    }

    setIsExporting(true);
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const filename = listTitle ? `${listTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${currentDate}.xlsx` : `download_${currentDate}.xlsx`;
    try {
      await exportToExcel(items, filename);
    } catch (err) {
      console.error('Excel export failed', err);
      alert('Failed to generate Excel file');
    } finally {
      setIsExporting(false);
    }
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
      {/* Blue label matching togglebutton style - only show if showLabel is true */}
      {showLabel && (
        <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Export</span>
      )}
      
      {/* Download button matching togglebutton styling */}
      <button
        onClick={handleDownloadClick}
        className={`px-3 h-10 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${colorClasses} ${className}`}
        style={{ minWidth: 'fit-content', ...borderStyle }}
        title="Export as Excel"
        disabled={isExporting}
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Generating...' : 'Excel'}
      </button>
    </div>
  );
};
