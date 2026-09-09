"use client";

import { useEffect, useMemo, useState } from "react";
import type { DayStatus, StatusDay } from "../../app/status/StatusParts";
import { statusColor } from "../../app/status/StatusParts";

type IncidentLite = { startedAt: string; resolvedAt?: string };
type RangeKey = "24h" | "7d" | "30d" | "90d";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const RANGE_MS: Record<RangeKey, number> = {
  "24h": 24 * HOUR_MS,
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
  "90d": 90 * DAY_MS,
};

function startOfLocalHour(ms: number) {
  const d = new Date(ms);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function startOfLocalDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildBuckets(range: RangeKey, now: number) {
  const count =
    range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : 90;

  if (range === "24h") {
    const hourStart = startOfLocalHour(now);
    return Array.from({ length: count }, (_, i) => {
      const start = hourStart - (count - 1 - i) * HOUR_MS;
      return { start, end: start + HOUR_MS };
    });
  }

  const dayStart = startOfLocalDay(now);
  return Array.from({ length: count }, (_, i) => {
    const start = dayStart - (count - 1 - i) * DAY_MS;
    const end = startOfLocalDay(start + DAY_MS + HOUR_MS);
    return { start, end };
  });
}

function buildOutages(incidents: IncidentLite[], now: number) {
  return incidents
    .map((inc) => {
      const start = new Date(inc.startedAt).getTime();
      if (!Number.isFinite(start)) return null;
      const end = inc.resolvedAt ? new Date(inc.resolvedAt).getTime() : now;
      if (!Number.isFinite(end) || end <= start) return null;
      return { start, end };
    })
    .filter(Boolean) as { start: number; end: number }[];
}

function downtimeMs(
  a: number,
  b: number,
  outages: { start: number; end: number }[]
) {
  let down = 0;
  for (const o of outages) {
    const s = Math.max(o.start, a);
    const e = Math.min(o.end, b);
    if (e > s) down += e - s;
  }
  return Math.min(down, Math.max(0, b - a));
}

function statusFromPct(
  pct: number,
  currentStatus: string,
  isCurrent: boolean
): DayStatus {
  if (isCurrent && currentStatus === "down") return "down";
  if (isCurrent && currentStatus === "degraded") return "degraded";
  if (pct >= 95) return "up";
  if (pct >= 25) return "degraded";
  return "down";
}

function enrich(
  range: RangeKey,
  incidents: IncidentLite[],
  monitorStartedAt: string | null,
  overallUptimePct: number,
  currentStatus: string,
  now: number
): StatusDay[] {
  const windowStart = now - RANGE_MS[range];
  const outages = buildOutages(incidents, now);
  let dataFrom = Number.POSITIVE_INFINITY;

  if (monitorStartedAt) {
    const t = new Date(monitorStartedAt).getTime();
    if (Number.isFinite(t)) dataFrom = t;
  }

  for (const o of outages) {
    if (o.start < dataFrom) dataFrom = o.start;
  }

  if (!Number.isFinite(dataFrom) && currentStatus !== "unknown") {
    dataFrom = windowStart;
  }

  const buckets = buildBuckets(range, now);

  return buckets.map(({ start, end }) => {
    const date = new Date(start).toISOString();

    if (start >= now) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    if (end <= windowStart) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    if (Number.isFinite(dataFrom) && end < dataFrom) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    const bStart = Math.max(start, windowStart);
    const bEnd = Math.min(end, now);
    const span = Math.max(0, bEnd - bStart);
    if (span <= 0) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    const down = downtimeMs(bStart, bEnd, outages);
    const isCurrent = start <= now && now < end;

    if (down <= 0) {
      if (isCurrent) {
        return {
          date,
          status: statusFromPct(overallUptimePct, currentStatus, true),
          uptimePct: overallUptimePct,
        };
      }
      return { date, status: "up" as const, uptimePct: 100 };
    }

    const pct = Math.round(((span - down) / span) * 1000) / 10;
    return {
      date,
      status: statusFromPct(pct, currentStatus, isCurrent),
      uptimePct: pct,
    };
  });
}

function exactTitle(day: StatusDay, range24h: boolean) {
  const d = new Date(day.date);
  if (Number.isNaN(d.getTime())) return "—";
  const when = range24h
    ? d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  if (day.status === "nodata" || day.uptimePct == null) {
    return `${when} · no data`;
  }
  const label =
    day.status === "up"
      ? "Operational"
      : day.status === "degraded"
        ? "Degraded"
        : day.status === "down"
          ? "Down"
          : "No data";
  return `${when} · ${label} · ${day.uptimePct}%`;
}

export function StatusBars({
  range,
  range24h,
  incidents,
  monitorStartedAt = null,
  overallUptimePct,
  currentStatus = "up",
}: {
  range: RangeKey;
  range24h: boolean;
  incidents: IncidentLite[];
  monitorStartedAt?: string | null;
  overallUptimePct: number;
  currentStatus?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const days = useMemo(() => {
    if (now == null) return [];
    return enrich(
      range,
      incidents,
      monitorStartedAt,
      overallUptimePct,
      currentStatus,
      now
    );
  }, [now, range, incidents, monitorStartedAt, overallUptimePct, currentStatus]);

  const n =
    range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const render =
    days.length > 0
      ? days
      : Array.from({ length: n }, (_, i) => ({
          date: `p-${i}`,
          status: "nodata" as const,
          uptimePct: undefined,
        }));

  return (
    <div className="flex h-10 w-full gap-[2px]">
      {render.map((day, i) => (
        <div
          key={`${day.date}-${i}`}
          className={`status-bar group relative min-w-0 flex-1 rounded-[2px] transition-opacity hover:opacity-80 ${statusColor(
            day.status
          )}`}
          style={{ animationDelay: `${220 + i * 12}ms` }}
        >
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#1c100c] px-2.5 py-1.5 text-xs text-white/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          >
            {now != null ? exactTitle(day, range24h) : "…"}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1c100c]" />
          </div>
        </div>
      ))}
    </div>
  );
}