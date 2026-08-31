'use client';

import Sidebar from '@/components/layout/Sidebar';
import type { FluxerUser, DashboardGuild } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import TimezonePicker from '@/components/ui/TimezonePicker';
import { ReminderModal, Reminder } from './Modals';
import Image from 'next/image';

interface CommandStat {
  name: string;
  count: number;
  lastUsed?: number;
}

interface ProfilePageProps {
  user: FluxerUser;
  guilds?: DashboardGuild[];
  currentPage: string;
  commands?: CommandStat[];
  commandsTotal?: number;
}

function avatarSrc(user: FluxerUser): string {
  if (user.avatar)
    return `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.png?size=256`;
  return `https://fluxerstatic.com/avatars/${Number(BigInt(user.id) >> BigInt(22)) % 6}.png`;
}

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function parseDt(s: string): { y: number; mo: number; d: number; h: number; mi: number } {
  const [datePart, timePart] = s.split('T');
  const [y, mo, d] = (datePart ?? '').split('-').map(Number);
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number);
  return {
    y: y || new Date().getFullYear(),
    mo: (mo || 1) - 1,
    d: d || 1,
    h: h || 0,
    mi: mi || 0,
  };
}

function formatDt(y: number, mo: number, d: number, h: number, mi: number) {
  return `${y}-${pad2(mo + 1)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}`;
}

function daysInMonth(y: number, mo: number) {
  return new Date(y, mo + 1, 0).getDate();
}

