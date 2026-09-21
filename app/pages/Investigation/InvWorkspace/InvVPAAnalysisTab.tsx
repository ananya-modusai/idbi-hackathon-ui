"use client";

import React, { FC, useCallback, useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import InvPageHeader from "../Components/InvPageHeader";
import { 
  Activity, 
  ChevronRight, 
  ExternalLink, 
  Globe, 
  FileText, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  AlertTriangle, 
  Minus, 
  Briefcase, 
  Layers, 
  Users, 
  Phone 
} from "lucide-react";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { format } from "date-fns";
import { generateInvestigationReportPDF, preparePDFElement } from "../Investigation-Report/utils/pdfUtils";
import InvestigationVPAAnalysisPDFTemplate from "../Investigation-Report/VPAAnalysisTab/InvestigationVPAAnalysisPDFTemplate";
import { getSocialMediaPlatforms } from "./InvWebDataLogic";
import { 
  fetchSteps, 
  fetchDatastoreEntry, 
  DatastoreEntryApiResponse,
  fetchScamIntelligence,
  fetchDecisioning,
  fetchReverseImageSearch 
} from "@/app/services/caseServices";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import { getIconByName } from "@/components/custom/CustomIconScheme";
import { getFlagInfo } from "../Sample Data/InvDecisioningSampleData";
import { InvFlagDetailsArtifact } from "../Components/InvFlagDetailsArtifact";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { ArtifactSectionCollapsible } from "@/components/custom/ArtifactSectionCollapsible";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { TruncatableText } from "./components/TruncatableText";
import SocialMediaCard from "@/components/custom/SocialMediaCard";
import WebsiteQualityCard from "@/components/custom/WebsiteQualityCard";
import CustomLoader from "@/components/custom/CustomLoader";
import ReverseImageSearchSection from "./components/ReverseImageSearchSection";

interface InvVPAAnalysisTabProps {
  merchantId?: string;
  caseId?: string;
}

const InvVPAAnalysisTab: FC<InvVPAAnalysisTabProps> = ({
  merchantId,
  caseId,
}) => {
  const { selectedCase } = useInvestigationCaseStore();
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  
  const artifactStore = useArtifactStore();
  const artifactPanelCollapsed = artifactStore.isCollapsed;

  // Consolidated VPA & Scam / Presence data states
  const [riskScoreDatastore, setRiskScoreDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [datastoreEntryData, setDatastoreEntryData] = useState<DatastoreEntryApiResponse | null>(null);
  const [datastoreEntryLoading, setDatastoreEntryLoading] = useState(false);
  const [scamIntelligenceData, setScamIntelligenceData] = useState<any | null>(null);
  const [scamIntelligenceLoading, setScamIntelligenceLoading] = useState(false);
  const [redFlags, setRedFlags] = useState<any[] | null>(null);
  const [redFlagsLoading, setRedFlagsLoading] = useState(false);
  const [reverseImageSearchData, setReverseImageSearchData] = useState<any | null>(null);
  const [reverseImageSearchLoading, setReverseImageSearchLoading] = useState(false);
  const [riskAnalysisData, setRiskAnalysisData] = useState<any | null>(null);
  const [reviewsAnalysisData, setReviewsAnalysisData] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    const runId = caseId || (selectedCase as any)?.caseId;
    if (!runId) {
      setDatastoreEntryData(null);
      setScamIntelligenceData(null);
      setRedFlags(null);
      setReverseImageSearchData(null);
      setRiskScoreDatastore(null);
      return;
    }

    setDatastoreEntryLoading(true);
    setScamIntelligenceLoading(true);
    setRedFlagsLoading(true);
    setReverseImageSearchLoading(true);

    const loadAllVpaData = async () => {
      try {
        const steps = await fetchSteps(100);
        if (cancelled) return;
        
        const targetStep = steps.find(s => s.name === "WEBSITE_SOCIAL_MEDIA_LINKS");
        const riskStepId = steps.find(s => s.name === "RISK_SCORE")?.id || "e95829ec-3344-48f4-b2e7-a57eb9eefe36";

        const [
          scamInt,
          decisioningEntry,
          datastoreEntry,
          reverseImg,
          riskEntry
        ] = await Promise.all([
          fetchScamIntelligence(String(runId)),
          fetchDecisioning(String(runId)),
          targetStep ? fetchDatastoreEntry(String(runId), targetStep.id) : Promise.resolve(null),
          fetchReverseImageSearch(String(runId)),
          fetchDatastoreEntry(String(runId), riskStepId)
        ]);

        if (cancelled) return;

        const sData = scamInt?.data || null;
        setScamIntelligenceData(sData);
        if (sData?.risk_analysis) setRiskAnalysisData(sData.risk_analysis);
        if (sData?.reviews_analysis) setReviewsAnalysisData(sData.reviews_analysis);

        setRedFlags(decisioningEntry?.data?.flags || []);
        setDatastoreEntryData(datastoreEntry);
        setReverseImageSearchData(reverseImg);
        setRiskScoreDatastore(riskEntry);
      } catch (err) {
        console.error("[InvVPAAnalysisTab] Error loading consolidated VPA tab data:", err);
      } finally {
        if (!cancelled) {
          setDatastoreEntryLoading(false);
          setScamIntelligenceLoading(false);
          setRedFlagsLoading(false);
          setReverseImageSearchLoading(false);
        }
      }
    };

    loadAllVpaData();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  // Open an artifact showing social media platform details using outputFormat API
  const openSocialMediaArtifact = async (platformDisplayName: string, accountIndex: number = 0) => {
    const artifactId = `social-media-${platformDisplayName}-${Date.now()}`;

    const smData = datastoreEntryData?.data?.data as any;
    let platformData: any = null;
    let allAccountsData: any[] = [];

    if (smData?.platforms) {
      const normalizedName = platformDisplayName.toLowerCase();
      const platformKey = normalizedName.includes("linkedin") ? "linkedin" : 
                         normalizedName.includes("instagram") ? "instagram" :
                         normalizedName.includes("facebook") ? "facebook" :
                         normalizedName.includes("youtube") ? "youtube" :
                         normalizedName.includes("twitter") ? "twitter" : "";
      
      const rawData = smData.platforms[platformKey];
      if (rawData && !rawData.not_found) {
        const extractField = (raw: any, platform: string, fieldNames: string[]) => {
          if (!raw) return null;
          for (const f of fieldNames) {
            if (raw[f] !== undefined && raw[f] !== null) return raw[f];
            
            const sd = raw.site_data;
            if (sd) {
              if (sd[f] !== undefined && sd[f] !== null) return sd[f];
              const psd = sd[platform];
              if (psd) {
                if (Array.isArray(psd)) {
                  if (psd[0] && psd[0][f] !== undefined && psd[0][f] !== null)
                    return psd[0][f];
                } else if (psd[f] !== undefined && psd[f] !== null) return psd[f];
              }
              const flatKey = `${platform}_${f}`;
              if (sd[flatKey] !== undefined && sd[flatKey] !== null)
                return sd[flatKey];
            }

            if (raw.raw_apify && raw.raw_apify[f] !== undefined && raw.raw_apify[f] !== null) return raw.raw_apify[f];
            if (raw.raw_amplify && raw.raw_amplify[f] !== undefined && raw.raw_amplify[f] !== null) return raw.raw_amplify[f];
          }
          return null;
        };

        const rawList = Array.isArray(rawData) ? rawData : [rawData];
        allAccountsData = rawList
          .filter((raw: any) => {
            const hasWebsiteSource = String(raw.source || "").toLowerCase() === "website" || 
                                   String(raw.site_data?.source || "").toLowerCase() === "website";
            if (hasWebsiteSource) return true;
            return raw.matched === true || raw.matched === "true";
          })
          .map((raw: any) => {
          const platform = platformKey;
          return {
            presence: "Yes",
            source: extractField(raw, platform, ["source"]) || "Search",
            followers: extractField(raw, platform, ["followers", "followerCount", "followersCount"]) ?? 
                       raw.raw_apify?.followersCount ?? raw.raw_apify?.followers ?? 
                       raw.raw_amplify?.followersCount ?? raw.raw_amplify?.followers ??
                       raw.raw_apify?.followerCount ?? raw.raw_amplify?.followerCount,
            employees: extractField(raw, platform, ["number_of_employees", "employeeCount", "employee_count"]) ?? (platform === "linkedin" ? (raw.raw_amplify?.employeeCount ?? raw.raw_apify?.employeeCount) : null),
            connections: extractField(raw, platform, ["followers", "connections", "followerCount", "connectionCount"]),
            subscribers: extractField(raw, platform, ["number_of_subscribers", "followers", "subscriberCount", "subscribersCount"]) ?? raw.raw_apify?.subscriberCount ?? raw.raw_apify?.subscribers ?? raw.raw_amplify?.subscriberCount ?? raw.raw_amplify?.subscribers,
            posts: extractField(raw, platform, ["number_of_posts", "total_videos_or_reels", "postCount", "postsCount"]) ?? 
                   raw.raw_apify?.postsCount ?? raw.raw_amplify?.postsCount ??
                   raw.raw_apify?.postCount ?? raw.raw_amplify?.postCount ??
                   (platform === "youtube" ? (raw.raw_apify?.aboutChannelInfo?.channelTotalVideos ?? raw.raw_amplify?.aboutChannelInfo?.channelTotalVideos) : null),
            link: (() => {
              let l = extractField(raw, platform, ["url", "link", `${platform}_url`]);
              if (platform.includes("facebook") && l && typeof l === "string" && l.toLowerCase().includes("facebook.com")) {
                if (l.includes("/photos/")) l = l.split("/photos/")[0] + "/";
                else if (l.includes("/posts/")) l = l.split("/posts/")[0] + "/";
              }
              return l;
            })(),
            details: raw.bio ?? extractField(raw, platform, ["bio", "description", "biography"]) ?? raw.raw_apify?.biography ?? raw.raw_amplify?.biography,
            following: platform === "instagram" ? (raw.raw_amplify?.followsCount ?? raw.raw_apify?.followsCount ?? raw.raw_amplify?.followingCount ?? raw.raw_apify?.followingCount) : undefined,
            reasoning: raw.reasoning ?? raw.aligned_with_lob?.reasoning,
          };
        });
        platformData = allAccountsData[0] || null;
      }
    }

    const formatFieldName = (fieldName: string): string => {
      return fieldName
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    const buildTableData = (data: any): any[] => {
      if (!data || typeof data !== "object") return [];

      const platformKey = platformDisplayName.toLowerCase();
      let allowedFields: string[] = [];
      
      if (platformKey.includes("linkedin")) {
        allowedFields = ["employees", "connections", "link", "details"];
      } else if (platformKey.includes("instagram")) {
        allowedFields = ["followers", "posts", "link", "details", "following"];
      } else if (platformKey.includes("facebook")) {
        allowedFields = ["followers", "link", "details"];
      } else if (platformKey.includes("youtube")) {
        allowedFields = ["posts", "subscribers", "link", "details"];
      }

      const tableData: any[] = [];
      
      allowedFields.forEach((fieldKey) => {
        const actualKey = Object.keys(data).find(k => k.toLowerCase() === fieldKey.toLowerCase());
        const value = actualKey ? data[actualKey] : undefined;
        
        const formattedKey = formatFieldName(fieldKey);
        let displayValue: string = "N/A";

        if (value !== null && value !== undefined) {
          if (typeof value === "boolean") {
            displayValue = value ? "Yes" : "No";
          }
          else if (typeof value === "string") {
            let s = value.trim();
            if (platformKey.includes("facebook") && fieldKey === "link" && s.toLowerCase().includes("facebook.com")) {
              if (s.includes("/photos/")) {
                s = s.split("/photos/")[0] + "/";
              } else if (s.includes("/posts/")) {
                s = s.split("/posts/")[0] + "/";
              }
            }

            if (s === "N/A" || s === "NA" || s === "") {
              displayValue = "N/A";
            } else {
              displayValue = s;
            }
          }
          else if (typeof value === "number") {
            displayValue = String(value);
          }
          else {
            displayValue = String(value);
          }
        }

        tableData.push({
          field: formattedKey,
          value: displayValue,
        });
      });

      return tableData;
    };

    const allAccountsTableData = allAccountsData.map(acc => buildTableData(acc));

    artifactStore.addTab({
      id: artifactId,
      title: `${platformDisplayName} (Social)`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={`${platformDisplayName} - Social Media Details`}
            contentIDText="Case ID"
            contentID={(selectedCase as any)?.caseId || caseId}
          />

          {allAccountsData.length === 0 ? (
            <ArtifactSectionCollapsible title="Details" defaultOpen>
              <div className="text-sm text-gray-600">
                No accounts found for {platformDisplayName}.
              </div>
            </ArtifactSectionCollapsible>
          ) : (
            allAccountsData.map((acc, idx) => {
              const accTableData = allAccountsTableData[idx] || [];
              const accReasoning = acc.reasoning
                ? String(acc.reasoning).trim()
                : null;
              const accountLabel = allAccountsData.length > 1
                ? `Account ${idx + 1} of ${allAccountsData.length}`
                : "Account Details";

              return (
                <div key={idx}>
                  <div className={`flex items-center gap-3 px-0 py-3 ${idx > 0 ? "mt-4" : "mt-2"}`}>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-blue-700 tracking-wide uppercase">
                        {accountLabel}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-blue-100" />
                  </div>

                  <ArtifactSectionCollapsible
                    title={
                      <div className="flex items-center gap-3">
                        <span>Details</span>
                        <BubbleTag
                          text={`Source: ${(() => {
                            const s = String(acc?.source || "Search");
                            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                          })()}`}
                          color="blue"
                          size="sm"
                          hasInsideIcon={false}
                        />
                      </div>
                    }
                    defaultOpen
                  >
                    {accTableData.length === 0 ? (
                      <div className="text-sm text-gray-600">
                        No data available for this account.
                      </div>
                    ) : (
                      <CustomTableView
                        title={undefined}
                        columns={[
                          {
                            key: "field",
                            header: "Particular",
                            width: "220px",
                            align: "left" as const,
                            verticalAlign: "top" as const,
                            render: (value: string) => (
                              <span className="font-bold text-gray-700">
                                {String(value)}
                              </span>
                            ),
                          },
                          {
                            key: "value",
                            header: "Value",
                            width: "600px",
                            align: "left" as const,
                            verticalAlign: "top" as const,
                            render: (value: string, row: Record<string, any>) => {
                              const fieldName = String(row.field || "").toLowerCase();
                              const isLink =
                                fieldName.includes("link") || fieldName.includes("url");

                              if (isLink && value && value !== "N/A" && value !== "NA") {
                                return (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {value}
                                  </a>
                                );
                              }

                              return (
                                <TruncatableText
                                  text={value as any}
                                  textColorClass="text-gray-900"
                                />
                              );
                            },
                          },
                        ]}
                        data={accTableData}
                        initialRowLimit={accTableData.length}
                        headerAndTotalRowBg="gray-100"
                        showCSVExport={false}
                        isLoading={datastoreEntryLoading}
                      />
                    )}
                  </ArtifactSectionCollapsible>

                  <ArtifactSectionCollapsible title="Reasoning" defaultOpen>
                    <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                      {accReasoning ?? "N/A"}
                    </div>
                  </ArtifactSectionCollapsible>
                </div>
              );
            })
          )}
        </div>
      ),
    });

    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  // Open a marketplace artifact using data from outputFormat API
  const openMarketplaceArtifact = async (marketplaceName: string) => {
    const artifactId = `marketplace-${marketplaceName}-${Date.now()}`;

    const smData = datastoreEntryData?.data?.data as any;
    const marketSignals: any = smData?.marketplace_signals || {};
    const name = marketplaceName.trim();
    const lname = name.toLowerCase();
    
    const presence = marketSignals[`${name}_Presence`] || marketSignals[`${lname}_Presence`];
    const rating = marketSignals[`${name}_rating`] || marketSignals[`${lname}_rating`];
    const listing = marketSignals[`${name}_listing`] || marketSignals[`${lname}_listing`];
    const verified = marketSignals[`${name}_verified_badge`] || marketSignals[`${lname}_verified_badge`];
    const verified_link = marketSignals[`${name}_verified_link`] || marketSignals[`${name.toLowerCase()}_verified_link`];
    const rating_count = 
      marketSignals[`${name}_rating_count`] || 
      marketSignals[`${name.toLowerCase()}_rating_count`] ||
      marketSignals[`${name}_google_rating_count`] ||
      marketSignals[`google_rating_count`];

    const marketplaceData = {
      presence: presence || "Not Found",
      source: marketSignals[`${name}_source`] || marketSignals[`${lname}_source`] || "Search",
      rating: rating || "N/A",
      rating_count: rating_count || "N/A",
      listing: listing || "N/A",
      verified: verified || "No",
      verified_link: verified_link || "N/A",
    };

    const formatFieldName = (fieldName: string): string => {
      return fieldName
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    const buildTableData = (data: any): any[] => {
      if (!data || typeof data !== "object") return [];

      const tableData: any[] = [];
      const fieldOrder = [
        "presence",
        "source",
        "rating",
        "rating_count",
        "listing",
        "verified",
        "verified_link",
      ];

      const allKeys = Object.keys(data);
      const sortedKeys = [
        ...fieldOrder
          .map((f) =>
            allKeys.find((k) => k.toLowerCase().includes(f.toLowerCase()))
          )
          .filter(Boolean),
        ...allKeys.filter(
          (k) =>
            !fieldOrder.some((f) => k.toLowerCase().includes(f.toLowerCase()))
        ),
      ];

      sortedKeys.forEach((key) => {
        if (!key) return;
        if (String(key).toLowerCase().includes("aligned_with_lob")) return;
        const value = data[key];
        if (value !== null && value !== undefined && value !== "") {
          const formattedKey = formatFieldName(key);
          let displayValue = value;

          if (key.toLowerCase().includes("presence")) {
            if (typeof value === "boolean") {
              displayValue = value ? "Yes" : "No";
            } else if (String(value).toLowerCase() === "yes") {
              displayValue = "Yes";
            } else if (String(value).toLowerCase() === "no") {
              displayValue = "No";
            }
          }

          if (key.toLowerCase().includes("verified")) {
            if (typeof value === "boolean") {
              displayValue = value ? "Yes" : "No";
            } else if (String(value).toLowerCase() === "yes") {
              displayValue = "Yes";
            } else if (String(value).toLowerCase() === "no") {
              displayValue = "No";
            }
          }

          tableData.push({
            field: formattedKey,
            value:
              displayValue === "N/A" || displayValue === "NA"
                ? "N/A"
                : String(displayValue),
          });
        }
      });

      return tableData;
    };

    const tableData = marketplaceData ? buildTableData(marketplaceData) : [];

    const isGoogle = marketplaceName.toLowerCase().includes("google");
    const getReasoningKey = (marketplaceName: string): string => {
      if (isGoogle) return "";
      const normalized = marketplaceName.toLowerCase();
      if (normalized.includes("amazon"))
        return "market_amazon_presence_reasoning";
      if (normalized.includes("flipkart"))
        return "market_flipkart_presence_reasoning";
      if (normalized.includes("justdial"))
        return "market_justdial_presence_reasoning";
      if (normalized.includes("indiamart"))
        return "market_indiamart_presence_reasoning";
      if (normalized.includes("meesho"))
        return "market_meesho_presence_reasoning";
      return "";
    };

    const reasoningKey = getReasoningKey(marketplaceName);
    const reasoningRaw =
      !isGoogle && marketplaceData && reasoningKey
        ? (marketplaceData as any)[reasoningKey] ?? null
        : null;
    const reasoning =
      reasoningRaw && String(reasoningRaw).trim() !== ""
        ? String(reasoningRaw).trim()
        : null;
    const reasoningText = reasoning ?? "N/A";

    artifactStore.addTab({
      id: artifactId,
      title: `${marketplaceName} — Marketplace Details`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={`${marketplaceName} - Marketplace Details`}
            contentIDText="Case ID"
            contentID={(selectedCase as any)?.caseId || caseId}
            rightAlignedContent={
              <BubbleTag
                text={`Source: ${marketplaceData.source}`}
                color="blue"
                size="md"
                hasInsideIcon={false}
              />
            }
          />

          <ArtifactSectionCollapsible title="Details" defaultOpen>
            {tableData.length === 0 ? (
              <div className="text-sm text-gray-600">
                No data available for {marketplaceName}.
              </div>
            ) : (
              <CustomTableView
                title={undefined}
                columns={[
                  {
                    key: "field",
                    header: "Particular",
                    width: "220px",
                    align: "left" as const,
                    verticalAlign: "top" as const,
                    render: (value: string) => {
                      return (
                        <span className="font-bold text-gray-700">
                          {String(value)}
                        </span>
                      );
                    },
                  },
                  {
                    key: "value",
                    header: "Value",
                    width: "600px",
                    align: "left" as const,
                    verticalAlign: "top" as const,
                    render: (value: string) => {
                      return (
                        <TruncatableText
                          text={value as any}
                          textColorClass="text-gray-900"
                        />
                      );
                    },
                  },
                ]}
                data={tableData}
                initialRowLimit={tableData.length}
                headerAndTotalRowBg="gray-100"
                showCSVExport={false}
                isLoading={datastoreEntryLoading}
              />
            )}
          </ArtifactSectionCollapsible>

          {!isGoogle && (
            <ArtifactSectionCollapsible title="Reasoning" defaultOpen>
              <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                {reasoningText}
              </div>
            </ArtifactSectionCollapsible>
          )}
        </div>
      ),
    });

    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  // Open RF013 flag details artifact
  const openRF013Artifact = () => {
    const artifactId = `flag-RF013-${Date.now()}`;
    const flagInfo = getFlagInfo("RF013");

    const rf =
      Array.isArray(redFlags) && redFlags.length > 0
        ? redFlags.find(
            (r: any) => String(r?.code || "").toUpperCase() === "RF013"
          )
        : null;

    const normalizedFlagData = rf
      ? {
          ...(rf as any),
          subrules: (rf as any).subrules ?? [],
          overallReasoning:
            (rf as any).overallReasoning ??
            (rf as any).overall_reasoning ??
            (rf as any).reasoning ??
            "",
          overallTriggered: (() => {
            const v = (rf as any).overallTriggered ?? (rf as any).overall_triggered;
            if (typeof v === "boolean") return v;
            if (typeof v === "string") {
              const s = v.toLowerCase().trim();
              return s === "yes" || s === "true" || s === "1";
            }
            return v === 1;
          })(),
        }
      : {
          __placeholder: true,
          code: "RF013",
          subrules: [],
          overallReasoning: "Flag data not available for this case.",
          overallTriggered: false,
          name: flagInfo?.name,
          severity: flagInfo?.severity,
        };

    artifactStore.addTab({
      id: artifactId,
      title: `RF013: ${flagInfo?.name || "Scam Intelligence"}`,
      renderArtifact: () => (
        <InvFlagDetailsArtifact
          lastUpdatedAt={new Date()}
          flagData={normalizedFlagData as any}
          outputFormat={null}
        />
      ),
    });

    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  const scamDetectedOverall = useMemo(() => {
    if (!Array.isArray(redFlags)) return false;
    const rf013 = redFlags.find(
      (r: any) => String(r?.code || "").toUpperCase() === "RF013"
    );
    if (!rf013) return false;
    const v = rf013.overallTriggered ?? rf013.overall_triggered;
    return v === true || v === "yes" || String(v).toLowerCase() === "true" || v === 1;
  }, [redFlags]);

  const monitoredDimensions = (() => {
    const names = [
      "Registered Name",
      "Business Name",
      "Website Content",
      "Website Domain",
    ];

    const scamSignals = (() => {
      try {
        if (scamIntelligenceData?.rf013?.scam_signals) {
          return scamIntelligenceData.rf013.scam_signals;
        }

        if (!Array.isArray(redFlags)) return null;
        const rf013 = redFlags.find(
          (r: any) => String(r?.code || "").toUpperCase() === "RF013"
        );
        if (!rf013) return null;
        const extra = rf013.extra_details || rf013.extraDetails || rf013;
        const sigs =
          extra?.scam_signals ||
          extra?.scamSignals ||
          extra?.ScamSignals ||
          null;
        return sigs && typeof sigs === "object" ? sigs : null;
      } catch {
        return null;
      }
    })();

    const normalizeScamSignal = (
      v: any
    ): { status: "yes" | "no"; noData?: boolean } | null => {
      if (typeof v === "boolean")
        return { status: v ? "yes" : "no", noData: false };
      if (typeof v === "number") {
        if (v === 1) return { status: "yes", noData: false };
        if (v === 0) return { status: "no", noData: false };
      }
      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (["true", "1", "yes", "y"].includes(s))
          return { status: "yes", noData: false };
        if (["false", "0", "no", "n"].includes(s))
          return { status: "no", noData: false };
        if (["n/a", "na", "null"].includes(s))
          return { status: "no", noData: true };
      }
      return null;
    };

    if (scamIntelligenceLoading) return [];

    if (!scamIntelligenceData) {
      return names.map((n) => ({ name: n, status: "no", noData: true }));
    }

    const nameToKeyMap: Record<string, string> = {
      "Registered Name": "scam_legalname",
      "Business Name": "scam_businessname",
      "Website Content": "scam_websitecontent",
      "Website Domain": "scam_websitedomain",
    };

    if (scamSignals) {
      return names.map((n) => {
        const key = nameToKeyMap[n];
        const signal = scamSignals ? scamSignals[key] : null;
        const parsed = normalizeScamSignal(signal);
        if (parsed)
          return { name: n, status: parsed.status, noData: parsed.noData };
        return { name: n, status: "no", noData: true };
      });
    }

    return names.map((n) => ({ name: n, status: "no", noData: true }));
  })();

  const handleDownloadReport = useCallback(async () => {
    if (!pdfTemplateRef.current) return;
    
    const clone = pdfTemplateRef.current.cloneNode(true) as HTMLElement;
    await preparePDFElement(clone);
    const merchantName = (selectedCase as any)?.merchant?.name || (selectedCase as any)?.merchant_name || 'Merchant';
    const fileName = `${merchantName.replace(/\s+/g, '_')}_VPA_Analysis_Report.pdf`;
    
    const priorityFlag = (selectedCase as any)?.priority_flag;
    const riskReport = (selectedCase as any)?.risk_report || (selectedCase as any)?.risk_score;
    const hasRiskReport = riskReport && typeof riskReport === "object";
    const apiScore = hasRiskReport ? riskReport.risk_score : (typeof (selectedCase as any)?.risk_score === 'number' ? (selectedCase as any)?.risk_score : null);
    const dsScore = (riskScoreDatastore?.data as any)?.data?.risk_score;
    const finalScoreValue = dsScore ?? apiScore ?? 0;

    const riskTier = (riskScoreDatastore?.data as any)?.data?.risk_tier || (selectedCase as any)?.risk_report?.risk_tier || (selectedCase as any)?.risk_score?.risk_tier || "N/A";
    const rawCategory = priorityFlag?.category || (riskScoreDatastore?.data as any)?.data?.category || "";
    const statusToNormalize = rawCategory || riskTier;
    const lowCat = statusToNormalize.toLowerCase();
    
    let riskLabel = "N/A";
    let riskColor = "gray";

    if (lowCat.includes("critical")) { riskLabel = "Critical Risk"; riskColor = "red"; }
    else if (lowCat.includes("high")) { riskLabel = "High Risk"; riskColor = "orange"; }
    else if (lowCat.includes("medium")) { riskLabel = "Medium Risk"; riskColor = "amber"; }
    else if (lowCat.includes("low")) { riskLabel = "Low Risk"; riskColor = "green"; }
    else if (lowCat.includes("manual review")) { riskLabel = "Manual Review"; riskColor = "purple"; }
    else if (lowCat === "recommended") { riskLabel = "Low Risk"; riskColor = "green"; }
    else if (lowCat === "not recommended") { riskLabel = "Critical Risk"; riskColor = "red"; }
    else if (finalScoreValue >= 75) { riskLabel = "Critical Risk"; riskColor = "red"; }
    else if (finalScoreValue >= 51) { riskLabel = "High Risk"; riskColor = "orange"; }
    else if (finalScoreValue >= 26) { riskLabel = "Medium Risk"; riskColor = "amber"; }
    else { riskLabel = "Low Risk"; riskColor = "green"; }

    const lobValue = (() => {
      const v = (selectedCase as any)?.line_of_business ||
          (selectedCase as any)?.lob ||
          (selectedCase as any)?.business_category ||
          (selectedCase as any)?.merchantIndustry ||
          (selectedCase as any)?.keyStats?.lineOfBusiness ||
          "";
      return Array.isArray(v) ? v.join(", ") : String(v ?? "");
    })();

    await generateInvestigationReportPDF(clone, merchantName, lobValue, '', {
      filename: fileName,
      website: (selectedCase as any)?.website || (selectedCase as any)?.merchant?.website || "",
      runDate: format(new Date(), 'dd MMMM yyyy'),
      riskScore: String(finalScoreValue),
      riskLabel,
      riskColor
    });

  }, [selectedCase, riskScoreDatastore]);

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

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {selectedCase && (
        <motion.div variants={itemVariants}>
          <InvPageHeader 
            activeCase={selectedCase as any} 
            onGenerateReport={handleDownloadReport}
          />
        </motion.div>
      )}

      {/* 1. External trust & Presence Section */}
      <motion.div variants={itemVariants}>
        <div>
          <div className="mt-6">
            <div className="mt-0">
              {(() => {
                const Icon = getIconByName("Globe");
                return (
                  <SectionHeaderWithFlags
                    positiveFlags={[]}
                    negativeFlags={[]}
                    neutralFlags={[]}
                    title="Social Media Presence"
                    icon={Icon || undefined}
                    allowCollapse={false}
                  />
                );
              })()}

              <div className="mt-3">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    artifactPanelCollapsed
                      ? "md:grid-cols-4"
                      : "md:grid-cols-3"
                  } gap-4`}
                >
                  {(() => {
                    if (datastoreEntryLoading) {
                      return (
                        <div className="col-span-full">
                          <CustomLoader
                            loading={true}
                            specs={{
                              text: "Loading presence...",
                              type: "spinner",
                              size: "lg",
                            }}
                          />
                        </div>
                      );
                    }

                    const normalizePresence = (
                      v: any
                    ): boolean | "N/A" | undefined => {
                      if (typeof v === "boolean") return v;
                      if (
                        v === null ||
                        typeof v === "undefined"
                      )
                        return undefined;
                      if (typeof v === "number")
                        return v === 1
                          ? true
                          : v === 0
                          ? false
                          : undefined;
                      if (typeof v === "string") {
                        const s = v.trim().toLowerCase();
                        if (
                          s === "true" ||
                          s === "1" ||
                          s === "yes" ||
                          s === "y"
                        )
                          return true;
                        if (
                          s === "false" ||
                          s === "0" ||
                          s === "no" ||
                          s === "n"
                        )
                          return false;
                        if (["na", "n/a", "null"].includes(s))
                          return "N/A";
                        return undefined;
                      }
                      return undefined;
                    };

                    const socialDefs = [
                      {
                        key: "linkedIn",
                        name: "LinkedIn",
                        iconName: "Linkedin",
                      },
                      {
                        key: "instagram",
                        name: "Instagram",
                        iconName: "Instagram",
                      },
                      {
                        key: "facebook",
                        name: "Facebook",
                        iconName: "Facebook",
                      },
                      {
                        key: "youtube",
                        name: "YouTube",
                        iconName: "Youtube",
                      },
                    ];

                    const smData = datastoreEntryData?.data?.data as any;

                    const socialPlatforms = socialDefs.map(
                      (d) => {
                        const extractField = (raw: any, platform: string, fieldNames: string[]) => {
                          if (!raw) return null;
                          for (const f of fieldNames) {
                            if (raw[f] !== undefined && raw[f] !== null) return raw[f];
                            const sd = raw.site_data;
                            if (sd) {
                              if (sd[f] !== undefined && sd[f] !== null) return sd[f];
                              const psd = sd[platform];
                              if (psd) {
                                if (Array.isArray(psd)) {
                                  if (psd[0] && psd[0][f] !== undefined && psd[0][f] !== null)
                                    return psd[0][f];
                                } else if (psd[f] !== undefined && psd[f] !== null) return psd[f];
                              }
                              const flatKey = `${platform}_${f}`;
                              if (sd[flatKey] !== undefined && sd[flatKey] !== null)
                                return sd[flatKey];
                            }
                            if (raw.raw_apify && raw.raw_apify[f] !== undefined && raw.raw_apify[f] !== null) return raw.raw_apify[f];
                            if (raw.raw_amplify && raw.raw_amplify[f] !== undefined && raw.raw_amplify[f] !== null) return raw.raw_amplify[f];
                          }
                          return null;
                        };

                        const getRawAccounts = () => {
                          if (!smData?.platforms) return [];
                          const platformKey = d.name.toLowerCase();
                          const platformData = smData.platforms[platformKey];
                          
                          if (!platformData || platformData.not_found) return [];
                          
                          const accountsList = Array.isArray(platformData) ? platformData : [platformData];
                          return accountsList.filter((a: any) => {
                            const hasWebsiteSource = String(a.source || "").toLowerCase() === "website" || 
                                                   String(a.site_data?.source || "").toLowerCase() === "website";
                            if (hasWebsiteSource) return true;
                            return a.matched === true || a.matched === "true";
                          });
                        };

                        const rawAccounts = getRawAccounts();

                        const accounts = rawAccounts.map(raw => {
                          const platform = d.name.toLowerCase();
                          return {
                            url: (() => {
                              let l = extractField(raw, platform, ["url", "link", `${platform}_url`]);
                              if (platform.includes("facebook") && l && typeof l === "string" && l.toLowerCase().includes("facebook.com")) {
                                if (l.includes("/photos/")) l = l.split("/photos/")[0] + "/";
                                else if (l.includes("/posts/")) l = l.split("/posts/")[0] + "/";
                              }
                              return l;
                            })(),
                            source: extractField(raw, platform, ["source"]),
                            followers: extractField(raw, platform, ["followers", "followerCount", "followersCount"]) ?? 
                                       raw.raw_apify?.followersCount ?? raw.raw_apify?.followers ?? 
                                       raw.raw_amplify?.followersCount ?? raw.raw_amplify?.followers ??
                                       raw.raw_apify?.followerCount ?? raw.raw_amplify?.followerCount,
                            employees: extractField(raw, platform, ["number_of_employees", "employeeCount", "employee_count"]) ?? (platform === "linkedin" ? (raw.raw_amplify?.employeeCount ?? raw.raw_apify?.employeeCount) : null),
                            connections: extractField(raw, platform, ["followers", "connections", "followerCount", "connectionCount"]),
                            subscribers: extractField(raw, platform, ["number_of_subscribers", "followers", "subscriberCount", "subscribersCount"]) ?? raw.raw_apify?.subscriberCount ?? raw.raw_apify?.subscribers ?? raw.raw_amplify?.subscriberCount ?? raw.raw_amplify?.subscribers,
                            posts: extractField(raw, platform, ["number_of_posts", "total_videos_or_reels", "postCount", "postsCount"]) ?? 
                                   raw.raw_apify?.postsCount ?? raw.raw_amplify?.postsCount ??
                                   raw.raw_apify?.postCount ?? raw.raw_amplify?.postCount ??
                                   (platform === "youtube" ? (raw.raw_apify?.aboutChannelInfo?.channelTotalVideos ?? raw.raw_amplify?.aboutChannelInfo?.channelTotalVideos) : null),
                            details: raw.bio ?? extractField(raw, platform, ["bio", "description", "biography"]) ?? raw.raw_apify?.biography ?? raw.raw_amplify?.biography,
                            following: platform === "instagram" ? (raw.raw_amplify?.followsCount ?? raw.raw_apify?.followsCount ?? raw.raw_amplify?.followingCount ?? raw.raw_apify?.followingCount) : undefined,
                            status: "Active"
                          };
                        });

                        const firstAccount = accounts[0] || {};
                        const status = accounts.length > 0 ? "Active" : "Not Found";

                        return {
                          type: "social",
                          iconName: d.iconName,
                          name: d.name,
                          status,
                          accounts,
                          followers: firstAccount.followers,
                          posts: firstAccount.posts,
                          url: firstAccount.url,
                          source: firstAccount.source,
                          employees: firstAccount.employees,
                          connections: firstAccount.connections,
                          subscribers: firstAccount.subscribers,
                          details: firstAccount.details,
                          following: firstAccount.following,
                        } as any;
                      }
                    );

                    const marketSignals: any = (smData as any)?.marketplace_signals || {};
                    const marketplaceOverview: any[] = [];

                    const combined = [
                      ...socialPlatforms,
                      ...marketplaceOverview.map((m: any) => {
                        const name = m.name;
                        const lname = name.toLowerCase();
                        const presence =
                          marketSignals[`${name}_Presence`] || marketSignals[`${lname}_Presence`];
                        const rating =
                          marketSignals[`${name}_rating`] ?? marketSignals[`${lname}_rating`];
                        const listing =
                          marketSignals[`${name}_listing`] ?? marketSignals[`${lname}_listing`];
                        const verified =
                          marketSignals[
                            `${name}_verified_badge`
                          ] ?? marketSignals[`${lname}_verified_badge`];
                        const verified_link =
                          marketSignals[
                            `${name}_verified_link`
                          ] ?? marketSignals[`${lname}_verified_link`];
                        const rating_count =
                          marketSignals[`${name}_rating_count`] ?? 
                          marketSignals[`${lname}_rating_count`] ??
                          marketSignals[`${name}_google_rating_count`] ??
                          marketSignals[`google_rating_count`];

                        const source = marketSignals[`${name}_source`] || marketSignals[`${lname}_source`];

                        const isPresent =
                          presence &&
                          normalizePresence(presence) === true;

                        return {
                          ...m,
                          status: isPresent
                            ? "Active"
                            : "Not Found",
                          source: source,
                          raw: {
                            rating,
                            rating_count,
                            listing,
                            verified,
                            verified_link,
                            presence,
                            source,
                          },
                        };
                      }),
                    ];

                    return combined.map(
                      (p: any, idx: number) => {
                        const actualAccountCount = p.type === 'social' ? (p.accounts?.length || 0) : (p.status === "Active" ? 1 : 0);
                        return (
                          <div
                            key={`${p.name}-${idx}`}
                            className="w-full"
                            onClick={() =>
                              p && p.type === "marketplace"
                                ? openMarketplaceArtifact(p.name)
                                : openSocialMediaArtifact(p.name, 0)
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" ||
                                e.key === " "
                              ) {
                                e.preventDefault();
                                p && p.type === "marketplace"
                                  ? openMarketplaceArtifact(
                                      p.name
                                    )
                                  : openSocialMediaArtifact(
                                      p.name,
                                      0
                                    );
                              }
                            }}
                          >
                            <SocialMediaCard
                              iconName={p.iconName}
                              name={p.name}
                              status={p.status}
                              accounts={p.accounts}
                              accountCount={actualAccountCount}
                              followers={p.followers}
                              posts={p.posts}
                              url={p.url}
                              employees={p.employees}
                              connections={p.connections}
                              subscribers={p.subscribers}
                              source={p.source}
                              listing={p.raw?.listing}
                              rating={p.raw?.rating}
                              numRatings={p.raw?.rating_count}
                              verifiedLink={p.raw?.verified_link}
                              onMoreDetails={(index?: number) =>
                                p && p.type === "marketplace"
                                  ? openMarketplaceArtifact(
                                      p.name
                                    )
                                  : openSocialMediaArtifact(
                                      p.name,
                                      index ?? 0
                                    )
                              }
                            />
                          </div>
                        );
                      }
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Scam Intelligence Section */}
      <motion.div variants={itemVariants}>
        <div className="mt-6">
          {(() => {
            const Icon = getIconByName("Shield");
            return (
              <SectionHeaderWithFlags
                positiveFlags={[]}
                negativeFlags={[]}
                neutralFlags={[]}
                title="Scam Intelligence"
                icon={Icon || undefined}
                allowCollapse={false}
              />
            );
          })()}

          <div className="mt-3">
            {(() => {
              const scamDetected = scamDetectedOverall;
              const Icon =
                getIconByName("Shield") ||
                getIconByName("ShieldCheck") ||
                getIconByName("Shield");
              const bannerBorder = scamDetected
                ? "border-red-200"
                : "border-green-200";
              const bannerBg = scamDetected
                ? "bg-red-50"
                : "bg-green-50";
              const textColor = scamDetected
                ? "text-red-800"
                : "text-green-800";
              const iconBg = scamDetected
                ? "bg-red-600"
                : "bg-green-600";

              return (
                <button
                  type="button"
                  onClick={openRF013Artifact}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${bannerBorder} ${bannerBg} w-full text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1`}
                >
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${iconBg} text-white`}
                  >
                    {Icon ? (
                      <Icon className="h-5 w-5" />
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`text-lg font-semibold ${textColor}`}
                    >
                      {scamDetected
                        ? "Scam Detected"
                        : "No Scam Detected"}
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 ${textColor}`}
                    />
                  </div>
                </button>
              );
            })()}

            <div className="mt-4">
              <div className="flex items-center gap-3 py-0">
                <span className="text-md font-semibold text-gray-500 flex items-center gap-3">
                  Monitored Dimensions
                  <span className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-600 text-white">
                        {(() => {
                          const MinusIcon =
                            getIconByName("Minus") ||
                            getIconByName("Dash");
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
                              <line
                                x1="5"
                                y1="12"
                                x2="19"
                                y2="12"
                                stroke="currentColor"
                              />
                            </svg>
                          );
                        })()}
                      </div>
                      <span className="text-sm text-green-600">
                        No Risk Observed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white">
                        {(() => {
                          const AlertIcon =
                            getIconByName(
                              "AlertTriangle"
                            ) || getIconByName("Triangle");
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
                              <line
                                x1="12"
                                y1="8"
                                x2="12"
                                y2="13"
                                stroke="currentColor"
                              />
                              <circle
                                cx="12"
                                cy="16"
                                r="1"
                                fill="currentColor"
                              />
                            </svg>
                          );
                        })()}
                      </div>
                      <span className="text-sm text-red-600">
                        Potential Risk Identified
                      </span>
                    </div>
                  </span>
                </span>
              </div>

              <div className="mt-3">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
                    artifactPanelCollapsed
                      ? "lg:grid-cols-4 xl:grid-cols-4"
                      : "lg:grid-cols-3 xl:grid-cols-3"
                  } gap-4`}
                >
                  {monitoredDimensions.map(
                    (item: any, idx: number) => (
                      <div
                        key={`md-${idx}`}
                        className="w-full text-left"
                      >
                        <WebsiteQualityCard
                          name={item.name}
                          status={item.status}
                          invert={true}
                          noData={!!item.noData}
                          hideChevron={true}
                          clickable={false}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full mb-0">
              <div className="bg-white rounded-md shadow-sm p-4 h-full">
                <div className="flex items-center gap-3">
                  <span className="text-md font-semibold text-gray-500">
                    External Insights
                  </span>
                </div>

                <div className="mt-4">
                  {(() => {
                    if (redFlagsLoading) {
                      return (
                        <div className="py-6">
                          <CustomLoader
                            loading={true}
                            specs={{
                              type: "spinner",
                              size: "sm",
                              color: "blue",
                              text: "Loading external insights...",
                            }}
                          />
                        </div>
                      );
                    }

                    const rfData = Array.isArray(redFlags)
                      ? redFlags.find(
                          (r: any) =>
                            String(
                              r?.code || ""
                            ).toUpperCase() === "RF013"
                        )
                      : null;

                    const extra =
                      rfData?.extra_details ||
                      rfData?.extraDetails ||
                      rfData ||
                      null;

                    let insights: any[] | null = null;
                    if (extra) {
                      if (
                        Array.isArray(extra.external_insights)
                      )
                        insights = extra.external_insights;
                      else if (
                        Array.isArray(extra.externalInsights)
                      )
                        insights = extra.externalInsights;
                      else if (
                        Array.isArray(
                          extra.external_insights_list
                        )
                      )
                        insights =
                          extra.external_insights_list;
                      else if (
                        extra.external_insights_output &&
                        Array.isArray(
                          extra.external_insights_output
                            .sources
                        )
                      )
                        insights =
                          extra.external_insights_output
                            .sources;
                      else if (
                        extra.externalInsightsOutput &&
                        Array.isArray(
                          extra.externalInsightsOutput.sources
                        )
                      )
                        insights =
                          extra.externalInsightsOutput
                            .sources;
                    }

                    if (
                      !insights &&
                      rfData &&
                      Array.isArray(
                        (rfData as any).external_insights
                      )
                    )
                      insights = (rfData as any)
                        .external_insights;
                      

                    if (!insights) insights = [];

                    if (riskAnalysisData && Array.isArray(riskAnalysisData.incidents)) {
                      riskAnalysisData.incidents.forEach((inc: any) => {
                        const title = inc.incident_title || inc.title;
                        const exists = insights!.some(
                          (existing) =>
                            (existing.title ||
                              existing.headline) === title
                        );
                        if (!exists) {
                          insights!.push({
                            title: title,
                            link: inc.link || inc.url,
                            source: "News",
                            description: inc.summary || inc.content,
                            summary: inc.summary || inc.content,
                          });
                        }
                      });
                    }

                    const reviews =
                      reviewsAnalysisData?.individual_reviews ||
                      reviewsAnalysisData?.data?.individual_reviews ||
                      reviewsAnalysisData?.data?.reviews ||
                      reviewsAnalysisData?.reviews ||
                      [];

                    if (Array.isArray(reviews)) {
                      reviews.forEach((rev: any) => {
                        const title = rev.review_title || rev.title;
                        const exists = insights!.some(
                          (existing) =>
                            (existing.title ||
                              existing.headline) === title
                        );
                        if (!exists) {
                          insights!.push({
                            title: title,
                            link: rev.url || rev.link,
                            source: rev.source_website
                              ? `${rev.source_website} Review`
                              : "Review",
                            description:
                              rev.review_summary || rev.review_content,
                            summary:
                              rev.review_summary || rev.review_content,
                          });
                        }
                      });
                    }

                    if (
                      !Array.isArray(insights) ||
                      insights.length === 0
                    ) {
                      return (
                        <div className="text-sm text-gray-500">
                          No external insights available.
                        </div>
                      );
                    }

                    const renderCard = (
                      it: any,
                      key: string
                    ) => {
                      const title =
                        it.title ||
                        it.headline ||
                        it.name ||
                        "Untitled";
                      const url =
                        it.link ||
                        it.url ||
                        it.source_url ||
                        null;
                      const source = (it.source ||
                        it.type ||
                        it.platform ||
                        "") as string;
                      const sourceLabel =
                        String(source || "").length > 0
                          ? String(source)
                              .charAt(0)
                              .toUpperCase() +
                            String(source).slice(1)
                          : "Source";

                      const description: string = (() => {
                        try {
                          const s = String(
                            source || ""
                          ).toLowerCase();

                          if (
                            s.includes("news") &&
                            riskAnalysisData
                          ) {
                            const incidents =
                              riskAnalysisData.incidents ||
                              riskAnalysisData.data
                                ?.incidents ||
                              [];
                            if (Array.isArray(incidents)) {
                              const found = incidents.find(
                                (inc: any) => {
                                  const incTitle = String(
                                    inc.incident_title ??
                                      inc.title ??
                                      ""
                                  ).trim();
                                  if (!incTitle) return false;
                                  const t = String(
                                    title || ""
                                  ).trim();
                                  return (
                                    incTitle === t ||
                                    incTitle.includes(t) ||
                                    t.includes(incTitle)
                                  );
                                }
                              );
                              if (found)
                                return String(
                                  found.summary ??
                                    found.content ??
                                    it.description ??
                                    it.summary ??
                                    ""
                                );
                            }

                            if (riskAnalysisData.summary)
                              return String(
                                riskAnalysisData.summary
                              );
                          }

                          if (
                            (s.includes("review") ||
                              s.includes("reviews")) &&
                            reviewsAnalysisData
                          ) {
                            const reviews =
                              reviewsAnalysisData.individual_reviews ||
                              reviewsAnalysisData.data
                                ?.individual_reviews ||
                              reviewsAnalysisData.data
                                ?.reviews ||
                              reviewsAnalysisData.reviews ||
                              [];
                            if (Array.isArray(reviews)) {
                              const found = reviews.find(
                                (rv: any) => {
                                  const rvTitle = String(
                                    rv.review_title ??
                                      rv.title ??
                                      ""
                                  ).trim();
                                  if (!rvTitle) return false;
                                  const t = String(
                                    title || ""
                                  ).trim();
                                  return (
                                    rvTitle === t ||
                                    rvTitle.includes(t) ||
                                    t.includes(rvTitle)
                                  );
                                }
                              );
                              if (found)
                                return String(
                                  found.review_summary ??
                                    found.summary ??
                                    found.review_content ??
                                    it.description ??
                                    ""
                                );
                            }
                          }

                          return String(
                            it.description ??
                              it.summary ??
                              it.note ??
                              ""
                          );
                        } catch (e) {
                          return String(
                            it.description ?? it.summary ?? ""
                          );
                        }
                      })();

                      return (
                        <div
                          key={key}
                          className="border border-gray-100 rounded-md p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="text-md font-semibold text-blue-600 truncate">
                                  {title}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <BubbleTag
                                text={sourceLabel}
                                color={
                                  String(
                                    sourceLabel
                                  ).toLowerCase() === "news"
                                    ? "blue"
                                    : "purple"
                                }
                              />
                            </div>
                          </div>

                          <div className="mt-3 w-full">
                            <div className="bg-gray-50 border border-gray-100 rounded-md p-3 w-full">
                              {description ? (
                                <div className="text-sm text-gray-600 line-clamp-3">
                                  {description}
                                </div>
                              ) : null}

                              {url ? (
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                                  {(() => {
                                    const LinkIcon =
                                      getIconByName(
                                        "ExternalLink"
                                      );
                                    return LinkIcon ? (
                                      <LinkIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    ) : null;
                                  })()}
                                  <div className="flex-1 min-w-0">
                                    <TruncatableText
                                      text={String(url)}
                                      textColorClass="text-blue-600"
                                    />
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    const newsInsights: Array<{
                      item: any;
                      idx: number;
                    }> = [];
                    const reviewInsights: Array<{
                      item: any;
                      idx: number;
                    }> = [];
                    insights.forEach(
                      (it: any, idx: number) => {
                        const source = (it.source ||
                          it.type ||
                          it.platform ||
                          "") as string;
                        const s = String(
                          source || ""
                        ).toLowerCase();
                        if (s.includes("review")) {
                          reviewInsights.push({
                            item: it,
                            idx,
                          });
                        } else {
                          newsInsights.push({
                            item: it,
                            idx,
                          });
                        }
                      }
                    );

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-100 rounded-md p-4 space-y-3 max-h-[340px] overflow-y-auto overflow-x-hidden">
                          {reviewInsights.length > 0 ? (
                            reviewInsights.map(
                              ({ item, idx }) =>
                                renderCard(
                                  item,
                                  `review-${idx}`
                                )
                            )
                          ) : (
                            <div className="flex items-center justify-center h-full min-h-[200px]">
                              <span className="text-base text-gray-500">
                                No Review Insights Available
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="border border-gray-100 rounded-md p-4 space-y-3 max-h-[340px] overflow-y-auto overflow-x-hidden">
                          {newsInsights.length > 0 ? (
                            newsInsights.map(
                              ({ item, idx }) =>
                                renderCard(
                                  item,
                                  `news-${idx}`
                                )
                            )
                          ) : (
                            <div className="flex items-center justify-center h-full min-h-[200px]">
                              <span className="text-base text-gray-500">
                                No News Insights Available
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. VPA Analysis Section */}
      <motion.div variants={itemVariants}>
        <SectionHeaderWithFlags
          title="VPA Analysis"
          icon={Activity}
          positiveFlags={[]}
          negativeFlags={[]}
          mildNegativeFlags={[]}
          neutralFlags={[]}
          mildPositiveFlags={[]}
          extremeNegativeFlags={[]}
          allowCollapse={false}
          iconColorClass="text-blue-600"
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="p-12 text-center bg-white border border-dashed border-gray-300 rounded-3xl"
      >
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-700">
          No VPA Analysis Available
        </h3>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
          We couldn't find any VPA analysis data for this merchant case. This
          might be because the analysis is still in progress or no VPAs were
          identified.
        </p>
      </motion.div>

      {/* Hidden container for PDF Template */}
      <div className="hidden">
        <div ref={pdfTemplateRef}>
          <InvestigationVPAAnalysisPDFTemplate
            merchantName={(selectedCase as any)?.merchant?.name || (selectedCase as any)?.merchant_name || 'Merchant'}
            runDate={format(new Date(), 'dd MMMM yyyy')}
            website={(selectedCase as any)?.website || (selectedCase as any)?.merchant?.website || ""}
            hasData={false}
            socialMediaPlatforms={getSocialMediaPlatforms(datastoreEntryData?.data?.data)}
            scamIntelligenceData={scamIntelligenceData}
            monitoredDimensions={monitoredDimensions}
            riskAnalysisData={riskAnalysisData}
            reviewsAnalysisData={reviewsAnalysisData}
            scamDetectedOverall={scamDetectedOverall}
            redFlags={redFlags}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default InvVPAAnalysisTab;
