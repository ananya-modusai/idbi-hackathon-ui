import React, { FC, useEffect, useLayoutEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Share2, RotateCcw, Activity, Download, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import { useInvestigationRedFlagsStore } from '@/app/store/merchant/InvestigationRedFlagsStore';
import { useLinkagesStore } from '@/app/store/linkages/linkagesStore';
import { useCustomerIdStore } from '@/app/store/customer/customerIdStore';
import { useSidebarStore } from '@/app/store/ui/sidebarStore';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { EntityGraph } from '@/components/custom/EntityGraph/EntityGraph';
import { FilterGroupsState } from '@/components/custom/EntityGraph/EntityGraphFilters';
import { linkagesService as customerService } from './linkagesData';
import SectionHeaderWithRedFlags from '@/components/custom/SectionHeaderWithRedFlags';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { formatDateString } from '@/utils/timeFormat';
import { formatIndianNumber } from '@/utils/utils';
import CustomLoader from '@/components/custom/CustomLoader';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { parseEdgeSources } from '@/components/custom/EntityGraph/EntityGraphUtils';
import { CustomListActionButton } from '@/components/custom/CustomList/customListActionButton';
import { getGraphCache, setGraphCache, clearGraphCache } from '@/components/custom/EntityGraph/EntityGraphDB';

// Dynamic imports for client-side only components
const MotionDiv = dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.div })), { ssr: false });

// Helper to map selected degree filters to a numeric degree parameter for the
// /overview/loans/network-metrics API. We use the highest selected degree so
// that metrics reflect the widest neighbourhood currently in view.
const getNetworkDegreeFromSelection = (degrees: string[]): number => {
  if (!Array.isArray(degrees) || degrees.length === 0) return 2;

  const map: Record<string, number> = {
    first: 1,
    '1st': 1,
    second: 2,
    '2nd': 2,
    third: 3,
    '3rd': 3,
    fourth: 4,
    '4th': 4,
    fifth: 5,
    '5th': 5,
    sixth: 6,
    '6th': 6
  };

  let max = 1;
  degrees.forEach(d => {
    const key = String(d).toLowerCase().trim();
    const val = map[key] ?? Number.parseInt(key, 10);
    if (!Number.isNaN(val) && val > max) {
      max = val;
    }
  });

  return max > 0 ? max : 2;
};

/**
 * Bump when the shape of the linkages fixture changes.
 *
 * Per-degree responses are cached in IndexedDB, which survives a page reload —
 * so without a version in the key, a browser that cached a bad payload keeps
 * serving it forever and the fix looks like it did nothing.
 */
const FIXTURE_CACHE_VERSION = 5;

