'use client';

import { useState } from 'react';
import EmbedBuilderForm, {
  type EmbedData,
  emptyEmbedData,
  normalizeEmbedData,
  embedHasContent,
} from '@/components/ui/EmbedBuilderForm';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import SelectDropdown from '@/components/ui/SelectDropdown';
import ChannelBadge from '@/components/ui/ChannelBadge';
import { Toggle } from '@/components/ui/Toggle';
import { showErrorToast } from '@/components/ui/Toast';
import { useChannelProfiles, type KnownChannel } from '@/hooks/useChannelProfiles';
import type { FluxerGuild, FluxerUser, StickyEmbedData, StickyEntry } from '@/lib/types';
import {
  StickyRuneEditor,
  stripRuneCodeFence,
} from '@/components/rune/RuneScriptEditor';

const MAX_CONTENT = 2000;
const MAX_SCRIPT = 12000;

function typeLabel(type: StickyEntry['type']) {
  if (type === 'embed') return 'Embed';
  if (type === 'script') return 'Rune Script';
  return 'Message';
}

function initialEmbedData(data?: StickyEmbedData | null): EmbedData {
  return {
    ...emptyEmbedData(),
    ...(data ?? {}),
    footer: data?.footer ? { ...data.footer } : null,
    author: data?.author ? { ...data.author } : null,
  };
}

