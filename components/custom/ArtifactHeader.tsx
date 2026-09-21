import React from 'react';
import { ListActionButton, ActionButton } from './ActionButton';

interface ArtifactHeaderProps {
  title: React.ReactNode;
  className?: string;
  contentIDText?: string;
  contentID?: string;
  lastUpdatedAt?: Date;
  // Toggle bar props
  toggleOptions?: string[];
  selectedToggleOption?: string;
  onToggleOptionChange?: (option: string) => void;
  toggleIcons?: Record<string, React.ReactNode>;
  // Action button props
  actionButton?: ListActionButton;
  actionButtons?: ListActionButton[];
  // Right aligned content
  rightAlignedContent?: React.ReactNode;
}

export const ArtifactHeader: React.FC<ArtifactHeaderProps> = ({ 
  title,
  className = '',
  contentIDText,
  contentID,
  lastUpdatedAt,
  toggleOptions,
  selectedToggleOption,
  onToggleOptionChange,
  toggleIcons,
  actionButton,
  actionButtons,
  rightAlignedContent
}) => {
  const formattedDate = lastUpdatedAt
    ? new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(lastUpdatedAt)
    : null;
  
  return (
    <div className={`border-b pb-2 ${className}`}>
      {/* Title row with right aligned content */}
      <div className="flex justify-between items-center w-full">
        <div className="flex-1 min-w-0">
          <h2 
            className="text-lg font-semibold tracking-tight text-gray-900 truncate" 
            title={typeof title === 'string' ? title : undefined}
          >
            {title}
          </h2>
        </div>
        {/* Right aligned content, Action Buttons and Toggle Bar */}
        <div className="flex items-center gap-4 ml-4">
          {/* Custom right aligned content */}
          {rightAlignedContent && (
            <div className="flex items-center">
              {rightAlignedContent}
            </div>
          )}
          {/* Action Buttons */}
          {(actionButtons && actionButtons.length > 0) && (
            <div className="flex items-center gap-2">
              {actionButtons.map((button, index) => (
                <ActionButton
                  key={index}
                  text={button.text}
                  icon={button.icon}
                  color={button.color}
                  onClick={button.onClick}
                  disabled={button.disabled}
                  border={true}
                />
              ))}
            </div>
          )}
          {/* Single Action Button (for backward compatibility) */}
          {actionButton && !actionButtons && (
            <div className="flex items-center">
              <ActionButton
                text={actionButton.text}
                icon={actionButton.icon}
                color={actionButton.color}
                onClick={actionButton.onClick}
                disabled={actionButton.disabled}
                border={true}
              />
            </div>
          )}
          {/* Toggle Bar */}
          {toggleOptions && toggleOptions.length > 0 && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              {toggleOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => onToggleOptionChange?.(option)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                    selectedToggleOption === option
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {toggleIcons && toggleIcons[option] && (
                    <span className="flex-shrink-0">{toggleIcons[option]}</span>
                  )}
                  <span>{option}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Subtitle row with ID and last updated */}
      {(contentIDText && contentID) || formattedDate ? (
        <div className="text-xs text-gray-500 mt-0.5 flex flex-row gap-4 items-center">
          {contentIDText && contentID && (
            <div>
              {contentIDText}: <span className="text-blue-700 font-mono">{contentID}</span>
            </div>
          )}
          {formattedDate && (
            <div>
              Last Updated: <span className="text-blue-700 font-mono">{formattedDate}</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
