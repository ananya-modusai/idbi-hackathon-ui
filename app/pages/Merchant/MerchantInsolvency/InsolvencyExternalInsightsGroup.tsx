'use client';

import { FC, useMemo, useState } from 'react';
import { WorkspaceTabBar } from '@/app/layout/Workspace/WorkspaceTabBar';
import BusinessDigitalPresenceTab from './BusinessDigitalPresenceTab';
import InsolvencyExternalInsightsTab from './InsolvencyExternalInsightsTab';
import InsolvencyRedFlagsTab from './InsolvencyRedFlagsTab';

interface InsolvencyExternalInsightsGroupProps {
  merchantId: string;
  initialSection?: string | null;
}

// Same nested-tab-bar pattern as PeerAnalysisPage — External Insights has its
// own 3 sub-views, surfaced as an internal tab bar within the single
// "External Insights" tab of the main Merchant Report page.
const InsolvencyExternalInsightsGroup: FC<InsolvencyExternalInsightsGroupProps> = ({ merchantId, initialSection = undefined }) => {
  const [activeSubTab, setActiveSubTab] = useState('business-digital-presence');

  const tabs = useMemo(() => [
    {
      id: 'business-digital-presence',
      label: 'Business & Digital Presence',
      content: <BusinessDigitalPresenceTab key={`business-digital-presence-${merchantId}`} />,
    },
    {
      id: 'external-insights',
      label: 'External Insights',
      content: (
        <InsolvencyExternalInsightsTab
          key={`external-insights-${merchantId}`}
          merchantId={merchantId}
          initialSection={initialSection}
        />
      ),
    },
    {
      id: 'red-flags',
      label: 'Red Flags',
      content: <InsolvencyRedFlagsTab key={`red-flags-${merchantId}`} merchantId={merchantId} />,
    },
  ], [merchantId, initialSection]);

  const activeContent = tabs.find(tab => tab.id === activeSubTab)?.content;

  return (
    <div className="flex flex-col">
      <WorkspaceTabBar tabs={tabs} activeTab={activeSubTab} onTabChange={setActiveSubTab} />
      <div className="pt-4">{activeContent}</div>
    </div>
  );
};

export default InsolvencyExternalInsightsGroup;
