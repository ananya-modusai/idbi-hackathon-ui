'use client';

import { useCallback } from 'react';
import * as React from 'react';
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';
import { useActiveContextStore } from '@/app/store/activeContextStore';

export const useChargebackNavigation = () => {
  const { setActiveTab, setActiveNavigation, setActiveComponent } = useWorkspaceStore();
  const { setContext } = useActiveContextStore();

  const navigateToChargebackWorkspace = useCallback((caseId: string) => {
    try {
      // Set chargeback context with actual case ID first
      setContext('chargeback', caseId);

      // Dynamically import the Chargeback Workspace component
      import('@/app/pages/Chargebacks/CBWorkspace/CBWorkspacePage').then((module) => {
        // Create component with caseId prop
        const CBWorkspaceWithProps = () => {
          return React.createElement(module.default, { caseId });
        };
        
        // Update workspace state with the component and navigation
        setActiveComponent(CBWorkspaceWithProps);
        setActiveNavigation({ group: 'Chargeback', item: 'Workspace' });
        setActiveTab('case-history', 'Case History');
      });

    } catch (error) {
      console.error('Chargeback navigation error:', error);
    }
  }, [setContext, setActiveNavigation, setActiveTab, setActiveComponent]);

  return {
    navigateToChargebackWorkspace
  };
};
