import { FC, ReactNode, useMemo, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

export interface VirtualListItemProps {
  id: string;
  title: string;
  content: ReactNode;
  metadata: {
    [key: string]: any;
  };
}

interface VirtualListProps {
  items: VirtualListItemProps[];
  className?: string;
  onItemClick?: (item: VirtualListItemProps) => void;
  itemHeight?: number;
  viewportHeight?: number;
  itemsPerPage?: number;
}

const VirtualListRow = ({ 
  data, 
  index, 
  style 
}: { 
  data: { items: VirtualListItemProps[], onItemClick?: (item: VirtualListItemProps) => void }
  index: number
  style: any 
}) => {
  const item = data.items[index];
  if (!item) return null;

  return (
    <div 
      style={style}
      className="cursor-pointer"
      onClick={() => data.onItemClick?.(item)}
    >
      {item.content}
    </div>
  );
};

export const VirtualList: FC<VirtualListProps> = ({ 
  items, 
  className = '', 
  onItemClick,
  itemHeight = 80,
  viewportHeight = 700,
  itemsPerPage = 20
}) => {
  const memoizedItems = useMemo(() => items, [items]);
  const listRef = useRef<FixedSizeList>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Use exact item height since we removed padding
  const actualItemHeight = itemHeight;

  const handleScrollAreaScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (listRef.current && scrollAreaRef.current) {
      const scrollTop = (event.target as HTMLDivElement).scrollTop;
      listRef.current.scrollTo(scrollTop);
    }
  };

  return (
    <div className={`h-[${viewportHeight}px] ${className}`}>
      <ScrollAreaPrimitive.Root className="h-full w-full rounded-md">
        <ScrollAreaPrimitive.Viewport 
          ref={scrollAreaRef}
          className="h-full w-full"
          onScroll={handleScrollAreaScroll}
        >
          <div className="pr-4">
            <FixedSizeList
              ref={listRef}
              height={viewportHeight}
              width="100%"
              itemCount={memoizedItems.length}
              itemSize={actualItemHeight}
              itemData={{ items: memoizedItems, onItemClick }}
            >
              {VirtualListRow}
            </FixedSizeList>
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className="flex w-2.5 border-l border-l-transparent p-[1px] transition-colors hover:bg-gray-100"
        >
          <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-gray-300" />
        </ScrollAreaPrimitive.Scrollbar>
      </ScrollAreaPrimitive.Root>
    </div>
  );
};

export default VirtualList;