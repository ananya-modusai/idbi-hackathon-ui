"use client";

// Turn action rows, ported from axis-cam-ui/app/pages/ModusAgent/AgentTurnActions.tsx.
// Faint until the turn is hovered; the timestamp stays visible because it is information.

import { useEffect, useState } from "react";
import { Check, Copy, Pencil, RotateCcw, ThumbsDown, ThumbsUp, Volume2, VolumeX } from "lucide-react";

const button =
  "grid h-7 w-7 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700";

export function AgentTurnActions({ text, at, onRetry }: { text: string; at?: string; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* clipboard is permission-gated and may refuse */
    }
  };

  const toggleSpeech = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div className="mt-2 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/turn:opacity-100">
      <button type="button" onClick={copy} title={copied ? "Copied" : "Copy"} className={button}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <button type="button" onClick={toggleSpeech} title={speaking ? "Stop" : "Read aloud"} className={speaking ? button.replace("text-gray-400", "text-blue-600") : button}>
        {speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
      <button type="button" onClick={() => setRating(r => (r === "up" ? null : "up"))} title="Good answer" className={rating === "up" ? button.replace("text-gray-400", "text-green-600") : button}>
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setRating(r => (r === "down" ? null : "down"))} title="Bad answer" className={rating === "down" ? button.replace("text-gray-400", "text-red-600") : button}>
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onRetry} title="Try again" className={button}>
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      {at && <span className="ml-1.5 text-[11px] text-gray-400">{at}</span>}
    </div>
  );
}

export function UserTurnActions({ at, onRetry, onEdit, onCopy }: { at?: string; onRetry: () => void; onEdit: () => void; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <div className="mt-1.5 flex items-center justify-end gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/turn:opacity-100">
      {at && <span className="mr-1.5 text-[11px] text-gray-400">{at}</span>}
      <button type="button" onClick={onRetry} title="Ask again" className={button}><RotateCcw className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={onEdit} title="Edit" className={button}><Pencil className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={() => { onCopy(); setCopied(true); }} title={copied ? "Copied" : "Copy"} className={button}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
