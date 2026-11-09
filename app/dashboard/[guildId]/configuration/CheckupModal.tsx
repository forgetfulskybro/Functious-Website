'use client';

import { useEffect, useState } from 'react';

type CheckStatus = 'ok' | 'warn' | 'fail' | 'skip';

interface CheckupResult {
  id: string;
  status: CheckStatus;
  detail?: string | null;
}

const CHECK_ORDER = [
  { id: 'access', label: 'Bot access' },
  { id: 'roles', label: 'Assignable roles' },
  { id: 'reactionRoles', label: 'Reaction roles' },
  { id: 'channels', label: 'Configured channels' },
  { id: 'forms', label: 'Forms' },
  { id: 'active', label: 'Active features' },
] as const;

const STATUS_META: Record<
  CheckStatus,
  { label: string; dot: string; text: string; chip: string; icon: string }
> = {
  ok: {
    label: 'Pass',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    chip: 'border-emerald-500/15 bg-emerald-500/[0.06]',
    icon: '✓',
  },
  warn: {
    label: 'Warning',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    chip: 'border-amber-500/15 bg-amber-500/[0.06]',
    icon: '!',
  },
  fail: {
    label: 'Failed',
    dot: 'bg-red-400',
    text: 'text-red-300',
    chip: 'border-red-500/15 bg-red-500/[0.06]',
    icon: '×',
  },
  skip: {
    label: 'Skipped',
    dot: 'bg-white/20',
    text: 'text-white/35',
    chip: 'border-white/10 bg-white/[0.03]',
    icon: '–',
  },
};

function isStatus(value: unknown): value is CheckStatus {
  return value === 'ok' || value === 'warn' || value === 'fail' || value === 'skip';
}

export function CheckupModal({
  guildId,
  guildName,
  onClose,
}: {
  guildId: string;
  guildName: string;
  onClose: () => void;
}) {
  const [runId, setRunId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<CheckupResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function runCheckup() {
      setLoading(true);
      setError(null);
      setResults([]);

      try {
        const res = await fetch(`/api/bot/guilds/${guildId}/checkup`, {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || 'Failed to run health checkup');
        }

        const nextResults = Array.isArray(json.results)
          ? json.results
              .filter(
                (result: unknown): result is CheckupResult =>
                  !!result &&
                  typeof result === 'object' &&
                  typeof (result as CheckupResult).id === 'string' &&
                  isStatus((result as CheckupResult).status),
              )
              .map((result: CheckupResult) => ({
                id: result.id,
                status: result.status,
                detail: typeof result.detail === 'string' ? result.detail : null,
              }))
          : [];

        setResults(nextResults);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : 'Failed to run health checkup',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    runCheckup();
    return () => controller.abort();
  }, [guildId, runId]);

  const counts = results.reduce(
    (totals, result) => {
      totals[result.status] += 1;
      return totals;
    },
    { ok: 0, warn: 0, fail: 0, skip: 0 } as Record<CheckStatus, number>,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkup-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#2A1313] px-6 pb-4 pt-5">
          <div>
            <h2 id="checkup-title" className="text-lg font-bold text-white">
              Health Checkup
            </h2>
            <p className="mt-0.5 text-xs text-white/30">
              The same community audit as f!checkup for {guildName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-white/40 transition-colors hover:text-white"
            aria-label="Close health checkup"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? (
            <div aria-live="polite">
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange/30 border-t-orange" />
                <div>
                  <p className="text-sm text-white/70">Checking community…</p>
                  <p className="mt-0.5 text-[10px] text-white/25">
                    Verifying permissions, roles, channels, forms and active features.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {CHECK_ORDER.map((check) => (
                  <div
                    key={check.id}
                    className="h-[58px] animate-pulse rounded-xl bg-white/[0.025]"
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            <div
              className="rounded-xl border border-red-500/15 bg-red-500/[0.06] p-4"
              role="alert"
            >
              <p className="text-sm font-medium text-red-300">
                Checkup could not finish
              </p>
              <p className="mt-1 text-xs leading-relaxed text-red-300/60">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setRunId((value) => value + 1)}
                className="mt-3 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/20"
              >
                Try again
              </button>
            </div>
          ) : (
            <div aria-live="polite">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {(['ok', 'warn', 'fail', 'skip'] as const).map((status) => {
                  const meta = STATUS_META[status];
                  return (
                    <span
                      key={status}
                      className={[
                        'flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px]',
                        meta.chip,
                        meta.text,
                      ].join(' ')}
                    >
                      <span className={['h-1.5 w-1.5 rounded-full', meta.dot].join(' ')} />
                      {counts[status]} {meta.label.toLowerCase()}
                    </span>
                  );
                })}
              </div>

              <div className="space-y-2">
                {CHECK_ORDER.map((check) => {
                  const result = results.find((entry) => entry.id === check.id);
                  const status = result?.status ?? 'skip';
                  const meta = STATUS_META[status];

                  return (
                    <div
                      key={check.id}
                      className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={[
                            'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                            meta.chip,
                            meta.text,
                          ].join(' ')}
                          aria-hidden="true"
                        >
                          {meta.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-white/80">
                              {check.label}
                            </p>
                            {status !== 'ok' && status !== 'skip' && (
                              <span
                                className={[
                                  'text-[10px] font-medium',
                                  meta.text,
                                ].join(' ')}
                              >
                                {meta.label}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-white/35">
                            {result?.detail || 'This check did not return any details.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-white/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/5 py-2.5 font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => setRunId((value) => value + 1)}
            disabled={loading}
            className="flex-1 rounded-xl bg-orange py-2.5 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Run again'}
          </button>
        </div>
      </div>
    </div>
  );
}
