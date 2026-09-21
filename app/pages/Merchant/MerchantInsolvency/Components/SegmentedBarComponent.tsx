import React from "react";

/* =======================
   Types
======================= */

type Segment = {
  value: number;
  label: string;
  color: string;
};

type Props = {
  min: number;
  max: number;
  segments: Segment[];
  marker?: number;
  height?: number;
};

/* =======================
   Helpers
======================= */

const scaleToPercent = (value: number, min: number, max: number) => {
  if (max === min) return 0;
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
  },
  markerRow: {
    position: "relative" as const,
    height: "20px",
    // marginBottom: "5px",
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
    gap: "0px",
    overflow: "hidden",
    backgroundColor: "white",
  },
};

/* =======================
   Component
======================= */

export function SegmentedBar({ min, max, segments, marker, height = 40 }: Props) {
  const ARROW_HEIGHT = height;
  const ARROW_POINT_WIDTH = ARROW_HEIGHT * 0.425; // Maintain ratio 17/40
  return (
    <div >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <p style={styles.title} className="text-sm text-gray-600">Financial PD Breakdown</p>
        <div className="flex gap-3 flex-wrap legend">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#1e4d7b]" />
            <span className="text-sm text-black">Leverage Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#4a90d9]" />
            <span className="text-sm text-black">Liquidity Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#a2c5ed]" />
            <span className="text-sm text-black">Growth Risk</span>
          </div>
        </div>
      </div>
      {/* Segments */}
      <div style={styles.barWrapper}>
        {segments.map((segment, index) => {
          const isFirst = index === 0;
          const isLast = index === segments.length - 1;
          const prevColor = !isFirst ? segments[index - 1].color : undefined;
          const width = scaleToPercent(segment.value, min, max);

          return (
            <div
              key={segment.label}
              style={{
                position: "relative",
                width: `${width}%`,
                minHeight: ARROW_HEIGHT,
                backgroundColor: segment.color,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                paddingLeft: isFirst ? "10px" : "25px",
                paddingRight: "10px",
                userSelect: "none",
                borderTopLeftRadius: isFirst ? "4px" : 0,
                borderBottomLeftRadius: isFirst ? "4px" : 0,
              }}
            >
              {/* Left cut */}
              {!isFirst && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    borderTop: `${ARROW_HEIGHT / 2}px solid transparent`,
                    borderBottom: `${ARROW_HEIGHT / 2}px solid transparent`,
                    // Use the previous segment's color for the left cut so there's no white gap
                    borderLeft: `${ARROW_POINT_WIDTH}px solid ${prevColor ?? "white"}`,
                  }}
                />
              )}

              {/* Right arrow */}
              {!isLast && (
                <div
                  style={{
                    position: "absolute",
                    right: `-${ARROW_POINT_WIDTH}px`,
                    top: 0,
                    width: 0,
                    height: 0,
                    borderTop: `${ARROW_HEIGHT / 2}px solid transparent`,
                    borderBottom: `${ARROW_HEIGHT / 2}px solid transparent`,
                    borderLeft: `${ARROW_POINT_WIDTH}px solid ${segment.color}`,
                    zIndex: 2,
                  }}
                />
              )}

              <span>{Number(segment.value).toFixed(2)}%</span>
            </div>
          );
        })}
      </div>

      {/* Markers Below */}
      <div style={styles.markerRow}>
        <span style={{ position: "absolute", left: 0 }}>{min}%</span>

        {marker !== undefined && (
          <span
            style={{
              position: "absolute",
              left: `${scaleToPercent(marker, min, max)}%`,
              transform: "translateX(-50%)",
            }}
          >
            {Number(marker).toFixed(2)}%
          </span>
        )}
  {/* Right end label showing the max value (rounded to 2 decimals) */}
  <span style={{ position: "absolute", right: 0 }}>{Number(max).toFixed(2)}%</span>
      </div>
    </div>
  );
}
