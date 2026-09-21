'use client';

import React, { FC, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ActionButton } from '@/components/custom/ActionButton';
import { IndustryData, riskSegmentOptions } from './IndustrySampleData';

interface EditIndustryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  industry: IndustryData;
  onSave: (updates: { averageDeliveryDays: number; riskSegment: IndustryData['riskSegment'] }) => Promise<void>;
}

export const EditIndustryDialog: FC<EditIndustryDialogProps> = ({
  isOpen,
  onClose,
  industry,
  onSave
}) => {
  const [averageDeliveryDays, setAverageDeliveryDays] = useState(industry.averageDeliveryDays);
  const [riskSegment, setRiskSegment] = useState<IndustryData['riskSegment']>(industry.riskSegment);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill form when industry prop changes
  useEffect(() => {
    setAverageDeliveryDays(industry.averageDeliveryDays);
    setRiskSegment(industry.riskSegment);
  }, [industry.id, industry.averageDeliveryDays, industry.riskSegment]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        averageDeliveryDays,
        riskSegment
      });
    } catch (error) {
      // Error handling - the loading state will be reset
      console.error('Failed to save industry changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Industry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Industry Name (Read-only) */}
          <div className="space-y-2">
            <div className="font-semibold">{industry.name}</div>
          </div>

          {/* Average Delivery Days */}
          <div className="space-y-2">
            <Label>Average Delivery Days (ADD)</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={averageDeliveryDays}
              onChange={(e) => setAverageDeliveryDays(parseInt(e.target.value) || 1)}
              placeholder="Enter days (1-30)"
              className="w-full text-base px-4 py-3"
            />
          </div>

          {/* Risk Segment */}
          <div className="space-y-2">
            <Label>Risk Segment</Label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {riskSegmentOptions.map((option) => {
                const isSelected = riskSegment === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setRiskSegment(option.value as IndustryData['riskSegment'])}
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

          <div className="flex justify-end gap-2 pt-4">
            <ActionButton
              text="Cancel"
              onClick={handleClose}
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
};
