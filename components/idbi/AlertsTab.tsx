"use client";

import * as React from "react";
import {
  Activity, CalendarClock, CalendarDays, ChevronDown, ChevronRight, CircleCheck, CreditCard,
  FileSearch, Heart, ImageIcon, Info, Instagram, Landmark, Lightbulb, Linkedin, ListChecks,
  ExternalLink, Eye, MessageCircle, MessageSquareQuote, Newspaper, Repeat2, Search, Share2,
  Sparkles, ThumbsUp, TrendingUp,
} from "lucide-react";
import probes from "@/app/idbi-data/opportunity-probes.json";
import { cn } from "@/lib/utils";
import { ActionButton, InsightBox, SectionHeader, StatusPill } from "@/components/idbi/workspace-ui";
import { SocialPostBody } from "@/components/idbi/SocialPost";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

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

/** The post-2023 X mark — lucide still ships the old bird, which is the wrong logo. */
const XMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
);

/** Money-story step colours: what she pays, what she gets, what it costs, what we lend. */
const STORY_TONE: Record<string, string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  LinkedIn: Linkedin,
  Instagram: Instagram,
  X: XMark,
};

/** Brand chrome per platform — the badge fill and the tint behind the post header. */
const PLATFORM_STYLE: Record<string, { badge: string; name: string; header: string }> = {
  LinkedIn: { badge: "bg-[#0a66c2] text-white", name: "text-[#0a66c2]", header: "bg-[#0a66c2]/5" },
  Instagram: { badge: "bg-[linear-gradient(135deg,#f9ce34,#ee2a7b_55%,#6228d7)] text-white", name: "text-[#c13584]", header: "bg-[#c13584]/5" },
  X: { badge: "bg-black text-white", name: "text-slate-900", header: "bg-slate-900/5" },
};

/** What each platform calls its counters, and the icon it puts next to them. */
const ENGAGEMENT_ICONS: Record<string, React.ElementType> = {
  reactions: ThumbsUp, likes: Heart, comments: MessageCircle, replies: MessageCircle,
  reposts: Repeat2,
};

