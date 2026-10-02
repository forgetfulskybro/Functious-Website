'use client';

import Sidebar from '@/components/layout/Sidebar';
import type { FluxerUser, DashboardGuild } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import TimezonePicker from '@/components/ui/TimezonePicker';
import RemindersSettings from './RemindersSettings';
import BirthdaySettings from './BirthdaySettings';
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
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  return `https://fluxerstatic.com/avatars/${Number(BigInt(user.id) >> BigInt(22)) % 6}.png`;
}

function isGif(src: string): boolean {
  return src.includes('.gif') || src.endsWith('.gif');
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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: 'information' | 'birthdays' | 'reminders' =
    tabParam === 'birthdays' ? 'birthdays' : tabParam === 'reminders' ? 'reminders' : 'information';

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
  const avatarUrl = avatarSrc(user);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user as FluxerUser} guilds={guilds} currentPage="profile" />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Profile Settings
          </h1>
          <p className="text-white/35 text-sm mt-1.5">
            Manage your preferences, reminders, and birthday announcements.
          </p>
        </div>

        {tab === 'birthdays' ? (
          <BirthdaySettings user={user as FluxerUser} guilds={guilds ?? []} />
        ) : tab === 'reminders' ? (
          <RemindersSettings userId={user.id} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <section className="rounded-2xl bg-bg-card border border-white/[0.04] px-4 py-3.5 flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={52}
                    height={52}
                    className="rounded-xl ring-2 ring-orange/20"
                    unoptimized={isGif(avatarUrl)}
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
                    Reminders & community times
                  </p>
                </div>
                <TimezonePicker
                  value={timezone}
                  onChangeAction={async (v) => {
                    const prev = timezone;
                    setTimezone(v);
                    try {
                      const res = await fetch('/api/users/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ timezone: v }),
                      });
                      if (res.ok) {
                        showToast('Timezone saved');
                      } else {
                        const data = await res.json().catch(() => ({}));
                        setTimezone(prev);
                        showErrorToast('Failed to save timezone', {
                          description: data?.error ?? 'Please try again.',
                        });
                      }
                    } catch (err) {
                      console.error(err);
                      setTimezone(prev);
                      showErrorToast('Failed to save timezone');
                    }
                  }}
                />
              </section>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <CommandUsageSection commands={commands} total={commandsTotal} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}