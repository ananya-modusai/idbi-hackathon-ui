/**
 * Web Worker for Entity Graph calculations.
 * Offloads heavy data transformation, filtering, and pagination from the main thread.
 */

// --- HELPER FUNCTIONS (Copied from utils to ensure self-contained worker) ---

const capitalizeWords = (text: string): string => {
  if (!text) return '';
  if (/^[\d\s,.\-₹$€£¥]+$/.test(text.trim())) return text;
  return text
    .split(' ')
    .filter(w => w)
    .map(word => {
      if (!word) return word;
      if (/^[\d\s,.\-₹$€£¥]+$/.test(word)) return word;
      if (word.toLowerCase() === 'sms') return 'SMS';
      if (word.toLowerCase().startsWith('sms_')) return 'SMS ' + word.substring(4).replace(/_/g, ' ');
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const mapSourceValue = (sourceStr: string): string => {
  if (!sourceStr || typeof sourceStr !== 'string') return '';
  const lower = sourceStr.toLowerCase().trim();
  if (lower.includes('bank transaction') || lower.includes('bank_transaction') || lower.includes('banktransaction') || lower.includes('bank-transaction')) {
    if (lower.includes('counterparty') || lower.includes('upi')) return 'sms_counterparty';
    return 'sms';
  }
  return sourceStr;
};

const extractSourcesRecursively = (value: any, depth: number = 0): string[] => {
  const MAX_DEPTH = 5;
  if (depth > MAX_DEPTH) return [];
  if (value === null || value === undefined) return [];
  const extracted: string[] = [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        extracted.push(...extractSourcesRecursively(parsed, depth + 1));
      } catch (e) {
        extracted.push(trimmed);
      }
    } else {
      extracted.push(trimmed);
    }
  } else if (Array.isArray(value)) {
    value.forEach(item => extracted.push(...extractSourcesRecursively(item, depth + 1)));
  } else if (typeof value === 'object') {
    if (value.source) extracted.push(...extractSourcesRecursively(value.source, depth + 1));
    else if (value.type) extracted.push(...extractSourcesRecursively(value.type, depth + 1));
    else if (value.value) extracted.push(...extractSourcesRecursively(value.value, depth + 1));
  }
  return extracted;
};

const parseEdgeSources = (dataField: any, fallbackSource?: string): string => {
  let sources: string[] = [];
  if (dataField) sources.push(...extractSourcesRecursively(dataField));
  if (sources.length === 0 && fallbackSource) sources.push(...extractSourcesRecursively(fallbackSource));

  const uniqueSources = new Set<string>();
  sources.forEach(s => {
    if (!s) return;
    const mapped = mapSourceValue(s);
    if (mapped.startsWith('[') || mapped.startsWith('{')) return;

    let finalStr = mapped;
    if (finalStr.toLowerCase() === 'sms') finalStr = 'SMS';
    else if (finalStr.toLowerCase().startsWith('sms_')) finalStr = 'SMS ' + finalStr.substring(4).replace(/_/g, ' ');
    else finalStr = finalStr.replace(/_/g, ' ');

    const formatted = capitalizeWords(finalStr);
    if (formatted) uniqueSources.add(formatted);
  });

  if (uniqueSources.size === 0) return '';
  return Array.from(uniqueSources).slice(0, 3).join(', ');
};

const degreeNameToRank = (d: any): number => {
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
};

const getNodeType = (name: string): string => {
  if (!name) return 'merchant';
  if (name.toLowerCase().includes('cash') || name.toLowerCase().includes('withdrawal')) return 'person';
  if (name.toLowerCase().includes('device')) return 'device usage';
  if (name.toLowerCase().includes('vendor') || name.toLowerCase().includes('supplier')) return 'merchant';
  if (name.toLowerCase().includes('gateway') || name.toLowerCase().includes('settlement') || name.toLowerCase().includes('card')) return 'merchant';
  return 'merchant';
};

const getNodeStyle = (nodeType: string) => {
  const baseStyle = { fontSize: 12, fontWeight: 'bold', strokeWidth: 2 };
  const normalizedType = nodeType?.toUpperCase() || '';
  
  if (normalizedType.includes('CUSTOMER') || normalizedType === 'PERSON') return { ...baseStyle, fill: '#64748b', stroke: '#475569' };
  if (normalizedType.includes('GOV_ID') || normalizedType.includes('PAN') || normalizedType.includes('AADHAAR')) return { ...baseStyle, fill: '#5eead4', stroke: '#2d8a84' };
  if (normalizedType.includes('PHONE')) return { ...baseStyle, fill: '#9ca3af', stroke: '#6b7280' };
  if (normalizedType.includes('EMAIL')) return { ...baseStyle, fill: '#9f7aea', stroke: '#6b5b95' };
  if (normalizedType.includes('ADDRESS')) return { ...baseStyle, fill: '#c4976a', stroke: '#9d7c5c' };
  if (normalizedType.includes('PINCODE')) return { ...baseStyle, fill: '#d89d6e', stroke: '#b87a4f' };
  if (normalizedType.includes('GEOLOCATION') || normalizedType === 'GEONODE') return { ...baseStyle, fill: '#b8860b', stroke: '#8b6914' };
  if (normalizedType.includes('DEVICE')) return { ...baseStyle, fill: '#a1a5b4', stroke: '#7c7f8a' };
  if (normalizedType.includes('BANK') || normalizedType.includes('ACCOUNT') || normalizedType.includes('VPA') || normalizedType.includes('UPI')) return { ...baseStyle, fill: '#5eead4', stroke: '#2d8a84' };
  if (normalizedType.includes('BRANCH')) return { ...baseStyle, fill: '#6b8e71', stroke: '#5a7360' };
  if (normalizedType.includes('MERCHANT') || normalizedType === 'BANK_AGENT') return { ...baseStyle, fill: '#6b5b95', stroke: '#4a3f6b' };
  if (normalizedType.includes('REFERENCE')) return { ...baseStyle, fill: '#8b8589', stroke: '#6b5f6b' };
  if (normalizedType.includes('HIGH_RISK')) return { ...baseStyle, fill: '#a76c5d', stroke: '#884433' };
  return { ...baseStyle, fill: '#8b92a1', stroke: '#6b7380' };
};

// --- WORKER EVENT HANDLER ---

self.onmessage = (event) => {
  const { 
    filteredData = [], 
    expandedData = [], 
    filterState = {}, 
    pruneLowDegreeNodes = false, 
    data = [], 
    fullData = [], 
    collapsedNodesRaw = [], 
    openedNodeIdsRaw = [],
    strongConnector = null, 
    hiddenNodes = [], 
    paginationLimits = {}, 
    customerId = '' 
  } = event.data;

  const collapsedNodes = new Set<string>(collapsedNodesRaw);

  // 1. Compute graphData
  const nodes = new Map<string, any>();
  const links: any[] = [];
  let allData = [...filteredData, ...expandedData];

  // Deduplicate links by edgeId or composite node-pair key to prevent inflated count slots inflating limit calculations
  const linkIdSet = new Set<string>();
  allData = allData.filter((link: any) => {
    const s = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
    const t = typeof link.target === 'object' ? String(link.target.id) : String(link.target);
    const id = link.edgeId || `${s}-${t}`;
    if (linkIdSet.has(id)) return false;
    linkIdSet.add(id);
    return true;
  });

  let parentNodeId: string | null = null;
  let parentNodeObj: any = null;
  let originalLinkWithParent: any = null;
  let originalLinkNodeDirection: 'source' | 'target' | null = null;

  if (data && data.length > 0) {
    for (const link of data) {
      const sn = link.sourceNode;
      if (sn) {
        const snDeg = sn.properties?.degree ?? sn.degree;
        if (snDeg === 0 || snDeg === '0') {
          parentNodeId = String(sn.id || link.source);
          parentNodeObj = sn;
          originalLinkWithParent = link;
          originalLinkNodeDirection = 'source';
          break;
        }
      }
      const tn = link.targetNode;
      if (tn) {
        const tnDeg = tn.properties?.degree ?? tn.degree;
        if (tnDeg === 0 || tnDeg === '0') {
          parentNodeId = String(tn.id || link.target);
          parentNodeObj = tn;
          originalLinkWithParent = link;
          originalLinkNodeDirection = 'target';
          break;
        }
      }
    }

    if (!parentNodeId && customerId) {
      for (const link of data) {
        const snUserId = link.sourceNode?.properties?.userid || link.sourceNode?.properties?.user_id;
        const tnUserId = link.targetNode?.properties?.userid || link.targetNode?.properties?.user_id;

        if (snUserId && String(snUserId) === String(customerId)) {
          parentNodeId = String(link.sourceNode?.id || link.source);
          parentNodeObj = link.sourceNode;
          originalLinkWithParent = link;
          originalLinkNodeDirection = 'source';
          break;
        }
        if (tnUserId && String(tnUserId) === String(customerId)) {
          parentNodeId = String(link.targetNode?.id || link.target);
          parentNodeObj = link.targetNode;
          originalLinkWithParent = link;
          originalLinkNodeDirection = 'target';
          break;
        }
      }
    }
  }

  // Apply Strong Connector filter
  if (strongConnector === true) {
    allData = allData.filter((item: any) => {
      const type = item.edgeProperties?.connection_type || 'strong_connector';
      return type !== 'weak_connector';
    });

    if (parentNodeId) {
      const hasStrongConnections = allData.some((link: any) => {
        const s = String(link.source?.id || link.source);
        const t = String(link.target?.id || link.target);
        return s === parentNodeId || t === parentNodeId;
      });

      if (!hasStrongConnections) {
        const resolvedName = (originalLinkNodeDirection === 'source' ? originalLinkWithParent?.sourceName : originalLinkWithParent?.targetName) || 
                            parentNodeObj?.properties?.customer_name || 
                            parentNodeObj?.name || 
                            parentNodeId;

        const resolvedFullName = (originalLinkNodeDirection === 'source' ? (originalLinkWithParent?.sourceFullName || originalLinkWithParent?.sourceName) : (originalLinkWithParent?.targetFullName || originalLinkWithParent?.targetName)) || 
                                resolvedName;

        allData = [{
          _isForcedParentIsolatedNode: true,
          source: parentNodeId,
          target: parentNodeId,
          sourceName: resolvedName,
          targetName: resolvedName,
          sourceFullName: resolvedFullName,
          targetFullName: resolvedFullName,
          sourceNode: parentNodeObj,
          targetNode: parentNodeObj,
          sourceType: parentNodeObj?.type || 'CUSTOMER',
          targetType: parentNodeObj?.type || 'CUSTOMER',
          label: 'SELF',
          risk: '',
          notes: '',
          degree: 'first',
          numericDegree: 0,
          edgeId: `${parentNodeId}-self`,
          edgeProperties: {},
          isSynthetic: true
        }];
      }
    }
  }

  if (hiddenNodes && hiddenNodes.length > 0) {
    const hiddenNodeSet = new Set(hiddenNodes);
    allData = allData.filter((item: any) => !hiddenNodeSet.has(String(item.source)) && !hiddenNodeSet.has(String(item.target)));
  }

  const hasSyntheticSingleNode = data && data.length > 0 && data.some((link: any) => link.isSynthetic === true && link.source === link.target);
  const shouldShowIsolatedCustomer = (allData.length === 0 && data && data.length > 0) || hasSyntheticSingleNode;

  if (shouldShowIsolatedCustomer) {
    for (const link of data) {
      const sourceType = link.sourceType || getNodeType(link.source);
      const targetType = link.targetType || getNodeType(link.target);
      const sourceIsCustomer = sourceType?.toLowerCase().includes('customer') || sourceType?.toLowerCase().includes('person');
      const targetIsCustomer = targetType?.toLowerCase().includes('customer') || targetType?.toLowerCase().includes('person');
      
      if (sourceIsCustomer && !nodes.has(link.source)) {
        const sourceProps = link.sourceNode?.properties || {};
        const sourceBranchCount = sourceProps.branchCount ?? sourceProps.branch_count;
        nodes.set(link.source, {
          id: link.source,
          name: link.sourceName || link.source,
          type: sourceType,
          label: link.sourceNode?.label || sourceType,
          properties: { ...sourceProps, branchCount: sourceBranchCount, branch_count: sourceBranchCount },
          branchCount: sourceBranchCount,
          degree: 0,
          ...getNodeStyle(sourceType)
        });
      }
      if (targetIsCustomer && !nodes.has(link.target)) {
        const targetProps = link.targetNode?.properties || {};
        const targetBranchCount = targetProps.branchCount ?? targetProps.branch_count;
        nodes.set(link.target, {
          id: link.target,
          name: link.targetName || link.target,
          type: targetType,
          label: link.targetNode?.label || targetType,
          properties: { ...targetProps, branchCount: targetBranchCount, branch_count: targetBranchCount },
          branchCount: targetBranchCount,
          degree: 0,
          ...getNodeStyle(targetType)
        });
      }
    }
  }

  const linksRaw: any[] = [];
  const nodeLowestRank = new Map<string, number>();

  if (parentNodeId) {
    nodeLowestRank.set(parentNodeId, 0);
  }

  const nodeMeta = new Map<string, { id: string; name?: string; type?: string; label?: string; properties?: any; branchCount?: any }>();

  allData.forEach((link: any) => {
    if (link.isSynthetic === true && link.source === link.target && !link._isForcedParentIsolatedNode) return;

    let lrank = degreeNameToRank(link.degree);
    const sId = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
    const tId = typeof link.target === 'object' ? String(link.target.id) : String(link.target);

    // Back-calculate degree rank for expanding items if link.degree is missing
    if ((!lrank && lrank !== 0) || lrank === 0) {
      const orig = link.__orig;
      if (orig && (orig.expansionType === 'right-click' || orig.expansionType === 'more' || orig.expansionType === 'less')) {
        const rankS = nodeLowestRank.get(sId);
        const rankT = nodeLowestRank.get(tId);
        if (rankS !== undefined) lrank = rankS + 1;
        else if (rankT !== undefined) lrank = rankT + 1;
      }
    }
    if (!lrank) lrank = 0;

    const updateRank = (id: string, rank: number) => {
      const prev = nodeLowestRank.get(id);
      if (prev === undefined) {
        nodeLowestRank.set(id, rank);
      } else if (prev === 0) {
        // Parent node level 0 should not be overwritten
      } else if (rank > 0 && rank < prev) {
        nodeLowestRank.set(id, rank);
      }
    };

    updateRank(sId, lrank);
    updateRank(tId, lrank);

    const sNodeType = link.sourceType || link.sourceNode?.type || link.sourceNode?.label || getNodeType(link.source);
    const tNodeType = link.targetType || link.targetNode?.type || link.targetNode?.label || getNodeType(link.target);

    if (!nodeMeta.has(sId)) {
      const sourceProps = link.sourceNode?.properties || {};
      const sourceBranchCount = sourceProps.branchCount ?? sourceProps.branch_count ?? link.sourceNode?.branchCount ?? link.sourceNode?.branch_count;
      nodeMeta.set(sId, {
        id: sId,
        name: link.sourceName || sId,
        type: sNodeType,
        label: link.sourceNode?.label || sNodeType,
        properties: { ...sourceProps },
        branchCount: sourceBranchCount
      });
    }
    if (!nodeMeta.has(tId)) {
      const targetProps = link.targetNode?.properties || {};
      const targetBranchCount = targetProps.branchCount ?? targetProps.branch_count ?? link.targetNode?.branchCount ?? link.targetNode?.branch_count;
      nodeMeta.set(tId, {
        id: tId,
        name: link.targetName || tId,
        type: tNodeType,
        label: link.targetNode?.label || tNodeType,
        properties: { ...targetProps },
        branchCount: targetBranchCount
      });
    }

    linksRaw.push({
      source: sId,
      target: tId,
      label: link.label,
      risk: link.risk,
      notes: link.notes,
      degree: link.degree,
      sourceNode: link.sourceNode,
      targetNode: link.targetNode,
      edgeProperties: link.edgeProperties || {},
      data: link.data,
      displaySource: parseEdgeSources(link.edgeProperties?.data || link.data, link.edgeProperties?.source),
      __orig: link
    });
  });

  const nodeToLinksMapRaw = new Map<string, any[]>();
  linksRaw.forEach(link => {
    if (!nodeToLinksMapRaw.has(link.source)) nodeToLinksMapRaw.set(link.source, []);
    if (!nodeToLinksMapRaw.has(link.target)) nodeToLinksMapRaw.set(link.target, []);
    nodeToLinksMapRaw.get(link.source)!.push(link);
    nodeToLinksMapRaw.get(link.target)!.push(link);
  });

  const nodeToSortedLinks = new Map<string, any[]>();
  const nodeToPaginationInfo = new Map<string, { total: number; limit: number }>();

  nodeToLinksMapRaw.forEach((associated, nodeId) => {
    const nRank = nodeLowestRank.get(nodeId) ?? 0;
    const sortableLinks = associated.map(link => {
      const otherId = link.source === nodeId ? link.target : link.source;
      const otherRank = nodeLowestRank.get(otherId) ?? 0;
      const isParent = otherRank < nRank;
      const meta = nodeMeta.get(otherId);
      const branchCount = meta?.branchCount != null ? Number(meta.branchCount) : 0;
      const expansionType = link.__orig?.expansionType || 'right-click';
      return { link, isParent, idString: otherId || '', branchCount, expansionType };
    });
    
    sortableLinks.sort((a, b) => {
      if (a.isParent && !b.isParent) return -1;
      if (!a.isParent && b.isParent) return 1;

      // Sort 'right-click' expansion links BEFORE 'more' expansion links
      if (a.expansionType === 'right-click' && b.expansionType === 'more') return -1;
      if (a.expansionType === 'more' && b.expansionType === 'right-click') return 1;

      if (b.branchCount !== a.branchCount) {
        return b.branchCount - a.branchCount;
      }
      return a.idString.localeCompare(b.idString);
    });
    
    nodeToSortedLinks.set(nodeId, sortableLinks.map(item => item.link));
    const meta = nodeMeta.get(nodeId);
    const type = (meta?.type || '').toUpperCase();
    const isCustomer = type.includes('CUSTOMER') || type.includes('PERSON');
    
    const getLimitByDegree = (deg: number) => {
      if (deg === 0 || deg === 1) return 10;
      if (deg === 2 || deg === 4) return 3;
      if (deg === 3 || deg === 5) return 5;
      return 20;
    };
    const defaultLimit = getLimitByDegree(nRank);
    const limit = paginationLimits[nodeId] ?? defaultLimit;
    nodeToPaginationInfo.set(nodeId, { total: associated.length, limit });
  });

  const checkNodePagination = (nodeIdStr: string, currentLink: any) => {
    const sorted = nodeToSortedLinks.get(nodeIdStr);
    if (!sorted) return true;
    const info = nodeToPaginationInfo.get(nodeIdStr);
    if (!info) return true;

    // Static/Original links without expansion metadata always pass without consuming pagination limits
    const isExpandable = currentLink.__orig?.expansionType === 'right-click' || currentLink.__orig?.expansionType === 'more';
    if (!isExpandable) {
      return true;
    }

    // Bypass limit clamps and show all nodes from API unless explicit More/Less button states exist for this node
    const limitState = paginationLimits[nodeIdStr];
    if (limitState === undefined) {
      return true;
    }

    const parentLinksCount = sorted.filter(l => l.__orig?.expansionType !== 'right-click' && l.__orig?.expansionType !== 'more').length;
    const effectiveLimit = limitState + parentLinksCount;
    const index = sorted.findIndex(l => l === currentLink);

    const checkResult = index >= 0 && index < effectiveLimit;
    
    // Add debug logging for specific nodes to trace failures
    if (limitState !== undefined) {
      console.log(`[Worker] checkNodePagination Node:${nodeIdStr} limitState:${limitState} parentCount:${parentLinksCount} effective:${effectiveLimit} index:${index} result:${checkResult} currentLink:${currentLink.__orig?.expansionType || 'none'}`);
    }

    return checkResult;
  };

  const droppedNodes = new Set<string>();
  nodeMeta.forEach((meta, nodeId) => {
    const type = (meta.type || '').toUpperCase();
    const isCustomer = type.includes('CUSTOMER') || type.includes('PERSON');
    if (isCustomer) return; // Only apply to non-customer nodes

    const rankN = nodeLowestRank.get(nodeId) ?? 0;
    const llinks = nodeToLinksMapRaw.get(nodeId) || [];

    let hasParent = false;
    let hasValidParentLink = false;

    llinks.forEach(link => {
      const otherId = link.source === nodeId ? link.target : link.source;
      const rankO = nodeLowestRank.get(otherId) ?? 0;
      
      // If other node is a parent (has lower numerical degree rank)
      if (rankO < rankN) {
        hasParent = true;
        if (checkNodePagination(otherId, link)) {
          hasValidParentLink = true;
        }
      }
    });

    if (hasParent && !hasValidParentLink) {
      droppedNodes.add(nodeId);
    }
  });

  const finalPaginatedLinks = linksRaw.filter(link => {
    const s = link.source;
    const t = link.target;
    if (droppedNodes.has(s) || droppedNodes.has(t)) return false;

    const orig = link.__orig;
    const isRightClick = orig?.expansionType === 'right-click';

    if (isRightClick) {
      const expandedFrom = orig?.expandedFrom;
      if (expandedFrom) {
        if (!openedNodeIdsRaw.includes(String(expandedFrom))) return false;
      } else {
        const sOpened = openedNodeIdsRaw.includes(s);
        const tOpened = openedNodeIdsRaw.includes(t);
        if (!sOpened && !tOpened) return false;
      }
    }

    return checkNodePagination(s, link) && checkNodePagination(t, link);
  });

  finalPaginatedLinks.forEach(link => {
    const sId = link.source;
    const tId = link.target;

    if (!nodes.has(sId)) {
      const meta = nodeMeta.get(sId) || { id: sId, name: sId, type: getNodeType(sId), properties: {}, branchCount: 0 };
      nodes.set(sId, {
        id: sId,
        name: meta.name || sId,
        type: meta.type,
        label: String((meta as any).label ?? meta.type ?? ''),
        properties: meta.properties || {},
        branchCount: meta.branchCount,
        degree: nodeLowestRank.get(sId) ?? 0,
        ...getNodeStyle(meta.type || '')
      });
    }

    if (!nodes.has(tId)) {
      const meta = nodeMeta.get(tId) || { id: tId, name: tId, type: getNodeType(tId), properties: {}, branchCount: 0 };
      nodes.set(tId, {
        id: tId,
        name: meta.name || tId,
        type: meta.type,
        label: String((meta as any).label ?? meta.type ?? ''),
        properties: meta.properties || {},
        branchCount: meta.branchCount,
        degree: nodeLowestRank.get(tId) ?? 0,
        ...getNodeStyle(meta.type || '')
      });
    }

    links.push({
      source: link.source,
      target: link.target,
      label: link.label,
      risk: link.risk,
      notes: link.notes,
      degree: link.degree,
      sourceNode: link.sourceNode,
      targetNode: link.targetNode,
      edgeProperties: link.edgeProperties || {},
      data: link.data,
      displaySource: link.displaySource,
      edgeId: link.__orig?.edgeId
    });
  });

  const nodeVisibleLinksCount = new Map<string, number>();
  finalPaginatedLinks.forEach(link => {
    const sId = String(link.source);
    const tId = String(link.target);
    nodeVisibleLinksCount.set(sId, (nodeVisibleLinksCount.get(sId) || 0) + 1);
    nodeVisibleLinksCount.set(tId, (nodeVisibleLinksCount.get(tId) || 0) + 1);
  });

  nodeToPaginationInfo.forEach((info, nodeId) => {
    const n = nodes.get(nodeId);
    if (n) {
      n.totalConnections = info.total;
      n.currentLimit = info.limit;
      n.visibleConnections = nodeVisibleLinksCount.get(String(nodeId)) || 0;
      nodes.set(nodeId, n);
    }
  });

  // Group nodes by name
  const groupedNodes = Array.from(nodes.values()).reduce((acc: Record<string, any[]>, node: any) => {
    if (!acc[node.name]) acc[node.name] = [];
    acc[node.name].push(node);
    return acc;
  }, {});

  let sortedNodes = Object.values(groupedNodes).flat().sort((a: any, b: any) => (a.type || '').localeCompare(b.type || ''));

  const activeNodeIds = new Set<string>();
  const localFirstCustomerId = sortedNodes.find((node: any) => node.type?.toLowerCase().includes('customer') || node.type?.toLowerCase().includes('person'))?.id;
  if (localFirstCustomerId) activeNodeIds.add(String(localFirstCustomerId));
  
  links.forEach(l => {
    activeNodeIds.add(typeof l.source === 'object' ? String(l.source.id) : String(l.source));
    activeNodeIds.add(typeof l.target === 'object' ? String(l.target.id) : String(l.target));
  });

  sortedNodes = sortedNodes.filter(n => activeNodeIds.has(String(n.id)));

  if (pruneLowDegreeNodes) {
    const nodesToKeep = new Set<string>();
    const nodesFromRightClick = new Set<string>();

    links.forEach((l: any) => {
      const expType = l.__orig?.expansionType;
      const labelUpper = (l.label || '').toUpperCase();
      if (expType === 'right-click' || expType === 'more' || labelUpper.includes('ADDRESS') || labelUpper.includes('LOCATION')) {
        const s = typeof l.source === 'object' ? String(l.source.id) : String(l.source);
        const t = typeof l.target === 'object' ? String(l.target.id) : String(l.target);
        nodesFromRightClick.add(s);
        nodesFromRightClick.add(t);
      }
    });

    sortedNodes.forEach((node: any) => {
      const idStr = String(node.id);
      const isCustomer = (node.type || '').toUpperCase().includes('CUSTOMER') || (node.type || '').toUpperCase().includes('PERSON');
      const isLocation = (node.type || '').toUpperCase().includes('LOCATION') || (node.type || '').toUpperCase().includes('GEOLOCATION') || (node.label || '').toUpperCase().includes('LOCATION');
      const branchCount = node.branchCount ?? node.properties?.branchCount ?? node.properties?.branch_count ?? 0;
      
      if (isCustomer || isLocation || branchCount > 1 || nodesFromRightClick.has(idStr)) {
        nodesToKeep.add(idStr);
      }
    });
    sortedNodes = sortedNodes.filter((node: any) => nodesToKeep.has(String(node.id)));
    const filteredLinks = links.filter((link: any) => nodesToKeep.has(String(link.source)) && nodesToKeep.has(String(link.target)));
    links.length = 0;
    links.push(...filteredLinks);
  }

  const finalLinks = links.filter((link: any) => {
    const s = String(link.source);
    const t = String(link.target);
    const rankS = nodeLowestRank.get(s) ?? 0;
    const rankT = nodeLowestRank.get(t) ?? 0;
    
    if (collapsedNodes.has(s) && rankT > rankS) return false;
    if (collapsedNodes.has(t) && rankS > rankT) return false;
    return true;
  });

  const childrenOfCollapsedNodes = new Set<string>();
  const parentToChildren = new Map<string, Set<string>>();
  links.forEach((link: any) => {
    const s = String(link.source);
    const t = String(link.target);
    const rankS = nodeLowestRank.get(s) ?? 0;
    const rankT = nodeLowestRank.get(t) ?? 0;
    
    if (rankS < rankT) {
      if (!parentToChildren.has(s)) parentToChildren.set(s, new Set());
      parentToChildren.get(s)!.add(t);
    } else if (rankT < rankS) {
      if (!parentToChildren.has(t)) parentToChildren.set(t, new Set());
      parentToChildren.get(t)!.add(s);
    }
  });

  const collectDescendants = (nodeId: string, visited: Set<string>) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const children = parentToChildren.get(nodeId);
    if (children) {
      children.forEach(childId => {
        childrenOfCollapsedNodes.add(childId);
        collectDescendants(childId, visited);
      });
    }
  };

  collapsedNodes.forEach(id => collectDescendants(id, new Set()));

  let filteredFinalLinks = finalLinks.filter((link: any) => !childrenOfCollapsedNodes.has(String(link.source)) && !childrenOfCollapsedNodes.has(String(link.target)));

  // Reachability BFS
  const adjacencyList = new Map<string, Set<string>>();
  filteredFinalLinks.forEach((link: any) => {
    const s = String(link.source);
    const t = String(link.target);
    if (!adjacencyList.has(s)) adjacencyList.set(s, new Set());
    if (!adjacencyList.has(t)) adjacencyList.set(t, new Set());
    adjacencyList.get(s)!.add(t);
    adjacencyList.get(t)!.add(s);
  });

  let mainCustomerNodeId: string | null = null;
  if (customerId) {
    const customerIdStr = String(customerId);
    const customerNode = sortedNodes.find((n: any) => {
      const id = String(n.id);
      const userid = n.properties?.userid ?? n.properties?.user_id;
      return id === customerIdStr || (userid != null && String(userid) === customerIdStr);
    });
    if (customerNode) mainCustomerNodeId = String(customerNode.id);
  }

  const reachableFromCustomer = new Set<string>();
  if (mainCustomerNodeId) {
    reachableFromCustomer.add(mainCustomerNodeId);
    const queue: string[] = [mainCustomerNodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacencyList.get(current);
      if (neighbors) {
        neighbors.forEach(n => {
          if (!reachableFromCustomer.has(n)) {
            reachableFromCustomer.add(n);
            queue.push(n);
          }
        });
      }
    }
  }

  const finalNodes = sortedNodes.filter((node: any) => {
    const id = String(node.id);
    const isCustomer = (node.type || '').toUpperCase().includes('CUSTOMER') || (node.type || '').toUpperCase().includes('PERSON');
    const isParent = id === String(mainCustomerNodeId);
    
    if (childrenOfCollapsedNodes.has(id)) return false;
    if (reachableFromCustomer.size > 0 && !reachableFromCustomer.has(id)) return false;

    const nRank = nodeLowestRank.get(id) ?? -1;

    const isManuallyOpened = openedNodeIdsRaw.includes(id);

    const isFromRightClickExpansion = filteredFinalLinks?.some((l: any) => {
      const s = typeof l.source === 'object' ? String(l.source.id) : String(l.source);
      const t = typeof l.target === 'object' ? String(l.target.id) : String(l.target);
      return (s === id || t === id) && l.__orig?.expansionType === 'right-click';
    }) ?? false;

    // Prune leaf Customer nodes with no Attribute connections when strongConnector is active
    if (isCustomer && !isParent && !isManuallyOpened) {
      const neighbors = adjacencyList.get(id);
      let hasAscendingLink = false;
      let hasAttributeConnection = false;

      if (neighbors) {
        for (const nId of neighbors) {
          const oRank = nodeLowestRank.get(nId) ?? 999;
          if (oRank <= nRank) {
            hasAscendingLink = true;
          }

          const neighborNode = nodes.get(nId);
          if (neighborNode) {
            const nType = (neighborNode.type || '').toUpperCase();
            const nIsCustomer = nType.includes('CUSTOMER') || nType.includes('PERSON');
            if (!nIsCustomer) {
              const attrNeighbors = adjacencyList.get(nId);
              if (attrNeighbors && attrNeighbors.size > 1) {
                hasAttributeConnection = true;
              }
            }
          }
        }
      }

      // Enforce direct-ascending tree path: if direct uplinks were paginated out on the upper end, do not show
      if (!hasAscendingLink && nRank >= 1 && !isFromRightClickExpansion) {
        console.log('[Worker] Dropping node because no ascending path found:', id, 'nRank:', nRank);
        return false;
      }

      // Limit attribute connection checks to strongConnector active mode
      if (strongConnector === true && !hasAttributeConnection && !isFromRightClickExpansion) {
        console.log('[Worker] Dropping node because no valid attribute connecting links:', id);
        return false;
      }
    }

    if (isCustomer) {
      if (shouldShowIsolatedCustomer && adjacencyList.size === 0) return true;
      return adjacencyList.has(id);
    }
    return adjacencyList.has(id);
  });

  const finalNodeIds = new Set(finalNodes.map((n: any) => String(n.id)));
  const validatedLinks = filteredFinalLinks.filter((link: any) => finalNodeIds.has(String(link.source)) && finalNodeIds.has(String(link.target)));

  const nodesWithConnections = finalNodes.filter((node: any) => {
    const id = String(node.id);
    if (shouldShowIsolatedCustomer && adjacencyList.size === 0 && id === String(mainCustomerNodeId)) return true;

    const isCustomer = (node.type || '').toUpperCase().includes('CUSTOMER') || (node.type || '').toUpperCase().includes('PERSON');
    const isParent = id === String(mainCustomerNodeId);

    const isManuallyOpened = openedNodeIdsRaw.includes(id);

    if (strongConnector === true && isCustomer && !isParent && !isManuallyOpened) {
      // Must connect to at least one Non-Customer node in validatedLinks
      return validatedLinks.some((l: any) => {
        const s = String(l.source);
        const t = String(l.target);
        if (s === id) {
          const tNode = nodes.get(t);
          if (tNode) {
            const tType = (tNode.type || '').toUpperCase();
            if (!tType.includes('CUSTOMER') && !tType.includes('PERSON')) return true;
          }
        }
        if (t === id) {
          const sNode = nodes.get(s);
          if (sNode) {
            const sType = (sNode.type || '').toUpperCase();
            if (!sType.includes('CUSTOMER') && !sType.includes('PERSON')) return true;
          }
        }
        return false;
      });
    }

    return validatedLinks.some((l: any) => String(l.source) === id || String(l.target) === id);
  });

  const resultGraphData = {
    nodes: nodesWithConnections,
    links: validatedLinks
  };

  // 2. Compute nodeExpansionStateMap
  const expansionMap = new Map<string, { symbol: string; badgeColor: string; showBadge: boolean }>();
  if (fullData && fullData.length > 0) {
    const existingLinkIds = new Set<string>();
    validatedLinks.forEach((l: any) => existingLinkIds.add(`${String(l.source)}-${String(l.target)}`));
    [...filteredData, ...expandedData].forEach((l: any) => existingLinkIds.add(`${String(l.source)}-${String(l.target)}`));

    const fullDataNodeMap = new Map<string, any>();
    fullData.forEach((link: any) => {
      if (link.sourceNode) fullDataNodeMap.set(String(link.sourceNode.id || link.source), link.sourceNode);
      if (link.targetNode) fullDataNodeMap.set(String(link.targetNode.id || link.target), link.targetNode);
    });

    const graphNodeRanks = new Map<string, number>();
    resultGraphData.nodes.forEach((n: any) => graphNodeRanks.set(String(n.id), degreeNameToRank(n.degree)));

    resultGraphData.nodes.forEach((node: any) => {
      const nodeIdStr = String(node.id);
      const isCustomer = (node.type || '').toUpperCase().includes('CUSTOMER') || (node.type || '').toUpperCase().includes('PERSON');
      const isManuallyExpanded = false; // We don't have expandedNodes set here easily, or pass it
      const isCollapsed = collapsedNodes.has(nodeIdStr);
      const nodeRank = graphNodeRanks.get(nodeIdStr) || 0;

      let hasVisibleChildren = false;
      for (const link of validatedLinks) {
        const s = String(link.source);
        const t = String(link.target);
        if (s === nodeIdStr) {
          const tRank = graphNodeRanks.get(t) || 0;
          if (tRank > nodeRank || tRank === 0) { hasVisibleChildren = true; break; }
        } else if (t === nodeIdStr) {
          const sRank = graphNodeRanks.get(s) || 0;
          if (sRank > nodeRank || sRank === 0) { hasVisibleChildren = true; break; }
        }
      }

      let hasFurtherLinksInFullData = false;
      let hasOutgoingExpandableConnections = false;
      let hasAnyLinksInFullData = false;

      for (const link of fullData) {
        if (!link) continue;
        const s = String(link.source);
        const t = String(link.target);
        if (s === nodeIdStr || t === nodeIdStr) {
          hasAnyLinksInFullData = true;
          if (s === nodeIdStr && !existingLinkIds.has(`${s}-${t}`)) hasOutgoingExpandableConnections = true;
          if (!existingLinkIds.has(`${s}-${t}`)) {
            const otherId = s === nodeIdStr ? t : s;
            const otherNodeObj = fullDataNodeMap.get(otherId);
            const otherRank = otherNodeObj ? degreeNameToRank(otherNodeObj.degree) : 0;
            if (otherRank > nodeRank || otherRank === 0) hasFurtherLinksInFullData = true;
          }
        }
      }

      const isExtended = !isCollapsed && hasVisibleChildren;
      const shouldShow = isCustomer ? (hasFurtherLinksInFullData || isExtended || (isCollapsed && hasAnyLinksInFullData)) : (isExtended || hasOutgoingExpandableConnections || (isCollapsed && hasAnyLinksInFullData));

      if (shouldShow) {
        let symbol = '+';
        let badgeColor = '#22c55e';
        if (isCustomer) {
          if (isExtended) { symbol = '−'; badgeColor = '#ef4444'; }
        } else {
          if (isExtended && !hasOutgoingExpandableConnections) { symbol = '−'; badgeColor = '#ef4444'; }
        }
        expansionMap.set(nodeIdStr, { symbol, badgeColor, showBadge: true });
      }
    });
  }

  // Convert map to plain object for messaging
  const expansionObj: Record<string, any> = {};
  expansionMap.forEach((v, k) => expansionObj[k] = v);

  self.postMessage({
    graphData: resultGraphData,
    expansionStateMap: expansionObj
  });
};
