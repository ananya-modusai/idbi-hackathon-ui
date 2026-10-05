import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CustomPaginationProps {
  totalPages: number;
  currentPage: number;
  jumpToPage: (page: number) => void;
  placing?: 'left' | 'center' | 'right';
  className?: string;
}

export const CustomPagination: React.FC<CustomPaginationProps> = ({
  totalPages,
  currentPage,
  jumpToPage,
  placing = 'center',
  className,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[placing];

  return (
    <div className={cn("flex items-center gap-4 py-3", alignmentClass, className)}>
      {/* Pagination Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => jumpToPage(1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => jumpToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => jumpToPage(page as number)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all shadow-sm border",
                  currentPage === page
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => jumpToPage(currentPage+ 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => jumpToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page Selector Dropdown */}
      <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
        <span>Page</span>
        <Select
          value={currentPage.toString()}
          onValueChange={(value) => jumpToPage(parseInt(value))}
        >
          <SelectTrigger className="w-[70px] h-8 bg-white border-gray-100 rounded-lg shadow-sm focus:ring-blue-500">
            <SelectValue placeholder={currentPage.toString()} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] rounded-xl">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <SelectItem key={p} value={p.toString()} className="rounded-lg">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>of {totalPages}</span>
      </div>
    </div>
  );
};
