import React, { useMemo, useEffect, useRef } from 'react';
import { parseEdgeSources } from './EntityGraphUtils';

// Import the same filter components used in CustomList
import { 
  FilterOption, 
  FilterGroupType, 
  BaseFilterGroup, 
  FilterGroupsState, 
  FilterState,
  useFilterState as useCustomListFilterState
} from '../CustomList/customListFilter';

export interface EntityGraphFilterProps {
  filterGroups: FilterGroupsState;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  showFilterToggle?: boolean;
  filterTitle?: string;
  onFilterChange?: (filteredData: any[]) => void;
  data?: any[];
  resetKey?: number; // Add reset key prop
  hideSecondaryFilters?: boolean; // New prop to hide secondary filters
  hideQuaternaryFilters?: boolean; // New prop to hide quaternary filters
  pruneLowDegreeNodes?: boolean; // Toggle to control pruning of low-degree nodes
}

// Re-export the types for convenience
export type { FilterOption, FilterGroupType, BaseFilterGroup, FilterGroupsState, FilterState };

// Use the same filter state hook as CustomList
export const useEntityGraphFilterState = useCustomListFilterState;

// Custom hook for filtering graph data
export const useEntityGraphFilteredData = (
  data: any[],
  filterGroups: FilterGroupsState,
  filterState: FilterState,
  pruneLowDegreeNodes: boolean = false,
  fullData?: any[] // Full unfiltered data (all degrees) for calculating branchCount
) => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      console.log('[useEntityGraphFilteredData] No data provided');
      return data;
    }

    console.log('[useEntityGraphFilteredData] START - Input data:', {
      inputLength: data.length,
      firstItem: data[0],
      hasSynthetic: data.some((item: any) => item.isSynthetic === true),
      filterGroups: {
        primary: filterGroups.primary?.length,
        secondary: filterGroups.secondary?.length,
        tertiary: filterGroups.tertiary?.length,
        quaternary: filterGroups.quaternary?.length
      },
      filterState,
      degreeFilter: filterState.secondarySelected?.['degree-filter'],
      pruneLowDegreeNodes
    });

    let filteredData = [...data];

    // STEP 1: Apply degree filter FIRST - this is the most important filter and must be strictly enforced
    // Get degree selection from filterState, with fallback to filterGroups
    let degreeSelected: string[] = (filterState.secondarySelected && filterState.secondarySelected['degree-filter']) || [];
    
    // Fallback: if not in filterState, try to get from filterGroups
    if (degreeSelected.length === 0 && filterGroups.secondary) {
      const degreeFilterGroup = filterGroups.secondary.find(g => g.id === 'degree-filter');
      if (degreeFilterGroup && degreeFilterGroup.selectedValues && degreeFilterGroup.selectedValues.length > 0) {
        degreeSelected = degreeFilterGroup.selectedValues;
        console.log('[useEntityGraphFilteredData] Using degree from filterGroups:', degreeSelected);
      }
    }

    // Map degree string to a numeric level
    const degreeMapToLevel: Record<string, number> = {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6
    };

    // Determine the highest requested degree level from the selected values
    const selectedLevels = degreeSelected.map((d: string) => degreeMapToLevel[d] || 0).filter((n: number) => n > 0);
    const maxSelectedLevel = selectedLevels.length > 0 ? Math.max(...selectedLevels) : 0;

    // Helper function to get numeric degree from item (reusable)
    const getItemNumericDegreeHelper = (item: any): number => {
      if (item.numericDegree !== undefined && item.numericDegree !== null) {
        return Number(item.numericDegree);
      }
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
      return normalizeDegree(item.degree);
    };

    // STRICTLY apply degree filter - only show links up to the selected degree
    if (degreeSelected.length > 0 && maxSelectedLevel > 0) {
      const beforeDegreeFilter = filteredData.length;
      filteredData = filteredData.filter(item => {
        // EXPLICIT RULE: NEVER filter out synthetic single-node entries
        // These must always be displayed regardless of degree settings
        if (item.isSynthetic === true && item.source === item.target) {
          return true;
        }
        
        const itemNumericDegree = getItemNumericDegreeHelper(item);
        
        // STRICT: Only include if degree is within the selected range (1 to maxSelectedLevel)
        const isWithinRange = itemNumericDegree >= 0 && itemNumericDegree <= maxSelectedLevel;
        
        if (!isWithinRange) {
          console.log('[useEntityGraphFilteredData] STRICT: Filtering out link beyond degree limit:', {
            itemNumericDegree,
            maxSelectedLevel,
            degreeSelected,
            source: item.source,
            target: item.target,
            itemDegree: item.degree,
            itemNumericDegreeProp: item.numericDegree
          });
        }
        
        return isWithinRange;
      });
      
      console.log('[useEntityGraphFilteredData] STRICT degree filter applied FIRST:', {
        degreeSelected,
        maxSelectedLevel,
        beforeFilter: beforeDegreeFilter,
        afterFilter: filteredData.length,
        removed: beforeDegreeFilter - filteredData.length,
        hasSyntheticAfterFilter: filteredData.some((item: any) => item.isSynthetic === true)
      });
    } else {
      console.log('[useEntityGraphFilteredData] NO DEGREE FILTER APPLIED:', {
        degreeSelected,
        maxSelectedLevel,
        currentFilteredDataLength: filteredData.length,
        hasSyntheticInFilteredData: filteredData.some((item: any) => item.isSynthetic === true)
      });
    }

    // Apply primary filters (Graph View filter - currently dummy, has no effect)
    if (filterGroups.primary) {
      filterGroups.primary.forEach(group => {
        // Graph View filter is currently a dummy filter with no effect on graph
        if (group.id === 'graph-view-filter') {
          // No filtering applied - placeholder for future functionality
        }
      });
    }

    // Apply secondary filters (node selection - degree filter already applied above)
    if (filterGroups.secondary) {
      filterGroups.secondary.forEach(group => {
        const selectedValues = filterState.secondarySelected[group.id] || [];
        if (selectedValues.length > 0) {
          if (group.id === 'node-selector') {
            // Filter by selected nodes
            filteredData = filteredData.filter(item => {
              return selectedValues.includes(item.source) || selectedValues.includes(item.target);
            });
          }
          // Note: degree-filter is already handled above
        }
      });
    }

    // Apply tertiary filters (node type, gov ID, and source filters)
    // Helper to infer gov id type (PAN/AADHAAR) from a value when gov_id_type is missing
    const inferGovIdTypeFromValue = (val: any): string | null => {
      if (!val && val !== 0) return null;
      const s = String(val || '').trim();
      if (!s) return null;
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
      if (panRegex.test(s)) return 'PAN';
      const aadhaarRegex = /^\d{12}$/;
      if (aadhaarRegex.test(s)) return 'AADHAAR';
      return null;
    };

    if (filterGroups.tertiary) {
      filterGroups.tertiary.forEach(group => {
        const selectedValues = filterState.tertiarySelected?.[group.id] || [];
        if (selectedValues.length > 0) {
          if (group.id === 'node-type-filter') {
            // Filter by node type - applies to ALL degrees within the selected degree limit
            // Links have already been checked against the degree filter above
            filteredData = filteredData.filter(item => {
              // EXPLICIT RULE: NEVER filter out synthetic single-node entries
              // These must always be displayed regardless of node type filter
              if (item.isSynthetic === true && item.source === item.target) {
                console.log('[useEntityGraphFilteredData] Node type filter: Synthetic entry PASSED node type filter');
                return true;
              }
              
              // Get the numeric degree of this item using the same helper function
              const itemNumericDegree = getItemNumericDegreeHelper(item);
              
              // CRITICAL: Always check degree limit FIRST, before any other filtering logic
              // This ensures degree filter is strictly enforced even when node type filter is active
              // If a degree filter is active, enforce it strictly
              if (degreeSelected.length > 0 && maxSelectedLevel > 0) {
                // Exclude any link that exceeds the selected degree limit
                if (itemNumericDegree > maxSelectedLevel) {
                  console.log('[useEntityGraphFilteredData] Node type filter: Excluding link beyond degree limit:', {
                    itemNumericDegree,
                    maxSelectedLevel,
                    degreeSelected,
                    source: item.source,
                    target: item.target,
                    itemDegree: item.degree,
                    itemNumericDegreeProp: item.numericDegree
                  });
                  return false; // Exclude links beyond degree limit
                }
              }
              
              // Node type filtering applies to ALL degrees, not just first-degree links
                            
              // Separate GOV ID type filters from regular node type filters
              const govIdSelectedValues = selectedValues
                .filter(v => String(v).startsWith('GOV_ID:'))
                .map(v => {
                  // Extract the gov_id_type value after "GOV_ID:" prefix
                  const extracted = String(v).replace(/^GOV_ID:/, '').trim();
                  return extracted;
                });
              
              const regularNodeTypeValues = selectedValues.filter(v => !String(v).startsWith('GOV_ID:'));
              
              // Check regular node types (exclude GOV_ID nodes from this check)
              const sourceType = item.sourceType || getNodeType(item.source);
              const targetType = item.targetType || getNodeType(item.target);
              // Check if node is GOV_ID strictly by its type property (do not rely on label text)
              const sourceIsGovId = (sourceType === 'GOV_ID') || (item.sourceNode?.type === 'GOV_ID') || (item.source?.type === 'GOV_ID');
              const targetIsGovId = (targetType === 'GOV_ID') || (item.targetNode?.type === 'GOV_ID') || (item.target?.type === 'GOV_ID');
              
              const matchesRegularNodeType = regularNodeTypeValues.length > 0 
                ? (regularNodeTypeValues.includes(sourceType) || regularNodeTypeValues.includes(targetType))
                : false;
              
              // Handle GOV ID type filtering - ONLY filter by gov_id_type property, not by label
              if (govIdSelectedValues.length > 0) {
                // Normalize function: only trim and uppercase for case-insensitive exact matching
                const normalizeGovIdValue = (val: string): string => {
                  if (!val) return '';
                  return String(val).trim().toUpperCase();
                };
                
                // Normalize selected values (e.g., "AADHAAR" -> "AADHAAR")
                const selectedNormalized = govIdSelectedValues.map(normalizeGovIdValue);
                
                // Check BOTH source and target nodes for gov_id_type property (regardless of node type)
                // We check ALL nodes, not just GOV_ID labeled nodes, because we filter by gov_id_type property
                let sourceHasMatchingGovIdType = false;
                let targetHasMatchingGovIdType = false;
                
                // Check source node's gov_id_type property, or infer from value if missing
                const sourceNodeProps = item.sourceNode?.properties || {};
                let sourceGovIdType = sourceNodeProps.gov_id_type || sourceNodeProps.id_type;
                if (!sourceGovIdType) {
                  const inferred = inferGovIdTypeFromValue(sourceNodeProps.gov_id_value || sourceNodeProps.value || sourceNodeProps.id_value || sourceNodeProps.idValue || item.sourceNode?.name || item.sourceNode?.id);
                  if (inferred) sourceGovIdType = inferred;
                }
                if (sourceGovIdType) {
                  const nodeGovIdNormalized = normalizeGovIdValue(String(sourceGovIdType));
                  sourceHasMatchingGovIdType = selectedNormalized.includes(nodeGovIdNormalized);
                }
                
                // Check target node's gov_id_type property, or infer from value if missing
                const targetNodeProps = item.targetNode?.properties || {};
                let targetGovIdType = targetNodeProps.gov_id_type || targetNodeProps.id_type;
                if (!targetGovIdType) {
                  const inferred = inferGovIdTypeFromValue(targetNodeProps.gov_id_value || targetNodeProps.value || targetNodeProps.id_value || targetNodeProps.idValue || item.targetNode?.name || item.targetNode?.id);
                  if (inferred) targetGovIdType = inferred;
                }
                if (targetGovIdType) {
                  const nodeGovIdNormalized = normalizeGovIdValue(String(targetGovIdType));
                  targetHasMatchingGovIdType = selectedNormalized.includes(nodeGovIdNormalized);
                }
                
                // If either node has a matching gov_id_type, include this link
                // If neither node has a matching gov_id_type, exclude this link
                const hasMatchingGovIdType = sourceHasMatchingGovIdType || targetHasMatchingGovIdType;
                
                if (!hasMatchingGovIdType) {
                  // Neither node has a matching gov_id_type - exclude this link
                  // UNLESS regular node types are also selected and match
                  if (regularNodeTypeValues.length > 0) {
                    return matchesRegularNodeType;
                  }
                  return false;
                }
                
                // At least one node has matching gov_id_type - include this link
                // Also check if regular node types match (for non-GOV_ID nodes in the link)
                if (regularNodeTypeValues.length > 0) {
                  return matchesRegularNodeType || hasMatchingGovIdType;
                }
                return true;
              }
              
              // If no GOV ID filter selected, just check regular node types
              // But exclude GOV_ID nodes unless they're explicitly selected as a node type
              if (sourceIsGovId || targetIsGovId) {
                // GOV_ID node - only show if explicitly selected as a node type
                return regularNodeTypeValues.includes('GOV_ID') || matchesRegularNodeType;
              }
              
              return matchesRegularNodeType;
            });
            
            // CRITICAL: Re-apply degree filter after node type filter to ensure it's strictly enforced
            // This is a safety measure in case the node type filter somehow bypassed the degree limit
            if (degreeSelected.length > 0 && maxSelectedLevel > 0) {
              const beforeRecheck = filteredData.length;
              filteredData = filteredData.filter(item => {
                // EXPLICIT RULE: NEVER filter out synthetic single-node entries
                if (item.isSynthetic === true && item.source === item.target) {
                  console.log('[useEntityGraphFilteredData] Node type filter: Synthetic entry PASSED degree re-check');
                  return true;
                }
                
                const itemNumericDegree = getItemNumericDegreeHelper(item);
                const isWithinRange = itemNumericDegree >= 0 && itemNumericDegree <= maxSelectedLevel;
                if (!isWithinRange) {
                  console.log('[useEntityGraphFilteredData] Node type filter: Re-checking degree - excluding link:', {
                    itemNumericDegree,
                    maxSelectedLevel,
                    source: item.source,
                    target: item.target
                  });
                }
                return isWithinRange;
              });
              
              console.log('[useEntityGraphFilteredData] Node type filter applied with degree re-check:', {
                degreeSelected,
                maxSelectedLevel,
                beforeRecheck,
                afterNodeTypeFilter: filteredData.length,
                removed: beforeRecheck - filteredData.length,
                nodeTypeFilterActive: true
              });
            } else {
              console.log('[useEntityGraphFilteredData] Node type filter applied:', {
                degreeSelected,
                maxSelectedLevel,
                afterNodeTypeFilter: filteredData.length,
                nodeTypeFilterActive: true
              });
            }
          } else if (group.id === 'source-filter') {
            // Filter by source category - use parseEdgeSources to match how sources are displayed
            // This ensures the filter matches exactly what's shown on linkage lines and in the dropdown
            filteredData = filteredData.filter(item => {
              // EXPLICIT RULE: NEVER filter out synthetic single-node entries
              // These must always be displayed regardless of source filter
              if (item.isSynthetic === true && item.source === item.target) {
                return true;
              }
              
              // Use the same logic as CustomerLinkagesTab.tsx and EntityGraph.tsx for extracting sources:
              // 1. Primary: parseEdgeSources on edgeProperties.data (if present) or link.data, and edgeProperties.source
              let displaySource = parseEdgeSources(item.edgeProperties?.data || item.data, item.edgeProperties?.source);

              // 2. Fallback: If no displaySource, prefer edgeProperties.source, then connected node properties
              if (!displaySource) {
                const sourceValue = item.edgeProperties?.source ||
                                   item.targetNode?.properties?.source || 
                                   item.sourceNode?.properties?.source;
                if (sourceValue) {
                  displaySource = parseEdgeSources(null, sourceValue);
                }
              }
              
              // If no sources found, don't filter out (show the node)
              if (!displaySource) {
                return true;
              }
              
              // Normalize selected values for comparison (trim and handle case)
              const normalizedSelected = selectedValues.map(v => String(v).trim());
              
              // Split by comma since parseEdgeSources returns comma-separated sources
              const sourceCategories = displaySource.split(',').map((s: string) => s.trim()).filter(Boolean);
              
              // Check if any of the node's source categories match any selected filter value
              // Use case-insensitive comparison to handle any mismatches
              const matches = sourceCategories.some((category: string) => {
                const normalizedCategory = String(category).trim();
                return normalizedSelected.some(selected => 
                  normalizedCategory === selected || 
                  normalizedCategory.toLowerCase() === selected.toLowerCase()
                );
              });
              
              return matches;
            });
          }
        }
      });
    }

    // Apply quaternary filters (reserved for future use)
    if (filterGroups.quaternary) {
      filterGroups.quaternary.forEach(group => {
        // Quaternary filters reserved for future functionality
      });
    }

    // FINAL SAFEGUARD: Re-apply degree filter one more time after all filters to ensure it's never bypassed
    // This is critical when node type filters or other filters are applied
    if (degreeSelected.length > 0 && maxSelectedLevel > 0) {
      const beforeFinalCheck = filteredData.length;
      filteredData = filteredData.filter(item => {
        // EXPLICIT RULE: NEVER filter out synthetic single-node entries
        if (item.isSynthetic === true && item.source === item.target) {
          return true;
        }
        
        const itemNumericDegree = getItemNumericDegreeHelper(item);
        const isWithinRange = itemNumericDegree >= 0 && itemNumericDegree <= maxSelectedLevel;
        if (!isWithinRange) {
          console.log('[useEntityGraphFilteredData] FINAL SAFEGUARD: Excluding link beyond degree limit:', {
            itemNumericDegree,
            maxSelectedLevel,
            degreeSelected,
            source: item.source,
            target: item.target
          });
        }
        return isWithinRange;
      });
      
      if (beforeFinalCheck !== filteredData.length) {
        console.warn('[useEntityGraphFilteredData] FINAL SAFEGUARD: Removed additional links beyond degree limit:', {
          beforeFinalCheck,
          afterFinalCheck: filteredData.length,
          removed: beforeFinalCheck - filteredData.length,
          degreeSelected,
          maxSelectedLevel
        });
      }
    }

    // Note: Degree filter is already applied FIRST above, before all other filters
    // This ensures strict enforcement of degree limits regardless of other filters applied
    // If the degree filter requests second- or higher-degree connections, prune low-degree nodes to reduce clutter
    // Semantics:
    // - 'first' + Hide Non-Branching = Yes: show only customer node(s) with degree 0 (no linkages to attribute nodes)
    // - 'second' : remove leaf nodes (degree === 1), but keep CUSTOMER nodes
    // - 'third' or higher : remove nodes with degree <= 2 (so only nodes with 3+ connections remain), but keep CUSTOMER nodes
    // This behavior is controlled by the pruneLowDegreeNodes toggle

    // Handle first degree + Hide Non-Branching Nodes = Yes: show customer node + nodes with branchCount > 0
    if (pruneLowDegreeNodes && maxSelectedLevel === 1) {
      // Build a map of branchCount values from API (prefer API value, fallback to calculated count)
      const nodeBranchCounts = new Map<string, number>();
      const nodeLinkCounts = new Map<string, number>();
      const dataForBranchCount = fullData || data;
      
      // First, try to get branchCount from API (check both node object and properties)
      dataForBranchCount.forEach((item: any) => {
        const sourceId = typeof item.source === 'object' ? String(item.source?.id) : String(item.source);
        const targetId = typeof item.target === 'object' ? String(item.target?.id) : String(item.target);
        
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
      // 2. Links from customer to nodes with branchCount > 1
      // 3. Links between nodes with branchCount > 1 (if they exist in first degree)
      filteredData = filteredData.filter(item => {
        // EXPLICIT RULE: NEVER filter out synthetic single-node entries
        if (item.isSynthetic === true && item.source === item.target) {
          console.log('[useEntityGraphFilteredData] Pruning (first degree): Synthetic entry PASSED pruning');
          return true;
        }
        
        const sourceId = typeof item.source === 'object' ? String(item.source?.id) : String(item.source);
        const targetId = typeof item.target === 'object' ? String(item.target?.id) : String(item.target);
        const sourceType = typeof item.source === 'object' ? item.source?.type : item.sourceType;
        const targetType = typeof item.target === 'object' ? item.target?.type : item.targetType;
        
        // Check if source or target is customer node
        const sourceIsCustomer = sourceType?.toLowerCase().includes('customer') || sourceType?.toLowerCase().includes('person');
        const targetIsCustomer = targetType?.toLowerCase().includes('customer') || targetType?.toLowerCase().includes('person');
        
        // Get branchCount for source and target (use API value directly, no -1)
        const sourceBranchCount = nodeBranchCounts.get(sourceId) ?? 0;
        const targetBranchCount = nodeBranchCounts.get(targetId) ?? 0;
        
   // Keep link if:
   // 1. Source is customer AND target has branchCount > 1 (customer to any branching node)
   // 2. Target is customer AND source has branchCount > 1 (any branching node to customer)
   // 3. Both source and target have branchCount > 1 (connected branching nodes in first degree)
   // Use API branchCount value directly (no -1 adjustment, show if > 1)
   return (sourceIsCustomer && targetBranchCount > 1) || 
     (targetIsCustomer && sourceBranchCount > 1) || 
     (sourceBranchCount > 1 && targetBranchCount > 1);
      });
    } else if (pruneLowDegreeNodes && maxSelectedLevel >= 2) {
      // Compute degree counts for each node id in the current filteredData
      const degreeMap: Map<string, number> = new Map();
      const nodeTypeMap: Map<string, string> = new Map(); // Track node types
      const isRootCustomerMap: Map<string, boolean> = new Map(); // Track if node is root customer
      const nodeBranchCountMap: Map<string, number> = new Map(); // Track branch count for each node
      
      // Helper to extract branch count safely
      const getBranchCount = (node: any): number => {
        if (!node) return 0;
        return node.branchCount ?? 
               node.branch_count ?? 
               node.properties?.branchCount ?? 
               node.properties?.branch_count ?? 
               0;
      };

      filteredData.forEach(item => {
        const sourceId = typeof item.source === 'object' ? String(item.source?.id) : String(item.source);
        const targetId = typeof item.target === 'object' ? String(item.target?.id) : String(item.target);
        const sourceType = typeof item.source === 'object' ? item.source?.type : item.sourceType;
        const targetType = typeof item.target === 'object' ? item.target?.type : item.targetType;
        
        degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
        degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
        nodeTypeMap.set(sourceId, sourceType);
        nodeTypeMap.set(targetId, targetType);
        
        // Track branch counts
        // If node object is available (it usually is in this context), use it
        // Otherwise we might miss it, but usually sourceNode/targetNode are populated or obtainable
        if (!nodeBranchCountMap.has(sourceId)) {
          nodeBranchCountMap.set(sourceId, getBranchCount(item.sourceNode || item.source));
        }
        if (!nodeBranchCountMap.has(targetId)) {
          nodeBranchCountMap.set(targetId, getBranchCount(item.targetNode || item.target));
        }

        // Identify root customer: the one that appears as sourceName "CUSTOMER (...)" in edges
        if (item.sourceName && item.sourceName.startsWith('CUSTOMER (')) {
          isRootCustomerMap.set(sourceId, true);
        }
        if (item.targetName && item.targetName.startsWith('CUSTOMER (')) {
          isRootCustomerMap.set(targetId, true);
        }
      });

      // Build set of nodes to remove depending on selected degree level
      const nodesToRemove = new Set<string>();
      
      // Unified logic for pruning based on branchCount:
      // 1. Always keep CUSTOMER nodes and Root Customer
      // 2. Prune nodes designated as non-branching (branchCount <= 1)
      // This applies to ALL nodes, including those at the frontier (Degree 3)
      degreeMap.forEach((localDegree, id) => {
        const nodeType = nodeTypeMap.get(id);
        const isRootCustomer = isRootCustomerMap.get(id);
        const globalBranchCount = nodeBranchCountMap.get(id) || 0;
        
        // Check if node is a customer type
        const isCustomer = (nodeType || '').toLowerCase().includes('customer') || 
                           (nodeType || '').toLowerCase().includes('person');

        if (!isCustomer && !isRootCustomer) {
           // Verify based on branchCount.
           // If globalBranchCount > 1, it is a branching node -> KEEP
           // If globalBranchCount <= 1, it is a leaf -> PRUNE
           if (globalBranchCount <= 1) {
             nodesToRemove.add(id);
           }
        }
      });
      

      if (nodesToRemove.size > 0) {
        // Remove any link that references a pruned node so the nodes disappear from the graph
        filteredData = filteredData.filter(item => {
          // EXPLICIT RULE: NEVER filter out synthetic single-node entries
          if (item.isSynthetic === true && item.source === item.target) {
            console.log('[useEntityGraphFilteredData] Pruning (multi-degree): Synthetic entry PASSED pruning');
            return true;
          }
          
          const sourceId = typeof item.source === 'object' ? String(item.source?.id) : String(item.source);
          const targetId = typeof item.target === 'object' ? String(item.target?.id) : String(item.target);
          return !nodesToRemove.has(sourceId) && !nodesToRemove.has(targetId);
        });
      }
    }

    console.log('[useEntityGraphFilteredData] Returning filtered data:', {
      outputLength: filteredData.length,
      firstItem: filteredData[0],
      hasSynthetic: filteredData.some((item: any) => item.isSynthetic === true),
      removed: data.length - filteredData.length,
      prunedNodesCount: (filterState.secondarySelected?.['degree-filter'] && pruneLowDegreeNodes) ? 'active' : 'inactive'
    });

    return filteredData;
  }, [data, filterGroups, filterState, pruneLowDegreeNodes, fullData]);
};

