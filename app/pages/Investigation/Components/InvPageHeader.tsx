"use client";

import { FC, useMemo, useState, useEffect } from "react";
import { InvestigationCase } from "../Sample Data/InvCasesSampleData";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import { AlertTriangle, Check, Clock, ExternalLink, Info, X, FileDown, AlertCircle, Minus, XCircle, Target, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchSteps, fetchDatastoreEntry } from "@/app/services/caseServices";
import { useProfileStore } from "@/app/store/authentication/profileStore";
import { Button } from "@/components/ui/button";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import { useActiveContext } from "@/app/layout/ActiveContext/useActiveContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InvPageHeaderProps {
  activeCase: InvestigationCase | null | undefined;
  hideRiskTags?: boolean;
  onGenerateReport?: () => void;
  onGenerateFullReport?: () => void;
}

const InvPageHeader: FC<InvPageHeaderProps> = ({ activeCase, hideRiskTags, onGenerateReport, onGenerateFullReport }) => {
  const { isCollapsed } = useArtifactStore();
  const [riskStatusCommentary, setRiskStatusCommentary] = useState<string | null>(null);
  const [riskScoreCommentary, setRiskScoreCommentary] = useState<string | null>(null);

  const { investigationCases, fetchInvestigationCases } = useInvestigationCaseStore();
  const activeContext = useActiveContext();

  useEffect(() => {
    if (investigationCases.length === 0) {
      fetchInvestigationCases(true);
    }
  }, [investigationCases.length, fetchInvestigationCases]);

  const orderedCases = useMemo(() => {
    if (typeof window === "undefined") return investigationCases;
    const sourceTab = sessionStorage.getItem("inv_source_tab");
    const key = sourceTab === "portfolio" ? "inv_portfolio_filtered_ids" : "inv_watchlist_filtered_ids";
    const filteredIdsStr = sessionStorage.getItem(key);
    
    if (filteredIdsStr) {
      try {
        const filteredIds: string[] = JSON.parse(filteredIdsStr);
        if (Array.isArray(filteredIds) && filteredIds.length > 0) {
          const ordered: typeof investigationCases = [];
          filteredIds.forEach(id => {
            const found = investigationCases.find(c => String(c.caseId) === String(id));
            if (found) {
              ordered.push(found);
            }
          });
          return ordered;
        }
      } catch (e) {
        console.error("Error parsing filtered IDs from sessionStorage", e);
      }
    }
    return investigationCases;
  }, [investigationCases]);

  const currentCaseId = activeCase?.caseId || (activeCase as any)?.run?.id;
  const currentIndex = orderedCases.findIndex(c => String(c.caseId) === String(currentCaseId));

  const showLeftButton = currentIndex > 0;
  const showRightButton = currentIndex !== -1 && currentIndex < orderedCases.length - 1;

  const handlePrev = () => {
    if (!showLeftButton) return;
    const prevCase = orderedCases[currentIndex - 1];
    const name = prevCase.registeredName || (prevCase as any).merchant?.name || prevCase.caseId;
    activeContext.handleSelect("investigation", prevCase.caseId, name);
  };

  const handleNext = () => {
    if (!showRightButton) return;
    const nextCase = orderedCases[currentIndex + 1];
    const name = nextCase.registeredName || (nextCase as any).merchant?.name || nextCase.caseId;
    activeContext.handleSelect("investigation", nextCase.caseId, name);
  };

  useEffect(() => {
    let mounted = true;
    const caseId = activeCase?.caseId || (activeCase as any)?.run?.id;

    if (!caseId) {
      setRiskStatusCommentary(null);
      setRiskScoreCommentary(null);
      return;
    }

    const loadRiskCommentary = async () => {
      try {
        const steps = await fetchSteps(100);
        const targetStep = steps.find((s: any) => s.name === "RISK_SCORE");
        const stepId = targetStep?.id || "e95829ec-3344-48f4-b2e7-a57eb9eefe36";
        const riskEntry = await fetchDatastoreEntry(String(caseId), stepId);

        if (mounted && riskEntry?.data) {
          const data = (riskEntry.data as any)?.data || {};

          // For Recommended Tag (Status) - Prioritize fraud_commentary and clean it
          const rawStatusExpl = data.fraud_commentary || data.risk_explanation;
          const cleanedStatusExpl = typeof rawStatusExpl === 'string'
            ? rawStatusExpl.replace(/^\*\*.*?\*\*\s*/, "").trim()
            : rawStatusExpl;
          setRiskStatusCommentary(cleanedStatusExpl);

          // For Risk Score Tag - Prioritize risk_explanation (as before)
          const rawScoreExpl = data.risk_explanation || data.fraud_commentary;
          setRiskScoreCommentary(rawScoreExpl);
        }
      } catch (err) {
        console.error("[InvPageHeader] Error loading risk commentary:", err);
      }
    };

    loadRiskCommentary();
    return () => { mounted = false; };
  }, [activeCase?.caseId, (activeCase as any)?.run?.id]);

  const formatHeaderDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);

    // Add 5 hours and 30 minutes offset for IST
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
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const words = name.trim().split(/\s+/);
    const filteredWords = words.filter(w => w.length > 0 && !["pvt", "ltd", "inc", "llp", "corp"].includes(w.toLowerCase()));

    // Fallback to original words if filtering removed everything
    const targetWords = filteredWords.length > 0 ? filteredWords : words;

    if (targetWords.length >= 2) {
      return (targetWords[0][0] + targetWords[1][0]).toUpperCase();
    }
    return targetWords[0][0].toUpperCase();
  };

  const formatWebsiteUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  const getRiskStyles = (color: string) => {
    switch (color) {
      case "red":
        return {
          bg: "bg-red-50/80",
          border: "border-red-200",
          text: "text-red-700",
          iconBg: "bg-red-600",
        };
      case "purple":
        return {
          bg: "bg-purple-50/80",
          border: "border-purple-200",
          text: "text-purple-700",
          iconBg: "bg-purple-600",
        };
      case "green":
        return {
          bg: "bg-emerald-50/80",
          border: "border-emerald-200",
          text: "text-emerald-700",
          iconBg: "bg-emerald-600",
        };
      case "orange":
        return {
          bg: "bg-orange-50/80",
          border: "border-orange-200",
          text: "text-orange-700",
          iconBg: "bg-orange-600",
        };
      case "amber":
        return {
          bg: "bg-amber-50/80",
          border: "border-amber-200",
          text: "text-amber-700",
          iconBg: "bg-amber-600",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-600",
          iconBg: "bg-gray-400",
        };
    }
  };

  // Derive risk status from risk_score or risk_report
  const getRiskInfo = (): { label: string; color: string; score: string } => {
    const getFormattedScore = (val: any) => {
      if (val === undefined || val === null) return "N/A";
      if (typeof val === "object") return "N/A";
      const num = Number(val);
      return isNaN(num) ? "N/A" : String(num);
    };

    if (!activeCase) return { label: "N/A", color: "gray", score: "N/A" };

    const priorityFlag = (activeCase as any).priority_flag;
    const riskReport = (activeCase as any).risk_report || (activeCase as any).risk_score;
    const hasRiskReport = riskReport && typeof riskReport === "object";

    const riskScore = hasRiskReport
      ? riskReport.risk_score
      : (typeof (activeCase as any).risk_score === 'number' ? (activeCase as any).risk_score : null);

    const formatLabelAndColor = (cat: string) => {
      const lowCat = cat.toLowerCase();
      if (lowCat.includes("critical")) return { label: "Critical Risk", color: "red" };
      if (lowCat.includes("high")) return { label: "High Risk", color: "orange" };
      if (lowCat.includes("medium")) return { label: "Medium Risk", color: "amber" };
      if (lowCat.includes("low")) return { label: "Low Risk", color: "green" };
      if (lowCat.includes("manual review")) return { label: "Manual Review", color: "purple" };

      // Legacy support
      if (lowCat === "recommended") return { label: "Low Risk", color: "green" };
      if (lowCat === "not recommended") return { label: "Critical Risk", color: "red" };

      return { label: "N/A", color: "gray" };
    };

    const effectiveScore = priorityFlag?.points !== undefined ? priorityFlag.points : riskScore;

    // 1. Try priority_flag.category (matches Watchlist)
    if (priorityFlag && priorityFlag.category) {
      const info = formatLabelAndColor(String(priorityFlag.category));
      return {
        ...info,
        score: getFormattedScore(effectiveScore)
      };
    }

    // 2. Try risk_report.risk_tier
    if (hasRiskReport && riskReport.risk_tier) {
      const info = formatLabelAndColor(String(riskReport.risk_tier));
      return {
        ...info,
        score: getFormattedScore(effectiveScore)
      };
    }

    // 3. Fall back to numeric risk_score → derive tier
    const scoreVal = Number(effectiveScore);
    if (!isNaN(scoreVal) && effectiveScore !== null) {
      if (scoreVal >= 75) return { label: "Critical Risk", color: "red", score: String(scoreVal) };
      if (scoreVal >= 51) return { label: "High Risk", color: "orange", score: String(scoreVal) };
      if (scoreVal >= 26) return { label: "Medium Risk", color: "amber", score: String(scoreVal) };
      return { label: "Low Risk", color: "green", score: String(scoreVal) };
    }

    return { label: "Evaluating...", color: "gray", score: "N/A" };
  };

  // Derive run status from run.status
  const getRunStatus = (): { label: string; isRunning: boolean; isFailed: boolean; isQueued: boolean } => {
    const runStatus = String(
      (activeCase as any)?.run?.status ||
      (activeCase as any)?.status ||
      ""
    ).toUpperCase();

    const isRunning = runStatus === "PROCESSING" || runStatus === "RUNNING";
    const isFailed = runStatus === "FAILED";
    const isQueued = runStatus === "QUEUED";

    let label = "Completed";
    if (isRunning) label = "Running";
    else if (isFailed) label = "Failed";
    else if (isQueued) label = "Queued";

    return {
      label,
      isRunning,
      isFailed,
      isQueued,
    };
  };

  const getScoreColor = (score: string): string => {
    const val = Number(score);
    if (isNaN(val)) return "gray";
    if (val >= 75) return "red";
    if (val >= 51) return "orange";
    if (val >= 26) return "amber";
    return "green";
  };

  const { isAdmin, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const riskInfo = getRiskInfo();
  const runStatus = getRunStatus();

  const riskStyles = useMemo(() => {
    if (riskInfo.label === "Manual Review") return getRiskStyles("purple");
    const scoreColor = getScoreColor(riskInfo.score);
    return getRiskStyles(scoreColor);
  }, [riskInfo.label, riskInfo.score]);

  const scoreStyles = useMemo(() => {
    const scoreColor = getScoreColor(riskInfo.score);
    return getRiskStyles(scoreColor);
  }, [riskInfo.score]);

  const merchantName = activeCase?.registeredName || (activeCase as any)?.merchant?.name || "N/A";
  const initials = getInitials(merchantName);
  const mid = (activeCase as any)?.externalMerchantId || (activeCase as any)?.run?.merchant_id || (activeCase as any)?.caseId || "N/A";
  const website = (activeCase as any)?.websiteUrl || (activeCase as any)?.merchant?.website;

  return (
    <div className="w-full">
      {activeCase && (
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Chevron Left Button */}
          {showLeftButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full h-10 w-10 transition-all active:scale-90"
              title="Previous Case"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Main Header Content */}
          <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
            {/* Left Section: Avatar, Name, Website, MID */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar Box */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shadow-sm">
                <span className="text-blue-600 font-bold text-lg">{initials}</span>
              </div>

              {/* Merchant Details Stack */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-3">
                  <h2
                    className="text-lg font-bold text-blue-600 leading-tight truncate"
                    title={merchantName}
                  >
                    {merchantName}
                  </h2>

                  {/* Risk and Score Tags next to name */}
                  {!hideRiskTags && (
                    <div className="flex items-center gap-2">
                      {/* Risk Tag with Tooltip */}
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm cursor-pointer transition-all hover:bg-white active:scale-95 ${riskStyles.bg} ${riskStyles.border} ${riskStyles.text}`}>
                              <div className={`w-4 h-4 rounded-full ${riskStyles.iconBg} flex items-center justify-center`}>
                                {riskInfo.label.includes("Critical") ? (
                                  <X className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                ) : riskInfo.label.includes("Low") ? (
                                  <Check className="w-3 h-3 text-white" strokeWidth={4} />
                                ) : riskInfo.label === "Manual Review" || riskInfo.label.includes("Risk") ? (
                                  <span className="text-white font-black text-[12px] leading-none mb-[0.5px]">!</span>
                                ) : (
                                  <span className="text-white font-black text-[12px] leading-none mb-[0.5px]">!</span>
                                )}
                              </div>
                              <span className="text-[13px] font-bold whitespace-nowrap">{riskInfo.label}</span>
                            </div>
                          </TooltipTrigger>
                          {riskStatusCommentary && (
                            <TooltipContent side="bottom" className="max-w-md p-4 bg-white border shadow-lg rounded-xl">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-600 font-bold border-b pb-2">
                                  <Info className="w-4 h-4" />
                                  <span>AI Risk Commentary</span>
                                </div>
                                {(() => {
                                  const marker = "Key contributors:";
                                  const [top, ...bottom] = riskStatusCommentary.split(marker);
                                  const cleanedTop = top.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
                                  const bottomText = bottom.join(marker).trim();

                                  return (
                                    <div className="flex flex-col gap-3">
                                      <p className="text-[13px] text-gray-700 leading-relaxed">
                                        {cleanedTop}
                                      </p>
                                      {bottomText && (
                                        <div className="pt-2 border-t border-gray-100 space-y-1">
                                          <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Key Contributors</p>
                                          <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
                                            {bottomText}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>

                      {/* Method Tag */}
                      {(() => {
                        const rawMethod = (activeCase as any)?.Method ?? (activeCase as any)?.run?.Method ?? (activeCase as any)?.run?.method;
                        const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";
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
                            bg: riskStyles.bg,
                            text: riskStyles.text,
                            iconBg: riskStyles.iconBg,
                            border: riskStyles.border,
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
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm cursor-pointer transition-all hover:bg-white active:scale-95 ${colors.bg} ${colors.border} ${colors.text}`}>
                            <div className={`w-4 h-4 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                              {colors.icon}
                            </div>
                            <span className="text-[13px] font-bold whitespace-nowrap">{methodValue}</span>
                          </div>
                        );
                      })()}

                      {/* Score Tag with Tooltip */}
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm cursor-pointer transition-all hover:bg-white active:scale-95 ${scoreStyles.bg} ${scoreStyles.border} ${scoreStyles.text}`}>
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[13px] font-bold whitespace-nowrap">Risk Score: {riskInfo.score}</span>
                            </div>
                          </TooltipTrigger>
                          {riskScoreCommentary && (
                            <TooltipContent side="bottom" className="max-w-md p-4 bg-white border shadow-lg rounded-xl">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-600 font-bold border-b pb-2">
                                  <Info className="w-4 h-4" />
                                  <span>Risk Calculation Breakdown</span>
                                </div>
                                {(() => {
                                  const marker = "Key contributors:";
                                  const [top, ...bottom] = riskScoreCommentary.split(marker);
                                  const cleanedTop = top.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
                                  const bottomText = bottom.join(marker).trim();

                                  return (
                                    <div className="flex flex-col gap-3">
                                      <p className="text-[13px] text-gray-700 leading-relaxed">
                                        {cleanedTop}
                                      </p>
                                      {bottomText && (
                                        <div className="pt-2 border-t border-gray-100 space-y-1">
                                          <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Key Contributors</p>
                                          <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
                                            {bottomText}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>

                {website ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <a
                      href={formatWebsiteUrl(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm font-medium truncate max-w-[200px]"
                    >
                      {website}
                    </a>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs italic mt-0.5">No website</span>
                )}
              </div>
            </div>

            {/* Right Section: Risk, Score, Status, Date, Report */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Run Status indicator */}
              <div className="flex items-center gap-2">
                {runStatus.isRunning ? (
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                ) : runStatus.isQueued ? (
                  <div className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.6)]" />
                ) : runStatus.isFailed ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                )}
                <span className={`text-sm font-semibold ${runStatus.isRunning ? "text-amber-600" :
                  runStatus.isQueued ? "text-gray-500" :
                    runStatus.isFailed ? "text-red-600" :
                      "text-emerald-600"
                  }`}>
                  {runStatus.label}
                </span>
              </div>

              {/* Date Tag */}
              <div className="ml-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200">
                {formatHeaderDate(activeCase.lastRunDateTime || (activeCase as any).run?.updated_at)}
              </div>

              {isAdmin && (
                <>
                  {/* Full Report Button */}
                  {onGenerateFullReport && (
                    <Button
                      onClick={onGenerateFullReport}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 ml-1"
                    >
                      <FileDown className="h-4 w-4" />
                      <span>Full Report</span>
                    </Button>
                  )}

                  {/* Page Report Button */}
                  {onGenerateReport && (
                    <Button
                      onClick={onGenerateReport}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 ml-1"
                    >
                      <FileDown className="h-4 w-4" />
                      <span>Page Report</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Chevron Right Button */}
          {showRightButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full h-10 w-10 transition-all active:scale-90"
              title="Next Case"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default InvPageHeader;
