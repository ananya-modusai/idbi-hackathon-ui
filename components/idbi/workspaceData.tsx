"use client";

import * as React from "react";
import vandana from "@/app/idbi-data/vandana-workspace.json";
import others from "@/app/idbi-data/customer-workspaces.json";

type Workspace = typeof vandana;

/**
 * One workspace per customer. Vandana carries the full fixture; the rest carry their
 * own profile, assessment and events. Sections a customer has no data for are absent
 * rather than inherited, so a tab can say so instead of showing someone else's numbers.
 */
const WORKSPACES: Record<string, any> = {
  [vandana.customer.id]: vandana,
  ...(others as Record<string, any>),
};

export function workspaceFor(customerId?: string): Workspace {
  return (customerId && WORKSPACES[customerId]) || (vandana as Workspace);
}

const WorkspaceContext = React.createContext<Workspace>(vandana as Workspace);

export function WorkspaceDataProvider({ customerId, children }: { customerId?: string; children: React.ReactNode }) {
  const value = React.useMemo(() => workspaceFor(customerId), [customerId]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/** The workspace of the customer currently open. */
export function useWorkspaceData(): Workspace {
  return React.useContext(WorkspaceContext);
}
