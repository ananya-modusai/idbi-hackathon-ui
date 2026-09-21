import React, { useEffect, useState, useRef } from "react";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import MultiSelectFilterBar, {
  getMetricLabel,
  DEFAULT_RISK_FLAG_KEYS,
  ITEMS,
} from "@/components/custom/MultiSelectFilterBar";
import {
  SortActionButton,
  SortDirection,
} from "@/components/custom/CustomList/SortActionButton";
import CustomListActionButton, {
  ActionButtonGroup,
} from "@/components/custom/CustomList/customListActionButton";
// ...existing imports...
import {
  fetchAllRunsDetails,
  fetchDecisioning,
  InvestigationCaseDto,
} from "@/app/services/caseServices";
import { useActiveContext } from "@/app/layout/ActiveContext/useActiveContext";

type Props = {
  cases?: Array<Record<string, any>>;
  outputFormats?: Record<string, Record<string, any>> | null;
  className?: string;
  merchantId?: string;
};

// Small helper to prefer several possible fraud label keys used across the app
const extractFraudLabel = (of: Record<string, any> | undefined | null) => {
  if (!of) return "N/A";
  const candidates = [
    of["Fraud label"],
    of["Fraud Label"],
    of?.fraud_label,
    of?.fraudLabel,
    of?.fraud,
  ];
  const found = candidates.find(
    (v) => typeof v === "string" && v?.toString().trim().length > 0
  );
  return found ?? "N/A";
};

// Normalize fraud label values for display
const normalizeFraudLabel = (s: any): string => {
  const raw = String(s || "").trim();
  if (!raw || raw.toLowerCase() === "n/a") return "N/A";

  const lower = raw.toLowerCase();
  if (lower.includes("suspect") || lower.includes("fraud"))
    return "Suspected Fraud";
  if (lower.includes("good") || lower.includes("safe"))
    return "Good Merchant";
  if (lower.includes("critical")) return "Critical Risk";
  if (lower.includes("high")) return "High Risk";
  if (lower.includes("medium")) return "Medium Risk";
  if (lower.includes("low")) return "Low Risk";

  return raw; // Return as is for other statuses
};

