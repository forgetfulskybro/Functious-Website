'use client';
import { GiveawayEntry, GiveawayDetailsModal, CreateGiveawayModal, DeleteGiveawayModal } from './Modals';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels } from '@/lib/types';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useState, useEffect, useRef, useCallback } from 'react';
import { GiveawayRowSkeleton } from '@/components/ui/Skeletons';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type: number; parentId: string }[];
  guildRoles?: { id: string; name: string }[];
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
    dmWinners: Boolean(g.dmWinners),
    pingWinners: g.pingWinners !== false,
    allowMultipleWins: Boolean(g.allowMultipleWins),
    imageUrl: g.imageUrl ?? null,
    bonusEntries: Array.isArray(g.bonusEntries) ? g.bonusEntries : [],
  }));
}

export default function GiveawaysClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
  guildChannels: guildChannelsProp = [],
  guildRoles: guildRolesProp = [],
}: Props) {
  const { guild, loading, error } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? guildChannelsProp;
  const guildRoles = (data as any).guildRoles ?? guildRolesProp;

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
    guildChannels.find((c: Channels) => c.id === id)?.name ?? id;

  const createGiveaway = useCallback(
    async (payload: {
      channelId: string;
      prize: string;
      winners: number;
      duration: string;
      requirement?: string;
      dmWinners?: boolean;
      pingWinners?: boolean;
      allowMultipleWins?: boolean;
      imageUrl?: string;
      bonusEntries?: { roleId: string; entries: number }[];
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
          channels={guildChannels.filter((c: Channels) => c.type === 0 || c.type === 4)}
          guildRoles={guildRoles}
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