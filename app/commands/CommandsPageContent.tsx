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

    const match = COMMANDS.find(c => c.name.toLowerCase() === hash);
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
    setOpenCards(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-bg-dark px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Commands</h1>
          <p className="mt-3 text-white/60">
            Browse all {COMMANDS.length} Functious commands. Click any command to see more detail.
          </p>
        </header>

        <div className="mb-6">
          <CommandSearch
            value={search}
            onSearchAction={setSearch}
            placeholder="Search by name, description, or alias…"
          />
        </div>

        <main aria-live="polite" aria-label="Commands list">
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-bg-card p-16 text-center">
              <h2 className="text-xl font-semibold text-white">No commands found</h2>
              <p className="mt-2 text-sm text-white/50">Try a different search term.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredCommands.map((cmd) => (
                <div key={cmd.name} id={`cmd-${cmd.name}`}>
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
    </div>
  );
}
