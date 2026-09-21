# modus-ui Rebuild Checklist

Goal: replicate EVERY section/behavior of the product-leader UI
(`/Users/ananya/Desktop/work/modus/idbi-hackathon-ui/ui`) faithfully, on the
insolvency stack, using cam-ui for the agent + sidebar richness.
Data files are BYTE-IDENTICAL between the two repos — the tabs already have all data.
Verify each item with a screenshot before marking [x]. Never claim done unverified.

Strategy (decided):
- Port the product-leader's `workspace-ui.tsx` primitives → `components/idbi/workspace-ui.tsx`
  (MetricCard w/ secondary+tones, InsightBox = AI insight, SectionHeader, StatusPill,
  CompactTable/Th/Td, RepaymentStrip, InfoTip→real tooltip). No reference equivalents exist for these.
- Keep reference comps already approved: agent (cam), Customers page (page header/tabs/filters).
- Charts via recharts (installed). Sheets/Dialogs via ui/sheet, ui/dialog. Tooltips via ui/tooltip.
- Adapt `<Button>`/`<Select>` usages: modus-ui button default is fixed-width — use explicit sizing.
- Cash-flow breakdown = SegmentedToggle view (NOT collapsible), per user.

Legend: [ ] todo · [~] wip · [x] done+verified

---

## Shared
- [x] S1. Port `workspace-ui.tsx` primitives (with real tooltip for InfoTip)
- [x] S2. Sidebar collapse/expand toggle from cam ui (img #132)
- [x] S3. Workspace tab bar styling to match wrong-ui (img #133)
- [x] S4. Wire CustomerWorkspace props: onOpenAgent(prompt), onOpenActivity, onOpenFinancial, requestedAction/onActionConsumed; agent accepts a seeded prompt

## Customer Profile tab (8 sections — currently only 2 thin ones)
- [x] P1. Contact details — 3 cards (Mobile, Email, Reference Contact)
- [x] P2. Recommended Opportunities — primary blue card (tags/title/trigger/actions + why-now/blocker/next grid) + 2 secondary cards
- [x] P3. About Customer — AI-generated summary bullets + "View sources" → Dialog
- [x] P4. Customer Snapshot — MetricCards w/ secondary
- [x] P5. CIBIL Score Trend — big 766 + LineChart
- [x] P6. Financial Health Score — banded LineChart + 3M/6M/12M toggle + custom tooltip
- [x] P7. Financial Health Analysis — 81 + drivers grid + Portfolio percentile + histogram BarChart + cohort select
- [x] P8. Relationship with IDBI — 4 metrics + Accounts table + Loans table (RepaymentStrip) + Credit Cards note
- [x] P9. Sources Dialog

## Financial Position tab (5 sections — currently 4 thin, no insights/secondary)
- [x] F1. Income & Spending — insight box; 5 metrics w/ secondary+tones; scope+period controls; main table (income/spending bar viz, net, closing, bounces); **Cash-flow breakdown as TOGGLE view** (2nd table)
- [x] F2. Employment & Business Associations — green banner + table (MISSING entirely now)
- [x] F3. Borrowings & Cards — insight; 4 metrics; loans table; Credit Cards panel w/ "Check with Modus Agent"
- [x] F4. Savings & Investments — insight; 4 metrics; allocation bar+legend; allocation table w/ View → holdings Sheet
- [x] F5. Assets & Collateral — insight; segmented toggle Assets/Open/Satisfied; tables w/ expandable charge rows
- [x] F6. Holdings side Sheet

## Requests & Activity tab (3 sections — currently 2 thin)
- [x] R1. Quick Actions — 4 buttons + composer form (create interaction/ticket/opportunity/followup) + saved toast
- [x] R2. Relationship Highlights — 4 clickable metric cards
- [x] R3. Unified Relationship Feed — all/open toggle + search + type select + rich table (sticky details col) + detail Sheet (timeline)

## Done earlier (keep)
- [x] Agent from cam ref; agent fixed/sticky; Customers page header+tabs+filters; labeled filters; assets clip fix; bottom padding

## Notes
- Study cam appraisal tab for richness/tooltips (user note 2026-09-20).

## D. Feedback round 2 (2026-09-20, during port)
- [x] D1. Income & Spending FIRST table must keep the **"Income vs Spending"** column (bar viz). (was dropped in my thin version; port restores it — VERIFY)
- [ ] D2. Customer Profile GRAPHS: build them referencing insolvency-ui chart components (not just raw recharts) for consistent styling.
- [x] D3. Financial Health Analysis section → adopt the **Probability-of-Default-Analysis design language** (img #137): colors change with the number/signal, arrow-segmented breakdown bars, risk-segmentation colored legend, distribution histogram with active bar colored. Source: insolvency/cam PD analysis component.
- [x] D4. **Sidebar collapse/expand toggle** — STILL missing after 3 asks. Get pattern from cam/ui repos. DO FIRST.
