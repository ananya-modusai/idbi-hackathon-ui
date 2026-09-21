'use client';

import React from 'react';
import InvMerchantOverviewPDFTemplate from '../OverviewTab/InvestigationMerchantOverviewPDFTemplate';
import InvestigationWebAnalysisPDFTemplate from '../WebAnalysisTab/InvestigationWebAnalysisPDFTemplate';
import InvestigationVPAAnalysisPDFTemplate from '../VPAAnalysisTab/InvestigationVPAAnalysisPDFTemplate';
import InvestigationDecisioningPDFTemplate from '../DecisioningTab/InvestigationDecisioningPDFTemplate';

interface InvestigationFullReportPDFTemplateProps {
  // Common Props
  merchantName: string;
  runDate: string;
  website: string;

  // Overview Tab Props
  overviewData: {
    mid: string;
    initials: string;
    riskInfo: { label: string; score: string; color: string };
    businessIdentity: any;
    transformedBCData: any;
    bcAnalysis: any;
    socialMediaPlatforms: any[];
    scamIntelligenceData: any;
    monitoredDimensions: any[];
    riskAnalysisData: any;
    reviewsAnalysisData: any;
    reverseImageSearchData: any;
    scamDetectedOverall: boolean;
    redFlags?: any[] | null;
    gstnDetailsData?: any | null;
  };

  // Web Analysis Tab Props
  webAnalysisData: {
    websiteMccData?: any;
    websiteAnalysis: {
      summary: string;
      frequentWords: string[];
    };
    websiteIntegrity: {
      isWorking: boolean | null;
      checklist: Array<{ name: string; status: string; noData?: boolean }>;
      metrics: Array<{ label: string; value: any; icon?: string }>;
      isSubdomain: string;
      copyrightLine: string;
      fatfStatus: string;
    };
    sslDetails: {
      enabled: boolean;
      valid: boolean;
      metrics: Array<{ label: string; value: any; icon?: string }>;
    };
    dnsInfrastructure: {
      dnssecEnabled: boolean;
      metrics: Array<{ label: string; value: any; icon?: string }>;
    };
    urlPageBehavior: {
      metrics: Array<{ label: string; value: any; icon?: string }>;
      consistencyTable: Array<{ field: string; value: string; matches?: boolean }>;
      behaviorFlags: Array<{ field: string; value: string }>;
    };
    malwareDetection: {
      isBlacklisted: boolean;
      tableData: Array<{ field: string; value: string; engines?: string[] }>;
    };
    contactData: Array<{ field: string; value: string }>;
    navigationFlow: Array<{ field: string; value: string }>;
    productAnalysis: {
      products: Array<any>;
    };
    websiteSnapshots: any[];
    trafficData?: any;
  };

  // VPA Analysis Tab Props
  vpaAnalysisData: {
    hasData: boolean;
  };

  // Decisioning Tab Props
  decisioningData: {
    aiRiskCommentary: {
      justification: string;
      riskLevel: string;
      statusTag: string;
    };
    verdict: {
      score: number | string;
      maxScore: number;
      riskTier: string;
      formula: string;
      summary: string;
      status?: string;
    };
    rules: any[];
  };
}

const InvestigationFullReportPDFTemplate: React.FC<InvestigationFullReportPDFTemplateProps> = ({
  merchantName,
  runDate,
  website,
  overviewData,
  webAnalysisData,
  vpaAnalysisData,
  decisioningData,
}) => {
  return (
    <div style={{ width: '100%', maxWidth: '1122px', margin: '0 auto', background: 'white', boxSizing: 'border-box' }}>
      
      {/* 1. Overview Tab */}
      <InvMerchantOverviewPDFTemplate
        merchantName={merchantName}
        mid={overviewData.mid}
        website={website}
        initials={overviewData.initials}
        runDate={runDate}
        riskInfo={overviewData.riskInfo}
        businessIdentity={overviewData.businessIdentity}
        transformedBCData={overviewData.transformedBCData}
        bcAnalysis={overviewData.bcAnalysis}
        redFlags={overviewData.redFlags}
        gstnDetailsData={overviewData.gstnDetailsData}
      />

      <div style={{ pageBreakAfter: 'always' }} />

      {/* 2. Web Analysis Tab */}
      <InvestigationWebAnalysisPDFTemplate
        merchantName={merchantName}
        runDate={runDate}
        website={website}
        websiteMccData={webAnalysisData.websiteMccData}
        websiteAnalysis={webAnalysisData.websiteAnalysis}
        websiteIntegrity={webAnalysisData.websiteIntegrity}
        sslDetails={webAnalysisData.sslDetails}
        dnsInfrastructure={webAnalysisData.dnsInfrastructure}
        urlPageBehavior={webAnalysisData.urlPageBehavior}
        malwareDetection={webAnalysisData.malwareDetection}
        contactData={webAnalysisData.contactData}
        navigationFlow={webAnalysisData.navigationFlow}
        productAnalysis={webAnalysisData.productAnalysis}
        websiteSnapshots={webAnalysisData.websiteSnapshots}
        reverseImageSearchData={overviewData.reverseImageSearchData}
        scamDetectedOverall={overviewData.scamDetectedOverall}
        trafficData={webAnalysisData.trafficData}
      />

      <div style={{ pageBreakAfter: 'always' }} />

      {/* 3. VPA Analysis Tab (External Analysis) */}
      <InvestigationVPAAnalysisPDFTemplate
        merchantName={merchantName}
        runDate={runDate}
        website={website}
        hasData={vpaAnalysisData.hasData}
        socialMediaPlatforms={overviewData.socialMediaPlatforms}
        scamIntelligenceData={overviewData.scamIntelligenceData}
        monitoredDimensions={overviewData.monitoredDimensions}
        riskAnalysisData={overviewData.riskAnalysisData}
        reviewsAnalysisData={overviewData.reviewsAnalysisData}
        scamDetectedOverall={overviewData.scamDetectedOverall}
        redFlags={overviewData.redFlags}
      />

      <div style={{ pageBreakAfter: 'always' }} />

      {/* 4. Decisioning Tab */}
      <InvestigationDecisioningPDFTemplate
        merchantName={merchantName}
        runDate={runDate}
        website={website}
        aiRiskCommentary={decisioningData.aiRiskCommentary}
        verdict={decisioningData.verdict}
        rules={decisioningData.rules}
      />
    </div>
  );
};

export default InvestigationFullReportPDFTemplate;
