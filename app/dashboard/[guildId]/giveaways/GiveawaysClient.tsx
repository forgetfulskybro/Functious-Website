'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useGuildData } from '@/hooks/useGuildData';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import { DateTimePicker, formatDt } from '@/components/ui/DateTimerPicker';

interface GiveawayEntry {
  id: string;
  messageId?: string;
  channelId?: string;
  owner?: string;
  prize: string;
  winners: number;
  pickedWinners?: any[];
  users?: any[];
  time?: string | number;
  now?: string | number;
  endDate?: string;
  requirement?: string | null;
  lang?: string;
  ended?: boolean;
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type?: number }[];
}

function endTimeToDuration(timestampStr: string): string | null {
  const endMs = new Date(timestampStr).getTime();
  if (!Number.isFinite(endMs)) return null;

  const diffMs = endMs - Date.now();
  if (diffMs < 120_000) return null;

  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes < 1) return null;

  if (totalMinutes % (60 * 24) === 0) return `${totalMinutes / (60 * 24)}d`;
  if (totalMinutes % 60 === 0) return `${totalMinutes / 60}h`;
  return `${totalMinutes}m`;
}

function defaultEndTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return formatDt(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes()
  );
}

function mapGiveaways(raw: any[]): GiveawayEntry[] {
  return (raw || []).map((g: any) => ({
    id: String(g.messageId ?? g.id),
    messageId: g.messageId ? String(g.messageId) : undefined,
    channelId: g.channelId ? String(g.channelId) : undefined,
    owner: g.owner ? String(g.owner) : undefined,
    prize: String(g.prize ?? 'Unknown Prize'),
    winners: Number(g.winners) || 1,
    pickedWinners: Array.isArray(g.pickedWinners) ? g.pickedWinners : [],
    users: Array.isArray(g.users) ? g.users : [],
    time: g.time,
    now: g.now,
    endDate: g.endDate,
    requirement: g.requirement,
    lang: g.lang,
    ended: Boolean(g.ended),
  }));
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function GiveawayRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03]">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export default function GiveawaysClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
  guildChannels = [],
}: Props) {
  const { guild, loading, error } = useGuildData(initialData.id);
  const data = guild ?? initialData;

  const [giveaways, setGiveaways] = useState<GiveawayEntry[]>(() =>
    mapGiveaways((data as any).activeGiveaways || [])
  );
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<'create' | null>(null);
  const [viewGiveaway, setViewGiveaway] = useState<GiveawayEntry | null>(null);
  const [deleteItem, setDeleteItem] = useState<GiveawayEntry | null>(null);

  useEffect(() => {
    const raw = (data as any).activeGiveaways;
    if (Array.isArray(raw)) setGiveaways(mapGiveaways(raw));
  }, [data]);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const channelName = (id: string) =>
    guildChannels.find((c) => c.id === id)?.name ?? id;

  const createGiveaway = useCallback(
    async (payload: {
      channelId: string;
      prize: string;
      winners: number;
      duration: string;
      requirement?: string;
    }) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/bot/guilds/${activeGuildId}/giveaways`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, ownerId: user.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create');

        const created = mapGiveaways([json.giveaway])[0];
        setGiveaways((prev) => [...prev, created]);
        showToast('Giveaway created', {
          description: 'The giveaway has been posted in the channel.',
        });
        return true;
      } catch (e: any) {
        showErrorToast('Error', {
          description: e?.message || 'Failed to create giveaway.',
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [activeGuildId, user.id]
  );

  const removeGiveaway = useCallback(
    async (item: GiveawayEntry) => {
      const messageId = item.messageId || item.id;
      setBusy(true);
      try {
        const res = await fetch(
          `/api/bot/guilds/${activeGuildId}/giveaways/${messageId}`,
          { method: 'DELETE' }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Failed to delete');

        setGiveaways((prev) =>
          prev.filter((g) => (g.messageId || g.id) !== messageId)
        );
        showToast('Giveaway deleted', {
          description: 'The giveaway was removed.',
        });
        return true;
      } catch (e: any) {
        showErrorToast('Error', {
          description: e?.message || 'Failed to delete giveaway.',
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [activeGuildId]
  );

  const shownLoading = useRef(false);
  const shownError = useRef<string | null>(null);

  useEffect(() => {
    if (loading && !shownLoading.current) {
      shownLoading.current = true;
      showToast('Loading', { description: 'Loading data...' });
    }
    if (!loading) shownLoading.current = false;
  }, [loading]);

  useEffect(() => {
    if (error && error !== shownError.current) {
      shownError.current = error;
      showErrorToast('Error', { description: error });
    }
    if (!error) shownError.current = null;
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar
        user={user}
        guilds={guilds}
        activeGuildId={activeGuildId}
        currentPage="dashboard"
      />
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 pb-5 border-b border-white/5">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={userGuild.name ?? ''}
              width={40}
              height={40}
              className="rounded-xl"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange/15 flex items-center justify-center text-orange-warm font-bold">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Giveaways</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                Active Giveaways
              </h2>
              <p className="text-white/20 text-[10px] mt-0.5">
                Create, view & delete giveaways
              </p>
            </div>
            {!loading && (
              <button
                onClick={() => setModal('create')}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New Giveaway
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <GiveawayRowSkeleton />
              <GiveawayRowSkeleton />
              <GiveawayRowSkeleton />
            </ul>
          ) : giveaways.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">No active giveaways.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {giveaways.map((gw) => (
                <li
                  key={gw.messageId || gw.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03] group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 font-medium truncate">{gw.prize}</p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {gw.winners} winner{gw.winners > 1 ? 's' : ''} •{' '}
                      {gw.users?.length ?? 0} participant
                      {(gw.users?.length ?? 0) !== 1 ? 's' : ''}
                      {gw.channelId && ` • #${channelName(gw.channelId)}`}
                      {gw.ended && ' • Ended'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewGiveaway(gw)}
                      className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5"
                      title="View"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteItem(gw)}
                      disabled={busy}
                      className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {modal === 'create' && (
        <CreateGiveawayModal
          channels={guildChannels.filter((c) => c.type === 0 || c.type == null)}
          busy={busy}
          onSave={async (payload) => {
            const ok = await createGiveaway(payload);
            if (ok) setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {viewGiveaway && (
        <GiveawayDetailsModal
          giveaway={viewGiveaway}
          channelName={
            viewGiveaway.channelId
              ? channelName(viewGiveaway.channelId)
              : undefined
          }
          onClose={() => setViewGiveaway(null)}
        />
      )}

      {deleteItem && (
        <DeleteGiveawayModal
          giveaway={deleteItem}
          channelName={
            deleteItem.channelId ? channelName(deleteItem.channelId) : undefined
          }
          busy={busy}
          onConfirm={async () => {
            const ok = await removeGiveaway(deleteItem);
            if (ok) setDeleteItem(null);
          }}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}

function CreateGiveawayModal({
  channels,
  busy,
  onSave,
  onClose,
}: {
  channels: { id: string; name: string; type?: number }[];
  busy?: boolean;
  onSave: (payload: {
    channelId: string;
    prize: string;
    winners: number;
    duration: string;
    requirement?: string;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const [channelId, setChannelId] = useState('');
  const [prize, setPrize] = useState('');
  const [winners, setWinners] = useState(1);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [requirement, setRequirement] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !prize.trim() || winners < 1) return;
    if (submitting || busy) return;

    const duration = endTimeToDuration(endTime);
    if (!duration) {
      showErrorToast('Error', {
        description: 'Please choose an end time at least 2 minutes from now.',
      });
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        channelId,
        prize: prize.trim().slice(0, 500),
        winners: Math.min(50, Math.max(1, winners)),
        duration,
        requirement: requirement.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || !!busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl overflow-visible">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <div>
            <h2 className="text-white font-bold text-lg">Create New Giveaway</h2>
            <p className="text-white/30 text-xs mt-0.5">
              The bot will post it in the selected channel
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="text-white/40 hover:text-white text-xl disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Channel
            </label>
            <ChannelDropdown
              channels={channels}
              value={channelId}
              onChange={setChannelId}
              types={[0]}
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Prize
            </label>
            <input
              type="text"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="Fluxer Plutonium / $50 Steam Gift Card"
              maxLength={500}
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
              required
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Number of Winners
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={winners}
              onChange={(e) =>
                setWinners(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
              }
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange"
              required
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Ends at
            </label>
            <DateTimePicker value={endTime} onChangeAction={setEndTime} />
            <p className="text-white/25 text-[10px] mt-1.5">
              Must be at least 2 minutes from now
            </p>
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Requirement (optional)
            </label>
            <input
              type="text"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="Must boost the server"
              maxLength={500}
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelId || !prize.trim() || !endTime || isBusy}
              className="flex-1 py-3 bg-orange hover:bg-orange-bright disabled:opacity-50 rounded-xl font-semibold text-white"
            >
              {isBusy ? 'Creating…' : 'Create Giveaway'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteGiveawayModal({
  giveaway,
  channelName,
  busy,
  onConfirm,
  onClose,
}: {
  giveaway: GiveawayEntry;
  channelName?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isBusy = deleting || !!busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <h2 className="text-white font-bold text-lg">Delete giveaway?</h2>
          <p className="text-white/30 text-xs mt-0.5">
            Ends the giveaway and removes the channel message.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-white/80 font-medium text-sm truncate">
              {giveaway.prize}
            </p>
            <p className="text-white/30 text-xs mt-0.5">
              {giveaway.winners} winner{giveaway.winners > 1 ? 's' : ''}
              {channelName ? ` • #${channelName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={async () => {
              setDeleting(true);
              try {
                await onConfirm();
              } finally {
                setDeleting(false);
              }
            }}
            className="flex-1 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl font-semibold disabled:opacity-50"
          >
            {isBusy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GiveawayDetailsModal({
  giveaway,
  channelName,
  onClose,
}: {
  giveaway: GiveawayEntry;
  channelName?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <h2 className="text-white font-bold text-lg">Giveaway Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <p className="text-white/40 text-xs">Prize</p>
            <p className="text-white text-lg font-medium">{giveaway.prize}</p>
          </div>

          {giveaway.owner && (
            <div>
              <p className="text-white/40 text-xs">Hosted by</p>
              <p className="font-mono text-orange-warm text-sm">{giveaway.owner}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs">Winners</p>
              <p className="text-white text-lg">{giveaway.winners}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Participants</p>
              <p className="text-white text-lg">{giveaway.users?.length ?? 0}</p>
            </div>
          </div>

          {giveaway.requirement && (
            <div>
              <p className="text-white/40 text-xs">Requirement</p>
              <p className="text-white text-sm">{giveaway.requirement}</p>
            </div>
          )}

          {(channelName || giveaway.channelId) && (
            <div>
              <p className="text-white/40 text-xs">Channel</p>
              <p className="text-white">#{channelName || giveaway.channelId}</p>
            </div>
          )}

          {giveaway.messageId && (
            <div>
              <p className="text-white/40 text-xs">Message ID</p>
              <p className="font-mono text-white/60 text-xs">{giveaway.messageId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}