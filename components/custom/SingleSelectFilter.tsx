'use client';

import { FC } from 'react';
import { MultiSelect } from '@/components/ui/multi-select2';

interface SingleSelectFilterProps {
  /** Blue label rendered to the left of the control. Omit for no label. */
  label?: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  /** Per-option counts, shown as the round chips beside each option. */
  optionCounts?: Record<string, number>;
  /** Value to fall back to when the selection is cleared. */
  fallbackValue?: string;
  className?: string;
}

/**
 * Single-select filter using the same MultiSelect control as the merchant
 * watchlist, so every filter dropdown in the app looks alike - including the
 * round count chips beside each option.
 */
export const SingleSelectFilter: FC<SingleSelectFilterProps> = ({
  label,
  options,
  value,
  onChange,
  optionCounts,
  fallbackValue = 'All',
  className = 'w-full border-gray-300 bg-inherit shadow',
}) => (
  <div className="flex items-center gap-3 min-w-0">
    {label && (
      <span className="text-sm font-medium text-blue-600 whitespace-nowrap">{label}</span>
    )}
    <MultiSelect
      options={options}
      value={[value]}
      // coerce multi-select semantics down to one value
      onValueChange={(values) => onChange(values[values.length - 1] ?? fallbackValue)}
      placeholder={label || 'Select'}
      className={className}
      optionCounts={optionCounts}
      maxCount={1}
      compactSummary
      showSelectAll={false}
    />
  </div>
);

export default SingleSelectFilter;
