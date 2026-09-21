'use client';

import { useCallback } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';
import { useActiveContextStore } from '@/app/store/activeContextStore';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';


export const useMerchantNavigation = () => {
  const router = useRouter();
  const { setActiveTab, setActiveNavigation, setActiveComponent } = useWorkspaceStore();
  const { setContext } = useActiveContextStore();
  const { merchantIdList } = useMerchantIdStore();

  const navigateToMerchantInsolvency = useCallback((merchantId: string, options?: { initialSection?: string | null, initialTab?: string | null, cin?: string | null }) => {
    try {
      
      // Navigate using router if CIN is available (either passed in or found in store)
      const cin = options?.cin || merchantIdList.find(m => m.id === merchantId)?.cin;
      if (cin) {
        router.push(`/insolvency/${cin}`);
      }

      // Set merchant context with actual merchant ID first
      setContext('merchant', merchantId);
      
      
      

      // Dynamically import the Insolvency component
      import('@/app/pages/Merchant/MerchantInsolvency/MerchantInsolvency').then((module) => {
        // Create component with merchantId prop and optional initialSection
        const MerchantInsolvencyWithProps = () => {
          const props: Record<string, unknown> = { merchantId };
          if (options?.initialSection) (props as unknown as Record<string, unknown>)['initialSection'] = options.initialSection;
          // If an initialSection was requested, also provide initialTab so the Workspace picks the correct starting tab
          if (options?.initialSection && !options?.initialTab) (props as unknown as Record<string, unknown>)['initialTab'] = 'external-insights';
          if (options?.initialTab) (props as unknown as Record<string, unknown>)['initialTab'] = options.initialTab;
          const componentProps = props as unknown as React.ComponentProps<typeof module.default>;
          return React.createElement(module.default, componentProps);
        };

        // Update workspace state with the component and navigation
        setActiveComponent(MerchantInsolvencyWithProps);
        setActiveNavigation({ group: 'Merchant', item: 'Insolvency' });
        // If caller requested opening a specific tab, set that tab
        if (options?.initialTab) {
          setActiveTab(options.initialTab, options.initialTab.charAt(0).toUpperCase() + options.initialTab.slice(1));
        } else if (options?.initialSection) {
          // If an initial section within external insights is requested, open external-insights tab
          setActiveTab('external-insights', 'External Intelligence');
        } else {
          setActiveTab('overview', 'Overview');
        }

        // Re-assert the requested tab after a short delay to avoid being overridden
        // by other global context handlers that may run after setContext.
        if (options?.initialTab || options?.initialSection) {
          const desiredTab = options?.initialTab ? options.initialTab : 'external-insights';
          setTimeout(() => {
            try {
              setActiveTab(desiredTab, desiredTab === 'external-insights' ? 'External Intelligence' : desiredTab.charAt(0).toUpperCase() + desiredTab.slice(1));
            } catch (err) {
              // ignore
            }
          }, 50);
        }
      });

    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [setContext, setActiveNavigation, setActiveTab, setActiveComponent, router, merchantIdList]);

  return {
    navigateToMerchantInsolvency
  };
};
