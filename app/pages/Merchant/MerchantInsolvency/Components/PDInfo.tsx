import { FC } from 'react';
import { X } from 'lucide-react';

interface PDInfoProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mainValue: string | number;
  subtitleText: string;
  description: string;
}

const PDInfo: FC<PDInfoProps> = ({ isOpen, onClose, title, mainValue, subtitleText, description }) => {
  if (!isOpen) return null;

  return (
    // Ensure modal overlays other sticky/fixed elements (like table headers)
    // by using a very high z-index. Some tables use z-index values > 50
    // for sticky headers, so we keep this safely above them.
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="text-2xl font-bold text-blue-600">
            {mainValue}
          </div>
          <div className="text-sm text-gray-600 italic">
            {subtitleText}
          </div>
          
          <hr className="border-gray-300" />
          
          <p className="text-sm text-gray-700 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDInfo;
