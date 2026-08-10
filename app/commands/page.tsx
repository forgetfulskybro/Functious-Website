import type { Metadata } from 'next';
import { Suspense } from 'react';
import CommandsPageContent from './CommandsPageContent';

export const metadata: Metadata = {
  title: 'Functious Commands - Browse All Bot Commands',
  description:
    'Browse all Functious bot commands with search and category filtering. Find syntax, aliases, cooldowns, and permissions.',
};

export default function CommandsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-dark">
          <p className="text-white/50">Loading commands…</p>
        </div>
      }
    >
      <CommandsPageContent />
    </Suspense>
  );
}
