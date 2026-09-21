'use client';

import React from 'react';
import { 
  Shield, Users, AlertTriangle, Smile, DollarSign, 
  LineChart, FileText, Clipboard, FileBarChart
} from 'lucide-react';
import InsightItem from '../components/InsightItem';
import { MerchantItemType } from '@/app/types';
import { format } from 'date-fns';
import './ExternalInsightsPDFTemplate.css';
import SectionHeader from '../components/SectionHeader';

interface InsightItem {
  title: string;
  summary: string;
  date: string;
  source?: string;
  sources?: string | string[];
  source_urls?: string[];
  risk_segment?: 'severe' | 'high' | 'medium';
  tag?: 'redflag' | string;
  severity?: 'severe' | 'high' | 'medium' | 'low' | 'good' | 'veryGood' | string;
  risk_level?: string;
  insight?: string;
  created_at?: string;
  year?: string | number;
  filename?: string;
  page_number?: string | number;
  bare_text?: string;
  financial_year?: string | number;
  [key: string]: unknown;
}

interface ExternalInsightsPDFTemplateProps {
  insightsData: Record<string, InsightItem[]>;
  // optional props accepted by caller (kept optional because template may not need them)
  activeMerchant?: MerchantItemType;
  redFlagsData?: Record<string, unknown[]>;
  merchantIndustry?: { industry: string; risk_segment: string } | null;
}

