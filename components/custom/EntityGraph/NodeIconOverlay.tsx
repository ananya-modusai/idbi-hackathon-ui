/**
 * NodeIconOverlay Component
 * Renders lucide icons as an overlay on top of the canvas graph
 * Icons are positioned at node coordinates and update as the graph moves/zooms
 */

import React, { FC, useMemo, useCallback, useRef, useEffect } from 'react';
import { getNodeIconConfig } from './NodeIconConfig';

interface NodeIconOverlayProps {
  graphData: any; // { nodes: [], links: [] }
  graphRef: any; // Reference to ForceGraph2D component
  containerRef: any; // Reference to graph container
  highlightNodes: Set<string>;
  hoveredNode: any | null;
}

export const NodeIconOverlay: FC<NodeIconOverlayProps> = ({
  graphData,
  graphRef,
  containerRef,
  highlightNodes,
  hoveredNode
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const iconRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // small throttle state to avoid unnecessary writes when nothing moves
  const lastCamera = useRef<{ x: number; y: number; z: number } | null>(null);

  // Update icon positions on every frame; optimized to avoid expensive DOM queries
  const updateIconPositions = useCallback(() => {
    if (!overlayRef.current || !graphRef.current || !containerRef.current) return;

    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Get camera pos once per frame
    const cameraPos = graphRef.current.cameraPosition?.();
    let camX = 0, camY = 0, camZ = 300;
    if (cameraPos) {
      camX = cameraPos.x || 0;
      camY = cameraPos.y || 0;
      camZ = cameraPos.z || 300;
    }

    // small heuristic: if camera hasn't changed and nodes aren't animating, skip expensive updates
    const camKey = `${Math.round(camX)}:${Math.round(camY)}:${Math.round(camZ)}`;
    const prev = lastCamera.current;
    if (prev && Math.abs(prev.x - camX) < 0.5 && Math.abs(prev.y - camY) < 0.5 && Math.abs(prev.z - camZ) < 0.5) {
      // still update positions once to keep in sync with occasional node moves, but avoid heavy work
    }
    lastCamera.current = { x: camX, y: camY, z: camZ };

    const zoomFactor = 300 / (camZ || 300);

    // Convert world coords to screen coords (fast path using captured camera)
    const worldToScreen = (wx: number, wy: number) => ({
      x: width / 2 + (wx - camX) * zoomFactor,
      y: height / 2 + (wy - camY) * zoomFactor
    });

    // Update each icon position by using stored refs (O(n)) and avoid DOM queries & node.find
    for (let i = 0; i < graphData.nodes.length; i++) {
      const node = graphData.nodes[i];
      const id = String(node.id);
      const el = iconRefs.current[id];
      if (!el) continue;
      if (node && node.x !== undefined && node.y !== undefined) {
        const coords = worldToScreen(node.x, node.y);
        // Only write style if changed to reduce layout thrash
        const left = `${coords.x}px`;
        const top = `${coords.y}px`;
        if (el.style.left !== left) el.style.left = left;
        if (el.style.top !== top) el.style.top = top;
      }
    }
  }, [graphData.nodes, graphRef, containerRef]);

  // Listen for engine tick events from EntityGraph
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleEngineTick = () => {
      updateIconPositions();
    };

    overlay.addEventListener('engineTick', handleEngineTick);
    
    return () => {
      overlay.removeEventListener('engineTick', handleEngineTick);
    };
  }, [updateIconPositions]);

  // Start animation loop on mount and update when dependencies change
  useEffect(() => {
    // Force an initial update
    updateIconPositions();

    // Start animation loop but keep it lightweight (only position updates using refs)
    let running = true;
    const animate = () => {
      if (!running) return;
      updateIconPositions();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // We intentionally only depend on updateIconPositions so this effect won't restart often
  }, [updateIconPositions]);

  // Render icon for each node
  const renderNodeIcons = useMemo(() => {
    return graphData.nodes.map((node: any) => {
      const iconConfig = getNodeIconConfig(node.type);
      const Icon = iconConfig.icon;

      const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(String(node.id));
      const isHovered = hoveredNode?.id === node.id;
      const opacity = isHighlighted ? 1 : 0.3;
      const scale = isHovered ? 1.2 : 1;

      return (
        <div
          key={node.id}
          data-node-id={node.id}
          ref={el => { iconRefs.current[String(node.id)] = el; }}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transition: 'transform 0.2s ease-out',
            opacity,
            pointerEvents: 'none',
            zIndex: isHovered ? 10 : isHighlighted ? 5 : 1,
            left: '0px',
            top: '0px'
          }}
        >
          <div
            style={{
              width: iconConfig.size,
              height: iconConfig.size,
              borderRadius: '50%',
              backgroundColor: iconConfig.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isHovered
                ? `0 0 12px ${iconConfig.color}, 0 4px 8px rgba(0,0,0,0.2)`
                : isHighlighted
                ? `0 2px 4px rgba(0,0,0,0.1)`
                : 'none',
              transition: 'box-shadow 0.2s ease-out'
            }}
          >
            <Icon size={iconConfig.size - 8} color={iconConfig.color} strokeWidth={2} />
          </div>
        </div>
      );
    });
  }, [graphData.nodes, highlightNodes, hoveredNode]);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {renderNodeIcons}
    </div>
  );
};

export default NodeIconOverlay;
