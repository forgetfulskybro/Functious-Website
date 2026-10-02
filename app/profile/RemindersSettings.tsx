'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import NumberInput from '@/components/ui/NumberInput';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { ReminderModal, Reminder } from './Modals';

export interface ReactionReminder {
  id: string;
  guildId: string;
  guildName: string | null;
  channelId: string;
  channelName: string | null;
  reminderMessage: string;
  sample: string;
  durationSeconds: number;
  createdAt: number;
  matches: number;
  sourceMessageId: string | null;
  sourceType: string;
  language: string;
}

const PAGE_SIZE = 4;

const UNIT_SECONDS = { m: 60, h: 3600, d: 86400 } as const;
type DurationUnit = keyof typeof UNIT_SECONDS;

const UNIT_OPTIONS = [
  { value: 'm', label: 'Minutes' },
  { value: 'h', label: 'Hours' },
  { value: 'd', label: 'Days' },
];

const UNIT_MAX: Record<DurationUnit, number> = {
  m: Math.floor(63115209 / 60),
  h: Math.floor(63115209 / 3600),
  d: Math.floor(63115209 / 86400),
};

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRelative(ts: number): string {
  const diff = ts - Math.floor(Date.now() / 1000);
  const abs = Math.abs(diff);
  if (abs < 60) return diff >= 0 ? 'in a moment' : 'just now';
  if (abs < 3600) {
    const m = Math.floor(abs / 60);
    return diff >= 0 ? `in ${m}m` : `${m}m ago`;
  }
  if (abs < 86400) {
    const h = Math.floor(abs / 3600);
    return diff >= 0 ? `in ${h}h` : `${h}h ago`;
  }
  const d = Math.floor(abs / 86400);
  if (d < 30) return diff >= 0 ? `in ${d}d` : `${d}d ago`;
  return formatTimestamp(ts);
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d} day${d === 1 ? '' : 's'}`);
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m && parts.length < 2) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  return parts.join(' ') || `${seconds} seconds`;
}

function splitDuration(seconds: number): { value: number; unit: DurationUnit } {
  const secondsValue = Math.max(60, Math.round(seconds));
  if (secondsValue % 86400 === 0 && secondsValue >= 86400) {
    return { value: secondsValue / 86400, unit: 'd' };
  }
  if (secondsValue % 3600 === 0 && secondsValue >= 3600) {
    return { value: secondsValue / 3600, unit: 'h' };
  }
  return { value: Math.max(1, Math.round(secondsValue / 60)), unit: 'm' };
}

function targetLabel(item: ReactionReminder): string {
  const guild = item.guildName || 'Unknown server';
  const channel = item.channelName ? `#${item.channelName}` : item.channelId;
  return `${guild} · ${channel}`;
}

function SectionShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-bg-card border border-white/[0.04] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest">
            {title}
          </h2>
          <p className="text-white/25 text-[11px] mt-0.5">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-3">
        <span className="text-white/20">{icon}</span>
      </div>
      <p className="text-white/40 text-sm font-medium">{title}</p>
      <p className="text-white/25 text-xs mt-1">{hint}</p>
      {action}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl px-4 py-3.5 bg-white/[0.02] animate-pulse flex gap-3">
          <div className="w-4 h-4 mt-0.5 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 rounded bg-white/5 w-3/4" />
            <div className="h-3 rounded bg-white/5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pager({
  page,
  totalPages,
  pageSize,
  count,
  onPage,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
      <p className="text-white/30 text-xs tabular-nums">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, count)} of {count}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="p-1.5 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-none"
          aria-label="Previous page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPage(i)}
            className={[
              'w-6 h-6 rounded-md text-xs font-medium transition-colors focus-visible:outline-none',
              i === page
                ? 'bg-orange/20 text-orange-warm'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5',
            ].join(' ')}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages - 1, page + 1))}
          disabled={page === totalPages - 1}
          className="p-1.5 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-none"
          aria-label="Next page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors focus-visible:outline-none"
      aria-label={label}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function DeleteButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none disabled:opacity-50"
      aria-label={label}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

