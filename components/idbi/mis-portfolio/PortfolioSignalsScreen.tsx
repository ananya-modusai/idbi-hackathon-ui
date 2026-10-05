"use client";

import { FC, useState } from "react";
import { cn } from "@/lib/utils";
import { MisPortfolioDashboardTab } from "./MisPortfolioDashboardTab";

// The source wrapped this dashboard in <Workspace tabs=[{Dashboard}]>. That shell
// isn't ported, so the tab bar is rebuilt here with the IDBI pattern (same markup
// as CustomerWorkspace) — otherwise the screen renders with no name on it.
const TABS = [{ id: "dashboard", label: "Dashboard" }] as const;

type TabId = (typeof TABS)[number]["id"];

export const PortfolioSignalsScreen: FC<{ onOpenCustomer?: (customerId: string) => void }> = ({ onOpenCustomer }) => {
  const [tab, setTab] = useState<TabId>("dashboard");

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 px-4 py-2.5 text-center text-sm font-medium transition-colors",
              tab === t.id ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* min-w-0 keeps a wide child (the centrality table) scrolling inside itself
          instead of widening the page. */}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 pb-10 pt-6">
        <div className="min-w-0">
          {tab === "dashboard" && <MisPortfolioDashboardTab onOpenCustomer={onOpenCustomer} />}
        </div>
      </div>
    </div>
  );
};

export default PortfolioSignalsScreen;
