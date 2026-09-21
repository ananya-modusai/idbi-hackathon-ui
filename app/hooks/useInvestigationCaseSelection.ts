import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveContextStore } from '@/app/store/activeContextStore';
import { useWorkspace } from '@/app/layout/Workspace/WorkspaceContext';
import { sidebarGroups } from '@/app/layout/AppSidebar';
import { cn, toPascalCase } from '@/lib/utils';
import React from 'react';

/**
 * Custom hook to handle investigation case selection
 * Replicates the same functionality as ActiveContext when an investigation case is selected
 */
export const useInvestigationCaseSelection = () => {
  const router = useRouter();
  const { setContext } = useActiveContextStore();
  const { setActiveComponent, setActiveNavigation, setActiveTab } = useWorkspace();

  const selectInvestigationCase = useCallback(async (caseId: string) => {
    // Set the context in the active context store
    setContext('investigation', caseId);
    
    // Set active tab to case-history whenever an investigation case is selected
    setActiveTab('case-history', 'Case History');
    
    // Set sidebar navigation to Investigation -> Case Workspace
    setActiveComponent(null);
    setActiveNavigation({ group: "Investigation", item: "Case Workspace" });
    const routeValue = toPascalCase(caseId);
    if (typeof window !== "undefined") {
      const sessionKey = `inv_run_${toPascalCase(decodeURIComponent(caseId))}`;
      sessionStorage.setItem(sessionKey, caseId);
    }
    
    // Navigate to Investigation Case Workspace with case ID in URL
    router.push(`/Investigation/caseWorkspace/${routeValue}`);
  }, [router, setContext, setActiveComponent, setActiveNavigation]);

  return {
    selectInvestigationCase
  };
};

