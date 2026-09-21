"use client";

// A docked artifact panel, following the cam-ui Artifact: it SHARES the width with the
// content rather than overlaying it, carries a tab strip (openable records become tabs,
// each closable), and collapses to a thin rail via a chevron on its left edge.

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ArtifactTab {
  id: string;
  title: string;
  render: () => React.ReactNode;
}

export function ArtifactPanel({
  tabs, activeTabId, onActivate, onClose, collapsed, onToggleCollapsed,
}: {
  tabs: ArtifactTab[];
  activeTabId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  if (tabs.length === 0) return null;
  const active = tabs.find(t => t.id === activeTabId) ?? tabs[0];

  return (
    <div
      className={cn(
        "sticky top-0 max-h-[calc(100vh-11rem)] shrink-0 self-start overflow-hidden rounded-lg border border-gray-200 bg-white",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-10" : "w-[460px]"
      )}
    >
      {/* Collapse handle on the left edge, as cam's artifact has it. */}
      <button
        onClick={onToggleCollapsed}
        title={collapsed ? "Expand panel" : "Collapse panel"}
        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        className="absolute left-0 top-3 z-10 grid h-8 w-6 place-items-center rounded-r-md border border-l-0 border-gray-200 bg-white text-gray-400 transition-colors hover:text-gray-700"
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {collapsed ? (
        <div className="flex h-full items-start justify-center pt-14">
          <span className="rotate-90 whitespace-nowrap text-xs font-medium tracking-wide text-gray-400">
            {tabs.length} open
          </span>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col pl-6">
          {/* Tab strip */}
          <div className="flex shrink-0 overflow-x-auto border-b border-gray-200">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => onActivate(tab.id)}
                className={cn(
                  "group relative flex h-9 min-w-0 cursor-pointer items-center gap-1 border-r border-gray-100 px-2.5 text-xs transition-colors duration-150 hover:bg-blue-50/50",
                  tab.id === active.id ? "bg-blue-50/70 font-medium text-blue-700" : "text-gray-600"
                )}
              >
                <span className="max-w-[150px] truncate">{tab.title}</span>
                <button
                  onClick={e => { e.stopPropagation(); onClose(tab.id); }}
                  className="shrink-0 rounded-sm p-0.5 transition-colors hover:bg-blue-100/50"
                  aria-label={`Close ${tab.title}`}
                >
                  <X className="h-3 w-3 text-gray-400 hover:text-blue-600" />
                </button>
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">{active.render()}</div>
        </div>
      )}
    </div>
  );
}

export default ArtifactPanel;
