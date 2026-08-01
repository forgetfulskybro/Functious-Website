import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In Error' };

const MESSAGES: Record<string, string> = {
  denied:  "You cancelled the authorisation. You can try again any time.",
  token:   "Something went wrong exchanging the auth code. Make sure FLUXER_CLIENT_SECRET is set correctly in your environment.",
  user:    "Couldn't fetch your Fluxer profile. The access token may have been invalid.",
  unknown: "An unexpected error occurred during sign in.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = MESSAGES[reason ?? ''] ?? MESSAGES.unknown;

  return (
    <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="max-w-sm w-full rounded-2xl border border-red-warm/30 bg-bg-card p-8 flex flex-col items-center gap-5 text-center">
        <div className="w-12 h-12 rounded-full bg-red-dark/40 flex items-center justify-center text-2xl" aria-hidden="true">
          ✕
        </div>
        <div>
          <h1 className="text-white font-bold text-lg mb-2">Sign in failed</h1>
          <p className="text-white/60 text-sm leading-relaxed">{message}</p>
        </div>
        <a
          href="/api/auth/login"
          className="px-6 py-2.5 rounded-xl bg-orange hover:bg-orange-bright text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          Try again
        </a>
        <Link href="/" className="text-white/30 hover:text-white/60 text-xs transition-colors">
          ← Back to homepage
        </Link>
      </div>
    </main>
  );
}
