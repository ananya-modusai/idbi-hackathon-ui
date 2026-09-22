"use client";

import { FC } from "react";
import { ArrowRight, BellRing } from "lucide-react";

/**
 * Sales & Alerts — the book-level home for the opportunity probes that the Customer
 * space shows one customer at a time. Empty until the cross-book feed is specified.
 */
export const SalesAlertsScreen: FC<{ onGoToCustomers: () => void }> = ({ onGoToCustomers }) => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
    <span className="mb-6 grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-600">
      <BellRing className="size-7" />
    </span>
    <h2 className="text-lg font-semibold text-slate-900">Sales &amp; Alerts</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
      Every selling signal across your whole book will land here — ESOP events, credit-card
      and limit signals, insurance gaps and social probes. Today those alerts live inside
      each customer&apos;s workspace.
    </p>
    <button
      type="button"
      onClick={onGoToCustomers}
      className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      Open the workspace <ArrowRight className="size-4" />
    </button>
  </div>
);

export default SalesAlertsScreen;
