import { FC, useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MerchantItemType } from '@/app/types';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface AddToWatchlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableMerchants: MerchantItemType[];
  onSubmit: (data: {
    merchant_id: string;
    frequency_to_refresh_probedata: 'Monthly' | 'Weekly' | 'Daily';
    frequency_to_refresh_external_insights: 'Monthly' | 'Weekly' | 'Daily';
    frequency_to_refresh_annual_report: 'Yearly';
    is_active: boolean;
  }) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

const frequencyOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' }
];


export const AddToWatchlistDialog: FC<AddToWatchlistDialogProps> = ({
  isOpen,
  onClose,
  availableMerchants,
  onSubmit,
  searchQuery,
  onSearchChange,
  isLoading = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [monitoringFrequency, setMonitoringFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  // Handle clicking outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!selectedMerchant) return;

    onSubmit({
      merchant_id: selectedMerchant,
      frequency_to_refresh_probedata: monitoringFrequency,
      frequency_to_refresh_external_insights: monitoringFrequency,
      frequency_to_refresh_annual_report: 'Yearly',
      is_active: true
    });
  };

  const filteredMerchants = availableMerchants.filter(merchant => 
    merchant.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.cin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      onClose();
      setSelectedMerchant('');
      setMonitoringFrequency('Monthly');
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Merchants to Watchlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Merchant</Label>
            <div className="relative mt-1" ref={dropdownRef}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  className="w-full p-2 border border-gray-200 rounded-lg pr-8"
                  placeholder="Search merchants..."
                  value={selectedMerchant ? availableMerchants.find(m => m.id === selectedMerchant)?.legalName || '' : searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setIsDropdownOpen(true);
                    if (selectedMerchant) {
                      setSelectedMerchant('');
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                />
                <Search className="absolute right-2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              
              {isDropdownOpen && filteredMerchants.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="max-h-60 overflow-y-auto">
                    {filteredMerchants.map(merchant => (
                      <div
                        key={merchant.id}
                        className={`p-2 hover:bg-gray-50 cursor-pointer ${
                          selectedMerchant === merchant.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setSelectedMerchant(merchant.id);
                          onSearchChange('');
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="font-medium">{merchant.legalName}</span>
                        <span className="text-sm text-gray-500 ml-2">[{merchant.cin}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedMerchant && (
            <div className="space-y-6">
              {/* Monitoring Frequencies Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-700 font-medium mb-1">Monitoring Frequency</Label>
                  <div className="flex gap-2 mt-1">
                    {frequencyOptions.map(option => (
                      <button
                        key={option.value}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium flex-1",
                          monitoringFrequency === option.value
                            ? option.value === 'Daily'
                              ? "bg-red-600 text-white"
                              : option.value === 'Weekly'
                                ? "bg-blue-600 text-white" 
                                : "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                        onClick={() => setMonitoringFrequency(option.value as 'Daily' | 'Weekly' | 'Monthly')}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedMerchant || isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add to Watchlist'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
