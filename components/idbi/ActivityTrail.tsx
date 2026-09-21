"use client";

// "What the agent did before it answered", as one faint line above the reply.
// Ported from axis-cam-ui/app/pages/ModusAgent/ActivityTrail.tsx.

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ModusMarkAnimated } from "./ModusMarkAnimated";

export interface TrailStep { text: string; href?: string; failed?: boolean }
export interface Trail { label: string; runningLabel?: string; steps: TrailStep[] }

export function ActivityTrail({ trail, revealed, running = false, defaultOpen = false }: {
  trail: Trail; revealed?: number; running?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [touched, setTouched] = useState(false);

  // Open while it writes, closed once done — unless the RM opened it themselves.
  useEffect(() => {
    if (!touched && !running && defaultOpen) setOpen(false);
  }, [running, touched, defaultOpen]);

  const steps = revealed === undefined ? trail.steps : trail.steps.slice(0, revealed);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => { setTouched(true); setOpen(o => !o); }}
        className="-ml-1 flex items-center gap-1.5 rounded px-1 py-0.5 text-[13px] text-gray-400 transition-colors hover:text-gray-600"
      >
        {running && <ModusMarkAnimated size={16} />}
        <span>{running ? trail.runningLabel ?? trail.label : trail.label}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {open && steps.length > 0 && (
        <div className="mt-1.5 overflow-hidden rounded-lg border border-gray-200">
          {steps.map((step, i) => (
            <div key={i} className={`flex flex-wrap items-baseline gap-x-2 px-3 py-2 text-[12.5px] ${i > 0 ? "border-t border-gray-100" : ""} ${step.failed ? "bg-orange-50/60 text-orange-800" : "text-gray-500"}`}>
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
