"use client";

import React, { FC, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  X,
  Check,
  AlertCircle,
  MinusCircle,
  AlertTriangle,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { generateInvestigationReportPDF, preparePDFElement } from "../Investigation-Report/utils/pdfUtils";
import InvestigationDecisioningPDFTemplate from "../Investigation-Report/DecisioningTab/InvestigationDecisioningPDFTemplate";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import InvPageHeader from "../Components/InvPageHeader";
import { cn } from "@/lib/utils";
import { InvFlagDetailsArtifact } from "../Components/InvFlagDetailsArtifact";
import { InvCaseVerdictOverview } from "../Components/InvCaseVerdictOverview";
import { ColorScheme } from "@/components/custom/CustomColorScheme";
import {
  FlagCode,
  FlagCodeMapping,
  getFlagInfo,
} from "../Sample Data/InvDecisioningSampleData";
import {
  fetchDecisioning,
  fetchSteps,
  fetchDatastoreEntry,
  DatastoreEntryApiResponse,
} from "@/app/services/caseServices";
import CustomList from "@/components/custom/CustomList/customList";
import { CustomListItemProps } from "@/components/custom/CustomList/customListItem";
import { PrimaryFilterGroup } from "@/components/custom/CustomList/customListFilter";
import { getIconByName } from "@/components/custom/CustomIconScheme";
import {
  getTextColorClass,
  getColorClasses,
} from "@/components/custom/CustomColorScheme";
import { BubbleTag } from "@/components/custom/BubbleTag";
import {
  SortActionButton,
  SortDirection,
} from "@/components/custom/CustomList/SortActionButton";
import { DownloadActionButton } from "@/components/custom/CustomList/DownloadActionButton";
import { RiskAssessmentParagraph } from "@/components/custom/RiskAssessmentParagraph";
import SectionHeaderWithFlags from "@/components/custom/SectionHeaderWithFlags";

interface InvDecisioningTabProps {
  merchantId?: string;
  caseId?: string;
}

const InvDecisioningTab: FC<InvDecisioningTabProps> = ({
  merchantId,
  caseId,
}) => {
  const { selectedCase } = useInvestigationCaseStore();
  const { isCollapsed, activeTabId, tabs } = useArtifactStore();
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  // Default to grouping by severity so items of the same severity are shown together
  const [sortField, setSortField] = useState<string>("triggered");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  // Track triggered filter selection for single-select behavior
  const [triggeredFilterValue, setTriggeredFilterValue] =
    useState<string>("Triggered");

  const hasActiveCase = useMemo(
    () => Boolean(caseId || selectedCase?.caseId),
    [caseId, selectedCase?.caseId]
  );

  // Convert flags to CustomListItemProps format
  const currentCaseId = useMemo(
    () => caseId || selectedCase?.caseId || "",
    [caseId, selectedCase?.caseId]
  );

  // State to hold API-provided flags for the current case.
  const [apiFlags, setApiFlags] = useState<any[] | undefined>(undefined);

  // RISK_SCORE datastore entry fetch for AI Risk Commentary
  const [riskScoreDatastore, setRiskScoreDatastore] = useState<DatastoreEntryApiResponse | null>(null);

  // Consolidated fetch for Decisioning (Flags) and AI Risk (Datastore)
  useEffect(() => {
    let mounted = true;
    if (!currentCaseId) {
      setApiFlags(undefined);
      setRiskScoreDatastore(null);
      return;
    }

    const loadDecisioningData = async () => {
      try {
        // Step 1: Resolve steps and decisioning in parallel
        const [steps, decisioningResp] = await Promise.all([
          fetchSteps(100),
          fetchDecisioning(currentCaseId)
        ]);

        if (!mounted) return;

        // Step 2: Handle Decisioning Flags
        const normalizedFlags = (decisioningResp?.data?.flags || []).map((f: any) => {
          const source = f.llm || f.raw?.llm || f;
          const stepCode = f.step || source.step || f.code;
          const normalizedCode = (stepCode && (stepCode.startsWith("RF") || stepCode.startsWith("GF") || stepCode.startsWith("MR"))) ? stepCode : f.code;

          return {
            ...f,
            code: normalizedCode,
            source: source,
            step_description: f.step_description || source.step_description || source.name || f.name || "",
            name: f.step_description || source.step_description || source.name || f.name || "",
            overallTriggered: (() => {
              const v = source.overall_triggered ?? source.overallTriggered ?? f.overall_triggered ?? f.overallTriggered;
              if (typeof v === "boolean") return v;
              if (typeof v === "string") return v.toLowerCase() === "yes" || v.toLowerCase() === "true" || v.toLowerCase() === "triggered";
              if (typeof v === "number") return v === 1;
              return false;
            })(),
            overallReasoning: source.explanation || source.overall_reasoning || source.overallReasoning || source.reasoning || f.overall_reasoning || f.reasoning || "",
            severity: (() => {
              const cat = (f.category || source.category || f.severity || source.severity || "").toLowerCase();
              const base = cat.replace(/\s*risk\s*/g, "").trim();
              const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
              if (base.includes("critical") || base.includes("severe")) return "Critical Risk";
              if (base.includes("high")) return "High Risk";
              if (base.includes("medium") || base === "med") return "Medium Risk";
              if (base.includes("low") || base === "info") return "Low Risk";
              if (base.includes("good")) return "Good Override";
              return `${capitalized} Risk`;
            })(),
            subrules: (() => {
              // Extract raw object if it's a string
              const rawObj = typeof f.raw === "string" ? (() => { try { return JSON.parse(f.raw); } catch (e) { return null; } })() : f.raw;

              // Find the source of subrules, prioritizing extra_details as the artifact does
              const sr =
                f.extra_details?.subrules ||
                source.extra_details?.subrules ||
                rawObj?.extra_details?.subrules ||
                rawObj?.llm?.extra_details?.subrules ||
                source.subrules ||
                f.subrules ||
                rawObj?.subrules ||
                rawObj?.llm?.subrules ||
                source.raw?.subrules ||
                [];

              // Support for results-based flags
              const results = source.results || f.results || rawObj?.results || rawObj?.llm?.results || [];

              const triggeredSubrulesFromObject = (typeof sr === "object" && sr !== null && !Array.isArray(sr))
                ? Object.entries(sr).map(([key, val]: [string, any]) => {
                  let subruleName = key;
                  if (f.code === "RF009" && subruleName.toLowerCase() === "tgbt") {
                    subruleName = "TGTBT";
                  }
                  return {
                    subrule: subruleName,
                    reasoning: val.reasoning || val.explanation || "",
                    triggered: (() => {
                      const v = val.triggered;
                      if (typeof v === "boolean") return v;
                      if (typeof v === "string") return v.toLowerCase() === "yes" || v.toLowerCase() === "true" || v.toLowerCase() === "triggered";
                      if (typeof v === "number") return v === 1;
                      return false;
                    })(),
                    points: val.points
                  };
                })
                : [];

              if (triggeredSubrulesFromObject.length > 0) {
                return triggeredSubrulesFromObject;
              }

              if (Array.isArray(sr) && sr.length > 0) {
                return sr.map((item: any) => {
                  let subruleName = item.subrule || item.name || item.id || "";

                  // For RF009, rename TGBT to TGTBT (standardizing with artifact)
                  if (f.code === "RF009" && subruleName.toLowerCase() === "tgbt") {
                    subruleName = "TGTBT";
                  }

                  return {
                    ...item,
                    subrule: subruleName,
                    reasoning: item.reasoning || item.explanation || item.reason || "",
                    triggered: (() => {
                      const v = item.triggered ?? item.status;
                      if (typeof v === "boolean") return v;
                      if (typeof v === "string") {
                        const s = v.toLowerCase();
                        return s === "yes" || s === "true" || s.includes("risk") || s === "triggered";
                      }
                      if (typeof v === "number") return v === 1;
                      return false;
                    })()
                  };
                });
              }

              // For RF009, we prefer the logic-based subrules from above. 
              // Only if they are absolutely missing do we fall back to results.
              if (Array.isArray(results) && results.length > 0) {
                return results.map((item: any) => ({
                  ...item,
                  subrule: item.match_label || item.image_id || "Image Match",
                  reasoning: item.reason || item.explanation || "",
                  triggered: (() => {
                    const s = String(item.status || "").toLowerCase();
                    return s.includes("risk") || s === "yes" || s === "true";
                  })()
                }));
              }

              return [];
            })(),
            results: source.results || f.results || (typeof f.raw === "string" ? (() => { try { return JSON.parse(f.raw).results; } catch (e) { return []; } })() : f.raw?.results) || (typeof f.raw === "string" ? (() => { try { return JSON.parse(f.raw).llm?.results; } catch (e) { return []; } })() : f.raw?.llm?.results) || [],
            points: source.points !== undefined ? source.points : f.points
          };
        });
        setApiFlags(normalizedFlags);

        // Step 3: Handle Risk Score Datastore Entry
        const targetStep = steps.find((s: any) => s.name === "RISK_SCORE");
        const stepId = targetStep?.id || "e95829ec-3344-48f4-b2e7-a57eb9eefe36";
        const riskEntry = await fetchDatastoreEntry(String(currentCaseId), stepId);

        if (mounted) {
          setRiskScoreDatastore(riskEntry);
        }
      } catch (err) {
        console.error("[InvDecisioningTab] loadDecisioningData error:", err);
        if (mounted) {
          setApiFlags(undefined);
          setRiskScoreDatastore(null);
        }
      }
    };

    loadDecisioningData();

    return () => {
      mounted = false;
    };
  }, [currentCaseId]);

  const getStatusForCode = (code: string) => {
    // Only use API-provided flags. If there is no API data for this code,
    // return undefined so the UI can render a neutral gray, dashed state.
    if (apiFlags && Array.isArray(apiFlags)) {
      return apiFlags.find((f: any) => f.code === code);
    }
    return undefined;
  };

  // Helper to map certain internal flag codes to display codes (GF00x)
  const mapDisplayCode = (code: string) => {
    switch (code) {
      case "good_social_media_pr":
        return "GF001";
      case "vintage_merchant_fla":
        return "GF002";
      case "corporate_merchant_f":
        return "GF003";
      default:
        return code;
    }
  };

  const EXCLUDED_CODES = [
    "GF004",
    "RF007",
    "RF008",
  ];

  // Resolve the effective flags for the current case: use only API-provided data.
  // We filter out codes that should not be visible in the Decisioning tab.
  const caseFlags = useMemo(() => {
    if (apiFlags && Array.isArray(apiFlags)) {
      return apiFlags.filter((f) => !EXCLUDED_CODES.includes(f.code));
    }
    return [] as any[];
  }, [apiFlags]);

  // Master list of flag codes to render. We filter out excluded codes normally, 
  // and for specific ones (RF017, RF018, RF019), we ONLY show them if they are in the API.
  const visibleFlagCodes = useMemo(() => {
    const allCodes = Object.keys(FlagCodeMapping) as FlagCode[];
    return allCodes.filter((code) => {
      // 1. If it's explicitly excluded, hide it
      if (EXCLUDED_CODES.includes(code)) return false;

      // 2. For these specific codes, hide if NOT in API
      if (
        code === "RF018" ||
        code === "RF019" ||
        code === "RF020"
      ) {
        return apiFlags?.some((f) => f.code === code);
      }

      // 3. Otherwise show it (as a neutral dashed state if not in API)
      return true;
    });
  }, [apiFlags]);

  // Short justification text for the merchant summary shown in the footer
  const merchantSummaryJustification = useMemo(() => {
    return (
      (selectedCase as any)?.overallReasoning ||
      selectedCase?.caseTitle ||
      selectedCase?.registeredName ||
      "No merchant summary available."
    );
  }, [selectedCase]);

  const merchantRiskLevel = useMemo<
    "severe" | "high" | "medium" | "low"
  >(() => {
    if (!caseFlags || (caseFlags as any[]).length === 0) return "low";
    const severities = (caseFlags as any[]).map((f) =>
      (f.severity || "").toString().toLowerCase()
    );
    if (severities.some((s) => s.includes("severe") || s.includes("critical")))
      return "severe";
    if (severities.some((s) => s.includes("high"))) return "high";
    if (severities.some((s) => s.includes("medium"))) return "medium";
    return "low";
  }, [caseFlags]);

  const listItems: CustomListItemProps[] = useMemo(() => {
    // We only render flag codes that pass our visibility criteria (visibleFlagCodes)
    return visibleFlagCodes
      .map((flagCode) => {
        const flagStatus = getStatusForCode(flagCode) as any;
        const hasApiDataForCode = Boolean(flagStatus);
        const flagInfo =
          getFlagInfo(flagCode) ||
          (hasApiDataForCode
            ? ({
              name: flagStatus.step_description || flagStatus.name || flagCode,
              severity: flagStatus.severity,
              icon: flagStatus.icon,
              themeColor: flagStatus.themeColor,
            } as any)
            : null);

        // If neither sample info nor API info exist, still render minimal entry
        if (!flagInfo && !flagStatus) {
          const TitleComponent = (
            <div className="min-w-0 w-full space-y-1.5">
              <div className="flex items-baseline gap-2.5 min-w-0">
                <span className="text-[12px] text-gray-500 tracking-wider uppercase flex-shrink-0 leading-tight">
                  {mapDisplayCode(flagCode)}
                </span>
                <span className="text-[15px] font-medium text-gray-500 truncate min-w-0 flex-1 leading-snug tracking-tight">
                  {mapDisplayCode(flagCode)}
                </span>
              </div>
            </div>
          );
          return {
            itemID: flagCode,
            title: TitleComponent,
            leftMainIcon: (
              <MinusCircle className="w-5 h-5 text-gray-400 opacity-60" />
            ),
            rightMainIcon: ChevronRight,
          } as CustomListItemProps;
        }

        const triggeredColor: ColorScheme =
          hasApiDataForCode && flagStatus.overallTriggered ? "blue" : "gray";

        // Get severity text (prefer API-provided severity)
        let severityText =
          (flagStatus && flagStatus.severity) || flagInfo?.severity || "";

        if (severityText.toLowerCase().includes("critical") || severityText.toLowerCase().includes("severe")) {
          severityText = "Critical Risk";
        } else if (severityText.toLowerCase().includes("high")) {
          severityText = "High Risk";
        } else if (severityText.toLowerCase().includes("medium") || severityText.toLowerCase() === "med") {
          severityText = "Medium Risk";
        } else if (severityText.toLowerCase().includes("low") || severityText.toLowerCase() === "info") {
          severityText = "Low Risk";
        } else if (severityText.toLowerCase().includes("good")) {
          severityText = "Good Override";
        }

        const getSeverityColorScheme = (severity: string): ColorScheme => {
          const s = severity.toLowerCase();
          if (s.includes("critical")) return "red";
          if (s.includes("high")) return "orange";
          if (s.includes("medium")) return "yellow";
          if (s.includes("good")) return "green";
          if (s.includes("low")) return "blue";
          return "blue";
        };

        // Determine name color: gray ONLY when no API data, otherwise use severity-based color
        const nameColorClass =
          flagCode === "MR001"
            ? getTextColorClass("purple")
            : (hasApiDataForCode && severityText
              ? getTextColorClass(getSeverityColorScheme(severityText))
              : getTextColorClass("gray"));

        // Determine theme color
        let displayThemeColor: ColorScheme = "gray";
        if (hasApiDataForCode) {
          // Force red for specific flag codes
          if (
            flagCode === "RF017" ||
            flagCode === "RF018" ||
            flagCode === "RF019" ||
            flagCode === "RF020"
          ) {
            displayThemeColor = "red";
          } else {
            // Prefer themeColor from API/flagInfo if available, otherwise derive from severity
            displayThemeColor =
              flagStatus?.themeColor ||
              flagInfo?.themeColor ||
              getSeverityColorScheme(severityText);
          }
        }

        const triggeredColorClasses = getColorClasses(displayThemeColor);
        const Icon = getIconByName(flagStatus?.icon || flagInfo?.icon);
        const themeColorClasses = getColorClasses(displayThemeColor);
        const triggeredColorClass = getTextColorClass(triggeredColor);

        // Create triggered icon for leftMainIcon - cleaner, more subtle
        let triggeredIcon: React.ReactNode = (
          <MinusCircle
            className={`w-5 h-5 ${getTextColorClass("gray")} opacity-80`}
          />
        );
        if (hasApiDataForCode) {
          let TriggeredIcon: React.ComponentType<any> = MinusCircle;
          if (flagStatus) {
            TriggeredIcon = flagStatus.overallTriggered
              ? CheckCircle2
              : XCircle;
          }

          triggeredIcon = (
            <TriggeredIcon
              className={`w-5 h-5 ${triggeredColorClass} opacity-80`}
            />
          );
        }

        // Create severity badge (prefer API-provided severity) - more subtle design
        const severityBadge = flagCode === "MR001" ? null : (!hasApiDataForCode ? (
          <BubbleTag
            text={severityText || "N/A"}
            color="gray"
            fixedWidth="w-28"
            withBorder={false}
          />
        ) : (
          <BubbleTag
            text={severityText}
            color={getSeverityColorScheme(severityText)}
            fixedWidth="w-28"
            withBorder={false}
          />
        ));

        // Get triggered sub-rules for the title (only for triggered flags)
        const triggeredSubrules =
          flagStatus?.overallTriggered && flagStatus.subrules
            ? flagStatus.subrules.filter((subrule: any) => subrule.triggered)
            : [];

        // Check if this specific flag's artifact is open (check both activeTabId and tabs array, and ensure panel is not collapsed)
        const isThisFlagArtifactOpen =
          !isCollapsed &&
          ((activeTabId?.startsWith(`flag-${flagCode}-`) ?? false) ||
            tabs.some((tab) => tab.id.startsWith(`flag-${flagCode}-`)));

        // Create sub-rule tags component - cleaner, more subtle design
        const SubruleTags =
          triggeredSubrules.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {(triggeredSubrules.length >= 3
                ? triggeredSubrules.slice(0, 2)
                : triggeredSubrules
              ).map((subrule: any, index: number) => (
                <span
                  key={index}
                  className="text-[11px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200 font-normal leading-relaxed"
                >
                  {subrule.subrule
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              ))}
              {triggeredSubrules.length >= 3 && (
                <span className="text-[11px] text-gray-500 font-normal">
                  +{triggeredSubrules.length - 2} more
                </span>
              )}
            </div>
          ) : null;

        // Create cleaner title component with improved hierarchy
        const TitleComponent = (
          <div className="min-w-0 w-full space-y-1.5">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="text-[12px] text-gray-600 font-medium tracking-wider uppercase flex-shrink-0 leading-tight">
                {mapDisplayCode(flagCode)}
              </span>
              <span
                className={`text-[15px] font-medium ${nameColorClass} truncate min-w-0 flex-1 leading-snug tracking-tight`}
              >
                {flagStatus?.step_description || flagStatus?.name || flagInfo?.name || mapDisplayCode(flagCode)}
              </span>
            </div>
            {SubruleTags && <div className="w-full">{SubruleTags}</div>}
          </div>
        );

        // Create score badge if points exist
        const scoreBadge = flagCode === "MR001" ? null : (hasApiDataForCode && flagStatus.points !== undefined ? (
          <BubbleTag
            text={`Score: ${flagStatus.points}`}
            color={getSeverityColorScheme(severityText)}
            fixedWidth="w-28"
            withBorder={false}
          />
        ) : null);

        return {
          itemID: flagCode,
          title: TitleComponent,
          themeColor: themeColorClasses,
          leftMainIcon: triggeredIcon,
          rightMainIcon: ChevronRight,
          topRightContent: (
            <div className="flex flex-row items-center gap-2">
              {scoreBadge}
              {severityBadge}
            </div>
          ),
        } as CustomListItemProps;
      })
      .filter(Boolean) as CustomListItemProps[];
  }, [apiFlags, currentCaseId, isCollapsed, activeTabId, tabs]);

  // Sort items based on sortField and sortDirection
  const sortedItems = useMemo(() => {
    const arr = [...listItems];
    const statusOrder: Record<string, number> = {
      Triggered: 0,
      "Not Triggered": 1,
      "Not Found": 2,
    };
    const severityOrder: Record<string, number> = {
      "Critical Risk": 0,
      Severe: 0,
      "High Risk": 1,
      "Medium Risk": 2,
      "Good Override": 3,
      "Low Risk": 4,
    };
    const getTriggeredStatus = (flagCode: FlagCode) => {
      const flagStatus = getStatusForCode(flagCode) as any;
      return flagStatus
        ? flagStatus.overallTriggered
          ? "Triggered"
          : "Not Triggered"
        : "Not Found";
    };
    const getSeverityRank = (flagCode: FlagCode) => {
      const flagStatus = getStatusForCode(flagCode) as any;
      const sev = flagStatus?.severity ?? getFlagInfo(flagCode)?.severity ?? "";
      return severityOrder[sev] ?? Number.MAX_SAFE_INTEGER;
    };
    if (sortField === "flagName") {
      arr.sort((a: any, b: any) => {
        const flagCodeA = a.itemID as FlagCode;
        const flagCodeB = b.itemID as FlagCode;
        const flagInfoA = getFlagInfo(flagCodeA);
        const flagInfoB = getFlagInfo(flagCodeB);
        const nameA = (flagInfoA?.name || "").toString();
        const nameB = (flagInfoB?.name || "").toString();
        const cmp = nameA.localeCompare(nameB);
        return sortDirection === "desc" ? -cmp : cmp;
      });
    } else if (sortField === "flagCode") {
      arr.sort((a: any, b: any) => {
        const codeA = (a.itemID || "").toString();
        const codeB = (b.itemID || "").toString();
        const cmp = codeA.localeCompare(codeB);
        return sortDirection === "desc" ? -cmp : cmp;
      });
    } else if (sortField === "severity") {
      // Use an explicit severity ranking so flags of the same severity are contiguous
      const severityRank: Record<string, number> = {
        "Critical Risk": 0,
        "High Risk": 1,
        Severe: 0,
        Critical: 0,
        "Medium Risk": 2,
        "Good Override": 3,
        "Low Risk": 4,
        Info: 5,
      };

      arr.sort((a: any, b: any) => {
        const flagCodeA = a.itemID as FlagCode;
        const flagCodeB = b.itemID as FlagCode;
        const flagStatusA = getStatusForCode(flagCodeA) as any;
        const flagStatusB = getStatusForCode(flagCodeB) as any;
        const sevA = (
          flagStatusA?.severity ??
          getFlagInfo(flagCodeA)?.severity ??
          ""
        ).toString();
        const sevB = (
          flagStatusB?.severity ??
          getFlagInfo(flagCodeB)?.severity ??
          ""
        ).toString();
        const rankA = severityRank[sevA] ?? Number.MAX_SAFE_INTEGER;
        const rankB = severityRank[sevB] ?? Number.MAX_SAFE_INTEGER;
        const cmpRank = rankA - rankB;
        if (cmpRank !== 0) return sortDirection === "desc" ? -cmpRank : cmpRank;

        // Tie-breaker: prefer triggered flags first, then fall back to flag code
        const triggeredA = flagStatusA
          ? flagStatusA.overallTriggered
            ? 0
            : 1
          : 2;
        const triggeredB = flagStatusB
          ? flagStatusB.overallTriggered
            ? 0
            : 1
          : 2;
        const cmpTriggered = triggeredA - triggeredB;
        if (cmpTriggered !== 0)
          return sortDirection === "desc" ? -cmpTriggered : cmpTriggered;

        const cmpCode = flagCodeA.localeCompare(flagCodeB);
        return sortDirection === "desc" ? -cmpCode : cmpCode;
      });
    } else if (sortField === "triggered") {
      arr.sort((a: any, b: any) => {
        const flagCodeA = a.itemID as FlagCode;
        const flagCodeB = b.itemID as FlagCode;
        const triggeredA = getTriggeredStatus(flagCodeA);
        const triggeredB = getTriggeredStatus(flagCodeB);
        const cmpTriggered = statusOrder[triggeredA] - statusOrder[triggeredB];
        if (cmpTriggered !== 0)
          return sortDirection === "desc" ? -cmpTriggered : cmpTriggered;

        const severityA = getSeverityRank(flagCodeA);
        const severityB = getSeverityRank(flagCodeB);
        const cmpSeverity = severityA - severityB;
        if (cmpSeverity !== 0)
          return sortDirection === "desc" ? -cmpSeverity : cmpSeverity;

        const cmpCode = flagCodeA.localeCompare(flagCodeB);
        return sortDirection === "desc" ? -cmpCode : cmpCode;
      });
    }

    // If MR001 is triggered, show at top as first rule
    const mr001Index = arr.findIndex(item => item.itemID === "MR001");
    if (mr001Index > -1) {
      const flagStatus = getStatusForCode("MR001") as any;
      if (flagStatus?.overallTriggered) {
        const [mr001Item] = arr.splice(mr001Index, 1);
        arr.unshift(mr001Item);
      }
    }

    return arr;
  }, [listItems, sortField, sortDirection, apiFlags, currentCaseId]);

  const handleSortChange = (fieldKey: string, dir: SortDirection) => {
    setSortField(fieldKey);
    setSortDirection(dir);
  };

  // Handle opening flag details artifact
  const handleOpenFlagDetailsArtifact = (flagCode: FlagCode) => {
    const flagData = getStatusForCode(flagCode);

    // If flag data doesn't exist for this case, we can still show the artifact with minimal data
    if (!flagData) {
      // Create a minimal flag data structure
      const flagInfo = getFlagInfo(flagCode);
      if (!flagInfo) return;

      const minimalFlagData = {
        __placeholder: true,
        code: flagCode,
        subrules: [],
        overallReasoning: "Flag data not available for this case.",
        overallTriggered: false,
        name: flagInfo.name,
        severity: flagInfo.severity,
        icon: undefined,
        themeColor: "gray",
      } as any;

      const artifactStore = useArtifactStore.getState();
      const artifactId = `flag-${flagCode}-${Date.now()}`;

      artifactStore.addTab({
        id: artifactId,
        title: `${mapDisplayCode(flagCode)}: ${flagInfo.name}`,
        renderArtifact: () => {
          return (
            <InvFlagDetailsArtifact
              lastUpdatedAt={new Date()}
              flagData={minimalFlagData}
              outputFormat={null}
            />
          );
        },
      });

      setTimeout(() => {
        const store = useArtifactStore.getState();
        store.forceActivateTab(artifactId);
        store.setCollapsed(false);
      }, 0);
      return;
    }

    const artifactStore = useArtifactStore.getState();
    const artifactId = `flag-${flagCode}-${Date.now()}`;
    const flagInfo = getFlagInfo(flagCode);

    // Normalize API (RedFlag) shape into the shape expected by InvFlagDetailsArtifact
    const normalizedFlagData = {
      ...(flagData as any),
      subrules: (flagData as any).subrules ?? [],
      overallReasoning: (flagData as any).overallReasoning ?? "",
      overallTriggered: Boolean((flagData as any).overallTriggered),
    } as any;

    artifactStore.addTab({
      id: artifactId,
      title: `${mapDisplayCode(flagCode)}: ${flagInfo?.name || mapDisplayCode(flagCode)
        }`,
      renderArtifact: () => {
        return (
          <InvFlagDetailsArtifact
            lastUpdatedAt={new Date()}
            flagData={normalizedFlagData}
            outputFormat={null}
          />
        );
      },
    });

    // Force activate the tab to ensure it's visible
    setTimeout(() => {
      const store = useArtifactStore.getState();
      store.forceActivateTab(artifactId);
      store.setCollapsed(false);
    }, 0);
  };

  const handleItemClick = (item: CustomListItemProps) => {
    const flagCode = item.itemID as FlagCode;
    handleOpenFlagDetailsArtifact(flagCode);
  };

  const sortFields = useMemo(
    () => [
      { key: "flagName", label: "Flag Name" },
      { key: "flagCode", label: "Flag Code" },
      { key: "severity", label: "Severity" },
      { key: "triggered", label: "Triggered Status" },
    ],
    []
  );

  // Create primary filter groups for severity and triggered status.
  // CustomList will manage the filter state internally using useFilterState hook
  const primaryFilterGroup: PrimaryFilterGroup[] = useMemo(
    () => [
      {
        id: "severity",
        label: "Severity",
        type: "togglebuttons",
        options: [
          { value: "Critical Risk", label: "Critical Risk" },
          { value: "High Risk", label: "High Risk" },
          { value: "Medium Risk", label: "Medium Risk" },
          { value: "Low Risk", label: "Low Risk" },
          { value: "Good Override", label: "Good Override" },
        ],
        selectedValues: [], // Initial selection - none selected by default
        onFilterChange: () => { }, // Optional callback - CustomList manages state internally
        filterFunction: (
          item: CustomListItemProps,
          selectedValues: string[]
        ) => {
          if (selectedValues.length === 0) return true; // Show all if nothing selected
          const flagCode = item.itemID as FlagCode;
          const flagStatus = getStatusForCode(flagCode) as any;
          let severity =
            flagStatus?.severity ?? getFlagInfo(flagCode)?.severity ?? "";

          if (!severity) return false;

          const s = severity.toString().toLowerCase();
          if (s.includes("critical") || s.includes("severe")) severity = "Critical Risk";
          else if (s.includes("high")) severity = "High Risk";
          else if (s.includes("medium") || s === "med") severity = "Medium Risk";
          else if (s.includes("low") || s === "info") severity = "Low Risk";
          else if (s.includes("good")) severity = "Good Override";

          return selectedValues.includes(severity as string);
        },
        showLabel: true,
        actionElements: (
          <div
            className={`flex ${!isCollapsed ? "items-end" : "items-center"
              } gap-2`}
          >
            <SortActionButton
              sortFields={sortFields}
              currentSortField={sortField}
              currentSortDirection={sortDirection}
              onSortChange={handleSortChange}
              color="blueTextWhiteBg"
              border={true}
              stackLabelOnTop={!isCollapsed}
            />
            {/* <DownloadActionButton
              items={sortedItems}
              listTitle="Flags"
              color="blueTextWhiteBg"
              border={true}
              showLabel={false}
            /> */}
          </div>
        ),
        showLabelInline: false,
      },
      {
        id: "triggered",
        label: "Triggered",
        type: "togglebuttons",
        options: [
          { value: "Triggered", label: "Triggered" },
          { value: "Not Triggered", label: "Not Triggered" },
        ],
        selectedValues: [triggeredFilterValue], // Default to "Triggered", single selection
        onFilterChange: (newValues: string[]) => {
          // Enforce single selection behavior:
          // 1. If clicking an unselected button, select it and deselect others (keep only the clicked one)
          // 2. If clicking the already-selected button, do nothing (keep it selected)
          let normalizedValue: string;

          if (newValues.length === 0) {
            // User tried to deselect the only selected item - prevent this, keep current selection
            normalizedValue = triggeredFilterValue;
          } else if (newValues.length > 1) {
            // Multiple selected - keep only the last one (the one just clicked)
            normalizedValue = newValues[newValues.length - 1];
          } else {
            // Single value - use it
            normalizedValue = newValues[0];
          }

          // Update state - this will update selectedValues prop, which CustomList will sync
          if (normalizedValue !== triggeredFilterValue) {
            setTriggeredFilterValue(normalizedValue);
          }
        },
        filterFunction: (
          item: CustomListItemProps,
          selectedValues: string[]
        ) => {
          // With single selection, selectedValues should have exactly one value
          if (selectedValues.length === 0) return false;
          const flagCode = item.itemID as FlagCode;
          const flagStatus = getStatusForCode(flagCode) as any;
          const status = flagStatus
            ? flagStatus.overallTriggered
              ? "Triggered"
              : "Not Triggered"
            : "Not Found";
          // Check if the item's status matches the selected value
          return selectedValues.includes(status);
        },
        showLabel: true,
      },
    ],
    [
      apiFlags,
      currentCaseId,
      sortFields,
      sortField,
      sortDirection,
      sortedItems,
      isCollapsed,
      triggeredFilterValue,
    ]
  );

  // Keep staggered reveal but avoid any hidden/transparent states so items
  // never occupy space while invisible in the DOM. Both states render
  // visible styles (opacity 1, y 0). We keep staggerChildren so items still
  // animate in subtly if desired, but without initial opacity:0 issues.
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 },
  };

  // Logic for calculated score and dynamic summary
  const calculatedScoreDetails = useMemo(() => {
    if (!apiFlags) return null;

    const triggeredFlags = apiFlags.filter(f => f.overallTriggered);
    const sumScore = triggeredFlags.reduce((acc, f) => acc + (f.points || 0), 0);
    const formulaParts = triggeredFlags.length > 0
      ? triggeredFlags.map(f => `${f.code} · ${f.points || 0}`)
      : ["No triggered rules · 0"];

    // Check for critical flags to determine if the banding logic is affected
    const criticalFlags = triggeredFlags.filter(f => {
      const sev = (f.priority_flag_category || f.severity || "").toLowerCase();
      return sev.includes("critical") || sev.includes("severe");
    });
    const criticalSevCount = criticalFlags.length;

    // The score for banding purposes in this logic (matches what UI used to do)
    // If critical exists, score is the max critical flag's points, else it's the sum.
    let baseScore = sumScore;
    if (criticalSevCount > 0) {
      const maxCriticalFlag = criticalFlags.reduce((prev, current) => {
        return (prev.points || 0) > (current.points || 0) ? prev : current;
      });
      baseScore = maxCriticalFlag.points || 0;
    }

    const finalScore = Math.max(Math.min(baseScore, 100), 0);

    // Generate dynamic summary text based on triggered flags and score
    const highSevCount = triggeredFlags.filter(f => {
      const sev = (f.priority_flag_category || f.severity || "").toLowerCase();
      return sev.includes("high");
    }).length;
    const manualReviewCount = triggeredFlags.filter(f => (f.decisionStatus || "").toLowerCase().includes("manual") || (f.decisionStatus || "").toLowerCase().includes("review")).length;

    let summaryText: React.ReactNode = "";

    if (finalScore >= 75 || criticalSevCount > 0) {
      summaryText = (
        <>
          {criticalSevCount > 0 ? (
            <>Final score is the <span className="font-bold text-gray-900">maximum of triggered critical flags</span>. </>
          ) : (
            <>Final score is the sum of all triggered flag scores, <span className="font-bold text-gray-900">capped at 100</span>. </>
          )}
          {criticalSevCount > 0 ? (
            <span>The <span className="font-bold text-red-600">Critical</span>-severity flag automatically pushes the score into the <span className="font-bold text-red-600">Critical band (≥ 75)</span></span>
          ) : highSevCount >= 2 ? (
            <span>Two <span className="font-bold text-orange-600">High</span>-severity flags push the total into the <span className="font-bold text-red-600">Critical band (≥ 75)</span></span>
          ) : (
            <span>Triggered flags push the score into the <span className="font-bold text-red-600">Critical band (≥ 75)</span></span>
          )}, resulting in a <span className="font-bold text-red-600">Not Recommending</span> decision.
        </>
      );
    } else if (finalScore >= 26 || manualReviewCount > 0) {
      const band = finalScore >= 51 ? "High" : "Medium";
      const color = finalScore >= 51 ? "text-orange-600" : "text-amber-600";
      summaryText = (
        <>
          Total score of <span className="font-bold text-gray-900">{finalScore}</span> falls in the <span className={cn("font-bold", color)}>{band} band ({finalScore >= 51 ? "51–74" : "26–50"})</span>.
          {manualReviewCount > 0 ? (
            <span className="ml-1">Combined with {manualReviewCount === 1 ? "one flag" : `${manualReviewCount} flags`} marked <span className="font-bold text-purple-600">Manual Review</span>, the case is routed to an analyst rather than auto-decisioned.</span>
          ) : (
            <span className="ml-1">The case is routed for further investigation based on detected risk patterns.</span>
          )}
        </>
      );
    } else {
      summaryText = (
        <>
          {highSevCount === 0 ? "No high-severity flags triggered. " : ""}
          The total score of <span className="font-bold text-gray-900">{finalScore}</span> sits well within the <span className="font-bold text-emerald-600">Low band (0–25)</span>, resulting in a <span className="font-bold text-emerald-600">Recommending</span> decision.
        </>
      );
    }

    const formula = `${formulaParts.join(" + ")} = ${sumScore}${sumScore > 100 ? " -> capped at 100" : sumScore < 0 ? " -> floored at 0" : ""}`;

    let tier = "Low Risk";
    if (finalScore >= 75) tier = "Critical Risk";
    else if (finalScore >= 51) tier = "High Risk";
    else if (finalScore >= 26) tier = "Medium Risk";

    return {
      score: finalScore,
      formula,
      tier,
      summary: summaryText
    };
  }, [apiFlags]);

  const isProcessing = useMemo(() => {
    const status = String(
      (selectedCase as any)?.run?.status ||
      (selectedCase as any)?.status ||
      ""
    ).toUpperCase();
    return status === "PROCESSING" || status === "RUNNING";
  }, [selectedCase]);

  // Prepare Decisioning PDF data
  const decisioningPdfData = useMemo(() => {
    const dataBase = (riskScoreDatastore?.data as any)?.data || {};
    const riskReport = (selectedCase as any)?.risk_report || (selectedCase as any)?.risk_score;
    const hasRiskReport = riskReport && typeof riskReport === "object";
    const priorityFlag = (selectedCase as any)?.priority_flag;
    const rawCategory = priorityFlag?.category || dataBase.category || "";
    const apiScore = priorityFlag?.points ?? dataBase.risk_score ?? (hasRiskReport ? (riskReport as any).risk_score : (typeof (selectedCase as any)?.risk_score === 'number' ? (selectedCase as any)?.risk_score : null));
    const score = (apiScore !== undefined && apiScore !== null) ? apiScore : (calculatedScoreDetails?.score ?? 0);

    const formula = calculatedScoreDetails?.formula ?? dataBase.score_formula;
    const tier = dataBase.risk_tier ?? (selectedCase as any)?.risk_report?.risk_tier ?? (selectedCase as any)?.risk_tier ?? calculatedScoreDetails?.tier ?? "N/A";

    const statusToNormalize = rawCategory || tier;
    const lowCat = statusToNormalize.toLowerCase();

    let finalStatus = "N/A";
    if (lowCat.includes("critical")) finalStatus = "Critical Risk";
    else if (lowCat.includes("high")) finalStatus = "High Risk";
    else if (lowCat.includes("medium")) finalStatus = "Medium Risk";
    else if (lowCat.includes("low")) finalStatus = "Low Risk";
    else if (lowCat.includes("manual review")) finalStatus = "Manual Review";
    else if (lowCat === "recommended") finalStatus = "Low Risk";
    else if (lowCat === "not recommended") finalStatus = "Critical Risk";

    // Defensive utility to ensure we only pass strings to the PDF template
    const safeStr = (val: any): string => {
      if (typeof val === 'string') return val;
      if (!val) return "";
      if (typeof val === 'object') {
        // If it's a React element (like calculatedScoreDetails.summary), we can't render it in the hidden PDF
        if (React.isValidElement(val)) return "";
        // If it's a raw object (like the accidentally passed datastore payload), return empty string
        return "";
      }
      return String(val);
    };

    const rawFraudCommentary = dataBase.fraud_commentary || merchantSummaryJustification;
    const fraudCommentary = typeof rawFraudCommentary === 'string'
      ? rawFraudCommentary.replace(/^\*\*.*?\*\*\s*/, "").trim()
      : safeStr(rawFraudCommentary);

    const riskExplanation = safeStr(dataBase.risk_explanation || fraudCommentary);

    const normalizedRules = (apiFlags || [])
      .filter(f => f.code !== "RISK_SCORE" && f.code !== "GF004" && f.code !== "RF007" && f.code !== "RF008")
      .map(f => ({
        code: safeStr(f.code),
        name: safeStr(f.name),
        severity: safeStr(f.severity),
        triggered: !!f.overallTriggered,
        points: typeof f.points === 'number' ? f.points : 0,
        reasoning: safeStr(f.overallReasoning),
        extra_details: (f as any).extra_details || (f as any).raw?.extra_details || null,
        subrules: (f.subrules || []).map((s: any) => ({
          subrule: safeStr(s.subrule),
          reasoning: safeStr(s.reasoning),
          triggered: !!s.triggered,
          points: s.points,
          severity: s.severity || s.category
        }))
      }))
      .sort((a: any, b: any) => (a.triggered === b.triggered ? 0 : a.triggered ? -1 : 1));

    const lobValue = (() => {
      const v = (selectedCase as any)?.line_of_business ||
        (selectedCase as any)?.lob ||
        (selectedCase as any)?.business_category ||
        (selectedCase as any)?.merchantIndustry ||
        (selectedCase as any)?.keyStats?.lineOfBusiness ||
        "";
      return Array.isArray(v) ? v.join(", ") : String(v ?? "");
    })();


    return {
      verdict: {
        score: typeof score === 'number' || typeof score === 'string' ? score : 0,
        maxScore: 100,
        riskTier: finalStatus, // Use the normalized finalStatus
        formula: safeStr(formula),
        summary: riskExplanation,
        status: finalStatus, // Use the normalized finalStatus
        lob: lobValue
      },
      aiRiskCommentary: {
        justification: fraudCommentary,
        riskLevel: finalStatus.toLowerCase(),
        statusTag: finalStatus
      },
      rules: normalizedRules
    };

  }, [riskScoreDatastore, selectedCase, calculatedScoreDetails, merchantSummaryJustification, apiFlags]);


  const handleDownloadReport = useCallback(async () => {
    if (!pdfTemplateRef.current) return;

    const clone = pdfTemplateRef.current.cloneNode(true) as HTMLElement;
    await preparePDFElement(clone);
    const merchantName = (selectedCase as any)?.merchant?.name || (selectedCase as any)?.merchant_name || 'Merchant';
    const fileName = `${merchantName.replace(/\s+/g, '_')}_Decisioning_Report.pdf`;

    const riskScore = decisioningPdfData.verdict.score;
    const riskLabel = decisioningPdfData.verdict.status;
    const lob = decisioningPdfData.verdict.lob;

    await generateInvestigationReportPDF(clone, merchantName, lob, '', {
      filename: fileName,
      website: (selectedCase as any)?.website || (selectedCase as any)?.merchant?.website || "",
      runDate: format(new Date(), 'dd MMMM yyyy'),
      riskScore,
      riskLabel,
      riskColor: riskLabel.toLowerCase().includes('critical') ? 'red' :
        riskLabel.toLowerCase().includes('high') ? 'orange' :
          riskLabel.toLowerCase().includes('medium') ? 'amber' :
            riskLabel.toLowerCase().includes('manual') ? 'purple' :
              riskLabel.toLowerCase().includes('low') ? 'green' : 'gray'
    });



  }, [selectedCase]);

  return (
    <motion.div
      className="space-y-4 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {selectedCase && (
        <motion.div variants={itemVariants}>
          <InvPageHeader
            activeCase={selectedCase}
            hideRiskTags={true}
            onGenerateReport={handleDownloadReport}
          />
        </motion.div>
      )}

      {hasActiveCase && (
        <motion.div variants={itemVariants} className="pt-2">
          {(() => {
            const dataBase = (riskScoreDatastore?.data as any)?.data || {};
            const riskTier = dataBase.risk_tier || "N/A";
            const priorityFlag = (selectedCase as any)?.priority_flag;
            const rawCategory = priorityFlag?.category || dataBase.category || "";

            const statusToNormalize = rawCategory || riskTier;
            const assessmentLowCat = statusToNormalize.toLowerCase();

            let assessmentStatus = "N/A";
            if (assessmentLowCat.includes("critical")) assessmentStatus = "Critical Risk";
            else if (assessmentLowCat.includes("high")) assessmentStatus = "High Risk";
            else if (assessmentLowCat.includes("medium")) assessmentStatus = "Medium Risk";
            else if (assessmentLowCat.includes("low")) assessmentStatus = "Low Risk";
            else if (assessmentLowCat.includes("manual review")) assessmentStatus = "Manual Review";
            else if (assessmentLowCat === "recommended") assessmentStatus = "Low Risk";
            else if (assessmentLowCat === "not recommended") assessmentStatus = "Critical Risk";

            const rawFraudCommentary = dataBase.fraud_commentary || merchantSummaryJustification;
            // Remove leading bolded status (e.g., **Manual Review**, **⚠ Recommended**) at the start of the string
            const fraudCommentary = typeof rawFraudCommentary === 'string'
              ? rawFraudCommentary.replace(/^\*\*.*?\*\*\s*/, "").trim()
              : rawFraudCommentary;

            let theme: "low" | "medium" | "high" | "manual" | "gray" = "gray";
            let decision = { label: "N/A", color: "gray" };

            if (assessmentStatus === "Low Risk") {
              theme = "low";
              decision = { label: "Low Risk", color: "green" };
            } else if (assessmentStatus === "Medium Risk") {
              theme = "medium";
              decision = { label: "Medium Risk", color: "amber" };
            } else if (assessmentStatus === "High Risk") {
              theme = "high";
              decision = { label: "High Risk", color: "orange" };
            } else if (assessmentStatus === "Critical Risk") {
              theme = "high"; // Use same 'high' theme for Critical in terms of box styling
              decision = { label: "Critical Risk", color: "red" };
            } else if (assessmentStatus === "Manual Review") {
              theme = "manual";
              decision = { label: "Manual Review", color: "purple" };
            }

            return (
              <RiskAssessmentParagraph
                title={
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shadow-sm",
                      theme === "low" ? "bg-emerald-500 shadow-emerald-500/50" :
                        theme === "medium" ? "bg-amber-500 shadow-amber-500/50" :
                          theme === "high" ? "bg-red-500 shadow-red-500/50" :
                            theme === "manual" ? "bg-purple-500 shadow-purple-500/50" :
                              "bg-gray-400"
                    )} />
                    <span className={cn(
                      "font-bold",
                      theme === "low" ? "text-emerald-800" :
                        theme === "medium" ? "text-amber-800" :
                          theme === "high" ? "text-red-800" :
                            theme === "manual" ? "text-purple-800" :
                              "text-gray-900"
                    )}>
                      AI Risk Commentary
                    </span>
                  </div>
                }
                justification={fraudCommentary}
                riskLevel={theme}
                noColor={assessmentLowCat === "n/a"}
                rightElement={
                  <div className="flex items-center gap-2">
                    {(() => {
                      const rawMethod = (selectedCase as any)?.Method ?? (selectedCase as any)?.run?.Method ?? (selectedCase as any)?.run?.method;
                      const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";
                      const normalized = methodValue.replace(/[-_]/g, " ").trim().toLowerCase();
                      const isAutoReject = normalized === "auto-reject" || normalized === "auto reject";

                      if (!isAutoReject) return null;

                      const colorsClass = 
                        decision.color === "red" ? "bg-red-50/80 border-red-200 text-red-600" :
                        decision.color === "orange" ? "bg-orange-50/80 border-orange-200 text-orange-600" :
                        decision.color === "amber" ? "bg-amber-50/80 border-amber-200 text-amber-600" :
                        decision.color === "green" ? "bg-emerald-50/80 border-emerald-200 text-emerald-600" :
                        decision.color === "purple" ? "bg-purple-50/80 border-purple-200 text-purple-600" :
                        "bg-gray-50/80 border-gray-200 text-gray-600";

                      const iconBgClass = 
                        decision.color === "red" ? "bg-red-600" :
                        decision.color === "orange" ? "bg-orange-600" :
                        decision.color === "amber" ? "bg-amber-600" :
                        decision.color === "green" ? "bg-emerald-600" :
                        decision.color === "purple" ? "bg-purple-600" :
                        "bg-gray-400";

                      return (
                        <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm", colorsClass)}>
                          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", iconBgClass)}>
                            <X className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                          </div>
                          <span className="text-[12px] font-bold whitespace-nowrap">{methodValue}</span>
                        </div>
                      );
                    })()}

                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-bold shadow-sm transition-all duration-300",
                      decision.color === "red" ? "bg-red-50/80 border-red-200 text-red-600" :
                        decision.color === "orange" ? "bg-orange-50/80 border-orange-200 text-orange-600" :
                          decision.color === "amber" ? "bg-amber-50/80 border-amber-200 text-amber-600" :
                            decision.color === "green" ? "bg-emerald-50/80 border-emerald-200 text-emerald-600" :
                              decision.color === "purple" ? "bg-purple-50/80 border-purple-200 text-purple-600" :
                                "bg-gray-50/80 border-gray-200 text-gray-600"
                    )}>
                      <div className={cn(
                        "w-4 h-4 rounded-full relative text-white",
                        decision.color === "red" ? "bg-red-600" :
                          decision.color === "orange" ? "bg-orange-600" :
                            decision.color === "amber" ? "bg-amber-600" :
                              decision.color === "green" ? "bg-emerald-600" :
                                decision.color === "purple" ? "bg-purple-600" :
                                  "bg-gray-400"
                      )}>
                        {decision.color === "red" ? (
                          <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-2.5 h-2.5" strokeWidth={4} />
                        ) : decision.color === "green" ? (
                          <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3" strokeWidth={4} />
                        ) : decision.color === "purple" || decision.color === "orange" || decision.color === "amber" ? (
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[52%] text-[10px] font-black">!</span>
                        ) : (
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[52%] text-[10px] font-black">!</span>
                        )}
                      </div>
                      <span>{decision.label}</span>
                    </div>
                  </div>
                }
              />
            );
          })()}
        </motion.div>
      )}

      {hasActiveCase && (riskScoreDatastore || isProcessing) && (
        <motion.div variants={itemVariants} className="pt-2">
          {(() => {
            const dataBase = (riskScoreDatastore?.data as any)?.data || {};
            // Sync status with Page Header/Watchlist by prioritizing priority_flag
            const priorityFlag = (selectedCase as any)?.priority_flag;
            const rawCategory = priorityFlag?.category || dataBase.category || "";

            const apiScore = priorityFlag?.points ?? dataBase.risk_score ?? (selectedCase as any)?.risk_report?.risk_score ?? (selectedCase as any)?.risk_score;
            const score = (apiScore !== undefined && apiScore !== null) ? apiScore : (calculatedScoreDetails?.score ?? 0);
            const formula = calculatedScoreDetails?.formula ?? dataBase.score_formula;
            const tier = dataBase.risk_tier ?? (selectedCase as any)?.risk_report?.risk_tier ?? (selectedCase as any)?.risk_tier ?? calculatedScoreDetails?.tier ?? "N/A";

            // Use category as primary, only fallback to tier if category is empty
            const statusToNormalize = rawCategory || tier;
            const lowCat = statusToNormalize.toLowerCase();

            let finalStatus = "N/A";
            if (lowCat.includes("critical")) finalStatus = "Critical Risk";
            else if (lowCat.includes("high")) finalStatus = "High Risk";
            else if (lowCat.includes("medium")) finalStatus = "Medium Risk";
            else if (lowCat.includes("low")) finalStatus = "Low Risk";
            else if (lowCat.includes("manual review")) finalStatus = "Manual Review";
            else if (lowCat === "recommended") finalStatus = "Low Risk";
            else if (lowCat === "not recommended") finalStatus = "Critical Risk";

            // Derive shared cleaned commentary
            const rawFraudCommentary = dataBase.fraud_commentary || merchantSummaryJustification;
            const sharedSummary = typeof rawFraudCommentary === 'string'
              ? rawFraudCommentary.replace(/^\*\*.*?\*\*\s*/, "").trim()
              : rawFraudCommentary;

            const riskExplanation = dataBase.risk_explanation || sharedSummary || (isProcessing ? "The risk assessment is currently being evaluated. Detailed reasoning and flag breakdowns will appear once the analysis is complete." : "");

            const rawMethod = (selectedCase as any)?.Method ?? (selectedCase as any)?.run?.Method ?? (selectedCase as any)?.run?.method;
            const methodValue = rawMethod && String(rawMethod).trim() !== "" ? String(rawMethod).trim() : "NA";

            return (
              <InvCaseVerdictOverview
                score={score}
                maxScore={100}
                riskTier={tier}
                formula={formula || ""}
                summary={riskExplanation || ""}
                status={finalStatus}
                isEvaluating={isProcessing || lowCat === "evaluating..."}
                method={methodValue}
              />
            );
          })()}
        </motion.div>
      )}

      <div className="pt-2">
        {/* AI Risk Commentary */}
        <SectionHeaderWithFlags
          title="Decisioning Flags"
          icon={AlertTriangle}
          iconColorClass="text-blue-600"
          titleColorClass="text-blue-700"
          extremeNegativeFlags={[]}
          negativeFlags={[]}
          mildNegativeFlags={[]}
          neutralFlags={[]}
          mildPositiveFlags={[]}
          positiveFlags={[]}
          flagTypeOrderList={[]}
          initialRowLimit={5}
          allowCollapse={false}
          defaultExpanded={false}
        />
      </div>

      {hasActiveCase ? (
        <motion.div variants={itemVariants}>
          <motion.div variants={itemVariants}>
            <CustomList
              items={sortedItems}
              primaryFilterGroup={primaryFilterGroup}
              onItemClick={handleItemClick}
              emptyState={{
                title: "No flags found",
                description: "No flags match the selected filters.",
              }}
              showItemSpacing={true}
              showToggleOptionCounts={true}
              showFilterToggle={false}
              disableInternalSorting={true}
              initialRowLimit={Number.MAX_SAFE_INTEGER}
              moveRightContentToLeftOnArtifactOpen={false}
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="py-8">
          <p className="text-gray-600 text-center">
            No active investigation ID. Select one from the search bar in the
            top-right of the page.
          </p>
          {merchantId && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Merchant ID: {merchantId}
            </p>
          )}
          {caseId && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Case ID: {caseId}
            </p>
          )}
        </motion.div>
      )}

      {/* Hidden container for PDF Template */}
      <div className="hidden">
        <div ref={pdfTemplateRef}>
          <InvestigationDecisioningPDFTemplate
            merchantName={(selectedCase as any)?.merchant?.name || (selectedCase as any)?.merchant_name || 'Merchant'}
            runDate={format(new Date(), 'dd MMMM yyyy')}
            website={(selectedCase as any)?.website || (selectedCase as any)?.merchant?.website || ""}
            {...decisioningPdfData}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default InvDecisioningTab;
