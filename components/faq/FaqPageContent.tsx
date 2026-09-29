'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQ_GROUPS } from '@/data/faq';
import FaqItemView from '@/components/faq/FaqItem';

function GroupNav({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="flex gap-2 lg:flex-col lg:gap-1">
      {FAQ_GROUPS.map((group, index) => {
        const active = group.id === activeId;
        return (
          <li key={group.id} className="flex-shrink-0 lg:flex-shrink">
            <Link
              href={`#${group.id}`}
              onClick={() => onSelect(group.id)}
              aria-current={active ? 'true' : undefined}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange',
                active
                  ? 'bg-orange/15 font-medium text-orange-warm'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              <span
                className={[
                  'font-mono text-xs',
                  active ? 'text-orange' : 'text-white/35',
                ].join(' ')}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              {group.title}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export default function FaqPageContent() {
  const [activeGroup, setActiveGroup] = useState(FAQ_GROUPS[0].id);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const handleToggle = (key: string, groupId: string) => {
    if (openKey === key) {
      setOpenKey(null);
      return;
    }
    setOpenKey(key);
    setActiveGroup(groupId);
  };

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-12">
          <div className="lg:hidden">
            <div className="mb-6">
              <span className="block text-sm font-bold text-white">FAQ</span>
              <span className="block text-xs text-white/40">Grouped by command.</span>
            </div>
            <nav
              aria-label="FAQ commands"
              className="-mx-4 overflow-x-auto px-4 pb-1"
            >
              <GroupNav
                activeId={activeGroup}
                onSelect={setActiveGroup}
              />
            </nav>
          </div>

          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-24">
              <div className="mb-5">
                <span className="block text-sm font-bold text-white">FAQ</span>
                <span className="block text-xs text-white/40">Grouped by command.</span>
              </div>
              <nav aria-label="FAQ commands">
                <GroupNav
                  activeId={activeGroup}
                  onSelect={setActiveGroup}
                />
              </nav>
            </div>
          </aside>

          <main className="min-w-0 flex-1 lg:max-w-3xl">
            <header className="mb-12 max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-4 text-lg text-white/60">
                The questions that come up most, grouped by the command they belong
                to.
              </p>
            </header>

            <div className="space-y-12">
              {FAQ_GROUPS.map((group) => (
                <section
                  key={group.id}
                  id={group.id}
                  aria-labelledby={`${group.id}-heading`}
                  className="scroll-mt-24"
                >
                  <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2
                      id={`${group.id}-heading`}
                      className="text-xl font-semibold text-white"
                    >
                      {group.title}
                    </h2>
                    <code className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-orange-light">
                      {group.command}
                    </code>
                    <span className="text-sm font-normal text-white/30">
                      {group.items.length}{' '}
                      {group.items.length === 1 ? 'question' : 'questions'}
                    </span>
                  </div>

                  <p className="mb-4 text-sm text-white/40">{group.tagline}</p>

                  <div className="divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-[#140b08] px-5">
                    {group.items.map((item) => {
                      const key = `${group.id}:${item.question}`;
                      return (
                        <FaqItemView
                          key={key}
                          question={item.question}
                          answer={item.answer}
                          isOpen={openKey === key}
                          onToggle={() => handleToggle(key, group.id)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
