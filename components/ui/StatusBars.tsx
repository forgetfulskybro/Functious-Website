"use client";

import { useEffect, useState } from "react";
import type { StatusDay } from "../../app/status/StatusParts";
import { statusColor } from "../../app/status/StatusParts";

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
  days,
  range24h,
}: {
  days: StatusDay[];
  range24h: boolean;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="flex h-10 w-full gap-[2px]">
      {days.map((day, i) => (
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
            {ready ? exactTitle(day, range24h) : "…"}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1c100c]" />
          </div>
        </div>
      ))}
    </div>
  );
}