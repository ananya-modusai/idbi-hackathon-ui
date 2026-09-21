import React from 'react';
import { CheckSquare, Square, Send, X } from 'lucide-react';
import { getColorClasses, ColorScheme } from '@/components/custom/CustomColorScheme';

interface BulkActionButtonsProps {
  allSelected: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  color?: ColorScheme;
  border?: boolean;
}

export const BulkActionButtons: React.FC<BulkActionButtonsProps> = ({
  allSelected,
  selectedCount,
  totalCount,
  onToggleSelectAll,
  onCancel,
  onSubmit,
  color = 'blueTextWhiteBg',
  border = true
}) => {
  // Get color classes and border styling
  const colorClasses = getColorClasses(color);
  const borderStyle = border ? {
    borderColor: 'currentColor',
    borderWidth: '2px',
    borderStyle: 'solid'
  } : {};

  return (
    <div className="flex items-center gap-2">
      {/* Select/Deselect All button */}
      <button
        onClick={onToggleSelectAll}
        className={`px-3 h-10 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${colorClasses}`}
        style={{ minWidth: 'fit-content', ...borderStyle }}
        title={allSelected ? 'Deselect All' : 'Select All'}
      >
        {allSelected ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
        {allSelected ? 'Deselect All' : 'Select All'}
      </button>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className={`px-3 h-10 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${colorClasses}`}
        style={{ minWidth: 'fit-content', ...borderStyle }}
        title="Cancel Selection Mode"
      >
        <X className="h-4 w-4" />
        Cancel
      </button>

      {/* Submit button - only enabled when items are selected */}
      <button
        onClick={onSubmit}
        disabled={selectedCount === 0}
        className={`px-3 h-10 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${
          selectedCount === 0 
            ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
            : colorClasses
        }`}
        style={{ minWidth: 'fit-content', ...borderStyle }}
        title={`Submit ${selectedCount} selected items`}
      >
        <Send className="h-4 w-4" />
        Submit ({selectedCount})
      </button>
    </div>
  );
};
