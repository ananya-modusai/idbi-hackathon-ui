import { FC } from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({ message = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg space-y-2">
    <AlertCircle className="h-8 w-8 text-gray-400" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);
