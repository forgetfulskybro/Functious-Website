'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Error() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  useEffect(() => {
    console.error('Dashboard Error:', { status, message });
  }, [status, message]);

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="text-center p-8 rounded-lg bg-bg-card shadow-lg">
        <h1 className="text-2xl font-extrabold text-white">Dashboard Error</h1>
        <p className="text-white/50 text-sm mt-2">
          Something went wrong while loading content.
        </p>
        {status && <p className="text-white/70 text-sm mt-1">Status Code: {status}</p>}
        {message && <p className="text-white/70 text-sm mt-1">Details: {decodeURIComponent(message)}</p>}
        <p className="text-white/50 text-sm mt-2">
          Please try refreshing the page or navigating back to the dashboard home.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-orange text-white font-semibold text-sm hover:bg-orange-bright transition-colors"
        >
          Go to Dashboard Home
        </button>
      </div>
    </div>
  );
}