// Import the CustomListFilter component directly
import CustomListFilter from '../CustomList/customListFilter';

// Import getNodeType from the actual data file
import { getNodeType } from '@/app/pages/Customer/Components/CustomerLinkagesSampleData';

// EntityGraphFilter component that uses the same UI as CustomList
const EntityGraphFilter: React.FC<EntityGraphFilterProps> = ({
  filterGroups,
  filterState,
  setFilterState,
  showFilterToggle = false,
  filterTitle,
  onFilterChange,
  data = [],
  resetKey = 0,
  hideSecondaryFilters = false,
  hideQuaternaryFilters = false,
  pruneLowDegreeNodes = false
}) => {
  // Use the same filtered data logic
  const filteredData = useEntityGraphFilteredData(data, filterGroups, filterState, pruneLowDegreeNodes);

  // Keep a ref to the latest filterGroups so the reset effect can read a stable
  // snapshot without depending on the identity of filterGroups (which can
  // change often and cause loops).
  const filterGroupsRef = useRef<FilterGroupsState | null>(filterGroups);
  useEffect(() => {
    filterGroupsRef.current = filterGroups;
  }, [filterGroups]);

  // Reset filter state when resetKey changes
  useEffect(() => {
    if (resetKey > 0) {
      // Reset all filter states to their initial values
      const resetState: FilterState = {
        primarySelected: {},
        secondarySelected: {},
        tertiarySelected: {},
        quaternarySelected: {},
        searchbarQueries: {},
        datetimeRanges: {}
      };
      
      // Set initial values based on filterGroups
      // Use the current filterGroups snapshot at the time of reset.
      // To avoid an infinite loop caused by filterGroups changing identity when
      // selected values update (which would retrigger this effect), we read
      // from a ref that is updated whenever filterGroups changes and only
      // depend on resetKey and setFilterState here.
      const currentGroups = filterGroupsRef.current || filterGroups;

      if (currentGroups.primary) {
        currentGroups.primary.forEach(group => {
          if (group.selectedValues.length > 0 && group.id !== 'node-selector') {
            // Don't reset node-selector to its initial values, keep it empty
            resetState.primarySelected[group.id] = [...group.selectedValues];
          }
        });
      }

      // Preserve any pre-selected values for secondary/tertiary/quaternary groups
      // (important: degree-filter lives in secondary and should not be cleared on a layout reset)
      if (currentGroups.secondary) {
        currentGroups.secondary.forEach(group => {
          if (group.selectedValues && group.selectedValues.length > 0) {
            resetState.secondarySelected[group.id] = [...group.selectedValues];
          }
        });
      }

      if (currentGroups.tertiary) {
        currentGroups.tertiary.forEach(group => {
          if (group.selectedValues && group.selectedValues.length > 0) {
            resetState.tertiarySelected[group.id] = [...group.selectedValues];
          }
        });
      }

      if (currentGroups.quaternary) {
        currentGroups.quaternary.forEach(group => {
          if (group.selectedValues && group.selectedValues.length > 0) {
            resetState.quaternarySelected[group.id] = [...group.selectedValues];
          }
        });
      }

      setFilterState(resetState);
    }
  }, [resetKey, setFilterState]);

  // Call onFilterChange when filtered data changes
  useEffect(() => {
    onFilterChange?.(filteredData);
  }, [filteredData, onFilterChange]);

  // Filter out secondary and tertiary filters if they should be hidden
  const filteredFilterGroups: FilterGroupsState = {
    ...filterGroups,
    secondary: hideSecondaryFilters ? undefined : filterGroups.secondary,
    tertiary: filterGroups.tertiary,
    quaternary: hideQuaternaryFilters ? undefined : filterGroups.quaternary
  };
  return (
    <CustomListFilter
      filterGroups={filteredFilterGroups}
      filterState={filterState}
      setFilterState={setFilterState}
      showFilterToggle={showFilterToggle}
      filterTitle={filterTitle}
      // Without this, FilterRow falls back to its expanded layout and renders
      // every group on its own row — which is why Node Type and Source stacked
      // no matter what widths they were given. The graph's filter bar is a
      // single toolbar, so it is always inline.
      forceInlineLayout
    />
  );
};

export default EntityGraphFilter;
