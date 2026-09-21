'use client';

import { FC, useEffect, useMemo } from 'react';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import InsolvencyOverviewTab from './InsolvencyOverviewTab';
import InsolvencyFinancialOperationalTab from './InsolvencyFinancialOperationalTab';
import InsolvencyExternalInsightsGroup from './InsolvencyExternalInsightsGroup';
import InsolvencyMetricsTab from './InsolvencyMetricsTab';
import DebtCreditTab from './DebtCreditTab';
import PeerAnalysisPage from '../PeerAnalysis/PeerAnalysisPage';
import GroupManagementTab from './GroupManagementTab';
import ComplianceSummaryTab from '../ComplianceLegal/ComplianceSummaryTab';
import { useActiveContextStore } from '@/app/store/activeContextStore';
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';

interface MerchantInsolvencyProps {
  merchantId: string;
  initialSection?: string | null;
  initialTab?: string | null;
}

// Everything lives on one "Merchant Report" page now — Peer Analysis,
// External Insights and Compliance Summary used to be their own sidebar
// entries; they're folded in here as ordinary tabs (the ones with their own
// sub-views keep a small internal tab bar, same pattern as PeerAnalysisPage /
// InsolvencyExternalInsightsGroup) so there's a single sidebar entry for the
// whole report.
const MerchantInsolvency: FC<MerchantInsolvencyProps> = ({ merchantId, initialSection = undefined, initialTab = undefined }) => {
  const initFromUrl = useActiveContextStore(state => state.initFromUrl);
  const setActiveNavigation = useWorkspaceStore(state => state.setActiveNavigation);

  const activeTabId = initialTab || ((typeof initialSection === 'string' && initialSection) ? 'external-insights' : 'overview');

  useEffect(() => {
    setActiveNavigation({ group: 'Merchant Report', item: 'Merchant Report' });
    initFromUrl();
  }, [initFromUrl, setActiveNavigation]);

  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview',
      content: <InsolvencyOverviewTab key={`overview-${merchantId}`} merchantId={merchantId} /> },
    { id: 'group-management', label: 'Group & Management',
      content: <GroupManagementTab key={`group-management-${merchantId}`} /> },
    { id: 'financial-operational', label: 'Financial & Operational',
      content: <InsolvencyFinancialOperationalTab key={`financial-operational-${merchantId}`} merchantId={merchantId} /> },
    { id: 'metrics', label: 'Ratio Analysis',
      content: <InsolvencyMetricsTab key={`metrics-${merchantId}`} merchantId={merchantId} /> },
    { id: 'debt-credit', label: 'Credit Analysis',
      content: <DebtCreditTab key={`debt-credit-${merchantId}`} merchantId={merchantId} /> },
    { id: 'peer-analysis', label: 'Peer Analysis',
      content: <PeerAnalysisPage key={`peer-analysis-${merchantId}`} /> },
    { id: 'compliance-summary', label: 'Compliance & Legal',
      content: <ComplianceSummaryTab key={`compliance-summary-${merchantId}`} merchantId={merchantId} /> },
    { id: 'external-insights', label: 'External Intelligence',
      content: (
        <InsolvencyExternalInsightsGroup
          key={`external-insights-${merchantId}`}
          merchantId={merchantId}
          initialSection={initialSection}
        />
      ) },
  ], [merchantId, initialSection]);

  const initialActiveTabId = tabs.some(t => t.id === activeTabId) ? activeTabId : 'overview';

  return <Workspace tabs={tabs} initialActiveTabId={initialActiveTabId} />;
};

export default MerchantInsolvency;
