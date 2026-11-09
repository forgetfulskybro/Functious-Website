'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ItemActionIcon =
  | 'view'
  | 'edit'
  | 'delete'
  | 'cancel'
  | 'bell'
  | 'send'
  | 'lock'
  | 'unlock';

export type ItemAction = {
  label: string;
  onSelect: () => void;
  icon?: ItemActionIcon;
  disabled?: boolean;
  danger?: boolean;
};

const glyphs: Record<ItemActionIcon, React.ReactNode> = {
  view: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  delete: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path
        d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  cancel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.64 5.64l12.72 12.72" strokeLinecap="round" />
    </>
  ),
  bell: (
    <>
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
    </>
  ),
  send: (
    <>
      <path
        d="M22 2 11 13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m22 2-7 20-4-9-9-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  unlock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path
        d="M7 11V7a5 5 0 0 1 9.9-1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

function ActionGlyph({ icon }: { icon: ItemActionIcon }) {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {glyphs[icon]}
    </svg>
  );
}

export default function ItemActions({
  actions,
  label = 'Actions',
  className = '',
}: {
  actions: ItemAction[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className={`flex items-center justify-end ${className}`}>
      <div className="hidden items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 lg:flex">
        {actions.map((action, index) => (
          <button
            key={`${action.label}-${index}`}
            type="button"
            title={action.label}
            aria-label={action.label}
            disabled={action.disabled}
            onClick={action.onSelect}
            className={[
              'rounded-md p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              action.danger
                ? 'text-white/30 hover:bg-red-500/10 hover:text-red-400'
                : 'text-white/30 hover:bg-white/5 hover:text-white/70',
            ].join(' ')}
          >
            <ActionGlyph icon={action.icon ?? 'edit'} />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-haspopup="dialog"
        className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/45 transition-colors hover:bg-white/[0.07] hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange lg:hidden"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 h-full w-full bg-black/65 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Close actions"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#160a0a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />

              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <h2 className="text-sm font-semibold text-white">{label}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/5 hover:text-white/70"
                  aria-label="Close"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                {actions.map((action, index) => (
                  <button
                    key={`${action.label}-${index}`}
                    type="button"
                    disabled={action.disabled}
                    onClick={() => {
                      setOpen(false);
                      action.onSelect();
                    }}
                    className={[
                      'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      action.danger
                        ? 'text-red-300/85 hover:bg-red-500/10'
                        : 'text-white/75 hover:bg-white/[0.06] hover:text-white',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                        action.danger
                          ? 'bg-red-500/10 text-red-300/80'
                          : 'bg-white/[0.05] text-white/45',
                      ].join(' ')}
                    >
                      <ActionGlyph icon={action.icon ?? 'edit'} />
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
