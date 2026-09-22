"use client";

// Score visuals: a credit-score gauge and a gradient score line.
//
// Both colour by band, so the reading and the colour say the same thing — the same
// "colour changes with the signal" language the PD analysis section uses.

import * as React from "react";
import {
  Area, AreaChart, CartesianGrid, Customized, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";


/* ------------------------------------------------------ colour scale ------ */

const RAMP: Array<[number, [number, number, number]]> = [
  [0.0, [220, 38, 38]],   // red
  [0.25, [249, 115, 22]], // orange
  [0.5, [234, 179, 8]],   // amber
  [0.75, [132, 204, 22]], // lime
  [1.0, [22, 163, 74]],   // green
];

const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

/**
 * Colour for a value on a red→green ramp, positioned by where the value sits between
 * `lo` and `hi`. Used for both the line gradient and the point dots, so a dip is red
 * and a peak is green even when every point shares one nominal band.
 */
export function rampColor(value: number, lo: number, hi: number): string {
  const t = hi === lo ? 1 : Math.min(1, Math.max(0, (value - lo) / (hi - lo)));
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [p0, c0] = RAMP[i];
    const [p1, c1] = RAMP[i + 1];
    if (t >= p0 && t <= p1) {
      const k = (t - p0) / (p1 - p0);
      return `rgb(${mix(c0[0], c1[0], k)}, ${mix(c0[1], c1[1], k)}, ${mix(c0[2], c1[2], k)})`;
    }
  }
  return `rgb(${RAMP[RAMP.length - 1][1].join(",")})`;
}

/* ---------------------------------------------------------------- gauge ---- */

export interface GaugeBand {
  from: number;
  to: number;
  color: string;
  label: string;
}

/** CIBIL-style bands. */
export const CIBIL_BANDS: GaugeBand[] = [
  { from: 300, to: 580, color: "#ef4444", label: "Poor" },
  { from: 580, to: 650, color: "#f97316", label: "Fair" },
  { from: 650, to: 720, color: "#eab308", label: "Good" },
  { from: 720, to: 780, color: "#84cc16", label: "Very Good" },
  { from: 780, to: 900, color: "#16a34a", label: "Excellent" },
];

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

