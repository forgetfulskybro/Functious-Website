'use client';

import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, GuildBirthdayEntry } from '@/lib/types';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import { SettingRowSkeleton, Skeleton } from '@/components/ui/Skeletons';
import { SettingRow } from '@/components/ui/SettingRow';
import { useGuildData } from '@/hooks/useGuildData';
import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Toggle } from '@/components/ui/Toggle';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import RolesDropdown from '@/components/ui/RolesDropdown';
import UserBadge from '@/components/ui/UserBadge';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import Image from 'next/image';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const UPCOMING_PAGE_SIZE = 5;

function orderDay(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
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

function avatarUrl(userId: string, avatar: string | null): string | null {
  if (!avatar) return null;
  const ext = avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://fluxerusercontent.com/avatars/${userId}/${avatar}.${ext}?size=64`;
}

function isGif(src: string | null): boolean {
  return !!src && (src.includes('.gif') || src.endsWith('.gif'));
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}

export default function BirthdaysClient({
  user, guilds, activeGuildId, userGuild, initialData,
}: Props) {
  const { guild: guildState, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guildState ?? initialData;
  const guildChannels = (data as any).guildChannels ?? [];
  const guildRoles = (data as any).guildRoles ?? [];

  const [list, setList] = useState<GuildBirthdayEntry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [forcing, setForcing] = useState<string | null>(null);
  const [blacklist, setBlacklist] = useState<string[]>(initialData.birthdayBlacklist ?? []);
  const profiles = useUserProfiles(blacklist);
  const listProfiles = useUserProfiles(list.map((e) => e.userId));
  const [idInput, setIdInput] = useState('');
  const [idError, setIdError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [blacklisting, setBlacklisting] = useState(false);
  const [search, setSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [msgWithAge, setMsgWithAge] = useState<string>(initialData.birthdayMessageWithAge ?? '');
  const [msgNoAge, setMsgNoAge] = useState<string>(initialData.birthdayMessageNoAge ?? '');
  const withAgeRef = useRef<HTMLTextAreaElement>(null);
  const noAgeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMsgWithAge(data.birthdayMessageWithAge ?? '');
    setMsgNoAge(data.birthdayMessageNoAge ?? '');
  }, [data.birthdayMessageWithAge, data.birthdayMessageNoAge]);

  function insertToken(ref: { current: HTMLTextAreaElement | null }, token: string, setter: (v: string) => void) {
    const el = ref.current;
    const current = el?.value ?? '';
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setter(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  useEffect(() => {
    if (error) {
      showErrorToast('Error', { description: error });
    }
  }, [error]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/birthdays`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setList(data.list ?? []);
        setBlacklist(data.birthdayBlacklist ?? []);
      }
    } catch (err) {
      console.error('[birthdays list]', err);
    } finally {
      setListLoading(false);
    }
  }, [activeGuildId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const filteredBlacklist = blacklist.filter((userId) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const profile = profiles[userId];
    const name = `${profile?.globalName ?? ''} ${profile?.username ?? ''}`.toLowerCase();
    return name.includes(q) || userId.includes(q);
  });

  const filteredList = list.filter((entry) => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return true;
    const profile = listProfiles[entry.userId];
    const name = `${profile?.globalName ?? ''} ${profile?.username ?? ''} ${entry.username ?? ''}`.toLowerCase();
    return name.includes(q) || entry.userId.includes(q);
  });

  const upcomingTotalPages = Math.max(1, Math.ceil(filteredList.length / UPCOMING_PAGE_SIZE));
  const [upcomingPage, setUpcomingPage] = useState(0);
  const upcomingPaginated = filteredList.slice(
    upcomingPage * UPCOMING_PAGE_SIZE,
    upcomingPage * UPCOMING_PAGE_SIZE + UPCOMING_PAGE_SIZE,
  );

  useEffect(() => {
    setUpcomingPage(0);
  }, [listSearch, list.length]);

  async function handleSave(updates: Partial<GuildData>) {
    try {
      await save(updates);
      showToast('Settings saved', { description: 'Your changes have been applied.' });
    } catch {
      showErrorToast('Failed to save', { description: 'Please try again.' });
    }
  }

  async function handleSaveMessage(field: 'birthdayMessageWithAge' | 'birthdayMessageNoAge', value: string) {
    const trimmed = value.trim();
    await handleSave({ [field]: trimmed ? trimmed : null });
  }

  async function handleForce(userId: string) {
    setForcing(userId);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/birthdays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        showToast('Birthday announced');
      } else {
        const err = await res.json().catch(() => ({}));
        showErrorToast('Failed to announce', { description: err?.error ?? 'Please try again.' });
      }
    } catch {
      showErrorToast('Failed to announce', { description: 'Please try again.' });
    } finally {
      setForcing(null);
    }
  }

  async function handleAddBlacklist(userId: string): Promise<boolean> {
    setBlacklisting(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/birthdays/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlacklist(data.birthdayBlacklist ?? [...blacklist, userId]);
        setIdInput('');
        setIdError('');
        showToast('Blacklisted', {
          description: `${userId} won't receive birthday announcements in this server.`,
        });
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        showErrorToast('Failed to blacklist', { description: err?.error ?? 'Please try again.' });
      }
    } catch {
      showErrorToast('Failed to blacklist', { description: 'Please try again.' });
    } finally {
      setBlacklisting(false);
    }
    return false;
  }

  async function handleRemoveBlacklist(userId: string) {
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/birthdays/blacklist?userId=${encodeURIComponent(userId)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        },
      );
      if (res.ok) {
        const data = await res.json();
        setBlacklist(data.birthdayBlacklist ?? blacklist.filter((id) => id !== userId));
        showToast('Removed from blacklist', {
          description: 'This user can opt back in on their profile.',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        showErrorToast('Failed to remove', { description: err?.error ?? 'Please try again.' });
      }
    } catch {
      showErrorToast('Failed to remove', { description: 'Please try again.' });
    }
  }

  async function handleAddById() {
    const id = idInput.trim();
    if (!/^\d{17,20}$/.test(id)) {
      setIdError('Enter a valid Discord user ID (17–20 digits).');
      return;
    }
    setIdError('');
    if (blacklist.includes(id)) {
      showErrorToast('Already blacklisted', { description: 'This user is already excluded.' });
      setIdInput('');
      return;
    }
    const ok = await handleAddBlacklist(id);
    if (ok) setAddOpen(false);
  }

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const channelSet = !!data.birthdayChannel;

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user} guilds={guilds} activeGuildId={activeGuildId} currentPage="dashboard" />

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 pb-5 border-b border-white/5">
          {iconUrl ? (
            <Image src={iconUrl} alt={userGuild.name ?? ''} width={40} height={40} className="rounded-xl" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange/15 flex items-center justify-center text-orange-warm font-bold">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Birthdays</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <div className="rounded-xl bg-bg-card px-6 py-1 mb-5">
          {loading ? (
            <div className="py-3.5">
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <SettingRow
              label="Announcement Ping"
              description="Ping the birthday member in the announcement. This can be turned off by the user themself."
            >
              <Toggle
                value={data.birthdayPing ?? true}
                onChangeAction={(v) => handleSave({ birthdayPing: v })}
              />
            </SettingRow>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div className="w-full lg:w-96 lg:flex-shrink-0 space-y-5">
            <section className="rounded-2xl bg-bg-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                    Upcoming Birthdays
                  </h2>
                  <p className="text-white/20 text-[10px] mt-0.5">
                    Members with birthdays in this server
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadList}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[11px] transition-colors focus-visible:outline-none"
                >
                  Refresh
                </button>
              </div>

              {!listLoading && list.length > 0 && (
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search members…"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/10 focus:border-orange/40 focus:ring-1 focus:ring-orange/30 outline-none text-xs text-white placeholder:text-white/25 pl-9 pr-3 py-2 transition-colors"
                  />
                </div>
              )}

              {listLoading ? (
                <ul className="space-y-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li
                      key={i}
                      className="rounded-xl px-3 py-2.5 bg-white/[0.03] space-y-1.5 animate-pulse"
                    >
                      <div className="h-3 w-24 rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-32 rounded bg-white/[0.04]" />
                    </li>
                  ))}
                </ul>
              ) : list.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/25 text-xs">No birthdays in this server yet.</p>
                  <p className="text-white/15 text-[10px] mt-1">Members opt in on their profile.</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/25 text-xs">No members match “{listSearch.trim()}”.</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-1.5">
                    {upcomingPaginated.map((entry) => {
                      const profile = listProfiles[entry.userId];
                      const displayName =
                        profile?.globalName ?? profile?.username ?? entry.username ?? entry.userId;
                      const avatarSrc =
                        profile?.avatarUrl ?? avatarUrl(entry.userId, profile?.avatar ?? entry.avatar);
                      return (
                        <li
                          key={entry.userId}
                          className="rounded-xl px-3 py-2.5 bg-white/[0.03] group"
                        >
                          <div className="flex items-center gap-2.5">
                            {avatarSrc ? (
                              <Image
                                src={avatarSrc}
                                alt={displayName}
                                width={28}
                                height={28}
                                className="rounded-full flex-shrink-0"
                                unoptimized={isGif(avatarSrc)}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-orange/20 flex items-center justify-center text-orange-warm text-[9px] font-bold flex-shrink-0">
                                {initials(displayName)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-white/80 text-sm font-medium truncate">{displayName}</p>
                              <p className="text-white/30 text-[10px] mt-0.5 truncate">
                                {MONTHS[entry.month - 1]} {orderDay(entry.day)}
                                {entry.age != null ? ` · Age ${entry.age}` : ''}
                                <span className="text-white/20"> · </span>
                                <span className="text-orange-light/60">{formatRelative(entry.nextTs)}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleForce(entry.userId)}
                              disabled={!channelSet || forcing === entry.userId}
                              title={channelSet ? 'Announce now' : 'Set an announcement channel first'}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-medium bg-orange/10 text-orange-warm hover:bg-orange/20 disabled:opacity-0 focus-visible:outline-none"
                            >
                              {forcing === entry.userId ? '…' : 'Announce'}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {upcomingTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-white/20 text-[10px]">
                        {upcomingPage * UPCOMING_PAGE_SIZE + 1}–
                        {Math.min((upcomingPage + 1) * UPCOMING_PAGE_SIZE, filteredList.length)} of{' '}
                        {filteredList.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setUpcomingPage((p) => Math.max(0, p - 1))}
                          disabled={upcomingPage === 0}
                          className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                        >
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {Array.from({ length: upcomingTotalPages }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setUpcomingPage(i)}
                            className={[
                              'w-5 h-5 rounded text-[10px] font-medium transition-colors',
                              i === upcomingPage
                                ? 'bg-orange/20 text-orange-warm'
                                : 'text-white/25 hover:text-white/60 hover:bg-white/5',
                            ].join(' ')}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setUpcomingPage((p) => Math.min(upcomingTotalPages - 1, p + 1))}
                          disabled={upcomingPage === upcomingTotalPages - 1}
                          className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                        >
                          <svg
                            className="w-3 h-3"
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

            <section className="rounded-2xl bg-bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                    Blacklist
                  </h2>
                  <p className="text-white/20 text-[10px] mt-0.5">
                    Members excluded from birthday announcements
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none"
                >
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Add user
                </button>
              </div>

              {blacklist.length > 0 && (
                <div className="relative mb-4">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search blacklisted users…"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/10 focus:border-orange/40 focus:ring-1 focus:ring-orange/30 outline-none text-xs text-white placeholder:text-white/25 pl-9 pr-3 py-2 transition-colors"
                  />
                </div>
              )}

              {blacklist.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/25 text-xs">No one is blacklisted yet.</p>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="mt-1.5 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors"
                  >
                    Add one →
                  </button>
                </div>
              ) : filteredBlacklist.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/25 text-xs">No blacklisted users match “{search.trim()}”.</p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {filteredBlacklist.map((userId) => (
                    <li key={userId} className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 bg-white/[0.03] group">
                      <UserBadge userId={userId} profile={profiles[userId]} className="flex-1 min-w-0" />
                      <button
                        type="button"
                        onClick={() => handleRemoveBlacklist(userId)}
                        disabled={blacklisting}
                        title="Remove from blacklist"
                        className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 focus-visible:outline-none flex-shrink-0"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
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
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex-1 min-w-0 space-y-5">
            <section className="rounded-2xl bg-bg-card p-6">
              <div className="mb-5">
                <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                  Announcement Channel & Role
                </h2>
                <p className="text-white/20 text-[10px] mt-0.5">
                  Where announcements are sent and the role given on birthdays
                </p>
              </div>
              {loading ? (
                <>
                  <SettingRowSkeleton controlWidth="w-48" />
                  <SettingRowSkeleton controlWidth="w-48" />
                </>
              ) : (
                <>
                  <div className="py-4 border-b border-white/5">
                    <p className="text-white/80 text-sm font-medium">Announcement Channel</p>
                    <p className="text-white/30 text-xs mt-0.5">Where birthday announcements are sent.</p>
                    <div className="mt-3 w-full">
                      <ChannelDropdown
                        channels={guildChannels}
                        value={data.birthdayChannel ?? ''}
                        onChangeAction={(id) => handleSave({ birthdayChannel: id || null })}
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="text-white/80 text-sm font-medium">Birthday Role</p>
                    <p className="text-white/30 text-xs mt-0.5">Role temporarily added on birthdays.</p>
                    <div className="mt-3 w-full">
                      <RolesDropdown
                        roles={guildRoles.map((r: any) => ({ id: String(r.id), name: String(r.name), color: Number(r.color ?? 0) }))}
                        value={data.birthdayRole ?? ''}
                        onChange={(id) => handleSave({ birthdayRole: id || null })}
                        placeholder="Select a role…"
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="rounded-2xl bg-bg-card p-6">
              <div className="mb-5">
                <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                  Announcement Message
                </h2>
                <p className="text-white/20 text-[10px] mt-0.5">
                  Custom text sent in chat. Empty uses the default embed.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-white/60 text-xs font-medium">With age</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => insertToken(withAgeRef, '{user}', setMsgWithAge)}
                        className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[11px] transition-colors focus-visible:outline-none"
                      >
                        + {'{user}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertToken(withAgeRef, '{age}', setMsgWithAge)}
                        className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[11px] transition-colors focus-visible:outline-none"
                      >
                        + {'{age}'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={withAgeRef}
                    value={msgWithAge}
                    onChange={(e) => setMsgWithAge(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={"Happy birthday {user}! You're turning {age} today."}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/10 focus:border-orange/40 focus:ring-1 focus:ring-orange/30 outline-none text-sm text-white placeholder:text-white/25 px-3 py-2.5 transition-colors resize-y"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-white/25 text-[10px]">{msgWithAge.length}/1000</span>
                    <div className="flex gap-2">
                      {msgWithAge.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setMsgWithAge('');
                            handleSaveMessage('birthdayMessageWithAge', '');
                          }}
                          disabled={saving}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 text-xs transition-colors disabled:opacity-40 focus-visible:outline-none"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSaveMessage('birthdayMessageWithAge', msgWithAge)}
                        disabled={saving || msgWithAge.trim() === (data.birthdayMessageWithAge ?? '')}
                        className="px-3 py-1 rounded-lg bg-orange/15 text-orange-warm hover:bg-orange/25 text-xs font-medium transition-colors disabled:opacity-40 focus-visible:outline-none"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-white/60 text-xs font-medium">Without age</label>
                    <button
                      type="button"
                      onClick={() => insertToken(noAgeRef, '{user}', setMsgNoAge)}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[11px] transition-colors focus-visible:outline-none"
                    >
                      + {'{user}'}
                    </button>
                  </div>
                  <textarea
                    ref={noAgeRef}
                    value={msgNoAge}
                    onChange={(e) => setMsgNoAge(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={'Happy birthday {user}! Enjoy your day.'}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/10 focus:border-orange/40 focus:ring-1 focus:ring-orange/30 outline-none text-sm text-white placeholder:text-white/25 px-3 py-2.5 transition-colors resize-y"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-white/25 text-[10px]">{msgNoAge.length}/1000</span>
                    <div className="flex gap-2">
                      {msgNoAge.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setMsgNoAge('');
                            handleSaveMessage('birthdayMessageNoAge', '');
                          }}
                          disabled={saving}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 text-xs transition-colors disabled:opacity-40 focus-visible:outline-none"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSaveMessage('birthdayMessageNoAge', msgNoAge)}
                        disabled={saving || msgNoAge.trim() === (data.birthdayMessageNoAge ?? '')}
                        className="px-3 py-1 rounded-lg bg-orange/15 text-orange-warm hover:bg-orange/25 text-xs font-medium transition-colors disabled:opacity-40 focus-visible:outline-none"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={blacklisting ? undefined : () => setAddOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#160a0a] border border-white/5 shadow-2xl">
            <div className="px-5 pt-4 pb-3 border-b border-white/5">
              <h2 className="text-white font-bold text-base">Blacklist user</h2>
              <p className="text-white/30 text-xs mt-0.5">
                Exclude them from birthday announcements in this server.
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5">User ID</label>
                <input
                  type="text"
                  value={idInput}
                  onChange={(e) => {
                    setIdInput(e.target.value);
                    if (idError) setIdError('');
                  }}
                  placeholder="e.g. 123456789012345678"
                  inputMode="numeric"
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 font-mono focus:outline-none focus:ring-2 focus:ring-orange/50"
                />
                {idError && (
                  <p className="text-red-400/90 text-xs mt-1.5">{idError}</p>
                )}
                <p className="text-white/25 text-[11px] mt-1.5">
                  Find it by right-clicking a user in Fluxer → Copy User ID (enable Developer Mode).
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  disabled={blacklisting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-white/60 hover:text-white/90 text-sm transition-colors disabled:opacity-40 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddById}
                  disabled={blacklisting || !idInput.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-bright disabled:opacity-50 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  {blacklisting ? 'Adding…' : 'Blacklist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}