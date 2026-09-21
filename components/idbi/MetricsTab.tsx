"use client";

// Metrics — the month-by-month metric grid behind the assessment.
//
// Uses what the app already has: MetricGrid for the capacity cards, SegmentedToggle for
// the group/period/applicability switches, CustomListFilter for the search, and
// CompactTable for the grid itself (first column frozen, latest month highlighted).

import * as React from "react";
import { BadgeIndianRupee, BarChart3, CalendarRange, Coins, PiggyBank, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

import data from "@/app/idbi-data/vandana-workspace.json";
import { cn } from "@/lib/utils";
import { InfoTip, MetricGrid, SectionHeader, SegmentedToggle } from "@/components/idbi/workspace-ui";
import CustomListFilter, {
  PrimaryFilterGroup, SecondaryFilterGroup, TertiaryFilterGroup, useFilterState,
} from "@/components/custom/CustomList/customListFilter";

interface Metric {
  code: string; id: string; label: string; type: string; unit: string;
  definition: string; benchmark: string; benchmarkDefinition: string;
  format?: string; direction?: "higher" | "lower"; threshold?: number;
  values: Array<number | string | null>; assessment?: string;
}
interface MetricGroup { id: string; label: string; metrics: Metric[] }

const CAPACITY_ICONS = [BadgeIndianRupee, Wallet, Coins, PiggyBank];
const GROUP_ICONS: Record<string, React.ElementType> = {
  "cash-flow": TrendingUp, debt: Coins, resilience: ShieldCheck,
};

const periodLabel = (month: string, index: number) => `${month} ’${index < 3 ? "25" : "26"}`;

const displayValue = (metric: Metric, value: number | string | null) => {
  if (value === null) return "—";
  if (typeof value === "string") return value;
  if (metric.format === "currency-lakh") return value.toFixed(value < 1 ? 2 : 1);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

/** Cell tint: green when the value meets its benchmark, amber when close, rose when not. */
const valueTone = (metric: Metric, value: number | string | null) => {
  if (value === null) return "bg-slate-50 text-slate-400";
  if (metric.format === "text") {
    const pass = value === "Yes" || String(value).includes("0 DPD");
    return pass ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800";
  }
  if (typeof value !== "number" || metric.threshold === undefined) return "bg-white text-slate-700";
  const passes = metric.direction === "lower" ? value <= metric.threshold : value >= metric.threshold;
  const close = metric.direction === "lower"
    ? value <= Math.max(metric.threshold * 1.25, metric.threshold + 1)
    : value >= metric.threshold * 0.75;
  return passes ? "bg-emerald-50 text-emerald-800" : close ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-800";
};

export function MetricsTab() {
  const metrics = data.metrics as any;
  const applicableGroups = metrics.groups as MetricGroup[];
  const naGroups = (metrics.notApplicableGroups ?? []) as MetricGroup[];

  const [period, setPeriod] = React.useState("6 Months");
  const [applicability, setApplicability] = React.useState("Applicable");
  const [groupFilter, setGroupFilter] = React.useState("All");
  const [query, setQuery] = React.useState("");

  const showingNA = applicability.startsWith("Not applicable");
  const monthStart = period === "6 Months" ? 6 : 0;
  const months = (metrics.months as string[]).slice(monthStart);

  const applicableCount = applicableGroups.reduce((n, g) => n + g.metrics.length, 0);
  const naCount = naGroups.reduce((n, g) => n + g.metrics.length, 0);

  const source = showingNA ? naGroups : applicableGroups;
  const filtered = (groupFilter === "All" ? source : source.filter(g => g.label === groupFilter))
    .map(g => ({ ...g, metrics: g.metrics.filter(m => `${m.code} ${m.label} ${m.type}`.toLowerCase().includes(query.trim().toLowerCase())) }))
    .filter(g => g.metrics.length);

  const capacityMetrics = (metrics.capacity as any[]).map((item, i) => ({
    label: item.label, value: item.value, secondary: item.secondary, icon: CAPACITY_ICONS[i] ?? BarChart3,
  }));

  // Search goes through the shared filter component, as everywhere else in the app.
  const tertiaryFilterGroups = React.useMemo<TertiaryFilterGroup[]>(() => [
    {
      id: "search", label: "Search", type: "searchbar" as const, options: [],
      selectedValues: query ? [query] : [],
      onFilterChange: () => {},
      onSearchChange: (v: string) => setQuery(v),
      showLabel: false,
      searchPlaceholder: "Search metrics by name, code or type...",
    },
  ], [query]);
  const filterGroups = React.useMemo(() => ({
    primary: [] as PrimaryFilterGroup[], secondary: [] as SecondaryFilterGroup[], tertiary: tertiaryFilterGroups,
  }), [tertiaryFilterGroups]);
  const { filterState, setFilterState } = useFilterState(filterGroups);

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader icon={BadgeIndianRupee} title="Financial Capacity" />
        <MetricGrid metrics={capacityMetrics} />
      </section>

      <section>
        <SectionHeader
          icon={CalendarRange}
          title="Monthly Metrics"
          action={
            <SegmentedToggle
              value={applicability}
              onChange={v => { setApplicability(v); setGroupFilter("All"); setQuery(""); }}
              options={[
                { value: "Applicable", label: `Applicable ${applicableCount}` },
                { value: "Not applicable", label: `Not applicable ${naCount}` },
              ]}
            />
          }
        />

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <SegmentedToggle
            value={groupFilter}
            onChange={setGroupFilter}
            options={[
              { value: "All", label: `All ${showingNA ? naCount : applicableCount}` },
              ...source.map(g => ({ value: g.label, label: `${g.label} ${g.metrics.length}` })),
            ]}
          />
          {!showingNA && (
            <SegmentedToggle
              value={period}
              onChange={setPeriod}
              options={[{ value: "6 Months", label: "6 Months" }, { value: "12 Months", label: "12 Months" }]}
            />
          )}
        </div>

        <div className="pt-4">
          <CustomListFilter
            filterGroups={filterGroups}
            filterState={filterState}
            setFilterState={setFilterState}
            showFilterToggle={false}
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-xs" style={{ minWidth: showingNA ? 900 : 1180 }}>
            <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-[.055em] text-slate-500">
              <tr>
                <th className="sticky left-0 z-20 w-[250px] border-b border-r border-slate-200 bg-slate-50 px-3 py-2.5">Metric</th>
                <th className="w-[120px] border-b border-r border-slate-200 px-3 py-2.5">Type</th>
                <th className="w-[90px] border-b border-r border-slate-200 px-3 py-2.5">Unit</th>
                <th className="w-[180px] border-b border-r border-slate-200 px-3 py-2.5">Benchmark</th>
                {showingNA
                  ? <th className="border-b border-slate-200 px-3 py-2.5">Why not applicable</th>
                  : months.map((m, i) => (
                    <th key={m} className={cn("min-w-[86px] border-b border-slate-200 px-3 py-2.5 text-center normal-case tracking-normal", i === months.length - 1 && "bg-blue-50 text-blue-700")}>
                      {periodLabel(m, monthStart + i)}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(group => {
                const Icon = GROUP_ICONS[group.id] ?? BarChart3;
                return (
                  <React.Fragment key={group.id}>
                    <tr>
                      <td colSpan={(showingNA ? 1 : months.length) + 4} className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                          <Icon className="size-3.5 text-blue-600" />{group.label}
                        </span>
                      </td>
                    </tr>
                    {group.metrics.map(metric => (
                      <tr key={metric.id} className="transition-colors hover:bg-[#f4f8ff]">
                        <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-900">{metric.label}</span>
                            <InfoTip text={metric.definition} />
                          </div>
                        </td>
                        <td className="border-b border-r border-slate-200 px-3 py-2.5 text-slate-600">{metric.type}</td>
                        <td className="border-b border-r border-slate-200 px-3 py-2.5 font-medium text-slate-700">{metric.unit}</td>
                        <td className="border-b border-r border-slate-200 px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-700">{metric.benchmark}</span>
                            <InfoTip text={metric.benchmarkDefinition} />
                          </div>
                        </td>
                        {showingNA
                          ? <td className="border-b border-slate-200 px-3 py-2.5 leading-5 text-slate-600">{metric.assessment}</td>
                          : metric.values.slice(monthStart).map((value, i) => (
                            <td
                              key={`${metric.id}-${months[i]}`}
                              className={cn(
                                "border-b border-l border-slate-100 px-2 py-2.5 text-center text-[11px] font-semibold tabular-nums",
                                valueTone(metric, value),
                                i === months.length - 1 && "font-bold ring-1 ring-inset ring-blue-100"
                              )}
                            >
                              {displayValue(metric, value)}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="px-4 py-10 text-center text-xs text-slate-500">No metrics match your search.</div>}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-slate-500">{metrics.benchmarkNote}</p>
      </section>
    </div>
  );
}

export default MetricsTab;
