import { useActiveContextStore } from '@/app/store/activeContextStore';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import { useInvestigationOverviewStore } from '@/app/store/merchant/investicationOverviewStore';
import { useInvestigationRedFlagsStore } from '@/app/store/merchant/InvestigationRedFlagsStore';
import { useInvestigationLinkagesStore } from '@/app/store/merchant/investigationLinkagesStore';
import { useInvestigationDigitalFootprintStore } from '@/app/store/merchant/investigationDigitalFootprintStore';
import { useActivityEventTimelineStore } from '@/app/store/merchant/activityEventTimelineStore';
import { useActivityTransactionsStore } from '@/app/store/merchant/activityTransactionsStore';
import { useCaseManagementStore } from '@/app/store/caseManagement/QueueManagerStore';
import { useInvestigationIDStore } from '@/app/store/caseManagement/InvestigationIDStore';
import { useWorkspace } from '../Workspace/WorkspaceContext';
import React, { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { cn, toPascalCase } from "@/lib/utils"
import { contextGroupMapping } from './constants';
import { sidebarGroups } from '../AppSidebar';
import { useCompanyStore } from '@/app/store/company/companyStore';
import { useChargebackCaseStore } from '@/app/store/chargeback/chargebackCaseStore';
import { useInvestigationCaseStore } from '@/app/store/investigation/investigationCaseStore';
import { BlankMerchantState } from '@/app/pages/Merchant/MerchantInsolvency/BlankMerchantState';

const contextNavigationMapping = {
  merchant: { group: "Merchant Report", item: "Overview" },
  customer: { group: "Customer", item: "Investigation" },
  rule: { group: "Strategy", item: "Rules" },
  case: { group: "Case Management", item: "Investigation Hub" },
  company: { group: "Initial Public Offering", item: "Listing Compliance" },
  intermediary: { group: "Initial Public Offering", item: "Entities" },
  chargeback: { group: "Chargeback", item: "Workspace" },
  investigation: { group: "Underwriting", item: "Case Workspace" }
} as const;

export function useActiveContext() {
  const { activeContexts, setContext } = useActiveContextStore();
  const { setSelectedMerchantId,fetchMerchantDetails, merchantIdList, selectedMerchantId, selectedMerchant } = useMerchantIdStore();
  const { fetchRiskAssessment, fetchKeyMetricList } = useInvestigationOverviewStore();
  const { fetchCaseInvestigations } = useCaseManagementStore();
  const { setInvestigationId, fetchInvestigationDetails } = useInvestigationIDStore();
  const { setActiveComponent, setActiveNavigation, activeNavigation, setActiveTab } = useWorkspace();
  const { setSelectedCompanyId, fetchCompanies } = useCompanyStore();
  const { setSelectedCaseId } = useChargebackCaseStore();
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const commandRef = React.useRef<HTMLDivElement>(null);

  // Fetch IPO companies when component mounts
  useEffect(() => {
    fetchCompanies(0, 100);
  }, [fetchCompanies]);

  const router = useRouter();
  const handleSelect = React.useCallback((type: keyof typeof contextNavigationMapping, value: string | null, label: string | null) => {
    console.log('handleSelect called with:', { type, value, label });
    setContext(type, value);
    setIsOpen(false); // Close the dropdown after any selection
    // If merchant context is cleared, navigate to the insolvency blank page
    if (type === 'merchant' && value === null) {
      // Clear all active contexts first to ensure merchant is null immediately
      if (useActiveContextStore.getState().clearContexts) {
        useActiveContextStore.getState().clearContexts();
      }
      // Reset workspace state and selected merchant. Show blank insolvency state.
      setActiveTab(null, null);
      setActiveComponent(BlankMerchantState);
      setActiveNavigation({ group: 'Merchant Report', item: 'Overview' });
      // clear selected merchant details from merchant store
      if (useMerchantIdStore.getState().clearSelectedMerchant) {
        useMerchantIdStore.getState().clearSelectedMerchant();
      }
      if (router) {
        router.push('/insolvency');
      }
      return;
    }
    
    if (value !== null && type === "merchant") {

      // Use merchant ID for all API calls
      setSelectedMerchantId(value);
      fetchMerchantDetails(value);
      fetchRiskAssessment(value);
      fetchKeyMetricList(value);
      fetchCaseInvestigations(value);
      
      // Set active tab to overview whenever a merchant is selected
      setActiveTab('overview', 'Overview');
      
      // Navigate using CIN in URL
      if (router) {
        // Clear active component to let page-based children render
        setActiveComponent(null);
        // Try to find CIN for this merchant from store and use it for the URL if present
        const { merchantIdList } = useMerchantIdStore.getState();
        const found = merchantIdList.find(m => m.id === value);
        const displayed = found && found.cin ? found.cin : value;
        router.push(`/insolvency/${displayed}`);
      }
      return;
    }

    if (value !== null && type === "company") {
      console.log('Handling company selection');
      setSelectedCompanyId(value);
      
      // Navigate to Listing Compliance
      const navigation = contextNavigationMapping[type];
      console.log('Navigation mapping:', navigation);
      
      const group = sidebarGroups.find(g => g.label === navigation.group);
      console.log('Found sidebar group:', group);
      
      const item = group?.items.find(i => i.label === navigation.item);
      console.log('Found sidebar item:', item);
      
      const Component = item?.component;
      if (group && item && Component) {
        console.log('Setting active component and navigation');
        setActiveComponent(() => React.createElement(Component));
        setActiveNavigation({ group: group.label, item: item.label });
      } else {
        console.log('Could not find component or navigation item');
      }
      return;
    }

    if (value !== null && type === "intermediary") {
      console.log('Handling intermediary selection');
      
      // Navigate to Entities page
      const navigation = contextNavigationMapping[type];
      console.log('Navigation mapping:', navigation);
      
      const group = sidebarGroups.find(g => g.label === navigation.group);
      console.log('Found sidebar group:', group);
      
      const item = group?.items.find(i => i.label === navigation.item);
      console.log('Found sidebar item:', item);
      
      const Component = item?.component;
      if (group && item && Component) {
        console.log('Setting active component and navigation');
        setActiveComponent(() => React.createElement(Component));
        setActiveNavigation({ group: group.label, item: item.label });
      } else {
        console.log('Could not find component or navigation item');
      }
      return;
    }

    if (value !== null && type === "case" && label !== null) {
      setInvestigationId(label);
      fetchInvestigationDetails(label);
      
      // Always navigate to the Investigation Hub when clicking on a case,
      // regardless of the current view
      const navigation = contextNavigationMapping[type];
      const group = sidebarGroups.find(g => g.label === navigation.group);
      const item = group?.items.find(i => i.label === navigation.item);
      const Component = item?.component;
      if (group && item && Component) {
        setActiveComponent(() => React.createElement(Component));
        setActiveNavigation({ group: group.label, item: item.label });
      }
      return; // Stop here after handling case navigation
    }

    // Handle chargeback case selection
    if (value !== null && type === "chargeback") {
      setSelectedCaseId(value);
      
      // Set active tab to case-history whenever a chargeback case is selected
      setActiveTab('case-history', 'Case History');
      
      // Navigate to Chargeback Workspace with case ID in URL
      if (router) {
        router.push(`/chargeback/${value}`);
      }
      return;
    }

    // Special handling for customer context
    if (value !== null && type === "customer") {
      // Only navigate if not already on a valid customer page
      if (activeNavigation?.group === "Customer" && (activeNavigation.item === "Investigation" || activeNavigation.item === "SMS Intelligence")) {
        return;
      }
      // Default to SMS Intelligence
      const group = sidebarGroups.find(g => g.label === "Customer");
      const item = group?.items.find(i => i.label === "SMS Intelligence");
      const Component = item?.component;
      if (group && item && Component) {
        setActiveComponent(() => React.createElement(Component));
        setActiveNavigation({ group: group.label, item: item.label });
      }
      return;
    }

    // Handle other context types (for non-merchant and non-case items)
    if (value !== null) {
      if (type === "investigation") {
        if (router) {
          // Clear active component to let page-based children render
          setActiveComponent(null);
          // Use label (name) for routing if available, otherwise fallback to value (id)
          const routeValue = label ? toPascalCase(label) : value;
          
          if (typeof window !== "undefined") {
            const sessionKey = `inv_run_${toPascalCase(decodeURIComponent(label || value))}`;
            sessionStorage.setItem(sessionKey, value);
          }
          
          router.push(`/Investigation/caseWorkspace/${routeValue}`);
        }
        return;
      }

      const navigation = contextNavigationMapping[type];
      const group = sidebarGroups.find(g => g.label === navigation.group);
      const item = group?.items.find(i => i.label === navigation.item);
      const Component = item?.component;
      if (group && item && Component) {
        setActiveComponent(() => React.createElement(Component));
        setActiveNavigation({ group: group.label, item: item.label });
      }
    }
  }, [setSelectedCompanyId, setSelectedMerchantId, setSelectedCaseId, fetchMerchantDetails, fetchRiskAssessment, fetchKeyMetricList, fetchCaseInvestigations, setInvestigationId, fetchInvestigationDetails, setActiveComponent, setActiveNavigation, setActiveTab, setContext, activeNavigation, router]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getItemClassName = (isActive: boolean) => {
    return cn(
      "transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      isActive && "bg-blue-50 hover:bg-blue-100 font-medium"
    )
  }

  const getDisplayText = () => {
    // If we have a chargeback context, show it
    if (activeContexts.chargeback) {
      const { chargebackCases } = useChargebackCaseStore.getState();
      const activeCase = chargebackCases.find(cbCase => cbCase.caseId === activeContexts.chargeback);
      const displayValue = activeCase ? activeCase.caseId : activeContexts.chargeback;
      
      return {
        prefix: "Active Case: ",
        value: displayValue
      };
    }
    
    // IF we are in the Investigation Tool section, prioritize investigation ID over merchant ID
    const isInvestigationSection = activeNavigation?.group === "Underwriting" && (activeNavigation.item === "Case Workspace" || activeNavigation.item === "All Cases");
    if (isInvestigationSection && activeContexts.investigation) {
      const { investigationCases } = useInvestigationCaseStore.getState();
      const activeCase = investigationCases.find(c => c.caseId === activeContexts.investigation);
      const displayValue = activeCase ? (activeCase.registeredName || activeCase.caseTitle || activeCase.caseId) : activeContexts.investigation;
      
      return {
        prefix: "Investigation: ",
        value: displayValue
      };
    }

    // If we have a merchant context, show it ONLY if we are NOT in the investigation section
    // (unless we are specifically in a view that links both, but user says don't consider merchant in inv tool)
    const effectiveMerchantId = activeContexts.merchant || selectedMerchantId;
    if (effectiveMerchantId && !isInvestigationSection) {
      // Try to find merchant in the lightweight merchantIdList first
      let activeMerchant = merchantIdList.find(m => m.id === effectiveMerchantId);

      // If not found, try to use the full selectedMerchant object (fetched by fetchMerchantDetails)
      if (!activeMerchant && selectedMerchant) {
        const sm: any = selectedMerchant as any;
        const smId = sm.merchant_id || sm.id || sm.merchantId;
        if (smId === effectiveMerchantId) {
          activeMerchant = {
            id: smId,
            cin: sm.cin || sm.cin_number || null,
            legalName: sm.legal_name || sm.basicInfo?.legalName || sm.merchant_legalName || '',
            tradeName: sm.trade_name || sm.tradeName || sm.basicInfo?.tradeName || '',
            createdAt: sm.created_at || sm.createdAt || new Date().toISOString(),
            updatedAt: sm.updated_at || sm.updatedAt || new Date().toISOString()
          };
        }
      }

      const displayValue = activeMerchant?.cin 
        ? `${activeMerchant.cin.slice(0, 6)}...`
        : effectiveMerchantId;

      // Debug logging to trace why ActiveContext may appear stale
      // eslint-disable-next-line no-console
      console.log('[useActiveContext] effectiveMerchantId, displayValue, activeContexts.merchant, selectedMerchantId', { effectiveMerchantId, displayValue, activeContextsMerchant: activeContexts.merchant, selectedMerchantId });

      return {
        prefix: "Active Merchant: ",
        value: displayValue
      };
    }

    // First, try to find a context type that matches both group and item
    const contextType = Object.entries(contextNavigationMapping).find(
      ([_key, mapping]) => mapping.group === activeNavigation?.group && mapping.item === activeNavigation?.item
    )?.[0] as keyof typeof activeContexts;

    if (contextType && contextGroupMapping[contextType]) {
      const mapping = contextGroupMapping[contextType];
      return {
        prefix: mapping.defaultPreText,
        value: activeContexts[contextType] || mapping.defaultText
      };
    }

    // Fallback: find any context type that matches the group
    const groupMapping = Object.entries(contextGroupMapping).find(
      ([_key, value]) => value.group === activeNavigation?.group
    );

    if (groupMapping) {
      const [contextType, mapping] = groupMapping;
      return {
        prefix: mapping.defaultPreText,
        value: activeContexts[contextType as keyof typeof activeContexts] || mapping.defaultText
      };
    }

    return {
      prefix: "",
      value: "Search for anything"
    };
  };

  return {
    activeContexts,
    inputValue,
    isOpen,
    commandRef,
    setInputValue,
    setIsOpen,
    handleSelect,
    getItemClassName,
    getDisplayText
  };
}


