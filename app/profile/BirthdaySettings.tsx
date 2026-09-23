'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { FluxerUser, DashboardGuild, BirthdayData } from '@/lib/types';
import { Toggle } from '@/components/ui/Toggle';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import { BirthdayModal, BirthdayPreviewModal } from './Modals';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function nextBirthdayTimestamp(month: number, day: number, timezone: string | null): number {
  const tz = timezone || 'UTC';
  const now = new Date();

  for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
    const year = now.getFullYear() + yearOffset;
    try {
      const localNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const birthdayLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
      const tzOffsetMs = now.getTime() - localNow.getTime();
      const birthdayUTC = new Date(birthdayLocal.getTime() + tzOffsetMs);
      if (birthdayUTC.getTime() > now.getTime()) {
        return Math.floor(birthdayUTC.getTime() / 1000);
      }
    } catch {
      const bd = new Date(now.getFullYear() + yearOffset, month - 1, day, 0, 0, 0);
      if (bd.getTime() > now.getTime()) return Math.floor(bd.getTime() / 1000);
    }
  }

  const bd = new Date(now.getFullYear() + 1, month - 1, day, 0, 0, 0);
  return Math.floor(bd.getTime() / 1000);
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
  if (d < 62) return diff >= 0 ? `in ${d}d` : `${d}d ago`;
  const mo = Math.floor(d / 30);
  return diff >= 0 ? `in ${mo}mo` : `${mo}mo ago`;
}

function guildIconUrl(id: string, icon: string | null): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://fluxerusercontent.com/icons/${id}/${icon}.${ext}?size=64`;
}

function isGif(src: string | null): boolean {
  return !!src && (src.includes('.gif') || src.endsWith('.gif'));
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarSrc(user: FluxerUser): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }
  return `https://fluxerstatic.com/avatars/${Number(BigInt(user.id) >> BigInt(22)) % 6}.png`;
}

