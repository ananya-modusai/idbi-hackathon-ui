"use client";

import { FC, useEffect } from "react";
import { motion } from "framer-motion";
import { Workspace } from "@/app/layout/Workspace/Workspace";
import InvMerchantOverviewTab from "./InvMerchantOverviewTab";
import InvDecisioningTab from "./InvDecisioningTab";
import InvWebAnalysisTab from "./InvWebAnalysisTab";
import InvVPAAnalysisTab from "./InvVPAAnalysisTab";
import InvCreditLimitProfileTab from "./InvCredit&LimitProfileTab";
// removed useActiveContextStore import because base caseWorkspace should render blank
import BlankInvestigationPage from "./BlankInvestigationPage";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import { useWorkspaceStore } from "@/app/store/workspace/workspaceStore";
import { useActiveContextStore } from "@/app/store/activeContextStore";
import { toPascalCase } from "@/lib/utils";
// import CustomerLinkagesTab from "./CustomerLinkagesTab";

interface InvCaseWorkspacePageProps {
  merchantId?: string;
  caseId?: string;
  name?: string;
}

const InvCaseWorkspacePage: FC<InvCaseWorkspacePageProps> = ({
  merchantId,
  caseId,
  name,
}) => {
  const initFromUrl = () => {};
  const fetchInvestigationCases = useInvestigationCaseStore(state => state.fetchInvestigationCases);
  const setActiveNavigation = useWorkspaceStore(state => state.setActiveNavigation);
  const setActiveComponent = useWorkspaceStore(state => state.setActiveComponent);
  const setActiveTab = useWorkspaceStore(state => state.setActiveTab);
  const setContext = useActiveContextStore(state => state.setContext);

  useEffect(() => {
    // Clear any active component to let the page-based children render
    setActiveComponent(null);
    // Set active navigation for the sidebar
    setActiveNavigation({ group: "Underwriting", item: "Case Workspace" });
    
    // keep the existing URL-init behavior if needed elsewhere; no-op here to avoid
    // auto-selecting an active investigation when visiting the base caseWorkspace route.
    try {
      initFromUrl();
    } catch {
      /* noop */
    }
  }, [setActiveNavigation, setActiveComponent]);

  let runIdFromSession = null;
  if (typeof window !== "undefined" && name) {
    const sessionKey = `inv_run_${toPascalCase(decodeURIComponent(name))}`;
    runIdFromSession = sessionStorage.getItem(sessionKey);
  }

  const selectedCaseIdFromContext = useActiveContextStore(state => state.activeContexts.investigation);
  const caseIdToUse = caseId || selectedCaseIdFromContext || runIdFromSession || undefined;

  useEffect(() => {
    if (caseIdToUse && name) {
      const sessionKey = `inv_run_${toPascalCase(decodeURIComponent(name))}`;
      sessionStorage.setItem(sessionKey, caseIdToUse);
    }
  }, [caseIdToUse, name]);

  useEffect(() => {
    // Load investigation cases and set selected case when caseId, name or runIdFromSession is provided
    if (caseId || name || runIdFromSession) {
      const loadAndSelectCase = async () => {
        let targetId = caseId || selectedCaseIdFromContext || runIdFromSession || undefined;
        
        // Ensure cases are loaded to resolve name or validate ID
        const currentCases = useInvestigationCaseStore.getState().investigationCases;
        if (currentCases.length === 0) {
          await fetchInvestigationCases();
        }
        
        if (!targetId && name) {
          const freshCases = useInvestigationCaseStore.getState().investigationCases;
          const decodedName = decodeURIComponent(name);

          // 1. First check if the currently selected context ID already matches this name.
          // This ensures that when navigating from the watchlist, the specific run ID is preserved.
          if (selectedCaseIdFromContext) {
            const contextCase = freshCases.find(c => String(c.caseId) === String(selectedCaseIdFromContext));
            if (contextCase) {
              const normalizedContextName = toPascalCase(contextCase.registeredName || contextCase.caseTitle || contextCase.caseId);
              if (normalizedContextName === decodedName || (contextCase.registeredName || contextCase.caseTitle || contextCase.caseId) === decodedName) {
                targetId = selectedCaseIdFromContext;
              }
            }
          }

          // 2. If no matching context, resolve from the list by name
          if (!targetId) {
            const found = freshCases.find(c => {
              const normalizedName = toPascalCase(c.registeredName || c.caseTitle || c.caseId);
              return normalizedName === decodedName || (c.registeredName || c.caseTitle || c.caseId) === decodedName;
            });
            if (found) {
              targetId = found.caseId;
            } else {
              // Fallback: name might actually be the ID
              targetId = name;
            }
          }
        }

        if (targetId && targetId !== useActiveContextStore.getState().activeContexts.investigation) {
          setContext("investigation", targetId);
          // Keep the current active tab if it's already a valid workspace tab, otherwise default to merchant-overview
          const currentTab = useWorkspaceStore.getState().activeTab;
          const validTabs = ["merchant-overview", "vpa-analysis"];
          if (!currentTab || !validTabs.includes(currentTab)) {
            setActiveTab("merchant-overview", "Merchant Overview");
          }
        }
      };
      loadAndSelectCase();
    }
  }, [caseId, name, runIdFromSession, selectedCaseIdFromContext, fetchInvestigationCases, setContext, setActiveTab]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const tabs = [
    {
      id: "merchant-overview",
      label: "Merchant Overview",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <InvMerchantOverviewTab
            key={`merchant-overview-${caseIdToUse || merchantId}`}
            merchantId={merchantId}
            caseId={caseIdToUse}
          />
        </motion.div>
      ),
    },
    {
      id: "vpa-analysis",
      label: "External Analysis",
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          {/* Sections (Scam Intelligence, External Presence, VPA Analysis) hidden for now */}
        </motion.div>
      ),
    },
  ];

  // When visiting the base case workspace route (no caseId or name that resolves to an ID in the URL),
  // always render the blank investigation page.
  if (!caseIdToUse) {
    return <BlankInvestigationPage />;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Workspace 
        tabs={tabs} 
        initialActiveTabId="merchant-overview" 
      />
    </motion.div>
  );
};

export default InvCaseWorkspacePage;
