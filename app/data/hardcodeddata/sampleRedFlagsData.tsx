// Define interfaces for type safety
export interface RedFlag {
  merchant_id: string;
  rule_code?: string;
  description?: string;
  severity: 'severe' | 'high' | 'medium' | 'low';
  metric_values?: Record<string, number>;
  metric_data_timestamp?: string | null;
  notes?: string | null;
  id: string;
  created_at: string;
  updated_at?: string;
  rule_name?: string;
  rule_description?: string;
  rule_type?: string;
  rule_severity?: string;
  rule_fraud_type?: string;
  importance: number;
  timestamp: string;
  flag_type: string;
  text: string;
  rule?: {
    or: Array<{
      table: string;
      value: number;
      operator: string;
      condition: string;
    }>;
  };
}

export interface RedFlagsDataType {
  flags: RedFlag[];
}

// Sample data
export const redFlagsData: RedFlagsDataType = {
  flags: [
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "90c890f0-9919-42bb-8d64-924da1f27197",
      importance: 4.240477729707695,
      timestamp: "2023-07-15T18:00:37.897936",
      flag_type: "transactions ML",
      severity: "medium",
      text: "No repeat customers",
      created_at: "2023-07-15T18:00:37.899373",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "3fe95ada-6833-42b0-b2eb-9cd56ff1d8f6",
      importance: 4.240477729707695,
      timestamp: "2023-07-05T18:00:37.898139",
      flag_type: "transactions ML",
      severity: "medium",
      text: "Sustained dormancy after initial activity, right after on boarding",
      created_at: "2023-07-05T18:00:37.899394",
    },
    // Legal and Regulatory Flags
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "legal-1",
      importance: 8.5,
      timestamp: "2023-07-20T18:00:37.898528",
      flag_type: "Legal and Regulatory",
      severity: "severe",
      text: "Business license expired for over 90 days",
      created_at: "2023-07-20T18:00:37.899427",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "legal-2",
      importance: 6.2,
      timestamp: "2023-06-10T18:00:37.898528",
      flag_type: "Legal and Regulatory ML",
      severity: "high",
      text: "Multiple regulatory compliance violations detected",
      created_at: "2023-06-10T18:00:37.899427",
    },

    // Network Analysis Flags
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "network-1",
      importance: 7.8,
      timestamp: "2023-06-25T18:00:37.898528",
      flag_type: "Network",
      severity: "high",
      text: "Mobile number on website linked with other high risk merchants",
      created_at: "2023-06-25T18:00:37.899427",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "network-2",
      importance: 5.4,
      timestamp: "2023-06-18T18:00:37.898528",
      flag_type: "Network",
      severity: "medium",
      text: "Onboarding device linked to other entities in Razorpay's database",
      created_at: "2023-06-18T18:00:37.899427",
    },

    // Documentation Flags
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "doc-1",
      importance: 9.1,
      timestamp: "2023-08-05T18:00:37.898528",
      flag_type: "Documentation",
      severity: "severe",
      text: "Bank account name mismatch with the registered entity name (Penny Drop)",
      created_at: "2023-08-05T18:00:37.899427",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "doc-2",
      importance: 9.1,
      timestamp: "2023-08-12T18:00:37.898528",
      flag_type: "Documentation",
      severity: "severe",
      text: "Merchant has no GST registration despite having transactions volume of more than INR 40 Lacs",
      created_at: "2023-08-12T18:00:37.899427",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "doc-3",
      importance: 4.7,
      timestamp: "2023-05-22T18:00:37.898528",
      flag_type: "Documentation ML",
      severity: "medium",
      text: "Potential document manipulation detected",
      created_at: "2023-05-22T18:00:37.899427",
    },

    // Digital Footprint Flags
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "digital-1",
      importance: 6.9,
      timestamp: "2023-05-15T18:00:37.898528",
      flag_type: "DigitallFootprint",
      severity: "high",
      text: "Negative reviews on public platforms mentioning fraud, scam, or fake hotel",
      created_at: "2023-05-15T18:00:37.899427",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "digital-2",
      importance: 6.9,
      timestamp: "2023-05-08T18:00:37.898528",
      flag_type: "DigitallFootprint",
      severity: "high",
      text: "Mis-match in address provided vs address as per website",
      created_at: "2023-05-08T18:00:37.899427",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "dispute-1",
      importance: 3.5,
      timestamp: "2023-04-20T18:00:37.898528",
      flag_type: "Dispute & Complaints ML",
      severity: "low",
      text: "Recently onboarded merchant with high customer complaints",
      created_at: "2023-04-20T18:00:37.899427",
    },
    {
      merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
      id: "chargeback-1",
      importance: 3.5,
      timestamp: new Date().toISOString(),
      flag_type: "Chargeback & Complaints ML",
      severity: "low",
      text: "High number of recent disputes leading to chargebacks",
      created_at: new Date().toISOString(),
    }
  ],
};

// Risk score calculation function
export const RISK_POINTS = {
  'severe': 50,
  'high': 30,
  'medium': 10,
  'low': 5
} as const;

export type SeverityLevel = keyof typeof RISK_POINTS;

export const calculateRiskScore = (flags: RedFlag[]): number => {
  return flags.reduce((totalScore, flag) => {
    const riskPoints = RISK_POINTS[flag.severity as SeverityLevel] || 0;
    return totalScore + riskPoints;
  }, 0);
};

export const marker_positions = [50, 30, 10];

export const getRiskLevel = (riskScore: number): string => {
  if (riskScore >= marker_positions[0]) return 'severe';
  if (riskScore >= marker_positions[1]) return 'high';
  if (riskScore >= marker_positions[2]) return 'medium';
  return 'low';
}
// Usage example:
// const totalRiskScore = calculateRiskScore(redFlagsData.flags);
