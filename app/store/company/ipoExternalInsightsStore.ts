import { create } from 'zustand';
import { 
  fetchCompanyExternalData, 
  fetchCompanyAuditReportInsights, 
  fetchCompanyAnnualReportInsights 
} from '@/app/services/ipoServices';

// Define the interface for data in each insight
interface InsightItem {
    date: string;
    title: string;
    summary: string;
    source_urls: string[];
    [key: string]: any; // For additional fields specific to each type
}

// Define the interface for insight value
interface InsightValue {
    regulatory_compliance: InsightItem[];
    market_conditions: InsightItem[];
    financial_disclosures: InsightItem[];
    management_governance: InsightItem[];
    industry_sector: InsightItem[];
    due_diligence: InsightItem[];
}

// Define the interface for each external insight record
interface ExternalInsightRecord {
    created_at: string;
    company_id: string;
    insight_type: string;
    id: string;
    insight_value: InsightValue;
}

// Define the interface for external insights data
interface ExternalDataType {
    success: boolean;
    message: string;
    data: ExternalInsightRecord[];
}

// Interface for audit report insights
interface AuditReportInsightsType {
    success: boolean;
    message: string;
    data: AuditInsightRecord[];
}

interface AuditInsightRecord {
    company_id: string;
    insight_type: string;
    created_at: string;
    insight_value: AuditConcern[];
    id: string;
}

interface AuditConcern {
    year: string;
    title: string;
    summary: string;
    audit_concern: string;
}

// Interface for annual report insights
interface AnnualReportInsightsType {
    success: boolean;
    message: string;
    data: AnnualInsightRecord[];
}

interface AnnualInsightRecord {
    created_at: string;
    company_id: string;
    insight_type: string;
    id: string;
    insight_value: AnnualReportInsight[];
}

interface AnnualReportInsight {
    tag: string;
    year: string;
    insight: string;
    filename: string;
    bare_text?: string;
    page_number?: string;
}

interface IpoExternalInsightsStore {
    externalData: ExternalDataType | null;
    auditReportInsights: AuditReportInsightsType | null;
    annualReportInsights: AnnualReportInsightsType | null;
    loading: boolean;
    auditReportLoading: boolean;
    annualReportLoading: boolean;
    error: string | null;
    auditReportError: string | null;
    annualReportError: string | null;
    fetchExternalData: (companyId: string) => Promise<void>;
    fetchAuditReportInsights: (companyId: string) => Promise<void>;
    fetchAnnualReportInsights: (companyId: string) => Promise<void>;
}

export const useIpoExternalInsightsStore = create<IpoExternalInsightsStore>((set) => ({
    externalData: null,
    auditReportInsights: null,
    annualReportInsights: null,
    loading: false,
    auditReportLoading: false,
    annualReportLoading: false,
    error: null,
    auditReportError: null,
    annualReportError: null,
    fetchExternalData: async (companyId: string) => {
        try {
            set({ loading: true, error: null });
            const response = await fetchCompanyExternalData(companyId);
            set({ externalData: response, loading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch external insights data', 
                loading: false 
            });
        }
    },
    fetchAuditReportInsights: async (companyId: string) => {
        try {
            set({ auditReportLoading: true, auditReportError: null });
            const response = await fetchCompanyAuditReportInsights(companyId);
            set({ auditReportInsights: response, auditReportLoading: false });
        } catch (error) {
            set({ 
                auditReportError: error instanceof Error ? error.message : 'Failed to fetch audit report insights', 
                auditReportLoading: false 
            });
        }
    },
    fetchAnnualReportInsights: async (companyId: string) => {
        try {
            set({ annualReportLoading: true, annualReportError: null });
            const response = await fetchCompanyAnnualReportInsights(companyId);
            set({ annualReportInsights: response, annualReportLoading: false });
        } catch (error) {
            set({ 
                annualReportError: error instanceof Error ? error.message : 'Failed to fetch annual report insights', 
                annualReportLoading: false 
            });
        }
    }
}));
