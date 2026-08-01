'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useGuildData } from '@/hooks/useGuildData';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import { DateTimePicker, formatDt } from '@/components/ui/DateTimerPicker';

interface PollEntry {
  id: string;
  messageId?: string;
  channelId?: string;
  owner?: string;
  desc: string;
  options: { name: string[] };
  votes: number[];
  users: { user: string; option: number }[];
  time?: number;
  now?: number;
  ended?: boolean;
  lang?: string;
}

function mapPoll(p: any): PollEntry {
  const names: string[] = Array.isArray(p.options?.name)
    ? p.options.name
    : Array.isArray(p.options)
      ? p.options.map((o: any) => String(o.text ?? o.name ?? o))
      : [];

  let votes: number[];
  if (Array.isArray(p.votes)) {
    votes = p.votes.map(Number);
  } else if (p.votes && typeof p.votes === 'object') {
    votes = names.map((_, i) => Number((p.votes as Record<string, number>)[i] ?? 0));
  } else {
    votes = names.map(() => 0);
  }

  let users: { user: string; option: number }[] = [];
  if (Array.isArray(p.users)) {
    users = p.users.map((u: any) => ({ user: String(u.user ?? ''), option: Number(u.option ?? 0) }));
  } else if (p.users && typeof p.users === 'object') {
    users = Object.entries(p.users as Record<string, number>).map(([user, option]) => ({ user, option: Number(option) }));
  }

  return {
    id: String(p.messageId ?? p.id),
    messageId: p.messageId ? String(p.messageId) : undefined,
    channelId: p.channelId ? String(p.channelId) : undefined,
    owner: p.owner ? String(p.owner) : undefined,
    desc: String(p.desc ?? p.title ?? p.question ?? 'Untitled'),
    options: { name: names },
    votes,
    users,
    time: p.time,
    now: p.now,
    ended: Boolean(p.ended),
    lang: p.lang,
  };
}

function totalVotes(votes: number[]) {
  return votes.reduce((a, b) => a + b, 0);
}

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.floor((part / total) * 1000) / 10;
}


function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function PollRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03]">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}