const LIST_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
};

function RegularRemindersSection({ userId }: { userId: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | Reminder | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    fetch('/api/users/reminders', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { reminders: [] }))
      .then((data) => setReminders(data.reminders ?? []))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleCreate(message: string, timestamp: number) {
    const res = await fetch('/api/users/reminders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, timestamp }),
    });
    if (res.ok) {
      const { reminder } = await res.json();
      setReminders((prev) => [...prev, reminder]);
      showToast('Reminder created');
    } else {
      showErrorToast('Failed to create reminder');
    }
  }

  async function handleEdit(reminder: Reminder, message: string, timestamp: number) {
    const res = await fetch(`/api/users/reminders/${reminder.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, timestamp }),
    });
    if (res.ok) {
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, message, timestamp } : r))
      );
      showToast('Reminder updated');
    } else {
      showErrorToast('Failed to update reminder');
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/users/reminders/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setReminders((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        const newTotal = Math.ceil(updated.length / PAGE_SIZE);
        if (page >= newTotal && page > 0) setPage((p) => p - 1);
        return updated;
      });
      showToast('Reminder deleted');
    } else {
      showErrorToast('Failed to delete reminder');
    }
    setDeleting(null);
  }

  const sorted = [...reminders].sort((a, b) => a.timestamp - b.timestamp);
  const now = Math.floor(Date.now() / 1000);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function goToPage(newPage: number) {
    if (newPage === page) return;
    setDirection(newPage > page ? 1 : -1);
    setPage(newPage);
  }

  return (
    <>
      <SectionShell
        title="Reminders"
        subtitle="New reminders are delivered via DM"
        action={
          <button
            type="button"
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Create
          </button>
        }
      >
        {loading ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No reminders yet"
            hint="Schedule one and we’ll ping you in DMs"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            action={
              <button
                type="button"
                onClick={() => setModal('create')}
                className="mt-4 text-orange-warm/80 hover:text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none"
              >
                Create reminder →
              </button>
            }
          />
        ) : (
          <>
            <div className="relative overflow-hidden min-h-[200px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.ul
                  key={page}
                  custom={direction}
                  variants={LIST_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className="space-y-2"
                >
                  {paginated.map((r) => {
                    const isPast = r.timestamp < now;
                    const isGuild = r.type === 'guild';
                    return (
                      <li
                        key={r.id}
                        className={[
                          'rounded-xl px-4 py-3 flex items-start gap-3 group border transition-colors',
                          isPast
                            ? 'bg-white/[0.015] border-transparent opacity-60'
                            : 'bg-white/[0.03] border-white/[0.04] hover:border-white/[0.08]',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            isPast ? 'bg-white/[0.04]' : isGuild ? 'bg-white/[0.06]' : 'bg-orange/10',
                          ].join(' ')}
                        >
                          {isGuild ? (
                            <svg className={['w-3.5 h-3.5', isPast ? 'text-white/25' : 'text-white/50'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg className={['w-3.5 h-3.5', isPast ? 'text-white/25' : 'text-orange/70'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            {isGuild && (
                              <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-white/8 text-white/35">
                                Guild
                              </span>
                            )}
                            {isPast && (
                              <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-white/5 text-white/30">
                                Done
                              </span>
                            )}
                          </div>
                          <p className="text-white/85 text-sm leading-snug break-words">{r.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className={['text-xs tabular-nums', isPast ? 'text-white/30' : 'text-orange-light/60'].join(' ')}>
                              {formatRelative(r.timestamp)}
                            </p>
                            <span className="text-white/15 text-[10px]">·</span>
                            <p className="text-[11px] text-white/25">{formatTimestamp(r.timestamp)}</p>
                          </div>
                        </div>

                        {!isPast && (
                          <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <EditButton onClick={() => setModal(r)} label="Edit reminder" />
                            <DeleteButton
                              onClick={() => handleDelete(r.id)}
                              disabled={deleting === r.id}
                              label="Delete reminder"
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}

                  {Array.from({ length: Math.max(0, PAGE_SIZE - paginated.length) }).map((_, i) => (
                    <li
                      key={`pad-${page}-${i}`}
                      className="rounded-xl px-4 py-[18px] bg-transparent pointer-events-none opacity-0"
                      aria-hidden="true"
                    />
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>

            <Pager
              page={page}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              count={sorted.length}
              onPage={goToPage}
            />
          </>
        )}
      </SectionShell>

      {modal === 'create' && <ReminderModal onSave={handleCreate} onClose={() => setModal(null)} />}
      {modal && modal !== 'create' && (
        <ReminderModal
          initial={modal}
          onSave={(msg, ts) => handleEdit(modal, msg, ts)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function ReactionReminderModal({
  initial,
  onSave,
  onClose,
}: {
  initial: ReactionReminder;
  onSave: (durationSeconds: number, reminderMessage: string) => Promise<void>;
  onClose: () => void;
}) {
  const [message, setMessage] = useState(initial.reminderMessage ?? '');
  const initialParts = splitDuration(initial.durationSeconds);
  const [unit, setUnit] = useState<DurationUnit>(initialParts.unit);
  const [value, setValue] = useState(initialParts.value);
  const [saving, setSaving] = useState(false);

  const seconds = value * UNIT_SECONDS[unit];
  const tooShort = seconds < 59;
  const tooLong = seconds > 63115209;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || tooShort || tooLong) return;
    setSaving(true);
    await onSave(seconds, message.trim());
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-base">Edit reaction reminder</h2>
            <p className="text-white/30 text-xs mt-0.5">
              Applies to every reminder set by clicking ⏰ in{' '}
              <span className="text-orange-light/60">{targetLabel(initial)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none p-1 rounded-lg hover:bg-white/5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] px-3.5 py-2.5">
            <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="min-w-0">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Channel</p>
              <p className="text-white/70 text-xs truncate">{targetLabel(initial)}</p>
            </div>
            <span className="ml-auto text-[10px] text-white/25 shrink-0">Can’t be changed</span>
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Reminder message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder="Leave blank to use the text of the message you react to"
              className="w-full bg-white/[0.04] border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-orange/50"
            />
            <p className={['text-xs mt-1.5 text-right tabular-nums', message.length >= 380 ? 'text-orange-light/70' : 'text-white/20'].join(' ')}>
              {message.length}/400
            </p>
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Remind me after</label>
            <div className="flex items-start gap-2">
              <div className="w-28 shrink-0">
                <NumberInput value={value} onChange={setValue} min={1} max={UNIT_MAX[unit]} />
              </div>
              <div className="flex-1">
                <SelectDropdown
                  value={unit}
                  onChange={(v) => {
                    const next = v as DurationUnit;
                    setUnit(next);
                    setValue((prev) => Math.min(prev, UNIT_MAX[next]));
                  }}
                  options={UNIT_OPTIONS}
                  label=""
                />
              </div>
            </div>
            <p className="text-white/25 text-[11px] mt-1.5">
              Counts from when you click the ⏰ reaction · {formatDuration(seconds)}
            </p>
            {(tooShort || tooLong) && (
              <p className="text-red-400/80 text-[11px] mt-1">
                {tooShort
                  ? 'Duration must be at least 1 minute.'
                  : 'Duration can’t be more than 2 years.'}
              </p>
            )}
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-white/60 hover:text-white/90 text-sm transition-colors focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !message.trim() || tooShort || tooLong}
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-bright disabled:opacity-50 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReactionRemindersSection() {
  const [items, setItems] = useState<ReactionReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ReactionReminder | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    fetch('/api/users/reaction-reminders', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { reactionReminders: [] }))
      .then((data) => setItems(data.reactionReminders ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleEdit(item: ReactionReminder, durationSeconds: number, reminderMessage: string) {
    const res = await fetch(`/api/users/reaction-reminders/${item.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationSeconds, reminderMessage }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const saved: ReactionReminder | undefined = data?.reactionReminder;
      setItems((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, durationSeconds, reminderMessage, ...(saved ?? {}) }
            : r
        )
      );
      showToast('Reaction reminder updated');
    } else {
      const data = await res.json().catch(() => ({}));
      showErrorToast('Failed to update reminder', { description: data?.error });
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/users/reaction-reminders/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setItems((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        const newTotal = Math.ceil(updated.length / PAGE_SIZE);
        if (page >= newTotal && page > 0) setPage((p) => p - 1);
        return updated;
      });
      showToast('Reaction reminder removed');
    } else {
      showErrorToast('Failed to remove reminder');
    }
    setDeleting(null);
  }

  const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function goToPage(newPage: number) {
    if (newPage === page) return;
    setDirection(newPage > page ? 1 : -1);
    setPage(newPage);
  }

  return (
    <>
      <SectionShell
        title="Reaction reminders"
        subtitle="Set up in Fluxer with f!remind add · edit the timing and text here"
      >
        {loading ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No reaction reminders"
            hint="React to a message with f!remind add in Fluxer to create one"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
                <path d="M9 9h.01M15 9h.01" strokeLinecap="round" />
              </svg>
            }
          />
        ) : (
          <>
            <div className="relative overflow-hidden min-h-[200px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.ul
                  key={page}
                  custom={direction}
                  variants={LIST_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className="space-y-2"
                >
                  {paginated.map((item) => {
                    const text = item.reminderMessage?.trim() || item.sample?.trim();
                    return (
                      <li
                        key={item.id}
                        className="rounded-xl px-4 py-3 flex items-start gap-3 group border bg-white/[0.03] border-white/[0.04] hover:border-white/[0.08] transition-colors"
                      >
                        <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange/10">
                          <svg className="w-3.5 h-3.5 text-orange/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-orange/10 text-orange-light/70">
                              Reaction
                            </span>
                            <span className="text-[10px] text-white/30">⌛ {formatDuration(item.durationSeconds)}</span>
                            {item.matches > 0 && (
                              <span className="text-[10px] text-white/25">
                                · {item.matches} match{item.matches === 1 ? '' : 'es'}
                              </span>
                            )}
                          </div>
                          <p className="text-white/85 text-sm leading-snug break-words">
                            {text ? (
                              <>
                                {text}
                                {!item.reminderMessage?.trim() && (
                                  <span className="text-white/25"> · uses the reacted message’s text</span>
                                )}
                              </>
                            ) : (
                              <span className="text-white/35 italic">Uses the reacted message’s text</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-xs text-orange-light/60 truncate">{targetLabel(item)}</p>
                            <span className="text-white/15 text-[10px]">·</span>
                            <p className="text-[11px] text-white/25 shrink-0">{formatRelative(item.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <EditButton onClick={() => setEditing(item)} label="Edit reaction reminder" />
                          <DeleteButton
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            label="Delete reaction reminder"
                          />
                        </div>
                      </li>
                    );
                  })}

                  {Array.from({ length: Math.max(0, PAGE_SIZE - paginated.length) }).map((_, i) => (
                    <li
                      key={`pad-${page}-${i}`}
                      className="rounded-xl px-4 py-[18px] bg-transparent pointer-events-none opacity-0"
                      aria-hidden="true"
                    />
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>

            <Pager
              page={page}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              count={sorted.length}
              onPage={goToPage}
            />
          </>
        )}
      </SectionShell>

      {editing && (
        <ReactionReminderModal
          initial={editing}
          onSave={(durationSeconds, reminderMessage) => handleEdit(editing, durationSeconds, reminderMessage)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export default function RemindersSettings({ userId }: { userId: string }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <RegularRemindersSection userId={userId} />
      <ReactionRemindersSection />
    </div>
  );
}
