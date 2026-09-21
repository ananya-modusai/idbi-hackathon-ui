'use client';

import { FC, useEffect, useMemo } from 'react';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import ComplianceSummaryTab from './ComplianceSummaryTab';
import { useActiveContextStore } from '@/app/store/activeContextStore';
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';

interface ComplianceLegalProps {
  merchantId: string;
  initialTab?: string | null;
}

// Same pattern as MerchantInsolvency: navigation happens from the
// "Compliance & Legal" sidebar group, this just picks which view to render
// based on the tab id passed in (see AppSidebar.tsx).
const TAB_LABELS: Record<string, string> = {
  'compliance-summary': 'Compliance Summary',
};

const ComplianceLegal: FC<ComplianceLegalProps> = ({ merchantId, initialTab = undefined }) => {
  const initFromUrl = useActiveContextStore(state => state.initFromUrl);
  const setActiveNavigation = useWorkspaceStore(state => state.setActiveNavigation);

  const activeTabId = initialTab || 'compliance-summary';

  useEffect(() => {
    setActiveNavigation({ group: 'Compliance & Legal', item: TAB_LABELS[activeTabId] || 'Compliance Summary' });
    initFromUrl();
  }, [initFromUrl, setActiveNavigation, activeTabId]);

  const tabs = useMemo(() => {
    const content = (() => {
      switch (activeTabId) {
        case 'compliance-summary':
        default:
          return <ComplianceSummaryTab key={`compliance-summary-${merchantId}`} merchantId={merchantId} />;
      }
    })();

    return [{
      id: activeTabId,
      label: TAB_LABELS[activeTabId] || 'Compliance Summary',
      content,
    }];
  }, [activeTabId, merchantId]);

  return <Workspace tabs={tabs} initialActiveTabId={activeTabId} />;
};

export default ComplianceLegal;
