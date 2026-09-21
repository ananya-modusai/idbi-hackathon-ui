"use client";

import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import CustomList from "@/components/custom/CustomList/customList";
import { Eye, Trash, X, Check, Upload, FileText, Building2, CalendarIcon, Info, AlertCircle, XCircle, CheckCircle2, Users, ShieldCheck, Target, Star } from "lucide-react";
import {
  SortActionButton,
  SortDirection,
} from "@/components/custom/CustomList/SortActionButton";
import { DownloadActionButton } from "@/components/custom/CustomList/DownloadActionButton";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import {
  caseService,
  InvestigationCaseDto,
  fetchRunsBetween,
  RunBetweenItemDto,
  deleteRun,
  clearCache,
  fetchRulesSummary,
} from "@/app/services/caseServices";
import { getFlagName, getFlagSeverity } from "../Sample Data/InvDecisioningSampleData";
import { useActiveContext } from "@/app/layout/ActiveContext/useActiveContext";
import { BubbleTag } from "@/components/custom/BubbleTag";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatTitleCase } from "@/lib/utils";
import { useOrderPipelineStore } from "@/app/store/orderPipeline/orderPipelineStore";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import { useWorkspaceStore } from "@/app/store/workspace/workspaceStore";
import { RunMerchantModal } from "../Components/RunMerchantModal";
import { Calendar, Clock, PlayCircle, Plus, ChevronDown, ChevronRight, AlertTriangle, UserCheck, Minus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { AnimatePresence } from "framer-motion";
import { PrimaryFilterGroup, SecondaryFilterGroup, TertiaryFilterGroup } from "@/components/custom/CustomList/customListFilter";
import { KeyMetrics } from "@/components/custom/KeyMetrics";
import { Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InvRunAnalysisArtifact } from "../Components/InvRunAnalysisArtifact";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import { useProfileStore } from "@/app/store/authentication/profileStore";

interface CaseListItem {
  itemID: string;
  title: React.ReactNode;
  leftMainIcon?: React.ReactNode;
  topRightContent?: React.ReactNode;
  rightMainIcon?: any;
  originalData: InvestigationCaseDto;
}

const statusOptions = [
  { value: "Processing", label: "Processing" },
  { value: "Completed", label: "Completed" },
  { value: "Queued", label: "Queued" },
  { value: "Failed", label: "Failed" },
];

const riskStatusOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
  { value: "Manual Review", label: "Manual Review" },
];

const slaOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const periodOptions = [
  { value: "All", label: "All" },
  { value: "1w", label: "1w", icon: Clock },
  { value: "1m", label: "1m", icon: Clock },
  { value: "1y", label: "1y", icon: Clock },
  { value: "2026", label: "2026", icon: Calendar },
  { value: "2025", label: "2025", icon: Calendar },
];

const authorityOptions = [
  { value: 'SEBI', label: 'SEBI' },
  { value: 'SAT', label: 'SAT' },
  { value: 'Court', label: 'Court' },
  { value: 'Enforcement Directorate', label: 'Enforcement Directorate' },
  { value: 'Income Tax Department', label: 'Income Tax Department' },
  { value: 'Central Bureau of Investigation', label: 'Central Bureau of Investigation' },
  { value: 'Insolvency & Recovery Authorities', label: 'Insolvency & Recovery Authorities' },
];

interface InvWatchlistPageProps {
  merchantId?: string;
}

