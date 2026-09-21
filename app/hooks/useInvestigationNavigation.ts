'use client';

import { useCallback } from 'react';
import * as React from 'react';
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';
import { useActiveContextStore } from '@/app/store/activeContextStore';

export const useInvestigationNavigation = () => {
  const { setActiveTab, setActiveNavigation, setActiveComponent } = useWorkspaceStore();
  const { setContext } = useActiveContextStore();

  const navigateToInvestigationWorkspace = useCallback(async (caseId: string) => {
    try {
      // Set investigation context with actual case ID first
      setContext('investigation', caseId);

      // Dynamically import the Investigation Workspace component
      import('@/app/pages/Investigation/InvWorkspace/InvCaseWorkspacePage').then((module) => {
        // Create component with caseId prop
        const InvWorkspaceWithProps = () => {
          return React.createElement(module.default, { caseId });
        };
        
        // Update workspace state with the component and navigation
        setActiveComponent(InvWorkspaceWithProps);
        setActiveNavigation({ group: 'Investigation', item: 'Case Workspace' });
        setActiveTab('case-history', 'Case History');
      });

    } catch (error) {
      console.error('Investigation navigation error:', error);
    }
  }, [setContext, setActiveNavigation, setActiveTab, setActiveComponent]);

  return {
    navigateToInvestigationWorkspace
  };
};

