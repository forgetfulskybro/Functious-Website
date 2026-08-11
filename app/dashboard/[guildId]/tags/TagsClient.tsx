'use client';

import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { TagRowSkeleton } from '@/components/ui/Skeletons';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';
import { runTagSafe } from '@/app/interpreter';
import GetCoords from '@/components/ui/GetCoords';
import { Markdown } from '@/components/guide/CodeBlock';

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

interface ChatMessage {
  id: string;
  kind: 'user' | 'bot' | 'system' | 'error';
  content?: string;
  embeds?: any[];
}

type CtxKind = 'user' | 'channel' | 'message' | 'guild' | 'args';

const LINE_HEIGHT_PX = 22.75;
const VERTICAL_PADDING_PX = 24;
const MAX_VISIBLE_LINES = 18;

const CONTEXT_FIELDS: Record<CtxKind, { field: string; description: string }[]> = {
  user: [
    { field: 'id', description: 'user id' },
    { field: 'username', description: 'username' },
    { field: 'discriminator', description: 'discriminator, like 0001' },
    { field: 'tag', description: 'username#discriminator' },
    { field: 'display_name', description: 'name shown in chat' },
    { field: 'global_name', description: 'global display name' },
    { field: 'avatar', description: 'avatar hash' },
    { field: 'avatar_url', description: 'avatar image URL' },
    { field: 'banner', description: 'banner hash' },
    { field: 'bot', description: 'true if bot' },
    { field: 'system', description: 'true if system account' },
    { field: 'created_at', description: 'account creation date' },
  ],
  channel: [
    { field: 'id', description: 'channel id' },
    { field: 'name', description: 'channel name' },
    { field: 'type', description: 'channel type number' },
    { field: 'guild_id', description: 'guild id' },
    { field: 'position', description: 'list position' },
    { field: 'topic', description: 'channel topic' },
    { field: 'nsfw', description: 'NSFW flag' },
    { field: 'mention', description: 'mention string' },
    { field: 'rate_limit', description: 'slowmode seconds' },
    { field: 'created_at', description: 'created at' },
  ],
  message: [
    { field: 'id', description: 'message id' },
    { field: 'content', description: 'message text' },
    { field: 'author_id', description: 'author id' },
    { field: 'author', description: '$user for author' },
    { field: 'channel_id', description: 'channel id' },
    { field: 'guild_id', description: 'guild id' },
    { field: 'created_at', description: 'sent at' },
    { field: 'edited_timestamp', description: 'last edited' },
    { field: 'mentions', description: 'mentioned users' },
    { field: 'mention_roles', description: 'mentioned roles' },
    { field: 'mention_everyone', description: '@everyone flag' },
    { field: 'attachments', description: 'attachments' },
    { field: 'pinned', description: 'pinned flag' },
    { field: 'tts', description: 'TTS flag' },
    { field: 'webhook_id', description: 'webhook id' },
    { field: 'type', description: 'message type' },
    { field: 'flags', description: 'flags' },
    { field: 'url', description: 'message link' },
  ],
  guild: [
    { field: 'id', description: 'guild id' },
    { field: 'name', description: 'guild name' },
    { field: 'icon', description: 'icon hash' },
    { field: 'icon_url', description: 'icon URL' },
    { field: 'banner', description: 'banner hash' },
    { field: 'banner_url', description: 'banner URL' },
    { field: 'description', description: 'description' },
    { field: 'owner_id', description: 'owner id' },
    { field: 'features', description: 'features list' },
    { field: 'premium_tier', description: 'boost tier' },
    { field: 'member_count', description: 'member count' },
    { field: 'preferred_locale', description: 'locale' },
    { field: 'created_at', description: 'created at' },
  ],
  args: [
    { field: '0', description: 'first argument' },
    { field: '1', description: 'second argument' },
    { field: '2', description: 'third argument' },
    { field: 'length / len(args)', description: 'argument count' },
  ],
};

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

