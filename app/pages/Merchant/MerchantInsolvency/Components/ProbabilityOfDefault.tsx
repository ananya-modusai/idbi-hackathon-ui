import { FC, useEffect, useState, useCallback, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { useRiskMetricsStore } from "@/app/store/merchant/riskMetricsStore";
import { useMerchantIdStore } from "@/app/store/merchant/merchantIdStore";
import { ArrowDownToLine } from "lucide-react";
import PDStats from "./PDStats";
import PDInfo from "./PDInfo";
import { API } from "@/app/services/axios";
import {
  industryService,
  MerchantIndustry,
} from "@/app/services/industryServices";
import { merchantService } from "@/app/services/merchantServices";
import {
  getTextColorClass,
  ColorScheme,
} from "@/components/custom/CustomColorScheme";
import {
  watchlistService,
  WatchlistItem,
  getCachedWatchlistItem,
} from "@/app/services/watchlistServices";
import { useProfileStore } from "@/app/store/authentication/profileStore";
import { SegmentedBar } from "./SegmentedBarComponent";
import { RiskBar } from "./RiskBarComponent";
import { getConglomerateName } from '@/app/utils/conglomerateMapping';
import { useMerchantVersionsStore } from "@/app/store/merchant/merchantVersionsStore";

interface ProbabilityOfDefaultProps {
  merchantId: string;
  versionNo?: number | null; 
  date?: string | null;
  // Optional watchlist item provided by a parent component to avoid refetching 
  watchlistItem?: WatchlistItem | null;
  showIndustrialMaterials?: boolean;
  onToggleChange?: (value: boolean) => void;
}

interface PDBreakdownMetricProps {
  value: ReactNode;
  label: string;
  valueClassName?: string;
  onInfoClick: () => void;
}

const PDBreakdownMetric: FC<PDBreakdownMetricProps> = ({
  value,
  label,
  valueClassName = "text-gray-600",
  onInfoClick,
}) => (
  <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
    <div className="flex min-h-[2rem] w-full items-center justify-center gap-1">
      <span
        className={`whitespace-nowrap text-xl font-bold leading-none ${valueClassName}`}
      >
        {value}
      </span>
      <button
        onClick={onInfoClick}
        className="shrink-0 p-0.5 text-gray-600 hover:text-gray-700"
        title="More information"
      >
        <Info size={16} />
      </button>
    </div>
    <p className="w-full text-xs leading-snug text-gray-600">{label}</p>
  </div>
);

const ProbabilityOfDefault: FC<ProbabilityOfDefaultProps> = ({
  merchantId,
  versionNo,
  date,
  watchlistItem: watchlistItemProp,
  showIndustrialMaterials: showIndustrialMaterialsProp,
  onToggleChange,
}) => {
  const { metrics, loading, error, fetchRiskMetrics, updateRiskMetrics } =
    useRiskMetricsStore();
  
  // State variables for editable fields
  const [localCPV, setLocalCPV] = useState<number | null>(null);
  const [localTPV, setLocalTPV] = useState<number | null>(null);
  const [localCollateral, setLocalCollateral] = useState<number | null>(null);
  const [localADD, setLocalADD] = useState<number | null>(null);

  const [syncedMerchantId, setSyncedMerchantId] = useState<string | null>(null);

  // Synchronously reset internal and global store state if merchant changed since last render.
  // This is performed during render to ensure stale data is NEVER shown to the user,
  // preventing the "flash" of previous merchant data while waiting for effects to run.
  const [renderedMerchantId, setRenderedMerchantId] = useState(merchantId);
  if (renderedMerchantId !== merchantId) {
    setRenderedMerchantId(merchantId);
    // Reset local component state
    setLocalCPV(null);
    setLocalTPV(null);
    setLocalCollateral(null);
    setLocalADD(null);
    setSyncedMerchantId(null);
    // Reset global metrics store for this component section
    useRiskMetricsStore.setState({ metrics: null, error: null, loading: true });
  }

  const { selectedMerchant, fetchMerchantDetails } = useMerchantIdStore();
  const { organizationId, fetchProfile } = useProfileStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshingAfterUpdate, setIsRefreshingAfterUpdate] = useState(false);

  const [showPDInfo, setShowPDInfo] = useState(false);
  const [showRiskInfo, setShowRiskInfo] = useState(false);
  const [showIndustryRiskInfo, setShowIndustryRiskInfo] = useState(false);
  const [showFinancialPdInfo, setShowFinancialPdInfo] = useState(false);
  const [showSentimentPdInfo, setShowSentimentPdInfo] = useState(false);
  const [showConglomerateInfo, setShowConglomerateInfo] = useState(false);
  const [showMoatInfo, setShowMoatInfo] = useState(false);

  // Use props if provided, otherwise fallback to local state
  const [internalShowIndustrialMaterials, setInternalShowIndustrialMaterials] = useState(true);
  const showIndustrialMaterials = showIndustrialMaterialsProp !== undefined ? showIndustrialMaterialsProp : internalShowIndustrialMaterials;
  const setShowIndustrialMaterials = (val: boolean) => {
    if (onToggleChange) {
      onToggleChange(val);
    } else {
      setInternalShowIndustrialMaterials(val);
    }
  };

  const [industryAdd, setIndustryAdd] = useState<number | null>(null);
  const [industryAddLoading, setIndustryAddLoading] = useState(false);
  const [industryRisk, setIndustryRisk] = useState<MerchantIndustry | null>(
    null
  );
  const [industryRiskLoading, setIndustryRiskLoading] = useState(false);
  const [watchlistItem, setWatchlistItem] = useState<WatchlistItem | null>(
    null
  );
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  // check for a cached item synchronously to avoid calling API again
  // (getCachedWatchlistItem is exported from watchlistService)
  useEffect(() => {
    // If a watchlistItem was provided as prop, use it and do not fetch
    if (watchlistItemProp) {
      setWatchlistItem(watchlistItemProp);
      setWatchlistLoading(false);
      return;
    }

    // Attempt to synchronously read from cache (only if we have an org id)
    try {
      if (organizationId) {
        const cached = getCachedWatchlistItem(organizationId, merchantId);
        if (cached) {
          setWatchlistItem(cached);
          setWatchlistLoading(false);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [organizationId, merchantId, watchlistItemProp]);

  // Reset states when merchant changes
  useEffect(() => {
    if (merchantId) {
      // Reset all local states
      setLocalCPV(null);
      setLocalTPV(null);
      setLocalCollateral(null);
      setLocalADD(null);
      setIndustryAdd(null);
      setIndustryAddLoading(false);
      setIndustryRisk(null);
      setIndustryRiskLoading(false);
      setWatchlistItem(null);
      setShowIndustrialMaterials(true); // Reset to industry default until metrics load
      // Only fetch merchant details here, don't fetch metrics without parameters
      fetchMerchantDetails(merchantId);
    }
  }, [merchantId, fetchMerchantDetails]);
  
  const { fetchVersions } = useMerchantVersionsStore();

  // Always resolve the merchant's available versions first, then call
  // getRiskMetrics with the version/date derived from the versions API.
  // This guarantees the getRiskMetrics call uses the authoritative
  // run/version information returned by the server instead of stale or
  // missing params when the active merchant changes.
  useEffect(() => {
    let cancelled = false;

    const resolveAndFetch = async () => {
      if (!merchantId) return;

      // If we already have both versionNo and date from props, trust them
      // and skip the redundant versions lookup. This avoids unnecessary 
      // network calls and prevents potential race conditions or 
      // "resolving" to the wrong date when a specific one was requested.
      if (versionNo !== null && versionNo !== undefined && date) {
        if (!cancelled) {
          await fetchRiskMetrics(merchantId, Number(versionNo), date);
        }
        return;
      }

      try {
        const versions = await fetchVersions(merchantId);

        // If the versions API failed or returned nothing, do not call
        // getRiskMetrics because we must not call it without params.
        if (!Array.isArray(versions) || versions.length === 0) {
          // If the parent did provide (partial) params, fall back to those
          if ((versionNo !== null && versionNo !== undefined) || date) {
            await fetchRiskMetrics(
              merchantId, 
              versionNo !== null && versionNo !== undefined ? Number(versionNo) : undefined, 
              date ?? undefined
            );
          }
          return;
        }

        // Determine which version entry to use:
        // - If caller provided versionNo, try to find matching entry and use
        //   its date (to ensure consistency).
        // - Otherwise pick the first returned version (server's preferred one).
        let chosen: any = null;
        if (versionNo !== null && versionNo !== undefined) {
          chosen = versions.find((v: any) => Number(v?.version ?? v?.version_no) === Number(versionNo));
        }
        if (!chosen) chosen = versions[0];

        const resolvedVersion = chosen?.version ?? chosen?.version_no ?? null;
        const resolvedDate = chosen?.date ?? chosen?.run_date ?? null;

        if (!cancelled && (resolvedVersion !== null || resolvedDate)) {
          await fetchRiskMetrics(
            merchantId,
            resolvedVersion !== null ? Number(resolvedVersion) : undefined,
            resolvedDate ?? undefined
          );
        }
      } catch (err) {
        console.debug("Failed to resolve merchant versions before fetching metrics:", err);
        // If versions lookup fails, fallback to calling fetchRiskMetrics
        // only if the parent supplied params — do not call without params.
        if (!cancelled && ((versionNo !== null && versionNo !== undefined) || date)) {
          try {
            await fetchRiskMetrics(merchantId, versionNo, date);
          } catch (e) {
            // ignore
          }
        }
      }
    };

    resolveAndFetch();

    return () => {
      cancelled = true;
    };
  }, [merchantId, versionNo, date, fetchRiskMetrics, fetchVersions]);

  // Initialize local state when metrics are loaded
  // Only update local state on initial load (when local state is null) or after an update (when refreshing)
  // This prevents overwriting user edits that haven't been saved yet
  useEffect(() => {
    if (metrics && !loading && metrics.merchant_id === merchantId) {
      const shouldSync = 
        // Sync if we haven't synced for this merchant yet
        syncedMerchantId !== merchantId ||
        // Or if we're refreshing after an update
        isRefreshingAfterUpdate;
      
      if (shouldSync) {
        const metricsAny = metrics as any;
        // For PD calculations and local initial values, always use the raw metric
        // fields (cpv_daily, tpv_daily, collateral). Do not prefer MRM values
        // here to avoid showing MRM-overridden numbers in the PD section.
        setLocalCPV(
          typeof metricsAny?.cpv_daily === 'number' ? metricsAny.cpv_daily : (metrics.cpv_daily || 0)
        );
        setLocalTPV(
          typeof metricsAny?.tpv_daily === 'number' ? metricsAny.tpv_daily : (metrics.tpv_daily || 0)
        );
        setLocalCollateral(
          typeof metricsAny?.collateral === 'number' ? metricsAny.collateral : (metrics.collateral || 0)
        );
        setLocalADD(
          typeof metricsAny?.add_days === 'number' ? metricsAny.add_days : (metrics.add_days || 0)
        );
        
        // Determine if we should default to Company ADD or Industry ADD based on availability of company add_days
        const rawAdd = metricsAny?.add_days;
        const hasAddValue = rawAdd !== null && 
                           rawAdd !== undefined && 
                           !(typeof rawAdd === 'string' && /^(NA|N\/A)$/i.test(rawAdd)) &&
                           (typeof rawAdd === 'number');
        
        // If add_days is present, select Company ADD (showIndustrialMaterials = false)
        setShowIndustrialMaterials(!hasAddValue);
        
        // Mark as synced for this merchant
        setSyncedMerchantId(merchantId);
        
        // Reset the refresh flag after syncing
        if (isRefreshingAfterUpdate) {
          setIsRefreshingAfterUpdate(false);
        }
      }
    }
  }, [metrics, loading, merchantId, syncedMerchantId, isRefreshingAfterUpdate]);

  // Fetch industry-specific ADD when toggle is enabled
  const fetchIndustryAdd = useCallback(async () => {
    if (!merchantId) return;
    try {
      setIndustryAddLoading(true);
      const addValue = await industryService.getIndustryAdd(merchantId);
      setIndustryAdd(addValue);
    } catch (error) {
      console.error("Failed to fetch industry ADD:", error);
      setIndustryAdd(null);
    } finally {
      setIndustryAddLoading(false);
    }
  }, [merchantId]);

  // Fetch industry risk data
  const fetchIndustryRisk = useCallback(async () => {
    if (!merchantId) return;
    try {
      setIndustryRiskLoading(true);
      const result = await industryService.getMerchantIndustry(merchantId);
      setIndustryRisk(result);
    } catch (error) {
      console.error("Failed to fetch industry risk:", error);
      setIndustryRisk(null);
    } finally {
      setIndustryRiskLoading(false);
    }
  }, [merchantId]);

  // Fetch industry ADD when merchant changes or toggle is enabled
  useEffect(() => {
    if (showIndustrialMaterials && merchantId) {
      fetchIndustryAdd();
    }
  }, [showIndustrialMaterials, merchantId, fetchIndustryAdd]);

  // Fetch industry risk when merchant changes
  useEffect(() => {
    if (merchantId) {
      fetchIndustryRisk();
    }
  }, [merchantId, fetchIndustryRisk]);

  // Fetch watchlist data to get PD breakdown values only if we don't already
  // have a watchlist item from props or the synchronous cache.
  const fetchWatchlistData = useCallback(async () => {
    if (!organizationId || !merchantId) return;

    // If we already have a watchlistItem (from props or cache), skip network call
    if (watchlistItem) return;

    try {
      setWatchlistLoading(true);
      const result = await watchlistService.getOrganizationWatchlist(
        organizationId
      );
      if (result.success && result.data) {
        const matchingItem = result.data.find((item: WatchlistItem) => item.merchant_id === merchantId);
        setWatchlistItem(matchingItem || null);
      }
    } catch (error) {
      console.error("Failed to fetch watchlist data:", error);
      setWatchlistItem(null);
    } finally {
      setWatchlistLoading(false);
    }
  }, [organizationId, merchantId, watchlistItem]);

  // Fetch profile if not available
  useEffect(() => {
    if (!organizationId) {
      fetchProfile();
    }
  }, [organizationId, fetchProfile]);

  // Fetch watchlist data when organizationId or merchantId changes (only if needed)
  useEffect(() => {
    if (organizationId && merchantId && !watchlistItem) {
      fetchWatchlistData();
    }
  }, [organizationId, merchantId, fetchWatchlistData, watchlistItem]);

  // Generate histogram data for 0-100% in 5% increments with a declining trend
  const histogramData = Array.from({ length: 7 }, (_, i) => {
    const start = i * 5;
    const end = start + 5;
    const count = Math.round(450 * Math.exp(-0.5 * i));
    return {
      bucket: i === 6 ? "30%+" : `${start}%`, // Show lower bound for all bars, last bucket shows 30%+
      count,
      pdRange: [start, end],
    };
  });

  // Calculate derived values from API metrics and local state
  const calculateDerivedValues = () => {
    if (!metrics || metrics.merchant_id !== merchantId) return null;

    const metricsAny = metrics as any;
    // For PD calculations, always use the raw metric fields (cpv_daily,
    // tpv_daily, collateral). Local edits still take precedence for immediate
    // UI feedback, but MRM values are intentionally ignored here.
    const cpvDaily = localCPV !== null
      ? localCPV
      : (typeof metricsAny?.cpv_daily === 'number' ? metricsAny.cpv_daily : (metrics.cpv_daily || 0));
    const tpvDaily = localTPV !== null
      ? localTPV
      : (typeof metricsAny?.tpv_daily === 'number' ? metricsAny.tpv_daily : (metrics.tpv_daily || 0));
    const collateral = localCollateral !== null
      ? localCollateral
      : (typeof metricsAny?.collateral === 'number' ? metricsAny.collateral : (metrics.collateral || 0));
    // LGD: Always use lgd_rate (not mrm_lgd) for UI display
    const lgdRate = typeof metrics.lgd_rate === 'number' ? metrics.lgd_rate : 0;
    const addDays = localADD !== null
      ? localADD
      : (typeof metrics.add_days === 'number' ? metrics.add_days : 0);
    const pdScore = ((): number => {
      const m = metrics as any;
      if (typeof m.final_pd === 'number') return m.final_pd;
      if (typeof m.pd_score === 'number') return m.pd_score;
      // fallback to older key names
      if (typeof m.pd === 'number') return m.pd;
      return 0;
    })();
    const recoveryRate = typeof metrics.recovery_rate_on_default === 'number' ? metrics.recovery_rate_on_default : 1;

    // Calculate derived metrics
    const grossNDX = cpvDaily * addDays;
    const netNDX = grossNDX - collateral;
    const expectedLoss = (netNDX * lgdRate) / 100;
    const valueAtRisk = (netNDX * pdScore) / 100;
    const settlementDays = tpvDaily > 0 ? valueAtRisk / tpvDaily : 0;

    // Calculate risk segmentation based on PD score
    let riskSegmentation = "Medium Risk";
    if (pdScore < 5) riskSegmentation = "Low Risk";
    else if (pdScore >= 15) riskSegmentation = "High Risk";

    return {
      cpvDaily,
      tpvDaily,
      collateral,
      lgdRate,
      addDays,
      pdScore,
      recoveryRate,
      grossNDX,
      netNDX,
      expectedLoss,
      valueAtRisk,
      settlementDays,
      riskSegmentation,
    };
  };

  const derivedValues = calculateDerivedValues();
  const waitingForParams = merchantId && (versionNo === null || versionNo === undefined) && !date;

  if (loading || waitingForParams) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium animate-pulse">Loading probability of default analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics || !derivedValues) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle size={24} />
          <div>
            <h3 className="font-semibold text-lg">Risk Assessment Unavailable</h3>
            <p className="text-gray-600">
              {error || "Detailed risk metrics are not yet available for this merchant profile and selected date."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Whether the caller requested a specific version/date — if so, prefer values from the metrics response
  // Use useMemo to ensure this value doesn't change unexpectedly during re-renders
  const hasParams = (versionNo !== undefined && versionNo !== null) || Boolean(date);
  
  // When hasParams is true, we MUST only use values from the API response with parameters
  // Never fallback to watchlist or derived values when hasParams is true

  // Helper to read raw metric values (may be number or string like 'NA')
  const getMetricRaw = (key: string) => {
    const m = metrics as any;
    if (!m) return undefined;
    return m[key];
  };

  // Final PD raw value (could be number or 'NA')
  // When hasParams is true, only use final_pd (no fallback to pd_score)
  // When hasParams is false, fallback to pd_score if final_pd is not available
  const rawFinalPd = hasParams 
    ? getMetricRaw("final_pd")
    : (getMetricRaw("final_pd") ?? getMetricRaw("pd_score"));
  const finalPdIsNA = typeof rawFinalPd === "string" && /^(NA|N\/A)$/i.test(rawFinalPd);
  const finalPdNumber = typeof rawFinalPd === "number" ? rawFinalPd : undefined;

  const formatPercentOrNA = (raw: any) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === "string" && /^(NA|N\/A)$/i.test(raw)) return "N/A";
    if (typeof raw === "number") return `${raw.toFixed(2)}%`;
    return undefined;
  };

  // Formatter used specifically for PD displays where we prefer to show a
  // compact "0%" instead of "0.00%" when the value is exactly zero.
  const formatPercentPreferZero = (raw: any) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === "string" && /^(NA|N\/A)$/i.test(raw)) return "N/A";
    if (typeof raw === "number") {
      return raw === 0 ? `0%` : `${raw.toFixed(2)}%`;
    }
    return undefined;
  };

  // Display strings for PD and related fields when version/date params are present
  // When hasParams is true, only use API values, show "N/A" for "NA" values, no fallback
  const displayPD = (() => {
    if (rawFinalPd !== undefined && rawFinalPd !== null) {
      if (typeof rawFinalPd === "string") {
        return /^(NA|N\/A)$/i.test(rawFinalPd) ? "N/A" : rawFinalPd;
      }
      if (typeof rawFinalPd === "number") {
        return `${rawFinalPd.toFixed(2)}%`;
      }
      return "N/A";
    }

    if (!hasParams && derivedValues?.pdScore !== undefined && typeof derivedValues.pdScore === "number") {
      return `${derivedValues.pdScore.toFixed(2)}%`;
    }

    return "N/A";
  })();

  // Financial PD and sentiment: when params present, only use API values, show "N/A" for "NA" values, no fallback
  const rawFinancialPd = getMetricRaw("financial_pd_score");
  const rawSentimentPd = getMetricRaw("sentiment_score");
  const rawAddDays = getMetricRaw("add_days");
  
  const displayFinancialPd = hasParams
    ? (rawFinancialPd === undefined || rawFinancialPd === null ? "N/A" : (typeof rawFinancialPd === "string" && /^(NA|N\/A)$/i.test(rawFinancialPd) ? "N/A" : (typeof rawFinancialPd === "number" ? `${rawFinancialPd.toFixed(2)}%` : "N/A")))
    : (watchlistItem?.financial_pd_score !== undefined ? `${Number(watchlistItem.financial_pd_score).toFixed(2)}%` : (derivedValues?.pdScore !== undefined && typeof derivedValues.pdScore === 'number' ? `${derivedValues.pdScore.toFixed(2)}%` : "N/A"));

  const displaySentimentPd = hasParams
    ? (rawSentimentPd === undefined || rawSentimentPd === null ? "N/A" : (typeof rawSentimentPd === "string" && /^(NA|N\/A)$/i.test(rawSentimentPd) ? "N/A" : (typeof rawSentimentPd === "number" ? formatPercentPreferZero(rawSentimentPd) : "N/A")))
    : (watchlistItem?.sentiment_score !== undefined ? formatPercentPreferZero(Number(watchlistItem.sentiment_score)) : "N/A");

  // Financial breakdown source: when params present only use metrics.financial_breakdown (even if null)
  // When hasParams is true, don't fallback to watchlist - use API value or null
  const breakdownSourceStrict = hasParams 
    ? (metrics ? (metrics as any).financial_breakdown : null) 
    : (metrics && (metrics as any).financial_breakdown ? (metrics as any).financial_breakdown : watchlistItem?.financial_breakdown);

  // When hasParams is true and financial_pd_score is "NA" or breakdown is null, return null (no fallback)
  const liquidityCompStrict = hasParams
    ? (typeof rawFinancialPd === 'number' && typeof breakdownSourceStrict?.liquidity === "number"
        ? (breakdownSourceStrict!.liquidity / 100) * rawFinancialPd
        : null)
    : (typeof breakdownSourceStrict?.liquidity === "number"
        ? (breakdownSourceStrict!.liquidity / 100) * (watchlistItem?.financial_pd_score ?? (derivedValues?.pdScore || 0))
        : null);

  const leverageCompStrict = hasParams
    ? (typeof rawFinancialPd === 'number' && typeof breakdownSourceStrict?.leverage === "number"
        ? (breakdownSourceStrict!.leverage / 100) * rawFinancialPd
        : null)
    : (typeof breakdownSourceStrict?.leverage === "number"
        ? (breakdownSourceStrict!.leverage / 100) * (watchlistItem?.financial_pd_score ?? (derivedValues?.pdScore || 0))
        : null);

  const growthCompStrict = hasParams
    ? (typeof rawFinancialPd === 'number' && typeof breakdownSourceStrict?.growth === "number"
        ? (breakdownSourceStrict!.growth / 100) * rawFinancialPd
        : null)
    : (typeof breakdownSourceStrict?.growth === "number"
        ? (breakdownSourceStrict!.growth / 100) * (watchlistItem?.financial_pd_score ?? (derivedValues?.pdScore || 0))
        : null);

  // Calculate "other" component
  const otherCompStrict = hasParams
    ? (typeof rawFinancialPd === 'number' && typeof breakdownSourceStrict?.other === "number"
        ? (breakdownSourceStrict!.other / 100) * rawFinancialPd
        : null)
    : (typeof breakdownSourceStrict?.other === "number"
        ? (breakdownSourceStrict!.other / 100) * (watchlistItem?.financial_pd_score ?? (derivedValues?.pdScore || 0))
        : null);

  // Use strict breakdown values in rendering
  const liquidityCompUsed = liquidityCompStrict;
  const leverageCompUsed = leverageCompStrict;
  const growthCompUsed = growthCompStrict;
  const otherCompUsed = otherCompStrict;

  const getRiskSegment = (pdScore: number | null | undefined) => {
    if (pdScore === null || pdScore === undefined)
      return { label: "Medium", colorScheme: "yellow" as ColorScheme };

    if (pdScore < 2)
      return { label: "Very Low", colorScheme: "green" as ColorScheme };
    if (pdScore < 5)
      return { label: "Low", colorScheme: "green" as ColorScheme };
    if (pdScore < 10)
      return { label: "Medium", colorScheme: "yellow" as ColorScheme };
    if (pdScore < 15)
      return { label: "High", colorScheme: "orange" as ColorScheme };
    return { label: "Very High", colorScheme: "red" as ColorScheme };
  };

  // Helper function to get color scheme for industry risk segment
  const getIndustryRiskColorScheme = (
    riskSegment: string | null | undefined
  ): ColorScheme => {
    if (!riskSegment) return "gray";
    switch (riskSegment.toLowerCase()) {
      case "very low":
        return "green";
      case "low":
        return "blue";
      case "medium":
        return "yellow";
      case "high":
        return "orange";
      case "very high":
        return "red";
      default:
        return "gray";
    }
  };

  // Helper function to get color scheme for conglomerate risk (same as industry risk)
  const getConglomerateRiskColorScheme = (
    riskSegment: string | null | undefined
  ): ColorScheme => {
    return getIndustryRiskColorScheme(riskSegment);
  };

  // Light background helper for PD block (use lighter versions of the color)
  const getPdBackgroundClass = (scheme: ColorScheme) => {
    switch (scheme) {
      case "green":
        return "bg-green-50";
      case "blue":
        return "bg-blue-50";
      case "yellow":
        return "bg-yellow-50";
      case "orange":
        return "bg-orange-50";
      case "red":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  // Handle value changes and API updates using the same API as calculations tab
  const handleValueChange = async (
    newValue: string,
    setter: (value: number) => void,
    fieldName: string
  ) => {
    const numValue = Number(newValue);
    if (!isNaN(numValue) && numValue >= 0) {
      setter(numValue);

      // Build update payload and call the new basic metrics API

      const metricsAny = metrics as any;

      // Capture previous values to allow revert on error
      const prevCPV = (typeof metricsAny?.cpv_daily === 'number' || metricsAny?.cpv_daily === "NA") ? metricsAny.cpv_daily : 0;
      const prevTPV = (typeof metricsAny?.tpv_daily === 'number' || metricsAny?.tpv_daily === "NA") ? metricsAny.tpv_daily : 0;
      const prevCollateral = (typeof metricsAny?.collateral === 'number' || metricsAny?.collateral === "NA") ? metricsAny.collateral : 0;
      const prevADD = (typeof metricsAny?.add_days === 'number' || metricsAny?.add_days === "NA") ? metricsAny.add_days : 0;

      // Determine version number to use for update: prefer the UI-provided versionNo (based on header date), fallback to 0
      const versionToUse = typeof versionNo === 'number' ? versionNo : 0;

      // For the changed field use the new value; for others, keep the current metric values
      const cpvValue = fieldName === 'cpv_daily' ? numValue : prevCPV;
      const tpvValue = fieldName === 'tpv_daily' ? numValue : prevTPV;
      const collateralValue = fieldName === 'collateral' ? numValue : prevCollateral;
      const addValue = fieldName === 'add_days' ? numValue : prevADD;

      const payload: any = {
        version_no: versionToUse,
        cpv_daily: cpvValue,
        tpv_daily: tpvValue,
        collateral: collateralValue,
      };

      // Only include add_days in the payload if it is the field being explicitly updated.
      // This prevents issues with 'NA' values when updating other metrics.
      if (fieldName === 'add_days') {
        payload.add_days = addValue;
      }

      if (merchantId) {
        try {
          setIsUpdating(true);

          // Optimistically update local UI state so change is visible immediately
          try {
            if (fieldName === 'cpv_daily') setLocalCPV(cpvValue);
            if (fieldName === 'tpv_daily') setLocalTPV(tpvValue);
            if (fieldName === 'collateral') setLocalCollateral(collateralValue);
            if (fieldName === 'add_days') setLocalADD(addValue);

            const currentMetrics = useRiskMetricsStore.getState().metrics as any;
            const merged = {
              ...(currentMetrics || {}),
              cpv_daily: cpvValue,
              tpv_daily: tpvValue,
              collateral: collateralValue,
              add_days: addValue,
            };
            useRiskMetricsStore.setState({ metrics: merged, error: null });
          } catch (e) {
            // ignore optimistic update failures
          }

          // Call the required API endpoint to persist the basic metrics
          const response = await API.put(`/api/v1/credit-insolvency/${merchantId}/metrics/basic`, payload);

          // Mark that we're refreshing after update and fetch latest metrics for the chosen version/date
          setIsRefreshingAfterUpdate(true);
          await fetchRiskMetrics(merchantId, versionToUse, date, true);
        } catch (error) {
          console.error(`Failed to update ${fieldName}:`, error);
          // Revert local state on error
          if (fieldName === 'cpv_daily') setLocalCPV(prevCPV);
          if (fieldName === 'tpv_daily') setLocalTPV(prevTPV);
          if (fieldName === 'collateral') setLocalCollateral(prevCollateral);
          if (fieldName === 'add_days') setLocalADD(prevADD);
          // revert store value if possible
          try {
            const currentMetrics = useRiskMetricsStore.getState().metrics as any;
            if (currentMetrics) {
              useRiskMetricsStore.setState({ metrics: { ...(currentMetrics || {}), cpv_daily: prevCPV, tpv_daily: prevTPV, collateral: prevCollateral, add_days: prevADD }, error: null });
            }
          } catch (e) {
            // ignore
          }
        } finally {
          setIsUpdating(false);
        }
      }
    }
  };

  const handleCPVChange = (newValue: string) =>
    handleValueChange(newValue, setLocalCPV, "cpv_daily");
  const handleTPVChange = (newValue: string) =>
    handleValueChange(newValue, setLocalTPV, "tpv_daily");
  const handleCollateralChange = (newValue: string) =>
    handleValueChange(newValue, setLocalCollateral, "collateral");
  const handleADDChange = (newValue: string) =>
    handleValueChange(newValue, setLocalADD, "add_days");



  // Determine risk segment: when version/date params present, use metric final_pd/pd_score numeric value
  // If API returned 'NA' string for final_pd, show 'NA' (no fallback)
  const effectivePdForSegment = hasParams ? finalPdNumber : derivedValues?.pdScore;
  const riskSegment = hasParams && finalPdIsNA
    ? { label: "N/A", colorScheme: "gray" as ColorScheme }
    : getRiskSegment(effectivePdForSegment);

  // Apply toggle override for ADD
  // When hasParams is true, use API add_days value only, show "N/A" if "NA", no fallback
  // Allow industry ADD to override metric ADD when the user has toggled to industry,
  // even if `hasParams` is true (version/date provided). Fallback to metric value
  // otherwise, and respect "NA" strings from the metrics API.
  const selectedADDNumeric = (() => {
    if (showIndustrialMaterials && industryAdd !== null) return industryAdd;
    if (hasParams) {
      if (typeof rawAddDays === "string" && /^(NA|N\/A)$/i.test(rawAddDays)) return null;
      if (typeof rawAddDays === "number") return rawAddDays;
      return null;
    }
    return derivedValues.addDays;
  })();

  const selectedADDDisplay = (() => {
    if (showIndustrialMaterials && industryAdd !== null) return Number(industryAdd).toFixed(1);
    if (hasParams) {
      if (typeof rawAddDays === "string" && /^(NA|N\/A)$/i.test(rawAddDays)) return "N/A";
      if (typeof rawAddDays === "number") return Number(rawAddDays).toFixed(1);
      return "N/A";
    }
    return derivedValues.addDays > 0 ? Number(derivedValues.addDays).toFixed(1) : "-";
  })();

  // Recalculate values with selected ADD
  // When selectedADDNumeric is null (ADD is "NA"), calculated values should be null
  const recalculatedGrossNDX = selectedADDNumeric !== null 
    ? derivedValues.cpvDaily * selectedADDNumeric 
    : null;
  const recalculatedNetNDX = recalculatedGrossNDX !== null
    ? Math.max(0, recalculatedGrossNDX - derivedValues.collateral)
    : null;
  const recalculatedExpectedLoss = recalculatedNetNDX !== null
    ? Math.max(0, recalculatedNetNDX * derivedValues.lgdRate)
    : null;
  const recalculatedVaR = recalculatedNetNDX !== null
    ? (recalculatedNetNDX * derivedValues.pdScore) / 100
    : null;
  const recalculatedSettlementDays = recalculatedVaR !== null && derivedValues.tpvDaily > 0
    ? recalculatedVaR / derivedValues.tpvDaily
    : null;

  // Financial breakdown bar values (liquidity, leverage, growth)
  // Use strict metric values when version/date params are provided; otherwise fall back to watchlist/derived
  const financialBasePdUsed = hasParams
    ? (typeof rawFinancialPd === 'number' ? rawFinancialPd : undefined)
    : (watchlistItem?.financial_pd_score !== undefined ? watchlistItem.financial_pd_score : derivedValues?.pdScore);

  const liquidityComp = liquidityCompUsed;
  const leverageComp = leverageCompUsed;
  const growthComp = growthCompUsed;

  const financialTotal = (liquidityComp || 0) + (leverageComp || 0) + (growthComp || 0);

  const liquidityWidth = financialTotal > 0 && liquidityComp ? (liquidityComp / financialTotal) * 100 : 0;
  const leverageWidth = financialTotal > 0 && leverageComp ? (leverageComp / financialTotal) * 100 : 0;
  const growthWidth = financialTotal > 0 && growthComp ? (growthComp / financialTotal) * 100 : 0;

  // Sentiment PD used for the PD Score Breakdown bar (show sentiment PD value, not final PD)
  // Prefer metric sentiment when params present, otherwise fall back to watchlist
  const sentimentPDNumeric = hasParams
    ? (typeof rawSentimentPd === 'number' ? rawSentimentPd : null)
    : (() => {
        if (watchlistLoading) return null;
        if (typeof watchlistItem?.sentiment_score === 'number') return Number(watchlistItem!.sentiment_score);
        return null;
      })();

  // Normalise sentiment PD into 0..1 range relative to the 0%..5% display (so 5% -> 1.0)
  // If the sentiment PD is missing (null/undefined/'NA'/'[NULL]'), keep it as null
  // so downstream components (like the RiskBar) can render an explicit
  // "not available" state instead of showing a zero-value bar.
  const sentimentNormalized: number | null =
    sentimentPDNumeric !== null && sentimentPDNumeric !== undefined
      ? Math.max(0, Math.min(1, sentimentPDNumeric / 5))
      : null;

  // Colour change rules apply to the normalised score per user's spec
  // Accept null/undefined and map that to a gray scheme so missing sentiment
  // does not render as a valid (green/yellow/red) bar.
  const getColourForNormalized = (n: number | null | undefined) => {
    if (n === null || n === undefined) return "gray" as ColorScheme;
    if (n <= 0.2) return "green" as ColorScheme;
    if (n <= 0.6) return "yellow" as ColorScheme; // amber ~ yellow/orange
    return "red" as ColorScheme;
  };

  const sentimentColourScheme = getColourForNormalized(sentimentNormalized);
  

  // Map numeric percent to color scheme (same thresholds as getRiskSegment)
  const getColorForPercent = (v: number | null | undefined): ColorScheme => {
    if (v === null || v === undefined) return "gray" as ColorScheme;
    if (v < 2) return "green" as ColorScheme;
    if (v < 5) return "green" as ColorScheme;
    if (v < 10) return "yellow" as ColorScheme;
    if (v < 15) return "orange" as ColorScheme;
    return "red" as ColorScheme;
  };

  const solidBgFor = (scheme: ColorScheme) => {
    switch (scheme) {
      case "green":
        return "bg-green-600";
      case "blue":
        return "bg-blue-600";
      case "yellow":
        return "bg-yellow-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-600";
      default:
        return "bg-gray-300";
    }
  };

  // Map ColorScheme to a hex color suitable for SVG fills (keeps parity with Tailwind colors used elsewhere)
  const colorHexFor = (scheme: ColorScheme) => {
    switch (scheme) {
      case "green":
        return "#16a34a"; // green-600
      case "blue":
        return "#3b82f6"; // blue-500/600
      case "yellow":
        return "#f59e0b"; // yellow-500
      case "orange":
        return "#f97316"; // orange-500
      case "red":
        return "#ef4444"; // red-500
      default:
        return "#9ca3af"; // gray-400
    }
  };

  const moatValue = (getMetricRaw("moat_market_leadership") === "Yes" || (metrics as any)?.moat_market_leadership === "Yes") ? "Yes" : "N/A";

  // derive hex for sentiment bar after colorHexFor is defined
  const sentimentHex = colorHexFor(sentimentColourScheme);

  return (
    <>
    <div className="space-y-6 pt-3">
      <motion.div
        className={`space-y-6 ${getPdBackgroundClass(
          riskSegment.colorScheme
        )} rounded-lg p-6 shadow-sm border border-gray-100`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-16">
          {/* Column 1: Probability of Default, Company Risk, PD Score Breakdown, Financial Score Breakdown */}
          <div className="space-y-6">
            {/* Probability of Default and Company Risk Row */}
            <div className="flex gap-8 pb-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-600">
                  Probability of Default (PD)
                </p>
                <div className="flex items-end gap-2">
                  <span
                    className={`text-3xl font-bold ${getTextColorClass(
                      riskSegment.colorScheme
                    )}`}
                  >
                    {displayPD}
                  </span>
                  <button
                    onClick={() => setShowPDInfo(true)}
                    className="p-1 text-gray-600 hover:text-gray-700 mb-1"
                    title="More information"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-600">Company Risk</p>
                <div className="flex items-end gap-2">
                  <span
                    className={`text-3xl font-bold ${getTextColorClass(
                      riskSegment.colorScheme
                    )}`}
                  >
                    {riskSegment.label === "N/A" ? "N/A" : `${riskSegment.label} Risk`}
                  </span>
                  <button
                    onClick={() => setShowRiskInfo(true)}
                    className="p-1 text-gray-600 hover:text-gray-700 mb-1"
                    title="More information"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Column Grid: Financial PD, Sentiment PD, Industry Risk, Conglomerate Safety (top row) and Liquidity Risk, Leverage Risk, Growth Risk, Other Risk (bottom row) */}
            <div className="space-y-6">
              {/* PD Score Breakdown Section */}
              <div className="relative">
                {/* PD Score Breakdown Header */}
                <div
                  className={`absolute -top-2.5 left-3 px-2 ${getPdBackgroundClass(
                    riskSegment.colorScheme
                  )} text-sm text-gray-600 z-10`}
                >
                  PD Score Breakdown
                </div>

                {/* First Row with Border */}
                <div className="border border-gray-300 rounded-lg p-4 pt-5">

                  {/* Top bar: 0% -> 5% with filled sentiment PD and ticks/labels */}
                  {/* Hide the bar if sentiment PD is N/A */}
                  {sentimentPDNumeric !== null && (
                  <div className="hidden mb-4">
                    <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="w-full h-20">
                      {/* dashed rounded outer rect */}
                      {/* leave a comfortable outer margin so top labels don't get clipped */}
                      <rect x={24} y={30} width={952} height={44} rx={6} ry={6} fill="none" stroke="#0f172a" strokeWidth={2} strokeDasharray="8 8" />

                      {/* filled region up to sentiment PD (clamped to 5%) with arrow tip */}
                      {
                        (() => {
                          const rectX = 24;
                          const rectW = 952; // keeps total svg width 1000
                          const pad = rectX;
                          const width = rectW;
                          // When hasParams is true and sentimentPDNumeric is null (sentiment_score is "NA"), don't show filled region
                          const showFilled = sentimentPDNumeric !== null;
                          const clamped = showFilled ? Math.max(0, Math.min(5, sentimentPDNumeric)) : 0;
                          const frac = clamped / 5; // 0..1
                          const fillW = Math.max(6, width * frac);
                          const x = pad;
                          const arrowTip = 28; // tip width
                          const rectRight = x + Math.max(0, fillW - arrowTip);
                          const top = 30;
                          const bottom = top + 44;
                          const mid = (top + bottom) / 2;
                          const points = fillW <= arrowTip
                            ? `${x},${top} ${x+fillW},${top} ${x+fillW},${bottom} ${x},${bottom}`
                            : `${x},${top} ${rectRight},${top} ${x+fillW},${mid} ${rectRight},${bottom} ${x},${bottom}`;

                          // vertical tick positions moved slightly outside the dashed rect
                          const leftTickX = rectX - 6; // outside left
                          const rightTickX = rectX + rectW + 6; // outside right
                          // When sentiment is NA, position tick at left edge
                          const sentimentTickX = showFilled 
                            ? Math.min(rectX + rectW - 4, Math.max(rectX + 4, x + fillW))
                            : leftTickX;

                          return (
                            <g>
                              {showFilled && <polygon points={points} fill={sentimentHex} opacity={0.95} />}
                              {/* left vertical line outside the dashed box */}
                              <line x1={leftTickX} y1={top - 8} x2={leftTickX} y2={bottom + 8} stroke="#0f172a" strokeWidth={2} />
                              {/* sentiment vertical guide (dashed) - only show if sentiment is not NA */}
                              {showFilled && <line x1={sentimentTickX} y1={top - 8} x2={sentimentTickX} y2={bottom + 8} stroke="#0f172a" strokeWidth={1.5} strokeDasharray="4 4" />}
                              {/* right vertical line outside the dashed box */}
                              <line x1={rightTickX} y1={top - 8} x2={rightTickX} y2={bottom + 8} stroke="#0f172a" strokeWidth={2} />

                              {/* labels above ticks - positioned so they are fully visible */}
                              <text x={leftTickX} y={top - 12} textAnchor="middle" fontSize={16} fill="#475569">0%</text>
                              <text x={sentimentTickX} y={top - 12} textAnchor="middle" fontSize={16} fill="#475569">
                                {hasParams && sentimentPDNumeric === null ? "N/A" : (sentimentPDNumeric !== null ? formatPercentPreferZero(clamped) : "-")}
                              </text>
                              <text x={rightTickX} y={top - 12} textAnchor="middle" fontSize={16} fill="#475569">5%</text>
                            </g>
                          );
                        })()
                      }
                    </svg>

                    <div className="flex justify-between text-sm text-gray-500 -mt-4">
                      <span>Positive Sentiment</span>
                      <span>Negative Sentiment</span>
                    </div>
                  </div>
                  )}

                  <div className="grid grid-cols-5 gap-x-3 gap-y-2">
                    <PDBreakdownMetric
                      value={
                        watchlistLoading
                          ? "..."
                          : hasParams
                          ? displayFinancialPd
                          : watchlistItem?.financial_pd_score !== undefined
                          ? `${Number(watchlistItem.financial_pd_score).toFixed(2)}%`
                          : derivedValues?.pdScore !== undefined &&
                            typeof derivedValues.pdScore === "number"
                          ? `${derivedValues.pdScore.toFixed(2)}%`
                          : "N/A"
                      }
                      label="Financial PD"
                      onInfoClick={() => setShowFinancialPdInfo(true)}
                    />

                    <PDBreakdownMetric
                      value={
                        watchlistLoading
                          ? "..."
                          : hasParams
                          ? displaySentimentPd
                          : watchlistItem?.sentiment_score !== undefined
                          ? formatPercentPreferZero(
                              Number(watchlistItem.sentiment_score)
                            )
                          : "N/A"
                      }
                      label="Sentiment PD"
                      onInfoClick={() => setShowSentimentPdInfo(true)}
                    />

                    <PDBreakdownMetric
                      value={
                        industryRiskLoading
                          ? "..."
                          : industryRisk?.risk_segment || "N/A"
                      }
                      label="Industry Risk"
                      valueClassName={getTextColorClass(
                        getIndustryRiskColorScheme(industryRisk?.risk_segment)
                      )}
                      onInfoClick={() => setShowIndustryRiskInfo(true)}
                    />

                    <PDBreakdownMetric
                      value={
                        metrics?.conglomerate_risk &&
                        metrics.conglomerate_risk !== "NA"
                          ? metrics.conglomerate_risk
                          : "N/A"
                      }
                      label="Conglomerate Risk"
                      valueClassName={getTextColorClass(
                        getConglomerateRiskColorScheme(metrics?.conglomerate_risk)
                      )}
                      onInfoClick={() => setShowConglomerateInfo(true)}
                    />

                    <PDBreakdownMetric
                      value={moatValue}
                      label="Moat/Market Leader"
                      valueClassName={
                        moatValue === "Yes" ? "text-blue-600" : "text-gray-600"
                      }
                      onInfoClick={() => setShowMoatInfo(true)}
                    />
                  </div>
                </div>
              </div>
              {/* Financial Score Breakdown Section */}
              <div className="relative">
                {/* Financial Score Breakdown Header */}

                {/* <div
                  className={`absolute -top-2.5 left-3 px-2 ${getPdBackgroundClass(
                    riskSegment.colorScheme
                  )} text-sm text-gray-600 z-10`}
                >
                  Financial Score Breakdown
                </div> */}

                <div className="space-y-4 pt-5">
                  {/* First Row with Border */}
                    {/* Second Row with Border */}
                      {/* <span style={{ fontSize: "0.65rem", whiteSpace: "nowrap" }}>
                        <span>●</span> Dark Blue Dot Leverage Risk &nbsp; 
                        <span>●</span> Blue for Liquidity Risk &nbsp; 
                        <span>●</span> Light Blue for Growth Risk
                      </span> */}
                    

                  {/* Segmented Bar Component */}
                  <div className="">
                    {/* Build the segments from the metrics API (financial_breakdown) when available.
                        Fallback to the watchlist item's breakdown if metrics doesn't include it.
                        If neither is present, fall back to sensible defaults (zeros). */}
                    {(() => {
                      // Source breakdown (percentages summing to ~100)
                      const fb = (metrics as any)?.financial_breakdown ?? watchlistItem?.financial_breakdown ?? null;

                      // Determine the Financial PD to scale the breakdown by.
                      // When a version/date param is present, prefer the metric value (rawFinancialPd).
                      // Otherwise fall back to watchlist or derived PD.
                      const financialPdNumeric = ((): number | undefined => {
                        if (hasParams) {
                          return typeof rawFinancialPd === 'number' ? rawFinancialPd : undefined;
                        }
                        if (watchlistItem?.financial_pd_score !== undefined && watchlistItem?.financial_pd_score !== null) {
                          return Number(watchlistItem.financial_pd_score);
                        }
                        if (derivedValues?.pdScore !== undefined && typeof derivedValues.pdScore === 'number') {
                          return derivedValues.pdScore;
                        }
                        return undefined;
                      })();

                      const leveragePct = fb?.leverage ?? 0;
                      const liquidityPct = fb?.liquidity ?? 0;
                      const growthPct = fb?.growth ?? 0;

                      // Multiply breakdown percentages by the Financial PD and divide by 100
                      // to get absolute percent contributions (e.g. 53% * 3.89% / 100 = 2.06%).
                      const leverageVal = financialPdNumeric ? (leveragePct * financialPdNumeric) / 100 : 0;
                      const liquidityVal = financialPdNumeric ? (liquidityPct * financialPdNumeric) / 100 : 0;
                      const growthVal = financialPdNumeric ? (growthPct * financialPdNumeric) / 100 : 0;

                      const total = leverageVal + liquidityVal + growthVal || 100;

                      const segments = [
                        { value: leverageVal, label: "Leverage Risk", color: "#1e4d7b" },
                        { value: liquidityVal, label: "Liquidity Risk", color: "#4a90d9" },
                        { value: growthVal, label: "Growth Risk", color: "#a2c5ed" },
                      ];

                      return (
                        <SegmentedBar min={0} max={total} segments={segments} />
                      );
                    })()}
                  </div>
                  <div>
                  </div>
                </div>
                
                <RiskBar risk={sentimentPDNumeric ?? null} />

                {/* Second Row with Border */}
                <div className="hidden border border-gray-300 rounded-lg p-4 pt-5">
                  {/* Segmented financial breakdown bar (Liquidity, Leverage, Growth) */}
                  {!watchlistLoading &&
                  liquidityComp !== null &&
                  leverageComp !== null &&
                  growthComp !== null ? (
                    <div className="mb-0">
                      {/* <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>0%</span>
                        <span className="text-right">Financial PD Score {financialTotal.toFixed(2)}%</span>
                      </div> */}

                      {/* SVG-based bar to match the image: dashed rounded border with chevron segments */}
                      {financialTotal > 0 ? (
                        <div className="mb-0">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-0">
                            <span>0%</span>
                            <span className="text-right">Financial PD Score {financialTotal.toFixed(2)}%</span>
                          </div>

                          <svg
                            viewBox="0 0 1000 120"
                            preserveAspectRatio="none"
                            className="w-full h-20"
                          >
                            {/* dashed rounded outer rect (same as PD bar) */}
                            <rect x={24} y={30} width={952} height={44} rx={6} ry={6} fill="none" stroke="#0f172a" strokeWidth={2} strokeDasharray="8 8" />

                            {/* Compute positions (use same coordinate system as PD bar) */}
                            {
                              (() => {
                                const pad = 24;
                                const totalW = 1000 - pad * 2; // 952
                                const tri = 72; // arrow tip width
                                const lW = Math.max(0.0001, (liquidityWidth / 100) * totalW);
                                const leW = Math.max(0.0001, (leverageWidth / 100) * totalW);
                                const gW = Math.max(0.0001, (growthWidth / 100) * totalW);

                                // helper to create polygon points for segment
                                const polyPoints = (x: number, w: number, isLast = false) => {
                                  const tip = Math.min(tri, w);
                                  const rectRight = x + w - tip;
                                  const top = 30;
                                  const bottom = 30 + 44;
                                  const mid = (top + bottom) / 2;
                                  if (w <= 8) {
                                    // tiny box
                                    return `${x},${top} ${x + w},${top} ${x + w},${bottom} ${x},${bottom}`;
                                  }
                                  return `${x},${top} ${rectRight},${top} ${x + w},${mid} ${rectRight},${bottom} ${x},${bottom}`;
                                };

                                const segments: Array<{
                                  x: number;
                                  w: number;
                                  color: string;
                                  textColor: string;
                                  label: string;
                                }> = [];

                                // move segments slightly left and reduce overlap so they don't merge
                                let cursor = pad + 6 - 6; // align with PD's padding
                                const overlapFactor = 0; // no overlap

                                // Determine segment colors from risk segmentation mapping
                                const liScheme = getColorForPercent(liquidityComp!);
                                const leScheme = getColorForPercent(leverageComp!);
                                const gScheme = getColorForPercent(growthComp!);

                                const liColor = colorHexFor(liScheme);
                                const leColor = colorHexFor(leScheme);
                                const gColor = colorHexFor(gScheme);

                                const textForScheme = (scheme: string) =>
                                  scheme === "yellow" || scheme === "orange" || scheme === "red"
                                    ? "#0b1724"
                                    : "#ffffff";

                                // Liquidity
                                segments.push({ x: cursor, w: lW, color: liColor, textColor: textForScheme(liScheme), label: `${liquidityComp!.toFixed(2)}%` });
                                cursor += lW;
                                // Leverage
                                segments.push({ x: cursor - (tri * overlapFactor), w: leW + (tri * overlapFactor), color: leColor, textColor: textForScheme(leScheme), label: `${leverageComp!.toFixed(2)}%` });
                                cursor = cursor + leW;
                                // Growth
                                segments.push({ x: cursor - (tri * overlapFactor), w: gW + (tri * overlapFactor), color: gColor, textColor: textForScheme(gScheme), label: `${growthComp!.toFixed(2)}%` });

                                return segments.map((s, i) => {
                                  const isLast = i === segments.length - 1;
                                  const points = polyPoints(s.x, s.w, isLast);
                                  const centerX = s.x + s.w / 2;
                                  const textY = 30 + 44 / 2 + 6;
                                  return (
                                    <g key={i}>
                                      <polygon points={points} fill={s.color} />
                                      <text x={centerX} y={textY} textAnchor="middle" fill={s.textColor} fontSize={20} fontWeight={700}>
                                        {s.label}
                                      </text>
                                    </g>
                                  );
                                });
                              })()
                            }

                            {/* Left tick */}
                            <line x1={24 - 6} y1={30 - 8} x2={24 - 6} y2={30 + 44 + 8} stroke="#0f172a" strokeWidth={3} />
                            {/* Right tick */}
                            <line x1={24 + 952 + 6} y1={30 - 8} x2={24 + 952 + 6} y2={30 + 44 + 8} stroke="#0f172a" strokeWidth={3} />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold text-gray-600">
                          {watchlistLoading
                            ? "..."
                            : hasParams
                            ? (liquidityCompUsed !== null
                                ? `${liquidityCompUsed.toFixed(2)}%`
                                : 'N/A')
                            : (watchlistItem?.financial_breakdown?.liquidity !== undefined
                                ? `${Number(
                                    (watchlistItem.financial_breakdown.liquidity / 100) *
                                      (watchlistItem.financial_pd_score || derivedValues.pdScore)
                                  ).toFixed(2)}%`
                                : 'N/A')}
                        </span>
                        <button
                          className="p-1 text-gray-600 hover:text-gray-700 mb-1"
                          title="More information"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">Liquidity Risk</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold text-gray-600">
                          {watchlistLoading
                            ? "..."
                            : hasParams
                            ? (leverageCompUsed !== null
                                ? `${leverageCompUsed.toFixed(2)}%`
                                : 'N/A')
                            : (watchlistItem?.financial_breakdown?.leverage !== undefined
                                ? `${Number(
                                    (watchlistItem.financial_breakdown.leverage / 100) *
                                      (watchlistItem.financial_pd_score || derivedValues.pdScore)
                                  ).toFixed(2)}%`
                                : 'N/A')}
                        </span>
                        <button
                          className="p-1 text-gray-600 hover:text-gray-700 mb-1"
                          title="More information"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">Leverage Risk</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold text-gray-600">
                          {watchlistLoading
                            ? "..."
                            : hasParams
                            ? (growthCompUsed !== null
                                ? `${growthCompUsed.toFixed(2)}%`
                                : 'N/A')
                            : (watchlistItem?.financial_breakdown?.growth !== undefined
                                ? `${Number(
                                    (watchlistItem.financial_breakdown.growth / 100) *
                                      (watchlistItem.financial_pd_score || derivedValues.pdScore)
                                  ).toFixed(2)}%`
                                : 'N/A')}
                        </span>
                        <button
                          className="p-1 text-gray-600 hover:text-gray-700 mb-1"
                          title="More information"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">Growth Risk</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold text-gray-600">
                          {watchlistLoading
                            ? "..."
                            : hasParams
                            ? (otherCompUsed !== null
                                ? `${otherCompUsed.toFixed(2)}%`
                                : 'N/A')
                            : (watchlistItem?.financial_breakdown?.other !== undefined
                                ? `${Number(
                                    (watchlistItem.financial_breakdown.other / 100) *
                                      (watchlistItem.financial_pd_score || derivedValues.pdScore)
                                  ).toFixed(2)}%`
                                : 'N/A')}
                        </span>
                        <button
                          className="p-1 text-gray-600 hover:text-gray-700 mb-1"
                          title="More information"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">Other Risk</p>
                    </div>
                  </div>
                </div>
                </div>
          </div>

         
          
        </div>
            <div>
               {/* Column 2: Legend and Histogram */}
          <div className="space-y-6 mb-4">
            {/* Risk Segmentation Section */}
            <div>
              <div className="flex items-center justify-between mb-0">
                <p className="text-sm text-gray-600">Risk Segmentation</p>
              </div>
              {/* Company Risk Segmentation Guide */}
              <div className="flex gap-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-sm text-black">Very Low (PD 0-2%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-sm text-black">Low (PD 2-5%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-600" />
                  <span className="text-sm text-black">Medium (PD 5-10%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-600" />
                  <span className="text-sm text-black">High (PD 10-15%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <span className="text-sm text-black">
                    Very High (PD 15%+)
                  </span>
                </div>
              </div>
            </div>

            

           
          </div>
              {/* PD Score Threshold Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-0">
                <p className="text-sm text-gray-600">PD Score Thresholds</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <ArrowDownToLine size={16} className="text-gray-600" />
                  <span className="text-sm text-black">
                    Overall PD Floor (0.75%), Sentiment PD Ceiling (5%)
                  </span>
                </div>
              </div>
            </div>
         {/* PD Score Distribution Section */}

              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">PD Score Distribution</p>
              </div>

              <div className="h-[65%] flex items-end gap-1 w-full">
                {histogramData.map((item, index) => {
                  // When hasParams is true, use finalPdNumber; when false, use derivedValues.pdScore
                  // If finalPdNumber is undefined (NA), don't highlight any bucket
                  const pdForHistogram = hasParams 
                    ? (finalPdNumber ?? undefined)
                    : derivedValues?.pdScore;
                  const isCurrentBucket = pdForHistogram !== undefined &&
                    pdForHistogram >= item.pdRange[0] &&
                    pdForHistogram < item.pdRange[1];
                  const getBucketRiskSegment = (pdRange: number[]) => {
                    // classify bucket by midpoint so a 5% bucket maps sensibly to risk segments
                    const mid = (pdRange[0] + pdRange[1]) / 2;
                    if (mid < 2) return "green";
                    if (mid < 5) return "green";
                    if (mid < 10) return "yellow";
                    if (mid < 15) return "orange";
                    return "red";
                  };

                  const bucketColorScheme = getBucketRiskSegment(item.pdRange);
                  const getBarColor = () => {
                    // Only the current bucket receives the color for the merchant's PD segment; others are neutral gray
                    if (!isCurrentBucket)
                      return "bg-gray-200 hover:bg-gray-300";
                    // Use the actual merchant PD to decide the color for the highlighted bar
                    const currentPd = pdForHistogram ?? 0;
                    const pdSegment = (v: number) => {
                      if (v < 2) return "green";
                      if (v < 5) return "green";
                      if (v < 10) return "yellow";
                      if (v < 15) return "orange";
                      return "red";
                    };
                    switch (pdSegment(currentPd)) {
                      case "green":
                        return "bg-green-600 hover:bg-green-700";
                      case "yellow":
                        return "bg-yellow-600 hover:bg-yellow-700";
                      case "orange":
                        return "bg-orange-600 hover:bg-orange-700";
                      case "red":
                        return "bg-red-600 hover:bg-red-700";
                      default:
                        return "bg-gray-600 hover:bg-gray-700";
                    }
                  };
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col-reverse items-center group h-full"
                    >
                      <span className="text-xs text-gray-500 mt-1">
                        {item.bucket}
                      </span>
                      <div
                        className={`w-full transition-colors relative ${getBarColor()}`}
                        style={{
                          height: `${(item.count / 450) * 100}%`,
                          minHeight: "8px",
                        }}
                      ></div>
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
                        {item.count} companies ({item.pdRange[0]}-
                        {item.pdRange[1]}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>

        {/* Stats Layout - Array of Rows */}
        {[
          // Row 1: CPV, TPV, Collateral
          [
            {
              title: "Chargebackable Payment Volume (CPV) [Daily]",
              mainValue: `₹${derivedValues.cpvDaily.toLocaleString("en-IN")}`,
              themeColor: "blue" as const,
              subtitleText: "Chargebackable Payment Volume processed in a day",
              description:
                "CPV represents the daily volume of payments that could potentially be charged back by customers. This metric is crucial for risk assessment as it indicates the maximum potential exposure to payment reversals. Higher CPV values increase the merchant's risk profile and may require additional collateral or risk mitigation strategies.",
              isEditable: true,
              onValueChange: handleCPVChange,
              placeholder: `Enter CPV value (current: ₹${derivedValues.cpvDaily.toLocaleString(
                "en-IN"
              )})`,
              defaultValue: derivedValues.cpvDaily,
              validation: (value: string) => {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                  return "Please enter a valid non-negative number";
                }
                return null;
              },
            },
            {
              title: "Total Payment Volume (TPV) [Daily]",
              mainValue: `₹${derivedValues.tpvDaily.toLocaleString("en-IN")}`,
              themeColor: "blue" as const,
              subtitleText: "Total Payment Volume processed in a day",
              description:
                "TPV is the total daily volume of all payment transactions processed by the merchant. This metric provides context for the CPV ratio and helps determine settlement timing recommendations. It's used in risk calculations to assess the merchant's overall transaction scale and operational capacity.",
              isEditable: true,
              onValueChange: handleTPVChange,
              placeholder: `Enter TPV value (current: ₹${derivedValues.tpvDaily.toLocaleString(
                "en-IN"
              )})`,
              defaultValue: derivedValues.tpvDaily,
              validation: (value: string) => {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                  return "Please enter a valid non-negative number";
                }
                return null;
              },
            },
            {
              title: "Collateral",
              mainValue: `₹${derivedValues.collateral.toLocaleString("en-IN")}`,
              themeColor: "blue" as const,
              subtitleText: "Collateral value available",
              description:
                "Collateral represents the security or guarantee value available to cover potential losses. This reduces the net exposure by providing a buffer against default scenarios. Higher collateral values improve the merchant's risk profile and may result in more favorable settlement terms.",
              isEditable: true,
              onValueChange: handleCollateralChange,
              placeholder: `Enter collateral value (current: ₹${derivedValues.collateral.toLocaleString(
                "en-IN"
              )})`,
              defaultValue: derivedValues.collateral,
              validation: (value: string) => {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                  return "Please enter a valid non-negative number";
                }
                return null;
              },
            },
          ],
          // Row 2: LGD, ADD, Gross NDX, Net NDX
          [
            {
              title: "Loss Given Default (LGD)",
              mainValue: `${(derivedValues.lgdRate * 100).toFixed(2)}%`,
              themeColor: "orange" as const,
              subtitleText:
                "Loss to operational creditors if company defaults (%)",
              description:
                "LGD measures the percentage of exposure that would be lost if the merchant defaults on their obligations. Lower LGD values indicate better recovery prospects and reduced risk exposure.",
              allowDecimal: true,
            },
            {
              title: "Average Delivery Days (ADD)",
              mainValue: industryAddLoading ? "..." : selectedADDDisplay,
              themeColor: "orange" as const,
              subtitleText: "(Unearned Revenue/ Total Revenue) * 365",
              description:
                "ADD represents the average number of days between receiving payment and delivering goods/services. Longer delivery periods increase exposure risk as funds are held longer before fulfillment. This metric helps determine settlement timing and risk mitigation strategies.",
              isEditable: !showIndustrialMaterials,
              onValueChange: handleADDChange,
              placeholder: `Enter ADD value (current: ${derivedValues.addDays})`,
              defaultValue: derivedValues.addDays,
              validation: (value: string) => {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                  return "Please enter a valid non-negative number";
                }
                return null;
              },
              allowDecimal: true,
              toggleOptions: [
                { label: "Industry ADD", value: "industry" },
                { label: "Company ADD", value: "company" },
              ],
              selectedToggleValue: showIndustrialMaterials
                ? "industry"
                : "company",
              onToggleChange: (value: string) => {
                const next = value === "industry";
                setShowIndustrialMaterials(next);
                if (next && industryAdd === null) {
                  fetchIndustryAdd();
                }
              },
            },
            {
              title: "Gross Non-Delivery Exposure (G-NDX)",
              mainValue: recalculatedGrossNDX !== null
                ? `₹${Math.round(recalculatedGrossNDX).toLocaleString("en-IN")}`
                : "N/A",
              themeColor: "orange" as const,
              subtitleText: "CPV * ADD",
              description:
                "G-NDX calculates the total potential exposure if the merchant fails to deliver after receiving payment. It represents the maximum amount at risk before considering any collateral or recovery mechanisms. This metric is fundamental for risk assessment and exposure management.",
            },
            {
              title: "Net Non-Delivery Exposure (N-NDX)",
              mainValue: recalculatedNetNDX !== null
                ? `₹${Math.round(recalculatedNetNDX).toLocaleString("en-IN")}`
                : "N/A",
              themeColor: "orange" as const,
              subtitleText: "G-NDX - Collateral",
              description:
                "N-NDX represents the actual risk exposure after accounting for available collateral. This is the net amount that could be lost in a default scenario. Lower N-NDX values indicate better risk mitigation through collateral coverage and improved overall risk profile.",
            },
          ],
          // Row 3: ELD, VaR, and Settlement Days
          [
            {
              title: "Value at Risk (VaR)",
              mainValue: recalculatedVaR !== null
                ? `₹${Math.round(recalculatedVaR).toLocaleString("en-IN")}`
                : "N/A",
              themeColor: "red" as const,
              subtitleText: "N-NDX * PD %",
              description:
                "VaR quantifies the maximum potential loss within a specified confidence level, incorporating both the exposure amount and the probability of default. This metric is essential for risk-based decision making, capital allocation, and determining appropriate settlement terms and risk mitigation measures.",
            },
            {
              title: "Settlement Days [Recommended]",
              mainValue: recalculatedSettlementDays !== null
                ? `T+${recalculatedSettlementDays.toFixed(1)}`
                : "N/A",
              themeColor: "green" as const,
              subtitleText: "VaR / TPV",
              description:
                "Recommended settlement timing based on risk exposure relative to daily transaction volume. This metric helps balance risk management with operational efficiency by suggesting optimal settlement periods that minimize exposure while maintaining reasonable cash flow for the merchant.",
            },
            {
              title: "Expected Loss at Default (ELD)",
              mainValue: recalculatedExpectedLoss !== null
                ? `₹${Math.round(recalculatedExpectedLoss).toLocaleString("en-IN")}`
                : "N/A",
              themeColor: "red" as const,
              subtitleText: "N-NDX * LGD %",
              description:
                "ELD estimates the expected financial loss if the merchant defaults, calculated as the net non-delivery exposure multiplied by the loss given default percentage. This metric helps quantify the potential impact on operational creditors and informs risk management decisions and settlement strategies.",
            },
          ],
        ]
          // Hidden for now (CPV/TPV/Collateral/LGD/ADD/G-NDX/N-NDX/VaR/Settlement Days/ELD stat cards).
          // Remove .slice(0, 0) to restore.
          .slice(0, 0)
          .map((row, rowIndex) => (
          <div key={rowIndex} className="relative">
            <PDStats key={rowIndex} items={row} gridCols={4} />
          </div>
        ))}
      </motion.div>

      {/* Info Popups */}
      <PDInfo
        isOpen={showPDInfo}
        onClose={() => setShowPDInfo(false)}
        title="Probability of Default (PD)"
        mainValue={displayPD}
        subtitleText="[Financial PD + Sentiment PD] × Industry Risk Factor x Conglomerate Safety Factor"
        description="The Probability of Default represents the likelihood that a merchant will fail to meet their financial obligations within a specified time period."
      />

      <PDInfo
        isOpen={showRiskInfo}
        onClose={() => setShowRiskInfo(false)}
        title="Company Risk"
        mainValue={riskSegment.label === "N/A" ? "N/A" : `${riskSegment.label} Risk`}
        subtitleText="Risk classification based on PD score ranges"
        description="Company risk categorises merchants into risk levels based on their Probability of Default scores. Very Low Risk (0-2%) Low Risk (2-5%) Medium Risk (5-10%) High Risk (10-15%) Very High Risk (15%+): Merchants with elevated default probability, necessitating enhanced monitoring, higher collateral and stricter settlement terms."
      />

      <PDInfo
        isOpen={showIndustryRiskInfo}
        onClose={() => setShowIndustryRiskInfo(false)}
        title="Industry Risk"
        mainValue={`${industryRisk?.risk_segment || "N/A"} Risk`}
        subtitleText={`Industry: ${industryRisk?.industry || "Unknown"}`}
        description="Industry Risk categorizes the overall risk level associated with the merchant's specific industry sector. This assessment considers industry-wide factors such as market volatility, regulatory environment, typical business cycles, and default patterns to provide context for individual merchant risk evaluation."
      />

      <PDInfo
        isOpen={showFinancialPdInfo}
        onClose={() => setShowFinancialPdInfo(false)}
        title="Financial PD"
        mainValue={displayFinancialPd ?? "N/A"}
        subtitleText="Financial indicators: Leverage, Liquidity, Growth"
        description="Financial PD estimates default probability using financial indicators such as leverage, liquidity position, profitability, and growth trends to quantify financial risk."
      />

      <PDInfo
        isOpen={showSentimentPdInfo}
        onClose={() => setShowSentimentPdInfo(false)}
        title="Sentiment PD"
        mainValue={displaySentimentPd ?? "N/A"}
        subtitleText="External news and sentiment signals"
        description="Sentiment PD estimates the probability of default impact based on external news and sentiment signals. This assessment considers material negative and positive events, their severity, recency, and financial relevance to quantify incremental risk beyond financial fundamentals."
      />

      <PDInfo
        isOpen={showConglomerateInfo}
        onClose={() => setShowConglomerateInfo(false)}
        title="Conglomerate"
        mainValue={getConglomerateName(selectedMerchant?.legal_name)}
        subtitleText={`Merchant: ${selectedMerchant?.legal_name || 'Unknown'}`}
        description="Merchants belonging to conglomerates typically have lower probability of default due to access to shared financial resources, cross-guarantees, and diversified revenue streams. The parent company's financial strength and ability to provide emergency funding during cash flow challenges significantly reduces default risk compared to standalone businesses."
      />

      <PDInfo
        isOpen={showMoatInfo}
        onClose={() => setShowMoatInfo(false)}
        title="Moat/Market Leader"
        mainValue={moatValue}
        subtitleText="Business Defensibility & Moat"
        description="This factor captures qualitative business defensibility that is not reflected in financial or sentiment analysis. A strong business moat effectively de-risks the company, thereby reducing its PD Score."
      />
    </div>

    
    </>
  );
};

export default ProbabilityOfDefault;
