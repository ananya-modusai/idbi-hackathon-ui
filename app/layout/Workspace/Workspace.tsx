import * as React from "react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from 'react';
import { WorkspaceContent } from './WorkspaceContent';
import { WorkspaceTabBar } from './WorkspaceTabBar';
import { useWorkspaceStore } from '@/app/store/workspace/workspaceStore';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface WorkspaceProps {
  children?: React.ReactNode
  className?: string
  tabs?: Tab[]
  initialActiveTabId?: string
  contentScrollable?: boolean
}

export function Workspace({
  children,
  className,
  tabs,
  initialActiveTabId,
  contentScrollable = true,
}: WorkspaceProps) {
  const { setActiveTab, refreshKey } = useWorkspaceStore();
  const [localActiveTab, setLocalActiveTab] = useState<string | null>(
    initialActiveTabId || tabs?.[0]?.id || null
  );
  const previousInitialActiveTabIdRef = useRef<string | undefined>(initialActiveTabId);

  useEffect(() => {
    if (!tabs || tabs.length === 0) return;

    const activeTabExists = localActiveTab ? tabs.some(tab => tab.id === localActiveTab) : false;
    if (activeTabExists) return;

    const fallbackTabId =
      (initialActiveTabId && tabs.some(tab => tab.id === initialActiveTabId))
        ? initialActiveTabId
        : tabs[0]?.id || null;

    if (fallbackTabId !== localActiveTab) {
      setLocalActiveTab(fallbackTabId);
    }
  }, [tabs, localActiveTab, initialActiveTabId]);

  // Update local active tab only when the parent intentionally changes the initial tab
  // and the user has not already moved away from the previous initial tab.
  useEffect(() => {
    const previousInitialActiveTabId = previousInitialActiveTabIdRef.current;
    previousInitialActiveTabIdRef.current = initialActiveTabId;

    if (
      initialActiveTabId &&
      initialActiveTabId !== localActiveTab &&
      localActiveTab === previousInitialActiveTabId
    ) {
      setLocalActiveTab(initialActiveTabId);
    }
  }, [initialActiveTabId, localActiveTab]);

  // Sync local state with store
  useEffect(() => {
    if (localActiveTab && tabs) {
      const activeTabData = tabs.find(tab => tab.id === localActiveTab);
      setActiveTab(localActiveTab, activeTabData?.label || null);
    }
  }, [localActiveTab, setActiveTab, tabs]);

  const handleTabChange = React.useCallback((tabId: string) => {
    setLocalActiveTab(tabId);
  }, []);

  // Create memoized content with refreshKey dependency
  const activeContent = React.useMemo(() => {
    if (!localActiveTab || !tabs) return null;
    const content = tabs.find(tab => tab.id === localActiveTab)?.content;
    return content ? React.cloneElement(content as React.ReactElement, { key: refreshKey }) : null;
  }, [localActiveTab, tabs, refreshKey]);

  if (!tabs) {
    return (
      <div className={cn("bg-white rounded-lg overflow-hidden flex flex-col flex-1 min-h-0", className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn("bg-white rounded-lg overflow-hidden flex flex-col flex-1 min-h-0", className)}>
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <WorkspaceTabBar 
          tabs={tabs}
          activeTab={localActiveTab}
          onTabChange={handleTabChange}
        />  
        <WorkspaceContent 
          key={`${localActiveTab}-${refreshKey}`}
          content={activeContent}
          scrollable={contentScrollable}
        />
      </div>
    </div>
  );
}

// export class WorkspaceErrorBoundary extends React.Component<{children: React.ReactNode}> {
//   state = { hasError: false };
  
//   static getDerivedStateFromError() {
//     return { hasError: true };
//   }
  
//   render() {
//     if (this.state.hasError) {
//       return <div>Something went wrong loading the workspace.</div>;
//     }
//     return this.props.children;
//   }
// }
