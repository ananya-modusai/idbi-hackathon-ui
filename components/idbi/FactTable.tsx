"use client";

// A registry of facts as a two-column table: heading on the left, value on the right,
// one pair per row. Ported from axis-cam-ui/components/custom/FactTable.tsx.
//
// The left column is tinted and fixed-width, so the eye reads the labels as a spine and
// the values line up down a single edge. Rows are as tall as their content, so a
// one-word label and a full sentence both sit correctly.

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FactTableRow {
  label: string;
  value: React.ReactNode;
  /** Set when the value disagrees with another source — the row turns amber. */
  conflictNote?: string;
}

export function FactTable({
  rows, labelWidth = "38%", className,
}: {
  rows: FactTableRow[];
  /** Width of the label column. Widen it for registries with long labels. */
  labelWidth?: string;
  className?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className={cn("overflow-hidden rounded-md border border-gray-200", className)}>
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: labelWidth }} />
          <col />
        </colgroup>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={cn(i > 0 && "border-t border-gray-200", row.conflictNote && "bg-orange-50/60")}
            >
              <th
                scope="row"
                className={cn(
                  "px-4 py-2.5 text-left align-top text-sm font-semibold",
                  row.conflictNote ? "text-orange-800" : "bg-gray-50 text-gray-700"
                )}
              >
                {row.label}
                {row.conflictNote && (
                  <span className="mt-1 flex items-start gap-1 text-[11px] font-normal leading-relaxed text-orange-700">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {row.conflictNote}
                  </span>
                )}
              </th>
              <td
                className={cn(
                  "break-words px-4 py-2.5 align-top text-sm font-normal",
                  row.conflictNote ? "text-orange-800" : "text-gray-900"
                )}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FactTable;