// Semi-circle from 180° (left) to 360° (right).
const arcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const s = polar(cx, cy, r, startAngle);
  const e = polar(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

export function ScoreGauge({
  score, min = 300, max = 900, bands = CIBIL_BANDS, caption, showBandRange = false,
}: {
  score: number;
  min?: number;
  max?: number;
  bands?: GaugeBand[];
  caption?: string;
  /** Prints the band the score sits in — "Range 720 – 780" — under the arc. */
  showBandRange?: boolean;
}) {
  const W = 320, H = 190, cx = W / 2, cy = 160, r = 120, stroke = 16;
  const toAngle = (v: number) => 180 + ((v - min) / (max - min)) * 180;

  // Sweep 0 → score the first time the meter scrolls into view.
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const DUR = 1100;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DUR);
        // ease-out-cubic
        setShown(min + (score - min) * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver === "undefined") { run(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); run(); }
    }, { threshold: 0.35 });
    io.observe(el);
    const fallback = window.setTimeout(() => { io.disconnect(); run(); }, 1200);
    return () => { io.disconnect(); window.clearTimeout(fallback); cancelAnimationFrame(raf); };
  }, [score, min]);

  const shownScore = Math.round(shown);
  const band = bands.find(b => shownScore >= b.from && shownScore <= b.to) ?? bands[0];
  const marker = polar(cx, cy, r, toAngle(shownScore));

  return (
    <div ref={hostRef} className="flex flex-col items-center">
      {/* Scales with its column rather than forcing 320px — the gauge now shares the
          panel with the movement facts beside it. */}
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[300px]" role="img" aria-label={`Score ${score} of ${max}`}>
        {/* Track */}
        <path d={arcPath(cx, cy, r, 180, 360)} fill="none" stroke="#f1f5f9" strokeWidth={stroke} strokeLinecap="round" />
        {/* Bands */}
        {bands.map(b => (
          <path
            key={b.label}
            d={arcPath(cx, cy, r, toAngle(b.from), toAngle(b.to))}
            fill="none"
            stroke={b.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            opacity={shownScore >= b.from ? 1 : 0.25}
          />
        ))}
        {/* Marker */}
        <circle cx={marker.x} cy={marker.y} r={11} fill="white" stroke={band.color} strokeWidth={4} />
        <circle cx={marker.x} cy={marker.y} r={4} fill={band.color} />
        {/* Value, with the band name on a soft pill beneath it */}
        <text x={cx} y={cy - 40} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 44, fontWeight: 700, letterSpacing: "0.04em" }}>{shownScore}</text>
        <rect x={cx - 48} y={cy - 31} width={96} height={24} rx={12} fill={band.color} fillOpacity={0.14} />
        <text x={cx} y={cy - 14} textAnchor="middle" style={{ fontSize: 13, fontWeight: 600, fill: band.color }}>{band.label}</text>
        {/* Range ends */}
        <text x={cx - r} y={cy + 26} textAnchor="middle" style={{ fontSize: 12, fill: "#94a3b8" }}>{min}</text>
        <text x={cx + r} y={cy + 26} textAnchor="middle" style={{ fontSize: 12, fill: "#94a3b8" }}>{max}</text>
      </svg>
      {showBandRange && <p className="-mt-1 text-sm text-slate-500">Range {band.from} – {band.to}</p>}
      {caption && <p className="mt-1 text-xs text-slate-500">{caption}</p>}
    </div>
  );
}

/* ----------------------------------------------------- gradient line ------- */

export interface ScorePoint {
  label: string;
  score: number;
  note?: string;
}

/**
 * Score-over-time as a band-coloured gradient line with a soft fill. The gradient
 * stops are computed from each point's band, so the line itself shifts colour as the
 * score crosses a threshold.
 */
