import * as React from "react"
import { useWorkspace } from "@/app/layout/Workspace/WorkspaceContext"
import { cn } from "@/lib/utils"
import { CollapseButton } from "./ArtifactCollapseButton"
import { ArtifactContent } from "./ArtifactContent"
import { ReactNode } from "react"
import { useArtifactStore } from "@/app/store/artifact/artifactStore"

/**
 * Core Artifact Component
 * 
 * This component implements a browser-like panel that can be:
 * - Collapsed/expanded (similar to browser devtools)
 * - Shows multiple tabs with artifacts
 * - Maintains tab state and content
 * 
 * Key Features:
 * 1. Collapsible panel with smooth animations
 * 2. Dynamic width adjustment
 * 3. Tab height calculations for proper layout
 * 4. Artifact content rendering system
 */

export interface Artifact {
  id: string;
  title: string;
  renderArtifact: () => ReactNode;
  [key: string]: any;
}

export interface Tab {
  id: string;
  title: string;
  artifact: Artifact | null;
  currentUrl: string;
  history: Artifact[];
  historyIndex: number;
  isBlank?: boolean;
  locked?: boolean;
}

export const ItemType = {
  TAB: 'tab',
}; 

export interface ArtifactProps {
  renderArtifact: (artifact: any) => React.ReactNode;
}

export interface ArtifactState {
  isCollapsed: boolean;
  currentArtifact: any | null;
  tabsHeight: number;
} 

export function Artifact() {
  const { artifact, activeComponent } = useWorkspace()
  const { tabs, activeTabId, isCollapsed, setCollapsed, tabRef, uiRefreshKey } = useArtifactStore();
  const [tabsHeight, setTabsHeight] = React.useState(0);
  const prevActiveComponentRef = React.useRef(activeComponent);

  // Handle width adjustments when collapse state changes
  React.useEffect(() => {
    document.documentElement.style.setProperty('--artifact-width', isCollapsed ? '2.5rem' : '50%');
    return () => {
      document.documentElement.style.removeProperty('--artifact-width');
    };
  }, [isCollapsed]);

  // When an artifact is set from the workspace, expand the panel
  React.useEffect(() => {
    if (!artifact) return;
    setCollapsed(false);
  }, [artifact, setCollapsed]);

  // When component changes, only collapse panel if there are no tabs open
  // This prevents the panel from collapsing when switching tabs
  React.useEffect(() => {
    if (activeComponent !== prevActiveComponentRef.current) {
      prevActiveComponentRef.current = activeComponent;
      
      // Only collapse if we have no tabs or no active tab
      if (tabs.length === 0 || !activeTabId) {
        setCollapsed(true);
      }
    }
  }, [activeComponent, tabs, activeTabId, setCollapsed]);

  // Update tab height for proper button positioning
  React.useEffect(() => {
    const updateTabsHeight = () => {
      if (tabRef.current) {
        setTabsHeight(tabRef.current.offsetHeight);
      }
    };

    updateTabsHeight();
    const observer = new ResizeObserver(updateTabsHeight);
    if (tabRef.current) {
      observer.observe(tabRef.current);
    }

    return () => observer.disconnect();
  }, [tabRef]);

  // Handle panel collapsing/expanding
  const handleToggleCollapse = React.useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  return (
    <div className={cn(
      "flex-shrink-0 bg-white rounded-lg relative",
      "transition-[width,opacity] duration-300 ease-in-out",
      "overflow-hidden",
      isCollapsed ? "w-10" : "w-[var(--artifact-width,50%)]"
    )}>
      <div className="w-full h-full">
        <ArtifactContent/>
      </div>
      <CollapseButton
        isCollapsed={isCollapsed}
        tabsHeight={tabsHeight}
        onToggle={handleToggleCollapse}
      />
    </div>
  );
}