function ScrollWheel({
  items,
  selected,
  onSelect,
}: {
  items: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 32;

  useEffect(() => {
    const idx = items.findIndex((i) => i.value === selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
    }
  }, [selected, items]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
    const dir = e.deltaY > 0 ? 1 : -1;
    const currentIdx = items.findIndex((i) => i.value === selected);
    const nextIdx = Math.max(0, Math.min(currentIdx + dir, items.length - 1));
    if (nextIdx !== currentIdx) onSelect(items[nextIdx].value);
  }

  return (
    <div
      ref={ref}
      onWheel={handleWheel}
      className="h-[128px] overflow-y-hidden scrollbar-none relative"
    >
      <div
        className="pointer-events-none absolute left-0 right-0 top-[48px] h-8 bg-orange/10 rounded-lg z-10"
        aria-hidden="true"
      />
      <div className="h-12" />
      {items.map((item) => (
        <div
          key={item.value}
          onClick={() => onSelect(item.value)}
          style={{ height: ITEM_H }}
          className={[
            'flex items-center justify-center text-sm cursor-pointer transition-all duration-150 select-none',
            item.value === selected
              ? 'text-orange-warm font-bold'
              : 'text-white/35 hover:text-white/70',
          ].join(' ')}
        >
          {item.label}
        </div>
      ))}
      <div className="h-12" />
    </div>
  );
}

function RemindersSection({ userId }: { userId: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | Reminder | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const PAGE_SIZE = 4;
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

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  return (
    <>
      <section className="rounded-2xl bg-bg-card border border-white/[0.04] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest">
              Reminders
            </h2>
            <p className="text-white/25 text-[11px] mt-0.5">
              New reminders are delivered via DM
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Create
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3.5 bg-white/[0.02] animate-pulse flex gap-3"
              >
                <div className="w-4 h-4 mt-0.5 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded bg-white/5 w-3/4" />
                  <div className="h-3 rounded bg-white/5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-white/20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-white/40 text-sm font-medium">No reminders yet</p>
            <p className="text-white/25 text-xs mt-1">Schedule one and we’ll ping you in DMs</p>
            <button
              type="button"
              onClick={() => setModal('create')}
              className="mt-4 text-orange-warm/80 hover:text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none"
            >
              Create reminder →
            </button>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden min-h-[200px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.ul
                  key={page}
                  custom={direction}
                  variants={variants}
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
                            <svg
                              className={['w-3.5 h-3.5', isPast ? 'text-white/25' : 'text-white/50'].join(' ')}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
                              <path
                                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <svg
                              className={['w-3.5 h-3.5', isPast ? 'text-white/25' : 'text-orange/70'].join(' ')}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
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
                          <p className="text-white/85 text-sm leading-snug break-words">
                            {r.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p
                              className={[
                                'text-xs tabular-nums',
                                isPast ? 'text-white/30' : 'text-orange-light/60',
                              ].join(' ')}
                            >
                              {formatRelative(r.timestamp)}
                            </p>
                            <span className="text-white/15 text-[10px]">·</span>
                            <p className="text-[11px] text-white/25">{formatTimestamp(r.timestamp)}</p>
                          </div>
                        </div>

                        {!isPast && (
                          <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setModal(r)}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors focus-visible:outline-none"
                              aria-label="Edit reminder"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path
                                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              disabled={deleting === r.id}
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none disabled:opacity-50"
                              aria-label="Delete reminder"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path
                                  d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}

                  {Array.from({ length: Math.max(0, PAGE_SIZE - paginated.length) }).map(
                    (_, i) => (
                      <li
                        key={`pad-${page}-${i}`}
                        className="rounded-xl px-4 py-[18px] bg-transparent pointer-events-none opacity-0"
                        aria-hidden="true"
                      />
                    )
                  )}
                </motion.ul>
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <p className="text-white/30 text-xs tabular-nums">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{' '}
                  {sorted.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-none"
                    aria-label="Previous page"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goToPage(i)}
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
                    onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-none"
                    aria-label="Next page"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {modal === 'create' && (
        <ReminderModal onSave={handleCreate} onClose={() => setModal(null)} />
      )}
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

function CommandUsageSection({
  commands,
  total,
}: {
  commands: CommandStat[];
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 5;

  const sorted = [...commands].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW);
  const hiddenCount = Math.max(0, sorted.length - PREVIEW);
  const maxCount = sorted.length > 0 ? Math.max(...sorted.map((c) => c.count || 0), 1) : 1;

  return (
    <section className="rounded-2xl bg-bg-card border border-white/[0.04] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest">
            Command usage
          </h2>
          <p className="text-white/25 text-[11px] mt-0.5">
            Commands you’ve run with Functious
          </p>
        </div>
        {total > 0 && (
          <div className="text-right shrink-0">
            <p className="text-white font-semibold text-lg tabular-nums leading-none">
              {total.toLocaleString()}
            </p>
            <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-wider">
              total
            </p>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 px-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-5 h-5 text-white/20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-white/40 text-sm font-medium">No commands yet</p>
          <p className="text-white/25 text-xs mt-1">Used commands will show up here</p>
        </div>
      ) : (
        <>
          <div
            className={
              expanded
                ? 'max-h-72 overflow-y-auto pr-1 scrollbar-thin space-y-2'
                : 'space-y-2'
            }
          >
            <ul className="space-y-2">
              {visible.map((cmd, i) => {
                const pct = Math.round(((cmd.count || 0) / maxCount) * 100);

                return (
                  <li
                    key={cmd.name + i}
                    className="rounded-xl px-3.5 py-3 bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-white/90 text-sm font-medium truncate font-mono min-w-0">
                        f!{cmd.name}
                      </span>
                      <span className="text-white/40 text-xs tabular-nums shrink-0">
                        {(cmd.count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange/70 to-orange-warm/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {cmd.lastUsed != null && (
                      <p className="mt-1.5 text-[11px] text-white/25">
                        Last used {formatRelative(cmd.lastUsed)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 w-full py-2.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white/80"
            >
              {expanded
                ? 'Show less'
                : `View ${hiddenCount} more command${hiddenCount === 1 ? '' : 's'}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default function ProfilePage({
  user: initialUser,
  guilds,
  commands = [],
  commandsTotal = 0,
}: ProfilePageProps) {
  const [user, setUser] = useState<FluxerUser>(initialUser);
  const [timezone, setTimezone] = useState(initialUser.timezone ?? 'America/New_York');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setTimezone(data.user.timezone ?? 'America/New_York');
        }
      });
  }, []);

  const displayName = user.global_name ?? user.username;

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user as FluxerUser} guilds={guilds} currentPage="profile" />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Profile Settings
          </h1>
          <p className="text-white/35 text-sm mt-1.5">
            Manage your preferences, reminders, and command activity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <section className="rounded-2xl bg-bg-card border border-white/[0.04] px-4 py-3.5 flex items-center gap-3.5">
            <div className="relative shrink-0">
              <Image
                src={avatarSrc(user)}
                alt={displayName}
                width={52}
                height={52}
                className="rounded-xl ring-2 ring-orange/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-bg-card" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate leading-tight">
                {displayName}
              </p>
              {user.global_name && (
                <p className="text-white/40 text-xs truncate mt-0.5">@{user.username}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                title="Click to copy user ID"
                className="mt-1.5 inline-flex items-center gap-1.5 max-w-full rounded-md bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 px-2 py-1 transition-colors group"
              >
                <span className="text-white/30 group-hover:text-white/50 text-[10px] font-mono truncate transition-colors">
                  {copied ? 'Copied!' : user.id}
                </span>
                {!copied && (
                  <svg
                    className="w-2.5 h-2.5 text-white/20 group-hover:text-white/40 shrink-0 transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-bg-card border border-white/[0.04] px-4 py-3.5 flex flex-col justify-center gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">
                Timezone
              </h2>
              <p className="text-white/20 text-[10px] hidden sm:block truncate">
                Reminders & server times
              </p>
            </div>
            <TimezonePicker
              value={timezone}
              onChangeAction={async (v) => {
                setTimezone(v);
                try {
                  await fetch('/api/users/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ timezone: v }),
                  });
                  showToast('Timezone saved');
                } catch (err) {
                  console.error(err);
                  showErrorToast('Failed to save timezone');
                }
              }}
            />
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <RemindersSection userId={user.id} />
          <CommandUsageSection commands={commands} total={commandsTotal} />
        </div>
      </main>
    </div>
  );
}