'use client';
import { ScheduleModal, ViewModal, ScheduledEntry, DeleteConfirmModal } from './Modals';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { formatTimestamp } from '@/components/ui/DateTimerPicker';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import ItemActions from '@/components/ui/ItemActions';
import ChannelBadge from '@/components/ui/ChannelBadge';
import { useChannelProfiles } from '@/hooks/useChannelProfiles';
import { useState, useEffect, useCallback } from 'react';
import { ScheduleRowSkeleton } from '@/components/ui/Skeletons';

import { useGuildData } from '@/hooks/useGuildData';
import { useDashboardToasts } from '@/hooks/useDashboardToasts';
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

  const liveViewItem = viewItem
    ? scheduled.find((s) => s.id === viewItem.id) ?? viewItem
    : null;
  const liveDeleteItem = deleteItem
    ? scheduled.find((s) => s.id === deleteItem.id) ?? deleteItem
    : null;

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

  const channelProfiles = useChannelProfiles(
    scheduled.map((s) => s.channelId).filter((id): id is string => !!id),
    guildChannels
  );

  useDashboardToasts(loading, error);

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
                      {formatTimestamp(item.timestamp)} •{' '}
                      <ChannelBadge
                        channelId={item.channelId}
                        profile={channelProfiles[item.channelId]}
                        inline
                      />
                      {item.recurring && item.recurring !== 'none' && ` • ${item.recurring}`}
                    </p>
                  </div>

                  <ItemActions
                    label="Schedule actions"
                    actions={[
                      { label: 'View schedule', icon: 'view', onSelect: () => setViewItem(item) },
                      {
                        label: 'Edit schedule',
                        icon: 'edit',
                        disabled: saving,
                        onSelect: () => setModal(item),
                      },
                      {
                        label: 'Delete schedule',
                        icon: 'delete',
                        danger: true,
                        disabled: saving,
                        onSelect: () => setDeleteItem(item),
                      },
                    ]}
                  />
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

      {liveViewItem && (
        <ViewModal
          item={liveViewItem}
          prefix={(data as any).prefix || 'f!'}
          guildChannels={guildChannels}
          onClose={() => setViewItem(null)}
        />
      )}

      {liveDeleteItem && (
        <DeleteConfirmModal
          item={liveDeleteItem}
          guildChannels={guildChannels}
          saving={saving}
          onConfirm={async () => {
            const ok = await handleSave(
              scheduled.filter((s) => s.id !== liveDeleteItem.id)
            );
            if (ok) setDeleteItem(null);
          }}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}
