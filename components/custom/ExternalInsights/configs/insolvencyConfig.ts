import { 
  Shield, Users, AlertTriangle, Smile, DollarSign, 
  LineChart, FileText, Clipboard, FileBarChart 
} from 'lucide-react';
import { ExternalInsightsConfig, InsightItem, ApiResponseData, ApiResponse, RedFlag } from '../ExternalInsightsComponent';
import { merchantService } from '@/app/services/merchantServices';

// Insolvency-specific section configuration
export const insolvencySectionConfig = {
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

// Insolvency-specific short names for tabs
export const insolvencyShortNames = {
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

// Insolvency primary categories
export const insolvencyPrimaryCategories = [
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

// Insolvency API endpoints - using merchant service directly
const insolvencyApiEndpoints = {
  fetchData: async (params?: string) => {
    if (!params) {
      throw new Error('Merchant ID is required');
    }
    return await merchantService.getMerchantExternalData(params);
  },
  fetchAuditReports: async (params?: string) => {
    if (!params) {
      throw new Error('Merchant ID is required');
    }
    return await merchantService.getMerchantAuditReportInsights(params);
  },
  fetchAnnualReports: async (params?: string) => {
    if (!params) {
      throw new Error('Merchant ID is required');
    }
    return await merchantService.getMerchantAnnualReportInsights(params);
  }
};

// Data transformer for insolvency insights
const insolvencyDataTransformer = (rawData: ApiResponse): Record<string, InsightItem[] | null> => {
  console.log('🔄 Insolvency transformer input:', rawData);
  
  const result: Record<string, InsightItem[] | null> = {};
  
  // Initialize all sections with empty arrays
  Object.keys(insolvencySectionConfig).forEach(key => {
    result[key] = [];
  });
  
  // Determine whether the audit endpoint returned items so we can suppress
  // any "main" items that claim to be audit insights when the audit API
  // itself reported no items. This prevents showing a hardcoded/fallback
  // audit finding when the audit endpoint is empty.
  const auditHasItems = !!(rawData?.audit?.data && Array.isArray(rawData.audit.data) && rawData.audit.data.length > 0);

  // Process main external data - direct array format
  if (rawData?.main?.data && Array.isArray(rawData.main.data)) {
    console.log('📊 Processing main data:', rawData.main.data.length, 'items');
    (rawData.main.data as Array<Partial<InsightItem>>).forEach(item => {
      if ((item as any).insight_type && result.hasOwnProperty((item as any).insight_type)) {
        // If the main feed contains items tagged as 'audit_report_insights' but the
        // dedicated audit endpoint returned no items, skip those main items so the
        // UI shows the canonical "no insights available" state for the Audit tab.
        if ((item as any).insight_type === 'audit_report_insights' && !auditHasItems) {
          console.log('⏭ Skipping main-sourced audit insight because audit API returned no items:', item.title || 'untitled');
          return;
        }
        const transformedItem: InsightItem = {
          title: item.title || 'No title',
          summary: item.summary || item.insight || 'No summary',
          date: item.date || item.created_at || '',
          source: item.sources ? (Array.isArray(item.sources) ? item.sources.join(', ') : item.sources) : '',
          insight: item.insight || item.summary || '',
          severity: item.severity || 'medium',
          // Explicitly preserve url_dates and source_urls
          url_dates: (item as any).url_dates,
          source_urls: item.source_urls || (item as any).source_urls,
          // Keep original fields for any additional data
          ...item
        };
        // Debug: log if url_dates exists
        if ((item as any).url_dates) {
          console.log(`📅 Found url_dates for ${transformedItem.title}:`, (item as any).url_dates);
        }
        const bucket = result[(item as any).insight_type];
        if (!bucket) {
          result[(item as any).insight_type] = [transformedItem];
        } else {
          bucket.push(transformedItem);
        }
        console.log(`✅ Added item to ${(item as any).insight_type}:`, transformedItem.title);
      } else {
        console.log(`❌ Unknown insight_type: ${(item as any).insight_type}`);
      }
    });
  }
  
  // Process audit report insights - direct array format
  if (rawData?.audit?.data && Array.isArray(rawData.audit.data) && rawData.audit.data.length > 0) {
    console.log('📋 Processing audit data:', rawData.audit.data.length, 'items');
    // Use the audit API items as-is. Avoid injecting default/fallback fields
    // (for example 'Audit Finding') so we don't display fabricated insights.
    result['audit_report_insights'] = rawData.audit.data as InsightItem[];
    console.log('✅ Audit insights processed:', (result['audit_report_insights'] || []).length);
  } else {
    // Explicitly mark audit insights as null when the API returns no items.
    // This allows the UI to show a "no insights available" message and prevents
    // falling back to any hardcoded audit finding.
    console.log('ℹ️ No audit insights returned from API; setting audit_report_insights to null');
    result['audit_report_insights'] = null;
  }
  
  // Process annual report insights - direct array format
  if (rawData?.annual?.data && Array.isArray(rawData.annual.data)) {
    console.log('📈 Processing annual data:', rawData.annual.data.length, 'items');
    result['annual_report_insights'] = rawData.annual.data.map((item: Partial<InsightItem>) => ({
      title: item.title || 'Annual Report Finding',
      summary: item.summary || item.insight || 'No summary',
      date: item.created_at || item.year?.toString() || '',
      source: 'Annual Report',
      insight: item.insight || item.summary || '',
      severity: item.severity || 'medium',
      year: item.year,
      filename: item.filename,
      page_number: item.page_number,
      ...item
    }));
    console.log('✅ Annual insights processed:', result['annual_report_insights'].length);
  }
  
  console.log('🎯 Final transformed result:', result);
  return result;
};

// Red flag mapper for insolvency
const insolvencyRedFlagMapper = (sectionKey: string, insights: InsightItem[], merchantId?: string) => {
  const normalizeSeverity = (severity: string | undefined): 'severe' | 'high' | 'medium' | 'good' | 'veryGood' | 'neutral' => {
    if (!severity) return 'medium';
    const normalized = severity.toLowerCase();
    if (['severe', 'high', 'medium', 'good', 'verygood', 'neutral'].includes(normalized)) {
      return normalized as 'severe' | 'high' | 'medium' | 'good' | 'veryGood' | 'neutral';
    }
    return 'medium';
  };

  if (sectionKey === 'audit_report_insights') {
    return insights.map((item, index) => ({
      id: `audit-${index}`,
      merchant_id: merchantId || '',
      rule_code: `audit_insight_${index}`,
      description: item.title || item.summary,
      severity: normalizeSeverity(item.severity || item.risk_level),
      rule_type: 'insolvency_external_audit',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metric_values: null,
      metric_data_timestamp: null,
      notes: null,
      isPositive: false
    }));
  } else if (sectionKey === 'annual_report_insights') {
    return insights.map((item, index) => ({
      id: `annual-${index}`,
      merchant_id: merchantId || '',
      rule_code: `annual_insight_${index}`,
      description: ((item as any).insight || item.summary || '').substring(0, 120) + 
                  (((item as any).insight || item.summary || '').length > 120 ? '...' : ''),
      severity: normalizeSeverity(item.severity || ((item as any).tag === 'redflag' ? 'high' : 'medium')),
      rule_type: 'insolvency_external_annualreport',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metric_values: null,
      metric_data_timestamp: null,
      notes: null,
      isPositive: false
    }));
  } else {
    return insights.map((insight, index) => ({
      id: `${sectionKey}-${index}`,
      merchant_id: merchantId || '',
      rule_code: `${sectionKey}_insight_${index}`,
      description: insight.title || insight.summary,
      severity: normalizeSeverity(insight.severity),
      rule_type: sectionKey === 'legal_regulatory_compliance' ? 'insolvency_external_legal' : 
               sectionKey === 'financial_warning_signs' ? 'insolvency_external_financial' : 
               sectionKey === 'operational_disruptions' ? 'insolvency_external_operational' : 
               sectionKey === 'sentiment_brand_reputation' ? 'insolvency_external_brand' : 
               sectionKey === 'industry_macroeconomic' ? 'insolvency_external_industry' : 
               sectionKey === 'financial_disclosures' ? 'insolvency_external_disclosures' : 
               sectionKey === 'executive_workforce_developments' ? 'insolvency_external_executive' : 'insolvency_external_other',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metric_values: null,
      metric_data_timestamp: null,
      notes: null,
      isPositive: false
    }));
  }
};

// Complete insolvency configuration
export const insolvencyExternalInsightsConfig: ExternalInsightsConfig = {
  sections: insolvencySectionConfig,
  primaryCategories: insolvencyPrimaryCategories,
  shortNames: insolvencyShortNames,
  apiEndpoints: insolvencyApiEndpoints,
  // Cast to any because the ExternalInsightsConfig typing expects Record<string, InsightItem[]>
  // but we intentionally use `null` for sections (like audit) to indicate "no data" so the
  // UI can show a "no insights available" message instead of a hardcoded fallback.
  dataTransformer: insolvencyDataTransformer as any,
  redFlagMapper: insolvencyRedFlagMapper
};
