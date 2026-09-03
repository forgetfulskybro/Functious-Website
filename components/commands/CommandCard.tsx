'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { CommandEntry } from '@/data/commands';
import { formatCooldown } from '@/lib/utils';

interface CommandCardProps {
  command: CommandEntry;
  isOpen: boolean;
  onToggleAction: () => void;
}

export default function CommandCard({
  command,
  isOpen,
  onToggleAction,
}: CommandCardProps) {
  const { name, description, usage, aliases, cooldown, permissions } = command;

  return (
    <div
      className={`
        overflow-hidden rounded-xl border transition-colors duration-200
        ${isOpen
          ? 'border-orange/30 bg-[#140b08]'
          : 'border-white/10 bg-[#140b08] hover:border-white/15'
        }
      `}
    >
      <button
        type="button"
        onClick={onToggleAction}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-inset"
      >
        <span
          className={`
            mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full transition-colors
            ${isOpen
              ? 'bg-orange shadow-[0_0_10px_rgba(249,115,22,0.45)]'
              : 'bg-white/20'
            }
          `}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-mono text-[15px] font-semibold tracking-tight text-white">
              <span className="text-orange-light/90">f!</span>
              {name}
            </span>
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white/40">
              {formatCooldown(cooldown)}
            </span>
          </div>
          <p className="mt-1 truncate text-[13px] text-white/45">
            {description}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-white/30"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3.5 5.25L7 8.75L10.5 5.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-white/10 px-5 pb-5 pt-4">
              <p className="text-[13.5px] leading-relaxed text-white/65">
                {description}
              </p>

              <div className="rounded-lg border border-white/5 bg-black/25 px-3.5 py-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  Usage
                </p>
                <code className="font-mono text-[13px] text-orange-light">
                  f!{usage}
                </code>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    Aliases
                  </p>
                  {aliases.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {aliases.map((alias) => (
                        <span
                          key={alias}
                          className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[12px] text-white/60"
                        >
                          {alias}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[13px] text-white/30">None</span>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    Permissions
                  </p>
                  <span className="text-[13px] text-white/60">
                    {permissions ?? 'None required'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}