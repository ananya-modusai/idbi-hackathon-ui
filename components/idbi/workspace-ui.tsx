"use client";

// Workspace design primitives.
//
// The WHAT (which sections/data) comes from the product-leader UI; the HOW (styling
// and components) follows cam-ui / insolvency-ui. So MetricCard renders the insolvency
// StatCard look, SegmentedToggle wraps insolvency ToggleTabs, etc. — not the
// product-leader's bespoke card/toggle styling.

import * as React from "react";
import { CircleCheck, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CustomCard } from "@/components/custom/CustomCard";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { CollapseButton } from "@/components/custom/CollapseButton";
import {
  Table as ShadTable,
  TableBody as ShadTableBody,
  TableCell as ShadTableCell,
  TableHead as ShadTableHead,
  TableHeader as ShadTableHeader,
  TableRow as ShadTableRow,
} from "@/components/ui/table";
import SectionHeaderWithFlags from "@/components/custom/SectionHeaderWithFlags";
import { LucideIcon } from "lucide-react";

/**
 * The section header for every workspace section. Delegates to the reference
 * SectionHeaderWithFlags so the type scale (text-lg/semibold, blue) and the built-in
 * right-side view toggle are the same ones the rest of the app uses — the Debt Analysis
 * section in insolvency is the model.
 */
export function SectionHeader({
  icon, title, action, titleMeta, toggleOptions, selectedToggleOption, onToggleOptionChange,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  titleMeta?: React.ReactNode;
  toggleOptions?: string[];
  selectedToggleOption?: string;
  onToggleOptionChange?: (option: string) => void;
}) {
  return (
    // mb-4 lives here, not on each section body: everything that follows a header
    // clears the underline by the same amount, everywhere.
    <div className="mb-4">
    <SectionHeaderWithFlags
      title={title}
      icon={icon as LucideIcon}
      iconColorClass="text-blue-700"
      titleColorClass="text-blue-700"
      positiveFlags={[]}
      negativeFlags={[]}
      allowCollapse={false}
      titleRightElement={titleMeta}
      toggleOptions={toggleOptions}
      selectedToggleOption={selectedToggleOption}
      onToggleOptionChange={onToggleOptionChange}
      togglePosition="right"
      toggleSize="small"
      rightActions={action}
    />
    </div>
  );
}

const metricToneText = {
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
};

// Follows the insolvency StatCard: icon in a gray-50 rounded box on the left, muted
// title, bold value — plus an optional secondary line beneath, in the same muted style.
export function MetricCard({ icon: Icon, label, value, secondary, tone = "blue" }: { icon: React.ElementType; label: string; value: string; secondary?: string | null; tone?: keyof typeof metricToneText }) {
  return (
    <CustomCard className="p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-50 p-1.5"><Icon className={cn("h-5 w-5", metricToneText[tone])} /></div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-gray-500">{label}</div>
          <div className="truncate text-base font-semibold text-black">{value}</div>
          {secondary && <div className="truncate text-xs text-gray-400">{secondary}</div>}
        </div>
      </div>
    </CustomCard>
  );
}

