import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  getTranslationLanguage,
  getTranslationPermissions,
  TranslationApiError,
} from '@/lib/translations';
import TranslationEditor from '@/components/translate/TranslationEditor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Translation editor',
};

type Params = { params: Promise<{ language: string }> };

export default async function TranslationLanguagePage({ params }: Params) {
  const { language } = await params;
  const session = await getSession().catch(() => null);

  let data;
  try {
    data = await getTranslationLanguage(language);
  } catch (error) {
    if (error instanceof TranslationApiError && error.status === 404) {
      notFound();
    }

    return (
      <main className="min-h-screen bg-bg-dark pb-20 pt-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href="/translate"
            className="text-sm text-white/45 transition-colors hover:text-orange-light"
          >
            ← Translate
          </Link>
          <div className="mt-6 rounded-xl border border-rose-500/25 bg-rose-950/20 px-6 py-12 text-center">
            <p className="text-base font-medium text-rose-100/80">
              The translation service could not be reached.
            </p>
            <p className="mt-2 text-sm text-rose-100/55">
              {error instanceof Error ? error.message : 'Try again in a moment.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const permissions = session
    ? await getTranslationPermissions(String(session.user.id)).catch(() => null)
    : null;

  const canEdit = Boolean(
    !data.language.isBase &&
      permissions &&
      (permissions.developer || permissions.languages.includes(data.language.code)),
  );
  const canReview = Boolean(
    !data.language.isBase &&
      permissions &&
      (permissions.developer || permissions.proofreader),
  );
  const loginHref = `/api/auth/login?next=${encodeURIComponent(
    `/translate/${data.language.code}`,
  )}`;

  return (
    <TranslationEditor
      language={data.language}
      initialStrings={data.strings}
      initialStats={data.stats}
      permissions={permissions}
      userId={session ? String(session.user.id) : null}
      canEdit={canEdit}
      canReview={canReview}
      loginHref={loginHref}
    />
  );
}
