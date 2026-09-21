// Main component export
export { default as ExternalInsightsComponent } from './ExternalInsightsComponent';
export type { 
  ExternalInsightsConfig, 
  InsightItem, 
  SectionConfig 
} from './ExternalInsightsComponent';

// Configuration exports
export { 
  ipoExternalInsightsConfig,
  ipoSectionConfig,
  ipoShortNames,
  ipoPrimaryCategories
} from './configs/ipoConfig';

export { 
  insolvencyExternalInsightsConfig,
  insolvencySectionConfig,
  insolvencyShortNames,
  insolvencyPrimaryCategories
} from './configs/insolvencyConfig';