export function InsightBox({ headline, bullets, label = "AI insight" }: { headline: string; bullets: React.ReactNode[]; label?: string }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3.5 text-blue-700 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <div className="flex gap-2.5 ">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/80 shadow-sm"><Sparkles className="size-4" /></span>
        <div className="min-w-0 ">
          <p className="text-[13px] font-semibold uppercase relative top-1">{label}</p>
          <div className="mt-1.5 max-w-5xl text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">{headline}</p>
            <ul className="mt-1 space-y-0.5">{bullets.map((bullet, index) => <li key={index} className="flex min-w-0 gap-1.5"><span className="shrink-0 text-blue-600">•</span><span className="min-w-0">{bullet}</span></li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The ONE chip used across the app: the rounded-rectangle BubbleTag with a border,
 * the same one the page header uses. Tones map onto the shared colour schemes so
 * every chip — headers, sections, tables — is the same element.
 */
const PILL_COLOR = {
  slate: "gray",
  blue: "blue",
  emerald: "green",
  amber: "yellow",
  rose: "red",
  violet: "purple",
  orange: "orange",
  // Relationship tiers, each chip the metal it names.
  platinum: "platinum",
  gold: "gold",
  silver: "silver",
  bronze: "bronze",
} as const;

const flatten = (node: React.ReactNode): string =>
  React.Children.toArray(node)
    .map(child =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : React.isValidElement(child)
          ? flatten((child.props as any)?.children)
          : ""
    )
    .join("");

export function StatusPill({ children, tone = "slate", fixedWidth }: { children: React.ReactNode; tone?: keyof typeof PILL_COLOR; fixedWidth?: string }) {
  // inline-flex + mr keeps a gap when several chips sit next to each other.
  // fixedWidth is BubbleTag's own prop — used by the tier chips so Gold and Platinum
  // are the same width down the column.
  return (
    <span className="mr-2 inline-flex last:mr-0">
      <BubbleTag text={flatten(children)} color={PILL_COLOR[tone]} withBorder={true} fixedWidth={fixedWidth} />
    </span>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild><span className="inline-flex text-slate-400 hover:text-slate-600"><Info className="size-3.5" /></span></TooltipTrigger>
        <TooltipContent className="max-w-64 text-xs leading-5">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Segmented view toggle for use OUTSIDE a section header (inside a header, pass
 * toggleOptions to SectionHeader instead). Same markup as the reference header toggle:
 * gray-100 track, active pill white with blue text.
 */
export function SegmentedToggle({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div className="flex w-fit rounded-lg bg-gray-100 p-0.5">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === option.value ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Every table in the app renders through these four, so they all share one design.
 * The language is the insolvency Financial Statements table: the shadcn Table
 * primitives, header cells at py-2, body cells at py-3, right/centre alignment opt-in.
 */
export function CompactTable({ children, minWidth = 760 }: { children: React.ReactNode; minWidth?: number }) {
  // Bordered, rounded container with a tinted header — the framing the reference tables
  // use. Without it a table just bleeds into the page.
  return (
    <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <ShadTable style={{ minWidth }} className="[&_tbody_tr:last-child_td]:border-b-0">{children}</ShadTable>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <ShadTableHeader className="bg-gray-50">
      <ShadTableRow className="hover:bg-gray-50">{children}</ShadTableRow>
    </ShadTableHeader>
  );
}

export function Th({ children, right = false, center = false }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <ShadTableHead className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600", right && "text-right", center && "text-center")}>
      {children}
    </ShadTableHead>
  );
}

export function Td({ children, right = false, center = false, className }: { children: React.ReactNode; right?: boolean; center?: boolean; className?: string }) {
  return (
    <ShadTableCell className={cn("border-b border-gray-200 px-4 py-3 align-top", right && "text-right", center && "text-center", className)}>
      {children}
    </ShadTableCell>
  );
}

export function RepaymentStrip({ values }: { values: string[] }) {
  return (
    <div className="flex items-center gap-1" aria-label="12-cycle repayment history">
      {values.map((value, index) => <span key={index} title={value === "current" ? "On time" : value === "late" ? "Late" : "Data unavailable"} className={cn("h-4 w-2.5 rounded-[2px]", value === "current" ? "bg-emerald-500" : value === "late" ? "bg-amber-400" : "bg-slate-200")} />)}
    </div>
  );
}

export function ControlSelect({ label, value, options, onChange, width = "w-[220px]" }: { label: string; value: string; options: string[]; onChange: (value: string) => void; width?: string }) {
  // Labeled control-style select using a native select for reliability across the stack.
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[.06em] text-slate-500">{label}</span>
      <div className={cn("relative", width)}>
        <select value={value} onChange={e => onChange(e.target.value)} aria-label={label} className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-xs shadow-sm outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200">
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </div>
    </label>
  );
}

const actionVariants = {
  default: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
  ghost: "text-blue-700 hover:bg-blue-50 hover:text-blue-800",
};
const actionSizes = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs font-medium",
  icon: "grid size-8 place-items-center rounded-md",
};

export function ActionButton({
  variant = "outline", size = "sm", className, children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof actionVariants; size?: keyof typeof actionSizes }) {
  return (
    <button
      type="button"
      className={cn("inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0", actionVariants[variant], actionSizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Metric grid: 4 per row, the rest wrap, with the reference CollapseButton
 * (Show More / Show Less) once there are more than four — the same control the
 * reference KeyMetrics uses. MetricCard is used so the secondary line survives.
 */
export function MetricGrid({
  metrics, className,
}: {
  metrics: Array<{ label: string; value: string; secondary?: string | null; icon: React.ElementType; tone?: "blue" | "emerald" | "amber" | "violet" }>;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const hasMore = metrics.length > 4;
  const visible = hasMore && !expanded ? metrics.slice(0, 4) : metrics;
  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map(m => (
          <MetricCard key={m.label} icon={m.icon} label={m.label} value={m.value} secondary={m.secondary} tone={m.tone} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-3 flex justify-center">
          <CollapseButton isExpanded={expanded} onClick={() => setExpanded(v => !v)} />
        </div>
      )}
    </div>
  );
}

/**
 * Toast — a transient confirmation that removes itself. Nothing equivalent exists in
 * cam-ui or insolvency-ui (neither ships a toast library), so this is built from our
 * own tokens: the same emerald confirmation styling used elsewhere.
 */
export function Toast({ message, onDone, duration = 3200 }: { message: string | null; onDone: () => void; duration?: number }) {
  React.useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(t);
  }, [message, duration, onDone]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-800 shadow-lg animate-in fade-in slide-in-from-top-2">
        <CircleCheck className="size-4 shrink-0 text-emerald-600" />
        <span>{message}</span>
        <button onClick={onDone} className="ml-2 text-emerald-700/60 transition-colors hover:text-emerald-900" aria-label="Dismiss">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * "This data isn't here" panel — the insolvency Credit Bureau Summary treatment:
 * dashed border, icon in a tinted rounded square, the finding, then what would be
 * needed to fill it. Use this instead of a bare sentence in a box.
 */
export function DataUnavailable({
  icon: Icon, headline, required,
}: {
  icon: React.ElementType;
  headline: string;
  required?: string;
}) {
  return (
    <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <p className="mt-4 text-base font-semibold text-gray-900">{headline}</p>
      {required && (
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Data required:</span> {required}
        </p>
      )}
    </div>
  );
}