export function GradientScoreLine({
  points, domain, bands, threshold, thresholdLabel, showValueLabels = false, height = 260,
  colourRange, annotations = false, dropLines = false,
}: {
  points: ScorePoint[];
  domain: [number, number];
  bands: GaugeBand[];
  threshold?: number;
  thresholdLabel?: string;
  showValueLabels?: boolean;
  height?: number;
  /** Anchors the red→green ramp. Defaults to the visible data's own min/max. */
  colourRange?: [number, number];
  /** Render each point's note as a callout under the line. */
  annotations?: boolean;
  /** Dashed verticals dropping from each dot down to the axis. */
  dropLines?: boolean;
}) {
  const values = points.map(p => p.score);
  const [lo, hi] = colourRange ?? [Math.min(...values), Math.max(...values)];
  const colourFor = (v: number) => rampColor(v, lo, hi);
  const id = React.useId().replace(/:/g, "");

  const stops = points.map((p, i) => ({
    offset: points.length === 1 ? 0 : (i / (points.length - 1)) * 100,
    color: colourFor(p.score),
  }));

  const hostRef = React.useRef<HTMLDivElement>(null);
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setEntered(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); setEntered(true); }
    }, { threshold: 0.2 });
    io.observe(el);
    // Fail-safe: a chart that is scrolled past (or never intersects because the page
    // jumped) must never be left invisible — reveal it regardless.
    const fallback = window.setTimeout(() => { io.disconnect(); setEntered(true); }, 1200);
    return () => { io.disconnect(); window.clearTimeout(fallback); };
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        height,
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 600ms ease-out, transform 600ms ease-out",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 26, right: 24, left: -14, bottom: 4 }}>
          <defs>
            <linearGradient id={`stroke-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100%" y2="0">
              {stops.map((s, i) => <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />)}
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          {dropLines && (
            <Customized
              component={(props: any) => {
                const xAxis: any = Object.values(props.xAxisMap ?? {})[0];
                const yAxis: any = Object.values(props.yAxisMap ?? {})[0];
                if (!xAxis?.scale || !yAxis?.scale) return null;
                const bottom = props.offset.top + props.offset.height;
                return (
                  <g>
                    {points.map((pt, i) => {
                      const band = xAxis.scale.bandwidth ? xAxis.scale.bandwidth() : 0;
                      const x = (xAxis.scale(pt.label) ?? 0) + band / 2;
                      const y = yAxis.scale(pt.score);
                      return (
                        <line key={`drop-${i}`} x1={x} x2={x} y1={y} y2={bottom}
                          stroke={colourFor(pt.score)} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 3" />
                      );
                    })}
                  </g>
                );
              }}
            />
          )}
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={12} />
          <YAxis domain={domain} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            content={({ active, payload }) => {
              const pt = payload?.[0]?.payload as ScorePoint | undefined;
              if (!active || !pt) return null;
              return (
                <div className="max-w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xl">
                  <p className="font-semibold" style={{ color: colourFor(pt.score) }}>{pt.label} · {pt.score}</p>
                  {pt.note && <p className="mt-1 leading-5 text-slate-600">{pt.note}</p>}
                </div>
              );
            }}
          />
          {threshold !== undefined && (
            <ReferenceLine
              y={threshold}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: thresholdLabel, position: "right", fill: "#94a3b8", fontSize: 10 }}
            />
          )}
          {annotations && points.map((pt, i) => (
            pt.note && i > 0 && i < points.length - 1 ? (
              <ReferenceLine
                key={`ann-${i}`}
                x={pt.label}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
                /* No label: the x-axis already names the month, and the note is on hover. */
              />
            ) : null
          ))}
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="score"
            stroke={`url(#stroke-${id})`}
            strokeWidth={3}
            fill="none"
            dot={(props: any) => {
              const { cx, cy, payload, index } = props;
              return <circle key={index} cx={cx} cy={cy} r={4.5} fill={colourFor(payload.score)} stroke="white" strokeWidth={2} />;
            }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "white" }}
            label={showValueLabels ? ({ x, y, value, index }: any) => (
              <text key={index} x={x} y={y - 12} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: colourFor(value) }}>{value}</text>
            ) : undefined}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --------------------------------------------------------- band legend ----- */

