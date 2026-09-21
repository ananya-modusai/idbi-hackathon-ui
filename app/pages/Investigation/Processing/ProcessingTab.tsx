"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  FileCheck, 
  Clock, 
  Zap, 
  Upload, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle 
} from "lucide-react";
import { KeyMetrics } from "@/components/custom/KeyMetrics";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { cn } from "@/lib/utils";
import { MOCK_BATCHES, MOCK_METRICS } from "@/app/data/processingSampleData";

const ProcessingTab: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const filteredAndSortedBatches = useMemo(() => {
    // 1. Parse and sort by date descending
    const sorted = [...MOCK_BATCHES].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (selectedPeriod === "All") return sorted;

    // 2. Filter based on period
    const now = new Date("2026-04-13T11:36:21");
    const days = selectedPeriod === "Past 1d" ? 1 : selectedPeriod === "Past 7d" ? 7 : 30;
    
    return sorted.filter((batch) => {
      const batchDate = new Date(batch.date);
      const diffTime = now.getTime() - batchDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= days;
    });
  }, [selectedPeriod]);

  const metrics = useMemo(() => {
    const runsScheduled = filteredAndSortedBatches.length;
    const appsProcessed = filteredAndSortedBatches.reduce((acc, batch) => acc + batch.merchants.length, 0);
    return [
      { label: "Runs Scheduled", value: runsScheduled, icon: "Calendar" },
      { label: "Applications Processed", value: appsProcessed, icon: "FileCheck" },
      { label: "% Decisioned in 5min", value: appsProcessed > 0 ? "94%" : "0%", icon: "Clock" },
      { label: "Avg Decisioning Time", value: appsProcessed > 0 ? "3m 42s" : "0s", icon: "Zap" },
    ];
  }, [filteredAndSortedBatches]);

  // Open the first section by default when batches change
  React.useEffect(() => {
    // Only auto-expand if we haven't expanded anything for this specific batch list
    if (filteredAndSortedBatches.length > 0) {
      const firstId = filteredAndSortedBatches[0].id;
      // If none of the current batches are expanded, expand the first one
      setExpandedSections((prev) => {
        if (prev.length === 0) return [firstId];
        return prev;
      });
    }
  }, [filteredAndSortedBatches]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const columns = [
    { key: "mid", header: "MID", sortable: true },
    { key: "legalName", header: "Legal Name", sortable: true },
    { key: "runStarted", header: "Run Started", sortable: true },
    {
      key: "decisioningTime",
      header: "Decisioning Time",
      render: (val: any) =>
        val ? (
          <span className="text-gray-700">{val}</span>
        ) : (
          <BubbleTag text="Running" color="blue" withBorder />
        ),
    },
    {
      key: "totalRunTime",
      header: "Total Run Time",
      render: (val: any) =>
        val ? (
          <span className="text-gray-700">{val}</span>
        ) : (
          <BubbleTag text="Running" color="blue" withBorder />
        ),
    },
    { key: "checksDone", header: "Checks Done" },
    {
      key: "checksDecision",
      header: "Checks Decision",
      render: (val: string) => {
        if (val === "Suspected Fraud") {
          return <BubbleTag text="Suspected Fraud" color="red" hasInsideIcon icon={<AlertTriangle className="h-3 w-3" />} />;
        }
        if (val === "Not Fraud") {
          return <BubbleTag text="Not Fraud" color="green" hasInsideIcon icon={<UserCheck className="h-3 w-3" />} />;
        }
        return <BubbleTag text="Running" color="blue" withBorder />;
      },
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header with Period Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Processing Workspace</h2>
          <p className="text-slate-500 text-sm">Monitor and manage merchant onboarding batch runs</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex bg-slate-100 p-1 rounded-lg">
            {["Past 1d", "Past 7d", "Past 30d", "All"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  selectedPeriod === period
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {period}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
            <Upload className="h-4 w-4" />
            <span>Batch Upload</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white shadow-sm overflow-hidden">
        <KeyMetrics
          hardcodedMetrics={metrics}
          isMetricsExpanded={isMetricsExpanded}
          setIsMetricsExpanded={setIsMetricsExpanded}
          showHeader={false}
          gridCols={4}
        />
      </div>

      {/* Batch Runs Sections */}
      <div className="space-y-4">
        {filteredAndSortedBatches.map((batch) => (
          <div
            key={batch.id}
            className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleSection(batch.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {batch.date}, {batch.runName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {batch.merchants.length} merchants in this batch
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      Avg Time: 3m
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Success: 100%
                    </span>
                 </div>
                {expandedSections.includes(batch.id) ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>

            <AnimatePresence>
              {expandedSections.includes(batch.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-slate-100 p-0 overflow-x-auto">
                    <CustomTableView
                      columns={columns as any}
                      data={batch.merchants}
                      initialRowLimit={10}
                      isExpanded={true}
                      minColumnWidth="120px"
                      className="border-none shadow-none rounded-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {filteredAndSortedBatches.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No batches found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingTab;
