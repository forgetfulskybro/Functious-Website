'use client';

import Sidebar from '@/components/layout/Sidebar';
import type { FluxerUser, DashboardGuild } from '@/lib/types';
import { useMemo, useState } from 'react';

export type AuditLogEvent = {
  id: string;
  type: string;
  userId: string | null;
  groupId: string | null;
  timestamp: string;
  data: Record<string, unknown>;
  source?: string | null;
};

interface AuditLogsPageProps {
  user: FluxerUser;
  guilds?: DashboardGuild[];
  activeGuildId: string;
  events: AuditLogEvent[];
}

const PAGE_SIZE = 6;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  const d = Math.floor(diff / 86_400_000);
  if (d < 30) return `${d}d ago`;
  return formatWhen(iso);
}

function actionTone(action?: unknown): string {
  const a = String(action ?? '').toLowerCase();
  if (a === 'create') return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25';
  if (a === 'delete') return 'bg-rose-500/15 text-rose-300 ring-rose-500/25';
  if (a === 'update') return 'bg-orange/15 text-orange-light ring-orange/25';
  return 'bg-white/5 text-white/45 ring-white/10';
}

function previewLine(data: Record<string, unknown>): string {
  const label = typeof data.label === 'string' ? data.label : null;
  const key = typeof data.key === 'string' ? data.key : null;
  const parts = [label || key].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return 'Setting updated';
}

function eventMatchesQuery(ev: AuditLogEvent, q: string): boolean {
  if (!q) return true;
  const hay = [
    ev.userId,
    ev.timestamp,
    formatWhen(ev.timestamp),
    previewLine(ev.data ?? {}),
    JSON.stringify(ev.data ?? {}),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function highlightJson(json: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re =
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],])/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = re.exec(json)) !== null) {
    if (match.index > last) {
      nodes.push(
        <span key={`w-${i++}`} className="text-white/40">
          {json.slice(last, match.index)}
        </span>
      );
    }

    const token = match[0];
    let className = 'text-white/70';

    if (token.startsWith('"')) {
      className = token.endsWith(':') ? 'text-sky-300' : 'text-emerald-300';
    } else if (token === 'true' || token === 'false') {
      className = 'text-violet-300';
    } else if (token === 'null') {
      className = 'text-white/35 italic';
    } else if (/^-?\d/.test(token)) {
      className = 'text-amber-300';
    } else if (/^[{}\[\]]$/.test(token)) {
      className = 'text-white/50';
    } else if (token === ',') {
      className = 'text-white/30';
    }

    nodes.push(
      <span key={`t-${i++}`} className={className}>
        {token}
      </span>
    );
    last = match.index + token.length;
  }

  if (last < json.length) {
    nodes.push(
      <span key={`w-${i++}`} className="text-white/40">
        {json.slice(last)}
      </span>
    );
  }

  return nodes;
}

function orderEventData(data: Record<string, unknown>): Record<string, unknown> {
  const rest: Record<string, unknown> = { ...data };
  const previous = rest.previous;
  const value = rest.value;
  const hasPrevious = 'previous' in rest;
  const hasValue = 'value' in rest;
  delete rest.previous;
  delete rest.value;

  return {
    ...rest,
    ...(hasPrevious ? { previous } : {}),
    ...(hasValue ? { value } : {}),
  };
}

function JsonViewer({
  value,
  maxHeight = '16rem',
}: {
  value: unknown;
  maxHeight?: string;
}) {
  if (value === null || value === undefined) {
    return <span className="text-white/30 italic text-sm">null</span>;
  }

  let prepared: unknown = value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    prepared = orderEventData(value as Record<string, unknown>);
  }

  if (
    typeof prepared === 'string' ||
    typeof prepared === 'number' ||
    typeof prepared === 'boolean'
  ) {
    const pretty =
      typeof prepared === 'string' ? JSON.stringify(prepared) : String(prepared);
    return (
      <pre className="text-[12px] leading-relaxed font-mono bg-black/35 rounded-lg p-3 border border-white/5 overflow-x-auto">
        {highlightJson(pretty)}
      </pre>
    );
  }

  let text: string;
  try {
    text = JSON.stringify(prepared, null, 2);
  } catch {
    text = String(prepared);
  }

  return (
    <pre
      className="text-[12px] leading-relaxed font-mono bg-black/35 rounded-lg p-3 border border-white/5 overflow-auto"
      style={{ maxHeight }}
    >
      {highlightJson(text)}
    </pre>
  );
}

