"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { MessageCircle, Smartphone, Mail, PhoneCall, Check, Loader2, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import rm from "@/app/idbi-data/rm.json";

/**
 * Application-link composer, rendered inside the Modus Agent thread.
 *
 * It is deliberately NOT a self-contained dialog: it has no header, no input and
 * no footer of its own. The RM types refinements into the agent's own input at
 * the bottom of the panel; those arrive here as `instruction`, and every
 * selected channel's draft is regenerated.
 *
 * The RM may pick several channels at once — each gets its own channel-native
 * draft and its own preview.
 */

export interface ApplicationLinkProduct {
  code: string;
  label: string;
}

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "sms", label: "SMS", icon: Smartphone },
  { id: "email", label: "Email", icon: Mail },
  { id: "call", label: "Phone call", icon: PhoneCall },
] as const;

type ChannelId = (typeof CHANNELS)[number]["id"];
type ContextId = "first" | "followup";

interface Draft { subject?: string; body: string }

export const ApplicationLinkComposer: FC<{
  customerName: string;
  customerId: string;
  customerMobile?: string;
  customerEmail?: string;
  product: ApplicationLinkProduct;
  /** Text the RM submitted via the agent's own input, or null. */
  instruction?: string | null;
  onInstructionConsumed?: () => void;
  onShared: (channelLabel: string, url: string) => void;
}> = ({
  customerName, customerId, customerMobile, customerEmail, product,
  instruction, onInstructionConsumed, onShared,
}) => {
  const [selected, setSelected] = useState<ChannelId[]>([]);
  const [context, setContext] = useState<ContextId | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<ChannelId, Draft>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const first = customerName.split(" ")[0];

  const ref = useMemo(
    () => `${product.code.slice(0, 2).toUpperCase()}${customerId.slice(-4)}${rm.sol_id}`,
    [product.code, customerId],
  );
  const url = useMemo(() => {
    const p = new URLSearchParams({ product: product.code, cid: customerId, rm: rm.rm_id, src: "rm-crm", ref });
    return `${rm.apply_base_url}?${p.toString()}`;
  }, [product.code, customerId, ref]);

  const systemFor = (ch: ChannelId, ctx: ContextId) => `You are the Modus Agent helping ${rm.name}, a Relationship Manager at IDBI Bank, write to a customer.

Customer: ${customerName} (CID ${customerId})
Product: ${product.label}
Relationship: ${ctx === "first" ? "FIRST CONTACT — they have not discussed this product with the RM. Do not imply any prior conversation." : "FOLLOW-UP — they have already discussed this with the RM."}
Application link: ${url}
Sign-off: ${rm.name}, ${rm.role}, ${rm.branch} branch

Channel: ${ch.toUpperCase()}
${ch === "email" ? "Write an email. First line must be 'Subject: <subject>', then a blank line, then the body." : ""}${ch === "whatsapp" ? "WhatsApp message. Warm, 3-5 short lines, link on its own line. One tasteful emoji at most." : ""}${ch === "sms" ? "SMS. Under 300 characters, plain text, no emoji, include the link." : ""}${ch === "call" ? "A script to be READ ALOUD by a voice agent. Never read out a URL — say the link has been sent by SMS and offer a callback. Short spoken sentences." : ""}

Indian English. No invented figures, rates or approvals. Never promise approval. Return ONLY the message text.`;

  const callModel = async (system: string, messages: { role: "user" | "assistant"; content: string }[]) => {
    const res = await fetch("/api/agent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Model request failed.");
    return String(data.text || "").trim();
  };

  const parse = (raw: string, ch: ChannelId): Draft => {
    if (ch !== "email") return { body: raw };
    const m = raw.match(/^\s*Subject:\s*(.+?)\n+([\s\S]*)$/i);
    return m ? { subject: m[1].trim(), body: m[2].trim() } : { body: raw };
  };

  /** Generate (or regenerate, when `tweak` is given) a draft per selected channel. */
  const generate = async (channels: ChannelId[], ctx: ContextId, tweak?: string) => {
    if (!channels.length) return;
    setBusy(true); setError(null);
    try {
      const results = await Promise.all(channels.map(async (ch) => {
        const msgs: { role: "user" | "assistant"; content: string }[] = [
          { role: "user", content: `Write the ${ch} message now.` },
        ];
        const existing = drafts[ch];
        if (tweak && existing) {
          msgs.push({ role: "assistant", content: existing.subject ? `Subject: ${existing.subject}\n\n${existing.body}` : existing.body });
          msgs.push({ role: "user", content: `${tweak}\n\nReturn the full revised message in the same format.` });
        }
        return [ch, parse(await callModel(systemFor(ch, ctx), msgs), ch)] as const;
      }));
      setDrafts((d) => ({ ...d, ...Object.fromEntries(results) }));
    } catch (e: any) {
      setError(e?.message ?? "Could not reach the model.");
    } finally {
      setBusy(false);
    }
  };

  // Refinements typed into the agent's own input land here.
  useEffect(() => {
    if (!instruction) return;
    const text = instruction.trim();
    onInstructionConsumed?.();
    if (!text) return;
    if (selected.length && context) generate(selected, context, text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruction]);

  const toggle = (id: ChannelId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const AgentLine: FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-[13px] leading-relaxed text-gray-800">{children}</div>
  );

  const Preview: FC<{ ch: ChannelId; draft: Draft }> = ({ ch, draft }) => {
    const meta = CHANNELS.find((c) => c.id === ch)!;
    const Icon = meta.icon;
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Icon className="h-3.5 w-3.5 text-blue-600" /> {meta.label}
          </span>
          {sent.includes(meta.label) ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-green-700">
              <Check className="h-3 w-3" /> Sent
            </span>
          ) : (
            <button
              type="button"
              onClick={() => { setSent((s) => [...s, meta.label]); onShared(meta.label, url); }}
              className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
            >
              {ch === "call" ? "Place call" : "Send"}
            </button>
          )}
        </div>

        {/* Every preview is the CUSTOMER's view, not the RM's: the message is
            INCOMING — left-aligned, no delivery ticks, sender shown as the bank.
            A right-aligned green bubble with ✓✓ is what the sender sees. */}
        {ch === "email" ? (
          // Customer's inbox: from the RM, to them.
          <div className="px-3 py-2">
            <p className="text-[10px] text-gray-500">
              From <span className="font-medium text-gray-700">{rm.name} · IDBI Bank</span>
            </p>
            <p className="mt-0.5 text-xs font-semibold text-gray-900">{draft.subject || "(no subject)"}</p>
            <p className="mb-1.5 text-[10px] text-gray-400">to {customerEmail ?? "you"}</p>
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-gray-800">{draft.body}</p>
          </div>
        ) : ch === "call" ? (
          // What the customer hears when they pick up.
          <div className="px-3 py-2">
            <p className="mb-1.5 text-[10px] text-gray-500">
              Incoming call from <span className="font-medium text-gray-700">IDBI Bank</span> · what {first} hears
            </p>
            <p className="whitespace-pre-wrap rounded bg-gray-50 p-2 text-[12px] italic leading-relaxed text-gray-800">
              {draft.body}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">Quote ref {ref} if they ask.</p>
          </div>
        ) : ch === "whatsapp" ? (
          // WhatsApp: cream wallpaper, incoming message is a WHITE bubble on the left.
          <div className="bg-[#ECE5DD] px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-medium text-gray-600">IDBI Bank</p>
            <div className="w-fit max-w-[92%] rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5 shadow-sm">
              <p className="whitespace-pre-wrap break-words text-[12px] leading-snug text-gray-900">{draft.body}</p>
              <p className="mt-0.5 text-right text-[9px] text-gray-400">now</p>
            </div>
          </div>
        ) : (
          // SMS: plain white thread, grey incoming bubble, alphanumeric sender id.
          <div className="bg-white px-3 py-2.5">
            <p className="mb-1.5 text-center text-[10px] font-medium text-gray-500">IM-IDBIBK</p>
            <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2">
              <p className="whitespace-pre-wrap break-all text-[12px] leading-snug text-gray-900">{draft.body}</p>
            </div>
            <p className="mt-1 text-[9px] text-gray-400">now</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Agent asks which channels — multi-select. */}
      <AgentLine>
        How would you like to send {first} the <span className="font-semibold">{product.label}</span> application link?
        Pick one or more and I&apos;ll draft each one.
      </AgentLine>

      <div className="grid grid-cols-2 gap-1.5">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[13px] font-medium transition-colors",
                on ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:bg-gray-50",
              )}
            >
              <span className={cn("grid size-4 shrink-0 place-items-center rounded border",
                on ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300")}>
                {on && <Check className="h-3 w-3" />}
              </span>
              <Icon className="h-3.5 w-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <>
          <AgentLine>Is this the first time you&apos;re raising it, or a follow-up?</AgentLine>
          <div className="flex gap-1.5">
            {([["first", "First contact"], ["followup", "Follow-up"]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setContext(id); generate(selected, id); }}
                disabled={busy}
                className={cn(
                  "flex-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50",
                  context === id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:bg-gray-50",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-[13px] text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Drafting {selected.length} message{selected.length === 1 ? "" : "s"}…
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>}

      {Object.keys(drafts).length > 0 && !busy && (
        <>
          <AgentLine>
            <span className="inline-flex items-center gap-1 font-medium text-gray-900">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Here&apos;s how each will look
            </span>
            <span className="block text-gray-600">
              Type any change below — &ldquo;make it less verbose&rdquo;, &ldquo;add bullet points&rdquo; — and I&apos;ll
              revise every selected channel.
            </span>
          </AgentLine>
          <div className="space-y-2">
            {selected.filter((ch) => drafts[ch]).map((ch) => (
              <Preview key={ch} ch={ch} draft={drafts[ch]!} />
            ))}
          </div>

          {/* Send step — per channel above, or all at once here. */}
          {(() => {
            const ready = selected.filter((ch) => drafts[ch]);
            const pending = ready.filter((ch) => !sent.includes(CHANNELS.find((c) => c.id === ch)!.label));
            if (pending.length === 0) {
              return (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
                  <Check className="h-4 w-4 shrink-0" />
                  Sent on {ready.map((ch) => CHANNELS.find((c) => c.id === ch)!.label).join(", ")} and recorded on the relationship feed.
                </div>
              );
            }
            return (
              <button
                type="button"
                onClick={() => {
                  pending.forEach((ch) => {
                    const label = CHANNELS.find((c) => c.id === ch)!.label;
                    onShared(label, url);
                  });
                  setSent((s) => [...s, ...pending.map((ch) => CHANNELS.find((c) => c.id === ch)!.label)]);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                Send {pending.length === ready.length ? "all" : "remaining"} ({pending.length})
              </button>
            );
          })()}

          <p className="text-[11px] text-gray-500">
            Attributed to <span className="font-medium text-gray-700">{rm.rm_id}</span> · ref {ref}
          </p>
        </>
      )}
    </div>
  );
};

export default ApplicationLinkComposer;
