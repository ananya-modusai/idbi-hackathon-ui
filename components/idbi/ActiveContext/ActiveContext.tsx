"use client";

import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { useActiveContext } from "./useActiveContext";
import { useIdbiActiveContextStore } from "./store";
import { ActiveContextCommandGroup, CommandGroupItem } from "./ActiveContextCommandGroup";
import { ActiveContextKey } from "./types";
import screenData from "@/app/idbi-data/customer-screen-1.json";

interface CommandGroupSpec {
  heading: string;
  items: CommandGroupItem[];
  type: ActiveContextKey;
  activeValue: string | null | undefined;
}

interface ActiveContextProps {
  /** Sidebar group and item currently active — decides which context the pill names. */
  activeGroup?: string;
  activeItem?: string;
  /** Selecting a customer in the palette opens that customer's workspace. */
  onSelectCustomer?: (customer: any) => void;
}

/**
 * Topbar active-context widget, ported from cam-ui: a content-sized box naming what the
 * workspace is pointed at right now, opening a searchable palette of what it can be
 * pointed at instead.
 */
export function ActiveContext({ activeGroup, activeItem, onSelectCustomer }: ActiveContextProps) {
  // Create a ref for the input element
  const inputRef = React.useRef<HTMLInputElement>(null);

  const activeCustomer = useIdbiActiveContextStore(s => s.activeContexts.customer);

  const {
    inputValue,
    isOpen,
    commandRef,
    setInputValue,
    setIsOpen,
    handleSelect,
    getItemClassName,
    getDisplayText,
  } = useActiveContext(activeGroup, activeItem);

  // Focus the input when the palette opens.
  React.useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const displayText = getDisplayText();

  // What the palette lists: every customer in the book, named by the value the pill
  // shows, with the customer ID and location as the dimmer identifying line.
  const commandGroups: CommandGroupSpec[] = [
    {
      heading: "Customers",
      type: "customer",
      activeValue: activeCustomer,
      items: screenData.customers.map(c => ({
        value: c.name,
        label: c.name,
        sublabel: `${c.customer_id} · ${c.location}`,
      })),
    },
  ];

  const selectCustomer = (name: string | null) => {
    handleSelect("customer", name, () => {
      const customer = screenData.customers.find(c => c.name === name);
      if (customer) onSelectCustomer?.(customer);
    });
  };

  return (
    <div className="relative" ref={commandRef}>
      {/* Sized to its content rather than a fixed 200px: this names the customer under
          review, and a truncated customer name is not an identification. */}
      <div
        onClick={() => setIsOpen(true)}
        className="flex h-9 min-w-[200px] max-w-[520px] cursor-text items-center gap-2 rounded-md border bg-white px-3 shadow-sm"
      >
        <span className="whitespace-nowrap text-sm">
          <span className="text-muted-foreground">{displayText.prefix}</span>
          <span
            className={
              displayText.value === "None" || displayText.value.startsWith("Search")
                ? "text-muted-foreground"
                : "font-medium text-blue-600"
            }
          >
            {displayText.value}
          </span>
        </span>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-[9999] w-[300px]">
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              ref={inputRef}
              placeholder="Search across all IDs..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              {commandGroups.map(group => (
                <ActiveContextCommandGroup
                  key={group.heading}
                  heading={group.heading}
                  items={group.items}
                  activeValue={group.activeValue}
                  inputValue={inputValue}
                  onSelect={(value: string) => selectCustomer(value)}
                  onClear={() => selectCustomer(null)}
                  getItemClassName={getItemClassName}
                />
              ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

export default ActiveContext;
