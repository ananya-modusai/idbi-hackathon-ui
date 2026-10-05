import { FC, useMemo, useState, useEffect } from 'react';
import { parseEdgeSources } from './EntityGraphUtils';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import { customerService } from '@/app/services/customerServices';
import creditCardSampleMetrics from '@/app/pages/Customer/Components/metricsSampleDataCreditCard';

interface NodeDetailsInlineProps {
  node: any | null;
  data: any[];
  strongConnector?: boolean | null;
}

// Helper function to get location subtype display
const getLocationSubtypeDisplay = (nodeType: string, sourceNodeLabel?: string): string => {
  if (nodeType !== 'LOCATION') {
    return nodeType.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  // For LOCATION nodes, determine if it's Address or Geolocation
  if (sourceNodeLabel) {
    const labelLower = sourceNodeLabel.toLowerCase();
    if (labelLower.includes('geo') || labelLower.includes('location')) {
      return 'Geolocation';
    }
  }
  return 'Address';
};



// Helper function to format date to DD-MM-YYYY format
const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (e) {
    return String(dateValue);
  }
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (text: string): string => {
  if (!text) return '';
  // Don't capitalize if it's purely numeric or contains currency symbols
  if (/^[\d\s,.\-₹$€£¥]+$/.test(text.trim())) {
    return text;
  }
  // Replace underscores with spaces for display (e.g. Bank_account -> Bank account)
  text = text.replace(/_/g, ' ');
  return text
    .split(' ')
    .map(word => {
      if (!word) return word;
      // Preserve numbers and special characters
      if (/^[\d\s,.\-₹$€£¥]+$/.test(word)) {
        return word;
      }
      // Convert "sms" to "SMS" (case-insensitive)
      if (word.toLowerCase() === 'sms') {
        return 'SMS';
      }
      // Handle "sms_" prefix (e.g., "sms_counterparty" -> "SMS Counterparty")
      if (word.toLowerCase().startsWith('sms_')) {
        return 'SMS' + word.substring(3).replace(/_/g, ' ');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Helper to format property values: if value is JSON (string or object),
// try to extract a readable 'type' or list of types instead of dumping full JSON.
const formatPropertyValue = (value: any, key?: string): string => {
  if (value === null || value === undefined) return '';

  // Format onboarded_at dates to DD-MM-YYYY
  if (key && key.toLowerCase() === 'onboarded_at') {
    return formatDate(value);
  }

  // Special-case mapping for source field: if backend sends 'bank_transaction'
  // (in any shape: string, object, array, or stringified JSON), show it as 'sms'.
  // If there are multiple types including bank_transaction, show 'sms' and other types.
  if (key && key.toLowerCase() === 'source') {
    return parseEdgeSources(value, typeof value === 'string' ? value : undefined);
  }

  // Determine if we should preserve original casing for this key.
  // Show raw API value for keys that are types/values (e.g., 'type', 'value', 'gov_id_type', 'gov_id_value', 'id_type', 'id_value')
  const preserveCase = Boolean(key && /(^|_)type$|(^|_)value$|gov_id_type|gov_id_value|id_type|id_value/i.test(key));

  // If it's already an object/array, handle directly
  const extract = (v: any): string => {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) {
      const parts = v.map((el) => {
        if (el && typeof el === 'object') return el.type || JSON.stringify(el);
        return String(el);
      }).filter(Boolean);
      const result = parts.join(', ');
      // Either preserve original API casing or normalize for display
      return preserveCase ? result : capitalizeWords(result);
    }
    if (typeof v === 'object') {
      const result = v.type || JSON.stringify(v);
      return preserveCase ? String(result) : capitalizeWords(String(result));
    }
    // Preserve casing for raw value keys
    return preserveCase ? String(v) : capitalizeWords(String(v));
  };

  // If it's a string that looks like JSON, try parsing
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return extract(parsed);
      } catch (e) {
        // fallthrough to return raw string
      }
    }
  }

  return extract(value);
};

// Helper function to get risk info from risk_indicator API field
const getRiskFromIndicator = (riskIndicator: string | null | undefined): { label: string; color: 'green' | 'yellow' | 'red' | 'gray' } => {
  if (!riskIndicator || riskIndicator === '') {
    return { label: 'UNKNOWN RISK', color: 'gray' };
  }
  
  const risk = String(riskIndicator).trim();
  
  // Map risk indicator to label and color (same color mapping as before)
  if (risk.toLowerCase().includes('low')) {
    return { label: risk, color: 'green' };
  } else if (risk.toLowerCase().includes('medium') || risk.toLowerCase().includes('moderate')) {
    return { label: risk, color: 'yellow' };
  } else if (risk.toLowerCase().includes('high')) {
    return { label: risk, color: 'red' };
  }
  
  return { label: risk, color: 'gray' };
};

// Helper to determine connector type (weak/strong) from a link object
const parseConnectorType = (link: any): { raw?: string; normalized?: 'weak' | 'strong' | null } => {
  if (!link) return { raw: undefined, normalized: 'strong' };
  
  // Consider only connection_type from the API (do not consider edge_type)
  const candidates = [
    link.edgeProperties?.connection_type,
    link.connection_type,
    link.edgeProperties?.connectionType,
    link.connectionType
  ];

  for (const c of candidates) {
    if (!c && c !== '') continue;
    const s = String(c).toLowerCase().trim();
    if (s === 'weak_connector' || s === 'weak_connection' || s === 'weak' || s === 'weakconnector') {
      return { raw: String(c), normalized: 'weak' };
    }
    // Any other explicit connection_type is treated as strong
    return { raw: String(c), normalized: 'strong' };
  }
  
  // If the API did not provide any explicit connection_type info, treat it as a strong connector
  return { raw: undefined, normalized: 'strong' };
};

// Helper to parse the edge 'data' field (which may be a stringified JSON array/object or already an object)
const parseEdgeDataFromLink = (link: any): any[] | null => {
  if (!link) return null;
  // Try multiple possible locations for the data field
  const candidates = [link.edgeProperties?.data, link.properties?.data, link.data, link.edgeProperties, link.properties];
  let raw: any = undefined;
  for (const c of candidates) {
    if (c !== undefined && c !== null) {
      raw = c;
      break;
    }
  }
  if (raw === undefined || raw === null) return null;

  // If raw looks like the whole edgeProperties object, prefer its .data field
  if (typeof raw === 'object' && raw.data !== undefined && raw.data !== null) {
    raw = raw.data;
  }

  const normalizeEntry = (entry: any): any => {
    if (entry === null || entry === undefined) return null;
    if (typeof entry === 'string') {
      const t = entry.trim();
      // Try parse JSON string
      if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        try {
          const p = JSON.parse(t);
          return p;
        } catch (e) {
          return t;
        }
      }
      return t;
    }
    return entry;
  };

  // If string that looks like JSON array/object, parse it
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(normalizeEntry).filter(Boolean);
      const single = normalizeEntry(parsed);
      return single ? [single] : null;
    } catch (e) {
      // Not JSON - return as single-string entry
      return [trimmed];
    }
  }

  // If already an array, normalize and return
  if (Array.isArray(raw)) {
    return raw.map(normalizeEntry).filter(Boolean);
  }

  // If object, return as single-element array
  if (typeof raw === 'object') return [raw];

  // Other types - wrap as single entry
  return [raw];
};

