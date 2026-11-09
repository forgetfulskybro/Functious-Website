'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Markdown } from '@/components/guide/CodeBlock';
import GetCoords from '@/components/ui/GetCoords';
import { runTagSafe } from '@/app/interpreter';
import type { FluxerGuild, FluxerUser } from '@/lib/types';

export const RUNE_LINE_HEIGHT_PX = 22.75;
export const RUNE_VERTICAL_PADDING_PX = 24;
export const RUNE_MAX_VISIBLE_LINES = 18;

export type RuneTriggerMode = 'off' | 'trigger' | 'anywhere';

type PreviewChannel = {
  id: string;
  name?: string | null;
  type?: number | null;
};

type RunePreviewResult =
  | { ok: true; text?: string; embeds?: any[]; reply?: boolean }
  | { ok: false; error: any };

type ReplyTarget = {
  name: string;
  avatarUrl: string | null;
  content: string;
};

type CtxKind = 'user' | 'channel' | 'message' | 'guild' | 'args';

type ChatMessage = {
  id: string;
  kind: 'user' | 'bot' | 'system' | 'error';
  content?: string;
  embeds?: any[];
  replyTo?: string;
};

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

export function runeEditorHeight(content: string) {
  const lines = content.split('\n');
  return (
    Math.min(Math.max(lines.length, 1), RUNE_MAX_VISIBLE_LINES) *
      RUNE_LINE_HEIGHT_PX +
    RUNE_VERTICAL_PADDING_PX
  );
}

function codeSnippet(code: string, line?: number | null, col?: number | null) {
  if (!code || line == null) return null;
  const text = code.split('\n')[line - 1] ?? '';
  const colIndex = Math.min(Math.max(0, (col ?? 1) - 1), text.length);
  const gutter = String(line);
  return `${gutter} | ${text}\n${' '.repeat(gutter.length + 3 + colIndex)}^`;
}

export function stripRuneCodeFence(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:[a-zA-Z0-9_-]+)?\s*\n?([\s\S]*?)```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function avatarSrc(user: FluxerUser, fallback: boolean) {
  if (!user.avatar) {
    if (!fallback) return null;
    try {
      return `https://fluxerstatic.com/avatars/${Number(BigInt(user.id) >> BigInt(22)) % 6}.png`;
    } catch {
      return null;
    }
  }
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'webp';
  return `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.${ext}?size=160`;
}

function previewUser(user: FluxerUser, fallbackAvatar: boolean) {
  const displayName = user.global_name || user.username;
  const discriminator = user.discriminator || '0';
  return {
    id: user.id,
    username: user.username,
    discriminator,
    tag: `${user.username}#${discriminator}`,
    display_name: displayName,
    global_name: displayName,
    avatar: user.avatar,
    avatar_url: avatarSrc(user, fallbackAvatar),
    banner: null,
    bot: false,
    system: false,
    created_at: '2021-05-14T18:32:00.000Z',
  };
}

function buildPreviewContext({
  variant,
  user,
  guild,
  channel,
  messageContent,
  args = [],
}: {
  variant: 'sticky' | 'tag';
  user: FluxerUser;
  guild: FluxerGuild;
  channel?: PreviewChannel | null;
  messageContent: string;
  args?: string[];
}) {
  const isTag = variant === 'tag';
  const u = previewUser(user, isTag);
  const channelId = isTag
    ? '987654321098765432'
    : channel?.id || '987654321098765432';
  const channelName = isTag ? 'general' : channel?.name || 'preview';
  const guildName = guild.name || 'Community';
  const memberCount = Number((guild as any).memberCount) || 128;

  return {
    args,
    user: u,
    channel: {
      id: channelId,
      name: channelName,
      type: isTag ? 0 : channel?.type ?? 0,
      guild_id: guild.id,
      position: 3,
      topic: isTag ? 'General discussion' : null,
      nsfw: false,
      mention: `<#${channelId}>`,
      rate_limit: 0,
      created_at: isTag ? '2022-01-10T09:15:00.000Z' : null,
    },
    message: {
      id: '111222333444555666',
      content: messageContent,
      author_id: user.id,
      author: u,
      channel_id: channelId,
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
      url: isTag
        ? `https://fluxer.app/channels/${guild.id}/${channelId}/111222333444555666`
        : null,
    },
    guild: {
      id: guild.id,
      name: guildName,
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
      member_count: memberCount,
      preferred_locale: 'en-US',
      created_at: isTag ? '2020-11-03T14:22:00.000Z' : null,
    },
    ...(isTag
      ? {}
      : {
          community: guildName,
          server: guildName,
          members: memberCount,
          count: 1,
          sticky: {
            channel: `<#${channelId}>`,
            type: 'script',
            count: 1,
          },
        }),
  };
}

