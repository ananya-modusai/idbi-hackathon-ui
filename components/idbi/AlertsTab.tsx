"use client";

import * as React from "react";
import {
  Activity, ChevronDown, ChevronRight, CircleCheck, CreditCard, Instagram, Landmark, Lightbulb,
  Linkedin, ListChecks, Newspaper, Search, Share2, Sparkles, TrendingUp, Twitter,
} from "lucide-react";
import probes from "@/app/idbi-data/opportunity-probes.json";
import { cn } from "@/lib/utils";
import { ActionButton, InsightBox, SectionHeader, StatusPill } from "@/components/idbi/workspace-ui";

/**
 * A collapsible tile: the compact summary is always visible, the reasoning opens under
 * it. Same shape as the metric tiles on the insolvency Financial Metrics section, with
 * the prose the user asked for behind the toggle.
 */
const ProbeTile: React.FC<{
  icon: React.ElementType;
  title: string;
  headline: string;
  chips?: React.ReactNode;
  facts?: Array<{ label: string; value: string; secondary?: string | null }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, title, headline, chips, facts, defaultOpen = false, children }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-slate-950">{title}</h3>
            {chips}
          </div>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">{headline}</p>
        </div>
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {facts && facts.length > 0 && (
        <dl className="grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-100 md:grid-cols-4">
          {facts.map(fact => (
            <div key={fact.label} className="min-w-0 px-4 py-2.5">
              <dt className="truncate text-xs text-slate-500">{fact.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900">{fact.value}</dd>
              {fact.secondary && <p className="truncate text-xs text-slate-400">{fact.secondary}</p>}
            </div>
          ))}
        </dl>
      )}

      {open && <div className="border-t border-slate-100 px-4 py-4">{children}</div>}
    </div>
  );
};

/** One thing we can sell, with the button that hands it to the agent. */
const OpportunityRow: React.FC<{
  title: string;
  value: string;
  why: string;
  action: string;
  onAct?: () => void;
}> = ({ title, value, why, action, onAct }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
    <div className="flex min-w-0 flex-1 gap-2.5">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {title} <span className="ml-1 font-medium text-blue-600">{value}</span>
        </p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">{why}</p>
      </div>
    </div>
    <ActionButton variant="outline" onClick={onAct}>{action}</ActionButton>
  </div>
);

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  LinkedIn: Linkedin,
  Instagram: Instagram,
  X: Twitter,
};

const PLATFORM_TINT: Record<string, string> = {
  LinkedIn: "bg-[#0a66c2] text-white",
  Instagram: "bg-[linear-gradient(135deg,#f9ce34,#ee2a7b_55%,#6228d7)] text-white",
  X: "bg-slate-900 text-white",
};

/**
 * Alerts — every selling opportunity found by probing the customer across sources they
 * did not fill in on a form: their share plans, a soft bureau pull, and what they post
 * in public. Each section states what was found, then what it is worth.
 */
