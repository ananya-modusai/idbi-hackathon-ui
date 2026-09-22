import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Toggle labels carry their count as a trailing number ("Cash Flow 12"). This splits
 * that number off and renders it in a filled circle, so every counted toggle in the
 * app reads the same way. Labels without a trailing count are returned untouched.
 */
export function toggleLabelWithCount(label: string, active: boolean): React.ReactNode {
  const match = label.match(/^(.*?)\s+(\d+)$/);
  if (!match) return label;
  const [, text, count] = match;
  return (
    <>
      <span>{text}</span>
      <span
        className={cn(
          "grid min-w-[20px] shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-semibold leading-5",
          active ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"
        )}
      >
        {count}
      </span>
    </>
  );
}
