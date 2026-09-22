"use client";

import * as React from "react";
import {
  Activity, ArrowDownLeft, ArrowDownToLine, ArrowLeftRight, ArrowUpRight, BadgeIndianRupee, Banknote, BriefcaseBusiness, Building2, ChevronRight, CircleCheck, Coins, CreditCard, FileSpreadsheet, FileText, HandCoins, Landmark, PiggyBank, TrendingUp, UsersRound, WalletCards,
} from "lucide-react";

import data from "@/app/idbi-data/vandana-workspace.json";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ActionButton, CompactTable, DataUnavailable, InsightBox, MetricGrid, SectionHeader,
  StatusPill, TableHead, Td, Th,
} from "@/components/idbi/workspace-ui";
import { Visualization } from "@/components/custom/visualization";
import CustomListFilter, {
  PrimaryFilterGroup,
  SecondaryFilterGroup,
  TertiaryFilterGroup,
  useFilterState,
} from "@/components/custom/CustomList/customListFilter";

type AssetView = "assets" | "open" | "satisfied";
type CashflowView = "monthly" | "breakdown";
type HoldingDetail = (typeof data.financialPosition.holdingDetails)[number];

const holdingDetailCopy: Record<string, { group: string; institution: string; reference: string; value: string }> = {
  "Bank balances": { group: "Accounts", institution: "Bank", reference: "Account reference", value: "Balance" },
  "Term deposits": { group: "Deposits", institution: "Bank", reference: "Deposit reference", value: "Deposit value" },
  "Mutual funds": { group: "Schemes", institution: "Fund house", reference: "Folio", value: "Current value" },
  Stocks: { group: "Securities", institution: "Depository", reference: "ISIN", value: "Market value" },
  "Long-term savings · PPF": { group: "Accounts", institution: "Institution", reference: "Account reference", value: "Balance" },
};

