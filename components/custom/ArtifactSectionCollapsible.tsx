import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ArtifactSectionCollapsibleProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  rightElement?: React.ReactNode;
}

export const ArtifactSectionCollapsible: React.FC<ArtifactSectionCollapsibleProps> = ({ 
  title, 
  children, 
  defaultOpen = true,
  rightElement 
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div>
      <div
        className="w-full flex items-center justify-between py-3 text-sm font-semibold border-b border-gray-200"
      >
        <button
          className="flex-grow flex items-center justify-between hover:bg-gray-50 focus:outline-none"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="text-black">{title}</span>
        </button>
        <div className="flex items-center gap-4">
          {rightElement}
          <button 
            onClick={() => setOpen((v) => !v)}
            className="hover:bg-gray-50 p-1 rounded"
          >
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>
      {open && <div className="py-2 text-xs text-gray-800 space-y-2">{children}</div>}
    </div>
  );
};
