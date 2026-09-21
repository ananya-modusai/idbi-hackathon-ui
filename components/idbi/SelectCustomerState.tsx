"use client";

// Shown when the Customer space is opened without a customer selected — the same
// shape as cam's SelectCompanyState: illustration, title, one line of help, and a
// button that takes you where the choice is made.

import { FC } from "react";
import { ArrowRight, UserRound } from "lucide-react";

export const SelectCustomerState: FC<{ onGoToCustomers: () => void }> = ({ onGoToCustomers }) => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
    {/* Stacked-rows illustration: a list with one row picked out. */}
    <div className="relative mb-8 h-[150px] w-[280px]">
      <div className="absolute left-1/2 top-0 h-10 w-[230px] -translate-x-1/2 rounded-lg bg-slate-100" />
      <div className="absolute left-1/2 top-[34px] flex h-[52px] w-[262px] -translate-x-1/2 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 shadow-sm">
        <span className="size-6 shrink-0 rounded-full bg-slate-200" />
        <span className="flex-1 space-y-1.5">
          <span className="block h-2 w-[70%] rounded-full bg-slate-200" />
          <span className="block h-2 w-[45%] rounded-full bg-slate-200" />
        </span>
      </div>
      <div className="absolute left-1/2 top-[82px] flex h-[54px] w-[280px] -translate-x-1/2 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 shadow-sm">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
          <UserRound className="size-4" />
        </span>
        <span className="flex-1 space-y-1.5">
          <span className="block h-2 w-[80%] rounded-full bg-blue-200" />
          <span className="block h-2 w-[55%] rounded-full bg-blue-200" />
        </span>
      </div>
    </div>

    <h2 className="text-xl font-semibold text-slate-900">Select a customer first</h2>
    <p className="mt-1 text-sm text-slate-500">Please select a customer to open their workspace</p>

    <button
      onClick={onGoToCustomers}
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
    >
      Select <ArrowRight className="size-4" />
    </button>
  </div>
);

export default SelectCustomerState;
