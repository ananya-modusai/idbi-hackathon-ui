# TODO — every UI change the user has asked for

Compiled from the full conversation. This is the authoritative list. The rule for ALL of it:
**the product-leader "wrong ui" (`idbi-hackathon-ui/ui`) defines WHAT to build; cam-ui and
insolvency-ui define HOW (which components/patterns). Never dump the wrong-ui's own styling.**
insolvency-ui `kotak` = design source of truth. axis-cam-ui = agent + sidebar reference.
Verify every change with a screenshot before calling it done. Never claim done unverified.

Status: [ ] open · [~] partial · [x] done+verified · [!] DONE WRONG, must redo

---

## 0. Process rules — STANDING RULES, always apply (not tickable tasks)
- • Study the wrong-ui to learn WHAT (sections, content, behaviours) — replicate ALL of it, never a thinner version.
- • For HOW, use the component/pattern that already exists in cam-ui or insolvency-ui. Do NOT invent lookalikes. Do NOT copy the wrong-ui's bespoke styling.
- • Reuse existing design-system components; search first, ask before creating a new element.
- • Replicate ALL behaviours — buttons, tabs, click actions — not just static screens.
- • Study the cam-ui **Appraisal tab** for richness (tooltips, density).
- • Verify with a headless screenshot before reporting; never claim broken/incomplete work is done.