function DetailModal({
  event,
  onCloseAction,
}: {
  event: AuditLogEvent;
  onCloseAction: () => void;
}) {
  const data = event.data ?? {};
  const label =
    typeof data.label === 'string' ? data.label : previewLine(data);
  const action = typeof data.action === 'string' ? data.action : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onCloseAction}
      />
      <div className="relative w-full sm:max-w-2xl md:max-w-3xl max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#160a0a] border border-white/5 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-white/5 bg-[#160a0a]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-white font-semibold text-sm truncate">{label}</p>
              {action && (
                <span
                  className={`inline-flex text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ring-1 ${actionTone(
                    action
                  )}`}
                >
                  {action}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            className="text-white/30 hover:text-white/70 p-1 rounded-lg hover:bg-white/5 transition-colors focus-visible:outline-none shrink-0"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-white/35 mb-1.5">
                Executor
              </p>
              <p className="text-white font-mono text-sm break-all">
                {event.userId ?? (
                  <span className="text-white/30 italic">Unknown</span>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-white/35 mb-1.5">
                When
              </p>
              <p className="text-white text-sm font-medium">
                {formatWhen(event.timestamp)}
              </p>
              <p className="text-white/35 text-xs mt-0.5 tabular-nums">
                {formatRelative(event.timestamp)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-white/35 mb-2">
              Event data
            </p>
            <JsonViewer value={data} maxHeight="22rem" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogsClient({
  user,
  guilds,
  activeGuildId,
  events,
}: AuditLogsPageProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<AuditLogEvent | null>(null);
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [events]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((ev) => eventMatchesQuery(ev, q));
  }, [sorted, query]);

  const visible = expanded ? filtered : filtered.slice(0, PAGE_SIZE);
  const hiddenCount = Math.max(0, filtered.length - PAGE_SIZE);

  return (
    <>
      <div className="min-h-screen bg-bg-dark flex">
        <Sidebar
          user={user}
          guilds={guilds}
          activeGuildId={activeGuildId}
          currentPage="dashboard"
        />

        <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10 max-w-3xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Audit Logs
            </h1>
            <p className="text-white/35 text-sm mt-1.5">
              Configuration changes for this server. Click a row for full
              details.
            </p>
          </div>

          <section className="rounded-2xl bg-bg-card border border-white/[0.04] p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                  Recent changes
                </h2>
                <p className="text-white/25 text-[11px] mt-0.5">
                  Setting updates for this guild
                </p>
              </div>
              {filtered.length > 0 && (
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs tabular-nums text-white/40 self-start sm:self-auto">
                  {filtered.length}
                  {query.trim() ? ` / ${sorted.length}` : ''}
                </span>
              )}
            </div>

            <div className="relative mb-4">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setExpanded(false);
                }}
                placeholder="Search by label, key, user, action…"
                className="w-full rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/10 focus:border-orange/40 focus:ring-1 focus:ring-orange/30 outline-none text-sm text-white placeholder:text-white/25 pl-9 pr-3 py-2.5 transition-colors"
              />
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-white/20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="8" y1="16" x2="14" y2="16" />
                  </svg>
                </div>
                <p className="text-white/40 text-sm font-medium">
                  No audit events yet
                </p>
                <p className="text-white/25 text-xs mt-1">
                  Setting changes from the dashboard will show up here
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-white/40 text-sm font-medium">
                  No matches for “{query.trim()}”
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-3 text-xs text-orange-warm/80 hover:text-orange-warm transition-colors"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    expanded
                      ? 'max-h-[36rem] min-h-[22rem] overflow-y-auto pr-1 space-y-2'
                      : 'space-y-2'
                  }
                >
                  <ul className="space-y-2">
                    {visible.map((ev) => {
                      const data = ev.data ?? {};
                      const action =
                        typeof data.action === 'string'
                          ? data.action
                          : undefined;
                      const category =
                        typeof data.category === 'string'
                          ? data.category
                          : undefined;
                      const key =
                        typeof data.key === 'string' ? data.key : undefined;

                      return (
                        <li key={ev.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(ev)}
                            className="w-full text-left rounded-xl px-4 py-3 border border-white/[0.04] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
                                <svg
                                  className="w-3.5 h-3.5 text-orange/70"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  aria-hidden="true"
                                >
                                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                  <rect
                                    x="9"
                                    y="3"
                                    width="6"
                                    height="4"
                                    rx="1"
                                  />
                                  <line x1="8" y1="12" x2="16" y2="12" />
                                  <line x1="8" y1="16" x2="14" y2="16" />
                                </svg>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                  {action && (
                                    <span
                                      className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md ring-1 ${actionTone(
                                        action
                                      )}`}
                                    >
                                      {action}
                                    </span>
                                  )}
                                  {category && (
                                    <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-white/5 text-white/35">
                                      {category}
                                    </span>
                                  )}
                                  {key && (
                                    <span className="text-[10px] font-mono text-white/30 truncate">
                                      {key}
                                    </span>
                                  )}
                                </div>
                                <p className="text-white/85 text-sm font-medium truncate">
                                  {previewLine(data)}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-white/30">
                                  <span className="tabular-nums">
                                    {formatRelative(ev.timestamp)}
                                  </span>
                                  {ev.userId && (
                                    <>
                                      <span className="text-white/15">·</span>
                                      <span
                                        className="font-mono truncate max-w-[10rem]"
                                        title={ev.userId}
                                      >
                                        {ev.userId}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <svg
                                className="w-4 h-4 text-white/20 shrink-0 mt-1"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <path
                                  d="M9 18l6-6-6-6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-4 w-full py-2.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white/80"
                  >
                    {expanded ? 'Show less' : `View ${hiddenCount} more`}
                  </button>
                )}
              </>
            )}
          </section>
        </main>
      </div>

      {selected && (
        <DetailModal
          event={selected}
          onCloseAction={() => setSelected(null)}
        />
      )}
    </>
  );
}