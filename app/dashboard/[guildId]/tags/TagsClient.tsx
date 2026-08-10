'use client';

import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useState, useEffect, useRef, useCallback } from 'react';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { TagRowSkeleton } from '@/components/ui/Skeletons';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';
import { runTagSafe } from '@/app/interpreter';

interface TagEntry {
  id: string;
  name: string;
  type: 'text' | 'embed' | 'script';
  content?: string | null;
  embedData?: { description: string; color?: string | number } | null;
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
    type: t.type === 'embed' ? 'embed' : t.type === 'script' ? 'script' : 'text',
    content: t.content ?? null,
    embedData:
      t.embedData ||
      (t.type === 'embed' ? { description: t.content || '' } : null),
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    uses: t.uses || 0,
  }));
}

function codeSnippet(code: string, line?: number | null, col?: number | null) {
  if (!code) return null;
  if (line != null) {
    const text = code.split('\n')[line - 1] ?? '';
    const colIndex = Math.min(Math.max(0, (col ?? 1) - 1), text.length);
    const gutter = String(line);
    return `${gutter} | ${text}\n${' '.repeat(gutter.length + 3 + colIndex)}^`;
  }
  const head = code.split('\n').slice(0, 12).join('\n');
  return head.length > 800 ? head.slice(0, 800) + '\n...' : head;
}

function buildPreviewContext(
  args: string[] = [],
  user: FluxerUser,
  guild: FluxerGuild
) {
  return {
    args,
    user: {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator ?? '0',
      tag: `${user.username}#${user.discriminator ?? '0'}`,
      display_name: user.global_name || user.username,
      global_name: user.global_name ?? user.username,
      avatar: user.avatar ?? null,
      avatar_url: user.avatar
        ? `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.png`
        : null,
      banner: null,
      bot: false,
      system: false,
      created_at: '2021-05-14T18:32:00.000Z',
    },

    channel: {
      id: '987654321098765432',
      name: 'general',
      type: 0,
      guild_id: guild.id,
      position: 3,
      topic: 'General discussion',
      nsfw: false,
      mention: '<#987654321098765432>',
      rate_limit: 0,
      created_at: '2022-01-10T09:15:00.000Z',
    },

    message: {
      id: '111222333444555666',
      content: '!tag example',
      author_id: user.id,
      author: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator ?? '0',
        tag: `${user.username}#${user.discriminator ?? '0'}`,
        display_name: user.global_name || user.username,
        global_name: user.global_name ?? user.username,
        avatar: user.avatar ?? null,
        avatar_url: user.avatar
          ? `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.png`
          : null,
        banner: null,
        bot: false,
        system: false,
        created_at: '2021-05-14T18:32:00.000Z',
      },
      channel_id: '987654321098765432',
      guild_id: guild.id,
      created_at: new Date().toISOString(),
      edited_timestamp: null,
      mentions: [],
      mention_roles: [],
      mention_everyone: false,
      attachments: [],
      pinned: false,
      tts: false,
      webhook_id: null,
      type: 0,
      flags: 0,
      url: `https://fluxer.app/channels/${guild.id}/987654321098765432/111222333444555666`,
    },

    guild: {
      id: guild.id,
      name: guild.name,
      icon: guild.icon ?? null,
      icon_url: guild.icon
        ? `https://fluxerusercontent.com/icons/${guild.id}/${guild.icon}.png`
        : null,
      banner: null,
      banner_url: null,
      description: null,
      owner_id: (guild as any).owner_id ?? user.id,
      features: [],
      premium_tier: 0,
      member_count: (guild as any).memberCount ?? 128,
      preferred_locale: 'en-US',
      created_at: '2020-11-03T14:22:00.000Z',
    },
  };
}

