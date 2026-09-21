import React from "react";

/* =======================
   Types
======================= */

type Props = {
  risk: number | null | undefined;
  height?: number;
};

/* =======================
   Helpers
======================= */

const scaleToPercent = (value: number, min = 0, max = 1) => {
  const pct = ((value - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, pct));
};

/* =======================
   Style Constants
======================= */

const ARROW_HEIGHT = 40;
const ARROW_POINT_WIDTH = 17;

const styles = {
  container: {
    fontFamily: "'Lato', sans-serif",
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    marginTop: 0,
    // marginBottom: "20px",
    // fontSize: "16px",
  },
  markerRow: {
    position: "relative" as const,
    height: "20px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#666",
    marginTop: "5px",
  },
  barWrapper: {
    display: "flex",
    position: "relative" as const,
    border: "1px dashed #000",
    borderRadius: "4px",
    padding: "2px",
    gap: "2px",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
};

/* =======================
   Component
======================= */

export function RiskBar({ risk, height = 40 }: Props) {
  const ARROW_HEIGHT = height;
  const ARROW_POINT_WIDTH = ARROW_HEIGHT * 0.425; // Maintain ratio 17/40
  const min = 0;
  const max = 5;
  const isMissing = risk === null || risk === undefined;
  const fillPct = isMissing ? 0 : scaleToPercent(risk as number, min, max);
  const newRisk = isMissing ? null : (risk === 0 ? "0" : (risk as number).toFixed(2));
  const riskColor = isMissing ? "#d1d5db" : (risk as number) <= 0.2 ? "#16a34a" : (risk as number) <= 0.6 ? "#f59e0b" : "#ef4444";
  
  return (
    <div >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
        <p style={styles.title} className="text-gray-600 text-sm">Sentiment PD Reference</p>
        <div className="flex gap-3 flex-wrap legend">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#16a34a]" />
            <span className="text-sm text-black">Positive (0-0.2%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-sm text-black">Neutral (0.2-0.6%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span className="text-sm text-black">Negative (0.6-5%)</span>
          </div>
        </div>
      </div>

      {/* Segments */}
      <div style={styles.barWrapper}>
        {isMissing ? (
          // When sentiment PD is not available, show a centered gray message and no colored bars
          <div
            style={{
              width: "100%",
              minHeight: ARROW_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280", // gray-500
              fontSize: "14px",
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            Sentiment Score not available
          </div>
        ) : (
          // Risk Indicator Segment
          <div
            style={{
              position: "relative",
              width: `calc(${fillPct}% + 20px)`,
              minHeight: ARROW_HEIGHT,
              backgroundColor: riskColor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 600,
              paddingLeft: "10px",
              paddingRight: "10px",
              userSelect: "none",
              borderTopLeftRadius: "4px",
              borderBottomLeftRadius: "4px",
              clipPath: `polygon(0 0, calc(100% - ${ARROW_POINT_WIDTH}px) 0, 100% 50%, calc(100% - ${ARROW_POINT_WIDTH}px) 100%, 0 100%)`,
            }}
          >
            <span>{newRisk}{newRisk !== "0" && "%"}</span>
          </div>
        )}
      </div>

      {/* Markers Below */}
      <div style={styles.markerRow}>
        <span style={{ position: "absolute", left: 0 }}>0%</span>
        <span style={{ position: "absolute", right: 0 }}>5%</span>
      </div>
    </div>
  );
}