function codeSnippet(code: string, line?: number | null, col?: number | null) {
  if (!code || line == null) return null;
  const text = code.split('\n')[line - 1] ?? '';
  const colIndex = Math.min(Math.max(0, (col ?? 1) - 1), text.length);
  const gutter = String(line);
  return `${gutter} | ${text}\n${' '.repeat(gutter.length + 3 + colIndex)}^`;
}

function ctxUser(user: FluxerUser) {
  const disc = user.discriminator ?? '0';
  const avatar_url = user.avatar
    ? `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.png`
    : null;
  return {
    id: user.id,
    username: user.username,
    discriminator: disc,
    tag: `${user.username}#${disc}`,
    display_name: user.global_name || user.username,
    global_name: user.global_name ?? user.username,
    avatar: user.avatar ?? null,
    avatar_url,
    banner: null,
    bot: false,
    system: false,
    created_at: '2021-05-14T18:32:00.000Z',
  };
}

function buildPreviewContext(args: string[], user: FluxerUser, guild: FluxerGuild) {
  const u = ctxUser(user);
  return {
    args,
    user: u,
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
      author: u,
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

function tokenizeArgs(text: string) {
  const args: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) args.push(m[1] ?? m[2] ?? m[3]);
  return args;
}

function BotEmbed({ emb }: { emb: any }) {
  const color = emb.color
    ? `#${Number(emb.color).toString(16).padStart(6, '0')}`
    : '#A52F05';
  return (
    <div
      className="mt-2 max-w-md overflow-hidden rounded border-l-4"
      style={{ borderColor: color, background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="space-y-1.5 p-3">
        {emb.author?.name && (
          <p className="text-xs font-medium text-white/60">{emb.author.name}</p>
        )}
        {emb.title && <p className="text-sm font-semibold text-white">{emb.title}</p>}
        {emb.description && (
          <div className="text-sm leading-relaxed text-white/75">
            <Markdown text={String(emb.description)} />
          </div>
        )}
        {Array.isArray(emb.fields) && emb.fields.length > 0 && (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {emb.fields.map((f: any, i: number) => (
              <div key={i}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  <Markdown text={String(f.name ?? '')} />
                </p>
                <div className="mt-0.5 text-xs text-white/80">
                  <Markdown text={String(f.value ?? '')} />
                </div>
              </div>
            ))}
          </div>
        )}
        {emb.footer?.text && (
          <p className="mt-2 text-[10px] text-white/40">{emb.footer.text}</p>
        )}
      </div>
    </div>
  );
}

function BotMessage({ text, embeds }: { text?: string; embeds?: any[] }) {
  const empty = !text?.trim() && (!embeds || embeds.length === 0);
  return (
    <div className="flex gap-3">
      <Image
        src="/Functious.png"
        alt="Functious"
        width={32}
        height={32}
        className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-orange-300">Functious</span>
          <span className="rounded bg-orange/20 px-1 py-0.5 text-[10px] leading-none text-white/35">
            BOT
          </span>
        </div>
        {text?.trim() && (
          <div className="mt-0.5 break-words text-sm leading-relaxed text-white/70">
            <Markdown text={text} />
          </div>
        )}
        {embeds?.map((emb, i) => (
          <BotEmbed key={i} emb={emb} />
        ))}
        {empty && (
          <p className="mt-1 text-xs italic text-white/25">Rune produced no output</p>
        )}
      </div>
    </div>
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
  const [type, setType] = useState<'text' | 'embed' | 'script'>(initial?.type ?? 'text');
  const [content, setContent] = useState(() =>
    initial?.type === 'embed'
      ? initial.embedData?.description ?? ''
      : initial?.content ?? ''
  );
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
  const [interactive, setInteractive] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [autocomplete, setAutocomplete] = useState<{
    start: number;
    query: string;
    kind: CtxKind;
    active: number;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const lines = content.split('\n');
  const editorHeight =
    Math.min(Math.max(lines.length, 1), MAX_VISIBLE_LINES) * LINE_HEIGHT_PX +
    VERTICAL_PADDING_PX;
  const gutterWidth = gutterRef.current?.offsetWidth ?? 40;
  const sanitizeName = (v: string) => v.replace(/\s+/g, '').slice(0, 32);
  const cleanName = sanitizeName(name);
  const tagNameHint = cleanName || 'mytag';
  const isScript = type === 'script';
  const busy = submitting || !!saving;

  const filteredFields = useMemo(() => {
    if (!autocomplete) return [];
    const q = autocomplete.query.toLowerCase();
    return (CONTEXT_FIELDS[autocomplete.kind] || [])
      .filter(
        (f) =>
          f.field.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [autocomplete]);

  useEffect(() => {
    if (type !== 'script' || interactive) {
      if (type !== 'script') setPreviewResult(null);
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
        setPreviewResult(
          result.ok
            ? { ok: true, text: result.result!.text, embeds: result.result!.embeds }
            : { ok: false, error: result.error }
        );
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
  }, [content, type, previewArgs, user, guild, interactive]);

  useEffect(() => {
    if (interactive) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, interactive]);

  function refreshCaretPos(el: HTMLTextAreaElement) {
    const coords = GetCoords(el, el.selectionStart ?? 0, LINE_HEIGHT_PX);
    setCaretPos({
      top: coords.top - el.scrollTop + coords.height,
      left: coords.left - el.scrollLeft,
    });
  }

  function updateCursor(el: HTMLTextAreaElement) {
    const parts = el.value.slice(0, el.selectionStart ?? 0).split('\n');
    setCursor({
      line: parts.length,
      col: (parts[parts.length - 1]?.length ?? 0) + 1,
    });
    refreshCaretPos(el);
  }

  function detectContextTrigger(text: string, cursorPos: number) {
    const before = text.slice(0, cursorPos);
    const m =
      before.match(/\$(user|channel|message|guild|args)\.([a-zA-Z0-9_]*)$/) ||
      before.match(/\$(user|channel|message|guild|args)$/);
    if (!m) return null;
    return {
      start: m.index!,
      kind: m[1] as CtxKind,
      query: m[2] || '',
    };
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    const pos = e.target.selectionStart ?? v.length;
    setContent(v);
    updateCursor(e.target);
    if (type === 'script') {
      const trigger = detectContextTrigger(v, pos);
      setAutocomplete(trigger ? { ...trigger, active: 0 } : null);
      if (trigger) refreshCaretPos(e.target);
    } else {
      setAutocomplete(null);
    }
  }

  function insertField(field: string) {
    if (!autocomplete || !taRef.current) return;
    const before = content.slice(0, autocomplete.start);
    const after = content.slice(taRef.current.selectionStart);
    const inserted = `$${autocomplete.kind}.${field}`;
    setContent(before + inserted + after);
    setAutocomplete(null);
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      taRef.current?.setSelectionRange(pos, pos);
      taRef.current?.focus();
      if (taRef.current) updateCursor(taRef.current);
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
      setAutocomplete((d) => (d ? { ...d, active: Math.max(d.active - 1, 0) } : d));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      insertField((filteredFields[autocomplete.active] ?? filteredFields[0]).field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAutocomplete(null);
    }
  }

  function runInteractiveCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, kind: 'user', content: trimmed };
    const match = trimmed.match(/^(?:f!|!)(?:tags?|t)\s+(\S+)(?:\s+([\s\S]*))?$/i);

    if (!match || (cleanName && match[1].toLowerCase() !== cleanName.toLowerCase())) {
      setChatMessages((p) => [...p, userMsg]);
      return;
    }
    if (!content.trim()) {
      setChatMessages((p) => [
        ...p,
        userMsg,
        { id: `s-${Date.now()}`, kind: 'system', content: 'Script is empty — write some Rune first.' },
      ]);
      return;
    }

    try {
      const result = runTagSafe(
        content,
        buildPreviewContext(tokenizeArgs(match[2] || ''), user, guild)
      );
      if (!result.ok) {
        const err = result.error;
        const loc =
          err?.line != null
            ? ` (line ${err.line}${err.col != null ? `:${err.col}` : ''})`
            : '';
        setChatMessages((p) => [
          ...p,
          userMsg,
          {
            id: `e-${Date.now()}`,
            kind: 'error',
            content: `${err?.name || 'Error'}${loc}: ${err?.message || 'Unknown error'}`,
          },
        ]);
        return;
      }
      setChatMessages((p) => [
        ...p,
        userMsg,
        {
          id: `b-${Date.now()}`,
          kind: 'bot',
          content: result.result!.text,
          embeds: result.result!.embeds || [],
        },
      ]);
    } catch (e: any) {
      setChatMessages((p) => [
        ...p,
        userMsg,
        { id: `e-${Date.now()}`, kind: 'error', content: e?.message || 'Unknown error' },
      ]);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const finalName = sanitizeName(name);
    if (!finalName) {
      showErrorToast('Error', { description: 'Tag name is required (no spaces).' });
      return;
    }
    if (existingNames.includes(finalName.toLowerCase())) {
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
      await onSave({
        id: initial?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: finalName,
        type,
        content: type === 'text' || type === 'script' ? content.trim() : null,
        embedData:
          type === 'embed' ? { description: content.trim(), color: '#A52F05' } : null,
        createdBy: initial?.createdBy ?? userId,
        createdAt: initial?.createdAt ?? Math.floor(Date.now() / 1000),
        uses: initial?.uses ?? 0,
      });
    } catch {
      showErrorToast('Error', { description: 'Failed to save tag.' });
    } finally {
      setSubmitting(false);
    }
  };

  const applyArgs = () => {
    const parts =
      argsInput
        .trim()
        .match(/(?:[^\s"]+|"[^"]*")+/g)
        ?.map((p) => p.replace(/^"|"$/g, '')) ?? [];
    if (parts.length) {
      setPreviewArgs(parts);
      setArgsInput('');
    }
  };

  const userAvatarUrl = user.avatar
    ? `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.png`
    : null;

  const padY = VERTICAL_PADDING_PX / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col rounded-2xl bg-[#160a0a] shadow-2xl ${
          isScript ? 'max-w-6xl' : 'max-w-lg'
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2A1313] px-5 pb-3 pt-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {initial ? 'Edit Tag' : 'Create New Tag'}
            </h2>
            <p className="mt-0.5 text-xs text-white/30">
              {isScript ? 'Rune script with live preview' : 'Custom server responses'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="text-xl leading-none text-white/40 hover:text-white disabled:opacity-50">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Tag Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(sanitizeName(e.target.value))}
                onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
                className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                placeholder="welcome"
                maxLength={32}
                autoComplete="off"
                spellCheck={false}
                required
              />
              <p className="mt-1 text-[10px] text-white/25">No spaces · max 32 characters</p>
            </div>

            <div className={`grid items-start gap-4 ${isScript ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              <SelectDropdown
                label="Type"
                value={type}
                onChange={(v) => setType(v as any)}
                options={[
                  { value: 'text', label: '📝 Text' },
                  { value: 'embed', label: '📄 Embed' },
                  { value: 'script', label: '⚡ Rune' },
                ]}
              />

              {isScript && !interactive && (
                <div className="flex flex-col">
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Test Arguments
                  </label>
                  <div className="flex h-[42px] gap-2">
                    <input
                      type="text"
                      value={argsInput}
                      onChange={(e) => setArgsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyArgs();
                        }
                      }}
                      className="h-full flex-1 rounded-lg bg-white/5 px-3 font-mono text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                      placeholder='e.g. "hello" 2'
                    />
                    <button
                      type="button"
                      onClick={applyArgs}
                      className="h-full flex-shrink-0 rounded-lg bg-orange/15 px-3 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/25"
                    >
                      Set
                    </button>
                  </div>
                  {previewArgs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {previewArgs.map((arg, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70"
                        >
                          <span className="text-white/30">args[{i}]</span>
                          {arg}
                          <button
                            type="button"
                            onClick={() => setPreviewArgs((p) => p.filter((_, j) => j !== i))}
                            className="ml-0.5 text-white/30 hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPreviewArgs([])}
                        className="px-1 text-[10px] text-white/30 hover:text-white/60"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isScript ? (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  {type === 'text' ? 'Content' : 'Embed Description'}
                </label>
                <textarea
                  ref={taRef}
                  value={content}
                  onChange={handleContentChange}
                  rows={6}
                  spellCheck={false}
                  className="w-full resize-none rounded-lg bg-white/5 px-3 py-3 font-mono text-sm leading-relaxed text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                  placeholder={type === 'text' ? 'Hello!' : 'Welcome to the server!'}
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                <div className="relative min-w-0">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-medium text-white/50">Script Source</label>
                    <a
                      href="/guides/rune"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-orange-warm/80 transition-colors hover:text-orange-warm"
                    >
                      Rune guide →
                    </a>
                  </div>
                  <div
                    ref={editorWrapRef}
                    className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
                  >
                    <div className="flex overflow-hidden" style={{ height: editorHeight }}>
                      <div
                        ref={gutterRef}
                        className="flex-shrink-0 select-none overflow-hidden border-r border-white/5 bg-white/[0.02] text-center font-mono text-sm text-white/25"
                        style={{
                          paddingTop: padY,
                          paddingBottom: padY,
                          lineHeight: `${LINE_HEIGHT_PX}px`,
                        }}
                        aria-hidden
                      >
                        {lines.map((_, i) => (
                          <div
                            key={i}
                            className="px-2.5"
                            style={{ height: LINE_HEIGHT_PX, lineHeight: `${LINE_HEIGHT_PX}px` }}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <textarea
                        ref={taRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => updateCursor(e.currentTarget)}
                        onKeyUp={(e) => updateCursor(e.currentTarget)}
                        onSelect={(e) => updateCursor(e.currentTarget)}
                        onScroll={(e) => {
                          if (gutterRef.current) {
                            gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                          }
                          refreshCaretPos(e.currentTarget);
                        }}
                        onBlur={() => setTimeout(() => setAutocomplete(null), 150)}
                        spellCheck={false}
                        className="h-full w-full resize-none overflow-y-auto bg-transparent font-mono text-sm text-white placeholder-white/30 focus:outline-none"
                        style={{
                          paddingTop: padY,
                          paddingBottom: padY,
                          paddingLeft: 12,
                          paddingRight: 12,
                          lineHeight: `${LINE_HEIGHT_PX}px`,
                          whiteSpace: 'pre',
                          overflowWrap: 'normal',
                          wordBreak: 'normal',
                        }}
                        placeholder={`say("Hello", $user.username + "!")\nsay(embed()\n  .title("Welcome")\n  .description("You are in " + $guild.name)\n  .color("blurple"))`}
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-3 py-1">
                      <button
                        type="button"
                        onClick={() => taRef.current?.focus()}
                        className="font-mono text-[11px] text-white/35 transition-colors hover:text-white/60"
                      >
                        Ln {cursor.line}, Col {cursor.col}
                      </button>
                      <span className="font-mono text-[11px] text-white/25">
                        {lines.length} line{lines.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {autocomplete && filteredFields.length > 0 && (
                      <div
                        className="pointer-events-auto absolute z-50 max-h-48 w-72 overflow-y-auto rounded-lg border border-white/15 bg-[#1a0e0e] shadow-2xl"
                        style={{
                          top: Math.min(Math.max(caretPos.top, 8), Math.max(editorHeight - 160, 8)),
                          left: Math.min(
                            Math.max(caretPos.left + gutterWidth, 8),
                            Math.max((editorWrapRef.current?.clientWidth ?? 320) - 296, 8)
                          ),
                        }}
                      >
                        <div className="sticky top-0 border-b border-white/5 bg-[#1a0e0e] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                          ${autocomplete.kind}
                        </div>
                        {filteredFields.map((f, i) => (
                          <button
                            key={f.field}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertField(f.field)}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                              i === autocomplete.active
                                ? 'bg-orange/15 text-white'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="font-mono text-orange-light/80">.{f.field}</span>
                            <span className="truncate text-white/40">{f.description}</span>
                          </button>
                        ))}
                        <div className="sticky bottom-0 border-t border-white/5 bg-[#1a0e0e] px-3 py-1.5 text-[10px] text-white/25">
                          ↑↓ navigate · Tab / Enter select · Esc close
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                      {interactive ? 'Interactive' : 'Live Preview'}
                    </p>
                    <div className="flex items-center gap-2">
                      {!interactive && (
                        <span className="text-[10px] text-white/30">
                          {validating
                            ? 'Checking…'
                            : previewResult?.ok
                            ? 'Valid'
                            : previewResult
                            ? 'Error'
                            : '—'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setInteractive((v) => !v);
                          if (!interactive && chatMessages.length === 0) {
                            setChatMessages([
                              {
                                id: 'welcome',
                                kind: 'system',
                                content: `Interactive preview · try \`f!tag ${tagNameHint} hello\``,
                              },
                            ]);
                          }
                        }}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                          interactive ? 'bg-orange/80' : 'bg-white/10'
                        }`}
                        title={interactive ? 'Switch to live preview' : 'Switch to interactive chat'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                            interactive ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                      <span className="hidden text-[10px] text-white/40 sm:inline">
                        {interactive ? 'Chat' : 'Live'}
                      </span>
                    </div>
                  </div>

                  {!interactive && previewResult && !previewResult.ok && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                      <p className="text-xs font-medium text-red-400">
                        {previewResult.error?.name || 'Error'}
                        {previewResult.error?.line != null &&
                          ` (line ${previewResult.error.line}${
                            previewResult.error.col != null
                              ? `:${previewResult.error.col}`
                              : ''
                          })`}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-red-300/80">
                        {previewResult.error?.message}
                      </p>
                      {previewResult.error?.line != null && (
                        <pre className="mt-1.5 max-h-16 overflow-x-auto whitespace-pre font-mono text-[10px] text-red-200/60">
                          {codeSnippet(
                            content,
                            previewResult.error.line,
                            previewResult.error.col
                          )}
                        </pre>
                      )}
                    </div>
                  )}

                  <div
                    className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e24]"
                    style={{ maxHeight: editorHeight + 29 }}
                  >
                    <div className="flex flex-shrink-0 items-center gap-2 border-b border-white/10 px-4 py-2">
                      <span className="text-sm font-medium text-white/40">#</span>
                      <span className="text-sm font-semibold text-white/70">
                        {interactive ? 'testing-1' : 'preview'}
                      </span>
                    </div>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
                      {!interactive ? (
                        !previewResult || validating ? (
                          <p className="text-xs italic text-white/25">
                            {validating ? 'Running…' : 'Start typing to preview'}
                          </p>
                        ) : previewResult.ok ? (
                          <BotMessage text={previewResult.text} embeds={previewResult.embeds} />
                        ) : (
                          <p className="text-xs text-red-400/70">Fix the error to see a preview</p>
                        )
                      ) : chatMessages.length === 0 ? (
                        <p className="text-xs italic text-white/25">Send a command to run this tag…</p>
                      ) : (
                        chatMessages.map((msg) => {
                          if (msg.kind === 'user') {
                            return (
                              <div key={msg.id} className="flex gap-3">
                                {userAvatarUrl ? (
                                  <Image
                                    src={userAvatarUrl}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
                                  />
                                ) : (
                                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange/25 text-xs font-bold text-orange-warm">
                                    {(user.username || 'U')[0]}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-semibold text-white/80">
                                    {user.global_name || user.username}
                                  </span>
                                  <div className="mt-0.5 break-words text-sm leading-relaxed text-white/70">
                                    <Markdown text={msg.content!} />
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          if (msg.kind === 'bot') {
                            return (
                              <BotMessage key={msg.id} text={msg.content} embeds={msg.embeds} />
                            );
                          }
                          if (msg.kind === 'error') {
                            return (
                              <div
                                key={msg.id}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2"
                              >
                                <p className="whitespace-pre-wrap font-mono text-xs text-red-300/90">
                                  <Markdown text={msg.content!} />
                                </p>
                              </div>
                            );
                          }
                          return (
                            <p key={msg.id} className="py-1 text-center text-xs text-white/30">
                              <Markdown text={msg.content!} />
                            </p>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {interactive && (
                      <div className="flex-shrink-0 border-t border-white/5 px-3 py-2">
                        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#0e0e10] px-2.5 py-1.5">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const v = chatInput.trim();
                                if (!v) return;
                                setChatInput('');
                                runInteractiveCommand(v);
                              }
                            }}
                            className="min-w-0 flex-1 bg-transparent text-sm text-white/90 placeholder-white/30 focus:outline-none"
                            placeholder="Message #testing-1"
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </div>
                        <p className="mt-1.5 px-1 text-[10px] text-white/20">
                          f!tag {tagNameHint} [args…] · Enter to send
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 gap-3 border-t border-[#2A1313] px-5 pb-5 pt-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !sanitizeName(name) ||
                !content.trim() ||
                busy ||
                ((isScript && !interactive && previewResult && !previewResult.ok) as any)
              }
              className="flex-1 rounded-xl bg-orange py-3 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Delete tag?</h2>
          <p className="mt-0.5 text-xs text-white/30">This action cannot be undone.</p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="truncate text-sm font-medium text-white/80">
              {tag.name} <span className="text-xs text-white/40">({tag.type})</span>
            </p>
            <p className="mt-0.5 text-xs text-white/30">{tag.uses || 0} uses</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              setDeleting(true);
              try {
                await onConfirm();
              } finally {
                setDeleting(false);
              }
            }}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
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
  const typeLabel =
    tag.type === 'script' ? '⚡ Rune tag' : tag.type === 'embed' ? '📄 Embed tag' : '📝 Text tag';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-visible rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A1313] px-6 pb-4 pt-5">
          <div>
            <h2 className="text-lg font-bold text-white">{tag.name}</h2>
            <p className="mt-0.5 text-xs text-white/30">
              {typeLabel}
              {(tag.uses ?? 0) > 0 && ` · ${tag.uses} use${tag.uses === 1 ? '' : 's'}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-white/40 transition-colors hover:text-white/80">
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              {tag.type === 'script' ? 'Source' : tag.type === 'text' ? 'Content' : 'Embed Description'}
            </label>
            <div className="min-h-[80px] w-full whitespace-pre-wrap rounded-lg bg-white/5 px-3 py-3 font-mono text-sm leading-relaxed text-white/85">
              {content || <span className="italic text-white/25">No content</span>}
            </div>
          </div>
          {tag.createdBy && (
            <div className="flex items-center gap-4 pt-1">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30">Created by</p>
                <p className="mt-0.5 font-mono text-xs text-white/60">{tag.createdBy}</p>
              </div>
              {tag.createdAt && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Created</p>
                  <p className="mt-0.5 text-xs text-white/60">
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
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}