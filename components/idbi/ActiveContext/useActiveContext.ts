import React from 'react';
import { cn } from "@/lib/utils";
import { useIdbiActiveContextStore } from './store';
import { contextGroupMapping } from './constants';
import { ActiveContextKey } from './types';

// Where selecting a context lands you: the sidebar group + item to activate.
const contextNavigationMapping: Record<ActiveContextKey, { group: string; item: string }> = {
  customer: { group: 'Relationship Management', item: 'Customer' },
};

/**
 * Ported from the cam-ui ActiveContext hook. `activeGroup`/`activeItem` stand in for
 * cam's WorkspaceContext — this app tracks its section in IdbiApp rather than a store.
 */
export function useActiveContext(activeGroup?: string, activeItem?: string) {
  const activeContexts = useIdbiActiveContextStore(s => s.activeContexts);
  const setContext = useIdbiActiveContextStore(s => s.setContext);
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const commandRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = React.useCallback(
    (type: ActiveContextKey, value: string | null, onNavigate?: (item: string) => void) => {
      setContext(type, value);
      setIsOpen(false); // Close the dropdown after any selection

      // Clearing a context just clears it — it navigates nowhere.
      if (value === null) return;

      // A context with no navigation mapping sets the context and stops.
      const navigation = contextNavigationMapping[type];
      if (!navigation) return;
      onNavigate?.(navigation.item);
    },
    [setContext]
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getItemClassName = (isActive: boolean) =>
    cn(
      "transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      isActive && "bg-blue-50 hover:bg-blue-100 font-medium"
    );

  const getDisplayText = () => {
    // Prefer a context registered against both the current group and item...
    const contextType = Object.entries(contextNavigationMapping).find(
      ([, mapping]) => mapping.group === activeGroup && mapping.item === activeItem
    )?.[0];

    if (contextType && contextGroupMapping[contextType]) {
      const mapping = contextGroupMapping[contextType];
      return {
        prefix: mapping.defaultPreText,
        value: activeContexts[contextType] || mapping.defaultText,
      };
    }

    // ...otherwise any context registered against the current group.
    const groupMapping = Object.entries(contextGroupMapping).find(
      ([, mapping]) => mapping.group === activeGroup
    );

    if (groupMapping) {
      const [key, mapping] = groupMapping;
      return {
        prefix: mapping.defaultPreText,
        value: activeContexts[key] || mapping.defaultText,
      };
    }

    return { prefix: "", value: "Search for anything" };
  };

  return {
    activeContexts,
    inputValue,
    isOpen,
    commandRef,
    setInputValue,
    setIsOpen,
    handleSelect,
    getItemClassName,
    getDisplayText,
  };
}
