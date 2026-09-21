// Sample metrics data for the Credit Behaviour section.
// Contains realistic sample values for Jan–Jun.

const creditCardSampleMetrics = [
  // ---------------------------------------------------
  // Loan Behaviour
  // ---------------------------------------------------
  {
    id: 'loan_approvals',
    name: 'Loan Approvals',
    type: 'Behavioral',
    icon: 'CheckCircle',
    normalRange: null,
    historicalValues: [2, 1, 0, 1, 1, 0],
    relativeValues: [5, -50, -100, 100, 0, -100],
    thresholdSign: '>',
    threshold1: 3,
    threshold2: 5,
    formula: 'Count of loans approved monthly',
    impactOnCompany: 'Higher values indicate strong creditworthiness.',
    industryMedian: 1,
    category: 'Loan Behaviour'
  },

  {
    id: 'loan_disbursals',
    name: 'Loan Disbursals',
    type: 'Behavioral',
    icon: 'Package',
    normalRange: null,
    historicalValues: [1, 0, 1, 1, 0, 1],
    relativeValues: [-50, -100, 100, 0, -100, 100],
    thresholdSign: '<',
    threshold1: 4,
    threshold2: 6,
    formula: 'Loan disbursals issued per month',
    impactOnCompany: 'Frequent disbursals may indicate credit stress.',
    industryMedian: 1,
    category: 'Loan Behaviour'
  },

  {
    id: 'loan_disbursals_before_emi',
    name: 'Loan Disbursals Before EMI',
    type: 'Behavioral',
    icon: 'Clock',
    normalRange: null,
    historicalValues: [2, 1, 0, 1, 0, 1],
    relativeValues: [100, -50, -100, 100, -100, 100],
    thresholdSign: '>',
    threshold1: 2,
    threshold2: 4,
    formula: 'Count of loan disbursals before EMI cycle begins',
    impactOnCompany: 'High volume indicates credit risk or misuse.',
    industryMedian: 1,
    category: 'Loan Behaviour'
  },

  {
    id: 'emi_conversions',
    name: 'EMI Conversions',
    type: 'Behavioral',
    icon: 'Repeat',
    normalRange: null,
    historicalValues: [0, 1, 1, 0, 1, 0],
    relativeValues: [-100, 100, 0, -100, 100, -100],
    thresholdSign: '>',
    threshold1: 2,
    threshold2: 4,
    formula: 'Spends converted to EMI',
    impactOnCompany: 'Frequent conversions indicate liquidity constraints.',
    industryMedian: 1,
    category: 'Loan Behaviour'
  },

  {
    id: 'emi_bounces',
    name: 'EMI Bounces',
    type: 'Behavioral',
    icon: 'AlertCircle',
    normalRange: null,
    historicalValues: [0, 1, 0, 1, 0, 1],
    relativeValues: [-100, 100, -100, 100, -100, 100],
    thresholdSign: '>',
    threshold1: 1,
    threshold2: 2,
    formula: 'Count of EMI bounce events',
    impactOnCompany: 'Major credit risk indicator; increases collection cost.',
    industryMedian: 0,
    category: 'Loan Behaviour'
  },

  // ---------------------------------------------------
  // Credit Card Behaviour
  // ---------------------------------------------------
  {
    id: 'cc_applications',
    name: 'CC Applications',
    type: 'Behavioral',
    icon: 'UserPlus',
    normalRange: null,
    historicalValues: [0, 1, 0, 1, 0, 1],
    relativeValues: [-100, 100, -100, 100, -100, 100],
    thresholdSign: '>',
    threshold1: 3,
    threshold2: 5,
    formula: 'Number of credit card applications',
    impactOnCompany: 'Frequent applications may indicate credit hunger.',
    industryMedian: 1,
    category: 'Credit Card Behaviour'
  },

  {
    id: 'cards_held',
    name: 'Cards Held',
    type: 'Behavioral',
    icon: 'CreditCard',
    normalRange: null,
    historicalValues: [2, 2, 2, 3, 3, 3],
    relativeValues: [0, 0, 0, 50, 0, 0],
    thresholdSign: '>',
    threshold1: 4,
    threshold2: 6,
    formula: 'Total credit cards held',
    impactOnCompany: 'More cards mean higher credit exposure risk.',
    industryMedian: 2,
    category: 'Credit Card Behaviour'
  },

  {
    id: 'credit_card_overdue',
    name: 'Credit Card Overdue',
    type: 'Behavioral',
    icon: 'AlertTriangle',
    normalRange: null,
    historicalValues: [0, 1, 0, 0, 1, 0],
    relativeValues: [-100, 100, -100, 0, 100, -100],
    thresholdSign: '>',
    threshold1: 1,
    threshold2: 2,
    formula: 'Instances of overdue credit card payments',
    impactOnCompany: 'Strong early warning indicator of repayment stress.',
    industryMedian: 0,
    category: 'Credit Card Behaviour'
  },

  // ---------------------------------------------------
  // Risk / Stress Indicators
  // ---------------------------------------------------
  {
    id: 'cash_withdrawal_post_loan',
    name: 'Cash Withdrawal Post Loan',
    type: 'Behavioral',
    icon: 'TrendingDown',
    normalRange: null,
    historicalValues: [3, 2, 1, 4, 2, 3],
    relativeValues: [50, -33, -50, 300, -50, 50],
    thresholdSign: '>',
    threshold1: 4,
    threshold2: 6,
    formula: 'ATM withdrawals after loan disbursal',
    impactOnCompany: 'Higher withdrawals indicate high stress or misuse.',
    industryMedian: 2,
    category: 'Risk / Stress Indicators'
  },

  {
    id: 'recovery_or_collection_action',
    name: 'Recovery/Collection Action',
    type: 'Behavioral',
    icon: 'Shield',
    normalRange: null,
    historicalValues: [0, 0, 1, 0, 0, 1],
    relativeValues: [0, 0, 100, -100, 0, 100],
    thresholdSign: '>',
    threshold1: 1,
    threshold2: 2,
    formula: 'Instances of recovery action taken',
    impactOnCompany: 'Indicates severe repayment stress.',
    industryMedian: 0,
    category: 'Risk / Stress Indicators'
  },

  {
    id: 'credit_report_pulls',
    name: 'Credit Report Pulls',
    type: 'Behavioral',
    icon: 'FileSearch',
    normalRange: null,
    historicalValues: [4, 3, 5, 4, 2, 3],
    relativeValues: [33, -25, 66, -20, -50, 50],
    thresholdSign: '>',
    threshold1: 6,
    threshold2: 8,
    formula: 'Number of credit inquiries',
    impactOnCompany: 'Frequent enquiries indicate credit seeking behaviour.',
    industryMedian: 3,
    category: 'Risk / Stress Indicators'
  },

  {
    id: 'application_declines',
    name: 'Application Declines',
    type: 'Behavioral',
    icon: 'XCircle',
    normalRange: null,
    historicalValues: [1, 0, 1, 1, 0, 1],
    relativeValues: [100, -100, 100, 0, -100, 100],
    thresholdSign: '>',
    threshold1: 2,
    threshold2: 3,
    formula: 'Applications declined due to low creditworthiness',
    impactOnCompany: 'High declines reflect customer riskiness.',
    industryMedian: 1,
    category: 'Risk / Stress Indicators'
  },

  {
    id: 'failed_transactions',
    name: 'Failed Transactions',
    type: 'Behavioral',
    icon: 'Slash',
    normalRange: null,
    historicalValues: [2, 1, 2, 1, 1, 2],
    relativeValues: [100, -50, 100, -50, 0, 100],
    thresholdSign: '>',
    threshold1: 3,
    threshold2: 5,
    formula: 'Failed debit/credit attempts',
    impactOnCompany: 'High failure rate signals liquidity issues.',
    industryMedian: 1,
    category: 'Risk / Stress Indicators'
  }
];

export default creditCardSampleMetrics;
