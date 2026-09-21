"use client";

import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomList from "@/components/custom/CustomList/customList";
import {
  Eye,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Download,
  Plus,
  Trash,
  Check,
  Building2,
  Timer,
  X,
  AlertTriangle
} from "lucide-react";
import {
  deleteRun,
  clearCache,
  fetchRulesSummary,
} from "@/app/services/caseServices";
import { getFlagName, getFlagSeverity } from "../Sample Data/InvDecisioningSampleData";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import { useProfileStore } from "@/app/store/authentication/profileStore";
import { useActiveContext } from "@/app/layout/ActiveContext/useActiveContext";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { SortActionButton, SortDirection } from "@/components/custom/CustomList/SortActionButton";
import { Button } from "@/components/ui/button";
import { PrimaryFilterGroup, SecondaryFilterGroup, TertiaryFilterGroup } from "@/components/custom/CustomList/customListFilter";
import { RunMerchantModal } from "../Components/RunMerchantModal";
import { cn, formatTitleCase } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

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

const periodOptions = [
  { value: "All", label: "All" },
  { value: "1w", label: "1w", icon: Clock },
  { value: "1m", label: "1m", icon: Clock },
  { value: "1y", label: "1y", icon: Clock },
  { value: "2026", label: "2026", icon: Clock },
  { value: "2025", label: "2025", icon: Clock },
];

