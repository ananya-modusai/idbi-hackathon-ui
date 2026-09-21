"use client";

// AI Analysis — the Financial Health assessment in full: the AI summary, the score with
// its band scale and three pillars, the commentary, and every scored driver.
//
// Built from components this app already has: InsightBox for the AI summary, BandScale
// and MetricCard for the score block, SegmentedToggle for the filters, CompactTable for
// the driver list, and the ArtifactPanel for a driver's detail — overlays were dropped
// from this app, so a driver opens as a docked tab rather than a sheet.

import * as React from "react";
import { BarChart3, CalendarCheck, ChevronRight, Coins, CreditCard, FileText, Landmark, LifeBuoy, ListChecks, PiggyBank, Receipt, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";

import data from "@/app/idbi-data/vandana-workspace.json";
import { cn } from "@/lib/utils";
import {
  InfoTip, InsightBox, MetricCard, SectionHeader, SegmentedToggle, StatusPill,
} from "@/components/idbi/workspace-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowSegmentBar, BandScale, GaugeBand } from "@/components/idbi/ScoreVisuals";
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
  { from: 75, to: 90, color: "#4ade80", label: "Good" },
  { from: 90, to: 100, color: "#16a34a", label: "Excellent" },
];
const DRIVER_COLORS = ["#1e4e8c", "#3b82f6", "#93c5fd"];
const healthPanelBg = (score: number) => (score >= 75 ? "bg-green-50" : score >= 60 ? "bg-blue-50" : score >= 40 ? "bg-amber-50" : "bg-red-50");
const bandText = (score: number) => (score >= 75 ? "text-emerald-700" : score >= 60 ? "text-blue-700" : score >= 40 ? "text-amber-700" : "text-rose-700");

/** Plain-English meaning for each driver, so the panel needs no glossary. */
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
          <InsightBox
            label="AI assessment"
            headline={health.summary?.[0]?.text ?? ""}
            bullets={[
              <><strong>RM action:</strong> Continue the working-capital discussion, verify the external borrowing position and confirm the minimum operating cash required for the business.</>,
              <><strong>Watchout:</strong> Build accessible reserves towards at least three months of regular expenses and debt commitments.</>,
            ]}
          />
        </section>

      <section>
        <SectionHeader icon={ShieldCheck} title="Financial Health Analysis" />
        {/* Same panel language as the insolvency Probability-of-Default section (tinted
            panel, big band-coloured headline, dashed arrow-segment breakdown), but the
            copy is plain: one sentence per idea, no jargon, no tooltip-only meaning. */}
        <div className={cn("grid gap-10 rounded-lg border border-gray-100 p-6 shadow-sm xl:grid-cols-2", healthPanelBg(health.score))}>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600">Financial health score (out of 100)</p>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <span className={cn("text-5xl font-bold leading-none", bandText(health.score))}>{health.score}</span>
                <span className={cn("pb-1 text-2xl font-bold", bandText(health.score))}>{healthBandLabel(health.score)}</span>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">
                In plain terms: <strong className="text-slate-900">{customer.name.split(" ")[0]} manages money well.</strong> Income comfortably covers
                the EMIs, nothing is overdue, and there is money left over most months.
              </p>
              {/* Band scale — where this score falls across the whole 0–100 range. */}
              <div className="mt-4">
                <BandScale score={health.score} bands={HEALTH_BANDS} />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">What makes up this score</p>
              <p className="mt-0.5 text-xs text-slate-600">Three things are measured. A wider block means it contributes more.</p>
              <div className="mt-2">
                <ArrowSegmentBar
                  segments={customer.healthDrivers.map((d: any, i: number) => ({ label: String(d.score), value: d.score, color: DRIVER_COLORS[i] }))}
                  leftLabel="Weakest"
                  rightLabel="Strongest"
                />
              </div>
              <div className="mt-3 space-y-2">
                {customer.healthDrivers.map((driver: any, i: number) => (
                  <div key={driver.name} className="flex items-start gap-3 rounded-lg bg-white/70 px-3 py-2">
                    <i className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: DRIVER_COLORS[i] }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{DRIVER_PLAIN[driver.name]?.title ?? driver.name}</p>
                      <p className="text-xs leading-5 text-slate-600">{DRIVER_PLAIN[driver.name]?.meaning}</p>
                    </div>
                    <span className={cn("shrink-0 text-sm font-bold", bandText(driver.score))}>{driver.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">How this compares with your other customers</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Out of every 100 customers in your book, <strong className="text-slate-900">{customer.name.split(" ")[0]} scores higher than {percentile}</strong> of them.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Label className="text-xs text-slate-500">Compare with</Label>
                <Select value={cohort} onValueChange={setCohort}>
                  <SelectTrigger className="h-8 w-[200px] bg-white text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="portfolio">All my customers</SelectItem>
                    <SelectItem value="self-employed">Self-employed customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 h-[19.5rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram.map((count, index) => ({ range: String(index * 10), band: `${index * 10}–${index === 9 ? 100 : index * 10 + 9}`, count }))} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        const pt: any = payload?.[0]?.payload;
                        if (!active || !pt) return null;
                        return <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-xl"><span className="font-semibold text-slate-900">Score {pt.band}</span><span className="ml-2 text-slate-600">{pt.count} customers</span></div>;
                      }}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {histogram.map((_, index) => <Cell key={index} fill={index === Math.floor(health.score / 10) ? "#16a34a" : "#d7dee8"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-xs text-slate-600">The green bar is where this customer sits. Taller bars mean more customers score in that range.</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">What the score ranges mean</p>
              <div className="mt-2 space-y-1.5">
                {HEALTH_BANDS.slice().reverse().map(band => (
                  <div key={band.label} className="flex items-center gap-2 text-xs text-slate-700">
                    <i className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: band.color }} />
                    <span className="w-16 font-semibold">{band.from}–{band.to}</span>
                    <span className="font-medium">{band.label}</span>
                    <span className="text-slate-500">· {BAND_PLAIN[band.label]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

        <section>
          <SectionHeader icon={FileText} title="Assessment Commentary" />
            <FactTable
              rows={(health.summary as Array<{ label: string; text: string }>).slice(1).map(row => ({ label: row.label, value: row.text }))}
              labelWidth="200px"
            />
            <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-[11px] leading-5 text-blue-900">{health.calculationSummary}</p>
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
                  <TableHead className="w-10 py-2"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(group => (
                  <React.Fragment key={group.id}>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={5} className="sticky left-0 bg-slate-50 py-1.5 font-semibold">
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
                        <TableCell className="py-3"><ChevronRight className="size-4 text-slate-400" /></TableCell>
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