## 1. Global design language — STANDING RULES, always apply
- [x] **Tab bars sit at the VERY TOP of the content page/card — above the page header, never below it.** Cam `WorkspaceTabBar` underline pattern: tabs `flex-1` (divide full width), label CENTRED, active = `border-b-2 border-blue-600 text-blue-600`, strip on a `border-b` container. APPLIES APPLICATION-WIDE to every tab bar (Customers My/Team tabs too).
- • Two header types only: PAGE header (title + subtitle allowed) vs SECTION header (blue `text-blue-700`, icon, **NO subtext**).
- [x] **NEVER show a sub-heading/subtext over a table** (img #145). Remove "Income, Spending & Surplus" + "₹ lakh · own-account transfers excluded" heading above the income table, and any similar sub-headers above tables. THIS IS BROKEN NOW.
- • KeyMetrics: only **4 per row**, the rest wrap; Show more / Hide toggle. Show-more must not hide the 5th silently.
- • Tables: use `CustomTableView` (widths sum to 100%) — the reference table, not bespoke.
- • Tags: `BubbleTag`.
- • Unbroken height chain (`flex-1 min-h-0` / `h-full`); grow-don't-push flex rules.
- • Enough bottom padding so the last section breathes (not stuck to the bottom).

## 2. Shell / Sidebar
- [x] Left nav (My Workspace / Customers / Team & Performance), modus ai wordmark, RM footer, topbar breadcrumb + demo-data chip + bell.
- [x] Sidebar collapse/expand **toggle** = cam's **PanelLeft** icon (img #141/#142), collapses to icon rail. (NOT chevrons.)

## 3. Customers list screen
- [x] PAGE header (title + subtitle) — NOT a section header.
- [x] Two tabs: My Customers / Team Customers (with counts).
- [x] Search + Priority filter + Sort row.
- [x] 4 KeyMetrics.
- [x] Table via CustomTableView; row click opens the customer workspace.

## 4. Customer Workspace (shell around the tabs)
- [x] Header: back, avatar, name, Customer ID + copy, profile badge, Financial Health pill, Opportunity + Modus Agent buttons.
- [x] Tab bar (Customer Profile / Financial Position / Requests & Activity) positioned on the section border.
- [x] Agent panel FIXED while content scrolls (its own scroll).
- [x] Agent panel must NOT be clipped / pushed off-screen (img #138). (content column min-w-0 + overflow-hidden)
- [x] Bottom breathing room.

## 5. Modus Agent panel
- [x] Rebuilt from the **cam-ui** ModusAgent reference (ModusMark, empty state, tinted user turns, left agent prose, rounded composer). NOT invented.
- [x] Opens with a seeded prompt from "Check with Modus Agent" actions.

## 6. Filters  — [!] WRONG NOW
- [x] Filter design fixed (CustomListFilter everywhere) (img #143). Income & Spending "ACCOUNT SCOPE / PERIOD" uses uppercase-label-on-top selects (`ControlSelect`). It must be the **labeled `SingleSelectFilter`** pattern (blue label to the LEFT + dropdown), the cam/insolvency filter — same as the Customers screen.
- [x] Filter design consistent everywhere — CustomListFilter is the single pattern (Customers, Income & Spending, Relationship Feed).

## 7. Toggles / segmented view controls — [!] CHECK
- [x] Toggle design fixed (reference SectionHeaderWithFlags toggle) (img #144: Monthly / Cash-flow breakdown). Must match the cam/insolvency toggle exactly (verify `ToggleTabs` render vs reference; fix sizing/style if off).
- [x] Table views switch via header toggle buttons (Monthly/Breakdown, Assets/Open/Satisfied, Accounts/Loans/Cards, All/Open).

## 8. Metric cards
- [x] One consistent metric-card design everywhere = insolvency **`StatCard`** look (icon-left in gray box, muted label, bold value) + **secondary line** (the lower descriptor text — img #135/#136). No per-section variants (img #139 Relationship Highlights fixed).

## 9. Customer Profile tab — replicate ALL sections
- [x] Contact details (Mobile / Email / Reference).
- [x] Recommended Opportunities (primary blue card + 2 secondary).
- [x] About Customer (AI summary + View sources dialog).
- [x] Customer Snapshot metrics (with secondary).
- [x] CIBIL Score Trend (big number + line chart).
- [x] Financial Health Score (banded line chart + 3M/6M/12M toggle).
- [x] Financial Health Analysis — **PD-analysis design language** (img #137): colours change with the number/signal; drivers band-coloured; portfolio percentile + distribution histogram with active bar coloured.
- [x] Relationship with IDBI (4 metrics + Accounts table + Loans table w/ 12-cycle repayment strip + Credit Cards note).
- [x] AI insight boxes wherever the wrong-ui has them. (verified: 4 in Financial Position, matching the source exactly; Profile/Activity have none in the source either)

## 10. Financial Position tab — replicate ALL sections
- [x] Income & Spending: insight box; 5 metrics w/ secondary; scope + period filters; first table with the **"Income vs Spending"** bar column (must NOT be dropped); **Cash-flow breakdown as a TOGGLE view** (2nd table), not a collapsible tile.
- [x] Employment & Business Associations (was missing entirely).
- [x] Borrowings & Cards (insight, 4 metrics, loans table, Credit Cards panel w/ "Check with Modus Agent").
- [x] Savings & Investments (insight, 4 metrics, allocation bar + legend, allocation table → holdings side sheet).
- [x] Assets & Collateral (insight, segmented toggle Assets/Open/Satisfied, expandable charge rows).
- [x] Removed the sub-heading over the income table (see 1).

## 11. Requests & Activity tab — replicate ALL sections
- [x] Quick Actions (4 buttons + composer form + saved confirmation).
- [x] Relationship Highlights (metric cards — consistent style).
- [x] Unified Relationship Feed (All/Open toggle + search + type filter + rich table + detail side sheet w/ timeline).

## 12. AI insight boxes
- [x] AI-insight callouts present with our InsightBox styling (img #134).

## 13. Charts
- [WONT] Charts stay on direct recharts. `ComboChart` is a fixed-colour bar/line ComposedChart with no gradient stroke, per-point colouring, value labels or reference lines — routing these through it would remove the red→green gradient, the per-point labels and the good-threshold line that were explicitly requested.

---

## Open right now (must redo / do)

## E. Feedback round 3 (2026-09-20)
- [x] E1. Clear Filters button → aligned RIGHT within the same filter row; whole filter group gets ~1rem margin-top.
- [x] E2. Modus Agent must NOT be open by default when opening a customer from the list.
- [x] E3. Move the Financial Health chip INTO the page header, next to the "Self-employed" chip. Faint coloured bg for ALL chips app-wide, except the black/white ones (e.g. Self-employed).
- [x] E4. The SECOND header (section header inside tabs) is too small — take the correct font size from cam ui (SectionHeaderWithFlags = text-lg font-semibold).
- [x] E5. Recommended Opportunities: remove "Top N for this customer"; put the "Run pre-check" + "Open enquiry" button combo in that header-right position (move them OUT of the card). All 3 opportunity cards stacked VERTICALLY (list can grow).
- [x] E6. About Customer: remove the "View sources" link/dialog from the card.
- [x] E7. CIBIL Score Trend: replace the flat line with (a) a GAUGE/meter like img #153 (300–900 band, coloured arc, score + band label), and (b) a GRADIENT line plot like img #154. Use REALISTIC credit history data (real trajectory, not near-flat). Period options via a DROPDOWN (history length varies per person, so options are dynamic).
- [x] E8. Financial Health Score section → rebuild like img #155: gradient score-over-time line with per-point value labels + event annotations, good-threshold reference line, 3M/6M/12M, and the summary row (Lowest / Highest / Recovery + "What moved the score?" drivers with +/- chips).
- [x] E9. Financial Health Analysis → take the design language from the insolvency **Probability of Default Analysis** section (img #156): tinted panel, big coloured headline value, score-breakdown sub-panel, segmented arrow breakdown bars with legends, thresholds, distribution histogram. GO THROUGH insolvency-ui for it.
- [x] E10. "Relationship with IDBI" shows 3 tables in ONE section → switch to right-side TOGGLE BUTTONS like the insolvency **Debt Analysis** section (img #158). Use SHORT toggle labels (current table headings are too long). **Also FIX the shared toggle component itself** so it's correct everywhere it's used.

## F. Feedback round 4 (2026-09-20)
- [x] F1. **REGRESSION — Customers table scroll broken.** I switched columns to px widths, so the table always overflows and gets clipped. Restore the original behaviour (2 frozen columns + horizontal scroll only when cramped) and fix the ORIGINAL bug — Customer column still hidden under the frozen pair when scrolled fully left — with correct sticky offsets/padding, NOT by disabling scroll.
- [x] F2. Gradient lines (BOTH CIBIL and Financial Health) must gradate red→amber→green: troughs red, crests green, interpolated between. Right now everything renders green. Colour must be relative to the visible range, not one flat band.
- [x] F3. Realistic data for BOTH scores: start ~690, rise, then dip, then partially recover (not a near-monotonic climb).
- [x] F4. CIBIL gauge animates 0 → score on scroll-into-view; charts fade+rise in via CSS (recharts own Area animation left the series unpainted, so it stays off).
- [x] F5. Rename section to "Financial Health Score **& History**"; show more diverse data (longer/more varied history so 3M/6M/12M all differ); replicate the graph style of img #163 (per-point value labels + month/event annotation callouts with dashed connectors).
- [x] F6. REMOVE the "Lowest score / Highest score / Net change + What moved the score?" summary row (img #164) — not required.
- [x] F7. Customer Snapshot: wrong icons for some metrics (e.g. CIBIL uses a credit-card icon; should be a gauge/meter). Fix the icon mapping per metric.
- [x] F8. The 1rem margin-top belongs on the **filter group**, not on the section header. Fix placement.
- [x] F9. Lead Priority values become "P1 · High", "P2 · Medium", "P3 · Low" (img #160).
- [x] F10. Relationship with IDBI (img #161): margin-top above the key metrics (they overlap the header underline); split "Product / Account" into **Product** and **Account No**; columns 2..second-last equally distributed and CENTRE aligned.
- [x] F11. Margin-top on every section from the second section onward.
- [x] F12. Restructure **Recommended Opportunities** to the layout of img #165 (take POSITIONING/text structure, not colours): icon + title + one-line subtitle, fit badge top-right, tag chips row, a 3-up stat strip (label + value), "Why now", "What you need to do"/"Next step", then the action buttons. Header carries a "Personalised for you" control + "View all opportunities →".
- [x] F13. **Financial Health Analysis — REDO PROPERLY.** I built it from the image instead of from the insolvency source as instructed; it must come from the insolvency PD component so it is graphically the same. THEN simplify it: the text, numbers and tooltips are confusing — make it comprehensible to a B.Com/BBA-level reader (plain words, fewer numbers, clear "what this means").
- [x] F14. Content directly under a section-header underline touches it everywhere (img #167). Fix systemically in SectionHeader, not per-section.

## G. Feedback round 5 (2026-09-20)
- [x] G1. Workspace header: remove the "+ Opportunity" button; make "Modus Agent" filled blue with white text.
- [x] G2. Opportunity stat strip (img #170): put the small label NEXT TO its icon on one line, label font = 90% of the bold value; stops "p.m." wrapping and fixes card vertical alignment.
- [x] G3. About Customer (img #171): move "AI-GENERATED SUMMARY" out of the card into a BubbleTag beside the section header.
- [x] G4. CIBIL chart (img #172): trajectory is fake (a small rise every single month). Make it realistic. ALSO the AREA FILL under the line must follow the same red→orange→green gradient, not flat green.
- [x] G5. Financial Health Score & History (img #173): replicate it — "Score over time" title + subtitle, per-point value labels, dashed connectors down to month/event annotation boxes, threshold line. Put 3M/6M/12M in a DROPDOWN as well.
- [x] G6. ONE chip/bubble-tag style site-wide: the rounded-rectangle-with-border used in the page header (img #174). Replace StatusPill and every other chip everywhere, tables included.
- [x] G7. Analysis arrow bar (img #176) must look like the insolvency one (img #175) — take it from there, don't invent.
- [x] G8. Dead space on the right under the colour chips (img #177): increase the green-bar graph height and add a band scale like img #178/#179.
- [x] G9. Relationship with IDBI toggles (img #180) → "Accounts & Products", "Loans & Credits", "Credit Cards".
- [x] G10. KeyMetrics Show more / Hide button is missing (img #181) — take it from cam ui. SITE-WIDE RULE: the AI-insight box always sits BELOW the metrics.
- [x] G11. AI insight box (img #182): reduce indentation, increase the "AI INSIGHT" label font size.
- [x] G12. "Income vs Spending" column (img #183): nudge content right so it doesn't hug the previous column.
- [x] G13. Same chip fix inside tables (img #184).
- [x] G14. Insight-box-below-metrics + indentation fix for ALL insight boxes in the Financial Position tab (img #185).
- [x] G15. Asset Allocation block (img #186): COMMENT IT OUT to hide — do not delete.

## H. Feedback round 6 (2026-09-21)
- [x] H1. Band scale must sit directly BELOW the "81 Good" number in the LEFT column (img #187) — not under the green bar chart. Fix the dead space it leaves at the bottom (img #188).
- [x] H2. The arrow-bar graph design is STILL unchanged — actually take it from the insolvency component.
- [x] H3. 3M/6M/12M: I added the dropdown but left the toggle in place. REMOVE the toggle, keep only the dropdown.
- [x] H4. Move "Financial Health Score & History" BELOW "Financial Health Analysis".
- [x] H5. Annotation callout text is truncated (img #189) — drop the text, the hover tooltip is enough.
- [x] H6. Status-column bubble tags wrong; move "Account No" and "Balance / Deposit Value" columns left a little and space them.
- [x] H7. Move the "Income vs Spending" column content right (asked repeatedly).
- [x] H8. Savings & Investments: fix "Details" column alignment; add gap between bubble tags (img #190).
- [x] H9. Unified Relationship Feed filters order: SEARCH (expands to fill) → Type → View. Same table: halve the Summary column width, give that width to the 1st and 3rd columns.
- [x] H10. MAJOR — Modus Agent must properly replicate cam-ui (img #192 ours vs #193 cam): header layout (mark + "Modus agent · <name>" + history/new-chat/close), message spacing, right-aligned user bubble with timestamp + retry/edit/copy actions, activity trail line ("Checked the case file ›"), streaming/typing response behaviour and animation, composer with attachment + source pickers.
- [x] H11. BUG found while verifying: charts scrolled past without intersecting stayed invisible (opacity 0) because the scroll-in reveal never fired. Added a fail-safe timeout + no-IntersectionObserver guard so a chart can never be left blank.

## I. Feedback round 7 (2026-09-21)
- [x] I1. Quick Actions composer (img #194): the "Short title" input is crushed to ~40px. Diagnose and improve the whole form (labels, field widths, sane textarea height, proper Cancel).
- [x] I2. Unified Relationship Feed: add an EDIT affordance — edit icon at the right of the detail header; clicking switches read-only content into edit mode (selects for status/type, textarea for prose).
- [x] I3. Quick Actions success message currently persists forever — replace with a toast notification.
- [x] I4. MAJOR nav change: add a "Customer" item in the sidebar BELOW "Customers". Opening a customer from the Customers list routes into that Customer space (which holds the 3 tabs). Opening "Customer" with nothing selected shows an empty state like img #195 but "Select a customer first", avatar icon, and the button routes to Customers.

## J. Feedback round 8 (2026-09-21)
- [x] J1. Arrow bar (ours #196 vs insolvency #197): segments only TOUCH at the tip, leaving notches/background showing (#198). Each following segment must have a concave left notch so the arrows INTERLOCK.
- [x] J2. Band scale: show all the boundary numbers (0/40/60/75/100), not just the ends (#199).
- [x] J3. Increase that graph height to 17.5rem.
- [x] J4. Financial health history: include the YEAR on the axis, and stop showing the month twice (#200 — annotation box repeats the axis tick).
- [x] J5. Agent ATTACH does nothing — cam's works. Port the real attachment behaviour (pick, validate, preview chips, remove, paste) from cam's chatAttachments service.
- [x] J6. Agent auto-scroll broken: in cam, sending from a scrolled-up position snaps to the new message and keeps following as the reply streams. Ours does not.
- [x] J7. The detail overlay opened by the eye icon in the Details column is wrong — cam does this as an ARTIFACT panel, not an overlay. Replicate the cam artifact behaviour.

## K. New delivery — 2 extra tabs (2026-09-21)
Source: `IDBI-RM-Workspace 2/ui`. New tabs: **AI Analysis** (financial-health-tab) and
**Metrics** (metrics-tab). Tab order becomes: Customer Profile · Requests & Activity ·
AI Analysis · Financial Position · Metrics. New data blocks: `metrics`, `financialHealthDetail`.
Mapping to components we ALREADY have (no dumping of their markup):
- AI Assessment Summary → our `InsightBox`
- Score + band scale → extract our existing band scale into `BandScale` and reuse
- 3 pillars → our `MetricCard`
- Applicability / group filters → our `SegmentedToggle`
- Driver + metric tables → our `CompactTable` / `Th` / `Td` / `StatusPill` / `InfoTip`
- Driver detail (a Sheet in theirs) → our `ArtifactPanel` (overlays were rejected)
- Capacity cards → our `MetricGrid`
- Metrics search → our `CustomListFilter`
- [x] K1. Merge `metrics` + `financialHealthDetail` into our workspace data
- [x] K2. Extract reusable `BandScale`
- [x] K3. Build AI Analysis tab from our components
- [x] K4. Build Metrics tab from our components
- [x] K5. Wire both tabs + new tab order into CustomerWorkspace

## Round L — topbar + band scale
- [x] L1. Topbar: replace the "Demo data · 19 Sep 2026" chip with cam's ActiveContext widget
      (ported to components/idbi/ActiveContext — own store, customer context, searchable
      palette of the whole customer book; selecting one opens that customer's workspace).
- [x] L2. Health band scale: Excellent starts at 85 (Good is now 75–85), both in
      CustomerProfileTab and AiAnalysisTab.
- [x] L3. Tier column (Platinum / Gold / Silver / Bronze) as a BubbleTag chip in all three
      tables: Customers list, and both Customer Profile tables (Accounts & Products,
      Loans & Credits). Named "Tier" rather than "Category". Colours: Platinum purple,
      Gold yellow, Silver gray, Bronze orange (new `orange` tone added to StatusPill).
- [x] L4. Tier chips coloured as the actual metals — four `platinum`/`gold`/`silver`/
      `bronze` schemes added to CustomColorScheme (brushed linear-gradient background,
      metal-toned text and border). Still the same BubbleTag, so chip geometry is
      unchanged site-wide.

## Round M — Workspace rename, Alerts tab, opportunity probes
- [x] M1. Rename the Customers screen/table to **Workspace**, using the same icon as the
      My Workspace sidebar item (LayoutGrid). Update section header + breadcrumbs.
- [x] M2. Remove the **My Workspace** sidebar section (explicitly asked).
- [x] M3. New tab in the Customer section named **Alerts** (was going to be "Recommended
      Opportunities"; renamed on the user's instruction). Purpose: every selling
      opportunity found by probing the customer across different data sources.
- [x] M4. **Recommended Insurance** — does NOT go in Alerts. Goes into the existing
      "Recommended Opportunities" section on the Customer Profile tab ("it suites there
      better"). Show what we can sell given what they already hold.
      Design: if a customer can hold several policies of one type → grouped-row table
      like "Assessment Drivers & Flags". Otherwise → collapsible tiles like the
      insolvency-ui "Financial & Operational" tab, first section "Financial Metrics":
      compact tile when collapsed, easy-to-read prose when expanded.
- [x] M5. **ESOP** section in Alerts — what ESOPs the customer holds (current/former
      employer), plus that company's news (e.g. IPO announced) and the opportunity that
      creates. Same collapsible form.
- [x] M6. **Credit card / limit** section in Alerts — card enquiry and limit-increase
      opportunities knowable from a soft credit-report pull. Think it through properly.
- [x] M7. **Social media probe** section in Alerts — LinkedIn / Instagram / X posts
      (promotion, funding raised, etc). Reference: insolvency-ui "External Intelligence"
      tab, last section (Social Media Presence) — BUT improvise the card design, don't
      copy it. Show: snapshot of the actual post, how it creates an opportunity, and a
      "Know more" button (same as Recommended Opportunities) that opens the Modus Agent
      with a prefilled prompt and gets a generated answer back.
- [x] M8. Organic, realistic fixture data for all of the above — user will review.
- [x] M9. Tier chips: make every chip the same width.

## Round N — my-customers data + agent-driven filtering (NOT STARTED)
- [ ] N1. My Customers tab shows only the five rows in image #242 (Vandana, Ritu,
      Harpreet, Manish, Simran).
- [ ] N2. Manish Aggarwal health score → 23, band moves from Fair to Bad/Poor; update
      every derived field (drivers, signals, opportunity, priority reasons, chip colour).
- [ ] N3. Harpreet Kaur Gill → relationship "Prospect · NTB"; update tier, products,
      requests, opportunity and reasons so the record stays consistent.
- [ ] N4. Show "-" instead of "Untiered" in the Tier column.
- [ ] N5. Add the Modus Agent button to both Workspace tabs, right-aligned on the same
      row as the search input.
- [ ] N6. Demo-only agent filtering: the agent's new-chat starter prompts get a fourth
      option on these two tabs — a filter request. Clicking it plays a working trail,
      generates a response, and actually applies the filter to the customers table.
      Use the data already visible in the UI.

## Round O — Financial Position rebuild (NOT STARTED)
- [ ] O1. New **Financial Metrics** section above the current Income & Spending section:
      Turnover (T12M) ₹1.12 Cr · GST-derived · GSTR-3B; Net income (FY24) ₹14.2 L ·
      ITR-reported · ITR-3; Revenue growth (YoY) +18.4% · GST-derived; Avg daily balance
      ₹2.4 L · Bank-derived · AA.
- [ ] O2. Rename **Income & Spending → Cash Flow**, new icon, chip "Bank · Account
      Aggregator", keep the existing filters. Metrics become Total inflow ₹1.08 Cr,
      Total outflow ₹1.01 Cr, Avg daily balance ₹2.4 L, Balance floor ₹28k — NO bounces,
      NO net surplus, and no "(T12M)" suffix on inflow/outflow.
- [ ] O3. Cash Flow table stays as is, minus the Bounce column; remove the blue AI
      insight box from that section.
- [ ] O4. New **GST Filing & Performance Trend** section — stacked Turnover/Tax Paid bars
      with a Value Addition % line on a right axis; chip "Regular taxpayer · monthly ·
      GSTR-3B".
- [ ] O5. New **GST Returns & Filing** section — table of Period / Turnover / Tax paid /
      ITC claimed / Filed on / Status (On time · 6 days late); chip "GST · Account
      Aggregator".
- [ ] O6. New **Employment & Establishment Health** section — Headcount bars + Days Delay
      line combo chart, then the establishment table (ID, Location, Headcount, Last paid
      on, Delay, Status).
- [ ] O7. All of it in our theme: SectionHeader, BubbleTag/StatusPill chips, CompactTable,
      KeyMetrics/MetricGrid. Check cam-ui ComboChart and the insolvency Visualization
      before building a chart from scratch.
