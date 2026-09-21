import React from "react";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { ArtifactSectionCollapsible } from "@/components/custom/ArtifactSectionCollapsible";

interface InvReasoningArtifactProps {
  runId: string;
  aiDecision: string;
  riskScore: any;
  reasoning: string;
}

export const InvReasoningArtifact: React.FC<InvReasoningArtifactProps> = ({
  runId,
  reasoning,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in slide-in-from-right-4 duration-700 pb-20 overflow-visible">
      <ArtifactHeader
        title="AI Reasoning"
        contentIDText="Run ID"
        contentID={runId}
        lastUpdatedAt={new Date()}
      />

      <div className="px-6 py-6 space-y-4">
        <ArtifactSectionCollapsible
          title="AI Reasoning"
          defaultOpen
        >
          <div className="select-text">
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200/80 whitespace-pre-line font-semibold shadow-sm">
              {reasoning && reasoning.trim() !== "" ? reasoning : "No decisioning commentary has been generated for this run yet."}
            </p>
          </div>
        </ArtifactSectionCollapsible>
      </div>
    </div>
  );
};
