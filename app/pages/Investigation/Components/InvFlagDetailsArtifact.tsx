"use client";

import React from "react";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { ArtifactSectionCollapsible } from "@/components/custom/ArtifactSectionCollapsible";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { CustomTableView } from "@/components/custom/CustomTableView";
import {
  getFlagInfo,
  CaseFlagData,
} from "../Sample Data/InvDecisioningSampleData";
import { CheckCircle2, XCircle } from "lucide-react";
import { ColorScheme } from "@/components/custom/CustomColorScheme";
import { cn } from "@/lib/utils";


interface InvFlagDetailsArtifactProps {
  lastUpdatedAt: Date;
  flagData: CaseFlagData;
  // optional output-format payload from the AI/service used for extra details
  outputFormat?: Record<string, any> | null;
  // optional controls to hide sections or exclude specific subrules when used in scoped contexts
  hideOverallStatus?: boolean;
  excludeSubruleNames?: string[];
  includeOnlySubruleNames?: string[];
  customTitle?: string;
  useRedGreenStatus?: boolean;
  hideHeaderTags?: boolean;
}

export const InvFlagDetailsArtifact: React.FC<InvFlagDetailsArtifactProps> = ({
  lastUpdatedAt,
  flagData,
  outputFormat,
  hideOverallStatus = false,
  excludeSubruleNames = [],
  includeOnlySubruleNames = [],
  customTitle,
  useRedGreenStatus = false,
  hideHeaderTags = false,
}) => {
  const flagInfo = getFlagInfo(flagData.code);
  const isPlaceholder = Boolean((flagData as any).__placeholder);

  // Treat only these as explicit N/A overrides for header severity/icon.
  // RF008 and RF012 should now use their configured severity values instead.
  // We no longer force N/A overrides for any codes when real API data exists.
  // Placeholder flags (no API data) are handled via `isPlaceholder` instead.
  const naOverrideFlags = new Set<string>();
  const isNaOverride = naOverrideFlags.has(flagData.code as string);

  // For RF009 and RF016, always show "Low Risk" with blue color when API data exists.
  // For RF017, RF018, and RF019, always show "High Risk" with red color when API data exists.
  // Helper for consistent severity normalization
  const getNormalizedSeverity = (text: string, code?: string) => {
    if (!text) return "Unknown";
    const tier = text.toLowerCase();
    
    // Special cases for specific codes
    if (code === "RF009" || code === "RF016") {
      if (!tier.includes("risk")) return "Low Risk";
    } else if (
      code === "RF017" ||
      code === "RF018" ||
      code === "RF019"
    ) {
      if (!tier.includes("risk")) return "High Risk";
    }

    const base = tier.replace(/\s*risk\s*/g, "").trim();
    const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
    
    if (tier.includes("critical") || tier.includes("severe")) return "Critical Risk";
    if (tier.includes("high")) return "High Risk";
    if (tier.includes("medium") || tier === "med") return "Medium Risk";
    if (tier.includes("low") || tier === "info") return "Low Risk";
    if (tier.includes("good")) return capitalized;
    
    return `${capitalized} Risk`;
  };

  const getSeverityTheme = (severity: string): ColorScheme => {
    const s = severity.toLowerCase();
    if (s.includes("critical") || s.includes("severe")) return "red";
    if (s.includes("high")) return "orange";
    if (s.includes("medium") || s === "med") return "yellow";
    if (s.includes("good")) return "green";
    if (s.includes("low") || s === "info") return "blue";
    return "gray";
  };

  // For RF009 and RF016, always show "Low Risk" with blue color when API data exists.
  // For RF017, RF018, and RF019, always show "High Risk" with red color when API data exists.
  let severityText =
    (flagData as any)?.severity || (flagData as any)?.category || flagInfo?.severity || "Unknown";
  
  if (!isPlaceholder) {
    severityText = getNormalizedSeverity(severityText, flagData.code as string);
  }

  const severityColor = isPlaceholder
    ? "gray"
    : isNaOverride
    ? "gray"
    : getSeverityTheme(severityText);

  // Prefer subrules provided in extra_details if present, otherwise use top-level subrules.
  const rawSubrules =
    (flagData as any)?.extra_details?.subrules ||
    (flagData as any)?.raw?.subrules ||
    flagData.subrules ||
    [];


  const effectiveSubrules: any[] = Array.isArray(rawSubrules)
    ? rawSubrules
    : typeof rawSubrules === "object" && rawSubrules !== null
    ? Object.entries(rawSubrules).map(([key, val]: [string, any]) => ({
        ...val,
        subrule: val.subrule || key,
      }))
    : [];

  // If there are no subrules and no extra_details, treat this flag as "Not Found"
  // (i.e., no rule data available from the API for this code).
  const hasAnyRuleData =
    (effectiveSubrules && effectiveSubrules.length > 0) ||
    Boolean((flagData as any)?.extra_details) ||
    Boolean(flagData.overallReasoning) ||
    Boolean((flagData as any).overall_reasoning);
  const isNotFound = !hasAnyRuleData && flagData.code !== "MR001";
  const isFlagTriggered = (() => {
    const v: any = flagData.overallTriggered ?? (flagData as any).overall_triggered ?? (flagData as any).triggered;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.toLowerCase().trim();
      return s === "yes" || s === "true" || s === "1";
    }
    if (typeof v === "number") return v === 1;
    return false;
  })();

  // Determine triggered status color
  const triggeredColor =
    isNotFound || isPlaceholder
      ? "gray"
      : isFlagTriggered
      ? (useRedGreenStatus ? "red" : "blue")
      : (useRedGreenStatus ? "blue" : "gray");

  const isSubruleTriggered = (sr: any) => {
    if (!sr) return false;
    const v = sr.triggered;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.toLowerCase().trim();
      return s === "yes" || s === "true" || s === "1";
    }
    return false;
  };

  // Optionally exclude specific subrules (used by Scam Intelligence view only)
  const normalizedExcludeSet = new Set(
    excludeSubruleNames.map((n) => String(n || "").toLowerCase())
  );
  const normalizedIncludeSet = new Set(
    includeOnlySubruleNames.map((n) => String(n || "").toLowerCase())
  );

  const shouldExcludeSubrule = (subrule: any) => {
    if (!subrule) return false;
    const subruleName = String(subrule?.subrule || "").toLowerCase();

    // If include set is not empty, only allow subrules in that set
    if (normalizedIncludeSet.size > 0) {
      let isIncluded = false;
      for (const n of normalizedIncludeSet) {
        if (!n) continue;
        // Check for exact match, includes, or space/underscore variations
        const normalizedN = n.replace(/_/g, " ");
        const underscoreN = n.replace(/ /g, "_");
        
        if (
          subruleName === n || 
          subruleName.includes(n) ||
          subruleName === normalizedN ||
          subruleName.includes(normalizedN) ||
          subruleName === underscoreN ||
          subruleName.includes(underscoreN)
        ) {
          isIncluded = true;
          break;
        }
      }
      if (!isIncluded) return true; // Exclude it because it's not in the include list
    }

    // Then check the exclude set
    if (normalizedExcludeSet.size === 0) return false;
    for (const n of normalizedExcludeSet) {
      if (!n) continue;
      const normalizedN = n.replace(/_/g, " ");
      const underscoreN = n.replace(/ /g, "_");
      
      if (
        subruleName === n || 
        subruleName.includes(n) ||
        subruleName === normalizedN ||
        subruleName === underscoreN
      ) return true;
    }
    return false;
  };

  const triggeredSubrules = effectiveSubrules.filter(
    (subrule) => isSubruleTriggered(subrule) && !shouldExcludeSubrule(subrule)
  );
  const notTriggeredSubrules = effectiveSubrules.filter(
    (subrule) => !isSubruleTriggered(subrule) && !shouldExcludeSubrule(subrule)
  );

  return (
    <div className="pb-6">
      <ArtifactHeader
        title={customTitle || (flagData as any).name || (flagData as any).step_description || flagInfo?.name || flagData.code}
        contentIDText="Flag Code"
        contentID={flagData.code}
        lastUpdatedAt={lastUpdatedAt}
      />

      <div className="pt-4 space-y-4">
        {/* Overall Status Section */}
        {!hideOverallStatus && (
          <ArtifactSectionCollapsible 
            title="Overall Status" 
            defaultOpen 
            rightElement={
              <div className="flex items-center gap-2 pr-2">
                <BubbleTag
                  text={
                    isNotFound
                      ? "Not Found"
                      : isFlagTriggered
                      ? "Triggered"
                      : "Not Triggered"
                  }
                  color={triggeredColor}
                  fixedWidth="w-28"
                  withBorder={true}
                />
                {flagData.code !== "MR001" && (
                  <BubbleTag
                    text={
                      isNaOverride ? "N/A" : severityText ? severityText : "Unknown"
                    }
                    color={isNaOverride ? "gray" : severityColor}
                    fixedWidth="w-28"
                    withBorder={true}
                  />
                )}
                {flagData.code !== "MR001" && (flagData as any).points !== undefined && (
                  <BubbleTag
                    text={`Score: ${(flagData as any).points}`}
                    color={severityColor}
                    fixedWidth="w-24"
                    withBorder={true}
                  />
                )}
              </div>
            }
          >
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Overall Reasoning:
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                  {flagData.overallReasoning || (flagData as any).overall_reasoning || (flagData as any).reasoning || (isPlaceholder ? "Flag data not available for this case." : "No reasoning data available.") }
                </p>
              </div>
            </div>
          </ArtifactSectionCollapsible>
        )}

        {/* Triggered Conditions Section */}
        {triggeredSubrules.length > 0 &&
          flagData.code !== "GF004" && (
            <ArtifactSectionCollapsible
              title={`Triggered Conditions (${triggeredSubrules.length})`}
              defaultOpen
            >
              <div className="space-y-3">
                {triggeredSubrules.map((subrule, index) => {
                  const key = `${flagData.code}-trig-${index}-${
                    subrule?.subrule || "sr"
                  }`;
                  // For RF009, rename TGBT to TGTBT (handle any case variation)
                  const displaySubrule =
                    flagData.code === "RF009" &&
                    subrule.subrule?.toLowerCase() === "tgbt"
                      ? "TGTBT"
                      : subrule.subrule;
                  // Determine subrule-specific category and score
                  const srRawCat = subrule.category || subrule.severity || (flagData as any).category || (flagData as any).severity || severityText;
                  const srSeverityText = isPlaceholder ? "Unknown" : getNormalizedSeverity(srRawCat, flagData.code as string);
                  const srSeverityColor = getSeverityTheme(srSeverityText);
                  const srPoints = subrule.points !== undefined ? subrule.points : (flagData as any).points;

                  return (
                    <div
                      key={key}
                      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className={`text-xs px-2 py-1 rounded font-mono ${useRedGreenStatus ? "bg-red-50 text-red-700 border border-red-100" : "bg-gray-100 text-gray-800"}`}>
                            {displaySubrule.toUpperCase().replace(/_/g, " ")}
                          </code>
                        </div>
                        <div className="flex items-center gap-3">
                          <BubbleTag
                            text="Triggered"
                            color={useRedGreenStatus ? "red" : "blue"}
                            fixedWidth="w-24"
                            withBorder={true}
                          />
                          {flagData.code !== "MR001" && (
                            <BubbleTag
                              text={srSeverityText}
                              color={srSeverityColor}
                              fixedWidth="w-28"
                              withBorder={true}
                            />
                          )}
                          {flagData.code !== "MR001" && srPoints !== undefined && (
                            <BubbleTag
                              text={`Score: ${srPoints}`}
                              color={srSeverityColor}
                              fixedWidth="w-24"
                              withBorder={true}
                            />
                          )}
                          <CheckCircle2 className={`h-4 w-4 ${useRedGreenStatus ? "text-red-600" : "text-blue-600"}`} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Reasoning:
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                          {subrule.reasoning}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ArtifactSectionCollapsible>
          )}

        {flagData.code === "GF004" && (
          <ArtifactSectionCollapsible
            title="Additional Details"
            defaultOpen={true}
          >
            <div>
              {(() => {
                const details =
                  (flagData as any)?.extra_details ||
                  (flagData as any)?.extraDetails ||
                  {};
                const formatValue = (val: any) => {
                  if (val === null || val === undefined) return "N/A";
                  if (typeof val === "number") return val;
                  return String(val);
                };
                const rows = [
                  {
                    particular: "Unique customers",
                    value: formatValue(details.unique_customers),
                  },
                  {
                    particular: "Successful transactions",
                    value: formatValue(details.count_successful_txn),
                  },
                  {
                    particular: "Customer concentration",
                    value: formatValue(details.customer_concentration),
                  },
                ];
                const columns = [
                  {
                    key: "particular",
                    header: "Particular",
                    render: (val: any) => <span>{val}</span>,
                  },
                  {
                    key: "value",
                    header: "Value",
                    render: (val: any) => <span>{val}</span>,
                  },
                ];
                return (
                  <CustomTableView
                    title={undefined}
                    columns={columns}
                    data={rows}
                    initialRowLimit={rows.length}
                    showCSVExport={false}
                    enableAlternatingRows={true}
                    className="mt-2"
                  />
                );
              })()}
            </div>
          </ArtifactSectionCollapsible>
        )}

        {/* Not Triggered Conditions Section */}
        {notTriggeredSubrules.length > 0 &&
          flagData.code !== "GF004" && (
            <ArtifactSectionCollapsible
              title={`Not Triggered Conditions (${notTriggeredSubrules.length})`}
              defaultOpen={true}
            >
              <div className="space-y-3">
                {notTriggeredSubrules.map((subrule, index) => {
                  const key = `${flagData.code}-notrig-${index}-${
                    subrule?.subrule || "sr"
                  }`;
                  // For RF009, rename TGBT to TGTBT (handle any case variation)
                  const displaySubrule =
                    flagData.code === "RF009" &&
                    subrule.subrule?.toLowerCase() === "tgbt"
                      ? "TGTBT"
                      : subrule.subrule;
                  // Determine subrule-specific category and score
                  const srRawCat = subrule.category || subrule.severity || (flagData as any).category || (flagData as any).severity || severityText;
                  const srSeverityText = isPlaceholder ? "Unknown" : getNormalizedSeverity(srRawCat, flagData.code as string);
                  const srPoints = subrule.points !== undefined ? subrule.points : (flagData as any).points;

                  return (
                    <div
                      key={key}
                      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className={`text-xs px-2 py-1 rounded font-mono ${useRedGreenStatus ? "bg-blue-100 text-blue-600 border border-blue-200" : "bg-gray-100 text-gray-800"}`}>
                            {displaySubrule.toUpperCase().replace(/_/g, " ")}
                          </code>
                        </div>
                        <div className="flex items-center gap-3">
                          <BubbleTag
                            text="Not Triggered"
                            color={useRedGreenStatus ? "blue" : "gray"}
                            fixedWidth="w-28"
                            withBorder={true}
                          />
                          {flagData.code !== "MR001" && (
                            <BubbleTag
                              text={srSeverityText}
                              color="gray"
                              fixedWidth="w-28"
                              withBorder={true}
                            />
                          )}
                          {flagData.code !== "MR001" && srPoints !== undefined && (
                            <BubbleTag
                              text={`Score: ${srPoints}`}
                              color="gray"
                              fixedWidth="w-24"
                              withBorder={true}
                            />
                          )}
                          <XCircle className={`h-4 w-4 ${useRedGreenStatus ? "text-blue-600" : "text-gray-400"}`} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Reasoning:
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                          {subrule.reasoning}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ArtifactSectionCollapsible>
          )}

        {/* Additional Details Section: show scam_signals for RF011 (if present in extra_details) */}
        {flagData.code === "RF011" &&
          (flagData as any).extra_details?.scam_signals && (
            <ArtifactSectionCollapsible
              title="Additional Details"
              defaultOpen={true}
            >
              <div>
                {(() => {
                  const scamSignals =
                    (flagData as any).extra_details.scam_signals || {};
                  const rows = Object.keys(scamSignals)
                    .filter(
                      (k) =>
                        k !== "scam_website_lob" && k !== "scam_merchantname"
                    )
                    .map((k) => {
                      const val = scamSignals[k];
                      const status =
                        val === null || val === undefined
                          ? "N/A"
                          : typeof val === "boolean"
                          ? String(val)
                          : String(val).toLowerCase() === "true" ||
                            String(val).toLowerCase() === "yes"
                          ? "true"
                          : String(val).toLowerCase() === "false" ||
                            String(val).toLowerCase() === "no"
                          ? "false"
                          : String(val);

                      return {
                        signal: k,
                        status,
                      };
                    });

                  const columns = [
                    {
                      key: "signal",
                      header: "Scam Signal",
                      render: (val: any) => <span>{val}</span>,
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (val: any) => <span>{val}</span>,
                    },
                  ];

                  return (
                    <CustomTableView
                      title={undefined}
                      columns={columns}
                      data={rows}
                      initialRowLimit={rows.length}
                      showCSVExport={false}
                      enableAlternatingRows={true}
                      className="mt-2"
                    />
                  );
                })()}
              </div>
            </ArtifactSectionCollapsible>
          )}
        {/* Additional Details Section: render txn_unaligned subflags for RF003 */}
        {flagData.code === "RF003" &&
          (flagData as any)?.extra_details?.txn_unaligned_output?.flags && (
            <ArtifactSectionCollapsible
              title="Additional Details"
              defaultOpen={true}
            >
              <div>
                {/* <div className="mt-2 mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Txn Unaligned Sub-flags
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    More granular outputs for the txn_unaligned subrule.
                  </p>
                </div> */}

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                  {((flagData as any).extra_details.txn_unaligned_output
                    .flags[0] ||
                    {}) &&
                    Object.keys(
                      (flagData as any).extra_details.txn_unaligned_output
                        .flags[0]
                    ).map((k: string) => {
                      const f = (flagData as any).extra_details
                        .txn_unaligned_output.flags[0][k];
                      const triggered =
                        typeof f.triggered === "boolean"
                          ? f.triggered
                          : String(f.triggered).toLowerCase() === "yes" ||
                            String(f.triggered).toLowerCase() === "true";

                      return (
                        <div
                          key={k}
                          className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <code className={`text-xs px-2 py-1 rounded font-mono ${useRedGreenStatus ? (triggered ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100") : "bg-gray-100 text-gray-800"}`}>
                                {k.toUpperCase().replace(/_/g, " ")}
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              {triggered ? (
                                <CheckCircle2 className={`h-4 w-4 ${useRedGreenStatus ? "text-red-600" : "text-blue-600"}`} />
                              ) : (
                                <XCircle className={`h-4 w-4 ${useRedGreenStatus ? "text-green-600" : "text-gray-400"}`} />
                              )}
                              <BubbleTag
                                text={triggered ? "Triggered" : "Not Triggered"}
                                color={triggered ? "blue" : "gray"}
                                withBorder={true}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                Reasoning:
                              </span>
                                {(() => {
                                  const fRawCat = f.category || f.severity || (flagData as any).category || (flagData as any).severity || severityText;
                                  const fSeverityText = getNormalizedSeverity(fRawCat, flagData.code as string);
                                  const fSeverityColor = getSeverityTheme(fSeverityText);
                                  const fPoints = f.points !== undefined ? f.points : (flagData as any).points;

                                  return (
                                    <>
                                      <BubbleTag
                                        text={fSeverityText}
                                        color={triggered ? fSeverityColor : "gray"}
                                        withBorder={true}
                                      />
                                      {fPoints !== undefined && (
                                        <BubbleTag
                                          text={`Score: ${fPoints}`}
                                          color={triggered ? fSeverityColor : "gray"}
                                          withBorder={true}
                                        />
                                      )}
                                    </>
                                  );
                                })()}
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                              {f.reasoning}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </ArtifactSectionCollapsible>
          )}

      </div>
    </div>
  );
};
