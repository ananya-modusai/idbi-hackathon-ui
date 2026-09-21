'use client';

import React, { FC } from 'react';
import { getIconByName } from '@/components/custom/CustomIconScheme';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface FrequentWordsDisplayProps {
  words: string[];
  textColorClass: string;
  ValueIcon?: LucideIcon;
  showValueIcons: boolean;
}

export const FrequentWordsDisplay: FC<FrequentWordsDisplayProps> = ({ 
  words, 
  textColorClass, 
  ValueIcon, 
  showValueIcons 
}) => {
  const HashIcon = getIconByName('Hash') || LucideIcons.Hash;
  return (
    <div className="flex items-start gap-2">
      {showValueIcons && HashIcon && (
        <HashIcon
          className="h-4 w-4 mt-0.5 shrink-0 text-gray-500"
        />
      )}
      <div className={`flex-1 ${textColorClass}`}>
        {words.join(', ')}
      </div>
    </div>
  );
};

