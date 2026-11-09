'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import type {
  DashboardGuild,
  FluxerGuild,
  FluxerUser,
  GuildData,
  StickyEmbedData,
  StickyEntry,
} from '@/lib/types';
import { useGuildData } from '@/hooks/useGuildData';
import { useDashboardToasts } from '@/hooks/useDashboardToasts';
import { useChannelProfiles } from '@/hooks/useChannelProfiles';
import Sidebar from '@/components/layout/Sidebar';
import ChannelBadge from '@/components/ui/ChannelBadge';
import ItemActions from '@/components/ui/ItemActions';
import { Toggle } from '@/components/ui/Toggle';
import { RowSkeleton } from '@/components/ui/Skeletons';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { StickyModal, DeleteStickyModal } from './Modals';

const MAX_STICKIES = 10;

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}

function mapStickies(raw: unknown): StickyEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((entry: any) => {
    const type: StickyEntry['type'] =
      entry?.type === 'embed' || entry?.type === 'script' ? entry.type : 'content';
    const createdAt = Number(entry?.createdAt);
    const updatedAt = Number(entry?.updatedAt);

    return {
      id: String(entry?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      channelId: String(entry?.channelId ?? ''),
      type,
      content: typeof entry?.content === 'string' ? entry.content : null,
      embedData: entry?.embedData && typeof entry.embedData === 'object'
        ? (entry.embedData as StickyEmbedData)
        : null,
      enabled: entry?.enabled !== false,
      stickyMessageId: entry?.stickyMessageId ?? null,
      createdBy: entry?.createdBy,
      createdAt: Number.isFinite(createdAt) && createdAt > 0 ? createdAt : Date.now(),
      updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : undefined,
      sendCount: Number(entry?.sendCount) || 0,
      lastSentAt: entry?.lastSentAt ?? null,
      repostDelayMs: Number(entry?.repostDelayMs) || 2500,
      mentionPolicy:
        entry?.mentionPolicy === 'users' ||
        entry?.mentionPolicy === 'roles' ||
        entry?.mentionPolicy === 'everyone'
          ? entry.mentionPolicy
          : 'none',
    };
  });
}

function typeLabel(type: StickyEntry['type']) {
  if (type === 'embed') return 'Embed';
  if (type === 'script') return 'Rune Script';
  return 'Message';
}

function previewOf(sticky: StickyEntry) {
  const raw =
    sticky.type === 'embed'
      ? sticky.embedData?.title || sticky.embedData?.description || 'Empty embed'
      : sticky.type === 'script'
        ? (sticky.content || '').split('\n')[0] || 'Empty script'
        : sticky.content || 'Empty message';

  return String(raw).replace(/\s+/g, ' ').slice(0, 110);
}

