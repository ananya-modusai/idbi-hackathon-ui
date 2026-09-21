import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';
import { useInvestigationOverviewStore } from '@/app/store/merchant/investicationOverviewStore';
import { useCaseManagementStore } from '@/app/store/caseManagement/QueueManagerStore';
import { useInvestigationHubStore } from '@/app/store/caseManagement/InvestigationHubStore';
import { usePromptsStore } from '@/app/store/prompts/promptsStore';
import { useCallback } from 'react';

export const useWorkspaceContext = () => {
  const { activeNavigation, activeTab } = useWorkspaceStore();
  const { riskAssessment, keyMetricList, summary } = useInvestigationOverviewStore();
  const { caseInvestigations } = useCaseManagementStore();
  const { caseEvents } = useInvestigationHubStore();
  const { fetchContextBasedPrompts } = usePromptsStore();

  const getContextForCurrentView = useCallback(() => {
    const baseContext = {
      navigation: activeNavigation,
      activeTab,
    };

    // Merchant Investigation contexts
    if (activeNavigation?.group === "Merchant" && activeNavigation?.item === "Investigation") {
      switch (activeTab) {
        case 'overview':
          return {
            ...baseContext,
            riskAssessment,
            keyMetricList,
            summary,
            caseInvestigations
          };
        // Add other tabs as needed
      }
    }

    // Case Management contexts
    if (activeNavigation?.group === "Case Management") {
      switch (activeTab) {
        case 'investigation-timeline':
          return {
            ...baseContext,
            caseEvents
          };
        // Add other tabs as needed
      }
    }

    return baseContext;
  }, [activeNavigation, activeTab, riskAssessment, keyMetricList, summary, caseInvestigations, caseEvents]);

  const refreshContextPrompts = useCallback(() => {
    const context = getContextForCurrentView();
    fetchContextBasedPrompts(context);
  }, [getContextForCurrentView, fetchContextBasedPrompts]);

  return {
    refreshContextPrompts
  };
}; 