export default function BirthdaySettings({
  user,
  guilds,
}: {
  user: FluxerUser;
  guilds: DashboardGuild[];
}) {
  const [birthday, setBirthday] = useState<BirthdayData | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAge, setLoadingAge] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewGuildId, setPreviewGuildId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [savingPing, setSavingPing] = useState(false);
  const [savingGuild, setSavingGuild] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedGuilds, setExpandedGuilds] = useState(false);
  const [blacklistStatus, setBlacklistStatus] = useState<Record<string, boolean>>({});

  const botGuilds = guilds.filter((g) => g.botPresent);
  const enabledGuilds = birthday?.enabledGuilds ?? [];
  const filteredGuilds = botGuilds.filter((g) =>
    g.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const visibleGuilds = expandedGuilds
    ? filteredGuilds
    : filteredGuilds.slice(0, 5);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBirthday(data.birthday ?? null);
        setTimezone(data.timezone ?? null);
      }
    } catch (err) {
      console.error('[BirthdaySettings load]', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (botGuilds.length === 0) return;
    let cancelled = false;
    const ids = botGuilds.map((g) => g.id);
    (async () => {
      try {
        const res = await fetch(
          `/api/users/blacklist-status?guilds=${encodeURIComponent(ids.join(','))}`,
          { credentials: 'include' },
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setBlacklistStatus(data.blacklisted ?? {});
        }
      } catch (err) {
        console.error('[BirthdaySettings blacklist status]', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [botGuilds.length, guilds]);

  async function patch(updates: { birthday: Partial<BirthdayData> }) {
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? 'Failed to save');
    }
    const data = await res.json();
    if (data?.birthday) setBirthday(data.birthday);
    return data;
  }

  async function handleSetBirthday(month: number, day: number, age: number | null) {
    setLoadingAge(true);
    try {
      await patch({ birthday: { month, day, age } });
      showToast('Birthday saved');
    } catch (err: any) {
      showErrorToast('Failed to save birthday', { description: err?.message });
    } finally {
      setLoadingAge(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await patch({
        birthday: { day: null, month: null, age: null, ping: true, enabledGuilds: [] },
      });
      showToast('Birthday removed');
    } catch (err: any) {
      showErrorToast('Failed to remove birthday', { description: err?.message });
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  }

  async function handleTogglePing(v: boolean) {
    setSavingPing(true);
    try {
      await patch({ birthday: { ping: v } });
      showToast(v ? 'You will be pinged' : 'Pings disabled');
    } catch (err: any) {
      showErrorToast('Failed to update', { description: err?.message });
    } finally {
      setSavingPing(false);
    }
  }

  async function handleToggleGuild(guildId: string, enabled: boolean) {
    if (blacklistStatus[guildId]) return;
    setSavingGuild(guildId);
    try {
      const next = enabled
        ? [...new Set([...enabledGuilds, guildId])]
        : enabledGuilds.filter((id) => id !== guildId);
      await patch({ birthday: { enabledGuilds: next } });
      showToast(enabled ? 'Announcements enabled in this server' : 'Announcements disabled in this server');
    } catch (err: any) {
      showErrorToast('Failed to update', { description: err?.message });
    } finally {
      setSavingGuild(null);
    }
  }

  const hasBirthday = !!birthday?.day && !!birthday?.month;
  const nextTs = hasBirthday
    ? nextBirthdayTimestamp(birthday!.month!, birthday!.day!, timezone)
    : null;
  const previewGuild = previewGuildId ? botGuilds.find((g) => g.id === previewGuildId) : null;

  return (
    <>
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl bg-bg-card border border-white/[0.04] px-5 py-6 animate-pulse">
            <div className="h-4 rounded bg-white/5 w-24 mb-4" />
            <div className="h-6 rounded bg-white/5 w-48 mb-6" />
            <div className="h-10 rounded-lg bg-white/5 w-64" />
          </div>
          <div className="rounded-2xl bg-bg-card border border-white/[0.04] px-5 py-6 animate-pulse">
            <div className="h-4 rounded bg-white/5 w-32 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-white/5 mb-2" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <section className="rounded-2xl bg-bg-card border border-white/[0.04] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                  Birthday
                </h2>
                <p className="text-white/25 text-[11px] mt-0.5">
                  Shown in your birthday announcements
                </p>
              </div>
            </div>

            {hasBirthday ? (
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <p className="text-white font-bold text-lg leading-tight">
                    {MONTHS[birthday!.month! - 1]} {ordinal(birthday!.day!)}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    {birthday!.age != null && (
                      <span className="text-xs text-orange-light/70">Age {birthday!.age}</span>
                    )}
                    {birthday!.age != null && <span className="text-white/15 text-xs">·</span>}
                    {nextTs != null && (
                      <span className="text-xs text-white/40">Next: {formatRelative(nextTs)}</span>
                    )}
                    {timezone && (
                      <span className="text-xs text-white/25">{timezone}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-orange/15 hover:bg-orange/25 text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewGuildId(enabledGuilds[0] ?? botGuilds[0]?.id ?? null)}
                    className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
                  >
                    Preview
                  </button>
                  {confirmRemove ? (
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={removing}
                      className="px-3.5 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {removing ? 'Removing…' : 'Confirm'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(true)}
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 text-xs font-medium transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-white/40 text-sm font-medium">No birthday set</p>
                <p className="text-white/25 text-xs mt-1">Set your birthday to get announced in servers</p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-4 text-orange-warm/80 hover:text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none"
                >
                  Set birthday →
                </button>
              </div>
            )}

            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-medium">Ping me</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Mention you when your birthday is announced
                  </p>
                </div>
                <Toggle
                  value={birthday?.ping ?? true}
                  onChangeAction={handleTogglePing}
                  disabled={savingPing}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-bg-card border border-white/[0.04] p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                Announce in
              </h2>
              <p className="text-white/25 text-[11px] mt-0.5">
                Pick which servers your birthday is announced in
              </p>
            </div>

            {botGuilds.length === 0 ? (
              <p className="text-white/30 text-sm py-6 text-center">
                Invite Functious to a server to get started.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <svg
                      className="w-3.5 h-3.5 text-white/25 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setExpandedGuilds(false);
                      }}
                      placeholder="Search servers…"
                      className="flex-1 bg-transparent text-white text-xs placeholder-white/25 focus:outline-none"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setExpandedGuilds(false);
                        }}
                        className="text-white/25 hover:text-white/60 text-sm leading-none flex-shrink-0"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {filteredGuilds.length > 0 && (
                    <p className="text-white/30 text-xs shrink-0 tabular-nums">
                      {filteredGuilds.length} server{filteredGuilds.length === 1 ? '' : 's'}
                    </p>
                  )}
                </div>

                {filteredGuilds.length === 0 ? (
                  <p className="text-white/30 text-sm py-6 text-center">
                    No servers match “{search}”.
                  </p>
                ) : (
                  <>
                    <div
                      className={
                        expandedGuilds ? 'max-h-72 overflow-y-auto pr-1' : ''
                      }
                    >
                      <ul className="divide-y divide-white/5">
                        {visibleGuilds.map((g) => {
                          const enabled = enabledGuilds.includes(g.id);
                          const blacklisted = !!blacklistStatus[g.id];
                          const icon = guildIconUrl(g.id, g.icon);
                          return (
                            <li key={g.id} className="py-3 flex items-center gap-3">
                              <div className="relative shrink-0">
                                {icon ? (
                                  <Image
                                    src={icon}
                                    alt={g.name}
                                    width={28}
                                    height={28}
                                    className="rounded-full"
                                    unoptimized={isGif(icon)}
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-orange/20 flex items-center justify-center text-orange-warm text-[10px] font-bold">
                                    {initials(g.name)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white/85 text-sm font-medium truncate">
                                  {g.name}
                                </p>
                                <p className={blacklisted ? 'text-[11px] text-red-400/80' : 'text-[11px] text-white/30'}>
                                  {blacklisted
                                    ? 'Blacklisted - you can’t enable announcements here'
                                    : enabled && !hasBirthday
                                      ? 'Enabled'
                                      : enabled
                                        ? 'Enabled - announcements on'
                                        : 'Disabled'}
                                </p>
                              </div>
                              <Toggle
                                value={enabled}
                                onChangeAction={(v) => handleToggleGuild(g.id, v)}
                                disabled={savingGuild === g.id || blacklisted}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {filteredGuilds.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setExpandedGuilds((v) => !v)}
                        className="mt-4 w-full py-2.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white/80"
                      >
                        {expandedGuilds
                          ? 'Show less'
                          : `View ${filteredGuilds.length - 5} more server${filteredGuilds.length - 5 === 1 ? '' : 's'}`}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {modalOpen && (
        <BirthdayModal
          initial={
            hasBirthday
              ? { month: birthday!.month!, day: birthday!.day!, age: birthday!.age }
              : null
          }
          onSave={handleSetBirthday}
          onClose={() => setModalOpen(false)}
        />
      )}

      {previewGuildId != null && previewGuild && hasBirthday && (
        <BirthdayPreviewModal
          avatarUrl={avatarSrc(user)}
          displayName={user.global_name ?? user.username}
          month={birthday!.month!}
          day={birthday!.day!}
          age={birthday!.age}
          ping={birthday?.ping ?? true}
          guildName={previewGuild.name ?? 'server'}
          onClose={() => setPreviewGuildId(null)}
        />
      )}
    </>
  );
}