function PollResultsModal({ poll, onClose }: { poll: PollEntry; onClose: () => void }) {
  const names = poll.options?.name ?? [];
  const votes = poll.votes ?? names.map(() => 0);
  const total = totalVotes(votes);
  const maxVotes = Math.max(0, ...votes);

  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const USERS_PER_PAGE = 5;

  const usersByOption = useMemo(() => {
    const map: Record<number, string[]> = {};
    names.forEach((_, i) => { map[i] = []; });
    for (const u of poll.users ?? []) {
      const idx = Number(u.option ?? 0);
      if (!map[idx]) map[idx] = [];
      map[idx].push(String(u.user ?? ''));
    }
    return map;
  }, [poll.users, names]);

  const tabUsers = usersByOption[activeTab] ?? [];
  const totalPages = Math.max(1, Math.ceil(tabUsers.length / USERS_PER_PAGE));
  const pagedUsers = tabUsers.slice(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE);

  function switchTab(idx: number) {
    setActiveTab(idx);
    setPage(0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#471B1B] shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-white font-semibold text-base truncate">{poll.desc}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-white/35 text-xs">{total} vote{total !== 1 ? 's' : ''}</p>
              {poll.owner && (
                <>
                  <span className="text-white/15 text-xs">·</span>
                  <p className="text-white/30 text-xs font-mono truncate max-w-[120px]" title={`Created by ${poll.owner}`}>
                    by {poll.owner}
                  </p>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-xl focus-visible:outline-none flex-shrink-0">✕</button>
        </div>

        <div className="px-3 pt-3 pb-2 space-y-1.5 shrink-0">
          {names.map((name, idx) => {
            const count = votes[idx] ?? 0;
            const percent = pct(count, total);
            const isLeading = total > 0 && count === maxVotes && count > 0;
            const fillWidth = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={idx} className={`relative flex items-center rounded-md overflow-hidden h-9 ${isLeading ? 'bg-orange' : 'bg-white/[0.06]'}`}>
                {!isLeading && fillWidth > 0 && (
                  <div className="absolute inset-y-0 left-0 bg-orange/40" style={{ width: `${fillWidth}%` }} />
                )}
                <div className="relative z-10 flex items-center w-full px-3 gap-2">
                  <span className={`text-xs tabular-nums w-4 shrink-0 ${isLeading ? 'text-white/80' : 'text-white/40'}`}>{idx + 1}</span>
                  <span className={`flex-1 text-sm truncate ${isLeading ? 'text-white font-medium' : 'text-white/80'}`}>
                    {name.length > 60 ? name.slice(0, 57) + '…' : name}
                  </span>
                  <span className={`text-xs tabular-nums shrink-0 ${isLeading ? 'text-white/90' : 'text-orange-warm'}`}>
                    {percent}% ({count})
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/5 shrink-0">
          <div className="flex overflow-x-auto scrollbar-none">
            {names.map((name, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => switchTab(idx)}
                className={[
                  'flex-shrink-0 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap focus-visible:outline-none',
                  activeTab === idx
                    ? 'border-orange text-orange-warm'
                    : 'border-transparent text-white/35 hover:text-white/60',
                ].join(' ')}
              >
                {name.length > 18 ? name.slice(0, 15) + '…' : name}
                <span className="ml-1 text-white/25">({(usersByOption[idx] ?? []).length})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
          {tabUsers.length === 0 ? (
            <p className="text-white/25 text-xs text-center py-5">No votes for this option yet.</p>
          ) : (
            <ul className="space-y-1">
              {pagedUsers.map((userId, i) => (
                <li key={userId + i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03]">
                  <div className="w-5 h-5 rounded-full bg-orange/15 flex items-center justify-center text-orange/60 text-[10px] font-bold flex-shrink-0">
                    {((page * USERS_PER_PAGE) + i + 1)}
                  </div>
                  <p className="text-white/60 text-xs font-mono truncate">{userId}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 shrink-0">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg text-white/30 hover:text-white/70 text-xs disabled:opacity-20 transition-colors focus-visible:outline-none"
            >
              ← Prev
            </button>
            <span className="text-white/25 text-xs tabular-nums">{page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded-lg text-white/30 hover:text-white/70 text-xs disabled:opacity-20 transition-colors focus-visible:outline-none"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function DeletePollModal({ poll, channelName, busy, onConfirm, onClose }: {
  poll: PollEntry;
  channelName?: string;
  busy?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isBusy = deleting || !!busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={isBusy ? undefined : onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <h2 className="text-white font-bold text-lg">Delete poll?</h2>
          <p className="text-white/30 text-xs mt-0.5">This will end the poll and remove the channel message.</p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-white/80 font-medium text-sm truncate">{poll.desc}</p>
            <p className="text-white/30 text-xs mt-0.5">
              {poll.options.name.length} options
              {channelName ? ` • #${channelName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={isBusy}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50">
            Cancel
          </button>
          <button type="button" disabled={isBusy}
            onClick={async () => { setDeleting(true); try { await onConfirm(); } finally { setDeleting(false); } }}
            className="flex-1 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl font-semibold disabled:opacity-50">
            {isBusy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function datetimeToDuration(dtStr: string): string | null {
  const endMs = new Date(dtStr).getTime();
  if (!Number.isFinite(endMs)) return null;
  const diffMs = endMs - Date.now();
  if (diffMs < 30_000) return null;

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return hours > 0 ? `${days}d${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
  if (minutes > 0) return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
  return `${seconds}s`;
}

function defaultEndTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return formatDt(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
}


function CreatePollModal({ channels, busy, onSave, onClose }: {
  channels: { id: string; name: string; type?: number }[];
  busy?: boolean;
  onSave: (payload: { channelId: string; question: string; duration: string; options: string[] }) => Promise<void>;
  onClose: () => void;
}) {
  const [channelId, setChannelId] = useState('');
  const [question, setQuestion] = useState('');
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const isBusy = submitting || !!busy;
  const optListRef = useRef<HTMLDivElement>(null);

  function setOption(i: number, val: string) {
    setOptions(prev => prev.map((o, x) => x === i ? val : o));
  }

  function addOption() {
    if (options.length >= 10) return;
    setOptions(prev => [...prev, '']);
    requestAnimationFrame(() => {
      optListRef.current?.scrollTo({ top: optListRef.current.scrollHeight, behavior: 'smooth' });
    });
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, x) => x !== i));
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (isBusy) return;

    const filled = options.map(o => o.trim()).filter(Boolean);
    if (filled.length < 2) {
      showErrorToast('Error', { description: 'Provide at least 2 options.' });
      return;
    }

    const duration = datetimeToDuration(endTime);
    if (!duration) {
      showErrorToast('Error', { description: 'End time must be at least 30 seconds from now.' });
      return;
    }

    setSubmitting(true);
    try {
      await onSave({ channelId, question: question.trim(), duration, options: filled });
    } finally {
      setSubmitting(false);
    }
  }

  const filledCount = options.filter(o => o.trim()).length;
  const canSubmit = !isBusy && !!channelId && question.trim().length > 0 && filledCount >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={isBusy ? undefined : onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B] shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Create Poll</h2>
            <p className="text-white/30 text-xs mt-0.5">The bot posts it in the selected channel</p>
          </div>
          <button type="button" onClick={onClose} disabled={isBusy}
            className="text-white/40 hover:text-white/80 text-xl disabled:opacity-50 focus-visible:outline-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Channel</label>
              <ChannelDropdown channels={channels} value={channelId} onChange={setChannelId} types={[0]} />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Question</label>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What should we do next?"
                maxLength={256}
                className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                required
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Ends at</label>
              <DateTimePicker value={endTime} onChangeAction={setEndTime} />
              <p className="text-white/20 text-[10px] mt-1.5">Min 30 seconds · Max 30 days from now</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/50 text-xs font-medium">
                  Options
                  <span className="text-white/25 ml-1">({options.length}/10)</span>
                </label>
                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors focus-visible:outline-none"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add option
                  </button>
                )}
              </div>

              <div
                ref={optListRef}
                className="space-y-2 overflow-y-auto pr-0.5"
                style={{ maxHeight: '198px' }}
              >
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-white/25 text-xs w-4 text-right flex-shrink-0 tabular-nums">{i + 1}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => setOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      maxLength={80}
                      className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-orange"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-0 disabled:pointer-events-none transition-colors focus-visible:outline-none"
                      aria-label="Remove option"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-white/5 shrink-0">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium text-sm disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit}
              className="flex-1 py-2.5 bg-orange hover:bg-orange-bright disabled:opacity-50 rounded-xl font-semibold text-white text-sm transition-colors">
              {isBusy ? 'Creating…' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type?: number }[];
}

export default function PollsClient({ user, guilds, activeGuildId, userGuild, initialData, guildChannels = [] }: Props) {
  const { guild, loading, error } = useGuildData(initialData.id);
  const data = guild ?? initialData;

  const [polls, setPolls] = useState<PollEntry[]>(() =>
    ((data as any).activePolls ?? []).map(mapPoll)
  );
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<'create' | null>(null);
  const [viewPoll, setViewPoll] = useState<PollEntry | null>(null);
  const [deleteItem, setDeleteItem] = useState<PollEntry | null>(null);

  useEffect(() => {
    const raw = (data as any).activePolls;
    if (Array.isArray(raw)) setPolls(raw.map(mapPoll));
  }, [data]);

  const shownLoading = useRef(false);
  const shownError   = useRef<string | null>(null);

  useEffect(() => {
    if (loading && !shownLoading.current) { shownLoading.current = true; }
    if (!loading) shownLoading.current = false;
  }, [loading]);

  useEffect(() => {
    if (error && error !== shownError.current) {
      shownError.current = error;
      showErrorToast('Error', { description: error });
    }
    if (!error) shownError.current = null;
  }, [error]);

  const createPoll = useCallback(async (payload: { channelId: string; question: string; duration: string; options: string[] }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/polls`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ownerId: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create poll');

      const created = mapPoll(json.poll);
      setPolls(prev => [...prev, created]);
      showToast('Poll created', { description: 'The poll has been posted in the channel.' });
      return true;
    } catch (e: any) {
      showErrorToast('Error', { description: e?.message || 'Failed to create poll.' });
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeGuildId, user.id]);

  const removePoll = useCallback(async (item: PollEntry) => {
    const messageId = item.messageId || item.id;
    setBusy(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/polls/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to delete poll');

      setPolls(prev => prev.filter(p => (p.messageId || p.id) !== messageId));
      showToast('Poll deleted', { description: 'The poll has been removed.' });
      return true;
    } catch (e: any) {
      showErrorToast('Error', { description: e?.message || 'Failed to delete poll.' });
      return false;
    } finally {
      setBusy(false);
    }
  }, [activeGuildId]);

  const channelName = (id: string) => guildChannels.find(c => c.id === id)?.name ?? id;
  const iconUrl = userGuild.icon ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64` : null;
  const textChannels = guildChannels.filter(c => c.type === 0 || c.type == null);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user} guilds={guilds} activeGuildId={activeGuildId} currentPage="dashboard" />

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 pb-5 border-b border-white/5">
          {iconUrl ? (
            <Image src={iconUrl} alt={userGuild.name ?? ''} width={40} height={40} className="rounded-xl" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange/15 flex items-center justify-center text-orange-warm font-bold">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Polls</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">Active Polls</h2>
              <p className="text-white/20 text-[10px] mt-0.5">Create, view results & delete polls</p>
            </div>
            {!loading && (
              <button
                onClick={() => setModal('create')}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                New Poll
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <PollRowSkeleton /><PollRowSkeleton /><PollRowSkeleton />
            </ul>
          ) : polls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">No active polls in this server.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {polls.map(poll => {
                const total = totalVotes(poll.votes);
                return (
                  <li key={poll.id} className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03] group">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{poll.desc}</p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {poll.options.name.length} options · {total} vote{total !== 1 ? 's' : ''}
                        {poll.channelId && ` · #${channelName(poll.channelId)}`}
                        {poll.ended && ' · Ended'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewPoll(poll)}
                        className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors" title="View results">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button onClick={() => setDeleteItem(poll)} disabled={busy}
                        className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50" title="Delete poll">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {modal === 'create' && (
        <CreatePollModal
          channels={textChannels}
          busy={busy}
          onSave={async payload => {
            const ok = await createPoll(payload);
            if (ok) setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {viewPoll && <PollResultsModal poll={viewPoll} onClose={() => setViewPoll(null)} />}

      {deleteItem && (
        <DeletePollModal
          poll={deleteItem}
          channelName={deleteItem.channelId ? channelName(deleteItem.channelId) : undefined}
          busy={busy}
          onConfirm={async () => {
            const ok = await removePoll(deleteItem);
            if (ok) setDeleteItem(null);
          }}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}
