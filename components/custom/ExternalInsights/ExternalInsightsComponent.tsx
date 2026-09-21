'use client';

import { FC, useState, useEffect } from 'react';
import { 
  Globe, Calendar, ExternalLink, Loader2, AlertTriangle, FileText
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateString } from '@/utils/timeFormat';
import SectionHeaderWithFlags from '../SectionHeaderWithFlags';
import { getTagCategory } from '@/app/pages/Merchant/MerchantInsolvency/SampleData/syntheticTagsMapping';

import type { LucideIcon } from 'lucide-react';

// Type for API response data
export interface ApiResponseData {
  data?: Partial<InsightItem>[];
  message?: string;
  success?: boolean;
}

// API response types
export interface ApiResponse {
  main?: ApiResponseData;
  audit?: ApiResponseData;
  annual?: ApiResponseData;
}

// Generic interfaces
export interface InsightItem {
  title: string;
  summary: string;
  date: string;
  source?: string;
  sources?: string | string[]; // Can be JSON string or array
  source_urls?: string[];
  url_dates?: string[] | Record<string, string>; // Dates corresponding to URLs (array or object mapping URL to date)
  risk_segment?: 'severe' | 'high' | 'medium';
  tag?: 'redflag' | string;
  severity?: 'severe' | 'high' | 'medium' | 'low' | 'good' | 'veryGood' | string;
  risk_level?: string;
  // Additional common fields
  insight?: string;
  created_at?: string;
  year?: string | number;
  filename?: string;
  page_number?: string | number;
  bare_text?: string;
  [key: string]: unknown; // Allow additional properties with unknown type
}

// Red flag type returned by mapper
export interface RedFlag {
  id: string;
  merchant_id: string;
  rule_code: string;
  description: string;
  severity: 'severe' | 'high' | 'medium' | 'good' | 'veryGood' | 'neutral';
  rule_type: string;
  rule_severity?: string;
  ruleSeverity?: string;
  created_at: string;
  updated_at: string;
  metric_values: unknown | null;
  metric_data_timestamp: string | null;
  notes: string | null;
  category?: string;
  isPositive: boolean;
}

// Helper type for converting severity types
type SeverityToRedFlagSeverity = {
  'severe': 'severe';
  'high': 'high';
  'medium': 'medium';
  'low': 'medium';
  'good': 'good';
  'veryGood': 'veryGood';
  [key: string]: 'medium' | 'severe' | 'high' | 'good' | 'veryGood' | 'neutral';
};

export interface SectionConfig {
  title: string;
  icon: LucideIcon;
  iconColorClass: string;
}

export interface ExternalInsightsConfig {
  sections: Record<string, SectionConfig>;
  primaryCategories: string[];
  shortNames: Record<string, string>;
  apiEndpoints: {
    fetchData: (params?: string) => Promise<ApiResponseData>;
    fetchAuditReports?: (params?: string) => Promise<ApiResponseData>;
    fetchAnnualReports?: (params?: string) => Promise<ApiResponseData>;
  };
  dataTransformer: (rawData: ApiResponse) => Record<string, InsightItem[]>;
  redFlagMapper: (sectionKey: string, insights: InsightItem[], contextId?: string) => RedFlag[];
}

interface ExternalInsightsComponentProps {
  config: ExternalInsightsConfig;
  contextId?: string; // merchant ID, company ID, etc.
  className?: string;
  initialSection?: string | null;
  // Optional externally-provided transformed insights data. When present, the component will use
  // this data instead of calling the configured API endpoints. This is useful when the parent
  // already fetched/transformed data (for example, with additional parameters like date).
  externalData?: Record<string, InsightItem[]>;
  // Optional loading flag supplied by parent when providing externalData
  externalLoading?: boolean;
  // Optional raw API responses (main/audit/annual). If provided, the component will run the
  // configured dataTransformer on these responses to derive sectioned insights.
  externalApiResponses?: ApiResponse;
}

// Format date helper - now using the utility function
const formatDate = (dateString: string) => {
  return formatDateString(dateString);
};

