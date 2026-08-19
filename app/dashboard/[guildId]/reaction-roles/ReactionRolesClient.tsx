'use client';

import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels, Roles } from '@/lib/types';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { Skeleton, RowSkeleton } from '@/components/ui/Skeletons';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SettingRow } from '@/components/ui/SettingRow';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import { Toggle } from '@/components/ui/Toggle';
import Image from 'next/image';
import { ReactionRoleModal, ReactionRoleEntry, invalidateCachedMessage, ViewModal, DeleteConfirmModal } from './Modals';
import { Pagination } from '@/components/ui/Pagination';

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type: number; parentId: string }[];
  guildRoles?: { id: string; name: string; color?: number }[];
}

const ENTRIES_PER_PAGE = 5;

export default function ReactionRolesClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? [];
  const guildRoles = (data as any).guildRoles ?? [];
  const guildEmojis = (data as any).emojis ?? [];

  const [entries, setEntries] = useState<ReactionRoleEntry[]>(() =>
    Array.isArray((data as any).roles) ? (data as any).roles : []
  );
  const [dmEnabled, setDmEnabled] = useState<boolean>(() => !!(data as any).dm);
  const [listPage, setListPage] = useState(0);

  useEffect(() => {
    if (saving) return;
    if (Array.isArray((data as any).roles)) setEntries((data as any).roles);
    if (typeof (data as any).dm === 'boolean') setDmEnabled((data as any).dm);
  }, [data, saving]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(entries.length / ENTRIES_PER_PAGE));
    if (listPage > totalPages - 1) setListPage(totalPages - 1);
  }, [entries.length, listPage]);

  const [modal, setModal] = useState<'create' | ReactionRoleEntry | null>(null);
  const [viewItem, setViewItem] = useState<ReactionRoleEntry | null>(null);
  const [deleteItem, setDeleteItem] = useState<ReactionRoleEntry | null>(null);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const channelName = (id: string) =>
    guildChannels.find((c: Channels) => c.id === id)?.name ?? id;

  const roleName = (id: string) =>
    guildRoles.find((r: Roles) => r.id === id)?.name ?? id;

  const handleSaveList = useCallback(
    async (newList: ReactionRoleEntry[]): Promise<boolean> => {
      const previous = entries;
      setEntries(newList);
      try {
        await save({ roles: newList } as any);
        showToast('Reaction roles updated', {
          description: 'Your reaction role messages have been saved.',
        });
        return true;
      } catch {
        setEntries(previous);
        showErrorToast('Error', { description: 'Failed to save reaction roles.' });
        return false;
      }
    },
    [entries, save]
  );

  async function toggleDm(next: boolean) {
    setDmEnabled(next);
    try {
      await save({ dm: next } as any);
      showToast('DM notifications', {
        description: next ? 'Enabled' : 'Disabled',
      });
    } catch {
      setDmEnabled(!next);
      showErrorToast('Error', { description: 'Failed to update DM setting.' });
    }
  }

  async function toggleExclusive(item: ReactionRoleEntry) {
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/reactionroles/${item.msgId}/exclusive`,
        { method: 'POST', credentials: 'include' }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to toggle exclusive');
      }
      const data = await res.json();
      setEntries((prev) =>
        prev.map((e) => (e.msgId === item.msgId ? { ...e, exclusive: data.entry.exclusive } : e))
      );
      if (viewItem?.msgId === item.msgId) {
        setViewItem((v) => (v ? { ...v, exclusive: data.entry.exclusive } : v));
      }
      showToast('Exclusive updated', {
        description: data.exclusive ? 'Only one role at a time' : 'Multiple roles allowed',
      });
    } catch (err: any) {
      showErrorToast('Error', { description: err?.message || 'Could not toggle exclusive.' });
    }
  }

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

  const listTotalPages = Math.max(1, Math.ceil(entries.length / ENTRIES_PER_PAGE));
  const listSlice = entries.slice(
    listPage * ENTRIES_PER_PAGE,
    listPage * ENTRIES_PER_PAGE + ENTRIES_PER_PAGE
  );

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
            <h1 className="text-xl font-extrabold text-white">Reaction Roles</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <div className="rounded-xl bg-bg-card px-6 py-1 mb-5">
          {loading ? (
            <div className="py-3.5"><Skeleton className="h-5 w-full" /></div>
          ) : (
            <SettingRow
              label="DM on role add/remove"
              description="Send a private message to the member when they gain or lose a reaction role."
            >
              <Toggle value={dmEnabled} onChangeAction={toggleDm} disabled={saving} />
            </SettingRow>
          )}
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                Reaction Role Messages
              </h2>
              <p className="text-white/20 text-[10px] mt-0.5">Create, edit, view & delete • max 13</p>
            </div>
            {!loading && (
              <button
                onClick={() => setModal('create')}
                disabled={saving || entries.length >= 13}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New Message
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </ul>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">No reaction role messages yet.</p>
              <button
                type="button"
                onClick={() => setModal('create')}
                className="mt-2 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors"
              >
                Create one →
              </button>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {listSlice.map((item) => (
                  <li
                    key={item.msgId}
                    className="rounded-xl px-4 py-3 bg-white/[0.03] group flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 font-medium truncate">
                        {item.roles.length} role{item.roles.length !== 1 ? 's' : ''}
                        {item.exclusive ? ' • Exclusive' : ''}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5 truncate">
                        #{channelName(item.chanId)} •{' '}
                        <a
                          href={`https://fluxer.app/channels/${activeGuildId}/${item.chanId}/${item.msgId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-orange-warm/80"
                        >
                          Jump to message
                        </a>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewItem(item)}
                        className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5"
                        title="View"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setModal(item)}
                        disabled={saving}
                        className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 disabled:opacity-50"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteItem(item)}
                        disabled={saving}
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

              <div className="mt-3">
                <Pagination
                  page={listPage}
                  totalPages={listTotalPages}
                  total={entries.length}
                  pageSize={ENTRIES_PER_PAGE}
                  onChange={setListPage}
                />
              </div>
            </>
          )}
        </section>
      </main>

      {modal && (
        <ReactionRoleModal
          initial={modal === 'create' ? undefined : modal}
          emojis={guildEmojis}
          channels={guildChannels}
          roles={guildRoles}
          saving={saving}
          guildId={activeGuildId}
          onSaved={(updated) => {
            const newList =
              modal === 'create'
                ? [...entries, updated]
                : entries.map((e) => (e.msgId === updated.msgId ? updated : e));
            setEntries(newList);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {viewItem && (
        <ViewModal
          item={viewItem}
          channelName={channelName(viewItem.chanId)}
          roleName={roleName}
          onToggleExclusive={() => toggleExclusive(viewItem)}
          onClose={() => setViewItem(null)}
        />
      )}

      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          channelName={channelName(deleteItem.chanId)}
          saving={saving}
          onConfirm={async () => {
            try {
              const res = await fetch(
                `/api/bot/guilds/${activeGuildId}/reactionroles/${deleteItem.msgId}/delete`,
                { method: 'DELETE', credentials: 'include' }
              );
              if (!res.ok) throw new Error('Delete failed');
              const ok = await handleSaveList(entries.filter((e) => e.msgId !== deleteItem.msgId));
              if (ok) setDeleteItem(null);
              invalidateCachedMessage(activeGuildId, deleteItem.msgId);
            } catch {
              showErrorToast('Error', { description: 'Failed to delete reaction role message.' });
            }
          }}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}