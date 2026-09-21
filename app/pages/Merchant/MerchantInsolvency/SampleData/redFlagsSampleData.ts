interface RedFlag {
  id: string;
  text: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description?: string;
}

/*
export const financialRedFlags: RedFlag[] = [
  {
    id: 'fin-1',
    text: 'Significant decline in working capital',
    severity: 'critical',
    category: 'Financial',
    description: 'Working capital has decreased by 45% in the last quarter, indicating severe liquidity issues and potential inability to meet short-term obligations.'
  },
  {
    id: 'fin-2',
    text: 'Increasing debt-to-equity ratio',
    severity: 'high',
    category: 'Financial',
    description: 'Debt-to-equity ratio has increased from 1.2 to 2.8 in the past 6 months, showing increasing leverage and financial risk.'
  }
];

export const operationalRedFlags: RedFlag[] = [
  {
    id: 'op-1',
    text: 'Significant reduction in operational fleet',
    severity: 'high',
    category: 'Operational',
    description: 'Fleet size has decreased by 30% in the past 12 months due to aircraft returns to lessors.'
  }
];

export const legalRedFlags: RedFlag[] = [
  {
    id: 'leg-1',
    text: 'Multiple unresolved legal disputes with lessors',
    severity: 'high',
    category: 'Legal',
    description: 'Currently facing 3 major legal disputes with aircraft lessors over unpaid leases worth approximately $28M.'
  }
];

export const marketRedFlags: RedFlag[] = [
  {
    id: 'mkt-1',
    text: 'Declining market share',
    severity: 'medium',
    category: 'Market',
    description: 'Market share has declined from 12% to 7.5% over the past year.'
  }
];

export const transactionRedFlags: RedFlag[] = [
  {
    id: 'trx-1',
    text: 'Increased chargeback rates',
    severity: 'medium',
    category: 'Transaction',
    description: 'Chargeback rate has increased to 3.2%, which is well above the industry standard of 0.9%.'
  }
];

export const allRedFlags: RedFlag[] = [
  ...financialRedFlags,
  ...operationalRedFlags,
  ...legalRedFlags,
  ...marketRedFlags,
  ...transactionRedFlags
]; 
*/

// Empty arrays as replacements
export const financialRedFlags: RedFlag[] = [];
export const operationalRedFlags: RedFlag[] = [];
export const legalRedFlags: RedFlag[] = [];
export const marketRedFlags: RedFlag[] = [];
export const transactionRedFlags: RedFlag[] = [];
export const allRedFlags: RedFlag[] = []; 