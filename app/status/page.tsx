import type { Metadata } from "next";
import { vanta } from "@/lib/vanta";
import { AutoRefresh } from "@/components/autoRefresh";
import { IncidentsList } from "@/components/ui/IncidentsList";
import { timeRange } from "@vanta-dev/node";
import {
  type RangeKey,
  type DayStatus,
  type StatusDay,
  type Incident,
  type StatusPayload,
  RANGE_LABELS,
  formatRelative,
  formatMs,
  formatMemory,
  statusColor,
  StatCard,
  RangeTabs,
} from "./StatusParts";
import { StatusBars } from "@/components/ui/StatusBars";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Live system status for Functious - uptime, latencies, and incidents.",
};

export const dynamic = "force-dynamic";
export const revalidate = 60;

const RANGE_MS: Record<RangeKey, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseRange(raw: string | string[] | undefined): RangeKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "24h" || v === "7d" || v === "30d" || v === "90d" ? v : "7d";
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "a moment";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function unwrapStats(res: unknown): Record<string, unknown> {
  if (!res || typeof res !== "object") return {};
  const o = res as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o;
}

function unwrapList(res: unknown): any[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.monitors)) return o.monitors;
  }
  return [];
}

function extractMetricValue(res: unknown): number | null {
  if (res == null) return null;
  if (typeof res === "number" && Number.isFinite(res)) return res;

  if (typeof res === "object") {
    const o = res as Record<string, unknown>;
    const sources = [o.data, o].filter(
      (x): x is Record<string, unknown> =>
        !!x && typeof x === "object" && !Array.isArray(x)
    );
    for (const src of sources) {
      for (const k of ["value", "avg", "current", "result", "aggregation"]) {
        const v = src[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
      }
    }
  }
  return null;
}

async function resolveBotMonitorId(): Promise<string | null> {
  try {
    const list = unwrapList(await (vanta as any).uptime.listMonitors());
    const bot =
      list.find(
        (m: any) =>
          m.slug === "bot" ||
          m.name?.toLowerCase() === "bot" ||
          m.name?.toLowerCase().includes("bot")
      ) ?? list[0];
    return bot?.id ?? null;
  } catch (err) {
    console.error("listMonitors failed", err);
    return null;
  }
}

async function loadIncidents(
  monitorId: string,
  range: RangeKey
): Promise<Incident[]> {
  try {
    const list = unwrapList(await (vanta as any).uptime.getIncidents(monitorId));
    const cutoff = Date.now() - RANGE_MS[range];

    return list
      .map((inc: any) => {
        const startedAt = inc.startedAt ?? inc.started_at ?? "";
        const endedAt = inc.endedAt ?? inc.ended_at ?? undefined;
        const statusRaw = String(inc.status ?? "resolved").toLowerCase();
        const isActive = statusRaw === "active" || statusRaw === "open";
        const durationMs =
          typeof inc.durationMs === "number"
            ? inc.durationMs
            : endedAt
              ? new Date(endedAt).getTime() - new Date(startedAt).getTime()
              : isActive && startedAt
                ? Date.now() - new Date(startedAt).getTime()
                : 0;

        const data =
          inc.data && typeof inc.data === "object" ? inc.data : undefined;
        const customTitle =
          (typeof data?.title === "string" && data.title.trim()) ||
          (typeof inc.title === "string" && inc.title.trim()) ||
          "";
        const customDescription =
          (typeof data?.description === "string" && data.description.trim()) ||
          (typeof inc.description === "string" && inc.description.trim()) ||
          "";

        return {
          id: String(inc.id ?? `${startedAt}-${endedAt ?? "active"}`),
          title:
            customTitle ||
            (isActive ? "Service interruption" : "Service restored"),
          severity: isActive ? "major" : "resolved",
          status: isActive ? "investigating" : "resolved",
          body:
            customDescription ||
            (isActive
              ? `Monitor went down and has not recovered yet${
                  durationMs > 0 ? ` (${formatDuration(durationMs)} so far)` : ""
                }.`
              : `Outage lasted ${formatDuration(durationMs)}.`),
          startedAt,
          resolvedAt: isActive ? undefined : endedAt,
        } satisfies Incident;
      })
      .filter((inc) => {
        if (!inc.startedAt) return false;
        const t = new Date(inc.startedAt).getTime();
        return !Number.isNaN(t) && t >= cutoff;
      })
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
  } catch (err) {
    console.error("getIncidents failed", err);
    return [];
  }
}

async function queryMetricAvg(
  name: string,
  range: RangeKey
): Promise<number | null> {
  const end = new Date();
  const start = new Date(end.getTime() - RANGE_MS[range]);

  try {
    const metrics = (vanta as any).metrics;
    if (!metrics) return null;

    if (typeof metrics.query === "function") {
      const q = await metrics.query({
        name,
        time: timeRange(start.toISOString(), end.toISOString()),
        aggregation: "avg",
      });
      const fromQuery = extractMetricValue(q);
      if (fromQuery != null) return fromQuery;
    }

    if (typeof metrics.current === "function") {
      return extractMetricValue(await metrics.current({ name }));
    }
  } catch {
  }
  return null;
}

/**
 * Absolute UTC-aligned buckets. No setHours / setMinutes — those use
 * the server's local zone (UTC on Vercel), which is what skewed labels.
 * Never creates a bucket that starts in the future.
 */
 function buildPlaceholderDays(range: RangeKey): StatusDay[] {
   const count =
     range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
   const now = Date.now();
   const days: StatusDay[] = [];

   if (range === "24h") {
     // Start of the current UTC hour (always ≤ now)
     const hourStart = Math.floor(now / HOUR_MS) * HOUR_MS;
     for (let i = count - 1; i >= 0; i--) {
       days.push({
         date: new Date(hourStart - i * HOUR_MS).toISOString(),
         status: "nodata",
       });
     }
     return days;
   }

   const nowDate = new Date(now);
   const dayStart = Date.UTC(
     nowDate.getUTCFullYear(),
     nowDate.getUTCMonth(),
     nowDate.getUTCDate()
   );
   for (let i = count - 1; i >= 0; i--) {
     days.push({
       date: new Date(dayStart - i * DAY_MS).toISOString(),
       status: "nodata",
     });
   }
   return days;
 }

type OutageInterval = { start: number; end: number };

function buildOutages(incidents: Incident[], now: number): OutageInterval[] {
  return incidents
    .map((inc) => {
      const start = new Date(inc.startedAt).getTime();
      if (Number.isNaN(start)) return null;
      const end = inc.resolvedAt ? new Date(inc.resolvedAt).getTime() : now;
      if (Number.isNaN(end) || end <= start) return null;
      return { start, end };
    })
    .filter(Boolean) as OutageInterval[];
}

function downtimeInBucket(
  bucketStart: number,
  bucketEnd: number,
  outages: OutageInterval[]
): number {
  const span = bucketEnd - bucketStart;
  if (span <= 0) return 0;
  let down = 0;
  for (const o of outages) {
    const start = Math.max(o.start, bucketStart);
    const end = Math.min(o.end, bucketEnd);
    if (end > start) down += end - start;
  }
  return Math.min(down, span);
}

function pctFromDowntime(bucketMs: number, downMs: number): number {
  if (bucketMs <= 0) return 100;
  return Math.round(((bucketMs - downMs) / bucketMs) * 1000) / 10;
}

function statusFromPct(
  pct: number,
  currentStatus: string,
  isCurrentBucket: boolean
): DayStatus {
  if (isCurrentBucket && currentStatus === "down") return "down";
  if (pct >= 95) return "up";
  if (pct >= 25) return "degraded";
  return "down";
}

function enrichDaysFromMonitors(
  days: StatusDay[],
  overallUptimePct: number,
  range: RangeKey,
  incidents: Incident[] = [],
  currentStatus = "up"
): StatusDay[] {
  const now = Date.now();
  const windowStart = now - RANGE_MS[range];
  const outages = buildOutages(incidents, now);

  if (range === "24h") {
    return days.map((d) => {
      const t = new Date(d.date).getTime();
      if (Number.isNaN(t) || t >= now || t < windowStart - HOUR_MS) {
        return { ...d, status: "nodata" as const, uptimePct: undefined };
      }

      const bucketEnd = Math.min(t + HOUR_MS, now);
      const bucketMs = Math.max(0, bucketEnd - t);
      if (bucketMs <= 0) {
        return { ...d, status: "nodata" as const, uptimePct: undefined };
      }

      const downMs = downtimeInBucket(t, bucketEnd, outages);
      const pct = pctFromDowntime(bucketMs, downMs);
      const isCurrent = bucketEnd >= now - 60_000;

      return {
        ...d,
        status: statusFromPct(pct, currentStatus, isCurrent),
        uptimePct: pct,
      };
    });
  }

  return days.map((d) => {
    const dayStartMs = new Date(d.date).getTime();
    const dayEndFull = dayStartMs + DAY_MS;

    if (dayStartMs > now) {
      return { ...d, status: "nodata" as const, uptimePct: undefined };
    }

    if (dayEndFull <= windowStart) {
      return { ...d, status: "nodata" as const, uptimePct: undefined };
    }

    const bucketStart = Math.max(dayStartMs, windowStart);
    const bucketEnd = Math.min(dayEndFull, now);
    const bucketMs = Math.max(0, bucketEnd - bucketStart);

    if (bucketMs <= 0) {
      return { ...d, status: "nodata" as const, uptimePct: undefined };
    }

    const downMs = downtimeInBucket(bucketStart, bucketEnd, outages);
    const isCurrent = dayStartMs <= now && now < dayEndFull;
    const hadOutage = downMs > 0;

    if (!hadOutage && !isCurrent) {
      return { ...d, status: "nodata" as const, uptimePct: undefined };
    }

    if (!hadOutage && isCurrent) {
      return {
        ...d,
        status: statusFromPct(overallUptimePct, currentStatus, true),
        uptimePct: overallUptimePct,
      };
    }

    const pct = pctFromDowntime(bucketMs, downMs);
    return {
      ...d,
      status: statusFromPct(pct, currentStatus, isCurrent),
      uptimePct: pct,
    };
  });
}

async function loadStatus(range: RangeKey): Promise<StatusPayload> {
  const fallbackDays = buildPlaceholderDays(range);
  const base: StatusPayload = {
    overall: "operational",
    overallMessage: "Connected and responding",
    upSince: new Date().toISOString(),
    uptimePct: 100,
    gatewayPing: null,
    databasePing: null,
    memory: null,
    days: fallbackDays,
    incidents: [],
    range,
  };

  try {
    const monitorId = await resolveBotMonitorId();

    const [gateway, database, memory, uptime, incidents] =
      await Promise.allSettled([
        queryMetricAvg("ping.gateway", range),
        queryMetricAvg("ping.db", range),
        queryMetricAvg("ping.memory", range),
        monitorId
          ? (async () => {
              const s = unwrapStats(
                await (vanta as any).uptime.getStats(monitorId, range)
              );
              return {
                uptimePct:
                  typeof s.uptimePercentage === "number"
                    ? s.uptimePercentage
                    : 100,
                currentStatus: (s.currentStatus as string) ?? "up",
                lastHeartbeat:
                  (s.lastHeartbeat as string) ??
                  (s.lastHeartbeatAt as string) ??
                  null,
              };
            })()
          : Promise.resolve(null),
        monitorId ? loadIncidents(monitorId, range) : Promise.resolve([]),
      ]);

    if (gateway.status === "fulfilled") base.gatewayPing = gateway.value;
    if (database.status === "fulfilled") base.databasePing = database.value;
    if (memory.status === "fulfilled") base.memory = memory.value;

    const uptimeData = uptime.status === "fulfilled" ? uptime.value : null;
    const incidentList =
      incidents.status === "fulfilled" ? incidents.value : [];

    if (uptimeData) {
      base.uptimePct = uptimeData.uptimePct;
      if (uptimeData.lastHeartbeat) base.upSince = uptimeData.lastHeartbeat;

      if (uptimeData.currentStatus === "down") {
        base.overall = "outage";
        base.overallMessage = "Primary monitor is down";
      } else if (uptimeData.currentStatus === "degraded") {
        base.overall = "degraded";
        base.overallMessage = "Primary monitor is degraded";
      }
    }

    base.incidents = incidentList;
    if (incidentList.some((i) => i.status !== "resolved")) {
      base.overall = "outage";
      base.overallMessage = "An active incident is in progress";
    }

    base.days = enrichDaysFromMonitors(
      fallbackDays,
      base.uptimePct,
      range,
      incidentList,
      uptimeData?.currentStatus ?? "up"
    );

    return base;
  } catch {
    return base;
  }
}

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const data = await loadStatus(range);

  const overallLabel =
    data.overall === "operational"
      ? "Operational"
      : data.overall === "degraded"
        ? "Partial system degradation"
        : "Major outage";

  const overallRing =
    data.overall === "operational"
      ? "border-emerald-500/30 bg-emerald-950/20"
      : data.overall === "degraded"
        ? "border-orange/40 bg-orange/5"
        : "border-rose-500/30 bg-rose-950/20";

  const overallDot =
    data.overall === "operational"
      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]"
      : data.overall === "degraded"
        ? "bg-orange shadow-[0_0_12px_rgba(237,147,11,0.45)]"
        : "bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.55)]";

  const rangeLabel =
    range === "24h"
      ? "24 hours"
      : range === "7d"
        ? "7 days"
        : range === "30d"
          ? "30 days"
          : "90 days";

  return (
    <main className="min-h-screen bg-bg-dark">
      <style>{`
        @keyframes statusFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusBarIn {
          from { opacity: 0; transform: scaleY(0.25); }
          to { opacity: 1; transform: scaleY(1); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.92); }
        }
        .status-fade {
          animation: statusFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .status-bar {
          animation: statusBarIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: bottom center;
        }
        .status-dot-live {
          animation: statusPulse 2.2s ease-in-out infinite;
        }
      `}</style>

      <AutoRefresh intervalMs={60_000} />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header
          className="status-fade mb-10 max-w-2xl"
          style={{ animationDelay: "0ms" }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Status
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Live uptime, latency, and incident history for Functious.
          </p>
        </header>

        <section
          className={`status-fade mb-8 rounded-xl border px-6 py-5 ${overallRing}`}
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${overallDot} ${
                data.overall === "operational" ? "status-dot-live" : ""
              }`}
            />
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {overallLabel}
              </h2>
              <p className="mt-1 text-sm text-white/60">
                {data.overallMessage}
                {data.upSince && data.overall === "operational" && (
                  <> · last beat {formatRelative(data.upSince)}</>
                )}
              </p>
            </div>
          </div>
        </section>

        <section
          className="status-fade mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
          style={{ animationDelay: "120ms" }}
        >
          <StatCard
            label={`Uptime · ${RANGE_LABELS[range]}`}
            value={`${
              data.uptimePct % 1 === 0
                ? data.uptimePct
                : data.uptimePct.toFixed(2)
            }%`}
          />
          <StatCard
            label={`Gateway · ${RANGE_LABELS[range]}`}
            value={formatMs(data.gatewayPing)}
          />
          <StatCard
            label={`Database · ${RANGE_LABELS[range]}`}
            value={formatMs(data.databasePing)}
          />
          <StatCard
            label={`Memory · ${RANGE_LABELS[range]}`}
            value={formatMemory(data.memory)}
          />
        </section>

        <section
          className="status-fade mb-8 rounded-xl border border-white/10 bg-[#140b08] p-5"
          style={{ animationDelay: "180ms" }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-white/80">
              Last {rangeLabel}
            </h2>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 text-xs text-white/40 sm:flex">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500" /> up
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-orange" /> degraded
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-rose-500" /> down
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-white/15" /> no data
                </span>
              </div>
              <RangeTabs active={range} />
            </div>
          </div>

          <StatusBars days={data.days} range24h={range === "24h"} />
          
          <div className="mt-2 flex justify-between text-xs text-white/40">
            <span>{rangeLabel} ago</span>
            <span>now</span>
          </div>
        </section>

        <section
          className="status-fade rounded-xl border border-white/10 bg-[#140b08] p-5"
          style={{ animationDelay: "280ms" }}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Incidents
            </h2>
            {data.incidents.length > 0 && (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs tabular-nums text-white/40">
                {data.incidents.length}
              </span>
            )}
          </div>
          <IncidentsList incidents={data.incidents} />
        </section>
      </div>
    </main>
  );
}
