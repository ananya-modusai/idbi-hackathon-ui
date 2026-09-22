"use client";

import { FC, useMemo, useState } from "react";
import { ArrowRight, BellRing, ChevronRight, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomListFilter, {
  PrimaryFilterGroup,
  SecondaryFilterGroup,
  TertiaryFilterGroup,
  useFilterState,
} from "@/components/custom/CustomList/customListFilter";
import { ActionButton, StatusPill } from "@/components/idbi/workspace-ui";
import { BubbleTag } from "@/components/custom/BubbleTag";
import alertData from "@/app/idbi-data/sales-alerts.json";

const TABS = [{ id: "alerts", label: "Sales Alerts" }] as const;
type TabId = (typeof TABS)[number]["id"];

/** Each kind of alert keeps its own chip tone, as the delivery has it. */
const TYPE_TONE: Record<string, "rose" | "emerald" | "blue" | "violet"> = {
  "Market Event": "rose",
  "Customer Event": "emerald",
  "Career Event": "blue",
  "Account Signal": "violet",
};

export const SalesAlertsScreen: FC<{ onGoToCustomers: () => void }> = ({ onGoToCustomers }) => {
  const [tab, setTab] = useState<TabId>("alerts");
  const [period, setPeriod] = useState<string[]>([alertData.periods[0]]);
  const [typeSelected, setTypeSelected] = useState<string[]>([]);

  const typeOptions = useMemo(
    () => Object.keys(TYPE_TONE).map(t => ({ value: t, label: t })),
    []
  );

  const primaryFilterGroup = useMemo<PrimaryFilterGroup[]>(
    () => [
      {
        id: "period",
        label: "Period",
        type: "multiselect" as const,
        options: alertData.periods.map(p => ({ value: p, label: p })),
        selectedValues: period,
        onFilterChange: (vals: string[]) => setPeriod(vals.length ? [vals[vals.length - 1]] : [alertData.periods[0]]),
        singleSelect: true,
        showAllOption: false,
        showLabel: true,
        width: "270px",
      },
      {
        id: "type",
        label: "Alert Type",
        type: "multiselect" as const,
        options: typeOptions,
        selectedValues: typeSelected,
        onFilterChange: (vals: string[]) => setTypeSelected(vals),
        showAllOption: true,
        showLabel: true,
        width: "290px",
      },
    ],
    [period, typeOptions, typeSelected]
  );

  const secondaryFilterGroups = useMemo<SecondaryFilterGroup[]>(() => [], []);
  const tertiaryFilterGroups = useMemo<TertiaryFilterGroup[]>(() => [], []);
  const filterGroups = useMemo(
    () => ({ primary: primaryFilterGroup, secondary: secondaryFilterGroups, tertiary: tertiaryFilterGroups }),
    [primaryFilterGroup, secondaryFilterGroups, tertiaryFilterGroups]
  );
  const { filterState, setFilterState } = useFilterState(filterGroups);

  const alerts = useMemo(
    () => (typeSelected.length ? alertData.alerts.filter(a => typeSelected.includes(a.type)) : alertData.alerts),
    [typeSelected]
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Tab bar — pinned to the top of the content card, as the other screens have it. */}
      <div className="flex shrink-0 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-center text-sm font-medium transition-colors",
              tab === t.id ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto px-6 pb-10 pt-5">
        <div className="w-full border-b border-gray-200 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <BellRing className="h-5 w-5 flex-shrink-0 text-blue-700" />
            <span className="truncate text-lg font-semibold text-blue-700">Sales Alerts</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Customer and market events that may warrant RM outreach.
          </p>
        </div>

        <div className="pt-4">
          <CustomListFilter
            filterGroups={filterGroups}
            filterState={filterState}
            setFilterState={setFilterState}
            showFilterToggle={false}
          />
        </div>

        <div className="space-y-2.5 pt-2">
          {alerts.map(alert => (
            <article
              key={alert.id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,.03)]"
            >
              <span className="w-[132px] shrink-0">
                <StatusPill tone={TYPE_TONE[alert.type] ?? "slate"}>{alert.type}</StatusPill>
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600">{alert.detail}</p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {"audience" in alert && alert.audience && (
                    <BubbleTag
                      text={alert.audience}
                      color="blue"
                      withBorder
                      hasInsideIcon
                      icon={<Users className="size-3.5" />}
                    />
                  )}
                  {"customer" in alert && alert.customer && (
                    <>
                      <BubbleTag
                        text={alert.customer.name}
                        color="blue"
                        withBorder
                        hasInsideIcon
                        icon={<UserRound className="size-3.5" />}
                      />
                      <StatusPill tone="slate">{alert.customer.cid}</StatusPill>
                      <StatusPill tone="slate">{alert.customer.relationship}</StatusPill>
                      <StatusPill tone="slate">{alert.customer.tier}</StatusPill>
                      <StatusPill tone="slate">{alert.customer.category}</StatusPill>
                      <StatusPill tone="slate">{alert.customer.location}</StatusPill>
                    </>
                  )}
                  {"tags" in alert && (alert.tags ?? []).map((tag: string) => (
                    <StatusPill key={tag} tone="slate">{tag}</StatusPill>
                  ))}
                </div>
              </div>

              <div className="shrink-0">
                <ActionButton variant="default" onClick={onGoToCustomers}>
                  {alert.action} <ArrowRight />
                </ActionButton>
              </div>
            </article>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <BellRing className="size-6" />
            </span>
            <p className="text-sm font-medium text-slate-900">No alerts of this type in the selected period.</p>
            <button type="button" onClick={() => setTypeSelected([])} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
              Show every alert <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAlertsScreen;