const initialsOf = (name: string) =>
  name.replace(/^@/, "").split(/[\s.]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");

/**
 * Alerts — every selling opportunity found by probing the customer across sources they
 * did not fill in on a form: their share plans, a soft bureau pull, and what they post
 * in public. Each section states what was found, then what it is worth.
 */
export const AlertsTab: React.FC<{ onOpenAgent?: (prompt?: string) => void }> = ({ onOpenAgent }) => {
  const { esop, credit, social } = probes;
  const [openPost, setOpenPost] = React.useState<string | null>(null);
  const shownPost = social.posts.find(post => post.id === openPost) ?? null;

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
          headline="She owns shares in two companies she worked for. One is going public."
          bullets={[
            "Those shares are worth about ₹63.2L.",
            "To get them she must pay ₹18.4L in tax first — money she does not have lying around.",
            "That is the opening: lend her the cash now, keep the ₹59.2L when it lands.",
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
              {holding.story.length > 0 && (
                <div className="mb-4 flex flex-wrap items-stretch gap-2">
                  {holding.story.map((step, index) => (
                    <React.Fragment key={step.label}>
                      {index > 0 && <ChevronRight className="mt-5 size-4 shrink-0 text-slate-300" />}
                      <div className={cn("min-w-[9.5rem] flex-1 rounded-lg border px-3 py-2.5", STORY_TONE[step.tone] ?? STORY_TONE.slate)}>
                        <p className="text-xs font-medium">{step.label}</p>
                        <p className="mt-0.5 text-xl font-bold leading-none">{step.value}</p>
                        <p className="mt-1 text-xs opacity-80">{step.note}</p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}

              <p className="max-w-3xl text-sm leading-6 text-slate-700">{holding.detail}</p>

              {holding.news.length > 0 && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Newspaper className="size-3.5" /> Company news
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {holding.news.map(item => (
                      <div key={item.headline} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <span className="text-sm font-semibold text-slate-900">{item.headline}</span>
                        <span className="text-xs text-slate-600">{item.detail}</span>
                        <span className="ml-auto shrink-0 text-xs text-slate-400">{item.date}</span>
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
        />
        <InsightBox
          headline="Other banks are offering her a credit card. We never have."
          bullets={[
            `Her credit score is ${credit.summary.score} — good, and ${credit.summary.scoreMove}.`,
            `${credit.summary.enquiries90d} card checks were run on her in the last 90 days. None has ended in a card yet.`,
            `We can approve ${credit.summary.preApproved} today. Call her before they do.`,
          ]}
        />

        {/* Same card as Recommended Opportunities: icon + title + subtitle, urgency
            badge top-right, tag chips, a 3-up stat strip, then Why now / Next step. */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {credit.signals.map(signal => {
            const SIcon = ({ Search, CreditCard, TrendingUp, Activity, FileSearch, CalendarClock } as Record<string, React.ElementType>)[signal.icon] ?? Activity;
            return (
              <article key={signal.id} className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                {/* The incident itself: what happened, where it was seen, and when. */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><SIcon className="size-5" /></span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-slate-950">{signal.title}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                        <CalendarDays className="size-3.5 shrink-0 text-slate-400" />
                        <span className="font-medium text-slate-700">{signal.when}</span>
                        <span className="text-slate-300">·</span>
                        <span>{signal.where}</span>
                      </p>
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
                    <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">What this means</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{signal.happened}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 border-t border-slate-100 pt-3">
                    <ListChecks className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">What we should do</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{signal.move}</p>
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
            const style = PLATFORM_STYLE[post.platform] ?? { badge: "bg-slate-100 text-slate-600", name: "text-slate-900", header: "bg-slate-50" };
            const isInstagram = post.platform === "Instagram";
            return (
              <article key={post.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                {/* Platform strip — says which network this came off, in its own colour. */}
                <div className={cn("flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2", style.header)}>
                  <span className="flex items-center gap-2">
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded", style.badge)}>
                      <PIcon className="size-3" />
                    </span>
                    <span className={cn("text-xs font-semibold", style.name)}>{post.platform}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusPill tone="slate">{post.matched}</StatusPill>
                    <StatusPill tone={post.confidence === "High" ? "emerald" : "amber"}>{post.confidence}</StatusPill>
                  </span>
                </div>

                {/* A summary of the post — the post itself opens in the side panel, so
                    every card in the grid stays the same height. */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <MessageSquareQuote className="size-3.5 shrink-0 text-slate-400" />
                      Posted {post.timeAgo} ago · {post.date}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-700">{post.summary}</p>

                    <div className="mt-3.5 border-t border-slate-100 pt-3">
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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ActionButton variant="default" onClick={() => onOpenAgent?.(post.prompt)}>
                      {post.action}
                    </ActionButton>
                    <ActionButton variant="outline" onClick={() => setOpenPost(post.id)}>
                      <Eye /> See post
                    </ActionButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* The full post, on the side — with the way out to the real thing. */}
      <Sheet open={Boolean(shownPost)} onOpenChange={open => { if (!open) setOpenPost(null); }}>
        <SheetContent side="right" className="w-[min(520px,94vw)] gap-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-0 sm:max-w-[520px]">
          <SheetTitle className="sr-only">{shownPost?.signal}</SheetTitle>
          {shownPost && (
            <>
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded", (PLATFORM_STYLE[shownPost.platform] ?? PLATFORM_STYLE.LinkedIn).badge)}>
                  {(() => { const I = PLATFORM_ICONS[shownPost.platform] ?? Share2; return <I className="size-3.5" />; })()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{shownPost.platform} post</p>
                  <p className="text-xs text-slate-500">Captured {shownPost.date}</p>
                </div>
                <span className="ml-auto"><StatusPill tone={shownPost.confidence === "High" ? "emerald" : "amber"}>{shownPost.confidence}</StatusPill></span>
              </div>

              <div className="p-4">
                <SocialPostBody
                  platform={shownPost.platform}
                  author={shownPost.author}
                  handle={shownPost.authorHandle}
                  meta={shownPost.authorMeta}
                  timeAgo={shownPost.timeAgo}
                  text={shownPost.text}
                  engagement={shownPost.engagement as unknown as Record<string, number>}
                />

                <a
                  href={shownPost.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <ExternalLink className="size-3.5" /> Open on {shownPost.platform}
                </a>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-blue-600" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signal</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{shownPost.signal}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{shownPost.opportunity}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {shownPost.products.map(product => <StatusPill key={product} tone="blue">{product}</StatusPill>)}
                  </div>
                  <div className="mt-3">
                    <ActionButton variant="default" onClick={() => { setOpenPost(null); onOpenAgent?.(shownPost.prompt); }}>
                      {shownPost.action}
                    </ActionButton>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">{shownPost.matched}</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AlertsTab;
