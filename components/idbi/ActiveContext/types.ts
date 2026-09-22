// The context types the IDBI workspace registers with the ActiveContext widget.
//
// This is the cam-ui widget (generic store + palette), kept separate from the
// boilerplate's app/layout/ActiveContext, which is wired to the donor project's
// merchant/chargeback/investigation stores.
//
// A context is registered in three places and nothing else needs to change:
//   1. contextGroupMapping      (constants.ts)        — how it reads in the topbar
//   2. contextNavigationMapping (useActiveContext.ts) — where selecting it lands you
//   3. commandGroups            (ActiveContext.tsx)   — what the palette lists
export type ActiveContextKey = string;

export type ActiveContextType = Partial<Record<ActiveContextKey, string | null>>;
