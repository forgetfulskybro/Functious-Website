'use client';

import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels, Roles } from '@/lib/types';
import { TwemojiImg, isUnicodeEmoji } from '@/components/ui/Twemoji';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { Skeleton, RowSkeleton } from '@/components/ui/Skeletons';
import { useState, useEffect, useRef, useCallback } from 'react';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import SelectDropdown from '@/components/ui/SelectDropdown';
import ReactionSelect from '@/components/ui/ReactionSelect';
import RolesDropdown from '@/components/ui/RolesDropdown';
import { SettingRow } from '@/components/ui/SettingRow';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';

import { Toggle } from '@/components/ui/Toggle';
import Image from 'next/image';

interface ReactionRoleMapping {
  emoji: string;
  emojiKey?: string;
  role: string;
  name: string;
  position?: number;
}

interface ReactionRoleEntry {
  msgId: string;
  chanId: string;
  roles: ReactionRoleMapping[];
  exclusive?: boolean | null;
  type?: 'content' | 'embed';
  content?: string;
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type: number; parentId: string }[];
  guildRoles?: { id: string; name: string; color?: number }[];
}

interface CachedMessage {
  content: string;
  type: 'content' | 'embed';
  useMention: boolean;
  fetchedAt: number;
}

const messageCache = new Map<string, CachedMessage>();
const MESSAGE_CACHE_TTL_MS = 5 * 60_000;

const ENTRIES_PER_PAGE = 5;
const VIEW_ROLES_PER_PAGE = 4;

function cacheKey(guildId: string, msgId: string) {
  return `${guildId}:${msgId}`;
}

function getCachedMessage(guildId: string, msgId: string): CachedMessage | null {
  const entry = messageCache.get(cacheKey(guildId, msgId));
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > MESSAGE_CACHE_TTL_MS) {
    messageCache.delete(cacheKey(guildId, msgId));
    return null;
  }
  return entry;
}

function setCachedMessage(
  guildId: string,
  msgId: string,
  data: Omit<CachedMessage, 'fetchedAt'>
) {
  messageCache.set(cacheKey(guildId, msgId), {
    ...data,
    fetchedAt: Date.now(),
  });
}

