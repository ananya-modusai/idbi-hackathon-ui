'use client';

import { useEffect, useState } from 'react';

/**
 * Reports whether the app sidebar is collapsed, from anywhere in the page tree.
 *
 * SidebarProvider only wraps the sidebar itself (see AppSidebar.tsx), so
 * useSidebar() is not available to page content. The sidebar does stamp
 * data-state="expanded" | "collapsed" on its root element, so observe that.
 */
export function useSidebarCollapsed(): boolean {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const read = () => {
      const el = document.querySelector('[data-state][data-collapsible], .group.peer[data-state]');
      setCollapsed(el?.getAttribute('data-state') === 'collapsed');
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });

    return () => observer.disconnect();
  }, []);

  return collapsed;
}