const CONTEXT_FIELDS: Record<string, { field: string; description: string }[]> = {
  user: [
    { field: 'id', description: 'user id' },
    { field: 'username', description: 'username' },
    { field: 'discriminator', description: 'discriminator, like 0001' },
    { field: 'tag', description: 'username and discriminator together' },
    { field: 'display_name', description: 'the name shown in chat' },
    { field: 'global_name', description: 'global display name' },
    { field: 'avatar', description: 'avatar hash' },
    { field: 'avatar_url', description: 'avatar image URL' },
    { field: 'banner', description: 'banner hash' },
    { field: 'bot', description: 'true if this is a bot' },
    { field: 'system', description: 'true if this is a system account' },
    { field: 'created_at', description: 'account creation date' },
  ],
  channel: [
    { field: 'id', description: 'channel id' },
    { field: 'name', description: 'channel name' },
    { field: 'type', description: 'channel type number' },
    { field: 'guild_id', description: 'id of the guild it belongs to' },
    { field: 'position', description: 'position in the channel list' },
    { field: 'topic', description: 'channel topic' },
    { field: 'nsfw', description: 'true for NSFW channels' },
    { field: 'mention', description: 'the channel mention string' },
    { field: 'rate_limit', description: 'slowmode in seconds' },
    { field: 'created_at', description: 'channel creation date' },
  ],
  message: [
    { field: 'id', description: 'message id' },
    { field: 'content', description: 'full message text' },
    { field: 'author_id', description: 'id of the author' },
    { field: 'author', description: 'the $user dict for the author' },
    { field: 'channel_id', description: 'channel it was sent in' },
    { field: 'guild_id', description: 'guild it was sent in' },
    { field: 'created_at', description: 'when it was sent' },
    { field: 'edited_timestamp', description: 'when it was last edited' },
    { field: 'mentions', description: 'list of users mentioned' },
    { field: 'mention_roles', description: 'list of role ids mentioned' },
    { field: 'mention_everyone', description: 'true if it pings everyone' },
    { field: 'attachments', description: 'list of attachments' },
    { field: 'pinned', description: 'true if pinned' },
    { field: 'tts', description: 'true if sent with text to speech' },
    { field: 'webhook_id', description: 'webhook id if sent by a webhook' },
    { field: 'type', description: 'message type number' },
    { field: 'flags', description: 'message flags' },
    { field: 'url', description: 'link to the message' },
  ],
  guild: [
    { field: 'id', description: 'guild id' },
    { field: 'name', description: 'guild name' },
    { field: 'icon', description: 'icon hash' },
    { field: 'icon_url', description: 'icon image URL' },
    { field: 'banner', description: 'banner hash' },
    { field: 'banner_url', description: 'banner image URL' },
    { field: 'description', description: 'guild description' },
    { field: 'owner_id', description: 'id of the owner' },
    { field: 'features', description: 'list of guild features' },
    { field: 'premium_tier', description: 'boost tier' },
    { field: 'member_count', description: 'number of members' },
    { field: 'preferred_locale', description: 'server language' },
    { field: 'created_at', description: 'guild creation date' },
  ],
  args: [
    { field: '0', description: 'first argument' },
    { field: '1', description: 'second argument' },
    { field: '2', description: 'third argument' },
    { field: 'length / len(args)', description: 'how many arguments there are' },
  ],
};

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
      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
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
                Text, embed & Rune script
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
                      <span className="text-xs text-white/40">
                        (
                        {tag.type === 'script'
                          ? '⚡ script'
                          : tag.type === 'embed'
                          ? '📄 embed'
                          : '📝 text'}
                        )
                      </span>
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
                      title="View"
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
                      title="Edit"
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
  guild,
  user,
}: {
  initial?: TagEntry;
  existingNames: string[];
  userId: string;
  saving?: boolean;
  onSave: (tag: TagEntry) => void | Promise<void>;
  onClose: () => void;
  guild: FluxerGuild;
  user: FluxerUser;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<'text' | 'embed' | 'script'>(
    initial?.type ?? 'text'
  );
  const [content, setContent] = useState(() => {
    if (initial?.type === 'embed') return initial.embedData?.description ?? '';
    return initial?.content ?? '';
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewArgs, setPreviewArgs] = useState<string[]>([]);
  const [argsInput, setArgsInput] = useState('');

  const [previewResult, setPreviewResult] = useState<{
    ok: boolean;
    text?: string;
    embeds?: any[];
    error?: any;
  } | null>(null);
  const [validating, setValidating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const [autocomplete, setAutocomplete] = useState<{
    start: number;
    query: string;
    kind: keyof typeof CONTEXT_FIELDS;
    active: number;
  } | null>(null);

  const typeOptions = [
    { value: 'text', label: '📝 Text' },
    { value: 'embed', label: '📄 Embed' },
    { value: 'script', label: '⚡ Rune' },
  ];

  const sanitizeName = (value: string) =>
    value.replace(/\s+/g, '').slice(0, 32);

  useEffect(() => {
    if (type !== 'script') {
      setPreviewResult(null);
      return;
    }
  
    if (debounceRef.current) clearTimeout(debounceRef.current);
  
    setValidating(true);
    debounceRef.current = setTimeout(() => {
      try {
        const result = runTagSafe(
          content || ' ',
          buildPreviewContext(previewArgs, user, guild)
        );
        if (result.ok) {
          setPreviewResult({
            ok: true,
            text: result.result!.text,
            embeds: result.result!.embeds,
          });
        } else {
          setPreviewResult({ ok: false, error: result.error });
        }
      } catch (e: any) {
        setPreviewResult({
          ok: false,
          error: { name: 'Error', message: e?.message || 'Unknown error' },
        });
      } finally {
        setValidating(false);
      }
    }, 280);
  
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, type, previewArgs, user, guild]);

  function detectContextTrigger(text: string, cursor: number) {
    const before = text.slice(0, cursor);
    const match = before.match(/\$(user|channel|message|guild|args)\.([a-zA-Z0-9_]*)$/);
    if (match) {
      return {
        start: match.index!,
        kind: match[1] as keyof typeof CONTEXT_FIELDS,
        query: match[2] || '',
      };
    }
    const match2 = before.match(/\$(user|channel|message|guild|args)$/);
    if (match2) {
      return {
        start: match2.index!,
        kind: match2[1] as keyof typeof CONTEXT_FIELDS,
        query: '',
      };
    }
    return null;
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    const pos = e.target.selectionStart ?? v.length;
    setContent(v);

    if (type === 'script') {
      const trigger = detectContextTrigger(v, pos);
      if (trigger) {
        setAutocomplete({ ...trigger, active: 0 });
      } else {
        setAutocomplete(null);
      }
    } else {
      setAutocomplete(null);
    }
  }

  const filteredFields = (() => {
    if (!autocomplete) return [];
    const list = CONTEXT_FIELDS[autocomplete.kind] || [];
    const q = autocomplete.query.toLowerCase();
    return list
      .filter(
        (f) =>
          f.field.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      )
      .slice(0, 10);
  })();

  function insertField(field: string) {
    if (!autocomplete || !taRef.current) return;

    const before = content.slice(0, autocomplete.start);
    const after = content.slice(taRef.current.selectionStart);
    const prefix = `$${autocomplete.kind}.`;
    const inserted = `${prefix}${field}`;
    const next = before + inserted + after;

    setContent(next);
    setAutocomplete(null);

    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      taRef.current?.setSelectionRange(pos, pos);
      taRef.current?.focus();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!autocomplete || filteredFields.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocomplete((d) =>
        d ? { ...d, active: Math.min(d.active + 1, filteredFields.length - 1) } : d
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocomplete((d) =>
        d ? { ...d, active: Math.max(d.active - 1, 0) } : d
      );
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const chosen = filteredFields[autocomplete.active] ?? filteredFields[0];
      insertField(chosen.field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAutocomplete(null);
    }
  }

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

    if (type === 'script') {
      const check = runTagSafe(content, buildPreviewContext([], user, guild));
      if (!check.ok) {
        showErrorToast('Rune Error', {
          description: check.error?.message || 'Invalid script',
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const newTag: TagEntry = {
        id: initial?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: cleanName,
        type,
        content: type === 'text' || type === 'script' ? content.trim() : null,
        embedData:
          type === 'embed'
            ? { description: content.trim(), color: '#A52F05' }
            : null,
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
  const isScript = type === 'script';

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

      <div
        className={`relative w-full rounded-2xl bg-[#160a0a] shadow-2xl ${
          isScript ? 'max-w-5xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-lg">
              {initial ? 'Edit Tag' : 'Create New Tag'}
            </h2>
            <p className="text-white/30 text-xs mt-0.5">
              {isScript
                ? 'Rune script'
                : 'Custom server responses'}
            </p>
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

        <form onSubmit={handleSubmit}>
        <div
          className={`p-6 ${
            isScript ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-5'
          } max-h-[80vh] overflow-y-auto overflow-x-visible`}
          >
          <div className="space-y-5">
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
              <p className="text-white/25 text-[10px] mt-1.5">
                No spaces · max 32 characters
              </p>
            </div>
          
            <SelectDropdown
              label="Type"
              value={type}
              onChange={(v) => setType(v as any)}
              options={typeOptions}
            />
          
            {isScript && (
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5">
                  Test Arguments
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={argsInput}
                    onChange={(e) => setArgsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const parts = argsInput
                          .trim()
                          .match(/(?:[^\s"]+|"[^"]*")+/g)
                          ?.map((p) => p.replace(/^"|"$/g, '')) ?? [];
                        if (parts.length) {
                          setPreviewArgs(parts);
                          setArgsInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange font-mono"
                    placeholder='e.g. "random args" 2'
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parts = argsInput
                        .trim()
                        .match(/(?:[^\s"]+|"[^"]*")+/g)
                        ?.map((p) => p.replace(/^"|"$/g, '')) ?? [];
                      if (parts.length) {
                        setPreviewArgs(parts);
                        setArgsInput('');
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-orange/15 hover:bg-orange/25 text-orange-warm text-xs font-medium transition-colors"
                  >
                    Set
                  </button>
                </div>
          
                {previewArgs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {previewArgs.map((arg, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-mono text-white/70"
                      >
                        <span className="text-white/30">args[{i}]</span>
                        {arg}
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewArgs((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="ml-0.5 text-white/30 hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPreviewArgs([])}
                      className="text-[10px] text-white/30 hover:text-white/60 px-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
                <p className="text-white/25 text-[10px] mt-1.5">
                  Used as <code className="text-orange-light/60">args.0</code>,{' '}
                  <code className="text-orange-light/60">args[1]</code>, etc. in the preview
                </p>
              </div>
            )}
          
            <div className="relative">
              <label className="block text-white/50 text-xs font-medium mb-1.5">
                {type === 'text'
                  ? 'Content'
                  : type === 'embed'
                  ? 'Embed Description'
                  : 'Script Source'}
              </label>
          
              <textarea
                ref={taRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setAutocomplete(null), 150)}
                rows={isScript ? 14 : 6}
                spellCheck={false}
                className={`w-full bg-white/5 rounded-lg px-3 py-3 text-sm text-white placeholder-white/30 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-orange resize-none overflow-y-auto ${
                  isScript ? 'h-[320px]' : ''
                }`}
                placeholder={
                  type === 'text'
                    ? 'Hello!'
                    : type === 'embed'
                    ? 'Welcome to the server!'
                    : `say("Hello", $user.username + "!")\nsay(embed()\n  .title("Welcome")\n  .description("You are in " + $guild.name)\n  .color("blurple"))`
                }
                required
              />
            </div>
          </div>

            {isScript && (
              <div className="space-y-4 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                    Live Preview
                    <a
                      href="/guides/rune"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex ml-4 items-center gap-1 text-orange-warm/80 hover:text-orange-warm text-[11px] transition-colors"
                    >
                        Rune language guide →
                    </a>
                  </p>
                  <span className="text-[10px] text-white/30">
                    {validating
                      ? 'Checking…'
                      : previewResult?.ok
                      ? 'Valid'
                      : previewResult
                      ? 'Error'
                      : '-'}
                  </span>
                </div>
            
                {previewResult && !previewResult.ok && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2 flex-shrink-0">
                    <p className="text-red-400 text-xs font-medium mb-1">
                      {previewResult.error?.name || 'Error'}
                      {previewResult.error?.line != null &&
                        ` (line ${previewResult.error.line}${
                          previewResult.error.col != null
                            ? `:${previewResult.error.col}`
                            : ''
                        })`}
                    </p>
                    <p className="text-red-300/80 text-xs mb-2">
                      {previewResult.error?.message}
                    </p>
                    {previewResult.error?.line != null && (
                      <pre className="text-[11px] text-red-200/70 font-mono whitespace-pre overflow-x-auto">
                        {codeSnippet(
                          content,
                          previewResult.error.line,
                          previewResult.error.col
                        )}
                      </pre>
                    )}
                  </div>
                )}
            
                <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#1e1e24] shadow-2xl flex flex-col min-h-[240px] max-h-[440px]">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 flex-shrink-0">
                    <span className="text-sm font-medium text-white/40">#</span>
                    <span className="text-sm font-semibold text-white/70">preview</span>
                  </div>
            
                  <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="flex min-h-full flex-col justify-end gap-4">
                      {!previewResult || validating ? (
                        <p className="text-white/25 text-xs italic">
                          {validating ? 'Running…' : 'Start typing to preview'}
                        </p>
                      ) : previewResult.ok ? (
                        <div className="flex gap-3">
                          <Image
                            src="/Functious.png"
                            alt="Functious bot"
                            width={32}
                            height={32}
                            className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
                          />
            
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold text-orange-300">
                                Functious
                              </span>
                              <span className="rounded bg-orange/20 px-1 py-0.5 text-[10px] leading-none text-white/35">
                                BOT
                              </span>
                            </div>
            
                            {previewResult.text?.trim() && (
                              <div className="mt-0.5 text-sm leading-relaxed text-white/70 whitespace-pre-wrap break-words">
                                {previewResult.text}
                              </div>
                            )}
            
                            {previewResult.embeds?.map((emb, i) => (
                              <div
                                key={i}
                                className="mt-2 rounded overflow-hidden border-l-4 max-w-md"
                                style={{
                                  borderColor: emb.color
                                    ? `#${Number(emb.color).toString(16).padStart(6, '0')}`
                                    : '#A52F05',
                                  background: 'rgba(255,255,255,0.03)',
                                }}
                              >
                                <div className="p-3 space-y-1.5">
                                  {emb.author?.name && (
                                    <p className="text-white/60 text-xs font-medium">
                                      {emb.author.name}
                                    </p>
                                  )}
                                  {emb.title && (
                                    <p className="text-white font-semibold text-sm">
                                      {emb.title}
                                    </p>
                                  )}
                                  {emb.description && (
                                    <p className="text-white/75 text-sm whitespace-pre-wrap leading-relaxed">
                                      {emb.description}
                                    </p>
                                  )}
                                  {Array.isArray(emb.fields) && emb.fields.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                      {emb.fields.map((f: any, fi: number) => (
                                        <div key={fi}>
                                          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">
                                            {f.name}
                                          </p>
                                          <p className="text-white/80 text-xs mt-0.5">
                                            {f.value}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {emb.footer?.text && (
                                    <p className="text-white/40 text-[10px] mt-2">
                                      {emb.footer.text}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
            
                            {!previewResult.text?.trim() &&
                              (!previewResult.embeds || previewResult.embeds.length === 0) && (
                                <p className="text-white/25 text-xs italic mt-1">
                                  Rune produced no output
                                </p>
                              )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-400/70 text-xs">
                          Fix the error to see a preview
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {autocomplete && filteredFields.length > 0 && (
                  <div className="rounded-xl bg-[#1a0e0e] border border-white/10 shadow-xl overflow-hidden max-h-56 overflow-y-auto flex-shrink-0">
                    <div className="px-3 py-1.5 border-b border-white/5 text-[10px] text-white/40 font-medium uppercase tracking-wider">
                      ${autocomplete.kind}
                    </div>
                    {filteredFields.map((f, i) => (
                      <button
                        key={f.field}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertField(f.field)}
                        className={[
                          'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors',
                          i === autocomplete.active
                            ? 'bg-orange/15 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white',
                        ].join(' ')}
                      >
                        <span className="font-mono text-orange-light/80">.{f.field}</span>
                        <span className="text-white/40 truncate">{f.description}</span>
                      </button>
                    ))}
                    <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-white/25">
                      ↑↓ navigate · Tab / Enter select · Esc close
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-[#2A1313]">
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
              disabled={
                !sanitizeName(name) ||
                !content.trim() ||
                busy ||
                (isScript && previewResult && !previewResult.ok) as any
              }
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
        <div className="px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <h2 className="text-white font-bold text-lg">Delete tag?</h2>
          <p className="text-white/30 text-xs mt-0.5">This action cannot be undone.</p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-white/80 font-medium text-sm truncate">
              {tag.name}{' '}
              <span className="text-xs text-white/40">({tag.type})</span>
            </p>
            <p className="text-white/30 text-xs mt-0.5">{tag.uses || 0} uses</p>
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
  const content =
    tag.type === 'text' || tag.type === 'script'
      ? tag.content
      : tag.embedData?.description;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl overflow-visible">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-lg">{tag.name}</h2>
            <p className="text-white/30 text-xs mt-0.5">
              {tag.type === 'script'
                ? '⚡ Rune tag'
                : tag.type === 'embed'
                ? '📄 Embed tag'
                : '📝 Text tag'}
              {(tag.uses ?? 0) > 0 &&
                ` · ${tag.uses} use${tag.uses === 1 ? '' : 's'}`}
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
              {tag.type === 'script'
                ? 'Source'
                : tag.type === 'text'
                ? 'Content'
                : 'Embed Description'}
            </label>
            <div className="w-full bg-white/5 rounded-lg px-3 py-3 text-sm text-white/85 whitespace-pre-wrap font-mono leading-relaxed min-h-[80px]">
              {content || (
                <span className="text-white/25 italic">No content</span>
              )}
            </div>
          </div>

          {tag.createdBy && (
            <div className="flex items-center gap-4 pt-1">
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest">
                  Created by
                </p>
                <p className="text-white/60 text-xs font-mono mt-0.5">
                  {tag.createdBy}
                </p>
              </div>
              {tag.createdAt && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest">
                    Created
                  </p>
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