import { FC, useState, useMemo, useCallback, ReactElement } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, FilterX, RefreshCw, Search, XCircle, CheckCircle, Info } from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select2';
import { Input } from '@/components/ui/input';

// Types
export interface RedFlag {
  id: string;
  description: string;
  severity: 'Severe' | 'High' | 'Medium' | 'Neutral' | 'Good' | 'Very Good';
  rule_type?: string;
  flag_type?: string;
  created_at: string;
  rule_name?: string;
  rule_code?: string;
  metric_values?: Record<string, any>;
}

export interface FlagCategoryOption {
  value: string;
  label: string;
  icon: any;
}

export interface FlagSeverityOption {
  value: string;
  label: string;
  icon: any;
}

// Define the tab type to match ArtifactStore
interface Tab {
  id: string;
  title: string;
  renderArtifact: () => ReactElement;
}

interface RedFlagsRenderProps {
  flags: RedFlag[];
  severityOptions: FlagSeverityOption[];
  categoryOptions: FlagCategoryOption[];
  onFlagClick?: (flag: RedFlag) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  getCategoryInfo: (ruleType: string) => { 
    category: string; 
    label: string; 
    icon: any; 
    color: string;
  };
  // Optional filters state management (could be managed in parent or internally)
  externalFilterSeverities?: string[];
  setExternalFilterSeverities?: (severities: string[]) => void;
  allowViewModeToggle?: boolean;
  useArtifactTab?: boolean; // Whether to open flags in artifact tabs
  artifactStore?: {
    addTab: (tab: Tab) => void;
    setCollapsed: (collapsed: boolean) => void;
  };
}

