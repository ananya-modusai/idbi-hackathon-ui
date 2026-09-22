"use client";

// Modus Agent side panel — replicating the axis-cam-ui ModusAgent thread.
//
// Structure and behaviour follow cam: a one-line header (mark, "Modus agent · <name>",
// history / new chat / close), no bubbles on the agent side — the RM's words are tinted
// and skewed right, the agent answers left at full width. A reply plays as cam's does:
// the activity trail lands step by step, then the prose types out, then the turn's
// action row appears on hover.

import { FC, useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, History, MessageSquarePlus, Paperclip, Plus, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ModusMark } from "./ModusMark";
import { ModusMarkAnimated } from "./ModusMarkAnimated";
import { AgentMarkdown } from "./AgentMarkdown";
import { ActivityTrail, Trail } from "./ActivityTrail";
import { AgentTurnActions, UserTurnActions } from "./AgentTurnActions";
import {
  ACCEPT_ATTRIBUTE, Attachment, acceptFiles, formatBytes, releaseAttachments,
} from "@/app/services/chatAttachments";

interface Turn {
  role: "user" | "agent";
  text: string;
  at: string;
  trail?: Trail;
  attachments?: Array<{ name: string; sizeLabel: string }>;
}

import probeReplies from "@/app/idbi-data/agent-probe-replies.json";

interface Suggestion { label: string; reply: string; trail: Trail; /** Fired when this starter is asked — applies the matching filter to the list. */ action?: string }

interface ModusAgentPanelProps {
  customerName: string;
  healthScore: number;
  healthBand: string;
  openMatters: number;
  seedPrompt?: string;
  onClose: () => void;
  /** Extra starters for the screen the panel is opened from. */
  extraSuggestions?: Suggestion[];
  /** Replaces the built-in starters — used to answer about the customer on screen. */
  starters?: Suggestion[];
  /** Called with a starter's `action` id once its reply has been played. */
  onAction?: (action: string) => void;
}

const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

