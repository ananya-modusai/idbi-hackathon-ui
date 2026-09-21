'use client';

import React, { useState, useMemo } from 'react';
import { Tag, Brain, IndianRupee, Briefcase } from 'lucide-react';
import { ArtifactHeader } from '@/components/custom/ArtifactHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { ColorScheme } from '@/components/custom/CustomColorScheme';

// Ported from ipo-compliance-nse/listing-compliance-ui's
// PeerIdentification/PeerIdentificationArtifact.tsx. Per company policy, the
// Sector / Macro Economic Sector classification tags are dropped — only
// Type and Industry are shown.

interface PeerIdentificationArtifactItem {
  name: string;
  type: string;
  industry?: string;
  revenue?: number;
  assets?: number;
  reasoning?: string;
  explanation?: string;
}

interface PeerIdentificationArtifactProps {
  item: PeerIdentificationArtifactItem;
  getValueColor: (value: string) => ColorScheme;
}

export const PeerIdentificationArtifact: React.FC<PeerIdentificationArtifactProps> = ({ item, getValueColor }) => {
  const [isClassificationExpanded, setIsClassificationExpanded] = useState(true);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(true);

  const artifactDate = useMemo(() => new Date(), []);

  const classificationMetrics = [
    {
      label: 'Type',
      value: item.type ? item.type.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '-',
      icon: '<Building2 text-blue-500',
    },
    ...(item.industry
      ? [
          {
            label: 'Industry',
            value: item.industry,
            icon: '<Briefcase text-blue-500',
          },
        ]
      : []),
  ];

  const financialMetrics = [
    ...(item.revenue
      ? [
          {
            label: 'Revenue (Rs. Crore)',
            value: item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            icon: '<IndianRupee text-green-500',
          },
        ]
      : []),
    ...(item.assets
      ? [
          {
            label: 'Total Assets',
            value: item.assets.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            icon: '<BarChart3 text-blue-500',
          },
        ]
      : []),
  ];

  return (
    <div>
      <ArtifactHeader title={`Peer Identification - ${item.name}`} contentID={item.name} lastUpdatedAt={artifactDate} />

      <div className="pt-4 space-y-4">
        <ArtifactSectionCollapsible title="Classification Details" defaultOpen>
          <KeyMetrics
            hardcodedMetrics={classificationMetrics}
            isMetricsExpanded={isClassificationExpanded}
            setIsMetricsExpanded={setIsClassificationExpanded}
            showHeader={false}
            showCollapse={classificationMetrics.length > 4}
            gridCols={2}
          />
        </ArtifactSectionCollapsible>

        <ArtifactSectionCollapsible title="Reasoning" defaultOpen>
          <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100 italic text-gray-700 leading-relaxed text-sm">
            {item.reasoning || item.explanation || 'No reasoning data provided for this company.'}
          </div>
        </ArtifactSectionCollapsible>

        {financialMetrics.length > 0 && (
          <ArtifactSectionCollapsible title="Financial Context" defaultOpen>
            <KeyMetrics
              hardcodedMetrics={financialMetrics}
              isMetricsExpanded={isFinancialExpanded}
              setIsMetricsExpanded={setIsFinancialExpanded}
              showHeader={false}
              showCollapse={financialMetrics.length > 4}
              gridCols={2}
            />
          </ArtifactSectionCollapsible>
        )}
      </div>
    </div>
  );
};
