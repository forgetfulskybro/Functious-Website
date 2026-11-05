import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DeveloperPanel from '@/components/translate/DeveloperPanel';
import {
  getTranslationLanguages,
  getTranslationPermissions,
  getTranslators,
} from '@/lib/translations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Translation developers',
  description: 'Manage Functious translators, moderation, and language files.',
};

export default async function TranslationDevelopersPage() {
  const session = await getSession().catch(() => null);
  if (!session) {
    redirect(
      `/api/auth/login?next=${encodeURIComponent('/translate/developers')}`,
    );
  }

  const userId = String(session.user.id);

  const permissions = await getTranslationPermissions(userId).catch(() => null);
  if (!permissions?.developer && !permissions?.moderator) {
    redirect('/translate');
  }

  let translators;
  let languages;

  try {
    [translators, languages] = await Promise.all([
      getTranslators(userId),
      getTranslationLanguages(),
    ]);
  } catch (error) {
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
              The developer console could not be loaded.
            </p>
            <p className="mt-2 text-sm text-rose-100/55">
              {error instanceof Error ? error.message : 'Try again in a moment.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const currentTranslator = translators.find(
    (translator) => translator.userId === userId,
  );

  return (
    <main className="min-h-screen bg-bg-dark pb-20 pt-24">
      <DeveloperPanel
        initialTranslators={translators}
        languages={languages.filter((language) => !language.isBase)}
        currentUserId={userId}
        canManageAccess={Boolean(permissions.developer)}
        isOwner={Boolean(currentTranslator?.owner)}
      />
    </main>
  );
}
