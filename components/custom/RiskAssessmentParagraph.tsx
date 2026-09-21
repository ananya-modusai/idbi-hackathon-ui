import { FC, ReactNode } from "react";

interface RiskAssessmentParagraphProps {
  title?: ReactNode;
  // justification may be a string or a ReactNode. Strings will preserve
  // newlines via CSS (whitespace-pre-line) so callers can pass `\n`.
  justification: ReactNode | string;
  // Backward-compatible risk level. When `status` is provided it overrides color
  // selection; otherwise legacy `riskLevel` is used. Made optional for
  // compatibility with existing callers.
  riskLevel?: "severe" | "high" | "medium" | "low" | "gray" | "manual";
  noColor?: boolean;
  rightElement?: ReactNode;
  // Optional simple status to indicate match / mismatch which controls coloring
  // for Website Integrity use-cases.
  status?: "match" | "mismatch";
}

const riskColors = {
  severe: {
    bg: "bg-red-50",
    title: "text-red-900",
    text: "text-red-800",
  },
  high: {
    bg: "bg-red-50",
    title: "text-red-800",
    text: "text-red-700",
  },
  manual: {
    bg: "bg-purple-50",
    title: "text-purple-800",
    text: "text-purple-700",
  },
  medium: {
    bg: "bg-orange-50",
    title: "text-orange-800",
    text: "text-orange-700",
  },
  low: {
    bg: "bg-emerald-50",
    title: "text-emerald-800",
    text: "text-emerald-700",
  },
  gray: {
    bg: "bg-gray-50",
    title: "text-gray-800",
    text: "text-gray-700",
  },
};

export const RiskAssessmentParagraph: FC<RiskAssessmentParagraphProps> = ({
  title = "Risk Assessment",
  justification,
  riskLevel,
  noColor = false,
  rightElement,
  status,
}) => {
  // If noColor is requested, render with neutral styles instead of risk colors
  if (noColor) {
    return (
      <div className={`mt-4 p-4 rounded-lg border border-gray-300`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-medium text-blue-800`}>{title}</h4>
          {rightElement ? <div>{rightElement}</div> : null}
        </div>
        {/* If justification is a string, preserve newlines. Otherwise render node as-is. */}
        {typeof justification === "string" ? (
          <p className={`text-gray-600 whitespace-pre-line`}>{justification}</p>
        ) : (
          <div className={`text-gray-600`}>{justification}</div>
        )}
      </div>
    );
  }

  // Determine color palette. `status` (match/mismatch) has priority.
  let colors = riskColors.low;
  if (status === "match") {
    colors = riskColors.low; // green
  } else if (status === "mismatch") {
    colors = riskColors.severe; // red
  } else if (riskLevel) {
    colors = riskColors[riskLevel] || riskColors.low;
  }
  return (
    <div className={`mt-4 p-4 rounded-lg ${colors.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-medium ${colors.title}`}>{title}</h4>
        {rightElement ? <div>{rightElement}</div> : null}
      </div>
      {/* Preserve newlines for string justifications; render nodes as-is. */}
      {typeof justification === "string" ? (
        <p className={`${colors.text} whitespace-pre-line`}>{justification}</p>
      ) : (
        <div className={`${colors.text}`}>{justification}</div>
      )}
    </div>
  );
};
