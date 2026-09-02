import Link from "next/link";

export type RangeKey = "24h" | "7d" | "30d" | "90d";
export type DayStatus = "up" | "degraded" | "down" | "nodata";

export const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "24H",
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
};

export interface StatusDay {
  date: string;
  status: DayStatus;
  uptimePct?: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: "info" | "degraded" | "major" | "resolved";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  body: string;
  startedAt: string;
  resolvedAt?: string;
  author?: string;
  updates?: { at: string; text: string; status: string }[];
}

export interface StatusPayload {
  overall: "operational" | "degraded" | "outage";
  overallMessage: string;
  upSince?: string;
  uptimePct: number;
  gatewayPing: number | null;
  databasePing: number | null;
  memory: number | null;
  days: StatusDay[];
  incidents: Incident[];
  range: RangeKey;
  heartbeatAts: string[];
  currentStatus: "up" | "down" | "degraded" | "unknown";
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function formatMs(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n < 10 ? `${n.toFixed(1)}ms` : `${Math.round(n)}ms`;
}

export function formatMemory(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) {
    const mb = n / (1024 * 1024);
    return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  }
  if (n >= 1) return `${n % 1 === 0 ? n : n.toFixed(1)} MB`;
  return String(n);
}

export function dayTitle(day: StatusDay): string {
  const d = new Date(day.date);
  const hasTime =
    day.date.includes("T") && d.getUTCHours() !== 0;

  const when = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(hasTime
      ? { hour: "numeric", minute: "2-digit", hour12: true }
      : {}),
  });

  if (day.status === "nodata" || day.uptimePct == null) {
    return `${when} — no data`;
  }

  const pct =
    day.uptimePct % 1 === 0
      ? `${day.uptimePct}%`
      : `${day.uptimePct.toFixed(1)}%`;

  return `${when} — ${day.status} · ${pct} uptime`;
}

export function statusColor(
  status: DayStatus | StatusPayload["overall"]
): string {
  switch (status) {
    case "up":
    case "operational":
      return "bg-emerald-500";
    case "degraded":
      return "bg-orange";
    case "down":
    case "outage":
      return "bg-rose-500";
    default:
      return "bg-white/10";
  }
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#140b08] px-5 py-4 transition-colors hover:border-orange/40">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-white tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function RangeTabs({ active }: { active: RangeKey }) {
  const keys: RangeKey[] = ["24h", "7d", "30d", "90d"];
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-bg-dark p-0.5">
      {keys.map((key) => (
        <Link
          key={key}
          href={`/status?range=${key}`}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            key === active
              ? "bg-orange/20 text-orange-light"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {RANGE_LABELS[key]}
        </Link>
      ))}
    </div>
  );
}