'use client';

import { useState, useEffect } from 'react';
import { COMMANDS } from '@/data/commands';
import { filterCommands } from '@/lib/utils';
import CommandCard from '@/components/commands/CommandCard';
import CommandSearch from '@/components/commands/CommandSearch';

export default function CommandsPageContent() {
  const [search, setSearch] = useState('');
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (!hash) return;

    const match = COMMANDS.find((c) => c.name.toLowerCase() === hash);
    if (!match) return;

    setOpenCards(new Set([match.name]));

    const id = setTimeout(() => {
      const el = document.getElementById(`cmd-${match.name}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    return () => clearTimeout(id);
  }, []);

  const filteredCommands = filterCommands(COMMANDS, search, 'all');

  const toggleCard = (name: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-bg-dark">
      <style>{`
        @keyframes statusFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .status-fade {
          animation: statusFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header
          className="status-fade mb-10 max-w-2xl"
          style={{ animationDelay: '0ms' }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Commands
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Browse all {COMMANDS.length} Functious commands. Click any command
            to expand details.
          </p>
        </header>

        <div
          className="status-fade mb-8"
          style={{ animationDelay: '60ms' }}
        >
          <CommandSearch
            value={search}
            onSearchAction={setSearch}
            placeholder="Search by name, description, or alias…"
          />
          {search && (
            <p className="mt-3 text-sm text-white/40">
              Showing{' '}
              <span className="tabular-nums text-white/70">
                {filteredCommands.length}
              </span>{' '}
              of {COMMANDS.length}
            </p>
          )}
        </div>

        <main
          className="status-fade"
          style={{ animationDelay: '120ms' }}
          aria-live="polite"
          aria-label="Commands list"
        >
          {filteredCommands.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#140b08] px-6 py-16 text-center">
              <h2 className="text-lg font-semibold text-white">
                No commands found
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Nothing matches “{search}”. Try a different term.
              </p>
              <button
                onClick={() => setSearch('')}
                className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCommands.map((cmd) => (
                <div key={cmd.name} id={`cmd-${cmd.name}`} className="scroll-mt-24">
                  <CommandCard
                    command={cmd}
                    isOpen={openCards.has(cmd.name)}
                    onToggleAction={() => toggleCard(cmd.name)}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </main>
  );
}