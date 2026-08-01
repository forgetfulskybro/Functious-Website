'use client';

import { useEffect, useRef } from 'react';

export default function AuthCallbackClient({ code }: { code: string | null }) {
  const called = useRef(false);

  useEffect(() => {
    if (!code || called.current) return;
    called.current = true;

    fetch('/api/auth/exchange', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async res => {
        if (res.ok) {
          window.location.href = '/dashboard';
        } else {
          const data = await res.json().catch(() => ({}));
          window.location.href = `/auth-error?reason=${data.reason ?? 'unknown'}`;
        }
      })
      .catch(() => {
        window.location.href = '/auth-error?reason=unknown';
      });
  }, [code]);

  return (
    <main className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="w-10 h-10 animate-spin text-orange/60"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-white/50 text-sm">Signing you in…</p>
      </div>
    </main>
  );
}