export const InvMetricsTab: React.FC<Props> = ({
  cases,
  outputFormats,
  className = "",
  merchantId,
}) => {
  // Prevent page scroll when this tab is active
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  // Avoid creating a new array/object reference on every render by
  // using stable local variables. Defaulting props to `[]` or `{}` in
  // the parameter list created new references each render and caused
  // the useEffect (which depended on `cases`) to re-run continuously.
  const casesProp = cases ?? [];
  const outputFormatsProp = outputFormats ?? {};
  // `tableMetrics` controls which metric columns are shown in the table.
  // We initialize it to show all risk-flag metrics by default.
  const [tableMetrics, setTableMetrics] = useState<string[]>(
    // make a copy to avoid shared mutation
    DEFAULT_RISK_FLAG_KEYS ? [...DEFAULT_RISK_FLAG_KEYS] : []
  );

  // `filterSelected` is the selection state passed to the filter UI. We
  // intentionally start this as an empty array so the MultiSelect filter
  // shows no selected items; the table still shows all risk flags above.
  const [filterSelected, setFilterSelected] = useState<string[]>([]);
  const [query, setQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [fetchedCases, setFetchedCases] = useState<InvestigationCaseDto[]>([]);
  const [outputFormatMap, setOutputFormatMap] = useState<Record<
    string,
    any
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const csvDownloadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAllRunsDetails(100);
        if (mounted) setFetchedCases(data as any);
      } catch (err) {
        // ignore - fetchAllRunsDetails already logs
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Only fetch if caller didn't pass explicit cases prop
    if (!cases || cases.length === 0) load();

    return () => {
      mounted = false;
    };
  }, [cases]);

  // Debug: log merchantId passed into this tab so we can verify what is
  // forwarded into `MultiSelectFilterBar` (client-only).
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug("InvMetricsTab: merchantId prop =", merchantId);
    }
  }, [merchantId]);

  // Build rows for CustomTableView: prefer merchant data from output-format API when available
  let rows: Array<Record<string, any>> = [];

  if (outputFormatMap && Object.keys(outputFormatMap).length > 0) {
    rows = Object.values(outputFormatMap).map((item: any) => {
      // items stored earlier are the full API item: { merchant: {...}, metrics: {...} }
      const m = item?.merchant ?? item;
      const registeredName =
        m["Merchant Name"] ?? m["MerchantName"] ?? m.registeredName ?? "-";
      const externalMerchantId = String(
        m.MID ?? m.mid ?? m.MerchantID ?? m.MerchantId ?? "-"
      );
      // Attempt to find a case id when available from the output-format item
      // Case ID can appear in several places depending on the API shape.
      // Prefer a top-level `Case ID`, then the merchant object (many
      // deployments put Case ID under merchant["Case ID"]) and then
      // fall back to common case fields.
      const caseId =
        item?.["Case ID"] ??
        (m && (m["Case ID"] ?? m.caseId ?? m.case_id)) ??
        item?.case_id ??
        item?.case?.caseId ??
        item?.case?.id ??
        "-";
      const rawFraudLabel =
        m["Fraud label"] ??
        m["Fraud Label"] ??
        m.fraud_label ??
        m.fraudLabel ??
        m.fraud ??
        "N/A";
      const fraudLabel = normalizeFraudLabel(rawFraudLabel);
      return {
        registeredName,
        caseId,
        externalMerchantId,
        fraudLabel,
        // keep reference to the original item so metric extraction can read nested metrics
        __outputFormatItem: item,
        // metric columns will be added later using `selectedMetrics`
      };
    });
  } else {
    const sourceCases =
      casesProp && casesProp.length > 0 ? casesProp : fetchedCases;
    rows = (sourceCases || []).map((c: any) => {
      const run = c.run || {};
      const merchant = c.merchant || {};
      const datastore = c.datastore || [];

      const registeredName = merchant.name || "-";
      const externalMerchantId = run.merchant_id || "-";
      const caseId = run.id || "-";

      // Try to find fraud label in datastore (e.g. from decisioning or priority_flag step)
      let rawFraudLabel = "N/A";
      const decisionStep = datastore.find((s: any) => s.step_name === "decisioning" || s.step_name === "priority_flag");
      if (decisionStep?.data) {
        rawFraudLabel = decisionStep.data.risk_report?.risk_tier || decisionStep.data.category || "N/A";
      }

      const fraudLabel = normalizeFraudLabel(rawFraudLabel);

      return {
        registeredName,
        caseId,
        externalMerchantId,
        fraudLabel,
        datastore,
        run,
        merchant
      };
    });
  }

  // Helper to try several key variants when extracting metric values from
  // different shaped objects (output formats, case objects, etc.). Many
  // metric keys include spaces or special characters, so we attempt a few
  // transforms before falling back to empty string.
  const extractMetricValue = (rowSource: any, metricKey: string): any => {
    if (!rowSource || !metricKey) return "";

    const norm = (s: any) =>
      String(s || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
    const tNorm = norm(metricKey);
    // For keys like "Category.Subrule", also search for "Subrule" alone
    const metricParts = metricKey.split(".");
    const tTail = metricParts.length > 1 ? norm(metricParts.pop()) : null;

    const searchNestedForKey = (
      obj: any,
      targetKeyNorm: string,
      targetTailNorm: string | null,
      currentPrefix?: string
    ): any => {
      if (!obj || typeof obj !== "object") return undefined;
      // Direct match in keys (either full key, tail key, or path-accumulated key)
      for (const k of Object.keys(obj)) {
        const kn = norm(k);
        const pathKn = currentPrefix ? currentPrefix + kn : kn;
        if (
          pathKn === targetKeyNorm ||
          kn === targetKeyNorm ||
          (targetTailNorm && kn === targetTailNorm)
        ) {
          const val = obj[k];
          // If the value itself is an object that contains triggered status, prefer that status
          if (val && typeof val === "object" && !Array.isArray(val)) {
            const status =
              val.triggered ??
              val.overall_triggered ??
              val.overallTriggered ??
              val.status;
            if (status !== undefined) return status;
            // If it's a flag-like object but has no status, return N/A
            return "N/A";
          }
          return val;
        }
      }
      // Recursive search
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const found = searchNestedForKey(
            v,
            targetKeyNorm,
            targetTailNorm,
            currentPrefix ? currentPrefix + norm(k) : norm(k)
          );
          if (found !== undefined) return found;
        }
      }
      return undefined;
    };

    // If rowSource has datastore (new API format), search within its steps
    if (rowSource.datastore && Array.isArray(rowSource.datastore)) {
      for (const step of rowSource.datastore) {
        if (!step.data) continue;

        // 1. Favor status from flag arrays if the key matches a flag code or description
        const flags = Array.isArray(step.data)
          ? step.data
          : step.data.flags ||
            step.data.red_flags ||
            step.data.good_flags ||
            step.red_flags ||
            step.flags;
        if (Array.isArray(flags)) {
          // Check flag direct match
          const flagMatch = flags.find(
            (f) =>
              norm(f.code) === tNorm ||
              (f.red_flag && norm(f.red_flag) === tNorm) ||
              (tTail &&
                (norm(f.code) === tTail || (f.red_flag && norm(f.red_flag) === tTail)))
          );
          if (flagMatch)
            return (
              flagMatch.triggered ??
              flagMatch.overall_triggered ??
              flagMatch.overallTriggered ??
              flagMatch.status ??
              "N/A"
            );

          // Check subrules within flags (e.g. for "Trade name mismatch")
          for (const f of flags) {
            const subs = f.subrules || f.details?.subrules;
            if (Array.isArray(subs)) {
              const matchedSub = subs.find(
                (s) =>
                  norm(s.subrule) === tNorm ||
                  norm(s.name) === tNorm ||
                  (tTail && (norm(s.subrule) === tTail || norm(s.name) === tTail))
              );
              if (matchedSub)
                return (
                  matchedSub.triggered ??
                  matchedSub.overall_triggered ??
                  matchedSub.status
                );
            }
          }
        }

        // 2. Fallback to nested search within the step's data object
        const found = searchNestedForKey(step.data, tNorm, tTail);
        if (found !== undefined && found !== "") {
          // If the nested search returned a flag object, extract its status
          if (found && typeof found === "object" && !Array.isArray(found)) {
            const status =
              found.triggered ??
              found.overall_triggered ??
              found.overallTriggered ??
              found.status;
            if (status !== undefined) return status;
            return "N/A";
          }
          return found;
        }
      }
    }

    // 1. Flag-specific logic for array-based flag sets (RFxxx, GFxxx)
    if (/^[R|G]F\d{3}$/i.test(metricKey)) {
      const flagCode = metricKey.toUpperCase();
      const findFlagStatus = (obj: any): any => {
        if (!obj) return undefined;
        // Check array-based collections
        const arrayKeys = [
          "red-flags",
          "red_flags",
          "flags",
          "redFlags",
          "red_flags_info",
        ];
        for (const ak of arrayKeys) {
          const arr = obj[ak];
          if (Array.isArray(arr)) {
            // Favor "overall" entries
            const bestMatch =
              arr.find(
                (f) =>
                  String(f.code || "").toUpperCase() === flagCode &&
                  String(f.red_flag || "")
                    .toLowerCase()
                    .includes("overall")
              ) || arr.find((f) => String(f.code || "").toUpperCase() === flagCode);
            if (bestMatch) {
              const trigger =
                bestMatch.triggered ??
                bestMatch.overallTriggered ??
                bestMatch.overall_triggered;
              if (trigger !== undefined) return trigger;
            }
          }
        }
        // Check object-based collections (e.g. Risk Flags: { RF001: true })
        if (obj.metrics) {
          const found = searchNestedForKey(obj.metrics, norm(flagCode), null);
          if (found !== undefined) return found;
        }
        return undefined;
      };

      const sources = [
        rowSource,
        rowSource.merchant,
        rowSource.data,
        rowSource.outputFormat,
        rowSource.output_format,
        rowSource.other,
      ];
      for (const s of sources) {
        const status = findFlagStatus(s);
        if (status !== undefined) return status;
      }
    }

    // 2. Standard nested searching for technical metrics
    const val =
      searchNestedForKey(rowSource.metrics, tNorm, tTail) ??
      searchNestedForKey(rowSource.data, tNorm, tTail) ??
      searchNestedForKey(rowSource, tNorm, tTail);

    if (val !== undefined) return val;

    // 3. Last fallback: search through all flags for matching subrule names
    const searchInSubrules = (obj: any): any => {
      if (!obj) return undefined;
      const arrayKeys = [
        "red-flags",
        "red_flags",
        "flags",
        "redFlags",
        "red_flags_info",
      ];
      for (const ak of arrayKeys) {
        const arr = obj[ak];
        if (Array.isArray(arr)) {
          for (const f of arr) {
            const subs = f.subrules || f.details?.subrules;
            if (Array.isArray(subs)) {
              const matched = subs.find(
                (s) =>
                  norm(s.subrule) === tNorm ||
                  norm(s.name) === tNorm ||
                  (tTail && (norm(s.subrule) === tTail || norm(s.name) === tTail))
              );
              if (matched)
                return (
                  matched.triggered ?? matched.overall_triggered ?? matched.status
                );
            }
          }
        }
      }
      return undefined;
    };

    const sourcesForSubrules = [rowSource, rowSource.merchant, rowSource.data, rowSource.outputFormat, rowSource.output_format, rowSource.other];
    for (const src of sourcesForSubrules) {
      const status = searchInSubrules(src);
      if (status !== undefined) return status;
    }

    return "";
  };

  // Convert raw metric values to a display-friendly string so falsy booleans
  // (false) and nulls are visible in the table instead of rendering empty.
  const formatMetricValue = (v: any) => {
    if (v === undefined) return "";
    if (v === null) return "N/A";
    if (typeof v === "boolean") return v ? "True" : "False";
    if (typeof v === "number") return String(v);
    if (typeof v === "string") {
      const lower = v.toLowerCase().trim();
      if (lower === "yes" || lower === "true") return "True";
      if (lower === "no" || lower === "false") return "False";
      return v;
    }
    // For objects/arrays, show a compact JSON preview
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  };

  // Add metric values into each row for the currently selected metrics.
  if (tableMetrics && tableMetrics.length > 0) {
    rows = rows.map((r: Record<string, any>) => {
      // Attempt to obtain metric values from outputFormatsProp (map keyed by
      // externalMerchantId), then from the row itself.
      const ofFromMap =
        (outputFormatsProp as any) && r.externalMerchantId
          ? (outputFormatsProp as any)[String(r.externalMerchantId)]
          : undefined;

      // Also consider the output-format item attached to the row when building from outputFormatMap
      const ofFromRow = r.__outputFormatItem ?? undefined;

      // helper to pick the best source (prefer explicit prop map, then attached item)
      const pickOutputItem = () => ofFromMap ?? ofFromRow ?? undefined;

      const newRow = { ...r };
      tableMetrics.forEach((m) => {
        let val = extractMetricValue(pickOutputItem(), m);
        if (val === undefined || val === "") {
          val = extractMetricValue(r, m);
        }
        // Keep both a display-friendly string and the raw value for
        // summary computations later.
        newRow[m] = formatMetricValue(val);
        newRow[`__raw_${m}`] = val;
      });
      return newRow;
    });
  }

  const activeContext = useActiveContext();

  const columns = [
    { key: "sno", header: "S.No", sortable: false },
    {
      key: "registeredName",
      header: "Merchant Name",
      sortable: true,
      render: (val: any, row: any) => (
        <button
          onClick={() => activeContext.handleSelect("investigation", row.caseId, null)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key: "fraudLabel",
      header: "Risk status",
      sortable: false,
      render: (val: any) => val,
    },
  ];

  // Build metric columns (these should appear starting from the 4th column).
  const metricColumns = tableMetrics.map((m) => ({
    key: m,
    // Use friendly label from mapping if available, otherwise prettify header
    header:
      typeof m === "string"
        ? getMetricLabel(m) ||
          m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : String(m),
    sortable: false,
    minWidth: "120px",
    render: (val: any) => {
      const s = String(val || "");
      if (s === "True") {
        return <span className="text-gray-500 font-medium">Yes</span>;
      }
      if (s === "False") {
        return <span className="text-gray-500">No</span>;
      }
      if (s === "N/A") {
        return <span className="text-gray-400 italic">N/A</span>;
      }
      // Detect URLs
      if (s.startsWith("http://") || s.startsWith("https://")) {
        return (
          <a
            href={s}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            Link
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        );
      }
      return <span className="text-gray-700">{s}</span>;
    },
  }));

  // Ensure the first five columns remain fixed (left) and have a sensible minimum
  // width. `CustomTableView` accepts per-column props like `minWidth` and may
  // respect a `fixed: 'left'` flag used by many table libraries. We build a
  // processed `cols` array and use it everywhere in the component so ordering
  // and widths are honored for headings, cells, CSV export, totals and colspan.
  const cols = columns.map((c: any, idx: number) => {
    if (idx < 5) {
      return {
        ...c,
        // enforce a minimum width for the first five columns
        minWidth: c.minWidth ?? "100px",
        // many table components use `fixed: 'left'` to pin columns; harmless
        // if the table ignores it.
        fixed: (c as any).fixed ?? "left",
      };
    }
    return c;
  });

  // Append the metric columns after processing the first five fixed cols.
  const finalCols = [...cols, ...metricColumns];

  // Calculate width of first 5 fixed columns
  const fixedColumnCount = Math.min(5, columns.length);
  const estimatedFixedWidth = fixedColumnCount * 150; // rough estimate: 150px per column

  // Apply search filtering (by case id or merchant id)
  const q = query.trim().toLowerCase();
  const filteredRows = q
    ? rows.filter((r: any) => {
        const cid = (r.caseId ?? "").toString().toLowerCase();
        const mid = (r.externalMerchantId ?? "").toString().toLowerCase();
        return cid.includes(q) || mid.includes(q);
      })
    : rows;

  // Apply sorting if requested
  const sortedRows = (() => {
    if (!sortKey) return filteredRows;
    const copy = [...filteredRows];
    copy.sort((a: any, b: any) => {
      const va = (a[sortKey] ?? "").toString();
      const vb = (b[sortKey] ?? "").toString();
      // Try numeric comparison when both values look like numbers
      const na = Number(va);
      const nb = Number(vb);
      let cmp = 0;
      if (!Number.isNaN(na) && !Number.isNaN(nb)) {
        cmp = na - nb;
      } else {
        cmp = va.localeCompare(vb, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  })();

  // Build display rows with S.No based on current sort/filter order and
  // compute summary rows for the selected metric columns.
  const displayedDataBase = sortedRows.map((r: any, idx: number) => ({
    ...r,
    sno: idx + 1,
  }));

  // Helper to normalize a raw metric value into a boolean "triggered"
  // interpretation (used for counts).
  const isTruthyFlag = (v: any) => {
    if (v === true) return true;
    if (v === false) return false;
    if (v === null || v === undefined || v === "") return false;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") return /^(true|yes|1)$/i.test(v.trim());
    return false;
  };

  // Build the four summary rows and append them after the data rows.
  const summaryRows: Record<string, any>[] = [];

  // If there are metrics selected, compute per-metric counts.
  if (tableMetrics && tableMetrics.length > 0) {
    const triggeredCountRow: any = {
      registeredName: "Triggered Count",
      fraudLabel: "",
    };
    const triggeredFraudRow: any = {
      registeredName: "Triggered & Fraud",
      fraudLabel: "",
    };
    const triggeredGoodRow: any = {
      registeredName: "Triggered & Good",
      fraudLabel: "",
    };
    const precisionRow: any = {
      registeredName: "Precision",
      fraudLabel: "",
    };

    // Helper to determine if a metric should use Good Precision or Flag Precision
    const isGoodPrecisionMetric = (metricKey: string): boolean => {
      // GF001, GF002, GF003 columns use Good Precision
      const gfPattern = /^GF00[1-3]$/i;
      if (gfPattern.test(metricKey)) return true;

      // Social Media & Marketplace suboption columns use Good Precision
      // These typically contain "Social" and "Marketplace" or related keywords
      const socialMarketplacePattern =
        /social|marketplace|instagram|facebook|tiktok|ebay|amazon/i;
      if (socialMarketplacePattern.test(metricKey)) return true;

      return false;
    };

    tableMetrics.forEach((m) => {
      let triggered = 0;
      let trigAndFraud = 0;
      let trigAndGood = 0;

      for (const r of displayedDataBase) {
        const raw = r[`__raw_${m}`];
        if (isTruthyFlag(raw)) {
          triggered += 1;
          if (r.fraudLabel === "Suspected Fraud") trigAndFraud += 1;
          if (r.fraudLabel === "Good Merchant") trigAndGood += 1;
        }
      }

      triggeredCountRow[m] = String(triggered);
      triggeredFraudRow[m] = String(trigAndFraud);
      triggeredGoodRow[m] = String(trigAndGood);

      // Calculate precision based on metric type
      let precisionValue = "";
      if (triggered > 0) {
        if (isGoodPrecisionMetric(m)) {
          // Good Precision = (triggered & good) / triggered count
          const precision = (trigAndGood / triggered) * 100;
          precisionValue = precision.toFixed(2) + "%";
        } else {
          // Flag Precision = (triggered & fraud) / triggered count
          const precision = (trigAndFraud / triggered) * 100;
          precisionValue = precision.toFixed(2) + "%";
        }
      }
      precisionRow[m] = precisionValue;
    });

    // Place label for summary rows in the Case ID column; leave S.No blank.
    triggeredCountRow.sno = "";
    triggeredFraudRow.sno = "";
    triggeredGoodRow.sno = "";
    precisionRow.sno = "";

    summaryRows.push(
      precisionRow,
      triggeredFraudRow,
      triggeredGoodRow,
      triggeredCountRow
    );
  }

  const finalDisplayRows = [...displayedDataBase, ...summaryRows];

  return (
    <div className={className}>
      <SectionHeaderWithFlags
        positiveFlags={[]}
        negativeFlags={[]}
        title="Merchant Metrics"
        allowCollapse={false}
        titleRightElement={
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {loading ? "Loading…" : `${filteredRows.length} cases`}
            </span>
            <button
              onClick={() => csvDownloadRef.current && csvDownloadRef.current()}
              className={`flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${"text-blue-600"}`}
              title="Export as CSV"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download CSV
            </button>
          </div>
        }
      />

      {/* Multi-select filter bar shown above the table. Pass sort/reset handlers so
          Sort and Reset buttons render above the search bar (before Select All). */}
      <MultiSelectFilterBar
        // Filter UI selection state (separate from table columns).
        // Start with no selections in the UI while table shows defaults.
        selectedItems={filterSelected}
        onSelectionChange={(chosen) => {
          // Update UI-selected items
          setFilterSelected(chosen);
          // If user selected one or more metrics use that selection for the
          // table; if they cleared selection, revert the table to show the
          // default risk flags.
          if (chosen && chosen.length > 0) setTableMetrics(chosen);
          else
            setTableMetrics(
              DEFAULT_RISK_FLAG_KEYS ? [...DEFAULT_RISK_FLAG_KEYS] : []
            );
        }}
        caseId={merchantId}
        sortFields={[
          { key: "caseId", label: "Case ID" },
          { key: "externalMerchantId", label: "Merchant id" },
        ]}
        currentSortField={sortKey}
        currentSortDirection={sortDirection as any}
        onSortChange={(fieldKey: string, dir: any) => {
          setSortKey(fieldKey);
          setSortDirection(dir);
        }}
        onReset={() => {
          setQuery("");
          // Clear filter UI selection and reset table to default risk flags
          setFilterSelected([]);
          setTableMetrics(
            DEFAULT_RISK_FLAG_KEYS ? [...DEFAULT_RISK_FLAG_KEYS] : []
          );
          setSortKey(null);
          setSortDirection("asc");
        }}
      />

      {/* Search bar + Buttons row */}
      <div className="mt-4 mb-3">
        <div className="max-w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                Search
              </span>
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  aria-label="Search cases"
                  placeholder="Search by Case ID or Merchant ID..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SortActionButton
                sortFields={[
                  { key: "caseId", label: "Case ID" },
                  { key: "externalMerchantId", label: "Merchant id" },
                ]}
                currentSortField={sortKey ?? ""}
                currentSortDirection={sortDirection as SortDirection}
                onSortChange={(fieldKey: string, dir: SortDirection) => {
                  setSortKey(fieldKey);
                  setSortDirection(dir as any);
                }}
                color="blueTextWhiteBg"
                border={true}
              />

              <ActionButtonGroup showLabel={false}>
                <CustomListActionButton
                  onClick={() => {
                    setQuery("");
                    setFilterSelected([]);
                    setTableMetrics(
                      DEFAULT_RISK_FLAG_KEYS ? [...DEFAULT_RISK_FLAG_KEYS] : []
                    );
                    setSortKey(null);
                    setSortDirection("asc");
                  }}
                  title="Reset filters"
                  color="blueTextWhiteBg"
                  border={true}
                >
                  Reset
                </CustomListActionButton>
              </ActionButtonGroup>

              <ActionButtonGroup showLabel={false}>
                <CustomListActionButton
                  onClick={() => {
                    const all = ITEMS.flatMap((it) => it.subItems || []);
                    setFilterSelected([...all]);
                    setTableMetrics([...all]);
                  }}
                  title="Select All"
                  color="blueTextWhiteBg"
                  border={true}
                >
                  Select All
                </CustomListActionButton>
              </ActionButtonGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Table wrapper with horizontal scroll for columns beyond first 5 fixed columns */}
      {/* Constrained height with internal vertical scroll, fixed header */}
      <div
        style={{
          maxWidth: "100%",
          width: "100%",
          height: "calc(100vh - 450px)",
          overflow: "auto",
          overflowX: "auto",
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "0.375rem",
        }}
      >
        <div
          style={{
            minWidth: "min-content",
          }}
        >
          <CustomTableView
            columns={finalCols}
            data={finalDisplayRows}
            initialRowLimit={999}
            showCSVExport={false}
            // pass ref so header button can trigger CSV export with same logic
            downloadCsvRef={csvDownloadRef}
            minColumnWidth="80px"
            className="table-fixed-width"
          />
        </div>
      </div>
    </div>
  );
};

export default InvMetricsTab;
