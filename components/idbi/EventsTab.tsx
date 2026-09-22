"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";
import data from "@/app/idbi-data/vandana-workspace.json";
import { SectionHeader, StatusPill } from "@/components/idbi/workspace-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Each kind of event keeps its own chip tone, as the delivery has it. */
const TYPE_TONE: Record<string, "emerald" | "blue" | "amber" | "violet"> = {
  "Customer Event": "emerald",
  "Career Event": "blue",
  "Account Signal": "amber",
  "Market Event": "violet",
};

/**
 * Events — everything that has happened on this customer, newest first: personal and
 * financial changes, career moves picked up externally, and market news that touches
 * them. One row per event, dated on the left.
 */
export function EventsTab() {
  const customer = data.customer as any;
  const events = (customer.events ?? []) as Array<{
    date: string; ago: string; type: string; title: string; detail: string; tags: string[];
  }>;
  const [filter, setFilter] = React.useState("All Events");

  const shown = filter === "All Events" ? events : events.filter(e => e.type === filter);

  return (
    <div className="space-y-4 px-6 pb-16">

      <div className="space-y-2.5">
        {shown.map(event => (
          <article
            key={`${event.date}-${event.title}`}
            className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,.03)]"
          >
            <div className="w-[104px] shrink-0">
              <p className="text-sm font-medium text-slate-900">{event.date}</p>
              <p className="text-xs text-slate-500">{event.ago}</p>
            </div>

            <span className="w-[132px] shrink-0">
              <StatusPill tone={TYPE_TONE[event.type] ?? "slate"} fixedWidth="w-[124px]">{event.type}</StatusPill>
            </span>

            {/* Title, detail and tags all sit on the one line — the row never wraps. */}
            <p className="w-[250px] shrink-0 truncate text-sm font-semibold text-slate-950" title={event.title}>
              {event.title}
            </p>

            <p className="min-w-0 flex-1 truncate text-xs text-slate-600" title={event.detail}>
              {event.detail}
            </p>

            <div className="flex shrink-0 items-center gap-1.5">
              {event.tags.map(tag => <StatusPill key={tag} tone="slate" fixedWidth="w-[124px]">{tag}</StatusPill>)}
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">No events of this type on record.</p>
      )}
    </div>
  );
}

export default EventsTab;
