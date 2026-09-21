# TARC Limited — short-circuited PEER_COMPARISON rerun output

Company: **TARC LIMITED**
CIN: `L70100DL2016PLC390526` | PAN: `AAOCA7650B` | Website: https://www.tarc.in/
Not yet onboarded as a `ListingCompanies`/`OfferingDetails` row in either the dev DB or the
`drhp-api.modussecure.com` production system, so the real `PEER_COMPARISON` rerun endpoint
(`rerun_particular_service.py` / `peer_comparison_service.handle_peer_comparison`) can't be invoked
end-to-end (it needs a `document_id`/`offering_id`). Instead, each downstream section's real
service-layer function/formula was replayed directly against **live data** pulled from the local
insolvency-backend (`localhost:8001`, Probe/MCA data) and the dev Postgres DB, so the JSON shape and
values match what the UI would actually render once TARC is onboarded.

## Peer selection
Screened same-basic-industry (`IN020501001`, "Residential, Commercial Projects") listed companies from
`ipo.company_industry_financials` by sales-closeness to TARC (₹132.96 Cr), then picked the 2 most
business-comparable:
- **MODI'S NAVNIRMAN LIMITED** (`sales_closest`) — sales ₹133.31 Cr, nearly identical to TARC.
- **SURATWWALA BUSINESS GROUP LIMITED** (`assets_closest`) — total assets ₹215.65 Cr, closest asset match.

Both peers' merchant records did not exist in the local Probe DB, so `POST
/api/v1/probe-data/refresh-merchant` was called for each CIN (per user confirmation) — the same call the
real pipeline makes after peer selection — pulling real financials/RPT from the live Probe42-backed
service into the dev DB.

## File → section → sourcing

| File | UI section | Source |
|---|---|---|
| `peer_identification.json` | Peer Identification | Real CIF sales/assets; reasoning text authored by hand (would normally be Gemini output) grounded in TARC's real business description from `probe_merchant.description` |
| `industry_identification.json` | Industry Identification | Same reasoning text, in the `PeerComparision.reasoning` shape |
| `industry_mapping_nse.json` | Industry Mapping (NSE) | Real lookup against `app/assets/nse_industry_classification_structure.csv` for exact_code `IN020501001` + a chosen similar_code `INO20501002` |
| `industry_mapping_mca.json` | Industry Mapping (MCA) | Live `probe_industry_segments` for TARC's CIN (`Real Estate` / `Builders and Developers`) |
| `listed_peers.json` | Listed Peers | Real rows from `ipo.company_industry_financials` for the 2 selected peers (NSE codes `MODIS`, `SBGLP`) |
| `peers_mca.json` | Peers Identified as per MCA Data | Live `probe_peer_comparison` for TARC's CIN — 4 unlisted MCA-registered same-segment companies, straight from Probe |
| `metrics.json` | Metrics | Computed with the actual `compute_metrics_for_years` + `build_supplemental` functions from `peer_comparison_metrics_service.py`, fed live probe data for all 3 companies (115 metrics × up to 9 years each) |
| `financial_statements.json` | Financial Statements | Built with the actual `_classify_fields` logic from `company_financial_statements`, fed live `probe_financials` rows for all 3 companies (5 years, STANDALONE + CONSOLIDATED) |
| `related_party_transactions.json` | Related Party Transactions | Built with the actual `_aggregate_rpt_from_response` logic, fed live RPT rows (company/LLP/individual/other) for all 3 companies |

## Known gaps / things I couldn't verify live
- `/api/v1/metrics/by-cin/{cin}` and `/api/v1/metrics/calculate-metrics` on the insolvency-backend need a
  JWT (not just the static API key) — used the in-repo pure calculation functions instead, which produced
  fuller and more consistent output anyway.
- A live curl to `drhp-api.modussecure.com` (prod, admin JWT) confirmed TARC has no company/listing record
  there yet — didn't create one since that's a write to a shared prod system.
- No document/DRHP exists for TARC (it's already listed), so `reasoning`/`industry_identification` text is
  my own analysis grounded in TARC's real Probe business description, not an actual Gemini call.
