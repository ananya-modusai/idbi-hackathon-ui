import React, { useState, useMemo, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { LayoutDashboard, Users, Briefcase, Banknote, Calendar, CalendarDays, AlertCircle, ShieldAlert, ShieldQuestion, ShieldCheck, Link2, Network, UserMinus, UserCheck, Share2, Workflow, Zap, UserPlus, Download, RotateCcw, Info, Search } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { ToggleTabs } from '@/components/custom/ToggleTabs';
import { SegmentedToggle } from '@/components/idbi/workspace-ui';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import { useSidebarStore } from '@/app/store/ui/sidebarStore';
import { ConnectionsArtifact } from './components/ConnectionsArtifact';
import { CentralityDetailsArtifact } from './components/CentralityDetailsArtifact';
import { CommunityDetailsArtifact } from './components/CommunityDetailsArtifact';
import { CommunityMembersArtifact } from './components/CommunityMembersArtifact';
import { LinkedIndividualsArtifact } from './components/LinkedIndividualsArtifact';
import { CustomPagination } from '@/components/custom/CustomPagination';
import CustomListFilter, { useFilterState, FilterGroupsState } from '@/components/custom/CustomList/customListFilter';
import { CustomListActionButton } from '@/components/custom/CustomList/customListActionButton';
import { HighLevelStatsData, LinkageStatsData, LinkageListData, LinkageListItem, CentralityStatsData, CentralityStatsItem, CommunityStatsData, RecencyStatsData, RecencyDetailsData, CommunityDetailsData, CommunityArtifactItem, LinkageListDataV2, LinkageMetricsV2Data, RiskDistributionData, LinkageStatsGraphData } from '@/app/types/customerTypes';
import { misService as customerService } from './misData';
import CustomLoader from '@/components/custom/CustomLoader';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ColorScheme } from '@/components/custom/CustomColorScheme';
import { Visualization } from '@/components/custom/visualization-mis';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatIndianNumber } from '@/utils/utils';

interface LinkageDistributionItemProps {
  label: string;
  subLabel?: string;
  count: string | number;
  percentage: string | number;
  color: string;
}

const LinkageDistributionItem: React.FC<LinkageDistributionItemProps> = ({ label, count, percentage, color }) => (
  <div className="flex flex-col space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:shadow-md">
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      <span className="text-lg font-bold text-gray-900">{count}</span>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage === '-' ? 0 : percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold text-gray-500 whitespace-nowrap w-8 text-right">{percentage}%</span>
    </div>
  </div>
);

