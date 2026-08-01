'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ErrorContent() {
  const searchParams = useSearchParams();
  const status  = searchParams.get('status');
  const message = searchParams.get('message');

  return (
    <div className="text-center p-8 rounded-2xl bg-bg-card shadow-xl max-w-md w-full">
      <h1 className="text-xl font-extrabold text-white">Something went wrong</h1>
      <p className="text-white/45 text-sm mt-2">
        An error occurred while loading dashboard content.
      </p>
      {status && (
        <p className="text-white/55 text-xs mt-3 font-mono">
          Status: {status}
        </p>
      )}
      {message && (
        <p className="text-white/55 text-xs mt-1 font-mono break-words">
          {decodeURIComponent(message)}
        </p>
      )}
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-orange hover:bg-orange-bright text-white font-semibold text-sm transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default function DashboardErrorPage() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-center p-8 rounded-2xl bg-bg-card shadow-xl max-w-md w-full">
          <p className="text-white/40 text-sm">Loading…</p>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
