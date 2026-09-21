"use client";

import React, { FC, useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import InvPageHeader from "../Components/InvPageHeader";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { KeyMetrics } from "@/components/custom/KeyMetrics";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  getBrandLegalValidation,
  getWebsiteIntegrity,
  getUrlConsistency,
  getWebsiteQualityChecklist,
  getSocialMediaOverview,
  getMarketplaceOverview,
  getBehaviouralFlags,
  getMonitoredDimensions,
  getLinkageCategories,
} from "./components/merchantOverviewSampleData";
import { trafficEngagementSampleData } from "./components/trafficEngagementSampleData";
import WebsiteQualityCard from "@/components/custom/WebsiteQualityCard";
import SocialMediaCard from "@/components/custom/SocialMediaCard";
import { TruncatableText } from "./components/TruncatableText";
import { getIconByName } from "@/components/custom/CustomIconScheme";
import CustomLoader from "@/components/custom/CustomLoader";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { ArtifactSectionCollapsible } from "@/components/custom/ArtifactSectionCollapsible";
import {
  transformToKeyValue,
  transformSocialMediaData,
  transformNavigationFlowData,
  transformContactData,
  transformPolicyData,
  transformContentAnalysisData
} from "./utils/webAnalysisTransformers";
import {
  getSocialMediaPlatforms,
  getSelectedPlatformData,
  getAllPlatformUrlEntries,
  transformKeyValueData,
  getSelectedSocialMediaData,
} from "./InvWebDataLogic";
import {
  fetchBusinessIdentityOverview,
  fetchBusinessClassification,
  fetchRegistrationDetails,
  fetchAddressDetails,
  fetchContactDetails,
  fetchKeyPersonnel,
  fetchReverseImageSearch,
  ReverseImageApiResponse,
  fetchSteps,
  fetchDatastoreEntry,
  DatastoreEntryApiResponse,
  fetchScamIntelligence,
  fetchDecisioning,
} from "@/app/services/caseServices";

import {
  BC_SAMPLE_DATA,
  BC_FIELD_GROUPS,
  BCData,
  BCSource,
  BC_SOURCE_LABELS,
  buildAnalysis,
} from "./components/businessClassificationSampleData";
import { backlinksSampleData } from "../Sample Data/BacklinksSampleData";
import { RiskAssessmentParagraph } from "@/components/custom/RiskAssessmentParagraph";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { InvFlagDetailsArtifact } from "../Components/InvFlagDetailsArtifact";
import { getFlagInfo } from "../Sample Data/InvDecisioningSampleData";
import { associatedPeopleSampleData } from "./components/associatedPeopleSampleData";
import { ScreeningReportArtifact } from "./components/ScreeningReportArtifact";
import { ChevronRight, ExternalLink, Globe, FileText, MapPin, ChevronDown, ChevronUp, Image as ImageIcon, Eye, AlertTriangle, Minus, Briefcase, Layers, Users, Phone } from "lucide-react";
import ReverseImageSearchSection from "./components/ReverseImageSearchSection";
import BusinessClassificationMatrix from "./components/BusinessClassificationMatrix";
import InvMerchantOverviewPDFTemplate from "../Investigation-Report/OverviewTab/InvestigationMerchantOverviewPDFTemplate";
import InvestigationFullReportPDFTemplate from "../Investigation-Report/FullReport/InvestigationFullReportPDFTemplate";
import { generateInvestigationReportPDF, preparePDFElement } from "../Investigation-Report/utils/pdfUtils";
import { fetchMerchantWebAnalysis } from "@/app/services/caseServices";

interface InvMerchantOverviewTabProps {
  merchantId?: string;
  caseId?: string;
}

