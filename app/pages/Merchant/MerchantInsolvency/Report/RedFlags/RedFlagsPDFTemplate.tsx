'use client';

import React from 'react';
import { MerchantItemType } from '@/app/types';
import { /* format */ } from 'date-fns';
import './RedFlagsPDFTemplate.css';
import RedFlagItem from '../components/RedFlagItem';
import RedFlagsSummary from '../components/RedFlagsSummary';

interface RedFlag {
  id: string;
  description?: string;
  severity?: string;
  rule_type?: string;
  rule_name?: string;
  rule_code?: string;
  created_at?: string;
  metric_values?: Record<string, number | string>;
}

interface RedFlagsPDFTemplateProps {
  activeMerchant: MerchantItemType;
  redFlags: RedFlag[];
  merchantIndustry?: {
    industry: string;
    risk_segment: string;
  } | null;
}

const RedFlagsPDFTemplate: React.FC<RedFlagsPDFTemplateProps> = ({
  activeMerchant: _activeMerchant,
  redFlags,
  merchantIndustry: _merchantIndustry
}) => {
  // Get category mapping function
  const getTagCategory = (ruleType: string): string => {
    // Enhanced mapping to handle the actual rule types from the system
    const categoryMap: Record<string, string> = {
      // External mappings
      'insolvency_external_audit': 'Audit',
      'insolvency_external_executive': 'Executive',
      'insolvency_external_disclosures': 'Disclosures',
      'insolvency_external_financial': 'Financial',
      'insolvency_external_legal': 'Legal',
      'insolvency_external_operational': 'Operational',
      'insolvency_external_annualReport': 'Annual Report',
      'insolvency_external_industry': 'Industry',
      'insolvency_external_brand': 'Brand',
      'insolvency_external_courtOrders': 'Court Orders',
      'insolvency_external_regulatory': 'Regulatory',
      
      // Financial mappings
      'insolvency_financial_financialStatements': 'Financial Statements',
      'insolvency_financial_financialMetrics': 'Financial Metrics',
      'insolvency_financial_pdAnalysis': 'Probability of Default',
      'insolvency_financial_workingCapital': 'Working Capital',
      'insolvency_financial_debtRatio': 'Debt Ratio',
      'insolvency_financial_cashFlow': 'Cash Flow',
      'transaction_monitoring': 'Transaction Monitoring',
      
      // Overview mappings
      'insolvency_overview_pdAnalysis': 'Default Analysis',
      'insolvency_overview_company': 'Company',
      'insolvency_overview_industry': 'Industry',
      'insolvency_overview_transactionMetrics': 'Transaction Metrics',
      
      // Operational mappings
      'insolvency_operational_fleet': 'Fleet Operations',
      'insolvency_operational_supplyChain': 'Supply Chain',
      
      // Legal mappings
      'insolvency_legal_disputes': 'Legal Disputes',
      'insolvency_legal_compliance': 'Compliance',
      
      // Legacy mappings for backward compatibility
      'audit': 'Audit',
      'legal': 'Legal',
      'operational': 'Operational',
      'financial': 'Financial',
      'reputation': 'Reputation',
      'industry': 'Industry',
      'annual_report': 'Annual Report',
      'company': 'Company',
    };
    return categoryMap[ruleType] || 'Other';
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

  // Sort red flags by severity
  const severityOrder: Record<string, number> = {
    'severe': 0,
    'high': 1,
    'medium': 2,
    'low': 3,
    'unknown': 4
  };

  const sortedRedFlags = [...redFlags].sort((a, b) => {
    const severityA = (a.severity?.toLowerCase() || 'unknown').trim();
    const severityB = (b.severity?.toLowerCase() || 'unknown').trim();
    
    const orderA = severityOrder[severityA] ?? severityOrder.unknown;
    const orderB = severityOrder[severityB] ?? severityOrder.unknown;
    
    return orderA - orderB;
  });

  // Prevent unused variable lint errors for props that may be used in other templates
  void _activeMerchant;
  void _merchantIndustry;

  // Severity breakdown is rendered in RedFlagsSummary component

  // category breakdown intentionally omitted (unused in this template)

  // Render all red flags continuously for PDF exports. Avoid client-side
  // pagination here so the PDF engine can naturally flow items across pages.

  return (
    <div className="pdf-redflags-template">
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
            <h2 className="pdf-report-title">Red Flags Report</h2>
            <p className="pdf-report-date">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div> */}

          {/* Summary Section - rendered inline inside details section so summary and list can appear on the same page */}

      {/* Category Breakdown */}
      {/* <div className="pdf-section">
        <div className="pdf-section-header">
          <h2 className="pdf-section-title">Category Breakdown</h2>
        </div>
        <div className="pdf-section-content">
          <div className="pdf-category-grid">
            {Object.entries(categoryBreakdown).map(([category, count]) => (
              <div key={category} className="pdf-category-item">
                <div className="pdf-category-label">{category}</div>
                <div className="pdf-category-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Red Flags Details */}
      <div className="pdf-section" style={{ breakInside: 'auto' }}>
        {/* <div className="pdf-section-header">
          <h2 className="pdf-section-title">Red Flags Details</h2>
        </div> */}
        <div className="pdf-section-content">
          {sortedRedFlags.length > 0 ? (
            <>
              {/* Render all flags continuously in a single flowing list. The
                  PDF engine will naturally break pages as needed; keeping the
                  markup simple avoids brittle client-side pagination. */}
              <div className="pdf-page-watermark-wrapper">
                <RedFlagsSummary redFlags={redFlags} />
                <div className="pdf-redflags-list">
                  {sortedRedFlags.map((flag) => (
                    <RedFlagItem
                      key={flag.id}
                      flag={flag}
                      getTagCategory={getTagCategory}
                      getSeverityConfig={getSeverityConfig}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="pdf-no-data">No red flags found for this merchant.</p>
          )}
        </div>
      </div>

      {/* Legend Section */}
      {/* <div className="pdf-section">
        <div className="pdf-section-header">
          <h3 className="pdf-section-title">Severity Legend</h3>
        </div>
        <div className="pdf-section-content">
          <div className="pdf-legend">
            <div className="pdf-legend-item">
              <div className="pdf-legend-color severity-severe"></div>
              <span>Severe - Immediate attention required</span>
            </div>
            <div className="pdf-legend-item">
              <div className="pdf-legend-color severity-high"></div>
              <span>High - High priority concern</span>
            </div>
            <div className="pdf-legend-item">
              <div className="pdf-legend-color severity-medium"></div>
              <span>Medium - Moderate concern</span>
            </div>
            <div className="pdf-legend-item">
              <div className="pdf-legend-color severity-low"></div>
              <span>Low - Minor concern</span>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default RedFlagsPDFTemplate;