const InvWatchlistPage: FC<InvWatchlistPageProps> = ({ merchantId }) => {
  const {
    investigationCases: cases,
    fetchInvestigationCases: loadData,
    loading,
    watchlistFilters,
    setWatchlistFilters,
    rulesSummaryCases,
    fetchRulesSummaryCases
  } = useInvestigationCaseStore();

  const { profile, fetchProfile } = useProfileStore();
  const isAdmin = profile?.role === 'ADMIN';

  const {
    statusSelected,
    riskStatusSelected,
    methodSelected,
    slaSelected,
    periodSelected,
    dateRange,
    sortField,
    sortDirection,
    searchQuery,
  } = watchlistFilters;

  const setStatusSelected = (vals: string[]) => setWatchlistFilters({ statusSelected: vals });
  const setRiskStatusSelected = (vals: string[]) => setWatchlistFilters({ riskStatusSelected: vals });
  const setMethodSelected = (vals: string[]) => setWatchlistFilters({ methodSelected: vals });
  const setSlaSelected = (vals: string[]) => setWatchlistFilters({ slaSelected: vals });
  const setPeriodSelected = (vals: string[]) => setWatchlistFilters({ periodSelected: vals });
  const setDateRange = (range: { from: string; to: string }) => setWatchlistFilters({ dateRange: range });
  const setSortField = (field: string) => setWatchlistFilters({ sortField: field });
  const setSortDirection = (dir: SortDirection) => setWatchlistFilters({ sortDirection: dir });
  const setSearchQuery = (query: string) => setWatchlistFilters({ searchQuery: query });

  const [filteredCount, setFilteredCount] = useState(0);
  const [filteredItemsForExport, setFilteredItemsForExport] = useState<CaseListItem[]>([]);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);

  const rulesMap = useMemo(() => {
    const map = new Map<string, Record<string, any>>();
    rulesSummaryCases.forEach(c => {
      if (c.caseId && (c as any).rules) {
        map.set(String(c.caseId), (c as any).rules);
      }
    });
    return map;
  }, [rulesSummaryCases]);

  const isRuleTriggered = useCallback((ruleObj: any) => {
    if (!ruleObj) return false;
    const val = ruleObj.overall_triggered ?? ruleObj.overallTriggered ?? ruleObj.triggered ?? ruleObj.status;
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const s = val.toLowerCase();
      return s === "yes" || s === "true" || s === "triggered";
    }
    if (typeof val === "number") return val === 1;
    return false;
  }, []);

  const formatRuleValue = useCallback((code: string, ruleObj: any) => {
    const name = getFlagName(code) || ruleObj.label || ruleObj.step_name || ruleObj.name || "N/A";
    const category = ruleObj.category || ruleObj.severity || getFlagSeverity(code) || "N/A";
    return `${code} - ${name} - ${category}`;
  }, []);

  // Add Merchant modal state
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isAuthorityOpen, setIsAuthorityOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPackageAnim, setShowPackageAnim] = useState(false);
  const [newOrder, setNewOrder] = useState({
    order: '',
    authority: '',
    orderDate: '',
    uploadedFile: null as File | null,
  });

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState<Record<string, any>[]>([]);
  const handleSelectedRunsChange = useCallback((rows: Record<string, any>[]) => {
    setSelectedRuns(prev => {
      if (prev.length === rows.length) {
        // Use ID for comparison
        const same = rows.every((r, i) => (r.id || r.itemID) === (prev[i]?.id || prev[i]?.itemID));
        if (same) return prev;
      }
      return rows;
    });
  }, []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { addItem: addToQueue } = useOrderPipelineStore();
  const { setActiveTab } = useWorkspaceStore();

  const handleAddOrder = () => {
    const fileName = newOrder.uploadedFile?.name || `${newOrder.order.replace(/\//g, '_')}.pdf`;

    let finalizedOrderDate = newOrder.orderDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(newOrder.orderDate)) {
      const dateObj = new Date(newOrder.orderDate);
      if (!isNaN(dateObj.getTime())) {
        const dStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        finalizedOrderDate = `${dStr}, 11:00 PM`;
      }
    }

    addToQueue({
      file: fileName,
      source: 'manual',
      addedAt: 'just now',
      authority: newOrder.authority,
      orderDate: finalizedOrderDate,
    });

    setIsAddOrderModalOpen(false);
    setNewOrder({ order: '', authority: '', orderDate: '', uploadedFile: null });

    setShowPackageAnim(true);
    setTimeout(() => {
      setShowPackageAnim(false);
      setActiveTab('order-pipeline', 'Order Pipeline');
    }, 1200);
  };

  const [isRunMerchantOpen, setIsRunMerchantOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [hasInitializedExpansion, setHasInitializedExpansion] = useState(false);
  const [analysisRunId, setAnalysisRunId] = useState<string | null>(null);
  const addTab = useArtifactStore(state => state.addTab);
  const forceActivateTab = useArtifactStore(state => state.forceActivateTab);
  const setCollapsed = useArtifactStore(state => state.setCollapsed);
  const activeTabId = useArtifactStore(state => state.activeTabId);

  const activeContext = useActiveContext();

  useEffect(() => {
    loadData();
    fetchRulesSummaryCases(1000, true);
    fetchProfile();
  }, [loadData, fetchRulesSummaryCases, fetchProfile]);

  const runningCount = useMemo(() => {
    return cases.filter((c: any) => String(c.run?.status || "").toUpperCase() === "PROCESSING").length;
  }, [cases]);

  // Auto-refresh every minute to keep the watchlist updated ONLY if there are running merchants

  const handleBulkDelete = useCallback(async () => {
    if (selectedRuns.length === 0) return;

    // Explicitly convert IDs to strings to prevent type mismatch
    const idsToDelete = new Set(selectedRuns.map(run => String(run.id || run.itemID || "")));

    setIsDeleting(true);
    try {
      // 1. Reset UI state immediately for responsiveness
      setSelectedRuns([]);
      setIsDeleteMode(false);

      // 2. Perform the actual deletion
      await Promise.all(
        selectedRuns.map(run => deleteRun(run.id || run.itemID))
      );

      // 3. Brief delay to allow backend synchronization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Refresh data
      loadData();
    } catch (error) {
      console.error("Error during bulk delete:", error);
      loadData(); // Reliability fallback
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRuns, loadData]);

  const formatDate = useCallback((dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);

    // Add 5 hours and 30 minutes offset
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);

    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${monthName} ${year}`;
  }, []);

  const formatDateTime = useCallback((dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);

    // Add 5 hours and 30 minutes offset
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);

    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strHours = String(hours).padStart(2, "0");

    return `${day} ${monthName} ${year}, ${strHours}:${minutes} ${ampm}`;
  }, []);

  const getRiskColor = (tier?: string): any => {
    const t = String(tier || "").toLowerCase();
    if (t.includes("critical")) return "red";
    if (t.includes("high")) return "orange";
    if (t.includes("medium")) return "yellow";
    if (t.includes("low")) return "green";
    if (t.includes("manual review")) return "purple";
    return "gray";
  };

  const calculateDuration = useCallback((start: string, end: string) => {
    if (!start || !end) return null;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    if (isNaN(diffMs) || diffMs <= 0) return "0s";

    const diffSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }, []);

  const formatDurationCallback = useCallback((str: string) => {
    if (!str) return "0s";
    // Check if it's already in h m s format and if it needs normalization
    const hMatch = str.match(/(\d+)h/);
    const mMatch = str.match(/(\d+)m/);
    const sMatch = str.match(/(\d+)s/);

    let h = hMatch ? parseInt(hMatch[1]) : 0;
    let m = mMatch ? parseInt(mMatch[1]) : 0;
    let s = sMatch ? parseInt(sMatch[1]) : 0;

    // Normalize overflow
    if (s >= 60) {
      m += Math.floor(s / 60);
      s = s % 60;
    }
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }

    if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
    if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
    return `${s}s`;
  }, []);

  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = [
      "Sno",
      "Date",
      "Merchant Name",
      "website URL",
      "Mcc",
      "address",
      "Progress",
      "risk score",
      "ai decision",
      "Method",
      "reasoning",
      "Red Flags",
      "Other Flags"
    ];
    const keys = [
      "sno",
      "date",
      "merchantName",
      "websiteUrl",
      "mcc",
      "address",
      "progress",
      "riskScore",
      "aiDecision",
      "method",
      "reasoning",
      "redFlags",
      "otherFlags"
    ];

    const csvContent = [
      headers.join(","),
      ...data.map(item => {
        return keys.map(key => {
          const val = item[key];
          const strVal = String(val === null || val === undefined ? "N/A" : val).replace(/"/g, '""');
          return `"${strVal}"`;
        }).join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const formatCasesForExport = useCallback((items: CaseListItem[]) => {
    return items.map((it, index) => {
      const data = it.originalData as any;
      const priority_flag = data.priority_flag;
      const risk_report = data.risk_report;
      const risk_score = data.risk_score;

      let finalRiskScore: any = null;
      if (priority_flag?.points !== undefined && priority_flag?.points !== null) {
        finalRiskScore = priority_flag.points;
      } else if (risk_report && typeof risk_report === "object" && risk_report.risk_score !== undefined) {
        finalRiskScore = risk_report.risk_score;
      } else if (risk_score && typeof risk_score === "object" && (risk_score as any).risk_score !== undefined) {
        finalRiskScore = (risk_score as any).risk_score;
      } else if (typeof risk_score === "number") {
        finalRiskScore = risk_score;
      } else if (typeof data.riskScore === "number") {
        finalRiskScore = data.riskScore;
      }

      const rawTier = priority_flag?.category || risk_report?.risk_tier || (risk_score as any)?.risk_tier || "N/A";
      let riskTier = "Evaluating...";
      const lowRaw = String(rawTier).toLowerCase();
      if (lowRaw.includes("critical")) riskTier = "Critical Risk";
      else if (lowRaw.includes("high")) riskTier = "High Risk";
      else if (lowRaw.includes("medium")) riskTier = "Medium Risk";
      else if (lowRaw.includes("low")) riskTier = "Low Risk";
      else if (lowRaw.includes("manual review")) riskTier = "Manual Review";
      else if (lowRaw === "recommended") riskTier = "Low Risk";
      else if (lowRaw === "not recommended") riskTier = "Critical Risk";
      else if (lowRaw !== "n/a") riskTier = rawTier;

      // Extract reasoning/commentary
      const getReasoning = (d: any) => {
        if (!d) return "N/A";

        // Support both spellings: fraud_commentary and fraud_commentry
        const findCommentary = (obj: any) => {
          if (!obj || typeof obj !== "object") return null;
          return obj.fraud_commentary || obj.fraud_commentry || obj.fraudCommentary || obj.fraudCommentry;
        };

        const commentary =
          findCommentary(d) ||
          findCommentary(d.priority_flag) ||
          findCommentary(d.risk_report) ||
          findCommentary(d.risk_score) ||
          findCommentary(d.run) ||
          findCommentary(d.merchant) ||
          findCommentary(d.progress);

        if (commentary) return commentary;

        // Fallback to risk_explanation / riskExplanation
        const findRiskExplanation = (obj: any) => {
          if (!obj || typeof obj !== "object") return null;
          return obj.risk_explanation || obj.riskExplanation || obj.risk_commentary || obj.riskCommentary || obj.risk_commentry || obj.riskCommentry;
        };

        const explanation =
          findRiskExplanation(d) ||
          findRiskExplanation(d.priority_flag) ||
          findRiskExplanation(d.risk_report) ||
          findRiskExplanation(d.risk_score) ||
          findRiskExplanation(d.run) ||
          findRiskExplanation(d.merchant);

        if (explanation) return explanation;

        // Fallbacks to reasoning/reason/explanation if neither exists
        if (d.priority_flag) {
          if (d.priority_flag.reasoning) return d.priority_flag.reasoning;
          if (d.priority_flag.reason) return d.priority_flag.reason;
          if (d.priority_flag.explanation) return d.priority_flag.explanation;
        }
        const rr = d.risk_report || d.risk_score;
        if (rr && typeof rr === "object") {
          if (rr.reasoning) return rr.reasoning;
          if (rr.reason) return rr.reason;
          if (rr.explanation) return rr.explanation;
        }
        if (d.reasoning) return d.reasoning;
        if (d.reason) return d.reason;
        if (d.explanation) return d.explanation;
        return "N/A";
      };

      // Format the date properly for CSV
      const formattedDate = formatDateTime(data.run?.created_at || data.createdDateTime || "");

      // Determine progress status
      const getProgressStatus = (st?: string) => {
        if (!st) return "N/A";
        const upper = st.trim().toUpperCase();
        if (upper.includes("FAIL")) return "Failed";
        if (upper.includes("PROCESS") || upper.includes("RUN")) return "Processing";
        if (upper.includes("QUEU") || upper.includes("ENQUEU")) return "Queued";
        if (upper.includes("COMPLET")) return "Completed";
        return st;
      };

      const progressStatus = getProgressStatus(data.run?.status || data.status);

      // Map rule triggers from rules-summary
      const runId = data.run?.id || data.caseId || it.itemID;
      const merchantRules = rulesMap.get(String(runId)) || {};
      const redFlagsList: string[] = [];
      const otherFlagsList: string[] = [];

      Object.entries(merchantRules).forEach(([code, ruleObj]: [string, any]) => {
        const isTriggered = isRuleTriggered(ruleObj);
        if (isTriggered) {
          const formatted = formatRuleValue(code, ruleObj);
          const upperCode = code.toUpperCase();
          if (upperCode.startsWith("RF")) {
            redFlagsList.push(formatted);
          } else if (
            upperCode.startsWith("GF") ||
            upperCode.startsWith("MR") ||
            upperCode.includes("GREEN") ||
            upperCode.includes("GOOD") ||
            upperCode.includes("VINTAGE") ||
            upperCode.includes("CORPORATE")
          ) {
            otherFlagsList.push(formatted);
          } else {
            if (upperCode.includes("RED") || upperCode.includes("RISK") || upperCode.includes("FRAUD")) {
              redFlagsList.push(formatted);
            } else {
              otherFlagsList.push(formatted);
            }
          }
        }
      });

      const rawMethod = data.Method ?? data.run?.Method ?? data.run?.method ?? (it.originalData as any)?.Method ?? (it.originalData as any)?.run?.Method ?? (it.originalData as any)?.run?.method;
      const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";

      return {
        sno: index + 1,
        date: formattedDate,
        merchantName: formatTitleCase(data.merchant?.name || data.registeredName || "N/A"),
        websiteUrl: data.merchant?.website || data.websiteUrl || "N/A",
        mcc: data.merchant?.mcc_code !== undefined && data.merchant?.mcc_code !== "" && data.merchant?.mcc_code !== null ? data.merchant.mcc_code : "N/A",
        address: data.merchant?.address || "N/A",
        progress: progressStatus,
        riskScore: finalRiskScore !== null && finalRiskScore !== undefined ? finalRiskScore : "N/A",
        aiDecision: riskTier,
        method: methodValue,
        reasoning: getReasoning(data),
        redFlags: redFlagsList.join("\n"),
        otherFlags: otherFlagsList.join("\n")
      };
    });
  }, [rulesMap, isRuleTriggered, formatRuleValue, formatDateTime]);

  const handleGlobalExport = useCallback(() => {
    const allTableData = formatCasesForExport(filteredItemsForExport);
    exportToCSV(allTableData, `processing_manager_all_cases_${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredItemsForExport, exportToCSV, formatCasesForExport]);

  const createCaseItem = useCallback(
    (item: any): CaseListItem => {
      const { run, merchant, risk_score } = item;
      const priority_flag = (item as any).priority_flag;
      const risk_report = (item as any).risk_report;
      const riskSource = risk_report || risk_score || {};
      const status = run.status || "N/A";
      const date = run.created_at || "";

      return {
        itemID: run.id,
        title: (
          <div className="flex items-center gap-3 w-full">
            <BubbleTag
              text={
                String(status).toUpperCase() === "PROCESSING" ? "Running" :
                  (String(status).toUpperCase() === "QUEUED" || String(status).toUpperCase() === "ENQUEUED") ? "Queued" :
                    String(status).toUpperCase() === "FAILED" ? "Failed" :
                      "Completed"
              }
              color={
                String(status).toUpperCase() === "PROCESSING" ? "yellow" :
                  (String(status).toUpperCase() === "QUEUED" || String(status).toUpperCase() === "ENQUEUED") ? "gray" :
                    String(status).toUpperCase() === "FAILED" ? "red" :
                      "green"
              }
              withBorder={true}
            />
            <span
              className="text-base font-semibold text-blue-700 truncate"
              title={merchant.name || "N/A"}
            >
              {formatTitleCase(merchant.name || "N/A")}
            </span>
            <span className="text-base text-gray-600">
              [MID {run.merchant_id || "N/A"}]
            </span>
          </div>
        ),
        leftMainIcon: (
          <span className="text-base text-gray-400">{run.id}</span>
        ),
        topRightContent: (
          <div className="flex items-center gap-2">
            <BubbleTag
              text={priority_flag?.category || riskSource.risk_tier || "N/A"}
              color={getRiskColor(priority_flag?.category || riskSource.risk_tier)}
              withBorder={true}
              fixedWidth={140}
            />
            <BubbleTag
              text={
                "Last Run: " + (run.updated_at ? formatDateTime(run.updated_at) : "N/A")
              }
              color="yellow"
              fixedWidth="w-56"
              withBorder={false}
            />
            <BubbleTag
              text={date ? formatDate(date) : "N/A"}
              color="grayTextWhiteBg"
              withBorder={false}
            />
          </div>
        ),
        rightMainIcon: ChevronRight,
        originalData: {
          ...item,
          caseId: run.id,
          registeredName: formatTitleCase(merchant.name || ""),
          externalMerchantId: run.merchant_id,
          createdDateTime: run.created_at,
          status: run.status,
          decisioningTime: priority_flag?.duration || calculateDuration(run.created_at, run.updated_at),
          riskStatus: priority_flag?.category || riskSource.risk_tier || null,
          riskTier: riskSource.risk_tier || null,
          riskScore: priority_flag?.points ?? (riskSource.risk_score || (typeof risk_score === 'number' ? risk_score : null)),
          totalRunTime: calculateDuration(run.created_at, run.updated_at),
        } as any,
      };
    },
    [formatDateTime, calculateDuration]
  );

  const items = useMemo(() => {
    const filteredCases = cases.filter((c: any) => {
      if (isAdmin) return true;
      const isActive = c.run?.is_active ?? c.is_active;
      return isActive === true;
    });
    return filteredCases.map((c: any) => createCaseItem(c));
  }, [cases, createCaseItem, isAdmin]);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sortField === "registeredName") {
      arr.sort((a: any, b: any) => {
        const an = (a.originalData.registeredName || a.originalData.caseTitle || "").toString();
        const bn = (b.originalData.registeredName || b.originalData.caseTitle || "").toString();
        const cmp = an.localeCompare(bn);
        return sortDirection === "desc" ? -cmp : cmp;
      });
    } else if (sortField === "createdDate") {
      arr.sort((a: any, b: any) => {
        const at =
          Date.parse(String(a.originalData.createdDateTime || "")) || 0;
        const bt =
          Date.parse(String(b.originalData.createdDateTime || "")) || 0;
        const cmp = at - bt;
        return sortDirection === "desc" ? -cmp : cmp;
      });
    }
    return arr;
  }, [items, sortField, sortDirection]);


  const handleSortChange = (fieldKey: string, dir: SortDirection) => {
    setSortField(fieldKey);
    setSortDirection(dir);
  };

  const handleFilterChange = useCallback((f: any[]) => {
    // Only update if count actually changed to break the cycle with CustomList internal syncing
    const newCount = f.length;

    try {
      const ids = f.map(item => item.itemID);
      sessionStorage.setItem("inv_watchlist_filtered_ids", JSON.stringify(ids));
    } catch (e) {}

    setFilteredItemsForExport(prev => {
      if (prev.length === newCount) {
        const unchanged = f.every((item, i) => item.itemID === prev[i]?.itemID);
        if (unchanged) return prev;
      }
      return f as CaseListItem[];
    });

    setFilteredCount(prev => prev === newCount ? prev : newCount);
  }, []);

  const cardMetrics = useMemo(() => {
    const total = filteredItemsForExport.length;
    let lowCount = 0;
    let mediumCount = 0;
    let highCount = 0;
    let criticalCount = 0;
    let manualReviewCount = 0;

    filteredItemsForExport.forEach(item => {
      const data = item.originalData as any;
      const status = String(data.riskStatus || "").trim().toLowerCase();

      if (status.includes("low")) lowCount++;
      else if (status.includes("medium")) mediumCount++;
      else if (status.includes("high")) highCount++;
      else if (status.includes("critical")) criticalCount++;
      else if (status.includes("manual review")) manualReviewCount++;
    });

    // Decision time stats
    let decisionWithin5MinsCount = 0;
    let totalDecisionTimeSeconds = 0;
    let decisionTimeCount = 0;

    filteredItemsForExport.forEach(item => {
      const data = item.originalData as any;
      const dTime = data.decisioningTime || "3m 42s";
      const match = dTime.match(/(?:(\d+)m)?\s*(?:\s*(\d+)s)?/);
      if (match) {
        const minutes = parseInt(match[1] || "0");
        const seconds = parseInt(match[2] || "0");
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds <= 300) decisionWithin5MinsCount++;
        totalDecisionTimeSeconds += totalSeconds;
        decisionTimeCount++;
      }
    });

    const avgSeconds = decisionTimeCount > 0 ? totalDecisionTimeSeconds / decisionTimeCount : 0;
    const avgMins = Math.floor(avgSeconds / 60);
    const avgSecs = Math.round(avgSeconds % 60);
    const avgTimeStr = `${avgMins}m ${avgSecs}s`;
    const percentageWithin5Mins = total > 0 ? Math.round((decisionWithin5MinsCount / total) * 100) : 0;

    return [
      { label: "Total Merchants", value: total, icon: "Building2" },
      { label: "Critical Risk", value: criticalCount, icon: "XCircle" },
      { label: "High Risk", value: highCount, icon: "AlertCircle" },
      { label: "Medium Risk", value: mediumCount, icon: "AlertTriangle" },
      { label: "Low Risk", value: lowCount, icon: "CheckCircle2" },
      { label: "Manual Review", value: manualReviewCount, icon: "ShieldCheck" },
      { label: "% Decision within 5 mins", value: `${percentageWithin5Mins}%`, icon: "Clock" },
      { label: "Avg Decision Time", value: avgTimeStr, icon: "Timer" },
    ];
  }, [filteredItemsForExport]);

  const handleItemClick = useCallback((item: any) => {
    const caseId = item?.originalData?.caseId;
    if (!caseId) return;
    try {
      sessionStorage.setItem("inv_source_tab", "watchlist");
    } catch (e) {}
    const name = item?.originalData?.registeredName || item?.originalData?.caseTitle || caseId;
    activeContext.handleSelect("investigation", caseId, formatTitleCase(name));
  }, [activeContext.handleSelect]);

  const sortFields = useMemo(
    () => [
      { key: "registeredName", label: "Legal Name" },
      { key: "createdDate", label: "Date" },
    ],
    []
  );

  const toggleDateExpansion = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const columns = useMemo(() => [
    {
      key: "date",
      header: "Date",
      sortable: true,
      verticalAlign: "middle",
      render: (val: any, row: any) => {
        if (!val) return <span className="text-gray-400">N/A</span>;
        const dt = formatDateTime(val);
        return (
          <div className="py-1 flex flex-col">
            <span className="text-gray-800 font-bold text-[13px] whitespace-nowrap">{dt}</span>
          </div>
        );
      }
    },
    {
      key: "legalName",
      header: "Legal Name",
      sortable: true,
      minWidth: "350px",
      width: "250px",
      verticalAlign: "middle",
      render: (val: any) => <span className="font-semibold text-blue-700" title={val || "N/A"}>{formatTitleCase(val || "N/A")}</span>
    },
    {
      key: "status",
      header: "Progress",
      verticalAlign: "middle",
      render: (val: any) => {
        const status = String(val || "").toUpperCase();
        const isProcessing = status === "PROCESSING";
        const isFailed = status === "FAILED";
        const isQueued = status === "QUEUED" || status === "ENQUEUED";
        const isPartial = status === "PARTIAL";

        if (isProcessing) {
          return (
            <div className="flex items-center gap-1.5 text-amber-600 font-medium text-sm pl-1">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm animate-pulse" />
              Processing
            </div>
          );
        }

        if (isQueued) {
          return (
            <div className="flex items-center gap-1.5 text-gray-500 font-medium text-sm pl-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 shadow-sm" />
              Queued
            </div>
          );
        }

        if (isFailed) {
          return (
            <div className="flex items-center gap-1.5 text-red-600 font-medium text-sm pl-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Failed
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm pl-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
            Completed{isPartial ? "" : ""}
          </div>
        );
      }
    },

    {
      key: "riskStatus",
      header: "AI Decision",
      width: "180px",
      minWidth: "180px",
      verticalAlign: "middle",
      render: (val: any, row: any) => {
        const status = String(val || "").trim().toLowerCase();

        if (!status || status === "n/a") {
          return <span className="text-gray-400 pl-4">—</span>;
        }

        let colors = {
          bg: "bg-gray-50",
          text: "text-gray-600",
          iconBg: "bg-gray-400",
          border: "border-gray-100",
          icon: <span className="text-white font-black text-[12px] leading-none mb-[0.5px]">!</span>
        };

        let displayText = val;

        if (status.includes("manual review")) {
          displayText = "Manual Review";
          colors = {
            bg: "bg-purple-50/80",
            text: "text-purple-700",
            iconBg: "bg-purple-600",
            border: "border-purple-200",
            icon: <span className="text-white font-black text-[12px] leading-none mb-[0.5px]">!</span>
          };
        } else if (status.includes("critical")) {
          displayText = "Critical Risk";
          colors = {
            bg: "bg-red-50/80",
            text: "text-red-700",
            iconBg: "bg-red-600",
            border: "border-red-200",
            icon: <X className="w-2.5 h-2.5 text-white" strokeWidth={4} />
          };
        } else if (status.includes("high")) {
          displayText = "High Risk";
          colors = {
            bg: "bg-orange-50/80",
            text: "text-orange-700",
            iconBg: "bg-orange-600",
            border: "border-orange-200",
            icon: <span className="text-white font-black text-[12px] leading-none mb-[0.5px]">!</span>
          };
        } else if (status.includes("medium")) {
          displayText = "Medium Risk";
          colors = {
            bg: "bg-amber-50/80",
            text: "text-amber-700",
            iconBg: "bg-amber-600",
            border: "border-amber-200",
            icon: <span className="text-white font-black text-[12px] leading-none mb-[0.5px]">!</span>
          };
        } else if (status.includes("low")) {
          displayText = "Low Risk";
          colors = {
            bg: "bg-emerald-50/80",
            text: "text-emerald-700",
            iconBg: "bg-emerald-600",
            border: "border-emerald-200",
            icon: <Check className="w-3 h-3 text-white" strokeWidth={4} />
          };
        }

        return (
          <div className={`px-3 py-1 rounded-full border ${colors.border} ${colors.bg} inline-flex items-center gap-2 shadow-sm ml-1`}>
            <div className={`w-4 h-4 rounded-full ${colors.iconBg} flex items-center justify-center`}>
              {colors.icon}
            </div>
            <span className={`text-[14px] font-bold ${colors.text} whitespace-nowrap`}>
              {displayText}
            </span>
          </div>
        );
      }
    },
    {
      key: "method",
      header: "Method",
      width: "180px",
      minWidth: "180px",
      verticalAlign: "middle",
      render: (val: any) => {
        const methodValue = val && String(val).trim() !== "" ? String(val).trim() : "NA";
        const isNA = methodValue.toUpperCase() === "NA";
        const normalized = methodValue.replace(/[-_]/g, " ").trim().toLowerCase();

        let colors = {
          bg: "bg-gray-50/80",
          text: "text-gray-600",
          iconBg: "bg-gray-400",
          border: "border-gray-200",
          icon: <Minus className="w-2.5 h-2.5 text-white" strokeWidth={4} />
        };

        if (!isNA) {
          const isAutoReject = normalized === "auto-reject" || normalized === "auto reject";
          const isThroughScoring = normalized === "through scoring" || normalized.includes("scoring");

          colors = {
            bg: "bg-blue-50/80",
            text: "text-blue-700",
            iconBg: "bg-blue-600",
            border: "border-blue-200",
            icon: isAutoReject ? (
              <X className="w-2.5 h-2.5 text-white" strokeWidth={4} />
            ) : isThroughScoring ? (
              <Star className="w-2.5 h-2.5 text-white" strokeWidth={4} />
            ) : (
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
            )
          };
        }

        return (
          <div className={`px-3 py-1 rounded-full border ${colors.border} ${colors.bg} inline-flex items-center gap-2 shadow-sm ml-1`}>
            <div className={`w-4 h-4 rounded-full ${colors.iconBg} flex items-center justify-center`}>
              {colors.icon}
            </div>
            <span className={`text-[14px] font-bold ${colors.text} whitespace-nowrap`}>
              {methodValue}
            </span>
          </div>
        );
      }
    },
    {
      key: "riskScore",
      header: "Risk Score",
      width: "120px",
      minWidth: "120px",
      verticalAlign: "middle",
      render: (val: any, row: any) => {
        const tier = String(row.riskStatus || "").toLowerCase();
        const isEvaluating = !row.riskStatus || tier.includes("evaluating");

        if (isEvaluating) {
          return (
            <div className="px-3 py-1 rounded-full border border-gray-100 bg-gray-50 inline-flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              <span className="text-[13px] font-bold text-gray-600 whitespace-nowrap">
                Evaluating...
              </span>
            </div>
          );
        }

        const score = val !== null && val !== undefined ? Number(val) : NaN;
        let textColor = "text-gray-400";

        if (!isNaN(score)) {
          if (score >= 75) textColor = "text-red-600";
          else if (score >= 51) textColor = "text-orange-600";
          else if (score >= 26) textColor = "text-amber-600";
          else textColor = "text-emerald-600"; // Low risk range (0-25)
        }

        return (
          <span className={`font-bold ${textColor} text-[15px]`}>
            {val !== null && val !== undefined ? val : "—"}
          </span>
        );
      },
    },
    {
      key: "decisioningTime",
      header: "Decision time",
      width: "200px",
      minWidth: "200px",
      verticalAlign: "middle",
      render: (val: any, row: any) => {
        const isProcessing = String(row?.status || "").toUpperCase() === "PROCESSING";
        const hasRiskStatus = !!row.riskStatus && String(row.riskStatus).toLowerCase() !== "evaluating...";

        const parseToSecs = (str: string) => {
          if (!str) return 0;
          const hMatch = str.match(/(\d+)h/);
          const mMatch = str.match(/(\d+)m/);
          const sMatch = str.match(/(\d+)s/);

          const h = hMatch ? parseInt(hMatch[1]) : 0;
          const m = mMatch ? parseInt(mMatch[1]) : 0;
          const s = sMatch ? parseInt(sMatch[1]) : 0;

          return h * 3600 + m * 60 + s;
        };

        const formatDuration = (str: string) => formatDurationCallback(str);

        const handleDiagnosticsClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          const data = row.originalData as any as RunBetweenItemDto;
          if (!data?.run?.id) return;

          const artifactId = `run-analysis-${data.run.id}`;

          if (activeTabId === artifactId) {
            setCollapsed(false);
            return;
          }

          addTab({
            id: artifactId,
            title: "Run Diagnostics",
            renderArtifact: () => (
              <InvRunAnalysisArtifact
                runId={data.run.id}
                merchantName={data.merchant.name}
                websiteUrl={data.merchant.website}
                decisioningTime={val}
              />
            ),
          });

          setTimeout(() => {
            setCollapsed(false);
            forceActivateTab(artifactId);
          }, 50);
        };

        const displayVal = formatDuration(val);
        const decisionSecs = parseToSecs(val);
        const isWithinSLA = decisionSecs > 0 && decisionSecs <= 300 && hasRiskStatus;

        return (
          <div
            className="flex flex-col justify-center h-full py-1 cursor-pointer select-none group"
            onClick={handleDiagnosticsClick}
          >
            <div className="flex items-center gap-2">
              {!hasRiskStatus ? (
                <span className="text-[17px] italic text-gray-400 font-medium tracking-tight">
                  Awaiting decision
                </span>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-blue-500 group-hover:text-blue-600 group-hover:underline underline-offset-4 transition-all flex items-center gap-1.5 tracking-tight">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {displayVal || "0s"}
                    </span>
                    {isWithinSLA && (
                      <div className="bg-[#f0fdf4] text-[#166534] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#dcfce7]">
                        <span className="text-[10px]">✓</span>
                        <span>within SLA</span>
                      </div>
                    )}
                  </div>
                  {(() => {
                    const durationSecs = parseToSecs(val);
                    if (durationSecs > 0 && row.date) {
                      const startMs = new Date(row.date).getTime();
                      const finishMs = startMs + (durationSecs * 1000);
                      const finishDate = new Date(finishMs).toISOString();
                      return (
                        <span className="text-gray-500 text-[11px] font-medium mt-0.5">
                          {formatDateTime(finishDate)}
                        </span>
                      );
                    }
                    return row.originalData?.run?.updated_at ? (
                      <span className="text-gray-500 text-[11px] font-medium mt-0.5">
                        {formatDateTime(row.originalData.run.updated_at)}
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "checksStatus",
      header: "Checks Status",
      minWidth: "180px",
      verticalAlign: "middle",
      render: (val: any) => {
        const { completed = 0, total = 0, failed = 0, partial = 0 } = val || {};
        const effectiveCompleted = completed + partial;
        const percent = total > 0 ? Math.round(((effectiveCompleted + failed) / total) * 100) : 0;

        return (
          <div className="flex flex-col gap-1.5 py-1.5 pr-6 min-w-[160px]">
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex border border-gray-100 shadow-inner">
              <div
                className={`transition-all duration-500 rounded-full ${percent === 100 ? "bg-emerald-500" : "bg-blue-600"
                  }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mt-0.5 px-0.5">
              <span>{effectiveCompleted + failed} / {total}</span>
              <span>{percent}%</span>
            </div>
          </div>
        );
      }
    },
  ], [addTab, setCollapsed, forceActivateTab, activeTabId]);

  const customListRenderer = useCallback((filteredItems: CaseListItem[]) => {
    const grouped = filteredItems.reduce((acc, item) => {
      const data = item.originalData as any;
      const dateStr = data.createdDateTime || data.createdDate || "";
      const date = dateStr ? formatDate(String(dateStr)) : 'Unknown Date';
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {} as Record<string, CaseListItem[]>);

    // Sort dates descending
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (a === 'Unknown Date') return 1;
      if (b === 'Unknown Date') return -1;

      const parseDate = (d: string) => {
        const date = new Date(d);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      };
      return parseDate(b) - parseDate(a);
    });

    /* Initial expansion logic moved to useEffect */

    return (
      <TooltipProvider>
        <div className="space-y-4 mt-4">
          {sortedDates.map((date) => {
            const itemsInDate = grouped[date];
            const isExpanded = expandedDates.includes(date);

            const tableData = itemsInDate.map(it => {
              const data = it.originalData as any as RunBetweenItemDto;

              const riskReport = (data as any).risk_report || (data as any).risk_score;
              const hasRiskReport = riskReport && typeof riskReport === "object";

              const runId = it.itemID;
              const merchantRules = rulesMap.get(String(runId)) || {};
              const redFlagsList: string[] = [];
              const greenFlagsList: string[] = [];

              Object.entries(merchantRules).forEach(([code, ruleObj]: [string, any]) => {
                const isTriggered = isRuleTriggered(ruleObj);
                const formatted = formatRuleValue(code, ruleObj);
                if (isTriggered) {
                  redFlagsList.push(formatted);
                } else {
                  greenFlagsList.push(formatted);
                }
              });

              const rawMethod = (data as any).Method ?? (data as any).run?.Method ?? (data as any).run?.method ?? (it.originalData as any)?.Method ?? (it.originalData as any)?.run?.Method ?? (it.originalData as any)?.run?.method;
              const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";

              return {
                id: it.itemID,
                date: data.run.created_at,
                mid: data.run.merchant_id || "N/A",
                legalName: data.merchant.name || "N/A",
                riskStatus: (data as any).priority_flag?.category || (hasRiskReport ? riskReport.risk_tier : null),
                riskTier: hasRiskReport ? riskReport.risk_tier : null,
                riskScore: (data as any).priority_flag?.points ?? (hasRiskReport ? riskReport.risk_score : (typeof data.risk_score === 'number' ? data.risk_score : null)),
                decisioningTime: (data as any).priority_flag?.duration || calculateDuration(data.run.created_at, data.run.updated_at),
                method: methodValue,
                checksStatus: {
                  completed: (data as any).progress?.completed ?? (data.run.status?.toLowerCase() === "completed" || data.run.status?.toLowerCase() === "partial" ? (data as any).progress?.total_steps || 18 : 12),
                  partial: Math.max(0, ((data as any).progress?.total_steps ?? 18) - ((data as any).progress?.completed ?? 0) - ((data as any).progress?.failed ?? 0) - ((data as any).progress?.processing ?? 0)),
                  failed: (data as any).progress?.failed ?? 0,
                  total: (data as any).progress?.total_steps ?? 18
                },
                status: data.run.status,
                originalData: it.originalData,
                redFlags: redFlagsList.join("\n"),
                greenFlags: greenFlagsList.join("\n")
              };
            });

            // Pre-calculate status counts globally for this date group to share between sections
            let completeCount = 0;
            let decidedStillRunningCount = 0;
            let evaluatingCount = 0;
            let totalCompletedRunTimeSec = 0;
            let withinSlaCount = 0;

            tableData.forEach((row) => {
              const rowStatus = String(row.status || "").toUpperCase();
              const isProcessing = rowStatus === "PROCESSING";
              const hasRiskStatus = !!row.riskStatus && String(row.riskStatus).trim() !== "" && String(row.riskStatus).toLowerCase() !== "evaluating...";
              const isCompleted = !isProcessing; // Partial is treated as completed

              const parseTimeToSeconds = (timeStr?: string | null) => {
                if (!timeStr) return 0;
                const match = timeStr.match(/(?:(\d+)m)?\s*(?:\s*(\d+)s)?/);
                if (!match) return 0;
                const m = parseInt(match[1] || "0");
                const s = parseInt(match[2] || "0");
                return m * 60 + s;
              };

              if (isCompleted) {
                // Now using Decisioning Time for the average as requested
                totalCompletedRunTimeSec += parseTimeToSeconds(row.decisioningTime);

                // Within SLA calculation (Decision Time <= 5 min / 300 sec)
                const dTimeSec = parseTimeToSeconds(row.decisioningTime);
                if (dTimeSec <= 300) {
                  withinSlaCount++;
                }

                completeCount++;
              } else {
                // decided, still running -> risk status: exists, status: running
                if (hasRiskStatus) {
                  decidedStillRunningCount++;
                }
                // evaluating -> risk status : evaluates..., status: running
                else {
                  evaluatingCount++;
                }
              }
            });

            const avgSecs_shared = completeCount > 0 ? totalCompletedRunTimeSec / completeCount : 0;
            const avgMins_shared = Math.floor(avgSecs_shared / 60);
            const avgSecsRem_shared = (avgSecs_shared % 60).toFixed(0);
            const avgTimeStr_shared = `${avgMins_shared}m ${avgSecsRem_shared}s avg`;

            const withinSlaPercent = completeCount > 0 ? Math.round((withinSlaCount / completeCount) * 100) : 0;

            return (
              <div
                key={date}
                className={cn(
                  "border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 bg-white",
                  isExpanded && "shadow-md"
                )}
              >
                <div
                  className="py-5 px-6 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50/80 transition-colors"
                  onClick={() => toggleDateExpansion(date)}
                >
                  <div className="flex items-center gap-4 w-[220px] shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-blue-600 whitespace-nowrap">
                        {date}
                      </h3>
                    </div>
                  </div>

                  <div className="flex-1 flex justify-center px-4">
                    {(() => {
                      const total = tableData.length;
                      let criticalCount = 0,
                        highCount = 0,
                        mediumCount = 0,
                        lowCount = 0,
                        manualReview = 0;

                      tableData.forEach((row) => {
                        const status = String(row.riskStatus || "").trim().toLowerCase();

                        if (status.includes("critical") || status === "not recommended") {
                          criticalCount++;
                        } else if (status.includes("high")) {
                          highCount++;
                        } else if (status.includes("medium")) {
                          mediumCount++;
                        } else if (status.includes("low") || status === "recommended") {
                          lowCount++;
                        } else if (status.includes("manual review")) {
                          manualReview++;
                        }
                      });



                      const MetricItem = ({
                        label,
                        value,
                        colorClass,
                        icon: Icon,
                        showSeparator = true,
                      }: {
                        label: string;
                        value: string | number;
                        colorClass?: string;
                        icon: any;
                        showSeparator?: boolean;
                      }) => {
                        // Define fixed widths for each metric type to ensure vertical alignment across cards
                        const widthMap: Record<string, string> = {
                          "Total Merchants": "min-w-[120px]",
                          "Critical Risk": "min-w-[110px]",
                          "High Risk": "min-w-[110px]",
                          "Medium Risk": "min-w-[110px]",
                          "Low Risk": "min-w-[110px]",
                          "Manual Review": "min-w-[120px]",
                          "Within SLA": "min-w-[100px]",
                        };
                        const widthClass = widthMap[label] || "min-w-[80px]";

                        return (
                          <div className="flex items-center">
                            <div className={cn("flex flex-col items-center justify-center", widthClass)}>
                              <span
                                className={`text-[22px] font-bold tracking-tight ${colorClass || "text-gray-800"
                                  }`}
                              >
                                {value}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Icon className={cn("w-3.5 h-3.5", colorClass || "text-gray-400")} />
                                <span className="text-[11px] font-bold text-gray-500 tracking-wide whitespace-nowrap">
                                  {label}
                                </span>
                              </div>
                            </div>
                            {showSeparator && (
                              <div className="h-8 w-[1.5px] bg-gray-200/60 ml-4 mr-2" />
                            )}
                          </div>
                        );
                      };

                      return (
                        <div className="flex items-center">
                          <MetricItem
                            label="Total Merchants"
                            value={total}
                            colorClass="text-blue-700"
                            icon={Users}
                          />
                          <MetricItem
                            label="Critical Risk"
                            value={criticalCount}
                            colorClass="text-red-700"
                            icon={XCircle}
                          />
                          <MetricItem
                            label="High Risk"
                            value={highCount}
                            colorClass="text-orange-600"
                            icon={AlertCircle}
                          />
                          <MetricItem
                            label="Medium Risk"
                            value={mediumCount}
                            colorClass="text-amber-600"
                            icon={AlertCircle}
                          />
                          <MetricItem
                            label="Low Risk"
                            value={lowCount}
                            colorClass="text-emerald-600"
                            icon={CheckCircle2}
                          />
                          <MetricItem
                            label="Manual Review"
                            value={manualReview}
                            colorClass="text-purple-600"
                            icon={AlertCircle}
                          />
                          <MetricItem
                            label="Within SLA"
                            value={`${withinSlaPercent}%`}
                            colorClass="text-indigo-600"
                            icon={ShieldCheck}
                            showSeparator={false}
                          />
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-4 w-[480px] justify-end shrink-0">
                    {(() => {
                      const totalCount = tableData.length;
                      const completePercent = totalCount > 0 ? (completeCount / totalCount) * 100 : 0;
                      const decidedPercent = totalCount > 0 ? (decidedStillRunningCount / totalCount) * 100 : 0;
                      const evaluatingPercent = totalCount > 0 ? (evaluatingCount / totalCount) * 100 : 0;
                      const isRunningCount = decidedStillRunningCount + evaluatingCount;

                      return (
                        <div className="flex items-center gap-4 mr-2">
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div className="w-[100px] h-4 bg-gray-50 rounded-full overflow-hidden flex cursor-pointer shadow-inner border border-gray-200/50">
                                <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${completePercent}%` }} />
                                <div className="bg-[#f59e0b] h-full transition-all duration-500" style={{ width: `${decidedPercent}%` }} />
                                <div className="bg-[#e2e8f0] h-full transition-all duration-500" style={{ width: `${evaluatingPercent}%` }} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-3 bg-white border border-gray-200 shadow-xl rounded-xl min-w-[180px]">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                                    <span className="text-sm font-bold text-gray-800">{completeCount}</span>
                                    <span className="text-sm text-gray-500">Complete</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                                    <span className="text-sm font-bold text-gray-800">{decidedStillRunningCount}</span>
                                    <span className="text-sm text-gray-500">Decided, Still Running</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                                    <span className="text-sm font-bold text-gray-800">{evaluatingCount}</span>
                                    <span className="text-sm text-gray-500">Evaluating</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>

                          {/* Status Section - Fixed Width */}
                          <div className="w-[125px] flex-shrink-0 flex justify-start">
                            {isRunningCount > 0 ? (
                              <div className="bg-[#fffbeb] border border-[#fef3c7] px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
                                <span className="text-[13px] font-bold text-[#92400e] whitespace-nowrap">
                                  {isRunningCount} Processing
                                </span>
                              </div>
                            ) : (
                              <div className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm border-dashed">
                                <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                                <span className="text-[13px] font-bold text-emerald-700 whitespace-nowrap">Completed</span>
                              </div>
                            )}
                          </div>

                          {/* Avg Time Section - Fixed Width */}
                          <div className="w-[110px] flex-shrink-0 flex justify-start">
                            {completeCount > 0 && (
                              <div className="flex items-center gap-2 px-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-[13px] font-bold text-gray-900 whitespace-nowrap">
                                  {avgTimeStr_shared}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="w-[40px] flex-shrink-0 flex justify-end">
                      <BubbleTag
                        text="CSV"
                        color="blue"
                        clickable
                        onClick={() => exportToCSV(formatCasesForExport(itemsInDate), `watchlist_${date}.csv`)}
                        withBorder={true}
                        hasInsideIcon={true}
                        icon={<Download className="h-3 w-3" />}
                      />
                    </div>
                    <div className="w-[30px] flex-shrink-0 flex justify-end">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 p-0">
                        <div className="mx-6 my-4 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-3">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800 leading-relaxed">
                            SLA: decision within 5 min. Full rule run may take longer — decision locks the moment a critical rule fires.
                          </span>
                        </div>
                        <CustomTableView
                          columns={columns as any}
                          data={tableData}
                          initialRowLimit={100}
                          isExpanded={true}
                          onRowClick={(row: any) => handleItemClick({ originalData: row.originalData })}
                          className="border-none shadow-none rounded-none"
                          hoverBgColor="blue-100"
                          headerAndTotalRowBg="blue-50"
                          enableRowSelection={isDeleteMode}
                          selectedRows={selectedRuns}
                          onSelectedRowsChange={handleSelectedRunsChange}
                          rowIdKey="id"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }, [expandedDates, handleItemClick, columns, exportToCSV, isDeleteMode, selectedRuns, handleSelectedRunsChange]);

  // Handle initial expansion once data is loaded and filtered
  useEffect(() => {
    if (filteredItemsForExport.length > 0 && !hasInitializedExpansion) {
      const dateStr = (filteredItemsForExport[0].originalData as any).createdDateTime || (filteredItemsForExport[0].originalData as any).createdDate || "";
      if (dateStr) {
        const date = formatDate(dateStr);
        setExpandedDates([date]);
        setHasInitializedExpansion(true);
      }
    }
  }, [filteredItemsForExport, hasInitializedExpansion, formatDate]);

  const primaryFilterGroup = useMemo<PrimaryFilterGroup[]>(() => [
    {
      id: "status",
      label: "Progress",
      type: "togglebuttons" as const,
      options: statusOptions,
      selectedValues: statusSelected,
      onFilterChange: (vals: string[]) => setStatusSelected(vals),
      filterFunction: (item: any, selectedValues: string[]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        const st = (item.originalData.status || "").toString().toUpperCase();
        const mappedStatus =
          st === "PROCESSING" ? "Processing" :
            (st === "QUEUED" || st === "ENQUEUED") ? "Queued" :
              st === "FAILED" ? "Failed" : "Completed";

        return (
          selectedValues.includes(mappedStatus) ||
          selectedValues.includes(st) ||
          selectedValues.some((s) =>
            st.toLowerCase().includes(s.toLowerCase())
          )
        );
      },
      showLabel: true,
    },
    {
      id: "riskStatus",
      label: "AI Decision",
      type: "multiselect" as const,
      options: riskStatusOptions,
      selectedValues: riskStatusSelected,
      onFilterChange: (vals: string[]) => setRiskStatusSelected(vals),
      filterFunction: (item: any, selectedValues: string[]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        const data = item.originalData as any;
        const tier = String(data.riskStatus || "").trim().toLowerCase();
        return selectedValues.some(val => tier.includes(val.toLowerCase()));
      },
      showLabel: true,
      width: "280px",
    },
    {
      id: "method",
      label: "Method",
      type: "togglebuttons" as const,
      options: [
        { value: "Auto Reject", label: "Auto Reject" },
        { value: "Through Scoring", label: "Through Scoring" },
      ],
      selectedValues: methodSelected,
      onFilterChange: (vals: string[]) => setMethodSelected(vals),
      filterFunction: (item: any, selectedValues: string[]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        const data = item.originalData as any;
        const rawMethod = (data as any).Method ?? (data as any).run?.Method ?? (data as any).run?.method ?? (item.originalData as any)?.Method ?? (item.originalData as any)?.run?.Method ?? (item.originalData as any)?.run?.method;
        const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";
        const normalize = (v: string) => v.replace(/[-_]/g, " ").trim().toLowerCase();
        return selectedValues.some(sv => normalize(sv) === normalize(methodValue));
      },
      showLabel: true,
    },
    {
      id: "sla",
      label: "Within SLA",
      type: "togglebuttons" as const,
      options: slaOptions,
      selectedValues: slaSelected,
      onFilterChange: (vals: string[]) => setSlaSelected(vals),
      filterFunction: (item: any, selectedValues: string[]) => {
        if (!selectedValues || selectedValues.length === 0) return true;

        const data = item.originalData as any;
        const dTime = data.decisioningTime || "";
        if (!dTime) return selectedValues.includes("No");

        const hMatch = dTime.match(/(\d+)h/);
        const mMatch = dTime.match(/(\d+)m/);
        const sMatch = dTime.match(/(\d+)s/);

        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        const s = sMatch ? parseInt(sMatch[1]) : 0;

        const totalSeconds = h * 3600 + m * 60 + s;
        const isWithinSLA = totalSeconds > 0 && totalSeconds <= 300;

        return selectedValues.includes(isWithinSLA ? "Yes" : "No");
      },
      showLabel: true,
    }
  ], [statusSelected, riskStatusSelected, methodSelected, slaSelected]);

  const secondaryFilterGroups = useMemo<SecondaryFilterGroup[]>(() => [
    {
      id: "period",
      label: "Period",
      type: "togglebuttons" as const,
      options: periodOptions,
      selectedValues: periodSelected,
      singleSelect: true,
      onFilterChange: (vals: string[]) => {
        // Enforce single selection by taking only the last selected value
        // If no value is selected (deselected), default to "All"
        const nextVal = vals.length > 0 ? [vals[vals.length - 1]] : ["All"];
        setPeriodSelected(nextVal);
      },
      filterFunction: (item: any, selectedValues: string[]) => {
        if (!selectedValues || selectedValues.length === 0 || selectedValues.includes("All")) return true;

        const data = item.originalData as any;
        const dateStr = data.createdDateTime || "";
        if (!dateStr) return false;

        const itemDate = new Date(dateStr);
        const now = new Date();

        return selectedValues.some(val => {
          if (val === "1w") {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return itemDate >= weekAgo;
          }
          if (val === "1m") {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return itemDate >= monthAgo;
          }
          if (val === "1y") {
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            return itemDate >= yearAgo;
          }
          if (val === "2026") return itemDate.getFullYear() === 2026;
          if (val === "2025") return itemDate.getFullYear() === 2025;
          return true;
        });
      },
      showLabel: true,
    },
    {
      id: "dateRange",
      label: "Date Range",
      type: "dateselect" as const,
      options: [],
      selectedValues: [],
      onFilterChange: () => { },
      fromDateTime: dateRange.from,
      toDateTime: dateRange.to,
      onDateTimeChange: (from: string, to: string) => setDateRange({ from, to }),
      filterFunction: (item: any, selectedValues: string[]) => {
        const from = selectedValues[0];
        const to = selectedValues[1];
        if (!from && !to) return true;

        const data = item.originalData as any;
        const dateStr = data.createdDateTime || "";
        if (!dateStr) return false;
        const itemDate = new Date(dateStr);

        if (from && new Date(from) > itemDate) return false;
        if (to && new Date(to) < itemDate) return false;

        return true;
      },
      showLabel: true,
    }
  ], [periodSelected, dateRange.from, dateRange.to]);

  const tertiaryFilterGroups = useMemo<TertiaryFilterGroup[]>(() => [
    {
      id: "search",
      label: "Search",
      type: "searchbar" as const,
      options: [],
      selectedValues: searchQuery ? [searchQuery] : [],
      onFilterChange: (vals: string[]) => setSearchQuery(vals[0] || ""),
      filterFunction: (item: any, selectedValues: string[]) => {
        const q = (selectedValues[0] || "")
          .toString()
          .trim()
          .toLowerCase();
        if (!q) return true;

        const data = item.originalData as any;
        const id = (data.run?.id || data.caseId || "").toString().toLowerCase();
        const mid = (data.run?.merchant_id || data.externalMerchantId || "").toString().toLowerCase();
        const name = (data.merchant?.name || data.registeredName || "").toString().toLowerCase();
        const website = (data.merchant?.website || "").toString().toLowerCase();

        return (
          id.includes(q) ||
          mid.includes(q) ||
          name.includes(q) ||
          website.includes(q)
        );
      },
      showLabel: false,
      searchPlaceholder:
        "Search by Registered Name, Brand Name or AI Decision...",
      actionElements: (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsRunMerchantOpen(true)}
            className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 h-10 px-4 font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Run Merchant
          </Button>
          {!isDeleteMode ? (
            <Button
              onClick={() => setIsDeleteMode(true)}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 h-10 font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95 ml-2"
            >
              <Trash size={18} /> Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedRuns([]);
                }}
                variant="outline"
                className="bg-white border-gray-300 text-gray-600 hover:bg-gray-50 h-10 px-4 font-semibold shadow-sm transition-all active:scale-95"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white hover:bg-red-700 h-10 px-4 font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                disabled={selectedRuns.length === 0 || isDeleting}
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                Confirm ({selectedRuns.length})
              </Button>
            </div>
          )}
          <SortActionButton
            sortFields={sortFields}
            currentSortField={sortField}
            currentSortDirection={sortDirection}
            onSortChange={handleSortChange}
            color="blueTextWhiteBg"
            border={true}
          />
          <Button
            onClick={() => {
              setWatchlistFilters({
                statusSelected: [],
                riskStatusSelected: [],
                methodSelected: [],
                slaSelected: [],
                periodSelected: ["All"],
                dateRange: { from: "", to: "" },
                sortField: "createdDate",
                sortDirection: "desc",
                searchQuery: "",
              });
            }}
            variant="outline"
            className="bg-white border-gray-300 text-gray-600 hover:bg-gray-50 h-10 px-4 font-semibold shadow-sm transition-all active:scale-95 ml-2"
          >
            Reset
          </Button>
        </div>
      ),
    },
  ], [sortField, sortDirection, sortedItems, sortFields, isDeleteMode, selectedRuns, isDeleting, handleBulkDelete]);

  return (
    <motion.div
      className="w-full px-2 pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div className="mb-4">
        <SectionHeaderWithFlags
          title="All Cases"
          icon={Eye}
          titleRightElement={
            (() => {
              if (loading && cases.length === 0) return null;
              if (runningCount > 0) {
                return (
                  <div className="flex items-center gap-3 ml-4">
                    <div className="bg-[#fffbeb] border border-[#fef3c7] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-[0_2px_4px_rgba(254,243,199,0.2)] group transition-all">
                      <div className={cn("w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]", isRefreshing ? "animate-spin" : "animate-pulse")} />
                      <span className="text-[14px] font-bold text-[#92400e] whitespace-nowrap">
                        {runningCount} Running
                      </span>
                    </div>
                    {/* {lastUpdated && (
                      <span className="text-[11px] font-medium text-gray-400 italic">
                        Refreshed {lastUpdated}
                      </span>
                    )} */}
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-3 ml-4 px-1 py-0.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-green-700 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                      style={{ background: "radial-gradient(circle at 35% 35%, #4ade80, #16a34a)" }}
                    />
                    <span className="font-bold text-[15px] text-gray-900 tracking-tight">System Active</span>
                  </div>
                  {/* {lastUpdated && (
                    <span className="text-[11px] font-medium text-gray-400 italic">
                      Updates {lastUpdated}
                    </span>
                  )} */}
                </div>
              );
            })()
          }
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
          initialRowLimit={5}
          rightElement={
            <BubbleTag
              text="Export CSV"
              color="blue"
              clickable
              onClick={handleGlobalExport}
              withBorder={true}
              hasInsideIcon={true}
              icon={<Download className="h-3 w-3" />}
              size="md"
            />
          }
        />
      </motion.div>

      <CustomList
        items={sortedItems}
        searchFields={["title"]}
        onItemClick={handleItemClick}
        onFilterChange={handleFilterChange}
        loading={loading}
        disableInternalSorting={true}
        showItemSpacing={true}
        showToggleOptionCounts={true}
        showFilterToggle={false}
        initialRowLimit={200}
        // listTitle={`All Cases (${filteredCount} cases)`}
        customListRenderer={customListRenderer}
        primaryFilterGroup={primaryFilterGroup}
        secondaryFilterGroups={secondaryFilterGroups}
        tertiaryFilterGroups={tertiaryFilterGroups}
        showKeyMetrics={true}
        showKeyMetricsCollapse={true}
        showKeyMetricsHeader={false}
        hardcodedMetrics={cardMetrics}
        emptyState={{
          icon: Eye,
          title: "No cases found",
          description: "No cases were returned by the API.",
        }}
      />

      <RunMerchantModal
        open={isRunMerchantOpen}
        onOpenChange={setIsRunMerchantOpen}
      />
    </motion.div>
  );
};

export default InvWatchlistPage;