function FinancialSection({
  icon, title, titleMeta, action, toggleOptions, selectedToggleOption, onToggleOptionChange, children,
}: {
  icon: React.ElementType;
  title: string;
  titleMeta?: React.ReactNode;
  action?: React.ReactNode;
  toggleOptions?: string[];
  selectedToggleOption?: string;
  onToggleOptionChange?: (option: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeader
        icon={icon}
        title={title}
        titleMeta={titleMeta}
        action={action}
        toggleOptions={toggleOptions}
        selectedToggleOption={selectedToggleOption}
        onToggleOptionChange={onToggleOptionChange}
      />
      <div>{children}</div>
    </section>
  );
}

const closingBalances = [1.92, 2.10, 2.28, 2.16, 2.62, 3.10];
const bounces = [0, 0, 0, 1, 0, 0];

export function FinancialPositionTab({ onOpenAgent }: { onOpenAgent?: (prompt?: string) => void }) {
  const fp = data.financialPosition;
  const [scope, setScope] = React.useState(fp.scopeOptions[0]);
  // Picking a single account rescales the bank-flow figures by that account's share,
  // so the numbers on screen always belong to the selection.
  const activeScope = (fp.accountScopes as any[]).find(s => s.label === scope) ?? fp.accountScopes[0];
  const share = activeScope.share as number;
  const isCombined = activeScope.value === "combined";

  const scaleAmount = (text: string) => {
    if (isCombined) return text;
    const match = text.match(/^₹([\d.,]+)\s*(Cr|L)?$/);
    if (!match) return text;
    const value = Number(match[1].replace(/,/g, "")) * share;
    const unit = match[2];
    if (unit === "Cr") return value < 1 ? `₹${(value * 100).toFixed(2)} L` : `₹${value.toFixed(2)} Cr`;
    if (unit === "L") return value < 1 ? `₹${Math.round(value * 100000).toLocaleString("en-IN")}` : `₹${value.toFixed(2)} L`;
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  };
  const [period, setPeriod] = React.useState(fp.periodOptions[1]);
  const [cashflowView, setCashflowView] = React.useState<CashflowView>("monthly");
  const [selectedHolding, setSelectedHolding] = React.useState<HoldingDetail | null>(null);
  const [assetView, setAssetView] = React.useState<AssetView>("assets");
  const [expandedCharge, setExpandedCharge] = React.useState<string | null>(null);
  const startIndex = period === "Last 3 months" ? 3 : 0;
  const months = fp.cashflowMonths.slice(startIndex).map((item, index) => ({ ...item, closing: closingBalances[startIndex + index], bounces: bounces[startIndex + index] }));
  const partialPeriod = period === "Last 12 months";
  const cashIcons = [ArrowDownLeft, ArrowUpRight, Landmark, ArrowDownToLine, BadgeIndianRupee, Coins, TrendingUp, PiggyBank];
  const savingsIcons = [WalletCards, Landmark, TrendingUp, PiggyBank];
  const charges = assetView === "open" ? fp.charges.open : fp.charges.satisfied;
  const selectedAllocation = selectedHolding ? fp.allocation.find(item => item.name === selectedHolding.category) : null;
  const selectedTotal = selectedHolding?.holdings.reduce((sum, item) => sum + item.value, 0) ?? 0;

  // Income & Spending filters — the standard CustomListFilter group (same as All Appraisals).
  const primaryFilterGroup = React.useMemo<PrimaryFilterGroup[]>(() => [
    {
      id: "scope",
      label: "Account Scope",
      type: "multiselect" as const,
      options: fp.scopeOptions.map(o => ({ value: o, label: o })),
      selectedValues: [scope],
      onFilterChange: (vals: string[]) => setScope(vals[vals.length - 1] ?? fp.scopeOptions[0]),
      singleSelect: true,
      showAllOption: false,
      showLabel: true,
      // Must hold the longest option ("Combined view · 5 accounts") plus its clear button
      // and chevron — the MultiSelect inside won't shrink below its content, so too small a
      // maxWidth overflows onto the next filter's label.
      maxWidth: "420px",
    },
    {
      id: "period",
      label: "Period",
      type: "multiselect" as const,
      options: fp.periodOptions.map(o => ({ value: o, label: o })),
      selectedValues: [period],
      onFilterChange: (vals: string[]) => setPeriod(vals[vals.length - 1] ?? fp.periodOptions[1]),
      singleSelect: true,
      showAllOption: false,
      showLabel: true,
      maxWidth: "330px",
    },
  ], [scope, period]);

  const filterGroups = React.useMemo(() => ({
    primary: primaryFilterGroup,
    secondary: [] as SecondaryFilterGroup[],
    tertiary: [] as TertiaryFilterGroup[],
  }), [primaryFilterGroup]);

  const { filterState, setFilterState } = useFilterState(filterGroups);

  return (
    <div className="space-y-10">
      <FinancialSection icon={TrendingUp} title="Financial Metrics">
        <MetricGrid
          metrics={fp.financialMetrics.map((item: any, index: number) => ({
            label: item.label,
            value: item.value,
            secondary: item.secondary,
            icon: [WalletCards, BadgeIndianRupee, TrendingUp, Landmark][index] ?? Coins,
            tone: "blue" as const,
          }))}
        />
      </FinancialSection>

      <FinancialSection
        icon={ArrowLeftRight}
        title="Cash Flow"
        titleMeta={<StatusPill tone="amber">Bank · Account Aggregator</StatusPill>}
        toggleOptions={["Monthly", "Breakdown"]}
        selectedToggleOption={cashflowView === "monthly" ? "Monthly" : "Breakdown"}
        onToggleOptionChange={(o) => setCashflowView(o === "Monthly" ? "monthly" : "breakdown")}
      >
        <div className="mb-4">
          <CustomListFilter
            filterGroups={filterGroups}
            filterState={filterState}
            setFilterState={setFilterState}
            showFilterToggle={false}
          />
        </div>
        <MetricGrid
          metrics={fp.cashflowMetrics
            // Recognised income and the rest are customer-level reads, not per account.
            .filter((_: any, index: number) => isCombined || index < 4)
            .map((item: any, index: number) => ({
              label: item.label,
              value: index < 4 ? scaleAmount(item.value) : item.value,
              secondary: index < 4 && !isCombined ? activeScope.label : item.secondary,
              icon: cashIcons[index],
              tone: "blue" as const,
            }))}
        />

        {cashflowView === "monthly" ? (
          <>
            <div className="mt-4"><CompactTable minWidth={760}><TableHead><Th>Month</Th><Th right>Income</Th><Th right>Spending</Th><Th center>Income vs Spending</Th><Th right>Net</Th><Th right>Closing Balance</Th></TableHead><tbody>{months.slice().reverse().map(raw => {
              const row = isCombined ? raw : { ...raw, income: raw.income * share, spending: raw.spending * share, closing: raw.closing * share };
              const net = row.income - row.spending;
              const max = Math.max(row.income, row.spending);
              return <tr key={row.month}><Td className="font-semibold text-slate-900">{row.month} 2026</Td><Td right>₹{row.income.toFixed(2)}L</Td><Td right>₹{row.spending.toFixed(2)}L</Td><Td><div className="mx-auto flex w-28 items-center gap-1"><span className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.max(18, (row.income / max) * 52)}px` }} /><span className="h-1.5 rounded-full bg-rose-400" style={{ width: `${Math.max(18, (row.spending / max) * 52)}px` }} /></div></Td><Td right className={net >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-600"}>{net >= 0 ? "+" : "−"}₹{Math.abs(net).toFixed(2)}L</Td><Td right>₹{row.closing.toFixed(2)}L</Td></tr>;
            })}</tbody></CompactTable></div>
          </>
        ) : (
          <div className="mt-4"><CompactTable minWidth={900}><TableHead><Th>Overview</Th><Th right>Apr</Th><Th right>May</Th><Th right>Jun</Th><Th right>Jul</Th><Th right>Aug</Th><Th right>Sep</Th><Th right>MoM</Th></TableHead><tbody>{fp.cashflowBreakdown.map(row => <tr key={row.group}><Td className="font-semibold text-slate-900">{row.group}</Td><Td right>{row.apr}</Td><Td right>{row.may}</Td><Td right>{row.jun}</Td><Td right>{row.jul}</Td><Td right>{row.aug}</Td><Td right>{row.sep}</Td><Td right className={row.mom.startsWith("+") ? "font-semibold text-emerald-700" : undefined}>{row.mom}</Td></tr>)}</tbody></CompactTable><div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-slate-500"><span>5 accounts included</span><span>·</span><span>1 partial-history account</span><span>·</span><span>Own transfers deduplicated</span></div></div>
        )}
      </FinancialSection>

      {/* GST filing trend — stacked turnover/tax bars with value addition on the right
          axis, through the shared Visualization combo chart. */}
      <FinancialSection
        icon={FileText}
        title="GST Filing & Performance Trend"
        titleMeta={<StatusPill tone="blue">Regular taxpayer · monthly · GSTR-3B</StatusPill>}
      >
        <Visualization
          type="combo"
          data={fp.gstTrend}
          xAxisKey="name"
          xAxisLabel="Period"
          leftYAxisLabel="Amount (₹ L)"
          rightYAxisLabel="Value Addition %"
          yAxisKeys={[
            { key: "Turnover", color: "#1e3a5f", type: "bar", yAxisId: "left" },
            { key: "Tax Paid", color: "#2f9bf0", type: "bar", yAxisId: "left" },
            { key: "Value Addition %", color: "#e8a33d", type: "line", yAxisId: "right" },
          ]}
          stacking="normal"
          isEnclosedInCard
          hideAllTabs
          hideRefreshButton
          height={320}
        />
      </FinancialSection>

      <FinancialSection
        icon={FileSpreadsheet}
        title="GST Returns & Filing"
        titleMeta={<StatusPill tone="slate">GST · Account Aggregator</StatusPill>}
      >
        <CompactTable minWidth={900}>
          <TableHead><Th>Period</Th><Th right>Turnover</Th><Th right>Tax Paid</Th><Th right>ITC Claimed</Th><Th>Filed On</Th><Th center>Status</Th></TableHead>
          <tbody>
            {fp.gstReturns.map((row: any) => (
              <tr key={row.period}>
                <Td className="font-semibold text-slate-900">{row.period}</Td>
                <Td right>{row.turnover}</Td>
                <Td right>{row.taxPaid}</Td>
                <Td right>{row.itc}</Td>
                <Td>{row.filedOn}</Td>
                <Td center><StatusPill tone={row.status === "On time" ? "emerald" : "rose"}>{row.status}</StatusPill></Td>
              </tr>
            ))}
          </tbody>
        </CompactTable>
      </FinancialSection>

      <FinancialSection icon={UsersRound} title="Employment & Establishment Health">
        <p className="mb-2 text-sm font-semibold text-slate-900">Headcount &amp; Salary Delay Trend</p>
        <Visualization
          type="combo"
          data={fp.employmentTrend}
          xAxisKey="name"
          xAxisLabel="Period"
          leftYAxisLabel="Headcount"
          rightYAxisLabel="Days"
          yAxisKeys={[
            { key: "Headcount", color: "#1e3a8a", type: "bar", yAxisId: "left" },
            { key: "Days Delay", color: "#e8a33d", type: "line", yAxisId: "right" },
          ]}
          isEnclosedInCard
          hideAllTabs
          hideRefreshButton
          height={320}
        />

        <div className="mt-4">
          <CompactTable minWidth={940}>
            <TableHead><Th>Establishment ID</Th><Th>Location</Th><Th right>Headcount</Th><Th>Last Paid On</Th><Th>Delay</Th><Th center>Status</Th></TableHead>
            <tbody>
              {fp.establishments.map((row: any) => (
                <tr key={row.id}>
                  <Td className="font-semibold text-blue-700">{row.id}</Td>
                  <Td>{row.location}</Td>
                  <Td right className="tabular-nums">{row.headcount}</Td>
                  <Td>{row.lastPaid}</Td>
                  <Td className={row.delay.startsWith("+") ? "font-semibold text-rose-600" : "text-slate-600"}>{row.delay}</Td>
                  <Td center><StatusPill tone="emerald">{row.status}</StatusPill></Td>
                </tr>
              ))}
            </tbody>
          </CompactTable>
        </div>
      </FinancialSection>

      <FinancialSection icon={BriefcaseBusiness} title="Employment & Business Associations">
        <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-xs font-semibold text-emerald-800">No employment or business-association changes detected in the last 12 months.</div>
        <CompactTable minWidth={860}><TableHead><Th>Organisation</Th><Th>Customer&rsquo;s Role</Th><Th>From</Th><Th>To</Th><Th>Current Status</Th><Th>Verified From</Th><Th>Last Verified</Th></TableHead><tbody>{fp.associations.map(row => <tr key={row.organisation}><Td className="font-semibold text-slate-900">{row.organisation}</Td><Td>{row.role}</Td><Td>{row.from}</Td><Td>{row.to}</Td><Td><StatusPill tone={row.status === "Active" ? "emerald" : "slate"}>{row.status}</StatusPill></Td><Td>{row.source}</Td><Td>{row.verified}</Td></tr>)}</tbody></CompactTable>
      </FinancialSection>

      <FinancialSection icon={HandCoins} title="Borrowings & Cards">
        <MetricGrid metrics={[
          { label: "Outstanding", value: "₹36.75L", icon: HandCoins },
          { label: "Sanctioned Amount / Limit", value: "₹62.11L", icon: WalletCards },
          { label: "Facility Utilisation", value: "59.2%", icon: TrendingUp, tone: "amber" as const },
          { label: "Monthly Debt Repayments", value: "₹0.88L", icon: BadgeIndianRupee, tone: "emerald" as const },
        ]} />
        <div className="mt-4">
          <InsightBox headline="Reported debt conduct is current, but external coverage is incomplete." bullets={[<>Reported repayments show 0 DPD and ₹0 overdue.</>, <>Run a pre-check before discussing additional credit because external loan and card exposure is incomplete.</>]} />
        </div>
        <div className="mt-4"><CompactTable minWidth={980}><TableHead><Th>Loan / Facility</Th><Th>Lender / Source</Th><Th right>Outstanding</Th><Th right>Sanctioned Amount / Limit</Th><Th right>Monthly Due</Th><Th>Remaining Tenure</Th><Th>Conduct</Th></TableHead><tbody>{fp.loans.map(row => <tr key={row.facility}><Td className="font-semibold text-slate-900">{row.facility}</Td><Td>{row.lender}</Td><Td right className="font-semibold">{row.outstanding}</Td><Td right>{row.limit}</Td><Td right>{row.monthlyDue}</Td><Td>{row.tenure}</Td><Td><StatusPill tone="emerald">{row.conduct}</StatusPill></Td></tr>)}</tbody></CompactTable></div>
        {/* <div className="mt-4">
          <DataUnavailable
            icon={CreditCard}
            headline="No credit-card exposure recorded for this customer."
            required="IDBI card records and a bureau report for external cards"
          />
          <div className="mt-3 flex justify-center">
            <ActionButton variant="outline" onClick={() => onOpenAgent?.("Which IDBI credit cards can be pre-checked for this customer?")}><CreditCard />Check with Modus Agent</ActionButton>
          </div>
        </div> */}
      </FinancialSection>

      <FinancialSection icon={PiggyBank} title="Savings & Investments">
        <MetricGrid metrics={fp.savingsMetrics.map((item, index) => ({ label: item.label, value: item.value, icon: savingsIcons[index], tone: index === 2 ? "violet" as const : index === 3 ? "emerald" as const : "blue" as const }))} />
        <div className="mt-4">
          <InsightBox headline="Tracked assets remain weighted towards balances and deposits." bullets={[<>56.6% of tracked assets are in balances and deposits; 29.1% is market-linked.</>, <>The ₹7.80L current-account balance supports operations and is excluded from investible surplus.</>]} />
        </div>
        {/* Asset Allocation — hidden for now, intentionally kept in place.
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">Asset Allocation</h3><StatusPill tone="blue">IDBI ₹14.20L · 56.6%</StatusPill></div><div className="flex h-5 overflow-hidden rounded-full bg-slate-100" aria-label="Asset allocation">{fp.allocation.map(item => <div key={item.name} title={`${item.name}: ${item.percent}%`} style={{ width: `${item.percent}%`, backgroundColor: item.color }} />)}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{fp.allocation.map(item => <span key={item.name} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"><i className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name} · {item.percent}%</span>)}</div></div>
        */}
        <div className="mt-3"><CompactTable minWidth={820}><TableHead><Th>Allocation</Th><Th right>Value</Th><Th right>% of Tracked Assets</Th><Th right>With IDBI</Th><Th right>Other Institutions</Th><Th right>Details</Th></TableHead><tbody>{fp.allocation.map(item => <tr key={item.name}><Td className="font-semibold text-slate-900">{item.name}</Td><Td right>₹{item.value.toFixed(2)}L</Td><Td right>{item.percent}%</Td><Td right>{item.idbi}</Td><Td right>{item.other}</Td><Td right className="whitespace-nowrap"><ActionButton variant="ghost" className="ml-auto" onClick={() => setSelectedHolding(fp.holdingDetails.find(group => group.category === item.name) ?? null)}>View <ChevronRight /></ActionButton></Td></tr>)}</tbody></CompactTable></div>
      </FinancialSection>

      <FinancialSection icon={Building2} title="Assets & Collateral" titleMeta={<><StatusPill tone="amber">2 open charges</StatusPill><StatusPill tone="slate">Latest activity 18 Aug 2026</StatusPill></>} toggleOptions={[`Assets (${fp.assets.length})`, `Open (${fp.charges.open.length})`, `Satisfied (${fp.charges.satisfied.length})`]}
        selectedToggleOption={assetView === "assets" ? `Assets (${fp.assets.length})` : assetView === "open" ? `Open (${fp.charges.open.length})` : `Satisfied (${fp.charges.satisfied.length})`}
        onToggleOptionChange={(o) => { setAssetView(o.startsWith("Assets") ? "assets" : o.startsWith("Open") ? "open" : "satisfied"); setExpandedCharge(null); }}>
        <InsightBox headline="Recorded collateral is already encumbered." bullets={[<>Both recorded assets carry active charges and should not be treated as freely available collateral.</>, <>Registered charge amounts may differ from current outstanding.</>]} />
        <div className="mt-3">{assetView === "assets" ? <CompactTable minWidth={980}><TableHead><Th>Asset</Th><Th>Type</Th><Th>Owner</Th><Th>Location</Th><Th>Value Band</Th><Th>Security Status</Th><Th>Charge Holder</Th><Th right>Secured Amount</Th></TableHead><tbody>{fp.assets.map(row => <tr key={row.asset}><Td className="font-semibold text-blue-700">{row.asset}</Td><Td>{row.type}</Td><Td>{row.owner}</Td><Td>{row.location}</Td><Td>{row.value}</Td><Td><StatusPill tone="amber">{row.status}</StatusPill></Td><Td>{row.holder}</Td><Td right className="font-semibold">{row.secured}</Td></tr>)}</tbody></CompactTable> : <CompactTable minWidth={940}><TableHead><Th>Charge ID</Th><Th>Charge Holder</Th><Th right>Registered Charge</Th><Th>Created</Th><Th>Latest Event</Th><Th right>Interest Rate</Th><Th right>Details</Th></TableHead><tbody>{charges.map(charge => <React.Fragment key={charge.id}><tr><Td className="font-semibold text-blue-700">{charge.id}</Td><Td>{charge.holder}</Td><Td right className="font-semibold">{charge.amount}</Td><Td>{charge.created}</Td><Td>{charge.event}</Td><Td right>{charge.rate}</Td><Td right><button type="button" onClick={() => setExpandedCharge(value => value === charge.id ? null : charge.id)} className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline">View <ChevronRight className={cn("size-3.5 transition-transform", expandedCharge === charge.id && "rotate-90")} /></button></Td></tr>{expandedCharge === charge.id && <tr><td colSpan={7} className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700"><strong className="mr-2 text-slate-900">Security:</strong>{charge.security}</td></tr>}</React.Fragment>)}</tbody></CompactTable>}</div>
      </FinancialSection>

      <Sheet open={Boolean(selectedHolding)} onOpenChange={open => !open && setSelectedHolding(null)}><SheetContent side="right" className="w-[min(600px,96vw)] gap-0 border-l border-slate-200 bg-slate-50 p-0 sm:max-w-[600px]"><SheetHeader className="border-b border-slate-200 bg-white px-5 py-4"><div className="pr-8"><div className="mb-2 flex flex-wrap items-center gap-2"><StatusPill tone="blue">Investment details</StatusPill>{selectedAllocation && Math.abs(selectedTotal - selectedAllocation.value) < 0.001 && <StatusPill tone="emerald"><CircleCheck className="mr-1 size-3" />Reconciled</StatusPill>}</div><SheetTitle className="text-base text-slate-950">{selectedHolding?.category}</SheetTitle>{selectedHolding && <SheetDescription className="mt-1">{selectedHolding.holdings.length} {holdingDetailCopy[selectedHolding.category]?.group.toLowerCase() ?? "records"} · ₹{selectedTotal.toFixed(2)}L total · Matches Asset Allocation</SheetDescription>}</div></SheetHeader>{selectedHolding && <div className="min-h-0 flex-1 overflow-y-auto p-5">{(() => {
        const copy = holdingDetailCopy[selectedHolding.category] ?? { group: "Records", institution: "Institution", reference: "Reference", value: "Current value" };
        return <section><div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2"><h3 className="text-sm font-semibold text-slate-950">{copy.group}</h3><span className="text-xs font-semibold text-slate-700">₹{selectedTotal.toFixed(2)}L</span></div><div className="space-y-3">{selectedHolding.holdings.map(item => <article key={`${item.holding}-${item.reference}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]"><div className="flex items-start justify-between gap-4 px-4 py-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-950">{item.holding}</p><p className="mt-0.5 text-[11px] text-slate-500">{copy.value}</p></div><p className="shrink-0 text-sm font-semibold text-slate-950">₹{item.value.toFixed(2)}L</p></div><dl className="grid gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-2"><div className="bg-slate-50 px-4 py-3"><dt className="text-[10px] font-semibold uppercase tracking-[.06em] text-slate-500">{copy.institution}</dt><dd className="mt-1 text-xs font-medium text-slate-800">{item.institution}</dd></div><div className="bg-slate-50 px-4 py-3"><dt className="text-[10px] font-semibold uppercase tracking-[.06em] text-slate-500">{copy.reference}</dt><dd className="mt-1 text-xs font-medium text-slate-800">{item.reference.replace(/^[^·]+·\s*/, "")}</dd></div></dl></article>)}</div></section>;
      })()}</div>}</SheetContent></Sheet>
    </div>
  );
}

export default FinancialPositionTab;
