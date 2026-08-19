'use client';
import { PollEntry, totalVotes, CreatePollModal, PollResultsModal, DeletePollModal } from './Modals';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels } from '@/lib/types';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PollRowSkeleton, Skeleton } from '@/components/ui/Skeletons';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { SettingRow } from '@/components/ui/SettingRow';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import { Toggle } from '@/components/ui/Toggle';
import Image from 'next/image';

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

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type: number, parentId: string }[];
}

export default function PollsClient({ user, guilds, activeGuildId, userGuild, initialData, guildChannels: guildChannelsProp = [] }: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? guildChannelsProp;

  const [polls, setPolls] = useState<PollEntry[]>(() =>
    ((data as any).activePolls ?? []).map(mapPoll)
  );
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<'create' | null>(null);
  const [viewPoll, setViewPoll] = useState<PollEntry | null>(null);
  const [deleteItem, setDeleteItem] = useState<PollEntry | null>(null);
  const [pollPerm, setPollPerm] = useState<boolean>(() => !!(data as any).pollPerm);

  useEffect(() => {
    if (saving) return;
    if (typeof (data as any).pollPerm === 'boolean') {
      setPollPerm((data as any).pollPerm);
    }
  }, [data, saving]);
  
  async function togglePollPerm(next: boolean) {
    setPollPerm(next);
    try {
      await save({ pollPerm: next } as any);
      showToast('Poll permissions', {
        description: next
          ? 'Anyone can create polls'
          : 'Only users with Manage Guild can create polls',
      });
    } catch {
      setPollPerm(!next);
      showErrorToast('Error', { description: 'Failed to update poll permission.' });
    }
  }
  
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

  const channelName = (id: string) => guildChannels.find((c: Channels) => c.id === id)?.name ?? id;
  const iconUrl = userGuild.icon ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64` : null;

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

        <div className="rounded-xl bg-bg-card px-6 py-1 mb-5">
          {loading ? (
            <div className="py-3.5">
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <SettingRow
              label="Allow members to create polls"
              description="When enabled, anyone can run the poll command. When disabled, only users with Manage Guild can."
            >
              <Toggle value={pollPerm} onChangeAction={togglePollPerm} disabled={saving} />
            </SettingRow>
          )}
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
          channels={guildChannels}
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
