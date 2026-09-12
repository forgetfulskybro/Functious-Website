import { NextResponse } from "next/server";
import { vanta } from "@/lib/vanta";
import { timeRange } from "@vanta-dev/node";

export const dynamic = "force-dynamic";

const METRIC_NAMES: Record<string, string> = {
  gateway: "ping.gateway",
  database: "ping.db",
  memory: "ping.memory",
};

const RANGE_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

const RANGE_INTERVAL: Record<string, string> = {
  "24h": "1h",
  "7d": "1h",
  "30d": "1d",
  "90d": "1d",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ metric: string }> }
) {
  const { metric } = await params;
  const url = new URL(req.url);
  const range = url.searchParams.get("range") ?? "7d";

  const metricName = METRIC_NAMES[metric];
  if (!metricName) {
    return NextResponse.json({ error: "Unknown metric" }, { status: 404 });
  }

  const rangeMs = RANGE_MS[range] ?? RANGE_MS["7d"];
  const interval = RANGE_INTERVAL[range] ?? "1h";

  const now = new Date();
  const start = new Date(now.getTime() - rangeMs);

  try {
    const metrics = vanta.metrics as any;
    if (!metrics?.timeseries) {
      return NextResponse.json({ buckets: [] });
    }

    const result = await metrics.timeseries({
      name: metricName,
      interval,
      time: timeRange(start.toISOString(), now.toISOString()),
      aggregation: "avg",
    });

    const raw = result?.data ?? result;
    const buckets: { timestamp: string; value: number }[] = [];

    const rawBuckets = Array.isArray(raw?.buckets)
      ? raw.buckets
      : Array.isArray(raw)
        ? raw
        : [];

    for (const b of rawBuckets) {
      const ts = b.timestamp ?? b.time ?? b.at;
      const val =
        b.value ??
        b.avg ??
        b.aggregation ??
        b.count ??
        null;
      if (ts != null && val != null && Number.isFinite(Number(val))) {
        buckets.push({ timestamp: ts, value: Number(val) });
      }
    }

    return NextResponse.json({ buckets, range, metric });
  } catch (err) {
    console.error(`metrics timeseries failed for ${metricName}:`, err);
    return NextResponse.json({ buckets: [], error: "Failed to load" });
  }
}
