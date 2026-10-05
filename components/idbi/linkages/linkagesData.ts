/**
 * Fixture-backed stand-in for `customerService`, for the Linkages tab.
 *
 * Mirrors the real signatures in `app/services/customerServices.ts` so the tab
 * itself is unchanged apart from which module it imports.
 *
 * ⚠️ DEMO-SHORTCUT / PRODUCTION-BLOCKER — raise before any real build.
 * Lookups are keyed on whatever the tab passes as `customerId`, which today is
 * the customer's NAME (activeContext carries a name, not a CID — see IdbiApp.tsx).
 * The fixture therefore stores every record under both name and CID. Real data
 * must key on CID only: names are not unique, and two customers sharing a name
 * would resolve to one another's graph.
 */

// Cache-bust: the browser will otherwise serve a stale copy of the fixture
// from its HTTP cache and no amount of regenerating the file will show up.
const FIXTURE_VERSION = 5;
const FIXTURE_URL = `/idbi-data/linkages.json?v=${FIXTURE_VERSION}`;

let fixturePromise: Promise<Record<string, any>> | null = null;

const loadFixture = (): Promise<Record<string, any>> => {
  if (!fixturePromise) {
    fixturePromise = fetch(FIXTURE_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`fixture ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        fixturePromise = null;   // let a later call retry
        console.error('[linkagesData] failed to load linkages fixture:', err);
        return {};
      });
  }
  return fixturePromise;
};

const pick = async (key: string): Promise<any> => {
  const data = await loadFixture();
  return data[key] ?? null;
};

/** Trim and collapse whitespace so " Vandana  Singh " still resolves. */
const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ');

export const linkagesService = {
  getNeptuneLinkages: async (
    customerId: string,
    degree: number,
    _isStrongConnector: boolean,
    _prevDegreeNodeIds: string[] = [],
    _limitPerNodeTraversals = 20,
    _nodeExclusionList: string[] = [],
  ) => {
    const d = Math.max(0, Math.min(6, Number(degree) || 0));
    return pick(`graph__${norm(customerId)}__${d}`);
  },

  getCustomerOverview: async (customerId: string, _force = false) =>
    pick(`overview__${norm(customerId)}`),

  getCustomerLoans: async (customerId: string, _force = false) =>
    pick(`loans__${norm(customerId)}`),

  getLoansNetworkMetrics: async (
    customerId: string,
    _degree?: number,
    _connectedIds?: string[],
    _strongConnector?: boolean,
  ) => pick(`metrics__${norm(customerId)}`),

  // Adjacency is already present in the per-degree payloads; nothing to expand.
  getNeptuneAdjacentNodes: async (_nodeId: string) => null,

  // Graph mutations are meaningless against a fixture. Acknowledge so the
  // buttons stay wired, without pretending a write happened.
  deleteNodeWithEdges: async (_nodeId: string) => ({ status: 'success' }),
  blacklistNode: async (_nodeId: string) => ({ status: 'success' }),
};
