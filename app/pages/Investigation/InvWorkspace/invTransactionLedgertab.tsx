"use client";

import React, { FC, useEffect, useState, useMemo } from "react";
import {
  fetchTransactionLedger,
  fetchTransactionStatistics,
} from "@/app/services/caseServices";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import InvPageHeader from "../Components/InvPageHeader";
import { EmptyState } from "@/app/pages/Investigation/Components/EmptyState";
import CustomListLedger from "@/components/custom/CustomList/customListLedger";
import { CustomListItemProps } from "@/components/custom/CustomList/customListItem";
import { LedgerColumn } from "@/components/custom/CustomList/customListLedger";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { getIconByName } from "@/components/custom/CustomIconScheme";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import CustomListKeyMetrics from "@/components/custom/CustomList/customListKeyMetrics";
import CustomListFilter, {
  useFilterState,
  useFilteredItems,
} from "@/components/custom/CustomList/customListFilter";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";

interface InvTransactionLedgerTabProps {
  merchantId?: string;
  caseId?: string;
}

const InvTransactionLedgerTab: FC<InvTransactionLedgerTabProps> = ({
  merchantId,
  caseId,
}) => {
  const { selectedCase } = useInvestigationCaseStore();
  const activeCase = selectedCase;
  // We will use the shared CustomList filter hooks to render primary toggles
  // (payment modes) and secondary dropdowns (upi_request, txn_status, IPG, period)

  // known payment modes to show in the secondary 'Type' dropdown
  const PAYMENT_MODES = [
    "UPI",
    "CREDIT CARD",
    "UPI CREDIT CARD",
    "NET BANKING",
    "DEBIT CARD",
    "Wallet",
    "UPI PPI",
    "BANK TRANSFER",
    "PREPAID CARD",
    "SBC UPI",
    "UPI CREDIT LINE",
    "CASH",
    "CREDIT CARD EMI",
    "PAY LATER",
  ];

  // sort flag - true => oldest first, false => newest first
  const [sortOldestFirst, setSortOldestFirst] = useState<boolean>(false);
  // pagination: current page and page size (20 per user request)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 1000;

  // items, total and loading/error states (fetched from API)
  const [items, setItems] = useState<CustomListItemProps[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // create filter group configuration for CustomListFilter (placed after items so items exists)
  // Compute period (month-year) options from the API data (items) and include Lifetime.
  const periodMonthOptions = useMemo(() => {
    const monthsMap = new Map<string, { label: string; date: Date }>();

    items.forEach((it) => {
      const txnTimeRaw = it.originalData?.txnTime || it.datetime || "";
      if (!txnTimeRaw) return;
      // try ISO-like replacement first then fallback
      let d = new Date(String(txnTimeRaw).replace(" ", "T"));
      if (isNaN(d.getTime())) d = new Date(String(txnTimeRaw));
      if (isNaN(d.getTime())) return;
      const label = d.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });
      // use first-of-month date for sorting
      const parts = label.split(" ");
      const year = parseInt(parts[parts.length - 1], 10);
      const monthName = parts.slice(0, parts.length - 1).join(" ");
      const monthIndex = new Date(
        Date.parse(`${monthName} 1, ${year}`)
      ).getMonth();
      const dateObj = new Date(year, monthIndex, 1);
      monthsMap.set(label, { label, date: dateObj });
    });

    const monthsArr = Array.from(monthsMap.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    // Always include Lifetime at top
    const options = [
      { value: "Lifetime", label: "Lifetime" },
      ...monthsArr.map((m) => ({ value: m.label, label: m.label })),
    ];
    return options;
  }, [items]);

  const filterGroupsState = useMemo(() => {
    return {
      primary: [
        {
          id: "payment_mode",
          label: "Payment mode",
          // render as a dropdown/multiselect filter bar
          type: "multiselect",
          options: PAYMENT_MODES.map((p) => ({ value: p, label: p })),
          // default to 'all' (no-op)
          selectedValues: ["all"],
          showAllOption: true,
          // filterFunction: normalize both sides and compare (tolerant to underscores/spaces/case)
          filterFunction: (item: any, selectedValues: string[]) => {
            if (!selectedValues || selectedValues.length === 0) return true;
            if (selectedValues.includes("all")) return true;
            const raw = String(
              item.originalData?.paymentmode || ""
            ).toUpperCase();
            return selectedValues.some((sv) => {
              const norm = String(sv).toUpperCase().replace(/\s+/g, "_");
              return norm === raw;
            });
          },
          // provide handler expected by CustomListFilter
          onFilterChange: (newValues: string[]) => {
            setFilterState((prev: any) => ({
              ...prev,
              primarySelected: {
                ...(prev.primarySelected || {}),
                payment_mode: newValues,
              },
            }));
          },
        },
      ],
      secondary: [
        {
          id: "upi_request",
          label: "UPI request",
          type: "multiselect",
          options: [
            { value: "intent", label: "Intent" },
            { value: "collect", label: "Collect" },
            { value: "others", label: "Others" },
          ],
          selectedValues: ["all"],
          showAllOption: true,
          filterFunction: (item: any, selectedValues: string[]) => {
            if (!selectedValues || selectedValues.length === 0) return true;
            if (selectedValues.includes("all")) return true;
            const val = String(
              item.originalData?.upi_request_type || ""
            ).toLowerCase();
            return selectedValues.some((sv) => {
              if (sv === "others")
                return val !== "intent" && val !== "collect" && val !== "";
              return sv === val;
            });
          },
          onFilterChange: (newValues: string[]) => {
            setFilterState((prev: any) => ({
              ...prev,
              secondarySelected: {
                ...(prev.secondarySelected || {}),
                upi_request: newValues,
              },
            }));
          },
        },
        {
          id: "txn_status",
          label: "Txn status",
          type: "multiselect",
          options: [
            { value: "SUCCESS", label: "Success" },
            { value: "FAILED", label: "Failed" },
            { value: "USER_DROPPED", label: "User Dropped" },
            { value: "INIT_FAILED", label: "Init Failed" },
            { value: "INCOMPLETE", label: "Incomplete" },
          ],
          selectedValues: ["all"],
          showAllOption: true,
          filterFunction: (item: any, selectedValues: string[]) => {
            if (!selectedValues || selectedValues.length === 0) return true;
            if (selectedValues.includes("all")) return true;
            const val = String(
              item.originalData?.txn_status || ""
            ).toUpperCase();
            return selectedValues.some(
              (sv) => String(sv).toUpperCase() === val
            );
          },
          onFilterChange: (newValues: string[]) => {
            setFilterState((prev: any) => ({
              ...prev,
              secondarySelected: {
                ...(prev.secondarySelected || {}),
                txn_status: newValues,
              },
            }));
          },
        },
        {
          id: "ipg",
          label: "IPG",
          type: "multiselect",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
          selectedValues: ["all"],
          showAllOption: true,
          filterFunction: (item: any, selectedValues: string[]) => {
            if (!selectedValues || selectedValues.length === 0) return true;
            if (selectedValues.includes("all")) return true;
            const val = String(item.originalData?.ipg || "").toLowerCase();
            return selectedValues.some(
              (sv) => String(sv).toLowerCase() === val
            );
          },
          onFilterChange: (newValues: string[]) => {
            setFilterState((prev: any) => ({
              ...prev,
              secondarySelected: {
                ...(prev.secondarySelected || {}),
                ipg: newValues,
              },
            }));
          },
        },
        {
          id: "period",
          label: "Period",
          type: "multiselect",
          // Render as a dropdown but enforce single selection
          singleSelect: true,
          options: periodMonthOptions,
          selectedValues: ["Lifetime"],
          showAllOption: true,
          // Filter by calendar month/year for month selections; keep Lifetime as no-op
          filterFunction: (item: any, selectedValues: string[]) => {
            if (!selectedValues || selectedValues.length === 0) return true;
            if (selectedValues.includes("Lifetime")) return true;

            const txnTimeRaw =
              item.originalData?.txnTime || item.datetime || "";
            const txnDate = txnTimeRaw
              ? new Date(String(txnTimeRaw).replace(" ", "T"))
              : null;
            if (!txnDate || isNaN(txnDate.getTime())) return true;

            // For each selected month like "June 2025" check month and year
            return selectedValues.some((sv) => {
              try {
                const parts = String(sv).trim().split(" ");
                if (parts.length < 2) return true;
                const monthName = parts[0];
                const year = parseInt(parts[1], 10);
                const monthIndex = new Date(
                  Date.parse(`${monthName} 1, ${year}`)
                ).getMonth();
                return (
                  txnDate.getMonth() === monthIndex &&
                  txnDate.getFullYear() === year
                );
              } catch (e) {
                return true;
              }
            });
          },
          onFilterChange: (newValues: string[]) => {
            setFilterState((prev: any) => ({
              ...prev,
              secondarySelected: {
                ...(prev.secondarySelected || {}),
                period: newValues,
              },
            }));
          },
        },
      ],
      tertiary: [
        {
          id: "search",
          label: "Search",
          type: "searchbar",
          options: [],
          selectedValues: [],
          showLabel: true,
          searchPlaceholder: "Search by Txn ID, description, cityname, amount...",
          filterFunction: (item: any, queryArray: string[]) => {
            if (!queryArray || queryArray.length === 0) return true;
            const query = String(queryArray[0] || "").toLowerCase().trim();
            if (!query) return true;

            const originalData = item.originalData || {};
            
            // Search in Txn ID
            const txnId = String(originalData.txnId || "").toLowerCase();
            if (txnId.includes(query)) return true;

            // Search in description
            const description = String(originalData.description || "").toLowerCase();
            if (description.includes(query)) return true;

            // Search in cityname
            const cityname = String(originalData.cityname || "").toLowerCase();
            if (cityname.includes(query)) return true;

            // Search in amount (convert to string and search)
            const amount = originalData.amount;
            if (typeof amount === "number") {
              const amountStr = amount.toString();
              if (amountStr.includes(query)) return true;
              // Also check formatted amount with currency symbol
              const formattedAmount = `₹${amount.toLocaleString()}`.toLowerCase();
              if (formattedAmount.includes(query)) return true;
              // Check amount without commas (e.g., "1000" matches "1,000")
              const amountWithoutCommas = amountStr.replace(/,/g, "");
              const queryWithoutCommas = query.replace(/,/g, "").replace(/₹/g, "").replace(/rs/g, "").trim();
              if (amountWithoutCommas.includes(queryWithoutCommas)) return true;
            } else if (amount) {
              const amountStr = String(amount).toLowerCase();
              if (amountStr.includes(query)) return true;
              // Also try without commas and currency symbols
              const amountClean = amountStr.replace(/,/g, "").replace(/₹/g, "").replace(/rs/g, "").trim();
              const queryClean = query.replace(/,/g, "").replace(/₹/g, "").replace(/rs/g, "").trim();
              if (amountClean.includes(queryClean)) return true;
            }

            return false;
          },
          onFilterChange: () => {},
          onSearchChange: () => {},
        },
      ],
      quaternary: [],
    } as const;
  }, [periodMonthOptions]);

  const { filterState, setFilterState } = useFilterState(
    filterGroupsState as any
  );
  const { isCollapsed } = useArtifactStore();
  const secondaryGroups = (filterGroupsState as any).secondary || [];
  const tertiaryGroups = (filterGroupsState as any).tertiary || [];
  const upiTxnGroups = secondaryGroups.filter(
    (g: any) => g.id === "upi_request" || g.id === "txn_status"
  );
  const ipgPeriodGroups = secondaryGroups.filter(
    (g: any) => g.id === "ipg" || g.id === "period"
  );
  const searchGroups = tertiaryGroups.filter((g: any) => g.id === "search");

  // transaction statistics for key metrics (fetched from API)
  const [txnStats, setTxnStats] = useState<any[] | null>(null);

  // helper to map period selection to response key
  const periodKeyFromSelection = (sel: string | undefined) => {
    switch (String(sel || "").toLowerCase()) {
      case "past 30d":
        return "past30d";
      case "past 7d":
        return "past7d";
      case "past 1d":
        return "past1d";
      case "lifetime":
      default:
        return "lifetime";
    }
  };

  // (transaction statistics fetch effect moved below after resolvedCaseId is defined)

  // Resolve a single case id value to avoid duplicate effect triggers
  // when both the prop `caseId` and `activeCase` update separately.
  const resolvedCaseId = caseId || (activeCase as any)?.caseId;

  // Fetch transaction statistics when the resolvedCaseId changes
  useEffect(() => {
    const cid = resolvedCaseId;
    if (!cid) return;

    let mounted = true;
    (async () => {
      try {
        const resp = await fetchTransactionStatistics(cid);
        if (mounted) setTxnStats((resp && resp.data) || null);
      } catch (err) {
        console.error("Error fetching transaction statistics:", err);
        if (mounted) setTxnStats(null);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedCaseId]);

  // fetch ledger page from backend
  const fetchLedgerPage = async (page: number) => {
    const cid = resolvedCaseId;
    if (!cid) return;

    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const resp = await fetchTransactionLedger(cid, {
        limit: ITEMS_PER_PAGE,
        offset,
      });

      const data = resp || { items: [], total: 0 };
      // Expecting { items: [...], total, limit, offset }
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotalItems(typeof data.total === "number" ? data.total : 0);
    } catch (err: any) {
      console.error("Error fetching transaction ledger:", err);
      setError(err?.message || "Failed to load ledger");
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered items from the shared hook
  const filteredFromFilters = useFilteredItems(
    items,
    filterGroupsState as any,
    filterState as any
  );

  // ledger columns to show on the right side ledger
  const ledgerColumns: LedgerColumn[] = [
    {
      id: "txnTime",
      label: "Txn Time",
      width: "w-36",
      alignment: "left",
      renderValue: (item: any) => (
        <span className="text-sm text-gray-700">
          {item.originalData?.txnTime || "-"}
        </span>
      ),
    },
    {
      id: "txnId",
      label: "Txn ID",
      width: "w-36",
      alignment: "left",
      renderValue: (item: any) => (
        <span className="text-sm text-gray-700">
          {item.originalData?.txnId || "-"}
        </span>
      ),
    },
    {
      id: "txnmsg",
      label: "Txn Message",
      width: "w-52",
      alignment: "left",
      renderValue: (item: any) => (
        <span className="text-xs text-gray-600 whitespace-pre-line">
          {item.originalData?.txnmsg || "-"}
        </span>
      ),
    },
    {
      id: "details",
      label: "Details",
      // wider details column
      width: "w-96",
      alignment: "left",
      renderValue: (item: any) => {
        const d = item.originalData || {};
        const detailsRaw = String(d.details || "-");

        // Example: "CREDIT_CARD transaction" -> ["CREDIT_CARD", "transaction"]
        const parts = detailsRaw.trim().split(/\s+/);
        const firstRaw = parts.length > 0 ? parts[0] : "-";
        const restRaw = parts.length > 1 ? parts.slice(1).join(" ") : "-";

        const firstDisplay = String(firstRaw).replace(/_/g, " ").toUpperCase();
        const restDisplay = String(restRaw).toUpperCase();
        const statusRaw = String(d.txn_status || "-").toUpperCase();

        const statusColor: any = statusRaw.includes("SUCCESS")
          ? ("green" as const)
          : statusRaw.includes("FAIL")
          ? ("red" as const)
          : ("gray" as const);

        return (
          <div className="flex items-center gap-2">
            <BubbleTag text={firstDisplay} color={"purple" as any} />
            <span className="text-gray-300">|</span>
            <BubbleTag text={restDisplay} color={"gray" as any} />
            <span className="text-gray-300">|</span>
            <BubbleTag text={statusRaw} color={statusColor} />
          </div>
        );
      },
    },
    {
      id: "ipg",
      label: "IPG",
      // narrow IPG column
      width: "w-20",
      alignment: "left",
      renderValue: (item: any) => (
        <span className="text-sm">{item.originalData?.ipg || "-"}</span>
      ),
    },
    {
      id: "paymentmode",
      label: "payment mode",
      width: "w-36",
      alignment: "left",
      renderValue: (item: any) => {
        const pmRaw = item.originalData?.paymentmode || "-";
        // remove underscores for display (e.g. UPI_CREDIT -> UPI CREDIT)
        const pmDisplay = String(pmRaw).replace(/_/g, " ");
        const pm = String(pmRaw).toLowerCase();
        const pmColor: any = pm.includes("upi")
          ? ("emerald" as const)
          : pm.includes("card")
          ? ("blue" as const)
          : pm.includes("net")
          ? ("teal" as const)
          : ("gray" as const);

        return <BubbleTag text={pmDisplay} color={pmColor} />;
      },
    },
    {
      id: "description",
      label: "description",
      width: "w-72",
      alignment: "left",
      renderValue: (item: any) => {
        const d = item.originalData || {};
        const ordernote = d.ordernote || null;
        const description = d.description || "";
        return (
          <TooltipProvider>
            <div className="flex items-center gap-1 max-w-full">
              {ordernote ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="max-w-[7rem] truncate">
                      <BubbleTag text={ordernote} color="blue" withBorder={true} fixedWidth="w-24" clickable={false} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>{ordernote}</TooltipContent>
                </Tooltip>
              ) : null}
              {ordernote && description ? <span className="text-gray-300">|</span> : null}
              {description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="max-w-[9rem] truncate">
                      <BubbleTag text={description} color="gray" withBorder={true} fixedWidth="w-36" clickable={false} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>{description}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </TooltipProvider>
        );
      },
    },
    {
      id: "cityname",
      label: "city name",
      width: "w-36",
      alignment: "left",
      renderValue: (item: any) => (
        <span className="text-sm">{item.originalData?.cityname || "-"}</span>
      ),
    },
    {
      id: "amount",
      label: "amount",
      width: "w-28",
      alignment: "right",
      renderValue: (item: any) => (
        <span className="text-sm font-medium">
          {typeof item.originalData?.amount === "number"
            ? `₹${item.originalData.amount.toLocaleString()}`
            : "-"}
        </span>
      ),
    },
  ];

  const Icon = getIconByName("MessageSquare");

  // apply sorting on top of filtered results from the shared hook
  // apply sorting on top of filtered results from the shared hook
  const filteredItems = filteredFromFilters.slice().sort((a, b) => {
    const da = new Date(a.originalData?.txnTime || a.datetime || 0).getTime();
    const db = new Date(b.originalData?.txnTime || b.datetime || 0).getTime();
    return sortOldestFirst ? da - db : db - da;
  });

  // pagination helpers using server-provided total
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // compute a sliding window of pages (3 at a time) based on currentPage
  const getPagesWindow = (total: number, current: number) => {
    const windowSize = 3;
    if (total <= windowSize)
      return Array.from({ length: total }, (_, i) => i + 1);

    // start from current page, but clamp so we always have windowSize pages
    let start = current;
    if (start > total - (windowSize - 1)) {
      start = Math.max(1, total - (windowSize - 1));
    }

    return Array.from({ length: windowSize }, (_, i) => start + i).filter(
      (p) => p >= 1 && p <= total
    );
  };

  const pagesToShow = getPagesWindow(totalPages, currentPage);
  const paginationControls = (
    <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2">
      {/* Desktop pagination (visible on sm+) */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className={`h-8 w-8 flex items-center justify-center rounded-full border-2 ${
            currentPage <= 1
              ? "border-gray-200 text-gray-400"
              : "border-gray-200 text-gray-700 hover:opacity-90"
          }`}
        >
          ‹
        </button>

        {pagesToShow.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`h-8 w-8 flex items-center justify-center rounded-full border-2 ${
              currentPage === page
                ? "bg-blue-500 text-white border-blue-500"
                : "border-gray-200 text-gray-700 hover:opacity-90"
            }`}
          >
            {page}
          </button>
        ))}

        {/* forward ellipsis when there are more pages after the window */}
        {pagesToShow[pagesToShow.length - 1] < totalPages && (
          <button
            onClick={() =>
              setCurrentPage(
                Math.min(totalPages, pagesToShow[pagesToShow.length - 1] + 1)
              )
            }
            className="h-8 px-2 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-700 hover:opacity-90"
            aria-label="more-pages"
          >
            ...
          </button>
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className={`h-8 w-8 flex items-center justify-center rounded-full border-2 ${
            currentPage >= totalPages
              ? "border-gray-200 text-gray-400"
              : "border-gray-200 text-gray-700 hover:opacity-90"
          }`}
        >
          ›
        </button>
      </div>

      {/* Mobile pagination (visible on small screens) */}
      <div className="sm:hidden w-full mt-2">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="h-10 w-10 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-700"
          >
            ‹
          </button>
          <div className="inline-flex items-center gap-2">
            {pagesToShow.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 w-10 flex items-center justify-center rounded-full border-2 ${
                  currentPage === page
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}

            {pagesToShow[pagesToShow.length - 1] < totalPages && (
              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(totalPages, pagesToShow[pagesToShow.length - 1] + 1)
                  )
                }
                className="h-10 px-3 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-700"
              >
                ...
              </button>
            )}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-10 w-10 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-700"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );

  // If filters change, reset to page 1. Do NOT call fetchLedgerPage here —
  // setting currentPage will trigger the page/case effect which performs
  // a single request. This avoids duplicate API calls.
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterState, sortOldestFirst]);

  // Fetch when page or case changes
  useEffect(() => {
    // Only depend on the resolvedCaseId and currentPage so we don't
    // trigger two fetches when both `caseId` prop and `activeCase`
    // update independently during mount.
    fetchLedgerPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, resolvedCaseId]);

  // paginatedItems are the filtered items (filters apply to currently fetched page)
  const paginatedItems = filteredItems;

  // helper to compute key metrics for CustomListKeyMetrics
  const calculateMetricsFromData = (data: any[]) => {
    const count = data.length || 0;
    const amounts = data.map((it) =>
      typeof it.originalData?.amount === "number"
        ? it.originalData.amount
        : Number(it.originalData?.amount) || 0
    );
    const totalAmount = amounts.reduce((s, v) => s + v, 0);
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    const avgAmount = amounts.length > 0 ? totalAmount / amounts.length : 0;

    return [
      {
        label: "Count",
        value: count.toLocaleString(),
        icon: "Activity",
        colorScheme: "blue" as const,
      },
      {
        label: "Amount",
        value: `₹${totalAmount.toLocaleString()}`,
        icon: "DollarSign",
        colorScheme: "blue" as const,
      },
      {
        label: "Minimum Amount",
        value: amounts.length > 0 ? `₹${minAmount.toLocaleString()}` : "-",
        icon: "ArrowDown",
        colorScheme: "red" as const,
      },
      {
        label: "Maximum Amount",
        value: amounts.length > 0 ? `₹${maxAmount.toLocaleString()}` : "-",
        icon: "ArrowUp",
        colorScheme: "green" as const,
      },
      {
        label: "Average Amount",
        value:
          amounts.length > 0
            ? `₹${Math.round(avgAmount).toLocaleString()}`
            : "-",
        icon: "BarChart3",
        colorScheme: "purple" as const,
      },
    ];
  };

  const resetFilters = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const defaultFrom = `2020-01-01T00:00`;
    const defaultTo = `${year}-${month}-${day}T23:59`;

    const initial: any = {
      primarySelected: {},
      secondarySelected: {},
      tertiarySelected: {},
      quaternarySelected: {},
      searchbarQueries: {},
      datetimeRanges: {},
    };

    const initializeFilterGroups = (groups: any, isPrimary: boolean) => {
      if (!groups) return;
      groups.forEach((g: any) => {
        if (g.type === "searchbar") initial.searchbarQueries[g.id] = "";
        if (g.type === "timeselect")
          initial.datetimeRanges[g.id] = {
            from: defaultFrom,
            to: defaultTo,
          };

        if (isPrimary) initial.primarySelected[g.id] = g.selectedValues || [];
        else {
          initial.secondarySelected[g.id] = g.selectedValues || [];
          initial.tertiarySelected[g.id] = g.selectedValues || [];
          initial.quaternarySelected[g.id] = g.selectedValues || [];
        }
      });
    };

    initializeFilterGroups((filterGroupsState as any).primary, true);
    initializeFilterGroups((filterGroupsState as any).secondary, false);
    initializeFilterGroups((filterGroupsState as any).tertiary, false);
    initializeFilterGroups((filterGroupsState as any).quaternary, false);

    setFilterState(initial);
    setSortOldestFirst(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Keep page header consistent with other tabs */}
      <InvPageHeader activeCase={activeCase as any} />

      {/* Transaction Ledger section using SectionHeaderWithFlags */}
      <div>
        <SectionHeaderWithFlags
          title="Transaction Ledger"
          icon={Icon || undefined}
          iconColorClass="text-blue-500"
          titleColorClass="text-blue-700"
          positiveFlags={[]}
          negativeFlags={[]}
          neutralFlags={[]}
          // Ensure the header does not render any toggles in its right area
          toggles={[]}
          toggleOptions={[]}
          allowCollapse={false}
        />

        <div className="mt-3">
          {isCollapsed ? (
            <>
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex-1 min-w-0 w-full">
                  <CustomListFilter
                    filterGroups={{ primary: (filterGroupsState as any).primary }}
                    filterState={filterState as any}
                    setFilterState={setFilterState as any}
                    showFilterToggle={false}
                    showToggleOptionCounts={false}
                  />
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setSortOldestFirst(!sortOldestFirst)}
                    className={`rounded-lg px-3 py-2 text-sm border-2 ${
                      sortOldestFirst
                        ? "border-orange-600 text-orange-600"
                        : "border-orange-200 text-orange-600"
                    } hover:opacity-90`}
                  >
                    {sortOldestFirst ? "Newest" : "Oldest"}
                  </button>

                  <button
                    onClick={resetFilters}
                    className="rounded-lg px-3 py-2 text-sm border-2 border-gray-200 text-gray-700 hover:opacity-90"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 w-full">
                <div className="flex-1 min-w-0 w-full">
                  <CustomListFilter
                    filterGroups={{
                      secondary: (filterGroupsState as any).secondary,
                    }}
                    filterState={filterState as any}
                    setFilterState={setFilterState as any}
                    showFilterToggle={false}
                    showToggleOptionCounts={false}
                  />
                </div>

                {paginationControls}
              </div>

              <div className="mt-3 w-full">
                <CustomListFilter
                  filterGroups={{
                    tertiary: (filterGroupsState as any).tertiary,
                  }}
                  filterState={filterState as any}
                  setFilterState={setFilterState as any}
                  showFilterToggle={false}
                  showToggleOptionCounts={false}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex-1 min-w-0 w-full">
                  <CustomListFilter
                    filterGroups={{ primary: (filterGroupsState as any).primary }}
                    filterState={filterState as any}
                    setFilterState={setFilterState as any}
                    showFilterToggle={false}
                    showToggleOptionCounts={false}
                    forceInlineLayout
                  />
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setSortOldestFirst(!sortOldestFirst)}
                    className={`rounded-lg px-3 py-2 text-sm border-2 ${
                      sortOldestFirst
                        ? "border-orange-600 text-orange-600"
                        : "border-orange-200 text-orange-600"
                    } hover:opacity-90`}
                  >
                    {sortOldestFirst ? "Newest" : "Oldest"}
                  </button>

                  <button
                    onClick={resetFilters}
                    className="rounded-lg px-3 py-2 text-sm border-2 border-gray-200 text-gray-700 hover:opacity-90"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-3 w-full">
                <CustomListFilter
                  filterGroups={{ secondary: upiTxnGroups as any }}
                  filterState={filterState as any}
                  setFilterState={setFilterState as any}
                  showFilterToggle={false}
                  showToggleOptionCounts={false}
                  forceInlineLayout
                />
              </div>

              <div className="mt-3 w-full">
                <CustomListFilter
                  filterGroups={{ secondary: ipgPeriodGroups as any }}
                  filterState={filterState as any}
                  setFilterState={setFilterState as any}
                  showFilterToggle={false}
                  showToggleOptionCounts={false}
                  forceInlineLayout
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 w-full flex-wrap">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <CustomListFilter
                    filterGroups={{ tertiary: searchGroups as any }}
                    filterState={filterState as any}
                    setFilterState={setFilterState as any}
                    showFilterToggle={false}
                    showToggleOptionCounts={false}
                    forceInlineLayout
                  />
                </div>
                {paginationControls}
              </div>
            </>
          )}
        </div>

        {/* Key metrics (uses CustomListKeyMetrics design) */}
        <div className="mt-4">
          {/**
           * If transaction statistics are available from the API, build metrics
           * according to the currently selected period and pass them as
           * hardcoded metrics. Otherwise, fall back to the existing
           * calculateMetricsFromData behavior.
           */}
          {(() => {
            const selectedPeriodArr = (filterState as any)?.secondarySelected
              ?.period as string[];
            const selectedPeriod =
              selectedPeriodArr && selectedPeriodArr.length > 0
                ? selectedPeriodArr[0]
                : "Lifetime";
            const periodKey = periodKeyFromSelection(selectedPeriod);

            if (txnStats && Array.isArray(txnStats) && txnStats.length > 0) {
              const findRow = (label: string) =>
                txnStats.find(
                  (r: any) =>
                    String(r.rowLabel || "").toLowerCase() ===
                    label.toLowerCase()
                );

              const totalCountRow = findRow("Total Count");
              const totalAmountRow = findRow("Total Amount");
              const minAmountRow = findRow("Min Amount");
              const maxAmountRow = findRow("Max Amount");
              const avgAmountRow = findRow("Avg Amount");

              const metrics = [
                {
                  label: "Count",
                  value:
                    (totalCountRow && totalCountRow[periodKey]?.allTxn) || "0",
                  icon: totalCountRow?.keyIcon || "Hash",
                  colorScheme: (totalCountRow?.keyIconColor as any) || "blue",
                },
                {
                  label: "Amount",
                  value:
                    (totalAmountRow && totalAmountRow[periodKey]?.allTxn) ||
                    "-",
                  icon: totalAmountRow?.keyIcon || "Banknote",
                  colorScheme: (totalAmountRow?.keyIconColor as any) || "green",
                },
                {
                  label: "Minimum Amount",
                  value:
                    (minAmountRow && minAmountRow[periodKey]?.allTxn) || "-",
                  icon: minAmountRow?.keyIcon || "ArrowDown",
                  colorScheme: (minAmountRow?.keyIconColor as any) || "red",
                },
                {
                  label: "Maximum Amount",
                  value:
                    (maxAmountRow && maxAmountRow[periodKey]?.allTxn) || "-",
                  icon: maxAmountRow?.keyIcon || "ArrowUp",
                  colorScheme: (maxAmountRow?.keyIconColor as any) || "green",
                },
                {
                  label: "Average Amount",
                  value:
                    (avgAmountRow && avgAmountRow[periodKey]?.allTxn) || "-",
                  icon: avgAmountRow?.keyIcon || "Activity",
                  colorScheme: (avgAmountRow?.keyIconColor as any) || "purple",
                },
              ];

              return (
                <CustomListKeyMetrics
                  hardcodedMetrics={metrics}
                  showHeader={false}
                  className="mb-4"
                  gridCols={5}
                />
              );
            }

            return (
              <CustomListKeyMetrics
                calculateMetricsFromData={calculateMetricsFromData}
                filteredData={filteredItems}
                showHeader={false}
                className="mb-4"
                gridCols={5}
              />
            );
          })()}

          {/* Ledger only view (no left txn card) */}
          <div className="mt-4">
            <CustomListLedger
              items={paginatedItems}
              columns={ledgerColumns}
              className="bg-white"
              showHeader={true}
              showTotals={false}
              hideLeftColumn={true}
              rowDivider={true}
            />
          </div>

          {filteredItems.length === 0 && (
            <EmptyState message={`No data found.`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvTransactionLedgerTab;
