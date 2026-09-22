"use client";

import { FC, useMemo, useState } from "react";
import { CalendarClock, ContactRound, LayoutGrid, MessageSquareText, MoreHorizontal, Sparkles, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KeyMetrics } from "@/components/custom/KeyMetrics";
import { CustomTableView, Column } from "@/components/custom/CustomTableView";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toast } from "@/components/idbi/workspace-ui";
import { ModusAgentPanel } from "@/components/idbi/ModusAgentPanel";
import CustomListFilter, {
  PrimaryFilterGroup,
  SecondaryFilterGroup,
  TertiaryFilterGroup,
  useFilterState,
} from "@/components/custom/CustomList/customListFilter";
import screenData from "@/app/idbi-data/customer-screen-1.json";

type Customer = (typeof screenData.customers)[number];

const MY_RM = "Ananya Rao";
const UNASSIGNED = "Unassigned";
/** The relationship managers a customer can be assigned to. */
const RM_ROSTER = ["Ananya Rao", "Kabir Mehta", "Priya Nair", "Rohan Das", UNASSIGNED];
const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

const priorityColor = (p: string) =>
  p === "High" ? "red" : p === "Medium" ? "yellow" : "gray";

/** Lead priority is shown ranked: P1 · High, P2 · Medium, P3 · Low. */
const PRIORITY_RANK_LABEL: Record<string, string> = { High: "P1", Medium: "P2", Low: "P3" };
const priorityLabel = (p: string) => `${PRIORITY_RANK_LABEL[p] ?? "P3"} · ${p}`;

const healthColor = (band: string) =>
  band === "Good" ? "green" : band === "Poor" ? "red" : "yellow";

/** Business or Individual — what kind of customer this is. */
const categoryColor = (category: string) => (category === "Business" ? "indigo" : "teal");

/** Relationship tier, coloured to its metal: Platinum · Gold · Silver · Bronze. */
const tierColor = (tier: string) =>
  tier === "Platinum" ? "platinum"
    : tier === "Gold" ? "gold"
    : tier === "Silver" ? "silver"
    : tier === "Bronze" ? "bronze"
    // A prospect has not earned a tier yet — plain grey, not a metal.
    : "gray";

type Scope = "my" | "team";

