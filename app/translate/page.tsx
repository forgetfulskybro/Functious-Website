import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import {
  getTranslationLanguages,
  getTranslationPermissions,
} from '@/lib/translations';
import type {
  TranslationLanguageSummary,
  TranslationPermissions,
} from '@/lib/translationTypes';
import { CoverageBar } from '@/components/translate/TranslateChrome';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Translate Functious',
  description:
    'Help translate Functious into your language. Track progress, review strings, and ship translations with the community.',
};

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-3">
      <p className="text-xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-xs text-white/45">{label}</p>
    </div>
  );
}

function LanguageRow({
  language,
}: {
  language: TranslationLanguageSummary;
}) {
  const percent = Math.max(0, Math.min(100, language.stats.percent));

  return (
    <Link
      href={`/translate/${language.code}`}
      className="group grid grid-cols-1 gap-3 border-t border-white/[0.06] px-4 py-4 transition-colors first:border-t-0 hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_160px_120px_16px] sm:items-center sm:gap-5"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {language.native}
          </p>
          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40">
            {language.code}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-white/40">{language.name}</p>
      </div>

      <div className="hidden sm:block">
        <CoverageBar percent={percent} />
        <p className="mt-1.5 text-xs text-white/40">
          {formatCount(language.stats.translated)} /{' '}
          {formatCount(language.stats.total)} translated
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold tabular-nums text-white">
          {formatPercent(language.stats.percent)}
        </p>
        <p className="text-xs text-white/40">
          {formatCount(language.stats.approved)} approved
        </p>
      </div>

      <svg
        className="hidden h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-light sm:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="sm:hidden">
        <CoverageBar percent={percent} />
        <div className="mt-1.5 flex items-center justify-between text-xs text-white/40">
          <span>
            {formatCount(language.stats.translated)} /{' '}
            {formatCount(language.stats.total)} translated
          </span>
          <span>{formatPercent(language.stats.percent)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function TranslatePage() {
  const session = await getSession().catch(() => null);

  let languages: TranslationLanguageSummary[] = [];
  let permissions: TranslationPermissions | null = null;
  let loadError: string | null = null;

  try {
    languages = await getTranslationLanguages();
    if (session) {
      permissions = await getTranslationPermissions(String(session.user.id)).catch(
        () => null,
      );
    }
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : 'The translation service could not be reached.';
  }

  const targets = languages.filter((language) => !language.isBase);
  const sourceTotal =
    languages.find((language) => language.isBase)?.stats.total ??
    targets[0]?.stats.total ??
    0;
  const trackedTotal = targets.reduce((sum, language) => sum + language.stats.total, 0);
  const translatedTotal = targets.reduce(
    (sum, language) => sum + language.stats.translated,
    0,
  );
  const approvedTotal = targets.reduce(
    (sum, language) => sum + language.stats.approved,
    0,
  );
  const aggregatePercent = trackedTotal
    ? (translatedTotal / trackedTotal) * 100
    : 0;
  const loginHref = `/api/auth/login?next=${encodeURIComponent('/translate')}`;

  return (
    <main className="min-h-screen bg-bg-dark pb-20 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <header className="rounded-2xl border border-white/10 bg-bg-card p-6 sm:p-8">
          <p className="text-sm font-medium text-orange-light/80">
            Community localization
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Translate Functious
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/55">
            A community workspace for every string in the bot. Pick a language,
            match the English source, and get it reviewed.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {session ? (
              <Link
                href="/translate/languages"
                className="rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-bright"
              >
                Your languages
              </Link>
            ) : (
              <a
                href={loginHref}
                className="rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-bright"
              >
                Log in to translate
              </a>
            )}

            {(permissions?.developer || permissions?.moderator) && (
              <Link
                href="/translate/developers"
                className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/75 transition-colors hover:border-orange/40 hover:text-white"
              >
                {permissions?.developer ? 'Developer console' : 'Moderation console'}
              </Link>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Languages" value={formatCount(targets.length)} />
            <SummaryStat
              label="Community coverage"
              value={formatPercent(aggregatePercent)}
            />
            <SummaryStat
              label="Translated strings"
              value={formatCount(translatedTotal)}
            />
            <SummaryStat
              label="Approved strings"
              value={formatCount(approvedTotal)}
            />
          </div>
        </header>

        {loadError ? (
          <div className="mt-6 rounded-xl border border-rose-500/25 bg-rose-950/15 px-5 py-5">
            <p className="text-sm font-medium text-rose-200">
              The translation service could not be reached.
            </p>
            <p className="mt-1 text-sm text-rose-200/70">{loadError}</p>
          </div>
        ) : targets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-bg-card px-6 py-16 text-center">
            <p className="text-sm font-medium text-white/70">
              No translation languages yet.
            </p>
            <p className="mt-1 text-sm text-white/40">
              Languages added on the bot will show up here.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-white">Languages</h2>
              <p className="mt-1 text-sm text-white/45">
                {formatCount(sourceTotal)} English source strings · 70% to ship
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-bg-card">
              <div className="hidden grid-cols-[minmax(0,1fr)_160px_120px_16px] gap-5 border-b border-white/10 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white/40 sm:grid">
                <span>Language</span>
                <span>Coverage</span>
                <span className="text-right">Done</span>
                <span />
              </div>

              {targets.map((language) => (
                <LanguageRow key={language.code} language={language} />
              ))}
            </div>

            <p className="mt-4 text-xs text-white/35">
              English (en_EN) is the source. Progress compares against the live
              English strings.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
