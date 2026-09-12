'use client';

import { useState } from 'react';
import type { Channels } from '@/lib/types';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import NumberInput from '@/components/ui/NumberInput';

export interface MediaChannelEntry {
  channelId: string;
  allowAttachments: boolean;
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
  allowLinks: boolean;
  rating: boolean;
  deleteThreshold: number;
  sticky: boolean;
  stickyText: string | null;
  stickyMessageId: string | null;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <div className="relative mt-0.5 flex-shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`h-5 w-9 rounded-full transition-colors ${checked ? 'bg-orange/80' : 'bg-white/10'}`} />
        <div className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {description && <p className="mt-0.5 text-xs text-white/35">{description}</p>}
      </div>
    </label>
  );
}

function ColHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 border-b border-white/5 pb-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-white/25">{subtitle}</p>}
    </div>
  );
}

export function MediaChannelModal({
  initial,
  existingChannelIds,
  channels,
  saving,
  onSaveAction,
  onCloseAction,
}: {
  initial?: MediaChannelEntry;
  existingChannelIds: string[];
  channels: Channels[];
  saving?: boolean;
  onSaveAction: (entry: MediaChannelEntry) => void | Promise<void>;
  onCloseAction: () => void;
}) {
  const isEdit = !!initial;

  const [channelId, setChannelId] = useState(initial?.channelId ?? '');
  const [allowAttachments, setAllowAttachments] = useState(initial?.allowAttachments ?? true);
  const [allowImages, setAllowImages] = useState(initial?.allowImages ?? false);
  const [allowVideos, setAllowVideos] = useState(initial?.allowVideos ?? false);
  const [allowFiles, setAllowFiles] = useState(initial?.allowFiles ?? false);
  const [allowLinks, setAllowLinks] = useState(initial?.allowLinks ?? false);
  const [rating, setRating] = useState(initial?.rating ?? false);
  const [deleteThreshold, setDeleteThreshold] = useState(initial?.deleteThreshold ?? 0);
  const [sticky, setSticky] = useState(initial?.sticky ?? false);
  const [stickyText, setStickyText] = useState(initial?.stickyText ?? '');
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || !!saving;
  const showTypeToggles = !allowAttachments;

  const channelDropdownChannels = channels.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    parentId: (c as any).parent ?? null,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !channelId) return;
    setSubmitting(true);
    try {
      await onSaveAction({
        channelId,
        allowAttachments,
        allowImages: !allowAttachments && allowImages,
        allowVideos: !allowAttachments && allowVideos,
        allowFiles: !allowAttachments && allowFiles,
        allowLinks,
        rating,
        deleteThreshold: rating ? deleteThreshold : 0,
        sticky,
        stickyText: sticky && stickyText.trim() ? stickyText.trim() : null,
        stickyMessageId: initial?.stickyMessageId ?? null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onCloseAction} />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-[#160a0a] shadow-2xl">

        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2A1313] px-5 pb-3 pt-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEdit ? 'Edit Media Channel' : 'Add Media Channel'}
            </h2>
            <p className="mt-0.5 text-xs text-white/30">Control what content is allowed in this channel</p>
          </div>
          <button type="button" onClick={onCloseAction} disabled={busy} className="text-xl leading-none text-white/40 hover:text-white disabled:opacity-50">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-white/50">Channel</label>
              <ChannelDropdown
                channels={channelDropdownChannels}
                value={channelId}
                onChangeAction={setChannelId}
                placeholder="Select a channel…"
                types={[0]}
                excludeIds={existingChannelIds}
              />
              {!isEdit && channelId && existingChannelIds.includes(channelId) && (
                <p className="mt-1.5 text-xs text-red-400/80">This channel is already configured. Use Edit instead.</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <ColHeader title="Allowed Content" subtitle="What kinds of messages are permitted" />
                <div className="space-y-3.5">
                  <Toggle
                    checked={allowAttachments}
                    onChange={v => {
                      setAllowAttachments(v);
                      if (v) { setAllowImages(false); setAllowVideos(false); setAllowFiles(false); }
                    }}
                    label="Any attachment"
                    description="Images, videos, and files"
                  />
                  <Toggle checked={allowLinks} onChange={setAllowLinks} label="Links" description="Bare URLs without attachments" />

                  {showTypeToggles && (
                    <div className="mt-1 space-y-3 border-l-2 border-white/5 pl-3.5">
                      <p className="text-[11px] text-white/35">Or pick specific types:</p>
                      <Toggle checked={allowImages} onChange={setAllowImages} label="Images" description="png, jpg, gif, webp, …" />
                      <Toggle checked={allowVideos} onChange={setAllowVideos} label="Videos" description="mp4, mov, webm, …" />
                      <Toggle checked={allowFiles} onChange={setAllowFiles} label="Files" description="zip, pdf, txt, …" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <ColHeader title="Content Rating" subtitle="Let members vote on quality" />
                  <div className="space-y-3.5">
                    <Toggle checked={rating} onChange={setRating} label="Enable ratings" description="Adds ⬆️ / ⬇️ to every allowed message" />
                    {rating && (
                      <div className="space-y-1.5 border-l-2 border-white/5 pl-3.5">
                        <label className="block text-xs font-medium text-white/50">Auto-delete threshold</label>
                        <div className="w-36">
                          <NumberInput value={deleteThreshold} onChange={setDeleteThreshold} min={0} max={999} placeholder="0" />
                        </div>
                        <p className="text-xs text-white/30">Net downvotes before auto-delete. 0 = off.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <ColHeader title="Sticky Message" subtitle="Re-posts a reminder after each new post" />
                  <div className="space-y-3.5">
                    <Toggle checked={sticky} onChange={setSticky} label="Enable sticky" description="Replaces itself after a 5s delay" />
                    {sticky && (
                      <div className="space-y-1.5 border-l-2 border-white/5 pl-3.5">
                        <label className="block text-xs font-medium text-white/50">
                          Custom text <span className="font-normal text-white/25">(optional)</span>
                        </label>
                        <textarea
                          value={stickyText}
                          onChange={e => setStickyText(e.target.value)}
                          rows={3}
                          maxLength={500}
                          className="w-full resize-none rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                          placeholder="📌 This is a media-only channel…"
                        />
                        <p className="text-xs text-white/30">Leave blank for the default message.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 gap-3 border-t border-[#2A1313] px-5 pb-5 pt-3 sm:px-6">
            <button type="button" onClick={onCloseAction} disabled={busy}
              className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit"
              disabled={busy || !channelId || (!isEdit && existingChannelIds.includes(channelId)) || (!allowAttachments && !allowImages && !allowVideos && !allowFiles && !allowLinks)}
              className="flex-1 rounded-xl bg-orange py-3 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50">
              {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteMediaChannelModal({
  entry,
  channelName,
  saving,
  onConfirmAction,
  onCloseAction,
}: {
  entry: MediaChannelEntry;
  channelName: string;
  saving?: boolean;
  onConfirmAction: () => void | Promise<void>;
  onCloseAction: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const busy = deleting || !!saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onCloseAction} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Remove media channel?</h2>
          <p className="mt-0.5 text-xs text-white/30">The channel will go back to normal. This cannot be undone.</p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="font-medium text-white/80">#{channelName}</p>
            <p className="mt-0.5 text-xs text-white/30">{entry.channelId}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onCloseAction} disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" disabled={busy}
            onClick={async () => {
              if (busy) return;
              setDeleting(true);
              try { await onConfirmAction(); } finally { setDeleting(false); }
            }}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50">
            {busy ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
