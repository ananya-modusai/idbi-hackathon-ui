import { Store } from 'lucide-react';

export const BlankMerchantState = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] h-full w-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <Store className="h-12 w-12 text-gray-300 mx-auto" />
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-500">No Merchant Selected</p>
          <p className="text-sm text-gray-400">Please select a merchant from the search bar to view details</p>
        </div>
      </div>
    </div>
  );
};