export const ModusAgentPanel: FC<ModusAgentPanelProps> = ({
  customerName, healthScore, healthBand, openMatters, seedPrompt, onClose, extraSuggestions = [], starters, onAction,
}) => {
  const first = customerName.split(" ")[0];

  const baseSuggestions: Suggestion[] = [
    {
      label: "Summarise the open matters",
      trail: { label: "Checked the relationship feed", runningLabel: "Checking the relationship feed", steps: [
        { text: "Read the unified relationship feed — 6 threads" },
        { text: "Filtered to open matters — 2 found" },
        { text: "Cross-checked the 22 Sep follow-up" },
      ] },
      reply: `**${customerName}** has **${openMatters} open matters** right now:\n\n1. **Working-capital enhancement** — at credit review, awaiting the latest GST returns.\n2. **Premium credit card** — pre-qualified, pending your confirmation to initiate.\n\nBoth sit inside existing risk appetite given the **${healthScore}/100 (${healthBand})** health band. I can draft the next step for either.`,
    },
    {
      label: "Which products can be pre-checked?",
      trail: { label: "Checked eligibility signals", runningLabel: "Checking eligibility signals", steps: [
        { text: "Read income and repayment conduct" },
        { text: "Compared against product screening rules" },
        { text: "Excluded products needing a fresh application" },
      ] },
      reply: `Against ${first}'s profile and a **${healthScore}/100** health score, these can be pre-checked without a fresh application:\n\n| Product | Basis | Indicative |\n| --- | --- | --- |\n| Premium credit card | Salary + conduct | Pre-approved |\n| Top-up on home loan | Repayment history | Eligible |\n| Overdraft against FD | Existing deposits | Eligible |\n\nThese are eligibility indications from the customer's own banking and bureau record, not approvals. Confirm documents before making an offer.`,
    },
    {
      label: "How should I prepare for the next call?",
      trail: { label: "Reviewed the customer workspace", runningLabel: "Reviewing the customer workspace", steps: [
        { text: "Read the financial position tab" },
        { text: "Read the open requests" },
        { text: "Ranked talking points by value" },
      ] },
      reply: `A tight agenda for the next conversation with ${first}:\n\n- **Lead with the working-capital review** — it is the live request and the one blocking value.\n- **Confirm the card offer** while goodwill is high; it is a quick win.\n- **Flag the concentration** in the investment mix — a gentle diversification nudge lands well here.\n\nHealth is **${healthBand}**, so this is a growth conversation, not a remediation one.`,
    },
  ];

  // Prompts fired by workspace buttons (Run pre-check, Check eligibility, the Credit
  // A customer's own starters answer from their file; the built-ins are the fallback.
  const suggestions: Suggestion[] = [...extraSuggestions, ...(starters?.length ? starters : baseSuggestions)];

  // Cards panel) get their own trail and answer — otherwise the ask lands on the fallback.
  const seeded: Suggestion[] = [
    {
      label: "Run a working-capital pre-check for Vandana Singh using the available customer and financial context.",
      trail: { label: "Ran the working-capital pre-check", runningLabel: "Running the working-capital pre-check", steps: [
        { text: "Read 6 months of cash flow — average surplus ₹1.23L" },
        { text: "Checked repayment conduct — 0 DPD, ₹0 overdue" },
        { text: "Checked existing exposure — ₹36.75L of ₹62.11L limits" },
        { text: "Looked for GST filings — not available in the workspace", failed: true },
        { text: "Applied working-capital screening rules" },
      ] },
      reply: `**Pre-check result: conditionally eligible.**\n\n| Check | Finding | Verdict |\n| --- | --- | --- |\n| Cash-flow surplus | ₹1.23L average / month | Pass |\n| Repayment conduct | 0 DPD · ₹0 overdue | Pass |\n| Facility utilisation | 59.2% of sanctioned limits | Pass |\n| GST filings | Not available here | **Blocked** |\n| External borrowing | Not validated | **Blocked** |\n\nIndicative headroom is **₹5L – ₹25L** at 12–16% p.a. on the current profile.\n\n**To clear it:** collect the latest GST returns and confirm external borrowing before the 22 Sep · 11:30 AM follow-up. I can draft that request for ${first}.`,
    },
    {
      label: "Check credit-card eligibility and available IDBI offers for Vandana Singh.",
      trail: { label: "Checked card eligibility", runningLabel: "Checking card eligibility", steps: [
        { text: "Read recognised income — ₹4.88L / month" },
        { text: "Checked card conduct across reported facilities" },
        { text: "Matched against the IDBI card grid" },
      ] },
      reply: `**${first} pre-qualifies for a premium business card.**\n\n- **Basis:** recognised income of ₹4.88L / month and clean repayment conduct.\n- **Indicative limit:** ₹2L – ₹5L, up from the ₹1.2L currently held elsewhere.\n- **Rate:** 2.5% – 3.5% p.m. on revolve.\n\nNo IDBI card relationship exists today, so this is a new-product conversation rather than an upgrade. This is an eligibility indication from her banking and bureau record; confirm documents before making the offer.`,
    },
    {
      label: "Which IDBI credit cards can be pre-checked for this customer?",
      trail: { label: "Checked the card grid", runningLabel: "Checking the card grid", steps: [
        { text: "Read the customer's income and conduct" },
        { text: "Filtered the IDBI card grid to eligible products" },
      ] },
      reply: `Three IDBI cards can be pre-checked for ${first} right now:\n\n| Card | Basis | Indicative limit |\n| --- | --- | --- |\n| Business Rewards | Income + conduct | ₹2L – ₹5L |\n| Everyday Cashback | Income | ₹1L – ₹2L |\n| Secured card (against FD) | ₹4.00L term deposit | Up to ₹3.2L |\n\nExternal card exposure is not visible in this workspace, so run the bureau pre-check before making an offer.`,
    },
  ];

  const [turns, setTurns] = useState<Turn[]>([]);
  const [value, setValue] = useState("");
  const [thinking, setThinking] = useState<string | null>(null);
  // A reply in flight: the trail lands step by step, then the prose types out.
  const [stream, setStream] = useState<{ trail: Trail; steps: number; running: boolean; text: string; chars: number } | null>(null);
  const [pending, setPending] = useState<{ reply: string; trail: Trail; key: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Past conversations. A thread is archived when a new chat is started, so History
  // always offers what you were last working on.
  const [history, setHistory] = useState<Array<{ id: string; title: string; at: string; turns: Turn[] }>>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const archiveCurrent = (current: Turn[]) => {
    if (current.length === 0) return;
    const title = current.find(t => t.role === "user")?.text ?? "Conversation";
    setHistory(h => {
      const id = activeThreadId ?? `thread-${Date.now()}`;
      const entry = { id, title: title.length > 60 ? `${title.slice(0, 60)}…` : title, at: now(), turns: current };
      const without = h.filter(x => x.id !== id);
      return [entry, ...without].slice(0, 20);
    });
  };

  const startNewChat = () => {
    timers.current.forEach(clearTimeout);
    archiveCurrent(turns);
    setTurns([]);
    setThinking(null);
    setStream(null);
    setActiveThreadId(null);
    setHistoryOpen(false);
  };

  const openThread = (id: string) => {
    const entry = history.find(h => h.id === id);
    if (!entry) return;
    timers.current.forEach(clearTimeout);
    archiveCurrent(turns);
    setTurns(entry.turns);
    setThinking(null);
    setStream(null);
    setActiveThreadId(id);
    setHistoryOpen(false);
  };

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Object URLs outlive the component unless revoked; mirror the list in a ref so the
  // unmount cleanup sees the latest without re-running on every change.
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  useEffect(() => () => releaseAttachments(attachmentsRef.current), []);

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const { accepted, error } = acceptFiles(files, attachmentsRef.current);
    setAttachError(error);
    if (accepted.length) setAttachments(prev => [...prev, ...accepted]);
  };

  const removeAttachment = (id: string) => {
    releaseAttachments(attachmentsRef.current.filter(a => a.id === id));
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastSeed = useRef<string | undefined>(undefined);
  const after = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = []; }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Follow the conversation: snap to the newest content when a message is sent and keep
  // following while the reply streams in. rAF so it runs after the DOM has grown.
  // Resolve the scroll container from a sentinel at the end of the thread rather than
  // from the ScrollArea ref — that lookup silently found nothing and the thread never
  // followed the reply.
  const stick = () => {
    requestAnimationFrame(() => {
      const vp = bottomRef.current?.closest<HTMLElement>("[data-radix-scroll-area-viewport]");
      if (vp) vp.scrollTop = vp.scrollHeight;
    });
  };
  useEffect(stick, [turns.length, thinking]);
  useEffect(stick, [stream?.steps, stream?.chars, stream?.running]);

  const fallbackTrail: Trail = {
    label: "Checked the customer workspace",
    runningLabel: "Checking the customer workspace",
    steps: [{ text: "Read the customer record" }, { text: "Matched the question against the file" }],
  };

  /** Records the request; the playback runs in the effect below. */
  const play = (userText: string, reply: string, trail: Trail, files?: Array<{ name: string; sizeLabel: string }>) => {
    setActiveThreadId(id => id ?? `thread-${Date.now()}`);
    setTurns(t => [...t, { role: "user", text: userText, at: now(), attachments: files }]);
    setThinking("Thinking");
    setPending({ reply, trail, key: Date.now() });
  };

  // The reply plays the way cam does — think → trail steps → type the prose. Scheduling
  // lives here rather than in the click handler so it is idempotent: React's StrictMode
  // runs this twice on mount, and the cleanup cancels the first run's timers before the
  // second schedules its own. Doing it in the handler either hung (timers cancelled) or
  // duplicated the message (guard reset).
  useEffect(() => {
    if (!pending) return;
    const { reply, trail } = pending;
    const ts: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => { ts.push(setTimeout(fn, ms)); };

    at(500, () => {
      setThinking(null);
      setStream({ trail, steps: 0, running: true, text: reply, chars: 0 });
      trail.steps.forEach((_, i) => at(500 + 350 * (i + 1), () => setStream(st => (st ? { ...st, steps: i + 1 } : st))));

      const typeStart = 500 + 350 * trail.steps.length + 250;
      at(typeStart, () => setStream(st => (st ? { ...st, running: false } : st)));

      const CHUNK = 3, TICK = 12;
      for (let i = 0; i <= reply.length; i += CHUNK) {
        at(typeStart + (i / CHUNK) * TICK, () => setStream(st => (st ? { ...st, chars: Math.min(i, reply.length) } : st)));
      }
      at(typeStart + (reply.length / CHUNK) * TICK + 120, () => {
        setStream(null);
        setTurns(t => [...t, { role: "agent", text: reply, at: now(), trail }]);
        setPending(null);
        setPendingAction(current => { if (current) onAction?.(current); return null; });
      });
    });

    return () => ts.forEach(clearTimeout);
  }, [pending]);

  const ask = (text: string, files?: Array<{ name: string; sizeLabel: string }>) => {
    const acting = suggestions.find(s => s.label === text && s.action);
    // Probe replies are keyed by the exact prompt the Alerts tab and the insurance
    // recommendations hand over, so a "Know more" lands on a worked answer rather than
    // the generic fallback.
    const match = [...suggestions, ...seeded, ...(probeReplies as Suggestion[])].find(s => s.label === text);
    play(
      text,
      match?.reply ??
        `I've noted that against ${first}'s file. I can answer on financial position, open requests, product fit and eligibility — ask one of those and I'll pull the figures from the record.`,
      match?.trail ?? fallbackTrail,
      files
    );
    if (acting?.action) setPendingAction(acting.action);
  };

  const send = () => {
    const text = value.trim();
    // An attachment on its own is a valid thing to send — the text is optional.
    if ((!text && attachments.length === 0) || thinking || stream) return;
    const files = attachments.map(a => ({ name: a.file.name, sizeLabel: formatBytes(a.file.size) }));
    const body = text || `Sent ${files.length} file${files.length === 1 ? "" : "s"}.`;
    releaseAttachments(attachmentsRef.current);
    setAttachments([]);
    setAttachError(null);
    setValue("");
    ask(body, files.length ? files : undefined);
  };

  useEffect(() => {
    if (seedPrompt && seedPrompt !== lastSeed.current) {
      lastSeed.current = seedPrompt;
      ask(seedPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPrompt]);

  const isEmpty = turns.length === 0 && !thinking && !stream;
  const busy = Boolean(thinking || stream);

  return (
    <div className="flex h-full min-h-0 w-[420px] shrink-0 flex-col border-l border-gray-200 bg-white">
      {/* Header — one line, as cam's panel has it. */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
        <ModusMark size={18} />
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          Modus agent · <span className="text-gray-500">{customerName}</span>
        </p>
        <button
          onClick={() => setHistoryOpen(o => !o)}
          aria-pressed={historyOpen}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-md transition-colors",
            historyOpen ? "bg-blue-50 text-blue-700" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          )}
          title="History"
          aria-label="History"
        >
          <History className="h-4 w-4" />
        </button>
        <button
          onClick={startNewChat}
          disabled={isEmpty}
          className="grid size-8 shrink-0 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          title={isEmpty ? "Already a new chat" : "New chat"}
          aria-label="New chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Close" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {historyOpen ? (
        <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
          <div className="shrink-0 space-y-2 border-b border-gray-200 p-3">
            <button
              type="button"
              onClick={startNewChat}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={historyQuery}
                onChange={e => setHistoryQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-[13px] text-gray-700 placeholder-gray-400 focus:border-blue-300 focus:outline-none"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {(() => {
              const q = historyQuery.trim().toLowerCase();
              const rows = q ? history.filter(h => h.title.toLowerCase().includes(q)) : history;
              if (rows.length === 0) {
                return <p className="px-2 py-6 text-center text-[12.5px] text-gray-400">{history.length === 0 ? "No past chats yet." : "No chats match that."}</p>;
              }
              return rows.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openThread(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                    activeThreadId === t.id ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-[13px]">{t.title}</span>
                  <span className="shrink-0 text-[11px] text-gray-400">{t.at}</span>
                </button>
              ));
            })()}
          </div>
        </div>
      ) : isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="relative inline-block">
            <ModusMark size={40} />
            <Sparkles className="absolute -right-2.5 -top-1.5 h-4 w-4 text-blue-600" />
          </span>
          <div>
            <p className="text-lg font-medium text-gray-700">How can I help you?</p>
            <p className="mt-1 text-sm text-gray-400">
              Ask about {customerName} — financial position, open requests, product fit or eligibility.
            </p>
          </div>
          <div className="mt-2 w-full space-y-1.5 text-left">
            {suggestions.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => ask(s.label)}
                className="w-full rounded-lg border border-gray-200 p-3 text-left text-[13px] font-medium text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea ref={scrollRef} className="min-h-0 flex-1">
          <div className="px-4 py-6">
            {turns.map((turn, i) =>
              turn.role === "user" ? (
                <div key={i} className="group/turn mb-6 flex flex-col items-end">
                  <div className="max-w-[80%] rounded-2xl bg-blue-600/10 px-4 py-3">
                    <AgentMarkdown className="text-gray-800">{turn.text}</AgentMarkdown>
                    {turn.attachments && turn.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {turn.attachments.map((a, k) => (
                          <span key={`${a.name}-${k}`} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2 py-1 text-[11.5px] text-gray-600">
                            <Paperclip className="h-3 w-3 shrink-0 text-blue-500" />
                            <span className="max-w-[200px] truncate">{a.name}</span>
                            <span className="text-gray-400">{a.sizeLabel}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <UserTurnActions
                    at={turn.at}
                    onRetry={() => ask(turn.text)}
                    onEdit={() => setValue(turn.text)}
                    onCopy={() => { navigator.clipboard?.writeText(turn.text).catch(() => {}); }}
                  />
                </div>
              ) : (
                <div key={i} className="group/turn mb-6">
                  {turn.trail && <ActivityTrail trail={turn.trail} />}
                  <AgentMarkdown>{turn.text}</AgentMarkdown>
                  <AgentTurnActions text={turn.text} at={turn.at} onRetry={() => ask(turns[i - 1]?.text ?? "")} />
                </div>
              )
            )}

            {stream && (
              <div className="mb-6">
                {stream.steps > 0 && <ActivityTrail trail={stream.trail} revealed={stream.steps} running={stream.running} defaultOpen />}
                {!stream.running && (
                  <div className="mb-2 flex items-center gap-2.5 text-[13px] text-gray-400">
                    <ModusMarkAnimated size={22} />
                    <span>Writing</span>
                    <span className="cam-ellipsis" aria-hidden />
                  </div>
                )}
                {stream.chars > 0 && <AgentMarkdown>{stream.text.slice(0, stream.chars)}</AgentMarkdown>}
                {stream.chars < stream.text.length && (
                  <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-blue-600 align-middle" />
                )}
              </div>
            )}

            {thinking && (
              <div className="mb-6 flex items-center gap-2.5 text-[13px] text-gray-400">
                <ModusMarkAnimated size={22} />
                <span>{thinking}</span>
                <span className="cam-ellipsis" aria-hidden />
              </div>
            )}
            <div ref={bottomRef} aria-hidden />
          </div>
        </ScrollArea>
      )}

      {/* Composer */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        {/* Sets expectations before the RM types: the answers are prepared, not live. */}
        <p className="mb-2 px-1 text-center text-[11px] leading-4 text-gray-400">
          Responses are curated for this walkthrough and illustrate intended behaviour rather than live model output.
        </p>
        {attachError && <p className="mb-2 text-xs text-red-600">{attachError}</p>}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-md focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-200">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {attachments.map(a => (
                <div key={a.id} className="group relative flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-1.5 pr-7">
                  {a.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.previewUrl} alt={a.file.name} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><FileText className="h-4 w-4" /></span>
                  )}
                  <span className="min-w-0">
                    <span className="block max-w-[160px] truncate text-xs font-medium text-gray-700">{a.file.name}</span>
                    <span className="block text-[11px] text-gray-400">{formatBytes(a.file.size)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    title={`Remove ${a.file.name}`}
                    aria-label={`Remove ${a.file.name}`}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            onPaste={e => {
              const files = Array.from(e.clipboardData.files);
              if (files.length === 0) return;
              e.preventDefault();
              addFiles(files);
            }}
            rows={1}
            placeholder="Message modus agent…"
            className="max-h-[160px] min-h-[24px] w-full resize-none border-0 bg-transparent px-4 pb-1 pt-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
              aria-label="Attach files"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={send}
              disabled={(!value.trim() && attachments.length === 0) || busy}
              title="Send"
              aria-label="Send"
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModusAgentPanel;