export const AlertsTab: React.FC<{ onOpenAgent?: (prompt?: string) => void }> = ({ onOpenAgent }) => {
  const { esop, credit, social } = probes;

  return (
    <div className="space-y-8 px-6 pb-16 pt-5">
      {/* ---------------------------------------------------------------- ESOP ---- */}
      <section>
        <SectionHeader
          icon={Landmark}
          title="ESOP & Share Plans"
          titleMeta={<StatusPill tone="blue">{esop.summary.liveEvents} live event</StatusPill>}
        />
        <InsightBox
          headline={`${esop.summary.vestedUnexercised} vested and unexercised across ${esop.summary.employers} employers, indicatively worth ${esop.summary.indicativeValue}.`}
          bullets={[
            "Helix Logistics filed its DRHP on 04 Sep 2026, which turns a dormant holding into a dated, taxable cash event.",
            "The perquisite tax falls due at exercise whether or not she sells — that is the cash-flow problem to solve.",
            "This is the largest single opportunity on the customer, and it has a deadline attached.",
          ]}
        />

        <div className="mt-4 space-y-3">
          {esop.holdings.map(holding => (
            <ProbeTile
              key={holding.id}
              icon={Landmark}
              title={holding.company}
              headline={holding.headline}
              defaultOpen={holding.id === "helix"}
              facts={holding.facts}
              chips={
                <>
                  <StatusPill tone={holding.statusTone as any}>{holding.status}</StatusPill>
                  <span className="text-xs text-slate-500">{holding.role}</span>
                </>
              }
            >
              <p className="max-w-5xl text-sm leading-6 text-slate-700">{holding.detail}</p>

              {holding.news.length > 0 && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Newspaper className="size-3.5" /> Company news
                  </p>
                  <div className="mt-2 space-y-2">
                    {holding.news.map(item => (
                      <div key={item.headline} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{item.headline}</span>
                          <StatusPill tone="slate">{item.source}</StatusPill>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">What this opens up</p>
                <div className="mt-2 space-y-2">
                  {holding.opportunities.map(opportunity => (
                    <OpportunityRow
                      key={opportunity.title}
                      title={opportunity.title}
                      value={opportunity.value}
                      why={opportunity.why}
                      action={opportunity.action}
                      onAct={() => onOpenAgent?.(opportunity.prompt)}
                    />
                  ))}
                </div>
              </div>
            </ProbeTile>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Source: {esop.source}</p>
      </section>

      {/* ------------------------------------------------------ Credit signals ---- */}
      <section className="mt-8">
        <SectionHeader
          icon={CreditCard}
          title="Credit Card & Limit Signals"
          titleMeta={<StatusPill tone="amber">Soft pull · no score impact</StatusPill>}
        />
        <InsightBox
          headline={`Bureau score ${credit.summary.score} (${credit.summary.scoreMove}), ${credit.summary.enquiries90d} card enquiries at other banks in 90 days, and still no IDBI card after eight years.`}
          bullets={[
            `Neither enquiry has converted — the bureau shows no new card account, so the window is still open.`,
            `Pre-approved limit is ${credit.summary.preApproved}, built from internal banking history rather than a fresh pull.`,
            `A soft pull was used throughout; her score is unaffected by this check.`,
          ]}
        />

        {/* Same card as Recommended Opportunities: icon + title + subtitle, urgency
            badge top-right, tag chips, a 3-up stat strip, then Why now / Next step. */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {credit.signals.map(signal => {
            const SIcon = ({ Search, CreditCard, TrendingUp, Activity } as Record<string, React.ElementType>)[signal.icon] ?? Activity;
            return (
              <article key={signal.id} className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><SIcon className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-slate-950">{signal.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{signal.headline}</p>
                    </div>
                  </div>
                  <StatusPill tone={signal.tone as any}>{signal.urgency}</StatusPill>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {signal.tags.map(tag => <StatusPill key={tag} tone="blue">{tag}</StatusPill>)}
                </div>

                <dl className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/60">
                  {signal.facts.map(fact => (
                    <div key={fact.label} className="min-w-0 px-3 py-2.5">
                      <dt className="truncate text-[0.72vw] leading-4 text-slate-500">{fact.label}</dt>
                      <dd className="mt-1 truncate whitespace-nowrap text-[0.82vw] font-semibold text-slate-900">{fact.value}</dd>
                      {fact.secondary && <p className="truncate text-[0.68vw] leading-4 text-slate-400">{fact.secondary}</p>}
                    </div>
                  ))}
                </dl>

                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <div className="flex gap-2.5">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Why now</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{signal.detail}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 border-t border-slate-100 pt-3">
                    <ListChecks className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Next step</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{signal.opportunity}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <ActionButton variant="default" onClick={() => onOpenAgent?.(signal.prompt)}>
                    {signal.action} <ChevronRight />
                  </ActionButton>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">Source: {credit.source}</p>
      </section>

      {/* --------------------------------------------------- Social media probe ---- */}
      <section className="mt-8">
        <SectionHeader
          icon={Share2}
          title="Social Media Probe"
          titleMeta={<StatusPill tone="violet">{social.summary.signalsFound} signals</StatusPill>}
        />
        <InsightBox
          headline={`${social.summary.postsReviewed} public posts across ${social.summary.profilesMatched} matched profiles produced ${social.summary.signalsFound} commercial signals.`}
          bullets={[
            "Three of them point at the same thing from different directions: the business is expanding faster than its working capital.",
            "An OEM empanelment, a new CNC line and a public complaint about 75-day payment cycles, all inside 45 days.",
            "Everything here is public and the probe consent is on file — nothing was inferred from private accounts.",
          ]}
        />

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {social.posts.map(post => {
            const PIcon = PLATFORM_ICONS[post.platform] ?? Share2;
            return (
              <article key={post.id} className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                {/* Post snapshot — what was actually posted, rendered as the post. */}
                <div className="border-b border-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", PLATFORM_TINT[post.platform] ?? "bg-slate-100 text-slate-600")}>
                      <PIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-sm font-semibold text-slate-900">{post.handle}</span>
                        <span className="text-xs text-slate-400">· {post.date}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{post.matched}</p>
                    </div>
                    <StatusPill tone={post.confidence === "High" ? "emerald" : "amber"}>{post.confidence}</StatusPill>
                  </div>

                  <blockquote className="mt-3 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-700">
                    {post.text}
                  </blockquote>

                  {"media" in post && post.media && (
                    <p className="mt-2 text-xs italic text-slate-500">{post.media}</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {Object.entries(post.engagement).map(([key, value]) => (
                      <span key={key}>
                        <span className="font-semibold text-slate-700">{value as number}</span>{" "}
                        {key}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What it is worth to us. */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signal</p>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{post.signal}</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">{post.opportunity}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {post.products.map(product => <StatusPill key={product} tone="blue">{product}</StatusPill>)}
                    </div>
                  </div>
                  <div>
                    <ActionButton variant="default" onClick={() => onOpenAgent?.(post.prompt)}>
                      {post.action}
                    </ActionButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">Source: {social.source}</p>
      </section>
    </div>
  );
};

export default AlertsTab;
