/**
 * Fixture-backed stand-in for the customer-underwriting `customerService`.
 *
 * Portfolio Signals runs on captured synthetic data rather than the live API:
 * the brief requires the dataset to be edited (Vandana Singh added, short
 * community IDs, Financial Health bands), so it cannot come off the wire.
 *
 * Signatures mirror `app/services/customerServices.ts` exactly, and each method
 * unwraps the `{ status, data }` envelope the way the real client does, so the
 * tab is unchanged apart from which module it imports.
 *
 * The fixture is ~4MB, so it is fetched from /public at runtime rather than
 * `import`ed -- importing it would inline the whole thing into the client
 * bundle. One in-flight promise is shared across every caller.
 */

const FIXTURE_VERSION = 2;
const FIXTURE_URL = `/idbi-data/mis-portfolio.json?v=${FIXTURE_VERSION}`;

let fixturePromise: Promise<Record<string, any>> | null = null;

const loadFixture = (): Promise<Record<string, any>> => {
  if (!fixturePromise) {
    fixturePromise = fetch(FIXTURE_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`fixture ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        // Let a later call retry rather than caching the failure forever.
        fixturePromise = null;
        console.error('[misData] failed to load portfolio fixture:', err);
        return {};
      });
  }
  return fixturePromise;
};

/** Unwrap a captured response; undefined keys return null like a 404 would. */
const pick = async (key: string): Promise<any> => {
  const data = await loadFixture();
  const entry = data[key];
  if (!entry) return null;
  return entry.data ?? entry;
};

const resolve = <T,>(value: T | Promise<T>): Promise<T> => Promise.resolve(value);

export const misService = {
  getHighLevelStats: async (_force = false) => resolve(pick('high_level')),

  getRiskDistribution: async (_force = false) => resolve(pick('risk_distribution')),

  /** Same book, regrouped by Financial Health band (brief item 4). */
  getRiskDistributionByHealth: async (_force = false) => resolve(pick('risk_distribution_by_health')),

  getLinkageStatsGraph: async (_force = false) => resolve(pick('linkage_stats_graph')),

  getLinkageStats: async (connectorType: string, _force = false) =>
    resolve(pick(`linkage_stats__${connectorType}`)),

  getLinkageMetricsV2: async (connectorType: string, linkageCategory: string, _force = false) =>
    resolve(pick(`linkage_metrics__${connectorType}__${linkageCategory}`)),

  getLinkageListV2: async (
    connectorType: string,
    linkageCategory: string,
    page = 1,
    limit = 100,
    _force = false,
    userid?: string,
    name?: string,
  ) => {
    const base = await pick(`linkage_list__${connectorType}__${linkageCategory}`);
    if (!base || !Array.isArray(base.data)) return resolve(base);

    // The live endpoint filters server-side; do the same here so the Top
    // Exposure search box keeps working against the fixture.
    let rows = base.data;
    if (userid) {
      rows = rows.filter((r: any) => String(r.userid) === String(userid));
    }
    if (name) {
      const needle = name.toLowerCase();
      rows = rows.filter((r: any) => String(r.name ?? '').toLowerCase().includes(needle));
    }
    if (rows === base.data) return resolve(base);

    return resolve({ ...base, data: rows, total_count: rows.length, total_pages: 1, page: 1 });
  },

  getLinkageArtifacts: async (
    _customerId: string,
    _connectorType: string,
    linkageType: string,
    _page = 1,
    _limit = 100,
    _force = false,
  ) => resolve(pick(`linkage_artifacts__${linkageType}`)),

  getCentralityStats: async (connectorType: string, _force = false) =>
    resolve(pick(`centrality_stats__${connectorType}`)),

  getCentralityDetails: async (
    connectorType: string,
    centralityTier: string,
    _nodeType: string,
    _page = 1,
    _limit = 100,
    _force = false,
  ) => resolve(pick(`centrality_details__${connectorType}__${centralityTier}`)),

  getCommunityStats: async (communitySize: string, _connectorType: string, _force = false) =>
    resolve(pick(`community_stats__${communitySize}`)),

  getCommunityDetails: async (
    communitySize: string,
    _connectorType: string,
    _page = 1,
    _limit = 100,
    _force = false,
  ) => resolve(pick(`community_details__${communitySize}`)),

  getCommunityArtifacts: async (_communityId: string, _page = 1, _limit = 100, _force = false) =>
    resolve(pick('community_artifacts__sample')),

  getRecencyStats: async (timeFrame: string, _force = false) =>
    resolve(pick(`recency_stats__${timeFrame}`)),

  getRecencyDetails: async (timeFrame: string, _page = 1, _limit = 20, _force = false) =>
    resolve(pick(`recency_details__${timeFrame}`)),

  // Graph mutations have no meaning against a fixture; acknowledge and no-op so
  // the buttons stay wired without pretending a write happened.
  deleteNodeWithEdges: async (_nodeId: string) => resolve({ status: 'success' }),
  blacklistNode: async (_nodeId: string) => resolve({ status: 'success' }),
};
