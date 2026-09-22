"use client";

import * as React from "react";
import {
  Activity, BadgeIndianRupee, BriefcaseBusiness, Building2, CalendarDays, CircleUserRound,
  ClipboardCheck, CreditCard, Globe2, Landmark, Mail, MessageSquareText, MinusCircle, MoveUpRight,
  Gauge, Phone, ShieldAlert, ShieldCheck, TrendingDown, TrendingUp, UserRound, UsersRound,
  ArrowRight, BarChart3, ChevronRight, CircleCheck, Clock, Coins, Info, Layers, ListChecks, Percent, WalletCards,
  Car, HeartPulse, Stethoscope, Store,
} from "lucide-react";

/** Icons referenced by name from the opportunity fixtures. */
const OPP_ICONS: Record<string, React.ElementType> = {
  Coins, CreditCard, BarChart3, TrendingUp, Percent, CalendarDays, WalletCards, MoveUpRight, Layers, Clock,
  // Insurance recommendations use the same card, so their icons live here too.
  HeartPulse, Stethoscope, Car, Store, ShieldAlert, ShieldCheck, Landmark,
};

/**
 * Insurance gaps, shaped exactly like an opportunity so they render as the same card in
 * the same grid. `prompt` is what the primary button hands to the agent.
 */
// Only these two surface as cards — the other gaps stay in the fixture and can be
// switched back on by adding their id here.
const INSURANCE_ON_CARDS: string[] = [];

const INSURANCE_CARDS = probes.insurance.groups
  .filter(group => INSURANCE_ON_CARDS.includes(group.id))
  .map(group => ({
  id: `insurance-${group.id}`,
  icon: group.icon,
  title: group.card.title,
  subtitle: group.card.subtitle,
  fit: group.card.fit,
  tags: group.card.tags,
  stats: group.card.stats,
  whyNow: group.card.whyNow,
  nextAction: group.card.nextStep,
  trigger: group.card.whyNow,
  primaryAction: group.recommendation.action,
  secondaryAction: null as string | null,
    prompt: group.recommendation.prompt,
  }));
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import data from "@/app/idbi-data/vandana-workspace.json";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ActionButton, CompactTable, DataUnavailable, InfoTip, MetricCard, MetricGrid, RepaymentStrip, SectionHeader, StatusPill, TableHead, Td, Th,
} from "@/components/idbi/workspace-ui";
import { BandLegend, CIBIL_BANDS, GradientScoreLine, ScoreGauge, GaugeBand } from "@/components/idbi/ScoreVisuals";
import probes from "@/app/idbi-data/opportunity-probes.json";

/** Financial-health bands (0–100), mirroring the CIBIL band language. */
const HEALTH_BANDS: GaugeBand[] = [
  { from: 0, to: 40, color: "#dc2626", label: "Stressed" },
  { from: 40, to: 60, color: "#d97706", label: "Vulnerable" },
  { from: 60, to: 75, color: "#eab308", label: "Stable" },
  { from: 75, to: 85, color: "#4ade80", label: "Good" },
  { from: 85, to: 100, color: "#16a34a", label: "Excellent" },
];


/** Relationship tier, coloured to its metal: Platinum · Gold · Silver · Bronze. */
const tierTone = (tier: string) =>
  tier === "Platinum" ? "platinum" as const : tier === "Gold" ? "gold" as const : tier === "Silver" ? "silver" as const : "bronze" as const;

const healthBandLabel = (score: number) => (HEALTH_BANDS.find(b => score >= b.from && score <= b.to) ?? HEALTH_BANDS[0]).label;

const snapshotIcons: Record<string, React.ElementType> = {
  occupation: BriefcaseBusiness,
  organisation: Building2,
  income: BadgeIndianRupee,
  // A bureau score is a gauge reading, not a card.
  bureau: Gauge,
  personal: CircleUserRound,
  residency: Globe2,
  since: CalendarDays,
  kyc: ShieldCheck,
};

function HealthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { month: string; score: number; explanation: string } }> }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="max-w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xl"><p className="font-semibold text-slate-900">{point.month} 2026 · Score {point.score}</p><p className="mt-1 leading-5 text-slate-600">{point.explanation}</p></div>;
}

function HealthDot({ cx = 0, cy = 0, payload }: { cx?: number; cy?: number; payload?: { score: number } }) {
  const score = payload?.score ?? 0;
  const fill = score >= 75 ? "#16a34a" : score >= 60 ? "#2563eb" : score >= 40 ? "#d97706" : "#dc2626";
  return <circle cx={cx} cy={cy} r={4.5} fill={fill} stroke="white" strokeWidth={2} />;
}

// Score → band, so the number/label take the band colour (green/blue/amber/red), the
// same "colour changes with the signal" language as the PD analysis component.
const bandText = (score: number) => (score >= 75 ? "text-emerald-700" : score >= 60 ? "text-blue-700" : score >= 40 ? "text-amber-700" : "text-rose-700");
/** Badge tone for the fit / review label on an opportunity card. */
const fitTone = (fit: string) =>
  fit === "High Potential" || fit === "High fit" ? "emerald" as const
    : fit === "Stress Check" ? "rose" as const
    : fit === "Review Due" ? "amber" as const
    : fit === "Good fit" ? "blue" as const
    : "violet" as const;

const bandPill = (score: number) => (score >= 75 ? "emerald" : score >= 60 ? "blue" : score >= 40 ? "amber" : "rose") as "emerald" | "blue" | "amber" | "rose";

