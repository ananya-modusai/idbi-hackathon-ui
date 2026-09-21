import { getTextColorClass } from '@/components/custom/CustomColorScheme';

export const tagsMapping: Record<string, string> = {
  // External insolvency mappings
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
  
  // Financial metrics
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
  'insolvency_legal_compliance': 'Compliance'
};

export const getTagCategory = (tag: string): string => {
  return tagsMapping[tag] || 'Other';
};

// Function to get display name for red flag
export const getRedFlagDisplayName = (flag: any): string => {
  if (flag.rule_name) {
    return flag.rule_name;
  }
  
  if (flag.rule_type && tagsMapping[flag.rule_type]) {
    return tagsMapping[flag.rule_type];
  }
  
  if (flag.description) {
    return flag.description.length > 50 ? flag.description.substring(0, 50) + '...' : flag.description;
  }
  
  return 'Risk Alert';
};

// Function to get severity color
export const getSeverityColor = (severity: string): string => {
  switch (severity?.toLowerCase()) {
    case 'severe':
      return getTextColorClass('red');
    case 'high':
      return getTextColorClass('orange');
    case 'medium':
      return getTextColorClass('yellow');
    case 'neutral':
      return getTextColorClass('gray');
    case 'good':
      return getTextColorClass('emerald');
    case 'very good':
      return getTextColorClass('green');
    default:
      return getTextColorClass('gray');
  }
};

// Function to categorize red flags by rule_type
export const categorizeRedFlags = (flags: any[]) => {
  const categories = {
    financial: [] as any[],
    external: [] as any[],
    operational: [] as any[],
    legal: [] as any[],
    other: [] as any[]
  };

  flags.forEach(flag => {
    const ruleType = flag.rule_type || '';
    
    // Map specific rule types to categories
    // Check for external first to exclude those tags from other categories
    if (ruleType.includes('external')) {
      categories.external.push(flag);
    } else if (ruleType.includes('financial') || ruleType.includes('transaction') || ruleType.includes('pdAnalysis')) {
      categories.financial.push(flag);
    } else if (ruleType.includes('audit') || ruleType.includes('annualReport')) {
      categories.external.push(flag);
    } else if (ruleType.includes('operational')) {
      categories.operational.push(flag);
    } else if (ruleType.includes('legal')) {
      categories.legal.push(flag);
    } else if (ruleType.includes('company') || ruleType.includes('industry')) {
      categories.other.push(flag);
    } else {
      categories.other.push(flag);
    }
  });

  return categories;
};
