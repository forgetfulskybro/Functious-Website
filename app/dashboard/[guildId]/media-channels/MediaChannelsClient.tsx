'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels } from '@/lib/types';
import { MediaChannelEntry, MediaChannelModal, DeleteMediaChannelModal } from './Modals';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import ItemActions from '@/components/ui/ItemActions';
import { useGuildData } from '@/hooks/useGuildData';
import { useDashboardToasts } from '@/hooks/useDashboardToasts';
import ChannelBadge from '@/components/ui/ChannelBadge';
import { useChannelProfiles } from '@/hooks/useChannelProfiles';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}

function mapEntries(raw: any[]): MediaChannelEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e: any) => ({
    channelId: String(e.channelId ?? ''),
    allowAttachments: e.allowAttachments ?? true,
    allowImages: e.allowImages ?? false,
    allowVideos: e.allowVideos ?? false,
    allowFiles: e.allowFiles ?? false,
    allowLinks: e.allowLinks ?? false,
    rating: e.rating ?? false,
    deleteThreshold: e.deleteThreshold ?? 0,
    sticky: e.sticky ?? false,
    stickyText: e.stickyText ?? null,
    threads: e.threads ?? false,
    desc: e.desc ?? false,
    stickyMessageId: e.stickyMessageId ?? null,
  }));
}

function allowedSummary(e: MediaChannelEntry): string {
  const parts = [
    e.allowAttachments && 'any attachment',
    !e.allowAttachments && e.allowImages && 'images',
    !e.allowAttachments && e.allowVideos && 'videos',
    !e.allowAttachments && e.allowFiles && 'files',
    e.allowLinks && 'links',
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'nothing';
}

function BadgePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/45">
      {label}
    </span>
  );
}

function RowSkeleton() {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
      <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
      <div className="ml-auto h-3 w-20 animate-pulse rounded bg-white/5" />
    </li>
  );
}

export default function MediaChannelsClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;

  const [entries, setEntries] = useState<MediaChannelEntry[]>(() =>
    mapEntries((data as any).mediaChannels || [])
  );
  const [channels, setChannels] = useState<Channels[]>(() =>
    (data as any).guildChannels ?? []
  );

  const [modal, setModal] = useState<'add' | MediaChannelEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<MediaChannelEntry | null>(null);

  const liveDeleteEntry = deleteEntry
    ? entries.find((e) => e.channelId === deleteEntry.channelId) ?? deleteEntry
    : null;

  useEffect(() => {
    if (saving) return;
    const raw = (data as any).mediaChannels;
    if (Array.isArray(raw)) setEntries(mapEntries(raw));
    const ch = (data as any).guildChannels;
    if (Array.isArray(ch)) setChannels(ch);
  }, [data, saving]);

  const handleSave = useCallback(
    async (updated: MediaChannelEntry[]): Promise<boolean> => {
      const previous = entries;
      setEntries(updated);
      try {
        await save({ mediaChannels: updated } as any);
        showToast('Media channels saved', {
          description: 'Your media channel settings have been updated.',
        });
        return true;
      } catch {
        setEntries(previous);
        showErrorToast('Error', { description: 'Failed to save media channels.' });
        return false;
      }
    },
    [entries, save]
  );

  useDashboardToasts(loading, error);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const channelProfiles = useChannelProfiles(
    entries.map((e) => e.channelId).filter((id): id is string => !!id),
    channels
  );

  return (
    <div className="flex min-h-screen bg-bg-dark">
      <Sidebar
        user={user}
        guilds={guilds}
        activeGuildId={activeGuildId}
        currentPage="dashboard"
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-8 flex items-center gap-4 border-b border-white/5 pb-5">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={userGuild.name ?? ''}
              width={40}
              height={40}
              className="rounded-xl"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/15 font-bold text-orange-warm">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Media Channels</h1>
            <p className="mt-0.5 text-xs text-white/40">{userGuild.name}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-orange/10 bg-orange/[0.04] px-4 py-3 text-xs text-white/50">
          Media channels delete messages that don&apos;t match the configured content
          types. You can optionally enable community rating (⬆️/⬇️ reactions) and a
          sticky reminder that re-posts itself after each new message.
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
                Configured Channels
              </h2>
              <p className="mt-0.5 text-[10px] text-white/20">
                {entries.length} channel{entries.length !== 1 ? 's' : ''}
              </p>
            </div>
            {!loading && (
              <button
                onClick={() => setModal('add')}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-orange/10 px-3 py-1.5 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/20 disabled:opacity-50"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Add Channel
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <RowSkeleton />
              <RowSkeleton />
            </ul>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/30">
                No media channels yet. Add one to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {entries.map(entry => (
                <li
                  key={entry.channelId}
                  className="group flex flex-col gap-2 rounded-xl bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <ChannelBadge
                      channelId={entry.channelId}
                      profile={channelProfiles[entry.channelId]}
                      className="text-white/80"
                    />
                    <p className="mt-0.5 text-xs text-white/30">
                      Allows: {allowedSummary(entry)}
                    </p>
                  </div>

                    <div className="flex flex-wrap gap-1.5">
                      {entry.rating && (
                        <BadgePill
                          label={
                            entry.deleteThreshold > 0
                              ? `rating · delete at −${entry.deleteThreshold}`
                              : 'rating'
                          }
                        />
                      )}
                      {entry.sticky && <BadgePill label="sticky" />}
                      {entry.threads && <BadgePill label={entry.desc ? 'threads · from text' : 'threads'} />}
                      {!entry.threads && entry.desc && <BadgePill label="post text" />}
                    </div>

                    <ItemActions
                      label="Media channel actions"
                      className="self-end sm:self-auto"
                      actions={[
                        {
                          label: 'Edit media channel',
                          icon: 'edit',
                          disabled: saving,
                          onSelect: () => setModal(entry),
                        },
                        {
                          label: 'Remove media channel',
                          icon: 'delete',
                          danger: true,
                          disabled: saving,
                          onSelect: () => setDeleteEntry(entry),
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
        <MediaChannelModal
          initial={modal === 'add' ? undefined : modal}
          existingChannelIds={entries
            .filter(e => modal === 'add' || e.channelId !== (modal as MediaChannelEntry).channelId)
            .map(e => e.channelId)}
          channels={channels}
          saving={saving}
          onSaveAction={async updatedEntry => {
            const newList =
              modal === 'add'
                ? [...entries, updatedEntry]
                : entries.map(e =>
                    e.channelId === updatedEntry.channelId ? updatedEntry : e
                  );
            if (await handleSave(newList)) setModal(null);
          }}
          onCloseAction={() => setModal(null)}
        />
      )}

      {liveDeleteEntry && (
        <DeleteMediaChannelModal
          entry={liveDeleteEntry}
          guildChannels={channels}
          saving={saving}
          onConfirmAction={async () => {
            if (
              await handleSave(entries.filter(e => e.channelId !== liveDeleteEntry.channelId))
            ) {
              setDeleteEntry(null);
            }
          }}
          onCloseAction={() => setDeleteEntry(null)}
        />
      )}
    </div>
  );
}
