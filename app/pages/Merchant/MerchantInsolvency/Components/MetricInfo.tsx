import { FC, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface MetricInfoProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  formula: string | number;
  impactoncompany: string;
}

const MetricInfo: FC<MetricInfoProps> = ({ isOpen, onClose, name, formula, impactoncompany }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, handleClickOutside, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="text-2xl font-bold text-blue-600">
            {formula}
          </div>
          
          <hr className="border-gray-300" />
          
          <p className="text-sm text-gray-700 leading-relaxed">
            {impactoncompany}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricInfo;
