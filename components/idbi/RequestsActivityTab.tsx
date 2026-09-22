"use client";

import * as React from "react";
import { CalendarClock, Check, CircleCheck, Eye, FileText, MessageSquareText, Pencil, Plus, Search, TicketCheck, UsersRound } from "lucide-react";

import { useWorkspaceData } from "@/components/idbi/workspaceData";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton, MetricCard, SectionHeader, StatusPill, Toast } from "@/components/idbi/workspace-ui";
import CustomListFilter, {
  PrimaryFilterGroup,
  SecondaryFilterGroup,
  TertiaryFilterGroup,
  useFilterState,
} from "@/components/custom/CustomList/customListFilter";

type ActionKind = "interaction" | "ticket" | "opportunity" | "followup";
type FeedEvent = { date: string; type: string; summary: string; outcomes?: string[] };
type FeedRow = { id: string; title: string; type: string; status: string; owner: string; summary: string; currentState: string; nextAction: string; open: boolean; events: FeedEvent[] };

const typeTone: Record<string, "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"> = {
  Sales: "violet", Service: "blue", Application: "amber", Complaint: "rose", "General Relationship": "slate",
};

function statusTone(status: string) {
  if (["Open", "Active"].includes(status)) return "blue" as const;
  if (status.includes("Approved") || status === "Resolved" || status === "Recorded") return "emerald" as const;
  if (status === "Declined") return "rose" as const;
  return "amber" as const;
}

