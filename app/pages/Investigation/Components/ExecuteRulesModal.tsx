"use client";

import React, { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select2";
import { Loader2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { executeRules } from "@/app/services/caseServices";
import { getFlagInfo } from "../Sample Data/InvDecisioningSampleData";

interface ExecuteRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  merchantName?: string;
  onSuccess?: () => void;
}

const ruleList = [
  "RISK_SCORE",
  "GF001",
  "GF002",
  "GF003",
  "RF001",
  "RF002",
  "RF003",
  "RF004",
  "RF005",
  "RF006",
  "RF009",
  "RF010",
  "RF011",
  "RF012",
  "RF013",
  "RF014",
  "RF015",
  "RF016",
  "RF017",
  "MR001"
];

export const ExecuteRulesModal: FC<ExecuteRulesModalProps> = ({
  open,
  onOpenChange,
  pipelineId,
  merchantName,
  onSuccess,
}) => {
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedSteps([]);
      setResult(null);
      setLoading(false);
    }
  }, [open]);

  const stepOptions = ruleList.map((code) => {
    if (code === "RISK_SCORE") {
      return { value: code, label: "RISK_SCORE (Overall Risk Calculation)" };
    }
    const info = getFlagInfo(code);
    return {
      value: code,
      label: info ? `${code} (${info.name})` : code,
    };
  });

  const handleExecute = async () => {
    if (selectedSteps.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await executeRules(pipelineId, selectedSteps);
      setResult({
        success: true,
        message: response?.message || "Rules executed successfully!",
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.response?.data?.message || err?.message || "Failed to execute rules.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedSteps.length > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600 fill-blue-600/10" />
              Execute Rules
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Select specific rules to execute for {merchantName || "this merchant"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Select Rules / Steps <span className="text-red-500">*</span>
              </Label>
              <MultiSelect
                options={stepOptions}
                value={selectedSteps}
                onValueChange={setSelectedSteps}
                placeholder="Choose rules to run..."
                compactSummary={true}
                className="w-full bg-white border border-gray-200 shadow-sm rounded-lg"
                modalPopover={true}
              />
            </div>
          </div>

          {result && (
            <div
              className={`mt-4 p-3 rounded-xl border flex gap-3 ${
                result.success
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : "bg-red-50 border-red-100 text-red-800"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <p className="text-xs font-medium leading-normal">{result.message}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 px-6 flex justify-end gap-3 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 text-gray-500 font-semibold hover:bg-gray-100 rounded-lg px-4"
          >
            Close
          </Button>
          <Button
            className={`h-10 font-semibold rounded-lg px-5 ${
              isFormValid
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            } transition-all`}
            disabled={!isFormValid}
            onClick={handleExecute}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              "Execute"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