interface InsightCardProps {
  item: InsightItem;
  cardType?: 'default' | 'audit' | 'annual';
}

const InsightCard: FC<InsightCardProps> = ({ 
  item, 
  cardType = 'default'
}) => {
  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  // Helper function to normalize URL for matching (handles protocol, www, trailing slashes)
  const normalizeUrlForMatching = (url: string): string => {
    if (!url) return '';
    try {
      let normalized = url.trim().toLowerCase();
      // Remove protocol
      normalized = normalized.replace(/^https?:\/\//i, '');
      // Remove www.
      normalized = normalized.replace(/^www\./i, '');
      // Remove trailing slash
      normalized = normalized.replace(/\/$/, '');
      return normalized;
    } catch {
      return url.toLowerCase();
    }
  };

  // Helper function to parse url_dates (can be string, array, or object)
  const parseUrlDates = (): string[] | Record<string, string> | null => {
    if (!item.url_dates) return null;

    // If it's already an array or object, return as-is
    if (Array.isArray(item.url_dates)) {
      return item.url_dates;
    }
    if (typeof item.url_dates === 'object' && !Array.isArray(item.url_dates)) {
      return item.url_dates as Record<string, string>;
    }

    // If it's a string, try to parse it as JSON
    if (typeof item.url_dates === 'string') {
      try {
        const parsed = JSON.parse(item.url_dates);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as Record<string, string>;
        }
      } catch (e) {
        console.warn('Failed to parse url_dates:', e);
      }
    }

    return null;
  };

  // Helper function to parse sources (can be string or array)
  const parseSources = (): string[] | null => {
    if (!item.sources) return null;

    if (Array.isArray(item.sources)) {
      return item.sources;
    }

    if (typeof item.sources === 'string') {
      try {
        const parsed = JSON.parse(item.sources);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // If parsing fails, treat as single source
        return [item.sources];
      }
    }

    return null;
  };

  // Helper function to get date for a URL from url_dates
  const getUrlDate = (url: string, urlIndex?: number): string | null => {
    if (!url) return null;

    const parsedUrlDates = parseUrlDates();
    if (!parsedUrlDates) return null;

    // If urlIndex is provided and url_dates is an array, use direct index matching
    // This is the most reliable when sources and url_dates are in the same order
    if (urlIndex !== undefined && Array.isArray(parsedUrlDates) && urlIndex >= 0 && urlIndex < parsedUrlDates.length) {
      return parsedUrlDates[urlIndex];
    }

    const normalizedUrl = normalizeUrlForMatching(url);

    // If url_dates is an object (Record), look up by URL key
    if (typeof parsedUrlDates === 'object' && !Array.isArray(parsedUrlDates)) {
      const urlDatesObj = parsedUrlDates as Record<string, string>;
      // Try exact match first
      if (urlDatesObj[url]) {
        return urlDatesObj[url];
      }
      // Try normalized match
      for (const [key, value] of Object.entries(urlDatesObj)) {
        if (normalizeUrlForMatching(key) === normalizedUrl) {
          return value;
        }
      }
      return null;
    }

    // If url_dates is an array, try to match with source_urls first (most reliable)
    if (Array.isArray(parsedUrlDates) && item.source_urls && Array.isArray(item.source_urls)) {
      const urlIndex = item.source_urls.findIndex(u => normalizeUrlForMatching(u) === normalizedUrl);
      if (urlIndex >= 0 && urlIndex < parsedUrlDates.length) {
        return parsedUrlDates[urlIndex];
      }
    }

    // If url_dates is an array and we have sources array, try to match by index
    // This handles the case where sources is used instead of source_urls
    // Both sources and url_dates are often JSON strings that need parsing
    if (Array.isArray(parsedUrlDates)) {
      const sourcesArray = parseSources();
      if (sourcesArray && Array.isArray(sourcesArray)) {
        // Try to find by normalized URL match
        const matchedIndex = sourcesArray.findIndex((u: string) => normalizeUrlForMatching(u) === normalizedUrl);
        if (matchedIndex >= 0 && matchedIndex < parsedUrlDates.length) {
          return parsedUrlDates[matchedIndex];
        }
        // If arrays are same length and URL is found, use that index
        if (sourcesArray.length === parsedUrlDates.length) {
          const directIndex = sourcesArray.indexOf(url);
          if (directIndex >= 0 && directIndex < parsedUrlDates.length) {
            return parsedUrlDates[directIndex];
          }
        }
      }
    }

    return null;
  };

  // Helper function to format date for display
  const formatUrlDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    try {
      // If already in YYYY-MM-DD format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Handle DD-MM-YYYY format (common in API responses)
      const ddMmYyyyMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (ddMmYyyyMatch) {
        const [, day, month, year] = ddMmYyyyMatch;
        return `${year}-${month}-${day}`;
      }

      // Try to parse and format as ISO date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }

      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getRiskSegmentColor = (riskSegment: string) => {
    switch (riskSegment?.toLowerCase()) {
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'severe': return 'text-red-600 bg-red-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'good': return 'text-green-600 bg-green-50';
      case 'verygood': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Render different card types
  if (cardType === 'audit') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3 flex-1">
              <h4 className="text-gray-900 font-medium">{item.title}</h4>
            </div>
            <div className="flex items-center gap-2">
              {item.severity && (
                <span className={`inline-flex items-center px-2 py-1 rounded-medium text-xs font-medium ${getRiskSegmentColor(item.severity)}`}>
                  {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                </span>
              )}
              <div className="flex items-center text-xs text-gray-500 font-medium">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {item.year ? `FY ${item.year}` : formatDate(item.date)}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700">
            {item.insight && (
              <p className="text-gray-800 mb-2">{item.insight}</p>
            )}
            {item.bare_text && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 italic">
                &quot;{item.bare_text}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cardType === 'annual') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center">
              {item.tag === 'redflag' && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 mr-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
              )}
              <h4 className="text-gray-900 font-medium">
                {/* {item.title ? item.filename.replace('AnnualReport_', '').replace('.pdf', '') : 'Annual Report'} */}
                {item.title} <span className="ml-2 text-xs text-gray-400">({item.filename? item.filename.replace('AnnualReport_', '').replace('.pdf', '') : 'Annual Report'})</span>
                {/* {item.financial_year && <span className="ml-2 text-sm text-gray-500">FY {item.financial_year}</span>} */}
              </h4>
              </div>
              
            </div>

            <div className="flex items-center gap-2">
              {item.severity && (
                <span className={`inline-flex items-center px-2 py-1 rounded-medium text-xs font-medium ${getRiskSegmentColor(item.severity)}`}>
                  {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                </span>
              )}
              <div className="flex items-center text-xs text-gray-500 font-medium">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {item.financial_year ? `FY ${item.financial_year}` : formatDate(item.date)}
              </div>
            </div>
            {item.page_number && (
              <div className="flex items-center text-xs text-gray-500 font-medium">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Page {typeof item.page_number === 'string' ? parseInt(item.page_number) : item.page_number}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700">
            <p className="text-gray-800">{item.insight || item.summary}</p>
            {item.bare_text && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 italic">
                &quot;{item.bare_text}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default card type
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-1">
              <h4 className="text-gray-900 font-medium">{item.title}</h4>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {formatDate(item.date)}
            </div>
            {item.risk_segment && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskSegmentColor(item.risk_segment)}`}>
                {item.risk_segment.charAt(0).toUpperCase() + item.risk_segment.slice(1)}
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700">
          <p>{item.summary}</p>
          {(() => {
            // Handle sources display logic
            if (item.sources) {
              // If sources field exists, use it (prioritize this)
              try {
                const sourcesArray = typeof item.sources === 'string' 
                  ? JSON.parse(item.sources) 
                  : item.sources;
                
                if (Array.isArray(sourcesArray) && sourcesArray.length > 0) {
                  return (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Sources: 
                        <span className="flex flex-wrap gap-1 ml-1">
                          {sourcesArray.map((url: string, i: number) => {
                            // Pass the index for direct matching when sources and url_dates are in same order
                            const urlDate = formatUrlDate(getUrlDate(url, i));
                            return (
                              <span key={i} className="inline-flex items-center">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline inline-flex items-center"
                                >
                                  {extractDomain(url)}
                                </a>
                                {urlDate && (
                                  <span className="text-gray-500 ml-1">[{urlDate}]</span>
                                )}
                                {i < sourcesArray.length - 1 && <span className="text-gray-400 mx-1">•</span>}
                              </span>
                            );
                          })}
                        </span>
                      </span>
                    </div>
                  );
                }
              } catch (error) {
                console.warn('Failed to parse sources:', error);
              }
            }
            
            // Fallback to single source if no sources array
            if (item.source) {
              const urlDate = formatUrlDate(getUrlDate(item.source));
              return (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Source: <a 
                      href={item.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {extractDomain(item.source)}
                    </a>
                    {urlDate && (
                      <span className="text-gray-500 ml-1">[{urlDate}]</span>
                    )}
                  </span>
                </div>
              );
            }
            
            return null;
          })()}
          {item.source_urls && item.source_urls.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="flex items-center mb-1">
                <ExternalLink className="h-3 w-3 mr-1" />
                Sources:
              </span>
              <div className="flex flex-wrap gap-1">
                {item.source_urls?.map((url: string, i: number) => {
                  // Pass the index for direct matching when source_urls and url_dates are in same order
                  const urlDate = formatUrlDate(getUrlDate(url, i));
                  return (
                    <span key={i} className="inline-flex items-center">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center"
                      >
                        {extractDomain(url)}
                      </a>
                      {urlDate && (
                        <span className="text-gray-500 ml-1">[{urlDate}]</span>
                      )}
                      {i < (item.source_urls?.length || 0) - 1 && <span className="text-gray-400 mx-1">•</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SectionSelectorProps {
  sections: string[];
  activeSection: string;
  onChange: (section: string) => void;
  config: ExternalInsightsConfig;
  counts: Record<string, number>;
}

const SectionSelector: FC<SectionSelectorProps> = ({ 
  sections, 
  activeSection, 
  onChange,
  config,
  counts
}) => {
  return (
    <div className="mb-6">
      <Tabs value={activeSection} onValueChange={onChange} className="w-full block">
        <div className="overflow-x-auto">
          <TabsList className="bg-gray-100 flex w-full rounded-lg">
            {sections.map(section => {
              const sectionConfig = config.sections[section];
              const isActive = activeSection === section;
              const count = counts[section] || 0;
              const shortName = config.shortNames[section] || section;
              
              return (
                <TabsTrigger 
                  key={section} 
                  value={section}
                  className={`px-3 py-1.5 text-xs flex flex-1 items-center justify-center gap-1.5 min-w-[70px] ${isActive ? '!text-blue-600' : ''}`}
                  style={{ color: isActive ? '#2563eb' : '' }}
                >
                  <sectionConfig.icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-600' : ''}`} />
                  <span className={`hidden sm:inline text-xs ${isActive ? '!text-blue-600' : ''}`}>
                    {shortName}
                    {count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-gray-200 rounded-full text-xs">
                        {count}
                      </span>
                    )}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
};

const ExternalInsightsComponent: FC<ExternalInsightsComponentProps> = ({ 
  config, 
  contextId, 
  className = '',
  initialSection = null,
  externalData,
  externalLoading = false,
  externalApiResponses
}) => {
  const [activeSection, setActiveSection] = useState<string>(config.primaryCategories[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insightsData, setInsightsData] = useState<Record<string, InsightItem[]>>({});


  // If parent provided externalData, use it directly and skip internal fetching.
  // If parent provided raw API responses (externalApiResponses), transform them here using
  // the configured transformer so the component shows the same mapping as when it fetches.
  useEffect(() => {
    if (externalData) {
      setInsightsData(externalData);
      setLoading(!!externalLoading);
      setError(null);
      return;
    }

    if (externalApiResponses) {
      try {
        setLoading(!!externalLoading);
        setError(null);
        const transformedData = config.dataTransformer(externalApiResponses);
        setInsightsData(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to transform external API responses');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fetch data on mount and when contextId changes
    const fetchData = async () => {
      if (!contextId) return;

      setLoading(true);
      setError(null);

      try {
        const rawData = await config.apiEndpoints.fetchData(contextId);

        // Fetch additional data if endpoints are provided
        let auditData = null;
        let annualData = null;

        if (config.apiEndpoints.fetchAuditReports) {
          try {
            auditData = await config.apiEndpoints.fetchAuditReports(contextId);
          } catch (err) {
            console.warn('Failed to fetch audit reports:', err);
          }
        }

        if (config.apiEndpoints.fetchAnnualReports) {
          try {
            annualData = await config.apiEndpoints.fetchAnnualReports(contextId);
          } catch (err) {
            console.warn('Failed to fetch annual reports:', err);
          }
        }

        // Transform data using the provided transformer
        const transformedData = config.dataTransformer({
          main: rawData,
          audit: auditData || undefined,
          annual: annualData || undefined
        });

        setInsightsData(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch external insights');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contextId, config, externalData, externalLoading, externalApiResponses]);

  // Respect initialSection prop when provided
  useEffect(() => {
    if (initialSection && initialSection in config.sections) {
      setActiveSection(initialSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection]);

  // No need to fetch reports from API - only use locally created ones



  // Helper to determine whether an insight item contains any meaningful content
  const isMeaningfulInsight = (item?: InsightItem | null) => {
    if (!item) return false;
    const hasText = (s?: unknown) => typeof s === 'string' && s.trim().length > 0;
    if (hasText(item.title)) return true;
    if (hasText(item.summary)) return true;
    if (hasText(item.insight)) return true;
    if (hasText(item.bare_text)) return true;
    if (Array.isArray(item.source_urls) && item.source_urls.length > 0) return true;
    if (item.source && String(item.source).trim().length > 0) return true;
    if (item.sources && (Array.isArray(item.sources) ? item.sources.length > 0 : String(item.sources).trim().length > 0)) return true;
    return false;
  };

  const sectionKeys = Object.keys(insightsData).filter(key => 
    Array.isArray(insightsData[key]) && (insightsData[key] as InsightItem[]).filter(isMeaningfulInsight).length > 0
  );

  // Calculate counts for each section using the redFlagMapper when available.
  // Fallback to counting items with a risk_segment (or total items) if mapper isn't provided or fails.
  const counts = (config.primaryCategories || Object.keys(insightsData)).reduce((acc, key) => {
    const items = insightsData[key] || [];
    const meaningfulItems = (Array.isArray(items) ? (items as InsightItem[]).filter(isMeaningfulInsight) : []);

    if (typeof config.redFlagMapper === 'function') {
      try {
        const flags = config.redFlagMapper(key, meaningfulItems, contextId) || [];
        if (Array.isArray(flags)) {
          const riskCount = flags.filter(f => {
            const sev = (f.severity || '').toString().toLowerCase();
            return ['severe', 'high', 'medium'].includes(sev);
          }).length;
          acc[key] = riskCount;
        } else {
          acc[key] = 0;
        }
        return acc;
      } catch {
        // ignore and fallback
      }
    }

    // Fallback: count meaningful items that have a risk_segment/severity in risk levels
    const withRisk = meaningfulItems.filter(i => {
      const insightItem = i as InsightItem;
      const sev = ((insightItem.risk_segment as string) || (insightItem.severity as string) || '').toString().toLowerCase();
      return ['severe', 'high', 'medium'].includes(sev);
    }).length;
    acc[key] = withRisk > 0 ? withRisk : (meaningfulItems.length || 0);
    return acc;
  }, {} as Record<string, number>);

  // Get all available sections from primary categories (show all tabs regardless of data)
  const availableSections = config.primaryCategories;

  // Function to get filtered sections based on active selection
  const getFilteredSections = () => {
    return [activeSection];
  };

  const renderSectionContent = (sectionKey: string, items: InsightItem[]) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-32 text-center bg-gray-50 rounded-lg">
          <Globe className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">No insights available for this category</p>
        </div>
      );
    }

    // Determine card type based on section
    let cardType: 'default' | 'audit' | 'annual' = 'default';
    if (sectionKey.includes('audit')) cardType = 'audit';
    if (sectionKey.includes('annual')) cardType = 'annual';

    return (
      <div className="mt-4 space-y-4">
        {items.map((item: InsightItem, index: number) => (
          <InsightCard
            key={`${sectionKey}-${index}`}
            item={item}
            cardType={cardType}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500 font-medium">Error fetching external insights</p>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (sectionKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Globe className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No external insights available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionSelector 
        sections={availableSections}
        activeSection={activeSection}
        onChange={setActiveSection}
        config={config}
        counts={counts}
      />

      {/* Main Content */}
      <div className="space-y-8">
        {getFilteredSections().map((key) => {
          const items = insightsData[key] || [];
          const meaningfulItems = Array.isArray(items) ? (items as InsightItem[]).filter(isMeaningfulInsight) : [];
          const sectionConfig = config.sections[key];
          const rawRedFlags = (typeof config.redFlagMapper === 'function') ? (config.redFlagMapper(key, meaningfulItems, contextId) || []) : [];

          const redFlags = rawRedFlags.map(flag => {
            // Extract risk_segment and severity from the insight data
            const insight = meaningfulItems.find(item => 
              item.title === flag.description || 
              item.summary === flag.description
            );
            
            let severity: RedFlag['severity'];

            // For audit and annual reports, use severity directly
            if ((key.includes('audit') || key.includes('annual')) && insight?.severity) {
              const sev = insight.severity.toLowerCase();
              severity = sev as RedFlag['severity'];
            } else {
              // Use risk_segment for other tabs
              const riskSegment = insight?.risk_segment?.toLowerCase() || '';
              switch (riskSegment) {
                case 'severe':
                  severity = 'severe';
                  break;
                case 'high':
                  severity = 'high';
                  break;
                case 'medium':
                  severity = 'medium';
                  break;
                default:
                  severity = 'medium';
              }
            }
            
            return {
              ...flag,
              category: getTagCategory(flag.rule_type || ''),
              severity,
              isPositive: false // Risk segments indicate issues, so they're never positive
            };
          });
          
          // Convert severity type before filtering
          const convertSeverity = (flag: RedFlag) => {
            const severityMap: SeverityToRedFlagSeverity = {
              'severe': 'severe',
              'high': 'high',
              'medium': 'medium',
              'low': 'medium',
              'good': 'good',
              'veryGood': 'veryGood'
            };
            return severityMap[flag.severity] || 'medium';
          };

          // Split flags into the buckets expected by SectionHeaderWithFlags
          const extremeNegativeFlags = redFlags.filter(f => convertSeverity(f) === 'severe');
          const negativeFlagsBucket = redFlags.filter(f => convertSeverity(f) === 'high');
          const mildNegativeFlagsBucket = redFlags.filter(f => convertSeverity(f) === 'medium');
          const neutralFlagsBucket = redFlags.filter(f => convertSeverity(f) === 'neutral');
          const mildPositiveFlagsBucket = redFlags.filter(f => convertSeverity(f) === 'good');
          const positiveFlagsBucket = redFlags.filter(f => convertSeverity(f) === 'veryGood');

          if (!sectionConfig) return null;

          return (
            <div key={key}>
                <SectionHeaderWithFlags
                  positiveFlags={positiveFlagsBucket}
                  negativeFlags={negativeFlagsBucket}
                  neutralFlags={neutralFlagsBucket}
                  mildPositiveFlags={mildPositiveFlagsBucket}
                  mildNegativeFlags={mildNegativeFlagsBucket}
                  extremeNegativeFlags={extremeNegativeFlags}
                  title={sectionConfig.title}
                  icon={sectionConfig.icon}
                  iconColorClass={sectionConfig.iconColorClass}
                />
              {renderSectionContent(key, meaningfulItems)}
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default ExternalInsightsComponent;