const ExternalInsightsPDFTemplate: React.FC<ExternalInsightsPDFTemplateProps> = ({ insightsData }) => {
  // Section configuration
  const sectionConfig = {
    legal_regulatory_compliance: {
      title: "Legal & Regulatory Issues",
      icon: Shield,
      iconColorClass: "text-red-600"
    },
    executive_workforce_developments: {
      title: "Executive & Workforce Developments", 
      icon: Users,
      iconColorClass: "text-blue-600"
    },
    operational_disruptions: {
      title: "Operational Incidents",
      icon: AlertTriangle,
      iconColorClass: "text-amber-600"
    },
    sentiment_brand_reputation: {
      title: "Brand & Reputational Signals",
      icon: Smile,
      iconColorClass: "text-purple-600"
    },
    financial_warning_signs: {
      title: "Financial Warning Signs",
      icon: DollarSign,
      iconColorClass: "text-emerald-600"
    },
    industry_macroeconomic: {
      title: "Industry & Macro Pressures",
      icon: LineChart,
      iconColorClass: "text-indigo-600"
    },
    financial_disclosures: {
      title: "Financial Disclosures Insights",
      icon: FileText,
      iconColorClass: "text-teal-600"
    },
    audit_report_insights: {
      title: "Insights from Audit Report",
      icon: Clipboard,
      iconColorClass: "text-orange-600"
    },
    annual_report_insights: {
      title: "Insights from Annual Report",
      icon: FileBarChart,
      iconColorClass: "text-pink-600"
    }
  };


  // Get severity configuration
  const getSeverityConfig = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
      case 'critical':
        return {
          text: 'Severe',
          className: 'severity-severe'
        };
      case 'high':
        return {
          text: 'High',
          className: 'severity-high'
        };
      case 'medium':
        return {
          text: 'Medium',
          className: 'severity-medium'
        };
      default:
        return {
          text: 'Low',
          className: 'severity-low'
        };
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      return format(new Date(dateString), 'dd/M/yyyy');
    } catch {
      return dateString;
    }
  };

  // Extract domain from URL
  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  // Get sections that have data
  const sectionsWithData = Object.keys(insightsData).filter(key => 
    Array.isArray(insightsData[key]) && insightsData[key].length > 0
  );

  // Flatten insights into a single list while preserving the first-item header for each section.
  type FlatInsight = {
    insight: InsightItem;
    sectionKey: string;
    showSectionHeader: boolean;
  };

  const flatInsights: FlatInsight[] = [];
  sectionsWithData.forEach((sectionKey) => {
    const items = insightsData[sectionKey] || [];
    items.forEach((it, idx) => {
      flatInsights.push({ insight: it, sectionKey, showSectionHeader: idx === 0 });
    });
  });

  // Render flattened insights in a continuous flow. We keep a section header
  // and its first insight together by wrapping them in `.pdf-section-inline`.
  // This removes the previous per-page chunking logic so insights flow naturally
  // but will not break inside individual insight cards (CSS ensures that).

  // Calculate total insights and red flags (not used in current template)
  // const totalInsights = sectionsWithData.reduce((total, key) => total + (insightsData[key]?.length || 0), 0);
  // const totalRedFlags = sectionsWithData.reduce((total, key) => total + (redFlagsData[key]?.length || 0), 0);

  return (
    <div className="pdf-external-insights-template">
      {/* Header */}
      {/* <div className="pdf-header">
        <div className="pdf-header-content">
          <div className="pdf-title-section">
            <h1 className="pdf-main-title">{activeMerchant.legalName}</h1>
            <div className="pdf-subtitle-section">
              {merchantIndustry && (
                <span className={`pdf-industry-tag ${
                  merchantIndustry.risk_segment === 'Medium' ? 'medium-risk' : 
                  merchantIndustry.risk_segment === 'High' ? 'high-risk' : 
                  merchantIndustry.risk_segment === 'Low' ? 'low-risk' : 
                  'default-risk'
                }`}>
                  {merchantIndustry.industry}
                </span>
              )}
              <span className="pdf-cin">CIN {activeMerchant.cin || activeMerchant.id}</span>
            </div>
          </div>
          <div className="pdf-report-info">
            <h2 className="pdf-report-title">External Insights Report</h2>
            <p className="pdf-report-date">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div> */}

      {/* Summary Section */}
      {/* <div className="pdf-section">
        <div className="pdf-section-header">
          <h2 className="pdf-section-title">External Insights Summary</h2>
        </div>
        <div className="pdf-section-content">
          <div className="pdf-summary-grid">
            <div className="pdf-summary-item">
              <div className="pdf-summary-label">Total Insights</div>
              <div className="pdf-summary-value">{totalInsights}</div>
            </div>
            <div className="pdf-summary-item">
              <div className="pdf-summary-label">Categories</div>
              <div className="pdf-summary-value">{sectionsWithData.length}</div>
            </div>
            <div className="pdf-summary-item">
              <div className="pdf-summary-label">Red Flags</div>
              <div className="pdf-summary-value">{totalRedFlags}</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Render insights continuously (no fixed per-page chunking). Section headers
          that appear before the first insight of a section are wrapped with the
          insight in `.pdf-section-inline` to avoid them being orphaned across pages. */}
      {/* Paginate insights: first page = 3 items, subsequent pages = 4 items per page */}
      <div className="pdf-insights-flow">
        {flatInsights.length > 0 && (
          <>
            {flatInsights.map((flatItem, idx) => {
              const sectionInfo = sectionConfig[flatItem.sectionKey as keyof typeof sectionConfig];
              if (flatItem.showSectionHeader && sectionInfo) {
                return (
                  <div key={`item-${idx}`} className="pdf-section-inline">
                    <SectionHeader title={sectionInfo.title} Icon={sectionInfo.icon} />
                    <InsightItem
                      insight={flatItem.insight}
                      sectionKey={flatItem.sectionKey}
                      formatDate={formatDate}
                      extractDomain={extractDomain}
                      getSeverityConfig={getSeverityConfig}
                    />
                  </div>
                );
              }

              return (
                <div key={`item-${idx}`}>
                  <InsightItem
                    insight={flatItem.insight}
                    sectionKey={flatItem.sectionKey}
                    formatDate={formatDate}
                    extractDomain={extractDomain}
                    getSeverityConfig={getSeverityConfig}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* No Data Message */}
      {sectionsWithData.length === 0 && (
        <div className="pdf-section">
          <div className="pdf-no-data">
            No external insights data available for this merchant.
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalInsightsPDFTemplate;