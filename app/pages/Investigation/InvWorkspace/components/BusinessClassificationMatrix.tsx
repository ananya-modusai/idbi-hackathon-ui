"use client";

import React, { FC, useState, useMemo } from "react";
import {
  BC_SOURCES,
  BC_SOURCE_LABELS,
  BC_SOURCE_COLORS,
  BC_FIELD_GROUPS,
  BC_SAMPLE_DATA,
  BCFieldStatus,
  BCAnalysis,
  buildAnalysis,
  type BCData,
} from "./businessClassificationSampleData";
import { useArtifactStore } from "@/app/store/artifact/artifactStore";
import { ArtifactHeader } from "@/components/custom/ArtifactHeader";
import { ArtifactSectionCollapsible } from "@/components/custom/ArtifactSectionCollapsible";
import { format } from "date-fns";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { 
  AlertTriangle, 
  Minus, 
  Eye, 
  Briefcase, 
  FileText, 
  Layers, 
  Users, 
  MapPin, 
  Phone 
} from "lucide-react";
import { InvFlagDetailsArtifact } from "../../Components/InvFlagDetailsArtifact";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Business Identity": <Briefcase className="w-3.5 h-3.5" />,
  "Business Classification": <Layers className="w-3.5 h-3.5" />,
  "Registration Details": <FileText className="w-3.5 h-3.5" />,
  "Key Personnel": <Users className="w-3.5 h-3.5" />,
  "Address": <MapPin className="w-3.5 h-3.5" />,
  "Contact Details": <Phone className="w-3.5 h-3.5" />,
};

interface Props {
  data?: BCData;
  redFlags?: any[] | null;
}

const STATUS_COLOR: Record<BCFieldStatus, string> = {
  match: "#10b981",
  conflict: "#ef4444",
  insufficient: "#94a3b8",
};
const STATUS_SHADOW: Record<BCFieldStatus, string> = {
  match: "0 0 6px rgba(16,185,129,0.3)",
  conflict: "0 0 6px rgba(239,68,68,0.5)",
  insufficient: "none",
};
const STATUS_TITLE: Record<BCFieldStatus, string> = {
  match: "All sources agree",
  conflict: "Conflict detected",
  insufficient: "Insufficient data",
};

/** Single cell value */
const CellValue: FC<{ value: string | null; isConflict: boolean }> = ({
  value,
  isConflict,
}) => {
  if (!value || value.toString().trim() === "") {
    return (
      <span className="text-gray-400 text-xs select-none">-</span>
    );
  }

  // Detect if string is a URL or contains URLs
  const renderValue = (text: string) => {
    // If it's a comma-separated list, split and check each
    if (text.includes(",")) {
      const parts = text.split(",");
      return parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && ", "}
          {renderSingleValue(part.trim())}
        </React.Fragment>
      ));
    }
    return renderSingleValue(text);
  };

  const renderSingleValue = (s: string) => {
    const isUrl = /^(https?:\/\/[^\s]+)$|^(www\.[^\s]+)$/i.test(s);
    if (isUrl) {
      const href = s.startsWith("www.") ? `https://${s}` : s;
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
          style={{ color: "#2563eb" }}
          onClick={(e) => e.stopPropagation()}
        >
          {s}
        </a>
      );
    }
    return s;
  };

  return (
    <div
      style={{
        fontSize: 12,
        color: "black",
        fontWeight: 400,
        padding: "3px 0",
        lineHeight: 1.4,
        wordBreak: "break-word",
      }}
    >
      {renderValue(value)}
    </div>
  );
};


const BusinessClassificationMatrix: FC<Props> = ({
  data = BC_SAMPLE_DATA,
  redFlags = null
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => BC_FIELD_GROUPS.reduce((acc, g) => ({ ...acc, [g.label]: true }), {})
  );
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const analysis: BCAnalysis = useMemo(() => buildAnalysis(data), [data]);
  const artifactStore = useArtifactStore();

  const openReasoningArtifact = (groupName: string) => {
    const artifactId = `bc-reasoning-${groupName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    
    // Mapping category groupName to specific Red Flag codes and subrules
    let flagCode = "";
    let subruleName = "";
    
    switch (groupName) {
      case "Business Identity":
        flagCode = "RF005";
        subruleName = "REGISTERED LEGAL NAME INCONSISTENCY";
        break;
      case "Business Classification":
        flagCode = "RF005";
        subruleName = "BUSINESS PROFILE INCONSISTENCY";
        break;
      case "Registration Details":
        flagCode = "RF017";
        subruleName = "LEGAL NUMBERS MISMATCH";
        break;
      case "Key Personnel":
        flagCode = "RF017";
        subruleName = "DIRECTOR MISMATCH";
        break;
      case "Address":
        flagCode = "RF017";
        subruleName = "ADDRESS MISMATCH";
        break;
    }

    const flagData = redFlags?.find((f: any) => String(f.code).toUpperCase() === flagCode);

    artifactStore.addTab({
      id: artifactId,
      title: groupName,
      renderArtifact: () => {
        if (!flagData) {
          return (
            <div className="p-8 text-center text-gray-500 animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
                <Minus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium">No flag data available for {groupName}</p>
              <p className="text-xs text-gray-400 mt-1">Status signals suggests no flags were triggered for this category.</p>
            </div>
          );
        }

        return (
          <InvFlagDetailsArtifact
            flagData={flagData}
            lastUpdatedAt={new Date()}
            includeOnlySubruleNames={[subruleName]}
            hideOverallStatus={true}
            customTitle={subruleName.split(/[\s_]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
            useRedGreenStatus={true}
            hideHeaderTags={true}
          />
        );
      },
    });

    setTimeout(() => {
      artifactStore.forceActivateTab(artifactId);
      artifactStore.setCollapsed(false);
    }, 0);
  };

  const toggleGroup = (label: string) =>
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  // Column grid: Field | status | onboarding | website | probe42
  const GRID = "240px 240px repeat(3, 1fr)";

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
      {/* ── Table header ────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
          background: "#f8fafc",
          borderBottom: "2px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        {/* Field */}
        <div className="px-4 py-3 text-[11px] font-bold text-black uppercase tracking-widest">
          Field
        </div>
        {/* Status */}
        <div
          style={{
            padding: "12px 16px",
            fontSize: 11,
            fontWeight: 700,
            color: "black",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderLeft: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
          }}
        >
          Status
        </div>
        {/* Source headers */}
        {BC_SOURCES.map((src) => (
          <div
            key={src}
            style={{
              padding: "12px 14px",
              fontSize: 11,
              fontWeight: 700,
              color: "black",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderLeft: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {BC_SOURCE_LABELS[src]}
          </div>
        ))}
      </div>

      {/* ── Field groups ─────────────────────────────────────────── */}
      {BC_FIELD_GROUPS.map((group) => {
        const conflictCount = group.fields.filter(
          (f) => analysis[f.key]?.status === "conflict"
        ).length;
        const isOpen = expandedGroups[group.label];

        return (
          <div key={group.label}>
            {/* Group header row */}
            <div
              onClick={() => toggleGroup(group.label)}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                background: "#f1f5f9",
                borderBottom: "1px solid #e2e8f0",
                borderTop: "1px solid #e2e8f0",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {/* Category Label + chevron (First Column) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "#94a3b8",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.15s",
                    display: "inline-block",
                  }}
                >
                  ▶
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "blue",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span className="text-blue-600">
                    {CATEGORY_ICONS[group.label]}
                  </span>
                  {group.label}
                </span>
              </div>

              {/* Status Cell (Second Column) */}
              <div
                className="flex items-center gap-2"
                style={{
                  padding: "8px 14px",
                  borderLeft: "1px solid #e2e8f0",
                }}
              >
                <BubbleTag
                  text={
                    conflictCount > 0
                      ? "Potential Risk Identified"
                      : "No Risk Observed"
                  }
                  color={conflictCount > 0 ? "red" : "green"}
                  hasInsideIcon={true}
                  withBorder={false}
                  noBackground={true}
                  icon={
                    <div
                      className={`flex items-center justify-center w-4 h-4 rounded-full ${
                        conflictCount > 0 ? "bg-red-500" : "bg-green-600"
                      } text-white`}
                    >
                      {conflictCount > 0 ? (
                        <AlertTriangle className="w-3 h-3" strokeWidth={3} />
                      ) : (
                        <Minus className="w-3 h-3" strokeWidth={3} />
                      )}
                    </div>
                  }
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openReasoningArtifact(group.label);
                  }}
                  className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </div>

              {/* Empty background for source columns in group header */}
              {BC_SOURCES.map((src) => (
                <div
                  key={src}
                  style={{ borderLeft: "1px solid #e2e8f0" }}
                />
              ))}
            </div>

            {/* Field rows (collapsed by default) */}
            {isOpen &&
              group.fields.map((field) => {
                const a = analysis[field.key];
                const isConflict = a?.status === "conflict";
                const isHovered = hoveredRow === field.key;

                return (
                  <div
                    key={field.key}
                    onMouseEnter={() => setHoveredRow(field.key)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: GRID,
                      borderBottom: "1px solid #f1f5f9",
                      background: isHovered ? "#fafbfc" : "white",
                      transition: "background 0.1s",
                      alignItems: "stretch",
                    }}
                  >
                    {/* Field label */}
                    <div
                      style={{
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {field.label}
                    </div>

                    {/* Status Placeholder (Empty for field rows) */}
                    <div
                      style={{
                        padding: "8px 12px",
                        borderLeft: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                      }}
                    />

                    {/* Source cells */}
                    {BC_SOURCES.map((src) => {
                      const val = (data[field.key]?.[src]) ?? null;
                      const inConflict = isConflict && val != null;
                      return (
                        <div
                          key={src}
                          style={{
                            padding: "8px 12px",
                            borderLeft: "1px solid #f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            minHeight: 44,
                          }}
                        >
                          <CellValue value={val} isConflict={inConflict} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
};

export default BusinessClassificationMatrix;