export function CustomerProfileTab({ onOpenActivity, onOpenFinancial, onOpenAgent }: { onOpenActivity?: () => void; onOpenFinancial?: () => void; onOpenAgent?: (prompt?: string) => void }) {
  const customer = data.customer;
  // The reference header renders flags in severity buckets; the fixture keeps one list.
  const insightsBy = (severity: string) =>
    ((customer as any).insights ?? []).filter((insight: any) => insight.severity === severity);
  const [healthPeriod, setHealthPeriod] = React.useState("6M");
  const [idbiView, setIdbiView] = React.useState("Accounts & Products");
  const [cibilRange, setCibilRange] = React.useState("12");
  const [oppScope, setOppScope] = React.useState("personalised");

  const healthPoints = React.useMemo(() => {
    const n = healthPeriod === "3M" ? 3 : healthPeriod === "6M" ? 6 : 12;
    return customer.healthHistory
      .slice(-n)
      .map((h: any) => ({ label: `${h.month} ${String(h.year).slice(-2)}`, score: h.score, note: h.explanation }));
  }, [healthPeriod, customer.healthHistory]);
  const latestHealth = healthPoints[healthPoints.length - 1] ?? { score: 0, label: "", note: "" };
  const healthLow = healthPoints.reduce((a, b) => (b.score < a.score ? b : a), healthPoints[0]);
  const healthHigh = healthPoints.reduce((a, b) => (b.score > a.score ? b : a), healthPoints[0]);
  const healthChange = latestHealth.score - (healthPoints[0]?.score ?? 0);

  // Credit histories differ in length, so the range options are derived from how much
  // history this customer actually has rather than hard-coded.
  const cibilAll = customer.cibilTrend;
  const cibilRangeOptions = React.useMemo(() => {
    const spans = [6, 12, 24, 36, 60];
    const opts = spans
      .filter(n => cibilAll.length >= n)
      .map(n => ({ value: String(n), label: n % 12 === 0 ? `Last ${n / 12} year${n > 12 ? "s" : ""}` : `Last ${n} months` }));
    opts.push({ value: "all", label: `Full history (${cibilAll.length} months)` });
    return opts;
  }, [cibilAll.length]);
  const cibilRangeLabel = cibilRangeOptions.find(o => o.value === cibilRange)?.label ?? "";
  const cibilPoints = React.useMemo(() => {
    const slice = cibilRange === "all" ? cibilAll : cibilAll.slice(-Number(cibilRange));
    return slice.map((p: any) => ({
      label: new Date(p.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      score: p.score,
      note: p.note,
    }));
  }, [cibilAll, cibilRange]);
  const latestCibil = cibilAll[cibilAll.length - 1];
  const cibilDelta = latestCibil.score - (cibilPoints[0]?.score ?? latestCibil.score);
  const healthDelta = latestHealth.score - (healthPoints[0]?.score ?? latestHealth.score);
  const healthDeltaFrom = healthPoints[0]?.label ?? "";
  const contacts = [
    { label: "Mobile Number", value: customer.contacts.mobile, icon: Phone },
    { label: "Email", value: customer.contacts.email, icon: Mail },
    { label: "Reference Contact", value: customer.contacts.reference, icon: UsersRound },
  ];

  return (
    <div className="space-y-10">
      <section aria-labelledby="contact-details-heading">
        <h2 id="contact-details-heading" className="sr-only">Contact details</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {contacts.map(({ label, value, icon }) => <MetricCard key={label} icon={icon} label={label} value={value} />)}
        </div>
      </section>

      <section>
        <SectionHeader
          icon={MessageSquareText}
          title="Recommended Opportunities"
          allowCollapse
          positiveFlags={insightsBy("good")}
          negativeFlags={insightsBy("high")}
          mildNegativeFlags={insightsBy("medium")}
          neutralFlags={insightsBy("low")}
          flagTypeOrderList={["negative", "mildNegative", "neutral", "positive"]}
          flagSummaryLabel="Insights"
          flagRowLayout="category"
          action={
            <ActionButton
              variant="default"
              onClick={() => onOpenAgent?.("Run an eligibility check for Vandana Singh across working capital, a term loan and shop insurance, and tell me which one to lead with.")}
            >
              Check eligibility <ChevronRight />
            </ActionButton>
          }
        />
        {/* Card layout follows img #165: icon + title + subtitle, fit badge top-right,
            tag chips, a 3-up stat strip, then Why now / Next step and the actions.
            Cards wrap, so a longer list simply flows onto more rows. */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[...customer.opportunities, ...INSURANCE_CARDS].map((opportunity: any) => {
            const OppIcon = (OPP_ICONS[(opportunity as any).icon] ?? MessageSquareText) as React.ElementType;
            const fit = (opportunity as any).fit as string | undefined;
            const stats = ((opportunity as any).stats ?? []) as Array<{ label: string; value: string; icon?: string }>;
            return (
              <article key={opportunity.id} className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><OppIcon className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-slate-950">{opportunity.title}</h3>
                      {(opportunity as any).subtitle && <p className="mt-0.5 text-xs text-slate-500">{(opportunity as any).subtitle}</p>}
                    </div>
                  </div>
                  {fit && <StatusPill tone={fitTone(fit)}>{fit}</StatusPill>}
                </div>

                {opportunity.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {opportunity.tags.map((tag: string) => <StatusPill key={tag} tone="blue">{tag}</StatusPill>)}
                  </div>
                )}

                {stats.length > 0 && (
                  <dl className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/60">
                    {stats.map(stat => {
                      const StatIcon = (OPP_ICONS[stat.icon ?? ""] ?? Activity) as React.ElementType;
                      return (
                        <div key={stat.label} className="min-w-0 px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <StatIcon className="size-2.5 shrink-0 text-slate-400" />
                            <dt className="text-xs leading-4 text-slate-500">{stat.label}</dt>
                          </div>
                          <dd className="mt-1 text-sm font-semibold leading-5 text-slate-900">{stat.value}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}

                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <div className="flex gap-2.5">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Trigger</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{(opportunity as any).whyNow ?? opportunity.trigger}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 border-t border-slate-100 pt-3">
                    <ListChecks className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">RM action</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{(opportunity as any).blocker ?? opportunity.nextAction}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <ActionButton
                    variant="default"
                    onClick={() => (opportunity as any).prompt
                      ? onOpenAgent?.((opportunity as any).prompt)
                      : opportunity.id === "working-capital"
                      ? onOpenAgent?.("Run a working-capital pre-check for Vandana Singh using the available customer and financial context.")
                      : opportunity.id === "investment" ? onOpenFinancial?.()
                      : onOpenAgent?.("Check credit-card eligibility and available IDBI offers for Vandana Singh.")}
                  >
                    {opportunity.primaryAction} <ChevronRight />
                  </ActionButton>
                  {(opportunity as any).secondaryAction && (
                    <ActionButton variant="outline" onClick={onOpenActivity}>
                      <Info />{(opportunity as any).secondaryAction}
                    </ActionButton>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader icon={UserRound} title="About Customer" titleMeta={<StatusPill tone="blue">AI-generated summary</StatusPill>} />
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
          <ul className="space-y-2 text-sm leading-6 text-slate-700">{customer.about.map((item, index) => <li key={item} className="flex gap-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-blue-500" /><span className={index === 0 ? "font-medium text-slate-800" : undefined}>{item}</span></li>)}</ul>
        </div>
      </section>

      <section>
        <SectionHeader icon={ClipboardCheck} title="Customer Snapshot" />
        <MetricGrid metrics={customer.snapshot.map((item: any) => ({ label: item.label, value: item.value, icon: snapshotIcons[item.id] || ClipboardCheck }))} />
      </section>

      <section>
        <SectionHeader
          icon={Landmark}
          title="Relationship with IDBI"
          toggleOptions={["Accounts & Products", "Loans & Credits", "Credit Cards"]}
          selectedToggleOption={idbiView}
          onToggleOptionChange={setIdbiView}
        />
        <MetricGrid metrics={customer.relationshipSummary.map((item: any, index: number) => ({ label: item.label, value: item.value, secondary: item.secondary, icon: [CalendarDays, Landmark, BadgeIndianRupee, CreditCard][index], tone: index === 2 ? "amber" as const : "blue" as const }))} />
        {/* One table at a time behind the header toggle — no sub-headings over tables. */}
        <div className="mt-4">
          {idbiView === "Accounts & Products" && (
            <CompactTable minWidth={680}>
              <colgroup><col style={{ width: "30%" }} /><col style={{ width: "15%" }} /><col style={{ width: "21%" }} /><col style={{ width: "17%" }} /><col style={{ width: "17%" }} /></colgroup>
              <TableHead><Th>Product</Th><Th>Account No</Th><Th center>Balance / Deposit Value</Th><Th center>Opened</Th><Th center>Status</Th></TableHead>
              <tbody>{customer.accounts.map(row => {
                const [product, account] = row.product.split(" · ");
                return (
                  <tr key={row.product}>
                    <Td className="font-medium text-slate-900">{product}</Td>
                    <Td className="tabular-nums">{account}</Td>
                    <Td center className="font-semibold text-slate-900">{row.value}</Td>
                    <Td center>{row.opened}</Td>
                    <Td center><StatusPill tone="emerald">{row.status}</StatusPill></Td>
                  </tr>
                );
              })}</tbody>
            </CompactTable>
          )}
          {idbiView === "Loans & Credits" && (
            <CompactTable minWidth={900}><TableHead><Th>Loan / Facility</Th><Th right>Outstanding</Th><Th right>Sanctioned Amount / Limit</Th><Th>Repayment</Th><Th>12-cycle Repayment</Th><Th>Status / Conduct</Th></TableHead><tbody>{customer.loans.map(row => <tr key={row.facility}><Td className="font-medium text-slate-900">{row.facility}</Td><Td right className="font-semibold">{row.outstanding}</Td><Td right>{row.limit}</Td><Td>{row.repayment}</Td><Td><RepaymentStrip values={row.timeline} /></Td><Td><StatusPill tone="emerald">{row.conduct}</StatusPill></Td></tr>)}</tbody></CompactTable>
          )}
          {idbiView === "Credit Cards" && (
            <DataUnavailable
              icon={ShieldAlert}
              headline="No IDBI credit-card relationship found for this customer."
              required="IDBI card records, or a bureau report from CIBIL, CRIF High Mark, Experian or Equifax for external cards"
            />
          )}
        </div>
      </section>
      <section>
        <SectionHeader
          icon={CreditCard}
          title="CIBIL Score Trend"
          action={
            <Select value={cibilRange} onValueChange={setCibilRange}>
              <SelectTrigger className="h-8 w-[190px] bg-white text-xs"><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                {cibilRangeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[400px_1fr]">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <div className="min-w-0 flex-1">
              <ScoreGauge score={latestCibil.score} showBandRange />
            </div>
            {/* What moved, and when the next reading lands. */}
            <div className="w-[142px] shrink-0 space-y-3.5 border-l border-slate-100 pl-4">
              <div>
                <p className={cn("flex items-center gap-1 text-base font-bold", cibilDelta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {cibilDelta >= 0 ? "↑" : "↓"} {cibilDelta >= 0 ? "+" : "−"}{Math.abs(cibilDelta)} points
                </p>
                <p className="text-xs text-slate-500">since {cibilRangeLabel.toLowerCase().replace("last ", "last ")}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Next update</p>
                <p className="text-xs text-slate-500">in ~2 weeks</p>
              </div>
              <p className="text-xs text-slate-400">
                Reported {new Date(latestCibil.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <div>
            <BandLegend bands={CIBIL_BANDS} className="mb-2 px-2" />
            <GradientScoreLine points={cibilPoints} domain={[600, 820]} bands={CIBIL_BANDS} colourRange={[650, 780]} height={216} dropLines />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={Activity}
          title="Financial Health Score & History"
          titleMeta={<StatusPill tone={bandPill(latestHealth.score)}>{latestHealth.score} · {healthBandLabel(latestHealth.score)}</StatusPill>}
          action={
            <Select value={healthPeriod} onValueChange={setHealthPeriod}>
              <SelectTrigger className="h-8 w-[150px] bg-white text-xs"><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="3M">Last 3 months</SelectItem>
                <SelectItem value="6M">Last 6 months</SelectItem>
                <SelectItem value="12M">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {/* Score beside the trend, not above it: a quarter of the width, capped. */}
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex w-full shrink-0 flex-col border-b border-slate-100 pb-4 lg:w-[400px] lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-4xl font-bold leading-none", bandText(latestHealth.score))}>{latestHealth.score}</span>
                <StatusPill tone={bandPill(latestHealth.score)}>{healthBandLabel(latestHealth.score)}</StatusPill>
              </div>
              <p className={cn("mt-1.5 text-sm font-semibold", healthDelta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {healthDelta >= 0 ? "↑" : "↓"} {healthDelta >= 0 ? "+" : "−"}{Math.abs(healthDelta)} points since {healthDeltaFrom}
              </p>

              <div className="mt-4 flex shrink-0 items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-900">Score Drivers</p>
                <InfoTip text="The three measures behind the score. Each is scored out of 100 and carries equal weight." />
              </div>
              <div className="mt-2 flex flex-1 flex-col justify-between gap-1.5">
                {customer.healthDrivers.map((driver, index) => {
                  const DIcon = [Coins, BarChart3, ShieldCheck][index] ?? Activity;
                  return (
                    <div key={driver.name} className={cn("flex items-center gap-2 rounded-lg px-2.5 py-2", driver.score >= 75 ? "bg-emerald-50/70" : "bg-blue-50/60")}>
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white text-blue-600 shadow-sm"><DIcon className="size-3.5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-800">{driver.name}</p>
                        <div className="mt-1"><StatusPill tone={driver.score >= 75 ? "emerald" : "blue"}>{driver.band}</StatusPill></div>
                      </div>
                      <span className={cn("shrink-0 self-center text-lg font-bold tabular-nums", bandText(driver.score))}>{driver.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-900">Score over time</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Improvement, decline and recovery · {healthPoints[0]?.label} – {healthPoints[healthPoints.length - 1]?.label}
                </p>
              </div>
              <BandLegend bands={HEALTH_BANDS} />
              <GradientScoreLine
                points={healthPoints}
                domain={[0, 100]}
                bands={HEALTH_BANDS}
                colourRange={[55, 85]}
                showValueLabels
                dropLines
                height={255}
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default CustomerProfileTab;
