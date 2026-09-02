"use client";

import { useEffect, useMemo, useState } from "react";
import type { DayStatus, StatusDay } from "../../app/status/StatusParts";
import { statusColor } from "../../app/status/StatusParts";

type IncidentLite = {
  startedAt: string;
  resolvedAt?: string;
};

type RangeKey = "24h" | "7d" | "30d" | "90d";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_MS: Record<RangeKey, number> = {
  "24h": 24 * HOUR_MS,
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
  "90d": 90 * DAY_MS,
};

function startOfLocalHour(ms: number): number {
  const d = new Date(ms);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildLocalBuckets(
  range: RangeKey,
  now: number
): { start: number; end: number }[] {
  const count =
    range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : 90;

  if (range === "24h") {
    const hourStart = startOfLocalHour(now);
    const out: { start: number; end: number }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const start = hourStart - i * HOUR_MS;
      out.push({ start, end: Math.min(start + HOUR_MS, now + HOUR_MS) });
    }
    return out;
  }

  const dayStart = startOfLocalDay(now);
  const out: { start: number; end: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = dayStart - i * DAY_MS;
    const end = startOfLocalDay(start + DAY_MS + HOUR_MS);
    out.push({ start, end });
  }
  return out;
}

function buildOutages(
  incidents: IncidentLite[],
  now: number,
  windowStart: number,
  currentStatus: string
): { start: number; end: number }[] {
  const outages = incidents
    .map((inc) => {
      const start = new Date(inc.startedAt).getTime();
      if (Number.isNaN(start)) return null;
      const end = inc.resolvedAt ? new Date(inc.resolvedAt).getTime() : now;
      if (Number.isNaN(end) || end <= start) return null;
      return { start, end };
    })
    .filter(Boolean) as { start: number; end: number }[];

  const hasOpenIncident = incidents.some((inc) => {
    if (inc.resolvedAt) return false;
    const t = new Date(inc.startedAt).getTime();
    return Number.isFinite(t);
  });

  if (
    (currentStatus === "down" || currentStatus === "degraded") &&
    !hasOpenIncident
  ) {
    let start = windowStart;
    for (const inc of incidents) {
      const t = new Date(inc.startedAt).getTime();
      if (Number.isFinite(t) && t > start && t <= now) start = t;
    }
    outages.push({ start, end: now });
  }

  return outages;
}

function downtimeInBucket(
  bucketStart: number,
  bucketEnd: number,
  outages: { start: number; end: number }[]
): number {
  let down = 0;
  for (const o of outages) {
    const start = Math.max(o.start, bucketStart);
    const end = Math.min(o.end, bucketEnd);
    if (end > start) down += end - start;
  }
  return Math.min(down, Math.max(0, bucketEnd - bucketStart));
}

function pctFromDowntime(bucketMs: number, downMs: number): number {
  if (bucketMs <= 0) return 100;
  return Math.round(((bucketMs - downMs) / bucketMs) * 1000) / 10;
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

function enrichLocal(
  range: RangeKey,
  incidents: IncidentLite[],
  overallUptimePct: number,
  currentStatus: string,
  now: number
): StatusDay[] {
  const windowStart = now - RANGE_MS[range];
  const outages = buildOutages(incidents, now, windowStart, currentStatus);
  const buckets = buildLocalBuckets(range, now);

  return buckets.map(({ start, end }) => {
    const date = new Date(start).toISOString();

    if (start >= now) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    if (end <= windowStart) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    const bucketStart = Math.max(start, windowStart);
    const bucketEnd = Math.min(end, now);
    const bucketMs = Math.max(0, bucketEnd - bucketStart);
    if (bucketMs <= 0) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    const downMs = downtimeInBucket(bucketStart, bucketEnd, outages);
    const isCurrent = start <= now && now < end;
    const hadOutage = downMs > 0;

    if (!hadOutage && !isCurrent) {
      return { date, status: "nodata" as const, uptimePct: undefined };
    }

    if (!hadOutage && isCurrent) {
      return {
        date,
        status: statusFromPct(overallUptimePct, currentStatus, true),
        uptimePct: overallUptimePct,
      };
    }

    const pct = pctFromDowntime(bucketMs, downMs);
    return {
      date,
      status: statusFromPct(pct, currentStatus, isCurrent),
      uptimePct: pct,
    };
  });
}

function exactTitle(day: StatusDay, range24h: boolean): string {
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
  overallUptimePct,
  currentStatus = "up",
}: {
  range: RangeKey;
  range24h: boolean;
  incidents: IncidentLite[];
  overallUptimePct: number;
  currentStatus?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const days = useMemo(() => {
    if (now == null) return [];
    return enrichLocal(range, incidents, overallUptimePct, currentStatus, now);
  }, [now, range, incidents, overallUptimePct, currentStatus]);

  const placeholderCount =
    range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : 90;

  const renderDays =
    days.length > 0
      ? days
      : Array.from({ length: placeholderCount }, (_, i) => ({
          date: `placeholder-${i}`,
          status: "nodata" as const,
          uptimePct: undefined,
        }));

  return (
    <div className="flex h-10 w-full gap-[2px]">
      {renderDays.map((day, i) => (
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