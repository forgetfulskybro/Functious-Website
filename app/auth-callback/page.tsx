import type { Metadata } from 'next';
import AuthCallbackClient from './AuthCallbackClient';

export const metadata: Metadata = { title: 'Signing in…' };

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const { code, next } = await searchParams;
  return <AuthCallbackClient code={code ?? null} next={next ?? null} />;
}
