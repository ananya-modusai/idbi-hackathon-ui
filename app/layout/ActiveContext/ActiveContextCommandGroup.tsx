import { CommandGroup, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface MerchantItem {
  id: string;
  cin?: string | null;
  legalName: string;
}

interface StandardItem {
  value: string;
  label: string;
}

type Item = MerchantItem | StandardItem;

interface ActiveContextCommandGroupProps {
  heading: string;
  items: Item[];
  activeValue: string | null | undefined;
  inputValue: string;
  onSelect: (value: string, label: string) => void;
  onClear: () => void;
  getItemClassName: (isActive: boolean) => string;
  type?: "merchant" | "investigation" | "customer" | "rule" | "case" | "company" | "intermediary" | "chargeback";
}

export function ActiveContextCommandGroup({
  heading,
  items,
  activeValue,
  inputValue,
  onSelect,
  onClear,
  getItemClassName,
  type
}: ActiveContextCommandGroupProps) {
  // Helper to get value and label based on item type
  const getItemProps = (item: Item): StandardItem => {
    if ('id' in item && 'legalName' in item) {
      // This is a MerchantItem
      return {
        value: item.id,
        label: item.legalName
      };
    }
    // This is already a StandardItem
    return item;
  };

  const filteredItems = items
    .sort((a, b) => {
      const aValue = getItemProps(a).value;
      const bValue = getItemProps(b).value;
      return aValue === activeValue ? -1 : bValue === activeValue ? 1 : 0;
    })
    .filter(item => {
      const { value, label } = getItemProps(item);
      
      // Guard against undefined/null values
      if (!value || !label) {
        return false;
      }
      
      // If no input value, show all items
      if (!inputValue) {
        return true;
      }
      
      const searchTerm = inputValue.toLowerCase();
      const valueMatch = value.toLowerCase().includes(searchTerm);
      const labelMatch = label.toLowerCase().includes(searchTerm);
      const cinMatch = 'cin' in item && item.cin ? item.cin.toLowerCase().includes(searchTerm) : false;
      return valueMatch || labelMatch || cinMatch;
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
      {displayItems.map((item) => {
        const { value, label } = getItemProps(item);
        return (
          <CommandItem
            key={value}
            value={`${value} ${label}`}
            onSelect={() => onSelect(value, label)}
            className={getItemClassName(activeValue === value)}
          >
            <div className="flex flex-col">
              <span className={cn(
                "text-blue-600",
                activeValue === value ? "font-semibold" : "font-medium"
              )}>
                {label}
              </span> 
              {type !== "investigation" && (
                <span className={cn(
                  "text-xs text-gray-500",
                  activeValue === value && "font-medium"
                )}>
                  {'id' in item ? item.cin : value}
                </span>
              )}
            </div>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