export const CustomersScreen: FC<{
  onOpenCustomer?: (c: any) => void;
  onRowAction?: (row: Record<string, any>, action: "interaction" | "followup" | "reassign") => void;
}> = ({ onOpenCustomer, onRowAction }) => {
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [scope, setScope] = useState<Scope>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [prioritySelected, setPrioritySelected] = useState<string[]>([]);
  const [tierSelected, setTierSelected] = useState<string[]>([]);
  const [relationshipSelected, setRelationshipSelected] = useState<string[]>([]);
  const [categorySelected, setCategorySelected] = useState<string[]>([]);
  const [sortSelected, setSortSelected] = useState<string[]>(["priority"]);
  // Who each customer is assigned to. `saved` is what is on file; `draft` is what the
  // RM has changed on screen but not committed — any difference turns on edit mode.
  const [savedAssignees, setSavedAssignees] = useState<Record<string, string>>({});
  const [draftAssignees, setDraftAssignees] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  // A filter the agent applied on the user's behalf — shown as a removable chip.
  const [agentFilter, setAgentFilter] = useState<{ id: string; label: string } | null>(null);

  const all = screenData.customers as Customer[];

  // Seed both maps from the file the first time the list renders.
  const baseline = useMemo(
    () => Object.fromEntries(all.map(c => [c.customer_id, c.relationship_owner])) as Record<string, string>,
    [all]
  );
  const assigned = (id: string) => draftAssignees[id] ?? savedAssignees[id] ?? baseline[id] ?? UNASSIGNED;
  const dirtyIds = Object.keys(draftAssignees).filter(id => draftAssignees[id] !== (savedAssignees[id] ?? baseline[id]));
  const isEditing = dirtyIds.length > 0;

  const saveAssignees = () => {
    setSavedAssignees(prev => ({ ...prev, ...draftAssignees }));
    setDraftAssignees({});
    setToast(`${dirtyIds.length} customer${dirtyIds.length === 1 ? "" : "s"} reassigned`);
  };
  const myCount = all.filter((c) => c.relationship_owner === MY_RM).length;

  const priorityOptions = useMemo(
    () => [
      { value: "High", label: "P1 · High" },
      { value: "Medium", label: "P2 · Medium" },
      { value: "Low", label: "P3 · Low" },
    ],
    []
  );

  const tierOptions = useMemo(
    () => [
      { value: "Platinum", label: "Platinum" },
      { value: "Gold", label: "Gold" },
      { value: "Silver", label: "Silver" },
      { value: "Bronze", label: "Bronze" },
      { value: "Untiered", label: "No tier" },
    ],
    []
  );

  const relationshipOptions = useMemo(
    () => [
      { value: "Existing", label: "Existing" },
      { value: "Prospect · NTB", label: "Prospect · NTB" },
    ],
    []
  );

  const categoryOptions = useMemo(
    () => [
      { value: "Business", label: "Business" },
      { value: "Individual", label: "Individual" },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: "priority", label: "Lead priority" },
      { value: "health", label: "Financial health" },
      { value: "name", label: "Name (A–Z)" },
    ],
    []
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setAgentFilter(null);
    setPrioritySelected([]);
    setTierSelected([]);
    setRelationshipSelected([]);
    setCategorySelected([]);
    setSortSelected(["priority"]);
    setFilterState((prev) => {
      const cleared = (r: Record<string, string[]>) =>
        Object.fromEntries(Object.keys(r).map((k) => [k, [] as string[]]));
      return {
        ...prev,
        primarySelected: cleared(prev.primarySelected),
        secondarySelected: cleared(prev.secondarySelected),
        tertiarySelected: cleared(prev.tertiarySelected),
        quaternarySelected: cleared(prev.quaternarySelected),
        searchbarQueries: Object.fromEntries(Object.keys(prev.searchbarQueries).map((k) => [k, ""])),
      };
    });
  };

  const clearAgentFilter = () => setAgentFilter(null);

  const primaryFilterGroup = useMemo<PrimaryFilterGroup[]>(
    () => [
      {
        id: "priority",
        label: "Lead Priority",
        type: "multiselect" as const,
        options: priorityOptions,
        selectedValues: prioritySelected,
        onFilterChange: (vals: string[]) => setPrioritySelected(vals),
        singleSelect: true,
        showAllOption: true,
        showLabel: true,
        width: "240px",
      },
      {
        id: "sort",
        label: "Sort By",
        type: "multiselect" as const,
        options: sortOptions,
        selectedValues: sortSelected,
        onFilterChange: (vals: string[]) => setSortSelected(vals.length ? vals : ["priority"]),
        singleSelect: true,
        showAllOption: false,
        showLabel: true,
        width: "250px",
      },
      {
        id: "category",
        label: "Category",
        type: "multiselect" as const,
        options: categoryOptions,
        selectedValues: categorySelected,
        onFilterChange: (vals: string[]) => setCategorySelected(vals),
        showAllOption: true,
        showLabel: true,
        width: "205px",
      },
      {
        id: "relationship",
        label: "Relationship",
        type: "multiselect" as const,
        options: relationshipOptions,
        selectedValues: relationshipSelected,
        onFilterChange: (vals: string[]) => setRelationshipSelected(vals),
        showAllOption: true,
        showLabel: true,
        width: "235px",
      },
      {
        id: "tier",
        label: "Tier",
        type: "multiselect" as const,
        options: tierOptions,
        selectedValues: tierSelected,
        onFilterChange: (vals: string[]) => setTierSelected(vals),
        showAllOption: true,
        showLabel: true,
        width: "165px",
        // Right end of the filter row — where a filter the agent applied is announced.
        actionElements: agentFilter ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700">
            <Sparkles className="size-3.5" />
            Agent: {agentFilter.label}
            <button type="button" onClick={clearAgentFilter} aria-label="Clear agent filter" className="ml-0.5 text-blue-500 hover:text-blue-800">
              <X className="size-3.5" />
            </button>
          </span>
        ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [priorityOptions, prioritySelected, sortOptions, sortSelected, categoryOptions, categorySelected,
      relationshipOptions, relationshipSelected, tierOptions, tierSelected, agentFilter]
  );

  const secondaryFilterGroups = useMemo<SecondaryFilterGroup[]>(() => [], []);

  const tertiaryFilterGroups = useMemo<TertiaryFilterGroup[]>(
    () => [
      {
        id: "search",
        label: "Search",
        type: "searchbar" as const,
        options: [],
        selectedValues: searchQuery ? [searchQuery] : [],
        onFilterChange: () => {},
        onSearchChange: (val: string) => setSearchQuery(val),
        showLabel: false,
        searchPlaceholder: "Search by customer name, ID, location...",
        // A max width makes the search flex-grow instead of claiming the whole row,
        // so the agent button stays on the same line.
        maxWidth: "100%",
        // Sits at the right of the search row, as the Clear Filters button does on the
        // filter row above it.
        actionElements: (
          <span className="flex shrink-0 items-center gap-3">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="h-10 w-auto whitespace-nowrap border-gray-300 px-3 font-semibold text-gray-600 shadow-sm transition-all active:scale-95 hover:bg-gray-50"
            >
              Clear Filters
            </Button>
            <Button
              onClick={() => setAgentOpen(true)}
              className="h-10 gap-1.5 whitespace-nowrap bg-blue-600 px-3.5 font-semibold text-white shadow-sm transition-all active:scale-95 hover:bg-blue-700"
            >
              <Sparkles className="size-4" /> Modus Agent
            </Button>
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery]
  );

  const filterGroups = useMemo(
    () => ({ primary: primaryFilterGroup, secondary: secondaryFilterGroups, tertiary: tertiaryFilterGroups }),
    [primaryFilterGroup, secondaryFilterGroups, tertiaryFilterGroups]
  );

  const { filterState, setFilterState } = useFilterState(filterGroups);

  const rows = useMemo(() => {
    let list = scope === "my" ? all.filter((c) => c.relationship_owner === MY_RM) : all;
    if (prioritySelected.length) list = list.filter((c) => prioritySelected.includes(c.lead_priority));
    if (tierSelected.length) list = list.filter((c) => tierSelected.includes(c.tier));
    if (relationshipSelected.length) list = list.filter((c) => relationshipSelected.includes(c.relationship));
    if (categorySelected.length) list = list.filter((c) => categorySelected.includes(c.category));
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.customer_id.includes(q) ||
          c.location.toLowerCase().includes(q)
      );
    }
    if (agentFilter?.id === "needs-attention") list = list.filter(c => c.health.score < 70);
    if (agentFilter?.id === "prospects") list = list.filter(c => c.relationship.startsWith("Prospect"));

    const key = sortSelected[0] ?? "priority";
    const sorted = [...list];
    if (key === "priority")
      sorted.sort((a, b) => (PRIORITY_RANK[a.lead_priority] ?? 9) - (PRIORITY_RANK[b.lead_priority] ?? 9) || a.demo_order - b.demo_order);
    else if (key === "health") sorted.sort((a, b) => b.health.score - a.health.score);
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [all, scope, prioritySelected, tierSelected, relationshipSelected, categorySelected, searchQuery, sortSelected, agentFilter]);

  const metrics = useMemo(
    () => [
      { label: "Customers", value: String(rows.length), icon: "Users" },
      { label: "High Priority", value: String(rows.filter((c) => c.lead_priority === "High").length), icon: "Flag" },
      { label: "Medium Priority", value: String(rows.filter((c) => c.lead_priority === "Medium").length), icon: "SlidersHorizontal" },
      { label: "Requests & Applications", value: String(rows.reduce((n, c) => n + c.requests.length, 0)), icon: "FileClock" },
    ],
    [rows]
  );

  // Demo: asking the agent to filter the book actually filters the table once the
  // answer has played. The figures quoted are the ones on screen.
  const scopedRows = scope === "my" ? all.filter(c => c.relationship_owner === MY_RM) : all;
  const attentionCount = scopedRows.filter(c => c.health.score < 70).length;
  const prospectCount = scopedRows.filter(c => c.relationship.startsWith("Prospect")).length;

  const agentStarters = [
    {
      label: "Filter my book to customers who need attention",
      action: "needs-attention",
      trail: {
        label: "Filtered the customer book",
        runningLabel: "Filtering the customer book",
        steps: [
          { text: `Read ${scopedRows.length} customers in this view` },
          { text: "Checked the financial-health band on each" },
          { text: `Applied filter — health below 70 · ${attentionCount} match` },
        ],
      },
      reply: `**${attentionCount} of ${scopedRows.length} customers are below a financial-health score of 70.** The table is filtered to them.\n\n${scopedRows
        .filter(c => c.health.score < 70)
        .sort((a, b) => a.health.score - b.health.score)
        .map(c => `- **${c.name}** — ${c.health.score}/100 (${c.health.band}). ${c.health.drivers[0]}.`)
        .join("\n")}\n\nClear the **Agent** chip in the filter row to see the full book again.`,
    },
    {
      label: "Show only the prospects in my book",
      action: "prospects",
      trail: {
        label: "Filtered the customer book",
        runningLabel: "Filtering the customer book",
        steps: [
          { text: `Read ${scopedRows.length} customers in this view` },
          { text: "Split existing relationships from prospects" },
          { text: `Applied filter — Prospect · NTB · ${prospectCount} match` },
        ],
      },
      reply: `**${prospectCount} of ${scopedRows.length} are prospects rather than existing customers.** The table is filtered to them.\n\n${scopedRows
        .filter(c => c.relationship.startsWith("Prospect"))
        .map(c => `- **${c.name}** — ${c.opportunity.title}. ${c.opportunity.reason}.`)
        .join("\n")}\n\nNeither holds a product with us yet, so both are acquisition conversations.`,
    },
  ];

  const applyAgentFilter = (action: string) => {
    const applied =
      action === "needs-attention"
        ? { id: action, label: "Health below 70", search: "Financial health below 70" }
        : action === "prospects"
        ? { id: action, label: "Prospects only", search: "Relationship is Prospect · NTB" }
        : null;
    if (!applied) return;
    setAgentFilter({ id: applied.id, label: applied.label });
  };


  const columns: Column[] = [
    {
      key: "lead_priority",
      header: "Lead Priority",
      // The first two columns are frozen; CustomTableView derives each sticky column's
      // left offset from minWidth, so these must be explicit px and match the width —
      // otherwise the third column scrolls underneath them.
      width: "130px",
      minWidth: "130px",
      render: (v: string) => <BubbleTag text={priorityLabel(v)} color={priorityColor(v)} withBorder={true} />,
    },
    { key: "customer_id", header: "Customer ID", width: "130px", minWidth: "130px" },
    {
      key: "name",
      header: "Customer",
      width: "14%",
      minWidth: "190px",
      render: (v: string, row: Record<string, any>) => (
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-blue-600">{v}</span>
            <span className="mt-0.5 block text-xs text-gray-500">{row.profile}</span>
          </div>
          {/* Row actions. stopPropagation so opening the menu doesn't also open the
              customer workspace via the row click. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                aria-label={`Actions for ${v}`}
                className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-gray-400 opacity-60 transition hover:bg-gray-100 hover:text-gray-700 hover:opacity-100"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => onRowAction?.(row, "interaction")}>
                <MessageSquareText className="size-4" />
                Log Interaction
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onRowAction?.(row, "followup")}>
                <CalendarClock className="size-4" />
                Schedule Follow-up
              </DropdownMenuItem>
              {scope === "team" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onRowAction?.(row, "reassign")}>
                    <ContactRound className="size-4" />
                    Reassign
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "10%",
      minWidth: "124px",
      render: (v: string) => <BubbleTag text={v} color={categoryColor(v)} withBorder={true} fixedWidth="w-[88px]" />,
    },
    { key: "location", header: "Location", width: "9%", minWidth: "128px" },
    {
      key: "relationship",
      header: "Relationship",
      width: "10%",
      minWidth: "128px",
      render: (v: string) => <BubbleTag text={v} color="gray" withBorder={true} />,
    },
    {
      key: "tier",
      header: "Tier",
      width: "9%",
      minWidth: "118px",
      render: (v: string) =>
        v === "Untiered"
          ? <span className="text-gray-400">-</span>
          : <BubbleTag text={v} color={tierColor(v)} withBorder={true} fixedWidth="w-[88px]" />,
    },
    {
      key: "health",
      header: "Financial Health",
      width: "11%",
      minWidth: "142px",
      render: (h: any) => <BubbleTag text={`${h.score}/100 · ${h.band}`} color={healthColor(h.band)} withBorder={true} />,
    },
    {
      key: "opportunity",
      header: "AI Recommendation",
      width: "18%",
      minWidth: "250px",
      render: (o: any) => (
        <div className="min-w-0">
          <span className="mb-1 inline-block">
            <BubbleTag text={o.objective} color="blue" withBorder={true} />
          </span>
          <span className="block font-semibold text-blue-600">{o.title}</span>
          <span className="mt-0.5 block text-xs text-gray-500">{o.reason}</span>
        </div>
      ),
    },
    // Team view only: who the customer belongs to, editable in place.
    ...(scope === "team"
      ? [{
          key: "assignee",
          header: "Relationship Manager",
          width: "11%",
          minWidth: "148px",
          render: (_v: any, row: Record<string, any>) => (
            <div onClick={e => e.stopPropagation()}>
              <Select
                value={assigned(row.customer_id)}
                onValueChange={value => setDraftAssignees(prev => ({ ...prev, [row.customer_id]: value }))}
              >
                <SelectTrigger className="h-9 w-full border-transparent bg-gray-100 text-sm text-gray-800 shadow-none hover:bg-gray-200 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {RM_ROSTER.map(rm => <SelectItem key={rm} value={rm}>{rm}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ),
        } as Column]
      : []),
  ];

  const TABS: { id: Scope; label: string; count: number }[] = [
    { id: "my", label: "My Customers", count: myCount },
    { id: "team", label: "Team Customers", count: all.length },
  ];

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Toast message={toast} onDone={() => setToast(null)} />

      {/* Tab bar — pinned to the very top of the content card (cam-ui pattern). */}
      <div className="flex shrink-0 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={scope === t.id}
            onClick={() => setScope(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-center text-sm font-medium transition-colors",
              scope === t.id ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Standard shape: header → filters → key metrics → table */}
      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto px-6 pb-10 pt-5">
        {/* Page header — All Appraisals header tokens (blue icon + blue title), with the
            subtext sitting below the title and ABOVE the underline. */}
        <div className="w-full border-b border-gray-200 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <LayoutGrid className="h-5 w-5 flex-shrink-0 text-blue-700" />
            <span className="truncate text-lg font-semibold text-blue-700">Workspace</span>
            {/* Reassigning a customer turns on edit mode; nothing is committed until Save. */}
            {isEditing && (
              <span className="ml-auto flex shrink-0 items-center gap-2">
                <span className="text-xs text-gray-500">
                  {dirtyIds.length} unsaved change{dirtyIds.length === 1 ? "" : "s"}
                </span>
                <Button variant="outline" className="h-9 border-gray-300 px-3 font-semibold text-gray-600" onClick={() => setDraftAssignees({})}>
                  Cancel
                </Button>
                <Button className="h-9 bg-blue-600 px-3 font-semibold text-white hover:bg-blue-700" onClick={saveAssignees}>
                  Save
                </Button>
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Review customer priorities, open requests and AI recommendations across your book.
          </p>
        </div>

        <div className="pt-4">
          <CustomListFilter
            filterGroups={filterGroups}
            filterState={filterState}
            setFilterState={setFilterState}
            showFilterToggle={false}
          />
        </div>

        <div className="pt-6">
          <KeyMetrics
            hardcodedMetrics={metrics}
            isMetricsExpanded={isMetricsExpanded}
            setIsMetricsExpanded={setIsMetricsExpanded}
            showHeader={false}
            gridCols={4}
          />
        </div>

        <div className="min-w-0 overflow-x-auto">
          {/* The table is laid out wider than the card so the columns get real room:
              it scrolls sideways while Lead Priority and Customer ID stay pinned.
              CustomTableView renders the table at width:100% with a fixed layout, so
              the floor has to be set on the table element itself. */}
          <CustomTableView
            columns={columns}
            data={rows}
            className={cn("w-full", scope === "team" ? "[&_table]:min-w-[1500px]" : "[&_table]:min-w-[1360px]")}
            initialRowLimit={10}
            onRowClick={(row) => onOpenCustomer?.(row)}
          />
        </div>
      </div>
      </div>

      {agentOpen && (
        <ModusAgentPanel
          customerName={scope === "my" ? "your book" : "the team book"}
          healthScore={Math.round(scopedRows.reduce((n, c) => n + c.health.score, 0) / Math.max(scopedRows.length, 1))}
          healthBand="Good"
          openMatters={scopedRows.reduce((n, c) => n + c.requests.length, 0)}
          extraSuggestions={agentStarters}
          onAction={applyAgentFilter}
          onClose={() => setAgentOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomersScreen;
