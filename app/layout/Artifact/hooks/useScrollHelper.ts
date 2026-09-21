import * as React from "react"

export function useScrollHelper(containerRef: React.RefObject<HTMLDivElement>) {
  const scrollToTab = React.useCallback((tabId: string) => {
    if (!containerRef.current) return;
    
    const tabElement = containerRef.current.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, []);

  const scrollToEnd = React.useCallback(() => {
    setTimeout(() => {
      if (containerRef.current?.parentElement) {
        containerRef.current.parentElement.scrollTo({
          left: containerRef.current.parentElement.scrollWidth,
          behavior: 'smooth'
        });
      }
    }, 0);
  }, []);

  return { scrollToTab, scrollToEnd };
} 