// Component to fetch and display customer card details
const CustomerCard: FC<{ connection: any }> = ({ connection }) => {
  // Extract userid from connection properties - for second-degree connections,
  // prioritize the connected node's userid over the first-degree customer
  const userid = connection.connectedNodeProperties?.userid || connection.linkedCustomerId;
  
  // Get customer name from connection properties (not from API)
  const customerName = connection.connectedNodeProperties?.name || 
                       connection.connectedNodeProperties?.customer_name || 
                       connection.connectedNodeProperties?.basic_details_name || 
                       connection.connectedNode || 
                       'Unknown';
  
  // Get risk indicator from connection properties (from customer-graph API)
  const riskIndicator = connection.connectedNodeProperties?.risk_indicator || 
                        connection.connectedNodeProperties?.riskIndicator ||
                        connection.connectedNodeProperties?.risk_level ||
                        connection.connectedNodeProperties?.riskLevel;
  const riskInfo = getRiskFromIndicator(riskIndicator);
  // Determine connector type for this connection (weak/strong)
  const connector = parseConnectorType(connection);
  // connector.normalized defaults to 'strong' per parseConnectorType logic
  const connectorLabel = connector.normalized === 'weak' ? 'Weak Connector' : '';
  const connectorColor = connector.normalized === 'weak' ? 'orange' : 'green';

  return (
    <div className="flex items-center justify-between w-full">
      <span className="font-medium text-blue-700">
        {customerName}{userid ? ` (CID ${userid})` : ''}
      </span>
      <div className="flex items-center gap-1">
        {riskIndicator && (
          <BubbleTag 
            text={riskInfo.label} 
            color={riskInfo.color}
          />
        )}
        {connectorLabel && (
          <BubbleTag text={connectorLabel} color={connectorColor as any} />
        )}
      </div>
    </div>
  );
};

// Helper function to format label text by replacing underscores with spaces
const formatLabelText = (text: string): string => {
  return text.replace(/_/g, ' ');
};

// Helper: search nested objects/arrays (and stringified JSON) for a key and return its first found value
const findDeepKey = (obj: any, keyName: string): any => {
  if (obj === null || obj === undefined) return undefined;
  try {
    // If it's a string that looks like JSON, parse it and search inside
    if (typeof obj === 'string') {
      const t = obj.trim();
      if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        try {
          const parsed = JSON.parse(t);
          return findDeepKey(parsed, keyName);
        } catch (e) {
          // not JSON - fallthrough
        }
      }
      return undefined;
    }

    if (Array.isArray(obj)) {
      for (const el of obj) {
        const v = findDeepKey(el, keyName);
        if (v !== undefined) return v;
      }
      return undefined;
    }

    if (typeof obj === 'object') {
      if (Object.prototype.hasOwnProperty.call(obj, keyName)) return obj[keyName];
      for (const k of Object.keys(obj)) {
        const v = findDeepKey(obj[k], keyName);
        if (v !== undefined) return v;
      }
    }
  } catch (e) {
    // ignore and return undefined
  }
  return undefined;
};

// Helper function to capitalize first letter of each word in a label
const capitalizeLabel = (text: string): string => {
  // Special handling for "Degreetohighriskcustomer" -> "Degrees To High Risk Customer"
  const lowerText = text.toLowerCase().trim();
  if (lowerText.includes('degreetohighriskcustomer') || 
      lowerText === 'degree_to_high_risk_customer' || 
      lowerText === 'degreetohighriskcustomer' ||
      lowerText === 'degreetohighriskcustomer') {
    return 'Degrees To High Risk Customer';
  }
  
  // Handle camelCase by inserting spaces before capital letters
  let processedText = text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space before capital letters in camelCase
    .replace(/_/g, ' '); // Replace underscores with spaces
  
  return processedText
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to format node label based on API response format
const formatNodeLabel = (node: any): string => {
  if (!node) return '';
  const typeRaw = String(node.type || node?.label || node?.properties?.type || '').toUpperCase();
  const props = node.properties || {};

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (props[k] !== undefined && props[k] !== null && props[k] !== '') return String(props[k]);
      if ((node as any)[k] !== undefined && (node as any)[k] !== null && (node as any)[k] !== '') return String((node as any)[k]);
    }
    return '';
  };

  // CUSTOMER: show customer_name(userid) without label
  if (typeRaw.includes('CUSTOMER') || typeRaw.includes('PERSON')) {
    const customerName = pick('customer_name', 'name', 'basic_details_name') || '';
    const userid = pick('userid', 'user_id') || '';
    if (customerName && userid) return `${customerName} (CID ${userid})`;
    if (customerName) return customerName;
    if (userid) return `(CID ${userid})`;
    return '';
  }

  // PHONE: show phone_number
  if (typeRaw.includes('PHONE')) {
    const phoneNumber = pick('phone_number', 'telephone', 'telephone_number', 'number') || '';
    if (phoneNumber) return `${formatLabelText('PHONE')} (${phoneNumber})`;
    return formatLabelText('PHONE');
  }

  // DEVICE: show device_id
  if (typeRaw.includes('DEVICE')) {
    const deviceId = pick('device_id', 'deviceId', 'id') || '';
    if (deviceId) return `${formatLabelText('DEVICE')} (${deviceId})`;
    return formatLabelText('DEVICE');
  }

  // EMAIL: show email
  if (typeRaw.includes('EMAIL')) {
    const email = pick('email', 'email_address', 'address') || '';
    if (email) return `${formatLabelText('EMAIL')} (${email})`;
    return formatLabelText('EMAIL');
  }

  // BANK_ACCOUNT: show account_no
  if (typeRaw.includes('BANK_ACCOUNT')) {
    const accountNo = pick('account_no', 'account_number') || '';
    if (accountNo) return `${formatLabelText('BANK_ACCOUNT')} (${accountNo})`;
    return formatLabelText('BANK_ACCOUNT');
  }

  // UPI_ID: show upi_id
  if (typeRaw.includes('UPI_ID') || typeRaw.includes('UPI')) {
    const upiId = pick('upi_id', 'upi_vpa', 'vpa') || '';
    if (upiId) return `${formatLabelText('UPI_ID')} (${upiId})`;
    return formatLabelText('UPI_ID');
  }

  // LOCATION / GEOLOCATION / ADDRESS: show city
  if (typeRaw.includes('GEOLOCATION') || typeRaw.includes('LOCATION') || typeRaw.includes('ADDRESS')) {
    const city = pick('city', 'address_city', 'city_name', 'locality', 'town') || '';
    if (city) return `${formatLabelText('LOCATION')} (${city})`;
    return formatLabelText('LOCATION');
  }

  // GOV_ID: show gov_id_type(gov_id_value) without label prefix
  if (typeRaw.includes('GOV_ID') || typeRaw.includes('GOVID')) {
    // Try direct properties first
    let govIdType = pick('gov_id_type', 'id_type') || '';
    let govIdValue = pick('gov_id_value', 'id_value', 'value') || '';

    // If not found, search nested structures (e.g., props.data is an array or stringified JSON)
    if (!govIdType) {
      govIdType = String(findDeepKey(props, 'gov_id_type') || findDeepKey(node, 'gov_id_type') || '').trim();
    }
    if (!govIdValue) {
      govIdValue = String(findDeepKey(props, 'gov_id_value') || findDeepKey(props, 'value') || findDeepKey(node, 'gov_id_value') || findDeepKey(node, 'value') || '').trim();
    }

    // If govIdType or govIdValue are the literal strings 'null' or 'undefined', treat as missing
    if (govIdType && (govIdType.toLowerCase() === 'null' || govIdType.toLowerCase() === 'undefined')) govIdType = '';
    if (govIdValue && (govIdValue.toLowerCase() === 'null' || govIdValue.toLowerCase() === 'undefined')) govIdValue = '';

    if (govIdType && govIdValue) return `${govIdType}(${govIdValue})`;
    if (govIdValue) return govIdValue;
    if (govIdType) return `${govIdType}`;
    return formatLabelText('GOV_ID');
  }

  // Fallback: show label with value if available
  const genericVal = pick('value', 'label', 'name') || node.name || '';
  if (genericVal) return `${formatLabelText(typeRaw)} (${genericVal})`;

  return formatLabelText(typeRaw);
};

