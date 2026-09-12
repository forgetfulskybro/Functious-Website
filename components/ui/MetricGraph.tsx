"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type RangeKey = "24h" | "7d" | "30d" | "90d";

interface Bucket {
  timestamp: string;
  value: number;
}

interface TooltipState {
  x: number;
  y: number;
  bucket: Bucket;
  svgX: number;
}

const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "24H",
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
};

function formatValue(value: number, unit: "ms" | "mb" | "generic"): string {
  if (unit === "ms") {
    return value < 10 ? `${value.toFixed(1)}ms` : `${Math.round(value)}ms`;
  }
  if (unit === "mb") {
    const mb = value >= 1_000_000 ? value / (1024 * 1024) : value;
    return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  }
  return String(Math.round(value));
}

function formatTimestamp(iso: string, range: RangeKey): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (range === "24h" || range === "7d") {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface MetricGraphProps {
  metric: "gateway" | "database" | "memory";
  label: string;
  unit: "ms" | "mb" | "generic";
  color: string;
  range?: RangeKey;
  initialRange?: RangeKey;
}

export function MetricGraph({
  metric,
  label,
  unit,
  color,
  range: externalRange,
  initialRange = "7d",
}: MetricGraphProps) {
  const [internalRange, setInternalRange] = useState<RangeKey>(initialRange);
  const range = externalRange ?? internalRange;
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [lineLength, setLineLength] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);

  const fetchData = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setError(null);
    setLineLength(null);
    try {
      const res = await fetch(`/api/status/metrics/${metric}?range=${r}`);
      const json = await res.json();
      setBuckets(Array.isArray(json.buckets) ? json.buckets : []);
      setAnimKey((k) => k + 1);
    } catch {
      setError("Failed to load data");
      setBuckets([]);
    } finally {
      setLoading(false);
    }
  }, [metric]);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  useEffect(() => {
    if (lineRef.current) {
      try {
        const len = lineRef.current.getTotalLength();
        setLineLength(len > 0 ? len : null);
      } catch {
        setLineLength(null);
      }
    }
  }, [animKey, buckets]);

  const W = 800;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 32, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const hasBuckets = buckets.length >= 2;
  const values = buckets.map((b) => b.value);
  const rawMin = hasBuckets ? Math.min(...values) : 0;
  const rawMax = hasBuckets ? Math.max(...values) : 100;
  const padding = (rawMax - rawMin) * 0.15 || rawMax * 0.1 || 10;
  const yMin = Math.max(0, rawMin - padding);
  const yMax = rawMax + padding;
  const yRange = yMax - yMin || 1;
  const toX = (i: number) =>
    PAD.left + (i / (buckets.length - 1)) * chartW;
  const toY = (v: number) =>
    PAD.top + chartH - ((v - yMin) / yRange) * chartH;

  const points = hasBuckets
    ? buckets.map((b, i) => `${toX(i)},${toY(b.value)}`).join(" ")
    : "";

  const areaPoints = hasBuckets
    ? `${PAD.left},${PAD.top + chartH} ${points} ${toX(buckets.length - 1)},${PAD.top + chartH}`
    : "";

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    yMin + (yRange * i) / yTicks
  );

  const strokeColors: Record<string, string> = {
    emerald: "#10b981",
    orange: "#f97316",
    sky: "#38bdf8",
    rose: "#f43f5e",
  };
  const areaColors: Record<string, string> = {
    emerald: "rgba(16,185,129,0.12)",
    orange: "rgba(249,115,22,0.12)",
    sky: "rgba(56,189,248,0.12)",
    rose: "rgba(244,63,94,0.12)",
  };
  const stroke = strokeColors[color] ?? strokeColors.emerald;
  const area = areaColors[color] ?? areaColors.emerald;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!hasBuckets || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = W / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const chartMouseX = mouseX - PAD.left;
      const idx = Math.round((chartMouseX / chartW) * (buckets.length - 1));
      const clamped = Math.max(0, Math.min(buckets.length - 1, idx));
      const b = buckets[clamped];
      const svgX = toX(clamped);
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        bucket: b,
        svgX,
      });
    },
    [hasBuckets, buckets, chartW]
  );

  const handleMouseLeave = () => setTooltip(null);
  const animId = `metric-draw-${metric}-${animKey}`;

  return (
    <div className="w-full">
      {!externalRange && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white/60">{label}</h2>
          <div className="inline-flex rounded-lg border border-white/10 bg-bg-dark p-0.5">
            {(["24h", "7d", "30d", "90d"] as RangeKey[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setInternalRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  r === range
                    ? "bg-orange/20 text-orange-light"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}
      {externalRange && (
        <h2 className="text-sm font-medium text-white/60 mb-4">{label}</h2>
      )}

      <div className="relative rounded-xl border border-white/10 bg-[#140b08] p-4">
        {lineLength != null && (
          <style>{`
            @keyframes ${animId} {
              from { stroke-dashoffset: ${lineLength}; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes ${animId}-area {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            .${animId}-line {
              stroke-dasharray: ${lineLength};
              stroke-dashoffset: 0;
              animation: ${animId} 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            .${animId}-area {
              animation: ${animId}-area 0.5s ease 0.2s both;
            }
          `}</style>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#140b08]/80 z-10">
            <div className="text-white/40 text-sm">Loading…</div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
            <div className="text-white/30 text-sm">{error}</div>
          </div>
        )}
        {!loading && !error && !hasBuckets && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
            <div className="text-white/30 text-sm">No data for this period</div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          style={{ height: "200px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {yTickValues.map((v, i) => {
            const y = toY(v);
            return (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.25)"
                  fontSize="11"
                >
                  {formatValue(v, unit)}
                </text>
              </g>
            );
          })}

          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + chartH}
            y2={PAD.top + chartH}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {hasBuckets && (
            <>
              <polygon
                points={areaPoints}
                fill={area}
                className={lineLength != null ? `${animId}-area` : undefined}
              />

              <polyline
                key={animKey}
                ref={lineRef}
                points={points}
                fill="none"
                stroke={stroke}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                className={lineLength != null ? `${animId}-line` : undefined}
              />

              {tooltip && (
                <line
                  x1={tooltip.svgX}
                  x2={tooltip.svgX}
                  y1={PAD.top}
                  y2={PAD.top + chartH}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {tooltip && (
                <circle
                  cx={tooltip.svgX}
                  cy={toY(tooltip.bucket.value)}
                  r="4"
                  fill={stroke}
                  stroke="#140b08"
                  strokeWidth="2"
                />
              )}
            </>
          )}
        </svg>

        {tooltip && hasBuckets && (
          <div
            className="pointer-events-none absolute z-20 rounded-md border border-white/10 bg-[#1c100c] px-2.5 py-1.5 text-xs text-white/90 shadow-lg"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 56}px`,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            <div className="font-medium" style={{ color: stroke }}>
              {formatValue(tooltip.bucket.value, unit)}
            </div>
            <div className="text-white/40 mt-0.5">
              {formatTimestamp(tooltip.bucket.timestamp, range)}
            </div>
          </div>
        )}

        {hasBuckets && (
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-[11px] text-white/25">
              {formatTimestamp(buckets[0].timestamp, range)}
            </span>
            <span className="text-[11px] text-white/25">
              {formatTimestamp(buckets[buckets.length - 1].timestamp, range)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}