function runRune(
  content: string,
  options: {
    variant: 'sticky' | 'tag';
    user: FluxerUser;
    guild: FluxerGuild;
    channel?: PreviewChannel | null;
    messageContent: string;
    args?: string[];
  }
): RunePreviewResult {
  try {
    const output = runTagSafe(content || ' ', buildPreviewContext(options));
    if (!output.ok) {
      return { ok: false, error: output.error };
    }
    return {
      ok: true,
      text: output.result?.text,
      embeds: output.result?.embeds,
      reply: output.result?.reply,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: { name: 'Error', message: error?.message || 'Unknown error' },
    };
  }
}

export function validateRuneScript(
  content: string,
  options: {
    user: FluxerUser;
    guild: FluxerGuild;
    messageContent: string;
    args?: string[];
  }
) {
  const result = runRune(content, { ...options, variant: 'tag' });
  return result.ok
    ? ({ ok: true } as const)
    : ({ ok: false, error: result.error } as const);
}

function groupEmbedFields(fields: any[]): { inline: boolean; items: any[] }[] {
  const groups: { inline: boolean; items: any[] }[] = [];
  let currentInline: any[] = [];

  const flushInline = () => {
    while (currentInline.length > 0) {
      groups.push({ inline: true, items: currentInline.splice(0, 3) });
    }
  };

  for (const field of fields) {
    if (field?.inline === true) {
      currentInline.push(field);
    } else {
      flushInline();
      groups.push({ inline: false, items: [field] });
    }
  }
  flushInline();
  return groups;
}

