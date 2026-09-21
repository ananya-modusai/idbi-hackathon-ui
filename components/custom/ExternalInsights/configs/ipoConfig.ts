import { 
  Shield, Users, AlertTriangle, DollarSign, 
  LineChart, FileText, Building2, Briefcase, Clipboard, FileBarChart, 
  Smile
} from 'lucide-react';
import { ExternalInsightsConfig, InsightItem } from '../ExternalInsightsComponent';
import { ipoService } from '@/app/services/ipoServices';

// IPO-specific section configuration
export const ipoSectionConfig = {
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

// IPO-specific short names for tabs
export const ipoShortNames = {
  legal_regulatory_compliance: 'Legal',
  executive_workforce_developments: 'Executive',
  operational_disruptions: 'Operations',
  sentiment_brand_reputation: 'Brand',
  financial_warning_signs: 'Financial',
  industry_macroeconomic: 'Industry',
  financial_disclosures: 'Disclosures',
  audit_report_insights: 'Audit',
  annual_report_insights: 'Annual'
};

// IPO primary categories
export const ipoPrimaryCategories = [
  'legal_regulatory_compliance',
  'executive_workforce_developments',
  'operational_disruptions',
  'sentiment_brand_reputation',
  'financial_warning_signs', 
  'industry_macroeconomic',
  'financial_disclosures',
  'audit_report_insights',
  'annual_report_insights'
];

// IPO API endpoints using the IPO service (similar to insolvency)
const ipoApiEndpoints = {
  fetchData: async (params?: string) => {
    if (!params) {
      throw new Error('Company ID is required');
    }
    return await ipoService.getCompanyExternalData(params);
  },
  fetchAuditReports: async (params?: string) => {
    if (!params) {
      throw new Error('Company ID is required');
    }
    return await ipoService.getCompanyAuditReportInsights(params);
  },
  fetchAnnualReports: async (params?: string) => {
    if (!params) {
      throw new Error('Company ID is required');
    }
    return await ipoService.getCompanyAnnualReportInsights(params);
  }
};

// Data transformer for IPO insights
const ipoDataTransformer = (rawData: any): Record<string, InsightItem[]> => {
  const result: Record<string, InsightItem[]> = {};
  
  // Process main external data
  if (rawData?.main?.data) {
    // If the API returns data in a similar structure to insolvency
    if (Array.isArray(rawData.main.data)) {
      const insightRecord = rawData.main.data.find((item: any) => item.insight_type === 'external_data');
      if (insightRecord?.insight_value) {
        const insightValue = insightRecord.insight_value;
        
        // Map each category from the insight_value
        Object.keys(ipoSectionConfig).forEach(key => {
          if (key !== 'audit_report_insights' && key !== 'annual_report_insights') {
            result[key] = Array.isArray(insightValue[key]) ? insightValue[key] : [];
          }
        });
      }
    } else {
      // If the API returns data directly as an object
      Object.keys(ipoSectionConfig).forEach(key => {
        if (key !== 'audit_report_insights' && key !== 'annual_report_insights') {
          result[key] = Array.isArray(rawData.main.data[key]) ? rawData.main.data[key] : [];
        }
      });
    }
  } else if (rawData?.main) {
    // Handle direct response structure
    Object.keys(ipoSectionConfig).forEach(key => {
      if (key !== 'audit_report_insights' && key !== 'annual_report_insights') {
        result[key] = Array.isArray(rawData.main[key]) ? rawData.main[key] : [];
      }
    });
  }
  
  // Process audit report insights (from getFlagsFromAuditorDisclosures)
  if (rawData?.audit?.data) {
    if (Array.isArray(rawData.audit.data)) {
      const auditRecord = rawData.audit.data.find((item: any) => item.insight_type === 'audit_flags' || item.insight_type === 'auditor_disclosures');
      if (auditRecord && Array.isArray(auditRecord.insight_value)) {
        result['audit_report_insights'] = auditRecord.insight_value;
      }
    } else {
      // Direct array or object response
      result['audit_report_insights'] = Array.isArray(rawData.audit.data) ? rawData.audit.data : [];
    }
  } else if (rawData?.audit) {
    result['audit_report_insights'] = Array.isArray(rawData.audit) ? rawData.audit : [];
  }
  
  // Process annual report insights (from getAnnualReportInsights)
  if (rawData?.annual?.data) {
    if (Array.isArray(rawData.annual.data)) {
      const annualRecord = rawData.annual.data.find((item: any) => item.insight_type === 'annual_report_insights');
      if (annualRecord && Array.isArray(annualRecord.insight_value)) {
        result['annual_report_insights'] = annualRecord.insight_value;
      }
    } else {
      // Direct array or object response
      result['annual_report_insights'] = Array.isArray(rawData.annual.data) ? rawData.annual.data : [];
    }
  } else if (rawData?.annual) {
    result['annual_report_insights'] = Array.isArray(rawData.annual) ? rawData.annual : [];
  }
  
  return result;
};

// Red flag mapper for IPO
const ipoRedFlagMapper = (sectionKey: string, insights: InsightItem[], companyId?: string) => {
  const normalizeSeverity = (severity: string | undefined): 'severe' | 'high' | 'medium' | 'good' | 'veryGood' | 'neutral' => {
    if (!severity) return 'medium';
    const normalized = severity.toLowerCase();
    if (['severe', 'high', 'medium', 'good', 'verygood', 'neutral'].includes(normalized)) {
      return normalized as 'severe' | 'high' | 'medium' | 'good' | 'veryGood' | 'neutral';
    }
    return 'medium';
  };

  if (sectionKey === 'audit_report_insights') {
    // Map audit report insights (from auditor disclosures)
    return insights.map((item, index) => ({
      id: `audit-${index}`,
      merchant_id: companyId || 'ipo-company',
      rule_code: `audit_insight_${index}`,
      description: item.title || item.summary,
      severity: normalizeSeverity('high'),
      rule_type: 'ipo_external_audit',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metric_values: null,
      metric_data_timestamp: null,
      notes: null,
      isPositive: false,
    }));
  } else if (sectionKey === 'annual_report_insights') {
    // Map annual report insights
    return insights.map((item, index) => ({
      id: `annual-${index}`,
      merchant_id: companyId || 'ipo-company',
      rule_code: `annual_insight_${index}`,
      description: ((item as any).insight || item.summary || '').substring(0, 120) + 
                  (((item as any).insight || item.summary || '').length > 120 ? '...' : ''),
      severity: normalizeSeverity((item as any).tag === 'redflag' || item.severity === 'high' ? 'high' : 'medium'),
      rule_type: 'ipo_external_annualreport',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metric_values: null,
      metric_data_timestamp: null,
      notes: null,
      isPositive: false
    }));
  } else {
    // Standard mapping for other sections
    return insights.map((insight, index) => ({
      id: `${sectionKey}-${index}`,
      merchant_id: companyId || 'ipo-company',
      rule_code: `${sectionKey}_insight_${index}`,
      description: insight.title || insight.summary,
      severity: normalizeSeverity(insight.severity),
      rule_type: `ipo_external_${sectionKey}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metric_values: null,
      metric_data_timestamp: null,
      notes: null,
      isPositive: false
    }));
  }
};

// Complete IPO configuration
export const ipoExternalInsightsConfig: ExternalInsightsConfig = {
  sections: ipoSectionConfig,
  primaryCategories: ipoPrimaryCategories,
  shortNames: ipoShortNames,
  apiEndpoints: ipoApiEndpoints,
  dataTransformer: ipoDataTransformer,
  redFlagMapper: ipoRedFlagMapper
};
