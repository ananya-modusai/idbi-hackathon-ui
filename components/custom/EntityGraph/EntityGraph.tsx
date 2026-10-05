import { FC, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { forceX, forceY } from 'd3-force';
import dynamic from 'next/dynamic';
// import { getNodeStyle, getNodeType } from '../Components/EwsLinkagesSampleData';
import { NodeDetailsInline } from './NodeDetails';
import EntityGraphFilter, { FilterGroupsState, useEntityGraphFilterState, useEntityGraphFilteredData } from './EntityGraphFilters';
import { getNodeStyle, getNodeType } from '@/app/pages/Customer/Components/CustomerLinkagesSampleData';
import { getNodeIconConfig, NODE_ICON_MAP } from './NodeIconConfig';
import { getIconImage } from './iconToSvg';
import { useLinkagesStore } from '@/app/store/linkages/linkagesStore';
import { Loader2 } from 'lucide-react';
import { parseEdgeSources } from './EntityGraphUtils';

// Dynamic imports for client-side only components
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// Types
interface EntityGraphProps {
  data: any[];
  onNodeClick?: (node: any) => void;
  selectedNode?: any | null;
  filterGroups?: FilterGroupsState;
  onFilterChange?: (filteredData: any[]) => void;
  showFilterToggle?: boolean;
  resetKey?: number; // Add reset key prop
  hideSecondaryFilters?: boolean; // New prop to hide secondary filters

  hideQuaternaryFilters?: boolean; // New prop to hide quaternary filters
  pruneLowDegreeNodes?: boolean; // New prop for pruning
  children?: React.ReactNode;
  rightElement?: React.ReactNode; // Element to render on the right side of filters
  customerId?: string; // Customer ID for persisting node positions
  onDataExpanded?: (expandedData: any[]) => void; // Callback when data is expanded
  clearExpandedDataKey?: number; // Key to clear only expanded data without resetting filters
  isLoading?: boolean; // Loading state to show spinner in graph
  error?: string | null; // Error message to show in graph
  overview?: any; // Overview data for risk-based color coding
  fullData?: any[]; // Full unfiltered data (all degrees) for calculating branchCount
  extendedNodes?: Set<string>; // Set of node IDs that should be expanded
  onNodeExpansionChange?: (nodeId: string, isExpanded: boolean) => void; // Callback when node expansion changes
  strongConnector?: boolean | null; // Prop for strong connector filter (null = show all, true = strong only, false = weak only)
  isDeleteMode?: boolean; // Whether delete mode is active
  hiddenNodes?: string[]; // Array of hidden node IDs
  selectedForDeletion?: string[]; // Array of nodes selected for deletion (not yet hidden)
  onHiddenNodesChange?: (nodeId: string, isHidden: boolean) => void; // Callback when node hidden state changes
  onMoreClick?: (node: any, exclusionList: string[], expansionType?: 'right-click' | 'more' | 'less') => void; // Callback when More/Less button is clicked for paginated API
  extraLinks?: any[]; // Extra links to include in the graph (e.g. from paginated API)
  fullscreen?: boolean; // When true, render a minimal/fullscreen-only view (no filters/details)
  graphTopRight?: React.ReactNode; // Element rendered absolute inside the graph container (top-right)
  graphTopRightPortalFallback?: boolean; // When true, also render a fixed portal fallback aligned to containerRect
}

// Configuration for node sizes
const ICON_SIZE_CUSTOMER = 12;
const ICON_SIZE_DEFAULT = 9;
// Multiplier applied to icon draw size for non-customer nodes (relative to nodeSize * base draw multiplier)
const NON_CUSTOMER_DRAW_SCALE = 1.5;
// Vertical spacing used for hierarchical view levels
const HIERARCHY_LEVEL_DISTANCE = 140;

const EMPTY_ARRAY: any[] = [];

// Interactive Entity Graph Component
export const EntityGraph: FC<EntityGraphProps> = ({
  data,
  onNodeClick,
  selectedNode,
  filterGroups,
  onFilterChange,
  showFilterToggle = true,
  resetKey = 0,
  hideSecondaryFilters,

  hideQuaternaryFilters,
  pruneLowDegreeNodes = false,
  children,
  rightElement,
  graphTopRight,
  graphTopRightPortalFallback = false,
  customerId,
  onDataExpanded,
  clearExpandedDataKey,
  isLoading = false,
  error = null,
  overview,
  fullData = [],
  extendedNodes,
  onNodeExpansionChange,
  strongConnector,
  isDeleteMode = false,
  hiddenNodes = [],
  selectedForDeletion = [],
  onHiddenNodesChange,
  onMoreClick,
  extraLinks = EMPTY_ARRAY
  ,
  fullscreen = false
}) => {
  const [iconImageCache, setIconImageCache] = useState<Record<string, HTMLImageElement>>({});
  
  const [openedNodeIds, setOpenedNodeIds] = useState<Set<string>>(new Set());
  const openedNodeIdsRef = useRef<Set<string>>(new Set());
  
  // Keep Ref synced with state for third-party canvas event callbacks
  useEffect(() => {
    openedNodeIdsRef.current = openedNodeIds;
  }, [openedNodeIds]);

  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const loadingNodesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    loadingNodesRef.current = loadingNodes;
  }, [loadingNodes]);

  // Force redraw loop when nodes are loading to animate the spinner
  useEffect(() => {
    if (loadingNodes.size === 0) return;
    let animId: number;
    const tick = () => {
      if (graphRef.current) {
        try {
          graphRef.current.refresh();
        } catch (e) {
          // ignore
        }
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [loadingNodes]);
  // Store checkbox positions as they're rendered so we can use them for click detection
  const checkboxPositionsRef = useRef<Record<string, { x: number; y: number; radius: number }>>({});
  // Track which nodes we've logged as having hasBranches to avoid spamming the console
  const loggedHasBranchesRef = useRef<Set<string>>(new Set());
  // Temporary debug toggle: when true, aggressively detect possible branch flags and render a visible marker
  const DEBUG_DETECT_HAS_BRANCHES = true;

  // Helper to get pagination limit for a node based on its degree rank
  const getLimitByDegree = (deg: number) => {
    if (deg === 0 || deg === 1) return 10;
    if (deg === 2 || deg === 4) return 3;
    if (deg === 3 || deg === 5) return 5;
    return 20;
  };

  // Get state and actions from linkages store using stable selectors to minimize re-renders
  const getNodePositions = useLinkagesStore(s => s.getNodePositions);
  const setNodePositions = useLinkagesStore(s => s.setNodePositions);
  const getViewportState = useLinkagesStore(s => s.getViewportState);
  const clearViewportState = useLinkagesStore(s => s.clearViewportState);
  const setViewportState = useLinkagesStore(s => s.setViewportState);

  // Use a ref to prevent onZoomEnd from triggering during programmatic zooms
  const isProgrammaticZoomRef = useRef(false);
  
  // Use store getState() directly for expanded states to avoid hook dependency issues
  const getExpandedStateFromStore = useCallback((customerId: string) => {
    return useLinkagesStore.getState().getExpandedState(customerId);
  }, []);

  
  // Pre-load all node icons (including degree-based blue variants and risk-based colors for customer nodes)
  useEffect(() => {
    const loadIcons = async () => {
      const cache: Record<string, HTMLImageElement> = {};
      const iconTypes = ['CUSTOMER', 'PERSON', 'GOV_ID', 'PHONE', 'EMAIL', 'ADDRESS', 'PINCODE', 'GEOLOCATION', 'DEVICE', 'BANK_ACCOUNT', 'UPI_VPA', 'BANK_BRANCH', 'REFERENCE_CONTACT', 'MERCHANT'];

      // Degree colors we will use for overriding icon stroke/fill
      const degreeColors = ['#1e40af', '#3b82f6', '#93c5fd']; // dark, mid, light

      for (const iconType of iconTypes) {
        const config = NODE_ICON_MAP[iconType];
        if (config) {
          // default
          try {
            const img = await getIconImage(config.iconType, config.color);
            cache[`${iconType}-${config.color}`] = img;
          } catch (e) {
            // ignore individual failures
          }

          // preload degree variants
          for (const c of degreeColors) {
            try {
              const imgDeg = await getIconImage(config.iconType, c);
              cache[`${iconType}-${c}`] = imgDeg;
            } catch (e) {
              // ignore
            }
          }

          // Preload white color for customer/person nodes (icons are white, background uses risk colors)
          const isCustomerType = iconType === 'CUSTOMER' || iconType === 'PERSON';
          if (isCustomerType) {
            try {
              const imgWhite = await getIconImage(config.iconType, '#ffffff');
              cache[`${iconType}-#ffffff`] = imgWhite;
            } catch (e) {
              // ignore
            }
          }
        }
      }

      setIconImageCache(cache);
    };

    loadIcons();
  }, []);

  // Derive risk color from overview data - mapped to red shades for risk badge
  const getRiskColorHex = useCallback((riskLevel?: string): string => {
    if (!riskLevel) return '#f33232ff'; // Default dark red
    
    const riskLower = riskLevel.toLowerCase();
    // Map risk levels to red shades (dark red for high risk)
    if (riskLower.includes('high')) return '#f33232ff'; // Very dark red for high risk
    if (riskLower.includes('medium')) return '#b91c1c'; // Dark red for medium risk
    if (riskLower.includes('low')) return '#dc2626'; // Red for low risk
    return '#f33232ff'; // Default dark red
  }, []);

  // Helper function to get risk color name based on risk indicator (for icon coloring)
  const getRiskColor = useCallback((riskIndicator: string | undefined): 'green' | 'yellow' | 'red' | 'gray' => {
    if (!riskIndicator) return 'gray';
    
    const risk = String(riskIndicator).toLowerCase();
    if (risk.includes('low')) return 'green';
    if (risk.includes('medium') || risk.includes('moderate')) return 'yellow';
    if (risk.includes('high')) return 'red';
    return 'gray';
  }, []);

  // Map risk color name to hex color for icon
  const getRiskColorHexForIcon = useCallback((colorName: 'green' | 'yellow' | 'red' | 'gray'): string => {
    const colorMap: Record<'green' | 'yellow' | 'red' | 'gray', string> = {
      green: '#10b981', // Green-500
      yellow: '#f59e0b', // Amber-500
      red: '#ef4444', // Red-500
      gray: '#6b7280' // Gray-500
    };
    return colorMap[colorName];
  }, []);

  // Memoize the customer node color (for main customer) - use darker red independent of risk indicator
  const customerNodeRiskColor = useMemo(() => {
    return '#f70303ff'; // Darker red for main customer node
  }, []);

  // Helper function to convert degree to ordinal abbreviation (e.g., "second" -> "2nd")
  const convertDegreeToOrdinal = useCallback((degree?: string): string => {
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
  }, []);

  // Function to get color based on node degree (for non-main customer nodes)
  // Red -> Orange -> Yellow gradient as degree increases
  const getDegreeColor = useCallback((degree?: string): string => {
    if (!degree) return '#f40707ff'; // Default dark red
    
    const degreeLower = String(degree).toLowerCase().trim();
    
    // Handle string-based degrees (ordinal names)
    if (degreeLower.includes('first') || degreeLower === '1st') return '#5A0000'; // Dark red for first degree
    if (degreeLower.includes('second') || degreeLower === '2nd') return '#8C1D18'; // Dark orange for second degree
    if (degreeLower.includes('third') || degreeLower === '3rd') return '#C65D57'; // Orange for third degree
    if (degreeLower.includes('fourth') || degreeLower === '4th') return '#dc963bff'; // Lighter orange for fourth degree
    if (degreeLower.includes('fifth') || degreeLower === '5th') return '#f6cc84ff'; // Lighter orange for fifth degree
    if (degreeLower.includes('sixth') || degreeLower === '6th') return '#f2e14aff'; // Lighter orange for sixth degree
    if (degreeLower.includes('seventh') || degreeLower === '7th' || degreeLower.includes('higher') || degreeLower.includes('beyond')) return '#f59e0b'; // Lighter orange for seventh+ degree
    
    // Handle numeric degrees
    const degreeNum = parseInt(degreeLower, 10);
    if (degreeNum === 1) return '#f40505ff'; // Dark red
    if (degreeNum === 2) return '#c2410c'; // Dark orange
    if (degreeNum === 3) return '#d97706'; // Orange
    if (degreeNum >= 4) return '#f59e0b'; // Lighter orange for 4th and beyond
    
    return '#f30303ff'; // Default dark red
  }, []);

    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [nodeExpansionStateMap, setNodeExpansionStateMap] = useState<Map<string, { symbol: string; badgeColor: string; showBadge: boolean }>>(new Map());
  const [isWorkerLoading, setIsWorkerLoading] = useState(false);

  const [worker, setWorker] = useState<Worker | null>(null);

  // Debug: log a snapshot of node property keys when graph nodes first appear (helps discover API field names)
  const loggedNodesSnapshotRef = useRef<boolean>(false);
  useEffect(() => {
    if (loggedNodesSnapshotRef.current) return;
    if (!graphData.nodes || graphData.nodes.length === 0) return;
    try {
      const sample = graphData.nodes.slice(0, 10).map((n: any) => ({ id: n.id, keys: Object.keys(n || {}), propertiesKeys: Object.keys(n.properties || {}), sampleProps: n.properties }));
      console.log('[EntityGraph] DEBUG node snapshot (first 10):', sample);
      loggedNodesSnapshotRef.current = true;
    } catch (e) {
      // ignore
    }
  }, [graphData.nodes]);

  useEffect(() => {
    const w = new Worker(new URL('./EntityGraph.worker.ts', import.meta.url));
    setWorker(w);
    
    w.onmessage = (e) => {
      const { graphData: calcData, expansionStateMap } = e.data;
      console.log('[EntityGraph] Worker message received:', {
        nodes: calcData?.nodes?.length || 0,
        links: calcData?.links?.length || 0,
        expansionKeys: Object.keys(expansionStateMap || {}).length
      });
      setGraphData(calcData);
      
      const map = new Map<string, { symbol: string; badgeColor: string; showBadge: boolean }>();
      Object.entries(expansionStateMap).forEach(([k, v]: [string, any]) => {
        map.set(k, v);
      });
      setNodeExpansionStateMap(map);
      setIsWorkerLoading(false);
      
      if (graphLinksRef) {
        graphLinksRef.current = calcData.links;
      }
    };

    return () => {
      w.terminate();
    };
  }, []);

  

const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [clickedNode, setClickedNode] = useState<any>(null); // Track clicked node to persist blur effect
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());


  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<any[]>([]);
  // Track a single temporarily-modified node name for hover label replacement
  const modifiedHoverNameRef = useRef<{ id: string; original: string } | null>(null);
  // Track previous resetKey to detect changes
  const prevResetKeyRef = useRef<number>(resetKey || 0);
  // Track dragging state to compute deltas when moving a node
  const dragPrevPos = useRef<Map<string, { x: number; y: number }>>(new Map());
  const draggingNodeId = useRef<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedNode, setLastClickedNode] = useState<any>(null);
  const [labeledNodes, setLabeledNodes] = useState<Set<string>>(new Set());
  // Track expanded nodes and loading states for chevron expansion
  // Initialize state maps for degree-specific expansion
  const [expandedNodesByDegree, setExpandedNodesByDegree] = useState<Map<string, Set<string>>>(new Map());
  const [collapsedNodesByDegree, setCollapsedNodesByDegree] = useState<Map<string, Set<string>>>(new Map());
  const [expandedDataByDegree, setExpandedDataByDegree] = useState<Map<string, any[]>>(new Map());
  const [nodeParentsByDegree, setNodeParentsByDegree] = useState<Map<string, Map<string, string>>>(new Map());
  const [expandedNodeLinksByDegree, setExpandedNodeLinksByDegree] = useState<Map<string, Map<string, Set<string>>>>(new Map());
  const [expandedNodeChildrenByDegree, setExpandedNodeChildrenByDegree] = useState<Map<string, Map<string, Set<string>>>>(new Map());

  const graphLinksRef = useRef<any[]>([]); // Ref to store current graph links for handleNodeHover
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const hasLoadedExpandedStateRef = useRef<boolean>(false); // Track if we've loaded expanded state from store
  const lastLoadedCustomerIdRef = useRef<string | null>(null); // Track which customerId we last loaded for
  const [paginationLimits, setPaginationLimits] = useState<Record<string, number>>({});

  // Filter state management
  const { filterState, setFilterState } = useEntityGraphFilterState(filterGroups || {});

  // Memoize current degree filter to avoid recalculation on every render
  const currentDegreeFilter = useMemo(() => {
    return JSON.stringify((filterState as any)?.secondarySelected?.['degree-filter'] || []);
  }, [(filterState as any)?.secondarySelected?.['degree-filter']]);

  // Memoize current degree's expansion state to avoid recalculation on every render
  const expandedNodes = useMemo(() => 
    expandedNodesByDegree.get(currentDegreeFilter) || new Set<string>(), 
    [expandedNodesByDegree, currentDegreeFilter]
  );
  const collapsedNodes = useMemo(() => 
    collapsedNodesByDegree.get(currentDegreeFilter) || new Set<string>(), 
    [collapsedNodesByDegree, currentDegreeFilter]
  );
  const expandedData = useMemo(() => 
    expandedDataByDegree.get(currentDegreeFilter) || [], 
    [expandedDataByDegree, currentDegreeFilter]
  );
  const nodeParents = useMemo(() => 
    nodeParentsByDegree.get(currentDegreeFilter) || new Map<string, string>(), 
    [nodeParentsByDegree, currentDegreeFilter]
  );
  const expandedNodeLinks = useMemo(() => 
    expandedNodeLinksByDegree.get(currentDegreeFilter) || new Map<string, Set<string>>(), 
    [expandedNodeLinksByDegree, currentDegreeFilter]
  );
  const expandedNodeChildren = useMemo(() => 
    expandedNodeChildrenByDegree.get(currentDegreeFilter) || new Map<string, Set<string>>(), 
    [expandedNodeChildrenByDegree, currentDegreeFilter]
  );

  // Memoized convenience setters for current degree filter that work with functional updates
  const setExpandedNodes = useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof updater === 'function') {
      const current = expandedNodesByDegree.get(currentDegreeFilter) || new Set<string>();
      const newValue = updater(current);
      setExpandedNodesByDegree(prev => new Map(prev.set(currentDegreeFilter, newValue)));
    } else {
      setExpandedNodesByDegree(prev => new Map(prev.set(currentDegreeFilter, updater)));
    }
  }, [currentDegreeFilter, expandedNodesByDegree]);
  
  const setCollapsedNodes = useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof updater === 'function') {
      const current = collapsedNodesByDegree.get(currentDegreeFilter) || new Set<string>();
      const newValue = updater(current);
      setCollapsedNodesByDegree(prev => new Map(prev.set(currentDegreeFilter, newValue)));
    } else {
      setCollapsedNodesByDegree(prev => new Map(prev.set(currentDegreeFilter, updater)));
    }
  }, [currentDegreeFilter, collapsedNodesByDegree]);
  
  const setExpandedData = useCallback((updater: any[] | ((prev: any[]) => any[])) => {
    if (typeof updater === 'function') {
      const current = expandedDataByDegree.get(currentDegreeFilter) || [];
      const newValue = updater(current);
      setExpandedDataByDegree(prev => new Map(prev.set(currentDegreeFilter, newValue)));
    } else {
      setExpandedDataByDegree(prev => new Map(prev.set(currentDegreeFilter, updater)));
    }
  }, [currentDegreeFilter, expandedDataByDegree]);
  
  const setNodeParents = useCallback((updater: Map<string, string> | ((prev: Map<string, string>) => Map<string, string>)) => {
    if (typeof updater === 'function') {
      const current = nodeParentsByDegree.get(currentDegreeFilter) || new Map<string, string>();
      const newValue = updater(current);
      setNodeParentsByDegree(prev => new Map(prev.set(currentDegreeFilter, newValue)));
    } else {
      setNodeParentsByDegree(prev => new Map(prev.set(currentDegreeFilter, updater)));
    }
  }, [currentDegreeFilter, nodeParentsByDegree]);
  
  const setExpandedNodeLinks = useCallback((updater: Map<string, Set<string>> | ((prev: Map<string, Set<string>>) => Map<string, Set<string>>)) => {
    if (typeof updater === 'function') {
      const current = expandedNodeLinksByDegree.get(currentDegreeFilter) || new Map<string, Set<string>>();
      const newValue = updater(current);
      setExpandedNodeLinksByDegree(prev => new Map(prev.set(currentDegreeFilter, newValue)));
    } else {
      setExpandedNodeLinksByDegree(prev => new Map(prev.set(currentDegreeFilter, updater)));
    }
  }, [currentDegreeFilter, expandedNodeLinksByDegree]);
  
  const setExpandedNodeChildren = useCallback((updater: Map<string, Set<string>> | ((prev: Map<string, Set<string>>) => Map<string, Set<string>>)) => {
    if (typeof updater === 'function') {
      const current = expandedNodeChildrenByDegree.get(currentDegreeFilter) || new Map<string, Set<string>>();
      const newValue = updater(current);
      setExpandedNodeChildrenByDegree(prev => new Map(prev.set(currentDegreeFilter, newValue)));
    } else {
      setExpandedNodeChildrenByDegree(prev => new Map(prev.set(currentDegreeFilter, updater)));
    }
  }, [currentDegreeFilter, expandedNodeChildrenByDegree]);

  // Notify parent component when expandedData changes
  // This is done in useEffect to avoid "Cannot update a component while rendering a different component" error
  useEffect(() => {
    if (onDataExpanded) {
      onDataExpanded(expandedData);
    }
  }, [expandedData, onDataExpanded]);

  // Keep graph dimensions in sync with the graph container (70% width layout)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const w = el.clientWidth || 1000;
      const h = el.clientHeight || 600;
      setDimensions({ width: w, height: h });
      try {
        setContainerRect(el.getBoundingClientRect());
      } catch (e) {
        setContainerRect(null);
      }
    };
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    updateSize();
    window.addEventListener('scroll', updateSize, true);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updateSize, true);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Default to hierarchical view when graph-view filter is absent (filter was removed from UI)
  const graphViewSelected: string[] = (filterState as any)?.primarySelected?.['graph-view-filter'] ?? ['hierarchical'];
  const isHierarchical = Array.isArray(graphViewSelected) && graphViewSelected.includes('hierarchical');

  // Get filtered data
  // Pass fullData to the hook so it can calculate branchCount from all degrees, not just filtered data
  const filteredData = useEntityGraphFilteredData(data, filterGroups || {}, filterState, pruneLowDegreeNodes, fullData);

  console.log('[EntityGraph] After useEntityGraphFilteredData:', {
    length: filteredData.length,
    firstItem: filteredData[0],
    hasSynthetic: filteredData.some((item: any) => item.isSynthetic === true)
  });

  // Helper to get a deterministic edge id for deduping/lookup
  const getEdgeId = useCallback((link: any) => {
    if (!link) return '';
    if (link.edgeId) return String(link.edgeId);
    const s = link.source !== undefined && link.source !== null ? String(link.source) : '';
    const t = link.target !== undefined && link.target !== null ? String(link.target) : '';
    return (s && t) ? `${s}-${t}` : '';
  }, []);

  // Combine filteredData with expandedData and extraLinks for use in NodeDetails
  const allDataForDetails = useMemo(() => {
    const combined = [...filteredData, ...expandedData, ...(extraLinks || [])];
    
    // De-duplicate by edgeId to prevent double-counting in NodeDetails cards
    // This is important because paginated links might overlap with filtered or expanded links
    const seenIds = new Set<string>();
    return combined.filter(link => {
      const id = getEdgeId(link);
      if (!id) return true; // Keep synthetic or unknown links
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });
  }, [filteredData, expandedData, extraLinks, getEdgeId]);

  // Precompute visible edge ids (filtered data + expanded data + extraLinks + current graph links)
  const visibleEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    try {
      (filteredData || []).forEach((l: any) => {
        const id = getEdgeId(l);
        if (id) ids.add(id);
      });
      (expandedData || []).forEach((l: any) => {
        const id = getEdgeId(l);
        if (id) ids.add(id);
      });
      (extraLinks || []).forEach((l: any) => {
        const id = getEdgeId(l);
        if (id) ids.add(id);
      });
      (graphData.links || []).forEach((l: any) => {
        const id = getEdgeId(l);
        if (id) ids.add(id);
      });
    } catch (e) {
      // ignore
    }
    return ids;
  }, [filteredData, expandedData, extraLinks, graphData.links, getEdgeId]);

  // Precompute unseen/further link counts per node based on fullData vs visibleEdgeIds
  const unseenCountsByNode = useMemo(() => {
    const map = new Map<string, number>();
    try {
      (fullData || []).forEach((l: any) => {
        const id = getEdgeId(l);
        if (!id) return;
        if (visibleEdgeIds.has(id)) return; // already visible
        const s = l.source !== undefined && l.source !== null ? String(l.source) : null;
        const t = l.target !== undefined && l.target !== null ? String(l.target) : null;
        if (s) map.set(s, (map.get(s) || 0) + 1);
        if (t) map.set(t, (map.get(t) || 0) + 1);
      });
    } catch (e) {
      // ignore
    }
    return map;
  }, [fullData, visibleEdgeIds, getEdgeId]);

  // Helper to convert degree names to numerical ranks
  const degreeNameToRank = useCallback((d: any) => {
    if (!d && d !== 0) return 0;
    if (typeof d === 'number') return d;
    const map: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
    if (typeof d === 'string') {
      const dn = d.toLowerCase();
      if (map[dn]) return map[dn];
      const parsed = parseInt(d, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }, []);

  useEffect(() => {
    if (worker) {
      console.log('[EntityGraph] Posting to worker:', {
        dataLength: data?.length || 0,
        fullDataLength: fullData?.length || 0,
        expandedDataLength: expandedData?.length || 0,
        extraLinksLength: extraLinks?.length || 0
      });
      setIsWorkerLoading(true);
      worker.postMessage({
        filteredData,
        expandedData: [...expandedData, ...(extraLinks || [])],
        filterState,
        pruneLowDegreeNodes,
        data,
        fullData,
        collapsedNodesRaw: Array.from(collapsedNodes),
        openedNodeIdsRaw: Array.from(openedNodeIds),
        strongConnector,
        hiddenNodes,
        paginationLimits,
        customerId
      });
    }
  }, [worker, filteredData, expandedData, extraLinks, openedNodeIds, filterState, pruneLowDegreeNodes, data, fullData, collapsedNodes, strongConnector, hiddenNodes, paginationLimits, customerId]);
  
  // Reheat simulation when graphData loads to fix dynamically imported component mounting race triggers
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        if (graphRef.current?.d3ReheatSimulation) {
          console.log('[EntityGraph] Reheating simulation on initial data load');
          graphRef.current.d3ReheatSimulation();
        }
      }, 500); // Allow buffering buffer delay for canvas layout loads
      return () => clearTimeout(timeoutId);
    }
  }, [graphData.nodes.length, dimensions.width]);

  // graphData is now managed by Web Worker state

  // Get the first CUSTOMER node ID to identify the main customer
  const firstCustomerNodeId = useMemo(() => {
    const customerNode = graphData.nodes.find((node: any) => 
      node.type?.toLowerCase().includes('customer') || node.type?.toLowerCase().includes('person')
    );
    return customerNode?.id;
  }, [graphData]);

  // Helper: map node id -> node for constant time lookups (reduces repeated .find calls)
  const nodeById = useMemo(() => {
    const m = new Map<string, any>();
    graphData.nodes.forEach((n: any) => m.set(String(n.id), n));
    return m;
  }, [graphData.nodes]);

  // Compute unseen link counts but only counting "downward" links (other node has higher degree)
  const unseenDownwardCountsByNode = useMemo(() => {
    const map = new Map<string, number>();
    try {
      (fullData || []).forEach((l: any) => {
        const id = getEdgeId(l);
        if (!id) return;
        if (visibleEdgeIds.has(id)) return; // already visible

        const s = l.source !== undefined && l.source !== null ? String(l.source) : null;
        const t = l.target !== undefined && l.target !== null ? String(l.target) : null;
        if (!s || !t) return;

        const nodeS = nodeById.get(s);
        const nodeT = nodeById.get(t);

        const rankS = nodeS ? degreeNameToRank(nodeS.degree ?? nodeS.numericDegree) : (l.sourceDegree ?? l.source_degree ?? null);
        const rankT = nodeT ? degreeNameToRank(nodeT.degree ?? nodeT.numericDegree) : (l.targetDegree ?? l.target_degree ?? null);

        // If we can determine ranks for both endpoints, count only when the other node is strictly higher degree
        if (rankS != null && rankT != null) {
          if (rankT > rankS) {
            map.set(s, (map.get(s) || 0) + 1);
          }
          if (rankS > rankT) {
            map.set(t, (map.get(t) || 0) + 1);
          }
        }
      });
    } catch (e) {
      // ignore
    }
    return map;
  }, [fullData, visibleEdgeIds, getEdgeId, nodeById, degreeNameToRank]);

  // Ensure the main customer node always has its label visible
  useEffect(() => {
    if (!firstCustomerNodeId) return;
    setLabeledNodes(prev => {
      const next = new Set(prev);
      next.add(String(firstCustomerNodeId));
      return next;
    });
  }, [firstCustomerNodeId]);

  // Helper to get risk indicator from a customer node (only from API, no CIBIL calculation)
  const getCustomerRiskIndicator = useCallback((node: any): string | undefined => {
    if (!node) return undefined;
    
    const props = node.properties || {};
    const userid = props.userid || props.user_id;
    
    // Try to get risk_indicator from node properties (from API)
    const riskIndicator = props.risk_indicator || props.riskIndicator || props.risk_level || props.riskLevel;
    if (riskIndicator) return String(riskIndicator);

    // Check overview fallback for the main customer matched against response userid
    if (overview && customerId && userid && String(userid) === String(customerId)) {
      const overviewRisk = overview.risk_indicator || overview.riskIndicator || overview.risk_level || overview.riskLevel;
      if (overviewRisk) return String(overviewRisk);
    }
    
    return undefined;
  }, [overview, customerId]);

  // --- PERFORMANCE OPTIMIZATION ---
  // Precompute the expansion state (plus/minus badges) for all nodes outside the rendering loop.
  // The nodeCanvasObject runs 60 times a second for every visible node, so doing O(N) or O(E) operations there causes severe lag.
  // nodeExpansionStateMap is now managed by Web Worker state
  // --- END OF OPTIMIZATION ---

  // Identify end nodes (nodes that only appear as targets, not sources)
  const endNodes = useMemo(() => {
    const sourceNodes = new Set<string>();
    const targetNodes = new Set<string>();
    
    graphData.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? String(link.source?.id) : String(link.source);
      const targetId = typeof link.target === 'object' ? String(link.target?.id) : String(link.target);
      sourceNodes.add(sourceId);
      targetNodes.add(targetId);
    });
    
    // End nodes are those that appear as targets but never as sources
    const endNodeSet = new Set<string>();
    targetNodes.forEach((nodeId) => {
      if (!sourceNodes.has(nodeId)) {
        endNodeSet.add(nodeId);
      }
    });
    
    return endNodeSet;
  }, [graphData.links]);

  // Handle chevron click to expand nodes using full customer graph data
  const handleChevronClick = useCallback((node: any) => {
    if (!node || !node.id) {
      console.warn('[EntityGraph] handleChevronClick: node or node.id is missing', node);
      return;
    }
    
    const nodeId = node.id || node.properties?.id || node.properties?.node_id;
    if (!nodeId) {
      console.warn('[EntityGraph] handleChevronClick: Could not find node ID', node);
      return;
    }
    
    const nodeIdStr = String(nodeId);
    console.log('[EntityGraph] handleChevronClick: Toggling node', { nodeId: nodeIdStr, node });
    
    // Set highlight nodes and links to blur non-connected elements (same as hover behavior)
    const neighborNodeIds = new Set<string>();
    const neighborLinkIds = new Set<string>();
    
    graphLinksRef.current.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target?.id : link.target;
      
      if (sourceId === node.id || String(sourceId) === nodeIdStr) {
        neighborNodeIds.add(String(targetId));
        neighborLinkIds.add(`${sourceId}-${targetId}`);
      }
      if (targetId === node.id || String(targetId) === nodeIdStr) {
        neighborNodeIds.add(String(sourceId));
        neighborLinkIds.add(`${sourceId}-${targetId}`);
      }
    });
    
    // Add the clicked node itself
    neighborNodeIds.add(nodeIdStr);
    
    // Set highlight states to blur non-connected nodes/links
    setHighlightNodes(neighborNodeIds);
    setHighlightLinks(neighborLinkIds);
    
    // Build a quick set of existing visible link ids to compare against fullData
    const existingLinkIds = new Set<string>();
    if (graphData.links) {
      graphData.links.forEach((l: any) => {
        const s = typeof l.source === 'object' ? String(l.source.id) : String(l.source);
        const t = typeof l.target === 'object' ? String(l.target.id) : String(l.target);
        existingLinkIds.add(`${s}-${t}`);
      });
    }

    // Check if node has visible children in current graph (hierarchical: children have strictly higher degree rank)
    const nodeRank = degreeNameToRank(node.degree);
    const hasVisibleChildren = graphData.links && graphData.links.some((link: any) => {
      const s = typeof link.source === 'object' ? String(link.source?.id) : String(link.source);
      const t = typeof link.target === 'object' ? String(link.target?.id) : String(link.target);
      
      if (s === nodeIdStr) {
        const targetNode = nodeById.get(String(t));
        const targetRank = targetNode ? degreeNameToRank(targetNode.degree) : 0;
        return targetRank > nodeRank;
      }
      if (t === nodeIdStr) {
        const sourceNode = nodeById.get(String(s));
        const sourceRank = sourceNode ? degreeNameToRank(sourceNode.degree) : 0;
        return sourceRank > nodeRank;
      }
      return false;
    });

    // Check if there are further linkages in fullData that are not yet visible (hierarchical: only count downward links)
    const hasFurtherLinks = fullData && fullData.some((link: any) => {
      const s = String(link.source);
      const t = String(link.target);
      if (s !== nodeIdStr && t !== nodeIdStr) return false;
      
      const otherNodeId = s === nodeIdStr ? t : s;
  const otherNode = nodeById.get(String(otherNodeId));
      const otherRank = otherNode ? degreeNameToRank(otherNode.degree) : 0;
      
      // Only consider as "further link" if it's a downward connection
      if (otherRank <= nodeRank && otherRank !== 0) return false;
      
      return !existingLinkIds.has(`${s}-${t}`);
    });

    // If node is already "open" (manually expanded or has children), collapse it
    // IMPORTANT: Prioritize collapsing if any children are currently visible to allow a clean toggle
    if (expandedNodes.has(nodeIdStr) || (hasVisibleChildren && !collapsedNodes.has(nodeIdStr))) {
      if (expandedNodes.has(nodeIdStr)) {
        console.log('[EntityGraph] Node already expanded, collapsing:', nodeIdStr);
        
        const linksToRemove = expandedNodeLinks.get(nodeIdStr) || new Set();
        const childNodeIds = expandedNodeChildren.get(nodeIdStr) || new Set();
        
        setExpandedData(prev => {
          const updated = prev.filter(link => {
            const linkId = link.edgeId || `${link.source}-${link.target}`;
            return !linksToRemove.has(linkId);
          });
          return updated;
        });
        
        setNodeParents(prev => {
          const updated = new Map(prev);
          childNodeIds.forEach(childId => {
            updated.delete(childId);
          });
          return updated;
        });
        
        setExpandedNodes(prev => {
          const next = new Set(prev);
          next.delete(nodeIdStr);
          return next;
        });

        // Reset pagination limits to 0 to collapse any 'more' expansion nodes too
        setPaginationLimits(prev => ({
          ...prev,
          [nodeIdStr]: 0
        }));

        setExpandedNodeLinks(prev => {
          const next = new Map(prev);
          next.delete(nodeIdStr);
          return next;
        });

        setExpandedNodeChildren(prev => {
          const next = new Map(prev);
          next.delete(nodeIdStr);
          return next;
        });
        
        onNodeExpansionChange?.(nodeIdStr, false);
      } else {
        // If it was visible but not manually expanded, add to collapsedNodes
        console.log('[EntityGraph] Collapsing initially visible node:', nodeIdStr);
        setCollapsedNodes(prev => new Set(prev).add(nodeIdStr));
      }
      return;
    }

    // If node is collapsed, expand it (remove from collapsed set)
    if (collapsedNodes.has(nodeIdStr)) {
      setCollapsedNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeIdStr);
        return next;
      });
      return;
    }

    // If there are further links, expand
    if (hasFurtherLinks) {
      if (!fullData || fullData.length === 0) return;

      try {
        const getEdgeId = (link: any) => {
          if (!link) return '';
          if (link.edgeId) return String(link.edgeId);
          const s = link.source !== undefined && link.source !== null ? String(link.source) : '';
          const t = link.target !== undefined && link.target !== null ? String(link.target) : '';
          return (s && t) ? `${s}-${t}` : '';
        };

        const existingVisibleIds = new Set(
          [...filteredData, ...expandedData]
            .map(getEdgeId)
            .filter((id: string) => !!id)
        );
        const existingNodeIds = new Set(graphData.nodes.map((n: any) => String(n.id)));

        const dedupedLinks = new Map<string, any>();
        fullData.forEach((link: any) => {
          if (!link) return;
          const s = String(link.source);
          const t = String(link.target);
          if (s !== nodeIdStr && t !== nodeIdStr) return;
          const linkId = getEdgeId(link);
          if (!linkId || existingVisibleIds.has(linkId) || dedupedLinks.has(linkId)) return;
          dedupedLinks.set(linkId, link);
        });

        const newLinks = Array.from(dedupedLinks.values());
        if (newLinks.length === 0) return;

        const newChildIds = new Set<string>();
        newLinks.forEach((link: any) => {
          const s = String(link.source);
          const t = String(link.target);
          const childId = s === nodeIdStr ? t : s;
          if (childId && childId !== nodeIdStr && !existingNodeIds.has(childId)) {
            newChildIds.add(childId);
          }
        });

        setNodeParents(prev => {
          const updated = new Map(prev);
          newChildIds.forEach(childId => {
            if (!updated.has(childId)) updated.set(childId, nodeIdStr);
          });
          return updated;
        });

        const linkIds = new Set(newLinks.map(getEdgeId).filter(Boolean));
        
        setExpandedData(prev => [...prev, ...newLinks]);
        setExpandedNodes(prev => new Set(prev).add(nodeIdStr));
        setExpandedNodeLinks(prev => new Map(prev).set(nodeIdStr, linkIds));
        setExpandedNodeChildren(prev => new Map(prev).set(nodeIdStr, newChildIds));
        
        onNodeExpansionChange?.(nodeIdStr, true);

        // Animation and positioning
        const childIdsArray = Array.from(newChildIds);
        if (childIdsArray.length > 0) {
          setTimeout(() => {
            if (!graphRef.current) return;
            const sim = graphRef.current.d3ForceSimulation;
            if (sim && typeof sim.nodes === 'function') {
              const allNodes = sim.nodes();
              const parentNode = allNodes.find((n: any) => String(n.id) === nodeIdStr);
              if (parentNode && parentNode.x !== undefined && parentNode.y !== undefined) {
                const childNodes = childIdsArray
                  .map(id => allNodes.find((n: any) => String(n.id) === id))
                  .filter(Boolean);
                
                const verticalSpacing = 150;
                const horizontalSpacing = 120;
                const maxExistingY = Math.max(...allNodes.map((n: any) => n.y || 0), parentNode.y);
                const baseY = maxExistingY + verticalSpacing;

                childNodes.forEach((childNode, index) => {
                  const totalWidth = Math.max(0, (childNodes.length - 1) * horizontalSpacing);
                  const startX = parentNode.x - totalWidth / 2;
                  const childX = startX + index * horizontalSpacing;
                  const childY = baseY;

                  childNode.fx = childX;
                  childNode.fy = childY;
                  childNode.x = childX;
                  childNode.y = childY;
                  childNode.vx = 0;
                  childNode.vy = 0;
                });

                sim.alpha(0.3).restart();
              }
            }
          }, 300);
        }
      } catch (error) {
        console.error('[EntityGraph] Error expanding node:', error);
      }
      return;
    }
    
    return;
  }, [expandedNodes, collapsedNodes, nodeParents, filteredData, expandedData, graphData, expandedNodeLinks, expandedNodeChildren, fullData, onNodeExpansionChange]);

  // Track if we're in the middle of restoring to prevent save from overwriting restored data
  const isRestoringRef = useRef<boolean>(false);

  // Sync expandedNodes with extendedNodes prop and restore full expanded state from store
  // IMPORTANT: This effect runs when customerId changes OR when data first becomes available
  // We need to set hasLoadedExpandedStateRef.current = true even if data isn't loaded yet,
  // so that the save effect can start working on the first expansion
  useEffect(() => {
    // Only restore if we have a customerId
    if (customerId) {
      // Check if we need to restore from store
      // The key insight: if expandedNodes is empty AND we have saved state for this customer,
      // we should restore it. This handles the case where the component is hidden/shown.
      const savedState = getExpandedStateFromStore(customerId);
      const hasSavedState = savedState && savedState.expandedNodes && savedState.expandedNodes.length > 0;
      const expandedNodesIsEmpty = expandedNodes.size === 0;
      
      // needsRestore = true if:
      // 1. customerId is different from last loaded, OR
      // 2. lastLoadedCustomerIdRef is not set (first mount), OR
      // 3. expandedNodes is empty but there's saved state (component was hidden/shown)
      const isFirstLoad = lastLoadedCustomerIdRef.current === null || lastLoadedCustomerIdRef.current === undefined;
      const customerChanged = lastLoadedCustomerIdRef.current !== customerId;
      const needsRestore = isFirstLoad || customerChanged || (expandedNodesIsEmpty && hasSavedState && !hasLoadedExpandedStateRef.current);

      console.log('[EntityGraph] needsRestore:', needsRestore, {
        customerId,
        lastLoaded: lastLoadedCustomerIdRef.current,
        isFirstLoad,
        customerChanged,
        hasSavedState,
        expandedNodesIsEmpty,
        hasLoaded: hasLoadedExpandedStateRef.current,
        dataLoaded: !!(data && data.length > 0)
      });

      if (needsRestore) {
        // Mark that we're restoring to prevent save effect from overwriting
        isRestoringRef.current = true;
        
        // Load full expanded state from store
        const savedState = getExpandedStateFromStore(customerId);
        console.log('[EntityGraph] Retrieved saved state from store for customer', customerId, ':', savedState);
        
        // Debug: Also check all states in store
        try {
          const allStates = (window as any).useLinkagesStore?.getState?.()?.debugGetExpandedStates?.();
          console.log('[EntityGraph] All expanded states in store:', allStates);
        } catch (e) {
          // ignore
        }

        if (savedState && savedState.expandedNodes && savedState.expandedNodes.length > 0) {
          console.log('[EntityGraph] Restoring expanded state from store for', savedState.expandedNodes.length, 'nodes');

          // Mark that we're restoring to prevent save effect from overwriting
          isRestoringRef.current = true;
          
          // Restore expanded nodes
          setExpandedNodes(new Set(savedState.expandedNodes));

          // Restore expanded data
          if (savedState.expandedData && savedState.expandedData.length > 0) {
            setExpandedData(savedState.expandedData);
            console.log('[EntityGraph] Restored expandedData with', savedState.expandedData.length, 'links');
          }

          // Note: expandedData is restored directly from saved state

          // Restore node parents
          if (savedState.nodeParents && Object.keys(savedState.nodeParents).length > 0) {
            setNodeParents(new Map(Object.entries(savedState.nodeParents)));
          }

          // Restore expanded node links
          if (savedState.expandedNodeLinks && Object.keys(savedState.expandedNodeLinks).length > 0) {
            const linksMap = new Map<string, Set<string>>();
            Object.entries(savedState.expandedNodeLinks).forEach(([nodeId, linkIds]) => {
              linksMap.set(nodeId, new Set(linkIds as string[]));
            });
            setExpandedNodeLinks(linksMap);
          }

          // Restore expanded node children
          if (savedState.expandedNodeChildren && Object.keys(savedState.expandedNodeChildren).length > 0) {
            const childrenMap = new Map<string, Set<string>>();
            Object.entries(savedState.expandedNodeChildren).forEach(([nodeId, childIds]) => {
              childrenMap.set(nodeId, new Set(childIds as string[]));
            });
            setExpandedNodeChildren(childrenMap);
          }

          hasLoadedExpandedStateRef.current = true;
          lastLoadedCustomerIdRef.current = customerId;
          console.log('[EntityGraph] Restored state and marked as loaded');
          
          // Clear restoring flag after a short delay to allow state updates to be processed
          setTimeout(() => {
            isRestoringRef.current = false;
            console.log('[EntityGraph] Restore complete, ready for saves');
          }, 50);
        } else {
          console.log('[EntityGraph] No saved state found, initializing fresh');
          // No saved state - only clear if this is the first load for this customer
          if (isFirstLoad) {
            setExpandedNodes(new Set());
            setExpandedData([]);
            setNodeParents(new Map());
            setExpandedNodeLinks(new Map());
            setExpandedNodeChildren(new Map());
          }
          
          // Sync with extendedNodes prop if provided
          if (extendedNodes && extendedNodes.size > 0) {
            setExpandedNodes(new Set(extendedNodes));
          }
          
          // Mark as loaded immediately
          hasLoadedExpandedStateRef.current = true;
          lastLoadedCustomerIdRef.current = customerId;
          console.log('[EntityGraph] No saved state - marked as loaded and ready for saves');
          
          // Clear restoring flag
          isRestoringRef.current = false;
        }
      } else {
        console.log('[EntityGraph] Already loaded, syncing with prop if needed');
        // Already loaded, just sync expandedNodes with prop if different and prop is provided
        if (extendedNodes && extendedNodes.size > 0) {
          setExpandedNodes(prev => {
            const currentIds = Array.from(prev).sort().join(',');
            const propIds = Array.from(extendedNodes).sort().join(',');
            if (currentIds !== propIds) {
              return new Set(extendedNodes);
            }
            return prev;
          });
        }
      }
    } else if (extendedNodes && extendedNodes.size > 0) {
      // Sync with prop if we don't have customerId yet
      setExpandedNodes(prev => {
        const currentIds = Array.from(prev).sort().join(',');
        const propIds = Array.from(extendedNodes).sort().join(',');
        if (currentIds !== propIds) {
          return new Set(extendedNodes);
        }
        return prev;
      });
    }
  }, [extendedNodes, customerId, getExpandedStateFromStore, data, fullData]);

  // Save expanded state to store whenever it changes
  // NOTE: We skip saves while restoring to prevent overwriting restored data
  useEffect(() => {
    if (!customerId) {
      console.log('[EntityGraph] Save skipped - no customerId');
      return;
    }
    
    // CRITICAL: Don't save if we haven't run the restore effect yet for this customerId
    // The restore effect sets hasLoadedExpandedStateRef.current = true when it completes
    // This prevents the save from overwriting saved data with empty state on initial mount
    if (!hasLoadedExpandedStateRef.current) {
      console.log('[EntityGraph] Save skipped - restore effect has not run yet for this customer');
      return;
    }
    
    if (isRestoringRef.current) {
      console.log('[EntityGraph] Save skipped - currently restoring from store');
      return;
    }

    // Convert Set/Map to arrays/objects for storage
    const expandedNodeLinksObj: { [nodeId: string]: string[] } = {};
    expandedNodeLinks.forEach((linkIds, nodeId) => {
      expandedNodeLinksObj[nodeId] = Array.from(linkIds);
    });

    const expandedNodeChildrenObj: { [nodeId: string]: string[] } = {};
    expandedNodeChildren.forEach((childIds, nodeId) => {
      expandedNodeChildrenObj[nodeId] = Array.from(childIds);
    });

    const nodeParentsObj = Object.fromEntries(nodeParents);
    
    const stateToSave = {
      expandedNodes: Array.from(expandedNodes),
      expandedData: expandedData,
      expandedNodeLinks: expandedNodeLinksObj,
      expandedNodeChildren: expandedNodeChildrenObj,
      nodeParents: nodeParentsObj
    };

    console.log('[EntityGraph] Save effect running - calling setExpandedState:', {
      customerId,
      stateToSave
    });
    
    useLinkagesStore.getState().setExpandedState(customerId, stateToSave);
    
    // CRITICAL DEBUG: Immediately verify the save worked
    const testRetrieve = useLinkagesStore.getState().getExpandedState(customerId);
    console.log('[EntityGraph] IMMEDIATE VERIFICATION - Just saved, now reading back:', {
      customerId,
      saved: stateToSave,
      retrieved: testRetrieve,
      match: JSON.stringify(stateToSave) === JSON.stringify(testRetrieve)
    });
    
    console.log('[EntityGraph] Saved expanded state to store:', {
      customerId,
      expandedNodesCount: expandedNodes.size,
      expandedDataCount: expandedData.length,
      expandedNodes: Array.from(expandedNodes),
      timestamp: new Date().toISOString()
    });
    
    // Verify it was saved
    setTimeout(() => {
      try {
        const verified = (window as any).useLinkagesStore?.getState?.()?.getExpandedState?.(customerId);
        console.log('[EntityGraph] Verified saved state for', customerId, ':', verified);
      } catch (e) {
        console.error('[EntityGraph] Verification failed:', e);
      }
    }, 0);
  }, [customerId, expandedNodes, nodeParents, expandedNodeLinks, expandedNodeChildren]);

  // Reset expanded nodes when resetKey changes (full reset)
  // NOTE: This clears the LOCAL component state only, NOT the store
  // The store preserves expanded state across customer navigation
  useEffect(() => {
    // Don't reset if we're in the middle of restoring from store
    if (isRestoringRef.current) {
      return;
    }
    
    setExpandedNodes(new Set());
    setExpandedData([]);
    setNodeParents(new Map());
    setExpandedNodeLinks(new Map());
    setExpandedNodeChildren(new Map());
    setCollapsedNodes(new Set());
    setOpenedNodeIds(new Set());
    if (openedNodeIdsRef) openedNodeIdsRef.current = new Set();
    // DO NOT reset hasLoadedExpandedStateRef or lastLoadedCustomerIdRef here
    // These should only be managed by the restore effect
  }, [resetKey]);

  // Trigger graph re-render after expansion state is restored
  // This ensures the graph data updates even if data prop isn't available during restore
  useEffect(() => {
    // Just a safety effect to ensure restoration is properly handled
  }, [expandedData.length]); // Only depend on length to avoid infinite loops

  // Clear only expanded data when clearExpandedDataKey changes (without resetting filters)
  // NOTE: This clears the LOCAL component state only, NOT the store
  useEffect(() => {
    if (clearExpandedDataKey !== undefined && clearExpandedDataKey > 0) {
      // Clear only the current degree's expanded state
      setExpandedNodes(new Set());
      setExpandedData([]);
      setNodeParents(new Map());
      setExpandedNodeLinks(new Map());
      setExpandedNodeChildren(new Map());
      setOpenedNodeIds(new Set());
      if (openedNodeIdsRef) openedNodeIdsRef.current = new Set();
      // DO NOT reset hasLoadedExpandedStateRef or lastLoadedCustomerIdRef here
      // These should only be managed by the restore effect
    }
  }, [clearExpandedDataKey, currentDegreeFilter]);

  // Add custom force to maintain tree structure for expanded nodes (children below parents)
  useEffect(() => {
    if (!graphRef.current || nodeParents.size === 0) return;

    try {
      // Create a force that positions child nodes BELOW their parents (positive Y direction)
      const treeForce = (alpha: number) => {
        const sim = graphRef.current?.d3ForceSimulation;
        if (!sim || typeof sim.nodes !== 'function') return;
        
        const nodes = sim.nodes();
        const verticalSpacing = 150; // Distance below parent
        const horizontalSpacing = 120; // Spacing between siblings
        
        nodeParents.forEach((parentId, childId) => {
          const parentNode = nodes.find((n: any) => String(n.id) === String(parentId));
          const childNode = nodes.find((n: any) => String(n.id) === String(childId));
          
          if (parentNode && childNode && parentNode.x !== undefined && parentNode.y !== undefined) {
            // Get all siblings (children of the same parent)
            const siblings = Array.from(nodeParents.entries())
              .filter(([cid, pid]) => pid === parentId)
              .map(([cid]) => nodes.find((n: any) => String(n.id) === String(cid)))
              .filter(Boolean);
            
            const siblingIndex = siblings.findIndex((n: any) => String(n?.id) === String(childId));
            const totalSiblings = siblings.length;
            
            // Calculate horizontal position (centered around parent)
            const totalWidth = Math.max(0, (totalSiblings - 1) * horizontalSpacing);
            const startX = (parentNode.x || 0) - totalWidth / 2;
            const targetX = startX + siblingIndex * horizontalSpacing;
            // IMPORTANT: targetY is BELOW parent (positive Y direction)
            const targetY = (parentNode.y || 0) + verticalSpacing;
            
            // Always keep expanded nodes fixed below their parent to maintain tree structure
            // This prevents them from being pulled upward by other forces
            if (childNode.fx !== undefined && childNode.fy !== undefined) {
              // Update fixed position to maintain tree structure
              childNode.fx = targetX;
              childNode.fy = targetY;
              childNode.x = targetX;
              childNode.y = targetY;
              childNode.vx = 0;
              childNode.vy = 0;
            } else {
              // If not fixed, fix it now to maintain tree structure
              childNode.fx = targetX;
              childNode.fy = targetY;
              childNode.x = targetX;
              childNode.y = targetY;
              childNode.vx = 0;
              childNode.vy = 0;
            }
            
            // Enforce that child is always below parent (safety check)
            if (childNode.y !== undefined && parentNode.y !== undefined && childNode.y <= parentNode.y) {
              childNode.y = parentNode.y + verticalSpacing;
              childNode.fy = childNode.y;
            }
          }
        });
      };

      // Add custom force
      if (graphRef.current.d3Force) {
        graphRef.current.d3Force('treeLayout', treeForce);
        
        // Reheat simulation
        const sim = graphRef.current.d3ForceSimulation;
        if (sim && typeof sim.alpha === 'function') {
          sim.alpha(0.2).restart();
        }
      }
    } catch (err) {
      console.warn('[EntityGraph] Failed to apply tree force:', err);
    }
  }, [nodeParents, graphData.nodes]);
  // Helper function to check if a node has any connection to a defaulting customer node
  // A defaulter is a customer node with high risk (shown in red)
  const hasConnectionToDefaulter = useCallback((nodeId: string): boolean => {
    // Find all links connected to this node
    const connectedLinks = graphData.links.filter(
      (link: any) => link.source === nodeId || link.target === nodeId
    );
    
    // Check if any connected node is a customer with high risk (defaulter)
    for (const link of connectedLinks) {
      const connectedNodeId = link.source === nodeId ? link.target : link.source;
      const connectedNode = graphData.nodes.find((n: any) => n.id === connectedNodeId);
      
      if (connectedNode) {
        // Check if the connected node is a customer
        const isCustomerNode = connectedNode.type?.toLowerCase().includes('customer') || 
                              connectedNode.type?.toLowerCase().includes('person');
        
        if (isCustomerNode) {
          // Check if this customer has high risk (appears in red)
          const connectedNodeRiskIndicator = getCustomerRiskIndicator(connectedNode);
          if (connectedNodeRiskIndicator === 'high') {
            return true;
          }
        }
      }
    }
    
    return false;
  }, [graphData.links, graphData.nodes, getCustomerRiskIndicator]);

  // Set initial zoom level when component mounts or resets
  useEffect(() => {
    if (!graphRef.current) return;

    const timer = setTimeout(() => {
      if (!graphRef.current) return;

      // First, try to restore saved node positions if available
      let hasSavedPositions = false;
      if (customerId) {
        const savedPositions = getNodePositions(customerId);
        if (savedPositions && savedPositions.length > 0) {
          console.log('[EntityGraph] Restoring saved node positions for customer:', customerId, 'Count:', savedPositions.length, 'Current nodes:', graphData.nodes.length);
          
          // Create a map of saved positions
          const posMap = new Map<string, any>();
          savedPositions.forEach((pos: any) => {
            posMap.set(pos.id, pos);
          });
          
          // Count how many current nodes have saved positions
          let matchCount = 0;
          graphData.nodes.forEach((node: any) => {
            if (posMap.has(node.id)) {
              matchCount++;
            }
          });
          
          console.log('[EntityGraph] Node match count:', matchCount, 'Total nodes:', graphData.nodes.length, 'Saved positions:', savedPositions.length);
          
          // Restore positions for any nodes that have saved positions
          // This allows partial restoration when graph data changes (e.g., filtering by degree)
          if (matchCount > 0) {
            hasSavedPositions = true;
            console.log('[EntityGraph] Applying saved positions to', matchCount, 'matching nodes');
            
            // Apply saved positions directly to nodes that have saved positions
            let restoredCount = 0;
            graphData.nodes.forEach((node: any) => {
              const saved = posMap.get(node.id);
              if (saved) {
                node.x = saved.x;
                node.y = saved.y;
                // Only fix the node if it was explicitly fixed in the saved state
                node.fx = saved.fx;
                node.fy = saved.fy;
                node.vx = 0;
                node.vy = 0;
                restoredCount++;
              }
            });
            
            console.log('[EntityGraph] Restored positions for', restoredCount, 'nodes');
            
            // If we restored positions for all nodes, stop the simulation to freeze them
            // Otherwise, let the simulation run but with reduced force for restored nodes
            if (matchCount === graphData.nodes.length && matchCount === savedPositions.length) {
              // All nodes match - stop simulation completely
              try {
                const sim = graphRef.current.d3ForceSimulation;
                if (sim && typeof sim.alpha === 'function') {
                  sim.alpha(0).stop();
                  console.log('[EntityGraph] Stopped simulation to freeze all positions');
                }
              } catch (e) {
                console.warn('[EntityGraph] Could not stop simulation:', e);
              }
            } else {
              // Partial match - reduce simulation force but don't stop completely
              // This allows new nodes to position while keeping restored nodes stable
              try {
                const sim = graphRef.current.d3ForceSimulation;
                if (sim && typeof sim.alpha === 'function') {
                  // Reduce alpha but don't stop - allows new nodes to position
                  sim.alpha(0.1);
                  console.log('[EntityGraph] Reduced simulation force for partial position restoration');
                }
              } catch (e) {
                console.warn('[EntityGraph] Could not adjust simulation:', e);
              }
            }
          }
        }
      }

      // Set flag to ignore onZoomEnd during initial positioning
      isProgrammaticZoomRef.current = true;

      // Reset view
      let viewportRestored = false;
      if (customerId) {
        const savedViewport = getViewportState(customerId);
        // Only trust a viewport that could plausibly have a graph in it. An
        // empty/!broken render saves garbage (zoom 0.01 at x -13636) and that
        // value then gets restored forever, so the canvas looks blank even once
        // the data is correct. Anything out of range falls through to zoomToFit.
        const sane =
          !!savedViewport &&
          Number.isFinite(savedViewport.x) &&
          Number.isFinite(savedViewport.y) &&
          Number.isFinite(savedViewport.zoom) &&
          savedViewport.zoom >= 0.2 && savedViewport.zoom <= 8 &&
          Math.abs(savedViewport.x) < 5000 && Math.abs(savedViewport.y) < 5000;

        if (savedViewport && !sane) {
          console.warn('[EntityGraph] Discarding out-of-range saved viewport:', savedViewport);
          clearViewportState?.(customerId);
        } else if (sane) {
          console.log('[EntityGraph] Restoring saved viewport for customer:', customerId, savedViewport);
          graphRef.current.centerAt(savedViewport!.x, savedViewport!.y, 1000);
          graphRef.current.zoom(savedViewport!.zoom, 1000);
          viewportRestored = true;
        }
      }

      if (!viewportRestored) {
        // Fallback to default centering
        // Try to find the root node (first customer) to center on it
        const rootNode = firstCustomerNodeId 
          ? graphData.nodes.find((n: any) => String(n.id) === String(firstCustomerNodeId))
          : graphData.nodes.find((n: any) => n.type?.toLowerCase().includes('customer') || n.type?.toLowerCase().includes('person'));
        
        if (rootNode && (rootNode as any).x !== undefined && (rootNode as any).y !== undefined) {
          console.log('[EntityGraph] Centering on root node:', rootNode.id);
          graphRef.current.centerAt((rootNode as any).x, (rootNode as any).y, 1000);
        } else {
          graphRef.current.centerAt(0, 0, 1000);
        }

        // Frame the whole graph rather than zooming to a fixed 1.5x. A fixed
        // zoom assumes the layout happens to sit under the camera; when it
        // doesn't, nodes sit off-screen and the canvas reads as empty.
        // zoomToFit derives both the centre and the scale from the actual
        // node extent, so the graph is always in view at a sane size.
        const fit = () => graphRef.current?.zoomToFit?.(600, 80);
        fit();
        // The force simulation keeps moving nodes for a beat after mount, so
        // re-fit once it has settled.
        setTimeout(fit, 900);
      }

      // Only configure forces if we didn't restore positions
      if (!hasSavedPositions && graphRef.current.d3Force && graphData.nodes.length > 0) {
        console.log('[EntityGraph] Configuring new forces for fresh graph');
        // Dynamically adjust charge strength based on node count
        const nodeCount = graphData.nodes.length;
        const chargeStrength = Math.min(-300, -1500 / Math.max(1, Math.sqrt(nodeCount)));
        graphRef.current.d3Force('charge')?.strength(chargeStrength).distanceMax(800);
        graphRef.current.d3Force('link')?.distance(150).strength(0.5);
        
        if (graphRef.current.d3Force('sameName')) {
          graphRef.current.d3Force('sameName', null);
        }

        // Explicitly remove the default center force to favor our custom centering
        if (graphRef.current.d3Force('center')) {
          graphRef.current.d3Force('center', null);
        }

        // Reheat simulation slightly to ensure nodes spread out
        const sim = graphRef.current.d3ForceSimulation;
        if (sim) sim.alpha(0.3).restart();
      }

      // Reset the flag after positioning is done
      // Use a timeout to ensure any triggered zoom events have finished
      setTimeout(() => {
        isProgrammaticZoomRef.current = false;
        console.log('[EntityGraph] Programmatic zoom period ended');
      }, 1200);
    }, 500); // Increased timeout to ensure coordinates have settled

    return () => clearTimeout(timer);
  }, [graphData, resetKey, customerId, getNodePositions, getViewportState, firstCustomerNodeId]);

  // Custom force: either group nodes by type (central view) or arrange into hierarchical levels by degree (hierarchical view)
  useEffect(() => {
    if (!graphRef.current || !graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) return;

    try {
      // Default to hierarchical view when graph-view filter is absent (filter was removed from UI)
      const primarySelected = (filterState as any)?.primarySelected || {};
      const graphViewSelected: string[] = primarySelected['graph-view-filter'] ?? ['hierarchical'];
      const isHierarchical = Array.isArray(graphViewSelected) && graphViewSelected.includes('hierarchical');

      // Remove any previous custom grouping forces before applying new ones
      if (graphRef.current.d3Force('typeX')) graphRef.current.d3Force('typeX', null);
      if (graphRef.current.d3Force('degreeY')) graphRef.current.d3Force('degreeY', null);
      if (graphRef.current.d3Force('centerX')) graphRef.current.d3Force('centerX', null);
      if (graphRef.current.d3Force('radialX')) graphRef.current.d3Force('radialX', null);
      if (graphRef.current.d3Force('radialY')) graphRef.current.d3Force('radialY', null);

      // Unlock previously fixed node coordinates to allow forces layout calculations to converge authentically
      const { nodes: currentNodes } = (graphRef.current?.graphData ? graphRef.current.graphData() : graphData);
      (currentNodes || []).forEach((n: any) => {
        delete n.fx;
        delete n.fy;
      });

      if (isHierarchical) {
        // Build adjacency from current graph links
        const adj = new Map<string, Set<string>>();
        graphData.links.forEach((link: any) => {
          const s = typeof link.source === 'object' ? String(link.source?.id) : String(link.source);
          const t = typeof link.target === 'object' ? String(link.target?.id) : String(link.target);
          if (!adj.has(s)) adj.set(s, new Set());
          if (!adj.has(t)) adj.set(t, new Set());
          adj.get(s)!.add(t);
          adj.get(t)!.add(s);
        });

        // Choose root: prefer matching customerId, then firstCustomerNodeId, then first CUSTOMER-like node
        let rootId = firstCustomerNodeId;
        if (!rootId && customerId) {
          const cId = String(customerId);
          const found = graphData.nodes.find((n: any) => {
            const id = String(n.id);
            const uid = n.properties?.userid ?? n.properties?.user_id;
            return id === cId || (uid != null && String(uid) === cId);
          });
          if (found) rootId = String(found.id);
        }
        if (!rootId) {
          rootId = (graphData.nodes.find((n: any) => n.type?.toLowerCase().includes('customer') || n.type?.toLowerCase().includes('person'))?.id) || graphData.nodes[0]?.id;
        }

        // BFS to compute degrees (distance from root). Root gets degree = 1
        const degreeMap = new Map<string, number>();
        if (rootId) {
          const q: string[] = [String(rootId)];
          degreeMap.set(String(rootId), 1);
          while (q.length > 0) {
            const cur = q.shift()!;
            const neighbors = adj.get(cur) || new Set();
            for (const nb of neighbors) {
              if (!degreeMap.has(nb)) {
                degreeMap.set(nb, (degreeMap.get(cur) || 1) + 1);
                q.push(nb);
              }
            }
          }
        }

        const maxDegree = degreeMap.size > 0 ? Math.max(...Array.from(degreeMap.values(), v => v || 1)) : 1;
        const levelDistance = 140; // vertical spacing between degrees
        const startY = -200; // Fixed static baseline position. Adding depth items doesn't shift existing rows upward.

        // Force to align nodes vertically by their degree (level)
        const fy = forceY((node: any) => {
          const bfsDeg = degreeMap.get(String(node.id));
          const nodeDegreeRank = degreeNameToRank(node.degree);
          let degree = bfsDeg !== undefined ? bfsDeg : (nodeDegreeRank > 0 ? nodeDegreeRank : (maxDegree + 1));
          if (degree <= 0) {
            degree = maxDegree + 1;
          }
          
          // Separate Customers from Attributes: each degree level is split into two sub-levels.
          // Customers go at (degree * 2 - 1), Attributes go at (degree * 2).
          const isCustomer = String(node.type || '').toLowerCase().includes('customer') || String(node.type || '').toLowerCase().includes('person');
          const level = (degree * 2) - (isCustomer ? 1 : 0);
          
          return startY + (level - 1) * (levelDistance / 2); // halved distance since we doubled levels
        }).strength(0.95);

        // Gentle force to center nodes horizontally
        const fxCenter = forceX(() => 0).strength(0.2);

        graphRef.current.d3Force('degreeY', fy);
        graphRef.current.d3Force('centerX', fxCenter);

        // Nudge the simulation to reheat and converge to new forces
        try {
          const sim = graphRef.current.d3ForceSimulation;
          if (sim && typeof sim.alpha === 'function') {
            sim.alpha(1).restart();
          } else if (graphRef.current.d3ReheatSimulation) {
            graphRef.current.d3ReheatSimulation();
          }
        } catch (e) {
          // ignore
        }

      } else {
        // Central view: arrange nodes in concentric circular rings around the main customer node.
        // First-degree neighbors will sit on the first ring, second-degree on the next, etc.
        try {
          // Build adjacency from current graph links
          const adj = new Map<string, Set<string>>();
          graphData.links.forEach((link: any) => {
            const s = typeof link.source === 'object' ? String(link.source?.id) : String(link.source);
            const t = typeof link.target === 'object' ? String(link.target?.id) : String(link.target);
            if (!adj.has(s)) adj.set(s, new Set());
            if (!adj.has(t)) adj.set(t, new Set());
            adj.get(s)!.add(t);
            adj.get(t)!.add(s);
          });

          // Choose central root: prefer matching customerId, then firstCustomerNodeId, otherwise first node
          let rootId = firstCustomerNodeId;
          if (!rootId && customerId) {
            const cId = String(customerId);
            const found = graphData.nodes.find((n: any) => {
              const id = String(n.id);
              const uid = n.properties?.userid ?? n.properties?.user_id;
              return id === cId || (uid != null && String(uid) === cId);
            });
            if (found) rootId = String(found.id);
          }
          if (!rootId) {
            rootId = (graphData.nodes.find((n: any) => n.type?.toLowerCase().includes('customer') || n.type?.toLowerCase().includes('person'))?.id) || graphData.nodes[0]?.id;
          }

          // BFS to compute degrees (distance from root). Root gets degree = 1
          // Also record a parent map so we know which node discovered a given node (useful to anchor second-degree clusters)
          const degreeMap = new Map<string, number>();
          const parentMap = new Map<string, string>();
          if (rootId) {
            const q: string[] = [String(rootId)];
            degreeMap.set(String(rootId), 1);
            parentMap.set(String(rootId), String(rootId));
            while (q.length > 0) {
              const cur = q.shift()!;
              const neighbors = adj.get(cur) || new Set();
              for (const nb of neighbors) {
                if (!degreeMap.has(nb)) {
                  degreeMap.set(nb, (degreeMap.get(cur) || 1) + 1);
                  parentMap.set(nb, cur);
                  q.push(nb);
                }
              }
            }
          }

          const maxDegree = Math.max(1, ...Array.from(degreeMap.values(), v => v || 1));

          // Group nodes by degree
          const degreeBuckets: Record<number, string[]> = {};
          graphData.nodes.forEach((n: any) => {
            const nodeDegreeRank = degreeNameToRank(n.degree);
            // If node has an explicit degree rank (from API), use it. Otherwise fall back to BFS distance.
            const degree = nodeDegreeRank > 0 ? nodeDegreeRank : (degreeMap.get(String(n.id)) || (maxDegree + 1));
            
            // Separate Customers from Attributes: each degree level is split into two rings.
            // Customers go at (degree * 2 - 1), Attributes go at (degree * 2).
            const isCustomer = String(n.type || '').toLowerCase().includes('customer') || String(n.type || '').toLowerCase().includes('person');
            const level = (degree * 2) - (isCustomer ? 1 : 0);
            
            if (!degreeBuckets[level]) degreeBuckets[level] = [];
            degreeBuckets[level].push(String(n.id));
          });

          // Create target positions per node: evenly distribute nodes on their ring
          const posMap: Record<string, { x: number; y: number }> = {};
          const baseRadius = Math.max(100, Math.min(180, (dimensions.width || 1000) / 6)); // scale with container width
          const centerX = 0;
          const centerY = 0;

          // We'll compute explicit angles for first-degree ring (degree=2), then anchor certain second-degree (degree=3)
          const angleMap: Record<string, number> = {};

          // 1) Root stays near center (degree === 1)
          const rootBucket = degreeBuckets[1] || [];
          rootBucket.forEach((id) => {
            posMap[id] = { x: centerX + (Math.random() - 0.5) * 8, y: centerY + (Math.random() - 0.5) * 8 };
            angleMap[id] = 0;
          });

          // 2) First-degree neighbors (degree === 2) - distribute evenly on first ring
          const firstRing = degreeBuckets[2] || [];
          const firstCount = Math.max(1, firstRing.length);
          firstRing.forEach((id, i) => {
            const radius = baseRadius * (2 - 1);
            const angle = (i / firstCount) * Math.PI * 2;
            angleMap[id] = angle;
            posMap[id] = { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
          });

          // 3) Handle second-degree (degree === 3). For customer/person nodes, place them on a small arc anchored at their parent.
          const secondRing = degreeBuckets[3] || [];
          // Group second-degree customer nodes by their parent first-degree node
          const parentBuckets: Record<string, string[]> = {};
          const remainingSecond: string[] = [];
          secondRing.forEach((id) => {
            const nodeObj = graphData.nodes.find((n: any) => String(n.id) === String(id));
            const isCustomer = nodeObj?.type?.toLowerCase().includes('customer') || nodeObj?.type?.toLowerCase().includes('person');
            const parent = parentMap.get(String(id));
            if (isCustomer && parent) {
              if (!parentBuckets[parent]) parentBuckets[parent] = [];
              parentBuckets[parent].push(id);
            } else {
              remainingSecond.push(id);
            }
          });

          // Place anchored second-degree customer nodes close to their parent angle
          Object.keys(parentBuckets).forEach((parentId) => {
            const siblings = parentBuckets[parentId];
            const parentAngle = angleMap[parentId] ?? 0;
            // Spread anchored children across a limited arc; allow larger spread for more siblings but cap it
            const spread = Math.min(Math.PI * 0.7, 0.6 * Math.PI * (siblings.length / Math.max(3, siblings.length)) );
            const start = parentAngle - spread / 2;
            // Place anchored second-degree customer nodes farther out to avoid overlap with first-degree nodes.
            const ringRadius = baseRadius * 3.5; // moved further out
            const parentVecX = Math.cos(parentAngle);
            const parentVecY = Math.sin(parentAngle);
            const parentPush = baseRadius * 0.9; // push further along parent's radial direction
            // Group siblings by type so nodes of the same type sit beside each other
            const typeBuckets: Record<string, string[]> = {};
            siblings.forEach((id) => {
              const nodeObj = graphData.nodes.find((n: any) => String(n.id) === String(id));
              const t = nodeObj?.type || 'UNKNOWN';
              if (!typeBuckets[t]) typeBuckets[t] = [];
              typeBuckets[t].push(id);
            });

            // Order types deterministically (alphabetical) so layout is stable
            const orderedTypes = Object.keys(typeBuckets).sort();

            // Allocate arc segments to each type proportional to their count
            const total = siblings.length;
            let angleCursor = start;
            orderedTypes.forEach((t) => {
              const bucket = typeBuckets[t];
              const portion = bucket.length / Math.max(1, total);
              const bucketArc = portion * spread;
              // Distribute nodes in this bucket across bucketArc
              bucket.forEach((id, idx) => {
                const frac = bucket.length > 1 ? (idx / (bucket.length - 1)) : 0.5;
                // small jitter per node to avoid perfect overlap
                const angle = angleCursor + frac * bucketArc + (Math.random() - 0.5) * 0.04;
                const x = centerX + Math.cos(angle) * ringRadius + parentVecX * parentPush;
                const y = centerY + Math.sin(angle) * ringRadius + parentVecY * parentPush;
                posMap[id] = { x, y };
              });
              angleCursor += bucketArc;
            });
          });

          // Place remaining second-degree nodes (non-customer) evenly on the global second ring
          if (remainingSecond.length > 0) {
            // place non-customer second-degree nodes on a wider ring to reduce crowding
            // Layout spacing, NOT node size. Shrinking this packs nodes together
            // until their hit areas overlap and the ones underneath stop
            // responding to hover and clicks. Reduce `nodeVal` to make nodes
            // smaller — never this.
            const r = baseRadius * 3.2;
            const count = remainingSecond.length;
            remainingSecond.forEach((id, i) => {
              const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.03;
              posMap[id] = { x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r };
            });
          }

          // 4) For deeper degrees (4+), just place them on wider concentric rings evenly
          Object.keys(degreeBuckets).forEach((k) => {
            const deg = Number(k);
            if (deg <= 3) return;
            const bucket = degreeBuckets[deg] || [];
            const radius = baseRadius * (deg - 1);
            const count = Math.max(1, bucket.length);
            bucket.forEach((id, i) => {
              const angle = (i / count) * Math.PI * 2;
              posMap[id] = { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
            });
          });

          // Apply forceX and forceY towards computed positions
          const fx = forceX((node: any) => {
            const p = posMap[String(node.id)];
            return p ? p.x : (node.x ?? 0);
          }).strength((node: any) => posMap[String(node.id)] ? 0.9 : 0.0);

          const fy = forceY((node: any) => {
            const p = posMap[String(node.id)];
            return p ? p.y : (node.y ?? 0);
          }).strength((node: any) => posMap[String(node.id)] ? 0.9 : 0.0);

          graphRef.current.d3Force('radialX', fx);
          graphRef.current.d3Force('radialY', fy);

          // Reheat simulation so nodes move to their rings
          try {
            const sim = graphRef.current.d3ForceSimulation;
            if (sim && typeof sim.alpha === 'function') {
              sim.alpha(1).restart();
            } else if (graphRef.current.d3ReheatSimulation) {
              graphRef.current.d3ReheatSimulation();
            }
          } catch (e) {
            // ignore
          }
        } catch (err) {
          console.warn('[EntityGraph] radial central layout failed:', err);
        }
      }

    } catch (err) {
      console.warn('[EntityGraph] Failed to apply grouping/hierarchical force:', err);
    }
  }, [graphData.nodes, graphData.links, dimensions.width, (filterState as any)?.primarySelected?.['graph-view-filter'], firstCustomerNodeId, resetKey]);

  // Helper function to calculate highlights for a given node
  const calculateHighlights = useCallback((node: any) => {
    if (!node) {
      return { neighborNodeIds: new Set<string>(), neighborLinkIds: new Set<string>() };
    }

    const neighborNodeIds = new Set<string>();
    const neighborLinkIds = new Set<string>();
    const nodeIdStr = String(node.id);

    // Use ref to avoid dependency on graphData.links which changes frequently
    graphLinksRef.current.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target?.id : link.target;

      if (sourceId === node.id || String(sourceId) === nodeIdStr) {
        neighborNodeIds.add(String(targetId));
        neighborLinkIds.add(`${sourceId}-${targetId}`);
      }
      if (targetId === node.id || String(targetId) === nodeIdStr) {
        neighborNodeIds.add(String(sourceId));
        neighborLinkIds.add(`${sourceId}-${targetId}`);
      }
    });

    // Add the node itself
    neighborNodeIds.add(nodeIdStr);

    return { neighborNodeIds, neighborLinkIds };
  }, []);

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);

    if (node) {
      // Calculate highlights for hovered node
      const { neighborNodeIds, neighborLinkIds } = calculateHighlights(node);
      setHighlightNodes(neighborNodeIds);
      setHighlightLinks(neighborLinkIds);

      // Replace the hovered node's name with the formatted label so the
      // graph's existing hover/canvas tooltip displays the same content as
      // the click label. We only modify one node at a time and restore the
      // previous name when hover ends or switches nodes.
      try {
        const formatted = formatGraphLabel(node) || node.name || '';

        // If we previously modified a different node, restore it first
        if (modifiedHoverNameRef.current && modifiedHoverNameRef.current.id !== String(node.id)) {
          const prevId = modifiedHoverNameRef.current.id;
          const prevOriginal = modifiedHoverNameRef.current.original;
          const allNodes = graphRef.current?.graphData ? graphRef.current.graphData().nodes : graphData.nodes;
          const prevNode = Array.isArray(allNodes) ? allNodes.find((n: any) => String(n.id) === String(prevId)) : null;
          if (prevNode) prevNode.name = prevOriginal;
          modifiedHoverNameRef.current = null;
        }

        if (node && String(node.name) !== String(formatted)) {
          // Save original name if not already saved for this node
          if (!modifiedHoverNameRef.current || modifiedHoverNameRef.current.id !== String(node.id)) {
            modifiedHoverNameRef.current = { id: String(node.id), original: String(node.name ?? '') };
          }
          node.name = formatted;
          // Trigger a repaint / refresh
          try { graphRef.current?.refresh?.(); } catch (e) { if (graphRef.current?.d3ReheatSimulation) graphRef.current.d3ReheatSimulation(); }
        }
      } catch (e) {
        // swallow any hover formatting errors
      }

    } else {
      // When hover ends, restore highlights from clicked node if one exists
      // Otherwise clear highlights
      if (clickedNode) {
        const { neighborNodeIds, neighborLinkIds } = calculateHighlights(clickedNode);
        setHighlightNodes(neighborNodeIds);
        setHighlightLinks(neighborLinkIds);
      } else {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
      }
      setTooltip(null);
      // Restore previously modified hover node name if present
      if (modifiedHoverNameRef.current) {
        try {
          const allNodes = graphRef.current?.graphData ? graphRef.current.graphData().nodes : graphData.nodes;
          const prevNode = Array.isArray(allNodes) ? allNodes.find((n: any) => String(n.id) === String(modifiedHoverNameRef.current!.id)) : null;
          if (prevNode) prevNode.name = modifiedHoverNameRef.current.original;
          modifiedHoverNameRef.current = null;
          try { graphRef.current?.refresh?.(); } catch (e) { if (graphRef.current?.d3ReheatSimulation) graphRef.current.d3ReheatSimulation(); }
        } catch (e) {
          // ignore restore errors
        }
      }
    }
  }, [clickedNode, calculateHighlights]); // Include clickedNode and calculateHighlights in dependencies

  // Clear hovered node when selectedNode is cleared or resetKey changes
  useEffect(() => {
    if (!selectedNode) {
      handleNodeHover(null);
      setClickedNode(null); // Also clear clicked node
    }
  }, [selectedNode, handleNodeHover]);

  // Clear hovered node when resetKey changes (graph reset)
  useEffect(() => {
    if (resetKey !== undefined && resetKey !== prevResetKeyRef.current) {
      handleNodeHover(null);
      setClickedNode(null); // Also clear clicked node when graph is reset
      setHighlightNodes(new Set()); // Clear highlights
      setHighlightLinks(new Set()); // Clear highlights
      // Also clear any inline node labels that were toggled by clicking nodes
      // This hides the small details shown near the icon on click when the
      // graph is reset.
      // Preserve the main customer node label so it stays visible after reset
      setLabeledNodes(() => {
        const s = new Set<string>();
        if (firstCustomerNodeId) s.add(String(firstCustomerNodeId));
        return s;
      });

      // Force a visual refresh of the canvas and reheat the simulation so
      // the graph appears in its initial state after a reset.
      try {
        graphRef.current?.refresh?.();
        if (graphRef.current?.d3ReheatSimulation) graphRef.current.d3ReheatSimulation();
      } catch (e) {
        // non-fatal
      }
      prevResetKeyRef.current = resetKey;
    }
  }, [resetKey, handleNodeHover, firstCustomerNodeId]);

  // Helper to format label text by replacing underscores with spaces
  const formatLabelText = useCallback((text: string): string => {
    return text.replace(/_/g, ' ');
  }, []);

  // Helper: search nested objects/arrays (and stringified JSON) for a key and return its first found value
  const findDeepKey = useCallback((obj: any, keyName: string): any => {
    if (obj === null || obj === undefined) return undefined;
    try {
      if (typeof obj === 'string') {
        const t = obj.trim();
        if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
          try {
            const parsed = JSON.parse(t);
            return findDeepKey(parsed, keyName);
          } catch (e) {
            // not JSON
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
      // ignore
    }
    return undefined;
  }, []);

  // Helper to build the small graph label shown on hover/click based on API response format
  const formatGraphLabel = useCallback((node: any) => {
    if (!node) return '';
    const typeRaw = String(node.type || node?.label || node?.properties?.type || '').toUpperCase();
    const props = node.properties || {};

    const pick = (...keys: string[]) => {
      for (const k of keys) {
        if (props[k] !== undefined && props[k] !== null && props[k] !== '') return String(props[k]);
        // also check nested raw fields
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
      let govIdType = pick('gov_id_type', 'id_type') || '';
      let govIdValue = pick('gov_id_value', 'id_value', 'value') || '';

      if (!govIdType) {
        govIdType = String(findDeepKey(props, 'gov_id_type') || findDeepKey(node, 'gov_id_type') || '').trim();
      }
      if (!govIdValue) {
        govIdValue = String(findDeepKey(props, 'gov_id_value') || findDeepKey(props, 'value') || findDeepKey(node, 'gov_id_value') || findDeepKey(node, 'value') || '').trim();
      }

      if (govIdType && (govIdType.toLowerCase() === 'null' || govIdType.toLowerCase() === 'undefined')) govIdType = '';
      if (govIdValue && (govIdValue.toLowerCase() === 'null' || govIdValue.toLowerCase() === 'undefined')) govIdValue = '';

      if (govIdType && govIdValue) return `${govIdType}(${govIdValue})`;
      if (govIdValue) return govIdValue;
      if (govIdType) return govIdType;

      // Never show label, return empty string or try to extract from node.name
      const nodeName = String(node.name || '');
      // Try to parse format like "PAN(ABCDE1234F)" from node.name
      const match = nodeName.match(/^([^(]+)\(([^)]+)\)$/);
      if (match && match[1] && match[2]) {
        return `${match[1]}(${match[2]})`;
      }
      return nodeName || '';
    }

    // Fallback: show label with value if available
    const genericVal = pick('value', 'label', 'name') || node.name || '';
    if (genericVal) return `${formatLabelText(typeRaw)} (${genericVal})`;

    return formatLabelText(typeRaw);
  }, [formatLabelText]);

  const handleNodeDoubleClick = useCallback((node: any) => {
    if (!graphRef.current || !node) return;

    console.log('Double clicked node:', node);

    // Simple approach: Just center on the node and zoom in to a fixed level
    // First center on the clicked node
    if (node.x !== undefined && node.y !== undefined) {
      graphRef.current.centerAt(node.x, node.y, 500);
    }

    // Then zoom in to 3x after centering
    setTimeout(() => {
      if (graphRef.current) {
        console.log('Applying zoom: 3x');
        graphRef.current.zoom(5, 500);
      }
    }, 100);

    // Alternative approach using zoomToFit if the above doesn't work
    // Find connected nodes for potential future use
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(String(node.id));

    graphData.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target?.id : link.target;

      if (sourceId === node.id || String(sourceId) === String(node.id)) {
        connectedNodeIds.add(String(targetId));
      }
      if (targetId === node.id || String(targetId) === String(node.id)) {
        connectedNodeIds.add(String(sourceId));
      }
    });

    console.log('Connected nodes:', Array.from(connectedNodeIds));
  }, [graphData.links]);

  const handleNodeClick = useCallback((node: any, event?: MouseEvent) => {
    const currentTime = Date.now();
    const isDoubleClick = currentTime - lastClickTime < 300 && lastClickedNode?.id === node?.id;

    setLastClickTime(currentTime);
    setLastClickedNode(node);

    // Set clicked node to persist blur effect (same as hover behavior)
    if (node) {
      // If clicking the same node, toggle it off (clear clicked state)
      const isSameNode = clickedNode && (
        clickedNode.id === node.id || 
        String(clickedNode.id) === String(node.id) ||
        (clickedNode.name && clickedNode.name === node.name)
      );
      
      if (isSameNode) {
        setClickedNode(null);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
      } else {
        // Set clicked node and calculate highlights - always update when clicking a different node
        setClickedNode(node);
        const { neighborNodeIds, neighborLinkIds } = calculateHighlights(node);
        setHighlightNodes(neighborNodeIds);
        setHighlightLinks(neighborLinkIds);
      }
    } else {
      // Clear clicked node if clicking empty space
      setClickedNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }

    // A null node means the click landed on empty canvas. The selection has
    // already been cleared above; everything below dereferences node.id, so
    // stop here rather than throwing.
    if (!node) {
      onNodeClick?.(null as any);
      return;
    }

    if (isDoubleClick) {
      // Handle double click - zoom to node and its neighbors
      handleNodeDoubleClick(node);
    } else {
      // Handle single click
      // Ensure the main customer node (firstCustomerNodeId) always keeps its label visible
      setLabeledNodes(prev => {
        const next = new Set(prev);
        const nodeIdStr = String(node.id);
        if (nodeIdStr === String(firstCustomerNodeId)) {
          // Always ensure main customer label is present
          next.add(nodeIdStr);
        } else {
          if (next.has(nodeIdStr)) {
            next.delete(nodeIdStr);
          } else {
            next.add(nodeIdStr);
          }
        }
        return next;
      });
      onNodeClick?.(node);
    }
  }, [onNodeClick, lastClickTime, lastClickedNode, handleNodeDoubleClick, firstCustomerNodeId, clickedNode, calculateHighlights]);

  // Memoized onNodeClick handler for ForceGraph component
  // Store positions of pagination "More" buttons for click detection
  const paginationButtonPositionsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const handleGraphNodeClick = useCallback((node: any, event?: MouseEvent) => {
    console.log('[EntityGraph] Node clicked - full debug:', {
      nodeId: node?.id,
      nodeType: node?.type,
      eventExists: !!event,
      clientX: event?.clientX,
      clientY: event?.clientY,
      graphRefExists: !!graphRef.current,
      containerRefExists: !!containerRef.current,
      nodeX: node?.x,
      nodeY: node?.y
    });
    
    // Chevron click detection removed (handled by pagination icons)

    
    // In delete mode, clicking on a non-customer node selects/deselects it for deletion
    if (isDeleteMode && event) {
      const isCustomer = String(node.type || '').toLowerCase().includes('customer') || String(node.type || '').toLowerCase().includes('person');
      
      if (!isCustomer) {
        console.log('[EntityGraph] Delete mode: clicking node to select for deletion:', node.id);
        event?.preventDefault?.();
        event?.stopPropagation?.();
        const nodeIdStr = String(node.id);
        const isCurrentlySelected = selectedForDeletion && selectedForDeletion.includes(nodeIdStr);
        console.log('[EntityGraph] Toggling node selection:', nodeIdStr, '| Currently selected:', isCurrentlySelected, '| Will be selected:', !isCurrentlySelected);
        
        if (onHiddenNodesChange) {
          // Toggle selection for deletion (mark with "-" in checkbox)
          onHiddenNodesChange(nodeIdStr, !isCurrentlySelected);
        }
        return;
      }
    }
    
    // Normal node click
    handleNodeClick(node, event);
  }, [isDeleteMode, selectedForDeletion, onHiddenNodesChange, endNodes, expandedNodes, handleChevronClick, handleNodeClick, paginationLimits]);

  // Handle zoom end and save to store with protection against loops
  const handleZoomEnd = useCallback((viewport: { x: number; y: number; k: number }) => {
    if (isProgrammaticZoomRef.current) {
        console.log('[EntityGraph] Ignoring sync zoom end during programmatic zoom');
        return;
    }
    
    if (customerId) {
        // Only update if it's a real change to prevent infinite update loops
        // Use getState() to avoid creating a dependency on the entire viewportStates object
        const currentViewport = useLinkagesStore.getState().getViewportState(customerId);
        if (!currentViewport || 
            Math.abs(currentViewport.x - viewport.x) > 1 || 
            Math.abs(currentViewport.y - viewport.y) > 1 || 
            Math.abs(currentViewport.zoom - viewport.k) > 0.01) {
          
          setViewportState(customerId, {
            x: viewport.x,
            y: viewport.y,
            zoom: viewport.k
          });
          console.log('[EntityGraph] Saved viewport state via handleZoomEnd:', viewport);
        }
    }
  }, [customerId, setViewportState]);

  // Handle click on "More"/"Less" button for pagination
  const handlePaginationClick = useCallback((nodeId: string, type: 'more' | 'less') => {
    if (loadingNodes.has(String(nodeId))) {
      console.log('[EntityGraph] Node is already loading, ignoring pagination click:', nodeId);
      return;
    }

    // Determine node's degree from current graphData to decide step/default limits
    const nodeObj = graphData.nodes?.find((n: any) => String(n.id) === String(nodeId));
    // Safeguard degree Rank to support numbers and fallback to string names correctly
    const nodeRank = nodeObj ? (typeof nodeObj.degree === 'number' ? nodeObj.degree : (nodeObj.numericDegree !== undefined ? Number(nodeObj.numericDegree) : (degreeNameToRank(nodeObj.degree) || 0))) : 0;
    const defaultLimit = getLimitByDegree(nodeRank);
    const step = defaultLimit;

    const current = paginationLimits[nodeId] ?? 0;

    if (type === 'more') {
      if (onMoreClick) {
        // Calculate exclusion list: IDs of nodes connected to this node that are already on the graph
        const adjacentNodeIds = new Set<string>();
        const allKnownLinks = [...(graphData.links || []), ...(extraLinks || [])];
        allKnownLinks.forEach((link: any) => {
          const s = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
          const t = typeof link.target === 'object' ? String(link.target.id) : String(link.target);
          if (s === String(nodeId)) adjacentNodeIds.add(t);
          if (t === String(nodeId)) adjacentNodeIds.add(s);
        });
        const exclusionList = Array.from(adjacentNodeIds);
        if (nodeObj) {
          console.log('[EntityGraph] Triggering onMoreClick with exclusionList:', exclusionList, 'node degree:', nodeObj.numericDegree);
          
          const nodeIdStr = String(nodeId);
          setLoadingNodes(prev => {
            const next = new Set(prev);
            next.add(nodeIdStr);
            return next;
          });

          Promise.resolve(onMoreClick(nodeObj, exclusionList, 'more')).finally(() => {
            setLoadingNodes(prev => {
              const next = new Set(prev);
              next.delete(nodeIdStr);
              return next;
            });
          });
          
          // Mark the node as expanded so that it shows the minus symbol (crestBadge)
          openedNodeIdsRef.current.add(String(nodeId));
          setOpenedNodeIds(prev => {
            const next = new Set(prev);
            next.add(String(nodeId));
            return next;
          });
        } else {
          console.warn('[EntityGraph] Cannot trigger onMoreClick: nodeObj is undefined for', nodeId);
        }
      }
      setPaginationLimits(prev => ({
        ...prev,
        [nodeId]: current + step
      }));
    } else {
      // Handle "Less" (pagination) or Collapse
      if (current > defaultLimit) {
        // Regular "Less" functionality: reduce the pagination limit by one step
        const nextLimit = Math.max(defaultLimit, current - step);
        setPaginationLimits(prev => ({
          ...prev,
          [nodeId]: nextLimit
        }));
      } else {
        // Collapse functionality: close the entire branch
        if (onMoreClick && nodeObj) {
          try {
            onMoreClick(nodeObj, [], 'less');
          } catch (err) {
            console.warn('[EntityGraph] onMoreClick (less) handler threw:', err);
          }
        }
        openedNodeIdsRef.current.delete(String(nodeId));
        setOpenedNodeIds(prevSet => {
          const nextSet = new Set(prevSet);
          nextSet.delete(String(nodeId));
          return nextSet;
        });
        
        // Reset limit to 0 (default)
        setPaginationLimits(prev => ({
          ...prev,
          [nodeId]: 0
        }));
      }
    }

    // Nudge the simulation to show/hide nodes immediately
    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.d3ReheatSimulation();
      }
    }, 10);
  }, [graphData.nodes, graphData.links, extraLinks, onMoreClick, degreeNameToRank, paginationLimits, loadingNodes]);

  // Use a modified click handler for the graph to detect "More"/"Less" button clicks
  const onNodeClickInternal = useCallback((node: any, event: MouseEvent) => {
    // Check if the click was on a pagination button
    if (containerRef.current && graphRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        const { x: graphX, y: graphY } = graphRef.current.screen2GraphCoords ? 
          graphRef.current.screen2GraphCoords(clickX, clickY) : { x: 0, y: 0 };
        
        const relativeX = graphX - (node.x || 0);
        const relativeY = graphY - (node.y || 0);
        const buffer = 6; // Buffer in graph units

        // Check More button
        const morePos = paginationButtonPositionsRef.current[`${node.id}_more`];
        if (morePos) {
          if (relativeX >= morePos.x - buffer && relativeX <= morePos.x + morePos.width + buffer &&
              relativeY >= morePos.y - buffer && relativeY <= morePos.y + morePos.height + buffer) {
            console.log('[EntityGraph] "More" button CLICKED for node:', node.id);
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            handlePaginationClick(String(node.id), 'more');
            return;
          }
        }

        // Check Less button
        const lessPos = paginationButtonPositionsRef.current[`${node.id}_less`];
        if (lessPos) {
          if (relativeX >= lessPos.x - buffer && relativeX <= lessPos.x + lessPos.width + buffer &&
              relativeY >= lessPos.y - buffer && relativeY <= lessPos.y + lessPos.height + buffer) {
            console.log('[EntityGraph] "Less" button CLICKED for node:', node.id);
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            handlePaginationClick(String(node.id), 'less');
            return;
          }
        }
      }
    }
    
    // Fall back to existing handleGraphNodeClick
    handleGraphNodeClick(node, event);
  }, [handleGraphNodeClick, handlePaginationClick]);

  return (
    <div className="space-y-4 h-full w-full">
      {/* Filters and Custom Controls - hidden in fullscreen mode */}
      {/* items-start, not items-center: the filter block is several rows tall, and
          centring pushes the action buttons down beside the middle row. Top-aligning
          puts Delete Nodes / Reset Graph level with the Degree row. */}
      {!fullscreen && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-1 items-center gap-4 flex-wrap">
            {filterGroups && (
              <EntityGraphFilter
                filterGroups={filterGroups}
                filterState={filterState}
                setFilterState={setFilterState}
                showFilterToggle={showFilterToggle}
                data={data}
                onFilterChange={onFilterChange}
                resetKey={resetKey}
                hideSecondaryFilters={hideSecondaryFilters}

                hideQuaternaryFilters={hideQuaternaryFilters}
                pruneLowDegreeNodes={pruneLowDegreeNodes}
              />
            )}
            {/* Custom Controls (e.g. Hide Non-Branching Nodes Toggle) */}
            {children && children}
          </div>
          {/* Right-side Elements (e.g. Reset Button) */}
          {rightElement && rightElement}
        </div>
      )}

      {/* Entity Graph: in fullscreen mode use full height, otherwise 70%/30% split with fixed height */}
      <div className={fullscreen ? 'flex gap-4 h-full w-full' : 'flex gap-4 h-[600px] w-full'}>
        <div
          ref={containerRef}
          className={fullscreen ? "relative h-full flex-1 min-w-0 bg-white rounded-none border-0 shadow-none overflow-hidden" : "relative h-full flex-[0_0_70%] min-w-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"}
        >
          {/* Loading/Error Overlay */}
          {(isLoading || error) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-95 rounded-lg">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Loading graph data...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-red-500 text-center">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="#ffffff"
            nodeColor={(node: any) => {
              // Degree-based color mapping for node background (falls back to node.fill)
              const degreeToColor = (d: any) => {
                if (!d && d !== 0) return null;
                const map: Record<string, string> = {
                  first: '#1e40af', // dark
                  second: '#1e40af',
                  third: '#3b82f6', // mid
                  fourth: '#3b82f6',
                  fifth: '#93c5fd', // light
                  sixth: '#93c5fd'
                };
                if (typeof d === 'number') {
                  if (d <= 2) return '#1e40af';
                  if (d <= 4) return '#3b82f6';
                  return '#93c5fd';
                }
                if (typeof d === 'string') return map[d.toLowerCase()] || null;
                return null;
              };

              const degColor = degreeToColor(node.degree);
              const fill = degColor || node.fill;
              if (highlightNodes.size === 0) return fill;
              return highlightNodes.has(String(node.id)) ? fill : 'rgba(100, 116, 139, 0.3)';
            }}
            nodeRelSize={3}
            nodeVal={(node) => {
              // Halved from 40/30 — at the previous size a small network filled
              // the canvas and a single node looked enormous.
              return node.type?.toLowerCase().includes('customer') || node.type?.toLowerCase().includes('person') ? 20 : 15;
            }}
            linkWidth={(link) => {
              const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target?.id : link.target;
              const linkId = `${sourceId}-${targetId}`;
              if (highlightLinks.size === 0) return 1;
              return highlightLinks.has(linkId) ? 2 : 0.5;
            }}
            linkColor={(link: any) => {
              // Restore gray link colors (no degree-based coloring)
              const defaultColor = 'rgba(148, 163, 184, 0.4)';
              const highlightedColor = 'rgba(100, 116, 139, 0.6)';
              const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target?.id : link.target;
              const linkId = `${sourceId}-${targetId}`;
              if (highlightLinks.size === 0) return defaultColor;
              return highlightLinks.has(linkId) ? highlightedColor : 'rgba(148, 163, 184, 0.15)';
            }}
            linkDirectionalArrowLength={0}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={1}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.004}
            linkCurvature={0.15}
            onNodeRightClick={(node: any) => {
              const nodeIdStr = String(node.id);
              const alreadyOpened = openedNodeIdsRef.current.has(nodeIdStr);

              const nodeRank = degreeNameToRank(node.degree);
              const hasVisibleChildren = graphData.links && graphData.links.some((link: any) => {
                const s = typeof link.source === 'object' ? String(link.source?.id) : String(link.source);
                const t = typeof link.target === 'object' ? String(link.target?.id) : String(link.target);
                
                if (s === nodeIdStr) {
                  const targetNode = graphData.nodes?.find((n: any) => String(n.id) === String(t));
                  const targetRank = targetNode ? degreeNameToRank(targetNode.degree) : 0;
                  return targetRank > nodeRank;
                }
                if (t === nodeIdStr) {
                  const sourceNode = graphData.nodes?.find((n: any) => String(n.id) === String(s));
                  const sourceRank = sourceNode ? degreeNameToRank(sourceNode.degree) : 0;
                  return sourceRank > nodeRank;
                }
                return false;
              });

              const isCollapsed = collapsedNodes.has(nodeIdStr);

              if (alreadyOpened || (hasVisibleChildren && !isCollapsed)) {
                console.log('[EntityGraph] Collapsing node via right click:', nodeIdStr);
                
                if (alreadyOpened) {
                  openedNodeIdsRef.current.delete(nodeIdStr);
                  setOpenedNodeIds(prev => {
                    const next = new Set(prev);
                    next.delete(nodeIdStr);
                    return next;
                  });
                }

                // Collapse static branches as well
                if (hasVisibleChildren && !isCollapsed) {
                  setCollapsedNodes(prev => new Set(prev).add(nodeIdStr));
                }

                // Clear pagination limit overrides on collapse so it doesn't force render 'More' 
                setPaginationLimits(prev => {
                  const next = { ...prev };
                  delete next[nodeIdStr];
                  return next;
                });

                return; // skip calling expand API again
              }

              // Handle Expand Toggle path
              if (isCollapsed) {
                 // De-collapse if it was explicitly collapsed
                 setCollapsedNodes(prev => {
                   const next = new Set(prev);
                   next.delete(nodeIdStr);
                   return next;
                 });
              }

              // Clear node's pagination limit override to restore previous visibility on expand re-trigger 
              setPaginationLimits(prev => {
                const next = { ...prev };
                delete next[nodeIdStr];
                return next;
              });

              openedNodeIdsRef.current.add(nodeIdStr);
              setOpenedNodeIds(prev => {
                const next = new Set(prev);
                next.add(nodeIdStr);
                return next;
              });

              if (onMoreClick) {
                const adjacentNodeIds = new Set<string>();
                const allKnownLinks = [...(graphData.links || []), ...(extraLinks || [])];
                allKnownLinks.forEach((link: any) => {
                  const s = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
                  const t = typeof link.target === 'object' ? String(link.target.id) : String(link.target);
                  if (s === nodeIdStr) adjacentNodeIds.add(t);
                  if (t === nodeIdStr) adjacentNodeIds.add(s);
                });
                const exclusionList = Array.from(adjacentNodeIds);
                console.log('[EntityGraph] Right-click expansion on node:', node.id, 'with exclusion:', exclusionList);
                onMoreClick(node, exclusionList, 'right-click');
              }
            }}
            onNodeClick={onNodeClickInternal}
            onNodeHover={handleNodeHover}
            // Safety net for node selection.
            //
            // force-graph only fires onNodeClick when its internal hit map
            // resolves the pointer to a node. When that map is wrong, the click
            // falls through here as a "background" click and the node silently
            // does nothing. Rather than depend on that map, resolve the nearest
            // node geometrically: if the pointer is within a node's radius,
            // treat it as a click on that node.
            onBackgroundClick={(event: any) => {
              try {
                const g = graphRef.current;
                if (!g?.screen2GraphCoords) return;
                const canvas = containerRef.current?.querySelector('canvas');
                const rect = canvas?.getBoundingClientRect();
                const px = rect ? event.clientX - rect.left : event.offsetX;
                const py = rect ? event.clientY - rect.top : event.offsetY;
                const { x, y } = g.screen2GraphCoords(px, py);

                let best: any = null;
                let bestDist = Infinity;
                for (const n of graphData.nodes) {
                  if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
                  const d = Math.hypot(n.x - x, n.y - y);
                  if (d < bestDist) { bestDist = d; best = n; }
                }

                const isCustomer = String(best?.type || '').toLowerCase().includes('customer')
                  || String(best?.type || '').toLowerCase().includes('person');
                const hitRadius = (isCustomer ? ICON_SIZE_CUSTOMER : ICON_SIZE_DEFAULT) + 10;

                if (best && bestDist <= hitRadius) {
                  handleNodeClick(best, event);
                } else {
                  // A genuine background click — clear the selection.
                  handleNodeClick(null as any, event);
                }
              } catch {
                /* never let the fallback break normal canvas interaction */
              }
            }}
            onNodeDrag={(node: any) => {
              if (!node || !graphRef.current) return;

              // Initialize dragging start state if this is a new drag
              if (draggingNodeId.current !== String(node.id)) {
                draggingNodeId.current = String(node.id);
                dragPrevPos.current.set(String(node.id), { x: node.x ?? 0, y: node.y ?? 0 });
              }

              const prev = dragPrevPos.current.get(String(node.id)) || { x: node.x ?? 0, y: node.y ?? 0 };
              const dx = (node.x ?? 0) - prev.x;
              const dy = (node.y ?? 0) - prev.y;

              // Update stored previous position
              dragPrevPos.current.set(String(node.id), { x: node.x ?? 0, y: node.y ?? 0 });

              // Standard drag behavior handles physics updates smoothly.
            }}
            onZoomEnd={handleZoomEnd}
            cooldownTicks={120 }
            enableNodeDrag={true}
            onNodeDragEnd={(node: any) => {
              // Lock the node in place
              node.fx = node.x;
              node.fy = node.y;
              
              // When drag ends, clear drag tracking state for this node
              try {
                dragPrevPos.current.delete(String(node.id));
                draggingNodeId.current = null;
              } catch (e) {
                // ignore
              }

              // Persist node positions to store when any node is dragged
              if (customerId && graphRef.current) {
                // Prefer the live simulation nodes if available so we capture the positions we just updated
                const live = graphRef.current.graphData ? graphRef.current.graphData() : null;
                const nodesToPersist = live?.nodes || graphData.nodes;
                const positions = nodesToPersist.map((n: any) => ({
                  id: n.id,
                  x: n.x ?? 0,
                  y: n.y ?? 0,
                  fx: n.fx,
                  fy: n.fy
                }));
                setNodePositions(customerId, positions);
                console.log('[EntityGraph] Saved node positions after drag for customer:', customerId);
              }
            }}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            d3VelocityDecay={0.5}
            d3AlphaDecay={0.01}
            d3AlphaMin={0.001}
            warmupTicks={20}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              const isCustomer = String(node.type || '').toLowerCase().includes('customer') || String(node.type || '').toLowerCase().includes('person');
              const nodeSize = isCustomer ? ICON_SIZE_CUSTOMER : ICON_SIZE_DEFAULT;
              const radius = nodeSize + 8; // Larger hit area for the main node
              
              // Paint the node's own hit area FIRST and unconditionally, so a
              // node is always selectable even if the pagination maths below
              // cannot be computed for it.
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI);
              ctx.fill();

              // Everything below only ADDS the +/- badges to the hit box. It is
              // wrapped because this pass builds the hit map for the whole
              // graph: one throw here and every node painted after this one
              // silently loses hover and click. That is why some nodes
              // responded and others (the parent included) did not.
              try {
              // Include pagination icons (+ and -) in the hit box
              const apiBranchCount = node.branchCount ?? node.properties?.branchCount ?? node.properties?.branch_count ?? 0;
              const nodeIdStr = String(node.id);
              const isExpanded = openedNodeIds.has(nodeIdStr);
              const hasMore = node.totalConnections > node.currentLimit || (isExpanded && apiBranchCount > node.totalConnections);
              const _paginationNodeRank = (typeof node.degree === 'number' ? node.degree : (node.numericDegree !== undefined ? Number(node.numericDegree) : (degreeNameToRank(node.degree) || 0)));
              const nodeDefaultLimit = getLimitByDegree(_paginationNodeRank);
              const hasLess = paginationLimits[nodeIdStr] !== undefined && paginationLimits[nodeIdStr] > nodeDefaultLimit;

              // Check for initial API branches or unseen linkages
              const rawHasBranches = node.hasBranches ?? node.properties?.hasBranches ?? node.properties?.has_branches;
              const apiHasBranches = (() => {
                if (rawHasBranches === true) return true;
                if (typeof rawHasBranches === 'number') return rawHasBranches > 0;
                if (typeof rawHasBranches === 'string') {
                  const s = rawHasBranches.trim().toLowerCase();
                  return s === 'true' || s === '1';
                }
                return false;
              })();
              const expandedExtraNodeIds = new Set((extraLinks || []).map((l: any) => String(l.expandedFrom)));
              const hasAPIChildrenWaiting = apiHasBranches && Number(apiBranchCount) > (node.totalConnections || 0) && !openedNodeIds.has(nodeIdStr) && !expandedExtraNodeIds.has(nodeIdStr);

              const showPlus = hasMore || hasAPIChildrenWaiting;
              const showMinus = hasLess || isExpanded;
              const isLoadingNode = loadingNodes.has(nodeIdStr);

              if ((showPlus || showMinus) && !isLoadingNode) {
                const badgeRadius = 6;
                const bottomOffset = nodeSize + 10;
                const hitBuffer = 4; // Extra padding to ensure the whole circle is clickable
                const gap = 4;
                
                let totalHitWidth = badgeRadius * 2;
                if (showPlus && showMinus) {
                  totalHitWidth = (badgeRadius * 2) * 2 + gap;
                }

                ctx.beginPath();
                // Draw a rectangle that covers the icons below the node
                ctx.rect(
                  node.x - (totalHitWidth / 2) - hitBuffer,
                  node.y + bottomOffset - badgeRadius - hitBuffer,
                  totalHitWidth + (hitBuffer * 2),
                  (badgeRadius * 2) + (hitBuffer * 2)
                );
                ctx.fill();
              }
              } catch (err) {
                // Badge hit box only — the node itself is already clickable.
                console.warn('[EntityGraph] pagination hit-box skipped for node', node?.id, err);
              }
            }}
            nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
              // Draw lucide icon-like representation based on node type and node degree (to color icons by linkage order)
              const iconConfig = getNodeIconConfig(node.type, node.degree);
              const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(String(node.id));
              const isHovered = hoveredNode?.id === node.id;

              if (node.x === undefined || node.y === undefined) return;

              const isCustomer = node.type?.toLowerCase().includes('customer') || node.type?.toLowerCase().includes('person');
              const isMainCustomer = isCustomer && node.id === firstCustomerNodeId;
              const nodeSize = isCustomer ? ICON_SIZE_CUSTOMER : ICON_SIZE_DEFAULT;

              // Precompute API-provided hasBranches so we can still render a minimal '+' even at low LOD
              const _rawHasBranches = node.hasBranches ?? node.properties?.hasBranches ?? node.properties?.has_branches;
              
              // AUTOMATIC DEAD-END CHECK:
              // If nodes of HIGHER degree exist on the canvas, check if this node has any links descending downwards to them.
              // If not, it means the node has 0 branches going to the next degree layer in the loaded dataset packet.
              const _deadEndNodeRank = (typeof node.degree === 'number' ? node.degree : (node.numericDegree !== undefined ? Number(node.numericDegree) : (degreeNameToRank(node.degree) || 0)));
              
              let _hasDownwardLinks = true;
              let _hasHigherDegreeNodes = false;
              if (graphData && graphData.nodes && graphData.links) {
                _hasHigherDegreeNodes = (graphData.nodes || []).some((n: any) => {
                  const r = (typeof n.degree === 'number' ? n.degree : (n.numericDegree !== undefined ? Number(n.numericDegree) : (degreeNameToRank(n.degree) || 0)));
                  return r > _deadEndNodeRank;
                });
                
                if (_hasHigherDegreeNodes) {
                  _hasDownwardLinks = (graphData.links || []).some((l: any) => {
                    const s = typeof l.source === 'object' ? String(l.source.id) : String(l.source);
                    const t = typeof l.target === 'object' ? String(l.target.id) : String(l.target);
                    const nodeIdStr = String(node.id);
                    if (s !== nodeIdStr && t !== nodeIdStr) return false;
                    
                    const otherId = s === nodeIdStr ? t : s;
                    const otherNode = (graphData.nodes || []).find((n: any) => String(n.id) === otherId);
                    if (!otherNode) return false;
                    
                    const otherRank = (typeof otherNode.degree === 'number' ? otherNode.degree : (otherNode.numericDegree !== undefined ? Number(otherNode.numericDegree) : (degreeNameToRank(otherNode.degree) || 0)));
                    return otherRank > _deadEndNodeRank;
                  });
                }
              }

              const _apiHasBranches = (() => {
                if (_rawHasBranches === true) return true;
                if (typeof _rawHasBranches === 'number') return _rawHasBranches > 0;
                if (typeof _rawHasBranches === 'string') {
                  const s = _rawHasBranches.trim().toLowerCase();
                  if (s === 'true' || s === '1') return true;
                  return false;
                }
                return false;
              })();

              // === LOD Optimization: Skip heavy rendering when zoomed out ===
              // Only draw simple dots when extremely zoomed out
              if (globalScale < 0.15) {
                const bgRadius = nodeSize;
                ctx.beginPath();
                ctx.arc(node.x, node.y, bgRadius, 0, 2 * Math.PI);
                
                if (isCustomer) {
                  const riskIndicator = getCustomerRiskIndicator(node);
                  const riskColorName = getRiskColor(riskIndicator);
                  ctx.fillStyle = getRiskColorHexForIcon(riskColorName);
                } else {
                  ctx.fillStyle = iconConfig.color || '#94a3b8';
                }
                
                ctx.globalAlpha = isHighlighted ? 1 : 0.4;
                ctx.fill();
                ctx.globalAlpha = 1;
                const isOpenedLOD = openedNodeIds.has(String(node.id)) || (_hasHigherDegreeNodes && _hasDownwardLinks);

                // Use branch count (when provided) to avoid showing a '+' when API flag is present but there are no branches.
                const _apiBranchCount = node.branchCount ?? node.properties?.branchCount ?? node.properties?.branch_count ?? 0;

                // If node was expanded but no expanded links were actually added, treat it as a dead-end and don't show the badge
                const _nodeIdStr = String(node.id);
                const _expandedLinksForNode = expandedNodeLinks.get(_nodeIdStr) || new Set<string>();
                const _isOpenedButEmpty = openedNodeIds.has(_nodeIdStr) && _expandedLinksForNode.size === 0 && !(extraLinks || []).some((l: any) => String(l.expandedFrom) === _nodeIdStr);

                // Determine whether there are any unseen/further links for this node
                const _unseenCount = unseenDownwardCountsByNode.get(_nodeIdStr) || 0;

                // If there are unseen links in fullData, or the API explicitly reports a positive branchCount,
                // or the node is opened and actually has expanded links, draw the minimal badge.
                if (isCustomer ? isOpenedLOD : (_unseenCount > 0 || (_apiHasBranches && Number(_apiBranchCount) > 0) || (isOpenedLOD && _expandedLinksForNode.size > 0))) {
                  try {
                    const bx = node.x;
                    const by = node.y + (nodeSize + 6);
                    const badgeColor = isOpenedLOD ? '#ef4444' : '#10b981'; // red-500 for minus, green-500 for plus
                    ctx.save();
                    ctx.beginPath();
                    ctx.fillStyle = '#ffffff';
                    ctx.arc(bx, by, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = badgeColor;
                    ctx.lineWidth = 1.2 / Math.max(1, globalScale);
                    ctx.stroke();
                    // draw small plus or minus
                    ctx.beginPath();
                    ctx.strokeStyle = badgeColor;
                    ctx.lineWidth = 1.2 / Math.max(1, globalScale);
                    ctx.moveTo(bx - 3, by);
                    ctx.lineTo(bx + 3, by);
                    
                    if (!isOpenedLOD) {
                      ctx.moveTo(bx, by - 3);
                      ctx.lineTo(bx, by + 3);
                    }
                    ctx.stroke();
                    ctx.restore();
                  } catch (e) {
                    // ignore
                  }
                }
                return; // Early return prevents text, borders, SVG drawing, and badges
              }
              // === End LOD ===

              // Draw white background circle to cover any edge overlays (only for attribute nodes)
              // Customer nodes don't need this as they have their own background
              if (!isCustomer) {
                const backgroundRadius = nodeSize + 6; // Extra padding to cover edge strokes
                ctx.beginPath();
                ctx.arc(node.x, node.y, backgroundRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1;
                ctx.fill();
              }

              // Draw outline circle for CUSTOMER nodes
              if (isCustomer) {
                const bgRadius = nodeSize + 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, bgRadius, 0, 2 * Math.PI);
                
                // Determine fill and stroke color based on risk level
                let fillColor: string;
                let strokeColor: string;
                
                // Get risk indicator for customer node
                const riskIndicator = getCustomerRiskIndicator(node);
                const riskColorName = getRiskColor(riskIndicator);
                const riskColorHex = getRiskColorHexForIcon(riskColorName);
                
                // Use risk-based color for background circle
                fillColor = riskColorHex;
                strokeColor = riskColorHex;
                
                // Fill background with risk-based color
                ctx.fillStyle = fillColor;
                ctx.globalAlpha = 0.8; // Slightly opaque fill
                ctx.fill();

                ctx.strokeStyle = strokeColor;
                ctx.globalAlpha = 1;
                ctx.lineWidth = 2 / globalScale;
                
                // Set line pattern: solid for main customer, dotted for others
                if (!isMainCustomer && ctx.setLineDash) {
                  ctx.setLineDash([4 / globalScale, 3 / globalScale]); // Dotted pattern: 4px dash, 3px gap
                }
                
                if (isHovered) {
                  ctx.globalAlpha = 1;
                  ctx.lineWidth = 2.5 / globalScale;
                  ctx.stroke();
                } else if (isHighlighted) {
                  ctx.globalAlpha = 0.8;
                  ctx.stroke();
                } else {
                  ctx.globalAlpha = 0.6;
                  ctx.stroke();
                }
                
                // Reset line dash pattern
                if (ctx.setLineDash) {
                  ctx.setLineDash([]);
                }
                
                ctx.globalAlpha = 1;
              }

              // Draw SVG icon from cache
              // Icon color is white for customer nodes, default icon color for others
              const iconColor = isCustomer ? '#ffffff' : iconConfig.color;
              const cacheKey = `${iconConfig.iconType}-${iconColor}`;
              const iconImage = iconImageCache[cacheKey];
              
              // Draw icon if available and loaded
              if (iconImage && iconImage.complete) {
                // Check if image has valid dimensions
                const hasDimensions = (iconImage.naturalWidth > 0 || iconImage.width > 0) && 
                                     (iconImage.naturalHeight > 0 || iconImage.height > 0);
                
                if (hasDimensions) {
                  // Base draw multiplier (keeps existing sizing for customer nodes)
                  const BASE_ICON_DRAW_MULT = 1.5;
                  // Make non-customer icons larger by applying NON_CUSTOMER_DRAW_SCALE
                  const iconDrawSize = isCustomer ? nodeSize * BASE_ICON_DRAW_MULT : nodeSize * BASE_ICON_DRAW_MULT * NON_CUSTOMER_DRAW_SCALE;
                  try {
                    // Draw icon with full opacity on top of background
                    ctx.save();
                    ctx.globalAlpha = 1;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(
                      iconImage,
                      node.x - iconDrawSize / 2,
                      node.y - iconDrawSize / 2,
                      iconDrawSize,
                      iconDrawSize
                    );
                    ctx.restore();
                  } catch (error) {
                    console.error('Failed to draw icon:', error, { 
                      cacheKey, 
                      iconType: iconConfig.iconType,
                      nodeId: node.id
                    });
                  }
                }
              }

              ctx.globalAlpha = 1;

              // Draw branch count badge (small bubble at top-right)
              // Only show the badge when branchCount is greater than one.
              {

                // Get branchCount from node data
                let branchCount = node.branchCount ?? node.properties?.branchCount ?? node.properties?.branch_count ?? null;

                // Only display badge when numeric branchCount > 1
                const numericCount = branchCount !== null && branchCount !== undefined ? Number(branchCount) : null;
                const shouldShowBadge = !isCustomer && numericCount !== null && !isNaN(numericCount) && numericCount > 1 && globalScale >= 0.4;

                if (shouldShowBadge) {
                  const displayValue = String(numericCount);

                  // Badge sizing and position (relative to node size)
                  const badgeRadius = 4;
                  const offset = (nodeSize + 2) * 0.75;
                  const bx = node.x + offset;
                  const by = node.y - offset;

                  // Get badge color from icon config (same as node icon)
                  const badgeColor = iconConfig.color;

                  // Ensure globalAlpha is 1 before drawing
                  ctx.save();
                  ctx.globalAlpha = 1;

                  // Draw badge background (white) with border color matching node icon
                  ctx.beginPath();
                  ctx.arc(bx, by, badgeRadius, 0, 2 * Math.PI);
                  ctx.fillStyle = '#ffffff';
                  ctx.globalAlpha = 1;
                  ctx.fill();
                  
                  ctx.strokeStyle = badgeColor;
                  ctx.lineWidth = 1.7 / Math.max(1, globalScale);
                  ctx.globalAlpha = 1;
                  ctx.stroke();

                  // Draw branch count text inside badge (same color as node icon)
                  ctx.fillStyle = badgeColor;
                  ctx.globalAlpha = 1;
                  const badgeFontSize = 4;
                  ctx.font = `700 ${badgeFontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(displayValue, bx, by);

                  ctx.restore();
                }
              }


              // Draw delete mode checkbox at top-left (only for non-customer nodes when in delete mode)
              if (isDeleteMode && !isCustomer) {
                const checkboxRadius = 4.5;
                const checkboxOffset = (nodeSize + 2) * 0.75;
                const cbx = node.x - checkboxOffset;
                const cby = node.y - checkboxOffset;
                
                // Store checkbox position for click detection
                checkboxPositionsRef.current[String(node.id)] = {
                  x: cbx,
                  y: cby,
                  radius: checkboxRadius
                };
                
                const isSelectedForDeletion = selectedForDeletion && selectedForDeletion.includes(String(node.id));
                
                ctx.save();
                ctx.globalAlpha = 1;
                
                // Draw checkbox background
                ctx.beginPath();
                ctx.arc(cbx, cby, checkboxRadius, 0, 2 * Math.PI);
                if (isSelectedForDeletion) {
                  // Red background for selected nodes
                  ctx.fillStyle = '#ef4444';
                } else {
                  // White background for unselected nodes
                  ctx.fillStyle = '#ffffff';
                }
                ctx.fill();
                
                // Draw checkbox border
                ctx.strokeStyle = isSelectedForDeletion ? '#dc2626' : '#9ca3af'; // Darker red if selected, gray if not
                ctx.lineWidth = 1.5 / Math.max(1, globalScale);
                ctx.stroke();
                
                // Draw minus sign if selected for deletion
                if (isSelectedForDeletion) {
                  ctx.strokeStyle = '#ffffff'; // White minus sign
                  ctx.lineWidth = 1.2 / Math.max(1, globalScale);
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  
                  // Draw minus line (horizontal)
                  ctx.beginPath();
                  const minusOffset = checkboxRadius * 0.5;
                  ctx.moveTo(cbx - minusOffset, cby);
                  ctx.lineTo(cbx + minusOffset, cby);
                  ctx.stroke();
                }
                
                ctx.restore();
              }

              // Draw pagination icons (+ and -) instead of "More"/"Less" pills
              const apiBranchCount = node.branchCount ?? node.properties?.branchCount ?? node.properties?.branch_count ?? 0;
              const nodeIdStr = String(node.id);
              const isExpanded = openedNodeIds.has(nodeIdStr);
              const hasMore = node.totalConnections > node.currentLimit || (isExpanded && apiBranchCount > node.totalConnections);
              const _paginationNodeRank = (typeof node.degree === 'number' ? node.degree : (node.numericDegree !== undefined ? Number(node.numericDegree) : (degreeNameToRank(node.degree) || 0)));
              const nodeDefaultLimit = getLimitByDegree(_paginationNodeRank);
              const hasLess = paginationLimits[nodeIdStr] !== undefined && paginationLimits[nodeIdStr] > nodeDefaultLimit;

              // Check for initial API branches or unseen linkages
              const rawHasBranches = node.hasBranches ?? node.properties?.hasBranches ?? node.properties?.has_branches;
              const apiHasBranches = (() => {
                if (rawHasBranches === true) return true;
                if (typeof rawHasBranches === 'number') return rawHasBranches > 0;
                if (typeof rawHasBranches === 'string') {
                  const s = rawHasBranches.trim().toLowerCase();
                  return s === 'true' || s === '1';
                }
                return false;
              })();
              const expandedExtraNodeIds = new Set((extraLinks || []).map((l: any) => String(l.expandedFrom)));
              const hasAPIChildrenWaiting = apiHasBranches && Number(apiBranchCount) > (node.totalConnections || 0) && !openedNodeIds.has(nodeIdStr) && !expandedExtraNodeIds.has(nodeIdStr);

              const showPlus = hasMore || hasAPIChildrenWaiting;
              const showMinus = hasLess || isExpanded;

              const isLoadingNode = loadingNodes.has(nodeIdStr);

              if ((showPlus || showMinus || isLoadingNode) && globalScale >= 0.4) {
                const badgeRadius = 6;
                const bottomOffset = nodeSize + 10;
                const gap = 4;

                ctx.save();
                ctx.globalAlpha = 1;

                if (isLoadingNode) {
                  // Draw single spinner loader at the center position below the node
                  const x = node.x;
                  const y = node.y + bottomOffset;

                  // Clear any stored hit boxes for pagination click detection while loading
                  delete paginationButtonPositionsRef.current[`${node.id}_more`];
                  delete paginationButtonPositionsRef.current[`${node.id}_less`];

                  // Draw loader background
                  ctx.beginPath();
                  ctx.arc(x, y, badgeRadius, 0, 2 * Math.PI);
                  ctx.fillStyle = '#ffffff';
                  ctx.fill();

                  // Draw border/circle in gray
                  ctx.beginPath();
                  ctx.arc(x, y, badgeRadius, 0, 2 * Math.PI);
                  ctx.strokeStyle = '#e2e8f0';
                  ctx.lineWidth = 1.6 / Math.max(1, globalScale);
                  ctx.stroke();

                  // Draw spinning arc
                  const rotationAngle = (Date.now() / 200) % (2 * Math.PI);
                  ctx.beginPath();
                  ctx.arc(x, y, badgeRadius * 0.6, rotationAngle, rotationAngle + Math.PI * 0.7);
                  ctx.strokeStyle = '#3b82f6'; // Blue spinner
                  ctx.lineWidth = 2.0 / Math.max(1, globalScale);
                  ctx.lineCap = 'round';
                  ctx.stroke();
                } else {
                  const drawBadge = (xPosRelative: number, type: 'more' | 'less') => {
                    const x = node.x + xPosRelative;
                    const y = node.y + bottomOffset;
                    
                    // Store position for click detection in onNodeClickInternal (top-left relative to node)
                    paginationButtonPositionsRef.current[`${node.id}_${type}`] = {
                      x: xPosRelative - badgeRadius,
                      y: bottomOffset - badgeRadius,
                      width: badgeRadius * 2,
                      height: badgeRadius * 2
                    };

                    // Draw badge background
                    ctx.beginPath();
                    ctx.arc(x, y, badgeRadius, 0, 2 * Math.PI);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();

                    // Draw border
                    const badgeColor = type === 'less' ? '#ef4444' : '#10b981';
                    ctx.strokeStyle = badgeColor;
                    ctx.lineWidth = 1.6 / Math.max(1, globalScale);
                    ctx.stroke();

                    // Draw "+" or "-" icon
                    ctx.beginPath();
                    ctx.strokeStyle = badgeColor;
                    ctx.lineWidth = 1.6 / Math.max(1, globalScale);
                    ctx.lineCap = 'round';
                    const len = badgeRadius * 0.6;
                    // Horizontal line
                    ctx.moveTo(x - len, y);
                    ctx.lineTo(x + len, y);
                    // Vertical line (for "+" only)
                    if (type === 'more') {
                      ctx.moveTo(x, y - len);
                      ctx.lineTo(x, y + len);
                    }
                    ctx.stroke();
                  };

                  if (showPlus && showMinus) {
                    // Both icons: Minus on left, Plus on right
                    drawBadge(-(badgeRadius + gap/2), 'less');
                    drawBadge(+(badgeRadius + gap/2), 'more');
                  } else if (showPlus) {
                    drawBadge(0, 'more');
                    delete paginationButtonPositionsRef.current[`${node.id}_less`];
                  } else if (showMinus) {
                    drawBadge(0, 'less');
                    delete paginationButtonPositionsRef.current[`${node.id}_more`];
                  }
                }

                ctx.restore();
              } else {
                // Clear positions if not showing
                delete paginationButtonPositionsRef.current[`${node.id}_more`];
                delete paginationButtonPositionsRef.current[`${node.id}_less`];
              }


              // Draw degree connection label for customer nodes (only when clicked/labeled)
              // Initialize degree text and color variables
              let degreeText = '';
              let degreeBgColor = '#dcfce7'; // Light green background
              let degreeBorderColor = '#86efac'; // Green border
              let degreeTextColor = '#16a34a'; // Green text
              
              if (isCustomer && (labeledNodes.has(String(node.id)) || isMainCustomer)) {
                // Use degreeToHighRiskCustomer from node properties if available
                const degreeToHighRiskCustomer = node.properties?.degreeToHighRiskCustomer;
                
                // Helper to convert degree to ordinal (first -> 1st, second -> 2nd, etc.)
                const convertDegreeToOrdinalLocal = (degree: number | string | undefined): string => {
                  if (degree === undefined || degree === null) return '';
                  
                  const degreeLower = String(degree).toLowerCase().trim();
                  
                  // Handle ordinal names
                  if (degreeLower.includes('first')) return '1st';
                  if (degreeLower.includes('second')) return '2nd';
                  if (degreeLower.includes('third')) return '3rd';
                  if (degreeLower.includes('fourth')) return '4th';
                  if (degreeLower.includes('fifth')) return '5th';
                  if (degreeLower.includes('sixth')) return '6th';
                  
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
                  
                  return String(degree); // Return original if no match
                };
                
                // Determine degree text and colors based on degreeToHighRiskCustomer
                if (degreeToHighRiskCustomer !== undefined && degreeToHighRiskCustomer !== null) {
                  const ordinalDegree = convertDegreeToOrdinalLocal(degreeToHighRiskCustomer);
                  degreeText = `${ordinalDegree} Deg To High Risk`;
                  
                  // Color scheme based on degree: red for 1st, orange for 2nd, yellow for 3rd, etc.
                  const degreeRank = Number(degreeToHighRiskCustomer);
                  
                  if (degreeRank === 1) {
                    // 1st degree - Red
                    degreeTextColor = '#dc2626';
                    degreeBgColor = '#fee2e2';
                    degreeBorderColor = '#fca5a5';
                  } else if (degreeRank === 2) {
                    // 2nd degree - Orange
                    degreeTextColor = '#ea580c';
                    degreeBgColor = '#fed7aa';
                    degreeBorderColor = '#fdba74';
                  } else if (degreeRank === 3) {
                    // 3rd degree - Yellow
                    degreeTextColor = '#ca8a04';
                    degreeBgColor = '#fef3c7';
                    degreeBorderColor = '#fcd34d';
                  } else if (degreeRank >= 4) {
                    // 4th+ degree - Light yellow
                    degreeTextColor = '#b45309';
                    degreeBgColor = '#fef3c7';
                    degreeBorderColor = '#fcd34d';
                  }
                } else {
                  // No degree info available. If this node itself is high-risk, mark as Defaulter;
                  // otherwise show No Connection to Defaulter.
                  const nodeRiskIndicator = getCustomerRiskIndicator(node);
                  if (nodeRiskIndicator && String(nodeRiskIndicator).toLowerCase().includes('high')) {
                    degreeText = 'Defaulter';
                    degreeTextColor = '#dc2626';
                    degreeBgColor = '#fee2e2';
                    degreeBorderColor = '#fca5a5';
                  } else {
                    degreeText = 'No Connection to Defaulter';
                    degreeTextColor = '#16a34a';
                    degreeBgColor = '#dcfce7';
                    degreeBorderColor = '#86efac';
                  }
                }
              }

              // Labels are drawn in onRenderFramePost to ensure they appear on top of all node icons
            }}
            linkCanvasObject={(link: any, ctx: any, globalScale: any) => {
              const { source, target, label } = link;
              if (typeof source !== 'object' || typeof target !== 'object') return;
              
              // Look up original link data to get source if not in link object
              const originalLink = data.find((d: any) => {
                const dSourceId = typeof d.source === 'object' ? d.source?.id : d.source;
                const dTargetId = typeof d.target === 'object' ? d.target?.id : d.target;
                return (String(dSourceId) === String(source.id) && String(dTargetId) === String(target.id)) ||
                       (String(dSourceId) === String(target.id) && String(dTargetId) === String(source.id));
              });

              let startX = source.x;
              let startY = source.y;
              let endX = target.x;
              let endY = target.y;

              if (startX === undefined || startY === undefined || endX === undefined || endY === undefined) return;

              // Calculate node radius and adjust start/end points to edge of circles
              const nodeRadius = 14; // Radius of node circles
              const dx = endX - startX;
              const dy = endY - startY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Only adjust if there's distance between nodes
              if (distance > nodeRadius * 2) {
                const unitX = dx / distance;
                const unitY = dy / distance;
                
                // Move start point to edge of source node
                startX += unitX * nodeRadius;
                startY += unitY * nodeRadius;
                
                // Move end point to edge of target node
                endX -= unitX * nodeRadius;
                endY -= unitY * nodeRadius;
              }

              // Determine if link should be highlighted
              const linkId = `${source.id}-${target.id}`;
              const isHighlighted = highlightLinks.size === 0 || highlightLinks.has(linkId);
              const opacity = isHighlighted ? 0.6 : 0.12;
              
              // === LOD Optimization: Skip heavy bezier curve mapping for links when zoomed out ===
              if (globalScale < 0.15) {
                const lodLineWidth = (isHighlighted ? 1.5 : 1) / globalScale;
                const lodColor = isHighlighted ? `rgba(100, 116, 139, ${opacity})` : `rgba(148, 163, 184, ${opacity * 0.8})`;

                ctx.strokeStyle = lodColor;
                ctx.lineWidth = lodLineWidth;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                return; // Early return prevents complex curve/arrow/source logic entirely
              }
              // === End LOD ===

              // Reduced line widths to prevent covering nodes
              const lineWidth = (isHighlighted ? 2.5 : 1.8) / globalScale;

              // Calculate control point for subtle bezier curve
              const dx_curve = endX - startX;
              const dy_curve = endY - startY;
              const distance_curve = Math.sqrt(dx_curve * dx_curve + dy_curve * dy_curve);
              const curvature = 0.15;
              const controlX = startX + dx_curve / 2 + dy_curve * curvature;
              const controlY = startY + dy_curve / 2 - dx_curve * curvature;

              // Draw main line with grayscale color (matching previous behavior)
              const grayRGBA = (alpha = 1) => `rgba(100, 116, 139, ${alpha})`;
              const grayDefaultRGBA = (alpha = 1) => `rgba(148, 163, 184, ${alpha})`;

              ctx.strokeStyle = isHighlighted ? grayRGBA(opacity) : grayDefaultRGBA(opacity * 0.8);
              ctx.lineWidth = lineWidth;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.quadraticCurveTo(controlX, controlY, endX, endY);
              ctx.stroke();
              // Draw arrow at the end of the link (at the node edge)
              const arrowSize = 3;
              const arrowAngle = Math.atan2(dy_curve, dx_curve);
              
              // Arrow point at node edge
              const arrowPointX = endX;
              const arrowPointY = endY;
              
              // Calculate arrow back point
              const arrowBackX = arrowPointX - Math.cos(arrowAngle) * arrowSize;
              const arrowBackY = arrowPointY - Math.sin(arrowAngle) * arrowSize;
              
              // Draw small arrow triangle pointing toward the node
              ctx.fillStyle = isHighlighted ? grayRGBA(opacity) : grayDefaultRGBA(opacity * 0.8);
              ctx.beginPath();
              ctx.moveTo(arrowPointX, arrowPointY);
              ctx.lineTo(arrowBackX + Math.sin(arrowAngle) * 2.5, arrowBackY - Math.cos(arrowAngle) * 2.5);
              ctx.lineTo(arrowBackX - Math.sin(arrowAngle) * 2.5, arrowBackY + Math.cos(arrowAngle) * 2.5);
              ctx.closePath();
              ctx.fill();

              // Show source label at center of link when a node is clicked
              // Also show source when hovering a node for its immediate linkages
              // Show source for ALL highlighted links when ANY node is clicked
              // OR for links directly connected to the hovered node
              const isConnectedToHovered = hoveredNode && (String(source.id) === String(hoveredNode.id) || String(target.id) === String(hoveredNode.id));
              if ((clickedNode && isHighlighted) || (isConnectedToHovered && isHighlighted)) {
                let sourceValue: any = null;
                
                // Priority: 1. Link's edgeProperties.source, 2. Original link's edgeProperties.source, 3. Connected node's properties.source
                // First try to get source from link's edgeProperties
                sourceValue = link.edgeProperties?.source;
                
                // If not found, try original link's edgeProperties
                if (!sourceValue && originalLink) {
                  sourceValue = originalLink.edgeProperties?.source || originalLink.properties?.source;
                }
                
                // If still not found, try to get from connected nodes
                if (!sourceValue) {
                  // Try both nodes - prefer target node first, then source node
                  const targetNode = link.targetNode || originalLink?.targetNode || target;
                  const sourceNode = link.sourceNode || originalLink?.sourceNode || source;
                  
                  // Get source from target node first, then source node
                  sourceValue = targetNode?.properties?.source || sourceNode?.properties?.source;
                  
                  // If still not found and we have the clicked node, try to get from the opposite node
                  if (!sourceValue && clickedNode) {
                    const clickedNodeId = String(clickedNode.id || '');
                    const sourceNodeId = String(source.id || '');
                    const targetNodeId = String(target.id || '');
                    
                    // Determine which node is clicked and get source from the other node
                    if (clickedNodeId === sourceNodeId || clickedNode.id === source.id) {
                      // Clicked node is source, get source from target node
                      sourceValue = targetNode?.properties?.source;
                    } else if (clickedNodeId === targetNodeId || clickedNode.id === target.id) {
                      // Clicked node is target, get source from source node
                      sourceValue = sourceNode?.properties?.source;
                    }
                  }
                }
                
                // If source value exists, display it at the center of the link
                // Source labels must be drawn on top of all other elements
                // Prefer pre-calculated displaySource if available (derived from data field or edge properties)
                const finalSourceLabel = link.displaySource || (sourceValue ? parseEdgeSources(null, sourceValue) : ''); // Use utils parser even for properties fallback

                // Prepare edge label (relationship name) if available (e.g., HAS_ADDRESS)
                const edgeLabelRaw = link.label || link.edgeProperties?.label || link.edgeProperties?.relationship || '';
                const edgeLabel = String(edgeLabelRaw || '').trim();
                if (finalSourceLabel) {
                  const lines: string[] = [finalSourceLabel];

                  const formattedLines = lines;

                  // Save context and ensure labels are drawn on top
                  ctx.save();
                  ctx.globalCompositeOperation = 'source-over';
                  ctx.globalAlpha = 1;

                  // Calculate center point on the bezier curve
                  const t = 0.5; // Midpoint of the curve
                  const centerX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
                  const centerY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

                  // Calculate text dimensions - use same size as node labels
                  const fontSize = 10 / globalScale;
                  ctx.font = `500 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

                  // Measure max width among lines
                  let maxWidth = 0;
                  for (const l of formattedLines) {
                    const m = ctx.measureText(l).width;
                    if (m > maxWidth) maxWidth = m;
                  }
                  const textHeight = fontSize;

                  // Draw background rectangle sized to fit multiple lines
                  const padding = 4 / globalScale;
                  const lineSpacing = 2 / globalScale;
                  const totalHeight = formattedLines.length * textHeight + (formattedLines.length - 1) * lineSpacing;
                  const bgX = centerX - maxWidth / 2 - padding;
                  const bgY = centerY - totalHeight / 2 - padding;
                  const bgWidth = maxWidth + padding * 2;
                  const bgHeight = totalHeight + padding * 2;

                  const labelBgColor = '#e0e7ff'; // Light blue background
                  const labelBorderColor = '#c7d2fe';
                  const labelTextColor = '#334155';

                  ctx.fillStyle = labelBgColor;
                  ctx.strokeStyle = labelBorderColor;
                  ctx.lineWidth = 1 / globalScale;
                  ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
                  ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);

                  // Draw each line centered vertically within bg
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = labelTextColor;
                  for (let i = 0; i < formattedLines.length; i++) {
                    const ly = bgY + padding + textHeight / 2 + i * (textHeight + lineSpacing);
                    ctx.fillText(formattedLines[i], centerX, ly);
                  }

                  ctx.restore();
                }
              }

            }}
            onRenderFramePost={(ctx: any, globalScale: any) => {
              // Draw all labels AFTER all nodes are rendered to ensure they appear on top
              if (!graphData.nodes || graphData.nodes.length === 0) return;
              
              // === LOD Optimization: Skip text rendering completely when zoomed out ===
              if (globalScale < 0.4) return;
              // === End LOD ===

              graphData.nodes.forEach((node: any) => {
                if (node.x === undefined || node.y === undefined) return;
                
                const isCustomer = node.type?.toLowerCase().includes('customer') || node.type?.toLowerCase().includes('person');
                const isMainCustomer = isCustomer && node.id === firstCustomerNodeId;
                
                // Only draw labels for nodes that were clicked OR the main customer
                if (!labeledNodes.has(String(node.id)) && !isMainCustomer) return;
                
                // Calculate degree text and colors for customer nodes
                let degreeText = '';
                let degreeBgColor = '#dcfce7';
                let degreeBorderColor = '#86efac';
                let degreeTextColor = '#16a34a';
                
                if (isCustomer) {
                  const degreeToHighRiskCustomer = node.properties?.degreeToHighRiskCustomer;
                  
                  const convertDegreeToOrdinalLocal = (degree: number | string | undefined): string => {
                    if (degree === undefined || degree === null) return '';
                    const degreeLower = String(degree).toLowerCase().trim();
                    if (degreeLower.includes('first')) return '1st';
                    if (degreeLower.includes('second')) return '2nd';
                    if (degreeLower.includes('third')) return '3rd';
                    if (degreeLower.includes('fourth')) return '4th';
                    if (degreeLower.includes('fifth')) return '5th';
                    if (degreeLower.includes('sixth')) return '6th';
                    const degreeNum = parseInt(degreeLower, 10);
                    if (!isNaN(degreeNum)) {
                      if (degreeNum % 100 === 11 || degreeNum % 100 === 12 || degreeNum % 100 === 13) return `${degreeNum}th`;
                      const lastDigit = degreeNum % 10;
                      if (lastDigit === 1) return `${degreeNum}st`;
                      if (lastDigit === 2) return `${degreeNum}nd`;
                      if (lastDigit === 3) return `${degreeNum}rd`;
                      return `${degreeNum}th`;
                    }
                    return String(degree);
                  };
                  
                  if (degreeToHighRiskCustomer !== undefined && degreeToHighRiskCustomer !== null) {
                    const ordinalDegree = convertDegreeToOrdinalLocal(degreeToHighRiskCustomer);
                    degreeText = `${ordinalDegree} Deg To High Risk`;
                    const degreeRank = Number(degreeToHighRiskCustomer);
                    if (degreeRank === 1) {
                      degreeTextColor = '#dc2626';
                      degreeBgColor = '#fee2e2';
                      degreeBorderColor = '#fca5a5';
                    } else if (degreeRank === 2) {
                      degreeTextColor = '#ea580c';
                      degreeBgColor = '#fed7aa';
                      degreeBorderColor = '#fdba74';
                    } else if (degreeRank === 3) {
                      degreeTextColor = '#ca8a04';
                      degreeBgColor = '#fef3c7';
                      degreeBorderColor = '#fcd34d';
                    } else if (degreeRank >= 4) {
                      degreeTextColor = '#b45309';
                      degreeBgColor = '#fef3c7';
                      degreeBorderColor = '#fcd34d';
                    }
                  } else {
                    const nodeRiskIndicator = getCustomerRiskIndicator(node);
                    if (nodeRiskIndicator && String(nodeRiskIndicator).toLowerCase().includes('high')) {
                      degreeText = 'Defaulter';
                      degreeTextColor = '#dc2626';
                      degreeBgColor = '#fee2e2';
                      degreeBorderColor = '#fca5a5';
                    } else {
                      degreeText = 'No Connection to Defaulter';
                      degreeTextColor = '#16a34a';
                      degreeBgColor = '#dcfce7';
                      degreeBorderColor = '#86efac';
                    }
                  }
                }
                
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
                
                const label = formatGraphLabel(node) || node.name;
                const fontSize = 10 / globalScale;
                ctx.font = `500 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                
                let labelTextColor = '#334155';
                let labelBgColor = '#e0e7ff';
                let labelBorderColor = '#c7d2fe';
                
                if (isCustomer) {
                  const nodeRiskIndicator = getCustomerRiskIndicator(node);
                  const riskColorName = getRiskColor(nodeRiskIndicator);
                  labelTextColor = getRiskColorHexForIcon(riskColorName);
                  if (riskColorName === 'red') {
                    labelBgColor = '#fee2e2';
                    labelBorderColor = '#fca5a5';
                  } else if (riskColorName === 'yellow') {
                    labelBgColor = '#fef3c7';
                    labelBorderColor = '#fcd34d';
                  } else if (riskColorName === 'green') {
                    labelBgColor = '#dcfce7';
                    labelBorderColor = '#86efac';
                  }
                }
                
                const labelY = node.y + (isCustomer ? 14 : 10) + 4;
                const padding = 4 / globalScale;
                
                if (isCustomer && degreeText) {
                  const degreeFontSize = 8 / globalScale;
                  const degreeY = node.y - (isCustomer ? 14 : 10) - 4;
                  ctx.font = `500 ${degreeFontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                  const degreeWidth = ctx.measureText(degreeText).width;
                  const degreeBubbleWidth = degreeWidth + padding * 2;
                  const degreeBubbleHeight = degreeFontSize + padding * 2;
                  const degreeBubbleX = node.x - degreeBubbleWidth / 2;
                  
                  ctx.fillStyle = degreeBgColor;
                  ctx.strokeStyle = degreeBorderColor;
                  ctx.lineWidth = 1 / globalScale;
                  ctx.fillRect(degreeBubbleX, degreeY - degreeBubbleHeight / 2, degreeBubbleWidth, degreeBubbleHeight);
                  ctx.strokeRect(degreeBubbleX, degreeY - degreeBubbleHeight / 2, degreeBubbleWidth, degreeBubbleHeight);
                  
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = degreeTextColor;
                  ctx.globalAlpha = 1;
                  ctx.fillText(degreeText, node.x, degreeY);
                  
                  ctx.font = `500 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                  const labelWidth = ctx.measureText(label).width;
                  const nameBubbleWidth = labelWidth + padding * 2;
                  const nameBubbleHeight = fontSize + padding * 2;
                  const nameBubbleX = node.x - nameBubbleWidth / 2;
                  
                  ctx.fillStyle = labelBgColor;
                  ctx.strokeStyle = labelBorderColor;
                  ctx.lineWidth = 1 / globalScale;
                  ctx.fillRect(nameBubbleX, labelY - nameBubbleHeight / 2, nameBubbleWidth, nameBubbleHeight);
                  ctx.strokeRect(nameBubbleX, labelY - nameBubbleHeight / 2, nameBubbleWidth, nameBubbleHeight);
                  
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = labelTextColor;
                  ctx.globalAlpha = 1;
                  ctx.fillText(label, node.x, labelY);
                } else {
                  const labelWidth = ctx.measureText(label).width;
                  const bgX = node.x - (labelWidth + padding * 2) / 2;
                  
                  ctx.fillStyle = labelBgColor;
                  ctx.strokeStyle = labelBorderColor;
                  ctx.lineWidth = 1 / globalScale;
                  ctx.fillRect(bgX - padding, labelY - fontSize / 2 - padding, labelWidth + padding * 2, fontSize + padding * 2);
                  ctx.strokeRect(bgX - padding, labelY - fontSize / 2 - padding, labelWidth + padding * 2, fontSize + padding * 2);
                  
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = labelTextColor;
                  ctx.globalAlpha = 1;
                  ctx.fillText(label, node.x, labelY);
                }
                
                ctx.restore();
              });
            }}
          />

          {/* 1) Render inside the graph container (absolute) with a high z-index - helps when no stacking context issues */}
          {graphTopRight && !fullscreen && (
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 100000, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 9999, padding: 2, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                {graphTopRight}
              </div>
            </div>
          )}

          {/* 2) Also render as a fixed portal fallback positioned by containerRect (or viewport corner) */}
          {graphTopRight && !fullscreen && graphTopRightPortalFallback && typeof document !== 'undefined' ? createPortal(
            <div
              style={{
                position: 'fixed',
                top: containerRect ? `${Math.max(8, containerRect.top + 12)}px` : '80px',
                left: containerRect ? `${Math.max(8, containerRect.left + Math.max(0, containerRect.width - 56))}px` : 'calc(50% + 360px)',
                zIndex: 100000,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 9999, padding: 2, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                {graphTopRight}
              </div>
            </div>,
            document.body
          ) : null}

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-pre-line"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                pointerEvents: 'none'
              }}
            >
              {tooltip.content}
            </div>
          )}
        </div>

        {/* Node Details Card - hidden in fullscreen/minimal view */}
        {!fullscreen && (
          <div className="flex-[0_0_30%] min-w-0 bg-background rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <NodeDetailsInline node={selectedNode} data={allDataForDetails} strongConnector={strongConnector} />
          </div>
        )}
      </div>
    </div>
  );
};