function parseEmbedTimestamp(raw: unknown): Date | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === 'number') {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      const ms = numeric < 1e12 ? numeric * 1000 : numeric;
      const date = new Date(ms);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatEmbedTimestamp(date: Date) {
  return date.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function embedColor(color: unknown) {
  if (typeof color === 'number' && Number.isFinite(color)) {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
  if (typeof color === 'string' && color) {
    if (color.startsWith('#')) return color;
    const numeric = Number(color);
    if (Number.isFinite(numeric)) {
      return `#${numeric.toString(16).padStart(6, '0')}`;
    }
    return `#${color}`;
  }
  return '#A52F05';
}

function FieldBlock({ field }: { field: any }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-white/50">
        <Markdown text={String(field.name ?? '')} />
      </p>
      <div className="mt-0.5 text-xs text-white/80">
        <Markdown text={String(field.value ?? '')} />
      </div>
    </div>
  );
}

function BotEmbed({ embed }: { embed: any }) {
  const fieldGroups =
    Array.isArray(embed.fields) && embed.fields.length > 0
      ? groupEmbedFields(embed.fields)
      : [];
  const timestamp = parseEmbedTimestamp(embed.timestamp);
  const footerText = embed.footer?.text;

  return (
    <div
      className="mt-2 max-w-md overflow-hidden rounded border-l-4"
      style={{
        borderColor: embedColor(embed.color),
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <div className="space-y-1.5 p-3">
        {embed.author?.name && (
          <p className="text-xs font-medium text-white/60">{embed.author.name}</p>
        )}
        {embed.title &&
          (embed.url ? (
            <a
              href={embed.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-blue-400 hover:underline"
            >
              {embed.title}
            </a>
          ) : (
            <p className="text-sm font-semibold text-white">{embed.title}</p>
          ))}
        {embed.description && (
          <div className="text-sm leading-relaxed text-white/75">
            <Markdown text={String(embed.description)} />
          </div>
        )}
        {fieldGroups.length > 0 && (
          <div className="mt-2 space-y-2">
            {fieldGroups.map((group, groupIndex) =>
              group.inline ? (
                <div
                  key={groupIndex}
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${group.items.length}, minmax(0, 1fr))`,
                  }}
                >
                  {group.items.map((field, fieldIndex) => (
                    <FieldBlock key={fieldIndex} field={field} />
                  ))}
                </div>
              ) : (
                <div key={groupIndex}>
                  <FieldBlock field={group.items[0]} />
                </div>
              )
            )}
          </div>
        )}
        {(footerText || timestamp) && (
          <p className="mt-2 text-[10px] text-white/40">
            {footerText}
            {footerText && timestamp ? ' · ' : ''}
            {timestamp ? formatEmbedTimestamp(timestamp) : null}
          </p>
        )}
      </div>
    </div>
  );
}

function ReplyPreview({ target }: { target: ReplyTarget }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm leading-5">
      {target.avatarUrl ? (
        <Image
          src={target.avatarUrl}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4 flex-shrink-0 rounded-full"
        />
      ) : (
        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-orange/25 text-[9px] font-bold text-orange-warm">
          {(target.name || 'U')[0]}
        </span>
      )}
      <span className="flex-shrink-0 font-medium text-white/70">{target.name}</span>
      <span className="min-w-0 truncate text-white/45">{target.content}</span>
    </div>
  );
}

function ReplyConnector() {
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 h-[22px] w-10 text-white/20"
      viewBox="0 0 40 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 10H22a6 6 0 0 0-6 6v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserMessage({
  user,
  text,
  avatarUrl,
}: {
  user: FluxerUser;
  text: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex gap-3">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
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
          <Markdown text={text} />
        </div>
      </div>
    </div>
  );
}

function BotMessage({
  text,
  embeds,
  replyTo,
}: {
  text?: string;
  embeds?: any[];
  replyTo?: ReplyTarget;
}) {
  const empty = !text?.trim() && (!embeds || embeds.length === 0);

  return (
    <div className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
      {replyTo && <ReplyConnector />}
      {replyTo && (
        <div className="col-start-2 row-start-1 pb-0.5">
          <ReplyPreview target={replyTo} />
        </div>
      )}
      <Image
        src="/Functious.png"
        alt="Functious"
        width={32}
        height={32}
        className={[
          'col-start-1 mt-0.5 h-8 w-8 flex-shrink-0 rounded-full',
          replyTo ? 'row-start-2' : 'row-start-1',
        ].join(' ')}
      />
      <div
        className={[
          'col-start-2 min-w-0',
          replyTo ? 'row-start-2' : 'row-start-1',
        ].join(' ')}
      >
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
        {embeds?.map((embed, index) => (
          <BotEmbed key={index} embed={embed} />
        ))}
        {empty && (
          <p className="mt-1 text-xs italic text-white/25">Rune produced no output</p>
        )}
      </div>
    </div>
  );
}

function PreviewError({ content, error }: { content: string; error: any }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
      <p className="text-xs font-medium text-red-400">
        {error?.name || 'Error'}
        {error?.line != null &&
          ` (line ${error.line}${error.col != null ? `:${error.col}` : ''})`}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs text-red-300/80">
        {error?.message}
      </p>
      {error?.line != null && (
        <pre className="mt-1.5 max-h-16 overflow-x-auto whitespace-pre font-mono text-[10px] text-red-200/60">
          {codeSnippet(content, error.line, error.col)}
        </pre>
      )}
    </div>
  );
}

function PreviewWindow({
  title,
  maxHeight,
  children,
  footer,
}: {
  title: string;
  maxHeight: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e24]"
      style={{ maxHeight }}
    >
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-white/10 px-4 py-2">
        <span className="text-sm font-medium text-white/40">#</span>
        <span className="truncate text-sm font-semibold text-white/70">{title}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {children}
      </div>

      {footer}
    </div>
  );
}

function RuneEditorPanel({
  content,
  onChange,
  label,
  placeholder,
  maxLength,
  disabled,
  autocomplete,
  footerRight,
  hint,
  cursorButton,
}: {
  content: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  maxLength?: number;
  disabled?: boolean;
  autocomplete?: boolean;
  footerRight: string;
  hint?: ReactNode;
  cursorButton?: boolean;
}) {
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [autocompleteState, setAutocompleteState] = useState<{
    start: number;
    query: string;
    kind: CtxKind;
    active: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const lines = content.split('\n');
  const editorHeight = runeEditorHeight(content);
  const padY = RUNE_VERTICAL_PADDING_PX / 2;
  const gutterWidth = gutterRef.current?.offsetWidth ?? 40;
  const autocompleteEnabled = !!autocomplete;

  const filteredFields = useMemo(() => {
    if (!autocompleteState) return [];
    const query = autocompleteState.query.toLowerCase();
    return (CONTEXT_FIELDS[autocompleteState.kind] || [])
      .filter(
        (field) =>
          field.field.toLowerCase().includes(query) ||
          field.description.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [autocompleteState]);

  function refreshCaretPos(element: HTMLTextAreaElement) {
    const coords = GetCoords(element, element.selectionStart ?? 0, RUNE_LINE_HEIGHT_PX);
    setCaretPos({
      top: coords.top - element.scrollTop + coords.height,
      left: coords.left - element.scrollLeft,
    });
  }

  function updateCursor(element: HTMLTextAreaElement) {
    const parts = element.value.slice(0, element.selectionStart ?? 0).split('\n');
    setCursor({
      line: parts.length,
      col: (parts[parts.length - 1]?.length ?? 0) + 1,
    });
    if (autocompleteEnabled) refreshCaretPos(element);
  }

  function detectContextTrigger(text: string, cursorPosition: number) {
    const before = text.slice(0, cursorPosition);
    const match =
      before.match(/\$(user|channel|message|guild|args)\.([a-zA-Z0-9_]*)$/) ||
      before.match(/\$(user|channel|message|guild|args)$/);
    if (!match) return null;
    return {
      start: match.index!,
      kind: match[1] as CtxKind,
      query: match[2] || '',
    };
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    const position = event.target.selectionStart ?? value.length;
    onChange(value);
    updateCursor(event.target);

    if (autocompleteEnabled) {
      const trigger = detectContextTrigger(value, position);
      setAutocompleteState(trigger ? { ...trigger, active: 0 } : null);
      if (trigger) refreshCaretPos(event.target);
    } else {
      setAutocompleteState(null);
    }
  }

  function insertField(field: string) {
    if (!autocompleteState || !textareaRef.current) return;
    const before = content.slice(0, autocompleteState.start);
    const after = content.slice(textareaRef.current.selectionStart);
    const inserted = `$${autocompleteState.kind}.${field}`;
    onChange(before + inserted + after);
    setAutocompleteState(null);
    requestAnimationFrame(() => {
      const position = before.length + inserted.length;
      textareaRef.current?.setSelectionRange(position, position);
      textareaRef.current?.focus();
      if (textareaRef.current) updateCursor(textareaRef.current);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!autocompleteState || filteredFields.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAutocompleteState((current) =>
        current
          ? {
              ...current,
              active: Math.min(current.active + 1, filteredFields.length - 1),
            }
          : current
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setAutocompleteState((current) =>
        current
          ? { ...current, active: Math.max(current.active - 1, 0) }
          : current
      );
    } else if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault();
      insertField(
        (filteredFields[autocompleteState.active] ?? filteredFields[0]).field
      );
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setAutocompleteState(null);
    }
  }

  return (
    <div className="relative min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-white/50">{label}</label>
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
              lineHeight: `${RUNE_LINE_HEIGHT_PX}px`,
            }}
            aria-hidden
          >
            {lines.map((_, index) => (
              <div
                key={index}
                className="px-2.5"
                style={{
                  height: RUNE_LINE_HEIGHT_PX,
                  lineHeight: `${RUNE_LINE_HEIGHT_PX}px`,
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={autocompleteEnabled ? handleKeyDown : undefined}
            onClick={(event) => updateCursor(event.currentTarget)}
            onKeyUp={(event) => updateCursor(event.currentTarget)}
            onSelect={(event) => updateCursor(event.currentTarget)}
            onScroll={(event) => {
              if (gutterRef.current) {
                gutterRef.current.scrollTop = event.currentTarget.scrollTop;
              }
              if (autocompleteEnabled) refreshCaretPos(event.currentTarget);
            }}
            onBlur={
              autocompleteEnabled
                ? () => setTimeout(() => setAutocompleteState(null), 150)
                : undefined
            }
            rows={RUNE_MAX_VISIBLE_LINES}
            maxLength={maxLength}
            disabled={disabled}
            spellCheck={false}
            className="h-full w-full resize-none overflow-y-auto bg-transparent font-mono text-sm text-white placeholder-white/25 focus:outline-none disabled:opacity-60"
            style={{
              paddingTop: padY,
              paddingBottom: padY,
              paddingLeft: 12,
              paddingRight: 12,
              lineHeight: `${RUNE_LINE_HEIGHT_PX}px`,
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              wordBreak: 'normal',
            }}
            placeholder={placeholder}
            required
          />
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-3 py-1">
          {cursorButton ? (
            <button
              type="button"
              onClick={() => textareaRef.current?.focus()}
              className="font-mono text-[11px] text-white/35 transition-colors hover:text-white/60"
            >
              Ln {cursor.line}, Col {cursor.col}
            </button>
          ) : (
            <span className="font-mono text-[11px] text-white/30">
              Ln {cursor.line}, Col {cursor.col}
            </span>
          )}
          <span className="font-mono text-[11px] text-white/25">{footerRight}</span>
        </div>

        {autocompleteState && filteredFields.length > 0 && (
          <div
            className="pointer-events-auto absolute z-50 max-h-48 w-72 overflow-y-auto rounded-lg border border-white/15 bg-[#1a0e0e] shadow-2xl"
            style={{
              top: Math.min(
                Math.max(caretPos.top, 8),
                Math.max(editorHeight - 160, 8)
              ),
              left: Math.min(
                Math.max(caretPos.left + gutterWidth, 8),
                Math.max((editorWrapRef.current?.clientWidth ?? 320) - 296, 8)
              ),
            }}
          >
            <div className="sticky top-0 border-b border-white/5 bg-[#1a0e0e] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
              ${autocompleteState.kind}
            </div>
            {filteredFields.map((field, index) => (
              <button
                key={field.field}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertField(field.field)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                  index === autocompleteState.active
                    ? 'bg-orange/15 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="font-mono text-orange-light/80">.{field.field}</span>
                <span className="truncate text-white/40">{field.description}</span>
              </button>
            ))}
            <div className="sticky bottom-0 border-t border-white/5 bg-[#1a0e0e] px-3 py-1.5 text-[10px] text-white/25">
              ↑↓ navigate · Tab / Enter select · Esc close
            </div>
          </div>
        )}
      </div>

      {hint && (
        <div className="mt-1.5 text-[10px] leading-relaxed text-white/25">{hint}</div>
      )}
    </div>
  );
}

export function StickyRuneEditor({
  content,
  onChange,
  user,
  guild,
  channel,
  maxLength,
  disabled,
}: {
  content: string;
  onChange: (value: string) => void;
  user: FluxerUser;
  guild: FluxerGuild;
  channel: PreviewChannel | null;
  maxLength: number;
  disabled?: boolean;
}) {
  const [testMessage, setTestMessage] = useState('Hello everyone!');
  const [result, setResult] = useState<RunePreviewResult | null>(null);
  const [checking, setChecking] = useState(false);

  const script = stripRuneCodeFence(content);
  const editorHeight = runeEditorHeight(content);
  const avatarUrl = avatarSrc(user, false);

  useEffect(() => {
    if (!script) {
      setResult(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    const timer = setTimeout(() => {
      setResult(
        runRune(script, {
          variant: 'sticky',
          user,
          guild,
          channel,
          messageContent: testMessage,
        })
      );
      setChecking(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [script, testMessage, user, guild, channel]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <RuneEditorPanel
        content={content}
        onChange={onChange}
        label="Rune Script"
        maxLength={maxLength}
        disabled={disabled}
        footerRight={`${content.length} / ${maxLength}`}
        placeholder={`say("Welcome to " + $guild.name)\nsay(embed()\n  .title("Rules")\n  .description("Be kind and have fun."))`}
        hint={
          <>
            Use <span className="font-mono text-white/40">say()</span> and{' '}
            <span className="font-mono text-white/40">embed()</span>. The preview uses
            this community, the selected channel, and the test message below.
          </>
        }
      />

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            Live Preview
          </p>
          <span className="text-[10px] text-white/30">
            {checking ? 'Running…' : result?.ok ? 'Valid' : result ? 'Error' : '-'}
          </span>
        </div>

        {result && !result.ok && <PreviewError content={script} error={result.error} />}

        <PreviewWindow
          title={channel?.name || 'preview'}
          maxHeight={editorHeight + 21}
          footer={
            <div className="flex-shrink-0 border-t border-white/5 px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#0e0e10] px-2.5 py-1.5">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(event) => setTestMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault();
                  }}
                  disabled={disabled}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white/90 placeholder-white/30 focus:outline-none disabled:opacity-50"
                  placeholder="Test message that triggers the sticky"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <p className="mt-1.5 px-1 text-[10px] text-white/20">
                Used as $message.content and $user in the preview.
              </p>
            </div>
          }
        >
          {!script ? (
            <p className="text-xs italic text-white/25">
              Start typing to preview the sticky
            </p>
          ) : !result || checking ? (
            <p className="text-xs italic text-white/25">Running…</p>
          ) : result.ok ? (
            <>
              {testMessage.trim() && (
                <UserMessage user={user} text={testMessage} avatarUrl={avatarUrl} />
              )}
              <BotMessage text={result.text} embeds={result.embeds} />
            </>
          ) : (
            <p className="text-xs text-red-400/70">Fix the error to see a preview</p>
          )}
        </PreviewWindow>
      </div>
    </div>
  );
}

export function TagRuneEditor({
  content,
  onChange,
  tagName,
  triggerMode,
  previewArgs,
  interactive,
  onInteractiveChange,
  user,
  guild,
  disabled,
  onInvalidChange,
}: {
  content: string;
  onChange: (value: string) => void;
  tagName: string;
  triggerMode: RuneTriggerMode;
  previewArgs: string[];
  interactive: boolean;
  onInteractiveChange: (value: boolean) => void;
  user: FluxerUser;
  guild: FluxerGuild;
  disabled?: boolean;
  onInvalidChange?: (invalid: boolean) => void;
}) {
  const [previewResult, setPreviewResult] = useState<RunePreviewResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const tagNameHint = tagName.trim() || 'my tag';
  const triggerEnabled = triggerMode !== 'off';
  const anywhereTrigger = triggerMode === 'anywhere';
  const previewMessage = triggerEnabled
    ? anywhereTrigger
      ? `Hey ${tagNameHint}!`
      : tagNameHint
    : `!tag ${tagNameHint}`;
  const avatarUrl = avatarSrc(user, true);
  const userName = user.global_name || user.username;
  const previewReplyTo: ReplyTarget | undefined = previewResult?.ok && previewResult.reply
    ? { name: userName, avatarUrl, content: previewMessage }
    : undefined;

  useEffect(() => {
    if (interactive) {
      onInvalidChange?.(false);
      return;
    }
    if (!content.trim()) {
      setPreviewResult(null);
      setValidating(false);
      onInvalidChange?.(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValidating(true);
    debounceRef.current = setTimeout(() => {
      const result = runRune(content, {
        variant: 'tag',
        args: triggerEnabled ? [] : previewArgs,
        user,
        guild,
        messageContent: previewMessage,
      });
      setPreviewResult(result);
      setValidating(false);
      onInvalidChange?.(!result.ok);
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    content,
    previewArgs,
    user,
    guild,
    interactive,
    triggerEnabled,
    previewMessage,
    onInvalidChange,
  ]);

  useEffect(() => {
    if (interactive && chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome',
          kind: 'system',
          content: anywhereTrigger
            ? `Interactive preview · try \`Hey ${tagNameHint}!\``
            : triggerMode === 'trigger'
              ? `Interactive preview · try \`${tagNameHint}\``
              : `Interactive preview · try \`f!tag ${tagNameHint} hello\``,
        },
      ]);
    }
  }, [interactive, chatMessages.length, anywhereTrigger, triggerMode, tagNameHint]);

  useEffect(() => {
    if (interactive) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, interactive]);

  function containsTagName(value: string, name: string) {
    const haystack = value.toLowerCase();
    const needle = name.toLowerCase().trim();
    if (!needle) return false;

    const isWordChar = (char: string | undefined) =>
      typeof char === 'string' && /[a-z0-9_]/i.test(char);

    let index = haystack.indexOf(needle);
    while (index !== -1) {
      const before = haystack[index - 1];
      const after = haystack[index + needle.length];
      const startsClean = !isWordChar(needle[0]) || !isWordChar(before);
      const endsClean =
        !isWordChar(needle[needle.length - 1]) || !isWordChar(after);
      if (startsClean && endsClean) return true;
      index = haystack.indexOf(needle, index + 1);
    }

    return false;
  }

  function tokenizeArgs(text: string) {
    const args: string[] = [];
    const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      args.push(match[1] ?? match[2] ?? match[3]);
    }
    return args;
  }

  function runInteractiveCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      kind: 'user',
      content: trimmed,
    };
    const nameLower = tagName.trim().toLowerCase();
    const commandMatch = trimmed.match(/^(?:f!|!)(?:tags?|t)\s+([\s\S]+)$/i);
    const commandRest = commandMatch?.[1].trim() ?? '';
    const commandAfter = commandRest.slice(tagName.trim().length);
    const isCommandInvocation =
      !!commandMatch &&
      !!nameLower &&
      commandRest.toLowerCase().slice(0, nameLower.length) === nameLower &&
      (!commandAfter || /^\s/.test(commandAfter));
    const isTriggerInvocation =
      !commandMatch &&
      !!nameLower &&
      (triggerMode === 'trigger'
        ? trimmed.toLowerCase() === nameLower
        : triggerMode === 'anywhere'
          ? containsTagName(trimmed, tagName)
          : false);

    if (!isCommandInvocation && !isTriggerInvocation) {
      setChatMessages((previous) => [...previous, userMessage]);
      return;
    }
    if (!content.trim()) {
      setChatMessages((previous) => [
        ...previous,
        userMessage,
        {
          id: `s-${Date.now()}`,
          kind: 'system',
          content: 'Script is empty - write some Rune first.',
        },
      ]);
      return;
    }

    const result = runRune(content, {
      variant: 'tag',
      args: isTriggerInvocation ? [] : tokenizeArgs(commandAfter.trim()),
      user,
      guild,
      messageContent: trimmed,
    });

    if (!result.ok) {
      const error = result.error;
      const location =
        error?.line != null
          ? ` (line ${error.line}${error.col != null ? `:${error.col}` : ''})`
          : '';
      setChatMessages((previous) => [
        ...previous,
        userMessage,
        {
          id: `e-${Date.now()}`,
          kind: 'error',
          content: `${error?.name || 'Error'}${location}: ${
            error?.message || 'Unknown error'
          }`,
        },
      ]);
      return;
    }

    setChatMessages((previous) => [
      ...previous,
      userMessage,
      {
        id: `b-${Date.now()}`,
        kind: 'bot',
        content: result.text,
        embeds: result.embeds || [],
        replyTo: result.reply === true ? userMessage.id : undefined,
      },
    ]);
  }

  const previewLabel = interactive
    ? 'Interactive'
    : triggerMode === 'anywhere'
      ? 'Anywhere Trigger Preview'
      : triggerMode === 'trigger'
        ? 'Trigger Preview'
        : 'Live Preview';

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <RuneEditorPanel
        content={content}
        onChange={onChange}
        label="Script Source"
        disabled={disabled}
        autocomplete
        footerRight={`${content.split('\n').length} line${
          content.split('\n').length === 1 ? '' : 's'
        }`}
        placeholder={`say("Hello", $user.username + "!")\nsay(embed()\n  .title("Welcome")\n  .description("You are in " + $guild.name)\n  .color("blurple"))`}
        cursorButton
      />

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            {previewLabel}
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
                      : '-'}
              </span>
            )}
            <button
              type="button"
              onClick={() => onInteractiveChange(!interactive)}
              disabled={disabled}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                interactive ? 'bg-orange/80' : 'bg-white/10'
              }`}
              title={interactive ? 'Switch to live preview' : 'Switch to interactive chat'}
              aria-pressed={interactive}
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
          <PreviewError content={content} error={previewResult.error} />
        )}

        <PreviewWindow
          title={interactive ? 'testing-1' : 'preview'}
          maxHeight={runeEditorHeight(content) + 21}
          footer={
            interactive ? (
              <div className="flex-shrink-0 border-t border-white/5 px-3 py-2">
                <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#0e0e10] px-2.5 py-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const value = chatInput.trim();
                        if (!value) return;
                        setChatInput('');
                        runInteractiveCommand(value);
                      }
                    }}
                    disabled={disabled}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white/90 placeholder-white/30 focus:outline-none disabled:opacity-50"
                    placeholder="Message #testing-1"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <p className="mt-1.5 px-1 text-[10px] text-white/20">
                  {triggerMode === 'anywhere'
                    ? `Type ${tagNameHint} anywhere in a message, or f!tag ${tagNameHint} [args…] · Enter to send`
                    : triggerMode === 'trigger'
                      ? `Send ${tagNameHint} or f!tag ${tagNameHint} [args…] · Enter to send`
                      : `f!tag ${tagNameHint} [args…] · Enter to send`}
                </p>
              </div>
            ) : undefined
          }
        >
          {!interactive ? (
            !content.trim() ? (
              <p className="text-xs italic text-white/25">
                {triggerMode === 'anywhere'
                  ? 'Start typing to preview the anywhere trigger'
                  : triggerMode === 'trigger'
                    ? 'Start typing to preview the trigger'
                    : 'Start typing to preview'}
              </p>
            ) : !previewResult || validating ? (
              <p className="text-xs italic text-white/25">Running…</p>
            ) : previewResult.ok ? (
              <>
                {(triggerEnabled && tagName.trim()) || previewReplyTo ? (
                  <UserMessage
                    user={user}
                    text={previewMessage}
                    avatarUrl={avatarUrl}
                  />
                ) : null}
                <BotMessage
                  text={previewResult.text}
                  embeds={previewResult.embeds}
                  replyTo={previewReplyTo}
                />
              </>
            ) : (
              <p className="text-xs text-red-400/70">Fix the error to see a preview</p>
            )
          ) : chatMessages.length === 0 ? (
            <p className="text-xs italic text-white/25">
              Send a command to run this tag…
            </p>
          ) : (
            chatMessages.map((message) => {
              if (message.kind === 'user') {
                return (
                  <UserMessage
                    key={message.id}
                    user={user}
                    text={message.content ?? ''}
                    avatarUrl={avatarUrl}
                  />
                );
              }
              if (message.kind === 'bot') {
                const replyTarget = message.replyTo
                  ? chatMessages.find((entry) => entry.id === message.replyTo)
                  : undefined;
                return (
                  <BotMessage
                    key={message.id}
                    text={message.content}
                    embeds={message.embeds}
                    replyTo={
                      replyTarget
                        ? {
                            name: userName,
                            avatarUrl,
                            content: replyTarget.content ?? '',
                          }
                        : undefined
                    }
                  />
                );
              }
              if (message.kind === 'error') {
                return (
                  <div
                    key={message.id}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2"
                  >
                    <p className="whitespace-pre-wrap font-mono text-xs text-red-300/90">
                      <Markdown text={message.content ?? ''} />
                    </p>
                  </div>
                );
              }
              return (
                <p key={message.id} className="py-1 text-center text-xs text-white/30">
                  <Markdown text={message.content ?? ''} />
                </p>
              );
            })
          )}
          <div ref={chatEndRef} />
        </PreviewWindow>
      </div>
    </div>
  );
}
