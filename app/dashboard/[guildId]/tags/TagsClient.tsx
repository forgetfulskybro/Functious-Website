'use client';
import { TagEntry, DeleteTagModal, TagViewModal, TagModal } from './Modals';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import ItemActions from '@/components/ui/ItemActions';
import { useState, useEffect, useCallback } from 'react';
import { TagRowSkeleton, Skeleton } from '@/components/ui/Skeletons';
import { SettingRow } from '@/components/ui/SettingRow';
import { Toggle } from '@/components/ui/Toggle';
import { useGuildData } from '@/hooks/useGuildData';
import { useDashboardToasts } from '@/hooks/useDashboardToasts';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import UserBadge from '@/components/ui/UserBadge';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}

function mapTags(raw: any[]): TagEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t: any) => ({
    ...t,
    id: t.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: String(t.name || ''),
    type: t.type === 'embed' ? 'embed' : t.type === 'script' ? 'script' : 'text',
    content: t.content ?? null,
    embedData: t.embedData || (t.type === 'embed' ? { description: t.content || '' } : null),
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    uses: t.uses || 0,
    trigger: t.trigger === true,
    anyTrigger: t.anyTrigger === true,
  }));
}

export default function TagsClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const [tags, setTags] = useState<TagEntry[]>(() => mapTags((data as any).tags || []));
  const [modal, setModal] = useState<'create' | TagEntry | null>(null);
  const [viewTag, setViewTag] = useState<TagEntry | null>(null);
  const [deleteTag, setDeleteTag] = useState<TagEntry | null>(null);
  const profiles = useUserProfiles(
    tags.map((t) => t.createdBy ?? '').filter((id): id is string => !!id),
  );

  const liveViewTag = viewTag
    ? tags.find((t) => t.id === viewTag.id) ?? viewTag
    : null;
  const liveDeleteTag = deleteTag
    ? tags.find((t) => t.id === deleteTag.id) ?? deleteTag
    : null;

  useEffect(() => {
    if (saving) return;
    const raw = (data as any).tags;
    if (Array.isArray(raw)) setTags(mapTags(raw));
  }, [data, saving]);

  const handleSave = useCallback(
    async (newTags: TagEntry[]) => {
      const previous = tags;
      setTags(newTags);
      try {
        await save({ tags: newTags } as any);
        showToast('Tags saved', {
          description: 'Your custom tags have been updated successfully.',
        });
        return true;
      } catch {
        setTags(previous);
        showErrorToast('Error', { description: 'Failed to save tags.' });
        return false;
      }
    },
    [tags, save]
  );

  const handleBotTriggerToggle = useCallback(
    async (value: boolean) => {
      try {
        await save({ tagTriggerBots: value } as any);
        showToast('Settings saved', {
          description: `Bot trigger words ${value ? 'enabled' : 'disabled'}.`,
        });
      } catch {
        showErrorToast('Error', { description: 'Failed to update tag settings.' });
      }
    },
    [save]
  );

  useDashboardToasts(loading, error);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const typeLabel = (t: TagEntry['type']) =>
    t === 'script' ? '⚡ script' : t === 'embed' ? '📄 embed' : '📝 text';

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
            <h1 className="text-xl font-extrabold text-white">Tags</h1>
            <p className="mt-0.5 text-xs text-white/40">{userGuild.name}</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl bg-bg-card px-6 py-1">
          {loading ? (
            <div className="py-3.5">
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <SettingRow
              label="Bot trigger words"
              description="Let bot messages run tags that have a trigger word."
            >
              <Toggle
                value={data.tagTriggerBots === true}
                onChangeAction={handleBotTriggerToggle}
                disabled={saving}
              />
            </SettingRow>
          )}
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
                Custom Tags
              </h2>
              <p className="mt-0.5 text-[10px] text-white/20">Text, embed & Rune script · exact or anywhere triggers</p>
            </div>
            {!loading && (
              <button
                onClick={() => setModal('create')}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-orange/10 px-3 py-1.5 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/20 disabled:opacity-50"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New Tag
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <TagRowSkeleton />
              <TagRowSkeleton />
              <TagRowSkeleton />
            </ul>
          ) : tags.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/30">No tags yet. Create your first one!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className="group flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white/80">
                      {tag.name}{' '}
                      <span className="text-xs text-white/40">({typeLabel(tag.type)})</span>
                      {(tag.trigger || tag.anyTrigger) && (
                        <span className="ml-1.5 rounded bg-orange/15 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-orange-warm">
                          {tag.anyTrigger ? 'anywhere trigger' : 'trigger word'}
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5 text-xs text-white/30 flex items-center gap-1.5 flex-wrap">
                      <span>{tag.uses || 0} uses</span>
                      {tag.createdBy && (
                        <>
                          <span className="text-white/15">·</span>
                          <span>Created by</span>
                          <UserBadge
                            userId={tag.createdBy}
                            profile={profiles[tag.createdBy]}
                            inline
                            size="sm"
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <ItemActions
                    label="Tag actions"
                    actions={[
                      { label: 'View tag', icon: 'view', onSelect: () => setViewTag(tag) },
                      {
                        label: 'Edit tag',
                        icon: 'edit',
                        disabled: saving,
                        onSelect: () => setModal(tag),
                      },
                      {
                        label: 'Delete tag',
                        icon: 'delete',
                        danger: true,
                        disabled: saving,
                        onSelect: () => setDeleteTag(tag),
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
        <TagModal
          initial={modal === 'create' ? undefined : modal}
          existingNames={tags
            .filter((t) => (modal === 'create' ? true : t.id !== (modal as TagEntry).id))
            .map((t) => t.name.trim().toLowerCase())}
          userId={user.id}
          saving={saving}
          onSave={async (updatedTag) => {
            const newList =
              modal === 'create'
                ? [...tags, updatedTag]
                : tags.map((t) => (t.id === updatedTag.id ? updatedTag : t));
            if (await handleSave(newList)) setModal(null);
          }}
          onClose={() => setModal(null)}
          guild={userGuild as any}
          user={user as any}
        />
      )}

      {liveViewTag && (
        <TagViewModal
          tag={liveViewTag}
          profile={liveViewTag.createdBy ? profiles[liveViewTag.createdBy] : undefined}
          onClose={() => setViewTag(null)}
        />
      )}

      {liveDeleteTag && (
        <DeleteTagModal
          tag={liveDeleteTag}
          saving={saving}
          onConfirm={async () => {
            if (await handleSave(tags.filter((t) => t.id !== liveDeleteTag.id))) {
              setDeleteTag(null);
            }
          }}
          onClose={() => setDeleteTag(null)}
        />
      )}
    </div>
  );
}