export function RequestsActivityTab({ requestedAction = null, onActionConsumed }: { requestedAction?: ActionKind | null; onActionConsumed?: () => void }) {
  const data = useWorkspaceData();
  const [view, setView] = React.useState("allActivity");
  const [type, setType] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [composer, setComposer] = React.useState<ActionKind | null>(requestedAction);
  const [created, setCreated] = React.useState<Array<{ id: string; title: string; kind: ActionKind; note: string; type?: string }>>([]);
  const [saved, setSaved] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<FeedRow | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formType, setFormType] = React.useState("General Relationship");
  const [formTitle, setFormTitle] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({ status: "", type: "", currentState: "", nextAction: "" });
  // Edits made in the sheet, keyed by row id, layered over the fixture rows.
  const [edits, setEdits] = React.useState<Record<string, Partial<FeedRow>>>({});

  const saveEdits = (row: FeedRow) => {
    setEdits(prev => ({ ...prev, [row.id]: { ...prev[row.id], ...draft } }));
    setEditing(false);
    setSaved("Changes saved to the relationship feed.");
  };

  const actionCopy: Record<ActionKind, { title: string; placeholder: string; button: string }> = {
    interaction: { title: "Log interaction", placeholder: "Capture the discussion, customer intent and agreed next step…", button: "Save interaction" },
    ticket: { title: "Create service ticket", placeholder: "Describe the request, issue or service action…", button: "Create ticket" },
    opportunity: { title: "Create opportunity", placeholder: "Capture the need, product family and expected next step…", button: "Create opportunity" },
    followup: { title: "Schedule follow-up", placeholder: "Add the follow-up purpose and preparation notes…", button: "Schedule follow-up" },
  };

  const createdRows: FeedRow[] = created.map(item => ({ id: item.id, title: item.title, type: item.type ?? (item.kind === "ticket" ? "Service" : item.kind === "opportunity" ? "Sales" : "General Relationship"), status: "Recorded", owner: "Ananya Rao", summary: item.note, currentState: item.note, nextAction: item.kind === "followup" ? "Follow-up scheduled" : "Review next action", open: item.kind !== "interaction", events: [{ date: "Just now", type: item.title, summary: item.note }] }));
  const allRows: FeedRow[] = [...createdRows, ...(data.relationshipFeed.threads as FeedRow[])].map(r => (edits[r.id] ? { ...r, ...edits[r.id] } : r));
  const rows = allRows.filter(item => {
    const matchesView = view === "allActivity" || item.open;
    const matchesType = type === "all" || item.type === type;
    const haystack = `${item.title} ${item.id} ${item.currentState} ${item.owner}`.toLowerCase();
    return matchesView && matchesType && haystack.includes(search.toLowerCase());
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const activeComposer = requestedAction ?? composer;
    if (!activeComposer) return;
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") || "Customer follow-up recorded.");
    setCreated(items => [{ id: `LOCAL-${items.length + 1}`, title: formTitle.trim() || actionCopy[activeComposer].title, kind: activeComposer, note, type: formType }, ...items]);
    setSaved(`${actionCopy[activeComposer].title} saved to the relationship feed.`);
    setComposer(null);
    setFormTitle("");
    onActionConsumed?.();
  }

  const activeComposer = requestedAction ?? composer;

  // Feed filters — the standard CustomListFilter group (same as All Appraisals):
  // view + type as labelled single-selects, search in the tertiary row.
  const primaryFilterGroup = React.useMemo<PrimaryFilterGroup[]>(() => [
    {
      id: "search",
      label: "Search",
      type: "searchbar" as const,
      options: [],
      selectedValues: search ? [search] : [],
      onFilterChange: () => {},
      onSearchChange: (val: string) => setSearch(val),
      showLabel: false,
      searchPlaceholder: "Search matter, activity or owner...",
    },
    {
      id: "type",
      label: "Type",
      type: "multiselect" as const,
      options: [
        { value: "Sales", label: "Sales" },
        { value: "Service", label: "Service" },
        { value: "Application", label: "Applications" },
        { value: "Complaint", label: "Complaints" },
        { value: "General Relationship", label: "General relationship" },
      ],
      selectedValues: type === "all" ? [] : [type],
      onFilterChange: (vals: string[]) => setType(vals[vals.length - 1] ?? "all"),
      singleSelect: true,
      showAllOption: true,
      showLabel: true,
      maxWidth: "280px",
    },
    {
      id: "view",
      label: "View",
      type: "togglebuttons" as const,
      options: [{ value: "allActivity", label: "All activity" }, { value: "open", label: "Open matters" }],
      selectedValues: [view],
      onFilterChange: (vals: string[]) => setView(vals[vals.length - 1] ?? "allActivity"),
      singleSelect: true,
      showAllOption: false,
      showLabel: true,
    },
  ], [view, type, search]);

  const tertiaryFilterGroups = React.useMemo<TertiaryFilterGroup[]>(() => [], []);

  const filterGroups = React.useMemo(() => ({
    primary: primaryFilterGroup,
    secondary: [] as SecondaryFilterGroup[],
    tertiary: tertiaryFilterGroups,
  }), [primaryFilterGroup, tertiaryFilterGroups]);

  const { filterState, setFilterState } = useFilterState(filterGroups);


  /** The record detail, rendered inside the artifact panel. */
  const renderDetail = (row: FeedRow) => (
    <div className="pb-5">
      {/* Sticky so the title and Edit stay reachable however far the detail scrolls. */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-5 pb-3 pt-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusPill tone={typeTone[row.type] ?? "slate"}>{row.type}</StatusPill>
        <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950">{row.title}</h3>
          <p className="mt-1 text-xs text-slate-500">{row.id} · Owner: {row.owner}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {editing && editingId === row.id && (
            <ActionButton variant="outline" onClick={() => setEditing(false)}>Cancel</ActionButton>
          )}
          <ActionButton
            variant={editing && editingId === row.id ? "default" : "outline"}
            onClick={() => {
              if (editing && editingId === row.id) { saveEdits(row); } else {
                setDraft({ status: row.status, type: row.type, currentState: row.currentState, nextAction: row.nextAction });
                setEditingId(row.id);
                setEditing(true);
              }
            }}
          >
            {editing && editingId === row.id ? <><Check />Save</> : <><Pencil />Edit</>}
          </ActionButton>
        </div>
      </div>

      </div>

      <div className="px-5 pt-5">
        {editing && editingId === row.id ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Status</span>
                <Select value={draft.status} onValueChange={v => setDraft(d => ({ ...d, status: v }))}>
                  <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Open", "Awaiting Customer", "Approved", "Declined", "Resolved", "Recorded"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Type</span>
                <Select value={draft.type} onValueChange={v => setDraft(d => ({ ...d, type: v }))}>
                  <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Sales", "Service", "Application", "Complaint", "General Relationship"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Current state</span>
              <Textarea className="min-h-20 bg-white" value={draft.currentState} onChange={e => setDraft(d => ({ ...d, currentState: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Next action</span>
              <Textarea className="min-h-20 bg-white" value={draft.nextAction} onChange={e => setDraft(d => ({ ...d, nextAction: e.target.value }))} />
            </label>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-slate-500">Current state</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">{row.currentState}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-slate-500">Next action</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">{row.nextAction}</p>
              </div>
            </div>
            <h4 className="mt-6 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900">Activity history</h4>
            <ol className="relative ml-2 mt-4 border-l border-slate-200">
              {row.events.map((event, index) => (
                <li key={`${event.date}-${event.type}`} className="relative pb-5 pl-5 last:pb-0">
                  <span className={cn("absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white", index === 0 ? "bg-blue-600" : "bg-slate-300")} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{event.type}</span>
                    <span className="text-[11px] text-slate-500">{event.date}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{event.summary}</p>
                  {event.outcomes && <div className="mt-2 flex flex-wrap gap-1.5">{event.outcomes.map(outcome => <StatusPill key={outcome} tone="emerald">{outcome}</StatusPill>)}</div>}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );


  return (
    <div className="space-y-10">
      <section>
        <SectionHeader icon={Plus} title="Quick Actions" />
        <div className="flex flex-wrap gap-2">{(["interaction", "ticket", "opportunity", "followup"] as ActionKind[]).map(kind => <ActionButton key={kind} variant={kind === "interaction" ? "default" : "outline"} onClick={() => setComposer(kind)}>{kind === "interaction" ? <MessageSquareText /> : kind === "ticket" ? <TicketCheck /> : kind === "opportunity" ? <Plus /> : <CalendarClock />}{actionCopy[kind].title}</ActionButton>)}</div>
        {activeComposer && (
          <form onSubmit={submit} className="mt-3 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{actionCopy[activeComposer].title}</h3>
              <ActionButton variant="outline" onClick={() => { setComposer(null); onActionConsumed?.(); }}>Cancel</ActionButton>
            </div>

            {/* flex + min-w-0, not a grid with a fixed track: the select's min-content
                width used to overflow its track and crush the title field. */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <label className="flex w-full shrink-0 flex-col gap-1 sm:w-[220px]">
                <span className="text-xs font-medium text-slate-600">Category</span>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Relationship">General relationship</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Application">Application</SelectItem>
                    <SelectItem value="Complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Title</span>
                <Input className="w-full bg-white" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Short title" />
              </label>
            </div>

            <label className="mt-3 flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600">Details</span>
              <Textarea name="note" required className="min-h-20 bg-white" placeholder={actionCopy[activeComposer].placeholder} />
            </label>

            <div className="mt-3 flex justify-end">
              <ActionButton variant="default" type="submit"><CircleCheck />{actionCopy[activeComposer].button}</ActionButton>
            </div>
          </form>
        )}
        <Toast message={saved} onDone={() => setSaved(null)} />
      </section>

      <section>
        <SectionHeader icon={UsersRound} title="Relationship Highlights" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.relationshipFeed.highlights.map((item, index) => <button type="button" key={item.label} onClick={() => setView(item.filter === "open" || item.filter === "awaiting" ? "open" : "allActivity")} className="rounded-lg text-left transition hover:brightness-[.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"><MetricCard icon={index < 2 ? TicketCheck : CalendarClock} label={item.label} value={item.value} tone={index < 2 ? "amber" : "blue"} /></button>)}</div>
      </section>

      <section>
        <SectionHeader icon={FileText} title="Unified Relationship Feed" />
        <div className="mb-3">
          <CustomListFilter
            filterGroups={filterGroups}
            filterState={filterState}
            setFilterState={setFilterState}
            showFilterToggle={false}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table className="min-w-[1280px] table-fixed">
            <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead className="w-[240px]">Status</TableHead><TableHead className="w-[220px]">Matter</TableHead><TableHead className="w-[240px]">Type</TableHead><TableHead className="w-[150px]">Owner</TableHead><TableHead className="w-[198px]">Summary</TableHead><TableHead className="w-[160px]">Last Activity</TableHead><TableHead className="sticky right-0 w-[72px] bg-slate-50 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,.5)]">Details</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(row => <TableRow key={row.id} className="group hover:bg-[#f4f8ff]"><TableCell><StatusPill tone={statusTone(row.status)} fixedWidth="w-[168px]">{row.status}</StatusPill></TableCell><TableCell><p className="font-semibold text-slate-900">{row.title}</p><p className="mt-1 text-[11px] text-slate-500">{row.id}</p></TableCell><TableCell><StatusPill tone={typeTone[row.type] ?? "slate"} fixedWidth="w-[150px]">{row.type}</StatusPill></TableCell><TableCell className="text-xs text-slate-700">{row.owner}</TableCell><TableCell className="whitespace-normal break-words text-xs leading-5 text-slate-700">{row.summary}</TableCell><TableCell className="whitespace-normal text-xs leading-5 text-slate-600">{row.events[0]?.date}</TableCell><TableCell className="sticky right-0 bg-white text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,.5)] group-hover:bg-[#f4f8ff]"><ActionButton size="icon" variant="ghost" onClick={() => setSelected(row)} aria-label={`View details for ${row.title}`} title="View details"><Eye className="size-4" /></ActionButton></TableCell></TableRow>)}</TableBody>
          </Table>
          {rows.length === 0 && <div className="px-4 py-12 text-center"><Search className="mx-auto size-5 text-slate-400" /><p className="mt-2 text-sm font-semibold text-slate-800">No activity matches these filters</p><button type="button" className="mt-1 text-xs font-medium text-blue-700" onClick={() => { setView("allActivity"); setType("all"); setSearch(""); }}>Clear filters</button></div>}
        </div>
      </section>

      <Sheet open={Boolean(selected)} onOpenChange={open => { if (!open) { setSelected(null); setEditing(false); } }}>
        <SheetContent side="right" className="w-[min(560px,94vw)] gap-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-0 sm:max-w-[560px]">
          <SheetTitle className="sr-only">{selected?.title}</SheetTitle>
          <SheetDescription className="sr-only">Record detail</SheetDescription>
          {selected && renderDetail(selected)}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default RequestsActivityTab;
