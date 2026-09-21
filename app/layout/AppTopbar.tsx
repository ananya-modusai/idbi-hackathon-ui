"use client"

import { useWorkspace } from "@/app/layout/Workspace/WorkspaceContext"
import { ChevronRight, RefreshCw } from "lucide-react"
import { ActiveContext } from "./ActiveContext/ActiveContext"
import { useEffect } from "react"
import { BubbleTag } from "@/components/custom/BubbleTag"

export function AppTopbar() {
  const { activeNavigation, activeTab, activeTabLabel, refreshActiveTab, setActiveTab } = useWorkspace()

  // Reset tab label when navigation changes
  useEffect(() => {
    // When navigation changes, we should reset any active tab information
    // to avoid showing stale data from previous sections
    if (activeNavigation) {
      setActiveTab(null, null);
    }
  }, [activeNavigation?.group, activeNavigation?.item, setActiveTab]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (activeTab) {
      refreshActiveTab()
    }
  }

  const isHomePage = !activeNavigation?.group && !activeNavigation?.item;

  // Single-tab pages label their one tab after the sidebar item, which would
  // render the same crumb twice and needlessly widen the bar.
  const showTabCrumb = !!activeTabLabel && activeTabLabel !== activeNavigation?.item;

  return (
    <header className="border-b bg-white h-14 flex items-center px-6 justify-between gap-4 relative z-40 min-w-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {!isHomePage && (
          <h1 className="flex items-center text-sm font-medium min-w-0">
            <span className="text-muted-foreground hover:text-foreground transition-colors truncate">
              {activeNavigation?.group}
            </span>
            <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground truncate">
              {activeNavigation?.item}
            </span>
            {showTabCrumb && (
              <>
                <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-blue-600 truncate">
                  {activeTabLabel}
                </span>
                <div
                  onClick={handleRefresh}
                  className="ml-3 cursor-pointer flex-shrink-0"
                >
                  <BubbleTag
                    text="Refresh"
                    color="blueTextWhiteBg"
                    hasInsideIcon={true}
                    icon={<RefreshCw className="h-3.5 w-3.5" />}
                    onHover={true}
                    withBorder={true}
                  />
                </div>
              </>
            )}
          </h1>
        )}
      </div>

      {<ActiveContext />}
    </header>
  )
}