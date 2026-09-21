import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { industryService, Industry } from "@/app/services/industryServices";
import { Loader2 } from "lucide-react";
import { ActionButton } from "@/components/custom/ActionButton";
import { MultiSelect } from "@/components/ui/multi-select2";

interface EditMerchantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: {
    merchantName: string;
    mid: string;
    cin?: string;
    monitoringFrequency: 'Daily' | 'Weekly' | 'Monthly';
    status: string;
    industry?: string;
  };
  onSave: (updates: { 
    monitoringFrequency: 'Daily' | 'Weekly' | 'Monthly';
    industry?: string;
    industryId?: string;
  }) => Promise<void>;
}

const frequencyOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
];

export function EditMerchantDialog({ isOpen, onClose, merchant, onSave }: EditMerchantDialogProps) {
  const [monitoringFrequency, setMonitoringFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>(merchant.monitoringFrequency);
  const [isSaving, setIsSaving] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>("");
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingIndustries(true);
      try {
        const [industriesData, currentIndustry] = await Promise.all([
          industryService.getAllIndustries(),
          industryService.getMerchantIndustry(merchant.mid)
        ]);
        
        setIndustries(industriesData);
        
        // Prioritize the industry tag from the watchlist tab item, fallback to the fetched API industry
        let resolvedIndustryName = merchant.industry;
        if (!resolvedIndustryName || resolvedIndustryName === "Industry N/A" || resolvedIndustryName === "Unknown Industry") {
          resolvedIndustryName = currentIndustry?.industry;
        }

        if (resolvedIndustryName) {
          // Find and set the industry ID for the resolved industry name
          const industry = industriesData.find(ind => ind.industry_name === resolvedIndustryName);
          if (industry) {
            setSelectedIndustryId(industry.industry_id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingIndustries(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, merchant.mid, merchant.industry]); // Fetch when dialog opens or merchant industry changes



  const handleSave = async () => {
    setIsSaving(true);
    try {
      const selectedIndustry = industries.find(ind => ind.industry_id === selectedIndustryId);
      
      // Clear the industry cache immediately upon saving so any subsequent loads get the fresh one
      try {
        industryService.clearMerchantIndustryCache(merchant.mid);
      } catch (e) {
        console.error('Failed to clear merchant industry cache:', e);
      }

      await onSave({
        monitoringFrequency,
        industry: selectedIndustry?.industry_name,
        industryId: selectedIndustryId
      });
    } catch (error) {
      // Error handling - the loading state will be reset
      console.error('Failed to save merchant changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Merchant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="font-semibold">{merchant.merchantName}</div>
            <div className="text-sm text-gray-500">[CIN {merchant.cin || 'N/A'}]</div>
          </div>
          
          <div className="space-y-2">
            <Label>Monitoring Frequency</Label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {frequencyOptions.map((option) => {
                const isSelected = monitoringFrequency === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setMonitoringFrequency(option.value as 'Daily' | 'Weekly' | 'Monthly')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isSelected
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Industry</Label>
            {isLoadingIndustries ? (
              <div className="flex items-center justify-center py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
                <span className="ml-2">Loading industries...</span>
              </div>
            ) : (
              <MultiSelect
                options={industries.map(industry => ({
                  value: industry.industry_id,
                  label: industry.industry_name
                }))}
                onValueChange={(values) => {
                  // MultiSelect returns an array, but we only want single selection
                  const selectedValue = values[values.length - 1]; // Take the last selected value
                  if (selectedValue) {
                    setSelectedIndustryId(selectedValue);
                  } else {
                    setSelectedIndustryId("");
                  }
                }}
                value={selectedIndustryId ? [selectedIndustryId] : []}
                placeholder="Select industry..."
                className="w-full border-gray-300 bg-inherit shadow dialog-multiselect"
                maxCount={1} // Limit to single selection
                modalPopover={true} // Enable modal behavior for better dialog compatibility
                showSelectAll={false} // Disable the Select All option
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <ActionButton
              text="Cancel"
              onClick={onClose}
              color="blueTextWhiteBg"
              border={true}
            />
            <ActionButton
              text={isSaving ? "Saving..." : "Save Changes"}
              onClick={handleSave}
              disabled={isSaving}
              color="blue"
              border={true}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
