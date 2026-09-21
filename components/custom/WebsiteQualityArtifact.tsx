"use client";

import React from "react";
import { ArtifactHeader } from "./ArtifactHeader";
import { ArtifactSectionCollapsible } from "./ArtifactSectionCollapsible";
import { BubbleTag } from "./BubbleTag";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { CustomTableView } from "@/components/custom/CustomTableView";
import { getIconForField } from "@/app/pages/Investigation/InvWorkspace/utils/webAnalysisHelpers";
import { formatFieldName } from "@/app/pages/Investigation/InvWorkspace/utils/webAnalysisTransformers";
import { FrequentWordsDisplay } from "@/app/pages/Investigation/InvWorkspace/components/FrequentWordsDisplay";
import { TruncatableText } from "@/app/pages/Investigation/InvWorkspace/components/TruncatableText";
import { valueSentimentIconMap } from "@/components/custom/CustomIconScheme";
import { getTextColorClass } from "@/components/custom/CustomColorScheme";

interface WebsiteQualityArtifactProps {
  title: string;
  status: boolean; // true/false as requested
  reasoning?: string;
  // Optional policy data to render inside the artifact (same shape used in WebAnalysis)
  policyData?: any[] | null;
  // Optional red-flag object from the RedFlags API (e.g. RF006) to render
  // overall reasoning and subrule breakdowns inside the artifact.
  redFlag?: any | null;
  // When true, indicates no data is available (show N/A in gray)
  noData?: boolean;
}

const WebsiteQualityArtifact: React.FC<WebsiteQualityArtifactProps> = ({
  title,
  status,
  reasoning,
  policyData = null,
  redFlag = null,
  noData = false,
}) => {
  // Columns similar to the WebAnalysis tab key/value columns
  const keyValueColumns = [
    {
      key: "field",
      header: "Field",
      width: "180px",
      align: "left" as const,
      verticalAlign: "top" as const,
      render: (_value: string, row: Record<string, any>) => {
        const rowData = row as any;
        const FieldIcon = getIconForField(rowData.field);
        const formattedField = formatFieldName(rowData.field, false);

        return (
          <span className="flex items-start gap-2">
            {FieldIcon && (
              <FieldIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
            )}
            <span className={`font-bold ${getTextColorClass("gray")}`}>
              {formattedField}
            </span>
          </span>
        );
      },
    },
    {
      key: "value",
      header: "Value",
      width: "600px",
      align: "left" as const,
      verticalAlign: "top" as const,
      render: (value: string | string[], row: Record<string, any>) => {
        const rowData = row as any;
        const sentimentConfig =
          (valueSentimentIconMap as any)[rowData.valueSentiment] ||
          (valueSentimentIconMap as any).info;
        const ValueIcon = sentimentConfig.Icon;
        const textColorClass = "text-gray-900";

        if (
          rowData.isFrequentWords &&
          Array.isArray(value) &&
          value.length > 0
        ) {
          return (
            <FrequentWordsDisplay
              words={value as string[]}
              textColorClass={textColorClass}
              ValueIcon={ValueIcon}
              showValueIcons={true}
            />
          );
        }

        const textToRender = value ?? "-";
        const FieldValueIcon = getIconForField(rowData.field);
        return (
          <div className={`flex items-start gap-2`}>
            {FieldValueIcon && (
              <FieldValueIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
            )}
            <TruncatableText
              text={textToRender}
              textColorClass={textColorClass}
            />
          </div>
        );
      },
    },
  ];

  const tableData = policyData
    ? policyData.map((row) => ({
        field: row.field,
        value: row.value,
        keyIcon: row.keyIcon,
        keyIconColor: row.keyIconColor,
        valueSentiment: row.valueSentiment,
        ...((row as any).isFrequentWords !== undefined && {
          isFrequentWords: (row as any).isFrequentWords,
        }),
      }))
    : [];

  // Convert boolean status to "yes"/"no" string to match card display
  // If noData is true, show "N/A" in gray
  const statusText = noData ? "N/A" : status ? "Triggered" : "Not Triggered";
  const statusColor = noData ? "gray" : status ? "red" : "green";

  return (
    <div
      className="pb-6"
      data-tab-id={`websitequality-${title.replace(/\s+/g, "-")}`}
    >
      <ArtifactHeader
        title={title}
        lastUpdatedAt={new Date()}
        rightAlignedContent={
          <BubbleTag text={statusText} color={statusColor} withBorder={true} />
        }
      />

      <div className="pt-4 space-y-4">
        <ArtifactSectionCollapsible title="Overall Status" defaultOpen>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                Status:
              </span>
              <BubbleTag
                text={statusText}
                color={statusColor}
                withBorder={true}
              />
            </div>

            <div>
              <span className="text-sm font-semibold text-gray-700 block mb-2">
                Overall Reasoning:
              </span>
              <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                {reasoning || `No reasoning data available.`}
              </p>
            </div>
          </div>
        </ArtifactSectionCollapsible>

        {policyData && policyData.length > 0 && (
          <div>
            <SectionHeaderWithFlags
              title="Policy Data"
              icon={getIconForField("policy") as any}
              iconColorClass="text-gray-500"
              titleColorClass="text-gray-900"
              extremeNegativeFlags={[]}
              negativeFlags={[]}
              mildNegativeFlags={[]}
              neutralFlags={[]}
              mildPositiveFlags={[]}
              positiveFlags={[]}
              flagTypeOrderList={[
                "extremeNegative",
                "negative",
                "mildNegative",
                "neutral",
                "mildPositive",
                "positive",
              ]}
              initialRowLimit={5}
              allowCollapse={false}
              defaultExpanded={true}
            />

            <div className="mt-2">
              <CustomTableView
                headerAndTotalRowBg="gray-100"
                columns={keyValueColumns}
                data={tableData}
                initialRowLimit={tableData.length}
                isExpanded={true}
                showCSVExport={false}
                enableAlternatingRows={true}
                alternatingRowColor="gray"
              />
            </div>
          </div>
        )}
        {/* Render decisioning red-flag breakdown when available (overall + subrules) */}
        {redFlag && (
          <div>
            <ArtifactSectionCollapsible
              title="Triggered Conditions"
              defaultOpen={false}
            >
              <div className="space-y-3">
                {(Array.isArray(redFlag.subrules)
                  ? redFlag.subrules.filter((s: any) => {
                      // Accept multiple truthy forms: boolean true or string 'yes'/'true'/'1'
                      const t = s.triggered;
                      if (typeof t === "boolean") return t === true;
                      if (typeof t === "string")
                        return /^(yes|true|1)$/i.test(t);
                      if (typeof t === "number") return t === 1;
                      return false;
                    })
                  : []
                ).length === 0 && (
                  <div className="text-sm text-gray-600">
                    No triggered subrules.
                  </div>
                )}

                {(Array.isArray(redFlag.subrules)
                  ? redFlag.subrules.filter((s: any) => {
                      const t = s.triggered;
                      if (typeof t === "boolean") return t === true;
                      if (typeof t === "string")
                        return /^(yes|true|1)$/i.test(t);
                      if (typeof t === "number") return t === 1;
                      return false;
                    })
                  : []
                ).map((sr: any, idx: number) => (
                  <div
                    key={`tr-${idx}`}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BubbleTag
                          text={(sr.subrule || "subrule").toUpperCase()}
                          color={"red"}
                          withBorder={true}
                          fixedWidth={"w-40"}
                        />
                        {/* New subrule-specific category and score tags */}
                        {(() => {
                           const rawCat = sr.category || sr.severity || (redFlag as any).category || (redFlag as any).severity;
                           if (!rawCat) return null;
                           const tier = String(rawCat).toLowerCase();
                           let display = tier.replace(/\s*risk\s*/g, "").trim();
                           display = display.charAt(0).toUpperCase() + display.slice(1);
                           if (!tier.includes("risk") && !["good", "very good"].includes(tier)) display += " Risk";
                           
                           const getTheme = (s: string) => {
                             if (s.includes("critical") || s.includes("severe")) return "red";
                             if (s.includes("high")) return "orange";
                             if (s.includes("medium") || s.includes("med")) return "yellow";
                             if (s.includes("good")) return "green";
                             if (s.includes("low") || s.includes("info")) return "blue";
                             return "gray";
                           };

                           return (
                             <BubbleTag
                               text={display}
                               color={getTheme(tier)}
                               withBorder={true}
                               fixedWidth="w-28"
                             />
                           );
                        })()}
                        {(() => {
                           const pts = sr.points !== undefined ? sr.points : (redFlag as any).points;
                           if (pts === undefined) return null;
                           return (
                             <BubbleTag
                               text={`Score: ${pts}`}
                               color="red"
                               withBorder={true}
                               fixedWidth="w-24"
                             />
                           );
                        })()}
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                        {sr.reasoning || sr.reason || "No reasoning available."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ArtifactSectionCollapsible>

            <ArtifactSectionCollapsible
              title="Not Triggered Conditions"
              defaultOpen={false}
            >
              <div className="space-y-3">
                {(Array.isArray(redFlag.subrules)
                  ? redFlag.subrules.filter((s: any) => {
                      const t = s.triggered;
                      if (typeof t === "boolean") return t === false;
                      if (typeof t === "string")
                        return /^(no|false|0)$/i.test(t);
                      if (typeof t === "number") return t === 0;
                      return false;
                    })
                  : []
                ).length === 0 && (
                  <div className="text-sm text-gray-600">
                    No non-triggered subrules.
                  </div>
                )}

                {(Array.isArray(redFlag.subrules)
                  ? redFlag.subrules.filter((s: any) => {
                      const t = s.triggered;
                      if (typeof t === "boolean") return t === false;
                      if (typeof t === "string")
                        return /^(no|false|0)$/i.test(t);
                      if (typeof t === "number") return t === 0;
                      return false;
                    })
                  : []
                ).map((sr: any, idx: number) => (
                  <div
                    key={`notr-${idx}`}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <BubbleTag
                        text={(sr.subrule || "subrule").toUpperCase()}
                        color={"gray"}
                        withBorder={true}
                        fixedWidth={"w-40"}
                      />
                       {/* New subrule-specific category and score tags */}
                       {(() => {
                           const rawCat = sr.category || sr.severity || (redFlag as any).category || (redFlag as any).severity;
                           if (!rawCat) return null;
                           const tier = String(rawCat).toLowerCase();
                           let display = tier.replace(/\s*risk\s*/g, "").trim();
                           display = display.charAt(0).toUpperCase() + display.slice(1);
                           if (!tier.includes("risk") && !["good", "very good"].includes(tier)) display += " Risk";
                           
                           return (
                             <BubbleTag
                               text={display}
                               color="gray"
                               withBorder={true}
                               fixedWidth="w-28"
                             />
                           );
                        })()}
                        {(() => {
                           const pts = sr.points !== undefined ? sr.points : (redFlag as any).points;
                           if (pts === undefined) return null;
                           return (
                             <BubbleTag
                               text={`Score: ${pts}`}
                               color="gray"
                               withBorder={true}
                               fixedWidth="w-24"
                             />
                           );
                        })()}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                        {sr.reasoning || sr.reason || "No reasoning available."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ArtifactSectionCollapsible>

            {/* Overall reasoning from the redFlag object - prefer this over the simple reasoning prop */}
            {/* {redFlag.overallReasoning && (
              <ArtifactSectionCollapsible title="Decisioning Overall Reasoning" defaultOpen>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-800 leading-relaxed">{redFlag.overallReasoning}</p>
                </div>
              </ArtifactSectionCollapsible>
            )} */}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteQualityArtifact;