const InvMerchantOverviewTab: FC<InvMerchantOverviewTabProps> = ({
  merchantId,
  caseId,
}) => {
  const { selectedCase } = useInvestigationCaseStore();
  const activeCase = selectedCase;
  const artifactStore = useArtifactStore();
  const pdfTemplateRef = React.useRef<HTMLDivElement>(null);
  const fullReportTemplateRef = React.useRef<HTMLDivElement>(null);
  // Artifact panel collapsed state controls grid column counts for WebsiteQualityCard lists
  const artifactPanelCollapsed = artifactStore.isCollapsed;

  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  // Full output-format response fetched by externalMerchantId
  // Contains scam_* boolean flags plus other named mismatch keys we use below
  const [outputFormat, setOutputFormat] = useState<Record<string, any> | null>(
    null
  );
  const [isOutputFormatLoading, setIsOutputFormatLoading] = useState(false);

  // Business/brand validation API data
  const [businessBrandData, setBusinessBrandData] = useState<any | null>(null);
  const [businessBrandLoading, setBusinessBrandLoading] = useState(false);
  const [businessBrandError, setBusinessBrandError] = useState<any | null>(
    null
  );

  // Website JSON used by Web Analysis; fetch here so Overview can display
  // language support / is_subdomain / copyright_line similar to Web Analysis
  const [websiteDataJson, setWebsiteDataJson] = useState<any | null>(null);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState<any | null>(null);
  const [datastoreEntryData, setDatastoreEntryData] = useState<DatastoreEntryApiResponse | null>(null);
  const [datastoreEntryLoading, setDatastoreEntryLoading] = useState(false);
  const [businessIdentity, setBusinessIdentity] = useState<any | null>(null);
  const [businessClassification, setBusinessClassification] = useState<any | null>(null);
  const [registrationDetails, setRegistrationDetails] = useState<any | null>(null);
  const [addressDetails, setAddressDetails] = useState<any | null>(null);
  const [contactDetails, setContactDetails] = useState<any | null>(null);
  const [keyPersonnel, setKeyPersonnel] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reverseImageSearchData, setReverseImageSearchData] = useState<ReverseImageApiResponse | null>(null);
  const [reverseImageSearchLoading, setReverseImageSearchLoading] = useState(false);
  const [scamIntelligenceData, setScamIntelligenceData] = useState<any | null>(null);
  const [scamIntelligenceLoading, setScamIntelligenceLoading] = useState(false);

  // External analysis summaries (now sourced from scam-intelligence API)
  const [riskAnalysisData, setRiskAnalysisData] = useState<any | null>(null);
  const [reviewsAnalysisData, setReviewsAnalysisData] = useState<any | null>(null);

  // State for red flags (to be used by artifacts and conditional rendering)
  const [redFlags, setRedFlags] = useState<any[] | null>(null);
  const [redFlagsLoading, setRedFlagsLoading] = useState(false);

  // Web Analysis Data States (Fetched here for Full Report)
  const [webAnalysisDatastore, setWebAnalysisDatastore] = useState<any | null>(null);
  const [navFlowDatastore, setNavFlowDatastore] = useState<any | null>(null);
  const [contactDatastore, setContactDatastore] = useState<any | null>(null);
  const [productAnalysisDatastore, setProductAnalysisDatastore] = useState<any | null>(null);
  const [domainInfoDatastore, setDomainInfoDatastore] = useState<any | null>(null);
  const [malwareDatastore, setMalwareDatastore] = useState<any | null>(null);
  const [merchantWebAnalysis, setMerchantWebAnalysis] = useState<any | null>(null);
  const [scamIntelligence, setScamIntelligence] = useState<any | null>(null);
  const [riskScoreDatastore, setRiskScoreDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [visionDatastore, setVisionDatastore] = useState<DatastoreEntryApiResponse | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [gstnDetailsData, setGstnDetailsData] = useState<DatastoreEntryApiResponse | null>(null);
  const [gstnDetailsLoading, setGstnDetailsLoading] = useState(false);
  const [websiteMccDatastore, setWebsiteMccDatastore] = useState<any | null>(null);



  // Build a small set of key metrics based on available fields on the case.
  const MCC_CODE = (activeCase as any)?.keyStats?.merchantType || (activeCase as any)?.mcc_code || "-";
  const GST_AGE = (activeCase as any)?.gst_age || (activeCase as any)?.keyStats?.gstAge || "-";
  const GST_STATUS_RAW = (activeCase as any)?.gst_status || (activeCase as any)?.gstStatus || "-";

  // Capitalize GST_STATUS value (Yes/No)
  const GST_STATUS =
    GST_STATUS_RAW === "N/A" || GST_STATUS_RAW === "-"
      ? "-"
      : typeof GST_STATUS_RAW === "string"
        ? ["yes", "true"].includes(GST_STATUS_RAW.toLowerCase())
          ? "Yes"
          : ["no", "false"].includes(GST_STATUS_RAW.toLowerCase())
            ? "No"
            : GST_STATUS_RAW
        : GST_STATUS_RAW;

  const CORP_REG_AGE = (activeCase as any)?.incorporation_age || (activeCase as any)?.corporate_registry_age || (activeCase as any)?.keyStats?.onboardedOn || "-";
  const DAYS_SINCE_LAST_GST = (activeCase as any)?.days_since_last_gst_filing || "-";
  const EPF_REG = (activeCase as any)?.epf_registration || (activeCase as any)?.epfRegistration || "-";

  // Line of Business (LOB) value
  const LOB_VALUE = (() => {
    const v = (activeCase as any)?.line_of_business ||
      (activeCase as any)?.lob ||
      (activeCase as any)?.business_category ||
      (activeCase as any)?.merchantIndustry ||
      (activeCase as any)?.keyStats?.lineOfBusiness ||
      "-";
    return Array.isArray(v) ? v.join(", ") : String(v ?? "-");
  })();

  const hardcodedMetrics = [
    { label: "MCC Code", value: MCC_CODE, icon: '<Briefcase className="h-5 w-5 text-blue-500" />' },
    { label: "GST Age", value: GST_AGE, icon: '<Calendar className="h-5 w-5 text-emerald-500" />' },
    { label: "GST Registered", value: GST_STATUS, icon: '<Check className="h-5 w-5 text-green-500" />' },
    { label: "Corporate Registry Age", value: CORP_REG_AGE, icon: '<FileText className="h-5 w-5 text-indigo-500" />' },
    { label: "Days Since Last GST Filing", value: DAYS_SINCE_LAST_GST, icon: '<Clock className="h-5 w-5 text-orange-500" />' },
    { label: "EPF Registration", value: EPF_REG, icon: '<Users className="h-5 w-5 text-sky-500" />' },
  ];

  const scamDetectedOverall = useMemo(() => {
    if (!Array.isArray(redFlags)) return false;
    const rf013 = redFlags.find(
      (r: any) => String(r?.code || "").toUpperCase() === "RF013"
    );
    if (!rf013) return false;
    const v = rf013.overallTriggered ?? rf013.overall_triggered;
    return v === true || v === "yes" || String(v).toLowerCase() === "true" || v === 1;
  }, [redFlags]);

  // Consolidated Fetch for all Merchant Overview data
  useEffect(() => {
    let cancelled = false;
    const runId = caseId || (activeCase as any)?.caseId;
    if (!runId) {
      setDatastoreEntryData(null);
      setBusinessIdentity(null);
      setBusinessClassification(null);
      setRegistrationDetails(null);
      setAddressDetails(null);
      setContactDetails(null);
      setKeyPersonnel(null);
      setReverseImageSearchData(null);
      setScamIntelligenceData(null);
      setRedFlags(null);
      setGstnDetailsData(null);
      setWebsiteMccDatastore(null);
      return;
    }

    setDatastoreEntryLoading(true);
    setDetailsLoading(true);
    setReverseImageSearchLoading(true);
    setScamIntelligenceLoading(true);
    setRedFlagsLoading(true);
    setVisionLoading(true);
    setGstnDetailsLoading(true);

    const loadAllMerchantData = async () => {
      try {
        // Step 1: Fetch steps once to resolve datastore mapping IDs
        const steps = await fetchSteps(100);
        if (cancelled) return;
        const targetStep = steps.find(s => s.name === "WEBSITE_SOCIAL_MEDIA_LINKS");

        // Step 2: Fetch all merchant details, analysis, and flags in parallel
        const [
          identity,
          classification,
          registration,
          address,
          contact,
          personnel,
          reverseImg,
          scamInt,
          decisioningEntry,
          datastoreEntry,
          webResp,
          navResp,
          contactResp,
          productResp,
          domainResp,
          malwareEntry,
          mwaResp,
          riskScoreEntry,
          visionResp,
          gstnResp,
          websiteMccResp
        ] = await Promise.all([

          fetchBusinessIdentityOverview(String(runId)),
          fetchBusinessClassification(String(runId)),
          fetchRegistrationDetails(String(runId)),
          fetchAddressDetails(String(runId)),
          fetchContactDetails(String(runId)),
          fetchKeyPersonnel(String(runId)),
          fetchReverseImageSearch(String(runId)),
          fetchScamIntelligence(String(runId)),
          fetchDecisioning(String(runId)),
          targetStep ? fetchDatastoreEntry(String(runId), targetStep.id) : Promise.resolve(null),
          fetchDatastoreEntry(String(runId), steps.find(s => s.name === "RF012")?.id || "8a231eb2-a22a-4f00-b6cd-d0fa0567949c"),
          fetchDatastoreEntry(String(runId), steps.find(s => s.name === "NAVIGATION_FLOW")?.id || "67774633-a46f-4b62-a232-634b29a7e98e"),
          fetchDatastoreEntry(String(runId), steps.find(s => s.name === "CONTACT_DATA")?.id || "acde3e18-d45a-4709-a6c6-8842a7074fd5"),
          fetchDatastoreEntry(String(runId), steps.find(s => s.name === "PRODUCT_ANALYSIS")?.id || "1056fd1d-cf31-4042-9917-a2b597efea97"),
          fetchDatastoreEntry(String(runId), steps.find(s => s.name === "DOMAIN_INFO")?.id || "5ce578a7-491f-4649-babf-65d658f9c43b"),
          fetchDatastoreEntry(String(runId), "89466cd7-3228-4ae0-8840-ff88d6da13a2"),
          fetchMerchantWebAnalysis(String(runId)),
          fetchDatastoreEntry(String(runId), steps.find((s: any) => s.name === "RISK_SCORE")?.id || "e95829ec-3344-48f4-b2e7-a57eb9eefe36"),
          fetchDatastoreEntry(String(runId), steps.find((s: any) => s.name === "VISION_PIPELINE")?.id || "bf2ddb84-0cbc-4c81-add8-60c9c80a8bc6"),
          fetchDatastoreEntry(String(runId), steps.find((s: any) => s.name === "GSTN_DETAILS")?.id || "0d983188-f1c7-4193-9d73-b909c19c7e34"),
          fetchDatastoreEntry(String(runId), steps.find((s: any) => s.name === "WEBSITE_MCC")?.id || "2e82185b-9674-4509-a022-1df8e4c497f4")
        ]);

        if (cancelled) return;

        // Update all states
        setBusinessIdentity(identity?.data || null);
        setBusinessClassification(classification?.data || null);
        setRegistrationDetails(registration?.data || null);
        setAddressDetails(address?.data || null);
        setContactDetails(contact?.data || null);
        setKeyPersonnel(personnel?.data || null);
        setReverseImageSearchData(reverseImg);

        const sData = scamInt?.data || null;
        setScamIntelligenceData(sData);
        setScamIntelligence(scamInt);
        if (sData?.risk_analysis) setRiskAnalysisData(sData.risk_analysis);
        if (sData?.reviews_analysis) setReviewsAnalysisData(sData.reviews_analysis);

        setRedFlags(decisioningEntry?.data?.flags || []);
        setDatastoreEntryData(datastoreEntry);

        // Web Analysis States
        setWebAnalysisDatastore(webResp);
        setNavFlowDatastore(navResp);
        setContactDatastore(contactResp);
        setProductAnalysisDatastore(productResp);
        setDomainInfoDatastore(domainResp);
        setMalwareDatastore(malwareEntry);
        setMerchantWebAnalysis(mwaResp);
        setRiskScoreDatastore(riskScoreEntry);
        setVisionDatastore(visionResp);
        setGstnDetailsData(gstnResp);
        setWebsiteMccDatastore(websiteMccResp);

      } catch (err) {
        console.error("[InvMerchantOverviewTab] Error loading consolidated merchant data:", err);
      } finally {
        if (!cancelled) {
          setDatastoreEntryLoading(false);
          setDetailsLoading(false);
          setReverseImageSearchLoading(false);
          setScamIntelligenceLoading(false);
          setRedFlagsLoading(false);
          setVisionLoading(false);
          setGstnDetailsLoading(false);
        }
      }
    };

    loadAllMerchantData();

    return () => {
      cancelled = true;
    };
  }, [activeCase, caseId]);


  const transformedBCData = useMemo(() => {
    const result: BCData = {};

    // Initialize all known keys from field groups with nulls for all sources
    BC_FIELD_GROUPS.forEach((group) => {
      group.fields.forEach((field) => {
        result[field.key] = { onboarding: null, website: null, probe42: null };
      });
    });

    const formatVal = (v: any) => {
      if (v === null || v === undefined) return null;

      if (Array.isArray(v)) {
        const joined = v.map(item => {
          if (typeof item === 'object' && item !== null && item.url) return item.url;
          return item;
        }).filter(Boolean).join(", ");
        return joined || null;
      }
      return String(v);
    };

    if (businessIdentity) {
      const sources: Array<"onboarding_data" | "website" | "probe_data"> = [
        "onboarding_data",
        "website",
        "probe_data",
      ];
      sources.forEach((src) => {
        const target: BCSource = src === "onboarding_data" ? "onboarding" : src === "probe_data" ? "probe42" : "website";
        const d = businessIdentity[src];
        if (d) {
          result["tradeName"][target] = formatVal(d["Trade / Business Name / Brand Name"]);
          result["registeredName"][target] = formatVal(d["Legal Name"]);
          result["connectedUrls"][target] = formatVal(d["URLs"]);
          result["nameInUrl"][target] = formatVal(d["Name in URL"]);
          result["typeOfEntity"][target] = formatVal(d["Type of Entity"]);
        }
      });
    }

    if (businessClassification) {
      const sources: Array<"onboarding_data" | "website" | "probe_data"> = [
        "onboarding_data",
        "website",
        "probe_data",
      ];
      sources.forEach((src) => {
        const target: BCSource = src === "onboarding_data" ? "onboarding" : src === "probe_data" ? "probe42" : "website";
        const d = businessClassification[src];
        if (d) {
          result["mcc"][target] = formatVal(d["mcc"]);
          result["industry"][target] = formatVal(d["industry"]);
          result["segment"][target] = formatVal(d["segment"]);
          result["lineOfBusiness"][target] = formatVal(d["lob"]);
        }
      });
    }

    const tempOwners: Record<BCSource, string | null> = { onboarding: null, website: null, probe42: null };
    const tempDirectors: Record<BCSource, string | null> = { onboarding: null, website: null, probe42: null };
    const tempDins: Record<BCSource, string | null> = { onboarding: null, website: null, probe42: null };

    if (registrationDetails) {
      const sources: Array<"onboarding_data" | "website" | "probe_data"> = [
        "onboarding_data",
        "website",
        "probe_data",
      ];
      sources.forEach((src) => {
        const target: BCSource = src === "onboarding_data" ? "onboarding" : src === "probe_data" ? "probe42" : "website";
        const d = registrationDetails[src];
        if (d) {
          result["pan"][target] = formatVal(d["pan"]);
          result["cin"][target] = formatVal(d["cin"]);
          tempDins[target] = formatVal(d["din"]);
        }
      });
    }

    if (addressDetails) {
      const sources: Array<"onboarding_data" | "website" | "probe_data"> = [
        "onboarding_data",
        "website",
        "probe_data",
      ];
      sources.forEach((src) => {
        const target: BCSource = src === "onboarding_data" ? "onboarding" : src === "probe_data" ? "probe42" : "website";
        const d = addressDetails[src];
        if (d) {
          result["registeredAddress"][target] = formatVal(d["registered_address"]);
          result["businessAddress"][target] = formatVal(d["business_address"]);
        }
      });
    }

    if (contactDetails) {
      const sources: Array<"onboarding_data" | "website" | "probe_data"> = [
        "onboarding_data",
        "website",
        "probe_data",
      ];
      sources.forEach((src) => {
        const target: BCSource = src === "onboarding_data" ? "onboarding" : src === "probe_data" ? "probe42" : "website";
        const d = contactDetails[src];
        if (d) {
          result["email"][target] = formatVal(d["email"]);
          result["phone"][target] = formatVal(d["phone"]);
        }
      });
    }

    if (keyPersonnel) {
      const sources: Array<"onboarding_data" | "website" | "probe_data"> = [
        "onboarding_data",
        "website",
        "probe_data",
      ];
      sources.forEach((src) => {
        const target: BCSource = src === "onboarding_data" ? "onboarding" : src === "probe_data" ? "probe42" : "website";
        const d = keyPersonnel[src];
        if (d) {
          tempOwners[target] = formatVal(d["owner"]);
          tempDirectors[target] = formatVal(d["directors"] || d["director"]);
        }
      });
    }

    const BC_SOURCES = ["onboarding", "website", "probe42"] as const;
    BC_SOURCES.forEach((target) => {
      const owners = tempOwners[target] ? String(tempOwners[target]).split(",").map(s => s.trim()).filter(Boolean) : [];
      const directors = tempDirectors[target] ? String(tempDirectors[target]).split(",").map(s => s.trim()).filter(Boolean) : [];
      const dins = tempDins[target] ? String(tempDins[target]).split(",").map(s => s.trim()).filter(Boolean) : [];

      const parts: string[] = [];

      owners.forEach(owner => {
        parts.push(`${owner} (Owner)`);
      });

      directors.forEach((director, idx) => {
        const din = dins[idx];
        if (din) {
          parts.push(`${director} (Director) (${din})`);
        } else {
          parts.push(`${director} (Director)`);
        }
      });

      if (dins.length > directors.length) {
        for (let i = directors.length; i < dins.length; i++) {
          parts.push(`DIN: ${dins[i]}`);
        }
      }

      result["details"][target] = parts.length > 0 ? parts.join("\n") : null;
    });

    const websiteMccData = (websiteMccDatastore?.data as any)?.data || null;
    if (websiteMccData) {
      if (websiteMccData.business_category) {
        result["industry"]["website"] = formatVal(websiteMccData.business_category);
      }
      if (websiteMccData.sub_category) {
        result["segment"]["website"] = formatVal(websiteMccData.sub_category);
      }
      const lobVal = websiteMccData.lob || websiteMccData.industry_group;
      const mccDesc = websiteMccData.mcc_description;
      if (lobVal) {
        if (mccDesc) {
          result["lineOfBusiness"]["website"] = `${lobVal}\n${mccDesc}`;
        } else {
          result["lineOfBusiness"]["website"] = formatVal(lobVal);
        }
      }
    }

    return result;
  }, [businessIdentity, businessClassification, registrationDetails, addressDetails, contactDetails, keyPersonnel, websiteMccDatastore]);

  const bcAnalysis = useMemo(() => buildAnalysis(transformedBCData), [transformedBCData]);

  const formatHsnDescription = (desc: string): string => {
    if (!desc) return "";
    const minorWords = new Set([
      "and", "or", "of", "in", "on", "at", "to", "for", "with", "by", 
      "a", "an", "the", "whether", "not", "as", "into", "through", 
      "over", "under", "from", "single", "sheets"
    ]);
    
    return desc
      .toLowerCase()
      .split(/\s+/)
      .map((word, idx) => {
        const cleanWord = word.replace(/[^a-z0-9]/g, "");
        if (idx > 0 && minorWords.has(cleanWord)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };



  const openBCReasoningArtifact = (groupName: string) => {
    const artifactId = `bc-reasoning-${groupName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    if (groupName === "Business Classification") {
      const flagRf004 = redFlags?.find(
        (f: any) => String(f.code).toUpperCase() === "RF004"
      );
      const flagRf002 = redFlags?.find(
        (f: any) => String(f.code).toUpperCase() === "RF002"
      );

      artifactStore.addTab({
        id: artifactId,
        title: groupName,
        renderArtifact: () => {
          if (!flagRf004 && !flagRf002) {
            return (
              <div className="p-8 text-center text-gray-500 animate-in fade-in duration-500">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                  <Minus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium">No flag data available for {groupName}</p>
                <p className="text-xs text-gray-400 mt-1">Status signals suggests no flags were triggered for this category.</p>
              </div>
            );
          }

          return (
            <div className="space-y-8 p-4">
              {flagRf004 && (
                <InvFlagDetailsArtifact
                  flagData={flagRf004}
                  lastUpdatedAt={new Date()}
                  useRedGreenStatus={true}
                />
              )}
              {flagRf002 && (
                <InvFlagDetailsArtifact
                  flagData={flagRf002}
                  lastUpdatedAt={new Date()}
                  useRedGreenStatus={true}
                />
              )}
            </div>
          );
        },
      });

      setTimeout(() => {
        artifactStore.forceActivateTab(artifactId);
        artifactStore.setCollapsed(false);
      }, 0);
      return;
    }

    // Mapping category groupName to specific Red Flag codes and subrules
    let flagCode = "";

    switch (groupName) {
      case "Business Identity":
        flagCode = "RF003";
        break;
      case "Registration Details":
        flagCode = "RF008";
        break;
      case "Key Personnel":
        flagCode = "RF007";
        break;
      case "Address":
        flagCode = "RF011";
        break;
    }

    const flagData = redFlags?.find((f: any) => String(f.code).toUpperCase() === flagCode);

    artifactStore.addTab({
      id: artifactId,
      title: groupName,
      renderArtifact: () => {
        if (!flagData) {
          return (
            <div className="p-8 text-center text-gray-500 animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                <Minus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium">No flag data available for {groupName}</p>
              <p className="text-xs text-gray-400 mt-1">Status signals suggests no flags were triggered for this category.</p>
            </div>
          );
        }

        return (
          <InvFlagDetailsArtifact
            flagData={flagData}
            lastUpdatedAt={new Date()}
            useRedGreenStatus={true}
          />
        );
      },
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };

  // Compute monitored dimensions using ONLY the output-format API flags.
  // Do not rely on sample data or red-flags. When the API is loading show
  // a loading state (rendered in the UI). When the API returns null/failed
  // or does not contain a boolean for a dimension we mark the card as
  // `noData` so it renders an info glyph with a gray background.
  const monitoredDimensions = (() => {
    const names = [
      "Registered Name",
      "Business Name",
      "Website Content",
      "Website Domain",
    ];

    // Prefer Scam Intelligence API (rf013 -> scam_signals) values when available.
    // This API is the source of truth for the Scam Intelligence cards.
    const scamSignals = (() => {
      try {
        // Source 1: New Scam Intelligence API (/merchant_details/scam-intelligence/{run_id})
        if (scamIntelligenceData?.rf013?.scam_signals) {
          return scamIntelligenceData.rf013.scam_signals;
        }

        // Fallback: RF013 -> extra_details -> scam_signals from RedFlags API
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

    // If the API is still loading we return an empty array; the UI will
    // render a spinner for this subsection instead of cards.
    if (scamIntelligenceLoading) return [];

    // If scamIntelligenceData is explicitly null (API failed / no data), mark all
    // items as noData=true so the UI shows an info glyph instead of yes/no.
    if (!scamIntelligenceData) {
      return names.map((n) => ({ name: n, status: "no", noData: true }));
    }

    const nameToKeyMap: Record<string, string> = {
      "Registered Name": "scam_legalname",
      "Business Name": "scam_businessname",
      "Website Content": "scam_websitecontent",
      "Website Domain": "scam_websitedomain",
    };

    // If RF013 scam_signals are present, use them directly.
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

    // Robust flag resolution: API may place scam flags under various keys
    // ("Scam Signals", "scam_signals", top-level scam_* keys, or nested
    // under data/payload). We attempt several lookups and a shallow
    // recursive search so that explicit `false` values are honored.
    const normalizeFlag = (v: any): boolean | null => {
      if (typeof v === "boolean") return v;
      if (v === null || typeof v === "undefined") return null;
      if (typeof v === "number") return v === 1 ? true : v === 0 ? false : null;
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

    const scopedSignals =
      tryGet(outputFormat, "Scam Signals") ||
      tryGet(outputFormat, "scam_signals") ||
      tryGet(outputFormat, "scamsignals") ||
      tryGet(outputFormat, "scamSignals") ||
      tryGet(outputFormat?.data, "Scam Signals") ||
      tryGet(outputFormat?.data, "scam_signals") ||
      null;

    const shallowFindFlag = (key: string): any => {
      // Prefer explicit scoped container when present
      if (scopedSignals && typeof scopedSignals === "object") {
        if (Object.prototype.hasOwnProperty.call(scopedSignals, key))
          return scopedSignals[key];
      }

      // Top-level direct key
      if (outputFormat && typeof outputFormat === "object") {
        if (Object.prototype.hasOwnProperty.call(outputFormat, key))
          return outputFormat[key];
      }

      // Check common wrapper properties
      const wrappers = [
        outputFormat?.payload,
        outputFormat?.result,
        outputFormat?.data,
      ];
      for (const w of wrappers) {
        if (
          w &&
          typeof w === "object" &&
          Object.prototype.hasOwnProperty.call(w, key)
        )
          return w[key];
      }

      // Shallow search: look into immediate child objects
      if (outputFormat && typeof outputFormat === "object") {
        for (const prop of Object.keys(outputFormat)) {
          const val = (outputFormat as any)[prop];
          if (
            val &&
            typeof val === "object" &&
            Object.prototype.hasOwnProperty.call(val, key)
          ) {
            return val[key];
          }
        }
      }

      return undefined;
    };

    return names.map((n) => {
      const key = nameToKeyMap[n];
      if (!key) return { name: n, status: "no", noData: true };

      let raw = shallowFindFlag(key);

      // Fallback: sometimes API embeds the flags as a string or in an
      // unexpected wrapper. Try a JSON-text search for the key and simple
      // value (true/false/null/0/1) so we still detect explicit false.
      if (typeof raw === "undefined") {
        try {
          const text = JSON.stringify(outputFormat || {});
          const q = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
          const re = new RegExp(
            `"${q}"\\s*:\\s*(true|false|null|0|1|"true"|"false")`,
            "i"
          );
          const m = text.match(re);
          if (m && m[1]) {
            let parsed: any = m[1];
            // strip quotes
            if (
              typeof parsed === "string" &&
              parsed.startsWith('"') &&
              parsed.endsWith('"')
            ) {
              parsed = parsed.slice(1, -1);
            }
            // convert numeric strings
            if (parsed === "0" || parsed === "1") parsed = Number(parsed);
            if (typeof parsed === "string") {
              const s = parsed.trim().toLowerCase();
              if (s === "true") parsed = true;
              if (s === "false") parsed = false;
              if (s === "null") parsed = null;
            }
            raw = parsed;
          }
        } catch (e) {
          // ignore JSON stringify/search errors
        }
      }

      const flag = normalizeFlag(raw);

      if (flag === true || flag === false) {
        // Map explicit boolean flags from the output-format API to the
        // WebsiteQualityCard status values. Previously this mapping was
        // inverted (true -> "no", false -> "yes"). For the Scam
        // Intelligence monitored-dimensions subsection we want the
        // following semantics:
        //   true  -> alert triangle with red background (bad)  => "yes"
        //   false -> hyphen with green background (good)       => "no"
        // WebsiteQualityCard is rendered with `invert=true` in this
        // subsection so a status of "yes" will show the red alert icon
        // and "no" will show the green hyphen. Flip the mapping here so
        // API true/false correspond to the requested visuals.
        return { name: n, status: flag ? "yes" : "no", noData: false };
      }

      return { name: n, status: "no", noData: true };
    });
  })();

  // Artifact store helper for opening a Logo Analysis artifact

  // Merge social presence values from the output-format API into the
  // case's social object so the UI shows the most recent external values.
  const mergedCase = React.useMemo(() => {
    const base = (activeCase as any) || {};
    const socialBase = base.social ? { ...base.social } : {};

    if (!outputFormat) {
      return { ...base, social: socialBase };
    }

    const of: Record<string, any> = outputFormat || {};

    const setPlatformField = (
      platformKey: string,
      fieldKey: string,
      value: any
    ) => {
      if (typeof value === "undefined") return;
      const existing = socialBase[platformKey] || {};
      socialBase[platformKey] = { ...existing, [fieldKey]: value };
    };

    // Helper to read multiple possible key names from output-format
    const read = (...keys: string[]) => {
      for (const k of keys) {
        if (typeof of[k] !== "undefined") return of[k];
      }
      return undefined;
    };

    // Helper to interpret presence values (boolean or string) and map to status
    const interpretPresence = (v: any): string | undefined => {
      if (typeof v === "boolean") {
        return v ? "Active" : "Not Found";
      }
      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "true" || s === "yes") return "Active";
        if (s === "false" || s === "no") return "Not Found";
        if (s === "n/a" || s === "na" || s === "null") return "N/A";
      }
      return undefined;
    };

    // LinkedIn - try nested object first (API may return { LinkedIn: { linkedin_presence: "N/A", ... } })
    const lnObj = of["LinkedIn"] || of["linkedin"] || null;
    if (lnObj && typeof lnObj === "object") {
      setPlatformField(
        "linkedIn",
        "url",
        lnObj.linkedin_link ?? lnObj.linkedin_url ?? lnObj.linkedin
      );
      setPlatformField(
        "linkedIn",
        "followers",
        typeof lnObj.linkedin_presence_followers !== "undefined"
          ? lnObj.linkedin_presence_followers
          : lnObj.linkedin_followers
      );
      setPlatformField("linkedIn", "employees", lnObj.linkedin_employees);
      setPlatformField("linkedIn", "connections", lnObj.linkedin_connections);
      setPlatformField(
        "linkedIn",
        "posts",
        typeof lnObj.linkedin_presence_posts !== "undefined"
          ? lnObj.linkedin_presence_posts
          : lnObj.linkedin_posts
      );
      const lnStatus = interpretPresence(lnObj.linkedin_presence);
      if (typeof lnStatus !== "undefined") {
        setPlatformField("linkedIn", "status", lnStatus);
      }
    } else {
      // Fallback to top-level keys
      setPlatformField(
        "linkedIn",
        "url",
        read("linkedin_link", "linkedin_url", "linkedin")
      );
      setPlatformField(
        "linkedIn",
        "followers",
        read("linkedin_followers", "linkedin_presence_followers")
      );
      setPlatformField("linkedIn", "employees", read("linkedin_employees"));
      setPlatformField("linkedIn", "connections", read("linkedin_connections"));
      setPlatformField(
        "linkedIn",
        "posts",
        read("linkedin_posts", "linkedin_presence_posts")
      );
      const lnPresence = read("linkedin_presence");
      const lnStatus = interpretPresence(lnPresence);
      if (typeof lnStatus !== "undefined") {
        setPlatformField("linkedIn", "status", lnStatus);
      }
    }

    // Instagram - prefer nested "Social Media Presence" container when present
    const socialPresenceContainers = [
      of?.data?.metrics?.["Social Media Presence"] ||
      of?.data?.metrics?.["social_media_presence"] ||
      of?.data?.metrics?.["socialMediaPresence"] ||
      of?.metrics?.["Social Media Presence"] ||
      of?.metrics?.["social_media_presence"] ||
      of?.metrics?.["socialMediaPresence"] ||
      of["Social Media Presence"] ||
      of["social_media_presence"] ||
      of["socialMediaPresence"] ||
      of?.data?.["Social Media Presence"] ||
      of?.data?.["social_media_presence"] ||
      of?.data?.["socialMediaPresence"],
    ].filter(Boolean) as any[];

    let handledInstagram = false;
    for (const container of socialPresenceContainers) {
      // container may be an object with platform keys (e.g. { Instagram: { instagram_link: ... } })
      if (!container || typeof container !== "object") continue;

      const igObj = container["Instagram"] || container["instagram"] || null;
      if (igObj && typeof igObj === "object") {
        handledInstagram = true;
        setPlatformField(
          "instagram",
          "url",
          igObj.instagram_link ?? igObj.instagram_url ?? igObj.instagram
        );
        setPlatformField(
          "instagram",
          "followers",
          typeof igObj.instagram_presence_followers !== "undefined"
            ? igObj.instagram_presence_followers
            : igObj.instagram_followers
        );
        setPlatformField(
          "instagram",
          "posts",
          typeof igObj.instagram_presence_posts !== "undefined"
            ? igObj.instagram_presence_posts
            : (igObj.instagram_posts ?? igObj.postsCount ?? igObj.raw_apify?.postsCount ?? igObj.raw_amplify?.postsCount)
        );
        const igStatus = interpretPresence(igObj.instagram_presence);
        if (typeof igStatus !== "undefined") {
          setPlatformField("instagram", "status", igStatus);
        }
        break;
      }
    }

    if (!handledInstagram) {
      setPlatformField(
        "instagram",
        "url",
        read("instagram_link", "instagram_url", "instagram")
      );
      setPlatformField(
        "instagram",
        "followers",
        read("instagram_followers", "instagram_presence_followers")
      );
      setPlatformField(
        "instagram",
        "posts",
        read("instagram_posts", "instagram_presence_posts", "postsCount") || of?.raw_apify?.postsCount || of?.raw_amplify?.postsCount
      );
      const igPresence = read("instagram_presence");
      const igStatus = interpretPresence(igPresence);
      if (typeof igStatus !== "undefined") {
        setPlatformField("instagram", "status", igStatus);
      }
    }

    // Facebook - try nested object first (API may return { Facebook: { facebook_presence: "N/A", ... } })
    const fbObj = of["Facebook"] || of["facebook"] || null;
    if (fbObj && typeof fbObj === "object") {
      setPlatformField(
        "facebook",
        "url",
        fbObj.facebook_link ?? fbObj.facebook_url ?? fbObj.facebook
      );
      setPlatformField(
        "facebook",
        "followers",
        typeof fbObj.facebook_presence_followers !== "undefined"
          ? fbObj.facebook_presence_followers
          : fbObj.facebook_followers
      );
      setPlatformField(
        "facebook",
        "posts",
        typeof fbObj.facebook_presence_posts !== "undefined"
          ? fbObj.facebook_presence_posts
          : fbObj.facebook_posts
      );
      const fbStatus = interpretPresence(fbObj.facebook_presence);
      if (typeof fbStatus !== "undefined") {
        setPlatformField("facebook", "status", fbStatus);
      }
    } else {
      // Fallback to top-level keys
      setPlatformField(
        "facebook",
        "url",
        read("facebook_link", "facebook_url", "facebook")
      );
      setPlatformField(
        "facebook",
        "followers",
        read("facebook_followers", "facebook_presence_followers")
      );
      setPlatformField(
        "facebook",
        "posts",
        read("facebook_posts", "facebook_presence_posts")
      );
      const fbPresence = read("facebook_presence");
      const fbStatus = interpretPresence(fbPresence);
      if (typeof fbStatus !== "undefined") {
        setPlatformField("facebook", "status", fbStatus);
      }
    }

    // YouTube
    // Try nested YouTube object first (API may return { YouTube: { youtube_presence: "N/A", ... } })
    const ytObj = of["YouTube"] || of["youtube"] || null;
    console.log("[YouTube] ytObj:", ytObj);
    if (ytObj && typeof ytObj === "object") {
      console.log(
        "[YouTube] Using nested object. youtube_presence:",
        ytObj.youtube_presence
      );
      setPlatformField(
        "youtube",
        "url",
        ytObj.youtube_link ?? ytObj.youtube_url ?? ytObj.youtube
      );
      setPlatformField(
        "youtube",
        "followers",
        typeof ytObj.youtube_presence_followers !== "undefined"
          ? ytObj.youtube_presence_followers
          : ytObj.youtube_followers
      );
      setPlatformField(
        "youtube",
        "subscribers",
        typeof ytObj.youtube_presence_subscribers !== "undefined"
          ? ytObj.youtube_presence_subscribers
          : ytObj.youtube_subscribers
      );
      setPlatformField(
        "youtube",
        "posts",
        typeof ytObj.youtube_presence_posts !== "undefined"
          ? ytObj.youtube_presence_posts
          : ytObj.youtube_videos ?? ytObj.youtube_posts
      );
      const ytStatus = interpretPresence(ytObj.youtube_presence);
      console.log("[YouTube] ytStatus after interpretPresence:", ytStatus);
      if (typeof ytStatus !== "undefined") {
        setPlatformField("youtube", "status", ytStatus);
      }
    } else {
      console.log("[YouTube] Using top-level keys fallback");
      // Fallback to top-level keys
      setPlatformField(
        "youtube",
        "url",
        read("youtube_link", "youtube_url", "youtube")
      );
      setPlatformField(
        "youtube",
        "followers",
        read("youtube_followers", "youtube_presence_followers")
      );
      setPlatformField(
        "youtube",
        "subscribers",
        read("youtube_subscribers", "youtube_presence_subscribers")
      );
      setPlatformField(
        "youtube",
        "posts",
        read("youtube_posts", "youtube_videos", "youtube_presence_posts")
      );
      const ytPresence = read("youtube_presence");
      console.log("[YouTube] ytPresence from read():", ytPresence);
      const ytStatus = interpretPresence(ytPresence);
      console.log("[YouTube] ytStatus after interpretPresence:", ytStatus);
      if (typeof ytStatus !== "undefined") {
        setPlatformField("youtube", "status", ytStatus);
      }
    }

    return { ...base, social: socialBase };
  }, [activeCase, outputFormat]);

  // Marketplace overview is now provided by the shared sample-data helper so
  // the mapping logic lives in one place and avoids duplicate cards.
  const marketplaceOverview = React.useMemo(() => {
    return getMarketplaceOverview(activeCase, outputFormat ?? undefined);
  }, [outputFormat, activeCase]);

  // Language support (comma-joined), is_subdomain, and copyright line values
  // extracted from website JSON to mirror the Web Analysis tab behavior.
  const languageSupportValue = useMemo(() => {
    if (!websiteDataJson) return "-";
    const cs =
      websiteDataJson.content_analysis?.language_support ??
      websiteDataJson.content_analysis?.languageSupport ??
      null;
    if (!cs) return "-";
    return Array.isArray(cs) ? cs.join(", ") : String(cs);
  }, [websiteDataJson]);

  const isSubdomainValue = useMemo(() => {
    if (!websiteDataJson) return "-";
    const di =
      websiteDataJson.domain_information ?? websiteDataJson.domain_info ?? {};
    const diRoot = di.domain_information ?? di;
    const val =
      diRoot?.is_subdomain ??
      di?.is_subdomain ??
      websiteDataJson?.is_subdomain ??
      "-";
    return val === null || val === undefined ? "-" : String(val);
  }, [websiteDataJson]);

  const copyrightLineValue = useMemo(() => {
    if (!websiteDataJson) return "-";
    const about = websiteDataJson.about_data ?? websiteDataJson.about ?? {};
    const aboutRoot = about.about_data ?? about;
    const val =
      aboutRoot?.copyright_line ??
      about?.copyright_line ??
      websiteDataJson?.copyright_line ??
      "-";
    return val === null || val === undefined ? "-" : String(val);
  }, [websiteDataJson]);

  // Helper to format field names: "logo_presence" -> "Logo Presence"
  const formatFieldNameForDisplay = (fieldName: string): string => {
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Open an artifact showing red-flag subrule reasonings filtered by a monitored dimension
  const openMonitoredDimensionArtifact = async (dimensionName: string) => {
    const artifactId = `monitored-dim-${dimensionName.replace(
      /\s+/g,
      "-"
    )}-${Date.now()}`;

    const redFlagsData = redFlags || [];

    artifactStore.addTab({
      id: artifactId,
      title: `${dimensionName} — Reasoning`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={`${dimensionName} — Reasoning`}
            contentIDText="Case ID"
            contentID={(activeCase as any)?.caseId || caseId}
          />

          <ArtifactSectionCollapsible title="Reasoning" defaultOpen>
            {!redFlagsData || redFlagsData.length === 0 ? (
              <div className="text-sm text-gray-600">
                No red-flag data available for this case.
              </div>
            ) : (
              (() => {
                const normalizedDim = String(dimensionName || "").toLowerCase();

                // Precise mapping from monitored-dimension display names to the
                // single subrule key we want to show for that card. When the
                // mapping value is ['__NO_DATA__'] we intentionally show a
                // "No data" message instead of attempting fuzzy matches.
                const dimensionToSubruleKeys: Record<string, string[] | null> =
                {
                  // show registered_name subrule reasoning
                  "registered name": ["registered_name"],
                  // show legal_name_mismatch for business name
                  "business name": ["legal_name_mismatch"],
                  // show thin_file_merchant_output for org type
                  "org type": ["thin_file_merchant_output"],
                  // explicitly show no data for website content per request
                  "website content": ["__NO_DATA__"],
                  // show url_mismatch for website domain
                  "website domain": ["primary_website_url"],
                  // show primary_website_url for return url
                  "return url": ["url_mismatch"],
                  // explicitly show no data for payment url per request
                  "payment url": ["__NO_DATA__"],
                };

                const candidateKeys =
                  dimensionToSubruleKeys[normalizedDim] ?? null;

                const matches: Array<any> = [];

                // If mapping explicitly says No Data, render a No Data message
                if (
                  Array.isArray(candidateKeys) &&
                  candidateKeys.length === 1 &&
                  candidateKeys[0] === "__NO_DATA__"
                ) {
                  return (
                    <div className="text-sm text-gray-600">
                      No data available for {dimensionName}.
                    </div>
                  );
                }

                // If we have precise candidate keys, look only for those subrule names
                if (Array.isArray(candidateKeys) && candidateKeys.length > 0) {
                  redFlagsData.forEach((flag: any) => {
                    const subrules = flag.subrules || [];
                    subrules.forEach((sr: any) => {
                      const srName = String(sr.subrule || "").toLowerCase();
                      for (const key of candidateKeys) {
                        if (srName === key || srName.includes(key)) {
                          matches.push({ flag, subrule: sr });
                          break;
                        }
                      }
                    });
                  });

                  // If we didn't find the mapped subrule, explicitly show No Data
                  if (matches.length === 0) {
                    return (
                      <div className="text-sm text-gray-600">
                        No red-flag subrule data found for {dimensionName}.
                      </div>
                    );
                  }
                } else {
                  // No precise mapping available: fall back to keyword-in-name/reason matching
                  const keyword = normalizedDim.replace(/[^a-z0-9]/g, "");
                  redFlagsData.forEach((flag: any) => {
                    const subrules = flag.subrules || [];
                    subrules.forEach((sr: any) => {
                      const srName = String(sr.subrule || "").toLowerCase();
                      const srReason = String(sr.reasoning || "").toLowerCase();
                      if (
                        srName.includes(keyword) ||
                        srReason.includes(keyword)
                      ) {
                        matches.push({ flag, subrule: sr });
                      }
                    });
                  });
                }

                // If no direct matches found, fall back to showing all subrules grouped by flag
                if (matches.length === 0) {
                  return (
                    <div className="space-y-4">
                      {redFlagsData.map((flag: any, fi: number) => (
                        <div key={`flag-${fi}`}>
                          <div className="text-sm text-gray-600 mt-1 space-y-2">
                            {(flag.subrules || []).map(
                              (sr: any, si: number) => (
                                <div
                                  key={`sr-${si}`}
                                  className="p-2 bg-gray-50 rounded"
                                >
                                  <div className="text-xs font-medium text-gray-800">
                                    {sr.subrule}
                                  </div>
                                  <div className="text-sm text-gray-700 mt-1">
                                    {sr.reasoning}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // Otherwise show the matching subrules (only subrule name + reasoning)
                return (
                  <div className="space-y-3">
                    {matches.map((m: any, idx: number) => (
                      <div
                        key={`match-${idx}`}
                        className="p-3 bg-white border border-gray-100 rounded"
                      >
                        <div className="text-xs font-medium text-gray-800">
                          {m.subrule.subrule}
                        </div>
                        <div className="text-sm text-gray-700 mt-2">
                          {m.subrule.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
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

  const openLogoArtifact = async () => {
    const artifactId = `logo-analysis-${Date.now()}`;

    // Determine case id to fetch website JSON if needed
    const id = (activeCase as any)?.caseId || caseId;

    // Try to find existing website data on the case; otherwise fetch from API
    let websiteData =
      (activeCase as any)?.websiteJson ||
      (activeCase as any)?.website_json ||
      (activeCase as any)?.websiteData ||
      (activeCase as any)?.website_data ||
      null;

    if (!websiteData) {
      websiteData = null;
    }

    const logoObj =
      websiteData?.logo_analysis ?? (activeCase as any)?.logo_analysis ?? null;
    const logoData = transformToKeyValue(logoObj, "", "Info", "blue", "info");

    artifactStore.addTab({
      id: artifactId,
      title: "Logo Analysis",
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title="Logo Description"
            contentIDText="Case ID"
            contentID={(activeCase as any)?.caseId || caseId}
          />

          <ArtifactSectionCollapsible title="Logo Analysis" defaultOpen>
            {logoData && logoData.length > 0 ? (
              <CustomTableView
                title={undefined}
                columns={[
                  {
                    key: "field",
                    header: "Field",
                    width: "220px",
                    align: "left" as const,
                    verticalAlign: "top" as const,
                    render: (value: string, row: Record<string, any>) => {
                      const iconName = (row as any).keyIcon as
                        | string
                        | undefined;
                      const FieldIcon = iconName
                        ? getIconByName(iconName)
                        : null;
                      const formattedValue = formatFieldNameForDisplay(value);
                      return (
                        <span className="flex items-start gap-2">
                          {FieldIcon && (
                            <FieldIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                          )}
                          <span className="font-bold text-gray-700">
                            {formattedValue}
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
                    render: (value: string | string[]) => {
                      // Use TruncatableText to show upto 3 lines with a Show more/less toggle
                      return (
                        <TruncatableText
                          text={value as any}
                          textColorClass="text-gray-900"
                        />
                      );
                    },
                  },
                ]}
                data={logoData}
                initialRowLimit={logoData.length}
                headerAndTotalRowBg="gray-100"
                showCSVExport={false}
                isLoading={websiteLoading}
              />
            ) : (
              <div className="text-sm text-gray-600">
                No logo analysis available for this case. See Web Analysis tab.
              </div>
            )}
          </ArtifactSectionCollapsible>
        </div>
      ),
    });

    // Activate the new artifact tab and expand the panel
    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  // Open an artifact showing social media platform details using outputFormat API
  const openSocialMediaArtifact = async (platformDisplayName: string, accountIndex: number = 0) => {
    const artifactId = `social-media-${platformDisplayName}-${Date.now()}`;
    // We always show ALL accounts regardless of which carousel slide was active

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
        // Extract fields from nested site_data (helper logic already defined in parent scope but we redefine or use here)
        const extractField = (raw: any, platform: string, fieldNames: string[]) => {
          if (!raw) return null;
          for (const f of fieldNames) {
            if (raw[f] !== undefined && raw[f] !== null) return raw[f];

            // Check nested site_data
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

            // Check raw_apify and raw_amplify
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

    // Helper to format field names: "linkedin_presence" -> "Linkedin Presence"
    const formatFieldName = (fieldName: string): string => {
      return fieldName
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    // Build table data from platform data - show only strictly requested fields per platform
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
          // Handle boolean values
          if (typeof value === "boolean") {
            displayValue = value ? "Yes" : "No";
          }
          // Handle string values
          else if (typeof value === "string") {
            let s = value.trim();
            // Truncate long Facebook URLs if they point to photos or posts
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
          // Handle numbers
          else if (typeof value === "number") {
            displayValue = String(value);
          }
          // Fallback
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

    // Build per-account table data
    const allAccountsTableData = allAccountsData.map(acc => buildTableData(acc));
    const tableData = platformData ? buildTableData(platformData) : [];

    // Build artifact content
    artifactStore.addTab({
      id: artifactId,
      title: `${platformDisplayName} (Social)`,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={`${platformDisplayName} - Social Media Details`}
            contentIDText="Case ID"
            contentID={(activeCase as any)?.caseId || caseId}
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
                  {/* Section divider / account header */}
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

    // Activate the artifact tab and expand panel
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

    // Get fields from marketSignals
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

    // Helper to format field names for the details table
    const formatFieldName = (fieldName: string): string => {
      return fieldName
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    // Build table data from marketplace data
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

      // Get all keys and sort them with priority fields first
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
        // Skip aligned_with_lob entries per UX request
        if (String(key).toLowerCase().includes("aligned_with_lob")) return;
        const value = data[key];
        if (value !== null && value !== undefined && value !== "") {
          const formattedKey = formatFieldName(key);
          let displayValue = value;

          // Handle presence field - convert boolean/string to readable format
          if (key.toLowerCase().includes("presence")) {
            if (typeof value === "boolean") {
              displayValue = value ? "Yes" : "No";
            } else if (String(value).toLowerCase() === "yes") {
              displayValue = "Yes";
            } else if (String(value).toLowerCase() === "no") {
              displayValue = "No";
            }
          }

          // Handle verified field
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

    // Extract reasoning from marketplace data (skip for Google)
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
            contentID={(activeCase as any)?.caseId || caseId}
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

  const greenBubbleTagRender = (v: any) => {
    if (!v || String(v).toLowerCase() === "n/a" || String(v).toLowerCase() === "na") {
      return <BubbleTag text="-" color="gray" />;
    }
    const color =
      String(v).toLowerCase().includes("no match") ||
        String(v).toLowerCase().includes("low risk") ||
        String(v).toLowerCase().includes("green") ||
        String(v).toLowerCase().includes("healthy")
        ? "green"
        : "red";
    return <BubbleTag text={String(v)} color={color as any} />;
  };

  const screeningTableColumns = [
    {
      key: "name",
      header: "Name",
      width: "260px",
      align: "left" as const,
      wrap: true,
    },
    { key: "type", header: "Type", width: "120px", align: "left" as const },
    {
      key: "relationship",
      header: "Relationship",
      width: "140px",
      align: "left" as const,
    },
    {
      key: "ubo",
      header: "UBO",
      width: "100px",
      align: "left" as const,
      render: (v: any) => {
        if (String(v) === "N/A" || String(v) === "NA") {
          return <BubbleTag text="-" color="gray" />;
        }
        return <span className="text-sm text-gray-700">{v}</span>;
      },
    },
    {
      key: "country",
      header: "Country",
      width: "100px",
      align: "left" as const,
    },
    {
      key: "pep_check",
      header: "PEP Check",
      width: "140px",
      align: "left" as const,
      render: (_: unknown, row: Record<string, unknown>) =>
        greenBubbleTagRender(row.pep_check),
    },
    {
      key: "sanction_country_check",
      header: "Sanction Country Check",
      width: "160px",
      align: "left" as const,
      render: (_: unknown, row: Record<string, unknown>) =>
        greenBubbleTagRender(row.sanction_country_check),
    },
    {
      key: "sanction_check",
      header: "Sanction Check",
      width: "140px",
      align: "left" as const,
      render: (_: unknown, row: Record<string, unknown>) =>
        greenBubbleTagRender(row.sanction_check),
    },
    {
      key: "fatf_country_list",
      header: "FATF Country list",
      width: "140px",
      align: "left" as const,
      render: (_: unknown, row: Record<string, unknown>) =>
        greenBubbleTagRender(row.fatf_country_list),
    },
    {
      key: "public_domain_check",
      header: "Public Domain Check",
      width: "160px",
      align: "left" as const,
      render: (_: unknown, row: Record<string, unknown>) =>
        greenBubbleTagRender(row.public_domain_check),
    },
    {
      key: "social_media_check",
      header: "Social Media Check",
      width: "200px",
      align: "left" as const,
      wrap: true,
    },
    {
      key: "report",
      header: "Report",
      width: "120px",
      align: "center" as const,
      render: (_: unknown, row: Record<string, unknown>) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openScreeningReportArtifact(row as Record<string, unknown>);
          }}
          className="cursor-pointer border-0 bg-transparent p-0"
        >
          <BubbleTag
            text="Open"
            color="blue"
            icon={<ExternalLink className="h-3.5 w-3.5 shrink-0" />}
            hasInsideIcon
          />
        </button>
      ),
    },
  ];

  const openScreeningReportArtifact = (row: Record<string, unknown>) => {
    const entityName = String(row?.name ?? "Screening Report");
    const artifactId = `screening-report-${entityName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${Date.now()}`;

    artifactStore.addTab({
      id: artifactId,
      title: entityName,
      renderArtifact: () => (
        <ScreeningReportArtifact
          row={row}
          caseId={caseId || ""}
          activeCase={activeCase}
          websiteDataJson={datastoreEntryData?.data?.data}
          redFlags={redFlags || []}
          artifactPanelCollapsed={artifactPanelCollapsed}
          openScreeningSocialMediaArtifact={openSocialMediaArtifact}
        />
      ),
    });
    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  // Open Backlinks artifact (hardcoded backlinks for a specific case)
  const openBacklinksArtifact = async () => {
    const artifactId = `backlinks-${Date.now()}`;

    // Use merchant identifier (merchantId prop or externalMerchantId on the case)
    const merchantIdentifier =
      caseId ||
      merchantId ||
      (activeCase as any)?.externalMerchantId ||
      (activeCase as any)?.external_merchant_id ||
      String((activeCase as any)?.merchantId || "");

    // Fetch status and reasoning from sample data
    const sampleKey =
      (backlinksSampleData as any)[merchantIdentifier] ||
      backlinksSampleData[Number(merchantIdentifier)] ||
      null;

    const overallAnalysis = sampleKey?.overall_analysis || null;
    const overallFinalTriggerRaw =
      overallAnalysis?.overall_final_trigger ||
      overallAnalysis?.overall_trigger ||
      null;
    const overallReasoningRaw = overallAnalysis?.overall_reasoning || null;

    const normalizeTriggered = (v: any): boolean | null => {
      if (v === null || typeof v === "undefined") return null;
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1 ? true : v === 0 ? false : null;
      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (["true", "1", "yes", "y"].includes(s)) return true;
        if (["false", "0", "no", "n"].includes(s)) return false;
      }
      return null;
    };

    const overallFinalTrigger = normalizeTriggered(overallFinalTriggerRaw);
    const overallReasoning = overallReasoningRaw
      ? String(overallReasoningRaw)
      : null;

    artifactStore.addTab({
      id: artifactId,
      title: "Backlinks",
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title="Backlinks"
            contentIDText="Merchant ID"
            contentID={merchantIdentifier}
          />

          {/* Overall Status - fetch from sample data */}
          {(() => {
            // Map status: Yes -> Triggered, No -> Not Triggered
            let statusText = "N/A";
            let tagColor: "red" | "green" | "gray" = "gray";

            if (overallFinalTrigger === true) {
              statusText = "Triggered";
              tagColor = "red";
            } else if (overallFinalTrigger === false) {
              statusText = "Not Triggered";
              tagColor = "green";
            } else {
              statusText = "N/A";
              tagColor = "gray";
            }

            return (
              <ArtifactSectionCollapsible title="Overall Status" defaultOpen>
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Status:
                    </span>
                    <BubbleTag
                      text={statusText}
                      color={tagColor as any}
                      withBorder={true}
                    />
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-gray-700 block mb-2">
                      Overall Reasoning:
                    </span>
                    <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                      {overallReasoning ?? "No reasoning available."}
                    </div>
                  </div>
                </div>
              </ArtifactSectionCollapsible>
            );
          })()}

          {/* Additional Details */}
          {(() => {
            const totalBacklinks = sampleKey?.total_backlinks ?? "-";
            const totalLinks = sampleKey?.total_links ?? "-";

            const data = [
              { particular: "Total Backlinks", value: String(totalBacklinks) },
              { particular: "Total Links", value: String(totalLinks) },
            ];

            const columns = [
              {
                key: "particular",
                header: "Particular",
                width: "300px",
                align: "left" as const,
                verticalAlign: "top" as const,
                render: (value: string) => (
                  <span className="text-sm font-medium text-gray-700">
                    {value}
                  </span>
                ),
              },
              {
                key: "value",
                header: "Value",
                width: "200px",
                align: "left" as const,
                verticalAlign: "top" as const,
                render: (value: string) => (
                  <span className="text-sm text-gray-800">{value}</span>
                ),
              },
            ];

            return (
              <ArtifactSectionCollapsible title="Additional Details" defaultOpen>
                <div className="mt-2">
                  <CustomTableView
                    headerAndTotalRowBg="gray-100"
                    columns={columns}
                    data={data}
                    initialRowLimit={data.length}
                    isExpanded={true}
                    showCSVExport={false}
                    enableAlternatingRows={true}
                    alternatingRowColor="gray"
                  />
                </div>
              </ArtifactSectionCollapsible>
            );
          })()}
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

  // Open a backlinks checklist-specific artifact showing trigger + reasoning
  const openBacklinkCheckArtifact = (
    triggerKey: string,
    reasoningKey: string,
    displayName: string
  ) => {
    const artifactId = `backlink-check-${displayName.replace(
      /\s+/g,
      "-"
    )}-${Date.now()}`;

    const normalizeTriggered = (v: any): boolean | null => {
      if (v === null || typeof v === "undefined") return null;
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1 ? true : v === 0 ? false : null;
      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (["true", "1", "yes", "y"].includes(s)) return true;
        if (["false", "0", "no", "n"].includes(s)) return false;
      }
      return null;
    };

    // Get merchant identifier from case or prop
    const merchantIdentifier =
      caseId ||
      merchantId ||
      (activeCase as any)?.externalMerchantId ||
      (activeCase as any)?.external_merchant_id ||
      String((activeCase as any)?.merchantId || "");

    // Get sample data for this merchant
    const sampleData =
      (backlinksSampleData as any)[merchantIdentifier] ||
      backlinksSampleData[Number(merchantIdentifier)] ||
      null;

    // Map display name to sample data section and fields
    let triggeredValue: any = null;
    let reasoningValue: any = null;
    let analysisSection: any = null;
    let prefix: string = "";

    if (sampleData) {
      if (displayName === "SEO Manipulation checklist") {
        triggeredValue = sampleData?.seo_analysis?.seo_overall_triggered;
        reasoningValue = sampleData?.seo_analysis?.seo_reasoning;
        analysisSection = sampleData?.seo_analysis;
        prefix = "seo";
      } else if (displayName === "Risky Content Analysis") {
        triggeredValue =
          sampleData?.risky_content_analysis?.risky_overall_triggered;
        reasoningValue = sampleData?.risky_content_analysis?.risky_reasoning;
        analysisSection = sampleData?.risky_content_analysis;
        prefix = "risky";
      } else if (displayName === "Low Credibility analysis") {
        triggeredValue =
          sampleData?.low_credibility_analysis
            ?.low_credibility_overall_triggered;
        reasoningValue =
          sampleData?.low_credibility_analysis?.low_credibility_reasoning;
        analysisSection = sampleData?.low_credibility_analysis;
        prefix = "low_credibility";
      } else if (displayName === "High Authority Analysis") {
        triggeredValue =
          sampleData?.high_authority_analysis?.high_authority_overall_triggered;
        reasoningValue =
          sampleData?.high_authority_analysis?.high_authority_reasoning;
        analysisSection = sampleData?.high_authority_analysis;
        prefix = "high_authority";
      }
    }

    const triggered = normalizeTriggered(triggeredValue);
    const reasoning = reasoningValue ? String(reasoningValue) : null;

    // Convert triggered boolean to status text
    const statusText =
      triggered === true
        ? "Triggered"
        : triggered === false
          ? "Not Triggered"
          : "No Data Available";
    const statusColor =
      triggered === true ? "red" : triggered === false ? "green" : "gray";

    // Build additional details table data (not using useMemo - plain data construction)
    const additionalDetailsData = (() => {
      if (!analysisSection) return [];

      const data = [];

      // Helper to safely get value and format it
      const getValue = (key: string) => {
        const value = analysisSection[key];
        return value !== undefined && value !== null ? String(value) : "N/A";
      };

      // Format prefix for display (e.g., "low_credibility" -> "Low Credibility")
      const prefixDisplay = prefix
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Special handling based on prefix
      if (prefix === "high_authority") {
        // For High Authority: show only high_authority_domains_count
        data.push({
          particular: "High Authority Domains Count",
          value: getValue("high_authority_domains_count"),
        });
      } else if (prefix === "low_credibility") {
        // For Low Credibility: show links_count, backlinks, percentage, AND avg_domain_authority
        let linksCountKey = "low_credibility_links_count";
        let backlinksKey = "low_credibility_backlinks";
        let backlinksPercentageKey = "low_credibility_backlinks_percentage";
        let avgDomainAuthorityKey = "low_credibility_avg_domain_authority";

        data.push({
          particular: `${prefixDisplay} Links Count`,
          value: getValue(linksCountKey),
        });

        data.push({
          particular: `${prefixDisplay} Backlinks`,
          value: getValue(backlinksKey),
        });

        data.push({
          particular: `${prefixDisplay} Backlinks Percentage`,
          value: getValue(backlinksPercentageKey),
        });

        data.push({
          particular: `${prefixDisplay} Avg Domain Authority`,
          value: getValue(avgDomainAuthorityKey),
        });
      } else {
        // For SEO and Risky: standard fields
        let linksCountKey = `${prefix}_links_count`;
        let backlinksKey = `${prefix}_backlinks`;
        let backlinksPercentageKey = `${prefix}_backlinks_percentage`;

        // Special handling for risky content which uses different naming
        if (prefix === "risky") {
          linksCountKey = "risky_links_count";
          backlinksKey = "risky_links_backlinks"; // Note: different naming
          backlinksPercentageKey = "risky_content_backlinks_percentage";
        }

        data.push({
          particular: `${prefixDisplay} Links Count`,
          value: getValue(linksCountKey),
        });

        data.push({
          particular: `${prefixDisplay} Backlinks`,
          value: getValue(backlinksKey),
        });

        data.push({
          particular: `${prefixDisplay} Backlinks Percentage`,
          value: getValue(backlinksPercentageKey),
        });
      }

      data.push({
        particular: "Total Backlinks",
        value: sampleData && sampleData.total_backlinks !== undefined ? String(sampleData.total_backlinks) : "N/A",
      });

      data.push({
        particular: "Total Links",
        value: sampleData && sampleData.total_links !== undefined ? String(sampleData.total_links) : "N/A",
      });

      return data;
    })();

    // Table columns for additional details
    const additionalDetailsColumns = [
      {
        key: "particular",
        header: "Particular",
        width: "300px",
        align: "left" as const,
        verticalAlign: "top" as const,
        render: (value: string) => (
          <span className="text-sm font-medium text-gray-700">{value}</span>
        ),
      },
      {
        key: "value",
        header: "Value",
        width: "200px",
        align: "left" as const,
        verticalAlign: "top" as const,
        render: (value: string) => (
          <span className="text-sm text-gray-800">{value}</span>
        ),
      },
    ];

    // Extract domain links based on analysis type
    const getDomainLinks = (): string[] => {
      if (!sampleData) return [];

      let domains: string[] = [];

      if (displayName === "SEO Manipulation checklist") {
        const matches = sampleData?.seo_analysis?.seo_matches;
        domains = Array.isArray(matches)
          ? matches.map((m: any) => m.domain)
          : [];
      } else if (displayName === "Risky Content Analysis") {
        const matches = sampleData?.risky_content_analysis?.risky_matches;
        domains = Array.isArray(matches)
          ? matches.map((m: any) => m.domain)
          : [];
      } else if (displayName === "Low Credibility analysis") {
        const domains_list =
          sampleData?.low_credibility_analysis?.low_credibility_domains;
        domains = Array.isArray(domains_list)
          ? domains_list.map((m: any) => m.domain)
          : [];
      } else if (displayName === "High Authority Analysis") {
        const domains_list =
          sampleData?.high_authority_analysis?.high_authority_domains;
        domains = Array.isArray(domains_list)
          ? domains_list.map((m: any) => m.domain)
          : [];
      }

      return domains;
    };

    const allDomainLinks = getDomainLinks();

    // Domain links table component with expandable "Show More"
    const DomainLinksTable = () => {
      const [showAll, setShowAll] = useState(false);
      const LINKS_INITIAL_LIMIT = 5;
      const displayedLinks = showAll
        ? allDomainLinks
        : allDomainLinks.slice(0, LINKS_INITIAL_LIMIT);
      const hasMore = allDomainLinks.length > LINKS_INITIAL_LIMIT;

      const domainLinksColumns = [
        {
          key: "particular",
          header: "Particular",
          width: "200px",
          align: "left" as const,
          verticalAlign: "top" as const,
          render: () => (
            <span className="text-sm font-medium text-gray-700">
              Domain Link
            </span>
          ),
        },
        {
          key: "links",
          header: "Links",
          width: "400px",
          align: "left" as const,
          verticalAlign: "top" as const,
          render: () => null, // We'll handle rendering below
        },
      ];

      const domainLinksData = displayedLinks.map((domain, idx) => ({
        particular: `Link ${idx + 1}`,
        links: domain,
        _domain: domain,
      }));

      if (allDomainLinks.length === 0) {
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <span className="text-sm text-gray-500">No links available</span>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <span className="text-sm font-semibold text-gray-700">
                      Particular
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-sm font-semibold text-gray-700">
                      Links
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedLinks.map((domain, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/4">
                      Link {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 w-3/4">
                      <a
                        href={`https://${domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {domain}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showAll
                ? "Show Less"
                : `Show More (+${allDomainLinks.length - LINKS_INITIAL_LIMIT})`}
            </button>
          )}
        </div>
      );
    };

    artifactStore.addTab({
      id: artifactId,
      title: displayName,
      renderArtifact: () => (
        <div className="pb-6">
          <ArtifactHeader
            title={displayName}
            contentIDText="Merchant ID"
            contentID={merchantIdentifier}
          />

          <ArtifactSectionCollapsible title="Status & Reasoning" defaultOpen>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Status:
                </span>
                <BubbleTag
                  text={statusText}
                  color={statusColor as any}
                  withBorder={true}
                />
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-700 block mb-2">
                  Reasoning:
                </span>
                <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                  {reasoning ?? "No reasoning available."}
                </div>
              </div>
            </div>
          </ArtifactSectionCollapsible>

          {additionalDetailsData.length > 0 && (
            <ArtifactSectionCollapsible
              title="Additional Details"
              defaultOpen={true}
            >
              <div className="mt-2">
                <CustomTableView
                  headerAndTotalRowBg="gray-100"
                  columns={additionalDetailsColumns}
                  data={additionalDetailsData}
                  initialRowLimit={additionalDetailsData.length}
                  isExpanded={true}
                  showCSVExport={false}
                  enableAlternatingRows={true}
                  alternatingRowColor="gray"
                />
              </div>
            </ArtifactSectionCollapsible>
          )}

          <ArtifactSectionCollapsible title="Domain Links" defaultOpen={true}>
            <div className="mt-2">
              <DomainLinksTable />
            </div>
          </ArtifactSectionCollapsible>
        </div>
      ),
    });

    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  // Open RF013 flag details artifact (reuses the same artifact content as Decisioning tab)
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
          outputFormat={outputFormat}
        // Same as decisioning tab: show overall status and all subrules
        />
      ),
    });

    setTimeout(() => {
      const s = useArtifactStore.getState();
      s.forceActivateTab(artifactId);
      s.setCollapsed(false);
    }, 0);
  };

  const getRiskInfoForPDF = () => {
    if (!activeCase) return { label: "N/A", color: "gray", score: "N/A" };

    const priorityFlag = (activeCase as any).priority_flag;
    const riskReport = (activeCase as any).risk_report || (activeCase as any).risk_score;
    const hasRiskReport = riskReport && typeof riskReport === "object";

    const riskScore = priorityFlag?.points ?? (hasRiskReport
      ? riskReport.risk_score
      : (typeof (activeCase as any).risk_score === 'number' ? (activeCase as any).risk_score : null));

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

    if (priorityFlag && priorityFlag.category) {
      return { ...formatLabelAndColor(String(priorityFlag.category)), score: String(riskScore ?? "N/A") };
    }
    if (hasRiskReport && riskReport.risk_tier) {
      return { ...formatLabelAndColor(String(riskReport.risk_tier)), score: String(riskScore ?? "N/A") };
    }

    const scoreVal = Number(riskScore);
    if (!isNaN(scoreVal) && riskScore !== null) {
      if (scoreVal >= 75) return { label: "Critical Risk", color: "red", score: String(scoreVal) };
      if (scoreVal >= 51) return { label: "High Risk", color: "orange", score: String(scoreVal) };
      if (scoreVal >= 26) return { label: "Medium Risk", color: "amber", score: String(scoreVal) };
      return { label: "Low Risk", color: "green", score: String(scoreVal) };
    }

    return { label: "Evaluating...", color: "gray", score: "N/A" };
  };


  const handleFullReportPDF = async () => {
    if (!fullReportTemplateRef.current) return;

    const clone = fullReportTemplateRef.current.cloneNode(true) as HTMLElement;
    await preparePDFElement(clone);

    const merchantName = (activeCase as any)?.merchant?.name || (activeCase as any)?.merchant_name || 'Merchant';
    const fileName = `${merchantName.replace(/\s+/g, '_')}_Full_Investigation_Report.pdf`;

    const riskInfo = getRiskInfoForPDF();

    await generateInvestigationReportPDF(clone, merchantName, null, '', {
      filename: fileName,
      website: (activeCase as any)?.website || (activeCase as any)?.merchant?.website || "",
      runDate: (activeCase as any)?.lastRunDateTime || (activeCase as any)?.run?.updated_at || (activeCase as any)?.created_at || new Date().toISOString(),
      riskScore: riskInfo.score,
      riskLabel: riskInfo.label,
      riskColor: riskInfo.color
    });
  };

  const handleDownloadReport = async () => {
    if (!activeCase || !pdfTemplateRef.current) return;

    try {
      const merchantName = activeCase?.registeredName || (activeCase as any)?.merchant?.name || "N/A";
      const mid = (activeCase as any)?.externalMerchantId || (activeCase as any)?.run?.merchant_id || (activeCase as any)?.caseId || "N/A";
      const website = (activeCase as any)?.website || (activeCase as any)?.merchant?.website || "";

      await preparePDFElement(pdfTemplateRef.current);

      const riskInfo = getRiskInfoForPDF();

      await generateInvestigationReportPDF(
        pdfTemplateRef.current,
        merchantName,
        null,
        mid,
        {
          filename: `${merchantName.replace(/[^a-z0-9]/gi, "_")}_Investigation_Report.pdf`,
          website,
          riskScore: riskInfo.score,
          riskLabel: riskInfo.label,
          riskColor: riskInfo.color,
          runDate: (activeCase as any)?.lastRunDateTime || (activeCase as any)?.run?.updated_at || (activeCase as any)?.created_at || new Date().toISOString()
        }
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="space-y-6">
      <InvPageHeader
        activeCase={activeCase as any}
        onGenerateReport={handleDownloadReport}
        onGenerateFullReport={handleFullReportPDF}
      />

      <div>
        {(() => {
          const Icon = getIconByName("User") || getIconByName("Grid") || getIconByName("Table");
          return (
            <div className="mt-6">
              <SectionHeaderWithFlags
                positiveFlags={[]}
                negativeFlags={[]}
                neutralFlags={[]}
                title="Business Identity Overview"
                icon={Icon || undefined}
                iconColorClass="text-blue-600"
                allowCollapse={false}
              />
              <div className="mt-4 space-y-6">
                {BC_FIELD_GROUPS.map((group) => {
                  const conflictCount = group.fields.filter(
                    (f) => bcAnalysis[f.key]?.status === "conflict"
                  ).length;

                  const tableData = group.fields.map((f) => ({
                    field: f.label,
                    onboarding: transformedBCData[f.key]?.onboarding,
                    website: transformedBCData[f.key]?.website,
                    probe42: transformedBCData[f.key]?.probe42,
                  }));

                  const MultiLineCell = ({ val, fieldLabel }: { val: any, fieldLabel?: string }) => {
                    const [isExpanded, setIsExpanded] = React.useState(false);
                    if (!val) return <span className="text-gray-400">-</span>;

                    let normalizedVal = val;
                    if (Array.isArray(val)) {
                      normalizedVal = val.map(item =>
                        (typeof item === 'object' && item !== null && item.url) ? item.url : item
                      ).join(", ");
                    } else if (typeof val === 'object' && val !== null && val.url) {
                      normalizedVal = val.url;
                    }

                    const isAddress = fieldLabel?.toLowerCase().includes("address");
                    const isLOB = fieldLabel?.toLowerCase().includes("line of business");

                    if (isAddress || isLOB) {
                      if (isLOB && String(normalizedVal).includes("\n")) {
                        const [lobPart, descPart] = String(normalizedVal).split("\n");
                        return (
                          <div className="flex flex-col max-w-full overflow-hidden">
                            <span className="text-gray-800 text-xs font-semibold truncate block max-w-full" title={lobPart}>
                              {lobPart}
                            </span>
                            <span className="text-gray-500 text-[10px] leading-tight mt-0.5 truncate block max-w-full" title={descPart}>
                              {descPart}
                            </span>
                          </div>
                        );
                      }

                      const formattedText = String(normalizedVal)
                        .replace(/\n+/g, ", ")
                        .replace(/,(\s*,)+/g, ",")
                        .replace(/\s+/g, " ")
                        .trim();

                      return (
                        <div className="max-w-full overflow-hidden">
                          <TruncatableText
                            text={formattedText}
                            textColorClass="text-gray-800"
                            additionalClassName="text-xs leading-relaxed pr-4"
                          />
                        </div>
                      );
                    }

                    const str = String(normalizedVal);
                    const parts = str
                      .split(/[\n,]/)
                      .map((p) => p.trim())
                      .filter(Boolean);

                    const showExpand = parts.length > 3;
                    const displayedParts = isExpanded ? parts : parts.slice(0, 3);

                    return (
                      <div className="flex flex-col gap-1.5 overflow-hidden max-w-full">
                        {displayedParts.map((part, idx) => {
                          const isUrl =
                            /^(https?:\/\/[^\s]+)$|^(www\.[^\s]+)$|^(?:\w+\.)+\w+\/.*$/i.test(
                              part
                            );
                          if (isUrl) {
                            const href = part.startsWith("www.")
                              ? `https://${part}`
                              : part.includes("://")
                                ? part
                                : `https://${part}`;
                            return (
                              <a
                                key={idx}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline truncate block max-w-full text-xs"
                                title={part}
                              >
                                {part}
                              </a>
                            );
                          }
                          return (
                            <span
                              key={idx}
                              className="block truncate text-gray-800 text-xs max-w-full"
                              title={part}
                            >
                              {part}
                            </span>
                          );
                        })}
                        {showExpand && (
                          <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-[10px] text-blue-600 font-bold hover:underline mt-1 w-fit flex items-center gap-0.5"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-2.5 h-2.5" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-2.5 h-2.5" />
                                +{parts.length - 3} more
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  };

                  const columns = [
                    {
                      key: "field",
                      header: "Field",
                      width: "25%",
                      render: (val: string) => (
                        <span
                          className="font-semibold text-gray-700 text-xs truncate block max-w-full"
                          title={val}
                        >
                          {val}
                        </span>
                      ),
                    },
                    {
                      key: "onboarding",
                      header: BC_SOURCE_LABELS.onboarding,
                      width: "25%",
                      render: (val: any, row: any) => <MultiLineCell val={val} fieldLabel={row.field} />,
                    },
                    {
                      key: "website",
                      header: BC_SOURCE_LABELS.website,
                      width: "25%",
                      render: (val: any, row: any) => <MultiLineCell val={val} fieldLabel={row.field} />,
                    },
                    {
                      key: "probe42",
                      header: BC_SOURCE_LABELS.probe42,
                      width: "25%",
                      render: (val: any, row: any) => <MultiLineCell val={val} fieldLabel={row.field} />,
                    },
                  ];

                  const GroupIcon = (() => {
                    switch (group.label) {
                      case "Business Identity": return <Briefcase className="w-4 h-4 text-blue-600" />;
                      case "Business Classification": return <Layers className="w-4 h-4 text-blue-600" />;
                      case "Registration Details": return <FileText className="w-4 h-4 text-blue-600" />;
                      case "Key Personnel": return <Users className="w-4 h-4 text-blue-600" />;
                      case "Address": return <MapPin className="w-4 h-4 text-blue-600" />;
                      case "Contact Details": return <Phone className="w-4 h-4 text-blue-600" />;
                      default: return null;
                    }
                  })();

                  return (
                    <CustomTableView
                      key={group.label}
                      title={group.label}
                      titleIcon={GroupIcon}
                      columns={columns}
                      data={tableData}
                      initialRowLimit={tableData.length}
                      isLoading={detailsLoading}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* GSTN Details Section */}
        {(() => {
          const gstnRecords = (() => {
            const innerData = (gstnDetailsData?.data as any)?.data;
            return Array.isArray(innerData?.gstn_records) ? innerData.gstn_records : [];
          })();

          const gstnTableData = gstnRecords.map((record: any, idx: number) => {
            const merchant_name = record.details?.legal_name || record.raw?.enrichment_details?.online_provider?.details?.legal_name?.value || "";
            const gstin = record.gstin || record.raw?.enrichment_details?.online_provider?.details?.gstin?.value || "";
            const pan = record.details?.pan || "";
            const state = record.pan_lookup_items?.[0]?.state || record.raw?.enrichment_details?.online_provider?.details?.state_jurisdiction?.value || "";
            const registration_date = record.details?.registration_date || record.raw?.enrichment_details?.online_provider?.details?.registration_date?.value || "";
            const status = record.details?.status || record.raw?.enrichment_details?.online_provider?.details?.status?.value || "";
            const hsn_details = record.hsn_details || [];
            const sources = record.discovery?.paths
              ? Array.from(new Set(record.discovery.paths.map((p: any) => p.source).filter(Boolean)))
              : [];

            return {
              key: gstin || String(idx),
              merchant_name,
              gstin,
              pan,
              state,
              registration_date,
              status,
              hsn_details,
              sources,
            };
          });

          const gstnColumns = [
            {
              key: "merchant_name",
              header: "MERCHANT NAME",
              width: "14%",
              render: (val: string) => <span className="font-semibold text-blue-600">{val || "-"}</span>,
            },
            {
              key: "gstin",
              header: "GSTN",
              width: "12%",
              render: (val: string) => <span className="font-semibold text-blue-600">{val || "-"}</span>,
            },
            {
              key: "pan",
              header: "PAN",
              width: "8%",
              render: (val: string) => <span className="text-gray-700 font-medium">{val || "-"}</span>,
            },
            {
              key: "state",
              header: "STATE",
              width: "8%",
              render: (val: string) => <span className="text-gray-700">{val || "-"}</span>,
            },
            {
              key: "registration_date",
              header: "REG. DATE",
              width: "8%",
              render: (val: string) => {
                if (!val) return <span className="text-gray-400">-</span>;
                try {
                  return <span>{format(new Date(val), "dd-MM-yyyy")}</span>;
                } catch (e) {
                  return <span>{val.split("T")[0] || val}</span>;
                }
              },
            },
            {
              key: "status",
              header: "STATUS",
              width: "8%",
              render: (val: string) => {
                const status = String(val || "").trim();
                if (!status) return <span className="text-gray-400">-</span>;
                const isSuccess = status.toLowerCase() === "active";
                return (
                  <BubbleTag
                    text={status}
                    color={isSuccess ? "green" : "red"}
                    withBorder={true}
                  />
                );
              },
            },
            {
              key: "hsn_details",
              header: "HSN CODES",
              width: "30%",
              render: (val: any) => {
                const hsnDetails = Array.isArray(val) ? val : [];
                if (hsnDetails.length === 0) return <span className="text-gray-400">-</span>;
                return (
                  <div className="flex flex-col gap-1 text-xs text-gray-700">
                    {hsnDetails.map((hsn: any, idx: number) => {
                      const code = hsn.hsncd || hsn.saccd;
                      const description = hsn.gdes || hsn.sdes;
                      if (!code && !description) return null;
                      return (
                        <div key={idx} className="leading-relaxed">
                          {code && <span className="font-semibold text-gray-900">{code}</span>}
                          {description && ` - ${formatHsnDescription(description)}`}
                        </div>
                      );
                    })}
                  </div>
                );
              },
            },
            {
              key: "sources",
              header: "SOURCES",
              width: "8%",
              render: (val: string[]) => {
                if (!val || val.length === 0) return <span className="text-gray-400">-</span>;
                return (
                  <div className="flex flex-wrap gap-1">
                    {val.map((src: string) => (
                      <BubbleTag
                        key={src}
                        text={String(src).toUpperCase()}
                        color="blue"
                        withBorder={true}
                      />
                    ))}
                  </div>
                );
              },
            },
          ];

          return (
            <div className="mt-6">
              <SectionHeaderWithFlags
                positiveFlags={[]}
                negativeFlags={[]}
                neutralFlags={[]}
                title="GSTN Details"
                icon={getIconByName("FileText") || undefined}
                iconColorClass="text-blue-600"
                allowCollapse={false}
              />
              <div className="mt-4">
                <CustomTableView
                  columns={gstnColumns}
                  data={gstnTableData}
                  initialRowLimit={gstnTableData.length}
                  isLoading={gstnDetailsLoading}
                  rowClassName="hover:bg-gray-50/80 transition-colors"
                />
              </div>
            </div>
          );
        })()}

        <div className="mt-6">
          <div className="mt-3">
            {(() => {
              const integrity = getWebsiteIntegrity(activeCase);
              return (
                <div>
                  <div className="mt-6">
                    <div className="mt-0">
                      {(() => {
                        return (
                          <div>
                            <div className="mt-6">
                            </div>

                            <div className="mt-6 hidden">
                              {(() => {
                                const Icon = getIconByName("Globe");
                                const flagTriggered = (f: any) => {
                                  if (!f) return false;
                                  const v =
                                    f.overallTriggered ?? f.overall_triggered;
                                  if (v === true) return true;
                                  if (typeof v === "string") {
                                    const s = v.toLowerCase().trim();
                                    if (s === "yes" || s === "true")
                                      return true;
                                  }
                                  if (typeof v === "number") return v === 1;
                                  return false;
                                };

                                const rf013Triggered = Array.isArray(redFlags)
                                  ? redFlags.some(
                                    (r) =>
                                      String(r.code).toUpperCase() ===
                                      "RF013" && flagTriggered(r)
                                  )
                                  : false;
                                const rf005Triggered = Array.isArray(redFlags)
                                  ? redFlags.some(
                                    (r) =>
                                      String(r.code).toUpperCase() ===
                                      "RF005" && flagTriggered(r)
                                  )
                                  : false;
                                const rf006Triggered = Array.isArray(redFlags)
                                  ? redFlags.some(
                                    (r) =>
                                      String(r.code).toUpperCase() ===
                                      "RF006" && flagTriggered(r)
                                  )
                                  : false;

                                return (
                                  <SectionHeaderWithFlags
                                    positiveFlags={[]}
                                    negativeFlags={[]}
                                    neutralFlags={[]}
                                    title="External trust & Presence"
                                    icon={Icon || undefined}
                                    allowCollapse={false}
                                  />
                                );
                              })()}

                              <div className="mt-3">
                                <div
                                  className={`grid grid-cols-1 sm:grid-cols-2 ${artifactPanelCollapsed
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

                            <div className="mt-6 hidden">
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
                                      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${artifactPanelCollapsed
                                        ? "lg:grid-cols-4 xl:grid-cols-4"
                                        : "lg:grid-cols-3 xl:grid-cols-3"
                                        } gap-4`}
                                    >
                                      {isOutputFormatLoading ? (
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
                                        monitoredDimensions.map(
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
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 hidden">
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

                            <div className="mt-6">
                              <div className="hidden">
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
                                    totalScanned={reverseImageSearchData?.data?.reverse_image?.sources_processed || reverseImageSearchData?.data?.reverse_image?.total_scanned || 0}
                                    redFlags={redFlags}
                                  />
                                )}
                              </div>


                              <div className="mt-6">
                                <ArtifactSectionCollapsible
                                  defaultOpen={false}
                                  title={
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const Icon =
                                          getIconByName("Link") ||
                                          getIconByName("Globe");
                                        return Icon ? <Icon className="h-5 w-5 text-blue-600" /> : null;
                                      })()}
                                      <span className="text-lg font-semibold text-gray-900">
                                        Backlink Analysis
                                      </span>
                                    </div>
                                  }
                                >
                                  <div className="mt-3">
                                        <div className="w-full mb-0">
                                          <div className="p-0 h-full">
                                      {(() => {
                                        const Icon =
                                          getIconByName("Link") ||
                                          getIconByName("Globe");
                                        const names = [
                                          "SEO Manipulation checklist",
                                          "Risky Content Analysis",
                                          "Low Credibility analysis",
                                          "High Authority Analysis",
                                        ];

                                        const nameToKeyMap: Record<
                                          string,
                                          string
                                        > = {
                                          "SEO Manipulation checklist":
                                            "seo_overall_triggered",
                                          "Risky Content Analysis":
                                            "risky_overall_triggered",
                                          "Low Credibility analysis":
                                            "low_credibility_overall_triggered",
                                          "High Authority Analysis":
                                            "high_authority_overall_triggered",
                                        };

                                        const normalizeFlag = (
                                          v: any
                                        ): boolean | null => {
                                          if (typeof v === "boolean") return v;
                                          if (
                                            v === null ||
                                            typeof v === "undefined"
                                          )
                                            return null;
                                          if (typeof v === "number")
                                            return v === 1
                                              ? true
                                              : v === 0
                                                ? false
                                                : null;
                                          if (typeof v === "string") {
                                            const s = v.trim().toLowerCase();
                                            if (
                                              s === "true" ||
                                              s === "1" ||
                                              s === "yes"
                                            )
                                              return true;
                                            if (
                                              s === "false" ||
                                              s === "0" ||
                                              s === "no"
                                            )
                                              return false;
                                            if (
                                              s === "n/a" ||
                                              s === "na" ||
                                              s === "null"
                                            )
                                              return null;
                                          }
                                          return null;
                                        };

                                        const tryGet = (
                                          obj: any,
                                          k: string
                                        ) => {
                                          if (!obj) return undefined;
                                          try {
                                            return obj[k];
                                          } catch (e) {
                                            return undefined;
                                          }
                                        };

                                        const backlinkChecklist = (() => {
                                          const merchantIdentifierFallback =
                                            caseId ||
                                            merchantId ||
                                            (activeCase as any)
                                              ?.externalMerchantId ||
                                            (activeCase as any)
                                              ?.external_merchant_id ||
                                            String(
                                              (activeCase as any)?.merchantId ||
                                              ""
                                            );

                                          const sampleKey =
                                            (backlinksSampleData as any)[
                                            merchantIdentifierFallback
                                            ] ||
                                            backlinksSampleData[
                                            Number(merchantIdentifierFallback)
                                            ] ||
                                            null;

                                          if (!sampleKey) {
                                            return names.map((n) => ({
                                              name: n,
                                              status: "no",
                                              noData: true,
                                              triggerKey: nameToKeyMap[n],
                                              reasoningKey: String(
                                                nameToKeyMap[n]
                                              ).replace(
                                                "_overall_triggered",
                                                "_reasoning"
                                              ),
                                            }));
                                          }

                                          const sampleMapping: Record<
                                            string,
                                            any
                                          > = {
                                            "SEO Manipulation checklist":
                                              sampleKey?.seo_analysis
                                                ?.seo_overall_triggered,
                                            "Risky Content Analysis":
                                              sampleKey?.risky_content_analysis
                                                ?.risky_overall_triggered,
                                            "Low Credibility analysis":
                                              sampleKey
                                                ?.low_credibility_analysis
                                                ?.low_credibility_overall_triggered,
                                            "High Authority Analysis":
                                              sampleKey?.high_authority_analysis
                                                ?.high_authority_overall_triggered,
                                          };

                                          return names.map((n) => {
                                            const key = nameToKeyMap[n];
                                            const raw = sampleMapping[n];
                                            const flag = normalizeFlag(raw);
                                            if (
                                              flag === true ||
                                              flag === false
                                            ) {
                                              return {
                                                name: n,
                                                status: flag ? "yes" : "no",
                                                noData: false,
                                                triggerKey: key,
                                                reasoningKey: String(
                                                  key
                                                ).replace(
                                                  "_overall_triggered",
                                                  "_reasoning"
                                                ),
                                              };
                                            }

                                            return {
                                              name: n,
                                              status: "no",
                                              noData: true,
                                              triggerKey: key,
                                              reasoningKey: String(key).replace(
                                                "_overall_triggered",
                                                "_reasoning"
                                              ),
                                            };
                                          });
                                        })();

                                        const merchantIdentifierBanner =
                                          caseId ||
                                          merchantId ||
                                          (activeCase as any)
                                            ?.externalMerchantId ||
                                          (activeCase as any)
                                            ?.external_merchant_id ||
                                          String(
                                            (activeCase as any)?.merchantId ||
                                            ""
                                          );

                                        const enabledMerchantIdsBanner = [
                                          "13492291",
                                        ];

                                        const backlinksEnabledForBanner =
                                          enabledMerchantIdsBanner.includes(
                                            String(merchantIdentifierBanner)
                                          );

                                        const sampleKeyBanner =
                                          (backlinksSampleData as any)[
                                          merchantIdentifierBanner
                                          ] ||
                                          backlinksSampleData[
                                          Number(merchantIdentifierBanner)
                                          ] ||
                                          null;

                                        const overallFinalRawBanner =
                                          sampleKeyBanner?.overall_analysis
                                            ?.overall_final_trigger ??
                                          sampleKeyBanner?.overall_analysis
                                            ?.overall_trigger ??
                                          sampleKeyBanner?.overall_analysis
                                            ?.overallFinalTrigger ??
                                          null;

                                        const normalizeTriggeredBanner = (
                                          v: any
                                        ): boolean | null => {
                                          if (
                                            v === null ||
                                            typeof v === "undefined"
                                          )
                                            return null;
                                          if (typeof v === "boolean") return v;
                                          if (typeof v === "number")
                                            return v === 1
                                              ? true
                                              : v === 0
                                                ? false
                                                : null;
                                          if (typeof v === "string") {
                                            const s = v.trim().toLowerCase();
                                            if (
                                              [
                                                "true",
                                                "1",
                                                "yes",
                                                "y",
                                              ].includes(s)
                                            )
                                              return true;
                                            if (
                                              [
                                                "false",
                                                "0",
                                                "no",
                                                "n",
                                              ].includes(s)
                                            )
                                              return false;
                                          }
                                          return null;
                                        };

                                        const overallFinalTriggerBanner =
                                          normalizeTriggeredBanner(
                                            overallFinalRawBanner
                                          );

                                        const isRisk =
                                          overallFinalTriggerBanner === true;
                                        const isNoRisk =
                                          overallFinalTriggerBanner === false;

                                        return (
                                          <>
                                            {backlinksEnabledForBanner ? (
                                              <button
                                                type="button"
                                                onClick={openBacklinksArtifact}
                                                className={`flex items-center gap-4 p-4 rounded-lg border ${isRisk
                                                  ? "border-red-200"
                                                  : "border-green-200"
                                                  } ${isRisk
                                                    ? "bg-red-50"
                                                    : "bg-green-50"
                                                  } w-full text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1`}
                                              >
                                                <div
                                                  className={`flex items-center justify-center h-10 w-10 rounded-full ${isRisk
                                                    ? "bg-red-600"
                                                    : "bg-green-600"
                                                    } text-white`}
                                                >
                                                  {Icon ? (
                                                    <Icon className="h-5 w-5" />
                                                  ) : null}
                                                </div>

                                                <div className="flex items-center justify-between w-full">
                                                  <div
                                                    className={`${isRisk
                                                      ? "text-red-800"
                                                      : "text-green-800"
                                                      } text-lg font-semibold`}
                                                  >
                                                    {isRisk
                                                      ? "Potential Risk Detected"
                                                      : "No Risk Detected"}
                                                  </div>
                                                  <ChevronRight
                                                    className={`${isRisk
                                                      ? "text-red-800"
                                                      : "text-green-800"
                                                      } h-5 w-5`}
                                                  />
                                                </div>
                                              </button>
                                            ) : (
                                              <div
                                                className={`flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 w-full text-left`}
                                              >
                                                <div
                                                  className={`flex items-center justify-center h-10 w-10 rounded-full bg-gray-400 text-white`}
                                                >
                                                  {Icon ? (
                                                    <Icon className="h-5 w-5" />
                                                  ) : null}
                                                </div>

                                                <div className="flex items-center justify-between w-full">
                                                  <div
                                                    className={`text-gray-700 text-lg font-semibold`}
                                                  >
                                                    No Data Available
                                                  </div>
                                                  <BubbleTag
                                                    text={"No Data Available"}
                                                    color={"gray"}
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            <div className="mt-4">
                                              <div className="mb-3">
                                                <div className="flex items-center gap-3 py-0">
                                                  <span className="text-md font-semibold text-gray-500 flex items-center gap-3">
                                                    Backlink Checklist
                                                    {backlinksEnabledForBanner && (
                                                      <span className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-600 text-white">
                                                            {(() => {
                                                              const MinusIcon =
                                                                getIconByName(
                                                                  "Minus"
                                                                ) ||
                                                                getIconByName(
                                                                  "Dash"
                                                                );
                                                              return MinusIcon ? (
                                                                <MinusIcon className="h-3 w-3 text-white" />
                                                              ) : (
                                                                <svg
                                                                  className="h-3 w-3 text-white"
                                                                  viewBox="0 0 24 24"
                                                                  fill="none"
                                                                  stroke="currentColor"
                                                                  strokeWidth={
                                                                    2
                                                                  }
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
                                                                ) ||
                                                                getIconByName(
                                                                  "Triangle"
                                                                );
                                                              return AlertIcon ? (
                                                                <AlertIcon className="h-3 w-3 text-white" />
                                                              ) : (
                                                                <svg
                                                                  className="h-3 w-3 text-white"
                                                                  viewBox="0 0 24 24"
                                                                  fill="none"
                                                                  stroke="currentColor"
                                                                  strokeWidth={
                                                                    2
                                                                  }
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
                                                            Potential Risk
                                                            Identified
                                                          </span>
                                                        </div>
                                                      </span>
                                                    )}
                                                  </span>
                                                </div>
                                              </div>

                                              <div
                                                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${artifactPanelCollapsed
                                                  ? "lg:grid-cols-4 xl:grid-cols-4"
                                                  : "lg:grid-cols-3 xl:grid-cols-3"
                                                  } gap-4`}
                                              >
                                                {backlinkChecklist.length ===
                                                  0 ? (
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
                                                  backlinkChecklist.map(
                                                    (
                                                      item: any,
                                                      idx: number
                                                    ) => (
                                                      <div
                                                        key={`bk-${idx}`}
                                                        className="w-full text-left"
                                                      >
                                                        <WebsiteQualityCard
                                                          name={item.name}
                                                          status={item.status}
                                                          apiTrueIsAlert={true}
                                                          noData={!!item.noData}
                                                          clickable={
                                                            !item.noData
                                                          }
                                                          hideChevron={
                                                            !!item.noData
                                                          }
                                                          onClick={() =>
                                                            openBacklinkCheckArtifact(
                                                              item.triggerKey,
                                                              item.reasoningKey,
                                                              item.name
                                                            )
                                                          }
                                                        />
                                                      </div>
                                                    )
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}
                                          </div>
                                        </div>
                                      </div>
                                    </ArtifactSectionCollapsible>
                                  </div>
                              <div className="mt-6">
                                <ArtifactSectionCollapsible
                                  defaultOpen={false}
                                  title={
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const Icon =
                                          getIconByName("Sitemap") ||
                                          getIconByName("Layers") ||
                                          getIconByName("Share2");
                                        return Icon ? <Icon className="h-5 w-5 text-purple-600" /> : null;
                                      })()}
                                      <span className="text-lg font-semibold text-gray-900">
                                        Fraud Linkage & Network
                                      </span>
                                      {(() => {
                                        const RightIcon = getIconByName("Check");
                                        return (
                                          <BubbleTag
                                            text="To Be Built"
                                            color="gray"
                                            size="md"
                                            hasInsideIcon={true}
                                            icon={
                                              RightIcon ? (
                                                <RightIcon className="h-3.5 w-3.5" />
                                              ) : undefined
                                            }
                                          />
                                        );
                                      })()}
                                    </div>
                                  }
                                >
                                  <div className="mt-3">
                                {(() => {
                                  const fraudDetected =
                                    !!(activeCase as any)
                                      ?.fraud_intel_detected ||
                                    !!(activeCase as any)?.fraudDetected ||
                                    false;
                                  const Icon =
                                    getIconByName("Sitemap") ||
                                    getIconByName("Layers") ||
                                    getIconByName("Share2");
                                  const bannerBorder = fraudDetected
                                    ? "border-gray-200"
                                    : "border-gray-200";
                                  const bannerBg = fraudDetected
                                    ? "bg-gray-50"
                                    : "bg-gray-50";
                                  const textColor = fraudDetected
                                    ? "text-gray-800"
                                    : "text-gray-800";
                                  const subTextColor = fraudDetected
                                    ? "text-gray-700"
                                    : "text-gray-700";
                                  const iconBg = fraudDetected
                                    ? "bg-gray-600"
                                    : "bg-gray-600";

                                  return (
                                    <div
                                      className={`flex items-center gap-4 p-4 rounded-lg border ${bannerBorder} ${bannerBg}`}
                                    >
                                      <div
                                        className={`flex items-center justify-center h-10 w-10 rounded-full ${iconBg} text-white`}
                                      >
                                        {Icon ? (
                                          <Icon className="h-5 w-5" />
                                        ) : null}
                                      </div>

                                      <div>
                                        <div
                                          className={`text-lg font-semibold ${textColor}`}
                                        >
                                          {fraudDetected
                                            ? "Fraud Intelligence Detected"
                                            : "Linkage Intelligence Not Yet Enabled"}
                                        </div>
                                        <div
                                          className={`text-sm ${subTextColor} mt-1`}
                                        >
                                          {fraudDetected
                                            ? "Capability under development; signals will appear once data is live"
                                            : "Capability under development; signals will appear once data is live"}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                <div className="mt-4">
                                  <div className="flex items-center">
                                    <span className="text-md font-semibold text-gray-500">
                                      Monitored Dimensions (One-Degree Linkages)
                                    </span>
                                  </div>

                                  <div className="mt-3">
                                    <div
                                      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${artifactPanelCollapsed
                                        ? "lg:grid-cols-4 xl:grid-cols-4"
                                        : "lg:grid-cols-3 xl:grid-cols-3"
                                        } gap-4`}
                                    >
                                      {(() => {
                                        const merchantIdentifier =
                                          caseId ||
                                          merchantId ||
                                          (activeCase as any)
                                            ?.externalMerchantId ||
                                          (activeCase as any)
                                            ?.external_merchant_id ||
                                          String(
                                            (activeCase as any)?.merchantId ||
                                            ""
                                          );

                                        const enabledMerchantIds = [
                                          "13492291",
                                        ];

                                        return getLinkageCategories(
                                          activeCase
                                        ).map((item: any, idx: number) => {
                                          const isBacklinks =
                                            item.name === "Backlinks";

                                          const backlinksEnabled =
                                            isBacklinks &&
                                            enabledMerchantIds.includes(
                                              String(merchantIdentifier)
                                            );

                                          const card = (
                                            <WebsiteQualityCard
                                              key={`lc-${idx}`}
                                              name={item.name}
                                              status={item.status}
                                              invert={true}
                                              forceHyphenGray={
                                                !backlinksEnabled
                                              }
                                              hideChevron={true}
                                              clickable={backlinksEnabled}
                                              noData={
                                                !backlinksEnabled ||
                                                !!item.noData
                                              }
                                            />
                                          );

                                          if (isBacklinks) {
                                            if (backlinksEnabled) {
                                              return (
                                                <button
                                                  key={`lc-btn-${idx}`}
                                                  type="button"
                                                  onClick={
                                                    openBacklinksArtifact
                                                  }
                                                  className="w-full text-left"
                                                  aria-label={`Open Backlinks details`}
                                                >
                                                  {React.isValidElement(card)
                                                    ? React.cloneElement(
                                                      card as React.ReactElement,
                                                      {
                                                        clickable: false,
                                                      } as any
                                                    )
                                                    : card}
                                                </button>
                                              );
                                            }

                                            return (
                                              <div key={`lc-${idx}`}>
                                                {card}
                                              </div>
                                            );
                                          }

                                          return card;
                                        });
                                      })()}
                                    </div>
                                  </div>
                                </div>
                                      </div>
                                    </ArtifactSectionCollapsible>
                                  </div>
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
        </div>

        <div className="hidden">
          {/* Hidden container for Page Report */}
          <div ref={pdfTemplateRef}>
            <InvMerchantOverviewPDFTemplate
              merchantName={activeCase?.registeredName || (activeCase as any)?.merchant?.name || "N/A"}
              mid={(activeCase as any)?.externalMerchantId || (activeCase as any)?.run?.merchant_id || (activeCase as any)?.caseId || "N/A"}
              website={(activeCase as any)?.website || (activeCase as any)?.merchant?.website || ""}
              initials={(() => {
                const name = (activeCase as any)?.merchant?.name || (activeCase as any)?.merchant_name || 'Merchant';
                const words = name.trim().split(/\s+/);
                const filteredWords = words.filter((word: string) => word.length > 0 && !["pvt", "ltd", "inc", "llp", "corp"].includes(word.toLowerCase()));
                const targetWords = filteredWords.length > 0 ? filteredWords : words;
                if (targetWords.length >= 2) return (targetWords[0][0] + targetWords[1][0]).toUpperCase();
                return targetWords[0][0].toUpperCase();
              })()}
              runDate={(activeCase as any)?.lastRunDateTime || (activeCase as any)?.run?.updated_at || (activeCase as any)?.created_at || new Date().toISOString()}
              riskInfo={getRiskInfoForPDF()}

              businessIdentity={businessIdentity}
              transformedBCData={transformedBCData}
              bcAnalysis={bcAnalysis}
              redFlags={redFlags}
              gstnDetailsData={gstnDetailsData}
            />
          </div>

          {/* Hidden container for Full Report */}
          <div ref={fullReportTemplateRef}>
            {(() => {
              const webData = (malwareDatastore?.data as any)?.data || {};
              const rf012Data = (webAnalysisDatastore?.data as any)?.data;
              const rf012Subrules = Array.isArray(rf012Data?.subrules) ? rf012Data.subrules : [];

              const normalizeTableData = (data: any[]) => data.map(item => ({
                field: item.field || "N/A",
                value: Array.isArray(item.value) ? item.value.join(", ") : String(item.value || "-"),
                engines: Array.isArray(item.maliciousEngines) ? item.maliciousEngines :
                  Array.isArray(item.suspiciousEngines) ? item.suspiciousEngines : undefined
              }));

              const normalizeStringArray = (data: any[]) => data.map(item => ({
                field: item.field || "N/A",
                value: Array.isArray(item.value) ? item.value.join(", ") : String(item.value || "-")
              }));

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

              const languageSupportValue = (() => {
                if (merchantWebAnalysis?.data?.language_support) {
                  const ls = merchantWebAnalysis.data.language_support;
                  return Array.isArray(ls) ? ls.join(", ") : String(ls);
                }
                const cs = webData.content_analysis || {};
                const ls = cs.language_support ?? cs.languageSupport ?? null;
                if (ls) return Array.isArray(ls) ? ls.join(", ") : String(ls);
                return "-";
              })();

              const isSubdomainValue = (() => {
                if (merchantWebAnalysis?.data?.is_sub_domain !== undefined && merchantWebAnalysis?.data?.is_sub_domain !== null) {
                  return merchantWebAnalysis.data.is_sub_domain ? "Yes" : "No";
                }
                const ds = (domainInfoDatastore?.data as any)?.data;
                if (ds && (ds.is_subdomain !== undefined || ds.isSubdomain !== undefined)) {
                  const val = ds.is_subdomain ?? ds.isSubdomain;
                  return typeof val === "boolean" ? (val ? "Yes" : "No") : val;
                }
                const di = webData.domain_info || {};
                const diRoot = di.domain_information ?? di;
                const val = diRoot.is_sub_domain ?? diRoot.is_subdomain ?? diRoot.isSubdomain ?? "-";
                return typeof val === "boolean" ? (val ? "Yes" : "No") : val;
              })();

              const copyrightLineValue = (() => {
                if (merchantWebAnalysis?.data?.copyright_line) return merchantWebAnalysis.data.copyright_line;
                const ds = (domainInfoDatastore?.data as any)?.data;
                if (ds && ds.copyright_line) return ds.copyright_line;
                const di = webData.domain_info || {};
                const diRoot = di.domain_information ?? di;
                return diRoot.copyright_line ?? diRoot.copyrightLine ?? "-";
              })();

              const fatfStatusValue = (() => {
                const ds = (domainInfoDatastore?.data as any)?.data;
                const di = webData.domain_info || {};
                const diRoot = di.domain_information ?? di;
                const raw = ds?.fatf_status ?? ds?.fatf ?? diRoot.fatf_status ?? diRoot.fatf ?? null;
                if (!raw || String(raw).trim() === "") return "N/A";
                const s = String(raw).trim().toLowerCase();
                if (s === "not listed" || s === "not_listed" || s === "notlisted") return "Not listed";
                if (s.includes("grey") || s.includes("gray")) return "Greylisted";
                if (s.includes("black")) return "Blacklisted";
                return String(raw);
              })();

              const normalizeFreqWords = (val: any): string[] => {
                if (!val) return [];
                if (Array.isArray(val)) return val.map(String);
                if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                return [];
              };

              const scamFrequentWords = (scamIntelligenceData as any)?.content_analysis?.frequent_words;
              const topFrequentWords = merchantWebAnalysis?.data?.web_analysis?.top_frequent_words;
              const webDataFrequentWords = webData.content_analysis?.frequent_words;
              const rawFrequentWords = (Array.isArray(scamFrequentWords) && scamFrequentWords.length > 0) ? scamFrequentWords :
                (Array.isArray(topFrequentWords) && topFrequentWords.length > 0) ? topFrequentWords :
                  (Array.isArray(webDataFrequentWords) && webDataFrequentWords.length > 0) ? webDataFrequentWords :
                    (merchantWebAnalysis?.data?.frequent_words || []);

              const frequentWords = normalizeFreqWords(rawFrequentWords);

              const checklist = [
                { name: "Product Listing", key: "no_product_listing", flag: "RF012" },
                { name: "Product Details", key: "products_without_description_or_customization", flag: "RF012" },
                { name: "Product Images", key: "product_without_images", flag: "RF009" },
                { name: "Policy", key: "policy_not_found", flag: "RF012" },
                { name: "Placeholder Text", key: "found_placeholder_text", flag: "RF012" },
                { name: "Identical Pricing", key: "identical_pricing", flag: "RF012" },
                { name: "TGTBT Pricing", key: "tgbt", flag: "RF012" },
                { name: "Banned & Restricted Category", key: "objectionable_content", flag: "RF002" },
                { name: "Impersonation", key: "impersonation", flag: "RF001" },
              ].map(item => {
                let isTriggered = false;
                if (item.flag === "RF012") {
                  const sr = rf012Subrules.find((s: any) => s.subrule === item.key);
                  isTriggered = sr?.triggered === "yes" || sr?.triggered === true;
                } else if (redFlags) {
                  const flag = redFlags.find((f: any) => f.code === item.flag);
                  if (flag) {
                    const sr = Array.isArray(flag.subrules) ? flag.subrules.find((s: any) => s.subrule === item.key) : null;
                    isTriggered = sr ? (sr.triggered === "yes" || sr.triggered === true) : (flag.overallTriggered === true || flag.triggered === "yes");
                  }
                }
                return { name: item.name, status: isTriggered ? "yes" : "no", noData: false };
              });

              const dsData = (domainInfoDatastore?.data as any)?.data || {};
              const dsLoc = dsData?.location_data || {};
              const dsWs = dsData?.website_status_and_certificate || {};
              const dsWhois = dsData?.creation_info || "";
              const di = webData.domain_info || {};
              const diRoot = di.domain_information ?? di;
              const wsRoot = webData.website_status ?? {};

              // Match InvWebAnalysisTab vision extraction so full-report PDF shows the same 4 snapshots as standalone web analysis.
              const websiteSnapshots = (() => {
                if (!visionDatastore) return [];
                const screenshots = (visionDatastore?.data as any)?.data?.screenshots;
                if (Array.isArray(screenshots)) return screenshots;
                const d1 = (visionDatastore?.data as any)?.data?.results;
                if (Array.isArray(d1)) return d1;
                const d2 = (visionDatastore?.data as any)?.results;
                if (Array.isArray(d2)) return d2;
                const d3 = (visionDatastore as any)?.results;
                if (Array.isArray(d3)) return d3;
                return [];
              })();

              const webAnalysisData = {
                websiteMccData: (websiteMccDatastore?.data as any)?.data || null,
                websiteAnalysis: {
                  summary: merchantWebAnalysis?.data?.web_analysis?.website_summary || merchantWebAnalysis?.data?.summary || "No summary available.",
                  frequentWords: frequentWords
                },
                websiteIntegrity: {
                  isWorking: !redFlags?.find((f: any) => f.code === "RF006")?.overallTriggered,
                  checklist,
                  metrics: (() => {
                    const extractWhoisField = (whois: string, fieldName: string) => {
                      if (!whois) return null;
                      const regex = new RegExp(`${fieldName}:\\s*(.+)`, "i");
                      const match = whois.match(regex);
                      return match ? match[1].trim() : null;
                    };

                    const getVal = (...sources: (any)[]) => {
                      for (const s of sources) {
                        if (s !== null && s !== undefined && s !== "" && s !== "-" && s !== 0 && s !== "0") return String(s);
                      }
                      return "-";
                    };

                    const languageSupportValue = (() => {
                      if (merchantWebAnalysis?.data?.language_support) {
                        const ls = merchantWebAnalysis.data.language_support;
                        return Array.isArray(ls) ? ls.join(", ") : String(ls);
                      }
                      const cs = webData.content_analysis?.language_support ?? webData.content_analysis?.languageSupport ?? null;
                      if (!cs) return "-";
                      return Array.isArray(cs) ? cs.join(", ") : String(cs);
                    })();

                    const ipAddress = getVal(dsLoc.query, dsLoc.ip_address, diRoot.ip, diRoot.ip_address);
                    const country = getVal(dsLoc.country, dsLoc.country_name, diRoot.country, diRoot.location, diRoot.country_name, webData.domain_info?.location_data?.country);
                    const createdDate = formatDateString(getVal(extractWhoisField(dsWhois, "Creation Date"), dsData?.created_date, dsData?.creation_date, diRoot.created_date, diRoot.creation_date));
                    const age = getVal(dsData?.domain_age, diRoot.age, diRoot.domain_age);
                    const registrar = getVal(extractWhoisField(dsWhois, "Registrar"), dsData?.registrar, diRoot.registrar);
                    const privacyProtection = getVal(dsData?.privacy_protection, dsData?.privacy, diRoot.privacy_protection, diRoot.privacy);
                    const httpsEnabled = (() => {
                      if (merchantWebAnalysis?.data?.website_certificate?.https_enabled !== undefined) {
                        return merchantWebAnalysis.data.website_certificate.https_enabled ? "Enabled" : "Disabled";
                      }
                      const v = dsWs.https_certificates ?? dsWs.ssl_certificate ?? diRoot.https_certificates ?? diRoot.ssl_certificate;
                      if (v === true || v === "true") return "Enabled";
                      if (v === false || v === "false") return "Disabled";
                      return (webData.ssl?.ssl_enabled !== false) ? "Enabled" : "Disabled";
                    })();

                    const responseTime = (() => {
                      const raw = merchantWebAnalysis?.data?.website_certificate?.response_time ?? webData.website_status?.response_time;
                      const match = String(raw || "").match(/([\d.]+)/);
                      const num = match ? Number(match[1]) : NaN;
                      return Number.isFinite(num) ? `${num.toFixed(4)} seconds` : "-";
                    })();

                    return [
                      { label: "Language Support", value: languageSupportValue },
                      { label: "Response Time", value: responseTime },
                      { label: "IP Address", value: ipAddress },
                      { label: "Country", value: country },
                      { label: "Created date", value: createdDate },
                      { label: "Age", value: age },
                      { label: "Registrar", value: registrar },
                      { label: "Privacy Protection", value: privacyProtection },
                      { label: "HTTPS Certificates", value: httpsEnabled },
                    ];
                  })(),
                  isSubdomain: (() => {
                    if (merchantWebAnalysis?.data?.is_sub_domain !== undefined) return merchantWebAnalysis.data.is_sub_domain ? "Yes" : "No";
                    const val = dsData?.is_subdomain ?? dsData?.isSubdomain ?? diRoot.is_subdomain ?? diRoot.isSubdomain;
                    return (val === true || val === "true") ? "Yes" : "No";
                  })(),
                  copyrightLine: merchantWebAnalysis?.data?.web_analysis?.copyright_line ?? webData.content_analysis?.copyright_line ?? "-",
                  fatfStatus: merchantWebAnalysis?.data?.fatf_status ?? "-"
                },
                sslDetails: {
                  enabled: webData.ssl?.ssl_enabled !== false,
                  valid: webData.ssl?.certificate_valid !== false,
                  metrics: [
                    { label: "Issuer", value: webData.ssl?.issuer || "-" },
                    { label: "TLS Version", value: webData.ssl?.tls_version || "-" },
                    { label: "Valid From", value: formatDateString(webData.ssl?.valid_from) },
                    { label: "Valid To", value: formatDateString(webData.ssl?.valid_to) },
                  ]
                },
                dnsInfrastructure: {
                  dnssecEnabled: webData.dns?.dnssec_enabled === true,
                  metrics: (() => {
                    const dns = webData.dns || {};
                    const formatArray = (v: any) => Array.isArray(v) ? v.join(", ") : (v || "-");
                    return [
                      { label: "A Records", value: formatArray(dns.a_records) },
                      { label: "NS Records", value: formatArray(dns.ns_records) },
                      { label: "MX Records", value: formatArray(dns.mx_records) },
                      { label: "TXT Records", value: formatArray(dns.txt_records) },
                      { label: "SPF Record", value: formatArray(dns.spf_record) },
                      { label: "DMARC Record", value: dns.dmarc_record || "-" },
                    ];
                  })()
                },
                urlPageBehavior: {
                  metrics: (() => {
                    const navFlowData = (navFlowDatastore?.data as any)?.data;
                    const u = navFlowData?.url_consistency || {};
                    const url = webData.url || {};
                    const mwaFinalUrl = merchantWebAnalysis?.data?.website_certificate?.final_url;

                    const getVal = (v: any) => (v === null || v === undefined || v === 0 || v === "0" || v === "" || v === "-") ? "-" : String(v);

                    const registeredUrl = mwaFinalUrl ?? u.registered_url ?? u.registeredUrl ?? url.registered_url ?? "-";
                    const homepageRedirection = mwaFinalUrl ?? u.homepage_redirection ?? u.homepageRedirection ?? u.homepage_redirect ?? url.homepage_redirection ?? "-";

                    return [
                      { label: "Registered URL", value: getVal(registeredUrl) },
                      { label: "Homepage Redirection", value: getVal(homepageRedirection) },
                      { label: "Initial URL", value: getVal(url.initial_url) },
                      { label: "Final URL", value: getVal(mwaFinalUrl ?? url.final_url) },
                      { label: "Number of Redirects", value: getVal(url.num_redirects) },
                      { label: "Redirect Destination", value: getVal(url.redirect_destination) }
                    ];
                  })(),
                  consistencyTable: [],
                  behaviorFlags: (() => {
                    const url = webData.url || {};
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
                  })()
                },
                malwareDetection: {
                  isBlacklisted: webData.malware?.is_blacklisted === true,
                  tableData: (() => {
                    const m = webData.malware || {};
                    const getHits = (v: any) => (v === 0 || v === "0" || !v) ? "-" : String(v);
                    return [
                      { field: "Blacklisted", value: m.is_blacklisted ? "Yes" : "No" },
                      { field: "Malicious Hits", value: getHits(m.malicious_hits) },
                      { field: "Suspicious Hits", value: getHits(m.suspicious_hits) }
                    ];
                  })()
                },
                contactData: normalizeStringArray(transformContactData((contactDatastore?.data as any)?.data || {})),
                navigationFlow: normalizeStringArray(transformNavigationFlowData((navFlowDatastore?.data as any)?.data || {})),
                productAnalysis: {
                  products: (() => {
                    const dsData = (productAnalysisDatastore?.data as any)?.data || {};
                    const productsRaw = dsData.products || webData.product_analysis?.navigation_links?.[0]?.top_10_products || [];
                    const availabilityRaw = dsData.availability_status?.product_availability || webData.product_analysis?.navigation_links?.[0]?.availability_status?.product_availability || [];
                    const availabilityMap = new Map();
                    if (Array.isArray(availabilityRaw)) {
                      availabilityRaw.forEach((item: any) => {
                        if (item.product_name) availabilityMap.set(item.product_name, item.availability);
                      });
                    }

                    return (Array.isArray(productsRaw) ? productsRaw : []).map((product: any, index: number) => {
                      const productName = product.name || product.product_name || `Product ${index + 1}`;
                      const availability = product.availability_status || availabilityMap.get(product.product_name) || availabilityMap.get(product.name) || "-";

                      // Format price: final_price (currency)
                      let priceStr = "-";
                      if (product.final_price) {
                        priceStr = `${product.final_price}${product.currency ? ` (${product.currency})` : ""}`;
                      } else if (product.price) {
                        if (product.price.final_price) {
                          priceStr = `${product.price.final_price}${product.price.currency ? ` (${product.price.currency})` : ""}`;
                        } else {
                          const priceParts: string[] = [];
                          if (product.price.original_price) {
                            priceParts.push(`Original: ${product.price.original_price} ${product.price.currency || ""}`.trim());
                          }
                          if (product.price.discount_percentage && product.price.discount_percentage !== "Not available") {
                            priceParts.push(`Discount: ${product.price.discount_percentage}%`);
                          }
                          if (priceParts.length > 0) {
                            priceStr = priceParts.join(", ");
                          }
                        }
                      } else if (product.product_price) {
                        priceStr = String(product.product_price);
                      }

                      // Extract pricing analysis fields
                      const pricingAnalysis = product.pricing_analysis || {};
                      const isSuspicious =
                        pricingAnalysis.is_suspicious !== undefined &&
                          pricingAnalysis.is_suspicious !== null
                          ? String(pricingAnalysis.is_suspicious)
                          : (product.is_suspicious === true || product.isSuspicious === true ? "Yes" : "No");
                      const marketComparison = pricingAnalysis.market_comparison || product.market_comparison || product.marketComparison || "-";

                      return {
                        field: productName,
                        price: priceStr,
                        customizationOptions: product.customization_options || product.customization || "-",
                        availability: availability,
                        productUrl: product.product_url || product.productUrl || "-",
                        isSuspicious: isSuspicious === "true" || isSuspicious === "Yes" ? "Yes" : "No",
                        marketComparison: marketComparison
                      };
                    });
                  })()
                },
                websiteSnapshots: websiteSnapshots,
                trafficData: trafficEngagementSampleData
              };

              const normalizedFlags = (redFlags || [])
                .map((f: any) => {
                  const source = f.llm || f.raw?.llm || f;
                  const stepCode = f.step || source.step || f.code;
                  const normalizedCode = (stepCode && (stepCode.startsWith("RF") || stepCode.startsWith("GF"))) ? stepCode : f.code;
                  return { ...f, code: normalizedCode };
                })
                .filter((f: any) => f.code && (f.code.startsWith("RF") || f.code.startsWith("GF")) && f.code !== "RF007" && f.code !== "RF008")
                .map((f: any) => {
                  const source = f.llm || f.raw?.llm || f;
                  const rawObj = typeof f.raw === "string" ? (() => { try { return JSON.parse(f.raw); } catch (e) { return null; } })() : f.raw;

                  return {
                    code: f.code,
                    name: f.step_description || source.step_description || source.name || f.name || f.code,
                    severity: (() => {
                      const cat = (f.category || source.category || f.severity || source.severity || "").toLowerCase();
                      if (cat.includes("critical") || cat.includes("severe")) return "Critical Risk";
                      if (cat.includes("high")) return "High Risk";
                      if (cat.includes("medium") || cat === "med") return "Medium Risk";
                      if (cat.includes("low") || cat === "info") return "Low Risk";
                      return cat ? (cat.charAt(0).toUpperCase() + cat.slice(1) + " Risk") : "N/A";
                    })(),
                    triggered: (() => {
                      const v = source.overall_triggered ?? source.overallTriggered ?? f.overall_triggered ?? f.overallTriggered;
                      if (typeof v === "boolean") return v;
                      if (typeof v === "string") return ["yes", "true", "triggered"].includes(v.toLowerCase());
                      return v === 1;
                    })(),
                    reasoning: source.explanation || source.overall_reasoning || source.overallReasoning || source.reasoning || f.overall_reasoning || f.reasoning || "No reasoning data available.",
                    points: source.points !== undefined ? source.points : f.points,
                    extra_details: f.extra_details || source.extra_details || rawObj?.extra_details || {},
                    subrules: (() => {
                      // Support for results-based flags (especially RF009)
                      const results = source.results || f.results || rawObj?.results || rawObj?.llm?.results || [];
                      const sr = f.extra_details?.subrules || source.extra_details?.subrules || rawObj?.extra_details?.subrules || source.subrules || f.subrules || rawObj?.subrules || [];

                      // 1. Handle object-based subrules
                      if (typeof sr === "object" && sr !== null && !Array.isArray(sr)) {
                        return Object.entries(sr).map(([key, val]: [string, any]) => {
                          let subruleName = key;
                          if (f.code === "RF009" && subruleName.toLowerCase() === "tgbt") subruleName = "TGTBT";
                          return {
                            subrule: subruleName,
                            reasoning: val.reasoning || val.explanation || "",
                            triggered: (() => {
                              const v = val.triggered ?? val.status;
                              if (typeof v === "boolean") return v;
                              if (typeof v === "string") return ["yes", "true", "triggered"].includes(v.toLowerCase()) || v.toLowerCase().includes("risk");
                              return v === 1;
                            })(),
                            points: val.points
                          };
                        });
                      }

                      // 2. Handle array-based subrules
                      if (Array.isArray(sr) && sr.length > 0) {
                        return sr.map((item: any) => {
                          let subruleName = item.subrule || item.name || item.id || "Condition";
                          if (f.code === "RF009" && subruleName.toLowerCase() === "tgbt") subruleName = "TGTBT";
                          return {
                            subrule: subruleName,
                            reasoning: item.reasoning || item.explanation || item.reason || "",
                            triggered: (() => {
                              const v = item.triggered ?? item.status;
                              if (typeof v === "boolean") return v;
                              if (typeof v === "string") return ["yes", "true", "triggered"].includes(v.toLowerCase()) || v.toLowerCase().includes("risk");
                              return v === 1;
                            })(),
                            points: item.points,
                            severity: item.severity || item.category
                          };
                        });
                      }

                      // 3. Fallback to results (important for RF009)
                      if (Array.isArray(results) && results.length > 0) {
                        return results.map((item: any) => ({
                          subrule: item.match_label || item.image_id || "Image Match",
                          reasoning: item.reason || item.explanation || "",
                          triggered: (() => {
                            const s = String(item.status || "").toLowerCase();
                            return s.includes("risk") || s === "yes" || s === "true" || s === "triggered";
                          })(),
                          points: item.points,
                          severity: "High Risk"
                        }));
                      }

                      return [];
                    })()
                  };
                });

              const triggeredFlags = normalizedFlags.filter(f => f.triggered);
              const criticalFlags = triggeredFlags.filter(f => {
                const sev = (f.severity || "").toLowerCase();
                return sev.includes("critical") || sev.includes("severe");
              });

              const sumScore = triggeredFlags.reduce((acc, f) => acc + (f.points || 0), 0);
              const formulaParts = triggeredFlags.length > 0
                ? triggeredFlags.map(f => `${f.code} · ${f.points || 0}`)
                : ["No triggered rules · 0"];

              let calcScore = sumScore;
              if (criticalFlags.length > 0) {
                const maxCriticalFlag = criticalFlags.reduce((prev, current) => {
                  return (prev.points || 0) > (current.points || 0) ? prev : current;
                });
                calcScore = maxCriticalFlag.points || 0;
              }

              const finalCalcScore = Math.max(Math.min(calcScore, 100), 0);
              const isMaxCritical = criticalFlags.length > 0;
              const dynamicFormula = `${formulaParts.join(" + ")} = ${sumScore}${sumScore > 100 ? " -> capped at 100" : sumScore < 0 ? " -> floored at 0" : ""}`;

              const riskInfo = getRiskInfoForPDF();


              // Replicate detailed summary text exactly as in second image
              const detailedSummaryText = (() => {
                if (triggeredFlags.length === 0) return `No triggered flags detected. The case sits in the Low band, resulting in a ${riskInfo.label} decision.`;

                const tierName = riskInfo.label.replace(" Risk", "");

                if (isMaxCritical) {
                  const total = finalCalcScore.toFixed(1);
                  const codes = criticalFlags.map(f => f.code).join(", ");
                  const main = criticalFlags.reduce((prev, current) => (prev.points || 0) > (current.points || 0) ? prev : current);
                  return `The final risk score of ${total} was derived by taking the maximum of the triggered critical flags ${codes}. The critical contributor was ${main.code}, providing a score of ${(main.points || 0).toFixed(1)} due to ${main.reasoning.charAt(0).toLowerCase() + main.reasoning.slice(1).split(".")[0].trim()}. This automatically places the case in the ${tierName} risk tier.`;
                }

                const sorted = [...triggeredFlags].sort((a, b) => (b.points || 0) - (a.points || 0));
                const codes = triggeredFlags.map(f => f.code).join(", ");
                const total = finalCalcScore.toFixed(1);

                let text = `The final risk score of ${total} was derived from the triggered flags ${codes}. `;

                const main = sorted[0];
                text += `The strongest contributor was ${main.code}, which added ${(main.points || 0).toFixed(1)} points due to ${main.reasoning.charAt(0).toLowerCase() + main.reasoning.slice(1).split(".")[0].trim()}. `;

                if (sorted.length > 1) {
                  const sec = sorted[1];
                  text += `${sec.code} added ${(sec.points || 0).toFixed(1)} points because ${sec.reasoning.charAt(0).toLowerCase() + sec.reasoning.slice(1).split(".")[0].trim()}. `;
                }

                if (sorted.length > 2) {
                  const third = sorted[2];
                  text += `${third.code} added ${(third.points || 0).toFixed(1)} points due to ${third.reasoning.charAt(0).toLowerCase() + third.reasoning.slice(1).split(".")[0].trim()}. `;
                }

                text += `Together, these triggered flags produced a total of ${total}, which places the case in the ${tierName} risk tier.`;
                return text;
              })();


              const verdict = {
                score: riskInfo.score,
                maxScore: 100,
                riskTier: riskInfo.label,
                formula: (activeCase as any)?.risk_report?.formula || (activeCase as any)?.risk_score?.formula || (dynamicFormula !== "No triggered rules · 0 = 0" ? dynamicFormula : "N/A"),
                summary: detailedSummaryText,
                status: riskInfo.label
              };


              const dataBase = (riskScoreDatastore?.data as any)?.data || {};
              const rawFraudCommentary = (activeCase as any)?.risk_report?.risk_explanation || (activeCase as any)?.risk_score?.fraud_commentary || (activeCase as any)?.overallReasoning || dataBase.fraud_commentary || "N/A";
              const fraudCommentary = typeof rawFraudCommentary === 'string'
                ? rawFraudCommentary.replace(/^\*\*.*?\*\*\s*/, "").trim()
                : rawFraudCommentary;

              const decisioningData = {
                aiRiskCommentary: {
                  justification: fraudCommentary,
                  riskLevel: riskInfo.label,
                  statusTag: riskInfo.label
                },
                verdict: {
                  ...verdict,
                  summary: dataBase.risk_explanation || detailedSummaryText,
                  status: riskInfo.label
                },
                rules: [...normalizedFlags].sort((a, b) => (b.triggered ? 1 : 0) - (a.triggered ? 1 : 0))
              };



              const merchantName = (activeCase as any)?.merchant?.name || (activeCase as any)?.merchant_name || 'Merchant';
              const initials = (() => {
                const name = merchantName;
                const words = name.trim().split(/\s+/);
                const filteredWords = words.filter((word: string) => word.length > 0 && !["pvt", "ltd", "inc", "llp", "corp"].includes(word.toLowerCase()));
                const targetWords = filteredWords.length > 0 ? filteredWords : words;
                if (targetWords.length >= 2) return (targetWords[0][0] + targetWords[1][0]).toUpperCase();
                return targetWords[0][0].toUpperCase();
              })();

              return (
                <InvestigationFullReportPDFTemplate
                  merchantName={merchantName}
                  runDate={(activeCase as any)?.lastRunDateTime || (activeCase as any)?.run?.updated_at || (activeCase as any)?.created_at || new Date().toISOString()}
                  website={(activeCase as any)?.website || (activeCase as any)?.merchant?.website || ""}
                  overviewData={{
                    mid: (activeCase as any)?.externalMerchantId || (activeCase as any)?.run?.merchant_id || (activeCase as any)?.caseId || "N/A",
                    initials,
                    riskInfo,
                    businessIdentity,
                    transformedBCData,
                    bcAnalysis,
                    socialMediaPlatforms: getSocialMediaPlatforms(datastoreEntryData?.data?.data),
                    scamIntelligenceData,
                    monitoredDimensions,
                    riskAnalysisData,
                    reviewsAnalysisData,
                    reverseImageSearchData,
                    scamDetectedOverall,
                    redFlags: redFlags,
                    gstnDetailsData: gstnDetailsData
                  }}
                  webAnalysisData={webAnalysisData}
                  vpaAnalysisData={{ hasData: false }}
                  decisioningData={decisioningData}
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvMerchantOverviewTab;
