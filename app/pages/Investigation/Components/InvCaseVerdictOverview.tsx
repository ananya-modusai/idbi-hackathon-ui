import React, { FC } from "react";
import { AlertTriangle, Info, XCircle, CheckCircle2, MinusCircle, X, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TruncatableText } from "@/app/pages/Investigation/InvWorkspace/components/TruncatableText";

interface InvCaseVerdictOverviewProps {
  score: number | string;
  maxScore: number;
  riskTier: string;
  formula: string;
  summary: string;
  status?: string;
  isEvaluating?: boolean;
  method?: string;
}

export const InvCaseVerdictOverview: FC<InvCaseVerdictOverviewProps> = ({
  score,
  maxScore,
  riskTier,
  formula,
  summary,
  status,
  isEvaluating,
  method,
}) => {
  // Helper to match page header's risk styling
  const getStyles = (score: number | string) => {
    if (isEvaluating) {
      return {
        bg: "bg-gray-50/60",
        border: "border-gray-100",
        text: "text-gray-400",
        color: "gray"
      };
    }

    const numScore = Number(score);
    // Risk Score based colors
    if (numScore >= 75) {
      return {
        bg: "bg-red-50/60",
        border: "border-red-100",
        text: "text-red-700",
        color: "red"
      };
    }
    if (numScore >= 51) {
      return {
        bg: "bg-orange-50/60",
        border: "border-orange-100",
        text: "text-orange-700",
        color: "orange"
      };
    }
    if (numScore >= 26) {
      return {
        bg: "bg-amber-50/60",
        border: "border-amber-100",
        text: "text-amber-700",
        color: "amber"
      };
    }

    // Default Fallback: Emerald / Green (0-25)
    return {
      bg: "bg-emerald-50/60",
      border: "border-emerald-100",
      text: "text-emerald-700",
      color: "green"
    };
  };

  const getDecisionColorClasses = (statusVal?: string) => {
    const s = statusVal?.toLowerCase() || "";
    if (s.includes("critical") || s.includes("not recommended")) {
      return {
        bg: "bg-red-50/80",
        border: "border-red-200",
        text: "text-red-600",
        iconBg: "bg-red-600"
      };
    }
    if (s.includes("high")) {
      return {
        bg: "bg-orange-50/80",
        border: "border-orange-200",
        text: "text-orange-600",
        iconBg: "bg-orange-600"
      };
    }
    if (s.includes("medium")) {
      return {
        bg: "bg-amber-50/80",
        border: "border-amber-200",
        text: "text-amber-600",
        iconBg: "bg-amber-600"
      };
    }
    if (s.includes("low") || s.includes("recommended")) {
      return {
        bg: "bg-emerald-50/80",
        border: "border-emerald-200",
        text: "text-emerald-600",
        iconBg: "bg-emerald-600"
      };
    }
    if (s.includes("manual review")) {
      return {
        bg: "bg-purple-50/80",
        border: "border-purple-200",
        text: "text-purple-700",
        iconBg: "bg-purple-600"
      };
    }
    return {
      bg: "bg-gray-50/80",
      border: "border-gray-200",
      text: "text-gray-500",
      iconBg: "bg-gray-400"
    };
  };

  const styles = getStyles(score);
  const percentage = isEvaluating ? 0 : Math.min(Math.max((Number(score) / maxScore) * 100, 0), 100);

  const getTierInfo = (label: string) => {
    if (isEvaluating) return { label: "Evaluating...", color: "text-gray-500 bg-gray-50 border-gray-100" };

    const low = label.toLowerCase();
    if (low.includes("critical")) return { label: "CRITICAL RISK", color: "text-red-600 bg-red-50 border-red-100" };
    if (low.includes("severe")) return { label: "CRITICAL RISK", color: "text-red-600 bg-red-50 border-red-100" };
    if (low.includes("high")) return { label: "HIGH RISK", color: "text-orange-600 bg-orange-50 border-orange-100" };
    if (low.includes("medium")) return { label: "MEDIUM RISK", color: "text-amber-600 bg-amber-50 border-amber-100" };
    if (low.includes("low")) return { label: "LOW RISK", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };

    // Legacy support
    if (low === "recommended") return { label: "LOW RISK", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (low === "not recommended") return { label: "CRITICAL RISK", color: "text-red-600 bg-red-50 border-red-100" };

    return { label: "LOW RISK", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
  };

  const tierInfo = getTierInfo(riskTier);

  const renderFormula = (text?: string) => {
    if (isEvaluating) return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-gray-400 font-bold italic tracking-wide animate-pulse">Evaluating...</span>
      </div>
    );
    if (!text) return null;

    const hasEquals = text.includes("=");
    const [calcPart, resultPartCombined] = hasEquals ? text.split("=") : [text, ""];
    const flags = calcPart.split("+").map(s => s.trim());

    const totalFlags = flags.length;
    const itemsToShow = flags.slice(0, 2);
    const hiddenCount = totalFlags - 2;

    return (
      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          {itemsToShow.map((part, i) => {
            const flagMatch = part.match(/([A-Z]{2}\d{3})\s*·\s*(-?\d+)/);
            if (flagMatch) {
              return (
                <React.Fragment key={i}>
                  <span className="px-2 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-md font-bold flex items-center gap-1.5 shadow-sm">
                    <span>{flagMatch[1]}</span>
                    <span className="text-orange-300">·</span>
                    <span>{flagMatch[2]}</span>
                  </span>
                  {(i < itemsToShow.length - 1 || hiddenCount > 0) && <span className="text-gray-400 font-bold">+</span>}
                </React.Fragment>
              );
            }
            return <span key={i} className="text-gray-600 font-bold">{part}</span>;
          })}

          {hiddenCount > 0 && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="text-blue-600 font-bold cursor-pointer underline underline-offset-4 decoration-blue-300 hover:decoration-blue-500 transition-all">
                  {hiddenCount} more
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-4 bg-white border shadow-xl rounded-xl max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  {flags.slice(2).map((part, i) => {
                    const flagMatch = part.match(/([A-Z]{2}\d{3})\s*·\s*(-?\d+)/);
                    return (
                      <React.Fragment key={i}>
                        {flagMatch ? (
                          <span className="px-1.5 py-0.5 bg-orange-50 border border-orange-100 text-orange-700 rounded font-bold flex items-center gap-1">
                            <span>{flagMatch[1]}</span>
                            <span className="text-orange-200">·</span>
                            <span>{flagMatch[2]}</span>
                          </span>
                        ) : (
                          <span className="text-gray-600 font-bold">{part}</span>
                        )}
                        {(i < flags.slice(2).length - 1) && <span className="text-gray-400 font-bold">+</span>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {hasEquals && (
            <div className="flex items-center gap-2 ml-1">
              <span className="text-gray-400 font-bold">=</span>
              {(() => {
                const [sumPart, transformPart] = resultPartCombined.includes("->")
                  ? resultPartCombined.split("->")
                  : [resultPartCombined, null];

                const sumRaw = sumPart.trim();
                const transformRaw = transformPart?.replace(/(capped|floored)\s+at/gi, "").trim() || "";

                const formulaResultValue = transformPart ? parseFloat(transformRaw) : parseFloat(sumRaw);
                const hasMismatch = !isNaN(formulaResultValue) && formulaResultValue !== Number(score);

                return (
                  <>
                    {/* If there was a transformation (cap/floor), show the original sum with line-through */}
                    {transformPart && (
                      <span className="text-gray-400 font-bold line-through opacity-60">
                        {sumRaw}
                      </span>
                    )}

                    {/* Show the result of the transformation (or sum if no transformation) */}
                    {transformPart && <span className="text-gray-400 font-bold">→</span>}

                    <span className={cn(
                      "px-2 py-1 border rounded-md font-bold shadow-sm",
                      hasMismatch ? "text-gray-400 line-through opacity-60 border-gray-100 border-dashed" :
                        (transformPart && transformPart.toLowerCase().includes("capped") ? "bg-red-50 border-red-200 text-red-600 border-dashed" :
                          transformPart && transformPart.toLowerCase().includes("floored") ? "bg-emerald-50 border-emerald-200 text-emerald-600 border-dashed" :
                            "bg-white border-gray-200 text-gray-700")
                    )}>
                      {transformPart ? transformRaw : sumRaw}
                    </span>

                    {/* Total mismatch correction: show arrow and actual risk score if different */}
                    {hasMismatch && (
                      <>
                        <span className="text-gray-400 font-bold">→</span>
                        <span className={cn(
                          "px-2 py-1 border rounded-md font-bold shadow-sm border-dashed",
                          Number(score) >= 75 ? "bg-red-50 border-red-200 text-red-600" :
                            Number(score) >= 51 ? "bg-orange-50 border-orange-200 text-orange-600" :
                              Number(score) >= 26 ? "bg-amber-50 border-amber-200 text-amber-600" :
                                "bg-emerald-50 border-emerald-200 text-emerald-600"
                        )}>
                          {score}
                        </span>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.2fr,1.8fr] gap-4">
      {/* Risk Gauge Box */}
      <div className={cn("p-5 rounded-2xl border flex flex-col gap-3 transition-colors duration-300", styles.bg, styles.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <AlertTriangle className={cn("w-4 h-4", styles.text)} />
            <span className={cn("text-[16px] font-black uppercase mr-1", styles.text)}>Case Verdict</span>
            {method?.replace(/[-_]/g, " ").trim().toLowerCase() === "auto reject" && (() => {
              const dColors = getDecisionColorClasses(status);
              return (
                <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ml-1", dColors.bg, dColors.border, dColors.text)}>
                  <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white", dColors.iconBg)}>
                    <X className="w-2.5 h-2.5" strokeWidth={4} />
                  </div>
                  <span className="text-[12px] font-bold whitespace-nowrap">Auto Reject</span>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-gray-500 tracking-widest opacity-80 uppercase">Final Decision</span>
            {(() => {
              const dColors = getDecisionColorClasses(status);
              const label = status?.toLowerCase().includes("critical") ? "Critical Risk" :
                status?.toLowerCase().includes("high") ? "High Risk" :
                  status?.toLowerCase().includes("medium") ? "Medium Risk" :
                    status?.toLowerCase().includes("low") ? "Low Risk" :
                      status?.toLowerCase().includes("manual review") ? "Manual Review" :
                        status?.toLowerCase().includes("not recommended") ? "Critical Risk" :
                          status?.toLowerCase().includes("recommended") ? "Low Risk" :
                            "N/A";
              return (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-bold shadow-sm transition-all duration-300",
                  dColors.bg, dColors.border, dColors.text
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-white",
                    dColors.iconBg
                  )}>
                    {status?.toLowerCase().includes("critical") || status?.toLowerCase().includes("not recommended") ? (
                      <X className="w-2.5 h-2.5" strokeWidth={4} />
                    ) : status?.toLowerCase().includes("low") || status?.toLowerCase().includes("recommended") ? (
                      <Check className="w-3 h-3" strokeWidth={4} />
                    ) : (
                      <span className="font-black text-[12px] leading-none mb-[0.5px]">!</span>
                    )}
                  </div>
                  <span className="text-[13px] font-bold whitespace-nowrap">
                    {label}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest opacity-80 pt-1.5">Risk Score</span>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-4xl font-black", styles.text)}>{isEvaluating ? "N/A" : score}</span>
              <span className="text-xl font-bold text-gray-300">/ {maxScore}</span>
            </div>
          </div>
        </div>

        <div className="relative pt-6 pb-2">
          {/* Progress Bar Segments */}
          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            <div className="h-full w-[25%] bg-emerald-500/90" />
            <div className="h-full w-[25%] bg-amber-500/90" />
            <div className="h-full w-[25%] bg-orange-500/90" />
            <div className="h-full w-[25%] bg-red-500/90" />
          </div>

          {/* Scale Labels at Dividing Points */}
          <div className="relative h-4 mt-2">
            {[0, 25, 50, 75, 100].map((val) => (
              <span
                key={val}
                className="absolute top-0 -translate-x-1/2 text-[12px] font-black text-gray-400"
                style={{ left: `${val}%` }}
              >
                {val}
              </span>
            ))}
          </div>

          {/* Legends with Box Symbols */}
          <div className="flex justify-between mt-4 px-1 gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 flex-shrink-0" />
                <span className="text-gray-900 whitespace-nowrap">0-25</span>
                <span className="truncate">Low</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-amber-500 flex-shrink-0" />
                <span className="text-gray-900 whitespace-nowrap">26-50</span>
                <span className="truncate">Medium</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 items-center flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-orange-500 flex-shrink-0" />
                <span className="text-gray-900 whitespace-nowrap">51-74</span>
                <span className="truncate">High</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 items-end flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 flex-shrink-0" />
                <span className="text-gray-900 whitespace-nowrap">75-100</span>
                <span className="truncate">Critical</span>
              </span>
            </div>
          </div>

          {/* Triangle Indicator */}
          <div
            className="absolute top-[14px] z-20 transition-all duration-500 ease-out drop-shadow-md"
            style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-gray-900" />
          </div>
        </div>
      </div>

      {/* Formula & Reasoning Box */}
      <div className="bg-white rounded-2xl border p-5 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-[14px] font-black uppercase text-gray-500">How this score was calculated</span>
        </div>

        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          {renderFormula(formula)}
        </div>

        <div className="mt-2">
          {(() => {
            if (!summary) return null;
            const marker = "Key contributors:";
            const [top, ...bottom] = summary.split(marker);

            const cleanedTop = top.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
            const bottomText = bottom.join(marker).trim();

            return (
              <div className="flex flex-col gap-4">
                <TruncatableText
                  text={cleanedTop}
                  textColorClass="text-gray-600"
                  additionalClassName="text-md leading-relaxed"
                  lineLimit={3}
                />
                {bottomText && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <p className="text-[12px] font-black uppercase text-gray-400 tracking-widest">Key Contributors</p>
                    <TruncatableText
                      text={bottomText}
                      textColorClass="text-gray-600"
                      additionalClassName="text-[14px] leading-relaxed"
                      lineLimit={3}
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

