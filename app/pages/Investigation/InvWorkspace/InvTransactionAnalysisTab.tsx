"use client";
/* ...existing imports... */
import CustomLoader from "@/components/custom/CustomLoader";
import { EmptyState } from "@/app/pages/Investigation/Components/EmptyState";

import React, { FC, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import InvPageHeader from "../Components/InvPageHeader";
import {
  VolumeAnalysisRow,
  invPatternAnalysisData,
  invVolumeAnalysisData,
  invTransactionCurrencyData,
  invTransactionProxyData,
  invTransactionTimeData,
  invTransactionRegionData,
  TransactionStatusRow,
  TransactionModeRow,
  TransactionCurrencyRow,
  TransactionProxyRow,
  TransactionTimeRow,
  TransactionRegionRow,
  TransactionGatewayRow,
} from "../Sample Data/InvTransactionSampleData";
import {
  fetchVolumeAnalysis,
  VolumeAnalysisApiResponse,
  fetchTransactionStatus,
  TransactionStatusApiResponse,
  fetchTransactionMode,
  TransactionModeApiResponse,
  fetchTransactionRegion,
  TransactionRegionApiResponse,
  fetchTransactionCurrency,
  TransactionCurrencyApiResponse,
  fetchTransactionGateway,
  TransactionGatewayApiResponse,
  fetchTransactionTime,
  TransactionTimeApiResponse,
  fetchTransactionProxy,
  TransactionProxyApiResponse,
  fetchCaseKeyMetrics,
} from "@/app/services/caseServices";
import {
  RedFlag,
  WebsiteAnalysisIconName,
  WebsiteAnalysisValueSentiment,
  WebsiteAnalysisKeyValue,
} from "../Sample Data/InvCasesSampleData";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import {
  getTextColorClass,
  ColorScheme,
} from "@/components/custom/CustomColorScheme";
import {
  iconRegistry,
  getIconByName,
  valueSentimentIconMap,
  type ValueSentiment,
} from "@/components/custom/CustomIconScheme";
import type { LucideIcon } from "lucide-react";
import { KeyMetrics } from "@/components/custom/KeyMetrics";
import WebsiteQualityCard from "@/components/custom/WebsiteQualityCard";
import { BubbleTag } from "@/components/custom/BubbleTag";
import * as merchantOverviewHelpers from "./components/merchantOverviewSampleData";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";

interface InvTransactionAnalysisTabProps {
  merchantId?: string;
  caseId?: string;
}

const InvTransactionAnalysisTab: FC<InvTransactionAnalysisTabProps> = ({
  merchantId,
  caseId,
}) => {
  const { selectedCase } = useInvestigationCaseStore();
  // Artifact panel collapsed state controls grid column counts for WebsiteQualityCard lists
  const artifactPanelCollapsed = useArtifactStore((s) => s.isCollapsed);
  const [selectedStatusToggleOption, setSelectedStatusToggleOption] =
    useState<string>("By Amount");
  const [selectedStatusTransactionType, setSelectedStatusTransactionType] =
    useState<string>("All Transactions");
  const [selectedModeToggleOption, setSelectedModeToggleOption] =
    useState<string>("By Amount");
  const [selectedModeTransactionType, setSelectedModeTransactionType] =
    useState<string>("All Transactions");
  const [selectedVolumeTransactionType, setSelectedVolumeTransactionType] =
    useState<string>("Successful Transactions");
  const [selectedCurrencyToggleOption, setSelectedCurrencyToggleOption] =
    useState<string>("By Amount");
  const [selectedCurrencyTransactionType, setSelectedCurrencyTransactionType] =
    useState<string>("All Transactions");
  const [selectedRegionToggleOption, setSelectedRegionToggleOption] =
    useState<string>("By Amount");
  const [selectedRegionTransactionType, setSelectedRegionTransactionType] =
    useState<string>("All Transactions");
  const [selectedGatewayToggleOption, setSelectedGatewayToggleOption] =
    useState<string>("By Amount");
  const [selectedGatewayTransactionType, setSelectedGatewayTransactionType] =
    useState<string>("All Transactions");
  const [selectedTimeToggleOption, setSelectedTimeToggleOption] =
    useState<string>("By Amount");
  const [selectedTimeTransactionType, setSelectedTimeTransactionType] =
    useState<string>("All Transactions");
  const [selectedProxyToggleOption, setSelectedProxyToggleOption] =
    useState<string>("By Amount");
  const [selectedProxyTransactionType, setSelectedProxyTransactionType] =
    useState<string>("All Transactions");
  const [isMetricsExpanded, setIsMetricsExpanded] = useState<boolean>(false);
  const [isRegionExpanded, setIsRegionExpanded] = useState<boolean>(false);
  // Key Metrics toggle: Count / Amount
  const [selectedKeyMetricsToggleOption, setSelectedKeyMetricsToggleOption] =
    useState<string>("Count");

  // Use centralized icon registry
  const typedIconRegistry = iconRegistry as Record<
    WebsiteAnalysisIconName,
    LucideIcon
  >;
  const typedValueSentimentIconMap = valueSentimentIconMap as Record<
    WebsiteAnalysisValueSentiment,
    { Icon: LucideIcon; color: ColorScheme }
  >;

  // Get toggle icons from registry
  const CheckCircle2Icon = iconRegistry.CheckCircle2;
  const ListIcon = iconRegistry.List;
  const HashIcon = iconRegistry.Hash;
  const CurrencyIcon = iconRegistry.Currency;
  const BarChart3Icon = iconRegistry.BarChart3;
  const AlertTriangleIcon = iconRegistry.AlertTriangle;

  // Helper function to format INR currency with Indian comma formatting
  const formatINRCurrency = (value: string | number): string => {
    if (typeof value === "number") {
      return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }

    if (typeof value === "string") {
      // Check if it's already a currency string
      if (value.startsWith("₹")) {
        // Extract the numeric part
        const numericPart = value.replace("₹", "").replace(/,/g, "").trim();
        const num = parseFloat(numericPart);
        if (!isNaN(num)) {
          return `₹${num.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}`;
        }
      }
      // If it's not a currency string, return as is
      return value;
    }

    return String(value);
  };

  // Helper to parse API amount strings like "₹19,015,818" into numbers for aggregation
  const parseINRCurrencyToNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      // Strip currency symbol and commas, then parse
      const cleaned = value.replace(/₹/g, "").replace(/,/g, "").trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Safe access helpers for nested API cells
  const safeCell = (cell: any) => {
    return {
      byCount: Number(cell?.byCount ?? 0),
      byAmount: cell?.byAmount ?? 0,
      byCountSentiment: cell?.byCountSentiment,
      byAmountSentiment: cell?.byAmountSentiment,
    };
  };

  const safeSimple = (v: any, fallback: any = "-") => {
    // For simple leaf values which might be undefined/null
    if (v === undefined || v === null) return fallback;
    return v;
  };

  // Helper to format API period labels into short headers (e.g., "December_2025" -> "DEC25").
  // Leaves "Lifetime" and non-matching keys unchanged.
  const formatPeriodLabel = (period: string) => {
    if (!period || typeof period !== "string") return period;
    // Match formats like December_2025, DECEMBER-2025, Dec 2025, etc.
    const m = period.match(/([A-Za-z]+)[_\- ]?(\d{4})/);
    if (m) {
      // Use 3-letter month, only first letter capitalized (e.g. Dec)
      const rawMonth = m[1].slice(0, 3);
      const month =
        rawMonth.slice(0, 1).toUpperCase() + rawMonth.slice(1).toLowerCase();
      const year = m[2].slice(-2);
      return `${month}'${year}`;
    }
    return period;
  };

  // Helper function to transform red flags
  const transformRedFlags = (redFlags: RedFlag[] | undefined) => {
    if (!redFlags || redFlags.length === 0) {
      return {
        extremeNegativeFlags: [],
        negativeFlags: [],
        mildNegativeFlags: [],
        neutralFlags: [],
        mildPositiveFlags: [],
        positiveFlags: [],
      };
    }

    const extremeNegativeFlags: any[] = [];
    const negativeFlags: any[] = [];
    const mildNegativeFlags: any[] = [];
    const neutralFlags: any[] = [];

    redFlags.forEach((redFlag: RedFlag) => {
      const severityMap: Record<string, "high" | "medium" | "low"> = {
        High: "high",
        Medium: "medium",
        Low: "low",
      };

      const transformedFlag = {
        id: redFlag.code,
        description: `${redFlag.redFlag}. ${redFlag.reasoning}`,
        isPositive: false,
        category: redFlag.code,
        severity: (severityMap[redFlag.severity] || "medium") as
          | "severe"
          | "high"
          | "medium"
          | "low"
          | "neutral"
          | "good"
          | "veryGood",
      };

      if (redFlag.severity === "High") {
        negativeFlags.push(transformedFlag);
      } else if (redFlag.severity === "Medium") {
        mildNegativeFlags.push(transformedFlag);
      } else if (redFlag.severity === "Low") {
        neutralFlags.push(transformedFlag);
      } else {
        neutralFlags.push(transformedFlag);
      }
    });

    return {
      extremeNegativeFlags,
      negativeFlags,
      mildNegativeFlags,
      neutralFlags,
      mildPositiveFlags: [],
      positiveFlags: [],
    };
  };

  // Columns for Volume Analysis table (minimal - uses existing formatter)
  const volumeAnalysisColumns = useMemo(() => {
    return [
      {
        key: "rowLabel",
        header: "Metric",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => <span className="font-medium">{value}</span>,
      },
      {
        key: "lifetime",
        header: "Lifetime",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="text-gray-700">{formatINRCurrency(value)}</span>
        ),
      },
      {
        key: "past30d",
        header: "Past 30d",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="text-gray-700">{formatINRCurrency(value)}</span>
        ),
      },
      {
        key: "past7d",
        header: "Past 7d",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="text-gray-700">{formatINRCurrency(value)}</span>
        ),
      },
      {
        key: "past1d",
        header: "Past 1d",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="text-gray-700">{formatINRCurrency(value)}</span>
        ),
      },
    ];
  }, []);

  // Fetch volume analysis data from API
  const [volumeAnalysisData, setVolumeAnalysisData] =
    useState<VolumeAnalysisApiResponse | null>(null);
  const [volumeLoading, setVolumeLoading] = useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setVolumeAnalysisData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setVolumeLoading(true);
      try {
        // Fetch real data from the volume-analysis API for the active case
        const resp = await fetchVolumeAnalysis(String(activeCaseId));
        if (!cancelled) {
          setVolumeAnalysisData(
            (resp as VolumeAnalysisApiResponse | null) ?? null
          );
        }
      } catch (err) {
        // If the API errors or returns nothing, clear data so the UI shows the empty state
        console.error("fetchVolumeAnalysis error", err);
        if (!cancelled) {
          setVolumeAnalysisData(null);
        }
      } finally {
        if (!cancelled) setVolumeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  const patternAnalysisData = useMemo(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId || !invPatternAnalysisData[activeCaseId]) return null;
    return invPatternAnalysisData[activeCaseId];
  }, [caseId, selectedCase?.caseId]);

  // Fetch red-flag data (used to surface subrule reasonings in the Transaction & Price Pattern Flags cards)
  const [redFlagsData, setRedFlagsData] = useState<any[] | null>(null);
  const [redFlagsLoading, setRedFlagsLoading] = useState<boolean>(false);

  // Output-format API response (used to drive Transaction Pattern Flags statuses)
  const [outputFormatData, setOutputFormatData] = useState<any | null>(null);
  const [outputFormatLoading, setOutputFormatLoading] = useState(false);
  const [outputFormatError, setOutputFormatError] = useState<any>(null);

  // Red flags data sourced from Decisioning API — not fetched separately here.
  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) { setRedFlagsData(null); return; }
    setRedFlagsData(null);
  }, [caseId, selectedCase?.caseId]);

  // Output-format API removed — clear state immediately.
  useEffect(() => {
    setOutputFormatData(null);
  }, [(selectedCase as any)?.externalMerchantId]);

  // Fetch case-level key-metrics data (used to populate Key Metrics - Past 3 Months)
  const [caseKeyMetricsData, setCaseKeyMetricsData] = useState<Record<
    string,
    any
  > | null>(null);
  const [caseKeyMetricsLoading, setCaseKeyMetricsLoading] = useState(false);

  // Helper to safely read multiple possible key names from API payloads
  const getKeyMetricValue = (
    obj: Record<string, any> | null | undefined,
    candidates: string[]
  ) => {
    if (!obj) return undefined;
    for (const name of candidates) {
      if (obj[name] !== undefined && obj[name] !== null) return obj[name];
      // try lowercase / snake_case variants
      const lower = name.toLowerCase();
      if (obj[lower] !== undefined && obj[lower] !== null) return obj[lower];
      const snake = name.replace(/\s+/g, "_").toLowerCase();
      if (obj[snake] !== undefined && obj[snake] !== null) return obj[snake];
    }
    return undefined;
  };

  useEffect(() => {
    // Use external merchant id as the input to the key-metrics API (merchantId prop or selectedCase.externalMerchantId)
    const activeExternalId =
      merchantId || (selectedCase as any)?.externalMerchantId;
    if (!activeExternalId) {
      setCaseKeyMetricsData(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setCaseKeyMetricsLoading(true);
      try {
        const resp = await fetchCaseKeyMetrics(String(activeExternalId));
        // API may return { data: { ... } } or a flat object; normalize to payload
        const payload = resp && (resp as any).data ? (resp as any).data : resp;
        if (!cancelled) setCaseKeyMetricsData(payload as any);
      } catch (err) {
        if (!cancelled) setCaseKeyMetricsData(null);
      } finally {
        if (!cancelled) setCaseKeyMetricsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [merchantId, (selectedCase as any)?.externalMerchantId]);

  // Fetch transaction status data from API
  const [transactionStatusData, setTransactionStatusData] =
    useState<TransactionStatusApiResponse | null>(null);
  const [transactionStatusLoading, setTransactionStatusLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setTransactionStatusData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setTransactionStatusLoading(true);
      try {
        // Fetch real data from service
        const resp = await fetchTransactionStatus(activeCaseId);
        if (!cancelled)
          setTransactionStatusData(resp as TransactionStatusApiResponse | null);
      } catch (err) {
        // log and clear data on error
        console.error("fetchTransactionStatus error", err);
        if (!cancelled) setTransactionStatusData(null);
      } finally {
        if (!cancelled) setTransactionStatusLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  // Fetch transaction mode data from API
  const [transactionModeData, setTransactionModeData] =
    useState<TransactionModeApiResponse | null>(null);
  const [transactionModeLoading, setTransactionModeLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setTransactionModeData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setTransactionModeLoading(true);
      try {
        const resp = await fetchTransactionMode(activeCaseId);
        if (!cancelled)
          setTransactionModeData(resp as TransactionModeApiResponse | null);
      } catch (err) {
        console.error("fetchTransactionMode error", err);
        if (!cancelled) setTransactionModeData(null);
      } finally {
        if (!cancelled) setTransactionModeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  // Fetch transaction currency data
  const [transactionCurrencyData, setTransactionCurrencyData] =
    useState<TransactionCurrencyApiResponse | null>(null);
  const [transactionCurrencyLoading, setTransactionCurrencyLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setTransactionCurrencyData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setTransactionCurrencyLoading(true);
      try {
        // Fetch real data from the transaction-currency API
        const resp = await fetchTransactionCurrency(String(activeCaseId));
        if (!cancelled) {
          setTransactionCurrencyData(
            (resp as TransactionCurrencyApiResponse | null) ?? null
          );
        }
      } catch (err) {
        console.error("fetchTransactionCurrency error", err);
        if (!cancelled) {
          setTransactionCurrencyData(null);
        }
      } finally {
        if (!cancelled) setTransactionCurrencyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  // Fetch transaction region data
  const [transactionRegionData, setTransactionRegionData] =
    useState<TransactionRegionApiResponse | null>(null);
  const [transactionRegionLoading, setTransactionRegionLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setTransactionRegionData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setTransactionRegionLoading(true);
      try {
        // Fetch real data from the transaction-region API
        const resp = await fetchTransactionRegion(String(activeCaseId));
        if (!cancelled) {
          setTransactionRegionData(
            (resp as TransactionRegionApiResponse | null) ?? null
          );
        }
      } catch (err) {
        console.error("fetchTransactionRegion error", err);
        if (!cancelled) {
          setTransactionRegionData(null);
        }
      } finally {
        if (!cancelled) setTransactionRegionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  // Fetch transaction gateway data
  const [transactionGatewayData, setTransactionGatewayData] =
    useState<TransactionGatewayApiResponse | null>(null);
  const [transactionGatewayLoading, setTransactionGatewayLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setTransactionGatewayData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setTransactionGatewayLoading(true);
      try {
        const resp = await fetchTransactionGateway(activeCaseId);
        if (!cancelled)
          setTransactionGatewayData(
            resp as TransactionGatewayApiResponse | null
          );
      } catch (err) {
        console.error("fetchTransactionGateway error", err);
        if (!cancelled) setTransactionGatewayData(null);
      } finally {
        if (!cancelled) setTransactionGatewayLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  // Fetch transaction time data
  const [transactionTimeData, setTransactionTimeData] =
    useState<TransactionTimeApiResponse | null>(null);
  const [transactionTimeLoading, setTransactionTimeLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setTransactionTimeData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setTransactionTimeLoading(true);
      try {
        // Fetch real data from the transaction-time API
        const resp = await fetchTransactionTime(String(activeCaseId));
        if (!cancelled) {
          setTransactionTimeData(
            (resp as TransactionTimeApiResponse | null) ?? null
          );
        }
      } catch (err) {
        console.error("fetchTransactionTime error", err);
        if (!cancelled) {
          setTransactionTimeData(null);
        }
      } finally {
        if (!cancelled) setTransactionTimeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  // Fetch transaction proxy data
  const [transactionProxyData, setTransactionProxyData] =
    useState<TransactionProxyApiResponse | null>(null);
  const [transactionProxyLoading, setTransactionProxyLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const activeCaseId = caseId || selectedCase?.caseId;
    if (!activeCaseId) {
      setTransactionProxyData(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setTransactionProxyLoading(true);
      try {
        // Fetch real data from the transaction-proxy API
        const resp = await fetchTransactionProxy(String(activeCaseId));
        if (!cancelled) {
          setTransactionProxyData(
            (resp as TransactionProxyApiResponse | null) ?? null
          );
        }
      } catch (err) {
        console.error("fetchTransactionProxy error", err);
        if (!cancelled) {
          setTransactionProxyData(null);
        }
      } finally {
        if (!cancelled) setTransactionProxyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  const volumeMetricsColumns = useMemo(() => {
    return [
      {
        key: "field",
        header: "Field",
        minWidth: "250px",
        align: "left" as const,
        verticalAlign: "top" as const,
        render: (value: string, row: Record<string, any>) => {
          const rowData = row as WebsiteAnalysisKeyValue;
          const IconComponent = rowData.keyIcon
            ? typedIconRegistry[rowData.keyIcon]
            : null;
          const iconColor = rowData.keyIconColor ?? "gray";

          return (
            <span className="flex items-start gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 mt-0.5 shrink-0 ${getTextColorClass(
                    iconColor
                  )}`}
                />
              )}
              <span className="font-semibold text-gray-900">{value}</span>
            </span>
          );
        },
      },
      {
        key: "value",
        header: "Value",
        minWidth: "250px",
        align: "left" as const,
        verticalAlign: "top" as const,
        render: (value: string | string[], row: Record<string, any>) => {
          const rowData = row as WebsiteAnalysisKeyValue;
          const sentimentConfig =
            (rowData.valueSentiment &&
              typedValueSentimentIconMap[rowData.valueSentiment]) ??
            typedValueSentimentIconMap.info;
          const ValueIcon = sentimentConfig.Icon;
          const textColorClass = getTextColorClass(sentimentConfig.color);
          const textValue = Array.isArray(value)
            ? value.join("\n")
            : value || "-";

          return (
            <span className="flex items-start gap-2">
              {ValueIcon && (
                <ValueIcon
                  className={`h-4 w-4 mt-0.5 shrink-0 ${textColorClass}`}
                />
              )}
              <span className={`whitespace-pre-wrap ${textColorClass}`}>
                {textValue}
              </span>
            </span>
          );
        },
      },
    ];
  }, [typedIconRegistry, typedValueSentimentIconMap]);

  const volumeMetricsData = useMemo(() => {
    if (!volumeAnalysisData?.metrics) return [];
    return volumeAnalysisData.metrics;
  }, [volumeAnalysisData]);

  const patternMetricsData = useMemo(() => {
    if (!patternAnalysisData?.data) return [];
    return patternAnalysisData.data;
  }, [patternAnalysisData]);

  // Transform volume analysis data for table display
  const volumeTableData = useMemo(() => {
    if (!volumeAnalysisData?.data) return [];

    return volumeAnalysisData.data.map((row: VolumeAnalysisRow) => {
      const isSuccessfulTxn =
        selectedVolumeTransactionType === "Successful Transactions";
      const isUnsuccessfulTxn =
        selectedVolumeTransactionType === "Unsuccessful Transactions";

      // Select the appropriate data source based on toggle
      let lifetime: any, past30d: any, past7d: any, past1d: any;

      if (isSuccessfulTxn) {
        lifetime = safeSimple(row.lifetime?.successfulTxn);
        past30d = safeSimple(row.past30d?.successfulTxn);
        past7d = safeSimple(row.past7d?.successfulTxn);
        past1d = safeSimple(row.past1d?.successfulTxn);
      } else if (isUnsuccessfulTxn) {
        lifetime = safeSimple(row.lifetime?.unsuccTxn);
        past30d = safeSimple(row.past30d?.unsuccTxn);
        past7d = safeSimple(row.past7d?.unsuccTxn);
        past1d = safeSimple(row.past1d?.unsuccTxn);
      } else {
        // All Transactions
        lifetime = safeSimple(row.lifetime?.allTxn);
        past30d = safeSimple(row.past30d?.allTxn);
        past7d = safeSimple(row.past7d?.allTxn);
        past1d = safeSimple(row.past1d?.allTxn);
      }

      return {
        rowLabel: row.rowLabel,
        keyIcon: row.keyIcon,
        keyIconColor: row.keyIconColor,
        lifetime,
        past30d,
        past7d,
        past1d,
      };
    });
  }, [volumeAnalysisData, selectedVolumeTransactionType]);

  // Treat volume table as "no data" if every row is effectively empty ("-", null, or undefined)
  const hasVolumeData = useMemo(() => {
    if (!volumeTableData || volumeTableData.length === 0) return false;
    return volumeTableData.some((row: any) => {
      return ["lifetime", "past30d", "past7d", "past1d"].some((key) => {
        const v = row[key];
        return v !== "-" && v !== null && v !== undefined && v !== "";
      });
    });
  }, [volumeTableData]);

  // Transform transaction status data for table display
  const statusTableData = useMemo(() => {
    if (!transactionStatusData?.data) return [];
    // Build rows and also copy per-period raw values so dynamic columns can read them
    const periods: string[] = transactionStatusData.periods || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    const rows = transactionStatusData.data.map((row: TransactionStatusRow) => {
      const isByCount = selectedStatusToggleOption === "By Count";
      const isSuccessfulTxn =
        selectedStatusTransactionType === "Successful Transactions";
      const isUnsuccessfulTxn =
        selectedStatusTransactionType === "Unsuccessful Transactions";

      // helper to pick subcell for a given period object
      const pickSubCell = (periodObj: any) => {
        if (!periodObj)
          return {
            byCount: 0,
            byAmount: 0,
            byCountSentiment: undefined,
            byAmountSentiment: undefined,
          };
        if (isSuccessfulTxn) return safeCell(periodObj.succTxn);
        if (isUnsuccessfulTxn) return safeCell(periodObj.unsuccTxn);
        return safeCell(periodObj.allTxn);
      };

      const lifetimeCell = pickSubCell(row.lifetime);
      const past30dCell = pickSubCell(row.past30d);
      const past7dCell = pickSubCell(row.past7d);
      const past1dCell = pickSubCell(row.past1d);

      // base object with legacy keys (kept for totals and existing UI)
      const out: any = {
        rowLabel: row.rowLabel,
        keyIcon: row.keyIcon,
        keyIconColor: row.keyIconColor,
        lifetime: isByCount ? lifetimeCell.byCount : lifetimeCell.byAmount,
        lifetimeSentiment: isByCount
          ? lifetimeCell.byCountSentiment
          : lifetimeCell.byAmountSentiment,
        past30d: isByCount ? past30dCell.byCount : past30dCell.byAmount,
        past30dSentiment: isByCount
          ? past30dCell.byCountSentiment
          : past30dCell.byAmountSentiment,
        past7d: isByCount ? past7dCell.byCount : past7dCell.byAmount,
        past7dSentiment: isByCount
          ? past7dCell.byCountSentiment
          : past7dCell.byAmountSentiment,
        past1d: isByCount ? past1dCell.byCount : past1dCell.byAmount,
        past1dSentiment: isByCount
          ? past1dCell.byCountSentiment
          : past1dCell.byAmountSentiment,
      };

      // copy each API period into the output row (honor toggles)
      periods.forEach((period) => {
        const apiCell = pickSubCell(
          (row as any)[period] || (row as any)[period.toLowerCase()]
        );
        out[period] = isByCount ? apiCell.byCount : apiCell.byAmount;
        out[`${period}Sentiment`] = isByCount
          ? apiCell.byCountSentiment
          : apiCell.byAmountSentiment;
      });

      return out;
    });

    // Append a totals row (sums across the produced rows). Keep same units (count vs amount)
    try {
      const totalRow: Record<string, any> = {
        rowLabel: "Total",
        keyIcon: undefined,
        keyIconColor: "gray",
      };

      // helper to sum a key safely depending on toggle (count vs amount)
      const sumRowsForKey = (key: string) => {
        const isByCount = selectedStatusToggleOption === "By Count";
        if (isByCount) {
          return rows.reduce(
            (acc: number, r: any) => acc + Number(r[key] || 0),
            0
          );
        }
        // amount mode - parse currency strings to numbers before summing
        return rows.reduce(
          (acc: number, r: any) => acc + parseINRCurrencyToNumber(r[key] || 0),
          0
        );
      };

      // sum legacy keys
      totalRow.lifetime = sumRowsForKey("lifetime");
      totalRow.past30d = sumRowsForKey("past30d");
      totalRow.past7d = sumRowsForKey("past7d");
      totalRow.past1d = sumRowsForKey("past1d");

      // Also sum any dynamic period keys from the API (e.g., custom periods)
      const apiPeriods: string[] = transactionStatusData.periods || [
        "Lifetime",
        "past30d",
        "past7d",
        "past1d",
      ];
      apiPeriods.forEach((period) => {
        totalRow[period] = sumRowsForKey(period);
      });

      // If the API already provided a totals row labeled 'Total', avoid
      // appending another one to prevent duplicate totals showing in the UI.
      const hasTotalAlready = rows.some(
        (r: any) => String(r.rowLabel || "").toLowerCase() === "total"
      );
      if (hasTotalAlready) return rows;
      return [...rows, totalRow];
    } catch (e) {
      return rows;
    }
  }, [
    transactionStatusData,
    selectedStatusToggleOption,
    selectedStatusTransactionType,
  ]);

  // Determine totals format based on toggle option
  const statusTotalsFormat = useMemo(() => {
    return selectedStatusToggleOption === "By Count" ? "count" : "currency";
  }, [selectedStatusToggleOption]);

  // Transform transaction mode data for table display
  const modeTableData = useMemo(() => {
    if (!transactionModeData?.data) return [];

    // Build rows and also copy per-period raw values so dynamic columns can read them
    const periods: string[] = transactionModeData.periods || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    const rows = transactionModeData.data.map((row: TransactionModeRow) => {
      const isByCount = selectedModeToggleOption === "By Count";
      const isSuccessfulTxn =
        selectedModeTransactionType === "Successful Transactions";
      const isUnsuccessfulTxn =
        selectedModeTransactionType === "Unsuccessful Transactions";

      // helper to pick subcell for a given period object
      const pickSubCell = (periodObj: any) => {
        if (!periodObj)
          return {
            byCount: 0,
            byAmount: 0,
            byCountSentiment: undefined,
            byAmountSentiment: undefined,
          };
        if (isSuccessfulTxn) return safeCell(periodObj.succTxn);
        if (isUnsuccessfulTxn) return safeCell(periodObj.unsuccTxn);
        return safeCell(periodObj.allTxn);
      };

      const lifetimeCell = pickSubCell(row.lifetime);
      const past30dCell = pickSubCell(row.past30d);
      const past7dCell = pickSubCell(row.past7d);
      const past1dCell = pickSubCell(row.past1d);

      // base object with legacy keys (kept for totals and existing UI)
      const out: any = {
        rowLabel: row.rowLabel,
        keyIcon: row.keyIcon,
        keyIconColor: row.keyIconColor,
        lifetime: isByCount ? lifetimeCell.byCount : lifetimeCell.byAmount,
        lifetimeSentiment: isByCount
          ? lifetimeCell.byCountSentiment
          : lifetimeCell.byAmountSentiment,
        past30d: isByCount ? past30dCell.byCount : past30dCell.byAmount,
        past30dSentiment: isByCount
          ? past30dCell.byCountSentiment
          : past30dCell.byAmountSentiment,
        past7d: isByCount ? past7dCell.byCount : past7dCell.byAmount,
        past7dSentiment: isByCount
          ? past7dCell.byCountSentiment
          : past7dCell.byAmountSentiment,
        past1d: isByCount ? past1dCell.byCount : past1dCell.byAmount,
        past1dSentiment: isByCount
          ? past1dCell.byCountSentiment
          : past1dCell.byAmountSentiment,
      };

      // copy each API period into the output row (honor toggles)
      periods.forEach((period) => {
        const periodObj =
          (row as any)[period] ?? (row as any)[period.toLowerCase()];
        const sub = pickSubCell(periodObj);
        out[period] = isByCount ? sub.byCount : sub.byAmount;
        // also attach a sentiment key if needed later
        out[`${period}Sentiment`] = isByCount
          ? sub.byCountSentiment
          : sub.byAmountSentiment;
      });

      // If API didn't provide an icon/key, try to infer one from the label or
      // normalize any variant key the API may return into a known registry key.
      if (!out.keyIcon) {
        const lbl = String(row.rowLabel || "").toLowerCase();

        // Common normalized variants -> registry key mapping
        const variantMap: Record<string, string> = {
          // UPI variants
          upi: "Hash",
          upiintent: "Hash",
          "upi-intent": "Hash",
          "upi-collect": "Hash",
          upi_collect: "Hash",
          "upi others": "Currency",
          "upi-others": "Currency",
          upi_others: "Currency",

          // Card variants
          credit: "CreditCard",
          creditcard: "CreditCard",
          "credit-card": "CreditCard",
          cc: "CreditCard",
          debit: "DebitCard",
          debitcard: "DebitCard",
          "debit-card": "DebitCard",
        };

        // try to match using label
        for (const k of Object.keys(variantMap)) {
          if (lbl.includes(k)) {
            out.keyIcon = variantMap[k];
            break;
          }
        }

        // fallback: try simple keywords
        if (!out.keyIcon) {
          if (lbl.includes("upi")) {
            out.keyIcon = "Hash";
          } else if (lbl.includes("credit") || lbl.includes("cc")) {
            out.keyIcon = "CreditCard";
          } else if (lbl.includes("debit")) {
            out.keyIcon = "DebitCard";
          }
        }

        // set sensible default colors when we inferred an icon
        if (out.keyIcon && !out.keyIconColor) {
          if (out.keyIcon === "Hash") out.keyIconColor = "emerald";
          else if (out.keyIcon === "CreditCard") out.keyIconColor = "indigo";
          else if (out.keyIcon === "DebitCard") out.keyIconColor = "sky";
          else out.keyIconColor = "gray";
        }
      }

      // Force overrides for specific labels regardless of API-provided icon
      try {
        const lbl = String(row.rowLabel || "").toLowerCase();
        // UPI - others should show rupee/currency icon
        if (
          lbl.includes("upi") &&
          (lbl.includes("other") || lbl.includes("others"))
        ) {
          out.keyIcon = "Currency";
          out.keyIconColor = out.keyIconColor || "indigo";
        }
      } catch (e) {
        // ignore
      }

      return out;
    });

    // Append a totals row (sums across the produced rows). Keep same units (count vs amount)
    try {
      const totalRow: Record<string, any> = {
        rowLabel: "Total",
        keyIcon: undefined,
        keyIconColor: "gray",
      };

      const sumRowsForKey = (key: string) => {
        const isByCount = selectedModeToggleOption === "By Count";
        if (isByCount) {
          return rows.reduce(
            (acc: number, r: any) => acc + Number(r[key] || 0),
            0
          );
        }
        return rows.reduce(
          (acc: number, r: any) => acc + parseINRCurrencyToNumber(r[key] || 0),
          0
        );
      };

      // sum legacy keys
      totalRow.lifetime = sumRowsForKey("lifetime");
      totalRow.past30d = sumRowsForKey("past30d");
      totalRow.past7d = sumRowsForKey("past7d");
      totalRow.past1d = sumRowsForKey("past1d");

      // Also sum any dynamic period keys from the API (e.g., custom periods)
      const periods: string[] = transactionModeData.periods || [
        "Lifetime",
        "past30d",
        "past7d",
        "past1d",
      ];
      periods.forEach((period) => {
        totalRow[period] = sumRowsForKey(period);
      });

      // If the API already provided a totals row labeled 'Total', avoid
      // appending another one to prevent duplicate totals showing in the UI.
      const hasTotalAlready = rows.some(
        (r: any) => String(r.rowLabel || "").toLowerCase() === "total"
      );
      if (hasTotalAlready) return rows;
      return [...rows, totalRow];
    } catch (e) {
      // If anything goes wrong, fallback to returning the rows without totals
      return rows;
    }
  }, [
    transactionModeData,
    selectedModeToggleOption,
    selectedModeTransactionType,
  ]);

  // Transform transaction currency data for table display
  const currencyTableData = useMemo(() => {
    if (!transactionCurrencyData?.data) return [];

    const rows = (transactionCurrencyData?.data || []).map(
      (row: TransactionCurrencyRow) => {
        const isByCount = selectedCurrencyToggleOption === "By Count";
        const isSuccessfulTxn =
          selectedCurrencyTransactionType === "Successful Transactions";
        const isUnsuccessfulTxn =
          selectedCurrencyTransactionType === "Unsuccessful Transactions";

        const pickSubCell = (periodObj: any) => {
          if (!periodObj)
            return {
              byCount: 0,
              byAmount: 0,
              byCountSentiment: undefined,
              byAmountSentiment: undefined,
            };
          if (isSuccessfulTxn) return safeCell(periodObj.succTxn);
          if (isUnsuccessfulTxn) return safeCell(periodObj.unsuccTxn);
          return safeCell(periodObj.allTxn);
        };

        const periods: string[] = transactionCurrencyData.periods || [
          "Lifetime",
          "past30d",
          "past7d",
          "past1d",
        ];

        const lifetimeCell = pickSubCell(row.lifetime);

        const out: any = {
          rowLabel: row.rowLabel,
          keyIcon: row.keyIcon,
          keyIconColor: row.keyIconColor,
          lifetime: isByCount ? lifetimeCell.byCount : lifetimeCell.byAmount,
        };

        // copy each API period into the output row (honor toggles)
        periods.forEach((period) => {
          const apiCell = pickSubCell(
            (row as any)[period] || (row as any)[period.toLowerCase()]
          );
          out[period] = isByCount ? apiCell.byCount : apiCell.byAmount;
          out[`${period}Sentiment`] = isByCount
            ? apiCell.byCountSentiment
            : apiCell.byAmountSentiment;
        });

        return out;
      }
    );

    try {
      const totalRow: Record<string, any> = {
        rowLabel: "Total",
        keyIcon: undefined,
        keyIconColor: "gray",
      };

      const isByCountGlobal = selectedCurrencyToggleOption === "By Count";

      const sumRowsForKey = (key: string) => {
        if (isByCountGlobal) {
          return rows.reduce(
            (acc: number, r: any) => acc + Number(r[key] || 0),
            0
          );
        }
        return rows.reduce(
          (acc: number, r: any) => acc + parseINRCurrencyToNumber(r[key] || 0),
          0
        );
      };

      totalRow.lifetime = sumRowsForKey("lifetime");
      totalRow.past30d = sumRowsForKey("past30d");
      totalRow.past7d = sumRowsForKey("past7d");
      totalRow.past1d = sumRowsForKey("past1d");

      const periods: string[] = transactionCurrencyData.periods || [
        "Lifetime",
        "past30d",
        "past7d",
        "past1d",
      ];
      periods.forEach((period) => {
        totalRow[period] = sumRowsForKey(period);
      });

      // If the API already provided a totals row labeled 'Total', avoid
      // appending another one to prevent duplicate totals showing in the UI.
      const hasTotalAlready = rows.some(
        (r: any) => String(r.rowLabel || "").toLowerCase() === "total"
      );
      if (hasTotalAlready) return rows;
      return [...rows, totalRow];
    } catch (e) {
      return rows;
    }
  }, [
    transactionCurrencyData,
    selectedCurrencyToggleOption,
    selectedCurrencyTransactionType,
  ]);

  // Transform transaction region data for table display
  const regionTableData = useMemo(() => {
    if (!transactionRegionData?.data) return [];
    const rows = transactionRegionData.data.map((row: TransactionRegionRow) => {
      const isByCount = selectedRegionToggleOption === "By Count";
      const isSuccessfulTxn =
        selectedRegionTransactionType === "Successful Transactions";
      const isUnsuccessfulTxn =
        selectedRegionTransactionType === "Unsuccessful Transactions";

      const pickSubCell = (periodObj: any) => {
        if (!periodObj)
          return {
            byCount: 0,
            byAmount: 0,
            byCountSentiment: undefined,
            byAmountSentiment: undefined,
          };
        if (isSuccessfulTxn) return safeCell(periodObj.succTxn);
        if (isUnsuccessfulTxn) return safeCell(periodObj.unsuccTxn);
        return safeCell(periodObj.allTxn);
      };

      const periods: string[] = transactionRegionData.periods || [
        "Lifetime",
        "past30d",
        "past7d",
        "past1d",
      ];

      const lifetimeCell = pickSubCell(row.lifetime);

      const out: any = {
        rowLabel: row.rowLabel,
        keyIcon: row.keyIcon,
        keyIconColor: row.keyIconColor,
        lifetime: isByCount ? lifetimeCell.byCount : lifetimeCell.byAmount,
      };

      periods.forEach((period) => {
        const apiCell = pickSubCell(
          (row as any)[period] || (row as any)[period.toLowerCase()]
        );
        out[period] = isByCount ? apiCell.byCount : apiCell.byAmount;
        out[`${period}Sentiment`] = isByCount
          ? apiCell.byCountSentiment
          : apiCell.byAmountSentiment;
      });

      return out;
    });

    try {
      const totalRow: Record<string, any> = {
        rowLabel: "Total",
        keyIcon: undefined,
        keyIconColor: "gray",
      };

      const isByCountGlobal = selectedRegionToggleOption === "By Count";

      const sumRowsForKey = (key: string) => {
        if (isByCountGlobal) {
          return rows.reduce(
            (acc: number, r: any) => acc + Number(r[key] || 0),
            0
          );
        }
        return rows.reduce(
          (acc: number, r: any) => acc + parseINRCurrencyToNumber(r[key] || 0),
          0
        );
      };

      totalRow.lifetime = sumRowsForKey("lifetime");
      totalRow.past30d = sumRowsForKey("past30d");
      totalRow.past7d = sumRowsForKey("past7d");
      totalRow.past1d = sumRowsForKey("past1d");

      const periods: string[] = transactionRegionData.periods || [
        "Lifetime",
        "past30d",
        "past7d",
        "past1d",
      ];
      periods.forEach((period) => {
        totalRow[period] = sumRowsForKey(period);
      });

      // If the API already provided a totals row labeled 'Total', avoid
      // appending another one to prevent duplicate totals showing in the UI.
      const hasTotalAlready = rows.some(
        (r: any) => String(r.rowLabel || "").toLowerCase() === "total"
      );

      // Sort data rows by lifetime (descending) by default. We exclude any
      // pre-existing 'Total' row from sorting and keep it at the end.
      const dataRows = rows.filter(
        (r: any) => String(r.rowLabel || "").toLowerCase() !== "total"
      );

      const sortedRows = dataRows.slice().sort((a: any, b: any) => {
        // Use parseINRCurrencyToNumber to safely handle currency strings or numbers
        const aNum = parseINRCurrencyToNumber(a?.lifetime);
        const bNum = parseINRCurrencyToNumber(b?.lifetime);
        return bNum - aNum;
      });

      if (hasTotalAlready) {
        const existingTotal = rows.find(
          (r: any) => String(r.rowLabel || "").toLowerCase() === "total"
        );
        return existingTotal ? [...sortedRows, existingTotal] : sortedRows;
      }

      return [...sortedRows, totalRow];
    } catch (e) {
      return rows;
    }
  }, [
    transactionRegionData,
    selectedRegionToggleOption,
    selectedRegionTransactionType,
  ]);

  // Transform transaction gateway data for table display
  const gatewayTableData = useMemo(() => {
    if (!transactionGatewayData?.data) return [];
    // Build rows and also copy per-period raw values so dynamic columns can read them
    const periods: string[] = transactionGatewayData.periods || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    return (transactionGatewayData?.data || []).map(
      (row: TransactionGatewayRow) => {
        const isByCount = selectedGatewayToggleOption === "By Count";
        const isSuccessfulTxn =
          selectedGatewayTransactionType === "Successful Transactions";
        const isUnsuccessfulTxn =
          selectedGatewayTransactionType === "Unsuccessful Transactions";

        const pickSubCell = (periodObj: any) => {
          if (!periodObj)
            return {
              byCount: 0,
              byAmount: 0,
              byCountSentiment: undefined,
              byAmountSentiment: undefined,
            };
          if (isSuccessfulTxn) return safeCell(periodObj.succTxn);
          if (isUnsuccessfulTxn) return safeCell(periodObj.unsuccTxn);
          return safeCell(periodObj.allTxn);
        };

        const lifetimeCell = pickSubCell(row.lifetime);
        const past30dCell = pickSubCell(row.past30d);
        const past7dCell = pickSubCell(row.past7d);
        const past1dCell = pickSubCell(row.past1d);

        const out: any = {
          rowLabel: row.rowLabel,
          keyIcon: row.keyIcon,
          keyIconColor: row.keyIconColor,
          lifetime: isByCount ? lifetimeCell.byCount : lifetimeCell.byAmount,
          past30d: isByCount ? past30dCell.byCount : past30dCell.byAmount,
          past7d: isByCount ? past7dCell.byCount : past7dCell.byAmount,
          past1d: isByCount ? past1dCell.byCount : past1dCell.byAmount,
        };

        // copy each API period into the output row (honor toggles)
        periods.forEach((period) => {
          const apiCell = pickSubCell(
            (row as any)[period] || (row as any)[period.toLowerCase()]
          );
          out[period] = isByCount ? apiCell.byCount : apiCell.byAmount;
          out[`${period}Sentiment`] = isByCount
            ? apiCell.byCountSentiment
            : apiCell.byAmountSentiment;
        });

        return out;
      }
    );
  }, [
    transactionGatewayData,
    selectedGatewayToggleOption,
    selectedGatewayTransactionType,
  ]);

  // Transform transaction time data for table display
  const timeTableData = useMemo(() => {
    if (!transactionTimeData?.data) return [];

    const rows = (transactionTimeData?.data || []).map(
      (row: TransactionTimeRow) => {
        const isByCount = selectedTimeToggleOption === "By Count";
        const isSuccessfulTxn =
          selectedTimeTransactionType === "Successful Transactions";
        const isUnsuccessfulTxn =
          selectedTimeTransactionType === "Unsuccessful Transactions";

        const pickSubCell = (periodObj: any) => {
          if (!periodObj)
            return {
              byCount: 0,
              byAmount: 0,
              byCountSentiment: undefined,
              byAmountSentiment: undefined,
            };
          if (isSuccessfulTxn) return safeCell(periodObj.succTxn);
          if (isUnsuccessfulTxn) return safeCell(periodObj.unsuccTxn);
          return safeCell(periodObj.allTxn);
        };

        const periods: string[] = transactionTimeData.periods || [
          "Lifetime",
          "past30d",
          "past7d",
          "past1d",
        ];

        const lifetimeCell = pickSubCell(row.lifetime);

        const out: any = {
          rowLabel: row.rowLabel,
          keyIcon: row.keyIcon,
          keyIconColor: row.keyIconColor,
          lifetime: isByCount ? lifetimeCell.byCount : lifetimeCell.byAmount,
        };

        periods.forEach((period) => {
          const apiCell = pickSubCell(
            (row as any)[period] || (row as any)[period.toLowerCase()]
          );
          out[period] = isByCount ? apiCell.byCount : apiCell.byAmount;
          out[`${period}Sentiment`] = isByCount
            ? apiCell.byCountSentiment
            : apiCell.byAmountSentiment;
        });

        return out;
      }
    );

    try {
      const totalRow: Record<string, any> = {
        rowLabel: "Total",
        keyIcon: undefined,
        keyIconColor: "gray",
      };

      const isByCountGlobal = selectedTimeToggleOption === "By Count";

      const sumRowsForKey = (key: string) => {
        if (isByCountGlobal) {
          return rows.reduce(
            (acc: number, r: any) => acc + Number(r[key] || 0),
            0
          );
        }
        return rows.reduce(
          (acc: number, r: any) => acc + parseINRCurrencyToNumber(r[key] || 0),
          0
        );
      };

      totalRow.lifetime = sumRowsForKey("lifetime");
      totalRow.past30d = sumRowsForKey("past30d");
      totalRow.past7d = sumRowsForKey("past7d");
      totalRow.past1d = sumRowsForKey("past1d");

      const periods: string[] = transactionTimeData.periods || [
        "Lifetime",
        "past30d",
        "past7d",
        "past1d",
      ];
      periods.forEach((period) => {
        totalRow[period] = sumRowsForKey(period);
      });

      // If the API already provided a totals row labeled 'Total', avoid
      // appending another one to prevent duplicate totals showing in the UI.
      const hasTotalAlready = rows.some(
        (r: any) => String(r.rowLabel || "").toLowerCase() === "total"
      );
      if (hasTotalAlready) return rows;
      return [...rows, totalRow];
    } catch (e) {
      return rows;
    }
  }, [
    transactionTimeData,
    selectedTimeToggleOption,
    selectedTimeTransactionType,
  ]);

  // Transform transaction proxy data for table display
  const proxyTableData = useMemo(() => {
    if (!transactionProxyData?.data) return [];

    const rows = (transactionProxyData?.data || []).map(
      (row: TransactionProxyRow) => {
        const isByCount = selectedProxyToggleOption === "By Count";
        const isSuccessfulTxn =
          selectedProxyTransactionType === "Successful Transactions";
        const isUnsuccessfulTxn =
          selectedProxyTransactionType === "Unsuccessful Transactions";

        const pickSubCell = (periodObj: any) => {
          if (!periodObj)
            return {
              byCount: 0,
              byAmount: 0,
              byCountSentiment: undefined,
              byAmountSentiment: undefined,
            };
          if (isSuccessfulTxn) return safeCell(periodObj.succTxn);
          if (isUnsuccessfulTxn) return safeCell(periodObj.unsuccTxn);
          return safeCell(periodObj.allTxn);
        };

        const periods: string[] = transactionProxyData.periods || [
          "Lifetime",
          "past30d",
          "past7d",
          "past1d",
        ];

        const lifetimeCell = pickSubCell(row.lifetime);

        const out: any = {
          rowLabel: row.rowLabel,
          keyIcon: row.keyIcon,
          keyIconColor: row.keyIconColor,
          lifetime: isByCount ? lifetimeCell.byCount : lifetimeCell.byAmount,
        };

        periods.forEach((period) => {
          const apiCell = pickSubCell(
            (row as any)[period] || (row as any)[period.toLowerCase()]
          );
          out[period] = isByCount ? apiCell.byCount : apiCell.byAmount;
          out[`${period}Sentiment`] = isByCount
            ? apiCell.byCountSentiment
            : apiCell.byAmountSentiment;
        });

        return out;
      }
    );

    try {
      const totalRow: Record<string, any> = {
        rowLabel: "Total",
        keyIcon: undefined,
        keyIconColor: "gray",
      };

      const isByCountGlobal = selectedProxyToggleOption === "By Count";

      const sumRowsForKey = (key: string) => {
        if (isByCountGlobal) {
          return rows.reduce(
            (acc: number, r: any) => acc + Number(r[key] || 0),
            0
          );
        }
        return rows.reduce(
          (acc: number, r: any) => acc + parseINRCurrencyToNumber(r[key] || 0),
          0
        );
      };

      totalRow.lifetime = sumRowsForKey("lifetime");
      totalRow.past30d = sumRowsForKey("past30d");
      totalRow.past7d = sumRowsForKey("past7d");
      totalRow.past1d = sumRowsForKey("past1d");

      const periods: string[] = transactionProxyData.periods || [
        "Lifetime",
        "past30d",
        "past7d",
        "past1d",
      ];
      periods.forEach((period) => {
        totalRow[period] = sumRowsForKey(period);
      });

      // If the API already provided a totals row labeled 'Total', avoid
      // appending another one to prevent duplicate totals showing in the UI.
      const hasTotalAlready = rows.some(
        (r: any) => String(r.rowLabel || "").toLowerCase() === "total"
      );
      if (hasTotalAlready) return rows;
      return [...rows, totalRow];
    } catch (e) {
      return rows;
    }
  }, [
    transactionProxyData,
    selectedProxyToggleOption,
    selectedProxyTransactionType,
  ]);

  // Determine totals format based on toggle option
  const modeTotalsFormat = useMemo(() => {
    return selectedModeToggleOption === "By Count" ? "count" : "currency";
  }, [selectedModeToggleOption]);

  const currencyTotalsFormat = useMemo(() => {
    return selectedCurrencyToggleOption === "By Count" ? "count" : "currency";
  }, [selectedCurrencyToggleOption, transactionCurrencyData]);

  const regionTotalsFormat = useMemo(() => {
    return selectedRegionToggleOption === "By Count" ? "count" : "currency";
  }, [selectedRegionToggleOption, transactionRegionData]);

  const gatewayTotalsFormat = useMemo(() => {
    return selectedGatewayToggleOption === "By Count" ? "count" : "currency";
  }, [selectedGatewayToggleOption]);

  const timeTotalsFormat = useMemo(() => {
    return selectedTimeToggleOption === "By Count" ? "count" : "currency";
  }, [selectedTimeToggleOption, transactionTimeData]);

  const proxyTotalsFormat = useMemo(() => {
    return selectedProxyToggleOption === "By Count" ? "count" : "currency";
  }, [selectedProxyToggleOption, transactionProxyData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Aggregated gateway summary rows: use raw API values for lifetime/past columns
  const gatewaySummaryData = useMemo(() => {
    if (
      !transactionGatewayData?.data ||
      transactionGatewayData.data.length === 0
    )
      return [];

    const isByCount = selectedGatewayToggleOption === "By Count";
    const firstRow = transactionGatewayData.data[0] as TransactionGatewayRow;
    // Prefer explicit mapping: API uses rowLabel 'True' and 'False'.
    // Treat 'True' as Successful and 'False' as Unsuccessful. Fall back to firstRow if missing.
    const trueRow = transactionGatewayData.data.find(
      (r: any) => String(r.rowLabel).toLowerCase() === "true"
    ) as TransactionGatewayRow | undefined;
    const falseRow = transactionGatewayData.data.find(
      (r: any) => String(r.rowLabel).toLowerCase() === "false"
    ) as TransactionGatewayRow | undefined;

    // Helper to pick a succTxn/unsuccTxn cell from a row for a given period key.
    const pickPeriodCell = (
      row: TransactionGatewayRow | undefined,
      periodKey: string,
      subKey: "succTxn" | "unsuccTxn" | "allTxn"
    ) => {
      if (!row) return { byCount: 0, byAmount: 0 };

      // Try a few key variants: exact, lowercase, snake_case lowercase
      const candidates = [
        periodKey,
        periodKey.toLowerCase(),
        periodKey.replace(/\s+/g, "_"),
        periodKey.replace(/\s+/g, "_").toLowerCase(),
      ];

      for (const k of candidates) {
        const cell = (row as any)[k]?.[subKey];
        if (cell !== undefined && cell !== null) return cell;
      }

      // As a last resort try legacy keys used elsewhere in the file (lowercase names)
      const legacy = (row as any)[periodKey.toLowerCase()]?.[subKey];
      if (legacy !== undefined && legacy !== null) return legacy;

      return { byCount: 0, byAmount: 0 };
    };

    const periods: string[] = (transactionGatewayData &&
      transactionGatewayData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    const asCell = (cell: any) =>
      isByCount ? Number(cell.byCount || 0) : cell.byAmount || 0;

    // initialize rows
    const successfulRow: Record<string, any> = { rowLabel: "Successful" };
    const unsuccessfulRow: Record<string, any> = { rowLabel: "Unsuccessful" };
    const totalRow: Record<string, any> = { rowLabel: "Total" };
    const failureRow: Record<string, any> = { rowLabel: "Failure rate %" };

    // Ensure summary rows have explicit icons/colors so they render correctly
    successfulRow.keyIcon = "CheckCircle2";
    successfulRow.keyIconColor = "green";
    unsuccessfulRow.keyIcon = "Ban";
    unsuccessfulRow.keyIconColor = "red";
    totalRow.keyIcon = "Hash";
    totalRow.keyIconColor = "gray";
    failureRow.keyIcon = "AlertTriangle";
    failureRow.keyIconColor = "red";

    // aggregate counts/amounts across rows for lifetime fallback if needed
    let aggSuccCount = 0;
    let aggUnsuccCount = 0;
    transactionGatewayData.data.forEach((row: TransactionGatewayRow) => {
      const succ = pickPeriodCell(row, "Lifetime", "succTxn");
      const unsucc = pickPeriodCell(row, "Lifetime", "unsuccTxn");
      aggSuccCount += Number(succ?.byCount || 0);
      aggUnsuccCount += Number(unsucc?.byCount || 0);
    });

    // populate each period column
    periods.forEach((period) => {
      // succ/unsucc cells prefer trueRow/falseRow respectively, fall back to firstRow
      const succCell = pickPeriodCell(trueRow ?? firstRow, period, "succTxn");
      const unsuccCell = pickPeriodCell(
        falseRow ?? firstRow,
        period,
        "unsuccTxn"
      );
      const allCell = pickPeriodCell(firstRow, period, "allTxn");

      // set values for Successful / Unsuccessful
      // keep the cell values as-is (counts or raw amounts) so UI renderers can format
      successfulRow[period] = asCell(succCell);
      unsuccessfulRow[period] = asCell(unsuccCell);

      // compute Total = Successful + Unsuccessful (strict sum)
      if (isByCount) {
        const succCount = Number(succCell?.byCount || 0);
        const unsuccCount = Number(unsuccCell?.byCount || 0);
        const totalCount = succCount + unsuccCount;
        totalRow[period] = totalCount;

        // compute failure rate as unsuccessful/total
        const failurePct =
          totalCount > 0 ? (unsuccCount / totalCount) * 100 : 0;
        failureRow[period] = failurePct;
      } else {
        const succAmt = parseINRCurrencyToNumber(succCell?.byAmount);
        const unsuccAmt = parseINRCurrencyToNumber(unsuccCell?.byAmount);
        const totalAmt = succAmt + unsuccAmt;
        // store numeric total amount (formatters will display it as currency)
        totalRow[period] = totalAmt;

        // compute failure rate as unsuccessful/total
        const failurePct = totalAmt > 0 ? (unsuccAmt / totalAmt) * 100 : 0;
        failureRow[period] = failurePct;
      }
    });

    return [successfulRow, unsuccessfulRow, totalRow, failureRow];
  }, [transactionGatewayData, selectedGatewayToggleOption]);

  // Columns for Status Analysis table
  const statusAnalysisColumns = useMemo(() => {
    // base first column (Status label + icon)
    const cols: any[] = [
      {
        key: "rowLabel",
        header: "Status",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const rowData = row as TransactionStatusRow;
          const IconComponent =
            !isTotal && rowData.keyIcon ? iconRegistry[rowData.keyIcon] : null;
          const iconColor = rowData.keyIconColor ?? "gray";

          return (
            <span className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(iconColor)}`}
                />
              )}
              <span
                className={
                  isTotal
                    ? "font-bold text-gray-900"
                    : "font-semibold text-gray-900"
                }
              >
                {value}
              </span>
            </span>
          );
        },
      },
    ];

    // derive periods from API; fall back to legacy columns if not present
    const periods: string[] = (transactionStatusData &&
      transactionStatusData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    periods.forEach((period) => {
      cols.push({
        key: period,
        header: formatPeriodLabel(period),
        minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const raw = (row as any)[period];
          const formattedValue =
            selectedStatusToggleOption === "By Amount"
              ? formatINRCurrency(raw)
              : raw;
          const sentiment = (row as any)[`${period}Sentiment`] as
            | WebsiteAnalysisValueSentiment
            | undefined;
          const sentimentConfig = sentiment
            ? valueSentimentIconMap[sentiment as ValueSentiment]
            : null;
          const textColorClass = sentimentConfig
            ? getTextColorClass(sentimentConfig.color)
            : isTotal
            ? "text-gray-900"
            : "text-gray-700";

          return (
            <span
              className={`flex items-center gap-2 justify-end ${
                isTotal ? "font-bold" : ""
              } ${textColorClass}`}
            >
              {sentimentConfig && (
                <sentimentConfig.Icon
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(
                    sentimentConfig.color
                  )}`}
                />
              )}
              <span>{formattedValue ?? "-"}</span>
            </span>
          );
        },
      });
    });

    return cols;
  }, [
    transactionStatusData,
    selectedStatusToggleOption,
    selectedStatusTransactionType,
  ]);

  // Columns for Mode Analysis table - dynamic based on API periods
  const modeAnalysisColumns = useMemo(() => {
    // base first column (Mode label + icon)
    const cols: any[] = [
      {
        key: "rowLabel",
        header: "Mode",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const rowData = row as TransactionModeRow;
          const IconComponent =
            !isTotal && rowData.keyIcon ? iconRegistry[rowData.keyIcon] : null;
          const iconColor = rowData.keyIconColor ?? "gray";

          return (
            <span className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(iconColor)}`}
                />
              )}
              <span
                className={
                  isTotal
                    ? "font-bold text-gray-900"
                    : "font-semibold text-gray-900"
                }
              >
                {value}
              </span>
            </span>
          );
        },
      },
    ];

    // derive periods from API; fall back to legacy columns if not present
    const periods: string[] = (transactionModeData &&
      transactionModeData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    periods.forEach((period) => {
      cols.push({
        key: period,
        header: formatPeriodLabel(period),
        minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const isByCount = selectedModeToggleOption === "By Count";
          const isSuccessfulTxn =
            selectedModeTransactionType === "Successful Transactions";
          const isUnsuccessfulTxn =
            selectedModeTransactionType === "Unsuccessful Transactions";

          const rowAny: any = row;

          // If modeTableData already populated a primitive value for this period, use it
          const primitiveVal = rowAny[period];
          if (
            primitiveVal !== undefined &&
            primitiveVal !== null &&
            (typeof primitiveVal === "string" ||
              typeof primitiveVal === "number")
          ) {
            const formatted = !isByCount
              ? formatINRCurrency(primitiveVal)
              : primitiveVal;
            const textColorClass = isTotal ? "text-gray-900" : "text-gray-700";
            return (
              <span
                className={`flex items-center gap-2 justify-end ${
                  isTotal ? "font-bold" : ""
                } ${textColorClass}`}
              >
                <span>{formatted}</span>
              </span>
            );
          }

          // fallback: try reading nested API-style object from the original row
          const periodCell = rowAny[period] ?? rowAny[period.toLowerCase()];
          const subCell = isSuccessfulTxn
            ? periodCell?.succTxn
            : isUnsuccessfulTxn
            ? periodCell?.unsuccTxn
            : periodCell?.allTxn;

          let rawValue: any = isByCount ? subCell?.byCount : subCell?.byAmount;
          if (rawValue === undefined || rawValue === null) rawValue = "-";
          const formattedValue =
            !isByCount && rawValue !== "-"
              ? formatINRCurrency(rawValue)
              : rawValue;
          const textColorClass = isTotal ? "text-gray-900" : "text-gray-700";

          return (
            <span
              className={`flex items-center gap-2 justify-end ${
                isTotal ? "font-bold" : ""
              } ${textColorClass}`}
            >
              <span>{formattedValue}</span>
            </span>
          );
        },
      });
    });

    return cols;
  }, [
    transactionModeData,
    selectedModeToggleOption,
    selectedModeTransactionType,
  ]);

  // Columns for Currency Analysis table
  const currencyAnalysisColumns = useMemo(() => {
    const cols: any[] = [
      {
        key: "rowLabel",
        header: "Currency",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const rowData = row as TransactionCurrencyRow;
          const IconComponent =
            !isTotal && rowData.keyIcon ? iconRegistry[rowData.keyIcon] : null;
          const iconColor = rowData.keyIconColor ?? "gray";

          return (
            <span className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(iconColor)}`}
                />
              )}
              <span
                className={
                  isTotal
                    ? "font-bold text-gray-900"
                    : "font-semibold text-gray-900"
                }
              >
                {value}
              </span>
            </span>
          );
        },
      },
    ];

    const periods: string[] = (transactionCurrencyData &&
      transactionCurrencyData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    periods.forEach((period) => {
      cols.push({
        key: period,
        header: formatPeriodLabel(period),
        minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const raw = (row as any)[period];
          const formattedValue =
            selectedCurrencyToggleOption === "By Amount"
              ? formatINRCurrency(raw)
              : raw;
          const sentiment = (row as any)[`${period}Sentiment`] as
            | WebsiteAnalysisValueSentiment
            | undefined;
          const sentimentConfig = sentiment
            ? valueSentimentIconMap[sentiment as ValueSentiment]
            : null;
          const textColorClass = sentimentConfig
            ? getTextColorClass(sentimentConfig.color)
            : isTotal
            ? "text-gray-900"
            : "text-gray-700";

          return (
            <span
              className={`flex items-center gap-2 justify-end ${
                isTotal ? "font-bold" : ""
              } ${textColorClass}`}
            >
              {sentimentConfig && (
                <sentimentConfig.Icon
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(
                    sentimentConfig.color
                  )}`}
                />
              )}
              <span>{formattedValue ?? "-"}</span>
            </span>
          );
        },
      });
    });

    return cols;
  }, [
    selectedCurrencyToggleOption,
    transactionCurrencyData,
    selectedCurrencyTransactionType,
  ]);

  const regionAnalysisColumns = useMemo(() => {
    const cols: any[] = [
      {
        key: "rowLabel",
        header: "Region",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const rowData = row as TransactionRegionRow;
          const IconComponent =
            !isTotal && rowData.keyIcon ? iconRegistry[rowData.keyIcon] : null;
          const iconColor = rowData.keyIconColor ?? "gray";

          return (
            <span className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(iconColor)}`}
                />
              )}
              <span
                className={
                  isTotal
                    ? "font-bold text-gray-900"
                    : "font-semibold text-gray-900"
                }
              >
                {value}
              </span>
            </span>
          );
        },
      },
    ];

    const periods: string[] = (transactionRegionData &&
      transactionRegionData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    periods.forEach((period) => {
      cols.push({
        key: period,
        header: formatPeriodLabel(period),
        minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const raw = (row as any)[period];
          const formattedValue =
            selectedRegionToggleOption === "By Amount"
              ? formatINRCurrency(raw)
              : raw;
          const sentiment = (row as any)[`${period}Sentiment`] as
            | WebsiteAnalysisValueSentiment
            | undefined;
          const sentimentConfig = sentiment
            ? valueSentimentIconMap[sentiment as ValueSentiment]
            : null;
          const textColorClass = sentimentConfig
            ? getTextColorClass(sentimentConfig.color)
            : isTotal
            ? "text-gray-900"
            : "text-gray-700";

          return (
            <span
              className={`flex items-center gap-2 justify-end ${textColorClass}`}
            >
              {sentimentConfig && (
                <sentimentConfig.Icon
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(
                    sentimentConfig.color
                  )}`}
                />
              )}
              <span className={isTotal ? "font-bold" : ""}>
                {formattedValue ?? "-"}
              </span>
            </span>
          );
        },
      });
    });

    return cols;
  }, [
    selectedRegionToggleOption,
    transactionRegionData,
    selectedRegionTransactionType,
  ]);

  const gatewayAnalysisColumns = useMemo(() => {
    // base first column (Gateway label + icon)
    const cols: any[] = [
      {
        key: "rowLabel",
        header: "International Gateway",
        minWidth: "220px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string, row: Record<string, any>) => {
          // Prefer an explicit icon set on the row (gatewaySummaryData sets these)
          // This forces summary rows like 'Unsuccessful' to use the provided keyIcon/keyIconColor.
          const label = String(value || "");
          const rowData: any = row || {};

          // If the row provides an explicit icon, use it (strong override)
          if (rowData.keyIcon) {
            const IconComp =
              (iconRegistry as any)[rowData.keyIcon] ||
              getIconByName(rowData.keyIcon || "");
            const colorClass = getTextColorClass(
              (rowData.keyIconColor as any) ?? ("gray" as any)
            );

            return (
              <div className="flex items-center gap-2">
                {IconComp ? (
                  <IconComp className={`h-4 w-4 ${colorClass}`} />
                ) : null}
                <span className="font-semibold text-gray-900">{label}</span>
              </div>
            );
          }

          // Fallback: map common labels to icons/colors
          const normalized = label.toLowerCase();
          const gatewayLabelMap: Record<
            string,
            { icon?: string; color?: string }
          > = {
            successful: { icon: "CheckCircle2", color: "green" },
            unsuccessful: { icon: "Ban", color: "red" },
            "failure rate %": { icon: "AlertTriangle", color: "red" },
            total: { icon: "Hash", color: "gray" },
          };

          let iconName: string | undefined;
          let iconColor: string | undefined;
          for (const k of Object.keys(gatewayLabelMap)) {
            if (normalized.includes(k)) {
              iconName = gatewayLabelMap[k].icon;
              iconColor = gatewayLabelMap[k].color;
              break;
            }
          }

          const IconComp = iconName ? (iconRegistry as any)[iconName] : null;
          const colorClass = getTextColorClass((iconColor ?? "gray") as any);

          return (
            <div className="flex items-center gap-2">
              {IconComp ? (
                <IconComp className={`h-4 w-4 ${colorClass}`} />
              ) : null}
              <span className="font-semibold text-gray-900">{label}</span>
            </div>
          );
        },
      },
    ];

    // derive periods from API; fall back to legacy columns if not present
    const periods: string[] = (transactionGatewayData &&
      transactionGatewayData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    periods.forEach((period) => {
      cols.push({
        key: period,
        header: formatPeriodLabel(period),
        minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => {
          // If this is the failure-rate row, show percent formatting
          if (row.rowLabel === "Failure rate %") {
            const pct = Number((row as any)[period] || 0);
            return <span className="text-gray-700">{pct.toFixed(2)}%</span>;
          }

          const raw = (row as any)[period];
          const formattedValue =
            selectedGatewayToggleOption === "By Amount"
              ? formatINRCurrency(raw)
              : raw;

          const sentiment = (row as any)[`${period}Sentiment`] as
            | WebsiteAnalysisValueSentiment
            | undefined;
          const sentimentConfig = sentiment
            ? valueSentimentIconMap[sentiment as ValueSentiment]
            : null;
          const textColorClass = sentimentConfig
            ? getTextColorClass(sentimentConfig.color)
            : "text-gray-700";

          return (
            <span
              className={`flex items-center gap-2 justify-end ${textColorClass}`}
            >
              {sentimentConfig && (
                <sentimentConfig.Icon
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(
                    sentimentConfig.color
                  )}`}
                />
              )}
              <span>{formattedValue ?? "-"}</span>
            </span>
          );
        },
      });
    });

    return cols;
  }, [
    transactionGatewayData,
    selectedGatewayToggleOption,
    selectedGatewayTransactionType,
  ]);

  const timeAnalysisColumns = useMemo(() => {
    const cols: any[] = [
      {
        key: "rowLabel",
        header: "Time Window",
        minWidth: "240px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string, row: Record<string, any>) => {
          const rowData = row as TransactionTimeRow;
          const IconComponent = rowData.keyIcon
            ? iconRegistry[rowData.keyIcon]
            : null;
          const iconColor = rowData.keyIconColor ?? "gray";

          return (
            <span className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(iconColor)}`}
                />
              )}
              <span className="font-semibold text-gray-900">{value}</span>
            </span>
          );
        },
      },
    ];

    const periods: string[] = (transactionTimeData &&
      transactionTimeData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    periods.forEach((period) => {
      cols.push({
        key: period,
        header: formatPeriodLabel(period),
        minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const raw = (row as any)[period];
          const formattedValue =
            selectedTimeToggleOption === "By Amount"
              ? formatINRCurrency(raw)
              : raw;
          const sentiment = (row as any)[`${period}Sentiment`] as
            | WebsiteAnalysisValueSentiment
            | undefined;
          const sentimentConfig = sentiment
            ? valueSentimentIconMap[sentiment as ValueSentiment]
            : null;
          const textColorClass = sentimentConfig
            ? getTextColorClass(sentimentConfig.color)
            : isTotal
            ? "text-gray-900"
            : "text-gray-700";

          return (
            <span
              className={`flex items-center gap-2 justify-end ${textColorClass}`}
            >
              {sentimentConfig && (
                <sentimentConfig.Icon
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(
                    sentimentConfig.color
                  )}`}
                />
              )}
              <span className={isTotal ? "font-bold" : ""}>
                {formattedValue ?? "-"}
              </span>
            </span>
          );
        },
      });
    });

    return cols;
  }, [
    selectedTimeToggleOption,
    transactionTimeData,
    selectedTimeTransactionType,
  ]);

  const proxyAnalysisColumns = useMemo(() => {
    const cols: any[] = [
      {
        key: "rowLabel",
        header: "Proxy Type",
        minWidth: "240px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string, row: Record<string, any>) => {
          const rowData = row as TransactionProxyRow;
          const IconComponent = rowData.keyIcon
            ? iconRegistry[rowData.keyIcon]
            : null;
          const iconColor = rowData.keyIconColor ?? "gray";

          return (
            <span className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(iconColor)}`}
                />
              )}
              <span className="font-semibold text-gray-900">{value}</span>
            </span>
          );
        },
      },
    ];

    const periods: string[] = (transactionProxyData &&
      transactionProxyData.periods) || [
      "Lifetime",
      "past30d",
      "past7d",
      "past1d",
    ];

    periods.forEach((period) => {
      cols.push({
        key: period,
        header: formatPeriodLabel(period),
        minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => {
          const isTotal = row.rowLabel === "Total";
          const raw = (row as any)[period];
          const formattedValue =
            selectedProxyToggleOption === "By Amount"
              ? formatINRCurrency(raw)
              : raw;
          const sentiment = (row as any)[`${period}Sentiment`] as
            | WebsiteAnalysisValueSentiment
            | undefined;
          const sentimentConfig = sentiment
            ? valueSentimentIconMap[sentiment as ValueSentiment]
            : null;
          const textColorClass = sentimentConfig
            ? getTextColorClass(sentimentConfig.color)
            : isTotal
            ? "text-gray-900"
            : "text-gray-700";

          return (
            <span
              className={`flex items-center gap-2 justify-end ${textColorClass}`}
            >
              {sentimentConfig && (
                <sentimentConfig.Icon
                  className={`h-4 w-4 shrink-0 ${getTextColorClass(
                    sentimentConfig.color
                  )}`}
                />
              )}
              <span className={isTotal ? "font-bold" : ""}>
                {formattedValue ?? "-"}
              </span>
            </span>
          );
        },
      });
    });

    return cols;
  }, [
    selectedProxyToggleOption,
    transactionProxyData,
    selectedProxyTransactionType,
  ]);

  const hasActiveCase = useMemo(
    () => Boolean(caseId || selectedCase?.caseId),
    [caseId, selectedCase?.caseId]
  );

  // Render the Transaction Details section (moved from Overview tab)
  const renderTransactionDetailsSection = () => {
    const activeCase = selectedCase;

    // derive some transaction metrics from activeCase with sensible fallbacks
    const txGmv =
      (activeCase as any)?.successful_gmv ||
      (activeCase as any)?.keyStats?.successfulGmv ||
      (activeCase as any)?.gmv ||
      "N/A";
    const txCount3M =
      (activeCase as any)?.successful_txn_count_3m ||
      (activeCase as any)?.keyStats?.txnCount3M ||
      (activeCase as any)?.txn_count_3m ||
      "N/A";
    const ipgFailureRate =
      (activeCase as any)?.ipg_failure_rate ||
      (activeCase as any)?.keyStats?.ipgFailureRate ||
      (activeCase as any)?.ipg_failure ||
      "N/A";
    const distinctCards3M =
      (activeCase as any)?.distinct_card_used_3m ||
      (activeCase as any)?.keyStats?.distinctCards3M ||
      (activeCase as any)?.distinct_cards_3m ||
      "N/A";
    const pctGmvViaPF =
      (activeCase as any)?.pct_gmv_via_pf ||
      (activeCase as any)?.keyStats?.pctGmvViaPF ||
      (activeCase as any)?.percent_gmv_via_pf ||
      "N/A";

    const txnMetrics = [
      {
        label: "Successful GMV",
        value: txGmv,
        icon: '<CreditCard className="h-5 w-5 text-indigo-500" />',
      },
      {
        label: "Successful txn count (3M)",
        value: txCount3M,
        icon: '<ListChecks className="h-5 w-5 text-emerald-500" />',
      },
      {
        label: "IPG Failure Rate",
        value: ipgFailureRate,
        icon: '<AlertTriangle className="h-5 w-5 text-rose-500" />',
      },
      {
        label: "Distinct cards used (3M)",
        value: distinctCards3M,
        icon: '<Users className="h-5 w-5 text-sky-500" />',
      },
      {
        label: "% of GMV via PF",
        value: pctGmvViaPF,
        icon: '<Percent className="h-5 w-5 text-violet-500" />',
      },
    ];

    return (
      <>
        {/* <motion.div variants={itemVariants}>
          {(() => {
            const Icon = getIconByName("Currency");
            return (
              <SectionHeaderWithFlags
                positiveFlags={[]}
                negativeFlags={[]}
                neutralFlags={[]}
                title="Transaction details"
                icon={Icon || undefined}
                allowCollapse={false}
              />
            );
          })()}
        </motion.div> */}

        {/* <motion.div variants={itemVariants}>
          <div className="mt-3">
            <KeyMetrics
              hardcodedMetrics={txnMetrics}
              isMetricsExpanded={isMetricsExpanded}
              setIsMetricsExpanded={setIsMetricsExpanded}
              showHeader={false}
            />

          </div>
        </motion.div> */}
      </>
    );
  };

  // Render Key Metrics section
  const keyMetricsColumns = useMemo(() => {
    return [
      {
        key: "particulars",
        header: "Particulars",
        minWidth: "240px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="text-sm font-medium">{value}</span>
        ),
      },
      {
        key: "lifetime",
        header: "Lifetime",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => <span className="text-sm">{value}</span>,
      },
      {
        key: "past30d",
        header: "Past 30D",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => <span className="text-sm">{value}</span>,
      },
      {
        key: "past7d",
        header: "Past7D",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => <span className="text-sm">{value}</span>,
      },
      {
        key: "past1d",
        header: "Past1D",
        minWidth: "150px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => <span className="text-sm">{value}</span>,
      },
    ];
  }, []);

  const keyMetricsData = useMemo(() => {
    // Prefer values from transaction-status-breakdown and transaction-mode-breakdown APIs.
    // Mapping:
    //  - Successful tranx -> transactionStatus rowLabel === 'SUCCESS' (use succTxn)
    //  - Failed Tranx -> transactionStatus rowLabel === 'FAILED' (use unsuccTxn)
    //  - User Dropped -> transactionStatus rowLabel === 'USER_DROPPED' (use allTxn)
    //  - UPI Intent -> transactionMode rowLabel === 'UPI-Intent' (use allTxn)
    //  - Collect request UPI -> transactionMode rowLabel === 'UPI-Collect' (use allTxn)
    // Remaining rows (Product Link, Product Form, IPG Tranx) show hyphens as there is
    // no data backing them in these APIs.

    const c: any = selectedCase || {};

    const asNumberOrNA = (v: any, isCurrency = false) => {
      if (v === undefined || v === null) return "-";
      if (typeof v === "number")
        return isCurrency ? formatINRCurrency(v) : v.toLocaleString();
      const cleaned = String(v).replace(/[₹,]/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num))
        return isCurrency ? formatINRCurrency(num) : num.toLocaleString();
      return String(v);
    };

    const useAmount = selectedKeyMetricsToggleOption === "Amount";

    const getStatusRow = (label: string) =>
      transactionStatusData?.data?.find((r: any) => r.rowLabel === label);
    const getModeRow = (label: string) =>
      transactionModeData?.data?.find((r: any) => r.rowLabel === label);

    const valueFromStatus = (
      rowLabel: string,
      periodKey: string,
      subKey: string
    ) => {
      const row = getStatusRow(rowLabel);
      if (!row) return "-";
      const period = (row as any)[periodKey];
      if (!period) return "-";
      const cell = period[subKey] ?? period.allTxn ?? null;
      if (!cell) return "-";
      return useAmount
        ? asNumberOrNA(cell.byAmount, true)
        : asNumberOrNA(cell.byCount, false);
    };

    const valueFromMode = (rowLabel: string, periodKey: string) => {
      const row = getModeRow(rowLabel);
      if (!row) return "-";
      const period = (row as any)[periodKey];
      if (!period) return "-";
      const cell = period.allTxn ?? null;
      if (!cell) return "-";
      return useAmount
        ? asNumberOrNA(cell.byAmount, true)
        : asNumberOrNA(cell.byCount, false);
    };

    // helper to build a row
    const row = (
      label: string,
      lifetimeVal: any,
      past30dVal: any,
      past7dVal: any,
      past1dVal: any
    ) => ({
      particulars: label,
      lifetime: lifetimeVal,
      past30d: past30dVal,
      past7d: past7dVal,
      past1d: past1dVal,
    });

    // Build rows using API responses where available
    const successfulLifetime = valueFromStatus(
      "SUCCESS",
      "lifetime",
      "succTxn"
    );
    const successful30 = valueFromStatus("SUCCESS", "past30d", "succTxn");
    const successful7 = valueFromStatus("SUCCESS", "past7d", "succTxn");
    const successful1 = valueFromStatus("SUCCESS", "past1d", "succTxn");

    const failedLifetime = valueFromStatus("FAILED", "lifetime", "unsuccTxn");
    const failed30 = valueFromStatus("FAILED", "past30d", "unsuccTxn");
    const failed7 = valueFromStatus("FAILED", "past7d", "unsuccTxn");
    const failed1 = valueFromStatus("FAILED", "past1d", "unsuccTxn");

    const userDroppedLifetime = valueFromStatus(
      "USER_DROPPED",
      "lifetime",
      "allTxn"
    );
    const userDropped30 = valueFromStatus("USER_DROPPED", "past30d", "allTxn");
    const userDropped7 = valueFromStatus("USER_DROPPED", "past7d", "allTxn");
    const userDropped1 = valueFromStatus("USER_DROPPED", "past1d", "allTxn");

    const upiIntentLifetime = valueFromMode("UPI-Intent", "lifetime");
    const upiIntent30 = valueFromMode("UPI-Intent", "past30d");
    const upiIntent7 = valueFromMode("UPI-Intent", "past7d");
    const upiIntent1 = valueFromMode("UPI-Intent", "past1d");

    const upiCollectLifetime = valueFromMode("UPI-Collect", "lifetime");
    const upiCollect30 = valueFromMode("UPI-Collect", "past30d");
    const upiCollect7 = valueFromMode("UPI-Collect", "past7d");
    const upiCollect1 = valueFromMode("UPI-Collect", "past1d");

    // Product Link / Product Form / IPG Tranx - no backing APIs, show hyphens
    const dash = "-";

    return [
      row(
        "Successful tranx",
        successfulLifetime,
        successful30,
        successful7,
        successful1
      ),
      row("Failed Tranx", failedLifetime, failed30, failed7, failed1),
      row(
        "User Dropped",
        userDroppedLifetime,
        userDropped30,
        userDropped7,
        userDropped1
      ),
      row(
        "Collect request UPI",
        upiCollectLifetime,
        upiCollect30,
        upiCollect7,
        upiCollect1
      ),
      row("UPI Intent", upiIntentLifetime, upiIntent30, upiIntent7, upiIntent1),
      row("Product Link", dash, dash, dash, dash),
      row("Product Form", dash, dash, dash, dash),
      row("IPG Tranx", dash, dash, dash, dash),
    ];
  }, [
    selectedCase,
    selectedKeyMetricsToggleOption,
    transactionStatusData,
    transactionModeData,
  ]);

  const renderKeyMetricsSection = () => {
    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Key Metrics - Past 3 Months"
            icon={HashIcon || undefined}
            iconColorClass="text-gray-600"
            titleColorClass="text-blue-700"
            allowCollapse={false}
            defaultExpanded={true}
            flagTypeOrderList={[]}
            positiveFlags={[]}
            negativeFlags={[]}
            // toggles={[
            //   {
            //     id: "keyMetricsToggle",
            //     options: ["Count", "Amount"],
            //     selectedOption: selectedKeyMetricsToggleOption,
            //     onOptionChange: setSelectedKeyMetricsToggleOption,
            //     position: "right",
            //     size: "small",
            //   },
            // ]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="mt-3">
            {/* Use KeyMetrics component to show the requested metrics instead of the table */}
            <KeyMetrics
              hardcodedMetrics={(() => {
                const km = caseKeyMetricsData;
                const formatMaybe = (v: any, isCurrency = false) => {
                  if (v === undefined || v === null) return "-";
                  if (typeof v === "number")
                    return isCurrency
                      ? formatINRCurrency(v)
                      : v.toLocaleString();
                  return String(v);
                };

                return [
                  {
                    label: "Fraud Reported",
                    value:
                      getKeyMetricValue(km, [
                        "Fraud Reported",
                        "fraud_reported",
                        "fraudReported",
                      ]) ??
                      (selectedCase as any)?.fraud_reported ??
                      (selectedCase as any)?.keyStats?.fraudReported ??
                      "-",
                    icon: '<AlertTriangle className="h-5 w-5 text-rose-500" />',
                  },
                  {
                    label: "Chargeback Reported",
                    value:
                      getKeyMetricValue(km, [
                        "Chargeback Reported",
                        "chargeback_reported",
                        "chargebackReported",
                      ]) ??
                      (selectedCase as any)?.chargeback_reported ??
                      (selectedCase as any)?.keyStats?.chargebackReported ??
                      "-",
                    icon: '<XCircle className="h-5 w-5 text-amber-500" />',
                  },
                  {
                    label: "Dispute Reported",
                    value:
                      getKeyMetricValue(km, [
                        "Dispute Reported",
                        "dispute_reported",
                        "disputeReported",
                      ]) ??
                      (selectedCase as any)?.dispute_reported ??
                      (selectedCase as any)?.keyStats?.disputeReported ??
                      "-",
                    icon: '<AlertCircle className="h-5 w-5 text-yellow-500" />',
                  },
                  {
                    label: "Successful GMV",
                    value: formatMaybe(
                      getKeyMetricValue(km, [
                        "Successful Gmv",
                        "Successful GMV",
                        "successful_gmv",
                        "successfulGmv",
                        "gmv",
                      ]) ??
                        (selectedCase as any)?.successful_gmv ??
                        (selectedCase as any)?.keyStats?.successfulGmv ??
                        (selectedCase as any)?.gmv ??
                        "-",
                      true
                    ),
                    icon: '<CreditCard className="h-5 w-5 text-indigo-500" />',
                  },
                  {
                    label: "Failed GMV",
                    value: formatMaybe(
                      getKeyMetricValue(km, [
                        "Failed Gmv",
                        "Failed GMV",
                        "failed_gmv",
                        "failedGmv",
                      ]) ??
                        (selectedCase as any)?.failed_gmv ??
                        (selectedCase as any)?.keyStats?.failedGmv ??
                        "-",
                      true
                    ),
                    icon: '<XCircle className="h-5 w-5 text-rose-500" />',
                  },
                  {
                    label: "Payment Link GMV",
                    value: formatMaybe(
                      getKeyMetricValue(km, [
                        "Payment Link Gmv",
                        "Payment Link GMV",
                        "payment_link_gmv",
                        "paymentLinkGmv",
                      ]) ??
                        (selectedCase as any)?.payment_link_gmv ??
                        (selectedCase as any)?.keyStats?.paymentLinkGmv ??
                        "-",
                      true
                    ),
                    icon: '<Link className="h-5 w-5 text-sky-500" />',
                  },
                  {
                    label: "Payment Form GMV",
                    value: formatMaybe(
                      getKeyMetricValue(km, [
                        "Payment Form Gvm",
                        "Payment Form GMV",
                        "payment_form_gmv",
                        "paymentFormGmv",
                      ]) ??
                        (selectedCase as any)?.payment_form_gmv ??
                        (selectedCase as any)?.keyStats?.paymentFormGmv ??
                        "-",
                      true
                    ),
                    icon: '<FileText className="h-5 w-5 text-sky-500" />',
                  },
                  {
                    label: "IPG GMV",
                    value: formatMaybe(
                      getKeyMetricValue(km, [
                        "IPG Gmv",
                        "IPG GMV",
                        "ipg_gmv",
                        "ipgGmv",
                      ]) ??
                        (selectedCase as any)?.ipg_gmv ??
                        (selectedCase as any)?.keyStats?.ipgGmv ??
                        "-",
                      true
                    ),
                    icon: '<Server className="h-5 w-5 text-violet-500" />',
                  },
                  {
                    label: "Distinct Card",
                    value:
                      getKeyMetricValue(km, [
                        "Distinct Card",
                        "distinct_card",
                        "distinct_card_used_3m",
                        "distinctCards3M",
                      ]) ??
                      (selectedCase as any)?.distinct_card_used_3m ??
                      (selectedCase as any)?.keyStats?.distinctCards3M ??
                      "-",
                    icon: '<Users className="h-5 w-5 text-sky-500" />',
                  },
                ];
              })()}
              isMetricsExpanded={isMetricsExpanded}
              setIsMetricsExpanded={setIsMetricsExpanded}
              showHeader={false}
            />
          </div>
        </motion.div>
      </>
    );
  };

  // Render Transaction & Price Pattern Flags section (moved from Transaction Details)
  const renderTransactionPatternFlagsSection = () => {
    const activeCase = selectedCase;

    // Legend component for the section header
    const legendElement = (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-600 text-white">
            {(() => {
              const MinusIcon = getIconByName("Minus") || getIconByName("Dash");
              return MinusIcon ? (
                <MinusIcon className="h-3 w-3 text-white" />
              ) : (
                <svg
                  className="h-3 w-3 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" />
                </svg>
              );
            })()}
          </div>
          <span className="text-sm text-green-600">No Risk Observed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white">
            {(() => {
              const AlertIcon =
                getIconByName("AlertTriangle") || getIconByName("Triangle");
              return AlertIcon ? (
                <AlertIcon className="h-3 w-3 text-white" />
              ) : (
                <svg
                  className="h-3 w-3 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.29 3.86L1.82 18a1.75 1.75 0 0 0 1.5 2.64h17.36a1.75 1.75 0 0 0 1.5-2.64L13.71 3.86a1.75 1.75 0 0 0-3.42 0z"
                    stroke="currentColor"
                  />
                  <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
              );
            })()}
          </div>
          <span className="text-sm text-red-600">
            Potential Risk Identified
          </span>
        </div>
      </div>
    );

    return (
      <motion.div variants={itemVariants}>
        <SectionHeaderWithFlags
          positiveFlags={[]}
          negativeFlags={[]}
          neutralFlags={[]}
          mildPositiveFlags={[]}
          mildNegativeFlags={[]}
          extremeNegativeFlags={[]}
          title="Transaction & Price Pattern Checklist"
          icon={AlertTriangleIcon || undefined}
          titleRightElement={legendElement}
          allowCollapse={false}
        />

        <div className="mt-3">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
              artifactPanelCollapsed ? "lg:grid-cols-4" : "lg:grid-cols-3"
            } gap-4`}
          >
            {/* Render a fixed set of transaction pattern cards and prefer subrule reasonings
                from the red-flags API when available. */}
            {(() => {
              const cards = [
                {
                  name: "High Credit Card Value Transactions",
                  subrule: "high_value_cc_txn",
                },
                {
                  name: "Flat Value Transaction Pattern",
                  subrule: "flat_value_pattern",
                  useRedFlags: true,
                },
                {
                  name: "Transaction Description unaligned LOB",
                  // prefer the explicit description-unaligned key from output-format
                  subrule: "txn_description_unaligned",
                },
                // Amount vs MCC Unaligned -> map to txn_amount_unaligned
                {
                  name: "Amount vs MCC Unaligned",
                  subrule: "txn_amount_unaligned",
                },
                // Amount vs Listed Products Unaligned -> map to txn_website_data_unaligned
                {
                  name: "Amount vs Listed Products Unaligned",
                  subrule: "txn_website_data_unaligned",
                },
                // New card to show concentration of transactions by card (from red-flags API)
                {
                  name: "Card Transaction Concentration",
                  subrule: "cc_txn_concentration",
                  useRedFlags: true,
                },
              ];

              // Build a lowercase lookup for output-format keys (if available)
              const outputLookup: Record<string, any> =
                outputFormatData && typeof outputFormatData === "object"
                  ? Object.keys(outputFormatData).reduce(
                      (acc: Record<string, any>, k: string) => {
                        acc[String(k).toLowerCase()] = (
                          outputFormatData as any
                        )[k];
                        return acc;
                      },
                      {}
                    )
                  : {};

              // Map card names to likely output-format keys (tolerant candidates)
              const outputKeyCandidates: Record<string, string[]> = {
                "High Credit Card Value Transactions": ["high_value_cc_txn"],
                "Flat Value Transaction Pattern": ["flat_value_pattern"],
                "Transaction Description unaligned LOB": [
                  "txn_website_data_unaligned",
                ],
                "Amount vs MCC Unaligned": ["txn_amount_unaligned"],
                "Amount vs Listed Products Unaligned": [
                  "txn_website_data_unaligned",
                ],
              };

              // If output-format is loading, show a centered spinner for this subsection
              if (outputFormatLoading) {
                return (
                  <div className="col-span-full flex items-center justify-center py-6">
                    <svg
                      className="animate-spin h-6 w-6 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  </div>
                );
              }

              // If API missing/failed, mark all cards as noData
              if (!outputFormatData) {
                return cards.map((c, idx) => (
                  <WebsiteQualityCard
                    key={`beh-top-${idx}`}
                    name={c.name}
                    status={"no"}
                    invert={true}
                    noData={true}
                  />
                ));
              }

              // Otherwise use a robust shallow-search + normalization approach
              // (same pattern used by other tabs) to locate boolean flags in the
              // output-format response. This handles top-level keys, wrapper
              // objects, and nested section objects like "Transaction Behaviour"
              // or "Payment Metrics".
              const normalizeFlag = (v: any): boolean | null => {
                if (typeof v === "boolean") return v;
                if (v === null || typeof v === "undefined") return null;
                if (typeof v === "number")
                  return v === 1 ? true : v === 0 ? false : null;
                if (typeof v === "string") {
                  const s = v.trim().toLowerCase();
                  if (s === "true" || s === "1") return true;
                  if (s === "false" || s === "0") return false;
                  return null;
                }
                return null;
              };

              const tryGet = (obj: any, k: string) => {
                if (!obj) return undefined;
                try {
                  return obj[k];
                } catch (e) {
                  return undefined;
                }
              };

              // Helper to fetch reasoning text from various locations in the
              // output-format response. We prefer keys under `other` (or
              // `data.other`) and tolerate slight casing/spacing differences.
              const getReasoningFromOutput = (
                candidates: string[] | string
              ) => {
                const keys = Array.isArray(candidates)
                  ? candidates
                  : [candidates];

                const wrappers = [
                  outputFormatData?.other,
                  outputFormatData?.data?.other,
                  outputFormatData?.data,
                  outputFormatData?.payload,
                  outputFormatData,
                ];

                const extractReasonFromValue = (val: any): any => {
                  if (val === undefined || val === null) return undefined;
                  if (typeof val === "string") return val;
                  if (typeof val === "object") {
                    // direct reasoning/ reason fields
                    if (typeof val.reasoning === "string") return val.reasoning;
                    if (typeof val.reason === "string") return val.reason;

                    // arrays: check first element
                    if (Array.isArray(val) && val.length > 0) {
                      for (const el of val) {
                        const r = extractReasonFromValue(el);
                        if (r) return r;
                      }
                    }

                    // nested object: search for nested keys with 'reasoning' or 'reason'
                    const stack: any[] = [val];
                    while (stack.length) {
                      const node = stack.shift();
                      if (!node || typeof node !== "object") continue;
                      if (typeof node.reasoning === "string")
                        return node.reasoning;
                      if (typeof node.reason === "string") return node.reason;
                      for (const k of Object.keys(node)) {
                        const child = node[k];
                        if (child && typeof child === "object")
                          stack.push(child);
                      }
                    }
                  }
                  return undefined;
                };

                for (const k of keys) {
                  if (!k) continue;

                  // try exact matches in wrappers and extract reasoning if object
                  for (const w of wrappers) {
                    if (!w || typeof w !== "object") continue;
                    if (Object.prototype.hasOwnProperty.call(w, k)) {
                      const v = w[k];
                      const r = extractReasonFromValue(v);
                      if (r) return r;
                      return v;
                    }
                    const lk = Object.keys(w).find(
                      (wk) =>
                        String(wk).toLowerCase() === String(k).toLowerCase()
                    );
                    if (lk) {
                      const v = w[lk];
                      const r = extractReasonFromValue(v);
                      if (r) return r;
                      return v;
                    }
                  }

                  // Last resort: search serialized JSON for a key with a nested reasoning field
                  try {
                    const text = JSON.stringify(outputFormatData || {});
                    // 1) direct string field like "<k>_reasoning": "..."
                    const re1 = new RegExp(
                      `"${k.replace(
                        /[-/\\^$*+?.()|[\]{}]/g,
                        "\\$&"
                      )}(_reasoning)?"\\s*:\\s*\"([^\"]*)\"`,
                      "i"
                    );
                    const m1 = text.match(re1 as RegExp);
                    if (m1 && m1[2]) return m1[2];

                    // 2) nested object: "<k>" : { ... "reasoning": "..." }
                    const re2 = new RegExp(
                      `"${k.replace(
                        /[-/\\^$*+?.()|[\]{}]/g,
                        "\\$&"
                      )}"\\s*:\\s*\\{[\\s\\S]*?"reasoning"\\s*:\\s*\\"([^\\"]*)\\"`,
                      "i"
                    );
                    const m2 = text.match(re2 as RegExp);
                    if (m2 && m2[1]) return m2[1];
                  } catch (e) {
                    /* ignore */
                  }
                }

                return undefined;
              };

              const sanitizeReasoning = (r: any) => {
                if (r === undefined || r === null) return r;
                let s = typeof r === "string" ? r : String(r);
                // Remove combined patterns like "Status: No Reasoning: " or "Status: No\nReasoning: "
                s = s.replace(
                  /^\s*Status\s*:[^R\n]*(?:Reasoning\s*:)?\s*/i,
                  ""
                );
                // Also remove patterns like "Status: No " at the start
                s = s.replace(/^\s*Status\s*:\s*[^\n]+\s*/i, "");
                return s.trim();
              };

              const scopedTransactionBehaviour =
                tryGet(outputFormatData, "Transaction Behaviour") ||
                tryGet(outputFormatData, "transaction behaviour") ||
                tryGet(outputFormatData, "transaction_behaviour") ||
                tryGet(outputFormatData?.data, "Transaction Behaviour") ||
                null;

              const scopedPaymentMetrics =
                tryGet(outputFormatData, "Payment Metrics") ||
                tryGet(outputFormatData, "payment metrics") ||
                tryGet(outputFormatData, "payment_metrics") ||
                tryGet(outputFormatData?.data, "Payment Metrics") ||
                null;

              const shallowFind = (key: string): any => {
                // Check scoped containers first
                if (
                  scopedTransactionBehaviour &&
                  typeof scopedTransactionBehaviour === "object"
                ) {
                  if (
                    Object.prototype.hasOwnProperty.call(
                      scopedTransactionBehaviour,
                      key
                    )
                  )
                    return scopedTransactionBehaviour[key];
                  const lk = Object.keys(scopedTransactionBehaviour).find(
                    (k) => String(k).toLowerCase() === key.toLowerCase()
                  );
                  if (lk) return scopedTransactionBehaviour[lk];
                }
                if (
                  scopedPaymentMetrics &&
                  typeof scopedPaymentMetrics === "object"
                ) {
                  if (
                    Object.prototype.hasOwnProperty.call(
                      scopedPaymentMetrics,
                      key
                    )
                  )
                    return scopedPaymentMetrics[key];
                  const lk = Object.keys(scopedPaymentMetrics).find(
                    (k) => String(k).toLowerCase() === key.toLowerCase()
                  );
                  if (lk) return scopedPaymentMetrics[lk];
                }

                // Top-level direct
                if (outputFormatData && typeof outputFormatData === "object") {
                  if (
                    Object.prototype.hasOwnProperty.call(outputFormatData, key)
                  )
                    return (outputFormatData as any)[key];
                  const lowerKey = Object.keys(outputFormatData).find(
                    (k) => String(k).toLowerCase() === key.toLowerCase()
                  );
                  if (lowerKey) return (outputFormatData as any)[lowerKey];
                }

                // Check common wrappers
                const wrappers = [
                  outputFormatData?.data,
                  outputFormatData?.payload,
                  outputFormatData?.result,
                ];
                for (const w of wrappers) {
                  if (w && typeof w === "object") {
                    if (Object.prototype.hasOwnProperty.call(w, key))
                      return w[key];
                    const lk = Object.keys(w).find(
                      (k) => String(k).toLowerCase() === key.toLowerCase()
                    );
                    if (lk) return w[lk];
                  }
                }

                // Shallow children
                if (outputFormatData && typeof outputFormatData === "object") {
                  for (const prop of Object.keys(outputFormatData)) {
                    const val = (outputFormatData as any)[prop];
                    if (val && typeof val === "object") {
                      if (Object.prototype.hasOwnProperty.call(val, key))
                        return val[key];
                      const lk = Object.keys(val).find(
                        (k) => String(k).toLowerCase() === key.toLowerCase()
                      );
                      if (lk) return val[lk];
                    }
                  }
                }

                // Final text fallback to find explicit boolean/null/0/1
                try {
                  const text = JSON.stringify(outputFormatData || {});
                  const q = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
                  const re = new RegExp(
                    `"${q}"\\s*:\\s*(true|false|null|0|1|"true"|"false")`,
                    "i"
                  );
                  const m = text.match(re as RegExp);
                  if (m && m[1]) {
                    let parsed: any = m[1];
                    if (
                      typeof parsed === "string" &&
                      parsed.startsWith('"') &&
                      parsed.endsWith('"')
                    )
                      parsed = parsed.slice(1, -1);
                    if (parsed === "0" || parsed === "1")
                      parsed = Number(parsed);
                    if (typeof parsed === "string") {
                      const s = parsed.trim().toLowerCase();
                      if (s === "true") parsed = true;
                      if (s === "false") parsed = false;
                      if (s === "null") parsed = null;
                    }
                    return parsed;
                  }
                } catch (e) {
                  // ignore
                }

                return undefined;
              };

              return cards.map((c, idx) => {
                // Special handling for the Card Transaction Concentration card:
                // - Take status only from output-format API field `cc_txn_concentration`
                // - true  => red alert triangle (invert=true + status="yes")
                // - false => green minus (invert=true + status="no")
                // - missing/error => gray info icon (noData=true)
                if (
                  c.name === "Card Transaction Concentration" ||
                  String(c.subrule || "").toLowerCase() ===
                    "cc_txn_concentration"
                ) {
                  const ccVal = shallowFind("cc_txn_concentration");
                  const ccFlag = normalizeFlag(ccVal);
                  const reasoning = sanitizeReasoning(
                    getReasoningFromOutput([
                      "cc_txn_concentration_reasoning",
                      "cc_txn_concentration",
                    ])
                  );

                  if (ccFlag === true || ccFlag === false) {
                    return (
                      <WebsiteQualityCard
                        key={`beh-top-${idx}`}
                        name={c.name}
                        status={ccFlag ? "yes" : "no"}
                        invert={true}
                        reasoning={reasoning}
                      />
                    );
                  }

                  // No data / pending / API failure
                  return (
                    <WebsiteQualityCard
                      key={`beh-top-${idx}`}
                      name={c.name}
                      status={"no"}
                      invert={true}
                      noData={true}
                      reasoning={reasoning}
                    />
                  );
                }

                // Track whether this card's flag value was sourced from the
                // output-format's Payment Metrics container. When true we
                // render the card with `apiTrueIsAlert` so boolean `true`
                // maps to a red alert and `false` maps to a green check.
                let foundFromPaymentMetrics = false;
                const candidates = outputKeyCandidates[c.name] || [];
                let found: any = undefined;
                for (const candidate of candidates) {
                  found = shallowFind(candidate);
                  if (typeof found !== "undefined") break;
                }

                // Special-case: Card Transaction Concentration may be present
                // under the output-format API at data.metrics -> "Payment Metrics"
                // as `cc_txn_concentration`. If red-flags did not provide a
                // subrule entry (handled earlier) prefer this location.
                if (
                  (c.name === "Card Transaction Concentration" ||
                    String(c.subrule || "").toLowerCase() ===
                      "cc_txn_concentration") &&
                  (typeof found === "undefined" || found === null)
                ) {
                  try {
                    const metricsRoot =
                      (outputFormatData as any)?.data?.metrics ||
                      (outputFormatData as any)?.metrics ||
                      undefined;

                    if (metricsRoot && typeof metricsRoot === "object") {
                      // Payment Metrics container may be keyed with different casing
                      const paymentMetrics =
                        metricsRoot["Payment Metrics"] ||
                        metricsRoot["payment metrics"] ||
                        metricsRoot["payment_metrics"] ||
                        metricsRoot.paymentMetrics ||
                        undefined;

                      const ccVal =
                        (paymentMetrics &&
                          (paymentMetrics.cc_txn_concentration ??
                            paymentMetrics["cc_txn_concentration"])) ??
                        undefined;

                      if (typeof ccVal !== "undefined") {
                        found = ccVal;
                        foundFromPaymentMetrics = true;
                      } else {
                        // final fallback: try scopedPaymentMetrics lookup
                        const sc = shallowFind("cc_txn_concentration");
                        if (typeof sc !== "undefined") found = sc;
                      }
                    }
                  } catch (e) {
                    /* ignore */
                  }
                }

                const flag = normalizeFlag(found);

                // Determine reasoning mapping for specific cards. Prefer the
                // dedicated "other" keys returned by the output-format API.
                let reasoningToUse: any = undefined;
                try {
                  if (c.name === "High Credit Card Value Transactions") {
                    // Try to read reasoning from redFlagsData (preferred) - RF001 -> high_value_cc_txn
                    try {
                      if (redFlagsData && Array.isArray(redFlagsData)) {
                        // Find RF001 or any red flag with subrule matching high_value_cc_txn
                        let foundReason: any = undefined;
                        for (const rf of redFlagsData) {
                          if (!rf) continue;
                          // Check if this is RF001 (optional, but helps with specificity)
                          const isRF001 =
                            String(rf.code || "").toUpperCase() === "RF001";
                          // subrules may be present as array
                          const subs =
                            rf.subrules || rf.sub_rules || rf.subRule || [];
                          if (Array.isArray(subs)) {
                            for (const s of subs) {
                              const subname =
                                (s && (s.subrule || s.sub_rule || s.name)) ||
                                undefined;
                              if (
                                String(subname).toLowerCase() ===
                                "high_value_cc_txn"
                              ) {
                                foundReason =
                                  s.reasoning ||
                                  s.details?.reasoning ||
                                  s.details?.reason ||
                                  s.reason ||
                                  undefined;
                                break;
                              }
                            }
                          }
                          if (foundReason) break;
                        }

                        if (foundReason) reasoningToUse = foundReason;
                      }
                    } catch (e) {
                      /* fallthrough to output-format fallback below */
                    }
                    // fallback: also try output-format payload/other
                    if (!reasoningToUse)
                      reasoningToUse = getReasoningFromOutput([
                        "High value CC txn_reasoning",
                        "High value CC txn_reasoning",
                        "High value CC txn_reasoning",
                      ]);
                    // fallback older key names
                    if (!reasoningToUse)
                      reasoningToUse = getReasoningFromOutput([
                        "High value CC txn_reasoning",
                        "High value CC txn reason",
                        "high value cc txn_reasoning",
                        "High value CC txn_reasoning",
                      ]);
                  } else if (c.name === "Flat Value Transaction Pattern") {
                    reasoningToUse = getReasoningFromOutput([
                      "has flat value pattern_reasoning",
                      "has flat value pattern_reasoning",
                      "has flat value pattern_reasoning",
                    ]);
                  } else if (
                    c.name === "Transaction Description unaligned LOB"
                  ) {
                    // Use txn_description_unaligned reasoning from output-format
                    reasoningToUse = getReasoningFromOutput([
                      "txn_description_unaligned_reasoning",
                      "txn_description_unaligned",
                      "txn_desc_unaligned_reasoning",
                    ]);
                  } else if (c.name === "Card Transaction Concentration") {
                    // Try to read reasoning from redFlagsData (preferred) or fallback to output-format
                    try {
                      if (redFlagsData && Array.isArray(redFlagsData)) {
                        // Find RF002 or any subrule matching cc_txn_concentration
                        let foundReason: any = undefined;
                        for (const rf of redFlagsData) {
                          if (!rf) continue;
                          // subrules may be present as array
                          const subs =
                            rf.subrules || rf.sub_rules || rf.subRule || [];
                          if (Array.isArray(subs)) {
                            for (const s of subs) {
                              const subname =
                                (s && (s.subrule || s.sub_rule || s.name)) ||
                                undefined;
                              if (
                                String(subname).toLowerCase() ===
                                "cc_txn_concentration"
                              ) {
                                foundReason =
                                  s.reasoning ||
                                  s.details?.reasoning ||
                                  s.details?.reason ||
                                  s.reason ||
                                  undefined;
                                break;
                              }
                            }
                          }
                          if (foundReason) break;
                        }

                        if (foundReason) reasoningToUse = foundReason;
                      }
                    } catch (e) {
                      /* fallthrough to output-format fallback below */
                    }
                    // fallback: also try output-format payload/other
                    if (!reasoningToUse)
                      reasoningToUse = getReasoningFromOutput([
                        "cc_txn_concentration_reasoning",
                        "cc_txn_concentration",
                        "CC txn concentration_reasoning",
                      ]);
                  } else if (c.name === "Amount vs MCC Unaligned") {
                    // Use txn_amount_unaligned reasoning from output-format
                    reasoningToUse = getReasoningFromOutput([
                      "txn_amount_unaligned_reasoning",
                      "txn_amount_unaligned",
                    ]);
                  } else if (c.name === "Amount vs Listed Products Unaligned") {
                    // Use txn_website_data_unaligned reasoning from output-format
                    reasoningToUse = getReasoningFromOutput([
                      "txn_website_data_unaligned_reasoning",
                      "txn_website_data_unaligned",
                      "txn_website_unaligned_reasoning",
                    ]);
                  }
                } catch (e) {
                  // fall back silently
                }

                // If this card explicitly wants red-flags data, use that as the
                // primary source for status and reasoning (preferred over
                // output-format). However, for the Card Transaction
                // Concentration card we prefer the output-format API (Payment
                // Metrics) when available per product requirements.
                if (
                  c.useRedFlags &&
                  String(c.subrule || "").toLowerCase() !==
                    "cc_txn_concentration"
                ) {
                  try {
                    let foundSub: any = undefined;
                    if (redFlagsData && Array.isArray(redFlagsData)) {
                      for (const rf of redFlagsData) {
                        if (!rf) continue;
                        const subs =
                          rf.subrules || rf.sub_rules || rf.subRule || [];
                        if (Array.isArray(subs)) {
                          for (const s of subs) {
                            const subname =
                              (s && (s.subrule || s.sub_rule || s.name)) ||
                              undefined;
                            if (
                              String(subname).toLowerCase() ===
                              String(c.subrule || "").toLowerCase()
                            ) {
                              foundSub = s;
                              break;
                            }
                          }
                        }
                        if (foundSub) break;
                      }
                    }

                    if (foundSub) {
                      // determine triggered status
                      const trig =
                        foundSub.triggered ??
                        foundSub.details?.triggered ??
                        foundSub.details?.triggered;
                      let isTriggered = false;
                      if (typeof trig === "boolean") isTriggered = trig;
                      else if (typeof trig === "string") {
                        const t = trig.trim().toLowerCase();
                        isTriggered = t === "yes" || t === "true" || t === "1";
                      } else if (typeof trig === "number") {
                        isTriggered = trig === 1;
                      }

                      const status: "yes" | "no" = isTriggered ? "yes" : "no";
                      return (
                        <WebsiteQualityCard
                          key={`beh-top-${idx}`}
                          name={c.name}
                          status={status}
                          invert={true}
                          reasoning={sanitizeReasoning(
                            foundSub.reasoning ??
                              foundSub.details?.reasoning ??
                              foundSub.reason ??
                              undefined
                          )}
                        />
                      );
                    }
                  } catch (e) {
                    // fall through to output-format handling below
                  }
                  // if we didn't find a red-flag entry, fall through and render
                  // based on output-format (or as noData below)
                }

                if (flag === true || flag === false) {
                  const status: "yes" | "no" = flag ? "yes" : "no";
                  // If this value was sourced from Payment Metrics (cc_txn_concentration)
                  // then treat API `true` as an alert; this makes `false` render a green check.
                  const apiTrueIsAlert =
                    foundFromPaymentMetrics ||
                    String(c.subrule || "").toLowerCase() ===
                      "cc_txn_concentration";

                  return (
                    <WebsiteQualityCard
                      key={`beh-top-${idx}`}
                      name={c.name}
                      status={status}
                      invert={true}
                      apiTrueIsAlert={apiTrueIsAlert}
                      reasoning={sanitizeReasoning(reasoningToUse ?? undefined)}
                    />
                  );
                }

                return (
                  <WebsiteQualityCard
                    key={`beh-top-${idx}`}
                    name={c.name}
                    status={"no"}
                    invert={true}
                    noData={true}
                    reasoning={sanitizeReasoning(reasoningToUse ?? undefined)}
                  />
                );
              });
            })()}
          </div>
        </div>
      </motion.div>
    );
  };

  // Volume Analysis intentionally removed — UI section deleted per request.

  const renderPatternAnalysisSection = () => {
    if (patternMetricsData.length === 0) {
      return null;
    }

    const flags = transformRedFlags(patternAnalysisData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Pattern Analysis"
            icon={getIconByName("LineChart") || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            flagTypeOrderList={[]}
            initialRowLimit={5}
            allowCollapse={true}
            defaultExpanded={true}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CustomTableView
            headerAndTotalRowBg="gray-100"
            columns={volumeMetricsColumns}
            data={patternMetricsData}
            initialRowLimit={patternMetricsData.length}
            isExpanded={true}
            showCSVExport={false}
            enableAlternatingRows={true}
            alternatingRowColor="gray"
          />
        </motion.div>
      </>
    );
  };

  // Render Status Analysis section
  const renderStatusAnalysisSection = () => {
    const flags = transformRedFlags(transactionStatusData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Status Analysis"
            icon={getIconByName("Activity") || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            flagTypeOrderList={[]}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={true}
            toggles={[
              {
                id: "transactionType",
                options: [
                  "All Transactions",
                  "Successful Transactions",
                  "Unsuccessful Transactions",
                ],
                selectedOption: selectedStatusTransactionType,
                onOptionChange: setSelectedStatusTransactionType,
                position: "right",
                size: "small",
                icons: {
                  "All Transactions": ListIcon ? (
                    <ListIcon className="w-3 h-3" />
                  ) : null,
                  "Successful Transactions": CheckCircle2Icon ? (
                    <CheckCircle2Icon className="w-3 h-3" />
                  ) : null,
                  "Unsuccessful Transactions": AlertTriangleIcon ? (
                    <AlertTriangleIcon className="w-3 h-3" />
                  ) : null,
                },
              },
              {
                id: "viewType",
                options: ["By Count", "By Amount"],
                selectedOption: selectedStatusToggleOption,
                onOptionChange: setSelectedStatusToggleOption,
                position: "right",
                size: "small",
                icons: {
                  "By Count": HashIcon ? (
                    <HashIcon className="w-3 h-3" />
                  ) : null,
                  "By Amount": CurrencyIcon ? (
                    <CurrencyIcon className="w-3 h-3" />
                  ) : null,
                },
              },
            ]}
          />
        </motion.div>

        {transactionStatusLoading ? (
          <motion.div variants={itemVariants}>
            <CustomLoader
              loading={true}
              specs={{ text: "Loading status analysis..." }}
            />
          </motion.div>
        ) : transactionStatusData?.data &&
          transactionStatusData.data.length > 0 ? (
          <motion.div variants={itemVariants}>
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={statusAnalysisColumns}
              data={statusTableData}
              initialRowLimit={statusTableData.length}
              isExpanded={true}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              hasTotalRow={true}
              totalableColumns={["lifetime", "past30d", "past7d", "past1d"]}
              totalsFormat={statusTotalsFormat}
              totalsLabelKey="rowLabel"
              percentageColumns={["lifetime", "past30d", "past7d", "past1d"]}
              columnColorShading={[
                {
                  columnKey: "lifetime",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past30d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past7d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past1d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
              ]}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState message="No data available for Status Analysis" />
          </motion.div>
        )}
      </>
    );
  };

  // Render Mode Analysis section
  const renderModeAnalysisSection = () => {
    const flags = transformRedFlags(transactionModeData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Mode Analysis"
            icon={getIconByName("Navigation") || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            flagTypeOrderList={[]}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={true}
            toggles={[
              {
                id: "transactionType",
                options: [
                  "All Transactions",
                  "Successful Transactions",
                  "Unsuccessful Transactions",
                ],
                selectedOption: selectedModeTransactionType,
                onOptionChange: setSelectedModeTransactionType,
                position: "right",
                size: "small",
                icons: {
                  "All Transactions": ListIcon ? (
                    <ListIcon className="w-3 h-3" />
                  ) : null,
                  "Successful Transactions": CheckCircle2Icon ? (
                    <CheckCircle2Icon className="w-3 h-3" />
                  ) : null,
                  "Unsuccessful Transactions": AlertTriangleIcon ? (
                    <AlertTriangleIcon className="w-3 h-3" />
                  ) : null,
                },
              },
              {
                id: "viewType",
                options: ["By Count", "By Amount"],
                selectedOption: selectedModeToggleOption,
                onOptionChange: setSelectedModeToggleOption,
                position: "right",
                size: "small",
                icons: {
                  "By Count": HashIcon ? (
                    <HashIcon className="w-3 h-3" />
                  ) : null,
                  "By Amount": CurrencyIcon ? (
                    <CurrencyIcon className="w-3 h-3" />
                  ) : null,
                },
              },
            ]}
          />
        </motion.div>

        {transactionModeLoading ? (
          <motion.div variants={itemVariants}>
            <CustomLoader
              loading={true}
              specs={{ text: "Loading mode analysis..." }}
            />
          </motion.div>
        ) : transactionModeData?.data && transactionModeData.data.length > 0 ? (
          <motion.div variants={itemVariants}>
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={modeAnalysisColumns}
              data={modeTableData}
              initialRowLimit={modeTableData.length}
              isExpanded={true}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              hasTotalRow={true}
              totalableColumns={["lifetime", "past30d", "past7d", "past1d"]}
              totalsFormat={currencyTotalsFormat}
              totalsLabelKey="rowLabel"
              percentageColumns={["lifetime", "past30d", "past7d", "past1d"]}
              columnColorShading={[
                {
                  columnKey: "lifetime",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past30d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past7d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past1d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
              ]}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState message="No data available for Mode Analysis" />
          </motion.div>
        )}
      </>
    );
  };

  // Render Gateway Analysis section
  const renderGatewayAnalysisSection = () => {
    const flags = transformRedFlags(transactionGatewayData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="International Gateway Analysis"
            icon={getIconByName("Globe") || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            flagTypeOrderList={[]}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={true}
            toggles={[
              {
                id: "viewType",
                options: ["By Count", "By Amount"],
                selectedOption: selectedGatewayToggleOption,
                onOptionChange: setSelectedGatewayToggleOption,
                position: "right",
                size: "small",
                icons: {
                  "By Count": HashIcon ? (
                    <HashIcon className="w-3 h-3" />
                  ) : null,
                  "By Amount": CurrencyIcon ? (
                    <CurrencyIcon className="w-3 h-3" />
                  ) : null,
                },
              },
            ]}
          />
        </motion.div>

        {transactionGatewayLoading ? (
          <motion.div variants={itemVariants}>
            <CustomLoader
              loading={true}
              specs={{ text: "Loading gateway analysis..." }}
            />
          </motion.div>
        ) : transactionGatewayData?.data &&
          transactionGatewayData.data.length > 0 ? (
          <motion.div variants={itemVariants}>
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={gatewayAnalysisColumns}
              data={gatewaySummaryData}
              initialRowLimit={gatewaySummaryData.length}
              isExpanded={true}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              hasTotalRow={false}
              totalableColumns={["lifetime", "past30d", "past7d"]}
              totalsFormat={gatewayTotalsFormat}
              totalsLabelKey="rowLabel"
              percentageColumns={[]}
              columnColorShading={[
                {
                  columnKey: "lifetime",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past30d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past7d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
              ]}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState message="No data available for Gateway Analysis" />
          </motion.div>
        )}
      </>
    );
  };

  // Render Time Analysis section
  const renderTimeAnalysisSection = () => {
    const flags = transformRedFlags(transactionTimeData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Time Analysis"
            icon={getIconByName("CalendarClock") || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            flagTypeOrderList={[]}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={true}
            toggles={[
              {
                id: "transactionType",
                options: [
                  "All Transactions",
                  "Successful Transactions",
                  "Unsuccessful Transactions",
                ],
                selectedOption: selectedTimeTransactionType,
                onOptionChange: setSelectedTimeTransactionType,
                position: "right",
                size: "small",
                icons: {
                  "All Transactions": ListIcon ? (
                    <ListIcon className="w-3 h-3" />
                  ) : null,
                  "Successful Transactions": CheckCircle2Icon ? (
                    <CheckCircle2Icon className="w-3 h-3" />
                  ) : null,
                  "Unsuccessful Transactions": AlertTriangleIcon ? (
                    <AlertTriangleIcon className="w-3 h-3" />
                  ) : null,
                },
              },
              {
                id: "viewType",
                options: ["By Count", "By Amount"],
                selectedOption: selectedTimeToggleOption,
                onOptionChange: setSelectedTimeToggleOption,
                position: "right",
                size: "small",
                icons: {
                  "By Count": HashIcon ? (
                    <HashIcon className="w-3 h-3" />
                  ) : null,
                  "By Amount": CurrencyIcon ? (
                    <CurrencyIcon className="w-3 h-3" />
                  ) : null,
                },
              },
            ]}
          />
        </motion.div>

        {transactionTimeLoading ? (
          <motion.div variants={itemVariants}>
            <CustomLoader
              loading={true}
              specs={{ text: "Loading time analysis..." }}
            />
          </motion.div>
        ) : transactionTimeData?.data && transactionTimeData.data.length > 0 ? (
          <motion.div variants={itemVariants}>
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={timeAnalysisColumns}
              data={timeTableData}
              initialRowLimit={timeTableData.length}
              isExpanded={true}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              hasTotalRow={true}
              totalableColumns={["lifetime", "past30d", "past7d", "past1d"]}
              totalsFormat={timeTotalsFormat}
              totalsLabelKey="rowLabel"
              percentageColumns={["lifetime", "past30d", "past7d", "past1d"]}
              columnColorShading={[
                {
                  columnKey: "lifetime",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past30d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past7d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past1d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
              ]}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState message="No data available for Time Analysis" />
          </motion.div>
        )}
      </>
    );
  };

  // Render Proxy Analysis section
  const renderProxyAnalysisSection = () => {
    const flags = transformRedFlags(transactionProxyData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Proxy Analysis"
            icon={getIconByName("Server") || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            flagTypeOrderList={[]}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={true}
            toggles={[
              {
                id: "transactionType",
                options: [
                  "All Transactions",
                  "Successful Transactions",
                  "Unsuccessful Transactions",
                ],
                selectedOption: selectedProxyTransactionType,
                onOptionChange: setSelectedProxyTransactionType,
                position: "right",
                size: "small",
                icons: {
                  "All Transactions": ListIcon ? (
                    <ListIcon className="w-3 h-3" />
                  ) : null,
                  "Successful Transactions": CheckCircle2Icon ? (
                    <CheckCircle2Icon className="w-3 h-3" />
                  ) : null,
                  "Unsuccessful Transactions": AlertTriangleIcon ? (
                    <AlertTriangleIcon className="w-3 h-3" />
                  ) : null,
                },
              },
              {
                id: "viewType",
                options: ["By Count", "By Amount"],
                selectedOption: selectedProxyToggleOption,
                onOptionChange: setSelectedProxyToggleOption,
                position: "right",
                size: "small",
                icons: {
                  "By Count": HashIcon ? (
                    <HashIcon className="w-3 h-3" />
                  ) : null,
                  "By Amount": CurrencyIcon ? (
                    <CurrencyIcon className="w-3 h-3" />
                  ) : null,
                },
              },
            ]}
          />
        </motion.div>

        {transactionProxyLoading ? (
          <motion.div variants={itemVariants}>
            <CustomLoader
              loading={true}
              specs={{ text: "Loading proxy analysis..." }}
            />
          </motion.div>
        ) : transactionProxyData?.data &&
          transactionProxyData.data.length > 0 ? (
          <motion.div variants={itemVariants}>
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={proxyAnalysisColumns}
              data={proxyTableData}
              initialRowLimit={proxyTableData.length}
              isExpanded={true}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              hasTotalRow={true}
              totalableColumns={["lifetime", "past30d", "past7d", "past1d"]}
              totalsFormat={proxyTotalsFormat}
              totalsLabelKey="rowLabel"
              percentageColumns={["lifetime", "past30d", "past7d", "past1d"]}
              columnColorShading={[
                {
                  columnKey: "lifetime",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past30d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past7d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past1d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
              ]}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState message="No data available for Proxy Analysis" />
          </motion.div>
        )}
      </>
    );
  };

  // Render Region Analysis section
  const renderRegionAnalysisSection = () => {
    const flags = transformRedFlags(transactionRegionData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Region Analysis"
            icon={getIconByName("MapPin") || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            // hide flag counts in the header per UX request
            flagTypeOrderList={[]}
            // titleRightElement={
            //   <div>
            //     {regionTableData && regionTableData.length > 10 ? (
            //       <button
            //         onClick={() => setIsRegionExpanded(!isRegionExpanded)}
            //         className="text-sm text-blue-600"
            //       >
            //         {isRegionExpanded ? "Show less" : "Show more"}
            //       </button>
            //     ) : null}
            //   </div>
            // }
            initialRowLimit={10}
            allowCollapse={false}
            defaultExpanded={true}
            toggles={[
              {
                id: "transactionType",
                options: [
                  "All Transactions",
                  "Successful Transactions",
                  "Unsuccessful Transactions",
                ],
                selectedOption: selectedRegionTransactionType,
                onOptionChange: setSelectedRegionTransactionType,
                position: "right",
                size: "small",
                icons: {
                  "All Transactions": ListIcon ? (
                    <ListIcon className="w-3 h-3" />
                  ) : null,
                  "Successful Transactions": CheckCircle2Icon ? (
                    <CheckCircle2Icon className="w-3 h-3" />
                  ) : null,
                  "Unsuccessful Transactions": AlertTriangleIcon ? (
                    <AlertTriangleIcon className="w-3 h-3" />
                  ) : null,
                },
              },
              {
                id: "viewType",
                options: ["By Count", "By Amount"],
                selectedOption: selectedRegionToggleOption,
                onOptionChange: setSelectedRegionToggleOption,
                position: "right",
                size: "small",
                icons: {
                  "By Count": HashIcon ? (
                    <HashIcon className="w-3 h-3" />
                  ) : null,
                  "By Amount": CurrencyIcon ? (
                    <CurrencyIcon className="w-3 h-3" />
                  ) : null,
                },
              },
            ]}
          />
        </motion.div>

        {transactionRegionLoading ? (
          <motion.div variants={itemVariants}>
            <CustomLoader
              loading={true}
              specs={{ text: "Loading region analysis..." }}
            />
          </motion.div>
        ) : transactionRegionData?.data &&
          transactionRegionData.data.length > 0 ? (
          <motion.div variants={itemVariants}>
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={regionAnalysisColumns}
              data={regionTableData}
              // show only first 10 rows by default; expand when toggled
              initialRowLimit={isRegionExpanded ? regionTableData.length : 10}
              isExpanded={isRegionExpanded}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              hasTotalRow={true}
              totalableColumns={["lifetime", "past30d", "past7d", "past1d"]}
              totalsFormat={regionTotalsFormat}
              totalsLabelKey="rowLabel"
              percentageColumns={["lifetime", "past30d", "past7d", "past1d"]}
              columnColorShading={[
                {
                  columnKey: "lifetime",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past30d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past7d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past1d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
              ]}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState message="No data available for Region Analysis" />
          </motion.div>
        )}
      </>
    );
  };

  // Render Currency Analysis section
  const renderCurrencyAnalysisSection = () => {
    const flags = transformRedFlags(transactionCurrencyData?.redFlags);

    return (
      <>
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Currency Analysis"
            icon={CurrencyIcon || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={flags.extremeNegativeFlags}
            negativeFlags={flags.negativeFlags}
            mildNegativeFlags={flags.mildNegativeFlags}
            neutralFlags={flags.neutralFlags}
            mildPositiveFlags={flags.mildPositiveFlags}
            positiveFlags={flags.positiveFlags}
            flagTypeOrderList={[]}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={true}
            toggles={[
              {
                id: "transactionType",
                options: [
                  "All Transactions",
                  "Successful Transactions",
                  "Unsuccessful Transactions",
                ],
                selectedOption: selectedCurrencyTransactionType,
                onOptionChange: setSelectedCurrencyTransactionType,
                position: "right",
                size: "small",
                icons: {
                  "All Transactions": ListIcon ? (
                    <ListIcon className="w-3 h-3" />
                  ) : null,
                  "Successful Transactions": CheckCircle2Icon ? (
                    <CheckCircle2Icon className="w-3 h-3" />
                  ) : null,
                  "Unsuccessful Transactions": AlertTriangleIcon ? (
                    <AlertTriangleIcon className="w-3 h-3" />
                  ) : null,
                },
              },
              {
                id: "viewType",
                options: ["By Count", "By Amount"],
                selectedOption: selectedCurrencyToggleOption,
                onOptionChange: setSelectedCurrencyToggleOption,
                position: "right",
                size: "small",
                icons: {
                  "By Count": HashIcon ? (
                    <HashIcon className="w-3 h-3" />
                  ) : null,
                  "By Amount": CurrencyIcon ? (
                    <CurrencyIcon className="w-3 h-3" />
                  ) : null,
                },
              },
            ]}
          />
        </motion.div>

        {transactionCurrencyLoading ? (
          <motion.div variants={itemVariants}>
            <CustomLoader
              loading={true}
              specs={{ text: "Loading currency analysis..." }}
            />
          </motion.div>
        ) : transactionCurrencyData?.data &&
          transactionCurrencyData.data.length > 0 ? (
          <motion.div variants={itemVariants}>
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={currencyAnalysisColumns}
              data={currencyTableData}
              initialRowLimit={currencyTableData.length}
              isExpanded={true}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              hasTotalRow={true}
              totalableColumns={["lifetime", "past30d", "past7d", "past1d"]}
              totalsFormat={modeTotalsFormat}
              totalsLabelKey="rowLabel"
              percentageColumns={["lifetime", "past30d", "past7d", "past1d"]}
              columnColorShading={[
                {
                  columnKey: "lifetime",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past30d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past7d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
                {
                  columnKey: "past1d",
                  minColor: "white",
                  maxColor: "blue-100",
                },
              ]}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState message="No data available for Currency Analysis" />
          </motion.div>
        )}
      </>
    );
  };

  return (
    <motion.div
      className="space-y-6 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {selectedCase && (
        <motion.div variants={itemVariants}>
          <InvPageHeader activeCase={selectedCase} />
        </motion.div>
      )}

      {/* Transaction & Price Pattern Flags (moved here from Transaction Details) */}
      {renderTransactionPatternFlagsSection()}

      {/* Transaction Details (moved from Overview) */}
      {renderTransactionDetailsSection()}

      {/* Key Metrics Section */}
      {renderKeyMetricsSection()}

      {/* Pattern Analysis Section */}
      {renderPatternAnalysisSection()}

      {/* Mode Analysis Section */}
      {renderModeAnalysisSection()}

      {/* Status Analysis Section */}
      {renderStatusAnalysisSection()}

      {/* International Gateway Analysis Section */}
      {renderGatewayAnalysisSection()}

      {/* Region Analysis Section */}
      {renderRegionAnalysisSection()}

      {/* Currency Analysis Section */}
      {renderCurrencyAnalysisSection()}

      {/* Volume Analysis Section removed */}

      {/* Time Analysis Section */}
      {renderTimeAnalysisSection()}

      {/* Proxy Analysis Section */}
      {renderProxyAnalysisSection()}

      {!hasActiveCase && (
        <motion.div variants={itemVariants}>
          <p className="text-gray-600">
            No active investigation ID. Select one from the search bar in the
            top-right of the page.
          </p>
          {merchantId && (
            <p className="text-sm text-gray-500 mt-2">
              Merchant ID: {merchantId}
            </p>
          )}
          {caseId && (
            <p className="text-sm text-gray-500 mt-2">Case ID: {caseId}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default InvTransactionAnalysisTab;
