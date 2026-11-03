import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LanguageRequests from '@/components/translate/LanguageRequests';
import {
  getTranslationLanguages,
  getTranslationPermissions,
} from '@/lib/translations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your languages',
  description: 'Choose which languages you want to help translate.',
};

const ACCESS_STEPS = ['Request access', 'Developer review', 'Translate'];

export default async function TranslationLanguagesPage() {
  const session = await getSession().catch(() => null);
  if (!session) {
    redirect(
      `/api/auth/login?next=${encodeURIComponent('/translate/languages')}`,
    );
  }

  let languages;
  let permissions;

  try {
    [languages, permissions] = await Promise.all([
      getTranslationLanguages(),
      getTranslationPermissions(String(session.user.id)),
    ]);
  } catch (error) {
    return (
      <main className="min-h-screen bg-bg-dark pb-20 pt-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <Link
            href="/translate"
            className="text-sm text-white/45 transition-colors hover:text-orange-light"
          >
            ← Translate
          </Link>
          <div className="mt-6 rounded-xl border border-rose-500/25 bg-rose-950/15 px-6 py-12 text-center">
            <p className="text-sm font-medium text-rose-200">
              We couldn&apos;t load your languages.
            </p>
            <p className="mt-2 text-sm text-rose-200/70">
              {error instanceof Error ? error.message : 'Try again in a moment.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-dark pb-20 pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-white/40">
          <Link
            href="/translate"
            className="transition-colors hover:text-orange-light"
          >
            Translate
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white/60">Your languages</span>
        </nav>

        <header className="mt-5">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Your languages
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
            You can browse every language. Pick the ones you want to translate,
            and a developer will approve them before you can save.
          </p>
        </header>

        <ol className="mt-6 grid gap-2 sm:grid-cols-3">
          {ACCESS_STEPS.map((label, index) => (
            <li
              key={label}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-3"
            >
              <span className="text-xs font-semibold text-orange-light/80">
                Step {index + 1}
              </span>
              <p className="mt-1 text-sm text-white/70">{label}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6">
          <LanguageRequests
            languages={languages.filter((language) => !language.isBase)}
            initialPermissions={permissions}
          />
        </div>
      </div>
    </main>
  );
}
