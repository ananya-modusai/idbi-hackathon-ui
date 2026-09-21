// Static data overrides for merchant TARC LIMITED (Kotak Bank org).
//
// These endpoints are served from a frozen JSON snapshot (app/data/staticSnapshots/tarc/)
// instead of hitting the live backend, so the Overview / Financial & Operational /
// Ratio Analysis / External Insights tabs render consistent demo data without depending
// on the live investigation/insolvency pipelines. Auth endpoints are untouched — this
// module is only consulted for data requests, never for /token, /login-otp, etc.
//
// To restore live data for these endpoints, delete the matching rule below (or the
// whole file and its import in axios.ts).

import watchlist from '@/app/data/staticSnapshots/tarc/watchlist.json';
import merchantsList from '@/app/data/staticSnapshots/tarc/merchants-list.json';
import industryRiskSegment from '@/app/data/staticSnapshots/tarc/industry-risk-segment.json';
import financialMetrics from '@/app/data/staticSnapshots/tarc/financial-metrics.json';
import displayMetricsByYear from '@/app/data/staticSnapshots/tarc/display-metrics-by-year.json';
import externalData from '@/app/data/staticSnapshots/tarc/external-data.json';
import auditDisclosures from '@/app/data/staticSnapshots/tarc/audit-disclosures.json';
import annualReportInsights from '@/app/data/staticSnapshots/tarc/annual-report-insights.json';
import versions from '@/app/data/staticSnapshots/tarc/versions.json';
import redFlags from '@/app/data/staticSnapshots/tarc/red-flags.json';
import companyMetrics from '@/app/data/staticSnapshots/tarc/company-metrics.json';
import aboutTheCompany from '@/app/data/staticSnapshots/tarc/about-the-company.json';
import financialsTable from '@/app/data/staticSnapshots/tarc/financials-table.json';
import transactionMetrics from '@/app/data/staticSnapshots/tarc/transaction-metrics.json';
import riskMetrics from '@/app/data/staticSnapshots/tarc/risk-metrics.json';

export const TARC_MERCHANT_ID = 'd4efc32f-9fcc-4cfc-8e60-eff421acf83d';
export const KOTAK_ORG_ID = '1adb2b9c-ad19-4adf-8fde-c5405d7ea9b9';

interface StaticRule {
  method: 'GET' | 'POST';
  matches: (url: string, payload: any) => boolean;
  data: unknown;
}

const rules: StaticRule[] = [
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/watchlist/${KOTAK_ORG_ID}`,
    data: watchlist,
  },
  {
    method: 'GET',
    matches: (url) => url === '/api/v1/users/merchants',
    data: merchantsList,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/merchants/${TARC_MERCHANT_ID}/industry-risk-segment`,
    data: industryRiskSegment,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/merchants/${TARC_MERCHANT_ID}/financial-metrics`,
    data: financialMetrics,
  },
  {
    method: 'GET',
    matches: (url, params) => url === '/api/v1/metrics/display-metrics-by-year' && (!params?.merchant_id || params.merchant_id === TARC_MERCHANT_ID),
    data: displayMetricsByYear,
  },
  {
    method: 'POST',
    matches: (url, body) => url === '/api/v1/credit-insolvency/getExternalData' && (!body?.merchant_id || body.merchant_id === TARC_MERCHANT_ID),
    data: externalData,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/credit-insolvency/${TARC_MERCHANT_ID}/getAuditDisclosures`,
    data: auditDisclosures,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/credit-insolvency/${TARC_MERCHANT_ID}/getAnnualReportInsights`,
    data: annualReportInsights,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/credit-insolvency/${TARC_MERCHANT_ID}/versions`,
    data: versions,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/merchant-red-flags/merchant/${TARC_MERCHANT_ID}`,
    data: redFlags,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/credit-insolvency/${TARC_MERCHANT_ID}/getCompanyMetrics`,
    data: companyMetrics,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/credit-insolvency/${TARC_MERCHANT_ID}/aboutTheCompany`,
    data: aboutTheCompany,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/credit-insolvency/${TARC_MERCHANT_ID}/financialsTable`,
    data: financialsTable,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/merchants/${TARC_MERCHANT_ID}/transaction-metrics`,
    data: transactionMetrics,
  },
  {
    method: 'GET',
    matches: (url) => url === `/api/v1/credit-insolvency/${TARC_MERCHANT_ID}/getRiskMetrics`,
    data: riskMetrics,
  },
];

/**
 * Returns the static snapshot for a request, or undefined if it should hit the live API.
 * `payload` is the query params for GET requests, or the request body for POST requests.
 */
export function matchStaticData(method: string, url: string | undefined, payload?: any): unknown {
  if (!url) return undefined;
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod !== 'GET' && normalizedMethod !== 'POST') return undefined;

  for (const rule of rules) {
    if (rule.method !== normalizedMethod) continue;
    if (rule.matches(url, payload)) return rule.data;
  }
  return undefined;
}