export const CustomerLinkagesTab: FC<{ customerId?: string }> = ({ customerId: customerIdProp }) => {
  const { activeContexts, handleSelect } = useActiveContext();
  // Use customer id from active context (EWS should show customer linkages)
  const {
    getCachedNeptuneData,
    setCachedNeptuneData,
    setLoadingState,
    getLoadingState,
    clearNodePositions,
    getGraphState,
    setGraphState,
    addHiddenNode,
    removeHiddenNode,
    getHiddenNodes,
    clearHiddenNodes,
    setDeleteMode,
    getDeleteMode
  } = useLinkagesStore();

  // The `customerId` prop is the supported path inside the IDBI workspace: the
  // app has TWO separate ActiveContext stores (app/layout/… here vs
  // components/idbi/ActiveContext/store, which IdbiApp writes), so the context
  // read below never resolves there. The prop also carries a real CID rather
  // than a display name — see the PRODUCTION-BLOCKER note in IdbiApp.tsx.
  const customerId = useMemo(
    () => customerIdProp || activeContexts?.customer,
    [customerIdProp, activeContexts?.customer],
  );
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [resetKey, setResetKey] = useState<number>(0);
  const [clearExpandedDataKey, setClearExpandedDataKey] = useState<number>(0);
  const [selectEntityValues, setSelectEntityValues] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(() => {
    const initialCustomerId = activeContexts?.customer;
    if (initialCustomerId) {
      return getDeleteMode(initialCustomerId);
    }
    return false;
  });
  // Nodes actually hidden from the graph
  const [hiddenNodes, setHiddenNodes] = useState<string[]>(() => {
    const initialCustomerId = activeContexts?.customer;
    if (initialCustomerId) {
      return getHiddenNodes(initialCustomerId);
    }
    return [];
  });
  // Nodes selected for deletion (temporary, only during delete mode)
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);
  // Initialize from store if available, otherwise use defaults
  const [selectedDegree, setSelectedDegree] = useState<string[]>(() => {
    const initialCustomerId = customerIdProp || activeContexts?.customer;
    if (initialCustomerId) {
      const savedState = getGraphState(initialCustomerId);
      if (savedState?.selectedDegree) {
        return savedState.selectedDegree;
      }
    }
    // Customers sit on EVEN graph degrees (0, 2, 4, 6) with attributes bridging
    // them on odd ones, so 'first' (degree <= 1) can only ever show the customer
    // plus their own attributes -- and pruning then drops those attributes
    // because the people they lead to are filtered out. 'second' is the first
    // setting that shows an actual network.
    return ['second'];
  });
  const [pruneLowDegreeNodes, setPruneLowDegreeNodes] = useState<boolean>(() => {
    // Try to get customerId from activeContexts immediately
    const initialCustomerId = activeContexts?.customer;
    if (initialCustomerId) {
      const savedState = getGraphState(initialCustomerId);
      if (savedState?.pruneLowDegreeNodes !== undefined) {
        return savedState.pruneLowDegreeNodes;
      }
    }
    return true;
  });
  const [strongConnector, setStrongConnector] = useState<boolean>(() => {
    const initialCustomerId = customerIdProp || activeContexts?.customer;
    if (initialCustomerId) {
      const savedState = getGraphState(initialCustomerId);
      if (savedState?.strongConnector !== undefined) {
        return savedState.strongConnector;
      }
    }
    // Default to "No".
    //
    // With strongConnector === true the worker keeps a customer only if one of
    // its neighbours is an ATTRIBUTE with more than one neighbour of its own
    // (EntityGraph.worker.ts: "Dropping node because no valid attribute
    // connecting links"). But adjacency is built from the LINKS, and
    // transformNeptuneGraphToLinks emits a star — every link is
    // root -> node — so an attribute's only neighbour is ever the root and the
    // check can never pass. Under that topology the gate drops every connected
    // customer and the canvas renders the root alone.
    return false;
  });

  // Neptune API state
  const [neptuneData, setNeptuneData] = useState<any[]>([]);
  const [nodeDegreeMap, setNodeDegreeMap] = useState<Record<string, number>>({});
  const isLoadingNeptune = useLinkagesStore(
    useCallback(
      (s: any) => {
        if (!customerId) return false;
        const level = getNetworkDegreeFromSelection(selectedDegree);
        const bodyDegree = level - 1;
        return s.loadingStates[`${customerId}::degree=${bodyDegree}`] ?? false;
      },
      [customerId, selectedDegree]
    )
  ) as boolean;
  const [neptuneError, setNeptuneError] = useState<string | null>(null);
  // Track the degree that was requested for the current neptuneData
  const requestedDegreeRef = useRef<number | undefined>(undefined);

  // Connected users state
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [isConnectedUsersLoading, setIsConnectedUsersLoading] = useState<boolean>(true);
  // Keep track of expanded linkages coming from the graph so the connected-users list
  // can include customers that appear due to node expansion. EntityGraph will call
  // `onDataExpanded` with the currently expanded links.
  const [expandedLinksData, setExpandedLinksData] = useState<any[]>([]);
  const [extraPaginatedLinks, setExtraPaginatedLinks] = useState<any[]>([]);
  const [isDeviceMetricsExpanded, setIsDeviceMetricsExpanded] = useState<boolean>(false);
  // Fullscreen/Maximize state for the EntityGraph
  const [isGraphMaximized, setIsGraphMaximized] = useState<boolean>(false);

  // Lock body scroll when graph is maximized
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const origOverflow = document.documentElement.style.overflow;
    if (isGraphMaximized) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = origOverflow || '';
    }
    return () => {
      document.documentElement.style.overflow = origOverflow || '';
    };
  }, [isGraphMaximized]);
  // Add/remove body class to hide surrounding layout when maximized
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cls = 'graph-fullscreen-active';
    if (isGraphMaximized) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => {
      document.body.classList.remove(cls);
    };
  }, [isGraphMaximized]);

  // Close fullscreen on Escape key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGraphMaximized) {
        setIsGraphMaximized(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isGraphMaximized]);
  
  // Tooltip state for portal-based tooltip (avoids clipping by overflow: hidden ancestors)
  const [tooltipInfo, setTooltipInfo] = useState<{
    index: number;
    content: string;
    x: number;
    y: number;
  } | null>(null);

  // Customer name fetched from Overview API for synthetic entries
  const [customerNameFromApi, setCustomerNameFromApi] = useState<string | null>(null);
  
  // Main customer loan portfolio state
  const [mainCustomerLoans, setMainCustomerLoans] = useState<any[]>([]);
  const [isMainCustomerLoansLoading, setIsMainCustomerLoansLoading] = useState<boolean>(true);

  // Network metrics state (from /overview/loans/network-metrics API)
  const [networkMetrics, setNetworkMetrics] = useState<any | null>(null);
  const [isNetworkMetricsLoading, setIsNetworkMetricsLoading] = useState<boolean>(false);
  const [networkMetricsError, setNetworkMetricsError] = useState<string | null>(null);
  // Pagination state for Connected User Risk Overview table
  const [visibleRowsCount, setVisibleRowsCount] = useState<number>(10);

  // Overview state for risk badge
  const [liveOverview, setLiveOverview] = useState<any | null>(null);
  
  const deviceTableRef = useRef<any>(null);

  // Visible links on the graph = filtered links (current view) + expanded links (from chevron expansion) + extra paginated links
  const visibleLinks = useMemo(() => {
    let base = Array.isArray(filteredData) ? [...filteredData] : [];
    if (Array.isArray(expandedLinksData) && expandedLinksData.length > 0) {
      base = base.concat(expandedLinksData);
    }
    if (Array.isArray(extraPaginatedLinks) && extraPaginatedLinks.length > 0) {
      base = base.concat(extraPaginatedLinks);
    }

    // De-duplicate by edgeId or source-target pair to prevent double-counting in tables and metrics
    const seenIds = new Set<string>();
    return base.filter(link => {
      if (!link) return false;
      const id = link.edgeId || (link.source && link.target ? `${link.source}-${link.target}` : null);
      if (!id) return true; // Keep synthetic links
      if (seenIds.has(String(id))) return false;
      seenIds.add(String(id));
      return true;
    });
  }, [filteredData, expandedLinksData, extraPaginatedLinks]);

  // Shared telephone type mapping function
  const getTelephoneCategory = (typeCode: string | number | null): string => {
    if (!typeCode) return 'Phone';

    const codeStr = String(typeCode).trim();

    const telephoneTypeMap: Record<string, string> = {
      '1': 'Residence',
      '2': 'Office',
      '3': 'Mobile',
      '4': 'Fax',
      '5': 'Other'
    };

    return telephoneTypeMap[codeStr] || codeStr;
  };

  // Normalize loan status strings so UI treats 'Closed' as 'Inactive'
  const normalizeLoanStatus = (s?: string | null) => {
    if (s === undefined || s === null) return 'Inactive';
    const str = String(s).toLowerCase();
    if (str.includes('active')) return 'Active';
    if (str.includes('close') || str.includes('closed') || str.includes('inactive')) return 'Inactive';
    return /[a-z]/i.test(String(s)) ? String(s) : 'Inactive';
  };

  // Determine repayment timeline box color
  const determineInstallmentColor = (delayRaw: any, isPaid: boolean, repaymentDateRaw?: any, dueDateRaw?: any) => {
    const RED = 'bg-red-400';
    const YELLOW = 'bg-yellow-300';
    const GREEN = 'bg-green-300';
    const GRAY = 'bg-gray-300';
    const ORANGE = 'bg-orange-300';
    const BLUE = 'bg-blue-400';

    const delay = Number(String(delayRaw || '0').replace(/[^0-9-]/g, '')) || 0;

    const parseMaybe = (d: any) => {
      if (!d && d !== 0) return null;
      try {
        const s = String(d).trim();
        const t = s.replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2})\s+/, '$1T');
        const dt = new Date(t);
        if (isNaN(+dt)) return null;
        return dt;
      } catch {
        return null;
      }
    };

    const repaymentDate = parseMaybe(repaymentDateRaw);
    const dueDate = parseMaybe(dueDateRaw);

    if (isPaid) {
      if (repaymentDate && dueDate && +repaymentDate < +dueDate) return BLUE;
      if (delay <= 0) return GREEN;
      if (delay <= 5) return YELLOW;
      if (delay <= 15) return ORANGE;
      return RED;
    }

    if (delay === 0) return GRAY;
    if (delay > 0) return RED;
    return GRAY;
  };

  // Badge class for loan status
  const statusBadgeClass = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = String(status).toLowerCase();
    if (s.includes('active')) return 'bg-green-100 text-green-800';
    if (s.includes('inactive') || s.includes('closed')) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Helper to map selected degree filters to a numeric degree parameter for the
  // /overview/loans/network-metrics API. We use the highest selected degree so
  // that metrics reflect the widest neighbourhood currently in view.
  // Helper to get risk info from risk_indicator (API-provided)
  const getRiskFromIndicator = (riskIndicator?: string | null): { label: string; color: 'green' | 'yellow' | 'red' | 'gray' } => {
    if (!riskIndicator) return { label: 'UNKNOWN RISK', color: 'gray' };
    const text = String(riskIndicator).trim();
    const lower = text.toLowerCase();
    if (lower.includes('low')) return { label: text, color: 'green' };
    if (lower.includes('medium') || lower.includes('moderate')) return { label: text, color: 'yellow' };
    if (lower.includes('high')) return { label: text, color: 'red' };
    return { label: text, color: 'gray' };
  };

  // Restore graph state when customerId changes - use useLayoutEffect to run before render
  useLayoutEffect(() => {
    if (customerId) {
      const savedState = getGraphState(customerId);
      if (savedState) {
        // Only update if different to avoid unnecessary re-renders
        setSelectedDegree(prev => {
          const prevKey = prev.sort().join(',');
          // Handle undefined selectedDegree (when it's not persisted to force reset on refresh)
          const savedDegree = savedState.selectedDegree || ['first'];
          const newKey = savedDegree.sort().join(',');
          return prevKey !== newKey ? savedDegree : prev;
        });
        setPruneLowDegreeNodes(prev => {
          return prev !== savedState.pruneLowDegreeNodes ? savedState.pruneLowDegreeNodes : prev;
        });
        setStrongConnector(prev => {
          const newVal = savedState.strongConnector;
          return prev !== newVal ? (newVal ?? null) : prev;
        });
      }
    }
  }, [customerId, getGraphState]);

  // Close sidebar when Linkages tab loads (after selecting a customer from Watchlist)
  const { setShouldCloseSidebar } = useSidebarStore();
  useEffect(() => {
    if (customerId) {
      setShouldCloseSidebar(true);
    }
  }, [customerId, setShouldCloseSidebar]);

  // Track last fetched customer to prevent unnecessary re-fetches
  const lastFetchedCustomerRef = useRef<string | null>(null);

  // Reset refs when customer changes
  useEffect(() => {
    lastFetchedCustomerRef.current = null;
    requestedDegreeRef.current = 4; // Always use degree 4
    // Reset pagination and fetched IDs when customer changes
    setVisibleRowsCount(10);
    setNetworkMetrics(null);
  }, [customerId]);

  // Fetch customer name from Overview API for synthetic entries
  useEffect(() => {
    if (!customerId) {
      setCustomerNameFromApi(null);
      return;
    }

    const fetchCustomerName = async () => {
      try {
        const overview = await customerService.getCustomerOverview(customerId);
        if (overview && overview.name) {
          // Use the complete name as-is
          const fullName = String(overview.name).trim();
          setCustomerNameFromApi(fullName);
        } else {
          setCustomerNameFromApi(null);
        }
      } catch (err) {
        setCustomerNameFromApi(null);
      }
    };

    fetchCustomerName();
  }, [customerId]);

  // Sync hidden nodes from store when customer changes
  useEffect(() => {
    if (customerId) {
      const storedHiddenNodes = getHiddenNodes(customerId);
      setHiddenNodes(storedHiddenNodes);
      const storedDeleteMode = getDeleteMode(customerId);
      setIsDeleteMode(storedDeleteMode);
    }
  }, [customerId, getHiddenNodes, getDeleteMode]);

  // Fetch Neptune data using paginated API based on degree selection
  useEffect(() => {
    if (!customerId) return;

    const level = getNetworkDegreeFromSelection(selectedDegree);
    const bodyDegree = level - 1; // 0 for 1st degree, 1 for 2nd degree, etc.
    
    // Get prev degree node ids BEFORE fetching. For second-degree requests (bodyDegree=1)
    // this should be the list of first-degree node ids (degree === 0). More generally,
    // collect nodes from the previously-fetched payload whose `degree` equals bodyDegree - 1.
    let prevDegreeNodeIds: string[] = []; // Calculated inside fetchData async for IndexedDB support

    const cacheKey = `${customerId}::degree=${bodyDegree}::strong=${strongConnector}::v${FIXTURE_CACHE_VERSION}`;

    let cancelled = false;

    const fetchData = async () => {
      setNeptuneError(null);
      let currentPrevDegreeNodeIds: string[] = [];
      let finalCombinedView: any = null;

      // Sequential loop from degree 0 to the target bodyDegree
      for (let d = 0; d <= bodyDegree; d++) {
        if (cancelled) return;

        const cacheKey = `${customerId}::degree=${d}::strong=${strongConnector}::v${FIXTURE_CACHE_VERSION}`;
        let degreeData: any[] | null = null;

        // 1. Check Memory Cache
        const memCached = getCachedNeptuneData(customerId, d);
        if (memCached && Array.isArray(memCached) && memCached.length > 0) {
          degreeData = memCached;
        }

        // 2. Check IndexedDB Cache if not in memory
        if (!degreeData) {
          try {
            const idbCached = await getGraphCache(cacheKey);
            const idbData = (idbCached && idbCached.data) ? idbCached.data : idbCached;
            if (idbData && Array.isArray(idbData) && idbData.length > 0) {
              degreeData = idbData;
              // Sync to memory cache for consistency
              setCachedNeptuneData(customerId, idbData, null, d);
            }
          } catch (e) {
            console.warn(`IndexedDB read failed for degree ${d}:`, e);
          }
        }

        // 3. Fetch from API if not cached
        if (!degreeData) {
          if (cancelled) return;
          setLoadingState(customerId, true, d);
          try {
            const getLimitByDegree = (deg: number) => {
              if (deg === 0 || deg === 1) return 10;
              if (deg === 2 || deg === 4) return 3;
              if (deg === 3 || deg === 5) return 5;
              return 20;
            };
            const limit = getLimitByDegree(d);

            const apiResponse = await customerService.getNeptuneLinkages(
              customerId,
              d,
              strongConnector,
              currentPrevDegreeNodeIds,
              limit
            );

            if (apiResponse) {
              const apiData = (apiResponse && apiResponse.status === 'success' && apiResponse.data) ? apiResponse.data : apiResponse;
              
              if (apiData && apiData.success === false) {
                if (cancelled) return;
                setNeptuneError(apiData.message || `Error fetching degree ${d}`);
                setLoadingState(customerId, false, d);
                break; // Stop sequential fetch on error
              }

              degreeData = Array.isArray(apiData) ? apiData : [apiData];
              setCachedNeptuneData(customerId, degreeData, null, d);
            }
          } catch (error) {
            console.error(`[Neptune] Error fetching degree ${d}:`, error);
            if (!cancelled) {
              setNeptuneError(`Failed to load linkages data for degree ${d}`);
            }
            setLoadingState(customerId, false, d);
            break;
          } finally {
            setLoadingState(customerId, false, d);
          }
        }

        // Process fetched or cached data for this degree level
        if (degreeData && degreeData.length > 0) {
          const graph = degreeData[0];
          
          // Sync nodeDegreeMap
          if (graph && graph.nodes && Array.isArray(graph.nodes)) {
            const updates: Record<string, number> = {};
            graph.nodes.forEach((n: any) => {
              if (n && n.id && n.degree !== undefined && n.degree !== null) {
                const deg = Number(n.degree);
                if (!isNaN(deg)) updates[String(n.id)] = deg;
              }
            });
            setNodeDegreeMap(prev => ({ ...prev, ...updates }));
          }

          // Combine with previous results for the final view
          if (!finalCombinedView) {
            finalCombinedView = { ...graph };
          } else {
            const nodeMap = new Map<string, any>();
            const edgeMap = new Map<string, any>();
            
            // Add existing
            (finalCombinedView.nodes || []).forEach((n: any) => { if (n && n.id) nodeMap.set(n.id, n); });
            (finalCombinedView.edges || []).forEach((e: any) => { if (e && e.id) edgeMap.set(e.id, e); else if (e && e.from && e.to) edgeMap.set(`${e.from}::${e.to}`, e); });
            
            // Add new degree nodes/edges
            (graph.nodes || []).forEach((n: any) => { if (n && n.id) nodeMap.set(n.id, n); });
            (graph.edges || []).forEach((e: any) => { if (e && e.id) edgeMap.set(e.id, e); else if (e && e.from && e.to) edgeMap.set(`${e.from}::${e.to}`, e); });

            const mergedNodes = Array.from(nodeMap.values());
            const mergedEdges = Array.from(edgeMap.values());

            finalCombinedView = {
              ...finalCombinedView,
              nodes: mergedNodes,
              edges: mergedEdges,
              nodeCount: mergedNodes.length,
              edgeCount: mergedEdges.length
            };
          }

          // --- INCREMENTAL UPDATE ---
          if (finalCombinedView && !cancelled) {
            setNeptuneData([finalCombinedView]);
            requestedDegreeRef.current = d;
          }

          // Prepare currentPrevDegreeNodeIds for the NEXT degree in the loop
          if (d < bodyDegree) {
            let candidates: any[] = [];
            if (graph) {
              if (Array.isArray(graph.results)) candidates = [...graph.results];
              else if (Array.isArray(graph.nodes)) candidates = [...graph.nodes];
              else if (Array.isArray(graph.data?.nodes)) candidates = [...graph.data.nodes];
              else if (Array.isArray(graph.data?.results)) candidates = [...graph.data.results];
            }

            // Augment with manual expands if applicable to this degree
            if (Array.isArray(extraPaginatedLinks) && extraPaginatedLinks.length > 0) {
              extraPaginatedLinks.forEach((link: any) => {
                if (link.targetNode && Number(link.targetNode.degree) === d) candidates.push(link.targetNode);
                if (link.sourceNode && Number(link.sourceNode.degree) === d) candidates.push(link.sourceNode);
              });
            }

            // Always recompute seeds for the next hop. Guarding this on
            // `candidates.length > 0` used to leave currentPrevDegreeNodeIds holding
            // the PREVIOUS hop's ids, so degree d+1 was fetched with stale seeds --
            // silently wrong results, or an error that blanked the graph.
            {
              currentPrevDegreeNodeIds = candidates
                .filter((n: any) => {
                  const labelLower = (n?.label || n?.type || '').toString().toLowerCase();
                  const isCustomer = labelLower.includes('customer');
                  
                  // Rule for fetching degree d+1:
                  if (d === 0) return !isCustomer; // Degree 0 -> Degree 1 (rules for bodyDegree 1)
                  if (d === 1) return isCustomer; // Degree 1 -> Degree 2 (rules for bodyDegree 2)
                  return true;
                })
                .map((n: any) => n.id)
                .filter(Boolean);
              
              currentPrevDegreeNodeIds = Array.from(new Set(currentPrevDegreeNodeIds));
            }

            // Nothing to expand from -> the network genuinely ends here. Stop
            // without setting neptuneError; the degrees already fetched stand.
            if (currentPrevDegreeNodeIds.length === 0) {
              break;
            }
          }
        }
      }

      if (finalCombinedView && !cancelled) {
        // Final cache update for the target degree level
        const finalCacheKey = `${customerId}::degree=${bodyDegree}::strong=${strongConnector}::v${FIXTURE_CACHE_VERSION}`;
        await setGraphCache(finalCacheKey, [finalCombinedView]);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [customerId, selectedDegree, strongConnector, getCachedNeptuneData, getLoadingState, setLoadingState, setCachedNeptuneData, resetKey, extraPaginatedLinks]);




  // Fetch overview data for risk badge
  useEffect(() => {
    let mounted = true;
    if (!customerId) return;
    (async () => {
      try {
        const data = await customerService.getCustomerOverview(customerId);
        if (!mounted) return;
        setLiveOverview(data ?? null);
      } catch (err) {
        // ignore and keep null
      }
    })();

    return () => { mounted = false; };
  }, [customerId]);



  // Fetch connected users data
  useEffect(() => {
    // Derive connected users directly from the graph-visible links (filtered + expanded).
    // This ensures customers that appear because a node was expanded are included,
    // and they disappear when the expanded nodes are collapsed.
    const updateFromGraph = () => {
      // Visible links are provided to this component via `filteredData` (set by EntityGraph)
      // and via `expandedLinksData` (set by EntityGraph through onDataExpanded).
      let visibleLinks = Array.isArray(filteredData) ? [...filteredData] : [];
      if (Array.isArray(expandedLinksData) && expandedLinksData.length > 0) {
        visibleLinks = visibleLinks.concat(expandedLinksData);
      }

      // Collect unique customer nodes (CUSTOMER / PERSON types)
      const customersMap = new Map<string, any>();
      const considerNode = (node: any, fallbackId?: string, fallbackName?: string) => {
        if (!node && !fallbackId) return;
        const nodeType = (node && (node.type || node.label)) || '';
        const typeLower = String(nodeType || '').toLowerCase();
        const isCustomer = typeLower.includes('customer') || typeLower.includes('person');
        if (!isCustomer) return;

        const id = node?.properties?.userid || node?.properties?.user_id || node?.id || fallbackId;
        const name = node?.name || node?.shortName || fallbackName || '';
        
        // Extract cibil_score and risk_indicator from graph node properties (same as NodeDetails.tsx)
        const cibil_score = node?.properties?.cibil_score ?? 
                          node?.properties?.cibilScore ?? 
                          node?.properties?.cibil ?? 
                          null;
        const risk_indicator = node?.properties?.risk_indicator ?? 
                              node?.properties?.riskIndicator ?? 
                              node?.properties?.risk_level ?? 
                              node?.properties?.riskLevel ?? 
                              null;
        
        if (id) {
          const existingEntry = customersMap.get(String(id));
          // Only update if we don't have an entry, or if this entry has better data
          if (!existingEntry || 
              (!existingEntry.cibil_score && cibil_score) || 
              (!existingEntry.risk_indicator && risk_indicator)) {
            customersMap.set(String(id), { 
              userid: String(id), 
              name: existingEntry?.name || name,
              cibil_score: existingEntry?.cibil_score || cibil_score,
              risk_indicator: existingEntry?.risk_indicator || risk_indicator
            });
          }
        }
      };

      visibleLinks.forEach((link: any) => {
        if (link.sourceNode) considerNode(link.sourceNode, link.source, link.sourceName);
        if (link.targetNode) considerNode(link.targetNode, link.target, link.targetName);
      });

      // Always include main customer id if present on graph (or by context)
      if (customerId) {
        // If main customer not present in map, add it with basic info
        if (!customersMap.has(String(customerId))) {
          customersMap.set(String(customerId), { userid: String(customerId), name: customerName || customerId });
        }
      }

      const customers = Array.from(customersMap.values());
      setConnectedUsers(customers);
      setIsConnectedUsersLoading(false);
    };

    // Update immediately (synchronous derivation)
    updateFromGraph();

    // No async fetch required anymore for connected users; EntityGraph controls
    // expandedLinksData via onDataExpanded, and filteredData is updated through
    // the onFilterChange handler.
    // Cleanup is a no-op here.
    return () => {};
  }, [customerId, filteredData, expandedLinksData]);

  // Fetch network metrics for the connected users shown in the table
  useEffect(() => {
    if (!customerId) {
      setNetworkMetrics(null);
      setNetworkMetricsError(null);
      setIsNetworkMetricsLoading(false);
      return;
    }

    // Derive the set of userIds currently visible in the graph, similar to the
    // logic used for loans fetching and table construction.
    const graphUserIds = new Set<string>();

    // Only collect `userid` (or `user_id`) from nodes that are CUSTOMER / PERSON
    // This avoids accidentally sending raw graph node IDs to the network-metrics API.
    if (visibleLinks && Array.isArray(visibleLinks)) {
      visibleLinks.forEach((link: any) => {
        const extractId = (node: any) => {
          if (!node) return;
          const nodeLabel = node.type || node.label || '';
          const labelLower = String(nodeLabel).toLowerCase();
          const isCustomer = labelLower.includes('customer') || labelLower.includes('person');
          if (!isCustomer) return;

          // Prefer explicit userid fields on CUSTOMER nodes; do NOT fall back to node.id
          const uid = node?.properties?.userid || node?.properties?.user_id;
          if (uid && String(uid) !== String(customerId)) {
            graphUserIds.add(String(uid));
          }
        };
        if (link.sourceNode) extractId(link.sourceNode);
        if (link.targetNode) extractId(link.targetNode);
      });
    }

    const allOtherUserIds = Array.from(graphUserIds).filter(uid => uid !== String(customerId)).sort();
    const connectedIdsForMetrics = allOtherUserIds.slice(0, visibleRowsCount);

    const degreeNumber = getNetworkDegreeFromSelection(selectedDegree);

    // If there are no connected users, still call the metrics API for the
    // requested degree (e.g., initial first-degree view). Some degree
    // selections (or graph states) may not expose other user IDs yet, but the
    // backend can still return aggregated metrics. Therefore do NOT skip the
    // API call when connectedIdsForMetrics is empty; pass an empty array so
    // the service can return degree-scoped metrics even without a user list.
    if (connectedIdsForMetrics.length === 0) {
      console.debug('[CustomerLinkagesTab] No visible connected users - still requesting network metrics for degree', degreeNumber);
    }

    let cancelled = false;

    setIsNetworkMetricsLoading(true);
    setNetworkMetricsError(null);

    (async () => {
      try {
        // If connectedIdsForMetrics is empty, pass an empty array so the API
        // can still compute and return metrics scoped to the requested degree.
        const resp = await customerService.getLoansNetworkMetrics(
          String(customerId),
          degreeNumber,
          connectedIdsForMetrics,
          strongConnector
        );
        if (cancelled) return;

        // `getLoansNetworkMetrics` returns a "wrapper" object that usually
        // contains `{ loans: [...], metrics: { ... } }`. Store the full wrapper
        // so callers can access both `loans` and `metrics` (UI expects both).
        const wrapper = resp ?? null;
        setNetworkMetrics(wrapper);
      } catch (error) {
        console.error('[Network Metrics] Error fetching data:', error);
        if (!cancelled) {
          setNetworkMetrics(null);
          setNetworkMetricsError('Failed to load network metrics');
        }
      } finally {
        if (!cancelled) {
          setIsNetworkMetricsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId, visibleLinks, visibleRowsCount, selectedDegree, strongConnector]);

  // Fetch main customer's loans for the portfolio summary
  useEffect(() => {
    if (!customerId) {
      setIsMainCustomerLoansLoading(false);
      setMainCustomerLoans([]);
      return;
    }

    const mounted = { current: true };

    (async () => {
      try {
        setIsMainCustomerLoansLoading(true);
        const loanResp = await customerService.getCustomerLoans(customerId);
        
        if (mounted.current && loanResp) {
          const rawLoans = loanResp.loans ?? loanResp ?? [];
          const normalizedLoans = Array.isArray(rawLoans) ? rawLoans.map((l: any) => {
            const repaymentTimeline = l.repayment_timeline ?? l.repaymentTimeline ?? [];
            const emi_start_date = l.disbursal_date ?? l.disbursalDate ?? (repaymentTimeline[0]?.due_date ?? null);
            // Normalize to keys expected by the Linkages table renderer
            return {
              loan_id: l.loan_id ?? l.loanId ?? l.id,
              disbursal_date: l.disbursal_date ?? l.disbursalDate ?? emi_start_date,
              loan_amount: Number(l.loan_amount ?? l.loanAmount ?? l.amount ?? 0),
              total_installments: l.total_installments ?? l.totalInstallments ?? l.num_installments ?? 0,
              repayment_timeline: repaymentTimeline,
              loan_status: l.loan_status ?? l.loanStatus ?? null
            };
          }) : [];
          setMainCustomerLoans(normalizedLoans);
        } else if (mounted.current) {
          setMainCustomerLoans([]);
        }
      } catch (error) {
        console.error('[Main Customer Loans] Error fetching data:', error);
        if (mounted.current) {
          setMainCustomerLoans([]);
        }
      } finally {
        if (mounted.current) setIsMainCustomerLoansLoading(false);
      }
    })();

    return () => {
      mounted.current = false;
    };
  }, [customerId]);

  // Transform Neptune data to graph format
  // Helper to transform graph data into links array
  const transformNeptuneGraphToLinks = useCallback((graphData: any, level: number, customerId: string) => {
    if (graphData && graphData.success === false) {
      return [];
    }

    // Handle the actual backend format: {success, userid, degree, results: [...]}
    if (graphData && graphData.results && Array.isArray(graphData.results)) {

      // Create edges from customer to each result node
      const customerNodeId = customerId || graphData.userid;
      const graphLinks: any[] = [];

      // EXPLICIT RULE: If results is empty (nodeCount === 1, only customer node exists), 
      // create a synthetic self-link entry to ensure the customer node is displayed
      if (graphData.results.length === 0) {
        graphLinks.push({
          source: customerNodeId,
          target: customerNodeId,
          sourceName: `CUSTOMER (${customerNodeId})`,
          targetName: `CUSTOMER (${customerNodeId})`,
          sourceFullName: customerNodeId,
          targetFullName: customerNodeId,
          sourceNode: {
            id: customerNodeId,
            name: customerNodeId,
            type: 'CUSTOMER',
            label: 'CUSTOMER',
            properties: {}
          },
          targetNode: {
            id: customerNodeId,
            name: customerNodeId,
            type: 'CUSTOMER',
            label: 'CUSTOMER',
            properties: {}
          },
          sourceType: 'CUSTOMER',
          targetType: 'CUSTOMER',
          label: 'SELF',
          risk: '',
          notes: '',
          degree: 'first',
          numericDegree: 0,
          edgeId: `${customerNodeId}-self`,
          edgeProperties: {},
          isSynthetic: true // Mark as synthetic so we know it's not a real edge
        });
      }

      graphData.results.forEach((node: any) => {
        if (node && node.id) {
          // Determine node type from label
          const getNodeTypeFromLabel = (label: string): string => {
            const labelLower = label?.toLowerCase() || '';

            if (labelLower.includes('customer') || labelLower.includes('person')) return 'CUSTOMER';
            if (labelLower.includes('gov_id') || labelLower.includes('govid')) return 'GOV_ID';
            if (labelLower.includes('phone')) return 'PHONE';
            if (labelLower.includes('email')) return 'EMAIL';
            if (labelLower.includes('reference') || labelLower.includes('contact')) return 'REFERENCE_CONTACT';
            if (labelLower.includes('address')) return 'ADDRESS';
            if (labelLower.includes('pincode')) return 'PINCODE';
            if (labelLower.includes('geo') || labelLower.includes('location')) return 'GEOLOCATION';
            if (labelLower.includes('device')) return 'DEVICE';
            if (labelLower.includes('bank_account') || (labelLower.includes('bank') && labelLower.includes('account'))) return 'BANK_ACCOUNT';
            if (labelLower.includes('upi') || labelLower.includes('vpa')) return 'UPI_VPA';
            if (labelLower.includes('bank_branch') || (labelLower.includes('bank') && labelLower.includes('branch'))) return 'BANK_BRANCH';
            if (labelLower.includes('merchant')) return 'MERCHANT';

            return label || 'UNKNOWN';
          };

          // Helper to clean numeric values
          const cleanNumeric = (value: any): string => {
            if (!value) return '';
            const strValue = value.toString();
            if (typeof value === 'number' || strValue.includes('.')) {
              const numValue = parseFloat(strValue);
              if (!isNaN(numValue) && numValue % 1 === 0) {
                return Math.floor(numValue).toString();
              }
            }
            return strValue;
          };

          // Get short name for display
          const getShortName = (node: any): string => {
            const props = node.properties || {};
            const label = node.label || '';

            if (label.includes('GOV_ID')) {
              // Extract last 4 digits for AADHAAR, first 4 for others
              const govIdValue = props.gov_id_value || props.value || '';
              const govIdType = props.gov_id_type || '';

              let displayValue: string;
              if (govIdType.toUpperCase().includes('AADHAAR')) {
                // Get last 4 digits for AADHAAR
                const last4Digits = govIdValue.toString().slice(-4);
                displayValue = last4Digits;
              } else {
                // Get first 4 digits for other types
                const first4Digits = govIdValue.toString().substring(0, 4);
                displayValue = first4Digits;
              }

              // Get the gov ID type (PAN, AADHAAR, etc.) and format as TYPE(digits)
              const idType = govIdType || 'GOV_ID';
              return displayValue ? `${idType.toUpperCase()}(${displayValue})` : idType.toUpperCase();
            }
            if (label.includes('CUSTOMER')) {
              const userid = cleanNumeric(props.userid) || props.name || 'Customer';
              // Show only first 4 digits for userid if it's a number
              if (props.userid && /^\d+$/.test(cleanNumeric(props.userid))) {
                return cleanNumeric(props.userid).substring(0, 4);
              }
              return userid;
            }
            if (label.includes('EMAIL')) {
              const emailValue = props.email || props.email_address || '';
              return emailValue ? `EMAIL (${emailValue})` : 'EMAIL';
            }
            if (label.includes('PHONE')) {
              const telephoneCategory = getTelephoneCategory(props.telephone_type);
              const country = props.country || '';
              const countryDisplay = country ? `, ${country}` : '';
              return `PHONE (${telephoneCategory}${countryDisplay})`;
            }
            if (label.includes('REFERENCE')) {
              const name = props.name || 'Reference Contact';
              const mobile = props.mobile || props.phone_number || props.phone || '';
              const mobileDisplay = mobile ? `, +91-${cleanNumeric(mobile)}` : '';
              return `REFERENCE (${name}${mobileDisplay})`;
            }
            if (label.includes('ADDRESS')) {
              if (props.address_category_label) return props.address_category_label;
              if (props.category) return props.category;
              if (props.address_type) return props.address_type;
              if (props.type) return props.type;
              if (props.pincode) return cleanNumeric(props.pincode);
              if (props.city) return props.city;
              return 'Address';
            }
            if (label.includes('PINCODE')) return cleanNumeric(props.pincode) || 'Pincode';
            if (label.includes('GEOLOCATION') || label.includes('GEOLOCATION')) {
              const lon = props.lon || props.longitude || '';
              const lat = props.lat || props.latitude || '';

              let display = 'Location';
              if (lon || lat) {
                const lonDisplay = lon ? parseFloat(lon).toFixed(2) : '';
                const latDisplay = lat ? parseFloat(lat).toFixed(2) : '';
                if (lonDisplay && latDisplay) {
                  display = `GEOLOCATION (${lonDisplay}, ${latDisplay})`;
                } else if (lonDisplay) {
                  display = `GEOLOCATION (${lonDisplay})`;
                } else if (latDisplay) {
                  display = `GEOLOCATION (${latDisplay})`;
                }
              }
              return display;
            }
            if (label.includes('DEVICE')) {
              // Extract first 4 digits of device ID
              const deviceId = props.device_id || node.id || '';
              const first4Digits = deviceId.toString().substring(0, 4);
              return first4Digits ? `DEVICE (${first4Digits})` : 'DEVICE';
            }
            if (label.includes('BANK_ACCOUNT')) return cleanNumeric(props.accountNumber) || 'Bank Account';
            if (label.includes('UPI')) return props.vpa || 'UPI VPA';
            if (label.includes('BANK_BRANCH')) return props.branchName || props.ifsc || 'Bank Branch';

            return props.name || props.value || label || 'Node';
          };

          const nodeType = getNodeTypeFromLabel(node.label);
          const shortName = getShortName(node);

          // Map node type to proper edge type
          const getEdgeType = (nodeType: string): string => {
            switch (nodeType) {
              case 'GOV_ID': return 'HAS_GOVID';
              case 'PHONE': return 'HAS_PHONE';
              case 'EMAIL': return 'HAS_EMAIL';
              case 'REFERENCE_CONTACT': return 'HAS_REFERRED';
              case 'ADDRESS': return 'HAS_ADDRESS';
              case 'PINCODE': return 'IN_PINCODE';
              case 'GEOLOCATION': return 'GEOLOCATED_AT';
              case 'DEVICE': return 'USES_DEVICE';
              case 'BANK_ACCOUNT': return 'REPAID_FROM';
              case 'UPI_VPA': return 'SENT_TO';
              case 'BANK_BRANCH': return 'ACCOUNT_AT_BRANCH';
              case 'MERCHANT': return 'TRANSACTED_WITH';
              default: return `HAS_${nodeType}`;
            }
          };

          const edgeType = getEdgeType(nodeType);

          // Create link from customer to this node
          graphLinks.push({
            source: customerNodeId,
            target: node.id,
            sourceName: `CUSTOMER (${customerNodeId})`,
            targetName: (nodeType === 'GEOLOCATION' || nodeType === 'EMAIL' || nodeType === 'DEVICE' || nodeType === 'GOV_ID' || nodeType === 'REFERENCE_CONTACT') ? shortName : (nodeType === 'PHONE' ? `PHONE (${shortName})` : `${node.label} (${shortName})`),
            sourceFullName: customerNodeId,
            targetFullName: shortName,
            sourceNode: {
              id: customerNodeId,
              name: customerNodeId,
              type: 'CUSTOMER',
              label: 'CUSTOMER',
              properties: {}
              // branchCount will be calculated from actual linkages
            },
            targetNode: {
              id: node.id,
              name: nodeType === 'PHONE' ? `PHONE (${shortName})` : shortName,
              type: nodeType,
              label: nodeType === 'PHONE' ? `PHONE (${shortName})` : node.label,
              properties: (() => {
                const props = node.properties || {};
                // Extract branchCount from API response - check all possible locations
                let branchCount = node.branchCount ?? 
                                  node.branch_count ?? 
                                  props.branchCount ?? 
                                  props.branch_count;

                // Convert to number if it's a string
                if (branchCount !== undefined && branchCount !== null) {
                  if (typeof branchCount === 'string') {
                    const parsed = parseInt(branchCount, 10);
                    branchCount = isNaN(parsed) ? undefined : parsed;
                  } else {
                    branchCount = Number(branchCount);
                    if (isNaN(branchCount)) branchCount = undefined;
                  }
                }

                // Detect hasBranches flag from multiple possible locations
                const rawHasBranches = node.hasBranches ?? node.has_branches ?? props.hasBranches ?? props.has_branches;
                const hasBranches = ((): boolean => {
                  if (rawHasBranches === true) return true;
                  if (typeof rawHasBranches === 'number') return rawHasBranches > 0;
                  if (typeof rawHasBranches === 'string') {
                    const s = rawHasBranches.trim().toLowerCase();
                    return s === 'true' || s === '1';
                  }
                  return false;
                })();

                return {
                  ...props,
                  // Ensure branchCount is in properties
                  branchCount: branchCount,
                  branch_count: branchCount,
                  // Preserve hasBranches flag from paginated API
                  hasBranches: hasBranches,
                  has_branches: hasBranches
                };
              })()
            },
            sourceType: 'CUSTOMER',
            targetType: nodeType,
            label: edgeType,
            risk: '',
            notes: '',
            // Extract degree from node properties if available, otherwise calculate from distance
            // The API response with degree=4 contains all degrees, so we need to extract the actual degree from each node
            degree: (function() {
              const cachedDeg = nodeDegreeMap[String(node.id)];
              const nodeDegree = cachedDeg !== undefined 
                    ? cachedDeg 
                    : (node.degree !== undefined && node.degree !== null ? node.degree : node.properties?.degree);
              if (nodeDegree !== undefined && nodeDegree !== null) {
                const n = Number(nodeDegree);
                if (!isNaN(n)) {
                  // Store numeric degree for filtering, but return named degree for compatibility
                  if (n <= 1) return 'first';
                  if (n === 2) return 'second';
                  if (n === 3) return 'third';
                  if (n === 4) return 'fourth';
                  if (n === 5) return 'fifth';
                  return 'sixth';
                }
              }
              // If no degree in node, assume it's a first-degree connection (direct from customer)
              return 'first';
            })(),
            // Store numeric degree for filtering
            numericDegree: (function() {
              const cachedDeg = nodeDegreeMap[String(node.id)];
              const nodeDegree = cachedDeg !== undefined 
                    ? cachedDeg 
                    : (node.degree !== undefined && node.degree !== null ? node.degree : node.properties?.degree);
              if (nodeDegree !== undefined && nodeDegree !== null) {
                const n = Number(nodeDegree);
                if (!isNaN(n)) return n;
              }
              // Default to currentLevel string to avoid setting nodes to index 0 on chain-fetches
              return level > 0 ? level - 1 : 1;
            })(),
            edgeId: `${customerNodeId}-${node.id}`,
            edgeProperties: {}
          });
        }
      });

      return graphLinks;
    }

    // Handle the expected format: {nodes, edges}
    if (!graphData || !graphData.nodes || !graphData.edges) {
      return [];
    }

    // Calculate degree (distance from root customer) for each node using BFS
    const calculateNodeDegrees = (): Map<string, number> => {
      const nodeDegrees = new Map<string, number>();
      const adjacencyList = new Map<string, string[]>();

      // Build adjacency list
      graphData.edges.forEach((edge: any) => {
        if (!adjacencyList.has(edge.from)) adjacencyList.set(edge.from, []);
        if (!adjacencyList.has(edge.to)) adjacencyList.set(edge.to, []);
        adjacencyList.get(edge.from)!.push(edge.to);
        adjacencyList.get(edge.to)!.push(edge.from);
      });

      // Find the customer node by checking node properties for userid
      let rootNodeId = '';
      
      // First try to strictly match the main customer via degree 0 from API
      for (const node of graphData.nodes) {
        const d = node.degree !== undefined ? node.degree : node.properties?.degree;
        if (d === 0 || d === '0' || Number(d) === 0) {
          rootNodeId = node.id;
          break;
        }
      }

      // Fall back to strictly matching the main customer via userid or customerId comparison
      if (!rootNodeId) {
        for (const node of graphData.nodes) {
          const props = node.properties || {};
          const uid = props.userid || props.user_id;
          if (String(node.id) === String(customerId) || (uid && String(uid) === String(customerId))) {
            rootNodeId = node.id;
            break;
          }
        }
      }

      // If that fails, fall back to any Customer/Person node
      if (!rootNodeId) {
        for (const node of graphData.nodes) {
          if (node.label?.toLowerCase().includes('customer') || node.label?.toLowerCase().includes('person')) {
            rootNodeId = node.id;
            break;
          }
        }
      }

      if (!rootNodeId) {
        return nodeDegrees;
      }

      // BFS to calculate distances
      const queue: Array<{ nodeId: string, distance: number }> = [{ nodeId: rootNodeId, distance: 0 }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { nodeId, distance } = queue.shift()!;

        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        nodeDegrees.set(nodeId, distance);

        const neighbors = adjacencyList.get(nodeId) || [];
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            queue.push({ nodeId: neighborId, distance: distance + 1 });
          }
        });
      }

      return nodeDegrees;
    };

    const nodeDegrees = calculateNodeDegrees();

    const graphLinks: any[] = [];
    const nodeMap = new Map<string, any>();

    // Helper function to determine node type from label
    const getNodeTypeFromLabel = (label: string): string => {
      const labelLower = label?.toLowerCase() || '';

      // Match against all possible node types
      if (labelLower.includes('customer') || labelLower.includes('person')) return 'CUSTOMER';
      if (labelLower.includes('gov_id') || labelLower.includes('govid')) return 'GOV_ID';
      if (labelLower.includes('phone')) return 'PHONE';
      if (labelLower.includes('email')) return 'EMAIL';
      if (labelLower.includes('reference') || labelLower.includes('contact')) return 'REFERENCE_CONTACT';
      if (labelLower.includes('address')) return 'ADDRESS';
      if (labelLower.includes('pincode')) return 'PINCODE';
      if (labelLower.includes('geo') || labelLower.includes('location')) return 'GEOLOCATION';
      if (labelLower.includes('device')) return 'DEVICE';
      if (labelLower.includes('bank_account') || (labelLower.includes('bank') && labelLower.includes('account'))) return 'BANK_ACCOUNT';
      if (labelLower.includes('upi') || labelLower.includes('vpa')) return 'UPI_VPA';
      if (labelLower.includes('bank_branch') || (labelLower.includes('bank') && labelLower.includes('branch'))) return 'BANK_BRANCH';
      if (labelLower.includes('merchant')) return 'MERCHANT';

      // Default to the label itself if no match
      return label || 'UNKNOWN';
    };

    // Helper to get display name from node
    const getNodeDisplayName = (node: any): string => {
      const props = node.properties || {};
      const label = node.label || '';

      // For CUSTOMER nodes, prioritize customer_name or basic_details_name
      if (label.includes('CUSTOMER') || label.includes('PERSON')) {
        const customerName = props.customer_name ||
          props.basic_details_name ||
          props.firstName ||
          props.lastName ||
          props.name ||
          props.userid ||
          props.id ||
          node.id;
        
        return customerName;
      }

      // For GOV_ID nodes, return the gov_id_value
      if (label.includes('GOV_ID')) {
        return props.gov_id_value || props.value || 'Gov ID';
      }

      return props.userid ||
        props.email ||
        props.phone ||
        props.address_full ||
        props.pincode ||
        props.firstName ||
        props.name ||
        props.value ||
        node.label ||
        node.id;
    };

    // Helper to get short display name for graph (just key info, not full details)
    const getNodeShortName = (node: any): string => {
      const props = node.properties || {};
      const label = node.label || '';

      // Helper to clean numeric values (remove .0 decimal points)
      const cleanNumeric = (value: any): string => {
        if (!value) return '';

        // Convert to string first
        const strValue = value.toString();

        // If it's a number or string representation of a number with .0, remove the decimal
        if (typeof value === 'number' || strValue.includes('.')) {
          const numValue = parseFloat(strValue);
          if (!isNaN(numValue) && numValue % 1 === 0) {
            // It's a whole number, return without decimal
            return Math.floor(numValue).toString();
          }
        }

        return strValue;
      };

      // For different node types, show appropriate short name
      if (label.includes('GOV_ID')) {
        // Extract last 4 digits for AADHAAR, first 4 for others
        const govIdValue = props.gov_id_value || props.value || '';
        const govIdType = props.gov_id_type || '';

        let displayValue: string;
        if (govIdType.toUpperCase().includes('AADHAAR')) {
          // Get last 4 digits for AADHAAR
          const last4Digits = govIdValue.toString().slice(-4);
          displayValue = last4Digits;
        } else {
          // Get first 4 digits for other types
          const first4Digits = govIdValue.toString().substring(0, 4);
          displayValue = first4Digits;
        }

        // Get the gov ID type (PAN, AADHAAR, etc.) and format as TYPE(digits)
        const idType = govIdType || 'GOV_ID';
        return displayValue ? `${idType.toUpperCase()}(${displayValue})` : idType.toUpperCase();
      } else if (label.includes('CUSTOMER') || label.includes('PERSON')) {
        const userid = cleanNumeric(props.userid) || props.firstName || props.name || 'Customer';
        // Show full userid for CUSTOMER nodes in connections
        return userid;
      } else if (label.includes('EMAIL')) {
        // Show just 'Email' for brevity in graph, not full email address
        return 'EMAIL';
      } else if (label.includes('PHONE')) {
        const telephoneCategory = getTelephoneCategory(props.telephone_type);
        const country = props.country || '';
        const countryDisplay = country ? `, ${country}` : '';
        return `${telephoneCategory}${countryDisplay}`;
      } else if (label.includes('REFERENCE') || label.includes('CONTACT')) {
        const name = props.name || props.contactName || 'Reference Contact';
        const mobile = props.mobile || props.phone_number || props.phone || '';
        const mobileDisplay = mobile ? `, +91-${cleanNumeric(mobile)}` : '';
        return `REFERENCE (${name}${mobileDisplay})`;
      } else if (label.includes('ADDRESS')) {
        // Show address category label with city information
        let addressDisplay = '';

        // Get the category/type of address
        if (props.address_category_label) {
          addressDisplay = props.address_category_label;
        } else if (props.category) {
          addressDisplay = props.category;
        } else if (props.address_type) {
          addressDisplay = props.address_type;
        } else if (props.type) {
          addressDisplay = props.type;
        }

        // Add city if available
        if (props.city && addressDisplay) {
          addressDisplay += `, ${props.city}`;
        } else if (props.city) {
          addressDisplay = props.city;
        } else if (props.pincode) {
          addressDisplay = cleanNumeric(props.pincode);
        } else if (addressDisplay) {
          // addressDisplay already has value, use it as is
        } else {
          addressDisplay = 'Address';
        }

        return addressDisplay;
      } else if (label.includes('PINCODE')) {
        return cleanNumeric(props.pincode) || 'Pincode';
      } else if (label.includes('GEOLOCATION') || label.includes('LOCATION')) {
        const lat = props.lat || props.latitude || props.LATITUDE;
        const lon = props.lon || props.lng || props.longitude || props.LONGITUDE;

        if (lat && lon) {
          const latDisplay = Number(lat).toFixed(2);
          const lonDisplay = Number(lon).toFixed(2);
          return `LOCATION (${latDisplay}, ${lonDisplay})`;
        }
        return 'LOCATION';
      } else if (label.includes('DEVICE')) {
        // Extract first 4 digits of device ID
        const deviceId = props.device_id || node.id || '';
        const first4Digits = deviceId.toString().substring(0, 4);
        return first4Digits ? `DEVICE (${first4Digits})` : 'DEVICE';
      } else if (label.includes('BANK_ACCOUNT')) {
        return cleanNumeric(props.accountNumber || props.account_number) || 'Bank Account';
      } else if (label.includes('UPI') || label.includes('VPA')) {
        return props.vpa || props.upi_id || 'UPI VPA';
      } else if (label.includes('BANK_BRANCH')) {
        return props.branchName || props.branch_name || props.ifsc || 'Bank Branch';
      } else if (label.includes('MERCHANT')) {
        return props.merchantName || props.merchant_name || props.name || 'Merchant';
      }

      // Default: use label or first available property
      return props.name || props.value || label || 'Node';
    };

    // Build node map
    graphData.nodes.forEach((node: any) => {
      if (node && node.id) {
        const nodeType = getNodeTypeFromLabel(node.label);
        const nodeName = getNodeDisplayName(node);
        const shortName = getNodeShortName(node);

        nodeMap.set(node.id, {
          id: node.id,
          name: nodeName,
          shortName: shortName,
          type: nodeType,
          label: node.label,
          degree: node.degree,
          numericDegree: typeof node.degree === 'number' ? node.degree : (nodeDegrees.get(node.id) || 0),
          properties: (() => {
            const props = node.properties || {};
            // Extract branchCount from API response - check all possible locations
            let branchCount = node.branchCount ?? 
                              node.branch_count ?? 
                              props.branchCount ?? 
                              props.branch_count;
            
            // Convert to number if it's a string
            if (branchCount !== undefined && branchCount !== null) {
              if (typeof branchCount === 'string') {
                const parsed = parseInt(branchCount, 10);
                branchCount = isNaN(parsed) ? undefined : parsed;
              } else {
                branchCount = Number(branchCount);
                if (isNaN(branchCount)) branchCount = undefined;
              }
            }
            
            // Detect hasBranches flag from multiple possible locations
            const rawHasBranchesNode = node.hasBranches ?? node.has_branches ?? props.hasBranches ?? props.has_branches;
            const hasBranchesNode = ((): boolean => {
              if (rawHasBranchesNode === true) return true;
              if (typeof rawHasBranchesNode === 'number') return rawHasBranchesNode > 0;
              if (typeof rawHasBranchesNode === 'string') {
                const s = rawHasBranchesNode.trim().toLowerCase();
                return s === 'true' || s === '1';
              }
              return false;
            })();

            return {
              ...props,
              // Ensure branchCount is in properties
              branchCount: branchCount,
              branch_count: branchCount,
              // Preserve hasBranches flag if present in node or props
              hasBranches: hasBranchesNode,
              has_branches: hasBranchesNode
            };
          })()
        });
      }
    });

    // Process edges to create graph links
    graphData.edges.forEach((edge: any) => {
      if (edge && edge.from && edge.to) {
        const sourceNode = nodeMap.get(edge.from);
        const targetNode = nodeMap.get(edge.to);

        if (sourceNode && targetNode) {
          // Determine degree based on distance from customer or edge properties
          // Calculate as the maximum degree of the two nodes connected by this edge
          let numericDegree = 1;
          let degree = 'first';
          
          // First check if edge has degree property (from API)
          if (edge.properties?.degree !== undefined && edge.properties?.degree !== null) {
            const edgeDegreeNum = Number(edge.properties.degree);
            if (!isNaN(edgeDegreeNum)) {
              numericDegree = edgeDegreeNum;
            } else {
              // Try to parse named degree
              const edgeDegreeStr = String(edge.properties.degree).toLowerCase();
              if (edgeDegreeStr === 'first') numericDegree = 1;
              else if (edgeDegreeStr === 'second') numericDegree = 2;
              else if (edgeDegreeStr === 'third') numericDegree = 3;
              else if (edgeDegreeStr === 'fourth') numericDegree = 4;
              else if (edgeDegreeStr === 'fifth') numericDegree = 5;
              else if (edgeDegreeStr === 'sixth') numericDegree = 6;
            }
          } else if (edge.degree !== undefined && edge.degree !== null) {
            const edgeDegreeNum = Number(edge.degree);
            if (!isNaN(edgeDegreeNum)) {
              numericDegree = edgeDegreeNum;
            } else {
              // Try to parse named degree
              const edgeDegreeStr = String(edge.degree).toLowerCase();
              if (edgeDegreeStr === 'first') numericDegree = 1;
              else if (edgeDegreeStr === 'second') numericDegree = 2;
              else if (edgeDegreeStr === 'third') numericDegree = 3;
              else if (edgeDegreeStr === 'fourth') numericDegree = 4;
              else if (edgeDegreeStr === 'fifth') numericDegree = 5;
              else if (edgeDegreeStr === 'sixth') numericDegree = 6;
            }
          } else {
            // Calculate degree from node distances using BFS
            const fromDegree = nodeDegrees.get(edge.from) || 0;
            const toDegree = nodeDegrees.get(edge.to) || 0;
            numericDegree = Math.max(fromDegree, toDegree);
            // If both are 0, it means one is the root customer, so this is a first-degree connection
            if (numericDegree === 0) numericDegree = 1;
          }

          // Map numeric degree to named degree (supporting up to sixth)
          if (numericDegree <= 1) degree = 'first';
          else if (numericDegree === 2) degree = 'second';
          else if (numericDegree === 3) degree = 'third';
          else if (numericDegree === 4) degree = 'fourth';
          else if (numericDegree === 5) degree = 'fifth';
          else if (numericDegree >= 6) degree = 'sixth';

          graphLinks.push({
            source: edge.from,
            target: edge.to,
            sourceName: (sourceNode.label === 'CUSTOMER') ? `CUSTOMER (${sourceNode.shortName})` : ((sourceNode.label === 'LOCATION' || sourceNode.label === 'GEOLOCATION' || sourceNode.label === 'EMAIL' || sourceNode.label === 'DEVICE' || sourceNode.label === 'GOV_ID' || sourceNode.label === 'REFERENCE_CONTACT') ? sourceNode.shortName : `${sourceNode.label} (${sourceNode.shortName})`),
            targetName: (targetNode.label === 'LOCATION' || targetNode.label === 'GEOLOCATION' || targetNode.label === 'EMAIL' || targetNode.label === 'DEVICE' || targetNode.label === 'GOV_ID' || targetNode.label === 'REFERENCE_CONTACT') ? targetNode.shortName : `${targetNode.label} (${targetNode.shortName})`,
            sourceFullName: sourceNode.name, // Full name for details panel
            targetFullName: targetNode.name, // Full name for details panel
            sourceNode: sourceNode, // Full node data for details
            targetNode: targetNode, // Full node data for details
            sourceType: sourceNode.type,
            targetType: targetNode.type,
            label: edge.label || 'CONNECTED',
            risk: edge.properties?.risk || '',
            notes: edge.properties?.notes || '',
            degree: degree,
            numericDegree: numericDegree, // Store numeric degree for filtering
            edgeId: edge.id,
            edgeProperties: edge.properties || {}
          });
        }
      }
    });

    // EXPLICIT RULE: If no edges exist but we have nodes (especially customer node), create synthetic entry
    if (graphLinks.length === 0 && nodeMap.size > 0) {
      // Find the customer node
      const customerNode = Array.from(nodeMap.values()).find((node: any) => 
        node.type === 'CUSTOMER' || node.label === 'CUSTOMER'
      );
      
      if (customerNode) {
        // Use API-fetched name if available, otherwise use the formatted name from getNodeDisplayName
        const displayName = customerNameFromApi || customerNode.name;
        const userid = customerNode.shortName; // This is the CID
        
        // Ensure the customer node has userid and customer_name in properties for proper label formatting
        const enrichedCustomerNode = {
          ...customerNode,
          properties: {
            ...customerNode.properties,
            userid: userid, // The CID
            customer_name: displayName // The actual customer name
          }
        };
        
        graphLinks.push({
          source: customerNode.id,
          target: customerNode.id,
          sourceName: `${displayName}`,
          targetName: `${displayName}`,
          sourceFullName: displayName,
          targetFullName: displayName,
          sourceNode: enrichedCustomerNode,
          targetNode: enrichedCustomerNode,
          sourceType: 'CUSTOMER',
          targetType: 'CUSTOMER',
          label: 'SELF',
          risk: '',
          notes: '',
          degree: 'first',
          numericDegree: 0,
          edgeId: `${customerNode.id}-self`,
          edgeProperties: {},
          data: '', // No data for synthetic entries
          isSynthetic: true
        });
      }
    }
    
    // ULTIMATE FALLBACK: If still no graphLinks but nodeCount === 1, create synthetic entry from API nodes directly
    if (graphLinks.length === 0 && graphData.nodeCount === 1 && graphData.nodes && graphData.nodes.length > 0) {
      const apiNode = graphData.nodes[0];
      
      // Extract customer name and userid from API node
      const apiProps = apiNode.properties || {};
      const userid = apiProps.userid || apiNode.id;
      // Use API-fetched name if available, otherwise fall back to API node properties
      const customerName = customerNameFromApi ||
                          apiProps.customer_name || 
                          apiProps.basic_details_name || 
                          apiProps.firstName || 
                          apiProps.lastName ||
                          apiProps.name || 
                          userid;
      
      const nodeWithProperties = {
        id: apiNode.id,
        name: customerName,
        shortName: userid,
        type: 'CUSTOMER',
        label: apiNode.label || 'CUSTOMER',
        properties: {
          ...apiProps,
          userid: userid,
          customer_name: customerName
        }
      };
      
      graphLinks.push({
        source: apiNode.id,
        target: apiNode.id,
        sourceName: customerName,
        targetName: customerName,
        sourceFullName: customerName,
        targetFullName: customerName,
        sourceNode: nodeWithProperties,
        targetNode: nodeWithProperties,
        sourceType: 'CUSTOMER',
        targetType: 'CUSTOMER',
        label: 'SELF',
        risk: '',
        notes: '',
        degree: 'first',
        numericDegree: 0,
        edgeId: `${apiNode.id}-self`,
        edgeProperties: {},
        data: '', // No data for synthetic entries
        isSynthetic: true
      });
    }
    
    return graphLinks;
  }, [customerNameFromApi, nodeDegreeMap]);

  const transformNeptuneToGraphData = useMemo(() => {
    const dataToUse = neptuneData;

    if (!dataToUse || dataToUse.length === 0) {
      return [];
    }

    const graphRaw = dataToUse[0]; // API returns single object
    const graphData = (graphRaw && graphRaw.status === 'success' && graphRaw.data) ? graphRaw.data : graphRaw;
    const level = getNetworkDegreeFromSelection(selectedDegree);

    console.log('[transformNeptuneToGraphData] Received graphData:', {
      keys: graphData ? Object.keys(graphData) : null,
      resultsLength: graphData?.results?.length,
      nodesLength: graphData?.nodes?.length,
      edgesLength: graphData?.edges?.length,
      hasResults: !!graphData?.results,
      usedDegree: level - 1,
      fullData: graphData
    });

    // Check for error response from backend
    if (graphData && graphData.success === false) return [];

    console.log('[transformNeptuneToGraphData] Processing graphData via helper');
    return transformNeptuneGraphToLinks(graphData, level, customerId || '');
  }, [neptuneData, selectedDegree, customerId, transformNeptuneGraphToLinks]);

  // (Removed) Previous incremental multiple-users loans loading effect.

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  const handleHiddenNodesChange = useCallback((nodeId: string, isSelected: boolean) => {
    // Update selected for deletion (just visual, doesn't hide nodes yet)
    setSelectedForDeletion(prev => {
      return isSelected 
        ? [...prev, nodeId]
        : prev.filter(id => id !== nodeId);
    });
  }, []);

  // Ensure selectedNode is cleared when resetKey changes (safety measure to hide node details on reset)
  const prevResetKeyRef = useRef<number>(resetKey || 0);
  useEffect(() => {
    if (resetKey !== prevResetKeyRef.current && resetKey > 0) {
      setSelectedNode(null);
      prevResetKeyRef.current = resetKey;
    }
  }, [resetKey]);

  const handleResetGraph = useCallback(async () => {
    // Clear selected node to hide node details
    setSelectedNode(null);
    setFilteredData([]);
    setSelectEntityValues([]);
    // Clear selected for deletion and exit delete mode (but keep hidden nodes hidden)
    setIsDeleteMode(false);
    setSelectedForDeletion([]);
    // NOTE: Do NOT clear hiddenNodes - they should stay hidden even on reset

    // Clear IndexedDB Cache for this customer
    try {
      if (customerId) {
        const level = getNetworkDegreeFromSelection(selectedDegree);
        const bodyDegree = level - 1; 
        const cacheKey = `${customerId}::degree=${bodyDegree}::strong=${strongConnector}::v${FIXTURE_CACHE_VERSION}`;
        await clearGraphCache(cacheKey);
      } else {
        await clearGraphCache(); 
      }
    } catch (e) {
      console.warn('[handleResetGraph] Failed to clear IndexedDB cache:', e);
    }
    
    setNeptuneData([]); // Standard clearing
    setNeptuneError(null);
    
    // Preserve current degree/prune filter state when resetting the graph layout.
    // The reset should only clear node positions / selection, not change the
    // user's currently-selected degree toggles.
    // Clear saved node positions so the graph resets to initial layout
    if (customerId) {
      // Clear memory cache for all degrees for this customer
      for (let d = 0; d <= 6; d++) {
        setCachedNeptuneData(customerId, [], null, d);
      }

      // Clear saved node positions so the graph resets to initial layout
      clearNodePositions(customerId);
      // Update local state to show "YES" for strong connectors
      setStrongConnector(true);
      // NOTE: Do NOT clear hidden nodes from store - they should stay hidden
      // Persist current filter state (forcing strongConnector to true)
      setGraphState(customerId, { selectedDegree, pruneLowDegreeNodes, strongConnector: true, isDeleteMode: false });
    }
    // Increment resetKey to trigger graph refresh and filter reset
    setResetKey(prev => prev + 1);
    setExtraPaginatedLinks([]);
    setNodeDegreeMap({});
  }, [customerId, clearNodePositions, setGraphState, selectedDegree, pruneLowDegreeNodes, strongConnector, setCachedNeptuneData]);

  // Function to combine communities based on degree selection
  // Behaviour:
  // - First degree filter toggle -> nodes with degree = 0,1
  // - Second degree filter toggle -> nodes with degree = 0,1,2
  // - Third degree filter toggle -> nodes with degree = 0,1,2,3
  // - Fourth degree filter toggle -> nodes with degree = 0,1,2,3,4
  // - Fifth degree filter toggle -> nodes with degree = 0,1,2,3,4,5
  // - Sixth degree filter toggle -> nodes with degree = 0,1,2,3,4,5,6
  const getCombinedRiskIntelligenceData = useMemo(() => {
    // Only blank the canvas when we genuinely have nothing to draw.
    // The degree fetch is a sequential chain (d = 0..bodyDegree) and a failure at
    // any single hop sets neptuneError + breaks the loop. Previously that threw
    // away every degree that HAD loaded, which is why high degrees (5th/6th, the
    // longest chains) rendered an empty graph while lower degrees worked.
    // Partial data is strictly better than no data: render what resolved and let
    // the error surface as a non-blocking banner.
    if (transformNeptuneToGraphData.length === 0 && (neptuneError || isLoadingNeptune)) {
      return [];
    }

    // Prefer Neptune data if available and not loading
    if (transformNeptuneToGraphData.length > 0) {
      console.log('[getCombinedRiskIntelligenceData] Input transformNeptuneToGraphData:', {
        length: transformNeptuneToGraphData.length,
        firstItem: transformNeptuneToGraphData[0],
        hasSynthetic: transformNeptuneToGraphData.some((item: any) => item.isSynthetic === true)
      });
      
      // If no degree selected, default to showing all (sixth degree)
      if (selectedDegree.length === 0) {
        console.log('[getCombinedRiskIntelligenceData] No degree selected, returning all data');
        return transformNeptuneToGraphData;
      }

      // Determine highest selected degree and include all degrees up to it (0 to max)
      const rankMap: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
      let maxRank = 0;
      selectedDegree.forEach(d => {
        const r = rankMap[d] || 0;
        if (r > maxRank) maxRank = r;
      });
      
      // If no valid degree selected, default to sixth (show all)
      if (maxRank === 0) maxRank = 6;

      // Filter by numeric degree: include degrees 0 through maxRank
  console.log('[getCombinedRiskIntelligenceData] Applying degree filter, maxRank:', maxRank);
  let filtered = transformNeptuneToGraphData.filter(item => {
        // Get numeric degree from item
        let itemNumericDegree: number;
        
        // EXPLICIT RULE: NEVER filter out synthetic single-node entries
        if (item.isSynthetic === true && item.source === item.target) {
          console.log('[getCombinedRiskIntelligenceData] Synthetic entry passed degree filter:', item);
          return true;
        }
        
        if (item.numericDegree !== undefined && item.numericDegree !== null) {
          // Use stored numeric degree if available
          itemNumericDegree = Number(item.numericDegree);
        } else {
          // Fallback: convert named degree to numeric
          const normalizeDegree = (d: any): number => {
            if (d === undefined || d === null) return 1;
            // If numeric, use it directly
            const num = Number(d);
            if (!isNaN(num) && num >= 0) return num;
            // Otherwise treat as string name and convert
            const str = String(d).toLowerCase();
            if (str === 'first') return 1;
            if (str === 'second') return 2;
            if (str === 'third') return 3;
            if (str === 'fourth') return 4;
            if (str === 'fifth') return 5;
            if (str === 'sixth') return 6;
            return 1; // default
          };
          itemNumericDegree = normalizeDegree(item.degree);
        }

        // Include if degree is 0 or within the selected range (0 to maxRank)
        return itemNumericDegree >= 0 && itemNumericDegree <= maxRank;
      });

      // If user selected nodes in the Nodes dropdown, hide any links that reference those nodes
      try {
        const hiddenNodeIds = new Set((selectEntityValues || []).map(String));
        if (hiddenNodeIds.size > 0) {
          filtered = filtered.filter(item => {
            // EXPLICIT RULE: NEVER filter out synthetic single-node entries
            if (item.isSynthetic === true && item.source === item.target) {
              return true;
            }
            const s = String(item.source);
            const t = String(item.target);
            return !hiddenNodeIds.has(s) && !hiddenNodeIds.has(t);
          });
        }
      } catch (e) {
        // ignore any runtime errors and fall back to filtered result
      }

      console.log('[getCombinedRiskIntelligenceData] Final filtered output:', {
        length: filtered.length,
        firstItem: filtered[0],
        hasSynthetic: filtered.some((item: any) => item.isSynthetic === true)
      });
      return filtered;
    }

    // Don't fallback to sample data - return empty array if no Neptune data
    return [];
  }, [customerId, selectedDegree, transformNeptuneToGraphData, isLoadingNeptune, neptuneError, selectEntityValues]);

  // Helper function to check if a string looks like JSON (should be filtered out)
  const isJsonLikeString = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    // Check for JSON-like patterns: brackets, escaped quotes, backslashes, etc.
    return (
      (trimmed.startsWith('[') && trimmed.includes(']')) ||
      (trimmed.startsWith('{') && trimmed.includes('}')) ||
      trimmed.includes('\\"') ||
      trimmed.includes('\\\'') ||
      (trimmed.includes('"') && (trimmed.includes('[') || trimmed.includes('{'))) ||
      trimmed.includes('\\\\')
    );
  };

  // Helper function to parse source JSON string and extract type values
  const parseSourceTypes = (sourceValue: any): string[] => {
    if (!sourceValue) return [];
    
    try {
      // If it's already an array, use it directly
      if (Array.isArray(sourceValue)) {
        return sourceValue
          .map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.type || item;
            }
            return item;
          })
          .filter(Boolean)
          .map(String)
          .filter(type => !isJsonLikeString(type)); // Filter out JSON-like strings
      }
      
      // If it's a string, try to parse it as JSON
      if (typeof sourceValue === 'string') {
        const trimmed = sourceValue.trim();
        if (!trimmed) return [];
        
        // Handle escaped JSON strings (double-escaped)
        // First, try to unquote if it's a quoted string
        let stringToParse = trimmed;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          try {
            stringToParse = JSON.parse(trimmed);
            // If it's still a string after unquoting, continue parsing
            if (typeof stringToParse === 'string') {
              // Try parsing again if it looks like JSON
              if ((stringToParse.startsWith('[') && stringToParse.endsWith(']')) || 
                  (stringToParse.startsWith('{') && stringToParse.endsWith('}'))) {
                try {
                  const parsed = JSON.parse(stringToParse);
                  if (Array.isArray(parsed)) {
                    return parsed
                      .map(item => {
                        if (typeof item === 'object' && item !== null) {
                          return item.type || item;
                        }
                        return item;
                      })
                      .filter(Boolean)
                      .map(String)
                      .filter(type => !isJsonLikeString(type)); // Filter out JSON-like strings
                  } else if (typeof parsed === 'object' && parsed !== null) {
                    const typeValue = parsed.type ? String(parsed.type) : null;
                    if (typeValue && !isJsonLikeString(typeValue)) {
                      return [typeValue];
                    }
                    return [];
                  }
                } catch {
                  // Continue to next attempt
                }
              }
            }
          } catch {
            // If unquoting fails, continue with original string
            stringToParse = trimmed;
          }
        }
        
        // Try to parse as JSON if it looks like JSON (array or object)
        if ((stringToParse.startsWith('[') && stringToParse.endsWith(']')) || 
            (stringToParse.startsWith('{') && stringToParse.endsWith('}'))) {
          try {
            const parsed = JSON.parse(stringToParse);
            if (Array.isArray(parsed)) {
              return parsed
                .map(item => {
                  if (typeof item === 'object' && item !== null) {
                    return item.type || item;
                  }
                  return item;
                })
                .filter(Boolean)
                .map(String)
                .filter(type => !isJsonLikeString(type)); // Filter out JSON-like strings
            } else if (typeof parsed === 'object' && parsed !== null) {
              const typeValue = parsed.type ? String(parsed.type) : null;
              if (typeValue && !isJsonLikeString(typeValue)) {
                return [typeValue];
              }
              return [];
            }
          } catch (parseError) {
            // If JSON parsing fails, continue to try other methods
            console.warn('Failed to parse source JSON:', parseError, 'Value:', stringToParse);
          }
        }
        
        // If it's a plain string (not JSON), check if it's JSON-like before returning
        if (!isJsonLikeString(trimmed)) {
          return [trimmed];
        }
        // If it's JSON-like but couldn't be parsed, return empty array
        return [];
      }
      
      // If it's an object, extract type
      if (typeof sourceValue === 'object' && sourceValue !== null) {
        if (Array.isArray(sourceValue)) {
          return sourceValue
            .map(item => {
              if (typeof item === 'object' && item !== null) {
                return item.type || item;
              }
              return item;
            })
            .filter(Boolean)
            .map(String)
            .filter(type => !isJsonLikeString(type)); // Filter out JSON-like strings
        }
        const typeValue = sourceValue.type ? String(sourceValue.type) : null;
        if (typeValue && !isJsonLikeString(typeValue)) {
          return [typeValue];
        }
        return [];
      }
    } catch (e) {
      // If parsing fails, don't return raw JSON strings
      console.warn('Error parsing source types:', e, 'Value:', sourceValue);
      // Check if the stringified value is JSON-like, if so return empty array
      const stringValue = String(sourceValue);
      if (isJsonLikeString(stringValue)) {
        return [];
      }
      // Only return non-JSON-like strings
      return [stringValue];
    }
    
    return [];
  };

  // Memoize filter change handlers to prevent unnecessary re-renders
  const handleDegreeFilterChange = useCallback((values: string[]) => {
    setSelectedDegree(values);
    // Save to store for persistence
    if (customerId) {
      setGraphState(customerId, { selectedDegree: values });
    }
    // Clear extended linkages when degree changes - use separate key to avoid resetting filters
    setClearExpandedDataKey(prev => prev + 1);
    // Do not clear extraPaginatedLinks here to allow higher-degree fetches to carry forward expanding nodes
  }, [customerId, setGraphState]);

  const handleStrongConnectorChange = useCallback((value: boolean) => {
    setStrongConnector(value);
  }, []);

  // Persist strongConnector to the store after local state has updated.
  // Writing to the store during render can cause the "Cannot update a component while rendering"
  // React error, so we perform the save in an effect instead.
  useEffect(() => {
    if (!customerId) return;
    // Persist the tri-state (true / false / null) for this customer
    setGraphState(customerId, { strongConnector });
  }, [customerId, strongConnector, setGraphState]);

  // Helper function to apply pruneLowDegreeNodes filter (same logic as useEntityGraphFilteredData)
  const applyPruneFilter = useCallback((data: any[], fullDataForBranchCount?: any[]): any[] => {
    if (!pruneLowDegreeNodes || data.length === 0) {
      return data;
    }

    // Determine max selected degree level
    const rankMap: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
    let maxSelectedLevel = 0;
    selectedDegree.forEach(d => {
      const r = rankMap[d] || 0;
      if (r > maxSelectedLevel) maxSelectedLevel = r;
    });
    
    if (maxSelectedLevel === 0) maxSelectedLevel = 6; // Default to 6 if no degree selected

    // Handle first degree + Hide Non-Branching Nodes = Yes: show customer node + nodes with branchCount > 0
    if (pruneLowDegreeNodes && maxSelectedLevel === 1) {
      // Build a map of branchCount values from API (prefer API value, fallback to calculated count)
      const nodeBranchCounts = new Map<string, number>();
      const nodeLinkCounts = new Map<string, number>();
      const dataForBranchCount = fullDataForBranchCount || data;
      
      // First, try to get branchCount from API (check both node object and properties)
      dataForBranchCount.forEach((item: any) => {
        const sourceId = String(item.source);
        const targetId = String(item.target);
        
        // Get branchCount from API if available - check all possible locations
        const sourceBranchCount = item.sourceNode?.branchCount ?? 
                                   item.sourceNode?.branch_count ?? 
                                   item.sourceNode?.properties?.branchCount ?? 
                                   item.sourceNode?.properties?.branch_count;
        const targetBranchCount = item.targetNode?.branchCount ?? 
                                  item.targetNode?.branch_count ?? 
                                  item.targetNode?.properties?.branchCount ?? 
                                  item.targetNode?.properties?.branch_count;
        
        if (sourceBranchCount !== undefined && sourceBranchCount !== null && !nodeBranchCounts.has(sourceId)) {
          const numValue = Number(sourceBranchCount);
          if (!isNaN(numValue)) {
            nodeBranchCounts.set(sourceId, numValue);
          }
        }
        if (targetBranchCount !== undefined && targetBranchCount !== null && !nodeBranchCounts.has(targetId)) {
          const numValue = Number(targetBranchCount);
          if (!isNaN(numValue)) {
            nodeBranchCounts.set(targetId, numValue);
          }
        }
        
        // Also count linkages for fallback calculation
        nodeLinkCounts.set(sourceId, (nodeLinkCounts.get(sourceId) || 0) + 1);
        nodeLinkCounts.set(targetId, (nodeLinkCounts.get(targetId) || 0) + 1);
      });
      
      // Fallback: use calculated count if API value not available (no -1 adjustment)
      nodeLinkCounts.forEach((count, nodeId) => {
        if (!nodeBranchCounts.has(nodeId)) {
          nodeBranchCounts.set(nodeId, count);
        }
      });

      // Filter to keep links that show:
      // 1. Customer node (parent node) - links where source or target is customer
  // 2. Links from customer to nodes with branchCount > 0
  // 3. Links between nodes with branchCount > 0 (if they exist in first degree)
  // Use API branchCount value directly (no -1 adjustment, show if > 0)
  return data.filter(item => {
        const sourceId = String(item.source);
        const targetId = String(item.target);
        const sourceType = item.sourceType;
        const targetType = item.targetType;
        
        // Check if source or target is customer node
        const sourceIsCustomer = sourceType?.toLowerCase().includes('customer') || sourceType?.toLowerCase().includes('person');
        const targetIsCustomer = targetType?.toLowerCase().includes('customer') || targetType?.toLowerCase().includes('person');
        
        // Get branchCount for source and target (use API value directly, no -1)
        const sourceBranchCount = nodeBranchCounts.get(sourceId) ?? 0;
        const targetBranchCount = nodeBranchCounts.get(targetId) ?? 0;
        
   // Keep link if:
   // 1. Source is customer AND target has branchCount > 0 (customer to any branching node)
   // 2. Target is customer AND source has branchCount > 0 (any branching node to customer)
   // 3. Both source and target have branchCount > 0 (connected branching nodes in first degree)
   return (sourceIsCustomer && targetBranchCount > 0) || 
     (targetIsCustomer && sourceBranchCount > 0) || 
     (sourceBranchCount > 0 && targetBranchCount > 0);
      });
    } else if (pruneLowDegreeNodes && maxSelectedLevel >= 2) {
      // Compute degree counts for each node id
      const degreeMap: Map<string, number> = new Map();
      const nodeTypeMap: Map<string, string> = new Map();
      const isRootCustomerMap: Map<string, boolean> = new Map();

      data.forEach(item => {
        const sourceId = String(item.source);
        const targetId = String(item.target);
        const sourceType = item.sourceType;
        const targetType = item.targetType;

        degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
        degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
        nodeTypeMap.set(sourceId, sourceType);
        nodeTypeMap.set(targetId, targetType);

        // Identify root customer
        if (item.sourceName && item.sourceName.startsWith('CUSTOMER (')) {
          isRootCustomerMap.set(sourceId, true);
        }
        if (item.targetName && item.targetName.startsWith('CUSTOMER (')) {
          isRootCustomerMap.set(targetId, true);
        }
      });

      // Build set of nodes to remove depending on the selected degree semantics
      // - For second degree: remove leaf nodes (degree === 1)
      // - For third+ degree: remove nodes with degree <= 2
      const nodesToRemove = new Set<string>();
      if (maxSelectedLevel === 2) {
        degreeMap.forEach((count, id) => {
          const nodeType = nodeTypeMap.get(id);
          const isRootCustomer = isRootCustomerMap.get(id);
          // prune leaf nodes (count <= 1) but keep CUSTOMER/root
          if (count <= 1 && nodeType !== 'CUSTOMER' && !isRootCustomer) {
            nodesToRemove.add(id);
          }
        });
      } else {
        // maxSelectedLevel >= 3
        degreeMap.forEach((count, id) => {
          const nodeType = nodeTypeMap.get(id);
          const isRootCustomer = isRootCustomerMap.get(id);
          if (count <= 2 && nodeType !== 'CUSTOMER' && !isRootCustomer) {
            nodesToRemove.add(id);
          }
        });
      }

      if (nodesToRemove.size > 0) {
        // Remove any link that references a pruned node
        return data.filter(item => {
          const sourceId = String(item.source);
          const targetId = String(item.target);
          return !nodesToRemove.has(sourceId) && !nodesToRemove.has(targetId);
        });
      }
    }

    return data;
  }, [pruneLowDegreeNodes, selectedDegree]);

  // Filter groups configuration
  const filterGroups: FilterGroupsState = useMemo(() => {
    // Helper to format node label for the Nodes dropdown to match graph icon labels
    const formatNodeOptionLabel = (node: any, fallback?: string) => {
      if (!node) return fallback || '';
      const typeRaw = String(node.type || node.label || '').toUpperCase();
      const props = node.properties || {};
      const pick = (...keys: string[]) => {
        for (const k of keys) {
          if (props[k] !== undefined && props[k] !== null && props[k] !== '') return String(props[k]);
          if ((node as any)[k] !== undefined && (node as any)[k] !== null && (node as any)[k] !== '') return String((node as any)[k]);
        }
        return '';
      };

      if (typeRaw.includes('CUSTOMER') || typeRaw.includes('PERSON')) {
        const customerName = pick('customer_name', 'name', 'basic_details_name') || '';
        const userid = pick('userid', 'user_id') || '';
        if (customerName && userid) return `${customerName}(${userid})`;
        if (customerName) return customerName;
        if (userid) return `(${userid})`;
        return fallback || '';
      }

      if (typeRaw.includes('PHONE')) {
        const phoneNumber = pick('phone_number', 'telephone', 'telephone_number', 'number') || '';
        if (phoneNumber) return `PHONE (${phoneNumber})`;
        return fallback || 'PHONE';
      }

      if (typeRaw.includes('DEVICE')) {
        const deviceId = pick('device_id', 'deviceId', 'id') || '';
        if (deviceId) return `DEVICE (${deviceId})`;
        return fallback || 'DEVICE';
      }

      if (typeRaw.includes('EMAIL')) {
        const email = pick('email', 'email_address', 'address') || '';
        if (email) return `EMAIL (${email})`;
        return fallback || 'EMAIL';
      }

      if (typeRaw.includes('BANK_ACCOUNT')) {
        const accountNo = pick('account_no', 'account_number') || '';
        if (accountNo) return `BANK_ACCOUNT (${accountNo})`;
        return fallback || 'BANK_ACCOUNT';
      }

      if (typeRaw.includes('UPI') || typeRaw.includes('VPA')) {
        const upiId = pick('upi_id', 'upi_vpa', 'vpa') || '';
        if (upiId) return `UPI (${upiId})`;
        return fallback || 'UPI';
      }

      if (typeRaw.includes('GEOLOCATION') || typeRaw.includes('LOCATION') || typeRaw.includes('ADDRESS')) {
        const city = pick('city', 'address_city', 'city_name', 'locality', 'town') || '';
        if (city) return `LOCATION (${city})`;
        return fallback || 'LOCATION';
      }

      if (typeRaw.includes('GOV_ID') || typeRaw.includes('GOVID')) {
        const govIdType = pick('gov_id_type', 'id_type') || '';
        const govIdValue = pick('gov_id_value', 'id_value', 'value') || '';
        if (govIdType && govIdValue) return `${govIdType}(${govIdValue})`;
        if (govIdValue) return govIdValue;
        if (govIdType) return govIdType;
        return fallback || '';
      }

      // Generic fallback: try to show a useful value
      const genericVal = pick('value', 'label', 'name') || node.name || fallback || '';
      if (genericVal) {
        // Show as LABEL (value)
        const labelText = (node.label || typeRaw || '').replace(/_/g, ' ');
        return `${labelText} (${genericVal})`;
      }

      return fallback || '';
    };
    const uniqueNodeTypes = new Set<string>();
    const uniqueSourceCategories = new Set<string>();
    const uniqueGovIdTypes = new Set<string>();

    // graphDataToUse already has degree filtering applied via getCombinedRiskIntelligenceData
    const graphDataToUse = getCombinedRiskIntelligenceData.length > 0 
      ? getCombinedRiskIntelligenceData 
      : transformNeptuneToGraphData;

  // Apply pruning state to reflect the nodes that WOULD be visible on the graph
  // IMPORTANT: Use graphDataToUse (input data with degree filter already applied) instead of visibleLinks/filteredData to avoid circular dependency
  // The filterGroups will be recomputed when the input data or filter settings change, not when filteredData changes
  // This breaks the circular dependency: filterGroups -> EntityGraph -> filteredData -> filterGroups
    const expansionLinks = [
      ...(Array.isArray(expandedLinksData) ? expandedLinksData : []),
      ...(Array.isArray(extraPaginatedLinks) ? extraPaginatedLinks : [])
    ];
  const fullDataForBranchCount = [...transformNeptuneToGraphData, ...expansionLinks];
  const prunedGraphData = applyPruneFilter(graphDataToUse, fullDataForBranchCount);

    const getLinkNumericDegree = (link: any): number => {
      if (!link) return 1;
      if (link.numericDegree !== undefined && link.numericDegree !== null) {
        const numeric = Number(link.numericDegree);
        if (!isNaN(numeric)) return numeric;
      }

      if (link.degree !== undefined && link.degree !== null) {
        const degreeValue = link.degree;
        if (typeof degreeValue === 'number' && !isNaN(degreeValue)) {
          return degreeValue;
        }
        const degreeStr = String(degreeValue).toLowerCase();
        if (degreeStr === 'first' || degreeStr === '1st') return 1;
        if (degreeStr === 'second' || degreeStr === '2nd') return 2;
        if (degreeStr === 'third' || degreeStr === '3rd') return 3;
        if (degreeStr === 'fourth' || degreeStr === '4th') return 4;
        if (degreeStr === 'fifth' || degreeStr === '5th') return 5;
        if (degreeStr === 'sixth' || degreeStr === '6th') return 6;
        const parsed = Number(degreeValue);
        if (!isNaN(parsed)) return parsed;
      }

      return 1;
    };


    // Collect node types from the actual visible/filtered data shown on the graph
    // Include expanded linkages so node types from extended nodes appear in the dropdown
    // Use prunedGraphData when pruning is enabled, otherwise use graphDataToUse (which already has degree filtering)
    // Combine with expandedLinksData to include node types from expanded linkages
    const baseDataForNodeTypes = pruneLowDegreeNodes && prunedGraphData.length > 0
      ? prunedGraphData 
      : graphDataToUse;
    
    // Combine base data with expanded linkages to include all visible node types
    let dataForNodeTypes = expansionLinks.length > 0
      ? [...baseDataForNodeTypes, ...expansionLinks]
      : [...baseDataForNodeTypes];

    // Apply strong connector filter to dataForNodeTypes so dropdown options reflect visible graph
    // When Yes: only show strong connectors
    if (strongConnector === true) {
      dataForNodeTypes = dataForNodeTypes.filter((item: any) => {
        const type = item.edgeProperties?.connection_type || 'strong_connector';
        return type !== 'weak_connector';
      });
    }
    // When No: show both strong and weak connectors (no filter)

    // Build node types from the FULL graph data (all degrees) so the dropdown
    // shows types present anywhere in the dataset, not only those in the
    // currently visible/pruned/first-degree subset.
    let nodeTypesSource = [] as any[];
    if (Array.isArray(transformNeptuneToGraphData) && transformNeptuneToGraphData.length > 0) {
      nodeTypesSource = nodeTypesSource.concat(transformNeptuneToGraphData);
    }
    if (Array.isArray(expansionLinks) && expansionLinks.length > 0) {
      nodeTypesSource = nodeTypesSource.concat(expansionLinks);
    }

    if (nodeTypesSource.length > 0) {
      const addNodeType = (type?: string | null) => {
        if (!type) return;
        const normalized = String(type).trim();
        if (!normalized) return;
        uniqueNodeTypes.add(normalized);
      };

      nodeTypesSource.forEach(link => {
        addNodeType(link.sourceType);
        addNodeType(link.targetType);
        addNodeType(link.sourceNode?.type);
        addNodeType(link.targetNode?.type);
      });
    }

    const dataForGovIdTypes = dataForNodeTypes;

    // Collect source categories from visible data (respecting all filters)
    // Extract sources the same way graph edge labels are computed:
    // 1. Use parseEdgeSources on link.data and link.edgeProperties?.source (primary)
    // 2. Fallback to node properties source (same as EntityGraph line 3217)
    if (dataForNodeTypes.length > 0) {
      dataForNodeTypes.forEach(link => {
        // Primary: Use parseEdgeSources on edgeProperties.data (if present) or link.data, and edgeProperties.source
        let displaySource = parseEdgeSources(link.edgeProperties?.data || link.data, link.edgeProperties?.source);

        // Fallback: If no displaySource, prefer edgeProperties.source then node properties
        if (!displaySource) {
          const sourceValue = link.edgeProperties?.source ||
                             link.targetNode?.properties?.source || 
                             link.sourceNode?.properties?.source;
          if (sourceValue) {
            displaySource = parseEdgeSources(null, sourceValue);
          }
        }
        
        if (displaySource) {
          // Split by comma since parseEdgeSources returns comma-separated sources
          displaySource.split(',').forEach((src: string) => {
            const trimmed = src.trim();
            if (trimmed && !trimmed.startsWith('[') && !trimmed.startsWith('{')) {
              uniqueSourceCategories.add(trimmed);
            }
          });
        }
      });
    }

    const extractAndNormalizeGovIdType = (govIdType: any): string | null => {
      if (!govIdType && govIdType !== 0) return null;
      const str = String(govIdType).trim();
      if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return null;
      return str.toUpperCase();
    };

    // Collect GOV ID types from all visible data (not just first degree)
    if (dataForGovIdTypes.length > 0) {
      const inferGovIdTypeFromValue = (val: any): string | null => {
        if (!val && val !== 0) return null;
        const s = String(val).trim();
        if (!s) return null;
        // PAN: 5 letters, 4 digits, 1 letter (example: ABCDE1234F)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
        if (panRegex.test(s)) return 'PAN';
        // Aadhaar: 12 digits
        const aadhaarRegex = /^\d{12}$/;
        if (aadhaarRegex.test(s)) return 'AADHAAR';
        return null;
      };

      const addGovIdTypeForNode = (node?: any) => {
        if (!node) return;
        const props = node.properties || {};

        // Explicit property keys to check (existing and alternative names)
        const possibleTypeKeys = [
          props.gov_id_type,
          props.id_type,
          props.type,
          props.govIdType,
          props.idType
        ];

        for (const k of possibleTypeKeys) {
          const normalized = extractAndNormalizeGovIdType(k);
          if (normalized) {
            uniqueGovIdTypes.add(normalized);
            return;
          }
        }

        // Check label / name for hints (e.g., 'PAN', 'GOV_ID:PAN')
        if (node.label) {
          const labelUp = String(node.label).toUpperCase();
          // If label contains 'PAN' or other known types, use that
          if (labelUp.includes('PAN')) { uniqueGovIdTypes.add('PAN'); return; }
          if (labelUp.includes('AADHAAR') || labelUp.includes('AADHAR')) { uniqueGovIdTypes.add('AADHAAR'); return; }
        }

        // Try to infer from gov id value property
        const possibleValueKeys = [props.gov_id_value, props.value, props.id_value, props.idValue, node.name, node.id];
        for (const v of possibleValueKeys) {
          const inferred = inferGovIdTypeFromValue(v);
          if (inferred) {
            uniqueGovIdTypes.add(inferred);
            return;
          }
        }
      };

      dataForGovIdTypes.forEach(link => {
        addGovIdTypeForNode(link.sourceNode);
        addGovIdTypeForNode(link.targetNode);
      });
    }

    // Convert to options arrays and filter out MERCHANT, CUSTOMER, and GOV_ID types
    const nodeTypeOptions = Array.from(uniqueNodeTypes)
      .filter(type => type !== 'MERCHANT' && type !== 'CUSTOMER' && type !== 'GOV_ID')
      .sort()
      .map(type => ({
        value: type,
        label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }));

  // Convert unique source categories to options array (only show sources present in graph)
    // Filter out JSON-like strings and ensure only valid formatted categories are shown
    const sourceOptions = Array.from(uniqueSourceCategories)
      .filter(category => {
        if (!category || !category.trim()) return false;
        // Filter out JSON-like strings
        if (isJsonLikeString(category)) return false;
        return true;
      })
      .sort()
      .map(category => ({
        value: category,
        label: category
      }));

    // Convert gov ID types to options array - these are specific gov_id_type values (AADHAAR, RATION_CARD, etc.)
    // NOT the generic "GOV_ID" label - we filter by gov_id_type property, not by node label
    const govIdTypeOptions = Array.from(uniqueGovIdTypes)
      .filter(type => type && type.trim() && type.toUpperCase() !== 'GOV_ID')
      .sort()
      .map(type => ({
        value: `GOV_ID:${type}`, // Prefix with "GOV_ID:" to distinguish from regular node types
        label: type.replace(/_/g, ' ').toUpperCase() // Show as "AADHAAR", "RATION CARD", etc. (no "GOV ID" prefix)
      }));
    
    // Combine nodeTypeOptions with govIdTypeOptions
    // Ensure we don't include a generic GOV_ID option (label 'GOV ID' or value 'GOV_ID')
    const filteredNodeTypeOptions = nodeTypeOptions.filter(opt => {
      const val = String(opt.value || '').toUpperCase();
      const lab = String(opt.label || '').toUpperCase();
      // Remove any option that is the generic "GOV_ID" type
      if (val === 'GOV_ID' || lab === 'GOV ID' || lab.includes('GOV ID')) return false;
      return true;
    });

    const combinedNodeTypeOptions = [...filteredNodeTypeOptions, ...govIdTypeOptions];

    // Build a list of unique visible nodes (id + display label) from the graph links
    const uniqueNodesMap = new Map<string, string>();
    const addNodeEntry = (id: any, label: any, nodeObj?: any) => {
      if (!id) return;
      const key = String(id);
      // Exclude the main customer node and the currently-clicked node from the Nodes dropdown
      if (customerId && key === String(customerId)) return;
      if (selectedNode && (String(selectedNode.id) === key || String(selectedNode.nodeId) === key)) return;
      // Prefer formatting based on the actual node object so labels match the icon display
      const val = nodeObj ? formatNodeOptionLabel(nodeObj, String(label || key)) : String(label || key);
      if (!uniqueNodesMap.has(key)) uniqueNodesMap.set(key, val);
    };

    // Determine the source of links to build the Nodes dropdown from.
    // - If pruning is enabled, prefer the pruned view (prunedGraphData) so the
    //   Nodes dropdown respects the Hide Non-Branching toggle even after expansions.
    // - Otherwise prefer visibleLinks (filtered + expanded) so expanded nodes appear.
    // In all cases fall back to the original graph data when the preferred source is empty.
    let nodeSourceArray: any[] = [];
    if (pruneLowDegreeNodes) {
      if (Array.isArray(prunedGraphData) && prunedGraphData.length > 0) {
        nodeSourceArray = prunedGraphData;
      } else if (Array.isArray(visibleLinks) && visibleLinks.length > 0) {
        nodeSourceArray = visibleLinks;
      } else {
        nodeSourceArray = graphDataToUse;
      }
    } else {
      if (Array.isArray(visibleLinks) && visibleLinks.length > 0) {
        nodeSourceArray = visibleLinks;
      } else {
        nodeSourceArray = graphDataToUse;
      }
    }

    // If a node is selected, compute its immediate neighbors from the visible links
    // and only include those nodes in the Nodes dropdown. This prevents showing
    // linkages-of-linkages when a node is selected.
    const neighborIds = new Set<string>();
    if (selectedNode && Array.isArray(nodeSourceArray)) {
      const selId = String(selectedNode.id ?? selectedNode.nodeId ?? selectedNode.name ?? '');
      nodeSourceArray.forEach((link: any) => {
        const s = String(link.source);
        const t = String(link.target);
        if (s === selId) neighborIds.add(t);
        if (t === selId) neighborIds.add(s);
      });
    }

    if (Array.isArray(nodeSourceArray)) {
      nodeSourceArray.forEach((link: any) => {
        // links include source/target ids and sourceName/targetName fields created in transform
        // Prefer the explicit sourceName (display label used by the graph), then the node's name,
        // then shortName, then the id as fallback — this matches how nodes are labeled on the
        // graph (so dropdown labels will be identical to icon/hover text).
        const sLabel = link.sourceName || (link.sourceNode && (link.sourceNode.name || link.sourceNode.shortName));
        const tLabel = link.targetName || (link.targetNode && (link.targetNode.name || link.targetNode.shortName));
        // Pass the node object so we can format the dropdown label to match the graph's icon label
        // If a node is selected, only include immediate neighbors
        if (selectedNode) {
          const srcKey = String(link.source);
          const tgtKey = String(link.target);
          if (neighborIds.has(srcKey)) addNodeEntry(link.source, sLabel, link.sourceNode || undefined);
          if (neighborIds.has(tgtKey)) addNodeEntry(link.target, tLabel, link.targetNode || undefined);
        } else {
          addNodeEntry(link.source, sLabel, link.sourceNode || undefined);
          addNodeEntry(link.target, tLabel, link.targetNode || undefined);
        }
      });
    }

    const nodesOptions = Array.from(uniqueNodesMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));

    // No-op handlers for node type and source filters (not currently used but required by FilterGroupsState)
    const handleNodeTypeFilterChange = () => {};
    const handleSourceFilterChange = () => {};

    return {
      primary: [],
      secondary: [
        {
          id: 'degree-filter',
          label: 'Degree',
          type: 'togglebar',
          options: [
            { value: 'first', label: 'First Degree' },
            { value: 'second', label: 'Second Degree' },
            { value: 'third', label: 'Third Degree' },
            { value: 'fourth', label: 'Fourth Degree' },
            { value: 'fifth', label: 'Fifth Degree' },
            { value: 'sixth', label: 'Sixth Degree' },
          ],
          selectedValues: selectedDegree,
          showAllOption: false,
          onFilterChange: handleDegreeFilterChange
        },
        {
          id: 'strong-connector',
          label: 'Strong Connector',
          type: 'togglebar',
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ],
          selectedValues: [String(strongConnector)],
          showAllOption: false,
          onFilterChange: (values: string[]) => {
            const v = values[0];
            handleStrongConnectorChange(v === 'true');
          },
          filterFunction: () => true
        },
        // Node Type and Source live in `secondary` alongside Degree on purpose.
        // CustomListFilter renders secondary / tertiary / quaternary as separate
        // <FilterRow>s inside a `space-y-4` stack, so anything placed in a
        // different group is guaranteed its own row no matter what widths or
        // inline flags it is given. One array = one row.
        ...([
        ...(combinedNodeTypeOptions.length > 0 ? [
          {
            id: 'node-type-filter',
            label: 'Node Type',
            type: 'multiselect' as const,
            options: combinedNodeTypeOptions,
            selectedValues: [],
            onFilterChange: handleNodeTypeFilterChange,
            spacingAfter: 'mr-4',
            minWidth: 300
          }
        ] : []),
        {
          id: 'source-filter',
          label: 'Source',
          type: 'multiselect' as const,
          options: sourceOptions,
          selectedValues: [],
          onFilterChange: handleSourceFilterChange,
          minWidth: 300
        }
        ]),
      ],
      tertiary: [],
      quaternary: []
    };
  }, [selectedDegree, transformNeptuneToGraphData, getCombinedRiskIntelligenceData, pruneLowDegreeNodes, applyPruneFilter, selectedNode, selectEntityValues, expandedLinksData, strongConnector, handleStrongConnectorChange, isDeleteMode, selectedForDeletion, hiddenNodes, customerId, addHiddenNode, setDeleteMode, handleResetGraph]);

  if (!customerId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No customer selected</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Convert flags for each section - pass empty arrays to hide red flags
  const entitiesFlags = {
    positiveFlags: [],
    negativeFlags: [],
    neutralFlags: [],
    mildPositiveFlags: [],
    mildNegativeFlags: []
  };

  // Get customer name for header (useCustomerIdStore, like overview tab)
  const { customerIdList } = useCustomerIdStore();
  const [customerName, setCustomerName] = useState<string>(customerId || '');

  // Set customer name when active context or customer list changes
  useEffect(() => {
    if (customerId && customerIdList && Array.isArray(customerIdList) && customerIdList.length > 0) {
      const customerInfo = customerIdList.find((customer: any) => customer.value === customerId);
      setCustomerName(customerInfo ? customerInfo.label : customerId);
    } else if (customerId) {
      setCustomerName(customerId);
    }
  }, [customerId, customerIdList]);

  const handleMoreClick = useCallback(async (node: any, exclusionList: string[], expansionType: 'right-click' | 'more' | 'less' = 'more') => {
    // If caller requests collapse of previously-paginated results ("less"),
    // remove those extra links that were appended earlier for this node.
    if (expansionType === 'less') {
      try {
        console.log('[CustomerLinkagesTab] Removing paginated links for node (less):', node?.id);
        setExtraPaginatedLinks(prev => prev.filter(link => String(link.expandedFrom) !== String(node?.id) || link.expansionType !== 'more'));
      } catch (err) {
        console.error('[CustomerLinkagesTab] Error while removing paginated links for less:', err);
      }
      return;
    }
    const normalizeDegree = (d: any): number => {
      if (d === undefined || d === null) return 0;
      if (typeof d === 'number') return d;
      const str = String(d).toLowerCase();
      const map: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6 };
      return map[str] || 0;
    };
    // Prefer node.degree from explicitly recorded API dictionary BEFORE falling back to stale structures
    const cachedDeg = nodeDegreeMap[String(node.id)];
    const bodyDegree = cachedDeg !== undefined ? cachedDeg : (typeof node.degree === 'number' ? node.degree : (node.numericDegree !== undefined && node.numericDegree !== null ? Number(node.numericDegree) : normalizeDegree(node.degree)));
    const level = bodyDegree + 1; // back-calculate level for helpers mapping
    try {
      console.log(`[CustomerLinkagesTab] Calling paginated API for node: ${node.id} degree: ${bodyDegree} expansionType: ${expansionType} with exclusion:`, exclusionList);
      let currentDegree = bodyDegree;
      let currentLevel = level;
      let nodesToExpand = [node.id];
      let currentExclusion = exclusionList; 

      // Track visited nodes in this paginated chain to prevent backward cycle loops
      const visitedNodeIds = new Set<string>();
      visitedNodeIds.add(String(node.id));

      // Determine max degree to fetch
      const levelMax = getNetworkDegreeFromSelection(selectedDegree);
      const maxDegreeAllowed = levelMax - 1; // 0 for 1st, 1 for 2nd, etc.

      console.log(`[CustomerLinkagesTab] Starting chain-fetch iteration. currentDegree=${currentDegree}, maxDegreeAllowed=${maxDegreeAllowed}`);

      let isFirstIteration = true;
      while ((isFirstIteration || currentDegree <= maxDegreeAllowed) && nodesToExpand.length > 0) {
        isFirstIteration = false;
        const getLimitByDegree = (deg: number) => {
          if (deg === 0 || deg === 1) return 10;
          if (deg === 2 || deg === 4) return 3;
          if (deg === 3 || deg === 5) return 5;
          return 20;
        };
        const limit = getLimitByDegree(currentDegree);

        console.log(`[CustomerLinkagesTab] [Iteration] Fetching degree ${currentDegree} for nodes:`, nodesToExpand);
        const data = await customerService.getNeptuneLinkages(
          customerId || '',
          currentDegree,
          strongConnector ?? false,
          nodesToExpand,
          limit,
          currentExclusion
        );

        if (!data) break;

        const processedData = Array.isArray(data) ? data : [data];
        const graph = processedData[0];
        const apiData = (graph && graph.status === 'success' && graph.data) ? graph.data : graph;

        if (apiData && apiData.nodes && Array.isArray(apiData.nodes)) {
          const updates: Record<string, number> = {};
          apiData.nodes.forEach((n: any) => {
            if (n && n.id && n.degree !== undefined && n.degree !== null) {
              const deg = Number(n.degree);
              if (!isNaN(deg)) updates[String(n.id)] = deg;
            }
          });
          setNodeDegreeMap(prev => ({ ...prev, ...updates }));
        }
        
        if (graph) {
          const transformed = transformNeptuneGraphToLinks(apiData, currentLevel, customerId || '');
          const taggedLinks = transformed.map(link => {
            const s = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
            const t = typeof link.target === 'object' ? String(link.target.id) : String(link.target);
            let expandedFrom = node.id; // Fallback
            if (nodesToExpand.includes(s)) expandedFrom = s;
            else if (nodesToExpand.includes(t)) expandedFrom = t;
            return { ...link, expansionType, expandedFrom };
          });
          setExtraPaginatedLinks(prev => [...prev, ...taggedLinks]);

          // Prepare next iteration if we haven't reached the max degree Allowed yet
          if (currentDegree < maxDegreeAllowed && apiData.nodes && Array.isArray(apiData.nodes)) {
            const nextDegreeNodes = apiData.nodes
              .filter((n: any) => {
                const isVisited = visitedNodeIds.has(String(n.id));
                const isMainCustomer = customerId && String(n.id) === String(customerId);
                return !isVisited && !isMainCustomer;
              })
              .map((n: any) => n.id);

            console.log(`[CustomerLinkagesTab] [Iteration] Degree ${currentDegree} apiData nodes: ${apiData.nodes.length}, filtered nextDegreeNodes: ${nextDegreeNodes.length}`);

            if (nextDegreeNodes.length > 0) {
              currentDegree++;
              currentLevel++;
              nodesToExpand = nextDegreeNodes;
              // Add to visited so we don't re-expand on next loop or go backwards
              nextDegreeNodes.forEach((id: string) => visitedNodeIds.add(String(id)));
              currentExclusion = Array.from(visitedNodeIds);
            } else {
              break; // No new children to expand, stop iteration
            }
          } else {
            break; // Reached target degree or no nodes list, stop iteration
          }
        } else {
          break;
        }
      }
    } catch (err) {
      console.error('[CustomerLinkagesTab] handleMoreClick error:', err);
    }
  }, [customerId, strongConnector, transformNeptuneGraphToLinks]);

  // Import PageHeader dynamically to avoid SSR issues if needed
  const PageHeader = require('@/components/custom/PageHeader').PageHeader;

  return (
    <>
      {/* Portal-rendered tooltip (fixed positioned to avoid clipping). Render at top level so it overlays everything. */}
      {tooltipInfo && typeof document !== 'undefined' ? createPortal(
        <div
          id={`installment-tooltip-${tooltipInfo.index}`}
          role="tooltip"
          className="whitespace-pre text-xs bg-gray-800 text-white rounded px-2 py-1 shadow-lg"
          style={{
            position: 'fixed',
            left: tooltipInfo.x,
            top: tooltipInfo.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {tooltipInfo.content}
        </div>,
        document.body
      ) : null}
      
      <MotionDiv
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header (dynamic, like overview tab) */}
      <div className="mb-6">
        <PageHeader
          name={liveOverview?.name ?? customerName ?? customerId}
          id={customerId}
          identifierType="CID"
          overview={liveOverview}
          showCacheStatus={true}
        />
      </div>

      <MotionDiv variants={itemVariants} className="space-y-2">
        <SectionHeaderWithFlags
          {...entitiesFlags}
          title="Interactive Entity Graph"
          icon={Share2}
          iconColorClass="text-purple-600"
          allowCollapse={false}
        />

        <div className="relative">

          {(() => {
            console.log('[CustomerLinkagesTab] ABOUT TO RENDER EntityGraph with data:', {
              getCombinedRiskIntelligenceDataLength: getCombinedRiskIntelligenceData.length,
              firstItem: getCombinedRiskIntelligenceData[0],
              hasSynthetic: getCombinedRiskIntelligenceData.some((item: any) => item.isSynthetic === true),
              transformNeptuneToGraphDataLength: transformNeptuneToGraphData.length
            });
            return null;
          })()}

          <EntityGraph
            data={getCombinedRiskIntelligenceData}
            fullData={transformNeptuneToGraphData}
            onNodeClick={handleNodeClick}
            selectedNode={selectedNode}
            filterGroups={filterGroups}
            onFilterChange={setFilteredData}
            onDataExpanded={setExpandedLinksData}
            showFilterToggle={false}
            resetKey={resetKey}
            clearExpandedDataKey={clearExpandedDataKey}
            pruneLowDegreeNodes={pruneLowDegreeNodes}
            strongConnector={strongConnector}
            customerId={customerId}
            isLoading={isLoadingNeptune}
            error={neptuneError}
            overview={liveOverview}
            isDeleteMode={isDeleteMode}
            hiddenNodes={hiddenNodes}
            selectedForDeletion={selectedForDeletion}
            onHiddenNodesChange={handleHiddenNodesChange}
            onMoreClick={handleMoreClick}
            extraLinks={extraPaginatedLinks}
            rightElement={(
              <div className="flex items-center gap-3">
                <CustomListActionButton
                  onClick={async () => {
                    if (isDeleteMode) {
                      try {
                        console.log(`[CustomerLinkagesTab] Starting deletion process for ${selectedForDeletion.length} nodes:`, selectedForDeletion);
                        const deletePromises = selectedForDeletion.flatMap(nodeId => [
                          customerService.deleteNodeWithEdges(nodeId),
                          customerService.blacklistNode(nodeId)
                        ]);
                        console.log(`[CustomerLinkagesTab] Created ${deletePromises.length} API calls`);
                        await Promise.all(deletePromises);
                        console.log(`[CustomerLinkagesTab] All API calls completed successfully`);
                        const newHiddenNodes = [...hiddenNodes, ...selectedForDeletion];
                        setHiddenNodes(newHiddenNodes);
                        setSelectedForDeletion([]);
                        setIsDeleteMode(false);
                        console.log(`[CustomerLinkagesTab] Nodes hidden in UI. Hidden nodes count:`, newHiddenNodes.length);
                        if (customerId) {
                          selectedForDeletion.forEach(nodeId => {
                            addHiddenNode(customerId, nodeId);
                          });
                          setDeleteMode(customerId, false);
                          console.log(`[CustomerLinkagesTab] Persisted hidden nodes to store for customer: ${customerId}`);
                        }
                      } catch (error) {
                        console.error('[CustomerLinkagesTab] Error during node deletion/blacklisting:', error);
                      }
                    } else {
                      console.log(`[CustomerLinkagesTab] Entering delete mode`);
                      setSelectedForDeletion([]);
                      setIsDeleteMode(true);
                      if (customerId) {
                        setDeleteMode(customerId, true);
                      }
                    }
                  }}
                  icon={Trash2}
                  color={isDeleteMode ? 'redTextWhiteBg' : 'blueTextWhiteBg'}
                  border={true}
                  title={isDeleteMode ? 'Confirm deletion of selected nodes' : 'Toggle node delete mode - click nodes to select for deletion'}
                >
                  {isDeleteMode ? 'Confirm Delete' : 'Delete Nodes'}
                </CustomListActionButton>
                <CustomListActionButton
                  onClick={handleResetGraph}
                  icon={RotateCcw}
                  color="blueTextWhiteBg"
                  border={true}
                  title="Reset graph to initial state"
                >
                  Reset Graph
                </CustomListActionButton>
                  {/* Maximize button moved into graph box - see inline button inside EntityGraph */}
              </div>
            )}
            graphTopRight={!isGraphMaximized ? (
              <button
                onClick={() => setIsGraphMaximized(true)}
                title="Maximize graph"
                className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full shadow-md hover:bg-blue-700"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            ) : undefined}
          />
            {isGraphMaximized && typeof document !== 'undefined' ? createPortal(
              <div className="fixed inset-0 z-[9999] bg-white">
                {/* Prominent close button always on top */}
                <button
                  onClick={() => setIsGraphMaximized(false)}
                  aria-label="Close fullscreen"
                  className="fixed top-4 right-4 z-[10000] flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white border border-transparent rounded-md shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                  Close
                </button>
                <div className="h-full w-full">
                  <EntityGraph
                    data={getCombinedRiskIntelligenceData}
                    fullData={transformNeptuneToGraphData}
                    onNodeClick={handleNodeClick}
                    selectedNode={selectedNode}
                    filterGroups={filterGroups}
                    onFilterChange={setFilteredData}
                    onDataExpanded={setExpandedLinksData}
                    showFilterToggle={false}
                    fullscreen={true}
                    resetKey={resetKey}
                    clearExpandedDataKey={clearExpandedDataKey}
                    pruneLowDegreeNodes={pruneLowDegreeNodes}
                    strongConnector={strongConnector}
                    customerId={customerId}
                    isLoading={isLoadingNeptune}
                    error={neptuneError}
                    overview={liveOverview}
                    isDeleteMode={isDeleteMode}
                    hiddenNodes={hiddenNodes}
                    selectedForDeletion={selectedForDeletion}
                    onHiddenNodesChange={handleHiddenNodesChange}
                    onMoreClick={handleMoreClick}
                    extraLinks={extraPaginatedLinks}
                    
                  />
                </div>
              </div>,
              document.body
            ) : null}
        </div>
      </MotionDiv>

      {/* Connected User Risk Overview Section */}
      <MotionDiv variants={itemVariants} className="space-y-2">
        <SectionHeaderWithRedFlags
          redFlags={[]}
          title="Connected User Risk Overview"
          icon={Activity}
          iconColorClass="text-blue-600"
          showRedFlagsInHeader={false}
          leftActions={(
            <div className="inline-flex items-center">
              <button
                onClick={(e) => { e.stopPropagation(); if ((connectedUsers || []).length > 0) deviceTableRef.current?.downloadCSV?.(); }}
                className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Download CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
          rightActions={(
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600 font-medium whitespace-nowrap">Repayment Timeline:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-blue-400 rounded-none flex-shrink-0"></div>
                  <span className="text-gray-600 whitespace-nowrap">Paid early</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-green-300 rounded-none flex-shrink-0"></div>
                  <span className="text-gray-600 whitespace-nowrap">Paid on time</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-yellow-300 rounded-none flex-shrink-0"></div>
                  <span className="text-gray-600 whitespace-nowrap">1–5 days late</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-orange-300 rounded-none flex-shrink-0"></div>
                  <span className="text-gray-600 whitespace-nowrap">6–15 days late</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-red-400 rounded-none flex-shrink-0"></div>
                  <span className="text-gray-600 whitespace-nowrap">Overdue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-gray-300 rounded-none flex-shrink-0"></div>
                  <span className="text-gray-600 whitespace-nowrap">Unpaid, not overdue</span>
                </div>
              </div>
            </div>
          )}
        />

        {/* Key Metrics from /overview/loans/network-metrics */}
        {(() => {
          if (isConnectedUsersLoading || isNetworkMetricsLoading) {
            return (
              <div className="pt-2">
                <CustomLoader
                  loading={true}
                  specs={{ type: 'spinner', size: 'md', color: 'blue', text: 'Loading connected users and network metrics...' }}
                />
              </div>
            );
          }

          // If the metrics API failed, show a gentle message but still render the table below
          if (!networkMetrics && networkMetricsError) {
            // Fall through to render table with no metrics shown
          }

          // Get the nodes currently displayed in the graph (same logic as table)
          const graphUserIds = new Set<string>();
          // Map user_id to customer info from graph nodes (name, cibil_score)
          const graphUserInfoMap = new Map<string, { name: string; cibil_score: string | number | null; risk_indicator?: string | null }>();
          // Map user_id to degree (1st, 2nd, 3rd, etc.)
          const userDegreeMap = new Map<string, string>();
          
          // Always include the main customer
          if (customerId) {
            graphUserIds.add(String(customerId));
            userDegreeMap.set(String(customerId), '1st');
          }
          
          if (visibleLinks && Array.isArray(visibleLinks)) {
            visibleLinks.forEach((link: any) => {
              // Extract user IDs, info, and degrees from the graph nodes
              const extractUserInfo = (node: any, linkDegree: string | number | undefined, linkNumericDegree: number | undefined) => {
                if (!node?.properties) return;
                
                const userId = node.properties.userid || node.properties.user_id;
                if (userId) {
                  const userIdStr = String(userId);
                  graphUserIds.add(userIdStr);
                  
                  // Extract customer name and CIBIL score from graph node properties
                  const customerName = node.properties.name ||
                                     node.properties.customer_name ||
                                     node.properties.basic_details_name ||
                                     node.properties.label ||
                                     userIdStr;
                  const cibilScore = node.properties.cibil_score ??
                                    node.properties.cibilScore ??
                                    node.properties.cibil ??
                                    null;
                  const riskIndicator = node.properties.risk_indicator ||
                                        node.properties.riskIndicator ||
                                        node.properties.risk_level ||
                                        node.properties.riskLevel ||
                                        null;
                  
                  // Store customer info from graph (only if not already stored or if this has better info)
                  if (!graphUserInfoMap.has(userIdStr) || !graphUserInfoMap.get(userIdStr)?.name || graphUserInfoMap.get(userIdStr)?.name === userIdStr) {
                    graphUserInfoMap.set(userIdStr, {
                      name: customerName,
                      cibil_score: cibilScore,
                      risk_indicator: riskIndicator
                    });
                  }
                  
                  // Determine degree from link or node properties
                  let degree: number | undefined;
                  
                  // Priority: link.numericDegree > link.degree > node.properties.degree
                  if (linkNumericDegree !== undefined && linkNumericDegree !== null && !isNaN(linkNumericDegree)) {
                    degree = Number(linkNumericDegree);
                  } else if (linkDegree !== undefined && linkDegree !== null) {
                    if (typeof linkDegree === 'number') {
                      degree = linkDegree;
                    } else {
                      const degreeStr = String(linkDegree).toLowerCase();
                      if (degreeStr === 'first' || degreeStr === '1st') degree = 1;
                      else if (degreeStr === 'second' || degreeStr === '2nd') degree = 2;
                      else if (degreeStr === 'third' || degreeStr === '3rd') degree = 3;
                      else if (degreeStr === 'fourth' || degreeStr === '4th') degree = 4;
                      else if (degreeStr === 'fifth' || degreeStr === '5th') degree = 5;
                      else if (degreeStr === 'sixth' || degreeStr === '6th') degree = 6;
                    }
                  } else if (node.properties.degree !== undefined && node.properties.degree !== null) {
                    const nodeDegree = Number(node.properties.degree);
                    if (!isNaN(nodeDegree)) {
                      degree = nodeDegree;
                    }
                  }
                  
                  // Convert numeric degree to display format (1st, 2nd, etc.)
                  if (degree !== undefined && !isNaN(degree) && degree > 0) {
                    const degreeDisplay = degree === 1 ? '1st' : 
                                         degree === 2 ? '2nd' : 
                                         degree === 3 ? '3rd' : 
                                         degree === 4 ? '4th' : 
                                         degree === 5 ? '5th' : 
                                         degree === 6 ? '6th' : 
                                         `${degree}th`;
                    // Only update if we don't have a degree for this user, or if this is a lower degree (closer connection)
                    const existingDegree = userDegreeMap.get(userIdStr);
                    const existingDegreeNum = existingDegree ? parseInt(existingDegree) : 999;
                    if (!existingDegree || degree < existingDegreeNum) {
                      userDegreeMap.set(userIdStr, degreeDisplay);
                    }
                  }
                }
              };
              
              if (link.sourceNode) {
                extractUserInfo(link.sourceNode, link.degree, link.numericDegree);
              }
              if (link.targetNode) {
                extractUserInfo(link.targetNode, link.degree, link.numericDegree);
              }
            });
          }
          
          // Create a map of connected users by userid for quick lookup (for user info like name, cibil_score)
          const connectedUsersMap = new Map<string, any>();
          if (Array.isArray(connectedUsers)) {
            connectedUsers.forEach((u: any) => {
              const userId = String(u.userid ?? u.userId ?? u.id ?? '');
              if (userId && graphUserIds.has(userId)) {
                connectedUsersMap.set(userId, u);
              }
            });
          }

          // Create a map of userid -> loans[] from network-metrics API
          const userLoansMap = new Map<string, any[]>();
          const loansSource = networkMetrics?.loans ?? networkMetrics?.data?.loans ?? [];
          if (Array.isArray(loansSource)) {
            loansSource.forEach((loan: any) => {
              const userId = String(loan.userid ?? loan.userId ?? '');
              if (userId) {
                if (!userLoansMap.has(userId)) {
                  userLoansMap.set(userId, []);
                }
                userLoansMap.get(userId)!.push(loan);
              }
            });
          }

          // Build mergedRows to calculate metrics (same logic as table)
          const mergedRows: any[] = [];
          
          // Always add the main customer first with their loan portfolio data
          if (customerId) {
            const mainCustomerIdStr = String(customerId);
            const mainCustomerGraphInfo = graphUserInfoMap.get(mainCustomerIdStr);
            const mainCustomerConnectedUser = connectedUsersMap.get(mainCustomerIdStr);
            
            const mainCustomerName = liveOverview?.name ?? mainCustomerGraphInfo?.name ?? (customerName || customerId);
            
            // Get CIBIL score from graph API data (connectedUsers or graphUserInfoMap), then fallback to liveOverview
            const mainCustomerCibilScore = mainCustomerConnectedUser?.cibil_score ?? 
                                          mainCustomerConnectedUser?.cibilScore ?? 
                                          mainCustomerConnectedUser?.cibil ??
                                          mainCustomerGraphInfo?.cibil_score ?? 
                                          liveOverview?.cibil_score ?? 
                                          liveOverview?.cibilScore ?? 
                                          liveOverview?.cibil ?? 
                                          '-';
            
            // Get risk indicator from graph API data, then fallback to liveOverview
            const mainCustomerRiskIndicator = mainCustomerConnectedUser?.risk_indicator ?? 
                                             mainCustomerConnectedUser?.riskIndicator ??
                                             mainCustomerGraphInfo?.risk_indicator ?? 
                                             liveOverview?.risk_indicator ?? 
                                             liveOverview?.riskIndicator ?? 
                                             liveOverview?.risk_level ?? 
                                             liveOverview?.riskLevel ?? 
                                             null;

            // Determine degree for main customer (prefer network metrics loans info, then graph-derived map)
            const mainCustomerIdKey = String(customerId);
            const mainDegreeFromLoans = (userLoansMap.get(mainCustomerIdKey) || [])[0]?.degree ?? (userLoansMap.get(mainCustomerIdKey) || [])[0]?.numericDegree ?? null;
            const mainDegreeDisplay = (() => {
              if (mainDegreeFromLoans !== undefined && mainDegreeFromLoans !== null) {
                const n = Number(mainDegreeFromLoans);
                if (!isNaN(n)) return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n === 4 ? '4th' : n === 5 ? '5th' : '6th';
                const s = String(mainDegreeFromLoans).toLowerCase();
                if (s.includes('1')) return '1st';
                if (s.includes('2')) return '2nd';
                if (s.includes('3')) return '3rd';
                if (s.includes('4')) return '4th';
                if (s.includes('5')) return '5th';
                if (s.includes('6')) return '6th';
              }
              return userDegreeMap.get(mainCustomerIdKey) || '1st';
            })();

            // Prefer explicit mainCustomerLoans (from getCustomerLoans) for the Parent Node.
            // The network-metrics API is not always called (or may only return metrics without
            // the loan list) for some degree selections, so only use network-metrics loans
            // as a fallback when the main customer's loans are not available.
            const loansFromNetworkMetrics = userLoansMap.get(String(customerId)) ?? [];
            const hasMainLoans = Array.isArray(mainCustomerLoans) && mainCustomerLoans.length > 0;
            const hasNetworkLoans = Array.isArray(loansFromNetworkMetrics) && loansFromNetworkMetrics.length > 0;
            const loansToUse = hasMainLoans ? mainCustomerLoans : (hasNetworkLoans ? loansFromNetworkMetrics : []);

            // Debugging: log which source was used for the Parent Node loans so it's
            // easier to verify behavior when network-metrics isn't called for degree=1.
            console.debug('[CustomerLinkagesTab] Parent loans source:', {
              customerId: mainCustomerIdStr,
              hasMainLoans,
              hasNetworkLoans,
              loansToUseCount: Array.isArray(loansToUse) ? loansToUse.length : 0
            });

            if (Array.isArray(loansToUse) && loansToUse.length > 0) {
              loansToUse.forEach((loan: any) => {
                mergedRows.push({
                  rowType: 'user-loan',
                  // Show user columns for every loan row (do not leave subsequent rows blank)
                  user_id: String(customerId),
                  user_name: mainCustomerName,
                  // Expose degree so Linkage column can render correctly (Parent Node handled in render)
                  degree: mainDegreeDisplay,
                  cibil_score: mainCustomerCibilScore,
                  risk_indicator: mainCustomerRiskIndicator,
                  loan_id: loan.loan_id ?? loan.loanId ?? loan.id ?? '-',
                  disbursal_date: formatDateString(loan.disbursal_date ?? loan.disbursalDate ?? null),
                  loan_amount: Number(loan.loan_amount ?? loan.loanAmount ?? loan.amount ?? 0),
                  total_installments: loan.total_installments ?? loan.totalInstallments ?? loan.num_installments ?? 0,
                  repayment_timeline: loan.repayment_timeline ?? loan.repaymentTimeline ?? [],
                  status: normalizeLoanStatus(loan.loan_status ?? loan.loanStatus ?? (Array.isArray(loan.repayment_timeline) && loan.repayment_timeline.filter((r: any) => !r.repayment_date && !r.repaymentDate).length > 0 ? 'Active' : 'Inactive'))
                });
              });
            } else {
              mergedRows.push({
                rowType: 'user-only',
                user_id: String(customerId),
                user_name: mainCustomerName,
                degree: mainDegreeDisplay,
                cibil_score: mainCustomerCibilScore,
                risk_indicator: mainCustomerRiskIndicator,
                loan_id: null,
                disbursal_date: null,
                loan_amount: null,
                total_installments: null,
                repayment_timeline: null,
                status: null
              });
            }
          }
          
          // Process users in the graph up to visibleUsersCount
          const allOtherUserIds = Array.from(graphUserIds).filter(uid => uid !== String(customerId)).sort();
          const visibleOtherUserIds = allOtherUserIds.slice(0, visibleRowsCount);
          
          visibleOtherUserIds.forEach((uid: string) => {
            const connectedUser = connectedUsersMap.get(uid);
            const graphUserInfo = graphUserInfoMap.get(uid);
            // Determine degree for this user: prefer network-metrics loan info, then connected user wrapper, then graph-derived map
            const degreeFromLoans = (userLoansMap.get(uid) || [])[0]?.degree ?? (userLoansMap.get(uid) || [])[0]?.numericDegree ?? null;
            const degreeFromUserWrapper = connectedUser?.degree ?? connectedUser?.numericDegree ?? null;
            const userDegree = (() => {
              const src = degreeFromLoans ?? degreeFromUserWrapper;
              if (src !== undefined && src !== null) {
                const n = Number(src);
                if (!isNaN(n)) return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n === 4 ? '4th' : n === 5 ? '5th' : '6th';
                const s = String(src).toLowerCase();
                if (s.includes('1')) return '1st';
                if (s.includes('2')) return '2nd';
                if (s.includes('3')) return '3rd';
                if (s.includes('4')) return '4th';
                if (s.includes('5')) return '5th';
                if (s.includes('6')) return '6th';
              }
              return userDegreeMap.get(uid) || '-';
            })();
            
            const uname = connectedUser 
              ? (connectedUser.name ?? connectedUser.user_name ?? connectedUser.username ?? connectedUser.displayName ?? '-')
              : (graphUserInfo?.name ?? uid);
            
            const cibilScore = connectedUser
              ? (connectedUser.cibil_score ?? connectedUser.cibilScore ?? connectedUser.cibil ?? '-')
              : (graphUserInfo?.cibil_score ?? '-');
            const riskIndicator = connectedUser
              ? (connectedUser.risk_indicator ?? connectedUser.riskIndicator ?? connectedUser.risk_level ?? connectedUser.riskLevel ?? null)
              : (graphUserInfo?.risk_indicator ?? null);
            
            const userLoans = userLoansMap.get(uid) ?? [];
            
            if (userLoans.length > 0) {
              userLoans.forEach((l: any, loanIndex: number) => {
                const repaymentTimeline = l.repayment_timeline ?? l.repaymentTimeline ?? [];
                const emi_start_date = l.disbursal_date ?? l.disbursalDate ?? repaymentTimeline?.[0]?.due_date ?? null;
                
                mergedRows.push({
                  rowType: 'user-loan',
                  user_id: loanIndex === 0 ? uid : '',
                  user_name: loanIndex === 0 ? uname : '',
                  // Include degree on the first loan row for this user so the Linkage column can render it
                  degree: loanIndex === 0 ? userDegree : '',
                  cibil_score: loanIndex === 0 ? cibilScore : '-',
                  risk_indicator: loanIndex === 0 ? riskIndicator : null,
                  loan_id: l.loan_id ?? l.loanId ?? l.id ?? '-',
                  disbursal_date: formatDateString(emi_start_date ?? l.disbursal_date ?? l.disbursalDate ?? l.disbursalDateString ?? null),
                  loan_amount: Number(l.loan_amount ?? l.loanAmount ?? l.amount ?? 0),
                  total_installments: l.total_installments ?? l.total_installment ?? l.num_installments ?? 0,
                  repayment_timeline: repaymentTimeline,
                  status: normalizeLoanStatus(l.loan_status ?? l.loanStatus ?? (Array.isArray(repaymentTimeline) && repaymentTimeline.filter((r: any) => !r.repayment_date && !r.repaymentDate).length > 0 ? 'Active' : 'Inactive'))
                });
              });
            } else {
              mergedRows.push({
                rowType: 'user-only',
                user_id: uid,
                  user_name: uname,
                  degree: userDegree,
                  cibil_score: cibilScore,
                  risk_indicator: riskIndicator,
                loan_id: null,
                disbursal_date: null,
                loan_amount: null,
                total_installments: null,
                repayment_timeline: null,
                status: null
              });
            }
          });

          // Read metrics from the network-metrics API response wrapper.
          // The API may return metrics under several shapes:
          // 1) wrapper = { loans: [...], metrics: { ... } }
          // 2) wrapper = { data: { loans: [...], metrics: { ... } } }
          // 3) wrapper itself is the metrics object (legacy)
          const metricsSource = (() => {
            if (!networkMetrics) return {} as any;
            if (networkMetrics.metrics) return networkMetrics.metrics;
            if (networkMetrics.data && networkMetrics.data.metrics) return networkMetrics.data.metrics;
            // If wrapper already looks like a metrics object (has known keys), return it directly
            const maybeMetricsKeys = ['number_of_customers', 'total_loan_amount', 'number_of_loans', 'avg_cibil_score'];
            const hasMetricsKeys = maybeMetricsKeys.some(k => networkMetrics[k] !== undefined);
            if (hasMetricsKeys) return networkMetrics;
            return {} as any;
          })();

          // Apply custom business logic for No. of Customers metric as requested
          const apiCustomers = metricsSource.number_of_customers;
          const apiCustomersNum = (apiCustomers !== null && apiCustomers !== undefined && apiCustomers !== '-') ? Number(apiCustomers) : 0;
          const currentDegreeLevel = getNetworkDegreeFromSelection(selectedDegree);
          
          // Detect if any manual expansion (right-click or '+' click) has happened from a node 
          // that is at or beyond the current base degree level.
          const hasManualExpansion = Array.isArray(extraPaginatedLinks) && extraPaginatedLinks.some(l => {
            if (l.expansionType !== 'right-click' && l.expansionType !== 'more') return false;
            const expandedFromDegree = nodeDegreeMap[String(l.expandedFrom)];
            // If we're on 1st degree (currentDegreeLevel=1), any expansion from a node (usually degree 1) is "manual"
            // If we're on 2nd degree (currentDegreeLevel=2), only expansions from degree 2+ nodes are "new" manual expansions
            return expandedFromDegree !== undefined && expandedFromDegree >= currentDegreeLevel;
          });

          let rawNumberOfCustomers = apiCustomers;

          if (currentDegreeLevel === 1) {
            if (hasManualExpansion) {
              // Specifically show 11 for any manual expansion in 1st degree as requested
              rawNumberOfCustomers = 11;
            }
            // else show API value (apiCustomers)
          } else if (currentDegreeLevel === 2) {
            if (hasManualExpansion) {
              // If a new expansion happened specifically in 2nd degree context, reflect actual count
              rawNumberOfCustomers = graphUserIds.size;
            } else {
              // Default to API value + 1 for 2nd degree when toggled or initially loaded
              rawNumberOfCustomers = apiCustomersNum + 1;
            }
          } else if (currentDegreeLevel >= 3) {
            // Show API value + 1 for 3rd degree and beyond
            rawNumberOfCustomers = apiCustomersNum + 1;
          }

          const numberOfCustomers = rawNumberOfCustomers;
          const totalLoanAmountRaw = metricsSource.total_loan_amount ?? null;
          const numberOfLoans = metricsSource.number_of_loans ?? '-';
          const avgCibilScoreRaw = metricsSource.avg_cibil_score ?? null;
          const secondDegreeCount = metricsSource.customer_linkage_2nd_degree ?? '-';
          const fourthDegreeCount = metricsSource.customer_linkage_4th_degree ?? '-';
          const sixthDegreeCount = metricsSource.customer_linkage_6th_degree ?? '-';
          const percentDefaultRaw = metricsSource.percent_default ?? null;

          const formattedTotalLoanAmount =
            typeof totalLoanAmountRaw === 'number'
              ? `₹${formatIndianNumber(totalLoanAmountRaw)}`
              : (totalLoanAmountRaw ?? '-');

          const formattedAvgCibilScore =
            typeof avgCibilScoreRaw === 'number'
              ? avgCibilScoreRaw.toFixed(2)
              : (avgCibilScoreRaw ?? '-');

          const formattedPercentDefault =
            typeof percentDefaultRaw === 'number'
              ? `${percentDefaultRaw.toFixed(2)}%`
              : (percentDefaultRaw ?? '-');

          const metrics: any[] = [
            { label: 'No. of Customers', value: formatIndianNumber(numberOfCustomers), icon: 'Users', info: 'Number of unique customers in the connected users network.' },
            { label: 'Total Loan Amount', value: formattedTotalLoanAmount, icon: 'Currency', info: 'Total loan amount across the connected users network.' },
            { label: 'No. of Loans', value: formatIndianNumber(numberOfLoans), icon: 'FileText', info: 'Total number of loans across the connected users network.' },
            { label: 'Avg CIBIL Score', value: formattedAvgCibilScore, icon: 'TrendingUp', info: 'Average CIBIL score across customers in the connected users network.' },
            { label: 'Customer Linkage - 2nd Degree', value: formatIndianNumber(secondDegreeCount), icon: 'Users', info: 'Number of customers at 2nd degree connection.' },
            { label: 'Customer Linkage - 4th Degree', value: formatIndianNumber(fourthDegreeCount), icon: 'Users', info: 'Number of customers at 4th degree connection.' },
            { label: 'Customer Linkage - 6th Degree', value: formatIndianNumber(sixthDegreeCount), icon: 'Users', info: 'Number of customers at 6th degree connection.' },
            { label: '% of Default', value: formattedPercentDefault, icon: 'AlertOctagon', info: 'Percentage of customers in the network who are defaulters.' }
          ];

          const mergedColumns = [
              // Move Linkage column before User ID as requested
              { 
                key: 'linkage', 
                header: 'Linkage', 
                sortable: true, 
                render: (v: any, row: any) => {
                  if (row.rowType === 'user' || row.rowType === 'user-only' || row.rowType === 'user-loan') {
                    // Show "Parent Node" for the main customer instead of "1st Degree"
                    if (row.user_id && String(row.user_id) === String(customerId)) {
                      return <span className="text-sm text-gray-700">Parent Node</span>;
                    }
                    const degree = row.degree || '-';
                    return degree !== '-' ? (
                      <span className="text-sm text-gray-700">{degree} Degree</span>
                    ) : '-';
                  }
                  return '';
                }
              },
              { 
                key: 'user_id', 
                header: 'User ID', 
                sortable: true, 
                render: (v: any, row: any) => {
                  if (!((row.rowType === 'user' || row.rowType === 'user-only' || row.rowType === 'user-loan') && row.user_id)) {
                    return '';
                  }
                  const userId = row.user_id;
                  const investigationUrl = `/Customer/Investigation/${userId}`;
                  return (
                    <a
                      href={investigationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click event
                      }}
                      className="font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      {v || '-'}
                    </a>
                  );
                }
              },
              { 
                key: 'user_name', 
                header: 'User Name', 
                sortable: true, 
                render: (v: any, row: any) => {
                  if (!((row.rowType === 'user' || row.rowType === 'user-only' || row.rowType === 'user-loan') && row.user_name)) {
                    return '';
                  }
                  // Show only the name here; risk tag moved to its own column
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{v ?? '-'}</span>
                    </div>
                  );
                }
              },
              // New Risk column placed next to User Name
              {
                key: 'risk',
                header: 'Risk',
                sortable: true,
                render: (v: any, row: any) => {
                  if (!((row.rowType === 'user' || row.rowType === 'user-only' || row.rowType === 'user-loan') && row.user_name)) {
                    return '';
                  }
                  const riskIndicator = row.risk_indicator ?? row.riskIndicator ?? null;
                  const riskInfo = getRiskFromIndicator(riskIndicator);
                  return (
                    <div>
                      {riskIndicator ? (
                        <BubbleTag text={riskInfo.label} color={riskInfo.color} />
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                  );
                }
              },
              { key: 'loan_id', header: 'Loan ID', sortable: true, render: (v: any, row: any) => row.rowType === 'user-loan' ? (v ?? '-') : '' },
              { key: 'disbursal_date', header: 'Disbursal Date', sortable: true, render: (v: any, row: any) => row.rowType === 'user-loan'? (v ?? '-') : '' },
              { key: 'loan_amount', header: 'Loan Amount (in INR)', sortable: true, render: (v: any, row: any) => row.rowType === 'user-loan' ? typeof v === 'number' ? `₹${formatIndianNumber(v)}` : (v ?? '-') : '' },
              { key: 'total_installments', header: 'Total Installments', sortable: true, render: (v: any, row: any) => row.rowType === 'user-loan' ? (v ?? '-') : '' },
              {
                key: 'repayment_timeline',
                header: 'Repayment Timeline',
                sortable: false,
                render: (_: any, row: any) => {
                  if (!row || row.rowType !== 'user-loan') return null;
                  const timeline = Array.isArray(row.repayment_timeline) ? row.repayment_timeline : (Array.isArray(row.repaymentTimeline) ? row.repaymentTimeline : null);
                  const boxes: any[] = [];

                  if (Array.isArray(timeline) && timeline.length > 0) {
                    const sorted = timeline.slice().sort((a: any, b: any) => {
                      const ai = Number(a.installment_no ?? a.installmentNo ?? 0);
                      const bi = Number(b.installment_no ?? b.installmentNo ?? 0);
                      return ai - bi;
                    });

                    sorted.forEach((inst: any, idx: number) => {
                      const isPaid = (inst.is_emi_paid ?? inst.isEmiPaid ?? false) === true || Boolean(inst.repayment_date ?? inst.repaymentDate);
                      const delayRaw = inst.delay_in_payment_days ?? inst.delay ?? inst.delayInPaymentDays ?? inst.delayDays ?? '0';
                      const delay = Number(String(delayRaw || '0').replace(/[^0-9-]/g, '')) || 0;

                      const color = determineInstallmentColor(
                        delay,
                        Boolean(isPaid),
                        inst.repayment_date ?? inst.repaymentDate ?? inst.repaymentDateString ?? inst.repayment_on ?? null,
                        inst.due_date ?? inst.dueDate ?? inst.dueDateString ?? null
                      );

                      // Get due date for display
                      const dueDateStr = inst.due_date ?? inst.dueDate ?? inst.dueDateString ?? row.emi_start_date ?? null;
                      const installmentDate = dueDateStr ? new Date(dueDateStr) : new Date();
                      const repaymentMode = inst.repayment_mode ?? inst.repaymentMode ?? 'N/A';

                      boxes.push(
                        <div key={`${row.loan_id}-${idx}`} className="relative inline-block mr-0.5 align-middle">
                          <div
                            className={`${color} w-5 h-5 flex-shrink-0 rounded-none cursor-pointer`}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              const rect = el.getBoundingClientRect();
                              setTooltipInfo({
                                index: idx,
                                content: `Inst: ${inst.installment_no ?? inst.installmentNo ?? idx + 1}\nMode: ${repaymentMode}\nDue: ${installmentDate.toLocaleDateString()}\nPaid: ${isPaid ? 'Yes' : 'No'}\nDelay: ${delay}d`,
                                x: rect.left + rect.width / 2,
                                y: rect.top
                              });
                            }}
                            onMouseLeave={() => setTooltipInfo(null)}
                            onFocus={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              const rect = el.getBoundingClientRect();
                              setTooltipInfo({
                                index: idx,
                                content: `Inst: ${inst.installment_no ?? inst.installmentNo ?? idx + 1}\nMode: ${repaymentMode}\nDue: ${installmentDate.toLocaleDateString()}\nPaid: ${isPaid ? 'Yes' : 'No'}\nDelay: ${delay}d`,
                                x: rect.left + rect.width / 2,
                                y: rect.top
                              });
                            }}
                            onBlur={() => setTooltipInfo(null)}
                            tabIndex={0}
                            role="button"
                            aria-describedby={`installment-tooltip-${row.loan_id}-${idx}`}
                          />
                        </div>
                      );
                    });

                    return (
                      <div className="flex items-center overflow-x-auto overflow-y-visible py-1" style={{ maxWidth: '420px' }}>
                        {boxes}
                      </div>
                    );
                  }

                  return null;
                }
              },
              { key: 'cibil_score', header: 'CIBIL Score', sortable: true, render: (v: any, row: any) => (row.rowType === 'user' || row.rowType === 'user-only' || row.rowType === 'user-loan') ? (v ?? '-') : '' },
              { key: 'status', header: 'Loan Status', sortable: true, render: (v: any, row: any) => row.rowType === 'user-loan' ? (<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(row.status)}`}>{row.status ?? '-'}</span>) : '' },
            ];

            return (
              <div className="space-y-4">
                <div className="pt-2">
                  <KeyMetrics
                    hardcodedMetrics={metrics}
                    isMetricsExpanded={isDeviceMetricsExpanded}
                    setIsMetricsExpanded={setIsDeviceMetricsExpanded}
                    showHeader={false}
                  />
                </div>
                <div className="pt-2">
                  <CustomTableView
                    title=""
                    columns={mergedColumns}
                    data={mergedRows.slice(0, visibleRowsCount)}
                    initialRowLimit={visibleRowsCount}
                    isExpanded={true}
                    showCSVExport={false}
                    exportRef={deviceTableRef}
                    hasTotalRow={false}
                    onRowClick={(row: any) => {
                      if (row && (row.rowType === 'user' || row.rowType === 'user-loan' || row.rowType === 'user-only') && row.user_id) {
                        try {
                          handleSelect('customer', String(row.user_id), row.user_name ?? null);
                        } catch (e) {
                          // ignore
                        }
                      }
                    }}
                  />
                </div>

                {/* Pagination Controls */}
                {(() => {
                  // Re-calculate the count to determine if "Show More" is needed
                  const graphUserIds = new Set<string>();
                  if (visibleLinks && Array.isArray(visibleLinks)) {
                    visibleLinks.forEach((link: any) => {
                      const extractId = (node: any) => {
                        const id = node?.properties?.userid || node?.properties?.user_id || node?.id;
                        if (id && String(id) !== String(customerId)) graphUserIds.add(String(id));
                      };
                      if (link.sourceNode) extractId(link.sourceNode);
                      if (link.targetNode) extractId(link.targetNode);
                    });
                  }
                  const totalPossibleRows = mergedRows.length;
                  const hasMore = visibleRowsCount < totalPossibleRows;

                  if (!hasMore) return null;

                  return (
                    <div className="flex justify-center pt-2 pb-4">
                      <button
                        onClick={() => setVisibleRowsCount(prev => prev + 10)}
                        disabled={isNetworkMetricsLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-white border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        {isNetworkMetricsLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Show More</span>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </MotionDiv>
      </MotionDiv>
    </>
  );
};

export default CustomerLinkagesTab;
