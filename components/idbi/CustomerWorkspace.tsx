"use client";

import { FC, useState } from "react";
import { ArrowLeft, Sparkles, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { CustomerProfileTab } from "./CustomerProfileTab";
import { FinancialPositionTab } from "./FinancialPositionTab";
import { RequestsActivityTab } from "./RequestsActivityTab";
import { AiAnalysisTab } from "./AiAnalysisTab";
import { MetricsTab } from "./MetricsTab";
import { ModusAgentPanel } from "./ModusAgentPanel";

export interface WorkspaceCustomer {
  customer_id: string;
  name: string;
  profile: string;
  relationship: string;
  location: string;
  health: { score: number; band: string };
}

// Order follows the product-lead delivery: profile, activity, analysis, position, metrics.
const TABS = [
  { id: "profile", label: "Customer Profile" },
  { id: "activity", label: "Requests & Activity" },
  { id: "analysis", label: "AI Analysis" },
  { id: "financial", label: "Financial Position" },
  { id: "metrics", label: "Metrics" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const CustomerWorkspace: FC<{ customer: WorkspaceCustomer; onBack: () => void }> = ({ customer, onBack }) => {
  const [tab, setTab] = useState<TabId>("profile");
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState<string | undefined>(undefined);
  const initials = customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  const openAgent = (prompt?: string) => {
    setAgentPrompt(prompt);
    setAgentOpen(true);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      {/* Left column: fixed header + tabs, scrolling content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Tab bar — pinned to the very top of the content card (cam-ui pattern):
            tabs divide the width, label centred, active tab underlined. */}
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

        <div className="shrink-0 px-6 pt-5 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={onBack} className="text-gray-400 hover:text-gray-600" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">{initials}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-blue-600">{customer.name}</h2>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    Customer ID {customer.customer_id}
                    <Copy className="h-3.5 w-3.5 text-blue-500" />
                  </span>
                  <BubbleTag text={customer.profile} color="grayTextWhiteBg" withBorder={true} />
                  <BubbleTag
                    text={`Financial Health: ${customer.health.score} · ${customer.health.band}`}
                    color={customer.health.band === "Good" ? "green" : customer.health.band === "Poor" ? "red" : "yellow"}
                    withBorder={true}
                  />
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{customer.location} · RM: Ananya Rao</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setAgentOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4" /> {agentOpen ? "Hide Agent" : "Modus Agent"}
              </button>
            </div>
          </div>
        </div>

        {/* Scrolling content — pb gives the last section room to breathe */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 pb-10 pt-6">
          <div className="min-w-0">
            {tab === "profile" && (
              <CustomerProfileTab
                onOpenActivity={() => setTab("activity")}
                onOpenFinancial={() => setTab("financial")}
                onOpenAgent={openAgent}
              />
            )}
            {tab === "activity" && <RequestsActivityTab />}
            {tab === "analysis" && <AiAnalysisTab />}
            {tab === "financial" && <FinancialPositionTab onOpenAgent={openAgent} />}
            {tab === "metrics" && <MetricsTab />}
          </div>
        </div>
      </div>

      {agentOpen && (
        <ModusAgentPanel
          customerName={customer.name}
          healthScore={customer.health.score}
          healthBand={customer.health.band}
          openMatters={2}
          seedPrompt={agentPrompt}
          onClose={() => setAgentOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerWorkspace;
