'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels } from '@/lib/types';
import { MediaChannelEntry, MediaChannelModal, DeleteMediaChannelModal } from './Modals';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useGuildData } from '@/hooks/useGuildData';
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

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  function channelName(id: string): string {
    return channels.find(c => c.id === id)?.name ?? id;
  }

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
              {entries.map(entry => {
                const name = channelName(entry.channelId);
                return (
                  <li
                    key={entry.channelId}
                    className="group flex flex-col gap-2 rounded-xl bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white/80">
                        <span className="text-white/35">#</span> {name}
                      </p>
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
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        title="Edit"
                        disabled={saving}
                        onClick={() => setModal(entry)}
                        className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/70 disabled:opacity-50"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        disabled={saving}
                        onClick={() => setDeleteEntry(entry)}
                        className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <svg
                          className="h-3.5 w-3.5"
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
                    </div>
                  </li>
                );
              })}
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

      {deleteEntry && (
        <DeleteMediaChannelModal
          entry={deleteEntry}
          channelName={channelName(deleteEntry.channelId)}
          saving={saving}
          onConfirmAction={async () => {
            if (
              await handleSave(entries.filter(e => e.channelId !== deleteEntry.channelId))
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
