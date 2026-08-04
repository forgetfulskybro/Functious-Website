'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useGuildData } from '@/hooks/useGuildData';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import SelectDropdown from '@/components/ui/SelectDropdown';

interface TagEntry {
  id: string;
  name: string;
  type: 'text' | 'embed';
  content?: string | null;
  embedData?: { description: string } | null;
  createdBy?: string;
  createdAt?: number;
  uses?: number;
}

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
    id: t.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: String(t.name || ''),
    type: t.type === 'embed' ? 'embed' : 'text',
    content: t.content ?? null,
    embedData:
      t.embedData ||
      (t.type === 'embed' ? { description: t.content || '' } : null),
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    uses: t.uses || 0,
  }));
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function TagRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 bg-white/[0.03] flex items-center gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
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

  const [tags, setTags] = useState<TagEntry[]>(() =>
    mapTags((data as any).tags || [])
  );

  useEffect(() => {
    if (saving) return;
    const raw = (data as any).tags;
    if (Array.isArray(raw)) setTags(mapTags(raw));
  }, [data, saving]);

  const [modal, setModal] = useState<'create' | TagEntry | null>(null);
  const [viewTag, setViewTag] = useState<TagEntry | null>(null);
  const [deleteTag, setDeleteTag] = useState<TagEntry | null>(null);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const handleSave = useCallback(
    async (newTags: TagEntry[]): Promise<boolean> => {
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
            <h1 className="text-xl font-extrabold text-white">Tags</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                Custom Tags
              </h2>
              <p className="text-white/20 text-[10px] mt-0.5">
                Create, edit, view & delete tags
              </p>
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
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">No tags yet. Create your first one!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className="rounded-xl px-4 py-3 bg-white/[0.03] group flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 font-medium truncate">
                      {tag.name}{' '}
                      <span className="text-xs text-white/40">({tag.type})</span>
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {tag.uses || 0} uses
                      {tag.createdBy ? ` • Created by ${tag.createdBy}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewTag(tag)}
                      className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                      title="View full content"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>

                    <button
                      onClick={() => setModal(tag)}
                      disabled={saving}
                      className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
                      title="Edit tag"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    <button
                      onClick={() => setDeleteTag(tag)}
                      disabled={saving}
                      className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete tag"
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
            const ok = await handleSave(newList);
            if (ok) setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {viewTag && <TagViewModal tag={viewTag} onClose={() => setViewTag(null)} />}

      {deleteTag && (
        <DeleteTagModal
          tag={deleteTag}
          saving={saving}
          onConfirm={async () => {
            const ok = await handleSave(tags.filter((t) => t.id !== deleteTag.id));
            if (ok) setDeleteTag(null);
          }}
          onClose={() => setDeleteTag(null)}
        />
      )}
    </div>
  );
}

function TagModal({
  initial,
  existingNames,
  userId,
  saving,
  onSave,
  onClose,
}: {
  initial?: TagEntry;
  existingNames: string[];
  userId: string;
  saving?: boolean;
  onSave: (tag: TagEntry) => void | Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<'text' | 'embed'>(initial?.type ?? 'text');
  const [content, setContent] = useState(
    initial?.type === 'embed'
      ? initial.embedData?.description ?? ''
      : initial?.content ?? ''
  );
  const [submitting, setSubmitting] = useState(false);

  const typeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'embed', label: 'Embed' },
  ];

  const sanitizeName = (value: string) =>
    value.replace(/\s+/g, '').slice(0, 32);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || saving) return;

    const cleanName = sanitizeName(name);
    if (!cleanName) {
      showErrorToast('Error', { description: 'Tag name is required (no spaces).' });
      return;
    }
    if (existingNames.includes(cleanName.toLowerCase())) {
      showErrorToast('Error', { description: 'A tag with that name already exists.' });
      return;
    }
    if (!content.trim()) {
      showErrorToast('Error', { description: 'Content is required.' });
      return;
    }

    try {
      setSubmitting(true);
      const newTag: TagEntry = {
        id: initial?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: cleanName,
        type,
        content: type === 'text' ? content.trim() : null,
        embedData: type === 'embed' ? { description: content.trim() } : null,
        createdBy: initial?.createdBy ?? userId,
        createdAt: initial?.createdAt ?? Math.floor(Date.now() / 1000),
        uses: initial?.uses ?? 0,
      };
      await onSave(newTag);
    } catch {
      showErrorToast('Error', { description: 'Failed to save tag.' });
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || !!saving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl overflow-visible">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <div>
            <h2 className="text-white font-bold text-lg">
              {initial ? 'Edit Tag' : 'Create New Tag'}
            </h2>
            <p className="text-white/30 text-xs mt-0.5">Custom server responses</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-white/40 hover:text-white text-xl disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Tag Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(sanitizeName(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === ' ') e.preventDefault();
              }}
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
              placeholder="welcome"
              maxLength={32}
              autoComplete="off"
              spellCheck={false}
              required
            />
            <p className="text-white/25 text-[10px] mt-1.5">No spaces allowed · max 32 characters</p>
          </div>

          <SelectDropdown
            label="Type"
            value={type}
            onChange={(v) => setType(v as 'text' | 'embed')}
            options={typeOptions}
          />

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              {type === 'text' ? 'Content' : 'Embed Description'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full bg-white/5 rounded-lg px-3 py-3 text-sm text-white placeholder-white/30 resize-y"
              placeholder={type === 'text' ? 'Hello {user}!' : 'Welcome to the server!'}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!sanitizeName(name) || !content.trim() || busy}
              className="flex-1 py-3 bg-orange hover:bg-orange-bright disabled:opacity-50 rounded-xl font-semibold text-white transition-colors"
            >
              {busy ? 'Saving…' : initial ? 'Save Changes' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTagModal({
  tag,
  saving,
  onConfirm,
  onClose,
}: {
  tag: TagEntry;
  saving?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const busy = deleting || !!saving;

  const handleConfirm = async () => {
    if (busy) return;
    try {
      setDeleting(true);
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      <div className="relative w-full max-w-sm rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <h2 className="text-white font-bold text-lg">Delete tag?</h2>
          <p className="text-white/30 text-xs mt-0.5">This action cannot be undone.</p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-white/80 font-medium text-sm truncate">
              {tag.name}{' '}
              <span className="text-xs text-white/40">({tag.type})</span>
            </p>
            <p className="text-white/30 text-xs mt-0.5">
              {tag.uses || 0} uses
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl font-semibold disabled:opacity-50 transition-colors"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TagViewModal({ tag, onClose }: { tag: TagEntry; onClose: () => void }) {
  const content = tag.type === 'text' ? tag.content : tag.embedData?.description;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl overflow-visible">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <div>
            <h2 className="text-white font-bold text-lg">{tag.name}</h2>
            <p className="text-white/30 text-xs mt-0.5">
              {tag.type === 'embed' ? 'Embed tag' : 'Text tag'}
              {(tag.uses ?? 0) > 0 && ` · ${tag.uses} use${tag.uses === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 text-xl focus-visible:outline-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              {tag.type === 'text' ? 'Content' : 'Embed Description'}
            </label>
            <div className="w-full bg-white/5 rounded-lg px-3 py-3 text-sm text-white/85 whitespace-pre-wrap font-mono leading-relaxed min-h-[80px]">
              {content || <span className="text-white/25 italic">No content</span>}
            </div>
          </div>

          {tag.createdBy && (
            <div className="flex items-center gap-4 pt-1">
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest">Created by</p>
                <p className="text-white/60 text-xs font-mono mt-0.5">{tag.createdBy}</p>
              </div>
          {tag.createdAt && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest">Created</p>
                  <p className="text-white/60 text-xs mt-0.5">
                    {new Date(
                      tag.createdAt > 1e12 ? tag.createdAt : tag.createdAt * 1000
                    ).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium transition-colors focus-visible:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}