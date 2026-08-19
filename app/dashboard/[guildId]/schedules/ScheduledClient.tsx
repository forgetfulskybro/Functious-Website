'use client';
import { ScheduleModal, ViewModal, ScheduledEntry, DeleteConfirmModal } from './Modals';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels } from '@/lib/types';
import { formatTimestamp } from '@/components/ui/DateTimerPicker';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleRowSkeleton } from '@/components/ui/Skeletons';

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
}

function mapScheduled(raw: any[]): ScheduledEntry[] {
  return (raw || []).map((s: any) => ({
    id: s.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: s.type || 'content',
    channelId: s.channelId,
    timestamp: Number(s.timestamp),
    content: s.content ?? null,
    embedData: s.embedData ?? null,
    commandName: s.commandName,
    commandArgs: s.commandArgs,
    recurring: s.recurring || 'none',
    webhook: s.webhook ?? null,
    createdBy: s.createdBy,
    createdAt: s.createdAt,
    sendCount: s.sendCount ?? 1,
  }));
}

export default function ScheduledClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? [];

  const [scheduled, setScheduled] = useState<ScheduledEntry[]>(() =>
    mapScheduled((data as any).scheduledMessages || [])
  );

  useEffect(() => {
    if (saving) return;
    const raw = (data as any).scheduledMessages;
    if (Array.isArray(raw)) {
      setScheduled(mapScheduled(raw));
    }
  }, [data, saving]);

  const [modal, setModal] = useState<'create' | ScheduledEntry | null>(null);
  const [viewItem, setViewItem] = useState<ScheduledEntry | null>(null);
  const [deleteItem, setDeleteItem] = useState<ScheduledEntry | null>(null);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const handleSave = useCallback(
    async (newList: ScheduledEntry[]): Promise<boolean> => {
      const previous = scheduled;
      setScheduled(newList);

      try {
        await save({ scheduledMessages: newList } as any);
        showToast('Schedule updated', {
          description: 'Your scheduled messages have been saved.',
        });
        return true;
      } catch (err) {
        setScheduled(previous);
        showErrorToast('Error', {
          description: 'Failed saving scheduled messages.',
        });
        return false;
      }
    },
    [scheduled, save]
  );

  const channelName = (id: string) =>
    guildChannels.find((c: Channels) => c.id === id)?.name ?? id;

  const shownLoading = useRef(false);
  const shownError = useRef<string | null>(null);

  useEffect(() => {
    if (loading && !shownLoading.current) {
      shownLoading.current = true;
      showToast('Loading', { description: 'Loading data...' });
    }
    if (!loading) {
      shownLoading.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (error && error !== shownError.current) {
      shownError.current = error;
      showErrorToast('Error', { description: error });
    }
    if (!error) {
      shownError.current = null;
    }
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
            <h1 className="text-xl font-extrabold text-white">Scheduled Messages</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                Scheduled Messages
              </h2>
              <p className="text-white/20 text-[10px] mt-0.5">Create, edit, view & delete</p>
            </div>
            {!loading && (
              <button
                onClick={() => setModal('create')}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New Schedule
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <ScheduleRowSkeleton />
              <ScheduleRowSkeleton />
              <ScheduleRowSkeleton />
            </ul>
          ) : scheduled.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">No scheduled messages yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {scheduled.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl px-4 py-3 bg-white/[0.03] group flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 font-medium truncate">
                      {item.type === 'command' && item.commandName
                        ? item.commandName.toUpperCase()
                        : item.type.toUpperCase()}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {formatTimestamp(item.timestamp)} • #{channelName(item.channelId)}
                      {item.recurring && item.recurring !== 'none' && ` • ${item.recurring}`}
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
          )}
        </section>
      </main>

      {modal && (
        <ScheduleModal
          initial={modal === 'create' ? undefined : modal}
          channels={guildChannels}
          userId={user.id}
          saving={saving}
          onSave={async (updated) => {
            const newList =
              modal === 'create'
                ? [...scheduled, updated]
                : scheduled.map((s) => (s.id === updated.id ? updated : s));

            const ok = await handleSave(newList);
            if (ok) setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {viewItem && (
        <ViewModal
          item={viewItem}
          channelName={channelName(viewItem.channelId)}
          prefix={(data as any).prefix || 'f!'}
          onClose={() => setViewItem(null)}
        />
      )}

      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          channelName={channelName(deleteItem.channelId)}
          saving={saving}
          onConfirm={async () => {
            const ok = await handleSave(
              scheduled.filter((s) => s.id !== deleteItem.id)
            );
            if (ok) setDeleteItem(null);
          }}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}