function invalidateCachedMessage(guildId: string, msgId: string) {
  messageCache.delete(cacheKey(guildId, msgId));
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-1">
      <p className="text-white/20 text-[10px]">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={[
              'w-5 h-5 rounded text-[10px] font-medium transition-colors',
              i === page
                ? 'bg-orange/20 text-orange-warm'
                : 'text-white/25 hover:text-white/60 hover:bg-white/5',
            ].join(' ')}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
          disabled={page === totalPages - 1}
          className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

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

function ReactionRoleModal({
  initial,
  channels,
  emojis,
  roles,
  saving,
  guildId,
  onSaved,
  onClose,
}: {
  initial?: ReactionRoleEntry;
  channels: { id: string; name: string; type: number; parentId: string }[];
  emojis: { id: string; name: string; animated: boolean; url: string }[];
  roles: { id: string; name: string; color?: number }[];
  saving?: boolean;
  guildId: string;
  onSaved: (item: ReactionRoleEntry) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'content' | 'embed'>(initial?.type || 'content');
  const [channelId, setChannelId] = useState(initial?.chanId || '');
  const [content, setContent] = useState(initial?.content || '');
  const [contentLoading, setContentLoading] = useState(!!initial);
  const [mappings, setMappings] = useState<ReactionRoleMapping[]>(
    initial?.roles?.length
      ? initial.roles.map((r, i) => ({
          emoji: r.emoji,
          role: r.role,
          name: r.name || '',
          position: r.position ?? i + 1,
        }))
      : [{ emoji: '', role: '', name: '', position: 1 }]
  );
  const [useMention, setUseMention] = useState(false);
  const [exclusive, setExclusive] = useState(!!(initial?.exclusive));
  const [submitting, setSubmitting] = useState(false);
  const [mappingPage, setMappingPage] = useState(0);
  const MAPPINGS_PER_PAGE = 3;

  const typeOptions = [
    { value: 'content', label: 'Text Message' },
    { value: 'embed', label: 'Embed' },
  ];

  function updateMapping(idx: number, patch: Partial<ReactionRoleMapping>) {
    setMappings((prev) =>
      prev.map((m, i) => {
        if (i !== idx) return m;
        const next = { ...m, ...patch };
        if (patch.role) {
          const found = roles.find((r) => r.id === patch.role);
          if (found) next.name = found.name;
        }
        return next;
      })
    );
  }

  function addMapping() {
    if (mappings.length >= 30) return;
    setMappings((p) => [...p, { emoji: '', role: '', name: '', position: p.length + 1 }]);
    setMappingPage(Math.floor(mappings.length / MAPPINGS_PER_PAGE));
  }

  function removeMapping(idx: number) {
    if (mappings.length <= 1) return;
    setMappings((p) => p.filter((_, i) => i !== idx));
  }

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(mappings.length / MAPPINGS_PER_PAGE));
    if (mappingPage > totalPages - 1) setMappingPage(totalPages - 1);
  }, [mappings.length, mappingPage]);

  const mappingTotalPages = Math.max(1, Math.ceil(mappings.length / MAPPINGS_PER_PAGE));
  const mappingSlice = mappings.slice(
    mappingPage * MAPPINGS_PER_PAGE,
    mappingPage * MAPPINGS_PER_PAGE + MAPPINGS_PER_PAGE
  );

  function buildFinalContent(): string {
    let text = content.trim();
    if (useMention && !text.includes('{mention}')) {
      text = `{mention}\n${text}`;
    }
    for (const m of mappings) {
      if (!m.name) continue;
      const placeholder = `{role:${m.name}}`;
      if (!text.includes(placeholder)) {
        text += `\n${placeholder}`;
      }
    }
    return text.slice(0, type === 'embed' ? 4040 : 1960);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || submitting || saving) return;

    const clean = mappings
      .map((m) => ({
        emoji: m.emoji.trim(),
        role: m.role,
        name: m.name || roles.find((r) => r.id === m.role)?.name || '',
        position: m.position,
      }))
      .filter((m) => m.emoji && m.role);

    if (clean.length === 0) {
      showErrorToast('Error', { description: 'Add at least one emoji + role pair.' });
      return;
    }

    const finalContent = buildFinalContent();
    if (!finalContent.trim()) {
      showErrorToast('Error', { description: 'Message content cannot be empty.' });
      return;
    }

    try {
      setSubmitting(true);

      const body = {
        type,
        channelId,
        content: finalContent,
        roles: clean,
        exclusive: exclusive || null,
        useMention,
      };

      let res: Response;
      if (initial) {
        res = await fetch(`/api/bot/guilds/${guildId}/reactionroles/${initial.msgId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/bot/guilds/${guildId}/reactionroles`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }

      const data = await res.json();
      setCachedMessage(guildId, data.entry.msgId, {
        content: finalContent,
        type,
        useMention,
      });
      onSaved(data.entry as ReactionRoleEntry);
      showToast(initial ? 'Message updated' : 'Message created', {
        description: 'Reaction roles are now live.',
      });
    } catch (err: any) {
      console.log(err);
      showErrorToast('Error', { description: err?.message || 'Failed to save.' });
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || !!saving;

  const autocompleteRoles = mappings
    .filter((m) => m.role && m.name)
    .map((m) => ({ id: m.role, name: m.name, color: roles.find((r) => r.id === m.role)?.color }));

  const roleSuggestions =
    autocompleteRoles.length > 0
      ? autocompleteRoles
      : roles.map((r) => ({ id: r.id, name: r.name, color: r.color }));

  useEffect(() => {
    if (!initial?.msgId) {
      setContentLoading(false);
      return;
    }

    const cached = getCachedMessage(guildId, initial.msgId);
    if (cached) {
      setContent(cached.content);
      setType(cached.type);
      setUseMention(cached.useMention);
      setContentLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setContentLoading(true);
      try {
        const res = await fetch(
          `/api/bot/guilds/${guildId}/reactionroles/${initial.msgId}`,
          { credentials: 'include' }
        );
        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        const content = typeof data.content === 'string' ? data.content : '';
        const type = data.type === 'embed' ? 'embed' : 'content';
        const useMention = !!data.useMention;

        setContent(content);
        setType(type);
        setUseMention(useMention);

        setCachedMessage(guildId, initial.msgId, { content, type, useMention });
      } catch {
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initial?.msgId, guildId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl overflow-visible">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-lg">
              {initial ? 'Edit Reaction Role Message' : 'New Reaction Role Message'}
            </h2>
            <p className="text-white/30 text-xs mt-0.5">Members react to get roles</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="text-white/40 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col min-w-0">
              <label className="block text-white/50 text-xs font-medium mb-1.5">Type</label>
              <div className="h-10 [&_>_*]:!h-10 [&_>_*]:!min-h-[40px] [&_button]:!h-10 [&_button]:!min-h-[40px]">
                <SelectDropdown
                  label=""
                  value={type}
                  onChange={(v) => setType(v as any)}
                  options={typeOptions}
                />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <label className="block text-white/50 text-xs font-medium mb-1.5">Channel</label>
              <div className="h-10 [&_>_*]:!h-10 [&_>_*]:!min-h-[40px] [&_button]:!h-10 [&_button]:!min-h-[40px]">
                <ChannelDropdown
                  channels={channels}
                  value={channelId}
                  onChangeAction={setChannelId}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Message content
              <span className="text-white/25 ml-1">Use {'{role:Name}'} placeholders</span>
            </label>
            {contentLoading ? (
              <div className="w-full h-[132px] bg-white/5 rounded-lg flex items-center justify-center">
                <p className="text-white/30 text-xs animate-pulse">Loading message…</p>
              </div>
            ) : (
              <RoleAutocompleteTextarea
                value={content}
                onChange={setContent}
                roles={roleSuggestions}
                placeholder={`**Pick a color!**\n\n{role:Blue}\n{role:Red}\n{role:Purple}`}
              />
            )}
            <p className="text-white/25 text-[10px] mt-1.5">
              Type <code className="text-orange-light/70">{'{role:'}</code> then a role name - Tab or click to complete.
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                Emoji → Role
                <span className="text-white/20 normal-case tracking-normal ml-1.5">
                  ({mappings.length})
                </span>
              </p>
              {mappings.length < 30 && (
                <button
                  type="button"
                  onClick={addMapping}
                  className="text-xs text-orange-warm hover:text-orange px-2 py-0.5 rounded bg-orange/10 hover:bg-orange/20 transition-colors"
                >
                  + Add
                </button>
              )}
            </div>

            <div className="space-y-2">
              {mappingSlice.map((m, sliceIdx) => {
                const i = mappingPage * MAPPINGS_PER_PAGE + sliceIdx;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-28 flex-shrink-0">
                      <ReactionSelect
                        value={m.emoji}
                        onChange={(emoji) => updateMapping(i, { emoji })}
                        customEmojis={emojis ?? []}
                      />
                    </div>
                    <div className="flex-1 min-w-0 h-10 min-h-[40px] [&_>_*]:!h-10 [&_>_*]:!min-h-[40px] [&_button]:!h-10 [&_button]:!min-h-[40px]">
                      <RolesDropdown
                        roles={roles}
                        value={m.role}
                        onChange={(id) => updateMapping(i, { role: id })}
                      />
                    </div>
                    {mappings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMapping(i)}
                        className="h-10 w-10 min-h-[40px] flex-shrink-0 flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <Pagination
              page={mappingPage}
              totalPages={mappingTotalPages}
              total={mappings.length}
              pageSize={MAPPINGS_PER_PAGE}
              onChange={setMappingPage}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white/70 text-xs">Use role mentions</p>
                <p className="text-white/25 text-[10px]">Show {'<@&id>'} instead of role names</p>
              </div>
              <Toggle value={useMention} onChangeAction={setUseMention} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white/70 text-xs">Exclusive</p>
                <p className="text-white/25 text-[10px]">Only one role from this message at a time</p>
              </div>
              <Toggle value={exclusive} onChangeAction={setExclusive} />
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelId || mappings.every((m) => !m.emoji || !m.role) || busy}
              className="flex-1 py-3 bg-orange hover:bg-orange-bright disabled:opacity-50 rounded-xl font-semibold text-white"
            >
              {busy ? 'Saving…' : initial ? 'Save Changes' : 'Create Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleAutocompleteTextarea({
  value,
  onChange,
  roles,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  roles: { id: string; name: string; color?: number }[];
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [dropdown, setDropdown] = useState<{
    start: number;
    query: string;
    active: number;
  } | null>(null);

  const filtered = (() => {
    if (!dropdown) return [];
    const q = dropdown.query.toLowerCase();
    return roles
      .filter((r) => r.name.toLowerCase().includes(q) || r.id.includes(q))
      .slice(0, 8);
  })();

  function detectTrigger(text: string, cursor: number) {
    const before = text.slice(0, cursor);
    const match = before.match(/\{role:([^\s}]*)$/i);
    if (match) {
      return { start: match.index!, query: match[1] };
    }
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    const pos = e.target.selectionStart ?? v.length;
    onChange(v);

    const trigger = detectTrigger(v, pos);
    if (trigger) {
      setDropdown({ ...trigger, active: 0 });
    } else {
      setDropdown(null);
    }
  }

  function insertRole(role: { id: string; name: string }) {
    if (!dropdown || !taRef.current) return;

    const before = value.slice(0, dropdown.start);
    const after = value.slice(taRef.current.selectionStart);
    const inserted = `{role:${role.name}}`;
    const next = before + inserted + after;
    onChange(next);
    setDropdown(null);

    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      taRef.current?.setSelectionRange(pos, pos);
      taRef.current?.focus();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!dropdown || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDropdown((d) =>
        d ? { ...d, active: Math.min(d.active + 1, filtered.length - 1) } : d
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDropdown((d) => (d ? { ...d, active: Math.max(d.active - 1, 0) } : d));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      insertRole(filtered[dropdown.active] ?? filtered[0]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDropdown(null);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setDropdown(null), 150)}
        rows={5}
        placeholder={placeholder}
        className="w-full h-[132px] bg-white/5 rounded-lg px-3 py-3 text-sm text-white placeholder-white/30 resize-y font-mono focus:outline-none focus:ring-1 focus:ring-orange"
      />

      {dropdown && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-[#1a0e0e] border border-white/10 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((role, i) => (
            <button
              key={role.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertRole(role)}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors',
                i === dropdown.active
                  ? 'bg-orange/15 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: role.color
                    ? `#${role.color.toString(16).padStart(6, '0')}`
                    : '#888',
                }}
              />
              <span className="truncate font-medium">{role.name}</span>
              <span className="ml-auto text-white/25 font-mono text-[10px] truncate max-w-[80px]">
                {role.id}
              </span>
            </button>
          ))}
          <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-white/25">
            ↑↓ navigate · Tab / Enter select · Esc close
          </div>
        </div>
      )}
    </div>
  );
}

function ViewModal({
  item,
  channelName,
  roleName,
  onToggleExclusive,
  onClose,
}: {
  item: ReactionRoleEntry;
  channelName: string;
  roleName: (id: string) => string;
  onToggleExclusive: () => void;
  onClose: () => void;
}) {
  const [rolePage, setRolePage] = useState(0);

  const sortedRoles = item.roles
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const roleTotalPages = Math.max(1, Math.ceil(sortedRoles.length / VIEW_ROLES_PER_PAGE));
  const roleSlice = sortedRoles.slice(
    rolePage * VIEW_ROLES_PER_PAGE,
    rolePage * VIEW_ROLES_PER_PAGE + VIEW_ROLES_PER_PAGE
  );

  useEffect(() => {
    if (rolePage > roleTotalPages - 1) setRolePage(Math.max(0, roleTotalPages - 1));
  }, [sortedRoles.length, rolePage, roleTotalPages]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#160a0a] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white text-lg font-bold">Reaction Role Message</h2>
            <p className="text-white/30 text-xs mt-0.5">
              {item.roles.length} role{item.roles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Channel</p>
              <p className="text-white font-medium">#{channelName}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Message ID</p>
              <p className="text-white font-mono text-xs truncate">{item.msgId}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Exclusive</p>
              <p className="text-white text-xs">{item.exclusive ? 'On - only one role at a time' : 'Off'}</p>
            </div>
            <button
              type="button"
              onClick={onToggleExclusive}
              className="text-xs text-orange-warm hover:text-orange px-2 py-1 rounded bg-orange/10 hover:bg-orange/20"
            >
              Toggle
            </button>
          </div>

          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Roles</p>
            <div className="rounded-xl bg-white/[0.03] divide-y divide-white/5">
              {roleSlice.map((r, i) => (
                <div key={`${r.role}-${rolePage * VIEW_ROLES_PER_PAGE + i}`} className="flex items-center gap-3 px-3 py-2.5">
                  {isUnicodeEmoji(r.emoji) ? (
                    <TwemojiImg emoji={r.emoji} size={22} />
                  ) : (
                    <img
                      src={`https://fluxerusercontent.com/emojis/${r.emojiKey}.webp?animated=${r.emoji.includes('<a:')}&size=240&quality=lossless`}
                      alt=""
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-white/80 text-xs font-medium truncate">{roleName(r.role)}</p>
                    <p className="text-white/30 text-[10px] font-mono truncate">{r.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <Pagination
                page={rolePage}
                totalPages={roleTotalPages}
                total={sortedRoles.length}
                pageSize={VIEW_ROLES_PER_PAGE}
                onChange={setRolePage}
              />
            </div>
          </div>

          <a
            href={`https://fluxer.app/channels/${item.chanId.split('/')[0] || ''}/${item.chanId}/${item.msgId}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-orange-warm/80 hover:text-orange-warm text-xs py-2"
          >
            Open message in Fluxer →
          </a>
        </div>

        <div className="p-4 border-t border-[#2A1313] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  item,
  channelName,
  saving,
  onConfirm,
  onClose,
}: {
  item: ReactionRoleEntry;
  channelName: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <h2 className="text-white font-bold text-lg">Delete reaction role message?</h2>
          <p className="text-white/30 text-xs mt-0.5">The Fluxer message will also be deleted.</p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-white/80 font-medium text-sm">
              {item.roles.length} role{item.roles.length !== 1 ? 's' : ''}
            </p>
            <p className="text-white/30 text-xs mt-0.5">#{channelName}</p>
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