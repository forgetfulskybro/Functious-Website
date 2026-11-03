import { getSession, safeNextPath } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function isAuthPath(path: string): boolean {
  return (
    path === '/login' ||
    path.startsWith('/auth') ||
    path.startsWith('/api/auth')
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const requested = safeNextPath(next);
  const destination =
    requested && !isAuthPath(requested) ? requested : '/dashboard';

  const session = await getSession();
  if (session) redirect(destination);

  redirect(`/api/auth/login?next=${encodeURIComponent(destination)}`);
}
