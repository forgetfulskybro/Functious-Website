'use client';

import { useState } from 'react';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import type {
  TranslationLanguageSummary,
  TranslationPermissions,
} from '@/lib/translationTypes';

interface Props {
  languages: TranslationLanguageSummary[];
  initialPermissions: TranslationPermissions;
}

export default function LanguageRequests({ languages, initialPermissions }: Props) {
  const [approved] = useState<string[]>(initialPermissions.languages);
  const [requested, setRequested] = useState<string[]>(
    initialPermissions.requestedLanguages,
  );
  const [saving, setSaving] = useState(false);

  function toggle(code: string) {
    if (approved.includes(code)) return;

    setRequested((current) =>
      current.includes(code)
        ? current.filter((entry) => entry !== code)
        : [...current, code],
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/translations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: requested }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Could not save your requests');
      }

      setRequested(data.permissions?.requestedLanguages ?? []);
      showToast('Language requests saved');
    } catch (error) {
      showErrorToast('Could not save requests', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-bg-card">
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Languages you want to translate
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-white/55">
              Pick every language you can help with. You can change this later.
            </p>
          </div>

          <span className="rounded-lg border border-orange/25 bg-orange/[0.07] px-2.5 py-1 text-xs font-medium text-orange-light">
            {requested.length} pending
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {languages.map((language) => {
            const isApproved = approved.includes(language.code);
            const isRequested = requested.includes(language.code);

            return (
              <button
                key={language.code}
                type="button"
                disabled={isApproved}
                onClick={() => toggle(language.code)}
                aria-pressed={isApproved || isRequested}
                className={[
                  'flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors',
                  isApproved
                    ? 'cursor-default border-emerald-500/25 bg-emerald-500/[0.06]'
                    : isRequested
                      ? 'border-orange/40 bg-orange/[0.08]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold',
                    isApproved
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : isRequested
                        ? 'border-orange/30 bg-orange/10 text-orange-light'
                        : 'border-white/10 bg-white/[0.03] text-white/50',
                  ].join(' ')}
                >
                  {language.native.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white/85">
                    {language.native}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-white/40">
                    {language.name} · {language.code}
                  </span>
                </span>

                {isApproved ? (
                  <span className="shrink-0 text-xs font-medium text-emerald-300">
                    Approved
                  </span>
                ) : (
                  <span
                    className={[
                      'shrink-0 text-xs font-medium',
                      isRequested ? 'text-orange-light' : 'text-white/35',
                    ].join(' ')}
                  >
                    {isRequested ? 'Requested' : 'Request'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-white/40">
          Approved languages can only be removed by a developer. Your language
          isn&apos;t listed? Ask a developer to add it.
        </p>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="shrink-0 rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save requests'}
        </button>
      </div>
    </section>
  );
}