const InvPortfolioPage: FC<{ merchantId?: string }> = ({ merchantId }) => {
  const {
    investigationCases: cases,
    fetchInvestigationCases: loadData,
    loading,
    portfolioFilters,
    setPortfolioFilters,
    rulesSummaryCases,
    fetchRulesSummaryCases
  } = useInvestigationCaseStore();

  const { profile, fetchProfile } = useProfileStore();
  const isAdmin = profile?.role === 'ADMIN';

  const {
    statusSelected,
    riskStatusSelected,
    methodSelected,
    activeSelected,
    periodSelected,
    dateRange,
    sortField,
    sortDirection,
    searchQuery,
  } = portfolioFilters;

  const setStatusSelected = useCallback((vals: string[]) => setPortfolioFilters({ statusSelected: vals }), [setPortfolioFilters]);
  const setRiskStatusSelected = useCallback((vals: string[]) => setPortfolioFilters({ riskStatusSelected: vals }), [setPortfolioFilters]);
  const setMethodSelected = useCallback((vals: string[]) => setPortfolioFilters({ methodSelected: vals }), [setPortfolioFilters]);
  const setActiveSelected = useCallback((vals: string[]) => setPortfolioFilters({ activeSelected: vals }), [setPortfolioFilters]);
  const setPeriodSelected = useCallback((vals: string[]) => setPortfolioFilters({ periodSelected: vals }), [setPortfolioFilters]);
  const setDateRange = useCallback((range: { from: string; to: string }) => setPortfolioFilters({ dateRange: range }), [setPortfolioFilters]);
  const setSortField = useCallback((field: string) => setPortfolioFilters({ sortField: field }), [setPortfolioFilters]);
  const setSortDirection = useCallback((dir: SortDirection) => setPortfolioFilters({ sortDirection: dir }), [setPortfolioFilters]);
  const setSearchQuery = useCallback((query: string) => setPortfolioFilters({ searchQuery: query }), [setPortfolioFilters]);

  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // Delete functionality states
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState<Record<string, any>[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRunMerchantOpen, setIsRunMerchantOpen] = useState(false);
  const activeContext = useActiveContext();

  useEffect(() => {
    loadData();
    fetchRulesSummaryCases(1000, true);
    fetchProfile();
  }, [loadData, fetchRulesSummaryCases, fetchProfile]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedRuns.length === 0) return;

    const idsToDelete = new Set(selectedRuns.map(run => String(run.id || run.itemID || "")));

    setIsDeleting(true);
    try {
      // 1. Reset UI
      setSelectedRuns([]);
      setIsDeleteMode(false);

      // 2. Perform API calls
      await Promise.all(
        Array.from(idsToDelete).map(id => deleteRun(id))
      );

      // 3. Refresh data
      setTimeout(() => loadData(true), 1500);
    } catch (error) {
      console.error("Error during bulk delete:", error);
      alert("Failed to delete some items. Refreshing data...");
      loadData();
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRuns, loadData]);

  const formatDateTime = useCallback((dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
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
    hours = hours ? hours : 12;
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

  const handleItemClick = useCallback((item: any) => {
    if (isDeleteMode) return; // Prevent navigation in delete mode
    const caseId = item?.originalData?.caseId || item?.itemID;
    if (!caseId) return;
    try {
      sessionStorage.setItem("inv_source_tab", "portfolio");
    } catch (e) {}
    const name = item?.originalData?.registeredName || item?.originalData?.caseTitle || caseId;
    activeContext.handleSelect("investigation", caseId, formatTitleCase(name));
  }, [activeContext, isDeleteMode]);

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

  const handleGlobalExport = useCallback(() => {
    const rulesMap = new Map<string, Record<string, any>>();
    rulesSummaryCases.forEach(c => {
      if (c.caseId && (c as any).rules) {
        rulesMap.set(String(c.caseId), (c as any).rules);
      }
    });

    const isRuleTriggered = (ruleObj: any) => {
      if (!ruleObj) return false;
      const val = ruleObj.overall_triggered ?? ruleObj.overallTriggered ?? ruleObj.triggered ?? ruleObj.status;
      if (typeof val === "boolean") return val;
      if (typeof val === "string") {
        const s = val.toLowerCase();
        return s === "yes" || s === "true" || s === "triggered";
      }
      if (typeof val === "number") return val === 1;
      return false;
    };

    const formatRuleValue = (code: string, ruleObj: any) => {
      const name = getFlagName(code) || ruleObj.label || ruleObj.step_name || ruleObj.name || "N/A";
      const category = ruleObj.category || ruleObj.severity || getFlagSeverity(code) || "N/A";
      return `${code} - ${name} - ${category}`;
    };

    const allTableData = filteredItems.map((it, index) => {
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
    exportToCSV(allTableData, `investigation_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredItems, exportToCSV, formatDateTime, rulesSummaryCases]);

  const createPortfolioItem = useCallback(
    (item: any): any => {
      const { run, merchant, risk_score } = item;
      const priority_flag = (item as any).priority_flag;
      const risk_report = (item as any).risk_report;
      const status = run.status || "N/A";

      let finalRiskScore: any = null;
      if (priority_flag?.points !== undefined && priority_flag?.points !== null) {
        finalRiskScore = priority_flag.points;
      } else if (risk_report && typeof risk_report === "object" && risk_report.risk_score !== undefined) {
        finalRiskScore = risk_report.risk_score;
      } else if (risk_score && typeof risk_score === "object" && (risk_score as any).risk_score !== undefined) {
        finalRiskScore = (risk_score as any).risk_score;
      } else if (typeof risk_score === "number") {
        finalRiskScore = risk_score;
      } else if (typeof (item as any).riskScore === "number") {
        finalRiskScore = (item as any).riskScore;
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

      const rawMethod = item.Method ?? run.Method ?? run.method ?? (item as any).Method ?? (item as any).run?.Method ?? (item as any).run?.method;
      const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";

      const isSelected = selectedRuns.some(r => r.id === run.id);

      return {
        itemID: run.id,
        leftMainIcon: isDeleteMode ? (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center py-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRuns(prev => [...prev, { id: run.id, ...item }]);
                } else {
                  setSelectedRuns(prev => prev.filter(r => r.id !== run.id));
                }
              }}
              className="border-gray-300"
            />
          </div>
        ) : undefined,
        title: (
          <div className="flex items-center gap-3">
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
              fixedWidth={90}
            />
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-blue-700">
                {formatTitleCase(merchant.name || "N/A")}
              </span>
            </div>
          </div>
        ),
        topRightContent: (
          <div className="flex items-center gap-2">
            <BubbleTag
              text={riskTier}
              color={getRiskColor(riskTier)}
              withBorder={true}
              fixedWidth={140}
            />
            <BubbleTag
              text={methodValue}
              color={methodValue.toUpperCase() !== "NA" ? "blue" : "gray"}
              withBorder={true}
              fixedWidth={120}
            />
            <BubbleTag
              text={`Risk Score: ${finalRiskScore !== null ? finalRiskScore : "N/A"}`}
              color="yellowTextWhiteBg"
              withBorder={true}
              fixedWidth={130}
            />
            <BubbleTag
              text={formatDateTime(run.created_at)}
              color="grayTextWhiteBg"
              withBorder={true}
              fixedWidth={180}
            />
          </div>
        ),
        rightMainIcon: isDeleteMode ? undefined : ChevronRight,
        originalData: {
          ...item,
          caseId: run.id,
          registeredName: formatTitleCase(merchant.name || ""),
          externalMerchantId: run.merchant_id,
          createdDateTime: run.created_at,
          status: run.status,
          riskStatus: riskTier,
          riskScore: finalRiskScore,
        },
      };
    },
    [formatDateTime, isDeleteMode, selectedRuns]
  );

  const items = useMemo(() => {
    const filteredCases = cases.filter((c: any) => {
      if (isAdmin) return true;
      const isActive = c.run?.is_active ?? c.is_active;
      return isActive === true;
    });
    return filteredCases.map((c: any) => createPortfolioItem(c));
  }, [cases, createPortfolioItem, isAdmin]);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sortField === "registeredName") {
      arr.sort((a: any, b: any) => {
        const an = (a.originalData.registeredName || "").toString();
        const bn = (b.originalData.registeredName || "").toString();
        const cmp = an.localeCompare(bn);
        return sortDirection === "desc" ? -cmp : cmp;
      });
    } else if (sortField === "createdDate") {
      arr.sort((a: any, b: any) => {
        const at = Date.parse(String(a.originalData.createdDateTime || "")) || 0;
        const bt = Date.parse(String(b.originalData.createdDateTime || "")) || 0;
        const cmp = at - bt;
        return sortDirection === "desc" ? -cmp : cmp;
      });
    }
    return arr;
  }, [items, sortField, sortDirection]);

  const handleSortChange = useCallback((fieldKey: string, dir: SortDirection) => {
    setSortField(fieldKey);
    setSortDirection(dir);
  }, [setSortField, setSortDirection]);

  const handleFilterChange = useCallback((f: any[]) => {
    try {
      const ids = f.map(item => item.itemID);
      sessionStorage.setItem("inv_portfolio_filtered_ids", JSON.stringify(ids));
    } catch (e) {}
    setFilteredItems(prev => {
      if (prev.length === f.length) {
        const unchanged = f.every((item, i) => item.itemID === prev[i]?.itemID);
        if (unchanged) return prev;
      }
      return f;
    });
  }, []);

  const sortFields = useMemo(() => [
    { key: "registeredName", label: "Legal Name" },
    { key: "createdDate", label: "Date" },
  ], []);

  const cardMetrics = useMemo(() => {
    const total = filteredItems.length;
    let lowCount = 0;
    let mediumCount = 0;
    let highCount = 0;
    let criticalCount = 0;
    let manualReviewCount = 0;

    filteredItems.forEach(item => {
      const data = item.originalData as any;
      const riskStatus = String(data.riskStatus || "").trim().toLowerCase();

      if (riskStatus.includes("low")) lowCount++;
      else if (riskStatus.includes("medium")) mediumCount++;
      else if (riskStatus.includes("high")) highCount++;
      else if (riskStatus.includes("critical")) criticalCount++;
      else if (riskStatus.includes("manual review")) manualReviewCount++;
    });

    return [
      { label: "Total Merchants", value: total, icon: "Building2" },
      { label: "Critical Risk", value: criticalCount, icon: "XCircle" },
      { label: "High Risk", value: highCount, icon: "AlertCircle" },
      { label: "Medium Risk", value: mediumCount, icon: "AlertTriangle" },
      { label: "Low Risk", value: lowCount, icon: "CheckCircle2" },
      { label: "Manual Review", value: manualReviewCount, icon: "ShieldCheck" },
    ];
  }, [filteredItems]);

  const primaryFilterGroup = useMemo<PrimaryFilterGroup[]>(() => {
    const filters: PrimaryFilterGroup[] = [
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
          return selectedValues.includes(mappedStatus);
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
          const rawMethod = data.Method ?? data.run?.Method ?? data.run?.method ?? (item.originalData as any)?.Method ?? (item.originalData as any)?.run?.Method ?? (item.originalData as any)?.run?.method;
          const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";
          const normalize = (v: string) => v.replace(/[-_]/g, " ").trim().toLowerCase();
          return selectedValues.some(sv => normalize(sv) === normalize(methodValue));
        },
        showLabel: true,
      }
    ];

    if (isAdmin) {
      filters.push({
        id: "active",
        label: "Active",
        type: "togglebuttons" as const,
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
        selectedValues: activeSelected,
        onFilterChange: (vals: string[]) => setActiveSelected(vals),
        filterFunction: (item: any, selectedValues: string[]) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          const data = item.originalData as any;
          const isActive = data.run?.is_active ?? data.is_active;
          const mappedValue = isActive === true ? "Yes" : "No";
          return selectedValues.includes(mappedValue);
        },
        showLabel: true,
      });
    }

    return filters;
  }, [
    statusSelected,
    riskStatusSelected,
    methodSelected,
    activeSelected,
    setStatusSelected,
    setRiskStatusSelected,
    setMethodSelected,
    setActiveSelected,
    isAdmin,
  ]);

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
  ], [
    periodSelected,
    dateRange.from,
    dateRange.to,
    setPeriodSelected,
    setDateRange,
  ]);

  const tertiaryFilterGroups = useMemo<TertiaryFilterGroup[]>(() => [
    {
      id: "search",
      label: "Search",
      type: "searchbar" as const,
      options: [],
      selectedValues: searchQuery ? [searchQuery] : [],
      onFilterChange: (vals: string[]) => setSearchQuery(vals[0] || ""),
      filterFunction: (item: any, selectedValues: string[]) => {
        const q = (selectedValues[0] || "").toString().trim().toLowerCase();
        if (!q) return true;
        const data = item.originalData as any;
        const name = (data.merchant?.name || data.registeredName || "").toString().toLowerCase();
        const mid = (data.run?.merchant_id || data.externalMerchantId || "").toString().toLowerCase();
        const riskStatus = (data.riskStatus || "").toString().toLowerCase();
        const date = formatDateTime(data.createdDateTime || data.run?.created_at).toLowerCase();

        return (
          name.includes(q) ||
          mid.includes(q) ||
          riskStatus.includes(q) ||
          date.includes(q)
        );
      },
      showLabel: false,
      searchPlaceholder: "Search by merchant name, date or AI decision...",
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
                  <>
                    <Trash size={18} /> Confirm Delete ({selectedRuns.length})
                  </>
                )}
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
              setPortfolioFilters({
                statusSelected: [],
                riskStatusSelected: [],
                methodSelected: [],
                activeSelected: ["Yes"],
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
  ], [
    sortField,
    sortDirection,
    sortFields,
    isDeleteMode,
    isDeleting,
    selectedRuns.length,
    handleBulkDelete,
    formatDateTime,
    handleSortChange,
    searchQuery,
    setPortfolioFilters,
    setSearchQuery,
  ]);

  return (
    <motion.div
      className="w-full px-2 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div className="mb-4">
        <SectionHeaderWithFlags
          title="Investigation Portfolio"
          icon={Eye}
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
          titleColorClass="text-blue-700"
          iconColorClass="text-blue-700"
          titleRightElement={null}
          rightElement={
            <div className="flex items-center gap-3">
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
            </div>
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
        showTimeline={false}
        primaryFilterGroup={primaryFilterGroup}
        secondaryFilterGroups={secondaryFilterGroups}
        tertiaryFilterGroups={tertiaryFilterGroups}
        showKeyMetrics={true}
        showKeyMetricsCollapse={true}
        showKeyMetricsHeader={false}
        hardcodedMetrics={cardMetrics}
        emptyState={{
          icon: Eye,
          title: "No portfolio items found",
          description: "Your investigation portfolio is currently empty.",
        }}
      />

      <RunMerchantModal
        open={isRunMerchantOpen}
        onOpenChange={setIsRunMerchantOpen}
      />
    </motion.div>
  );
};

export default InvPortfolioPage;