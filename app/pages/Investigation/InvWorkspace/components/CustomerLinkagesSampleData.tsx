import { NetworkData } from '@/app/types';

// Node type definitions (kept same as BC sample)
export const NODE_TYPES = {
  PERSON: 'person',
  DEVICE: 'device usage',
  MERCHANT: 'merchant',
  BANK_AGENT: 'bank_agent',
  GEONODE: 'geonode',
  HIGH_RISK_CUSTOMER: 'high_risk_customer'
} as const;

// Helper to normalise an id from a human name
const idFor = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Construct entities/edges from the table below. This is a static sample dataset keyed to Merchant id "Merchant001".
export const ewsLinkagesData: Record<string, NetworkData> = {
  "Merchant001": {
    networkOverview: {
      total_connections: 45,
      high_risk_connections: 12,
      id: 'ews-network-merchant001',
      directors_count: 0,
      network_risk_score: 72,
      merchant_id: 'Merchant001',
      created_at: new Date().toISOString()
    },
    firstDegreeCommunity: {
      entities: [
        { merchant_id: 'Merchant001', id: idFor('Loan A/C'), relationship_type: 'DISBURSEMENT', related_entity_id: idFor('Loan A/C'), related_entity_name: 'Loan A/C', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Borrower Limited'), relationship_type: 'NEFT', related_entity_id: idFor('Borrower Limited'), related_entity_name: 'Borrower Limited', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 1'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 1'), related_entity_name: 'Shell Co 1', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 2'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 2'), related_entity_name: 'Shell Co 2', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 3'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 3'), related_entity_name: 'Shell Co 3', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Vendor A'), relationship_type: 'NEFT', related_entity_id: idFor('Vendor A'), related_entity_name: 'Vendor A', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 4'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 4'), related_entity_name: 'Shell Co 4', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 5'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 5'), related_entity_name: 'Shell Co 5', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 6'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 6'), related_entity_name: 'Shell Co 6', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Merchant Settlement'), relationship_type: 'TRANSACTION', related_entity_id: idFor('Merchant Settlement'), related_entity_name: 'Merchant Settlement', created_at: new Date().toISOString() }
      ],
      edges: [
        { fromNode: idFor('Loan A/C'), toNode: idFor('Borrower Limited'), relationship_type: 'DISBURSEMENT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Shell Co 1'), relationship_type: 'NEFT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Shell Co 2'), relationship_type: 'NEFT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Shell Co 3'), relationship_type: 'NEFT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Vendor A'), relationship_type: 'NEFT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Shell Co 4'), relationship_type: 'NEFT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Shell Co 5'), relationship_type: 'NEFT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Shell Co 6'), relationship_type: 'NEFT' },
        { fromNode: idFor('Borrower Limited'), toNode: idFor('Merchant Settlement'), relationship_type: 'TRANSACTION' }
      ]
    },
    // Second degree connections (transactions from first-degree entities)
    secondDegreeCommunity: {
      entities: [
        { merchant_id: 'Merchant001', id: idFor('Shell Co 1a'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 1a'), related_entity_name: 'Shell Co 1A', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Service Provider 1'), relationship_type: 'NEFT', related_entity_id: idFor('Service Provider 1'), related_entity_name: 'Service Provider 1', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 2a'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 2a'), related_entity_name: 'Shell Co 2A', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Director Account (REDACTED)'), relationship_type: 'NEFT', related_entity_id: idFor('Director Account (REDACTED)'), related_entity_name: 'Director Account (REDACTED)', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 3a'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 3a'), related_entity_name: 'Shell Co 3A', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 4a'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 4a'), related_entity_name: 'Shell Co 4A', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 5a'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 5a'), related_entity_name: 'Shell Co 5A', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 6a'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 6a'), related_entity_name: 'Shell Co 6A', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Supplier X'), relationship_type: 'NEFT', related_entity_id: idFor('Supplier X'), related_entity_name: 'Supplier X', created_at: new Date().toISOString() }
      ],
      edges: [
        { fromNode: idFor('Shell Co 1'), toNode: idFor('Shell Co 1a'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 1'), toNode: idFor('Service Provider 1'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 2'), toNode: idFor('Shell Co 2a'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 2'), toNode: idFor('Director Account (REDACTED)'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 3'), toNode: idFor('Shell Co 3a'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 4'), toNode: idFor('Shell Co 4a'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 5'), toNode: idFor('Shell Co 5a'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 6'), toNode: idFor('Shell Co 6a'), relationship_type: 'NEFT' },
        { fromNode: idFor('Vendor A'), toNode: idFor('Supplier X'), relationship_type: 'NEFT' }
      ]
    },

    // Third degree connections (transactions from second-degree entities)
    thirdDegreeCommunity: {
      entities: [
        { merchant_id: 'Merchant001', id: idFor('Shell Co 1b'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 1b'), related_entity_name: 'Shell Co 1B', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Payment Gateway'), relationship_type: 'CARD_SETTLEMENT', related_entity_id: idFor('Payment Gateway'), related_entity_name: 'Payment Gateway', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 2b'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 2b'), related_entity_name: 'Shell Co 2B', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 3b'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 3b'), related_entity_name: 'Shell Co 3B', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Vendor B'), relationship_type: 'NEFT', related_entity_id: idFor('Vendor B'), related_entity_name: 'Vendor B', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 4b'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 4b'), related_entity_name: 'Shell Co 4B', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Personal Loan Repayment'), relationship_type: 'NEFT', related_entity_id: idFor('Personal Loan Repayment'), related_entity_name: 'Personal Loan Repayment', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 5b'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 5b'), related_entity_name: 'Shell Co 5B', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Shell Co 6b'), relationship_type: 'NEFT', related_entity_id: idFor('Shell Co 6b'), related_entity_name: 'Shell Co 6B', created_at: new Date().toISOString() },
        { merchant_id: 'Merchant001', id: idFor('Consulting Firm'), relationship_type: 'NEFT', related_entity_id: idFor('Consulting Firm'), related_entity_name: 'Consulting Firm', created_at: new Date().toISOString() }
      ],
      edges: [
        { fromNode: idFor('Shell Co 1a'), toNode: idFor('Shell Co 1b'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 1a'), toNode: idFor('Payment Gateway'), relationship_type: 'CARD_SETTLEMENT' },
        { fromNode: idFor('Shell Co 2a'), toNode: idFor('Shell Co 2b'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 3a'), toNode: idFor('Director Account (REDACTED)'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 3a'), toNode: idFor('Shell Co 3b'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 4a'), toNode: idFor('Vendor B'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 4a'), toNode: idFor('Shell Co 4b'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 5a'), toNode: idFor('Personal Loan Repayment'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 5a'), toNode: idFor('Shell Co 5b'), relationship_type: 'NEFT' },
        { fromNode: idFor('Shell Co 6a'), toNode: idFor('Shell Co 6b'), relationship_type: 'NEFT' },
        { fromNode: idFor('Service Provider 1'), toNode: idFor('Consulting Firm'), relationship_type: 'NEFT' }
      ]
    },
    commonConnections: [
      { connection_type: 'payment_gateway', connection_value: 'Payment Gateway', shared_with: ['Shell Co 1A', 'Merchant Settlement'] },
      { connection_type: 'retail_outlet', connection_value: 'Retail Outlet', shared_with: ['Merchant', 'Shell Co 5B'] },
      { connection_type: 'vendor', connection_value: 'Vendor A', shared_with: ['Borrower Limited', 'Supplier X'] },
      { connection_type: 'vendor', connection_value: 'Vendor B', shared_with: ['Shell Co 4A', 'Supplier Y'] },
      { connection_type: 'card_settlement', connection_value: 'Card settlement', shared_with: ['Card settlement', 'Merchant Settlement'] },
      { connection_type: 'director_account', connection_value: 'Director Account (REDACTED)', shared_with: ['Shell Co 2', 'Shell Co 3A', 'Shell Co 1C', 'Shell Co 6B', 'Consulting Firm'] },
      { connection_type: 'cash_withdrawal', connection_value: 'Retail Outlet Cash Withdrawals', shared_with: ['Retail Outlet'] },
      { connection_type: 'supplier', connection_value: 'Supplier X', shared_with: ['Vendor A'] },
      { connection_type: 'supplier', connection_value: 'Supplier Y', shared_with: ['Vendor B'] },
      { connection_type: 'miscellaneous', connection_value: 'Miscellaneous Fees', shared_with: ['Shell Co 2C'] },
      { connection_type: 'micro_payments', connection_value: 'Micro Payments', shared_with: ['Shell Co 3B'] }
    ],
    adjacencyList: {}
  }
};

