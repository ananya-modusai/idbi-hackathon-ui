// Data processing utilities for dynamic visualization grouping and aggregation

export interface GroupingConfig {
  primaryField: string;
  secondaryField: string;
  separator?: string;
}

export interface AggregationConfig {
  [fieldName: string]: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first';
}

export interface ProcessedVisualizationData {
  name: string;
  [key: string]: string | number;
}

/**
 * Creates a combined key from two field values
 */
export function createCombinedKey(
  primaryValue: any,
  secondaryValue: any,
  separator: string = ', '
): string {
  return `${primaryValue}${separator}${secondaryValue}`;
}

/**
 * Groups raw data by combination of two fields and aggregates numeric values
 */
export function processDataForVisualization(
  rawData: any[],
  groupingConfig: GroupingConfig,
  aggregationConfig: AggregationConfig
): ProcessedVisualizationData[] {
  if (!rawData || rawData.length === 0) return [];

  const { primaryField, secondaryField, separator = ', ' } = groupingConfig;

  // Group data by combination of primary and secondary fields
  const grouped = rawData.reduce((acc, item) => {
    const primaryValue = item[primaryField];
    const secondaryValue = item[secondaryField];

    // Skip items with missing grouping field values
    if (primaryValue === undefined || secondaryValue === undefined) {
      return acc;
    }

    const combinedKey = createCombinedKey(primaryValue, secondaryValue, separator);

    if (!acc[combinedKey]) {
      acc[combinedKey] = {
        name: combinedKey,
        [primaryField]: primaryValue,
        [secondaryField]: secondaryValue,
        items: []
      };
    }
    acc[combinedKey].items.push(item);
    return acc;
  }, {} as any);

  // Aggregate data for each group
  return Object.values(grouped).map((group: any) => {
    const result: ProcessedVisualizationData = {
      name: group.name,
      [primaryField]: group[primaryField],
      [secondaryField]: group[secondaryField]
    };

    // Apply aggregation for each configured field
    Object.entries(aggregationConfig).forEach(([field, aggregationType]) => {
      const values = group.items
        .map((item: any) => item[field])
        .filter((val: any) => typeof val === 'number' && !isNaN(val));

      switch (aggregationType) {
        case 'sum':
          result[field] = values.reduce((sum: number, val: number) => sum + val, 0);
          break;
        case 'avg':
          result[field] = values.length > 0 ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length : 0;
          break;
        case 'count':
          result[field] = values.length;
          break;
        case 'min':
          result[field] = values.length > 0 ? Math.min(...values) : 0;
          break;
        case 'max':
          result[field] = values.length > 0 ? Math.max(...values) : 0;
          break;
        case 'first':
          result[field] = values.length > 0 ? values[0] : 0;
          break;
        default:
          result[field] = values.length > 0 ? values[0] : 0;
      }
    });

    return result;
  });
}

/**
 * Detects if data needs processing (has separate grouping fields but no combined name field)
 */
export function needsDataProcessing(
  data: any[],
  primaryField: string,
  secondaryField: string
): boolean {
  if (!data || data.length === 0) return false;

  return data.some(item =>
    item[primaryField] !== undefined &&
    item[secondaryField] !== undefined &&
    !item.name
  );
}

/**
 * Automatically detects available fields for grouping from data
 */
export function getAvailableGroupingFields(data: any[]): string[] {
  if (!data || data.length === 0) return [];

  const sampleItem = data[0];
  return Object.keys(sampleItem).filter(key =>
    key !== 'name' && // Exclude the combined name field
    typeof sampleItem[key] === 'string' ||
    typeof sampleItem[key] === 'number'
  );
}

/**
 * Automatically detects numeric fields suitable for aggregation
 */
export function getNumericFields(data: any[]): string[] {
  if (!data || data.length === 0) return [];

  const sampleItem = data[0];
  return Object.keys(sampleItem).filter(key =>
    key !== 'name' && // Exclude the combined name field
    typeof sampleItem[key] === 'number'
  );
}

/**
 * Creates default aggregation configuration for numeric fields
 */
export function createDefaultAggregationConfig(
  numericFields: string[],
  defaultAggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' = 'sum'
): AggregationConfig {
  const config: AggregationConfig = {};
  numericFields.forEach(field => {
    config[field] = defaultAggregation;
  });
  return config;
}

/**
 * Main function to process raw data based on configuration
 * Supports both array and string xAxisKey formats
 */
export function prepareVisualizationData(
  rawData: any[],
  xAxisKey: string | string[],
  customAggregationConfig?: AggregationConfig
): ProcessedVisualizationData[] {
  if (!rawData || rawData.length === 0) return [];

  // Handle both string and array xAxisKey formats
  let primaryField: string;
  let secondaryField: string;

  if (Array.isArray(xAxisKey)) {
    // Array format: use the provided fields or detect from data
    primaryField = xAxisKey[0];
    secondaryField = xAxisKey[1];

    // If no fields provided, try to detect from data
    if (!primaryField && rawData.length > 0) {
      const firstItem = rawData[0];
      const availableFields = Object.keys(firstItem);
      primaryField = availableFields[0] || 'field1';
      secondaryField = availableFields[1] || 'field2';
    }
  } else {
    // Legacy string format - assume it's a combined field name
    // For backward compatibility, try to detect if data needs processing
    const firstItem = rawData[0] || {};
    const availableFields = Object.keys(firstItem);

    // Check if the xAxisKey exists in the data
    if (firstItem[xAxisKey] !== undefined) {
      // Data already has the combined field
      return rawData.map(item => ({
        name: item[xAxisKey] || item.name,
        ...item
      }));
    } else {
      // Try to use first two available fields for grouping
      primaryField = availableFields[0] || 'field1';
      secondaryField = availableFields[1] || 'field2';
    }
  }

  // Check if data needs processing
  if (!needsDataProcessing(rawData, primaryField, secondaryField)) {
    // Data already has name field or doesn't have the required grouping fields
    return rawData.map(item => ({
      name: item.name || `${item[primaryField]}, ${item[secondaryField]}`,
      ...item
    }));
  }

  // Auto-detect numeric fields if no aggregation config provided
  const numericFields = getNumericFields(rawData);
  const aggregationConfig = customAggregationConfig || createDefaultAggregationConfig(numericFields);

  // Create grouping configuration
  const groupingConfig: GroupingConfig = {
    primaryField,
    secondaryField,
    separator: ', '
  };

  // Process the data
  return processDataForVisualization(rawData, groupingConfig, aggregationConfig);
}

/**
 * Legacy function for backward compatibility
 */
export function prepareVisualizationDataLegacy(
  rawData: any[],
  primaryField?: string,
  secondaryField?: string,
  customAggregationConfig?: AggregationConfig
): ProcessedVisualizationData[] {
  // If no fields provided, detect from data
  if (!primaryField || !secondaryField) {
    if (rawData.length > 0) {
      const availableFields = Object.keys(rawData[0]);
      primaryField = primaryField || availableFields[0] || 'field1';
      secondaryField = secondaryField || availableFields[1] || 'field2';
    } else {
      primaryField = primaryField || 'field1';
      secondaryField = secondaryField || 'field2';
    }
  }

  return prepareVisualizationData(rawData, [primaryField, secondaryField], customAggregationConfig);
}
