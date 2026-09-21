import React, { useEffect, useMemo, useState } from "react";
import { ArtifactSectionCollapsible } from "@/components/custom/ArtifactSectionCollapsible";
import { CustomTableView } from "@/components/custom/CustomTableView";
import {
  fetchRunAnalysis,
  fetchRunDatastore,
  RunAnalysisData,
  RunAnalysisStep,
  DatastoreItem,
  executeRules
} from "@/app/services/caseServices";
import { Loader2, Clock, CheckCircle2, AlertCircle, PlayCircle, Activity, FileJson, Copy, Check, Globe, RotateCw, Info } from "lucide-react";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { formatTitleCase } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProfileStore } from "@/app/store/authentication/profileStore";

interface InvRunAnalysisArtifactProps {
  runId: string;
  merchantName?: string;
  websiteUrl?: string;
  decisioningTime?: string;
}

export const InvRunAnalysisArtifact: React.FC<InvRunAnalysisArtifactProps> = ({ runId, merchantName, websiteUrl, decisioningTime }) => {
  const [data, setData] = useState<RunAnalysisData | null>(null);
  const [datastoreEntries, setDatastoreEntries] = useState<DatastoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [executingSteps, setExecutingSteps] = useState<Record<string, boolean>>({});
  const { isAdmin, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchAllData = async (skipCache: boolean = false) => {
    const [analysisRes, datastoreRes] = await Promise.all([
      fetchRunAnalysis(runId, skipCache),
      fetchRunDatastore(runId, skipCache)
    ]);

    if (analysisRes && analysisRes.success) {
      setData(analysisRes.data);
    }
    if (datastoreRes && datastoreRes.success) {
      setDatastoreEntries(datastoreRes.data);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAllData();
      setLoading(false);
    };
    loadData();
  }, [runId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData(true);
    setRefreshing(false);
  };

  // Helper to parse duration strings (e.g., "2h 8m 5s", "1m 24s", "3s") into total seconds
  const parseDurationToSeconds = (durationStr: string): number => {
    if (!durationStr) return 0;
    let totalSeconds = 0;

    // Extract hours
    const hoursMatch = durationStr.match(/(\d+)h/);
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;

    // Extract minutes
    const minutesMatch = durationStr.match(/(\d+)m/);
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;

    // Extract seconds
    const secondsMatch = durationStr.match(/(\d+)s/);
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

    return totalSeconds;
  };

  // Sort steps by name in ascending order
  const sortedSteps = useMemo(() => {
    if (!data?.steps) return [];
    return [...data.steps].sort((a, b) => {
      const nameA = String(a.step_name || "").toLowerCase();
      const nameB = String(b.step_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [data?.steps]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[500px] space-y-4 bg-white">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500 italic">Compiling run history...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 h-[500px] bg-white flex items-center justify-center">
        <div className="text-center bg-gray-50/50 p-10 rounded-3xl border border-dashed border-gray-200 max-w-sm">
          <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-bold text-lg mb-1">No Trace Found</p>
          <p className="text-gray-400 text-sm">We couldn't retrieve the step-by-step diagnostic data for this specific run ID.</p>
        </div>
      </div>
    );
  }

  const getMappedStepStatus = (status: string): "Completed" | "Pending" | "Failed" => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "failed" || s === "error") return "Failed";
    if (s === "pending" || s === "processing") return "Pending";
    return "Completed";
  };

  const getStatusIcon = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "COMPLETED") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (s === "PENDING") return <Clock className="h-4 w-4 text-gray-400" />;
    if (s === "FAILED") return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Button
        variant="outline"
        size="sm"
        className={`h-8 px-3 text-xs flex items-center gap-2 font-semibold rounded-lg transition-all active:scale-95 ${copied
          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          : "border-gray-200 hover:bg-gray-50 text-gray-600"
          }`}
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy JSON
          </>
        )}
      </Button>
    );
  };

  const stepColumns: any[] = [
    {
      key: "step_name",
      header: "Step Name",
      verticalAlign: "middle",
      render: (val: string) => (
        <span className="text-[13px] font-bold text-gray-800 tracking-tight">{String(val || "Unnamed Step").replace(/_/g, " ")}</span>
      )
    },
    {
      key: "status",
      header: "Progress",
      width: "160px",
      verticalAlign: "middle",
      render: (val: string, row: any) => {
        const rawErrorMsg = row.error_message || row.error || "";
        const errorMsg = (() => {
          if (!rawErrorMsg) return "";
          const cleaned = rawErrorMsg.toLowerCase().trim();
          if (cleaned.includes("required upstream step")) {
            return "A required upstream step failed, so this step could not run.";
          }
          if (cleaned.includes("timed out after 600s")) {
            return "The step timed out after 600s, so it was marked as failed.";
          }
          return rawErrorMsg;
        })();

        const mapped = getMappedStepStatus(val);
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(mapped)}
            <span className="text-[12px] font-semibold text-gray-600">
              {val}
            </span>
            {errorMsg && (
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="w-max max-w-[400px] whitespace-normal break-words bg-slate-900 text-white border-none shadow-xl p-2 text-xs">
                    <p>{errorMsg}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      }
    },
    {
      key: "duration",
      header: "Duration",
      width: "140px",
      verticalAlign: "middle",
      render: (val: string) => (
        <div className="flex items-center gap-1.5 ">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[13px] font-bold text-gray-900">
            {val || "0s"}
          </span>
        </div>
      )
    },
    ...(isAdmin ? [{
      key: "about",
      header: "About",
      width: "120px",
      verticalAlign: "middle",
      render: (_: any, row: any) => {
        const stepName = row.step_name;
        // Match by step_name as in the requirements
        const dsEntry = datastoreEntries.find(i => i.step_name === stepName);

        const isEmpty = !dsEntry ||
          dsEntry.data === null ||
          dsEntry.data === undefined;

        if (isEmpty) return <span className="text-gray-400 font-medium ml-3">-</span>;

        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-[11px] font-extrabold text-blue-600 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 border border-blue-100/50 rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
              >
                <FileJson className="w-3 h-3" />
                JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-6 bg-white rounded-xl shadow-xl">
              <DialogHeader className="mb-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <DialogTitle className="text-lg font-bold text-gray-900 border-none pb-0">
                    Datastore: {stepName.replace(/_/g, " ")}
                  </DialogTitle>
                  <CopyButton text={JSON.stringify(dsEntry.data, null, 2)} />
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto bg-gray-50 rounded-lg border border-gray-200 p-4 text-[13px] text-gray-800">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(dsEntry.data, null, 2)}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        );
      }
    }] : []),
    ...(isAdmin ? [{
      key: "executeRules",
      header: "Execute Rules",
      width: "140px",
      verticalAlign: "middle",
      render: (_: any, row: any) => {
        const stepName = row.step_name;
        const stepLower = String(stepName || "").toLowerCase().trim();
        const canExecute = stepLower === "rules" || 
                           stepLower === "risk_score" || 
                           /^(rf|gf|mr|mf)/i.test(stepLower);

        if (!canExecute) return "";

        const isExecuting = executingSteps[stepName] || false;

        const handleExecuteClick = async () => {
          setExecutingSteps(prev => ({ ...prev, [stepName]: true }));
          try {
            await executeRules(runId, [stepName]);
            await fetchAllData(true);
          } catch (err) {
            console.error("Failed to execute rule step:", err);
          } finally {
            setExecutingSteps(prev => ({ ...prev, [stepName]: false }));
          }
        };

        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={isExecuting}
            onClick={handleExecuteClick}
            className="h-7 px-3 text-[11px] font-extrabold text-blue-600 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 border border-blue-100/50 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Running
              </>
            ) : (
              <>
                <PlayCircle className="w-3 h-3" />
                Execute
              </>
            )}
          </Button>
        );
      }
    }] : [])
  ];

  const stepsList = data?.steps || [];
  const totalStepsCount = stepsList.length;
  const completedStepsCount = stepsList.filter(step => getMappedStepStatus(step.status) === "Completed").length;
  const progressPercent = totalStepsCount ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in slide-in-from-right-4 duration-700 pb-20 overflow-visible">
      <ArtifactHeader
        title={merchantName || data.merchant?.name ? `${formatTitleCase(merchantName || data.merchant?.name)} - Run Diagnostics` : "Run Diagnostics"}
        contentIDText="Run ID"
        contentID={runId}
        lastUpdatedAt={new Date(data.start_time || Date.now())}
        rightAlignedContent={
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 px-3 text-[13px] flex items-center gap-2 font-bold rounded-full border-blue-100 bg-blue-50 text-blue-600 hover:bg-white hover:border-blue-200 transition-all active:scale-95 shadow-sm"
              >
                <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            )}
            {websiteUrl && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 shadow-sm transition-all hover:bg-white active:scale-95">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <a
                  href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-blue-600 hover:underline font-bold truncate max-w-[300px]"
                >
                  {websiteUrl}
                </a>
              </div>
            )}
          </div>
        }
      />

      <div className="px-6 py-6 space-y-6">
        {/* Run Summary Group */}
        <ArtifactSectionCollapsible title="Execution Summary" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Merchant</p>
              <p className="text-[15px] font-bold text-gray-900 leading-tight line-clamp-1">{merchantName || data.merchant?.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(data.status === "partial" || data.status === "Partial" || data.status === "PARTIAL" ? "completed" : data.status)}
                <p className="text-[15px] font-bold text-gray-900 capitalize">{data.status?.toUpperCase() === "PARTIAL" ? "completed" : String(data.status || "unknown").toLowerCase().replace(/_/g, " ")}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Duration</p>
              <div className="flex items-center gap-1.5 font-bold text-[15px] text-blue-600">
                <Clock className="w-4 h-4" />
                {(() => {
                  const status = (data.status || "").toUpperCase();

                  if (status === "FAILED" || status === "ERROR") {
                    return <span className="text-red-600 font-bold">Failed</span>;
                  }

                  if (status !== "COMPLETED" && status !== "COMPETED" && status !== "PARTIAL") {
                    return <span className="text-gray-400 italic font-medium">Processing...</span>;
                  }

                  const formatWithPadding = (val: string) => {
                    if (!val) return "0s";
                    const hMatch = val.match(/(\d+)h/);
                    const mMatch = val.match(/(\d+)m/);
                    const sMatch = val.match(/(\d+)s/);
                    let h = hMatch ? parseInt(hMatch[1]) : 0;
                    let m = mMatch ? parseInt(mMatch[1]) : 0;
                    let s = sMatch ? parseInt(sMatch[1]) : 0;

                    // Normalize overflow
                    if (s >= 60) {
                      m += Math.floor(s / 60);
                      s = s % 60;
                    }
                    if (m >= 60) {
                      h += Math.floor(m / 60);
                      m = m % 60;
                    }

                    const sStr = (h > 0 || m > 0) && s < 10 ? `0${s}` : `${s}`;

                    if (h > 0) return `${h}h ${m}m ${sStr}s`;
                    if (m > 0) return `${m}m ${sStr}s`;
                    return `${s}s`;
                  };

                  if (decisioningTime) {
                    return formatWithPadding(decisioningTime);
                  }

                  // Match Watchlist logic: use priority_flag.duration if available
                  const priorityFlag = (data as any).priority_flag;
                  if (priorityFlag?.duration) return formatWithPadding(priorityFlag.duration);

                  // Fallback: Calculate duration from timestamps to match Watchlist "calculateDuration"
                  if (data.start_time && data.end_time) {
                    const start = new Date(data.start_time).getTime();
                    const end = new Date(data.end_time).getTime();
                    const diffMs = end - start;
                    if (!isNaN(diffMs) && diffMs > 0) {
                      const totalSecs = Math.floor(diffMs / 1000);
                      const h = Math.floor(totalSecs / 3600);
                      const m = Math.floor((totalSecs % 3600) / 60);
                      const s = totalSecs % 60;

                      const sStr = (h > 0 || m > 0) && s < 10 ? `0${s}` : `${s}`;

                      if (h > 0) return `${h}h ${m}m ${sStr}s`;
                      if (m > 0) return `${m}m ${sStr}s`;
                      return `${s}s`;
                    }
                  }

                  return formatWithPadding(data.duration || "0s");
                })()}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</p>
              <p className="text-[15px] font-bold text-gray-900">
                {progressPercent}% ({completedStepsCount}/{totalStepsCount})
              </p>
            </div>
          </div>
        </ArtifactSectionCollapsible>

        {/* Processing Steps Group */}
        <ArtifactSectionCollapsible title={`Processing Sequence (${sortedSteps.length} steps)`} defaultOpen>
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
            <CustomTableView
              columns={stepColumns}
              data={sortedSteps}
              initialRowLimit={100}
              showCSVExport={false}
              enableAlternatingRows={true}
              className="border-none"
              headerAndTotalRowBg="gray-50/80"
              hoverBgColor="blue-50/30"
            />
          </div>
        </ArtifactSectionCollapsible>
      </div>
    </div>
  );
};
