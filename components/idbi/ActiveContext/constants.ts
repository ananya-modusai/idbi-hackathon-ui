import { ActiveContextKey } from "./types";

export type ContextGroupMapping = Record<
  ActiveContextKey,
  {
    group: string;
    defaultText: string;
    defaultPreText: string;
  }
>;

// How each registered context reads in the topbar pill: the sidebar group it belongs
// to, the prefix, and the text shown when nothing is selected. See types.ts.
export const contextGroupMapping: ContextGroupMapping = {
  customer: {
    group: 'Relationship Management',
    defaultText: 'None',
    defaultPreText: 'Active Customer: ',
  },
};
