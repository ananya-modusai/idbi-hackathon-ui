import { FC, useState, isValidElement } from 'react';
import { Edit2, Save, X, RotateCcw, Info } from 'lucide-react';
import { ColorScheme, getTextColorClass } from '@/components/custom/CustomColorScheme';
import PDInfo from './PDInfo';

interface ToggleOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface PDStatItemProps {
  title: string;
  mainValue: string | number | React.ReactNode;
  themeColor: ColorScheme;
  subtitleText: string;
  isEditable?: boolean;
  onValueChange?: (newValue: string) => void;
  placeholder?: string;
  validation?: (value: string) => string | null;
  defaultValue?: number;
  allowDecimal?: boolean;
  description?: string;
  toggleOptions?: ToggleOption[];
  selectedToggleValue?: string;
  onToggleChange?: (value: string) => void;
}

const PDStatItem: FC<PDStatItemProps> = ({
  title,
  mainValue,
  themeColor,
  subtitleText,
  isEditable = false,
  onValueChange,
  placeholder = "Enter value",
  validation,
  defaultValue,
  allowDecimal = false,
  description = "Detailed information about this metric.",
  toggleOptions,
  selectedToggleValue,
  onToggleChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState<string>('');
  const [editError, setEditError] = useState<string>('');
  const [showInfo, setShowInfo] = useState(false);

  const handleEditClick = () => {
    setEditedValue(String(mainValue));
    setIsEditing(true);
    setEditError('');
  };

  const handleSave = () => {
    if (validation) {
      const error = validation(editedValue);
      if (error) {
        setEditError(error);
        return;
      }
    }

    if (onValueChange) {
      onValueChange(editedValue);
    }
    setIsEditing(false);
    setEditError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditError('');
  };

  const handleResetToDefault = () => {
    if (defaultValue !== undefined && onValueChange) {
      onValueChange(defaultValue.toString());
    }
  };

  const handleToggleChange = (value: string) => {
    if (onToggleChange) {
      onToggleChange(value);
    }
  };

  const textColorClass = getTextColorClass(themeColor);

  // Only format to decimal if explicitly allowed by parent
  const formatValue = (value: string | number | React.ReactNode): React.ReactNode => {
    if (isValidElement(value)) {
      return value;
    }
    
    if (typeof value === 'undefined' || value === null) {
      return '-';
    }

    if (!allowDecimal || typeof value !== 'string' && typeof value !== 'number') {
      return String(value);
    }
    
    if (typeof value === 'number') {
      return value.toFixed(1);
    }

    if (typeof value === 'string') {
      // Check if it's a currency value (starts with ₹)
      if (value.startsWith('₹')) {
        const numericPart = value.replace('₹', '').replace(/,/g, '');
        const num = parseFloat(numericPart);
        if (!isNaN(num)) {
          return `₹${num.toFixed(1)}`;
        }
      }
      // Check if it's a percentage
      if (value.endsWith('%')) {
        const numericPart = value.replace('%', '');
        const num = parseFloat(numericPart);
        if (!isNaN(num)) {
          return `${num.toFixed(1)}%`;
        }
      }
      // Check if it's just a number
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num.toFixed(1);
      }
    }

    return String(value);
  };

  const formattedMainValue = formatValue(mainValue);

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">{title}</p>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                className="text-xl w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
                step={allowDecimal ? "0.1" : "1"}
              />
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:text-green-700"
                title="Save"
              >
                <Save size={18} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-600 hover:text-gray-700"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
            {editError && <div className="text-xs text-red-500">{editError}</div>}
          </div>
        ) : (
          <>
            {isValidElement(mainValue) ? (
              mainValue
            ) : (
              <div className={`text-xl font-semibold ${textColorClass}`}>
                {formattedMainValue}
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowInfo(true)}
                className="p-1 text-gray-600 hover:text-gray-700"
                title="More information"
              >
                <Info size={16} />
              </button>
              {isEditable && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="p-1 text-gray-600 hover:text-gray-700"
                    title="Edit value"
                  >
                    <Edit2 size={16} />
                  </button>
                  {defaultValue !== undefined && (
                    <button
                      onClick={handleResetToDefault}
                      className="p-1 text-gray-600 hover:text-gray-700"
                      title="Reset to default"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </>
              )}
              {toggleOptions && toggleOptions.length > 0 && (
                <div className="flex items-center bg-gray-100 rounded-md p-1">
                  {toggleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => !option.disabled && handleToggleChange(option.value)}
                      disabled={option.disabled}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedToggleValue === option.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      } ${option.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-gray-500 italic">{subtitleText}</p>
      
      <PDInfo
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title={title}
        mainValue={typeof formattedMainValue === 'string' || typeof formattedMainValue === 'number' ? formattedMainValue : 'Custom value'}
        subtitleText={subtitleText}
        description={description}
      />
    </div>
  );
};

interface PDStatsProps {
  items: PDStatItemProps[];
  gridCols?: number;
  className?: string;
}

const PDStats: FC<PDStatsProps> = ({ items, gridCols = 4, className = "" }) => {
  const gridClass = `grid-cols-${gridCols}`;
  
  return (
    <div className={`grid ${gridClass} gap-6 pt-4 border-t ${className}`}>
      {items.map((item, index) => (
        <PDStatItem
          key={index}
          {...item}
        />
      ))}
    </div>
  );
};

export default PDStats;
export { PDStatItem };

/*
Usage example for ADD PDStat with toggle:

const addToggleOptions = [
  { label: 'Company ADD', value: 'company' },
  { label: 'Industry ADD', value: 'industry' }
];

const [selectedAddType, setSelectedAddType] = useState('company');

const addStatsItems = [
  {
    title: 'ADD',
    mainValue: selectedAddType === 'company' ? companyAddValue : industryAddValue,
    themeColor: 'success',
    subtitleText: 'Average Days Delinquent',
    toggleOptions: addToggleOptions,
    selectedToggleValue: selectedAddType,
    onToggleChange: setSelectedAddType,
    // ... other props
  }
];

<PDStats items={addStatsItems} />
*/
