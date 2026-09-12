"use client";

import Link from "next/link";
import { useState } from "react";
import { MetricGraph, type RangeKey } from "@/components/ui/MetricGraph";

const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "24H",
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
};

const METRICS = [
  {
    metric: "gateway" as const,
    label: "Gateway Latency",
    unit: "ms" as const,
    color: "emerald",
    description: "Average round-trip latency to the Fluxer gateway.",
  },
  {
    metric: "database" as const,
    label: "Database Latency",
    unit: "ms" as const,
    color: "sky",
    description: "Average query latency to the database.",
  },
  {
    metric: "memory" as const,
    label: "Memory Usage",
    unit: "mb" as const,
    color: "orange",
    description: "Bot process memory consumption.",
  },
];

export default function MetricsPage() {
  const [range, setRange] = useState<RangeKey>("7d");

  return (
    <main className="min-h-screen bg-bg-dark">
      <style>{`
        @keyframes statusFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .status-fade {
          animation: statusFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="status-fade mb-10" style={{ animationDelay: "0ms" }}>
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to status
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Metrics
              </h1>
              <p className="mt-3 text-lg text-white/60">
                Latency and memory trends over time.
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-white/10 bg-bg-dark p-0.5">
              {(["24h", "7d", "30d", "90d"] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
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
        </div>

        <div className="flex flex-col gap-10">
          {METRICS.map((m, i) => (
            <div
              key={m.metric}
              className="status-fade"
              style={{ animationDelay: `${60 + i * 80}ms` }}
            >
              <MetricGraph
                metric={m.metric}
                label={m.label}
                unit={m.unit}
                color={m.color}
                range={range}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
