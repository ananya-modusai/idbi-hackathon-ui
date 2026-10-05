
// Helper function to capitalize first letter of each word
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  // Don't capitalize if it's purely numeric or contains currency symbols
  if (/^[\d\s,.\-₹$€£¥]+$/.test(text.trim())) {
    return text;
  }
  return text
    .split(' ')
    .filter(w => w) // filter empty strings if any split weirdness, effectively map below handles it but being safe
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


// Map raw source strings to display friendly versions
export const mapSourceValue = (sourceStr: string): string => {
    if (!sourceStr || typeof sourceStr !== 'string') return '';
    const lower = sourceStr.toLowerCase().trim();
    
    // Map bank transaction variations to sms
    if (lower.includes('bank transaction') || 
        lower.includes('bank_transaction') || 
        lower.includes('banktransaction') || 
        lower.includes('bank-transaction')) {
          
        if (lower.includes('counterparty') || lower.includes('upi')) {
             return 'sms_counterparty';
        }
        return 'sms';
    }
    
    // Return original if no mapping found
    return sourceStr;
};

// Recursive helper to extract source strings from any structure
const extractSourcesRecursively = (value: any, depth: number = 0): string[] => {
  const MAX_DEPTH = 5;
  if (depth > MAX_DEPTH) return [];
  if (value === null || value === undefined) return [];

  const extracted: string[] = [];

  // Handle String
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Try to parse if it looks like JSON
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        extracted.push(...extractSourcesRecursively(parsed, depth + 1));
      } catch (e) {
        // Not valid JSON, treat as value
        extracted.push(trimmed);
      }
    } else {
      // Plain string
      extracted.push(trimmed);
    }
  }
  // Handle Array
  else if (Array.isArray(value)) {
    value.forEach(item => {
      extracted.push(...extractSourcesRecursively(item, depth + 1));
    });
  }
  // Handle Object
  else if (typeof value === 'object') {
    // Check specific keys first
    if (value.source) {
      extracted.push(...extractSourcesRecursively(value.source, depth + 1));
    } else if (value.type) {
      extracted.push(...extractSourcesRecursively(value.type, depth + 1));
    } else if (value.value) {
      extracted.push(...extractSourcesRecursively(value.value, depth + 1));
    } 
    // If it's the top-level 'data' object which might just have keys, we might need a specific strategy
    // But usually data object has 'source' key. If not, and we are blindly recursing, we might extract garbage.
    // For now, assume objects of interest have 'source', 'type', or 'value'.
  }

  return extracted;
};

// Parse the 'data' field from API response which contains source info
export const parseEdgeSources = (dataField: any, fallbackSource?: string): string => {
  let sources: string[] = [];
  
  // 1. Try to extract from dataField
  if (dataField) {
     sources.push(...extractSourcesRecursively(dataField));
  }

  // 2. If no sources from dataField, use fallback
  if (sources.length === 0 && fallbackSource) {
     sources.push(...extractSourcesRecursively(fallbackSource));
  }

  // 3. Process, Clean, Map, Dedup
  const uniqueSources = new Set<string>();
  sources.forEach(s => {
    if (!s) return;
    const mapped = mapSourceValue(s);
    
    // Final check to avoid showing JSON-like garbage if recursive failed to parse but text looked like json
    if (mapped.startsWith('[') || mapped.startsWith('{')) return;

    // Convert "sms" to "SMS" (case-insensitive) before replacing underscores (handled in capitalizedWords somewhat but let's be explicit)
    let finalStr = mapped;
    if (finalStr.toLowerCase() === 'sms') {
      finalStr = 'SMS';
    } else if (finalStr.toLowerCase().startsWith('sms_')) {
      finalStr = 'SMS ' + finalStr.substring(4).replace(/_/g, ' ');
    } else {
      finalStr = finalStr.replace(/_/g, ' ');
    }

    const formatted = capitalizeWords(finalStr);
    if (formatted) uniqueSources.add(formatted);
  });

  if (uniqueSources.size === 0) return '';

  return Array.from(uniqueSources).slice(0, 3).join(', ');
};

