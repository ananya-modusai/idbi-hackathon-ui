"use client";

import React, { FC, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import InvPageHeader from "../Components/InvPageHeader";
import {
  fetchSteps,
  fetchDatastoreEntry,
  DatastoreEntryApiResponse,
  fetchDecisioning,
  fetchMerchantWebAnalysis,
  MerchantWebAnalysisResponse,
  fetchScamIntelligence,
  fetchReverseImageSearch,
} from "../../../services/caseServices";
import CustomLoader from "@/components/custom/CustomLoader";
import ReverseImageSearchSection from "./components/ReverseImageSearchSection";
import { getTextColorClass } from "@/components/custom/CustomColorScheme";
import {
  valueSentimentIconMap,
  getIconByName,
} from "@/components/custom/CustomIconScheme";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  WebsiteAnalysisKeyValue,
  WebsiteAnalysisValueSentiment,
} from "../Sample Data/InvCasesSampleData";
import {
  getFlagInfo,
} from "../Sample Data/InvDecisioningSampleData";
import { EmptyState } from "@/app/pages/Investigation/Components/EmptyState";

import { CustomTableView } from "@/components/custom/CustomTableView";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import SectionHeaderWithRedFlags from "@/components/custom/SectionHeaderWithRedFlags";
// import RiskNewsCard from "@/components/custom/RiskNewsCard";

// Import utilities and components
import {
  transformToKeyValue,
  transformSocialMediaData,
  transformNavigationFlowData,
  transformContactData,
  transformPolicyData,
  transformContentAnalysisData,
  formatFieldName,
  formatProductData,
  capitalizeWords,
} from "./utils/webAnalysisTransformers";
import { getIconForField } from "./utils/webAnalysisHelpers";
import { TruncatableText } from "./components/TruncatableText";
import { FrequentWordsDisplay } from "./components/FrequentWordsDisplay";
import WebsiteQualityCard from "@/components/custom/WebsiteQualityCard";
import WebsiteQualityArtifact from "@/components/custom/WebsiteQualityArtifact";
import { RiskAssessmentParagraph } from "@/components/custom/RiskAssessmentParagraph";
import { BubbleTag } from "@/components/custom/BubbleTag";
import {
  getWebsiteIntegrity,
  getUrlConsistency,
} from "./components/merchantOverviewSampleData";
import { trafficEngagementSampleData } from "./components/trafficEngagementSampleData";
import { InvFlagDetailsArtifact } from "../Components/InvFlagDetailsArtifact";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import { KeyMetrics } from "@/components/custom/KeyMetrics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createRoot } from 'react-dom/client';
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { ArtifactSectionCollapsible } from "@/components/custom/ArtifactSectionCollapsible";
import { generateInvestigationReportPDF, preparePDFElement } from '../Investigation-Report/utils/pdfUtils';
import InvestigationWebAnalysisPDFTemplate from '../Investigation-Report/WebAnalysisTab/InvestigationWebAnalysisPDFTemplate';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


interface InvWebAnalysisTabProps {
  merchantId?: string;
  caseId?: string;
}

