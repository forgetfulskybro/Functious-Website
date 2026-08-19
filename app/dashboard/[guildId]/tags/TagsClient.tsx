'use client';
import { TagEntry, DeleteTagModal, TagViewModal, TagModal } from './Modals';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TagRowSkeleton } from '@/components/ui/Skeletons';
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

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${
        danger
          ? 'text-white/30 hover:bg-red-500/10 hover:text-red-400'
          : 'text-white/30 hover:bg-white/5 hover:text-white/70'
      }`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {children}
      </svg>
    </button>
  );
}

function mapTags(raw: any[]): TagEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t: any) => ({
    id: t.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: String(t.name || ''),
    type: t.type === 'embed' ? 'embed' : t.type === 'script' ? 'script' : 'text',
    content: t.content ?? null,
    embedData: t.embedData || (t.type === 'embed' ? { description: t.content || '' } : null),
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    uses: t.uses || 0,
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

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
                Custom Tags
              </h2>
              <p className="mt-0.5 text-[10px] text-white/20">Text, embed & Rune script</p>
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
                    </p>
                    <p className="mt-0.5 text-xs text-white/30">
                      {tag.uses || 0} uses
                      {tag.createdBy ? ` • Created by ${tag.createdBy}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconBtn title="View" onClick={() => setViewTag(tag)}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </IconBtn>
                    <IconBtn
                      title="Edit"
                      disabled={saving}
                      onClick={() => setModal(tag)}
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </IconBtn>
                    <IconBtn
                      title="Delete"
                      disabled={saving}
                      danger
                      onClick={() => setDeleteTag(tag)}
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path
                        d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </IconBtn>
                  </div>
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
            .map((t) => t.name.toLowerCase())}
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

      {viewTag && <TagViewModal tag={viewTag} onClose={() => setViewTag(null)} />}

      {deleteTag && (
        <DeleteTagModal
          tag={deleteTag}
          saving={saving}
          onConfirm={async () => {
            if (await handleSave(tags.filter((t) => t.id !== deleteTag.id))) {
              setDeleteTag(null);
            }
          }}
          onClose={() => setDeleteTag(null)}
        />
      )}
    </div>
  );
}