// Inline Node Details Component
export const NodeDetailsInline: FC<NodeDetailsInlineProps> = ({ node, data, strongConnector }) => {
  // State for loan amount and credit behaviour metrics (only for CUSTOMER nodes)
  const [loanAmount, setLoanAmount] = useState<number | null>(null);
  const [creditBehaviourMetrics, setCreditBehaviourMetrics] = useState<{
    minBankBalance: number | null;
    maxBankBalance: number | null;
    creditReportPulls: number | null;
    emiConversions: number | null;
    loansDisbursalsBeforeEmi: number | null;
    loanDisbursals: number | null;
    loanApprovals: number | null;
    emiBounces: number | null;
    ccApplications: number | null;
  } | null>(null);

  // Extract userid from node properties for CUSTOMER nodes
  const customerUserId = useMemo(() => {
    if (node?.type === 'CUSTOMER') {
      const nodeProperties = (() => {
        if (!node || !data || data.length === 0) return null;
        const link = data.find((l: any) => 
          (l.source === node.id || l.target === node.id)
        );
        if (link) {
          if (link.source === node.id && link.sourceNode) {
            return link.sourceNode.properties || {};
          } else if (link.target === node.id && link.targetNode) {
            return link.targetNode.properties || {};
          }
        }
        return node.properties || {};
      })();
      return nodeProperties?.userid || nodeProperties?.user_id || null;
    }
    return null;
  }, [node, data]);

  // Fetch loans data for CUSTOMER nodes
  useEffect(() => {
    if (node?.type === 'CUSTOMER' && customerUserId) {
      let mounted = true;
      (async () => {
        try {
          const loanResp = await customerService.getCustomerLoans(customerUserId);
          if (!mounted) return;
          if (loanResp) {
            const rawLoans = loanResp.loans ?? loanResp ?? [];
            const totalLoanAmount = Array.isArray(rawLoans) 
              ? rawLoans.reduce((sum: number, l: any) => {
                  const amount = Number(l.loan_amount ?? l.loanAmount ?? 0);
                  return sum + (isNaN(amount) ? 0 : amount);
                }, 0)
              : 0;
            setLoanAmount(totalLoanAmount);
          } else {
            setLoanAmount(null);
          }
        } catch (error) {
          console.error('[NodeDetails] Error fetching loans:', error);
          if (mounted) setLoanAmount(null);
        }
      })();
      return () => { mounted = false; };
    } else {
      setLoanAmount(null);
    }
  }, [node?.type, customerUserId]);

  // Fetch metrics activity data for credit behaviour metrics
  useEffect(() => {
    if (node?.type === 'CUSTOMER' && customerUserId) {
      let mounted = true;
      (async () => {
        try {
          // Fetch both metrics activity (for bank balance) and monthly credit behaviour (for loan/EMI metrics)
          const [metricsData, creditBehaviourData] = await Promise.all([
            customerService.getCustomerMetricsActivity(customerUserId),
            customerService.getCustomerMetricsMonthly('credit_behaviour', customerUserId)
          ]);
          
          if (!mounted) return;

          // Process metrics activity data for bank balance
          let minBankBalance: number | null = null;
          let maxBankBalance: number | null = null;
          
          if (metricsData) {
            // Determine latest year from bank_activity / credit_card_activity / summary_table
            const yearsFound: number[] = [];
            const pushYearFromPeriod = (period?: string) => {
              if (!period) return;
              const match = period.match(/^(\d{4})-(\d{2})$/);
              if (match) yearsFound.push(Number(match[1]));
            };

            (Array.isArray(metricsData.bank_activity) ? metricsData.bank_activity : []).forEach((b: any) => pushYearFromPeriod(b.period));
            (Array.isArray(metricsData.credit_card_activity) ? metricsData.credit_card_activity : []).forEach((c: any) => pushYearFromPeriod(c.period));
            (Array.isArray(metricsData.summary_table) ? metricsData.summary_table : []).forEach((s: any) => (s.values || []).forEach((v: any) => pushYearFromPeriod(v.period)));

            let latestYear: number | null = null;
            if (yearsFound.length) latestYear = yearsFound.reduce((a, b) => Math.max(a, b), yearsFound[0]);
            if (latestYear === null) latestYear = new Date().getFullYear();

            // Target months: April to September (4-9)
            const targetMonths = [4, 5, 6, 7, 8, 9];
            const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            const targetPeriodStrings = targetMonths.map(m => `${latestYear}-${pad(m)}`);

            // Extract values from summary_table
            const summaryTable = Array.isArray(metricsData.summary_table) ? metricsData.summary_table : [];
            
            // Helper to get values for a particular row across target periods
            const getValuesForParticular = (searchTerms: string[]): (number | null)[] => {
              const row = summaryTable.find((r: any) => {
                const part = String(r.particular || '').toLowerCase();
                return searchTerms.some(term => part.includes(term.toLowerCase()));
              });
              if (!row || !Array.isArray(row.values)) return targetPeriodStrings.map(() => null);
              
              const valuesByPeriod: Record<string, number | null> = {};
              row.values.forEach((v: any) => {
                if (v && v.period && targetPeriodStrings.includes(v.period)) {
                  const numValue = Number(v.value);
                  valuesByPeriod[v.period] = isNaN(numValue) ? null : numValue;
                }
              });
              
              return targetPeriodStrings.map(p => valuesByPeriod[p] ?? null);
            };

            // Get bank balance values (from summary_table or calculate from bank_activity)
            // Try to get from summary_table first
            const minBalanceValues = getValuesForParticular(['minimum bank balance', 'min bank balance', 'minimum balance']);
            const maxBalanceValues = getValuesForParticular(['maximum bank balance', 'max bank balance', 'maximum balance']);
            
            if (minBalanceValues.some(v => v !== null)) {
              const validValues = minBalanceValues.filter(v => v !== null) as number[];
              if (validValues.length > 0) {
                minBankBalance = Math.min(...validValues);
              }
            }
            
            if (maxBalanceValues.some(v => v !== null)) {
              const validValues = maxBalanceValues.filter(v => v !== null) as number[];
              if (validValues.length > 0) {
                maxBankBalance = Math.max(...validValues);
              }
            }
            
            // If not found in summary_table, try to calculate from bank_activity net values
            if (minBankBalance === null || maxBankBalance === null) {
              const bankActivity = Array.isArray(metricsData.bank_activity) ? metricsData.bank_activity : [];
              const bankNetValues: number[] = [];
              
              bankActivity.forEach((b: any) => {
                if (b && b.period && targetPeriodStrings.includes(b.period)) {
                  const net = Number(b.net ?? 0);
                  if (!isNaN(net)) {
                    bankNetValues.push(net);
                  }
                }
              });
              
              if (bankNetValues.length > 0) {
                if (minBankBalance === null) {
                  minBankBalance = Math.min(...bankNetValues);
                }
                if (maxBankBalance === null) {
                  maxBankBalance = Math.max(...bankNetValues);
                }
              }
            }
          }

          // Process credit behaviour monthly data (same logic as CustomerMetricsTab)
          let creditReportPulls: number | null = null;
          let emiConversions: number | null = null;
          let loansDisbursalsBeforeEmi: number | null = null;
          let loanDisbursals: number | null = null;
          let loanApprovals: number | null = null;
          let emiBounces: number | null = null;
          let ccApplications: number | null = null;

          if (creditBehaviourData) {
            const payload = creditBehaviourData ?? null;
            const results = Array.isArray(payload?.results) ? payload.results : [];

            // Debug: log API response
            console.log('[NodeDetails] Credit Behaviour API Response:', {
              payload,
              resultsCount: results.length,
              results: results.map((r: any) => ({
                metric: r.metric,
                dataCount: (r.data || []).length,
                dataSample: (r.data || []).slice(0, 2)
              }))
            });

            // Normalize function to match metric names (same as CustomerMetricsTab)
            const normalize = (s: string) => (s || '').toString().replace(/[_\-\s]/g, '').toLowerCase();

            // Determine latest year across all metric points
            let latestYear: number | null = null;
            results.forEach((r: any) => {
              const pts = Array.isArray(r.data) ? r.data : [];
              pts.forEach((p: any) => {
                const dateStr = p.month ?? p.financials_date ?? (p.financialsDate as any) ?? null;
                const d = dateStr ? new Date(dateStr) : new Date(NaN);
                if (!Number.isFinite(d.getTime())) return;
                const y = d.getFullYear();
                if (latestYear === null || y > latestYear) latestYear = y;
              });
            });
            if (latestYear === null) latestYear = new Date().getFullYear();

            const targetMonths = [4, 5, 6, 7, 8, 9]; // Apr..Sep

            // Helper function to get metric values using the same matching logic as CustomerMetricsTab
            const getMetricValueForSampleMetric = (sampleMetric: any): (number | null)[] => {
              const smNorm = normalize(sampleMetric.id);
              const smNameNorm = normalize(sampleMetric.name);
              
              // Find all potential matches and sort by specificity (longest match first) - same as CustomerMetricsTab
              const potentialMatches = results
                .map((r: any) => {
                  const kNorm = normalize(r.metric || '');
                  let matchScore = 0;
                  
                  // Exact match (highest priority)
                  if (kNorm === smNorm) matchScore = 1000;
                  // Longer substring match (more specific)
                  else if (kNorm.includes(smNorm)) matchScore = Math.max(smNorm.length, 100);
                  else if (smNorm.includes(kNorm)) matchScore = Math.max(kNorm.length, 100);
                  // Name-based matching (lower priority)
                  else if (kNorm.includes(smNameNorm)) matchScore = Math.max(smNameNorm.length, 50);
                  else if (smNameNorm.includes(kNorm)) matchScore = Math.max(kNorm.length, 50);
                  
                  return { entry: r, matchScore };
                })
                .filter((m: any) => m.matchScore > 0)
                .sort((a: any, b: any) => b.matchScore - a.matchScore);
              
              const matchedEntry = potentialMatches.length > 0 ? potentialMatches[0].entry : null;

              // Debug logging for credit_report_pulls and emi_conversions
              if (sampleMetric.id === 'credit_report_pulls' || sampleMetric.id === 'emi_conversions') {
                console.log(`[NodeDetails] Matching for ${sampleMetric.id}:`, {
                  sampleId: sampleMetric.id,
                  sampleName: sampleMetric.name,
                  smNorm,
                  smNameNorm,
                  apiMetrics: results.map((r: any) => ({ 
                    metric: r.metric, 
                    normalized: normalize(r.metric || ''), 
                    dataCount: (r.data || []).length 
                  })),
                  potentialMatches: potentialMatches.map((m: any) => ({ 
                    metric: m.entry.metric, 
                    score: m.matchScore 
                  })),
                  matchedEntry: matchedEntry ? { 
                    metric: matchedEntry.metric, 
                    dataCount: matchedEntry.data?.length,
                    dataSample: matchedEntry.data?.slice(0, 3)
                  } : 'NO MATCH'
                });
              }

              if (!matchedEntry || !Array.isArray(matchedEntry.data)) {
                return targetMonths.map(() => null);
              }

              // Build map of monthNumber -> numeric value for the latestYear
              const monthMap: Record<number, number | null> = {};
              matchedEntry.data.forEach((p: any) => {
                // Accept either `month` (legacy) or `financials_date` (newer API) fields
                const dateStr = p.month ?? p.financials_date ?? (p.financialsDate as any) ?? null;
                const d = dateStr ? new Date(dateStr) : new Date(NaN);
                if (!Number.isFinite(d.getTime())) return;
                const y = d.getFullYear();
                const m = d.getMonth() + 1; // 1..12
                if (y === latestYear) {
                  const v = p.metric_value;
                  if (v === null || v === undefined || v === '') {
                    monthMap[m] = null;
                  } else {
                    const n = Number(v);
                    monthMap[m] = Number.isFinite(n) ? n : null;
                  }
                }
              });

              return targetMonths.map(m => (monthMap.hasOwnProperty(m) ? monthMap[m] : null));
            };

            // Extract values for each metric using creditCardSampleMetrics as canonical source (same as CustomerMetricsTab)
            // Process all metrics from creditCardSampleMetrics to ensure we match correctly
            const creditReportSample = creditCardSampleMetrics.find((sm: any) => sm.id === 'credit_report_pulls');
            if (creditReportSample) {
              const creditReportValues = getMetricValueForSampleMetric(creditReportSample);
              const creditReportPullsSum = creditReportValues.reduce((sum: number, v) => sum + (v ?? 0), 0);
              // Show if we have any non-null values (including zeros)
              // If all values are null, don't show; if any value exists (even 0), show the sum
              const hasAnyValue = creditReportValues.some(v => v !== null && v !== undefined);
              // If we have any value (including 0), set it; otherwise null
              creditReportPulls = hasAnyValue ? creditReportPullsSum : null;
              
              // Debug logging
              console.log('[NodeDetails] credit_report_pulls:', {
                sampleId: creditReportSample.id,
                sampleName: creditReportSample.name,
                values: creditReportValues,
                hasAnyValue,
                sum: creditReportPullsSum,
                finalValue: creditReportPulls
              });
            } else {
              console.warn('[NodeDetails] credit_report_pulls sample metric not found in creditCardSampleMetrics');
            }

            const emiConversionSample = creditCardSampleMetrics.find((sm: any) => sm.id === 'emi_conversions');
            if (emiConversionSample) {
              const emiConversionValues = getMetricValueForSampleMetric(emiConversionSample);
              const emiConversionsSum = emiConversionValues.reduce((sum: number, v) => sum + (v ?? 0), 0);
              // Show if we have any non-null values (including zeros)
              const hasAnyValue = emiConversionValues.some(v => v !== null && v !== undefined);
              emiConversions = hasAnyValue ? emiConversionsSum : null;
              
              // Debug logging
              console.log('[NodeDetails] emi_conversions:', {
                sampleId: emiConversionSample.id,
                sampleName: emiConversionSample.name,
                values: emiConversionValues,
                hasAnyValue,
                sum: emiConversionsSum,
                finalValue: emiConversions
              });
            } else {
              console.warn('[NodeDetails] emi_conversions sample metric not found in creditCardSampleMetrics');
            }

            const loansBeforeEmiSample = creditCardSampleMetrics.find((sm: any) => sm.id === 'loan_disbursals_before_emi');
            if (loansBeforeEmiSample) {
              const loansBeforeEmiValues = getMetricValueForSampleMetric(loansBeforeEmiSample);
              const loansDisbursalsBeforeEmiSum = loansBeforeEmiValues.reduce((sum: number, v) => sum + (v ?? 0), 0);
              loansDisbursalsBeforeEmi = loansBeforeEmiValues.some(v => v !== null) ? loansDisbursalsBeforeEmiSum : null;
            }

            const loanDisbursalSample = creditCardSampleMetrics.find((sm: any) => sm.id === 'loan_disbursals');
            if (loanDisbursalSample) {
              const loanDisbursalValues = getMetricValueForSampleMetric(loanDisbursalSample);
              const loanDisbursalsSum = loanDisbursalValues.reduce((sum: number, v) => sum + (v ?? 0), 0);
              loanDisbursals = loanDisbursalValues.some(v => v !== null) ? loanDisbursalsSum : null;
            }

            const loanApprovalSample = creditCardSampleMetrics.find((sm: any) => sm.id === 'loan_approvals');
            if (loanApprovalSample) {
              const loanApprovalValues = getMetricValueForSampleMetric(loanApprovalSample);
              const loanApprovalsSum = loanApprovalValues.reduce((sum: number, v) => sum + (v ?? 0), 0);
              loanApprovals = loanApprovalValues.some(v => v !== null) ? loanApprovalsSum : null;
            }

            const emiBounceSample = creditCardSampleMetrics.find((sm: any) => sm.id === 'emi_bounces');
            if (emiBounceSample) {
              const emiBounceValues = getMetricValueForSampleMetric(emiBounceSample);
              const emiBouncesSum = emiBounceValues.reduce((sum: number, v) => sum + (v ?? 0), 0);
              // Show if we have any non-null values (including zeros)
              const hasAnyValue = emiBounceValues.some(v => v !== null && v !== undefined);
              // If we have any value (including 0), set it; otherwise null
              emiBounces = hasAnyValue ? emiBouncesSum : null;
            }

            const ccApplicationsSample = creditCardSampleMetrics.find((sm: any) => sm.id === 'cc_applications');
            if (ccApplicationsSample) {
              const ccApplicationsValues = getMetricValueForSampleMetric(ccApplicationsSample);
              const ccApplicationsSum = ccApplicationsValues.reduce((sum: number, v) => sum + (v ?? 0), 0);
              const hasAnyValue = ccApplicationsValues.some(v => v !== null && v !== undefined);
              ccApplications = hasAnyValue ? ccApplicationsSum : null;
            }
          }

          setCreditBehaviourMetrics({
            minBankBalance,
            maxBankBalance,
            creditReportPulls,
            emiConversions,
            loansDisbursalsBeforeEmi,
            loanDisbursals,
            loanApprovals,
            emiBounces,
            ccApplications,
          });
        } catch (error) {
          console.error('[NodeDetails] Error fetching credit behaviour metrics:', error);
          if (mounted) setCreditBehaviourMetrics(null);
        }
      })();
      return () => { mounted = false; };
    } else {
      setCreditBehaviourMetrics(null);
    }
  }, [node?.type, customerUserId]);

  const connections = useMemo(() => {
    if (!node) return [];

    // Match by node ID (not name) since data uses source/target IDs
    let result = data.filter((link: any) =>
      link.source === node.id || link.target === node.id ||
      link.source === node.name || link.target === node.name
    ).map((link: any) => {
      const isOutgoing = link.source === node.id || link.source === node.name;
      const connectedNodeObj = isOutgoing ? link.targetNode : link.sourceNode;
      const sourceNodeName = link.sourceName || link.source;
      const targetNodeName = link.targetName || link.target;
      const connectedNodeType = connectedNodeObj?.type || (isOutgoing ? 'UNKNOWN' : 'UNKNOWN');
      const connectedNodeProperties = connectedNodeObj?.properties || {};
      
      return {
        ...link,
        connectedNode: isOutgoing ? targetNodeName : sourceNodeName,
        sourceNode: sourceNodeName,
        targetNode: targetNodeName,
        connectedNodeType: connectedNodeType,
        connectedNodeProperties: connectedNodeProperties,
        direction: isOutgoing ? 'outgoing' : 'incoming'
      };
    });

    // Apply Strong Connector filter for connections when enabled
    if (strongConnector === true) {
      result = result.filter((item: any) => {
        const type = item.edgeProperties?.connection_type || 'strong_connector';
        return type !== 'weak_connector';
      });
    }

    return result;
  }, [node, data, strongConnector]);

  // Compute "% of default" for non-CUSTOMER nodes.
  // Numerator: unique customers linked to this node that are high-risk.
  // Denominator: total unique customers linked to this node.
  // Uses the already-filtered `data` (via `connections`) so it respects active filters.
  const percentOfDefault = useMemo(() => {
    // Collect only customer/person connections
    const customerConns = connections.filter((c: any) => /customer|person/i.test(String(c.connectedNodeType || '')));

    const customerMap = new Map<string, { high: boolean }>();

    customerConns.forEach((c: any) => {
      const props = c.connectedNodeProperties || {};
      // Prefer stable ids from properties, fallback to connectedNode label
      const id = String(props.userid || props.user_id || props.userId || props.id || c.connectedNode || '').trim();
      if (!id) return;
      if (!customerMap.has(id)) customerMap.set(id, { high: false });

      const riskVal = props.risk_indicator || props.riskIndicator || props.risk_level || props.riskLevel || null;
      const riskInfo = getRiskFromIndicator(riskVal);
      if (riskInfo.color === 'red') {
        customerMap.set(id, { high: true });
      }
    });

    const denominator = customerMap.size;
    let numerator = 0;
    for (const v of customerMap.values()) if (v.high) numerator++;

    const ratio = denominator > 0 ? ((((numerator / denominator))) * 100).toFixed(2) + '%' : null; // one decimal

    return { numerator, denominator, ratio };
  }, [connections]);

  // Extract node properties from the data links
  // IMPORTANT: This must be called BEFORE any early returns to comply with Rules of Hooks
  const nodeProperties = useMemo(() => {
    if (!node || !data || data.length === 0) return null;
    
    // Find a link that contains this node to get its full properties
    const link = data.find((l: any) => 
      (l.source === node.id || l.target === node.id)
    );
    
    if (link) {
      // Return source or target node properties
      if (link.source === node.id && link.sourceNode) {
        return link.sourceNode.properties || {};
      } else if (link.target === node.id && link.targetNode) {
        return link.targetNode.properties || {};
      }
    }
    return node.properties || {};
  }, [node, data]);

  // Check if the node has a weak_connector connection type
  const isWeakConnector = useMemo(() => {
    if (!node || !data || data.length === 0) return false;
    
    // Find a link that contains this node to get its edge properties
    const link = data.find((l: any) => 
      (l.source === node.id || l.target === node.id)
    );
    
    if (link && link.edgeProperties) {
      // Use parseConnectorType which handles multiple possible API fields and variants
      const p = parseConnectorType(link);
      return p.normalized === 'weak';
    }
    return false;
  }, [node, data]);

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Select a node to view details</p>
      </div>
    );
  }

  // Create a node object with properties for formatting the header label
  const nodeWithProps = {
    ...node,
    properties: nodeProperties || node.properties || {}
  };
  const formattedLabel = formatNodeLabel(nodeWithProps);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h4 className="text-lg font-semibold mb-4">{formattedLabel}</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">Node Type</p>
              <BubbleTag text={getLocationSubtypeDisplay(node.type, node.label)} color="blue" />
                {(() => {
                  // Representative link for this node
                  const rep = data.find((l: any) => l.source === node.id || l.target === node.id || l.source === node.name || l.target === node.name);
                  const parsed = parseConnectorType(rep);
                  const isCustomerNode = node.type === 'CUSTOMER' || node.label === 'CUSTOMER' || node.type?.toLowerCase().includes('customer') || node.type?.toLowerCase().includes('person');
                  if (parsed.normalized === 'weak' && !isCustomerNode) return <BubbleTag text="Weak Connector" color="orange" />;
                  return null;
                })()}
            </div>
          </div>
          
          {/* Display node properties */}
          {nodeProperties && Object.keys(nodeProperties).length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {/* For CUSTOMER nodes, show name and userid at top with risk bubble tag (above Properties header) */}
              {node.type === 'CUSTOMER' && (() => {
                const customerName = nodeProperties.name || nodeProperties.customer_name || nodeProperties.basic_details_name || '';
                const userid = nodeProperties.userid || nodeProperties.user_id || '';
                const riskIndicator = nodeProperties.risk_indicator || nodeProperties.riskIndicator || nodeProperties.risk_level || nodeProperties.riskLevel;
                const riskInfo = getRiskFromIndicator(riskIndicator);
                
                // Get degree connection info from connections (same logic as EntityGraph)
                let degreeText = '';
                let degreeColor: 'green' | 'yellow' | 'red' | 'gray' | 'orange' = 'gray';
                
                // Helper to convert degree to ordinal (first -> 1st, second -> 2nd, etc.)
                const convertDegreeToOrdinal = (degree?: string): string => {
                  if (!degree) return '';
                  
                  const degreeLower = String(degree).toLowerCase().trim();
                  
                  // Handle ordinal names
                  if (degreeLower.includes('first')) return '1st';
                  if (degreeLower.includes('second')) return '2nd';
                  if (degreeLower.includes('third')) return '3rd';
                  if (degreeLower.includes('fourth')) return '4th';
                  if (degreeLower.includes('fifth')) return '5th';
                  if (degreeLower.includes('sixth')) return '6th';
                  if (degreeLower.includes('seventh')) return '7th';
                  if (degreeLower.includes('eighth')) return '8th';
                  if (degreeLower.includes('ninth')) return '9th';
                  if (degreeLower.includes('tenth')) return '10th';
                  
                  // Handle numeric degrees and already-formatted ordinals
                  const degreeNum = parseInt(degreeLower, 10);
                  if (!isNaN(degreeNum)) {
                    if (degreeNum % 100 === 11 || degreeNum % 100 === 12 || degreeNum % 100 === 13) {
                      return `${degreeNum}th`;
                    }
                    const lastDigit = degreeNum % 10;
                    if (lastDigit === 1) return `${degreeNum}st`;
                    if (lastDigit === 2) return `${degreeNum}nd`;
                    if (lastDigit === 3) return `${degreeNum}rd`;
                    return `${degreeNum}th`;
                  }
                  
                  return degree; // Return original if no match
                };
                
                // Check if this node has connections to determine degree
                // Use degreeToHighRiskCustomer from node properties if available
                const degreeToHighRiskCustomer = nodeProperties?.degreeToHighRiskCustomer;
                
                // Determine degree text and colors based on degreeToHighRiskCustomer
                if (degreeToHighRiskCustomer !== undefined && degreeToHighRiskCustomer !== null) {
                  const ordinalDegree = convertDegreeToOrdinal(String(degreeToHighRiskCustomer));
                  degreeText = `${ordinalDegree} Deg To High Risk`;
                  
                  // Color scheme based on degree: red for 1st, orange for 2nd, yellow for 3rd, etc.
                  const degreeRank = Number(degreeToHighRiskCustomer);
                  
                  if (degreeRank === 1) {
                    // 1st degree - Red
                    degreeColor = 'red';
                  } else if (degreeRank === 2) {
                    // 2nd degree - Orange
                    degreeColor = 'orange';
                  } else if (degreeRank === 3) {
                    // 3rd degree - Yellow
                    degreeColor = 'yellow';
                  } else if (degreeRank >= 4) {
                    // 4th+ degree - Yellow
                    degreeColor = 'yellow';
                  } else if (degreeRank === 6) {
                    // 6th degree - Yellow
                    degreeColor = 'yellow';
                  }
                } else {
                  // No degree info available. If this node itself is high-risk, mark as Defaulter;
                  // otherwise show No Connection to Defaulter.
                  if (riskIndicator && String(riskIndicator).toLowerCase().includes('high')) {
                    degreeText = 'Defaulter';
                    degreeColor = 'red';
                  } else {
                    degreeText = 'No Connection to Defaulter';
                    degreeColor = 'green';
                  }
                }
                
                if (customerName || userid) {
                  // Determine risk behavior tags based on credit behaviour metrics
                  const riskBehaviorTags: Array<{ text: string; color: 'green' | 'yellow' | 'red' | 'gray' | 'orange' }> = [];
                  
                  // Credit Hungry Customer: 
                  // Loan Approvals >= 2 OR
                  // Multiple CC Applications >= 4 OR
                  // Credit Report Pulls >= 4
                  if (creditBehaviourMetrics && (
                    (creditBehaviourMetrics.loanApprovals !== null && creditBehaviourMetrics.loanApprovals >= 2) ||
                    (creditBehaviourMetrics.ccApplications !== null && creditBehaviourMetrics.ccApplications >= 4) ||
                    (creditBehaviourMetrics.creditReportPulls !== null && creditBehaviourMetrics.creditReportPulls >= 4)
                  )) {
                    riskBehaviorTags.push({ text: 'Credit Hungry Customer', color: 'yellow' });
                  }
                  
                  // Potential Evergreening: 
                  // Loan Disbursals Before EMI > 0
                  if (creditBehaviourMetrics && 
                      creditBehaviourMetrics.loansDisbursalsBeforeEmi !== null && 
                      creditBehaviourMetrics.loansDisbursalsBeforeEmi > 0) {
                    riskBehaviorTags.push({ text: 'Potential Evergreening', color: 'orange' });
                  }
                  
                  // Credit Stress: 
                  // EMI Bounces > 0 OR
                  // Bank balance is in negative OR
                  // EMI Conversions into loan > 0
                  if (creditBehaviourMetrics && (
                      (creditBehaviourMetrics.emiBounces !== null && creditBehaviourMetrics.emiBounces > 0) ||
                      (creditBehaviourMetrics.minBankBalance !== null && creditBehaviourMetrics.minBankBalance < 0) ||
                      (creditBehaviourMetrics.emiConversions !== null && creditBehaviourMetrics.emiConversions > 0)
                  )) {
                    riskBehaviorTags.push({ text: 'Credit Stress', color: 'red' });
                  }
                  
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <span className="font-medium text-blue-700">
                          {customerName}{userid ? ` (CID ${userid})` : ''}
                        </span>
                        <div className="flex items-center gap-1">
                          {riskIndicator && (
                            <BubbleTag 
                              text={riskInfo.label} 
                              color={riskInfo.color}
                            />
                          )}
                          {degreeText && (
                            <BubbleTag 
                              text={degreeText} 
                              color={degreeColor}
                            />
                          )}
                        </div>
                      </div>
                      {/* Risk Behavior Tags */}
                      {riskBehaviorTags.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {riskBehaviorTags.map((tag, idx) => (
                            <BubbleTag 
                              key={idx}
                              text={tag.text} 
                              color={tag.color}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  );
                }
                return null;
              })()}



              {/* Risk Snapshot section for CUSTOMER nodes */}
              {node.type === 'CUSTOMER' && (() => {
                // Get CIBIL score - check multiple possible property names, and include 0 as a valid value
                const cibilScore = nodeProperties.cibil_score !== undefined ? nodeProperties.cibil_score : 
                                  (nodeProperties.cibilScore !== undefined ? nodeProperties.cibilScore : 
                                  (nodeProperties.cibil !== undefined ? nodeProperties.cibil : null));
                const loansCount = nodeProperties.loans_count || nodeProperties.loan_count || nodeProperties.loans || nodeProperties.total_loans;
                // Get DPD value - check multiple possible property names, and include 0 as a valid value
                const dpd = nodeProperties.current_dpd !== undefined ? nodeProperties.current_dpd : 
                           (nodeProperties.dpd !== undefined ? nodeProperties.dpd : 
                           (nodeProperties.currentDpd !== undefined ? nodeProperties.currentDpd : null));
                
                // Show Risk Snapshot if any of these values are available (including DPD = 0 or CIBIL = 0)
                // Note: loanApprovals and emiBounces are now in Credit Behaviour section, not here
                const hasAnyValue = (cibilScore !== null && cibilScore !== undefined) || 
                                   (loansCount !== null && loansCount !== undefined) || 
                                   loanAmount !== null ||
                                   (dpd !== null && dpd !== undefined);
                
                if (hasAnyValue) {
                  return (
                    <>
                      <h5 className="font-semibold text-sm mb-2">Risk Snapshot</h5>
                      <div className="space-y-2 mb-4">
                        {cibilScore !== null && cibilScore !== undefined && (
                          <div className="text-sm">
                            <span className="text-gray-500">{capitalizeLabel('cibil_score')}:</span> <span className="font-medium">{cibilScore === 0 ? '0' : formatPropertyValue(cibilScore)}</span>
                          </div>
                        )}
                        {loansCount !== null && loansCount !== undefined && (
                          <div className="text-sm">
                            <span className="text-gray-500">{capitalizeLabel('loans_count')}:</span> <span className="font-medium">{formatPropertyValue(loansCount)}</span>
                          </div>
                        )}
                        {loanAmount !== null && (
                          <div className="text-sm">
                            <span className="text-gray-500">Loan Amount:</span> <span className="font-medium">₹{loanAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {dpd !== null && dpd !== undefined && Number(dpd) !== 100 && (
                          <div className="text-sm">
                            <span className="text-gray-500">Days Past Due:</span> <span className="font-medium">{dpd === 0 ? '0' : formatPropertyValue(dpd)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                }
                return null;
              })()}
              
              {/* Credit Behaviour - Past 6 months section for CUSTOMER nodes */}
              {node.type === 'CUSTOMER' && creditBehaviourMetrics && (
                <>
                  <h5 className="font-semibold text-sm mb-2 mt-4">Credit Behaviour - Past 6 months</h5>
                  <div className="space-y-2 mb-4">
                    {/* Minimum Bank Balance: Show if < 0 */}
                    {creditBehaviourMetrics.minBankBalance !== null && creditBehaviourMetrics.minBankBalance < 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Minimum Bank Balance:</span> <span className="font-medium">₹{creditBehaviourMetrics.minBankBalance.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Maximum Bank Balance: Hidden as per request
                    {creditBehaviourMetrics.maxBankBalance !== null && (
                      <div className="text-sm">
                        <span className="text-gray-500">Maximum Bank Balance:</span> <span className="font-medium">₹{creditBehaviourMetrics.maxBankBalance.toLocaleString()}</span>
                      </div>
                    )}
                    */}

                    {/* Loan Disbursals: Hidden as per request
                    {creditBehaviourMetrics.loanDisbursals !== null && (
                      <div className="text-sm">
                        <span className="text-gray-500">Loan Disbursals:</span> <span className="font-medium">{creditBehaviourMetrics.loanDisbursals}</span>
                      </div>
                    )}
                    */}
                    {/* Maximum Bank Balance: No condition specified in request, but keeping hidden if min balance logic is applied for stress? 
                        User request: "show these fields in properties and credit behaviour section, only satisfies the above condition"
                        The "above conditions" didn't mention Max Balance. I will hide it to be safe as per "only satisfies". 
                        Actually, let's look at the request again. "show the tags only condition satisfies... also show these fields... only satisfies the above condition"
                        Conditions:
                        1. Loan Approvals >= 2
                        2. Multiple CC Applications >= 4
                        3. Credit Report Pulls >= 4
                        4. Loan Disbursals Before EMI > 0
                        5. EMI Bounces > 0
                        6. Bank balance is in negative (Min Bank Balance < 0)
                        7. EMI Conversions into loan > 0
                        
                        It does not mention "Max Bank Balance", "Loan Disbursals", "Loans Count" etc.
                        But "Risk Snapshot" is separate. "Credit Behaviour - Past 6 months" is the section in question.
                        I will hide Max Bank Balance, Loan Disbursals here.
                    */}
                    
                    {/* Credit Report Pulls: Show if >= 4 */}
                    {creditBehaviourMetrics.creditReportPulls !== null && creditBehaviourMetrics.creditReportPulls >= 4 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Credit Report Pulls:</span> <span className="font-medium">{creditBehaviourMetrics.creditReportPulls}</span>
                      </div>
                    )}
                    
                    {/* CC Applications: Show if >= 4 */}
                    {creditBehaviourMetrics.ccApplications !== null && creditBehaviourMetrics.ccApplications >= 4 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Multiple CC Applications:</span> <span className="font-medium">{creditBehaviourMetrics.ccApplications}</span>
                      </div>
                    )}

                    {/* EMI Conversions: Show if > 0 */}
                    {creditBehaviourMetrics.emiConversions !== null && creditBehaviourMetrics.emiConversions > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">EMI Conversions into loan:</span> <span className="font-medium">{creditBehaviourMetrics.emiConversions}</span>
                      </div>
                    )}
                    
                    {/* Loan Disbursals Before EMI: Show if > 0 */}
                    {creditBehaviourMetrics.loansDisbursalsBeforeEmi !== null && creditBehaviourMetrics.loansDisbursalsBeforeEmi > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Loans Disbursals before EMI:</span> <span className="font-medium">{creditBehaviourMetrics.loansDisbursalsBeforeEmi}</span>
                      </div>
                    )}
                    
                    {/* Loan Approvals: Show if >= 2 */}
                    {creditBehaviourMetrics.loanApprovals !== null && creditBehaviourMetrics.loanApprovals >= 2 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Loan Approvals:</span> <span className="font-medium">{creditBehaviourMetrics.loanApprovals}</span>
                      </div>
                    )}
                    
                    {/* EMI Bounces: Show if > 0 */}
                    {creditBehaviourMetrics.emiBounces !== null && creditBehaviourMetrics.emiBounces > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">EMI Bounces:</span> <span className="font-medium">{creditBehaviourMetrics.emiBounces}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <h5 className="font-semibold text-sm mb-2">Properties</h5>
              <div className="space-y-2">

                {Object.entries(nodeProperties).map(([key, value]: [string, any]) => {
                  // Skip fields that should be shown per-connection in Details instead of
                  // in the top-level Node Information card.
                  const lowerKey = key.toLowerCase();
                  const geoKeys = ['address_full', 'longitude', 'latitude'];
                  const phoneKeys = ['country', 'telephone_type', 'telephone_category', 'relation_name', 'relation_type', 'relationship_type'];

          // Always hide 'source', branch count and highriskcustomercount here
          if (lowerKey === 'source' ||
            lowerKey === 'branch_count' ||
            lowerKey === 'branchcount' ||
            lowerKey === 'has_branches' ||
            lowerKey === 'hasbranches' ||
            lowerKey === 'highriskcustomercount' ||
            lowerKey === 'high_risk_customer_count' ||
            lowerKey === 'highriskcustomer_count' ||
            lowerKey === 'data') return null;

                  // For CUSTOMER nodes, hide name, userid, cibil_score, loans_count, and loan_amount (shown in Risk Snapshot or at top)
                  // Also hide current_dpd and risk_indicator as requested
                  if (node.type === 'CUSTOMER' && (
                    lowerKey === 'name' || 
                    lowerKey === 'customer_name' || 
                    lowerKey === 'basic_details_name' || 
                    lowerKey === 'userid' || 
                    lowerKey === 'user_id' ||
                    lowerKey === 'cibil_score' ||
                    lowerKey === 'cibilscore' ||
                    lowerKey === 'cibil' ||
                    lowerKey === 'loans_count' ||
                    lowerKey === 'loan_count' ||
                    lowerKey === 'loans' ||
                    lowerKey === 'total_loans' ||
                    lowerKey === 'loan_amount' ||
                    lowerKey === 'loanamount' ||
                    lowerKey === 'total_loan_amount' ||
                    lowerKey === 'current_dpd' ||
                    lowerKey === 'currentdpd' ||
                    lowerKey === 'dpd' ||
                    lowerKey === 'risk_indicator' ||
                    lowerKey === 'riskindicator' ||
                    lowerKey === 'risk_indicator'
                  )) return null;

                  // If this property is a DPD-like field and the value equals 100, hide it
                  if ((lowerKey === 'current_dpd' || lowerKey === 'currentdpd' || lowerKey === 'dpd')) {
                    try {
                      const numeric = Number(value);
                      if (!isNaN(numeric) && numeric === 100) return null;
                      // Also handle string '100'
                      if (String(value).trim() === '100') return null;
                    } catch (e) {
                      // ignore parsing errors and fall back to rendering
                    }
                  }

                  // For GEOLOCATION nodes, hide geo-specific fields from the Node Information
                  if (node.type === 'GEOLOCATION' && geoKeys.includes(lowerKey)) return null;

                  // For PHONE nodes, hide phone-specific fields from the Node Information
                  if (node.type === 'PHONE' && phoneKeys.includes(lowerKey)) return null;

                  // For DEVICE nodes, hide ip_address field from the Node Information
                  if (node.type === 'DEVICE' && (lowerKey === 'ip_address' || lowerKey === 'ipaddress' || lowerKey === 'ip')) return null;

                  // For BANK_ACCOUNT nodes, hide everything except unique_account_id (show unique account id in Node Information)
                  if (node.type === 'BANK_ACCOUNT' && lowerKey !== 'unique_account_id') return null;
                  
                  return (
                    <div key={key} className="text-sm">
                      <span className="text-gray-500">{capitalizeLabel(key)}:</span> <span className="font-medium break-all">{formatPropertyValue(value, key)}</span>
                    </div>
                  );
                })}
                {/* % of default for non-CUSTOMER nodes - shows ratio, High Risk Customer Count, and Total Customer Count as separate fields */}
                {node.type !== 'CUSTOMER' && percentOfDefault.denominator > 0 && (
                  <>
                    <div className="text-sm">
                      <span className="text-gray-500">% of Default:</span> <span className="font-medium">{percentOfDefault.ratio}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">High Risk Customer Count:</span> <span className="font-medium">{percentOfDefault.numerator}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Total Customer Count:</span> <span className="font-medium">{percentOfDefault.denominator}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
          <h4 className="font-semibold mb-0 flex items-center">
            <span className='pr-2'>Total Connections</span>
            <BubbleTag text="" color="purple" hasInsideNumber={true} number={connections.length} />
          </h4>
          {/* For non-CUSTOMER nodes, render connected customers inside a collapsible "Customers" section.
              Assumption: treat connected nodes with types containing 'customer' or 'person' as customer records. */}
          {node.type !== 'CUSTOMER' ? (
            <ArtifactSectionCollapsible title="Customers" defaultOpen={true}>
              {(() => {
                const customerConnections = connections.filter((c: any) => /customer|person/i.test(String(c.connectedNodeType || '')));

                if (customerConnections.length === 0) {
                  return <p className="text-sm text-gray-500">No connected customers</p>;
                }

                return (
                  <div className="space-y-2">
                    {customerConnections.map((connection: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                          <div className="mb-2">
                            <CustomerCard connection={connection} />
                          </div>
                          <div className="border-b border-gray-200 mb-2"></div>
                          <div className="space-y-2">
                            {/* Source Field from Data */}
                            <div className="text-sm">
                              <span className="text-gray-500">Source:</span> <span className="font-medium">{parseEdgeSources(connection.edgeProperties?.data || connection.data, connection.edgeProperties?.source || connection.connectedNodeProperties?.source || node.properties?.source)}</span>
                            </div>
                          {(() => {
                            const edgeDataEntries = parseEdgeDataFromLink(connection) || [];
                            if (!edgeDataEntries || edgeDataEntries.length === 0) return null;

                            // Merge entries and dedupe values
                            const merged: Record<string, any[]> = {};
                            edgeDataEntries.forEach((entry: any) => {
                              if (!entry || typeof entry !== 'object') return;
                              Object.entries(entry).forEach(([k, v]) => {
                                const lk = String(k).toLowerCase();
                                if (lk === 'source' || lk === 'data' || lk === 'onboarded_at' || lk === 'userid' || lk === 'highriskcustomercount' || lk === 'high_risk_customer_count' || lk === 'highriskcustomer_count') return;
                                if (!merged[k]) merged[k] = [];
                                const exists = merged[k].some((ev: any) => {
                                  if (ev === null || ev === undefined) return ev === v;
                                  if (typeof ev === 'object' && typeof v === 'object') return JSON.stringify(ev) === JSON.stringify(v);
                                  return String(ev) === String(v);
                                });
                                if (!exists) merged[k].push(v);
                              });
                            });

                            const mergedKeys = Object.keys(merged);
                            if (mergedKeys.length === 0) return null;

                            return (
                              <div className="space-y-2">
                                {mergedKeys.map((key) => {
                                  const vals = merged[key] || [];
                                  if (vals.length === 0) return null;
                                  const display = vals.length === 1 ? formatPropertyValue(vals[0], key) : vals.map(v => formatPropertyValue(v, key)).filter(Boolean).join(', ');
                                  return (
                                    <div key={key} className="text-sm">
                                      <span className="text-gray-500">{capitalizeLabel(key)}:</span>{' '}
                                      <span className="font-medium break-all">{display}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </ArtifactSectionCollapsible>
          ) : (
            /* Existing full connections view for CUSTOMER nodes */
            <>
              {/* Group connections by node type and render a collapsible section for each type */}
              {(() => {
                const connectionsByTypeMap: Record<string, any[]> = connections.reduce((acc: Record<string, any[]>, conn: any) => {
                  const nodeType = conn.connectedNodeType || 'Unknown';
                  if (!acc[nodeType]) acc[nodeType] = [];
                  acc[nodeType].push(conn);
                  return acc;
                }, {} as Record<string, any[]>);

                return Object.entries(connectionsByTypeMap).map(([nodeType, conns]) => {
                  // Format node type header (replace underscores with spaces)
                  const formattedNodeType = formatLabelText(nodeType);
                  
                  return (
                    <ArtifactSectionCollapsible
                      key={nodeType}
                      title={(
                        <div className="flex items-center gap-2">
                          <span>{formattedNodeType}</span>
                          <BubbleTag text={`${conns.length} Connections`} color="blue" />
                        </div>
                      )}
                      defaultOpen={false}
                    >
                      <div className="space-y-2">
                        {conns.map((connection: any, index: number) => {
                          // Format card header for non-CUSTOMER nodes using the same format as hover tooltip
                          const connectedNodeForFormatting = {
                            type: connection.connectedNodeType || nodeType,
                            label: connection.connectedNodeType || nodeType,
                            properties: connection.connectedNodeProperties || {},
                            name: connection.connectedNode
                          };
                          const isCustomerNode = String(connection.connectedNodeType || '').toUpperCase().includes('CUSTOMER') || 
                                                 String(connection.connectedNodeType || '').toUpperCase().includes('PERSON');
                          const isGovIdNode = String(connection.connectedNodeType || '').toUpperCase().includes('GOV_ID') || 
                                              String(connection.connectedNodeType || '').toUpperCase().includes('GOVID');
                          
                          let cardHeaderLabel: string;
                          if (isCustomerNode) {
                            cardHeaderLabel = connection.connectedNode;
                          } else if (isGovIdNode) {
                            // For GOV_ID, show only id_type(id_value) without the label prefix
                            // Use the connectedNodeForFormatting object which already has properties set up
                            const props = connectedNodeForFormatting.properties || {};
                            
                            const pick = (...keys: string[]) => {
                              for (const k of keys) {
                                const val = props[k];
                                if (val !== undefined && val !== null && val !== '') {
                                  const strVal = String(val).trim();
                                  if (strVal !== '') return strVal;
                                }
                              }
                              return '';
                            };
                            const govIdType = pick('gov_id_type', 'id_type', 'govIdType', 'idType') || '';
                            const govIdValue = pick('gov_id_value', 'id_value', 'value', 'govIdValue', 'idValue') || '';
                            if (govIdType && govIdValue) {
                              cardHeaderLabel = `${govIdType}(${govIdValue})`;
                            } else if (govIdValue) {
                              cardHeaderLabel = govIdValue;
                            } else if (govIdType) {
                              cardHeaderLabel = govIdType;
                            } else {
                              // Fallback: use formatNodeLabel which should handle GOV_ID formatting
                              cardHeaderLabel = formatNodeLabel(connectedNodeForFormatting);
                            }
                          } else {
                            cardHeaderLabel = formatNodeLabel(connectedNodeForFormatting);
                          }
                          
                          return (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-blue-700">{cardHeaderLabel}</span>
                                  {(() => {
                                    const parsed = parseConnectorType(connection);
                                    if (parsed.normalized === 'weak') return <BubbleTag text="Weak Connector" color="orange" />;
                                    return null;
                                  })()}
                                </div>
                              </div>
                              <div className="border-b border-gray-200 mb-2"></div>
                              <div className="space-y-2">
                                {(() => {
                                  const edgeDataEntries = parseEdgeDataFromLink(connection) || [];
                                  if (!edgeDataEntries || edgeDataEntries.length === 0) return null;

                                  const merged: Record<string, any[]> = {};
                                  edgeDataEntries.forEach((entry: any) => {
                                    if (!entry || typeof entry !== 'object') return;
                                    Object.entries(entry).forEach(([k, v]) => {
                                      const lk = String(k).toLowerCase();
                                      // Exclude internal/meta fields and IP-related fields (don't show IPs on device cards)
                                      if (
                                        lk === 'data' ||
                                        lk === 'onboarded_at' ||
                                        lk === 'userid' ||
                                        lk === 'branch_count' ||
                                        lk === 'branchcount' ||
                                        lk === 'highriskcustomercount' ||
                                        lk === 'high_risk_customer_count' ||
                                        lk === 'highriskcustomer_count' ||
                                        lk === 'ip' ||
                                        lk === 'ip_address' ||
                                        lk === 'ipaddress' ||
                                        lk === 'ip_addr' ||
                                        lk === 'ipaddresses' ||
                                        lk === 'ip_addresses'
                                      ) return;
                                      if (!merged[k]) merged[k] = [];
                                      const exists = merged[k].some((ev: any) => {
                                        if (ev === null || ev === undefined) return ev === v;
                                        if (typeof ev === 'object' && typeof v === 'object') return JSON.stringify(ev) === JSON.stringify(v);
                                        return String(ev) === String(v);
                                      });
                                      if (!exists) merged[k].push(v);
                                    });
                                  });

                                  const mergedKeys = Object.keys(merged);
                                  if (mergedKeys.length === 0) return null;

                                  return (
                                    <div className="space-y-2">
                                      {mergedKeys.map((key) => {
                                        const vals = merged[key] || [];
                                        if (vals.length === 0) return null;
                                        const display = vals.length === 1 ? formatPropertyValue(vals[0], key) : vals.map(v => formatPropertyValue(v, key)).filter(Boolean).join(', ');
                                        return (
                                          <div key={key} className="text-sm">
                                            <span className="text-gray-500">{capitalizeLabel(key)}:</span>{' '}
                                            <span className="font-medium break-all">{display}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ArtifactSectionCollapsible>
                  );
                });
              })()}
            </>
          )}
      </div>
    </div>
  );
};