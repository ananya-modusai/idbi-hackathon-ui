export interface ReportComponent {
    frontend_component_id: string;
    component_type: 'risk-score' | 'key-stats' | 'single-investigation' | 'transaction' | 'payout' | 
                   'company-overview' | 'industry-overview' | 'default-probability' | 
                   'transaction-metrics' | 'transactions-visualizations' | 'intermediaries' | 'peer-group' |
                   'issue-details' | 'icdr-compliance' | 'management-promoters' | 'offer-document-review' |
                   'insolvency-red-flags' | 'capital-structure' | 'external-insights';
    data: any;
  }

export interface Report {
  id: string;
  report_title: string;
  last_updated: string;
  components?: ReportComponent[];
}

export interface ReportArtifactProps {
  report: Report;
} 