// Shared component for rendering flag details
export const FlagDetailView: FC<{ flag: RedFlag }> = ({ flag }) => {
  const getSeverityColor = (severity: string = 'neutral') => {
    switch ((severity || '').toLowerCase()) {
      case 'severe':
        return 'text-red-700';
      case 'high':
        return 'text-orange-700';
      case 'medium':
        return 'text-yellow-700';
      case 'neutral':
        return 'text-gray-700';
      case 'good':
        return 'text-emerald-700';
      case 'very good':
        return 'text-green-700';
      default:
        return 'text-gray-700';
    }
  };

  // Format date safely
  let formattedDate = 'Unknown date';
  try {
    if (flag.created_at) {
      formattedDate = format(new Date(flag.created_at), 'MMM dd, yyyy');
    }
  } catch (e) {
    console.warn('Error formatting date:', e);
  }

  // Make sure we have a flag with valid data
  if (!flag) {
    return <div className="p-4 text-gray-500">Flag details not available</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Flag Details</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Severity</p>
          <p className={`text-sm capitalize ${getSeverityColor(flag.severity)}`}>
            {flag.severity || 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Description</p>
          <p className="text-sm">{flag.description || 'No description available'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Type</p>
          <p className="text-sm">{flag.rule_type || flag.flag_type || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Created At</p>
          <p className="text-sm">{formattedDate}</p>
        </div>
        {flag.rule_code && (
          <div>
            <p className="text-sm text-gray-500">Rule Code</p>
            <p className="text-sm font-mono">{flag.rule_code}</p>
          </div>
        )}
        {flag.rule_name && (
          <div>
            <p className="text-sm text-gray-500">Rule Name</p>
            <p className="text-sm">{flag.rule_name}</p>
          </div>
        )}
        {flag.metric_values && Object.entries(flag.metric_values).length > 0 && (
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Metric Values</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {Object.entries(flag.metric_values).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-gray-500">{key}</p>
                  <p className="text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const RedFlagsRender: FC<RedFlagsRenderProps> = ({
  flags,
  severityOptions,
  categoryOptions,
  onFlagClick,
  onRefresh,
  isLoading,
  getCategoryInfo,
  externalFilterSeverities,
  setExternalFilterSeverities,
  allowViewModeToggle = false,
  useArtifactTab = false,
  artifactStore
}) => {
  // Local state management if external filter state not provided
  const [filterSeverities, setFilterSeverities] = useState<string[]>(externalFilterSeverities || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'grouped'>('timeline');

  // Use either external or internal filter state
  const activeSeverityFilters = externalFilterSeverities || filterSeverities;
  const setActiveSeverityFilters = setExternalFilterSeverities || setFilterSeverities;

  // Default flag click handler that uses the artifact store if available
  const defaultFlagClickHandler = useCallback((flag: RedFlag) => {
    if (useArtifactTab && artifactStore) {
      artifactStore.addTab({
        id: flag.id,
        title: flag.description || 'Red Flag Details',
        renderArtifact: () => <FlagDetailView flag={flag} />
      });
      artifactStore.setCollapsed(false);
    }
  }, [useArtifactTab, artifactStore]);

  // Use provided handler or default
  const handleFlagClick = onFlagClick || defaultFlagClickHandler;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  // Function to check if a flag matches the search query
  const flagMatchesSearch = useCallback((flag: RedFlag, query: string): boolean => {
    if (!query.trim()) return true;
    
    const searchLower = query.toLowerCase();
    
    // Search in description
    if (flag.description?.toLowerCase().includes(searchLower)) return true;
    
    // Search in rule name
    if (flag.rule_name?.toLowerCase().includes(searchLower)) return true;
    
    // Search in rule code
    if (flag.rule_code?.toLowerCase().includes(searchLower)) return true;
    
    // Search in metric values
    if (flag.metric_values) {
      const metricEntries = Object.entries(flag.metric_values);
      for (const [key, value] of metricEntries) {
        if (key.toLowerCase().includes(searchLower)) return true;
        if (String(value).toLowerCase().includes(searchLower)) return true;
      }
    }
    
    // Search in rule type
    if (flag.rule_type?.toLowerCase().includes(searchLower)) return true;
    if (flag.flag_type?.toLowerCase().includes(searchLower)) return true;
    
    // Search in severity
    if (flag.severity?.toLowerCase().includes(searchLower)) return true;
    
    return false;
  }, []);

  // Filter flags based on selected categories, severity, and search query
  const filteredFlags = useMemo(() => {
    return flags.filter(flag => {
      const flagType = flag.rule_type || flag.flag_type || '';
      const info = getCategoryInfo(flagType);
      const category = info.category;
      
      // Check category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(category)) {
        return false;
      }
      
      // Check severity filters
      if (activeSeverityFilters.length > 0 && !activeSeverityFilters.includes(flag.severity.toLowerCase())) {
        return false;
      }
      
      // Check search query
      if (searchQuery && !flagMatchesSearch(flag, searchQuery)) {
        return false;
      }
      
      return true;
    });
  }, [flags, selectedCategories, activeSeverityFilters, searchQuery, flagMatchesSearch, getCategoryInfo]);

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return {
          icon: <XCircle className="h-4 w-4 text-white" />,
          color: 'red' as const,
          text: 'Severe',
          bgColor: 'bg-red-500'
        };
      case 'high':
        return {
          icon: <XCircle className="h-4 w-4 text-white" />,
          color: 'orange' as const,
          text: 'High',
          bgColor: 'bg-orange-500'
        };
      case 'medium':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-white" />,
          color: 'yellow' as const,
          text: 'Medium',
          bgColor: 'bg-yellow-500'
        };
      case 'neutral':
        return {
          icon: <Info className="h-4 w-4 text-white" />,
          color: 'gray' as const,
          text: 'Neutral',
          bgColor: 'bg-gray-500'
        };
      case 'good':
        return {
          icon: <CheckCircle className="h-4 w-4 text-white" />,
          color: 'emerald' as const,
          text: 'Good',
          bgColor: 'bg-emerald-500'
        };
      case 'very good':
        return {
          icon: <CheckCircle className="h-4 w-4 text-white" />,
          color: 'green' as const,
          text: 'Very Good',
          bgColor: 'bg-green-500'
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-white" />,
          color: 'gray' as const,
          text: 'Neutral',
          bgColor: 'bg-gray-500'
        };
    }
  };

  const renderFlagItem = (flag: RedFlag) => {
    if (!flag) {
      console.warn('Attempted to render a flag item with no flag data');
      return null;
    }

    const severityConfig = getSeverityConfig(flag.severity || 'medium');
    const flagType = flag.rule_type || flag.flag_type || '';
    const ruleTypeInfo = getCategoryInfo(flagType);
    
    // Format date safely
    let formattedDate = 'Unknown date';
    try {
      if (flag.created_at) {
        formattedDate = format(new Date(flag.created_at), 'MMM dd, yyyy');
      }
    } catch (e) {
      console.warn('Error formatting date:', e);
    }

    return (
      <motion.div 
        className="bg-white rounded-lg shadow p-4 mb-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        variants={itemVariants}
        onClick={() => handleFlagClick(flag)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-900">{flag.description || 'No description available'}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formattedDate} • {flag.rule_name || "Modus Agent"}
              </div>
              {flag.metric_values && Object.keys(flag.metric_values).length > 0 && (
                <div className="text-xs text-gray-500 mt-1 italic">
                  {Object.entries(flag.metric_values).map(([key, value], idx) => (
                    <span key={key}>
                      {idx > 0 && ', '}
                      {key.replace(/_/g, ' ').toUpperCase()}: {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-4">
            <BubbleTag text={ruleTypeInfo.label} color="blue" />
            <BubbleTag text={severityConfig.text} color={severityConfig.color} />
          </div>
        </div>
      </motion.div>
    );
  };

  const handleClearFilters = () => {
    setActiveSeverityFilters([]);
    setSelectedCategories([]);
    setSearchQuery('');
  };

  const TimelineView = () => (
    <div className="space-y-4">
      {filteredFlags.map((flag) => (
        <div key={flag.id}>
          {renderFlagItem(flag)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layout
      >
        <div className="flex flex-col space-y-4">
          {/* Filtering Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex gap-4">
              <MultiSelect
                options={severityOptions}
                onValueChange={setActiveSeverityFilters}
                value={activeSeverityFilters}
                placeholder="Filter by severity..."
                className="w-1/3"
              />
              <MultiSelect
                options={categoryOptions}
                onValueChange={setSelectedCategories}
                value={selectedCategories}
                placeholder="Filter by category..."
                className="w-1/3"
              />
              <div className="relative w-1/3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search in all data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full h-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(activeSeverityFilters.length > 0 || selectedCategories.length > 0 || searchQuery) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="h-8 gap-1 text-xs"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="h-8 gap-1 text-xs"
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layout
        key={`flags-container-${selectedCategories.join('-')}-${activeSeverityFilters.join('-')}-${searchQuery}`}
      >
        {filteredFlags.length > 0 ? (
          <motion.div 
            variants={itemVariants} 
            layout
            className="space-y-4"
            key={`flags-list-${selectedCategories.join('-')}-${activeSeverityFilters.join('-')}-${searchQuery}`}
          >
            <TimelineView />
          </motion.div>
        ) : (
          <motion.div 
            variants={itemVariants}
            layout
            key={`empty-state-${selectedCategories.join('-')}-${activeSeverityFilters.join('-')}-${searchQuery}`}
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-center">No red flags found</div>
              {(selectedCategories.length > 0 || activeSeverityFilters.length > 0 || searchQuery) && (
                <p className="text-sm text-gray-500 text-center mt-1">Try changing filters</p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default RedFlagsRender;
