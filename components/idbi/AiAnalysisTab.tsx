"use client";

// AI Analysis — the Financial Health assessment in full: the AI summary, the score with
// its band scale and three pillars, the commentary, and every scored driver.
//
// Built from components this app already has: InsightBox for the AI summary, BandScale
// and MetricCard for the score block, SegmentedToggle for the filters, CompactTable for
// the driver list, and the ArtifactPanel for a driver's detail — overlays were dropped
// from this app, so a driver opens as a docked tab rather than a sheet.

import * as React from "react";
import { ArrowRight, BarChart3, CalendarCheck, ChevronRight, ClipboardCheck, Coins, CreditCard, FileText, Landmark, Lightbulb, LifeBuoy, ListChecks, PiggyBank, Receipt, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";

import data from "@/app/idbi-data/vandana-workspace.json";
import { cn } from "@/lib/utils";
import {
  InfoTip, InsightBox, MetricCard, SectionHeader, SegmentedToggle, StatusPill,
} from "@/components/idbi/workspace-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowSegmentBar, BandScale, GaugeBand } from "@/components/idbi/ScoreVisuals";
import { Info } from "lucide-react";
import { FactTable } from "./FactTable";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

interface DriverComponent { metric: string; label: string; value: string; benchmark: string }
interface Driver {
  code: string; name: string; role?: string; score?: number | null; band: string;
  facts?: string; assessment: string; definition?: string; evaluation?: string;
  components: DriverComponent[];
}
interface DriverGroup { id: string; label: string; drivers: Driver[] }

/** Health bands as the assessment defines them (0–39 / 40–54 / 55–69 / 70–100). */
const ASSESSMENT_BANDS: GaugeBand[] = [
  { from: 0, to: 39, color: "#f87171", label: "Poor" },
  { from: 39, to: 54, color: "#fbbf24", label: "Vulnerable" },
  { from: 54, to: 69, color: "#3b82f6", label: "Stable" },
  { from: 69, to: 100, color: "#10b981", label: "Good" },
];

const PILLAR_VISUALS: Record<string, { icon: React.ElementType; tone: "emerald" | "blue"; copy: string }> = {
  "cash-flow": { icon: TrendingUp, tone: "emerald", copy: "Regular receipts and healthy cash flow." },
  debt: { icon: Coins, tone: "emerald", copy: "Repayments remain affordable." },
  resilience: { icon: ShieldCheck, tone: "blue", copy: "Reserves cover about 1.8 months." },
};

/** Health bands (0–100) used by the plain-language analysis panel. */
const HEALTH_BANDS: GaugeBand[] = [
  { from: 0, to: 40, color: "#dc2626", label: "Stressed" },
  { from: 40, to: 60, color: "#d97706", label: "Vulnerable" },
  { from: 60, to: 75, color: "#eab308", label: "Stable" },
  { from: 75, to: 85, color: "#4ade80", label: "Good" },
  { from: 85, to: 100, color: "#16a34a", label: "Excellent" },
];
const DRIVER_COLORS = ["#1e4e8c", "#3b82f6", "#93c5fd"];
const healthPanelBg = (score: number) => (score >= 75 ? "bg-green-50" : score >= 60 ? "bg-blue-50" : score >= 40 ? "bg-amber-50" : "bg-red-50");
const bandPill = (score: number) =>
  (score >= 75 ? "emerald" : score >= 60 ? "blue" : score >= 40 ? "amber" : "rose") as "emerald" | "blue" | "amber" | "rose";

const bandText = (score: number) => (score >= 75 ? "text-emerald-700" : score >= 60 ? "text-blue-700" : score >= 40 ? "text-amber-700" : "text-rose-700");

/** Plain-English meaning for each driver, so the panel needs no glossary. */
/** One line on what each driver is read from. */
const DRIVER_BASIS: Record<string, string> = {
  "Cash Flow Strength": "Consistent receipts and positive cash remaining after regular commitments.",
  "Debt Sustainability": "Observed repayments remain affordable with no current overdue stress.",
  "Financial Resilience": "Accessible reserves remain below the three-month benchmark and are the main constraint on the score.",
};

const DRIVER_PLAIN: Record<string, { title: string; meaning: string }> = {
  "Cash Flow Strength": { title: "Money coming in", meaning: "How steady the income is, and how much is left after regular spending." },
  "Debt Sustainability": { title: "Ability to repay loans", meaning: "Whether the EMIs are comfortable against the income, and paid on time." },
  "Financial Resilience": { title: "Cushion for a bad month", meaning: "Savings and deposits available if income dips for a while." },
};
const BAND_PLAIN: Record<string, string> = {
  Excellent: "very strong, well ahead of peers",
  Good: "comfortable, can take on more",
  Stable: "steady, no immediate concern",
  Vulnerable: "tight, watch closely",
  Stressed: "under strain, needs support",
};

const healthBandLabel = (score: number) => (HEALTH_BANDS.find(b => score >= b.from && score <= b.to) ?? HEALTH_BANDS[0]).label;

/** Group icons, matching the Monthly Metrics grouping. */
const GROUP_ICONS: Record<string, React.ElementType> = {
  "cash-flow": TrendingUp, debt: Coins, resilience: ShieldCheck,
};

/** Per-driver icon, so a row is scannable without reading the code. */
const DRIVER_ICONS: Record<string, React.ElementType> = {
  CFS01: Wallet, CFS02: Receipt, CFS03: PiggyBank,
  DBS01: Coins, DBS02: CalendarCheck, DBS03: CreditCard,
  FRS01: ShieldCheck, FRS02: Landmark, FRS03: LifeBuoy,
};

const bandIconTone = (band: string) =>
  band === "Strong" ? "bg-emerald-50 text-emerald-600"
    : band === "Stable" ? "bg-blue-50 text-blue-600"
      : band === "Vulnerable" || band === "Review" ? "bg-amber-50 text-amber-600"
        : band === "Not applicable" ? "bg-slate-100 text-slate-500"
          : "bg-rose-50 text-rose-600";

const bandTone = (band: string) =>
  band === "Strong" ? "emerald"
    : band === "Stable" ? "blue"
      : band === "Vulnerable" || band === "Review" ? "amber"
        : band === "Not applicable" ? "slate"
          : "rose";

export function AiAnalysisTab() {
  const assessment = (data.customer as any).borrowerAssessment;
  const [allOpportunities, setAllOpportunities] = React.useState(false);
  const shownOpportunities = allOpportunities ? assessment.opportunities : assessment.opportunities.slice(0, 4);
  const hiddenOpportunities = assessment.opportunities.length - 4;

  const health = data.financialHealthDetail as any;
  const driverGroups = (health.groups as DriverGroup[]).filter(g => g.id !== "evidence");
  const notApplicable = (health.notApplicableDrivers ?? []) as Driver[];

  const customer = data.customer as any;
  const [cohort, setCohort] = React.useState("portfolio");
  const percentile = cohort === "portfolio" ? 82 : 74;
  const histogram = cohort === "portfolio" ? [8, 18, 46, 96, 166, 144, 164, 180, 118, 60] : [1, 4, 10, 20, 32, 35, 39, 34, 18, 7];

  const [applicability, setApplicability] = React.useState("Applicable");
  const [groupFilter, setGroupFilter] = React.useState("All");

  const [selectedDriver, setSelectedDriver] = React.useState<Driver | null>(null);

  const applicableCount = driverGroups.reduce((n, g) => n + g.drivers.length, 0);
  const showingNA = applicability.startsWith("Not applicable");

  const groups: DriverGroup[] = showingNA
    ? [{ id: "not-applicable", label: "Not applicable for this customer", drivers: notApplicable }]
    : groupFilter === "All" ? driverGroups : driverGroups.filter(g => g.label === groupFilter);

  const allDrivers = [...driverGroups.flatMap(g => g.drivers), ...notApplicable];
  const openDriver = (d: Driver) => setSelectedDriver(d);

  const renderDriver = (d: Driver) => (
    <div className="p-5">
      <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold tracking-[.04em] text-slate-500">{d.code}</span>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{d.name}</h3>
        <div className="flex items-center gap-2">
          <StatusPill tone={bandTone(d.band) as any}>{d.band}</StatusPill>
          {typeof d.score === "number" && <span className="text-sm font-semibold tabular-nums text-slate-700">{d.score}/100</span>}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2"><Sparkles className="size-4 text-blue-600" /><h4 className="text-sm font-semibold text-slate-950">AI reasoning</h4></div>
        <p className={cn(
          "mt-3 rounded-lg border px-4 py-3.5 text-sm font-medium leading-6",
          d.band === "Strong" ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
            : d.band === "Stable" ? "border-blue-200 bg-blue-50/70 text-blue-950"
              : "border-slate-200 bg-slate-50 text-slate-800"
        )}>{d.assessment}</p>
        <ul className="mt-3 space-y-2 pl-5 text-sm leading-5 text-slate-700">
          {[d.facts, d.definition, d.evaluation].filter(Boolean).map(b => <li key={b} className="list-disc pl-1">{b}</li>)}
        </ul>
      </div>

      {d.components?.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2"><BarChart3 className="size-4 text-blue-600" /><h4 className="text-sm font-semibold text-slate-950">Key metrics</h4></div>
          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2">Metric</TableHead>
                  <TableHead className="py-2">Current</TableHead>
                  <TableHead className="py-2">Benchmark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.components.map(c => (
                  <TableRow key={c.metric}>
                    <TableCell className="py-3 font-medium text-slate-900">{c.label}</TableCell>
                    <TableCell className="py-3 font-medium tabular-nums text-slate-900">{c.value}</TableCell>
                    <TableCell className="py-3 text-slate-600">{c.benchmark}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );


  return (
    <div className="space-y-10">
        <section>
          <SectionHeader
            icon={Sparkles}
            title="AI Assessment Summary"
            titleMeta={<StatusPill tone="emerald">{health.band}</StatusPill>}
          />
          {/* Two findings side by side, then the opportunities they produce underneath. */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-sm"><BarChart3 className="size-4" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-700">Financial Position</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{assessment.financialPosition}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm"><ClipboardCheck className="size-4" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blue-700">Recommended Action</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{assessment.recommendedAction}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
            <div className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm"><Lightbulb className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-blue-700">Opportunities</p>
                <ul className="mt-1.5 space-y-1.5">
                  {shownOpportunities.map((opportunity: { title: string; text: string }) => (
                    <li key={opportunity.title} className="flex gap-2 text-sm leading-6 text-slate-700">
                      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-slate-500" />
                      <span className="min-w-0">
                        <strong className="text-slate-900">{opportunity.title}</strong> — {opportunity.text}
                      </span>
                    </li>
                  ))}
                </ul>
                {/* {hiddenOpportunities > 0 && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAllOpportunities(v => !v)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      {allOpportunities ? "Show less" : `Show ${hiddenOpportunities} more`} <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </section>

      <section>
        <SectionHeader icon={ShieldCheck} title="Financial Health Analysis" />
        {/* Same panel language as the insolvency Probability-of-Default section (tinted
            panel, big band-coloured headline, dashed arrow-segment breakdown), but the
            copy is plain: one sentence per idea, no jargon, no tooltip-only meaning. */}
        {/* Two boxes side by side: the score and what it is made of, then the drivers
            behind it. The peer comparison that used to sit on the right is gone. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={cn("rounded-lg border border-gray-100 p-5 shadow-sm", healthPanelBg(health.score))}>
            <p className="text-md font-semibold text-slate-900">Financial Health Score</p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <span className={cn("text-5xl font-bold leading-none", bandText(health.score))}>{health.score}</span>
              <span className="pb-1 text-lg font-semibold text-slate-500">/ 100</span>
              <span className="pb-1"><StatusPill tone={bandPill(health.score)}>{healthBandLabel(health.score)}</StatusPill></span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              Computed from {customer.healthDrivers.length} driver groups · {applicableCount} applicable checks
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-700">
              In plain terms: <strong className="text-slate-900">{customer.name.split(" ")[0]} manages money well.</strong> Income comfortably covers
              the EMIs, nothing is overdue, and there is money left over most months.
            </p>

            <div className="mt-1">
              {/* <p className="text-sm font-semibold text-slate-900">What makes up this score</p>
              <p className="mt-0.5 text-xs text-slate-600">Three things are measured. A wider block means it contributes more.</p> */}
              <div className="mt-2">
                <ArrowSegmentBar
                  segments={customer.healthDrivers.map((d: any, i: number) => ({ label: String(d.score), value: d.score, color: DRIVER_COLORS[i], name: d.name }))}
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/70 bg-green-100/70 px-3 py-2.5">
              <Info className="mt-0.5 size-3.5 shrink-0 text-slate-700" />
              <p className="text-xs leading-5 text-slate-600">Current income supports repayments; reserve cover is the main constraint.</p>
            </div>
          </div>

          <div className="rounded-lg flex flex-col justify-between border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-md font-semibold text-slate-900">What is driving the score</p>
            <div className="mt-3 divide-y divide-slate-100">
              {customer.healthDrivers.map((driver: any, index: number) => {
                const DIcon = [BarChart3, Coins, ShieldCheck][index] ?? ListChecks;
                return (
                  <div key={driver.name} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><DIcon className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{driver.name}</span>
                        <span className={cn("text-sm font-bold tabular-nums", bandText(driver.score))}>{driver.score}</span>
                        <StatusPill tone={driver.score >= 75 ? "emerald" : "blue"}>{driver.band}</StatusPill>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{DRIVER_BASIS[driver.name]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
              <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
              <p className="text-xs leading-5 text-slate-600">
                Score basis: recognised receipts, operating outflows, verified debt obligations and accessible reserves.
                Operating-account liquidity is assessed separately and is not automatically treated as personal savings.
              </p>
            </div>
          </div>
        </div>
      </section>


        <section>
          <SectionHeader
            icon={ListChecks}
            title="Assessment Drivers & Flags"
            action={
              <SegmentedToggle
                value={applicability}
                onChange={v => { setApplicability(v); setGroupFilter("All"); }}
                options={[
                  { value: "Applicable", label: `Applicable ${applicableCount}` },
                  { value: "Not applicable", label: `Not applicable ${notApplicable.length}` },
                ]}
              />
            }
          />
          {/* Group filter sits between the section header and the table. */}
          {!showingNA && (
            <div className="mb-3">
              <SegmentedToggle
                value={groupFilter}
                onChange={setGroupFilter}
                options={[
                  { value: "All", label: `All ${applicableCount}` },
                  ...driverGroups.map(g => ({ value: g.label, label: `${g.label} ${g.drivers.length}` })),
                ]}
              />
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 w-[360px] bg-white py-2">Driver</TableHead>
                  <TableHead className="w-[42%] py-2">Insight</TableHead>
                  <TableHead className="py-2 text-right">Score</TableHead>
                  <TableHead className="py-2">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(group => (
                  <React.Fragment key={group.id}>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={4} className="sticky left-0 bg-slate-50 py-1.5 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          {(() => { const GIcon = GROUP_ICONS[group.id] ?? ListChecks; return <GIcon className="size-3.5 text-blue-600" />; })()}
                          {group.label} <span className="font-medium text-slate-400">({group.drivers.length})</span>
                        </span>
                      </TableCell>
                    </TableRow>
                    {group.drivers.map(driver => (
                      <TableRow key={driver.code} onClick={() => openDriver(driver)} className="cursor-pointer">
                        <TableCell className="sticky left-0 bg-white py-3">
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="font-medium text-slate-900">{driver.name}</span>
                            <span className="shrink-0 font-mono text-[10px] font-semibold tracking-[.04em] text-slate-400">{driver.code}</span>
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-slate-600">{driver.assessment}</TableCell>
                        <TableCell className="py-3 text-right font-medium tabular-nums text-slate-800">{typeof driver.score === "number" ? driver.score : "—"}</TableCell>
                        <TableCell className="py-3"><StatusPill tone={bandTone(driver.band) as any}>{driver.band}</StatusPill></TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      <Sheet open={Boolean(selectedDriver)} onOpenChange={open => !open && setSelectedDriver(null)}>
        <SheetContent side="right" className="w-[min(640px,96vw)] gap-0 overflow-y-auto bg-white p-0 sm:max-w-[640px]">
          <SheetTitle className="sr-only">{selectedDriver?.name}</SheetTitle>
          <SheetDescription className="sr-only">Driver detail</SheetDescription>
          {selectedDriver && renderDriver(selectedDriver)}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AiAnalysisTab;
