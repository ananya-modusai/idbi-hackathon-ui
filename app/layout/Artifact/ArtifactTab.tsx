/**
 * Individual Tab Component
 * 
 * Implements a browser-like tab with:
 * 1. Drag and Drop functionality
 *    - Allows reordering tabs
 *    - Smooth drag animations
 * 
 * 2. Tab States
 *    - Active/Inactive styling
 *    - Hover effects
 *    - Dragging state
 * 
 * 3. Tab Features
 *    - Title truncation for long names
 *    - Close button
 *    - Click to activate
 * 
 * 4. Visual Feedback
 *    - Opacity changes during drag
 *    - Hover highlights
 *    - Active tab highlighting
 */

import { useDrag, useDrop } from 'react-dnd';
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Tab, useArtifactStore } from '@/app/store/artifact/artifactStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from 'react';

const ItemType = {
  TAB: 'TAB',
};

interface ArtifactTabProps {
  tab: Tab;
  index: number;
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onRemoveTab: (tabId: string, event: React.SyntheticEvent) => void;
  onMoveTab: (dragIndex: number, hoverIndex: number) => void;
}

export function ArtifactTab({
  tab,
  index,
  activeTabId,
  onTabClick,
  onRemoveTab,
  onMoveTab,
}: ArtifactTabProps) {
  // Get direct access to the store functions
  const { setActiveTabId, setCollapsed, forceActivateTab, uiRefreshKey } = useArtifactStore();
  
  // Check if this tab's content is mismatched
  const [contentMismatch, setContentMismatch] = React.useState(false);
  
  // Verify tab content matches tab ID
  React.useEffect(() => {
    // Only check for the tab that has cached content
    if (tab.cachedContent && tab.cachedContent.props) { 
      const contentTabId = tab.cachedContent.props['data-tab-id'];
      if (contentTabId && contentTabId !== tab.id) {
        console.warn(`Tab content mismatch: Tab ID ${tab.id} has content for tab ${contentTabId}`);
        setContentMismatch(true);
      } else {
        setContentMismatch(false);
      }
    }
  }, [tab.id, tab.cachedContent, uiRefreshKey]);
  
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemType.TAB,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, dropRef] = useDrop({
    accept: ItemType.TAB,
    hover(item: { index: number }) {
      if (item.index !== index) {
        onMoveTab(item.index, index);
        item.index = index;
      }
    },
  });

  const ref = (node: HTMLDivElement | null) => {
    dragRef(node);
    dropRef(node);
  };

  // Handle direct tab activation to ensure reliable tab switching
  const handleDirectTabActivation = (e: React.MouseEvent) => {
    // Stop event propagation completely
    e.stopPropagation();
    
    // Access native event to stop immediate propagation if available
    const nativeEvent = e.nativeEvent;
    if (nativeEvent && typeof nativeEvent.stopImmediatePropagation === 'function') {
      nativeEvent.stopImmediatePropagation();
    }
    
    // If content is mismatched, first clear the cached content to ensure proper display
    if (contentMismatch) {
      const state = useArtifactStore.getState();
      state.updateTab(tab.id, { cachedContent: undefined });
    }
    
    // Call the callback handler to activate the tab
    onTabClick(tab.id);
  };

  // Effect to ensure this tab is properly selected if it should be active
  React.useEffect(() => {
    // Direct DOM-level tab activation bypassing React's event system entirely
    // This is a last resort to combat event handling issues
    const tabElement = document.querySelector(`[data-tab-id="${tab.id}"]`);
    
    if (tabElement) {
      // Clean up any previous listeners to avoid duplicates
      const oldListener = (tabElement as any)._directClickListener;
      if (oldListener) {
        tabElement.removeEventListener('click', oldListener);
      }
      
      // Create a native DOM event listener that bypasses React
      const directClickListener = (event: Event) => {
        // Only handle direct clicks on the tab (not child elements like the close button)
        if (event.target === tabElement) {
          event.stopPropagation();
          event.preventDefault();
          
          console.log(`Direct DOM click on tab ${tab.id}`);
          
          // Get the store directly to avoid any React related issues
          const store = useArtifactStore.getState();
          
          // Set the active tab directly in the store
          store.setActiveTabId(tab.id);
          store.setCollapsed(false);
          
          // Also try the force activation function
          if (typeof store.forceActivateTab === 'function') {
            store.forceActivateTab(tab.id);
          }
        }
      };
      
      // Store the listener for cleanup
      (tabElement as any)._directClickListener = directClickListener;
      
      // Add the listener in capturing phase to get it before React
      tabElement.addEventListener('click', directClickListener, true);
      
      return () => {
        tabElement.removeEventListener('click', directClickListener, true);
        delete (tabElement as any)._directClickListener;
      };
    }
  }, [tab.id]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            data-tab-id={tab.id}
            className={cn(
              'flex items-center gap-1 min-w-0 group relative',
              'px-2 py-0.5',
              'h-8',
              'text-xs',
              'border-r border-gray-100',
              'hover:bg-blue-50/50 cursor-pointer',
              'transition-colors duration-150',
              contentMismatch ? 'border-b-2 border-b-amber-400' : '',
              tab.id === activeTabId 
                ? 'bg-blue-50/70 text-blue-700 font-medium' 
                : 'text-gray-600'
            )}
            onClick={handleDirectTabActivation}
          >
            <span className="truncate max-w-[140px]">
              {tab.title}
              {contentMismatch && (
                <span className="ml-1 text-amber-500">⚠</span>
              )}
            </span>
            <button
              onClick={(e) => {
                // Complete propagation stopping to prevent tab activation
                e.stopPropagation();
                e.preventDefault();
                // Force the native event to stop immediate propagation if available
                const nativeEvent = e.nativeEvent;
                if (nativeEvent && typeof nativeEvent.stopImmediatePropagation === 'function') {
                  nativeEvent.stopImmediatePropagation();
                }
                // Call the remove handler with our event
                onRemoveTab(tab.id, e);
              }}
              className="shrink-0 hover:bg-blue-100/50 rounded-sm p-0.5 transition-colors"
            >
              <X className="w-3 h-3 text-gray-400 hover:text-blue-600" />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-gray-800 text-white px-2 py-1 text-xs rounded"
        >
          {contentMismatch 
            ? `${tab.title} (Content mismatch detected. Click to fix.)`
            : tab.title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 