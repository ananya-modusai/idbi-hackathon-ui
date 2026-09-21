'use client';

import { FC } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import PeerFinancialAnalysisTab from './PeerFinancialAnalysisTab';
import PeerRatioAnalysisTab from './PeerRatioAnalysisTab';

// Financial Analysis and Ratio Analysis stacked vertically, matching this
// app's established stacked-sections convention (see BusinessDigitalPresenceTab.tsx).
// Related Party Transactions moved to the "Group & Management" sidebar entry
// (see GroupManagementTab.tsx).
const PeerComparisonTab: FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionHeaderWithFlags
          title="Financial Analysis"
          icon={BarChart3}
          iconColorClass="text-blue-600"
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
        />
        <div className="mt-3">
          <PeerFinancialAnalysisTab />
        </div>
      </div>

      <div>
        <SectionHeaderWithFlags
          title="Ratio Analysis"
          icon={PieChart}
          iconColorClass="text-indigo-600"
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
        />
        <div className="mt-3">
          <PeerRatioAnalysisTab />
        </div>
      </div>
    </div>
  );
};

export default PeerComparisonTab;