export function BandLegend({ bands, className }: { bands: GaugeBand[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1.5", className)}>
      {bands.map(b => (
        <span key={b.label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
          <i className="size-2 rounded-full" style={{ backgroundColor: b.color }} />
          {b.label} · {b.from}–{b.to}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------- arrow segment bar ----- */

export interface ArrowSegment {
  label: string;
  value: number;
  color: string;
  textColor?: string;
  /** Printed under the segment — which driver this ribbon is. */
  name?: string;
}

/**
 * Segmented arrow bar, replicating the geometry used by the insolvency
 * ProbabilityOfDefault breakdown: a 1000-wide viewBox with 24px padding, 44px tall
 * segments and a 72px arrow tip, inside a dashed frame with end ticks.
 */
export function ArrowSegmentBar({
  segments, leftLabel, rightLabel,
}: {
  segments: ArrowSegment[];
  leftLabel?: string;
  rightLabel?: string;
}) {
  const pad = 24;
  const totalW = 1000 - pad * 2;
  const tri = 72;
  const top = 30;
  const height = 56;
  const bottom = top + height;
  const mid = (top + bottom) / 2;
  const sum = segments.reduce((n, s) => n + s.value, 0) || 1;

  const poly = (x: number, w: number, notched: boolean) => {
    const tip = Math.min(tri, w);
    const rectRight = x + w - tip;
    if (w <= 8) return `${x},${top} ${x + w},${top} ${x + w},${bottom} ${x},${bottom}`;
    // Right edge is an arrow point; the left edge is notched inward by the same amount
    // so it seats over the previous segment's point.
    const left = notched
      ? `${x},${top} ${rectRight},${top} ${x + w},${mid} ${rectRight},${bottom} ${x},${bottom} ${x + tip},${mid}`
      : `${x},${top} ${rectRight},${top} ${x + w},${mid} ${rectRight},${bottom} ${x},${bottom}`;
    return left;
  };

  let cursor = pad;
  const drawn = segments.map((s, i) => {
    const w = Math.max(0.0001, (s.value / sum) * totalW);
    // A notched segment is pulled back by the tip and widened to match, so its concave
    // left edge sits exactly over the previous segment's arrow point — they interlock
    // with no background showing between them.
    const notched = i > 0;
    const back = notched ? Math.min(tri, w) : 0;
    const item = { ...s, x: cursor - back, w: w + back, notched, labelX: cursor + w / 2, share: (s.value / sum) * 100 };
    cursor += w;
    return item;
  });

  return (
    <div>
      <svg viewBox={`0 0 1000 ${bottom + 16}`} className="w-full" style={{ height: 86 }} preserveAspectRatio="none">
        <rect x={pad - 6} y={top - 6} width={totalW + 12} height={height + 12} fill="none" stroke="#0f172a" strokeDasharray="6 5" strokeWidth={2} />
        {[...drawn].reverse().map((s, i) => (
          <g key={i}>
            <polygon points={poly(s.x, s.w, s.notched)} fill={s.color} />
            <text x={s.labelX} y={mid + 8} textAnchor="middle" fill={s.textColor ?? "#ffffff"} fontSize={24} fontWeight={700}>
              {s.label}
            </text>
          </g>
        ))}
      </svg>
      {/* Which ribbon is which, sized to the same share of the width as its segment. */}
      {drawn.some(s => s.name) && (
        <div className="mt-1 flex">
          {drawn.map((s, i) => (
            <span key={i} className="min-w-0 px-0.5 text-center" style={{ width: `${s.share}%` }}>
              <span className="block truncate text-[11px] font-medium text-slate-700" title={s.name}>{s.name}</span>
            </span>
          ))}
        </div>
      )}
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[11px] text-slate-500"><span>{leftLabel}</span><span>{rightLabel}</span></div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- band scale ---- */

/**
 * Horizontal band scale with a pointer at the score and every boundary labelled.
 * Shared by the Financial Health Analysis panel and the AI Analysis tab.
 */
export function BandScale({
  score, bands, max = 100, showLabels = true,
}: {
  score: number;
  bands: GaugeBand[];
  max?: number;
  showLabels?: boolean;
}) {
  const pct = (v: number) => (v / max) * 100;
  const boundaries = [bands[0].from, ...bands.map(b => b.to)];
  return (
    <div>
      <div className="relative">
        <div className="flex h-5 overflow-hidden rounded-full">
          {bands.map(band => (
            <div
              key={band.label}
              style={{ width: `${pct(band.to - band.from)}%`, backgroundColor: band.color }}
              className="grid place-items-center text-[9px] font-semibold uppercase tracking-wide text-white/90"
            >
              {showLabels ? band.label : null}
            </div>
          ))}
        </div>
        <div className="absolute -bottom-1 -translate-x-1/2" style={{ left: `${pct(score)}%` }}>
          <div className="mx-auto size-0 border-x-[6px] border-b-[7px] border-x-transparent border-b-slate-900" />
        </div>
      </div>
      <div className="relative mt-2 h-5">
        <span
          className="absolute -translate-x-1/2 rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white"
          style={{ left: `${pct(score)}%` }}
        >
          {score}
        </span>
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-slate-500">
        {boundaries.map((n, i) => (
          <span
            key={n}
            className="absolute tabular-nums"
            style={{
              left: `${pct(n)}%`,
              transform: i === 0 ? "translateX(0)" : i === boundaries.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
