'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { CommandEntry } from '@/data/commands';
import { formatCooldown } from '@/lib/utils';

interface CommandCardProps {
  command: CommandEntry;
  isOpen: boolean;
  onToggleAction: () => void;
}

export default function CommandCard({ command, isOpen, onToggleAction }: CommandCardProps) {
  const { name, description, usage, aliases, cooldown, permissions } = command;

  return (
    <div
      className={[
        'rounded-xl border-l-4 border-l-orange/60 bg-[#141414] transition-colors duration-200',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggleAction}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded-xl"
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold text-white">
            <span className="text-orange-light">f!</span>{name}
          </span>
          <p className="mt-0.5 truncate text-xs text-white/55">{description}</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            className="rounded-full bg-orange/20 px-2.5 py-0.5 text-xs font-semibold text-orange"
            aria-label={`Cooldown: ${formatCooldown(cooldown)}`}
          >
            {formatCooldown(cooldown)}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/40 text-xs select-none"
            aria-hidden="true"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-gray-600 px-5 pb-5 pt-4">
              <p className="text-sm leading-relaxed text-white/80">{description}</p>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Usage</span>
                <code className="block rounded bg-black/30 px-3 py-2 text-xs leading-relaxed text-orange-light break-all">
                  f!{usage}
                </code>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Aliases</span>
                {aliases.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {aliases.map((alias) => (
                      <span key={alias} className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-xs text-white/80">
                        {alias}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-white/40">None</span>
                )}
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Permissions</span>
                <span className="text-xs text-white/80">{permissions ?? 'None required'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
