import React from 'react';
import { X, Copy } from 'lucide-react';

interface CBActionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCaseIds: string[];
}

export const CBActionPopup: React.FC<CBActionPopupProps> = ({
  isOpen,
  onClose,
  selectedCaseIds
}) => {
  if (!isOpen) return null;

  const copyAllIds = () => {
    const idsText = selectedCaseIds.join(', ');
    navigator.clipboard.writeText(idsText);
  };

  const copyId = (caseId: string) => {
    navigator.clipboard.writeText(caseId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Selected Chargeback Cases
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">
              {selectedCaseIds.length} case{selectedCaseIds.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={copyAllIds}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              Copy All IDs
            </button>
          </div>

          {/* Case IDs List */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {selectedCaseIds.map((caseId) => (
              <div
                key={caseId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <span className="text-sm font-medium text-gray-700">{caseId}</span>
                <button
                  onClick={() => copyId(caseId)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // TODO: Add actual submit logic here
              console.log('Submitting selected cases:', selectedCaseIds);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Process Selected
          </button>
        </div>
      </div>
    </div>
  );
};