export default function StickiesClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? [];

  const [stickies, setStickies] = useState<StickyEntry[]>(() =>
    mapStickies((data as any).stickies)
  );
  const [modal, setModal] = useState<'create' | StickyEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<StickyEntry | null>(null);

  useEffect(() => {
    if (saving) return;
    const raw = (data as any).stickies;
    if (Array.isArray(raw)) setStickies(mapStickies(raw));
  }, [data, saving]);

  const liveDeleteEntry = deleteEntry
    ? stickies.find((entry) => entry.id === deleteEntry.id) ?? deleteEntry
    : null;

  const handleSave = useCallback(
    async (next: StickyEntry[]): Promise<boolean> => {
      const duplicate = next.find(
        (entry, index) =>
          next.findIndex((other) => other.channelId === entry.channelId) !== index
      );
      if (duplicate) {
        showErrorToast('Error', {
          description: 'Each channel can only have one sticky message.',
        });
        return false;
      }

      const previous = stickies;
      setStickies(next);

      try {
        await save({ stickies: next } as any);
        showToast('Sticky messages updated', {
          description: 'Your changes have been saved.',
        });
        return true;
      } catch {
        setStickies(previous);
        showErrorToast('Error', {
          description: 'Failed to save sticky messages.',
        });
        return false;
      }
    },
    [stickies, save]
  );

  const handleToggle = useCallback(
    async (entry: StickyEntry, enabled: boolean) => {
      const next = stickies.map((sticky) =>
        sticky.id === entry.id
          ? { ...sticky, enabled, updatedAt: Date.now() }
          : sticky
      );
      await handleSave(next);
    },
    [stickies, handleSave]
  );

  useDashboardToasts(loading, error);

  const channelProfiles = useChannelProfiles(
    stickies.map((entry) => entry.channelId).filter((id): id is string => !!id),
    guildChannels
  );

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const editing = modal && modal !== 'create' ? modal : null;
  const existingChannelIds = stickies
    .filter((entry) => entry.id !== editing?.id)
    .map((entry) => entry.channelId);

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
            <h1 className="text-xl font-extrabold text-white">Sticky Messages</h1>
            <p className="mt-0.5 text-xs text-white/40">{userGuild.name}</p>
          </div>
          <a
            href="/guides/rune"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex-shrink-0 rounded-lg bg-orange/10 px-3 py-1.5 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/20"
          >
            Rune guide →
          </a>
        </div>

        <div className="mb-6 rounded-xl border border-orange/10 bg-orange/[0.04] px-4 py-3 text-xs text-white/50">
          Sticky messages stay at the bottom of a channel. After someone posts, the
          old sticky is removed and a fresh one is posted after that sticky's
          configured delay. Each server can have up to {MAX_STICKIES}, with one per
          channel.
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
                Sticky Messages
              </h2>
              <p className="mt-0.5 text-[10px] text-white/20">
                {stickies.length} / {MAX_STICKIES} used
              </p>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={() => {
                  if (stickies.length >= MAX_STICKIES) {
                    showErrorToast('Limit reached', {
                      description: `This server already has ${MAX_STICKIES} sticky messages.`,
                    });
                    return;
                  }
                  setModal('create');
                }}
                disabled={saving || stickies.length >= MAX_STICKIES}
                className="flex items-center gap-1.5 rounded-lg bg-orange/10 px-3 py-1.5 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New Sticky
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </ul>
          ) : stickies.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/30">No sticky messages yet.</p>
              <p className="mt-1 text-xs text-white/20">
                Create one to keep important information at the bottom of a channel.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {stickies.map((entry) => (
                <li
                  key={entry.id}
                  className="group flex flex-col gap-3 rounded-xl bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white/80">
                        {typeLabel(entry.type)}
                      </p>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[10px]',
                          entry.enabled
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-white/5 text-white/40',
                        ].join(' ')}
                      >
                        {entry.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/30">
                      <ChannelBadge
                        channelId={entry.channelId}
                        profile={channelProfiles[entry.channelId]}
                        inline
                        showId={false}
                      />
                      <span className="text-white/15">·</span>
                      <span>{entry.sendCount ?? 0} posts</span>
                      <span className="text-white/15">·</span>
                      <span>
                        {((entry.repostDelayMs ?? 2500) / 1000).toFixed(1).replace(/\.0$/, '')}s
                      </span>
                      <span className="text-white/15">·</span>
                      <span>
                        {entry.mentionPolicy === 'users'
                          ? 'user mentions'
                          : entry.mentionPolicy === 'roles'
                            ? 'role mentions'
                            : entry.mentionPolicy === 'everyone'
                              ? 'all mentions'
                              : 'no mentions'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-white/35">
                      {previewOf(entry)}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-center">
                    <Toggle
                      value={entry.enabled}
                      onChangeAction={(enabled) => handleToggle(entry, enabled)}
                      disabled={saving}
                    />
                    <ItemActions
                      label="Sticky actions"
                      actions={[
                        {
                          label: 'Edit sticky',
                          icon: 'edit',
                          disabled: saving,
                          onSelect: () => setModal(entry),
                        },
                        {
                          label: 'Delete sticky',
                          icon: 'delete',
                          danger: true,
                          disabled: saving,
                          onSelect: () => setDeleteEntry(entry),
                        },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {modal && (
        <StickyModal
          initial={editing ?? undefined}
          channels={guildChannels}
          existingChannelIds={existingChannelIds}
          userId={user.id}
          user={user}
          guild={userGuild}
          saving={saving}
          onSave={async (updated) => {
            if (!editing && stickies.length >= MAX_STICKIES) {
              showErrorToast('Limit reached', {
                description: `This server already has ${MAX_STICKIES} sticky messages.`,
              });
              return;
            }

            const next = editing
              ? stickies.map((entry) =>
                  entry.id === updated.id ? updated : entry
                )
              : [...stickies, updated];

            if (await handleSave(next)) setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {liveDeleteEntry && (
        <DeleteStickyModal
          item={liveDeleteEntry}
          channels={guildChannels}
          saving={saving}
          onConfirm={async () => {
            const next = stickies.filter(
              (entry) => entry.id !== liveDeleteEntry.id
            );
            if (await handleSave(next)) setDeleteEntry(null);
          }}
          onClose={() => setDeleteEntry(null)}
        />
      )}
    </div>
  );
}