export function StickyModal({
  initial,
  channels,
  existingChannelIds,
  userId,
  user,
  guild,
  saving,
  onSave,
  onClose,
}: {
  initial?: StickyEntry;
  channels: KnownChannel[];
  existingChannelIds: string[];
  userId: string;
  user: FluxerUser;
  guild: FluxerGuild;
  saving?: boolean;
  onSave: (sticky: StickyEntry) => void | Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<StickyEntry['type']>(initial?.type ?? 'content');
  const [channelId, setChannelId] = useState(initial?.channelId ?? '');
  const [content, setContent] = useState(
    initial?.type === 'embed' ? '' : initial?.content ?? ''
  );
  const [embedData, setEmbedData] = useState<EmbedData>(() =>
    initialEmbedData(initial?.embedData)
  );
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [delaySeconds, setDelaySeconds] = useState(
    String((initial?.repostDelayMs ?? 2500) / 1000)
  );
  const [mentionPolicy, setMentionPolicy] = useState<
    NonNullable<StickyEntry['mentionPolicy']>
  >(initial?.mentionPolicy ?? 'none');
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || !!saving;
  const isEmbed = type === 'embed';
  const isScript = type === 'script';
  const maxLength = isScript ? MAX_SCRIPT : MAX_CONTENT;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    if (!channelId) {
      showErrorToast('Error', { description: 'Choose a channel for this sticky.' });
      return;
    }
    if (existingChannelIds.includes(channelId)) {
      showErrorToast('Error', {
        description: 'That channel already has a sticky message.',
      });
      return;
    }
    if (isEmbed && !embedHasContent(embedData)) {
      showErrorToast('Error', {
        description: 'An embed needs a title, description, footer, author, image, or thumbnail.',
      });
      return;
    }

    const finalContent = isEmbed
      ? null
      : isScript
        ? stripRuneCodeFence(content)
        : content.trim();

    if (!isEmbed && !finalContent) {
      showErrorToast('Error', {
        description: isScript ? 'The Rune script cannot be empty.' : 'The message cannot be empty.',
      });
      return;
    }
    if (!isEmbed && finalContent && finalContent.length > maxLength) {
      showErrorToast('Error', {
        description: `The ${isScript ? 'script' : 'message'} must be ${maxLength} characters or fewer.`,
      });
      return;
    }

    const delay = Number(delaySeconds);
    if (!Number.isFinite(delay) || delay < 1 || delay > 60) {
      showErrorToast('Error', {
        description: 'Repost delay must be between 1 and 60 seconds.',
      });
      return;
    }

    const now = Date.now();
    const sticky: StickyEntry = {
      id: initial?.id ?? `sticky-${now}-${Math.random().toString(36).slice(2, 9)}`,
      channelId,
      type,
      content: finalContent,
      embedData: isEmbed ? normalizeEmbedData(embedData) : null,
      enabled,
      stickyMessageId: initial?.stickyMessageId ?? null,
      createdBy: initial?.createdBy ?? userId,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      sendCount: initial?.sendCount ?? 0,
      lastSentAt: initial?.lastSentAt ?? null,
      repostDelayMs: Math.round(delay * 1000),
      mentionPolicy,
    };

    try {
      setSubmitting(true);
      await onSave(sticky);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      <div
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl ${
          isScript ? 'max-w-6xl' : 'max-w-lg'
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2A1313] px-5 pb-3 pt-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {initial ? 'Edit Sticky Message' : 'New Sticky Message'}
            </h2>
            <p className="mt-0.5 text-xs text-white/30">
              {isScript
                ? 'Rune script with live preview'
                : 'Stays at the bottom of the channel and reposts after new messages'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-xl leading-none text-white/40 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col">
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Type
                </label>
                <div className="h-10 [&_>_*]:!h-10 [&_>_*]:!min-h-[40px] [&_button]:!h-10 [&_button]:!min-h-[40px]">
                  <SelectDropdown
                    label=""
                    value={type}
                    onChange={(value) => {
                      const next = value as StickyEntry['type'];
                      setType(next);
                      if (next === 'embed' && type === 'content' && !embedData.description && content) {
                        setEmbedData((previous) => ({
                          ...previous,
                          description: content,
                        }));
                      }
                    }}
                    options={[
                      { value: 'content', label: 'Message' },
                      { value: 'embed', label: 'Embed' },
                      { value: 'script', label: 'Rune Script' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-col">
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Channel
                </label>
                <div className="h-10 [&_>_*]:!h-10 [&_>_*]:!min-h-[40px] [&_button]:!h-10 [&_button]:!min-h-[40px]">
                  <ChannelDropdown
                    channels={channels.map((channel) => ({
                      id: channel.id,
                      name: channel.name ?? channel.id,
                      type: channel.type ?? 0,
                      parentId: (channel as any).parentId ?? (channel as any).parent ?? null,
                    }))}
                    value={channelId}
                    onChangeAction={setChannelId}
                    excludeIds={existingChannelIds}
                  />
                </div>
              </div>
            </div>

            {isScript && (
              <StickyRuneEditor
                content={content}
                onChange={setContent}
                user={user}
                guild={guild}
                channel={channels.find((entry) => entry.id === channelId) ?? null}
                maxLength={MAX_SCRIPT}
                disabled={busy}
              />
            )}

            {!isEmbed && !isScript && (
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label className="block text-xs font-medium text-white/50">
                    Message Content
                  </label>
                  <span className="text-[10px] text-white/25">
                    {content.length} / {MAX_CONTENT}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={5}
                  maxLength={MAX_CONTENT}
                  spellCheck={false}
                  className="w-full resize-y rounded-lg bg-white/5 px-3 py-3 text-sm leading-relaxed text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                  placeholder="Welcome to {community}! Please read the rules."
                  required
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-white/25">
                  Supports <span className="font-mono text-white/40">{'{community}'}</span>,{' '}
                  <span className="font-mono text-white/40">{'{members}'}</span>,{' '}
                  <span className="font-mono text-white/40">{'{user}'}</span>,{' '}
                  <span className="font-mono text-white/40">{'{username}'}</span>,{' '}
                  <span className="font-mono text-white/40">{'{channel}'}</span>, and{' '}
                  <span className="font-mono text-white/40">{'{count}'}</span>, plus Rune.{' '}
                  <a
                    href="/guides/rune"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-warm/70 hover:text-orange-warm"
                  >
                    Rune guide →
                  </a>
                </p>
              </div>
            )}

            {isEmbed && (
              <div className="space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-white/50">Embed Content</p>
                    <p className="mt-0.5 text-[10px] text-white/25">
                      Fields support placeholders and Rune.
                    </p>
                  </div>
                  <a
                    href="/guides/rune"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 text-[11px] text-orange-warm/80 transition-colors hover:text-orange-warm"
                  >
                    Rune guide →
                  </a>
                </div>
                <EmbedBuilderForm value={embedData} onChange={setEmbedData} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Repost delay (seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={0.5}
                  value={delaySeconds}
                  onChange={(event) => setDelaySeconds(event.target.value)}
                  disabled={busy}
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange disabled:opacity-50"
                />
                <p className="mt-1.5 text-[10px] text-white/25">
                  Wait 1-60 seconds after the latest message before reposting.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Mentions
                </label>
                <div className="h-10 [&_>_*]:!h-10 [&_>_*]:!min-h-[40px] [&_button]:!h-10 [&_button]:!min-h-[40px]">
                  <SelectDropdown
                    label=""
                    value={mentionPolicy}
                    onChange={(value) =>
                      setMentionPolicy(
                        value as NonNullable<StickyEntry['mentionPolicy']>
                      )
                    }
                    options={[
                      { value: 'none', label: 'No mentions' },
                      { value: 'users', label: 'Users' },
                      { value: 'roles', label: 'Roles' },
                      { value: 'everyone', label: 'Everyone' },
                    ]}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-white/25">
                  Mentions stay suppressed unless explicitly allowed here.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white/75">Enabled</p>
                <p className="mt-0.5 text-[10px] text-white/30">
                  Disabled stickies stay saved but are not posted.
                </p>
              </div>
              <Toggle
                value={enabled}
                onChangeAction={setEnabled}
                disabled={busy}
              />
            </div>

            <p className="text-[10px] leading-relaxed text-white/25">
              Each channel can have one sticky, and each server can have up to 10.
              Repost delay and mentions can be changed later from this editor or with
              the sticky command.
            </p>
          </div>

          <div className="flex flex-shrink-0 gap-3 border-t border-white/5 px-5 py-4 sm:px-6">
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
              disabled={busy || !channelId}
              className="flex-1 rounded-xl bg-orange py-3 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50"
            >
              {busy ? 'Saving…' : initial ? 'Save Changes' : 'Create Sticky'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteStickyModal({
  item,
  channels,
  saving,
  onConfirm,
  onClose,
}: {
  item: StickyEntry;
  channels: KnownChannel[];
  saving?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const busy = deleting || !!saving;
  const channelProfiles = useChannelProfiles(
    item.channelId ? [item.channelId] : [],
    channels
  );

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

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Delete sticky message?</h2>
          <p className="mt-0.5 text-xs text-white/30">
            The saved sticky and its posted message will be removed.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white/80">
              {typeLabel(item.type)}
            </p>
            <p className="mt-1 text-xs text-white/30">
              <ChannelBadge
                channelId={item.channelId}
                profile={channelProfiles[item.channelId]}
                inline
                showId={false}
              />
              <span className="ml-1.5">
                · {item.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </p>
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
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
