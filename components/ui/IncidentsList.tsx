"use client";

import { useEffect, useState } from "react";
import { EditIncidentModal } from "@/components/ui/EditIncidentModal";
import { ADMIN_ID } from "@/lib/constants";

export type IncidentItem = {
  id: string;
  title: string;
  severity: "info" | "degraded" | "major" | "resolved";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  body: string;
  startedAt: string;
  resolvedAt?: string;
};

const INITIAL = 5;

function severityBadge(severity: IncidentItem["severity"]) {
  const map = {
    info: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    degraded: "bg-orange/15 text-orange-light ring-orange/30",
    major: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    resolved: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  };
  return map[severity];
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function ClientDate({ iso }: { iso: string }) {
  const [text, setText] = useState(() => formatWhen(iso));

  useEffect(() => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setText("—");
      return;
    }
    setText(
      d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }, [iso]);

  return (
    <span className="text-xs text-white/35 tabular-nums" suppressHydrationWarning>
      {text}
    </span>
  );
}

export function IncidentsList({
  incidents: initial,
}: {
  incidents: IncidentItem[];
}) {
  const [incidents, setIncidents] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<IncidentItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIncidents(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const id = data?.user?.id != null ? String(data.user.id) : null;
        setIsAdmin(!!id && id === ADMIN_ID);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (incidents.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/40">
        No incidents in this period. All clear.
      </p>
    );
  }

  const visible = expanded ? incidents : incidents.slice(0, INITIAL);
  const hiddenCount = incidents.length - INITIAL;
  const hasMore = incidents.length > INITIAL;

  const ordered = [...visible].sort((a, b) => {
    const aActive = a.status !== "resolved" ? 0 : 1;
    const bActive = b.status !== "resolved" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return (
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  });

  return (
    <div>
      <style>{`
        @keyframes incidentIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .incident-item {
          animation: incidentIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <div
        className={
          expanded
            ? "max-h-[28rem] overflow-y-auto overscroll-contain pr-1"
            : undefined
        }
      >
        <ul className="space-y-2.5">
          {ordered.map((inc, i) => {
            const isResolved = inc.status === "resolved";
            return (
              <li
                key={inc.id}
                className="incident-item rounded-lg border border-white/10 bg-[#140b08] px-3.5 py-3 transition-colors hover:border-white/15"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${severityBadge(
                      inc.severity
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isResolved
                          ? "bg-emerald-400"
                          : "bg-rose-400 animate-pulse"
                      }`}
                    />
                    {isResolved ? "Resolved" : "Active"}
                  </span>

                  <span className="text-sm font-medium text-white">
                    {inc.title}
                  </span>

                  <span className="ml-auto flex items-center gap-2">
                    <ClientDate iso={inc.startedAt} />

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setEditing(inc)}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/50 transition-colors hover:border-orange/40 hover:text-orange-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                      >
                        Edit
                      </button>
                    )}
                  </span>
                </div>

                <p className="mt-1.5 text-sm leading-relaxed text-white/50 line-clamp-2">
                  {inc.body}
                </p>

                {inc.resolvedAt && (
                  <p className="mt-1.5 text-xs text-white/30">
                    Resolved <ClientDate iso={inc.resolvedAt} />
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {hasMore && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full rounded-lg border border-white/10 bg-[#140b08] px-3 py-2 text-sm text-white/60 transition-colors hover:border-orange/40 hover:text-orange-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            {expanded
              ? "Show less"
              : `Show ${hiddenCount} more incident${hiddenCount === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {editing && (
        <EditIncidentModal
          incident={{
            id: editing.id,
            title: editing.title,
            body: editing.body,
          }}
          onCloseAction={() => setEditing(null)}
          onSavedAction={({ title, body }) => {
            setIncidents((prev) =>
              prev.map((i) =>
                i.id === editing.id ? { ...i, title, body } : i
              )
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}