// risk intelligence: a simple array of link-level intelligence derived from the table
export const ewsRiskIntelligenceData: Record<string, any[]> = {
  "Merchant001": [
    // First-degree links (Borrower Limited)
    { source: 'Loan A/C', target: 'Borrower Limited', sourceType: NODE_TYPES.PERSON, targetType: NODE_TYPES.MERCHANT, label: 'Disbursement', risk: 'Large loan disbursement', notes: 'Primary disbursement to borrower', degree: 'first' },
    { source: 'Borrower Limited', target: 'Shell Co 1', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Related party transaction (suspicious)', notes: '', degree: 'first' },
    { source: 'Borrower Limited', target: 'Shell Co 2', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Related party transaction (suspicious)', notes: '', degree: 'first' },
    { source: 'Borrower Limited', target: 'Shell Co 3', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Related party transaction (suspicious)', notes: '', degree: 'first' },
    { source: 'Borrower Limited', target: 'Vendor A', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'No business rationale on file', notes: '', degree: 'first' },
    { source: 'Borrower Limited', target: 'Shell Co 4', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Related party transaction (suspicious)', notes: '', degree: 'first' },
    { source: 'Borrower Limited', target: 'Shell Co 5', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Related party transaction (suspicious)', notes: '', degree: 'first' },
    { source: 'Borrower Limited', target: 'Shell Co 6', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Related party transaction (suspicious)', notes: '', degree: 'first' },
    { source: 'Borrower Limited', target: 'Merchant Settlement', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'Transaction', risk: 'NA', notes: '', degree: 'first' },

    // Shell Co onward links and layering (second-degree context)
    { source: 'Shell Co 1', target: 'Shell Co 1A', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — rapid onward transfer', notes: '', degree: 'second' },
    { source: 'Shell Co 1', target: 'Service Provider 1', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Suspicious invoice', notes: '', degree: 'second' },
    { source: 'Shell Co 2', target: 'Shell Co 2A', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — no clear activity', notes: '', degree: 'second' },
    { source: 'Shell Co 2', target: 'Director Account (REDACTED)', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.PERSON, label: 'NEFT', risk: 'High-risk recipient (redacted)', notes: '', degree: 'second' },
    { source: 'Shell Co 3', target: 'Shell Co 3A', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — related party', notes: '', degree: 'second' },
    { source: 'Shell Co 4', target: 'Shell Co 4A', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — rapid movement', notes: '', degree: 'second' },
    { source: 'Shell Co 5', target: 'Shell Co 5A', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — unusual counterparties', notes: '', degree: 'second' },
    { source: 'Shell Co 6', target: 'Shell Co 6A', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — low business activity', notes: '', degree: 'second' },

    // Further hops (third-degree / layering)
    { source: 'Shell Co 1A', target: 'Shell Co 1B', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — multiple hops', notes: '', degree: 'third' },
    { source: 'Shell Co 1A', target: 'Payment Gateway', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'Card settlement', risk: 'Round-trip patterns', notes: '', degree: 'third' },
    { source: 'Shell Co 2A', target: 'Shell Co 2B', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — short timing', notes: '', degree: 'third' },
    { source: 'Shell Co 3A', target: 'Director Account (REDACTED)', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.PERSON, label: 'NEFT', risk: 'High-risk recipient (redacted)', notes: '', degree: 'third' },
    { source: 'Shell Co 4A', target: 'Vendor B', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Vendor mismatch / limited documentation', notes: '', degree: 'third' },
    { source: 'Shell Co 5A', target: 'Personal Loan Repayment', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Suspected back-channel payment', notes: '', degree: 'third' },
    { source: 'Shell Co 6A', target: 'Shell Co 6B', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering', notes: '', degree: 'third' },

    // More splitting and small payments
    { source: 'Shell Co 1B', target: 'Shell Co 1C', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — quick onward transfer', notes: '', degree: 'third' },
    { source: 'Shell Co 2B', target: 'Shell Co 2C', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering — multiple small splits', notes: '', degree: 'third' },
    { source: 'Shell Co 3A', target: 'Shell Co 3B', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering', notes: '', degree: 'third' },
    { source: 'Shell Co 1C', target: 'Director Account (REDACTED)', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.PERSON, label: 'NEFT', risk: 'High-risk recipient (redacted)', notes: '', degree: 'third' },

  // Payment gateway and retail flows (treated as downstream / third-degree)
  { source: 'Payment Gateway', target: 'Merchant Settlement', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'Transaction', risk: 'NA', notes: '', degree: 'third' },
  { source: 'Merchant', target: 'Retail Outlet', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'UPI', risk: 'NA', notes: '', degree: 'third' },
  { source: 'Retail Outlet', target: 'Cash Withdrawals', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.PERSON, label: 'Cash withdrawal', risk: 'High cash usage (suspicious)', notes: '', degree: 'third' },

    // Additional recipient links
    { source: 'Shell Co 6B', target: 'Director Account (REDACTED)', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.PERSON, label: 'NEFT', risk: 'High-risk recipient (redacted)', notes: '', degree: 'third' },
    { source: 'Vendor A', target: 'Supplier X', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'NA', notes: '', degree: 'second' },
    { source: 'Vendor B', target: 'Supplier Y', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'NA', notes: '', degree: 'second' },

    // Consulting / suspicious invoice chain
  { source: 'Service Provider 1', target: 'Consulting Firm', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Related party transaction (suspicious)', notes: '', degree: 'third' },
    { source: 'Consulting Firm', target: 'Director Account (REDACTED)', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.PERSON, label: 'NEFT', risk: 'High-risk recipient (redacted)', notes: '', degree: 'third' },

    // More layering hops
    { source: 'Shell Co 4A', target: 'Shell Co 4B', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering', notes: '', degree: 'third' },
    { source: 'Shell Co 4B', target: 'Shell Co 4C', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering', notes: '', degree: 'third' },
    { source: 'Shell Co 5A', target: 'Shell Co 5B', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Layering', notes: '', degree: 'third' },
    { source: 'Shell Co 5B', target: 'Retail Outlet', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'UPI', risk: 'NA', notes: '', degree: 'third' },

  // Card settlement small transactions and service charges (downstream)
  { source: 'Card settlement', target: 'Merchant Settlement', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'Transaction', risk: 'NA', notes: '', degree: 'third' },
  { source: 'Card settlement', target: 'Merchant Settlement', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'Transaction', risk: 'NA', notes: '', degree: 'third' },
  { source: 'Service charges', target: 'Bank Charges', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.BANK_AGENT, label: 'Transaction', risk: 'NA', notes: '', degree: 'third' },

    // Small miscellaneous payouts / vendors
    { source: 'Shell Co 2C', target: 'Miscellaneous Fees', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'Small payouts; limited supporting docs', notes: '', degree: 'third' },
    { source: 'Shell Co 1B', target: 'Vendor C', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'NEFT', risk: 'NA', notes: '', degree: 'third' },
    { source: 'Shell Co 3B', target: 'Micro Payments', sourceType: NODE_TYPES.MERCHANT, targetType: NODE_TYPES.MERCHANT, label: 'UPI', risk: 'Structuring pattern (many small transactions)', notes: '', degree: 'third' }
  ]
};

// Alias: treat 'Borrower Limited' as the same sample merchant (Merchant001)
(ewsLinkagesData as any)["Borrower Limited"] = ewsLinkagesData["Merchant001"];
(ewsRiskIntelligenceData as any)["Borrower Limited"] = ewsRiskIntelligenceData["Merchant001"];

// Node styling configuration with subtle, professional colors matching website palette
export const getNodeStyle = (nodeType: string) => {
  const baseStyle = { fontSize: 12, fontWeight: 'bold', strokeWidth: 2 };
  
  // Normalize node type for comparison
  const normalizedType = nodeType?.toUpperCase() || '';
  
  // Customer nodes - Muted slate blue
  if (normalizedType.includes('CUSTOMER') || normalizedType === 'PERSON') {
    return { ...baseStyle, fill: '#64748b', stroke: '#475569' }; // Slate - muted
  }
  
  // Government IDs - Muted teal
  if (normalizedType.includes('GOV_ID') || normalizedType.includes('PAN') || normalizedType.includes('AADHAAR')) {
    return { ...baseStyle, fill: '#5eead4', stroke: '#2d8a84' }; // Muted cyan
  }
  
  // Contact info - Slate/gray shades
  if (normalizedType.includes('PHONE')) {
    return { ...baseStyle, fill: '#9ca3af', stroke: '#6b7280' }; // Gray - muted
  }
  if (normalizedType.includes('EMAIL')) {
    return { ...baseStyle, fill: '#9f7aea', stroke: '#6b5b95' }; // Muted purple
  }
  
  // Location - Muted warm tones
  if (normalizedType.includes('ADDRESS')) {
    return { ...baseStyle, fill: '#c4976a', stroke: '#9d7c5c' }; // Muted tan
  }
  if (normalizedType.includes('PINCODE')) {
    return { ...baseStyle, fill: '#d89d6e', stroke: '#b87a4f' }; // Muted brown
  }
  if (normalizedType.includes('GEOLOCATION') || normalizedType === 'GEONODE') {
    return { ...baseStyle, fill: '#b8860b', stroke: '#8b6914' }; // Muted goldenrod
  }
  
  // Devices - Gray
  if (normalizedType.includes('DEVICE')) {
    return { ...baseStyle, fill: '#a1a5b4', stroke: '#7c7f8a' }; // Muted gray-blue
  }
  
  // Banking - Muted teal
  if (normalizedType.includes('BANK') || normalizedType.includes('ACCOUNT') || normalizedType.includes('VPA') || normalizedType.includes('UPI')) {
    return { ...baseStyle, fill: '#5eead4', stroke: '#2d8a84' }; // Muted teal
  }
  if (normalizedType.includes('BRANCH')) {
    return { ...baseStyle, fill: '#6b8e71', stroke: '#5a7360' }; // Muted sage green
  }
  
  // Merchants and references - Muted slate
  if (normalizedType.includes('MERCHANT') || normalizedType === 'BANK_AGENT') {
    return { ...baseStyle, fill: '#6b5b95', stroke: '#4a3f6b' }; // Muted purple
  }
  if (normalizedType.includes('REFERENCE')) {
    return { ...baseStyle, fill: '#8b8589', stroke: '#6b5f6b' }; // Muted taupe
  }
  
  // High risk - Muted rust red
  if (normalizedType.includes('HIGH_RISK')) {
    return { ...baseStyle, fill: '#a76c5d', stroke: '#884433' }; // Muted rust
  }
  
  // Default - Cool gray
  return { ...baseStyle, fill: '#8b92a1', stroke: '#6b7380' };
};

// Basic node type detection by name
export const getNodeType = (name: string): string => {
  if (!name) return NODE_TYPES.MERCHANT;
  if (name.toLowerCase().includes('cash') || name.toLowerCase().includes('withdrawal')) return NODE_TYPES.PERSON;
  if (name.toLowerCase().includes('device')) return NODE_TYPES.DEVICE;
  if (name.toLowerCase().includes('vendor') || name.toLowerCase().includes('supplier')) return NODE_TYPES.MERCHANT;
  if (name.toLowerCase().includes('gateway') || name.toLowerCase().includes('settlement') || name.toLowerCase().includes('card')) return NODE_TYPES.MERCHANT;
  return NODE_TYPES.MERCHANT;
};
