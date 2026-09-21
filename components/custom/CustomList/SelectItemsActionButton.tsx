import React from 'react';
import { CheckSquare } from 'lucide-react';
import { getColorClasses, ColorScheme } from '@/components/custom/CustomColorScheme';

interface SelectItemsActionButtonProps {
  onToggleSelectMode: () => void;
  color?: ColorScheme;
  border?: boolean;
  showLabel?: boolean;
}

export const SelectItemsActionButton: React.FC<SelectItemsActionButtonProps> = ({
  onToggleSelectMode,
  color = 'blueTextWhiteBg',
  border = true,
  showLabel = false
}) => {
  // Get color classes and border styling
  const colorClasses = getColorClasses(color);
  const borderStyle = border ? {
    borderColor: 'currentColor',
    borderWidth: '2px',
    borderStyle: 'solid'
  } : {};

  return (
    <div className="flex items-center gap-3">
      {/* Label matching togglebutton style - only show if showLabel is true */}
      {showLabel && (
        <span className="text-sm font-medium text-blue-600 whitespace-nowrap">Select</span>
      )}
      
      {/* Select Items button matching togglebutton styling */}
      <button
        onClick={onToggleSelectMode}
        className={`px-3 h-10 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${colorClasses}`}
        style={{ minWidth: 'fit-content', ...borderStyle }}
        title="Select Items"
      >
        <CheckSquare className="h-4 w-4" />
        Select
      </button>
    </div>
  );
};
