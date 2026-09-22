"use client";

// Metrics — the month-by-month metric grid behind the assessment.
//
// Uses what the app already has: MetricGrid for the capacity cards, SegmentedToggle for
// the group/period/applicability switches, CustomListFilter for the search, and
// CompactTable for the grid itself (first column frozen, latest month highlighted).

import * as React from "react";
import { BadgeIndianRupee, BarChart3, CalendarDays, CalendarRange, Coins, PiggyBank, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

import { useWorkspaceData } from "@/components/idbi/workspaceData";
import { cn } from "@/lib/utils";
import { DataUnavailable, InfoTip, MetricGrid, SectionHeader, SegmentedToggle } from "@/components/idbi/workspace-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

/** Period-on-period change, as the insolvency statement prints it (+/-x%). */
const changeLabel = (metric: Metric, prev: number | string | null | undefined, current: number | string | null) => {
  if (typeof prev !== "number" || typeof current !== "number" || prev === 0) return "";
  const pct = ((current - prev) / Math.abs(prev)) * 100;
  if (!Number.isFinite(pct) || Math.abs(pct) < 0.05) return "";
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
};

/** A rise is good unless the metric reads better when lower — then the sign inverts. */
const changeValue = (metric: Metric, change: string) => {
  const raw = parseFloat(change.replace("+", "").replace("%", ""));
  if (!Number.isFinite(raw)) return 0;
  return metric.direction === "lower" ? -raw : raw;
};

// Literal class names: Tailwind only generates what it can see in the source, so an
// interpolated `bg-green-${n}` would never be emitted.
//
// Strength is also what decides the text colour: on the deep tints (300/400) dark text
// loses contrast, so the type goes light; on the pale tints it stays dark.
const changeStrength = (metric: Metric, change: string) => {
  if (!change) return null;
  const v = changeValue(metric, change);
  if (v === 0) return null;
  const a = Math.abs(v);
  const step = a < 5 ? 50 : a < 10 ? 100 : a < 20 ? 200 : a < 30 ? 300 : 400;
  return { positive: v > 0, step };
};

const changeBg = (metric: Metric, change: string) => {
  const s = changeStrength(metric, change);
  if (!s) return "";
  if (s.positive) {
    return s.step === 50 ? "bg-green-50" : s.step === 100 ? "bg-green-100" : s.step === 200 ? "bg-green-200" : s.step === 300 ? "bg-green-300" : "bg-green-400";
  }
  return s.step === 50 ? "bg-red-50" : s.step === 100 ? "bg-red-100" : s.step === 200 ? "bg-red-200" : s.step === 300 ? "bg-red-300" : "bg-red-400";
};

/** The metric value on a tinted cell — white once the tint is deep. */
const valueOnTint = (metric: Metric, change: string) => {
  const s = changeStrength(metric, change);
  if (!s) return "text-slate-900";
  return s.step >= 300 ? "text-white" : "text-slate-900";
};

const changeText = (metric: Metric, change: string) => {
  const s = changeStrength(metric, change);
  if (!s) return "text-gray-500";
  if (s.step >= 300) return "text-white/90";
  return s.positive ? "text-emerald-700" : "text-red-700";
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
  const data = useWorkspaceData();
  // A customer assessed at onboarding has no metric history with us yet.
  const metrics = (data.metrics ?? { capacity: [], groups: [], notApplicableGroups: [], months: [], benchmarkNote: "" }) as any;
  const hasMetrics = Boolean(data.metrics);
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

  if (!hasMetrics) {
    return (
      <div className="px-6 pb-16 pt-5">
        <SectionHeader icon={BadgeIndianRupee} title="Metric Trends" />
        <DataUnavailable
          icon={CalendarDays}
          headline={`No metric history is available for ${data.customer.name} yet.`}
          required="at least one completed month of transactions on an IDBI account"
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader icon={BadgeIndianRupee} title="Current Financial Position" />
        <MetricGrid metrics={capacityMetrics} />
      </section>

      <section>
        <SectionHeader
          icon={CalendarRange}
          title="Metric Trends"
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
              { value: "All", label: `All Metrics ${showingNA ? naCount : applicableCount}` },
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

        {/* Same table language as the insolvency Financial Statements table: shadcn Table,
            sticky first column, grey group rows spanning the width, right-aligned value
            cells tinted by the change against the previous period with the change itself
            printed small and italic underneath. The InfoTip icons are kept. */}
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-white py-2">Metric</TableHead>
                <TableHead className="py-2">Type</TableHead>
                <TableHead className="py-2">Unit</TableHead>
                <TableHead className="py-2">Benchmark</TableHead>
                {showingNA
                  ? <TableHead className="py-2">Why not applicable</TableHead>
                  : months.map((m, i) => (
                    <TableHead key={m} className="py-2 text-right">{periodLabel(m, monthStart + i)}</TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(group => {
                const Icon = GROUP_ICONS[group.id] ?? BarChart3;
                const span = (showingNA ? 1 : months.length) + 4;
                return (
                  <React.Fragment key={group.id}>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={span} className="sticky left-0 bg-slate-50 py-1.5 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="size-3.5 text-blue-600" />{group.label}
                        </span>
                      </TableCell>
                    </TableRow>
                    {group.metrics.map(metric => (
                      <TableRow key={metric.id}>
                        <TableCell className="sticky left-0 bg-white py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-900">{metric.label}</span>
                            <InfoTip text={metric.definition} />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-slate-600">{metric.type}</TableCell>
                        <TableCell className="py-3 text-slate-700">{metric.unit}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-700">{metric.benchmark}</span>
                            <InfoTip text={metric.benchmarkDefinition} />
                          </div>
                        </TableCell>
                        {showingNA
                          ? <TableCell className="py-3 leading-5 text-slate-600">{metric.assessment}</TableCell>
                          : metric.values.slice(monthStart).map((value, i, arr) => {
                            const change = changeLabel(metric, arr[i - 1], value);
                            return (
                              <TableCell key={`${metric.id}-${months[i]}`} className={cn("py-3 text-right", changeBg(metric, change))}>
                                <div className="flex h-full flex-col items-end justify-center">
                                  <div className={cn("tabular-nums", valueOnTint(metric, change))}>{displayValue(metric, value)}</div>
                                  {change ? (
                                    <span className={cn("text-xs font-medium italic", changeText(metric, change))}>{change}</span>
                                  ) : (
                                    <div className="invisible text-xs">&nbsp;</div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && <div className="px-4 py-10 text-center text-xs text-slate-500">No metrics match your search.</div>}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-slate-500">{metrics.benchmarkNote}</p>
      </section>
    </div>
  );
}

export default MetricsTab;