const InvWebAnalysisTab: FC<InvWebAnalysisTabProps> = ({
  merchantId,
  caseId,
}) => {
  const { selectedCase } = useInvestigationCaseStore();
  const showValueIcons = false;

  // Artifact panel collapsed state controls grid column counts for WebsiteQualityCard lists
  const artifactPanelCollapsed = useArtifactStore((s) => s.isCollapsed);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);


  
  // Navigation Flow (NAVIGATION_FLOW) datastore entry: integrates Navigation Flow and URL Consistency
  const [navFlowDatastore, setNavFlowDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [navFlowLoading, setNavFlowLoading] = useState(false);

  // CONTACT_DATA datastore entry
  const [contactDatastore, setContactDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  // RISK_SCORE datastore entry
  const [riskScoreDatastore, setRiskScoreDatastore] = useState<DatastoreEntryApiResponse | null>(null);


  // Product Analysis (PRODUCT_ANALYSIS) datastore entry
  const [productAnalysisDatastore, setProductAnalysisDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [productAnalysisLoading, setProductAnalysisLoading] = useState(false);

  // Domain Info (DOMAIN_INFO) datastore entry
  const [domainInfoDatastore, setDomainInfoDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [domainInfoLoading, setDomainInfoLoading] = useState(false);

  // Malware Detection (MALWARE_DETECTION) datastore entry: provides ssl, dns, url, malware fields
  const [malwareDatastore, setMalwareDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [malwareDetectionLoading, setMalwareDetectionLoading] = useState(false);

  // VISION_PIPELINE datastore entry
  const [visionDatastore, setVisionDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);

  // Merchant Web Analysis (new API): /merchant_details/web-analysis/{run_id}
  const [merchantWebAnalysis, setMerchantWebAnalysis] = useState<MerchantWebAnalysisResponse | null>(null);
  const [merchantWebAnalysisLoading, setMerchantWebAnalysisLoading] = useState(false);
  
  // Scam Intelligence (new API): /merchant_details/scam-intelligence/{run_id}
  const [scamIntelligence, setScamIntelligence] = useState<any | null>(null);
  const [scamIntelligenceLoading, setScamIntelligenceLoading] = useState(false);

  const scamDetectedOverall = useMemo(() => {
    if (!scamIntelligence) return false;
    const sd = scamIntelligence.scam_detected ?? scamIntelligence.scamDetected ?? scamIntelligence.data?.scam_detected ?? scamIntelligence.data?.scamDetected;
    if (typeof sd === "boolean") return sd;
    if (typeof sd === "string") return ["yes", "true"].includes(sd.toLowerCase());
    return sd === 1;
  }, [scamIntelligence]);

  // Reverse Image Search states
  const [reverseImageSearchData, setReverseImageSearchData] = useState<any | null>(null);
  const [reverseImageSearchLoading, setReverseImageSearchLoading] = useState(false);

  // State for maximizing website snapshots
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

  const [selectedNavigationLinkIndex, setSelectedNavigationLinkIndex] =
    useState<number>(0);

  const [isIntegrityMetricsExpanded, setIsIntegrityMetricsExpanded] =
    useState<boolean>(false);
  const [isSslMetricsExpanded, setIsSslMetricsExpanded] =
    useState<boolean>(false);
  const [isDnsMetricsExpanded, setIsDnsMetricsExpanded] =
    useState<boolean>(false);
  const [isUrlMetricsExpanded, setIsUrlMetricsExpanded] =
    useState<boolean>(false);
  const [isMalwareMetricsExpanded, setIsMalwareMetricsExpanded] =
    useState<boolean>(false);
  const [isMccReasoningExpanded, setIsMccReasoningExpanded] =
    useState<boolean>(false);
  // Product Analysis toggles
  const [selectedProductToggleOption, setSelectedProductToggleOption] =
    useState<string>("All Products");

  // Merge default data with MALWARE_DETECTION datastore fields (ssl, dns, url, malware).
  // Falls back to sample data when MALWARE_DETECTION has no data yet.
  // Using useMemo avoids re-triggering network requests when malwareDatastore changes.
  const websiteDataJson = useMemo(() => {
    const rawBase = {};
    const malwareData = (malwareDatastore?.data as any)?.data;
    const hasMalwareData = malwareData && typeof malwareData === 'object' && Object.keys(malwareData).length > 0;

    if (hasMalwareData) {
      return { ...rawBase, ...malwareData };
    }

    // Fallback: use sample data until backend populates MALWARE_DETECTION
    try {
      const sampleData = require("../../../../plakayorum.com.json");
      return { ...rawBase, ...sampleData };
    } catch (e) {
      return Object.keys(rawBase).length > 0 ? rawBase : null;
    }
  }, [malwareDatastore]);

  // Risk and Reviews analysis data will be sourced from scam-intelligence.



  // Transform website data into sections
  const websiteStatusData = useMemo(() => {
    // Prefer DOMAIN_INFO datastore data
    const datastoreData = (domainInfoDatastore?.data as any)?.data;
    if (datastoreData?.website_status_and_certificate) {
      return transformToKeyValue(
        datastoreData.website_status_and_certificate,
        "",
        "Globe",
        "blue",
        "info"
      );
    }
    if (!websiteDataJson) return [];
    return transformToKeyValue(
      websiteDataJson.website_status,
      "",
      "Globe",
      "blue",
      "info"
    );
  }, [websiteDataJson, domainInfoDatastore]);

  const domainInfoData = useMemo(() => {
    // Prefer DOMAIN_INFO datastore data
    const datastoreData = (domainInfoDatastore?.data as any)?.data;
    if (datastoreData?.location_data) {
      return transformToKeyValue(
        datastoreData.location_data,
        "",
        "Server",
        "blue",
        "info"
      );
    }
    if (!websiteDataJson) return [];
    return transformToKeyValue(
      websiteDataJson.domain_info,
      "",
      "Server",
      "blue",
      "info"
    );
  }, [websiteDataJson, domainInfoDatastore]);

  const aboutData = useMemo(() => {
    if (!websiteDataJson) return [];
    return transformToKeyValue(
      websiteDataJson.about_data,
      "",
      "Info",
      "blue",
      "info"
    );
  }, [websiteDataJson]);

  const socialMediaData = useMemo(() => {
    if (!websiteDataJson) return [];
    return transformSocialMediaData(websiteDataJson.social_media_data);
  }, [websiteDataJson]);

  const navigationFlowData = useMemo(() => {
    // Prefer NAVIGATION_FLOW step data from datastore when available
    const navFlowData = (navFlowDatastore?.data as any)?.data;
    if (navFlowData) {
      return transformNavigationFlowData(navFlowData);
    }
    // Fallback to websiteDataJson
    if (!websiteDataJson) return [];
    return transformNavigationFlowData(websiteDataJson.navigation_flow);
  }, [websiteDataJson, navFlowDatastore]);

  const contactData = useMemo(() => {
    // Prefer CONTACT_DATA step data from datastore
    const datastoreData = (contactDatastore?.data as any)?.data;
    if (datastoreData) {
      return transformContactData(datastoreData);
    }
    if (!websiteDataJson) return [];
    return transformContactData(websiteDataJson.contact_data);
  }, [websiteDataJson, contactDatastore]);

  const policyData = useMemo(() => {
    if (!websiteDataJson) return [];
    return transformPolicyData(websiteDataJson.policy_data);
  }, [websiteDataJson]);

  // Get navigation links for product analysis
  const navigationLinks = useMemo(() => {
    // Prioritize PRODUCT_ANALYSIS datastore data
    const datastoreData = (productAnalysisDatastore?.data as any)?.data;
    if (datastoreData?.products && Array.isArray(datastoreData.products) && datastoreData.products.length > 0) {
      return [
        {
          index: 0,
          linkName: "All Products",
          data: {
            top_10_products: datastoreData.products,
          },
        },
      ];
    }

    if (!websiteDataJson) return [];
    if (
      websiteDataJson.product_analysis?.navigation_links &&
      Array.isArray(websiteDataJson.product_analysis.navigation_links)
    ) {
      return websiteDataJson.product_analysis.navigation_links.map(
        (link: any, index: number) => ({
          index,
          linkName: link.link_name || `Navigation Link ${index + 1}`,
          data: link,
        })
      );
    }
    return [];
  }, [websiteDataJson, productAnalysisDatastore]);

  // Update selected navigation link index
  useEffect(() => {
    if (navigationLinks.length > 0) {
      if (
        selectedNavigationLinkIndex >= navigationLinks.length ||
        selectedNavigationLinkIndex < 0
      ) {
        setSelectedNavigationLinkIndex(0);
      }
    }
  }, [navigationLinks, selectedNavigationLinkIndex]);

  const selectedNavigationLinkData = useMemo(() => {
    if (navigationLinks.length === 0) return null;
    return navigationLinks[selectedNavigationLinkIndex]?.data || null;
  }, [navigationLinks, selectedNavigationLinkIndex]);

  // Red flags fetched from the API (used to source RF009 reasonings)
  const [redFlags, setRedFlags] = useState<any[] | null>(null);

  // Helper to retrieve and parse decisioning red flags
  const getFlagDetails = useCallback((code: string) => {
    if (!redFlags || !Array.isArray(redFlags)) return null;
    const flag = redFlags.find((f: any) => String(f?.code || "").toUpperCase() === code.toUpperCase());
    if (!flag) return null;

    const source = flag.llm || flag.raw?.llm || flag;
    const isTriggered = (() => {
      const v = source.overall_triggered ?? source.overallTriggered ?? flag.overall_triggered ?? flag.overallTriggered ?? flag.triggered;
      if (typeof v === "boolean") return v;
      if (typeof v === "string") return v.toLowerCase() === "yes" || v.toLowerCase() === "true" || v.toLowerCase() === "triggered";
      if (typeof v === "number") return v === 1;
      return false;
    })();

    const reasoning = source.explanation || source.overall_reasoning || source.overallReasoning || source.reasoning || flag.overall_reasoning || flag.reasoning || "";
    
    return {
      flag,
      isTriggered,
      reasoning,
    };
  }, [redFlags]);

  // Handler to open the red flag details artifact as in the Decisioning tab
  const handleOpenFlagDetailsArtifact = useCallback((flagCode: string) => {
    const details = getFlagDetails(flagCode);
    const flagData = details?.flag;
    const flagInfo = getFlagInfo(flagCode);

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

    const artifactStore = useArtifactStore.getState();
    const artifactId = `flag-${flagCode}-${Date.now()}`;

    // Normalize shape into the shape expected by InvFlagDetailsArtifact
    const normalizedFlagData = flagData
      ? {
          ...(flagData as any),
          subrules: (flagData as any).subrules ?? [],
          overallReasoning: (flagData as any).overallReasoning ?? details.reasoning ?? "",
          overallTriggered: Boolean(details.isTriggered),
        }
      : {
          code: flagCode,
          subrules: [],
          overallReasoning: "Flag data not available for this case.",
          overallTriggered: false,
          name: flagInfo?.name || flagCode,
          severity: flagInfo?.severity || "High Risk",
          icon: undefined,
          themeColor: "gray",
        };

    artifactStore.addTab({
      id: artifactId,
      title: `${mapDisplayCode(flagCode)}: ${
        flagInfo?.name || mapDisplayCode(flagCode)
      }`,
      renderArtifact: () => {
        return (
          <InvFlagDetailsArtifact
            lastUpdatedAt={new Date()}
            flagData={normalizedFlagData as any}
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
  }, [getFlagDetails]);

  // Website Analysis (RF012) datastore entry
  const [webAnalysisDatastore, setWebAnalysisDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [webAnalysisLoading, setWebAnalysisLoading] = useState(false);

  // WEBSITE_MCC datastore entry
  const [websiteMccDatastore, setWebsiteMccDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [websiteMccLoading, setWebsiteMccLoading] = useState(false);

  // Reviews analysis (new API): /api/v1/reviews-analysis/cases/{case_id}
  const [reviewsAnalysisData, setReviewsAnalysisData] = useState<any | null>(
    null
  );

  // Risk & News analysis: /api/v1/risk-analysis/cases/{case_id}
  const [riskAnalysisData, setRiskAnalysisData] = useState<any | null>(null);

  // Normalize risk & news data for UI (prefer dedicated risk-analysis API)
  const riskNewsData = useMemo(() => {
    // If we have riskAnalysisData (from new API), map it to RiskNewsCard shape
    try {
      const raw = riskAnalysisData ?? null;
      if (raw && (raw.summary || raw.incidents)) {
        const summaryArr = raw.summary
          ? [
              {
                summary: String(raw.summary),
                sentiment: raw.sentiment ? String(raw.sentiment) : undefined,
              },
            ]
          : [];

        const incidents = Array.isArray(raw.incidents)
          ? raw.incidents.map((inc: any) => ({
              title: inc.incident_title ?? inc.title ?? undefined,
              summary: inc.summary ?? undefined,
              content: inc.content ?? undefined,
              time: inc.time_of_upload ?? inc.time ?? undefined,
              link: inc.link ?? undefined,
            }))
          : [];

        if (summaryArr.length > 0 || incidents.length > 0) {
          return { risk_summary: summaryArr, incidents };
        }
      }

      // Fallback to websiteDataJson shapes used previously
      return (
        websiteDataJson?.risk_and_news ??
        websiteDataJson?.digital_information?.risk_and_news ?? {
          risk_summary: [],
          incidents: [],
        }
      );
    } catch (e) {
      return (
        websiteDataJson?.risk_and_news ??
        websiteDataJson?.digital_information?.risk_and_news ?? {
          risk_summary: [],
          incidents: [],
        }
      );
    }
  }, [riskAnalysisData, websiteDataJson]);

  // Output-format API response (used to drive Website Quality Checklist statuses)
  const [outputFormatData, setOutputFormatData] = useState<any | null>(null);
  const [outputFormatLoading, setOutputFormatLoading] = useState(false);

  // Fetch red flags via Decisioning API (replaces deprecated fetchRedFlags)
  useEffect(() => {
    let mounted = true;
    const id = caseId || selectedCase?.caseId;
    if (!id) {
      setRedFlags(null);
      return;
    }

    fetchDecisioning(id)
      .then((res: any) => {
        if (!mounted) return;
        const flags = res?.data?.flags && Array.isArray(res.data.flags) ? res.data.flags : [];
        setRedFlags(flags);
      })
      .catch((err: any) => {
        if (!mounted) return;
        console.error("[InvWebAnalysisTab] fetchDecisioning error:", err);
        setRedFlags(null);
      });

    return () => {
      mounted = false;
    };
  }, [caseId, selectedCase?.caseId]);

  // Output-format API has been removed; clear state immediately.
  useEffect(() => {
    setOutputFormatData(null);
  }, [(selectedCase as any)?.externalMerchantId]);

  useEffect(() => {
    let cancelled = false;
    const runId = caseId || (selectedCase as any)?.caseId;
    if (!runId) {
      setWebAnalysisDatastore(null);
      setNavFlowDatastore(null);
      setContactDatastore(null);
      setProductAnalysisDatastore(null);
      setDomainInfoDatastore(null);
      setMalwareDatastore(null);
      setVisionDatastore(null);
      setReverseImageSearchData(null);
      setWebsiteMccDatastore(null);
      return;
    }

    setWebAnalysisLoading(true);
    setNavFlowLoading(true);
    setContactLoading(true);
    setProductAnalysisLoading(true);
    setDomainInfoLoading(true);
    setMalwareDetectionLoading(true);
    setVisionLoading(true);
    setMerchantWebAnalysisLoading(true);
    setScamIntelligenceLoading(true);
    setReverseImageSearchLoading(true);
    setWebsiteMccLoading(true);

    const loadAllDatastoreEntries = async () => {
      try {
        // Step 1: Fetch steps once to resolve all mapping IDs
        const steps = await fetchSteps(100);
        if (cancelled) return;

        const findStepId = (name: string, fallback: string) => 
          steps.find(s => s.name === name)?.id || fallback;

        // Step 2: Fetch all entries in parallel
        const [
          webResp,
          navResp,
          contactResp,
          productResp,
          domainResp,
          malwareEntry,
          mwaResp,
          scamResp,
          riskScoreEntry,
          visionResp,
          reverseImgResp,
          websiteMccEntry
        ] = await Promise.all([

          fetchDatastoreEntry(String(runId), findStepId("RF012", "8a231eb2-a22a-4f00-b6cd-d0fa0567949c")),
          fetchDatastoreEntry(String(runId), findStepId("NAVIGATION_FLOW", "67774633-a46f-4b62-a232-634b29a7e98e")),
          fetchDatastoreEntry(String(runId), findStepId("CONTACT_DATA", "acde3e18-d45a-4709-a6c6-8842a7074fd5")),
          fetchDatastoreEntry(String(runId), findStepId("PRODUCT_ANALYSIS", "1056fd1d-cf31-4042-9917-a2b597efea97")),
          fetchDatastoreEntry(String(runId), findStepId("DOMAIN_INFO", "5ce578a7-491f-4649-babf-65d658f9c43b")),
          fetchDatastoreEntry(String(runId), "89466cd7-3228-4ae0-8840-ff88d6da13a2"),
          fetchMerchantWebAnalysis(String(runId)),
          fetchScamIntelligence(String(runId)),
          fetchDatastoreEntry(String(runId), findStepId("RISK_SCORE", "e95829ec-3344-48f4-b2e7-a57eb9eefe36")),
          fetchDatastoreEntry(String(runId), findStepId("VISION_PIPELINE", "bf2ddb84-0cbc-4c81-add8-60c9c80a8bc6")),
          fetchReverseImageSearch(String(runId)),
          fetchDatastoreEntry(String(runId), findStepId("WEBSITE_MCC", "2e82185b-9674-4509-a022-1df8e4c497f4"))
        ]);


        if (!cancelled) {
          setWebAnalysisDatastore(webResp);
          setNavFlowDatastore(navResp);
          setContactDatastore(contactResp);
          setProductAnalysisDatastore(productResp);
          setDomainInfoDatastore(domainResp);
          setMalwareDatastore(malwareEntry);
          setMerchantWebAnalysis(mwaResp);
          setScamIntelligence(scamResp);
          setRiskScoreDatastore(riskScoreEntry);
          setVisionDatastore(visionResp);
          setReverseImageSearchData(reverseImgResp);
          setWebsiteMccDatastore(websiteMccEntry);

          if (scamResp?.data) {
            setRiskAnalysisData(scamResp.data.risk_analysis || null);
            setReviewsAnalysisData(scamResp.data.reviews_analysis || null);
          }
        }
      } catch (err) {
        console.error("[InvWebAnalysisTab] Error loading datastore entries:", err);
      } finally {
        if (!cancelled) {
          setWebAnalysisLoading(false);
          setNavFlowLoading(false);
          setContactLoading(false);
          setProductAnalysisLoading(false);
          setDomainInfoLoading(false);
          setMalwareDetectionLoading(false);
          setMerchantWebAnalysisLoading(false);
          setVisionLoading(false);
          setScamIntelligenceLoading(false);
          setReverseImageSearchLoading(false);
          setWebsiteMccLoading(false);
        }
      }
    };

    loadAllDatastoreEntries();

    return () => {
      cancelled = true;
    };
  }, [caseId, selectedCase?.caseId]);

  const websiteWorking = useMemo(() => {
    if (!redFlags || !Array.isArray(redFlags)) return null;

    const rf006 = redFlags.find(
      (f) => String(f?.code || "").toUpperCase() === "RF006"
    );
    if (!rf006) return null;

    const statusVal = rf006.overallTriggered ?? rf006.overall_triggered;
    const isTriggered =
      statusVal === true ||
      String(statusVal).toLowerCase() === "true" ||
      statusVal === 1 ||
      String(statusVal).toLowerCase() === "yes";

    return !isTriggered;
  }, [redFlags]);

  const websiteMccData = useMemo(() => {
    return (websiteMccDatastore?.data as any)?.data || null;
  }, [websiteMccDatastore]);

  const trafficMetricsData = useMemo(() => {
    const tm = trafficEngagementSampleData.metrics;
    
    const volume = [
      {
        label: tm.totalVisits.label,
        value: (
          <div className="flex flex-col gap-1 mt-0.5 w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-2xl font-extrabold text-gray-950 tracking-tight leading-none">{tm.totalVisits.value}</span>
              {tm.totalVisits.trend && (
                <div className={`inline-flex items-center gap-0.5 ${tm.totalVisits.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'} text-[11px] font-medium`}>
                  {tm.totalVisits.trend.isPositive ? (
                    <LucideIcons.ArrowUp className="h-3 w-3 shrink-0" />
                  ) : (
                    <LucideIcons.ArrowDown className="h-3 w-3 shrink-0" />
                  )}
                  <span>{tm.totalVisits.trend.value}</span>
                </div>
              )}
            </div>
          </div>
        ),
        icon: tm.totalVisits.icon,
      },
      {
        label: tm.uniqueVisits.label,
        value: (
          <div className="flex flex-col gap-1 mt-0.5 w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-2xl font-extrabold text-gray-950 tracking-tight leading-none">{tm.uniqueVisits.value}</span>
              {tm.uniqueVisits.trend && (
                <div className={`inline-flex items-center gap-0.5 ${tm.uniqueVisits.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'} text-[11px] font-medium`}>
                  {tm.uniqueVisits.trend.isPositive ? (
                    <LucideIcons.ArrowUp className="h-3 w-3 shrink-0" />
                  ) : (
                    <LucideIcons.ArrowDown className="h-3 w-3 shrink-0" />
                  )}
                  <span>{tm.uniqueVisits.trend.value}</span>
                </div>
              )}
            </div>
          </div>
        ),
        icon: tm.uniqueVisits.icon,
      }
    ];

    const engagement = [
      {
        label: tm.pagesPerVisit.label,
        value: (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-gray-950 tracking-tight">{tm.pagesPerVisit.value}</span>
          </div>
        ),
        icon: tm.pagesPerVisit.icon,
      },
      {
        label: tm.avgVisitDuration.label,
        value: (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-gray-950 tracking-tight">{tm.avgVisitDuration.value}</span>
          </div>
        ),
        icon: tm.avgVisitDuration.icon,
      },
      {
        label: tm.bounceRate.label,
        value: (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-gray-950 tracking-tight">{tm.bounceRate.value}</span>
          </div>
        ),
        icon: tm.bounceRate.icon,
      }
    ];

    const dd = trafficEngagementSampleData.deviceDistribution;
    const devices = [
      {
        label: dd.mobileWeb.label,
        value: (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-gray-950 tracking-tight">{dd.mobileWeb.percentage}</span>
          </div>
        ),
        icon: '<Smartphone className="h-5 w-5 text-blue-500" />',
      },
      {
        label: dd.desktop.label,
        value: (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-gray-950 tracking-tight">{dd.desktop.percentage}</span>
          </div>
        ),
        icon: '<Monitor className="h-5 w-5 text-indigo-500" />',
      }
    ];

    return { volume, engagement, devices, all: [...volume, ...engagement, ...devices] };
  }, []);

  // Robust extraction for Vision Pipeline snapshots
  const websiteSnapshots = useMemo(() => {
    if (!visionDatastore) return [];
    
    // Check new nested structure: visionDatastore.data.data.screenshots
    const screenshots = (visionDatastore?.data as any)?.data?.screenshots;
    if (Array.isArray(screenshots)) return screenshots;

    // Try standard nesting: visionDatastore.data.data.results
    const d1 = (visionDatastore?.data as any)?.data?.results;
    if (Array.isArray(d1)) return d1;
    
    // Try visionDatastore.data.results
    const d2 = (visionDatastore?.data as any)?.results;
    if (Array.isArray(d2)) return d2;

    // Try root results (if visionDatastore is already the data part)
    const d3 = (visionDatastore as any)?.results;
    if (Array.isArray(d3)) return d3;

    return [];
  }, [visionDatastore]);

  // Build Website Quality checklist items using decisioning flags.
  const websiteQualityItems = useMemo(() => {
    const baseChecks = [
      { name: "Website Working Status", code: "RF006" },
      { name: "Website Threat Intelligence", code: "RF005" },
      { name: "Impersonation Risk", code: "RF001" },
      { name: "Banned & Restricted Category Risk", code: "RF002" },
      { name: "Discrepancy Within Website", code: "RF010" },
      { name: "Potential Shell Website", code: "RF012" },
      { name: "Reverse Image", code: "RF009" },
    ];

    if (!redFlags || !Array.isArray(redFlags)) {
      return baseChecks.map((item) => ({
        name: item.name,
        code: item.code,
        status: "no" as const,
        reasoning: undefined,
        noData: true,
      }));
    }

    return baseChecks.map((item) => {
      const details = getFlagDetails(item.code);
      if (!details) {
        return {
          name: item.name,
          code: item.code,
          status: "no" as const,
          reasoning: undefined,
          noData: true,
        };
      }

      return {
        name: item.name,
        code: item.code,
        status: details.isTriggered ? ("yes" as const) : ("no" as const),
        reasoning: details.reasoning,
        noData: false,
        redFlag: details.flag,
      };
    });
  }, [redFlags, getFlagDetails]);

  // Transform product analysis data for selected navigation link
  const productAnalysisData = useMemo(() => {
    if (selectedNavigationLinkData) {
      const { link_name, link_url, ...otherProps } = selectedNavigationLinkData;
      const result: WebsiteAnalysisKeyValue[] = [];

      const availabilityMap = new Map<string, string>();
      if (
        otherProps.availability_status?.product_availability &&
        Array.isArray(otherProps.availability_status.product_availability)
      ) {
        otherProps.availability_status.product_availability.forEach(
          (item: any) => {
            if (item.product_name && item.availability) {
              availabilityMap.set(item.product_name, item.availability);
            }
          }
        );
      }

      Object.keys(otherProps).forEach((key) => {
        const value = otherProps[key];

        if (key === "status_options") return;

        if (key === "top_10_products" && Array.isArray(value)) {
          value.forEach((product: any, index: number) => {
            if (product && typeof product === "object") {
              const productName =
                product.product_name || `Product ${index + 1}`;
              const fieldName = capitalizeWords(productName);
              const availability = availabilityMap.get(product.product_name);
              const formattedValue = formatProductData(product, availability);

              result.push({
                field: fieldName,
                value: formattedValue,
                keyIcon: "ShoppingCart",
                keyIconColor: "blue",
                valueSentiment: "info",
              });
            }
          });
        } else if (key === "availability_status") {
          if (value && typeof value === "object" && value.description) {
            result.push({
              field: "Availability Status",
              value: value.description,
              keyIcon: "ShoppingCart",
              keyIconColor: "blue",
              valueSentiment: "info",
            });
          }
        } else if (key === "image_analysis") {
          if (value && typeof value === "object") {
            const imageParts: string[] = [];

            if (value.description)
              imageParts.push(`Description: ${value.description}`);
            if (
              value.all_images_identical !== undefined &&
              value.all_images_identical !== null
            ) {
              imageParts.push(
                `All Images Identical: ${value.all_images_identical}`
              );
            }
            if (value.image_details)
              imageParts.push(`Image Details: ${value.image_details}`);
            if (value.suspicious_findings)
              imageParts.push(
                `Suspicious Findings: ${value.suspicious_findings}`
              );

            Object.keys(value).forEach((propKey) => {
              if (
                ![
                  "description",
                  "all_images_identical",
                  "image_details",
                  "suspicious_findings",
                ].includes(propKey)
              ) {
                const propValue = value[propKey];
                if (propValue !== null && propValue !== undefined) {
                  const formattedKey = formatFieldName(propKey, false);
                  imageParts.push(`${formattedKey}: ${propValue}`);
                }
              }
            });

            if (imageParts.length > 0) {
              result.push({
                field: "Image Analysis",
                value: imageParts.join("\n\n"),
                keyIcon: "ShoppingCart",
                keyIconColor: "blue",
                valueSentiment: "info",
              });
            }
          }
        } else {
          const nestedData = transformToKeyValue(
            value,
            key,
            "ShoppingCart",
            "blue",
            "info"
          );
          nestedData.forEach((item) => {
            let fieldName = item.field;
            if (fieldName.startsWith(`${key}.`)) {
              fieldName = fieldName.substring(key.length + 1);
            }
            fieldName = formatFieldName(fieldName, false);
            result.push({
              ...item,
              field: fieldName,
            });
          });
        }
      });

      return result;
    }
    return [];
  }, [selectedNavigationLinkData]);

  // Transform product data into table rows for Product Analysis
  const productTableData = useMemo(() => {
    if (!selectedNavigationLinkData) return [];

    const { link_name, link_url, ...otherProps } = selectedNavigationLinkData;
    const availabilityMap = new Map<string, string>();

    if (
      otherProps.availability_status?.product_availability &&
      Array.isArray(otherProps.availability_status.product_availability)
    ) {
      otherProps.availability_status.product_availability.forEach(
        (item: any) => {
          if (item.product_name && item.availability) {
            availabilityMap.set(item.product_name, item.availability);
          }
        }
      );
    }

    const products: any[] = [];

    if (
      otherProps.top_10_products &&
      Array.isArray(otherProps.top_10_products)
    ) {
      otherProps.top_10_products.forEach((product: any, index: number) => {
        if (product && typeof product === "object") {
          const productName = product.name || product.product_name || `Product ${index + 1}`;
          const availability = product.availability_status || availabilityMap.get(product.product_name) || "-";

          // Format price: final_price (currency)
          let priceStr = "-";
          if (product.final_price) {
            priceStr = `${product.final_price}${product.currency ? ` (${product.currency})` : ""}`;
          } else if (product.price) {
            const priceParts: string[] = [];
            if (product.price.final_price) {
              priceStr = `${product.price.final_price}${product.price.currency ? ` (${product.price.currency})` : ""}`;
            } else {
              if (product.price.original_price) {
                priceParts.push(
                  `Original: ${product.price.original_price} ${
                    product.price.currency || ""
                  }`.trim()
                );
              }
              if (
                product.price.discount_percentage &&
                product.price.discount_percentage !== "Not available"
              ) {
                priceParts.push(
                  `Discount: ${product.price.discount_percentage}%`
                );
              }
              if (priceParts.length > 0) {
                priceStr = priceParts.join(", ");
              }
            }
          }

          // Extract pricing analysis fields
          const pricingAnalysis = product.pricing_analysis || {};
          const pricingAnalysisStr = pricingAnalysis.description || "-";
          const isSuspicious =
            pricingAnalysis.is_suspicious !== undefined &&
            pricingAnalysis.is_suspicious !== null
              ? String(pricingAnalysis.is_suspicious)
              : "-";
          const analysisReason = pricingAnalysis.analysis_reason || "-";
          const marketComparison = pricingAnalysis.market_comparison || "-";

          products.push({
            field: productName,
            price: priceStr,
            description: product.product_description || product.description || "-",
            customizationOptions: product.customization_options || "-",
            availability: availability,
            pricingAnalysis: pricingAnalysisStr,
            isSuspicious: isSuspicious,
            analysisReason: analysisReason,
            marketComparison: marketComparison,
            productUrl: product.product_url || product.productUrl || "-",
          });
        }
      });
    }

    return products;
  }, [selectedNavigationLinkData]);

  // Custom component for value display that shows at least 3 lines without truncation
  const ValueDisplay: FC<{ value: string }> = ({ value }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkTruncation = () => {
        if (measureRef.current && textRef.current) {
          const fullHeight = measureRef.current.scrollHeight;
          const lineHeight =
            parseFloat(getComputedStyle(measureRef.current).lineHeight) || 20;
          const maxHeight = lineHeight * 3;
          setNeedsTruncation(fullHeight > maxHeight);
        }
      };

      checkTruncation();
      const timeoutId = setTimeout(checkTruncation, 100);

      return () => clearTimeout(timeoutId);
    }, [value]);

    const baseClasses = "whitespace-pre-wrap text-gray-700 font-normal";

    return (
      <div className="w-full relative">
        <div
          ref={measureRef}
          className={`${baseClasses} invisible absolute`}
          style={{ width: "100%" }}
        >
          {value}
        </div>
        <div
          ref={textRef}
          className={`${baseClasses} ${
            !isExpanded && needsTruncation ? "line-clamp-3" : ""
          }`}
        >
          {value}
        </div>
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 cursor-pointer"
            type="button"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    );
  };

  // Function to open product detail artifact
  const openProductDetailArtifact = (product: any) => {
    const artifactId = `product-detail-${product.field.replace(
      /\s+/g,
      "-"
    )}-${Date.now()}`;
    const theCaseId = (selectedCase as any)?.caseId || caseId;
    const artifactStore = useArtifactStore.getState();

    // Prepare table data for Details section
    const detailsTableData = [
      {
        field: "Description",
        value:
          product.description && product.description !== "-"
            ? product.description
            : "No description available",
      },
      {
        field: "Pricing Analysis",
        value:
          product.pricingAnalysis && product.pricingAnalysis !== "-"
            ? product.pricingAnalysis
            : "No pricing analysis available",
      },
      {
        field: "Analysis Reason",
        value:
          product.analysisReason && product.analysisReason !== "-"
            ? product.analysisReason
            : "No analysis reason available",
      },
    ];

    // Columns for Details table
    const detailsColumns = [
      {
        key: "field",
        header: "Field",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="font-semibold text-gray-900">{value}</span>
        ),
      },
      {
        key: "value",
        header: "Value",
        minWidth: "400px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => <ValueDisplay value={value} />,
      },
    ];

    artifactStore.addTab({
      id: artifactId,
      title: `Product Details — ${product.field}`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={`Product Details — ${product.field}`}
            contentIDText="Case ID"
            contentID={theCaseId}
          />

          <ArtifactSectionCollapsible title="Details" defaultOpen>
            <div className="mt-2">
              <CustomTableView
                headerAndTotalRowBg="gray-100"
                columns={detailsColumns}
                data={detailsTableData}
                initialRowLimit={detailsTableData.length}
                isExpanded={true}
                showCSVExport={false}
                enableAlternatingRows={true}
                alternatingRowColor="gray"
              />
            </div>
          </ArtifactSectionCollapsible>
        </div>
      ),
    });

    // Activate the artifact tab and expand panel
    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  // Columns for Product Analysis table
  const productAnalysisColumns = useMemo(() => {
    const ChevronRightIcon = LucideIcons.ChevronRight;

    return [
      {
        key: "field",
        header: "Field",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="font-semibold text-gray-900">{value}</span>
        ),
      },
      {
        key: "price",
        header: "Price",
        // minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <TruncatableText text={value} textColorClass="text-gray-700" />
        ),
      },
      {
        key: "customizationOptions",
        header: "Customization Options",
        // minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="text-gray-700">{value}</span>
        ),
      },
      {
        key: "availability",
        header: "Availability",
        // minWidth: "150px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          <span className="text-gray-700">{value}</span>
        ),
      },
      {
        key: "productUrl",
        header: "URL",
        minWidth: "200px",
        align: "left" as const,
        verticalAlign: "middle" as const,
        render: (value: string) => (
          value && value !== "-" ? (
            <TruncatableText text={value} textColorClass="text-blue-600" lineLimit={1} />
          ) : (
            <span className="text-gray-400">-</span>
          )
        ),
      },
      // {
      //   key: "isSuspicious",
      //   header: "Is Suspicious",
      //   minWidth: "150px",
      //   align: "left" as const,
      //   verticalAlign: "middle" as const,
      //   render: (value: string) => (
      //     <span className="text-gray-700">{value}</span>
      //   ),
      // },
      // {
      //   key: "marketComparison",
      //   header: "Market Comparison",
      //   minWidth: "250px",
      //   align: "left" as const,
      //   verticalAlign: "middle" as const,
      //   render: (value: string) => (
      //     <TruncatableText text={value} textColorClass="text-gray-700" />
      //   ),
      // },
      {
        key: "actions",
        header: "",
        minWidth: "50px",
        align: "right" as const,
        verticalAlign: "middle" as const,
        render: (_value: any, row: Record<string, any>) => (
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
        ),
      },
    ];
  }, []);

  const contentAnalysisData = useMemo(() => {
    const scamContent = (scamIntelligence as any)?.data?.content_analysis;
    const scamFrequentWords = scamContent?.frequent_words;

    if (!websiteDataJson && !scamFrequentWords) return [];
    let data = transformContentAnalysisData(websiteDataJson?.content_analysis || {});

    // Consolidate frequent words entries
    const frequentWordsEntries: string[] = [];
    const otherEntries: WebsiteAnalysisKeyValue[] = [];
    let hasConsolidatedFrequentWords = false;

    data.forEach((entry) => {
      if ((entry as any).isFrequentWords && Array.isArray(entry.value)) {
        // If we have scamFrequentWords, override this existing entry's value
        if (Array.isArray(scamFrequentWords) && scamFrequentWords.length > 0) {
          entry.value = scamFrequentWords;
        }
        otherEntries.push(entry);
        hasConsolidatedFrequentWords = true;
        return;
      }

      const fieldLower = entry.field.toLowerCase().trim();
      const match = fieldLower.match(/^frequent\s+words?\[(\d+)\]$/);

      if (match) {
        if (typeof entry.value === "string") {
          frequentWordsEntries.push(entry.value);
        }
      } else if (
        fieldLower === "frequent words" ||
        fieldLower === "frequent_words"
      ) {
        if (Array.isArray(entry.value)) {
          // If we have scamFrequentWords, override
          let val = entry.value;
          if (Array.isArray(scamFrequentWords) && scamFrequentWords.length > 0) {
            val = scamFrequentWords;
          }
          otherEntries.push({
            ...entry,
            value: val,
            isFrequentWords: true,
          } as WebsiteAnalysisKeyValue & { isFrequentWords?: boolean });
          hasConsolidatedFrequentWords = true;
        } else {
          otherEntries.push(entry);
        }
      } else {
        otherEntries.push(entry);
      }
    });

    // If we have scamFrequentWords but didn't find an existing entry to override, add it now
    if (!hasConsolidatedFrequentWords && Array.isArray(scamFrequentWords) && scamFrequentWords.length > 0) {
      otherEntries.push({
        field: "Frequent words",
        value: scamFrequentWords,
        keyIcon: "FileSearch",
        keyIconColor: "blue",
        valueSentiment: "info",
        isFrequentWords: true,
      } as any);
      hasConsolidatedFrequentWords = true;
    }

    if (frequentWordsEntries.length > 0 && !hasConsolidatedFrequentWords) {
      otherEntries.push({
        field: "Frequent words",
        value: frequentWordsEntries,
        keyIcon: "FileSearch",
        keyIconColor: "blue",
        valueSentiment: "info",
        isFrequentWords: true,
      } as any);
    }

    return otherEntries;
  }, [websiteDataJson, scamIntelligence]);

  // Extract frequent words entry and provide a filtered content analysis without it
  const frequentWordsEntry = useMemo(() => {
    if (!contentAnalysisData) return null;
    return (
      (contentAnalysisData as WebsiteAnalysisKeyValue[]).find(
        (e: any) => (e as any).isFrequentWords
      ) || null
    );
  }, [contentAnalysisData]);

  const contentAnalysisFiltered = useMemo(() => {
    if (!contentAnalysisData) return [];
    return (contentAnalysisData as WebsiteAnalysisKeyValue[]).filter(
      (e: any) => !(e as any).isFrequentWords
    );
  }, [contentAnalysisData]);

  // Extract language support from content_analysis (array -> comma separated)
  const languageSupportValue = useMemo(() => {
    // Prefer new Merchant Web Analysis API
    if (merchantWebAnalysis?.data?.language_support) {
      const ls = merchantWebAnalysis.data.language_support;
      return Array.isArray(ls) ? ls.join(", ") : String(ls);
    }
    if (!websiteDataJson) return "-";
    const cs =
      websiteDataJson.content_analysis?.language_support ??
      websiteDataJson.content_analysis?.languageSupport ??
      null;
    if (!cs) return "-";
    return Array.isArray(cs) ? cs.join(", ") : String(cs);
  }, [websiteDataJson, merchantWebAnalysis]);

  const logoAnalysisData = useMemo(() => {
    if (!websiteDataJson) return [];
    return transformToKeyValue(
      websiteDataJson.logo_analysis,
      "",
      "Info",
      "blue",
      "info"
    );
  }, [websiteDataJson]);

  // Extract is_subdomain value from multiple possible domain fields
  const isSubdomainValue = useMemo(() => {
    // Prefer new Merchant Web Analysis API
    if (merchantWebAnalysis?.data?.is_sub_domain !== undefined && merchantWebAnalysis?.data?.is_sub_domain !== null) {
      return merchantWebAnalysis.data.is_sub_domain ? "Yes" : "No";
    }
    // Check datastore first
    const ds = (domainInfoDatastore?.data as any)?.data;
    if (ds && (ds.is_subdomain !== undefined || ds.isSubdomain !== undefined)) {
      const val = ds.is_subdomain ?? ds.isSubdomain;
      return typeof val === "boolean" ? (val ? "Yes" : "No") : val;
    }
    if (!websiteDataJson || !websiteDataJson.domain_info) return "-";
    const di = websiteDataJson.domain_info;
    const val = di.is_subdomain ?? di.isSubdomain ?? "-";
    return typeof val === "boolean" ? (val ? "Yes" : "No") : val;
  }, [websiteDataJson, domainInfoDatastore, merchantWebAnalysis]);

  const copyrightLineValue = useMemo(() => {
    // Prefer new Merchant Web Analysis API
    if (merchantWebAnalysis?.data?.copyright_line) {
      return merchantWebAnalysis.data.copyright_line;
    }
    // Check datastore first
    const ds = (domainInfoDatastore?.data as any)?.data;
    if (ds && ds.copyright_line) {
      return ds.copyright_line;
    }
    if (!websiteDataJson || !websiteDataJson.domain_info) return "-";
    const di = websiteDataJson.domain_info;
    return di.copyright_line ?? di.copyrightLine ?? "-";
  }, [websiteDataJson, domainInfoDatastore, merchantWebAnalysis]);
  
  const formatDateString = (dateStr: string | null | undefined) => {
    if (!dateStr || dateStr === "-" || dateStr === "N/A" || dateStr === "0") return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return format(date, "dd MMM yyyy, HH:mm:ss");
    } catch (e) {
      return dateStr;
    }
  };

  // Website Integrity KeyMetrics (shown under Contact Data)
  const fatfStatusValue = useMemo(() => {
    const ds = (domainInfoDatastore?.data as any)?.data;
    const raw =
      ds?.fatf_status ??
      ds?.fatf ??
      websiteDataJson?.domain_info?.fatf_status ??
      websiteDataJson?.domain_info?.fatf ??
      websiteDataJson?.fatf_status ??
      websiteDataJson?.fatf ??
      null;

    if (raw === null || raw === undefined || String(raw).trim() === "") {
      return "N/A";
    }

    const s = String(raw).trim().toLowerCase();
    if (s === "not listed" || s === "not_listed" || s === "notlisted") return "Not listed";
    if (s.includes("grey") || s.includes("gray")) return "Greylisted";
    if (s.includes("black")) return "Blacklisted";
    return String(raw);
  }, [domainInfoDatastore, websiteDataJson]);

  const urlConsistencyTableData = useMemo(() => {
    const navFlowData = (navFlowDatastore?.data as any)?.data;
    if (navFlowData?.url_consistency) {
      const u = navFlowData.url_consistency;
      return [
        { field: "Registered URL", value: u.registered_url || u.registeredUrl || "N/A", matches: true },
        { field: "Homepage Redirection", value: u.homepage_redirection || u.homepageRedirection || "N/A", matches: u.homepage_matches || false },
        { field: "Payment URL", value: u.payment_url || u.paymentUrl || "N/A", matches: u.payment_matches || false },
        { field: "Return URL", value: u.return_url || u.returnUrl || "N/A", matches: u.return_matches || false },
      ];
    }
    return getUrlConsistency(selectedCase as any);
  }, [navFlowDatastore, selectedCase]);

  const urlBehaviorFlags = useMemo(() => {
    const url = websiteDataJson?.url;
    if (!url) return [];
    const cred = url.credential_harvesting || {};
    const behav = url.page_behavior || {};
    return [
      { field: "Suspicious Redirect Chain", value: url.is_suspicious_chain ? "Yes" : "No" },
      { field: "Domain Changed on Redirect", value: url.domain_changed_on_redirect ? "Yes" : "No" },
      { field: "Has Login Form", value: cred.has_login_form ? "Yes" : "No" },
      { field: "External Form Submission", value: cred.external_submission ? "Yes" : "No" },
      { field: "Suspicious Downloads", value: behav.suspicious_downloads ? "Yes" : "No" },
      { field: "Hidden Iframes", value: behav.hidden_iframes ? "Yes" : "No" },
    ];
  }, [websiteDataJson]);

  const handleDownloadReport = async () => {
    if (!selectedCase || !pdfTemplateRef.current) return;

    try {
      const merchantName = selectedCase?.registeredName || (selectedCase as any)?.merchant?.name || "N/A";
      const mid = (selectedCase as any)?.externalMerchantId || (selectedCase as any)?.run?.merchant_id || (selectedCase as any)?.caseId || "N/A";
      const website = (selectedCase as any)?.website || (selectedCase as any)?.merchant?.website || "";
      const runDate = format(new Date(), "dd MMM yyyy, HH:mm:ss");
      
      await preparePDFElement(pdfTemplateRef.current);

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


      await generateInvestigationReportPDF(
        pdfTemplateRef.current,
        merchantName,
        lobValue,
        mid,
        {
          filename: `${merchantName.replace(/[^a-z0-9]/gi, "_")}_Web_Analysis_Report.pdf`,
          website,
          runDate,
          riskScore: String(finalScoreValue),
          riskLabel,
          riskColor
        }
      );


    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const websiteIntegrityMetrics = useMemo(() => {
    const ws = websiteDataJson?.website_status || {};
    const di = websiteDataJson?.domain_info || {};

    // Normalize domain_info: some API responses nest the actual fields under
    // domain_info.domain_information. Prefer that when present.
    const diRoot = (di && (di.domain_information ?? di)) || {};
    const wsRoot = ws || {};

    // Prefer DOMAIN_INFO datastore entry data
    const datastoreData = (domainInfoDatastore?.data as any)?.data;
    const dsWs = datastoreData?.website_status_and_certificate || {};
    const dsLoc = datastoreData?.location_data || {};
    const dsWhois = datastoreData?.creation_info || "";

    // Helper to extract WHOIS fields from the creation_info string
    const extractWhoisField = (whois: string, fieldName: string) => {
      if (!whois) return null;
      const regex = new RegExp(`${fieldName}:\\s*(.+)`, "i");
      const match = whois.match(regex);
      return match ? match[1].trim() : null;
    };

    // Two lookup helpers:
    // - getValWsFirst: preserve existing behavior (datastore -> website_status -> domain_info(.domain_information) -> root)
    // - getValDomainFirst: prefer domain_info.domain_information values (domain API) then datastore then website_status then root
    const getValWsFirst = (keys: string[]) => {
      for (const k of keys) {
        // Try datastore sources first
        if (dsWs[k] !== undefined && dsWs[k] !== null) return dsWs[k];
        if (dsLoc[k] !== undefined && dsLoc[k] !== null) return dsLoc[k];
        if (k === "created_date" || k === "creation_date") {
          const val = extractWhoisField(dsWhois, "Creation Date");
          if (val) return val;
        }
        if (k === "registrar") {
          const val = extractWhoisField(dsWhois, "Registrar");
          if (val) return val;
        }
        if (k === "expiry_date" || k === "registry_expiry_date") {
          const val = extractWhoisField(dsWhois, "Registry Expiry Date");
          if (val) return val;
        }

        if (wsRoot[k] !== undefined && wsRoot[k] !== null) return wsRoot[k];
        if (diRoot[k] !== undefined && diRoot[k] !== null) return diRoot[k];
        if (websiteDataJson && websiteDataJson[k] !== undefined && websiteDataJson[k] !== null)
          return websiteDataJson[k];
      }
      return "-";
    };

    const getValDomainFirst = (keys: string[]) => {
      for (const k of keys) {
        // Try datastore sources first
        if (dsLoc[k] !== undefined && dsLoc[k] !== null) return dsLoc[k];
        if (dsWs[k] !== undefined && dsWs[k] !== null) return dsWs[k];
        if (k === "created_date" || k === "creation_date") {
          const val = extractWhoisField(dsWhois, "Creation Date");
          if (val) return val;
        }
        if (k === "registrar") {
          const val = extractWhoisField(dsWhois, "Registrar");
          if (val) return val;
        }
        if (k === "expiry_date" || k === "registry_expiry_date") {
          const val = extractWhoisField(dsWhois, "Registry Expiry Date");
          if (val) return val;
        }
        if (k === "ip" || k === "ip_address" || k === "IP & Location") {
          if (dsLoc.query) return dsLoc.query;
        }

        if (diRoot[k] !== undefined && diRoot[k] !== null) return diRoot[k];
        if (wsRoot[k] !== undefined && wsRoot[k] !== null) return wsRoot[k];
        if (websiteDataJson && websiteDataJson[k] !== undefined && websiteDataJson[k] !== null)
          return websiteDataJson[k];
      }
      return "-";
    };

    const roundSecondsTo4 = (v: any) => {
      if (v === null || v === undefined) return v;

      // If value is already a number
      if (typeof v === "number") {
        return `${v.toFixed(4)} seconds`;
      }

      // If value is string like "0.20472192764282227 seconds"
      if (typeof v === "string") {
        const match = v.match(/([\d.]+)/);
        if (!match) return v;

        const num = Number(match[1]);
        if (!Number.isFinite(num)) return v;

        return `${num.toFixed(4)} seconds`;
      }

      return v;
    };

    const metrics = [
      // Language Support
      {
        label: "Language Support",
        value: languageSupportValue,
        icon: '<Globe className="h-5 w-5 text-teal-500" />',
      },
      // Keep Response Time (can also prefer new API if available)
      {
        label: "Response Time",
        value: roundSecondsTo4(
          merchantWebAnalysis?.data?.website_certificate?.response_time ??
          getValWsFirst(["response_time", "Response Time"])
        ),
        icon: '<Timer className="h-5 w-5 text-orange-500" />',
      },
      // For the rest, prefer domain_info (the domain API) values per request
      {
        label: "IP Address",
        value: getValDomainFirst(["ip", "ip_address", "IP & Location"]),
        icon: '<Server className="h-5 w-5 text-blue-500" />',
      },
      {
        label: "Country",
        value: getValDomainFirst(["country", "location", "country_name"]),
        icon: '<MapPin className="h-5 w-5 text-emerald-500" />',
      },
      {
        label: "Created date",
        value: formatDateString(
          getValDomainFirst([
            "creation_date",
            "created_date",
            "Creation Date",
          ])
        ),
        icon: '<Calendar className="h-5 w-5 text-sky-500" />',
      },
      {
        label: "Age",
        value: getValDomainFirst(["age"]),
        icon: '<Clock className="h-5 w-5 text-violet-500" />',
      },
      {
        label: "Registrar",
        value: getValDomainFirst(["registrar"]),
        icon: '<Building className="h-5 w-5 text-rose-500" />',
      },
      {
        label: "Privacy Protection",
        value: getValDomainFirst(["privacy_protection", "privacy"]),
        icon: '<ShieldOff className="h-5 w-5 text-gray-500" />',
      },
      {
        label: "HTTPS Certificates",
        value: (() => {
          if (merchantWebAnalysis?.data?.website_certificate) {
            return merchantWebAnalysis.data.website_certificate.https_enabled ? "Enabled" : "Disabled";
          }
          const val = getValDomainFirst([
            "https_certificates",
            "ssl_certificate",
            "https_certificate",
            "SSL Certificate",
          ]);
          if (val === true || val === "true") return "Enabled";
          if (val === false || val === "false") return "Disabled";
          return val;
        })(),
        icon: '<Lock className="h-5 w-5 text-indigo-500" />',
      },
    ];

    return metrics;
  }, [websiteDataJson, languageSupportValue, merchantWebAnalysis]);

  const sslIntegrityMetrics = useMemo(() => {
    const ssl = websiteDataJson?.ssl;
    if (!ssl) return [];

    const getVal = (v: any) => (v === null || v === undefined || v === 0 || v === "0" ? "-" : String(v));

    return [
      {
        label: "Issuer",
        value: getVal(ssl.issuer),
        icon: '<Award className="h-5 w-5 text-purple-500" />',
      },
      {
        label: "TLS Version",
        value: getVal(ssl.tls_version),
        icon: '<ShieldCheck className="h-5 w-5 text-cyan-500" />',
      },
      {
        label: "Valid From",
        value: formatDateString(ssl.valid_from),
        icon: '<Calendar className="h-5 w-5 text-slate-500" />',
      },
      {
        label: "Valid To",
        value: formatDateString(ssl.valid_to),
        icon: '<CalendarCheck className="h-5 w-5 text-slate-500" />',
      },
    ];
  }, [websiteDataJson]);

  const dnsIntegrityMetrics = useMemo(() => {
    const dns = websiteDataJson?.dns;
    if (!dns) return [];

    const getVal = (v: any) => (v === null || v === undefined || v === 0 || v === "0" || (Array.isArray(v) && v.length === 0) ? "-" : String(v));
    const formatMultiValue = (val: any) => {
      if (!Array.isArray(val) || val.length === 0) return getVal(val);
      if (val.length === 1) return String(val[0]);

      const remainingValues = val.slice(1);
      return (
        <div className="flex items-center gap-1">
          <span>{String(val[0])}</span>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -ml-1 transition-colors"
                title="View all records"
              >
                (+{remainingValues.length} more)
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 max-h-60 overflow-y-auto" align="start">
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                {val.map((record: any, idx: number) => (
                  <div key={idx} className="text-sm text-gray-700 py-1 border-b last:border-0 border-gray-100 flex items-start">
                    <span className="text-gray-400 mr-2 shrink-0">{idx + 1}.</span>
                    <span className="break-all">{String(record)}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    };

    return [
      {
        label: "A Records",
        value: formatMultiValue(dns.a_records),
        icon: '<Server className="h-5 w-5 text-blue-500" />',
      },
      {
        label: "NS Records",
        value: formatMultiValue(dns.ns_records),
        icon: '<Network className="h-5 w-5 text-indigo-500" />',
      },
      {
        label: "MX Records",
        value: formatMultiValue(dns.mx_records),
        icon: '<Mail className="h-5 w-5 text-emerald-500" />',
      },
      {
        label: "TXT Records",
        value: formatMultiValue(dns.txt_records),
        icon: '<FileText className="h-5 w-5 text-slate-500" />',
      },
      {
        label: "SPF Record",
        value: formatMultiValue(dns.spf_record),
        icon: '<ShieldCheck className="h-5 w-5 text-cyan-500" />',
      },
      {
        label: "DMARC Record",
        value: getVal(dns.dmarc_record),
        icon: '<ShieldCheck className="h-5 w-5 text-teal-500" />',
      },
    ];
  }, [websiteDataJson]);

  const urlIntegrityMetrics = useMemo(() => {
    const url = websiteDataJson?.url;
    if (!url && !merchantWebAnalysis) return [];

    const navFlowData = (navFlowDatastore?.data as any)?.data;
    const u = navFlowData?.url_consistency || {};
    
    // Prefer new Merchant Web Analysis API's final_url for both cards
    const mwaFinalUrl = merchantWebAnalysis?.data?.website_certificate?.final_url;
    const registeredUrl = mwaFinalUrl ?? u.registered_url ?? u.registeredUrl ?? url?.registered_url ?? "-";
    const homepageRedirection = mwaFinalUrl ?? u.homepage_redirection ?? u.homepageRedirection ?? u.homepage_redirect ?? url?.homepage_redirection ?? "-";

    const getVal = (v: any) => (v === null || v === undefined || v === 0 || v === "0" ? "-" : String(v));

    return [
      {
        label: "Registered URL",
        value: getVal(registeredUrl),
        icon: '<Link className="h-5 w-5 text-blue-500" />',
      },
      {
        label: "Homepage Redirection",
        value: getVal(homepageRedirection),
        icon: '<CornerRightUp className="h-5 w-5 text-indigo-500" />',
      },
      {
        label: "Initial URL",
        value: getVal(url?.initial_url),
        icon: '<Link className="h-5 w-5 text-emerald-500" />',
      },
      {
        label: "Final URL",
        value: getVal(mwaFinalUrl ?? url?.final_url),
        icon: '<Link className="h-5 w-5 text-teal-500" />',
      },
      {
        label: "Number of Redirects",
        value: getVal(url?.num_redirects),
        icon: '<CornerRightDown className="h-5 w-5 text-slate-500" />',
      },
      {
        label: "Redirect Destination",
        value: getVal(url?.redirect_destination),
        icon: '<Compass className="h-5 w-5 text-cyan-500" />',
      },
    ];
  }, [websiteDataJson, navFlowDatastore, merchantWebAnalysis]);

  const malwareIntegrityMetrics = useMemo(() => {
    const malware = websiteDataJson?.malware;
    if (!malware) return [];

    const maliciousEngines = (malware.threat_names && typeof malware.threat_names === "object")
      ? Object.entries(malware.threat_names)
          .filter(([_, data]: any) => data && (data.category === "malicious" || data.result === "malicious" || data.result === "malware"))
          .map(([name]) => name)
      : [];

    const suspiciousEngines = (malware.threat_names && typeof malware.threat_names === "object")
      ? Object.entries(malware.threat_names)
          .filter(([_, data]: any) => data && (data.category === "suspicious" || data.result === "suspicious"))
          .map(([name]) => name)
      : [];

    const getVal = (v: any) => (v === null || v === undefined || v === 0 || v === "0" ? "-" : String(v));

    return [
      {
        label: "Malicious Hits",
        value: maliciousEngines.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {maliciousEngines.map((engine: string) => (
              <BubbleTag key={engine} text={engine} color="red" />
            ))}
          </div>
        ) : "-",
        icon: '<AlertOctagon className="h-5 w-5 text-red-500" />',
      },
      {
        label: "Suspicious Hits",
        value: suspiciousEngines.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {suspiciousEngines.map((engine: string) => (
              <BubbleTag key={engine} text={engine} color="yellow" />
            ))}
          </div>
        ) : "-",
        icon: '<AlertTriangle className="h-5 w-5 text-amber-500" />',
      },
    ];
  }, [websiteDataJson]);

  // Sanitize reasoning strings coming from APIs (strip leading "Status: ... Reasoning:" prefixes)
  const sanitizeReasoning = (r: any) => {
    if (r === undefined || r === null) return r;
    let s = typeof r === "string" ? r : String(r);
    // Remove combined patterns like "Status: No Reasoning: " or "Status: No\nReasoning: "
    s = s.replace(/^\s*Status\s*:[^R\n]*(?:Reasoning\s*:)?\s*/i, "");
    // Also remove patterns like "Status: No " at the start
    s = s.replace(/^\s*Status\s*:\s*[^\n]+\s*/i, "");
    return s.trim();
  };

  // Animation variants
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

  // Artifact store - used to open a new artifact tab when clicking the
  // Declared ↔ Observed box.
  const artifactStore = useArtifactStore();

  const openDeclaredObservedArtifact = () => {
    const artifactId = `declared-observed-${Date.now()}`;
    const theCaseId = (selectedCase as any)?.caseId || caseId;

    // Compute declared & observed descriptions from available sources
    const rfData = (webAnalysisDatastore?.data as any)?.data;
    const declaredDesc = (() => {
      const cand = [
        (selectedCase as any)?.mccDescription,
        (selectedCase as any)?.mcc_description,
        (selectedCase as any)?.mccCode,
        (selectedCase as any)?.mcc,
      ];
      for (const v of cand) {
        if (v !== undefined && v !== null && String(v).trim() !== "")
          return String(v);
      }
      return "N/A";
    })();

    const observedDesc = (() => {
      const cand = [
        (selectedCase as any)?.observedWebsiteActivity,
        (selectedCase as any)?.observed_activity,
      ];
      for (const v of cand) {
        if (v !== undefined && v !== null && String(v).trim() !== "")
          return String(v);
      }
      return "N/A";
    })();

    // Compute web-analysis reasoning to include in the artifact (remove from the card)
    const webAnalysisReasoning =
      rfData?.overall_reasoning ??
      (getWebsiteIntegrity as any)(selectedCase as any)?.reasoning ??
      null;

    artifactStore.addTab({
      id: artifactId,
      title: `Declared vs Observed — Description`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={`Declared vs Observed — Description`}
            contentIDText="Case ID"
            contentID={theCaseId}
          />

          <ArtifactSectionCollapsible title="Description" defaultOpen>
            <div className="text-sm text-gray-700 space-y-2">
              <div>Declared Business ( MCC) description: {declaredDesc}</div>
              <div>Observed Website Activity description: {observedDesc}</div>
            </div>
          </ArtifactSectionCollapsible>

          {webAnalysisReasoning ? (
            <ArtifactSectionCollapsible title="Reasoning" defaultOpen>
              <div className="text-sm text-gray-700 space-y-2">
                <div>{sanitizeReasoning(webAnalysisReasoning)}</div>
              </div>
            </ArtifactSectionCollapsible>
          ) : null}
        </div>
      ),
    });

    // Activate the artifact tab and expand panel
    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  // Use centralized sentiment icon map
  const typedValueSentimentIconMap = valueSentimentIconMap as Record<
    WebsiteAnalysisValueSentiment,
    { Icon: LucideIcon; color: string }
  >;

  // Transform key-value data
  const transformKeyValueData = (data: WebsiteAnalysisKeyValue[]) => {
    return data.map((row) => ({
      field: row.field,
      value: row.value,
      keyIcon: row.keyIcon,
      keyIconColor: row.keyIconColor,
      valueSentiment: row.valueSentiment,
      ...((row as any).isFrequentWords !== undefined && {
        isFrequentWords: (row as any).isFrequentWords,
      }),
      ...((row as any).isMalwareHits !== undefined && {
        isMalwareHits: (row as any).isMalwareHits,
      }),
      ...((row as any).maliciousEngines !== undefined && {
        maliciousEngines: (row as any).maliciousEngines,
      }),
      ...((row as any).isSuspiciousHits !== undefined && {
        isSuspiciousHits: (row as any).isSuspiciousHits,
      }),
      ...((row as any).suspiciousEngines !== undefined && {
        suspiciousEngines: (row as any).suspiciousEngines,
      }),
      ...((row as any).isRiskTag !== undefined && {
        isRiskTag: (row as any).isRiskTag,
      }),
      ...((row as any).riskSentiment !== undefined && {
        riskSentiment: (row as any).riskSentiment,
      }),
    }));
  };

  // Tooltip content for specific fields to help business users
  const fieldTooltipMap: Record<string, string> = {
    "Blacklisted": "This website has been flagged as hosting malicious content or engaging in illegal activities by major security providers.",
    "Malicious Hits": "Confirmed security threats (like viruses, phishing, or ransomware) detected by scanning engines on this domain.",
    "Suspicious Hits": "Potential security risks or low-reputation signals that suggest the site might be risky, though not definitively malicious.",
  };

  // Standard columns for key-value pair data
  const keyValueColumns = useMemo(() => {
    return [
      {
        key: "field",
        header: "Field",
        width: "180px",
        align: "left" as const,
        verticalAlign: "top" as const,
        render: (_value: string, row: Record<string, any>) => {
          const rowData = row as WebsiteAnalysisKeyValue;
          const FieldIcon = getIconForField(rowData.field);
          const formattedField = formatFieldName(rowData.field, false);
          const tooltipContent = fieldTooltipMap[rowData.field];

          const content = (
            <span className="flex items-start gap-2">
              {FieldIcon && (
                <FieldIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
              )}
              <span
                className={`font-bold ${getTextColorClass("gray")} ${tooltipContent ? "cursor-pointer border-b border-dotted border-gray-400" : ""}`}
              >
                {formattedField}
              </span>
            </span>
          );

          if (tooltipContent) {
            return (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[280px] bg-slate-900 text-white border-none shadow-xl">
                    <p className="text-xs leading-relaxed">{tooltipContent}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return content;
        },
      },
      {
        key: "value",
        header: "Value",
        width: "600px",
        align: "left" as const,
        verticalAlign: "top" as const,
        render: (value: string | string[], row: Record<string, any>) => {
          const rowData = row as WebsiteAnalysisKeyValue & {
            isFrequentWords?: boolean;
            isMalwareHits?: boolean;
            maliciousEngines?: string[];
            isSuspiciousHits?: boolean;
            suspiciousEngines?: string[];
            isRiskTag?: boolean;
          };
          const sentimentConfig =
            typedValueSentimentIconMap[rowData.valueSentiment] ??
            typedValueSentimentIconMap.info;
          const ValueIcon = sentimentConfig.Icon;
          const textColorClass = "text-gray-900";

          if (
            rowData.isFrequentWords &&
            Array.isArray(value) &&
            value.length > 0
          ) {
            return (
              <FrequentWordsDisplay
                words={value}
                textColorClass={textColorClass}
                ValueIcon={ValueIcon}
                showValueIcons={showValueIcons}
              />
            );
          }

          const textToRender = value !== null && value !== undefined && value !== "0" ? String(value) : "-";
          const FieldValueIcon = getIconForField(rowData.field);
          const isNAValue = textToRender.toLowerCase() === "n/a" || textToRender === "-";

          if (isNAValue) {
            return (
              <div className={`flex items-start gap-2`}>
                {showValueIcons && FieldValueIcon && (
                  <FieldValueIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                )}
                <BubbleTag text={textToRender} color="gray" />
              </div>
            );
          }

          if (rowData.isMalwareHits && Array.isArray(rowData.maliciousEngines) && rowData.maliciousEngines.length > 0) {
            const engines = rowData.maliciousEngines;
            const visibleEngines = engines.slice(0, 2);
            const hiddenEngines = engines.slice(2);
            return (
              <div className="flex flex-wrap items-center gap-2">
                {showValueIcons && FieldValueIcon && (
                  <FieldValueIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                )}
                <div className="flex flex-wrap gap-1 items-center">
                  {visibleEngines.map((engine: string) => (
                    <BubbleTag key={engine} text={engine} color="red" />
                  ))}
                  {hiddenEngines.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1 transition-colors">
                          +{hiddenEngines.length} more
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3 max-h-60 overflow-y-auto" align="start">
                        <div className="flex flex-col gap-1.5 min-w-[180px]">
                          <p className="text-xs font-semibold text-gray-500 mb-1">All Malicious Engines</p>
                          {engines.map((engine: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <BubbleTag text={engine} color="red" />
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            );
          }

          if (rowData.isSuspiciousHits && Array.isArray(rowData.suspiciousEngines) && rowData.suspiciousEngines.length > 0) {
            const engines = rowData.suspiciousEngines;
            const visibleEngines = engines.slice(0, 2);
            const hiddenEngines = engines.slice(2);
            return (
              <div className="flex flex-wrap items-center gap-2">
                {showValueIcons && FieldValueIcon && (
                  <FieldValueIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                )}
                <div className="flex flex-wrap gap-1 items-center">
                  {visibleEngines.map((engine: string) => (
                    <BubbleTag key={engine} text={engine} color="yellow" />
                  ))}
                  {hiddenEngines.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-xs font-semibold text-amber-600 hover:text-amber-800 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 rounded px-1 transition-colors">
                          +{hiddenEngines.length} more
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3 max-h-60 overflow-y-auto" align="start">
                        <div className="flex flex-col gap-1.5 min-w-[180px]">
                          <p className="text-xs font-semibold text-gray-500 mb-1">All Suspicious Engines</p>
                          {engines.map((engine: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <BubbleTag text={engine} color="yellow" />
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            );
          }

          if (rowData.isRiskTag) {
            const valStr = String(value).toLowerCase();
            const isNo = valStr === "no" || valStr === "false";
            const isYes = valStr === "yes" || valStr === "true";
            
            let color: "green" | "red" | "gray" = "gray";
            
            if ((rowData as any).riskSentiment === "positive") {
              if (isYes) color = "green";
              else if (isNo) color = "red";
            } else {
              // Default to negative sentiment (Yes is Red, No is Green)
              if (isYes) color = "red";
              else if (isNo) color = "green";
            }

            return (
              <div className={`flex items-start gap-2`}>
                {showValueIcons && FieldValueIcon && (
                  <FieldValueIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                )}
                <BubbleTag 
                  text={String(value)} 
                  color={color} 
                />
              </div>
            );
          }

          return (
            <div className={`flex items-start gap-2`}>
              {showValueIcons && FieldValueIcon && (
                <FieldValueIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
              )}
              <TruncatableText
                text={textToRender}
                textColorClass={textColorClass}
              />
            </div>
          );
        },
      },
    ];
  }, [showValueIcons]);

  // Render a section with key-value pair data
  const renderKeyValueSection = (
    title: string,
    icon: LucideIcon,
    data: WebsiteAnalysisKeyValue[] | null,
    removePrefix: boolean = false,
    toggleOptions?: string[],
    selectedToggleOption?: string,
    onToggleOptionChange?: (option: string) => void,
    isLoading: boolean = false
  ) => {
    const tableData = data ? transformKeyValueData(data) : [];

    const columnsToUse = removePrefix
      ? keyValueColumns.map((col) => {
          if (col.key === "field") {
            return {
              ...col,
              render: (_value: string, row: Record<string, any>) => {
                const rowData = row as WebsiteAnalysisKeyValue;
                const FieldIcon = getIconForField(rowData.field);
                const formattedField = formatFieldName(rowData.field, true);

                return (
                  <span className="flex items-start gap-2">
                    {FieldIcon && (
                      <FieldIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                    )}
                    <span className={`font-bold ${getTextColorClass("gray")}`}>
                      {formattedField}
                    </span>
                  </span>
                );
              },
            };
          }
          return col;
        })
      : keyValueColumns;

    return (
      <div className="w-full">
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title={title}
            icon={icon}
            iconColorClass="text-gray-500"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={[]}
            negativeFlags={[]}
            mildNegativeFlags={[]}
            neutralFlags={[]}
            mildPositiveFlags={[]}
            positiveFlags={[]}
            flagTypeOrderList={[
              "extremeNegative",
              "negative",
              "mildNegative",
              "neutral",
              "mildPositive",
              "positive",
            ]}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={true}
          />
        </motion.div>

        {data && data.length > 0 ? (
          <motion.div variants={itemVariants} className="mt-2">
            <CustomTableView
              headerAndTotalRowBg="gray-100"
              columns={columnsToUse}
              data={tableData}
              initialRowLimit={tableData.length}
              isExpanded={true}
              showCSVExport={false}
              enableAlternatingRows={true}
              alternatingRowColor="gray"
              toggleOptions={toggleOptions}
              selectedToggleOption={selectedToggleOption}
              onToggleOptionChange={onToggleOptionChange}
              togglePosition="right"
              isLoading={isLoading}
            />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="mt-4">
            <EmptyState message={`No data available for ${title}`} />
          </motion.div>
        )}
      </div>
    );
  };

  // --- NEW DRA JSON MAPPINGS ---

  const newSslData = useMemo(() => {
    const ssl = websiteDataJson?.ssl;
    if (!ssl) return null;
    return [
      { field: "SSL Enabled", value: ssl.ssl_enabled ? "Yes" : "No", isRiskTag: true, riskSentiment: "positive", keyIcon: "Lock", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Certificate Valid", value: ssl.certificate_valid ? "Yes" : "No", isRiskTag: true, riskSentiment: "positive", keyIcon: "CheckCircle", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Issuer", value: ssl.issuer || "-", keyIcon: "Award", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Valid From", value: formatDateString(ssl.valid_from), keyIcon: "Calendar", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Valid To", value: formatDateString(ssl.valid_to), keyIcon: "Calendar", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Days To Expiry", value: ssl.days_to_expiry && ssl.days_to_expiry !== 0 ? ssl.days_to_expiry : "-", keyIcon: "Clock", keyIconColor: "blue", valueSentiment: "info" },
      { field: "TLS Version", value: ssl.tls_version || "-", keyIcon: "Shield", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Cipher Suite", value: ssl.cipher || "-", keyIcon: "Key", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Self Signed", value: ssl.self_signed ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "FileSignature", keyIconColor: "blue", valueSentiment: "info" }
    ] as (WebsiteAnalysisKeyValue & { isRiskTag?: boolean; riskSentiment?: string })[];
  }, [websiteDataJson]);

  const newDnsData = useMemo(() => {
    const dns = websiteDataJson?.dns;
    if (!dns) return null;
    return [
      { field: "A Records", value: Array.isArray(dns.a_records) && dns.a_records.length > 0 ? dns.a_records.join(", ") : "-", keyIcon: "Server", keyIconColor: "blue", valueSentiment: "info" },
      { field: "NS Records", value: Array.isArray(dns.ns_records) && dns.ns_records.length > 0 ? dns.ns_records.join(", ") : "-", keyIcon: "Network", keyIconColor: "blue", valueSentiment: "info" },
      { field: "MX Records", value: Array.isArray(dns.mx_records) && dns.mx_records.length > 0 ? dns.mx_records.join(", ") : "-", keyIcon: "Mail", keyIconColor: "blue", valueSentiment: "info" },
      { field: "TXT Records", value: Array.isArray(dns.txt_records) && dns.txt_records.length > 0 ? dns.txt_records.join(", ") : "-", keyIcon: "FileText", keyIconColor: "blue", valueSentiment: "info" },
      { field: "SPF Record", value: dns.spf_record || "-", keyIcon: "CheckSquare", keyIconColor: "blue", valueSentiment: "info" },
      { field: "DMARC Record", value: dns.dmarc_record || "-", keyIcon: "CheckSquare", keyIconColor: "blue", valueSentiment: "info" },
      { field: "DNSSEC Enabled", value: dns.dnssec_enabled ? "Yes" : "No", isRiskTag: true, riskSentiment: "positive", keyIcon: "Lock", keyIconColor: "blue", valueSentiment: "info" }
    ] as (WebsiteAnalysisKeyValue & { isRiskTag?: boolean; riskSentiment?: string })[];
  }, [websiteDataJson]);

  const newUrlData = useMemo(() => {
    const url = websiteDataJson?.url;
    if (!url) return null;
    const cred = url.credential_harvesting || {};
    const behav = url.page_behavior || {};

    const navFlowData = (navFlowDatastore?.data as any)?.data;
    const u = navFlowData?.url_consistency || {};
    const registeredUrl = u.registered_url ?? u.registeredUrl ?? url.registered_url ?? "-";
    const homepageRedirection = u.homepage_redirection ?? u.homepageRedirection ?? u.homepage_redirect ?? url.homepage_redirection ?? "-";
    const safeStr = (v: any) => (!v || v === "" ? "-" : String(v));

    return [
      { field: "Registered URL", value: safeStr(registeredUrl), keyIcon: "Link", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Homepage Redirection", value: safeStr(homepageRedirection), keyIcon: "CornerRightUp", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Initial URL", value: url.initial_url || "-", keyIcon: "Link", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Final URL", value: url.final_url || "-", keyIcon: "Link", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Number of Redirects", value: url.num_redirects && url.num_redirects !== 0 ? url.num_redirects : "-", keyIcon: "CornerRightDown", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Suspicious Redirect Chain", value: url.is_suspicious_chain ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "AlertTriangle", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Domain Changed on Redirect", value: url.domain_changed_on_redirect ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "Repeat", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Redirect Destination", value: url.redirect_destination || "-", keyIcon: "Compass", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Has Login Form", value: cred.has_login_form ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "LogIn", keyIconColor: "blue", valueSentiment: "info" },
      { field: "External Form Submission", value: cred.external_submission ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "Share", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Suspicious Downloads", value: behav.suspicious_downloads ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "Download", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Hidden Iframes", value: behav.hidden_iframes ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "EyeOff", keyIconColor: "blue", valueSentiment: "info" },
      { field: "Obfuscated Scripts", value: behav.obfuscated_scripts ? "Yes" : "No", isRiskTag: true, riskSentiment: "negative", keyIcon: "Code", keyIconColor: "blue", valueSentiment: "info" }
    ] as (WebsiteAnalysisKeyValue & { isRiskTag?: boolean; riskSentiment?: string })[];
  }, [websiteDataJson, navFlowDatastore]);

  const newMalwareData = useMemo(() => {
    const malware = websiteDataJson?.malware;
    if (!malware) return null;
    const maliciousEngines = (malware.threat_names && typeof malware.threat_names === "object")
      ? Object.entries(malware.threat_names)
          .filter(([_, data]: any) => data && (data.category === "malicious" || data.result === "malicious" || data.result === "malware"))
          .map(([name]) => name)
      : [];

    const suspiciousEngines = (malware.threat_names && typeof malware.threat_names === "object")
      ? Object.entries(malware.threat_names)
          .filter(([_, data]: any) => data && (data.category === "suspicious" || data.result === "suspicious"))
          .map(([name]) => name)
      : [];
    
    const maliciousHits = malware.malicious_hits && malware.malicious_hits !== 0 ? malware.malicious_hits : "-";
    const suspiciousHits = malware.suspicious_hits && malware.suspicious_hits !== 0 ? malware.suspicious_hits : "-";

    return [
      { 
        field: "Blacklisted", 
        value: malware.is_blacklisted ? "Yes" : "No", 
        isRiskTag: true,
        riskSentiment: "negative",
        keyIcon: "XOctagon", 
        keyIconColor: "blue", 
        valueSentiment: "info" 
      },
      { 
        field: "Malicious Hits", 
        value: maliciousHits, 
        maliciousEngines: maliciousEngines,
        isMalwareHits: true,
        keyIcon: "AlertOctagon", 
        keyIconColor: "blue", 
        valueSentiment: "info" 
      },
      { 
        field: "Suspicious Hits", 
        value: suspiciousHits, 
        suspiciousEngines: suspiciousEngines,
        isSuspiciousHits: true,
        keyIcon: "AlertTriangle", 
        keyIconColor: "blue", 
        valueSentiment: "info" 
      }
    ] as (WebsiteAnalysisKeyValue & { isMalwareHits?: boolean; maliciousEngines?: string[]; isSuspiciousHits?: boolean; suspiciousEngines?: string[]; isBlacklistedProp?: boolean; })[];
  }, [websiteDataJson]);



  return (
    <motion.div
      className="space-y-8 pb-8"
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

      {/* Website Integrity section moved from Merchant Overview */}
      {selectedCase && (
        <motion.div variants={itemVariants} className="mt-6">
          {(() => {
            const Icon = getIconByName("Globe");
            
            const websiteWorking = (() => {
              if (!redFlags || !Array.isArray(redFlags)) return null;

              const rf006 = redFlags.find(
                (f) =>
                  String(f?.code || "").toUpperCase() ===
                  "RF006"
              );
              if (!rf006) return null;

              const statusVal = rf006.overallTriggered ?? rf006.overall_triggered;
              const isTriggered =
                statusVal === true ||
                String(statusVal).toLowerCase() === "true" ||
                statusVal === 1 ||
                String(statusVal).toLowerCase() === "yes";
              
              return !isTriggered;
            })();

            const AnalysisRightElement =
              websiteWorking === null ? null : (() => {
                const IconComponent = getIconByName(
                  websiteWorking ? "Check" : "X"
                );
                return (
                  <BubbleTag
                    text={
                      websiteWorking
                        ? "Website Working"
                        : "Website Not Working"
                    }
                    color={
                      websiteWorking
                        ? "emerald"
                        : "red"
                    }
                    hasInsideIcon={true}
                    size="md"
                    icon={
                      IconComponent ? (
                        <IconComponent className="h-3.5 w-3.5" />
                      ) : undefined
                    }
                  />
                );
              })();

            return (
              <SectionHeaderWithFlags
                positiveFlags={[]}
                negativeFlags={[]}
                neutralFlags={[]}
                title="Website Analysis"
                icon={Icon || undefined}
                allowCollapse={false}
              />
            );
          })()}

          {/* Language Support displayed as RiskAssessmentParagraph (matches Frequent Words card style) */}
          {/* {websiteDataJson && (
            <motion.div variants={itemVariants} className="mt-4">
              <RiskAssessmentParagraph
                title={"Language Support"}
                noColor={true}
                justification={languageSupportValue}
              />
            </motion.div>
          )} */}

          <div className="mt-3">
            {(() => {
              const integrity = getWebsiteIntegrity(selectedCase as any);

              // Prefer values from the RF012 datastore API when present
              const rf012Data = (webAnalysisDatastore?.data as any)?.data;
              const subrules = Array.isArray(rf012Data?.subrules) ? rf012Data.subrules : [];
              
              const declaredDesc = (() => {
                const cand = [
                  (selectedCase as any)?.mccDescription,
                  (selectedCase as any)?.mcc_description,
                  (selectedCase as any)?.mccCode,
                  (selectedCase as any)?.mcc,
                ];
                for (const v of cand) {
                  if (v !== undefined && v !== null && String(v).trim() !== "")
                    return String(v);
                }
                return "N/A";
              })();

              const observedDesc = (() => {
                const cand = [
                  (selectedCase as any)?.observedWebsiteActivity,
                  (selectedCase as any)?.observed_activity,
                ];
                for (const v of cand) {
                  if (v !== undefined && v !== null && String(v).trim() !== "")
                    return String(v);
                }
                return "N/A";
              })();

              const webAnalysisReasoning =
                rf012Data?.overall_reasoning ??
                integrity?.reasoning ??
                "N/A";

              const isMatchStatus = String(rf012Data?.overall_triggered).toLowerCase() === "no";

              const ArrowIcon =
                getIconByName("ArrowsHorizontal") ||
                getIconByName("MoveHorizontal") ||
                getIconByName("ArrowLeftRight") ||
                getIconByName("ArrowsLeftRight");

              const ChevronRightIcon = LucideIcons.ChevronRight;
              const StatusIcon = isMatchStatus
                ? getIconByName("CheckCircle2")
                : getIconByName("XCircle");

              const statusText = isMatchStatus ? "Match" : "Mismatch";
              const statusColorClass = isMatchStatus
                ? "text-green-700"
                : "text-red-700";

              return (
                <div>
                  {/* (Moved Is Sub domain & Copyright Line to Website Integrity section) */}
                  

                  {/* URL Consistency subsection under Website Integrity */}
                  <div className="mt-6">
                    {/* <div className="flex items-center justify-between py-0">
                      <div className="flex items-center">
                        <span className="text-md font-semibold text-gray-500">
                          URL Consistency
                        </span>
                      </div>
                    </div> */}

                    <div className="mt-0">
                      {(() => {
                        // Prefer API-provided URL consistency when available
                        const tableData = ((): any[] => {
                          const navFlowData = (navFlowDatastore?.data as any)?.data;
                          if (
                            navFlowData &&
                            navFlowData.url_consistency &&
                            typeof navFlowData.url_consistency ===
                              "object"
                          ) {
                            const u = navFlowData.url_consistency;
                            const reg =
                              u.registered_url ?? u.registeredUrl ?? null;
                            const home =
                              u.homepage_redirection ??
                              u.homepageRedirection ??
                              u.homepage_redirect ??
                              null;
                            const pay = u.payment_url ?? u.paymentUrl ?? null;
                            const ret = u.return_url ?? u.returnUrl ?? null;

                            return [
                              {
                                field: "Registered URL",
                                value:
                                  reg === null ||
                                  typeof reg === "undefined" ||
                                  reg === ""
                                    ? "N/A"
                                    : String(reg),
                                keyIcon: "Link",
                                keyIconColor: "blue",
                                matches: true,
                              },
                              {
                                field: "Homepage Redirection",
                                value:
                                  home === null ||
                                  typeof home === "undefined" ||
                                  home === ""
                                    ? "N/A"
                                    : String(home),
                                keyIcon: "Link",
                                keyIconColor: "blue",
                                matches: false,
                              },
                              {
                                field: "Payment URL",
                                value:
                                  pay === null ||
                                  typeof pay === "undefined" ||
                                  pay === ""
                                    ? "N/A"
                                    : String(pay),
                                keyIcon: "Link",
                                keyIconColor: "blue",
                                matches: false,
                              },
                              {
                                field: "Return URL",
                                value:
                                  ret === null ||
                                  typeof ret === "undefined" ||
                                  ret === ""
                                    ? "N/A"
                                    : String(ret),
                                keyIcon: "Link",
                                keyIconColor: "blue",
                                matches: false,
                              },
                            ];
                          }

                          return getUrlConsistency(selectedCase as any);
                        })();

                        const MatchIcon = getIconByName("Check");
                        const MismatchIcon = getIconByName("X");

                        const columns = [
                          {
                            key: "field",
                            header: "Field",
                            width: "260px",
                            align: "left" as const,
                            verticalAlign: "top" as const,
                            render: (
                              value: string,
                              row: Record<string, any>
                            ) => {
                              const iconName = (row as any).keyIcon as
                                | string
                                | undefined;
                              // Prefer an explicit keyIcon present on the row,
                              // otherwise fall back to the generic field -> icon
                              // mapper so rows produced by helper functions also
                              // show an icon.
                              const FieldIcon = iconName
                                ? getIconByName(iconName)
                                : getIconForField((row as any).field);
                              const matches = !!(row as any).matches;
                              const showTag =
                                typeof matches === "boolean" &&
                                (row as any).field !== "Registered URL";
                              return (
                                <span className="flex items-center gap-2">
                                  {FieldIcon && (
                                    <FieldIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                                  )}
                                  <span className="font-bold text-gray-700">
                                    {value}
                                  </span>
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
                            render: (
                              value: string,
                              row: Record<string, any>
                            ) => {
                              const url = value || "N/A";
                              const isNA =
                                url === "N/A" || url.trim() === "N/A";
                              const IconExternal =
                                getIconByName("ExternalLink");

                              if (isNA) {
                                return (
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-500 truncate max-w-[680px]">
                                      {url}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex items-center gap-3">
                                  <a
                                    href={String(url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline truncate max-w-[680px]"
                                  >
                                    {url}
                                  </a>
                                  {IconExternal && (
                                    <IconExternal className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              );
                            },
                          },
                        ];

                        return (
                          <div className="space-y-12">
                            {/* URL Consistency table moved to Website Integrity section below */}

                            {/* Website Quality Checklist subsection */}
                            <div className="mt-6">
                              <div className="flex items-center gap-3 py-0">
                                <span className="text-md font-semibold text-gray-500 flex items-center gap-3">
                                  Website Quality Checklist
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
                                            getIconByName("AlertTriangle") ||
                                            getIconByName("Triangle");
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
                                      ? "lg:grid-cols-4"
                                      : "lg:grid-cols-3"
                                  } gap-4`}
                                >
                                  {outputFormatLoading ? (
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
                                  ) : (
                                    websiteQualityItems.map(
                                      (item: any, idx: number) => {
                                        const cardOnClick = () => {
                                          handleOpenFlagDetailsArtifact(item.code);
                                        };

                                        return (
                                          <WebsiteQualityCard
                                            key={idx}
                                            name={item.name}
                                            status={item.status}
                                            apiTrueIsAlert={true}
                                            noData={!!item.noData}
                                            reasoning={sanitizeReasoning(
                                              item.reasoning
                                            )}
                                            onClick={cardOnClick}
                                          />
                                        );
                                      }
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Frequent Words (moved from Content Analysis) - render as a two-column table (heading | words) with hidden headers */}
                            {frequentWordsEntry &&
                              Array.isArray(frequentWordsEntry.value) &&
                              frequentWordsEntry.value.length > 0 && (
                                <div className="mt-6">
                                  <motion.div variants={itemVariants}>
                                    <RiskAssessmentParagraph
                                      title={"Frequent Words"}
                                      noColor={true}
                                      // Join frequent words into a single comma-separated justification string
                                      justification={String(
                                        (frequentWordsEntry.value || []).join(
                                          ", "
                                        )
                                      )}
                                    />
                                  </motion.div>
                                </div>
                              )}

                            {/* MCC Classification Section */}
                            <motion.div variants={itemVariants} className="mt-12">
                              <SectionHeaderWithFlags
                                positiveFlags={[]}
                                negativeFlags={[]}
                                neutralFlags={[]}
                                title="MCC Classification"
                                icon={LucideIcons.CreditCard}
                                allowCollapse={false}
                                titleRightElement={
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-[10px] font-bold text-purple-600 tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                    AI LABELLED
                                  </div>
                                }
                              />
                              
                              {websiteMccLoading ? (
                                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex items-center justify-center">
                                  <LucideIcons.Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                                </div>
                              ) : (websiteMccData && (() => {
                                const code = String(websiteMccData.mcc_code || "").trim().toUpperCase();
                                const hasCode = code !== "" && code !== "UNKNOWN" && code !== "N/A" && code !== "-";
                                const lob = String(websiteMccData.lob || websiteMccData.industry_group || "").trim();
                                const hasLob = lob !== "" && lob !== "-";
                                const bc = String(websiteMccData.business_category || "").trim();
                                const hasBc = bc !== "" && bc !== "-";
                                const sc = String(websiteMccData.sub_category || "").trim();
                                const hasSc = sc !== "" && sc !== "-";
                                return hasCode || hasLob || hasBc || hasSc;
                              })()) ? (
                                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                                  {/* Top Split Portion (First 2 Rows) */}
                                  <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-8">
                                    {/* Left Column */}
                                    <div className="w-full md:w-1/4 flex flex-col justify-start shrink-0">
                                      <div>
                                        <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                                          {websiteMccData.mcc_code || "-"}
                                        </div>
                                        <div className="text-sm font-semibold text-gray-500 mt-2">
                                          {websiteMccData.mcc_description || "N/A"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Vertical Divider */}
                                    <div className="hidden md:block w-px bg-gray-100 self-stretch my-1" />

                                    {/* Right Column (Top 2 Rows) */}
                                    <div className="flex-1 flex flex-col justify-start gap-4">
                                      {/* Top Row: LOB, Business Category, and Sub Category */}
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                          <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                                            LOB
                                          </div>
                                          <div className="text-sm font-semibold text-gray-800 mt-1">
                                            {websiteMccData.lob || websiteMccData.industry_group || "-"}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                                            Business Category
                                          </div>
                                          <div className="text-sm font-semibold text-gray-800 mt-1">
                                            {websiteMccData.business_category || "-"}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                                            Sub Category
                                          </div>
                                          <div className="text-sm font-semibold text-gray-800 mt-1">
                                            {websiteMccData.sub_category || "-"}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Middle Row: Confidence Score */}
                                      {websiteMccData.confidence_score !== undefined && (() => {
                                        const isHighConfidence = (websiteMccData.confidence_score || 0) >= 0.75;
                                        return (
                                          <div>
                                            <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                                              Confidence Score
                                            </div>
                                            <div className="flex items-center gap-4 mt-2">
                                              <div className="relative flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                  className={`h-full ${isHighConfidence ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full transition-all duration-500`} 
                                                  style={{ width: `${Math.min(Math.max((websiteMccData.confidence_score || 0) * 100, 0), 100)}%` }}
                                                />
                                              </div>
                                              <span className={`text-sm font-bold ${isHighConfidence ? 'text-emerald-600' : 'text-amber-600'} shrink-0`}>
                                                {websiteMccData.confidence_score?.toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Bottom Full-Width Portion (Reasoning dropdown) */}
                                  {websiteMccData.reasoning && (
                                    <div className="border-t border-gray-100 -mx-6 -mb-6 px-6 bg-gray-50/50 rounded-b-xl">
                                      <div 
                                        className="flex items-center justify-between py-3.5 cursor-pointer select-none"
                                        onClick={() => setIsMccReasoningExpanded(!isMccReasoningExpanded)}
                                      >
                                        <div className="flex items-center gap-2">
                                          {isMccReasoningExpanded ? (
                                            <LucideIcons.ChevronDown className="h-4 w-4 text-gray-500" />
                                          ) : (
                                            <LucideIcons.ChevronRight className="h-4 w-4 text-gray-500" />
                                          )}
                                          <span className="text-xs font-bold text-gray-600 tracking-wider uppercase">
                                            AI Reasoning
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {isMccReasoningExpanded && (
                                        <div className="pb-4 pl-6 pr-6">
                                          <p className="text-xs text-gray-600 leading-relaxed">
                                            {websiteMccData.reasoning}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center text-gray-500 text-sm">
                                  No MCC Classification data available for this case.
                                </div>
                              )}
                            </motion.div>

                            {/* Traffic & Engagement Section */}
                            <motion.div variants={itemVariants} className="mt-12">
                              <ArtifactSectionCollapsible
                                defaultOpen={false}
                                title={
                                  <div className="flex items-center gap-2">
                                    <LucideIcons.TrendingUp className="h-5 w-5 text-indigo-600" />
                                    <span className="text-lg font-semibold text-gray-900">
                                      Traffic & Engagement
                                    </span>
                                  </div>
                                }
                              >
                                <div className="mt-6 flex flex-col gap-6">
                                  {/* Flat Key Metrics Cards */}
                                  <div className="w-full">
                                    <KeyMetrics
                                      hardcodedMetrics={trafficMetricsData.all}
                                      isMetricsExpanded={true}
                                      setIsMetricsExpanded={() => {}}
                                      showCollapse={false}
                                      showHeader={false}
                                      gridCols={4}
                                    />
                                  </div>

                                  {/* Graph & Country Traffic Row */}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                    {/* Monthly Visits Graph Card */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                                      <h3 className="text-base font-bold text-gray-950 mb-6">Monthly Visits</h3>
                                      
                                      <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart
                                            data={trafficEngagementSampleData.monthlyVisits}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                          >
                                            <defs>
                                              <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                              </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} stroke="#f3f4f6" />
                                            <XAxis
                                              dataKey="month"
                                              axisLine={false}
                                              tickLine={false}
                                              tick={{ fill: '#9ca3af', fontSize: 11 }}
                                            />
                                            <YAxis
                                              axisLine={false}
                                              tickLine={false}
                                              tickFormatter={(val) => {
                                                if (val === 0) return "0";
                                                if (val >= 1000000) return `${val / 1000000}M`;
                                                if (val >= 1000) return `${val / 1000}K`;
                                                return val;
                                              }}
                                              domain={[0, 1000000]}
                                              ticks={[0, 250000, 500000, 750000, 1000000]}
                                              tick={{ fill: '#9ca3af', fontSize: 11 }}
                                            />
                                            <RechartsTooltip
                                              content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  const valueStr = data.visits >= 1000000 
                                                    ? `${(data.visits / 1000000).toFixed(2)}M`
                                                    : `${(data.visits / 1000).toFixed(0)}K`;
                                                  return (
                                                    <div className="bg-gray-950 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg border border-gray-800">
                                                      <div className="text-gray-400 text-[10px] uppercase font-bold">{data.month}</div>
                                                      <div className="mt-0.5">{valueStr} Visits</div>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }}
                                            />
                                            <Area
                                              type="monotone"
                                              dataKey="visits"
                                              stroke="#8b5cf6"
                                              strokeWidth={2.5}
                                              fillOpacity={1}
                                              fill="url(#visitsGradient)"
                                            />
                                          </AreaChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>

                                    {/* Traffic by Country Table Card */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                                      <div>
                                        <h3 className="text-base font-bold text-gray-950 mb-5">Traffic by Country</h3>
                                        
                                        <div className="w-full">
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className="border-b border-gray-100">
                                                <th className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pb-3">COUNTRY</th>
                                                <th className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pb-3 text-right">SHARE</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {trafficEngagementSampleData.countryTraffic.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                  <td className="py-3 flex items-center gap-3">
                                                    <span className="text-2xl leading-none select-none" role="img" aria-label={item.country}>
                                                      {item.flag}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-800">{item.country}</span>
                                                  </td>
                                                  <td className="py-3 text-sm font-bold text-gray-900 text-right pr-1">
                                                    {item.share}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Referral Sources & Outgoing Links Row */}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                    {/* Top Referring Sources */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                                      <div>
                                        {/* Header */}
                                        <div className="flex items-center gap-2 mb-5">
                                          <LucideIcons.Link className="h-4 w-4 text-gray-700 shrink-0" />
                                          <h3 className="text-base font-bold text-gray-950">
                                            Top Referring Sources <span className="text-xs font-normal text-slate-400 ml-1.5">(Incoming)</span>
                                          </h3>
                                        </div>

                                        {/* Table */}
                                        <div className="w-full">
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className="border-b border-gray-100">
                                                <th className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pb-3">SOURCE URL</th>
                                                <th className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pb-3 text-right">VISITS</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {trafficEngagementSampleData.referringSources.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                  <td className="py-3 flex items-center gap-2">
                                                    <LucideIcons.Link className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" />
                                                    <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors truncate max-w-[200px] sm:max-w-none">
                                                      {item.url}
                                                    </span>
                                                  </td>
                                                  <td className="py-3 text-xs font-bold text-indigo-600 text-right pr-1">
                                                    {item.visits.toLocaleString()}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Top Outgoing Links */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                                      <div>
                                        {/* Header */}
                                        <div className="flex items-center gap-2 mb-5">
                                          <LucideIcons.Link className="h-4 w-4 text-gray-700 shrink-0" />
                                          <h3 className="text-base font-bold text-gray-950">
                                            Top Outgoing Links <span className="text-xs font-normal text-slate-400 ml-1.5">(Destinations)</span>
                                          </h3>
                                        </div>

                                        {/* Table */}
                                        <div className="w-full">
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className="border-b border-gray-100">
                                                <th className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pb-3">DESTINATION URL</th>
                                                <th className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pb-3 text-right">CLICKS</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {trafficEngagementSampleData.outgoingLinks.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                  <td className="py-3 flex items-center gap-2">
                                                    <LucideIcons.Link className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" />
                                                    <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors truncate max-w-[200px] sm:max-w-none">
                                                      {item.url}
                                                    </span>
                                                  </td>
                                                  <td className="py-3 text-xs font-bold text-indigo-600 text-right pr-1">
                                                    {item.clicks.toLocaleString()}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </ArtifactSectionCollapsible>
                            </motion.div>

                                {/* Website Snapshot Section */}
                                <motion.div variants={itemVariants} className="mt-12">
                                  <SectionHeaderWithFlags
                                    title="Website Snapshot"
                                    icon={LucideIcons.Camera}
                                    iconColorClass="text-gray-500"
                                    titleColorClass="text-blue-700"
                                    extremeNegativeFlags={[]}
                                    negativeFlags={[]}
                                    mildNegativeFlags={[]}
                                    neutralFlags={[]}
                                    mildPositiveFlags={[]}
                                    positiveFlags={[]}
                                    flagTypeOrderList={[
                                      "extremeNegative",
                                      "negative",
                                      "mildNegative",
                                      "neutral",
                                      "mildPositive",
                                      "positive",
                                    ]}
                                    initialRowLimit={5}
                                    allowCollapse={false}
                                    defaultExpanded={true}
                                  />

                                  <div className="mt-6">
                                    {visionLoading ? (
                                      <div className="flex justify-center p-8">
                                        <LucideIcons.Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                      </div>
                                    ) : websiteSnapshots.length > 0 ? (
                                      <div 
                                        className="grid gap-4 overflow-x-auto pb-4 website-snapshot-scrollbar w-full max-w-full"
                                        style={{
                                          gridAutoFlow: 'column',
                                          gridAutoColumns: 'calc((100% - 3rem) / 4)'
                                        }}
                                      >
                                        {websiteSnapshots.map((result: any, idx: number) => {
                                          const imageBase64 = result.bs4 || result.screenshot_b64;
                                          return (
                                            <div 
                                              key={idx} 
                                              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col w-full"
                                              onClick={() => setSelectedSnapshot(result)}
                                            >
                                              <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-50 shrink-0">
                                                 {imageBase64 ? (
                                                   <img 
                                                     src={imageBase64.startsWith("data:image") 
                                                       ? imageBase64 
                                                       : `data:image/png;base64,${imageBase64}`} 
                                                     alt={result.screenshot_name || `Snapshot ${idx + 1}`} 
                                                     className="w-full h-full object-cover"
                                                   />
                                                 ) : (
                                                   <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                                                     <LucideIcons.ImageOff className="h-8 w-8" />
                                                     <span className="text-xs">No screenshot available</span>
                                                    </div>
                                                 )}
                                              </div>
                                              {result.timestamp && (
                                                <div className="px-3 py-2 border-t border-gray-50 bg-gray-50/30 flex items-center gap-2">
                                                  <LucideIcons.Clock className="h-3 w-3 text-gray-400" />
                                                  <span className="text-[10px] font-medium text-gray-500 truncate">
                                                    {formatDateString(result.timestamp)}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <EmptyState message="No website snapshots available" />
                                    )}
                                  </div>
                                </motion.div>



                            {/* Full-width Product Analysis (moved here after Frequent Words) */}
                            <div className="mt-12">
                              <motion.div variants={itemVariants}>
                                {navigationLinks.length > 0 ? (
                                  <div>
                                    <SectionHeaderWithFlags
                                      title="Product Analysis"
                                      icon={getIconByName("ShoppingCart")!}
                                      iconColorClass="text-gray-500"
                                      titleColorClass="text-blue-700"
                                      extremeNegativeFlags={[]}
                                      negativeFlags={[]}
                                      mildNegativeFlags={[]}
                                      neutralFlags={[]}
                                      mildPositiveFlags={[]}
                                      positiveFlags={[]}
                                      flagTypeOrderList={[
                                        "extremeNegative",
                                        "negative",
                                        "mildNegative",
                                        "neutral",
                                        "mildPositive",
                                        "positive",
                                      ]}
                                      initialRowLimit={5}
                                      allowCollapse={false}
                                      defaultExpanded={false}
                                      toggles={
                                        navigationLinks.length > 1
                                          ? [
                                              {
                                                id: "navigationLinks",
                                                options: navigationLinks.map(
                                                  (link: any) => link.linkName
                                                ),
                                                selectedOption:
                                                  navigationLinks[
                                                    selectedNavigationLinkIndex
                                                  ]?.linkName ||
                                                  navigationLinks[0]
                                                    ?.linkName ||
                                                  "",
                                                onOptionChange: (
                                                  option: string
                                                ) => {
                                                  const linkIndex =
                                                    navigationLinks.findIndex(
                                                      (link: any) =>
                                                        link.linkName === option
                                                    );
                                                  if (linkIndex !== -1) {
                                                    setSelectedNavigationLinkIndex(
                                                      linkIndex
                                                    );
                                                  }
                                                },
                                                position: "right",
                                                size: "small",
                                              },
                                            ]
                                          : []
                                      }
                                    />

                                    {productTableData &&
                                    productTableData.length > 0 ? (
                                      <div className="mt-2">
                                        <CustomTableView
                                          headerAndTotalRowBg="gray-100"
                                          columns={productAnalysisColumns}
                                          data={productTableData}
                                          initialRowLimit={
                                            productTableData.length
                                          }
                                          isExpanded={true}
                                          showCSVExport={false}
                                          isLoading={productAnalysisLoading}
                                          enableAlternatingRows={true}
                                          alternatingRowColor="gray"
                                          onRowClick={(row: any) => {
                                            openProductDetailArtifact(row);
                                          }}
                                          rowClassName="cursor-pointer hover:bg-gray-50 transition-colors"
                                        />
                                      </div>
                                    ) : (
                                      <div className="mt-4">
                                        <EmptyState message="No data available for Product Analysis" />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  renderKeyValueSection(
                                    "Product Analysis",
                                    getIconByName("ShoppingCart")!,
                                    productAnalysisData,
                                    false,
                                    undefined,
                                    undefined,
                                    undefined,
                                    productAnalysisLoading
                                  )
                                )}
                              </motion.div>
                            </div>



                                {/* 4. Reverse Product Image Search */}
                                <motion.div variants={itemVariants} className="mt-12">
                                  <div className="mt-6">
                                    {reverseImageSearchLoading ? (
                                      <div className="flex items-center justify-center py-10">
                                        <CustomLoader />
                                      </div>
                                    ) : (
                                      <ReverseImageSearchSection
                                        data={
                                          reverseImageSearchData?.data?.reverse_image?.results ||
                                          []
                                        }
                                        totalScanned={
                                          reverseImageSearchData?.data?.reverse_image?.sources_processed ||
                                          reverseImageSearchData?.data?.reverse_image?.total_scanned ||
                                          0
                                        }
                                        redFlags={redFlags}
                                      />
                                    )}
                                  </div>
                                </motion.div>


                            {/* Website Integrity Key Metrics - inserted after Contact Data */}
                            <div className="mt-6">
                              <motion.div variants={itemVariants}>
                                {(() => {
                                  const websiteWorking = (() => {
                                    if (!redFlags || !Array.isArray(redFlags)) return null;

                                    const rf006 = redFlags.find(
                                      (f) =>
                                        String(f?.code || "").toUpperCase() ===
                                        "RF006"
                                    );
                                    if (!rf006) return null;

                                    const statusVal = rf006.overallTriggered ?? rf006.overall_triggered;
                                    return statusVal === true || statusVal === "true";
                                  })();
                                  
                                  return (
                                    <SectionHeaderWithFlags
                                      title="Website Integrity"
                                      icon={getIconByName("Shield")!}
                                      iconColorClass="text-gray-500"
                                      titleColorClass="text-blue-700"
                                      extremeNegativeFlags={[]}
                                      negativeFlags={[]}
                                      mildNegativeFlags={[]}
                                      neutralFlags={[]}
                                      mildPositiveFlags={[]}
                                      positiveFlags={[]}
                                      flagTypeOrderList={[
                                        "extremeNegative",
                                        "negative",
                                        "mildNegative",
                                        "neutral",
                                        "mildPositive",
                                        "positive",
                                      ]}
                                      initialRowLimit={5}
                                      allowCollapse={false}
                                      defaultExpanded={true}
                                    />
                                  );
                                })()}

                                <div className="mt-3">
                                  <KeyMetrics
                                    hardcodedMetrics={websiteIntegrityMetrics}
                                    isMetricsExpanded={
                                      isIntegrityMetricsExpanded
                                    }
                                    setIsMetricsExpanded={
                                      setIsIntegrityMetricsExpanded
                                    }
                                    showCollapse={true}
                                    showHeader={false}
                                    isLoading={malwareDetectionLoading || domainInfoLoading || merchantWebAnalysisLoading}
                                  />
                                </div>

                                {/* Combined box showing Is Sub domain and Copyright Line under Website Integrity header */}
                                <motion.div
                                  variants={itemVariants}
                                  className="mt-4"
                                >
                                  <div className="bg-white border border-gray-200 rounded p-3">
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-start gap-4">
                                        <div className="text-sm font-medium text-gray-700 w-48 flex items-center gap-2">
                                          {(() => {
                                            const Icon =
                                              getIconForField(
                                                "Is Sub domain"
                                              );
                                            return Icon ? (
                                              <Icon className="h-4 w-4 text-gray-500" />
                                            ) : null;
                                          })()}
                                          <span>Is Sub domain</span>
                                        </div>
                                        <div className="text-sm text-gray-900 flex-1 min-w-0">
                                          <div className="truncate">
                                            <TruncatableText
                                              text={isSubdomainValue}
                                              textColorClass="text-gray-900"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-4">
                                        <div className="text-sm font-medium text-gray-700 w-48 flex items-center gap-2">
                                          {(() => {
                                            const Icon =
                                              getIconForField(
                                                "Copyright Line"
                                              );
                                            return Icon ? (
                                              <Icon className="h-4 w-4 text-gray-500" />
                                            ) : null;
                                          })()}
                                          <span>Copyright Line</span>
                                        </div>
                                        <div className="text-sm text-gray-900 flex-1 min-w-0">
                                          <div className="truncate">
                                            <TruncatableText
                                              text={copyrightLineValue}
                                              textColorClass="text-gray-900"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* FATF Status Row */}
                                      <div className="flex items-start gap-4">
                                        <div className="text-sm font-medium text-gray-700 w-48 flex items-center gap-2">
                                          <LucideIcons.Shield className="h-4 w-4 text-gray-500" />
                                          <span>FATF Status</span>
                                        </div>
                                        <div className="text-sm text-gray-900 flex-1 min-w-0">
                                          {(() => {
                                            const ds = (domainInfoDatastore?.data as any)?.data;
                                            const raw =
                                              ds?.fatf_status ??
                                              ds?.fatf ??
                                              websiteDataJson?.domain_info
                                                ?.fatf_status ??
                                              websiteDataJson?.domain_info
                                                ?.fatf ??
                                              websiteDataJson?.fatf_status ??
                                              websiteDataJson?.fatf ??
                                              outputFormatData?.fatf_status ??
                                              outputFormatData?.fatf ??
                                              null;

                                          if (
                                            raw === null ||
                                            raw === undefined ||
                                            String(raw).trim() === ""
                                          ) {
                                            return (
                                              <div className="flex items-start gap-4">
                                                <div className="text-sm font-medium text-gray-700 w-48">
                                                  <span>FATF Status</span>
                                                </div>
                                                <div className="text-sm text-gray-500 flex-1 min-w-0">
                                                  -
                                                </div>
                                              </div>
                                            );
                                          }

                                          const s = String(raw)
                                            .trim()
                                            .toLowerCase();
                                          let valueLabel = String(raw);
                                          let IconComponent: any =
                                            LucideIcons.Shield;

                                          if (
                                            s === "not listed" ||
                                            s === "not_listed" ||
                                            s === "notlisted"
                                          ) {
                                            valueLabel = "Not listed";
                                            IconComponent = LucideIcons.Shield;
                                          } else if (
                                            s.includes("grey") ||
                                            s.includes("gray")
                                          ) {
                                            valueLabel = "Greylisted";
                                            IconComponent =
                                              LucideIcons.AlertTriangle;
                                          } else if (s.includes("black")) {
                                            valueLabel = "Blacklisted";
                                            IconComponent =
                                              LucideIcons.XOctagon;
                                          }

                                          return (
                                            <div className="flex items-start gap-4">
                                              <div className="text-sm font-medium text-gray-700 w-48 flex items-center gap-2">
                                                <IconComponent className="h-4 w-4 text-gray-500" />
                                                <span>FATF Status</span>
                                              </div>
                                              <div className="text-sm text-gray-900 flex-1 min-w-0">
                                                <div className="truncate">
                                                  <TruncatableText
                                                    text={valueLabel}
                                                    textColorClass="text-gray-900"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>


                                {/* SSL Certificate Details KPI Section */}
                                <motion.div variants={itemVariants} className="mt-12">
                                  {websiteDataJson?.ssl ? (
                                    <>
                                      {(() => {
                                        const ssl = websiteDataJson.ssl;
                                        const SslEnabledIcon = getIconByName(ssl.ssl_enabled ? "Check" : "X");
                                        const CertValidIcon = getIconByName(ssl.certificate_valid ? "Check" : "X");

                                        const SslRightElement = (
                                          <div className="flex items-center gap-2">
                                            <BubbleTag
                                              text={ssl.ssl_enabled ? "Secure" : "Not Secure"}
                                              color={ssl.ssl_enabled ? "emerald" : "red"}
                                              hasInsideIcon={true}
                                            size="md"
                                              icon={SslEnabledIcon ? <SslEnabledIcon className="h-3.5 w-3.5" /> : undefined}
                                            />
                                            <BubbleTag
                                              text={ssl.certificate_valid ? "Verified Certificate" : "Unverified Certificate"}
                                              color={ssl.certificate_valid ? "emerald" : "red"}
                                              hasInsideIcon={true}
                                            size="md"
                                              icon={CertValidIcon ? <CertValidIcon className="h-3.5 w-3.5" /> : undefined}
                                            />
                                          </div>
                                        );

                                        return (
                                          <SectionHeaderWithFlags
                                            title="SSL Certificate Details"
                                            icon={getIconByName("Lock")!}
                                            iconColorClass="text-gray-500"
                                            titleColorClass="text-blue-700"
                                            titleRightElement={SslRightElement}
                                            extremeNegativeFlags={[]}
                                            negativeFlags={[]}
                                            mildNegativeFlags={[]}
                                            neutralFlags={[]}
                                            mildPositiveFlags={[]}
                                            positiveFlags={[]}
                                            initialRowLimit={5}
                                            allowCollapse={false}
                                            defaultExpanded={true}
                                          />
                                        );
                                      })()}
                                      
                                      <div className="mt-3">
                                        <KeyMetrics
                                          hardcodedMetrics={sslIntegrityMetrics}
                                          isMetricsExpanded={isSslMetricsExpanded}
                                          setIsMetricsExpanded={setIsSslMetricsExpanded}
                                          showCollapse={true}
                                          showHeader={false}
                                          isLoading={malwareDetectionLoading || merchantWebAnalysisLoading}
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <SectionHeaderWithFlags
                                        title="SSL Certificate Details"
                                        icon={getIconByName("Lock")!}
                                        iconColorClass="text-gray-500"
                                        titleColorClass="text-blue-700"
                                        extremeNegativeFlags={[]}
                                        negativeFlags={[]}
                                        mildNegativeFlags={[]}
                                        neutralFlags={[]}
                                        mildPositiveFlags={[]}
                                        positiveFlags={[]}
                                        initialRowLimit={5}
                                        allowCollapse={false}
                                        defaultExpanded={true}
                                      />
                                      <div className="mt-4">
                                        <EmptyState message="No data available for SSL Certificate Details" />
                                      </div>
                                    </>
                                  )}
                                </motion.div>

                                {/* DNS Infrastructure KPI Section */}
                                <motion.div variants={itemVariants} className="mt-12">
                                  {websiteDataJson?.dns ? (
                                    <>
                                      {(() => {
                                        const dns = websiteDataJson.dns;
                                        const DnsSecIcon = getIconByName(dns.dnssec_enabled ? "Check" : "X");

                                        const DnsRightElement = (
                                          <div className="flex items-center gap-2">
                                            <BubbleTag
                                              text={dns.dnssec_enabled ? "DNSSEC Enabled" : "DNSSEC Disabled"}
                                              color={dns.dnssec_enabled ? "emerald" : "red"}
                                              hasInsideIcon={true}
                                            size="md"
                                              icon={DnsSecIcon ? <DnsSecIcon className="h-3.5 w-3.5" /> : undefined}
                                            />
                                          </div>
                                        );

                                        return (
                                          <SectionHeaderWithFlags
                                            title="DNS Infrastructure"
                                            icon={getIconByName("Server")!}
                                            iconColorClass="text-gray-500"
                                            titleColorClass="text-blue-700"
                                            titleRightElement={DnsRightElement}
                                            extremeNegativeFlags={[]}
                                            negativeFlags={[]}
                                            mildNegativeFlags={[]}
                                            neutralFlags={[]}
                                            mildPositiveFlags={[]}
                                            positiveFlags={[]}
                                            initialRowLimit={5}
                                            allowCollapse={false}
                                            defaultExpanded={true}
                                          />
                                        );
                                      })()}
                                      
                                      <div className="mt-3">
                                        <KeyMetrics
                                          hardcodedMetrics={dnsIntegrityMetrics}
                                          isMetricsExpanded={isDnsMetricsExpanded}
                                          setIsMetricsExpanded={setIsDnsMetricsExpanded}
                                          showCollapse={true}
                                          showHeader={false}
                                          isLoading={malwareDetectionLoading}
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <SectionHeaderWithFlags
                                        title="DNS Infrastructure"
                                        icon={getIconByName("Server")!}
                                        iconColorClass="text-gray-500"
                                        titleColorClass="text-blue-700"
                                        extremeNegativeFlags={[]}
                                        negativeFlags={[]}
                                        mildNegativeFlags={[]}
                                        neutralFlags={[]}
                                        mildPositiveFlags={[]}
                                        positiveFlags={[]}
                                        initialRowLimit={5}
                                        allowCollapse={false}
                                        defaultExpanded={true}
                                      />
                                      <div className="mt-4">
                                        <EmptyState message="No data available for DNS Infrastructure" />
                                      </div>
                                    </>
                                  )}
                                </motion.div>

                                {/* URL & Page Behavior KPI Section */}
                                <motion.div variants={itemVariants} className="mt-6">
                                  {websiteDataJson?.url ? (
                                    <>
                                      {(() => {
                                        const url = websiteDataJson.url;
                                        const cred = url.credential_harvesting || {};
                                        const behav = url.page_behavior || {};

                                        return (
                                          <SectionHeaderWithFlags
                                            title="URL & Page Behavior"
                                            icon={getIconByName("Link")!}
                                            iconColorClass="text-gray-500"
                                            titleColorClass="text-blue-700"
                                            extremeNegativeFlags={[]}
                                            negativeFlags={[]}
                                            mildNegativeFlags={[]}
                                            neutralFlags={[]}
                                            mildPositiveFlags={[]}
                                            positiveFlags={[]}
                                            initialRowLimit={5}
                                            allowCollapse={false}
                                            defaultExpanded={true}
                                          />
                                        );
                                      })()}

                                      <div className="mt-3">
                                        <KeyMetrics
                                          hardcodedMetrics={urlIntegrityMetrics}
                                          isMetricsExpanded={isUrlMetricsExpanded}
                                          setIsMetricsExpanded={setIsUrlMetricsExpanded}
                                          showCollapse={true}
                                          showHeader={false}
                                          isLoading={malwareDetectionLoading}
                                        />
                                      </div>

                                      {/* Page Behavior Flags Tables - side by side */}
                                      <div className="mt-4 grid grid-cols-2 gap-4">
                                        {/* Table 1: Redirect & Credential checks */}
                                        <CustomTableView
                                          title={undefined}
                                          columns={keyValueColumns.map(col => col.key === "field" ? { ...col, width: "360px" } : col)}
                                          data={transformKeyValueData((() => {
                                            const url = websiteDataJson.url;
                                            const cred = url.credential_harvesting || {};
                                            return [
                                              {
                                                field: "Suspicious Redirect Chain",
                                                value: url.is_suspicious_chain ? "Yes" : "No",
                                                isRiskTag: true,
                                                riskSentiment: "negative",
                                                keyIcon: "AlertTriangle",
                                                keyIconColor: "blue",
                                                valueSentiment: "info",
                                              },
                                              {
                                                field: "Domain Changed on Redirect",
                                                value: url.domain_changed_on_redirect ? "Yes" : "No",
                                                isRiskTag: true,
                                                riskSentiment: "negative",
                                                keyIcon: "Repeat",
                                                keyIconColor: "blue",
                                                valueSentiment: "info",
                                              },
                                              {
                                                field: "Has Login Form",
                                                value: cred.has_login_form ? "Yes" : "No",
                                                isRiskTag: true,
                                                riskSentiment: "negative",
                                                keyIcon: "LogIn",
                                                keyIconColor: "blue",
                                                valueSentiment: "info",
                                              },
                                            ] as (WebsiteAnalysisKeyValue & { isRiskTag?: boolean; riskSentiment?: string })[];
                                          })())}
                                          initialRowLimit={3}
                                          headerAndTotalRowBg="gray-100"
                                          showCSVExport={false}
                                          isLoading={malwareDetectionLoading}
                                        />
                                        {/* Table 2: Page behavior checks */}
                                        <CustomTableView
                                          title={undefined}
                                          columns={keyValueColumns.map(col => col.key === "field" ? { ...col, width: "360px" } : col)}
                                          data={transformKeyValueData((() => {
                                            const url = websiteDataJson.url;
                                            const cred = url.credential_harvesting || {};
                                            const behav = url.page_behavior || {};
                                            return [
                                              {
                                                field: "External Form Submission",
                                                value: cred.external_submission ? "Yes" : "No",
                                                isRiskTag: true,
                                                riskSentiment: "negative",
                                                keyIcon: "Share",
                                                keyIconColor: "blue",
                                                valueSentiment: "info",
                                              },
                                              {
                                                field: "Suspicious Downloads",
                                                value: behav.suspicious_downloads ? "Yes" : "No",
                                                isRiskTag: true,
                                                riskSentiment: "negative",
                                                keyIcon: "Download",
                                                keyIconColor: "blue",
                                                valueSentiment: "info",
                                              },
                                              {
                                                field: "Hidden Iframes",
                                                value: behav.hidden_iframes ? "Yes" : "No",
                                                isRiskTag: true,
                                                riskSentiment: "negative",
                                                keyIcon: "EyeOff",
                                                keyIconColor: "blue",
                                                valueSentiment: "info",
                                              },
                                            ] as unknown as (WebsiteAnalysisKeyValue & { isRiskTag?: boolean; riskSentiment?: string })[];
                                          })())}
                                          initialRowLimit={3}
                                          headerAndTotalRowBg="gray-100"
                                          showCSVExport={false}
                                          isLoading={malwareDetectionLoading}
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <SectionHeaderWithFlags
                                        title="URL & Page Behavior"
                                        icon={getIconByName("Link")!}
                                        iconColorClass="text-gray-500"
                                        titleColorClass="text-blue-700"
                                        extremeNegativeFlags={[]}
                                        negativeFlags={[]}
                                        mildNegativeFlags={[]}
                                        neutralFlags={[]}
                                        mildPositiveFlags={[]}
                                        positiveFlags={[]}
                                        initialRowLimit={5}
                                        allowCollapse={false}
                                        defaultExpanded={true}
                                      />
                                      <div className="mt-4">
                                        <EmptyState message="No data available for URL & Page Behavior" />
                                      </div>
                                    </>
                                  )}
                                </motion.div>

                                {/* Malware & Threat Detection Section */}
                                <motion.div variants={itemVariants} className="mt-16">
                                  {websiteDataJson?.malware ? (
                                    <>
                                      <SectionHeaderWithFlags
                                        title="Malware & Threat Detection"
                                        icon={getIconByName("Shield")!}
                                        iconColorClass="text-gray-500"
                                        titleColorClass="text-blue-700"
                                        titleRightElement={
                                          <div className="flex items-center gap-2">
                                            <BubbleTag
                                              text={websiteDataJson.malware.is_blacklisted ? "Malicious / Blacklisted Site" : "Safe / Clean Site"}
                                              color={websiteDataJson.malware.is_blacklisted ? "red" : "emerald"}
                                              hasInsideIcon={true}
                                            size="md"
                                              icon={getIconByName(websiteDataJson.malware.is_blacklisted ? "X" : "Check") ? React.createElement(getIconByName(websiteDataJson.malware.is_blacklisted ? "X" : "Check")!, { className: "h-3.5 w-3.5" }) : undefined}
                                            />
                                          </div>
                                        }
                                        extremeNegativeFlags={[]}
                                        negativeFlags={[]}
                                        mildNegativeFlags={[]}
                                        neutralFlags={[]}
                                        mildPositiveFlags={[]}
                                        positiveFlags={[]}
                                        initialRowLimit={5}
                                        allowCollapse={false}
                                        defaultExpanded={true}
                                      />

                                      <div className="mt-2">
                                        <CustomTableView
                                          title={undefined}
                                          columns={keyValueColumns}
                                          data={transformKeyValueData(newMalwareData || [])}
                                          initialRowLimit={(newMalwareData || []).length}
                                          headerAndTotalRowBg="gray-100"
                                          showCSVExport={false}
                                          isLoading={malwareDetectionLoading}
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <SectionHeaderWithFlags
                                        title="Malware & Threat Detection"
                                        icon={getIconByName("ShieldAlert")!}
                                        iconColorClass="text-gray-500"
                                        titleColorClass="text-blue-700"
                                        extremeNegativeFlags={[]}
                                        negativeFlags={[]}
                                        mildNegativeFlags={[]}
                                        neutralFlags={[]}
                                        mildPositiveFlags={[]}
                                        positiveFlags={[]}
                                        initialRowLimit={5}
                                        allowCollapse={false}
                                        defaultExpanded={true}
                                      />
                                      <div className="mt-4">
                                        <EmptyState message="No data available for Malware & Threat Detection" />
                                      </div>
                                    </>
                                  )}
                                </motion.div>

                                {/* Contact Data */}
                                <div className="mt-12">
                                  <motion.div variants={itemVariants}>
                                    <SectionHeaderWithFlags
                                      title="Contact Data"
                                      icon={getIconByName("User")!}
                                      iconColorClass="text-gray-500"
                                      titleColorClass="text-blue-700"
                                      extremeNegativeFlags={[]}
                                      negativeFlags={[]}
                                      mildNegativeFlags={[]}
                                      neutralFlags={[]}
                                      mildPositiveFlags={[]}
                                      positiveFlags={[]}
                                      initialRowLimit={5}
                                      allowCollapse={false}
                                      defaultExpanded={true}
                                    />

                                    <div className="mt-2">
                                      <CustomTableView
                                        title={undefined}
                                        columns={keyValueColumns}
                                        data={transformKeyValueData(contactData || [])}
                                        initialRowLimit={(contactData || []).length}
                                        headerAndTotalRowBg="gray-100"
                                        showCSVExport={false}
                                        isLoading={contactLoading}
                                      />
                                    </div>
                                  </motion.div>
                                </div>

                                {/* Navigation Flow */}
                                <div className="mt-12">
                                  <motion.div variants={itemVariants}>
                                    <SectionHeaderWithFlags
                                      title="Navigation Flow"
                                      icon={getIconByName("Activity")!}
                                      iconColorClass="text-gray-500"
                                      titleColorClass="text-blue-700"
                                      extremeNegativeFlags={[]}
                                      negativeFlags={[]}
                                      mildNegativeFlags={[]}
                                      neutralFlags={[]}
                                      mildPositiveFlags={[]}
                                      positiveFlags={[]}
                                      initialRowLimit={5}
                                      allowCollapse={false}
                                      defaultExpanded={true}
                                    />

                                    <div className="mt-2">
                                      <CustomTableView
                                        title={undefined}
                                        columns={keyValueColumns}
                                        data={transformKeyValueData(navigationFlowData || [])}
                                        initialRowLimit={(navigationFlowData || []).length}
                                        headerAndTotalRowBg="gray-100"
                                        showCSVExport={false}
                                        isLoading={navFlowLoading}
                                      />
                                    </div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}

      {websiteDataJson && (
        <>
          {/* Top Row: Website Status & Domain Information */}
          {/* <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {renderKeyValueSection(
              "Website Status",
              getIconByName("Globe")!,
              websiteStatusData,
              true
            )}
            {renderKeyValueSection(
              "Domain Information",
              getIconByName("Server")!,
              domainInfoData,
              true
            )}
          </motion.div> */}

          {/* Second Row: About Data (Contact Data moved below after Frequent Words) */}
          {/* <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-6"
          >
            {renderKeyValueSection(
              "About Data",
              getIconByName("Info")!,
              aboutData
            )}
          </motion.div> */}

          {/* Third Row: Social Media & Logo Analysis */}
          {/* <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {renderKeyValueSection(
              "Social Media",
              getIconByName("Users")!,
              socialMediaData
            )}
            {renderKeyValueSection(
              "Logo Analysis",
              getIconByName("Info")!,
              logoAnalysisData
            )}
          </motion.div> */}

          {/* Fourth Row: Navigation Flow (moved to Website Integrity area above) */}

          {/* Fifth Row: Content Analysis (full width) */}
          {/* <motion.div variants={itemVariants} className="mt-0">
            {renderKeyValueSection(
              "Content Analysis",
              getIconByName("FileSearch")!,
              contentAnalysisFiltered
            )}
          </motion.div> */}

        </>
      )}
      {websiteDataJson && (
        <div className="hidden">
          <div ref={pdfTemplateRef}>
            <InvestigationWebAnalysisPDFTemplate
              merchantName={selectedCase?.registeredName || (selectedCase as any)?.merchant?.name || "N/A"}
              runDate={format(new Date(), "dd MMM yyyy, HH:mm:ss")}
              website={(selectedCase as any)?.website || (selectedCase as any)?.merchant?.website || ""}
              websiteMccData={websiteMccData}
              websiteAnalysis={{
                summary: (merchantWebAnalysis as any)?.data?.web_analysis?.website_summary ?? "No summary available.",
                frequentWords: (merchantWebAnalysis as any)?.data?.web_analysis?.top_frequent_words ?? (frequentWordsEntry?.value || [])
              }}
              websiteIntegrity={{
                isWorking: websiteWorking,
                checklist: websiteQualityItems,
                metrics: websiteIntegrityMetrics,
                isSubdomain: isSubdomainValue,
                copyrightLine: copyrightLineValue,
                fatfStatus: fatfStatusValue
              }}
              sslDetails={{
                enabled: !!websiteDataJson?.ssl?.ssl_enabled,
                valid: !!websiteDataJson?.ssl?.certificate_valid,
                metrics: sslIntegrityMetrics
              }}
              dnsInfrastructure={{
                dnssecEnabled: !!websiteDataJson?.dns?.dnssec_enabled,
                metrics: dnsIntegrityMetrics
              }}
              urlPageBehavior={{
                metrics: urlIntegrityMetrics,
                consistencyTable: urlConsistencyTableData,
                behaviorFlags: urlBehaviorFlags
              }}
              malwareDetection={{
                isBlacklisted: !!websiteDataJson?.malware?.is_blacklisted,
                tableData: (newMalwareData || []).map((m: any) => ({
                  field: m.field,
                  value: m.value,
                  engines: m.maliciousEngines || m.suspiciousEngines
                }))
              }}
              contactData={(contactData || []).map((c: any) => ({ field: c.field, value: c.value }))}
              navigationFlow={(navigationFlowData || []).map((n: any) => ({ field: n.field, value: n.value }))}
              productAnalysis={{
                products: productTableData || []
              }}
              websiteSnapshots={websiteSnapshots}
              reverseImageSearchData={reverseImageSearchData}
              scamDetectedOverall={scamDetectedOverall}
              trafficData={trafficEngagementSampleData}
            />
          </div>
        </div>
      )}

      {/* Website Snapshot Maximize Dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={(open) => !open && setSelectedSnapshot(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-auto max-h-[95vh] p-0 overflow-visible bg-white border-none shadow-2xl flex flex-col items-center justify-center z-[100] [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedSnapshot?.screenshot_name || "Website Snapshot"}</DialogTitle>
          </DialogHeader>
          
          <div className="relative w-full flex items-center justify-center p-0">
             {/* Custom Close Button - Positioned just outside the image corner */}
             <button 
               onClick={() => setSelectedSnapshot(null)}
               className="absolute -top-4 -right-4 h-10 w-10 flex items-center justify-center rounded-xl bg-white hover:bg-gray-100 shadow-xl border border-gray-200 text-gray-800 transition-all active:scale-95 z-[110]"
             >
               <LucideIcons.X className="h-5 w-5" />
             </button>

             {/* Left Navigation Button */}
             {websiteSnapshots.length > 1 && (
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   const currentIndex = websiteSnapshots.indexOf(selectedSnapshot);
                   const prevIndex = (currentIndex - 1 + websiteSnapshots.length) % websiteSnapshots.length;
                   setSelectedSnapshot(websiteSnapshots[prevIndex]);
                 }}
                 className="absolute -left-16 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-2xl border border-gray-200 text-gray-800 transition-all active:scale-95 z-[110] group"
               >
                 <LucideIcons.ChevronLeft className="h-7 w-7 group-hover:-translate-x-0.5 transition-transform" />
               </button>
             )}

             {/* Right Navigation Button */}
             {websiteSnapshots.length > 1 && (
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   const currentIndex = websiteSnapshots.indexOf(selectedSnapshot);
                   const nextIndex = (currentIndex + 1) % websiteSnapshots.length;
                   setSelectedSnapshot(websiteSnapshots[nextIndex]);
                 }}
                 className="absolute -right-16 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-2xl border border-gray-200 text-gray-800 transition-all active:scale-95 z-[110] group"
               >
                 <LucideIcons.ChevronRight className="h-7 w-7 group-hover:translate-x-0.5 transition-transform" />
               </button>
             )}

              {(() => {
                const imageBase64 = selectedSnapshot?.bs4 || selectedSnapshot?.screenshot_b64;
                if (!imageBase64) return null;
                return (
                  <div className="relative group w-full h-full">
                    <motion.img 
                      key={selectedSnapshot?.timestamp || selectedSnapshot?.screenshot_name || "snapshot"}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      src={imageBase64.startsWith("data:image") 
                        ? imageBase64 
                        : `data:image/png;base64,${imageBase64}`} 
                      alt={selectedSnapshot?.screenshot_name || "Website Snapshot"} 
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {selectedSnapshot?.timestamp && (
                      <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-2xl">
                        <LucideIcons.Clock className="h-4 w-4 text-white/80" />
                        <span className="text-sm font-medium text-white tracking-wide">
                          Captured on {formatDateString(selectedSnapshot.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>


  );
};

export default InvWebAnalysisTab;