export function MisPortfolioDashboardTab({ onOpenCustomer }: { onOpenCustomer?: (customerId: string) => void } = {}) {
  const { setShouldCloseSidebar } = useSidebarStore();
  
  useEffect(() => {
    setShouldCloseSidebar(true);
  }, [setShouldCloseSidebar]);

  const communityTableRef = useRef<(() => void) | null>(null);
  const topExposureTableRef = useRef<(() => void) | null>(null);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);
  const [isLinkageExpanded, setIsLinkageExpanded] = useState(true);
  const [connectorType, setConnectorType] = useState<'all' | 'strong'>('all');
  const [centralityConnectorType, setCentralityConnectorType] = useState<'all' | 'strong'>('all');
  const [linkageMetric, setLinkageMetric] = useState('Count');
  const [riskMetric, setRiskMetric] = useState('Count');
  const [isCommunityExpanded, setIsCommunityExpanded] = useState(true);
  const [linkageView, setLinkageView] = useState<'visualization' | 'data'>('visualization');
  const [cibilView, setCibilView] = useState<'visualization' | 'data'>('visualization');
  const [cibilMetric, setCibilMetric] = useState('Count');
  // Brief item 4: the same book grouped by bureau band or by Financial Health band.
  const [cibilGroupBy, setCibilGroupBy] = useState<'CIBIL' | 'Health'>('CIBIL');
  const [highLevelStats, setHighLevelStats] = useState<HighLevelStatsData | null>(null);
  const [linkageStats, setLinkageStats] = useState<LinkageStatsData | null>(null);
  const [linkageStatsGraph, setLinkageStatsGraph] = useState<LinkageStatsGraphData | null>(null);
  const [linkageList, setLinkageList] = useState<LinkageListData | null>(null);
  const [linkageListV2, setLinkageListV2] = useState<LinkageListDataV2 | null>(null);
  const [linkageMetricsV2, setLinkageMetricsV2] = useState<LinkageMetricsV2Data | null>(null);
  const [centralityStats, setCentralityStats] = useState<CentralityStatsData | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStatsData | null>(null);
  const [communityDetails, setCommunityDetails] = useState<CommunityDetailsData | null>(null);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionData | null>(null);
  const [riskDistributionByHealth, setRiskDistributionByHealth] = useState<RiskDistributionData | null>(null);
  const [recencyStats, setRecencyStats] = useState<RecencyStatsData | null>(null);
  const [recencyDetails, setRecencyDetails] = useState<RecencyDetailsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingLinkage, setIsLoadingLinkage] = useState(false);
  const [isLoadingLinkageGraph, setIsLoadingLinkageGraph] = useState(false);
  const [isLoadingLinkageList, setIsLoadingLinkageList] = useState(false);
  const [isLoadingLinkageMetricsV2, setIsLoadingLoadingLinkageMetricsV2] = useState(false);
  const [isLoadingCentrality, setIsLoadingCentrality] = useState(false);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [isLoadingCommunityDetails, setIsLoadingCommunityDetails] = useState(false);
  const [isLoadingRecency, setIsLoadingRecency] = useState(false);
  const [isLoadingRecencyDetails, setIsLoadingRecencyDetails] = useState(false);
  const [isLoadingRiskDistribution, setIsLoadingRiskDistribution] = useState(false);

  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [topExposureFilters, setTopExposureFilters] = useState<{
    connectorType: 'all' | 'strong';
    degree: string;
  }>({
    connectorType: 'all',
    degree: 'all'
  });
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['june']);
  const [topExposurePage, setTopExposurePage] = useState(1);
  const [topExposureSearch, setTopExposureSearch] = useState('');
  const [triggerSearch, setTriggerSearch] = useState(0); // Add a trigger state for search button
  const [communityPage, setCommunityPage] = useState(1);
  const [showAtRiskInfo, setShowAtRiskInfo] = useState(false);

  const [centralityHiddenVersion, setCentralityHiddenVersion] = useState(0);

  // Initialize selectedNodeTypes with all available attribute keys once centralityStats is loaded
  useEffect(() => {
    if (centralityStats && selectedNodeTypes.length === 0) {
      const attributeKeys = [
        'CUSTOMER', 'GOV_ID', 'PHONE', 'EMAIL', 'LOCATION', 'DEVICE', 
        'BANK_ACCOUNT', 'UPI_ID', 'BANK_BRANCH', 'PAN', 'PASSPORT', 'VOTER_ID', 
        'DRIVING_LICENSE', 'RATION_CARD', 'TELEPHONE', 'ELECTRICITY_BILL', 
        'CREDIT_CARD', 'DEBIT_CARD', 'OTHER'
      ];
      setSelectedNodeTypes(attributeKeys);
    }
  }, [centralityStats]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await customerService.getHighLevelStats();
        setHighLevelStats(stats);
      } catch (error) {
        console.error('Error fetching high-level stats:', error);
        setHighLevelStats(null);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLinkageStats = async () => {
      setIsLoadingLinkage(true);
      try {
        const stats = await customerService.getLinkageStats(connectorType);
        setLinkageStats(stats);
      } catch (error) {
        console.error('Error fetching linkage stats:', error);
        setLinkageStats(null);
      } finally {
        setIsLoadingLinkage(false);
      }
    };

    fetchLinkageStats();
  }, [connectorType]);

  useEffect(() => {
    const fetchLinkageStatsGraph = async () => {
      setIsLoadingLinkageGraph(true);
      try {
        const stats = await customerService.getLinkageStatsGraph();
        setLinkageStatsGraph(stats);
      } catch (error) {
        console.error('Error fetching linkage stats graph:', error);
        setLinkageStatsGraph(null);
      } finally {
        setIsLoadingLinkageGraph(false);
      }
    };

    fetchLinkageStatsGraph();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchLinkageListV2 = async () => {
      setIsLoadingLinkageList(true);
      try {
        let userid: string | undefined = undefined;
        let name: string | undefined = undefined;
        const query = (topExposureSearch || '').trim();
        if (query.length >= 3) {
          if (/^\d+$/.test(query)) {
            userid = query;
          } else {
            name = query;
          }
        }

        const stats = await customerService.getLinkageListV2(
          topExposureFilters.connectorType.toLowerCase(),
          topExposureFilters.degree,
          topExposurePage,
          100,
          false,
          userid,
          name
        );
        if (active) setLinkageListV2(stats);
      } catch (error) {
        console.error('Error fetching linkage list v2:', error);
        if (active) setLinkageListV2(null);
      } finally {
        if (active) setIsLoadingLinkageList(false);
      }
    };

    const query = (topExposureSearch || '').trim();
    if (query.length > 0 && query.length < 3) {
      if (active) {
        // Wait until 3 chars are entered before fetching
      }
      return;
    }

    // Do not auto-fetch if it's purely digits (userid). Wait for the trigger.
    if (query.length >= 3 && /^\d+$/.test(query) && triggerSearch === 0) {
      return;
    }

    const t = setTimeout(() => {
      fetchLinkageListV2();
    }, query.length >= 3 && !/^\d+$/.test(query) ? 1000 : 0);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [topExposureFilters, topExposurePage, topExposureSearch, triggerSearch]);

  // useEffect(() => {
  //   const fetchLinkageMetricsV2 = async () => {
  //     setIsLoadingLoadingLinkageMetricsV2(true);
  //     try {
  //       const stats = await customerService.getLinkageMetricsV2(
  //         topExposureFilters.connectorType.toLowerCase(),
  //         topExposureFilters.degree
  //       );
  //       setLinkageMetricsV2(stats);
  //     } catch (error) {
  //       console.error('Error fetching linkage metrics v2:', error);
  //       setLinkageMetricsV2(null);
  //     } finally {
  //       setIsLoadingLoadingLinkageMetricsV2(false);
  //     }
  //   };

  //   fetchLinkageMetricsV2();
  // }, [topExposureFilters]);

  useEffect(() => {
    const fetchCentralityStats = async () => {
      setIsLoadingCentrality(true);
      try {
        const stats = await customerService.getCentralityStats(centralityConnectorType);
        if (stats) {
          setCentralityStats(stats);
        } else {
          setCentralityStats({
            connector_type: centralityConnectorType,
            none_centrality: {} as CentralityStatsItem,
            small_centrality: {} as CentralityStatsItem,
            medium_centrality: {} as CentralityStatsItem,
            large_centrality: {} as CentralityStatsItem,
            mega_centrality: {} as CentralityStatsItem
          });
        }
      } catch (error) {
        console.error('Error fetching centrality stats:', error);
        setCentralityStats({
          connector_type: centralityConnectorType,
          none_centrality: {} as CentralityStatsItem,
          small_centrality: {} as CentralityStatsItem,
          medium_centrality: {} as CentralityStatsItem,
          large_centrality: {} as CentralityStatsItem,
          mega_centrality: {} as CentralityStatsItem
        });
      } finally {
        setIsLoadingCentrality(false);
      }
    };

    fetchCentralityStats();
  }, [centralityConnectorType]);

  const [communityFilters, setCommunityFilters] = useState({
    communitySize: 'small',
    connectorType: 'all'
  });

  useEffect(() => {
    const fetchCommunityStats = async () => {
      setIsLoadingCommunity(true);
      try {
        const stats = await customerService.getCommunityStats(
          communityFilters.communitySize,
          communityFilters.connectorType
        );
        setCommunityStats(stats);
      } catch (error) {
        console.error('Error fetching community stats:', error);
        setCommunityStats(null);
      } finally {
        setIsLoadingCommunity(false);
      }
    };

    fetchCommunityStats();
  }, [communityFilters]);

  useEffect(() => {
    setCommunityPage(1);
  }, [communityFilters]);

  useEffect(() => {
    const fetchCommunityDetails = async () => {
      setIsLoadingCommunityDetails(true);
      try {
        const details = await customerService.getCommunityDetails(
          communityFilters.communitySize,
          communityFilters.connectorType,
          communityPage,
          100
        );
        setCommunityDetails(details);
      } catch (error) {
        console.error('Error fetching community details:', error);
        setCommunityDetails(null);
      } finally {
        setIsLoadingCommunityDetails(false);
      }
    };

    fetchCommunityDetails();
  }, [communityFilters, communityPage]);


  const [recencyFilters, setRecencyFilters] = useState({
    timeFrame: '1day'
  });

  useEffect(() => {
    const fetchRecencyStats = async () => {
      setIsLoadingRecency(true);
      try {
        const stats = await customerService.getRecencyStats(recencyFilters.timeFrame);
        if (stats) {
          setRecencyStats(stats);
        } else {
          setRecencyStats({
            time_frame: recencyFilters.timeFrame,
            new_customer_nodes: 0,
            new_loans_count: 0,
            new_loans_amount: 0,
            new_customer_customer_connections: 0
          });
        }
      } catch (error) {
        console.error('Error fetching recency stats:', error);
        setRecencyStats({
          time_frame: recencyFilters.timeFrame,
          new_customer_nodes: 0,
          new_loans_count: 0,
          new_loans_amount: 0,
          new_customer_customer_connections: 0
        });
      } finally {
        setIsLoadingRecency(false);
      }
    };

    fetchRecencyStats();
  }, [recencyFilters]);

  const [recencyPage, setRecencyPage] = useState(1);

  useEffect(() => {
    const fetchRecencyDetails = async () => {
      setIsLoadingRecencyDetails(true);
      try {
        const details = await customerService.getRecencyDetails(recencyFilters.timeFrame, recencyPage, 20);
        if (details) {
          setRecencyDetails(details);
        } else {
          setRecencyDetails({
            time_frame: recencyFilters.timeFrame,
            base_date: new Date().toISOString().split('T')[0],
            window_start: '',
            window_end: '',
            page: recencyPage,
            limit: 20,
            total_count: 0,
            total_pages: 0,
            data: []
          });
        }
      } catch (error) {
        console.error('Error fetching recency details:', error);
        setRecencyDetails({
          time_frame: recencyFilters.timeFrame,
          base_date: new Date().toISOString().split('T')[0],
          window_start: '',
          window_end: '',
          page: recencyPage,
          limit: 20,
          total_count: 0,
          total_pages: 0,
          data: []
        });
      } finally {
        setIsLoadingRecencyDetails(false);
      }
    };

    fetchRecencyDetails();
  }, [recencyFilters, recencyPage]);


  useEffect(() => {
    const fetchRiskDistribution = async () => {
      setIsLoadingRiskDistribution(true);
      try {
        const [stats, byHealth] = await Promise.all([
          customerService.getRiskDistribution(),
          customerService.getRiskDistributionByHealth(),
        ]);
        setRiskDistribution(stats);
        setRiskDistributionByHealth(byHealth);
      } catch (error) {
        console.error('Error fetching risk distribution:', error);
        setRiskDistribution(null);
        setRiskDistributionByHealth(null);
      } finally {
        setIsLoadingRiskDistribution(false);
      }
    };

    fetchRiskDistribution();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      if (event.type === 'centrality-hidden-rows-changed') {
        setCentralityHiddenVersion((v) => v + 1);
      }
    };
    window.addEventListener('centrality-hidden-rows-changed', handler as EventListener);
    return () => {
      window.removeEventListener('centrality-hidden-rows-changed', handler as EventListener);
    };
  }, []);

  const communityFilterGroups = useMemo<FilterGroupsState>(() => ({
    primary: [
      {
        id: 'community-size',
        label: 'Community Size',
        type: 'multiselect',
        options: [
          { value: 'all', label: 'All (2+ customers)' },
          { value: 'small', label: 'Small (2-5 customers)' },
          { value: 'medium', label: 'Medium (6-15 customers)' },
          { value: 'large', label: 'Large (16-100 customers)' },
          { value: 'mega', label: 'Mega (100+ customers)' }
        ],
        selectedValues: [communityFilters.communitySize],
        onFilterChange: (values) => setCommunityFilters(prev => ({ ...prev, communitySize: values[0] || 'all' }))
      },
      {
        id: 'connector-type',
        label: 'Connector Type',
        type: 'togglebar',
        options: [
          { value: 'strong', label: 'Strong Connectors' },
          { value: 'all', label: 'All Connectors' }
        ],
        selectedValues: [communityFilters.connectorType],
        onFilterChange: (values) => setCommunityFilters(prev => ({ ...prev, connectorType: values[0] || 'strong' })),
        showAllOption: false
      },
      {
        id: 'community-search',
        label: 'Search',
        type: 'searchbar',
        options: [],
        selectedValues: [],
        onFilterChange: () => {},
        searchPlaceholder: 'Search Community ID',
        showLabel: false
      }
    ],
    secondary: []
  }), [communityFilters]);

  const { filterState: communityFilterState, setFilterState: setCommunityFilterState } = useFilterState(communityFilterGroups);

  const recencyFilterGroups = useMemo<FilterGroupsState>(() => ({
    primary: [
      {
        id: 'time-frame',
        label: 'Time Frame',
        type: 'togglebar',
        options: [
          { value: '1day', label: '1day' },
          { value: '7days', label: '7days' },
          { value: '30days', label: '30days' }
        ],
        selectedValues: recencyFilters.timeFrame === 'all' ? [] : [recencyFilters.timeFrame],
        onFilterChange: (values) => setRecencyFilters(prev => ({ ...prev, timeFrame: values[0] || 'all' }))
      }
    ],
    secondary: []
  }), [recencyFilters]);

  const { filterState: recencyFilterState, setFilterState: setRecencyFilterState } = useFilterState(recencyFilterGroups);
  
  const linkageCategoryFilterGroups = useMemo<FilterGroupsState>(() => ({
    primary: [
      {
        id: 'linkage-category',
        label: 'Category',
        type: 'togglebar',
        options: [
          { value: 'Count', label: 'Count' },
          { value: 'Loan', label: 'Loan' },
          { value: 'Default rate', label: 'Default rate' }
        ],
        selectedValues: [linkageMetric],
        onFilterChange: (values) => setLinkageMetric(values[0] || 'Count'),
        showAllOption: false
      }
    ],
    secondary: []
  }), [linkageMetric]);

  const { filterState: linkageCategoryFilterState, setFilterState: setLinkageCategoryFilterState } = useFilterState(linkageCategoryFilterGroups);

  const nodeTypeFilterGroups = useMemo<FilterGroupsState>(() => {
    const attributeKeys = [
      'CUSTOMER', 'GOV_ID', 'PHONE', 'EMAIL', 'LOCATION', 'DEVICE', 
      'BANK_ACCOUNT', 'UPI_ID', 'BANK_BRANCH', 'PAN', 'PASSPORT', 'VOTER_ID', 
      'DRIVING_LICENSE', 'RATION_CARD', 'TELEPHONE', 'ELECTRICITY_BILL', 
      'CREDIT_CARD', 'DEBIT_CARD', 'OTHER'
    ];
    
    return {
      primary: [
        {
          id: 'node-type',
          label: 'Node Type',
          type: 'multiselect',
          options: attributeKeys.map(key => ({ value: key, label: key.replace(/_/g, ' ') })),
          selectedValues: selectedNodeTypes,
          onFilterChange: (values) => setSelectedNodeTypes(values),
          showSummaryThreshold: 1,
          summaryLabel: (count: number) => `${count} types selected`
        }
      ],
      secondary: []
    };
  }, [selectedNodeTypes]);

  const { filterState: nodeTypeFilterState, setFilterState: setNodeTypeFilterState } = useFilterState(nodeTypeFilterGroups);

  const topExposureFilterGroups = useMemo<FilterGroupsState>(() => ({
    primary: [
      {
        id: 'month',
        label: 'Month',
        type: 'multiselect',
        options: [
          { value: 'june', label: 'June' },
          { value: 'july', label: 'July' },
          { value: 'august', label: 'August' },
          { value: 'september', label: 'September' },
          { value: 'october', label: 'October' },
          { value: 'november', label: 'November' },
          { value: 'december', label: 'December' }
        ],
        selectedValues: selectedMonths,
        onFilterChange: (values) => {
          setSelectedMonths(values);
          setTopExposurePage(1);
        },
        showAllOption: false,
        showSummaryThreshold: 2,
        summaryLabel: (count: number) => `${count} months selected`
      },
      {
        id: 'degree',
        label: 'Degree',
        type: 'togglebar',
        options: [
          { value: 'all', label: 'All' },
          { value: '2', label: '2nd' },
          { value: '4', label: '4th' },
          { value: '6', label: '6th' }
        ],
        selectedValues: [topExposureFilters.degree],
        onFilterChange: (values) => {
          setTopExposureFilters(prev => ({ ...prev, degree: values[0] || 'all' }));
          setTopExposurePage(1);
        },
        showAllOption: false
      },
      {
        id: 'connector-type',
        label: 'Connector Type',
        type: 'togglebar',
        options: [
          { value: 'strong', label: 'Strong Connectors' },
          { value: 'all', label: 'All Connectors' }
        ],
        selectedValues: [topExposureFilters.connectorType],
        onFilterChange: (values) => {
          setTopExposureFilters(prev => ({ ...prev, connectorType: (values[0] as 'all' | 'strong') || 'all' }));
          setTopExposurePage(1); // Reset to page 1 on filter change
        },
        showAllOption: false
      },
      {
        id: 'top-exposure-search',
        label: 'Search',
        type: 'searchbar',
        options: [],
        selectedValues: topExposureSearch ? [topExposureSearch] : [],
        onFilterChange: () => {},
        searchPlaceholder: 'Search CID or Customer',
        showLabel: false,
        onSearchChange: (query) => {
          setTopExposureSearch(query);
          setTopExposurePage(1);
        },
        actionElements: (
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <CustomListActionButton
              onClick={() => {
                const query = (topExposureSearch || '').trim();
                if (query.length < 3) return;
                setTopExposurePage(1);
                setTriggerSearch(prev => prev + 1); // trigger the search explicitly
              }}
              disabled={!topExposureSearch || topExposureSearch.trim().length < 3 || isLoadingLinkageList}
              color="blueTextWhiteBg"
              border={true}
              icon={Search}
            >
              Search
            </CustomListActionButton>
          </div>
        )
      }
    ],
    secondary: []
  }), [topExposureFilters, selectedMonths, topExposureSearch, isLoadingLinkageList]);

  const { filterState: topExposureFilterState, setFilterState: setTopExposureFilterState } = useFilterState(topExposureFilterGroups);

  const handleOpenConnectionsArtifact = (row: any, degree?: string) => {
    // For now, using mock data for the artifact table based on user image
    const connectionsData: any[] = [];

    const artifactId = `connections-${row.customer}-${Date.now()}`;
    const artifactStore = useArtifactStore.getState();
    
    artifactStore.addTab({
      id: artifactId,
      title: `Connections - ${row.customer}`,
      renderArtifact: () => (
        <ConnectionsArtifact 
          customerName={row.customer} 
          connections={connectionsData} 
        />
      )
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };

  const handleOpenInvestigation = (userId: string) => {
    window.open(`/Customer/Investigation/${userId}`, '_blank');
  };

  const handleOpenCentralityDetails = (tier: string, nodeType: string, limit: number) => {
    const artifactId = `centrality-details-${tier}-${nodeType}-${Date.now()}`;
    const artifactStore = useArtifactStore.getState();
    
    artifactStore.addTab({
      id: artifactId,
      title: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Centrality - ${nodeType.replace(/_/g, ' ')}`,
      renderArtifact: () => (
        <CentralityDetailsArtifact 
          connectorType={centralityConnectorType}
          centralityTier={tier}
          nodeType={nodeType}
          limit={limit}
        />
      )
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };
  
  const handleOpenCommunityDetails = (title: string) => {
    const artifactId = `community-details-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const artifactStore = useArtifactStore.getState();
    
    // Filter data based on the metric clicked
    const filteredData = communityTableData.filter(item => {
      if (title === 'Highest Exposure Community') {
        return item.total_loan_amount_inr === communityStats?.highest_exposure_community_inr;
      }
      if (title === 'Highest Default Community') {
        return item.default_customer_pct === communityStats?.highest_default_community_pct;
      }
      if (title === 'No. of At-Risk Communities') {
        return item.is_community_at_risk === true;
      }
      return true;
    });

    artifactStore.addTab({
      id: artifactId,
      title: title,
      renderArtifact: () => (
        <CommunityDetailsArtifact 
          title={title}
          data={filteredData} 
        />
      )
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };

  const handleOpenCommunityMembersArtifact = (communityId: string) => {
    const artifactId = `community-members-${communityId}-${Date.now()}`;
    const artifactStore = useArtifactStore.getState();
    
    artifactStore.addTab({
      id: artifactId,
      title: `Community Members - ${communityId}`,
      renderArtifact: () => (
        <CommunityMembersArtifact 
          communityId={communityId}
        />
      )
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };
  
  const handleOpenLinkedIndividualsArtifact = (row: any) => {
    const artifactId = `linked-individuals-${row.userid}-${Date.now()}`;
    const artifactStore = useArtifactStore.getState();
    
    artifactStore.addTab({
      id: artifactId,
      title: `Linked Individuals - ${row.name || row.userid}`,
      renderArtifact: () => (
        <LinkedIndividualsArtifact 
          customerName={row.name || row.userid}
          customerId={row.userid}
          connectorType={topExposureFilters.connectorType}
        />
      )
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };
  
  const handleDownloadCentralityStatsCSV = () => {
    if (!centralityStats) return;

    const headers = centralityTableColumns.map(col => {
      if (col.key === 'label') return 'Centrality Tier';
      return typeof col.header === 'string' ? col.header : col.key;
    });

    const rows = centralityTableRows.map(row => {
      const rowData: Record<string, any> = {};
      centralityTableColumns.forEach(col => {
        const header = col.key === 'label' ? 'Centrality Tier' : (typeof col.header === 'string' ? col.header : col.key);
        rowData[header] = (row as any)[col.key] || 0;
      });
      return rowData;
    });

    const csv = Papa.unparse({
      fields: headers,
      data: rows
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'centrality_stats.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenLinkageIdsArtifact = (userId: string, ids: string[], degree: string) => {
    const artifactId = `linkage-ids-${userId}-${degree}-${Date.now()}`;
    const artifactStore = useArtifactStore.getState();
    
    // Format IDs for a simple table display in the artifact
    const tableData = (ids || []).map((id, index) => ({ sno: index + 1, id }));

    artifactStore.addTab({
      id: artifactId,
      title: `${degree} Degree IDs - ${userId}`,
      renderArtifact: () => (
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{degree} Degree Connections</h3>
              <p className="text-sm text-gray-500">Customer ID: {userId}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <CustomTableView
              columns={[
                { key: 'sno', header: 'Sno.', sortable: false },
                { 
                  key: 'id', 
                  header: 'Customer ID', 
                  sortable: false,
                  render: (val: any) => (
                    <button 
                      onClick={() => handleOpenInvestigation(val)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {val}
                    </button>
                  )
                }
              ]}
              data={tableData}
              showCSVExport={true}
              initialRowLimit={50}
            />
          </div>
        </div>
      )
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };

  const mainMetrics = [
    { 
      label: 'Total Customers', 
      value: formatIndianNumber(highLevelStats?.total_customers), 
      icon: 'Users', 
      colorScheme: 'blue' as const 
    },
    { 
      label: '# Total Loans', 
      value: formatIndianNumber(highLevelStats?.total_loans_count), 
      icon: 'Briefcase', 
      colorScheme: 'green' as const 
    },
    { 
      label: 'Total Loan Disbursed', 
      value: highLevelStats?.total_loans_amount != null ? `₹${formatIndianNumber(highLevelStats.total_loans_amount / 10000000, 2)} Cr` : '-', 
      icon: 'Banknote', 
      colorScheme: 'orange' as const 
    },
    {
      label: 'Average Financial Health Score',
      value: highLevelStats?.avg_financial_health_score != null
        ? `${highLevelStats.avg_financial_health_score} / 100 · ${highLevelStats.avg_financial_health_band}`
        : '-',
      icon: 'Activity',
      colorScheme: 'purple' as const
    },
    {
      label: 'Customer Mix',
      value: highLevelStats?.new_to_bank_customers != null
        ? `${formatIndianNumber(highLevelStats.new_to_bank_customers)} New to Bank · ${formatIndianNumber(highLevelStats.existing_customers)} Existing`
        : '-',
      icon: 'UserPlus',
      colorScheme: 'indigo' as const
    },
    { 
      label: '% High Risk Customers', 
      value: highLevelStats ? `${highLevelStats.high_risk_customers_pct}%` : '-', 
      icon: 'ShieldAlert', 
      colorScheme: 'pink' as const,
      info: `A customer is classified as High Risk if any of the following conditions are met:
            • CIBIL Score ≤ 650 OR
            • Customer marked as Defaulter OR
            • Potential Evergreening flagged via SMS analysis OR
            • 3 or more EMI bounces detected via SMS analysis`
    },
    { 
      label: '% Medium Risk Customers', 
      value: highLevelStats ? `${highLevelStats.medium_risk_customers_pct}%` : '-', 
      icon: 'ShieldQuestion', 
      colorScheme: 'yellow' as const,
      info: `A customer is classified as Medium Risk when all of the following conditions are met:
            • CIBIL Score greater than 650 & less than 700 
            • DPD (Days Past Due) ≤ 0`
    },
  ];

  const linkageKeyMetrics = [
    { 
      label: 'Total Customer Nodes', 
      value: formatIndianNumber(linkageStats?.total_customer_nodes), 
      icon: 'Users', 
      colorScheme: 'blue' as const 
    },
    { 
      label: 'Total Attribute Nodes', 
      value: formatIndianNumber(linkageStats?.total_attribute_nodes), 
      icon: 'Network', 
      colorScheme: 'purple' as const 
    },
    { 
      label: 'Avg Attributes / Customer', 
      value: linkageStats ? formatIndianNumber(linkageStats.avg_attributes_per_customer_1st_deg, 2) : '-', 
      icon: 'Share2', 
      colorScheme: 'teal' as const 
    },
  ];
  
  const AT_RISK_COMMUNITY_TITLE = 'No. of At-Risk Communities';
  const AT_RISK_COMMUNITY_INFO = `A community is classified as At-Risk if either of the following conditions is met:
            • 25% or more of the customers in the community have defaulted, OR
            • 5 or more customers have defaulted in the last 3 months.`;

  const communityKeyMetrics = [
    { 
      label: 'No. of Communities', 
      value: formatIndianNumber(communityStats?.no_of_communities), 
      icon: 'Users', 
      colorScheme: 'blue' as const 
    },
    { 
      label: 'Highest Exposure Community', 
       value: communityStats ? `₹${formatIndianNumber(communityStats.highest_exposure_community_inr / 100000, 2)} L` : '-', 
      icon: 'Zap', 
      colorScheme: 'orange' as const,
    },
    { 
      label: 'Highest Default Community', 
      value: communityStats ? (communityStats.highest_default_community_pct !== null ? `${communityStats.highest_default_community_pct}%` : '-') : '-', 
      icon: 'ShieldAlert', 
      colorScheme: 'red' as const,
    },
    { 
      label: 'No. of At-Risk Communities', 
      value: formatIndianNumber(communityStats?.at_risk_communities_count), 
      icon: 'AlertCircle', 
      colorScheme: 'purple' as const,
      info: AT_RISK_COMMUNITY_INFO,
      dialogTitle: AT_RISK_COMMUNITY_TITLE
    },
  ];

  const topExposureSubMetrics = useMemo(() => {
    const totalCustomers = linkageMetricsV2?.total_count || 0;

    const formatRange = (range: [number, number] | any) => {
      if (!range || !Array.isArray(range) || range.length < 2) return '-';
      const start = formatIndianNumber(range[0]);
      const end = formatIndianNumber(range[1]);
      return `${start} - ${end}`;
    };

    return [
      {
        label: 'Total Customers',
        value: formatIndianNumber(totalCustomers),
        icon: 'Users',
        colorScheme: 'blue' as const
      },
      {
        label: 'Loan Exposure Range',
        value: formatRange(linkageMetricsV2?.loan_exposure_range),
        icon: 'Banknote',
        colorScheme: 'green' as const
      },
      {
        label: 'CIBIL Range',
        value: formatRange(linkageMetricsV2?.cibil_range),
        icon: 'ShieldCheck',
        colorScheme: 'purple' as const
      },
      {
        label: '% Defaulter Range',
        value: formatRange(linkageMetricsV2?.defaulter_range),
        icon: 'AlertCircle',
        colorScheme: 'red' as const
      }
    ];
  }, [linkageListV2, linkageMetricsV2]);

  const recencyKeyMetrics = [
    { 
      label: 'New Customer Nodes', 
      value: formatIndianNumber(recencyStats?.new_customer_nodes), 
      icon: 'UserPlus', 
      colorScheme: 'blue' as const 
    },
    { 
      label: 'New Loans Count', 
      value: formatIndianNumber(recencyStats?.new_loans_count), 
      icon: 'Briefcase', 
      colorScheme: 'green' as const 
    },
    { 
      label: 'New Loans Amount', 
      value: recencyStats?.new_loans_amount != null ? `₹${formatIndianNumber(recencyStats.new_loans_amount / 100000, 2)} L` : '-', 
      icon: 'Banknote', 
      colorScheme: 'orange' as const 
    },
    { 
      label: 'New Customer-Customer Connections (2nd deg)', 
      value: formatIndianNumber(recencyStats?.new_customer_customer_connections), 
      icon: 'Network', 
      colorScheme: 'purple' as const 
    },
  ];

  const linkageDistribution = useMemo(() => {
    if (!linkageStats) return [];
    
    const {
      unconnected_customers_count = 0,
      unconnected_customers_pct = 0,
      deg2_plus_connected_count = 0,
      deg2_plus_connected_pct = 0,
      deg4_plus_connected_count = 0,
      deg4_plus_connected_pct = 0,
      deg6_plus_connected_count = 0,
      deg6_plus_connected_pct = 0
    } = linkageStats;

    // Calculate incremental values
    const deg2_count = Math.max(0, deg2_plus_connected_count - deg4_plus_connected_count);
    const deg2_pct = Math.max(0, deg2_plus_connected_pct - deg4_plus_connected_pct);
    const deg4_count = Math.max(0, deg4_plus_connected_count - deg6_plus_connected_count);
    const deg4_pct = Math.max(0, deg4_plus_connected_pct - deg6_plus_connected_pct);

    return [
      { 
        label: 'No-Link Customers', 
        count: formatIndianNumber(unconnected_customers_count), 
        percentage: unconnected_customers_pct, 
        color: '#94a3b8' 
      },
      { 
        label: 'Customers with 2nd-Degree Links', 
        count: formatIndianNumber(deg2_count), 
        percentage: deg2_pct.toFixed(2), 
        color: '#3b82f6' 
      },
      { 
        label: 'Customers with 4th-Degree Links', 
        count: formatIndianNumber(deg4_count), 
        percentage: deg4_pct.toFixed(2), 
        color: '#8b5cf6' 
      },
      { 
        label: 'Customers with 6th-Degree Links', 
        count: formatIndianNumber(deg6_plus_connected_count), 
        percentage: deg6_plus_connected_pct, 
        color: '#ec4899' 
      },
    ];
  }, [linkageStats]);

  const linkageDescriptionCounts = useMemo(() => {
    if (!linkageStats) {
      return {
        x: '-',
        y: '-',
        z: '-',
        n: '-',
      };
    }

    const {
      unconnected_customers_count = 0,
      deg2_plus_connected_count = 0,
      deg4_plus_connected_count = 0,
      deg6_plus_connected_count = 0,
    } = linkageStats;

    const deg2_count = Math.max(0, deg2_plus_connected_count - deg4_plus_connected_count);
    const deg4_count = Math.max(0, deg4_plus_connected_count - deg6_plus_connected_count);
    const deg6_count = Math.max(0, deg6_plus_connected_count);

    return {
      x: formatIndianNumber(deg2_count),
      y: formatIndianNumber(deg4_count),
      z: formatIndianNumber(deg6_count),
      n: formatIndianNumber(unconnected_customers_count),
    };
  }, [linkageStats]);

  const centralityTableColumns = useMemo(() => {
    const staticLabelColumn = { key: 'label', header: 'Type of Nodes —>', width: '220px' };
    const attributeKeys: (keyof CentralityStatsItem)[] = [
      'CUSTOMER', 'GOV_ID', 'PHONE', 'EMAIL', 'LOCATION', 'DEVICE', 
      'BANK_ACCOUNT', 'UPI_ID', 'PAN', 'PASSPORT', 'VOTER_ID', 
      'DRIVING_LICENSE', 'RATION_CARD', 'TELEPHONE', 'ELECTRICITY_BILL', 
      'CREDIT_CARD', 'DEBIT_CARD', 'OTHER'
    ];

    if (!centralityStats) {
      return [staticLabelColumn, ...attributeKeys.map(key => ({ key, header: (key as string) }))];
    }

    // Calculate totals for each column
    const columnTotals = attributeKeys.map(key => {
      const total = (
        (centralityStats.none_centrality?.[key] || 0) +
        (centralityStats.small_centrality?.[key] || 0) +
        (centralityStats.medium_centrality?.[key] || 0) +
        (centralityStats.large_centrality?.[key] || 0) +
        (centralityStats.mega_centrality?.[key] || 0)
      );
      return { key, total };
    });


    // Filter columns with total > 0
    const activeAttributeKeys = columnTotals
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .map(item => item.key);

    // Filter by selectedNodeTypes if any are selected
    const filteredAttributeKeys = activeAttributeKeys.filter(key => 
      selectedNodeTypes.length === 0 || selectedNodeTypes.includes(key as string)
    );

    return [
      staticLabelColumn,
      ...filteredAttributeKeys.map(key => ({ 
        key, 
        header: (key as string).replace(/_/g, ' ') 
      }))
    ];
  }, [centralityStats, selectedNodeTypes]);


  const linkageTableColumns = [
    { key: 'label', header: '', sortable: false },
    { key: 'count', header: 'Count', sortable: false },
    { key: 'percentage', header: 'Percentage', sortable: false },
  ];

  const linkageBarData = useMemo(() => {
    if (!linkageStats) return [];

    const {
      unconnected_customers_count = 0,
      unconnected_customers_pct = 0,
      deg2_plus_connected_count = 0,
      deg2_plus_connected_pct = 0,
      deg4_plus_connected_count = 0,
      deg4_plus_connected_pct = 0,
      deg6_plus_connected_count = 0,
      deg6_plus_connected_pct = 0,
      unconnected_customers_loan = 0,
      deg2_plus_connected_loan = 0,
      deg4_plus_connected_loan = 0,
      deg6_plus_connected_loan = 0
    } = linkageStats;

    // Calculate incremental values
    const deg2_count = Math.max(0, deg2_plus_connected_count - deg4_plus_connected_count);
    const deg2_pct = Math.max(0, deg2_plus_connected_pct - deg4_plus_connected_pct);

    const deg4_count = Math.max(0, deg4_plus_connected_count - deg6_plus_connected_count);
    const deg4_pct = Math.max(0, deg4_plus_connected_pct - deg6_plus_connected_pct);

    const isCount = linkageMetric === 'Count';

    if (isCount) {
      return [
        { name: 'No-Link', value: unconnected_customers_pct, count: unconnected_customers_count, color: '#001b44' },
        { name: '2nd-degree', value: Number(deg2_pct.toFixed(2)), count: deg2_count, color: '#0948ac' },
        { name: '4th-degree', value: Number(deg4_pct.toFixed(2)), count: deg4_count, color: '#4482eb' },
        { name: '6th-degree', value: deg6_plus_connected_pct, count: deg6_plus_connected_count, color: '#a5c0f3' },
      ];
    } else {
      const graphData = (linkageStatsGraph?.[connectorType as 'all' | 'strong'] ?? { "2": 0, "4": 0, "6": 0, "no_link": 0 }) as Record<string, number>;
      const totalAmount = (graphData["2"] || 0) + (graphData["4"] || 0) + (graphData["6"] || 0) + (graphData["no_link"] || 0);

      const getPct = (val: number) => totalAmount > 0 ? Number(((val / totalAmount) * 100).toFixed(2)) : 0;

      return [
        { name: 'No-Link', value: getPct(graphData["no_link"] || 0), amount: graphData["no_link"] || 0, color: '#001b44' },
        { name: '2nd-degree', value: getPct(graphData["2"] || 0), amount: graphData["2"] || 0, color: '#0948ac' },
        { name: '4th-degree', value: getPct(graphData["4"] || 0), amount: graphData["4"] || 0, color: '#4482eb' },
        { name: '6th-degree', value: getPct(graphData["6"] || 0), amount: graphData["6"] || 0, color: '#a5c0f3' },
      ];
    }
  }, [linkageStats, linkageMetric, linkageStatsGraph, connectorType]);

  const cibilDistributionData = useMemo(() => {
    const source = cibilGroupBy === 'Health' ? riskDistributionByHealth : riskDistribution;
    if (!source) return [];

    const isCount = cibilMetric === 'Count';

    // "No Bureau Score" closes both groupings: customers the bureau cannot rank.
    const order = cibilGroupBy === 'Health'
      ? ["Good", "Fair", "Poor", "No Bureau Score"]
      : ["<600", "600-650", "650-700", "700-750", ">750", "No Bureau Score"];

    // Don't render a bar for a band nobody falls into — an empty bar reads as a
    // rendering fault, not as "zero customers".
    return order.filter(key => ((source as any)[key]?.total_customers ?? 0) > 0).map(key => {
      const item = (source as any)[key] || {
        defaulter_count: 0,
        non_defaulter_count: 0,
        defaulter_loan_exposure: 0,
        non_defaulter_loan_exposure: 0
      };

      if (isCount) {
        return {
          name: key,
          defaulter: item.defaulter_count,
          nonDefaulter: item.non_defaulter_count
        };
      } else {
        return {
          name: key,
          defaulter: item.defaulter_loan_exposure,
          nonDefaulter: item.non_defaulter_loan_exposure
        };
      }
    });
  }, [riskDistribution, riskDistributionByHealth, cibilMetric, cibilGroupBy]);

  const riskPieData = useMemo(() => {
    const isCount = riskMetric === 'Count';
    if (isCount) {
      return [
        { name: 'High Risk', value: 1500, color: '#dc2626' },    // red-600
        { name: 'Medium Risk', value: 3200, color: '#ea580c' },  // orange-600
        { name: 'Low Risk', value: 5800, color: '#16a34a' },     // green-600
        { name: 'N/A', value: 800, color: '#525252' },          // gray-600
      ];
    } else {
      // Bucketed loan data placeholder
      return [
        { name: 'High Risk', value: 45000000, color: '#dc2626' },
        { name: 'Medium Risk', value: 78000000, color: '#ea580c' },
        { name: 'Low Risk', value: 125000000, color: '#16a34a' },
        { name: 'N/A', value: 12000000, color: '#525252' },
      ];
    }
  }, [riskMetric]);

  const riskPieTotal = useMemo(() => 
    riskPieData.reduce((acc, curr) => acc + curr.value, 0)
  , [riskPieData]);

  const connectionTableColumns = [
    { key: 'sno', header: 'SNO', sortable: false },
    { 
      key: 'userid', 
      header: 'CUSTOMERS', 
      sortable: true,
      isClickable: true,
      render: (val: any) => (
        <button 
          onClick={() => handleOpenInvestigation(val)}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
    { 
      key: 'deg2', 
      header: "CID'S - 2ND DEGREE", 
      sortable: false,
      isClickable: true,
      render: (val: any, row: any) => (
        <button 
          onClick={() => handleOpenLinkageIdsArtifact(row.userid, row._raw.linked_2nd_degree_customer_ids, '2nd')}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
    { 
      key: 'deg4', 
      header: "CID'S - 4TH DEGREE", 
      sortable: false,
      isClickable: true,
      render: (val: any, row: any) => (
        <button 
          onClick={() => handleOpenLinkageIdsArtifact(row.userid, row._raw.linked_4th_degree_customer_ids, '4th')}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
    { 
      key: 'deg6', 
      header: "CID'S - 6TH DEGREE", 
      sortable: false,
      isClickable: true,
      render: (val: any, row: any) => (
        <button 
          onClick={() => handleOpenLinkageIdsArtifact(row.userid, row._raw.linked_6th_degree_customer_ids, '6th')}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
  ];

  const connectionTableData = useMemo(() => {
    if (!linkageList || !Array.isArray(linkageList.data)) return [];
    return linkageList.data.map((item, index) => ({
      sno: index + 1,
      userid: item.userid,
      deg2: item.linked_2nd_degree_customer_ids?.length || 0,
      deg4: item.linked_4th_degree_customer_ids?.length || 0,
      deg6: item.linked_6th_degree_customer_ids?.length || 0,
      _raw: item
    }));
  }, [linkageList]);

  const topExposureTableColumns = [
    { key: 'sno', header: 'Sno.', sortable: false, width: '60px' },
    { 
      key: 'userid', 
      header: 'CID', 
      sortable: true,
      isClickable: true,
      render: (val: string) => (
        <button 
          onClick={() => handleOpenInvestigation(val)}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      // Only the bank's own customers open a profile. Every other row is a
      // synthetic record with nothing behind it, so it stays plain text.
      render: (val: any, row: any) =>
        row?.is_idbi_customer && onOpenCustomer ? (
          <button
            type="button"
            onClick={() => onOpenCustomer(String(row.userid))}
            className="text-blue-600 hover:underline font-medium text-left"
          >
            {val}
          </button>
        ) : (
          <span>{val ?? '-'}</span>
        )
    },
    { 
      key: 'risk_indicator', 
      header: 'Customer Risk', 
      sortable: true,
      render: (val: string) => {
        const riskIndicator = val?.toLowerCase() || '';
        let color: ColorScheme = 'slate';
        
        if (riskIndicator.includes('high') || riskIndicator.includes('critical')) color = 'red';
        else if (riskIndicator.includes('medium')) color = 'yellow';
        else if (riskIndicator.includes('low')) color = 'green';

        if (!val) return '-';

        return (
          <BubbleTag 
            text={val} 
            color={color} 
            withBorder={true}
          />
        );
      }
    },
    { 
      key: 'linked_individuals', 
      header: '#Linked Individuals', 
      sortable: true,
      isClickable: true,
      render: (val: any, row: any) => {
        if (topExposureFilters.degree !== 'all') {
          const deg = topExposureFilters.degree as "2" | "4" | "6";
          const cids = row.connected_individuals?.[deg];
          if (!cids || cids.length === 0) {
            return '-';
          }
        }
        return (
          <button 
            onClick={() => handleOpenLinkedIndividualsArtifact(row)}
            className="text-blue-600 hover:underline font-medium"
          >
            {formatIndianNumber(val)}
          </button>
        );
      }
    },
    { 
      key: 'loan_exposure', 
      header: 'Active Loan Amount', 
      sortable: true,
      render: (val: any) => val ? `₹${formatIndianNumber(val)}` : '-'
    },
    { key: 'loan_exposure_high', header: 'High Risk Loan Amount', sortable: true, render: (val: any) => val ? `₹${formatIndianNumber(val)}` : '-' },
    { key: 'loan_exposure_medium', header: 'Medium Risk Loan Amount', sortable: true, render: (val: any) => val ? `₹${formatIndianNumber(val)}` : '-' },
    { key: 'loan_exposure_low', header: 'Low Risk Loan Amount', sortable: true, render: (val: any) => val ? `₹${formatIndianNumber(val)}` : '-' },
    { key: 'avg_cibil', header: 'Average CIBIL', sortable: true, render: (val: any) => val != null ? Math.round(val) : '-' },
    // { key: 'avg_delay', header: 'Average Payment Delay ( Days )', sortable: true },
    { 
      key: 'recent_defaulter_count', 
      header: 'Recent Defaulter Count', 
      sortable: true, 
      render: (_val: any, row: any) => {
        const linked = Number(row.linked_individuals) || 0;
        const defPct = Number(row.defaulter) || 0;
        const count = Math.round(linked * (defPct / 100));
        return formatIndianNumber(count);
      } 
    },
    { 
      key: 'defaulter', 
      header: 'Defaulter %', 
      sortable: true,
      render: (val: any) => `${val}%`
    },
    
  ];

  const topExposureTableData = useMemo(() => {
    // Only June has real data; all other months show empty
    if (!selectedMonths.includes('june')) return [];

    if (!linkageListV2 || !Array.isArray(linkageListV2.data)) return [];
    
    // Create a copy to avoid mutating original data
    let sortedData = [...linkageListV2.data];

    // Local search filtering is disabled here so the table doesn't change 
    // immediately while typing. Filtering will be driven purely by the API call.
    // If the API returns a row for a specific degree, we display it even if CIDs are empty

    // Sort by loan_exposure descending
    sortedData.sort((a, b) => (b.loan_exposure || 0) - (a.loan_exposure || 0));

    return sortedData.map((item, index) => ({
      sno: index + 1,
      ...item
    }));
  }, [linkageListV2, topExposureFilterState.searchbarQueries, selectedMonths, topExposureFilters]);

  const communityTableColumns = useMemo(() => [
    { key: 'sno', header: 'SNO.', sortable: false, width: '60px' },
    { 
      key: 'community_id', 
      header: 'COMMUNITY ID', 
      sortable: true,
      render: (val: any) => (
        <span className="text-gray-700 font-medium text-xs font-mono">
          {val}
        </span>
      )
    },
    { 
      key: 'customer_count', 
      header: 'Connected Customers', 
      sortable: true,
      isClickable: true,
      render: (val: any, row: any) => (
        <button 
          onClick={() => handleOpenCommunityMembersArtifact(row.community_id)}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
    
    { 
      key: communityFilters.connectorType === 'strong' 
        ? 'strong_connector_total_outstanding_loan_inr' 
        : 'total_outstanding_loan_inr', 
      header: 'Active Loan Amount', 
      sortable: true,
      render: (val: any) => val ? `₹${val.toLocaleString('en-IN')}` : '-'
    },
    { key: 'total_outstanding_loan_high_risk_inr', header: 'High Risk Loan Amount', sortable: true, render: (val: any) => val ? `₹${val.toLocaleString('en-IN')}` : '-' },
    { key: 'total_outstanding_loan_medium_risk_inr', header: 'Medium Risk Loan Amount', sortable: true, render: (val: any) => val ? `₹${val.toLocaleString('en-IN')}` : '-' },
    { key: 'total_outstanding_loan_low_risk_inr', header: 'Low Risk Loan Amount', sortable: true, render: (val: any) => val ? `₹${val.toLocaleString('en-IN')}` : '-' },
    { key: 'default_customer_count', header: 'Defaulters', sortable: true },
    { 
      key: 'default_customer_pct', 
      header: 'Defaulter %', 
      sortable: true,
      render: (val: any) => `${val}%`
    },
    { 
      key: 'is_community_at_risk', 
      header: (
        <div className="flex items-center gap-1.5">
          <span>At-Risk Community</span>
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              setShowAtRiskInfo(true);
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="What is an At-Risk Community?"
          >
            <Info size={14} className="text-blue-500" />
          </button>
        </div>
      ),
      sortable: true, 
      // A stable cohort is a positive signal in its own right, so it gets a tag
      // rather than reading as the blank absence of risk.
      render: (val: any, row: any) => val
        ? <BubbleTag text="At-Risk" color="red" />
        : row?.is_community_stable
          ? <BubbleTag text="Stable" color="green" />
          : '-'
    },
  ], [communityFilters.connectorType]);

  const communityTableData = useMemo(() => {
    if (!communityDetails || !Array.isArray(communityDetails.data)) return [];
    
    let filteredData = communityDetails.data;

    const searchQuery = communityFilterState.searchbarQueries['community-search']?.toLowerCase() || '';
    if (searchQuery) {
      filteredData = filteredData.filter(item => 
        item.community_id?.toLowerCase().includes(searchQuery)
      );
    }

    return filteredData.map((item, index) => ({
      sno: index + 1,
      ...item
    }));
  }, [communityDetails, communityFilterState.searchbarQueries]);

  const recencyTableColumns = [
    { key: 'sno', header: 'S.No', sortable: false, width: '60px' },
    { 
      key: 'customer_id', 
      header: 'CID', 
      sortable: true,
      render: (val: string) => (
        <button 
          onClick={() => handleOpenInvestigation(val)}
          className="text-blue-600 hover:underline font-medium"
        >
          {val}
        </button>
      )
    },
    { key: 'name', header: 'Customer', sortable: true},
    { 
      key: 'risk', 
      header: 'Risk', 
      sortable: true,
      render: (val: string) => {
        if (!val) return '-';
        const riskIndicator = val?.toLowerCase() || '';
        let color: any = 'slate';
        
        if (riskIndicator.includes('high') || riskIndicator.includes('critical')) color = 'red';
        else if (riskIndicator.includes('medium')) color = 'yellow';
        else if (riskIndicator.includes('low')) color = 'green';
        
        return (
          <BubbleTag 
            text={val} 
            color={color} 
            withBorder={true}
          />
        );
      }
    },

    { key: 'cibil', header: 'CIBIL', sortable: true},
    { key: 'loan_count', header: '#Loan', sortable: true },
    { 
      key: 'loan_amount', 
      header: 'Total Loan Amount', 
      sortable: true,
      render: (val: any) => val ? `₹${val.toLocaleString('en-IN')}` : '-'
    },
    { 
      key: 'linked_individuals', 
      header: '#Linked Individuals', 
      sortable: true,
      render: (val: any) => formatIndianNumber(val)
    },
  ];

  const recencyTableData = useMemo(() => {
    if (!recencyDetails || !Array.isArray(recencyDetails.data)) return [];
    
    return recencyDetails.data.map((item, index) => ({
      sno: (recencyPage - 1) * 20 + index + 1,
      customer_id: item.customer_id,
      name: item.name,
      risk: item.risk,
      cibil: item.cibil,
      loan_count: item.loan_count,
      loan_amount: item.loan_amount,
      linked_individuals: item.linked_customers?.length || 0,
      _raw: item
    }));
  }, [recencyDetails, recencyPage]);




  const centralityTableRows = useMemo(() => {
    if (!centralityStats) return [];
    
    const getHiddenCount = (
      tierKey: 'none' | 'small' | 'medium' | 'large' | 'mega',
      nodeTypeKey: keyof CentralityStatsItem
    ): number => {
      if (typeof window === 'undefined') return 0;
      try {
        const storageKey = `centrality-hidden-rows::${centralityConnectorType}::${tierKey}::${nodeTypeKey}`;
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return 0;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    };

    const adjustTier = (
      tier: CentralityStatsItem,
      tierKey: 'none' | 'small' | 'medium' | 'large' | 'mega'
    ): CentralityStatsItem => {
      if (!tier) return {} as CentralityStatsItem;
      const adjusted: Partial<CentralityStatsItem> = {};
      (Object.keys(tier) as (keyof CentralityStatsItem)[]).forEach((k) => {
        const original = tier[k] || 0;
        const hidden = getHiddenCount(tierKey, k);
        adjusted[k] = Math.max(0, original - hidden);
      });
      return adjusted as CentralityStatsItem;
    };

    const none = adjustTier(centralityStats.none_centrality, 'none');
    const small = adjustTier(centralityStats.small_centrality, 'small');
    const medium = adjustTier(centralityStats.medium_centrality, 'medium');
    const large = adjustTier(centralityStats.large_centrality, 'large');
    const mega = adjustTier(centralityStats.mega_centrality, 'mega');

    return [
      { 
        label: 'No Community', 
        tierKey: 'none',
        range: '(1 Customer Connection)', 
        colorClass: 'text-green-600',
        textClass: 'text-green-950', 
        baseColor: '37, 99, 235', // blue-600
        ...none
      },
      { 
        label: 'Small Centrality', 
        tierKey: 'small',
        range: '(2-5 Customer Connections)', 
        colorClass: 'text-blue-600',
        textClass: 'text-blue-950', 
        baseColor: '37, 99, 235', // blue-600
        ...small
      },
      { 
        label: 'Medium Centrality', 
        tierKey: 'medium',
        range: '(6-15 Customer Connections)', 
        colorClass: 'text-amber-600',
        textClass: 'text-amber-950', 
        baseColor: '217, 119, 6', // amber-600
        ...medium
      },
      { 
        label: 'Large Centrality', 
        tierKey: 'large',
        range: '(16-100 Customer Connections)', 
        colorClass: 'text-orange-600',
        textClass: 'text-orange-950', 
        baseColor: '234, 88, 12', // orange-600
        ...large
      },
      { 
        label: 'Mega Centrality', 
        tierKey: 'mega',
        range: '(100+ Customer Connections)', 
        colorClass: 'text-red-600',
        textClass: 'text-red-950', 
        baseColor: '220, 38, 38', // red-600
        ...mega
      },
    ];
  }, [centralityStats, centralityConnectorType, centralityHiddenVersion]);

  return (
    <div className="px-2 py-4 space-y-6">
      {/* High-Level Stats Section */}
      <div>
        <SectionHeaderWithFlags
          title="High-Level Stats"
          icon={LayoutDashboard}
          iconColorClass="text-blue-600"
          allowCollapse={false}
          positiveFlags={[]}
          negativeFlags={[]}
        />
        <div className="mt-2">
          <CustomLoader loading={isLoadingStats} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading high-level stats...' }}>
            <KeyMetrics
              hardcodedMetrics={mainMetrics}
              isMetricsExpanded={isMetricsExpanded}
              setIsMetricsExpanded={setIsMetricsExpanded}
              showHeader={false}
              showCollapse={true}
            />
          </CustomLoader>
        </div>
      </div>

      {/* Linkage Stats Section */}
      <div>
        {/* <SectionHeaderWithFlags
          title="Linkage Stats"
          icon={Link2}
          iconColorClass="text-purple-600"
          allowCollapse={false}
          positiveFlags={[]}
          negativeFlags={[]}
          rightActions={(
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1 text-sm">
              <button
                onClick={(e) => { e.stopPropagation(); setConnectorType('strong'); }}
                className={`px-3 py-1 rounded-full transition ${connectorType === 'strong' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
              >
                Strong Connectors
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConnectorType('all'); }}
                className={`px-3 py-1 rounded-full transition ${connectorType === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
              >
                All Connectors
              </button>
            </div>
          )}
        /> */}
        
        <div className="mt-2 space-y-4">
          {/* Key Linkage Metrics */}
          {/* <CustomLoader loading={isLoadingLinkage} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading linkage stats...' }}>
            <KeyMetrics
              hardcodedMetrics={linkageKeyMetrics}
              isMetricsExpanded={isLinkageExpanded}
              setIsMetricsExpanded={setIsLinkageExpanded}
              showHeader={false}
              showCollapse={false}
            />
          </CustomLoader> */}

          {/* Charts Row */}
          <div className="flex flex-col md:flex-row md:items-stretch gap-6 mt-6">
            <div className="w-full md:w-1/2 p-0 flex flex-col">
              <SectionHeaderWithFlags
                title="Linkage Stats"
                icon={Link2}
                iconColorClass="text-blue-600"
                allowCollapse={false}
                positiveFlags={[]}
                negativeFlags={[]}
              />
              {/* Filters sit in their own row under the header, right-aligned —
                  the house pattern, not pinned to the header's right. */}
              <div className="mt-3 flex justify-end">
                <SegmentedToggle
                  value={connectorType}
                  onChange={(v) => setConnectorType(v as 'all' | 'strong')}
                  options={[
                    { value: 'strong', label: 'Strong Connectors' },
                    { value: 'all', label: 'All Connectors' },
                  ]}
                />
              </div>
              <div className="mt-4 flex-1 flex flex-col bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
                <p className="mb-4 h-5 text-sm font-medium text-gray-700 leading-5">
                  Customers by farthest connection degree
                </p>
                <CustomLoader loading={isLoadingLinkage || isLoadingLinkageGraph} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading linkage distribution...' }}>
                  <div className="h-[350px]">
                    <Visualization
                      type="combo"
                      data={linkageBarData}
                      xAxisKey="name"
                      yAxisKeys={[
                        { key: "value", color: "#001b44", type: "bar", label: "Percentage (%)" }
                      ]}
                      leftYAxisLabel="Percentage (%)"
                      height={350}
                      showGridlines={true}
                      isEnclosedInCard={false}
                      showXAxisLabel={true}
                      xAxisLabel="Degree"
                      showYAxisLabel={true}
                      showLabels={true}
                      showVerticalGridlines={true}
                      labelFormatter={(value: number, entry: any) => {
                        const val = entry.count ?? entry.amount ?? 0;
                        const formattedVal = linkageMetric === 'Loan' 
                          ? `₹${(val / 100000).toFixed(1)}L` 
                          : val?.toLocaleString() ?? '0';
                        return `${formattedVal}(${value}%)`;
                      }}
                      useColorFromData={true}
                      showLegend={false}
                      darkAxes={true}
                      barSize={60}
                      yAxisTickCount={5}
                      onRefresh={() => {}}
                      hideHeaderControls
                      activeView={linkageView}
                      onViewChange={(v: "visualization" | "data" | "code") => setLinkageView(v === 'code' ? 'visualization' : v)}
                    />
                  </div>
                </CustomLoader>
              </div>
            </div>
            
            {/* Risk Distribution Chart */}
            {/* <div className="w-full md:w-1/2 p-0 flex flex-col">
              <SectionHeaderWithFlags
                title="Risk Distribution"
                icon={ShieldAlert}
                iconColorClass="text-red-600"
                allowCollapse={false}
                positiveFlags={[]}
                negativeFlags={[]}
                rightActions={(
                  <div className="inline-flex items-center bg-gray-100 rounded-full p-1 text-[10px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRiskMetric('Count'); }}
                      className={`px-2 py-0.5 rounded-full transition ${riskMetric === 'Count' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500'}`}
                    >
                      Count
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRiskMetric('Loan'); }}
                      className={`px-2 py-0.5 rounded-full transition ${riskMetric === 'Loan' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500'}`}
                    >
                      Amount
                    </button>
                  </div>
                )}
              />
              <div className="mt-4 flex-1 flex flex-col bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ right: 0 }}>
                      <Pie
                        data={riskPieData}
                        cx="40%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={120}
                        paddingAngle={0}
                        dataKey="value"
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          const percent = ((value / (riskPieTotal || 1)) * 100).toFixed(1);
                          if (parseFloat(percent) < 5) return null;
                          
                          const formattedValue = riskMetric === 'Count' 
                            ? value?.toLocaleString() ?? '0' 
                            : `₹${(value / 100000).toFixed(1)}L`;
                            
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              className="text-[10px] font-bold"
                            >
                              {`${formattedValue}(${percent}%)`}
                            </text>
                          );
                        }}
                      >
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={1} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => {
                          const formattedValue = riskMetric === 'Count' 
                            ? value?.toLocaleString() ?? '0' 
                            : `₹${formatIndianNumber(value / 100000, 2)} L`;
                          return [formattedValue, `${name} ${riskMetric.toLowerCase()}`];
                        }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ right: '10%', top: '50%', transform: 'translateY(-50%)', width: 'auto' }}
                        formatter={(value) => (
                          <span className="text-xs font-medium text-gray-700 ml-2">
                            {value}
                          </span>
                        )}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div> */}

            {/* CIBIL Distribution Chart */}
            <div className="w-full md:w-1/2 p-0 flex flex-col">
              <SectionHeaderWithFlags
                title="Default Incidence"
                icon={ShieldCheck}
                iconColorClass="text-purple-600"
                allowCollapse={false}
                positiveFlags={[]}
                negativeFlags={[]}
              />
              {/* Filters row under the header, right-aligned (house pattern). */}
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <SegmentedToggle
                  value={cibilGroupBy}
                  onChange={(v) => setCibilGroupBy(v as 'CIBIL' | 'Health')}
                  options={[
                    { value: 'CIBIL', label: 'CIBIL Band' },
                    { value: 'Health', label: 'Health Band' },
                  ]}
                />
                <SegmentedToggle
                  value={cibilMetric}
                  onChange={setCibilMetric}
                  options={[
                    { value: 'Count', label: 'Customers Count' },
                    { value: 'Loan', label: 'Outstanding Loan' },
                  ]}
                />
              </div>
              <div className="mt-4 flex-1 flex flex-col bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
                <p className="mb-4 h-5 text-sm font-medium text-gray-700 leading-5">
                  {cibilGroupBy === 'Health'
                    ? 'Defaulters by Financial Health band'
                    : 'Defaulters by CIBIL score band'}
                </p>
                <CustomLoader loading={isLoadingRiskDistribution} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading risk distribution...' }}>
                  <div className="h-[350px]">
                    <Visualization
                    type="combo"
                    data={cibilDistributionData}
                    xAxisKey="name"
                    yAxisKeys={[
                      { key: "defaulter", color: "#E07A5F", type: "bar", label: "Defaulter" },
                      { key: "nonDefaulter", color: "#3D5A80", type: "bar", label: "Non-Defaulter" }
                    ]}
                    leftYAxisLabel={cibilMetric === 'Loan' ? "Amount (₹)" : "Count"}
                    height={350}
                    showGridlines={true}
                    isEnclosedInCard={false}
                    showXAxisLabel={true}
                    xAxisLabel={cibilGroupBy === 'Health' ? 'Financial Health Band' : 'CIBIL Score'}
                    showYAxisLabel={true}
                    stacking="normal"
                    showLabels={true}
                    showStackedPercentages={true}
                    showVerticalGridlines={true}
                    stackTotalFormatter={(total: number) => {
                      return cibilMetric === 'Loan' 
                        ? `₹${formatIndianNumber(total / 100000, 1)}L` 
                        : formatIndianNumber(total);
                    }}
                    labelFormatter={(value: number, entry: any) => {
                      const total = (entry.defaulter || 0) + (entry.nonDefaulter || 0);
                      const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                      const formattedVal = cibilMetric === 'Loan' 
                        ? `₹${formatIndianNumber(value / 100000, 1)}L` 
                        : formatIndianNumber(value);
                      return `${formattedVal}(${percent}%)`;
                    }}
                    darkAxes={true}
                    barSize={60}
                    yAxisTickCount={5}
                    showLegend={true}
                    onRefresh={() => {}}
                    hideHeaderControls
                    activeView={cibilView}
                    onViewChange={(v: "visualization" | "data" | "code") => setCibilView(v === 'code' ? 'visualization' : v)}
                    tooltipValueFormatter={(val: any) => {
                      if (cibilMetric === 'Loan') {
                        return `₹${formatIndianNumber(val / 100000, 2)}L`;
                      }
                      return formatIndianNumber(val);
                    }}
                    yAxisTickFormatter={(val: any) => {
                      if (cibilMetric === 'Loan') {
                        return `${formatIndianNumber(val / 100000, 1)}L`;
                      }
                      return formatIndianNumber(val);
                    }}
                  />
                </div>
              </CustomLoader>
              </div>
            </div>
          </div>



          {/* Top Exposure Accounts Table */}

          <div className="space-y-4">
            <div className="mt-6">
            <SectionHeaderWithFlags
              title="Top Exposure Accounts"
              icon={Users}
              iconColorClass="text-blue-600"
              allowCollapse={false}
              positiveFlags={[]}
              negativeFlags={[]}
              showDownload
              onDownload={() => topExposureTableRef.current?.()}
            />
            </div>
            <div className="w-full [&>div]:w-full">
              <CustomListFilter
                filterGroups={topExposureFilterGroups}
                filterState={topExposureFilterState}
                setFilterState={setTopExposureFilterState}
              />
            </div>

            {/* <div className="mt-2">
              <CustomLoader loading={isLoadingLinkageList} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading metrics...' }}>
                <KeyMetrics
                  hardcodedMetrics={topExposureSubMetrics}
                  isMetricsExpanded={true}
                  setIsMetricsExpanded={() => {}}
                  showHeader={false}
                  showCollapse={false}
                />
              </CustomLoader>
            </div> */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <CustomLoader loading={isLoadingLinkageList} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading top exposure accounts...' }}>
                <CustomTableView
                  columns={topExposureTableColumns}
                  data={topExposureTableData}
                  showCSVExport={false}
                  exportRef={topExposureTableRef}
                  initialRowLimit={10}
                  isExpanded={false}
                />
                {linkageListV2 && linkageListV2.total_pages > 1 && (
                  <CustomPagination
                    totalPages={linkageListV2.total_pages}
                    currentPage={topExposurePage}
                    jumpToPage={setTopExposurePage}
                    placing="center"
                  />
                )}
              </CustomLoader>
            </div>
          </div>
        </div>
      </div>

      {/* Community Stats Section */}
      <div>
        <SectionHeaderWithFlags
          title="Community Stats"
          icon={Users}
          iconColorClass="text-emerald-600"
          allowCollapse={false}
          positiveFlags={[]}
          negativeFlags={[]}
          showDownload
          onDownload={() => communityTableRef.current?.()}
        />
        <div className="mt-2 space-y-4">
          <div className="w-full [&>div]:w-full">
            <CustomListFilter
              filterGroups={communityFilterGroups}
              filterState={communityFilterState}
              setFilterState={setCommunityFilterState}
            />
          </div>
          <CustomLoader loading={isLoadingCommunity} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading community stats...' }}>
            <KeyMetrics
              hardcodedMetrics={communityKeyMetrics}
              isMetricsExpanded={isCommunityExpanded}
              setIsMetricsExpanded={setIsCommunityExpanded}
              showHeader={false}
              showCollapse={true}
            />
          </CustomLoader>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <CustomLoader loading={isLoadingCommunityDetails} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading community details...' }}>
                <CustomTableView
                  columns={communityTableColumns}
                  data={communityTableData}
                  showCSVExport={false}
                  exportRef={communityTableRef}
                  initialRowLimit={10}
                  isExpanded={false}
                />
                {communityDetails && communityDetails.total_pages > 1 && (
                  <CustomPagination
                    totalPages={communityDetails.total_pages}
                    currentPage={communityPage}
                    jumpToPage={setCommunityPage}
                    placing="center"
                  />
                )}
              </CustomLoader>

          </div>
        </div>
      </div>

      {/* Centrality Stats Section */}
      <div className='pt-2'>
        <SectionHeaderWithFlags
          title="Centrality Stats"
          icon={Network}
          iconColorClass="text-indigo-600"
          allowCollapse={false}
          positiveFlags={[]}
          negativeFlags={[]}
          showDownload
          onDownload={handleDownloadCentralityStatsCSV}
          rightActions={(
            <div className="flex items-center justify-end gap-4 whitespace-nowrap">
              <CustomListFilter
                filterGroups={nodeTypeFilterGroups}
                filterState={nodeTypeFilterState}
                setFilterState={setNodeTypeFilterState}
              />
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 text-sm">
                <button
                  onClick={(e) => { e.stopPropagation(); setCentralityConnectorType('strong'); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    centralityConnectorType === 'strong'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Strong Connectors
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCentralityConnectorType('all'); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    centralityConnectorType === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Connectors
                </button>
              </div>
            </div>
          )}
        />
        
        {/* w-full, not a vw hardcode: 90vw ignores the sidebar and card padding and
            pushes a horizontal scrollbar onto the page. The table scrolls in here. */}
        <div className="w-full min-w-0 mt-2 overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
          <CustomLoader loading={isLoadingCentrality} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading centrality stats...' }}>
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-gray-50/50">
                  {centralityTableColumns.map((col, idx) => (
                    <th 
                      key={col.key} 
                      className={`text-xs font-semibold text-gray-600 border-b border-r border-gray-100 ${
                        idx === 0 
                          ? 'bg-gray-50 sticky left-0 z-[5] p-0 w-[300px] h-[100px] relative overflow-hidden' 
                          : 'px-4 py-4 min-w-[120px]'
                      }`}
                    >
                      {idx === 0 ? (
                        <div className="w-full h-full relative">
                          {/* Correct Diagonal Line using SVG */}
                          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#cbd5e1" strokeWidth="1" />
                          </svg>
                          
                          {/* Top Right Label (Type of Nodes) */}
                          <div className="absolute top-5 right-3 text-[10px] font-bold text-gray-700 uppercase tracking-wider text-right flex items-center justify-end gap-1">
                            Type of Nodes <Link2 className="w-2.5 h-2.5 text-blue-500" /> <span className="ml-1 text-gray-300">→</span>
                          </div>
                          
                          {/* Bottom Left Label (No. of Nodes) */}
                          <div className="absolute bottom-5 left-3 text-[10px] font-bold text-gray-700 uppercase tracking-wider text-left max-w-[110px] leading-[1.1]">
                            <span className="mr-1 text-gray-300">↓</span> No. of Nodes<br/>with Centrality
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center ">
                          <span className="whitespace-nowrap">{col.header}</span>
                          {/* {col.subHeader && <span className="text-[10px] text-gray-400 font-normal mt-1 leading-tight">{col.subHeader}</span>} */}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {centralityTableRows.map((row, rowIdx) => {
                  const attributeKeys = centralityTableColumns.slice(1).map(col => col.key);
                  const values = attributeKeys.map(key => (row as any)[key] || 0);
                  const maxVal = Math.max(...values, 1); // Avoid division by zero

                  return (
                    <tr key={rowIdx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-4 bg-white text-sm font-medium text-gray-700 bg-gray-50/10 sticky left-0 z-[4] border-r border-gray-100 min-w-[280px]">
                        <div className="flex flex-col items-center text-center ">
                          <span className={`font-bold whitespace-nowrap  ${row.colorClass}`}>{row.label}</span>
                          <span className="text-[11px] text-gray-400 font-medium mt-1">{row.range}</span>
                        </div>
                      </td>
                      {centralityTableColumns.slice(1).map((col) => {
                        const val = (row as any)[col.key] || 0;
                        const hasValue = val > 0;
                        
                        // Calculate intensity based on the maximum value in THIS specific row
                        const intensity = hasValue ? val / maxVal : 0;
                        
                        // Using a slightly more aggressive opacity range for better visual impact
                        // but keeping max at 0.7 to ensure dark text remains somewhat readable,
                        // or switch to white for very high intensity if needed.
                        const opacity = hasValue ? (0.08 + (intensity * 0.62)) : 0;
                        
                        // If opacity is very high, dark text might be hard to read, 
                        // but the user wanted "dark version value". Let's use it unless it's way too dark.
                        const textColor = hasValue ? (row as any).textClass : 'text-gray-400';

                        return (
                          <td 
                            key={col.key} 
                            onClick={() => hasValue && handleOpenCentralityDetails((row as any).tierKey, col.key, val)}
                            className={`px-4 py-4 text-sm text-center font-black transition-all duration-300 ${textColor} ${hasValue ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                            style={hasValue ? { 
                              backgroundColor: `rgba(${(row as any).baseColor}, ${opacity})`,
                            } : {}}
                          >
                            {hasValue ? formatIndianNumber(val) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CustomLoader>
        </div>


        {/* Recency Stats Section */}
      <div className='mt-4'>
        <SectionHeaderWithFlags
          title="Recency Stats"
          icon={Calendar}
          iconColorClass="text-rose-600"
          allowCollapse={false}
          positiveFlags={[]}
          negativeFlags={[]}
        />
        <div className="mt-2 space-y-4">
          <div className="">
            <CustomListFilter
              filterGroups={recencyFilterGroups}
              filterState={recencyFilterState}
              setFilterState={setRecencyFilterState}
            />
          </div>
          <CustomLoader loading={isLoadingRecency || isLoadingRecencyDetails} specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading recency stats...' }}>
            <KeyMetrics
              hardcodedMetrics={recencyKeyMetrics}
              isMetricsExpanded={true}
              setIsMetricsExpanded={() => {}}
              showHeader={false}
              showCollapse={false}
            />
            
            <div className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
              <CustomTableView
                columns={recencyTableColumns}
                data={recencyTableData}
                showCSVExport={false}
              />
              {recencyDetails && recencyDetails.total_pages > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <CustomPagination
                    currentPage={recencyPage}
                    totalPages={recencyDetails?.total_pages || 1}
                    jumpToPage={setRecencyPage}
                  />
                </div>
              )}

            </div>
          </CustomLoader>

        </div>
      </div>
      </div>
      {/* Info Dialog for At-Risk Community criteria */}
      <Dialog open={showAtRiskInfo} onOpenChange={setShowAtRiskInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{AT_RISK_COMMUNITY_TITLE}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {AT_RISK_COMMUNITY_INFO}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
