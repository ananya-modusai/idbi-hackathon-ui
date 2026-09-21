'use client';

import { FC, useMemo, useState } from 'react';
import { WorkspaceTabBar } from '@/app/layout/Workspace/WorkspaceTabBar';
import PeerSelectionTab from './PeerSelectionTab';
import PeerComparisonTab from './PeerComparisonTab';

const PeerAnalysisPage: FC = () => {
  const [activeTab, setActiveTab] = useState('peer-selection');

  const tabs = useMemo(() => [
    {
      id: 'peer-selection',
      label: 'Peer Selection',
      content: <PeerSelectionTab />,
    },
    {
      id: 'peer-comparison',
      label: 'Peer Comparison',
      content: <PeerComparisonTab />,
    },
  ], []);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="flex flex-col">
      <WorkspaceTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="pt-4">{activeContent}</div>
    </div>
  );
};

export default PeerAnalysisPage;
