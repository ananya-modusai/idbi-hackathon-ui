import { CommandGroup, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"

// One selectable row in the palette. `sublabel` is the dimmer second line — an
// identifier of some kind — and is searched alongside value and label.
export interface CommandGroupItem {
  value: string;
  label: string;
  sublabel?: string | null;
}

interface ActiveContextCommandGroupProps {
  heading: string;
  items: CommandGroupItem[];
  activeValue: string | null | undefined;
  inputValue: string;
  onSelect: (value: string, label: string) => void;
  onClear: () => void;
  getItemClassName: (isActive: boolean) => string;
}

export function ActiveContextCommandGroup({
  heading,
  items,
  activeValue,
  inputValue,
  onSelect,
  onClear,
  getItemClassName
}: ActiveContextCommandGroupProps) {
  const filteredItems = items
    .sort((a, b) => (a.value === activeValue ? -1 : b.value === activeValue ? 1 : 0))
    .filter(item => {
      // Guard against undefined/null values
      if (!item.value || !item.label) {
        return false;
      }

      // If no input value, show all items
      if (!inputValue) {
        return true;
      }

      const searchTerm = inputValue.toLowerCase();
      return (
        item.value.toLowerCase().includes(searchTerm) ||
        item.label.toLowerCase().includes(searchTerm) ||
        (item.sublabel ? item.sublabel.toLowerCase().includes(searchTerm) : false)
      );
    });

  const displayItems = inputValue ? filteredItems : filteredItems.slice(0, 4);

  return (
    <CommandGroup
      heading={
        <div className="flex justify-between items-center w-full pr-2">
          <div className="flex items-center gap-1">
            <span>{heading}</span>
            <span className="text-xs text-muted-foreground">
              ({filteredItems.length} total)
            </span>
          </div>
          {activeValue && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      {displayItems.map((item) => (
        <CommandItem
          key={item.value}
          value={`${item.value} ${item.label}`}
          onSelect={() => onSelect(item.value, item.label)}
          className={getItemClassName(activeValue === item.value)}
        >
          <div className="flex flex-col">
            <span className={cn(
              "text-blue-600",
              activeValue === item.value ? "font-semibold" : "font-medium"
            )}>
              {item.label}
            </span>
            {item.sublabel && (
              <span className={cn(
                "text-xs text-gray-500",
                activeValue === item.value && "font-medium"
              )}>
                {item.sublabel}
              </span>
            )}
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
