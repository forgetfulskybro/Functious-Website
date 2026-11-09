'use client';

import { useRef, useState } from 'react';
import SelectDropdown from '@/components/ui/SelectDropdown';
import type { FluxerUser, FluxerGuild, UserProfile } from '@/lib/types';
import { showErrorToast } from '@/components/ui/Toast';
import UserBadge from '@/components/ui/UserBadge';
import {
  RUNE_LINE_HEIGHT_PX,
  RUNE_MAX_VISIBLE_LINES,
  RUNE_VERTICAL_PADDING_PX,
  TagRuneEditor,
  validateRuneScript,
} from '@/components/rune/RuneScriptEditor';

export interface TagEntry {
  id: string;
  name: string;
  type: 'text' | 'embed' | 'script';
  content?: string | null;
  embedData?: { description: string; color?: string | number } | null;
  createdBy?: string;
  createdAt?: number;
  uses?: number;
  trigger?: boolean;
  anyTrigger?: boolean;
}

type TriggerMode = 'off' | 'trigger' | 'anywhere';

const TRIGGER_MODES: { value: TriggerMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'anywhere', label: 'Anywhere' },
];

export function TagModal({
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
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(
    initial?.anyTrigger === true
      ? 'anywhere'
      : initial?.trigger === true
        ? 'trigger'
        : 'off'
  );
  const [content, setContent] = useState(() =>
    initial?.type === 'embed'
      ? initial.embedData?.description ?? ''
      : initial?.content ?? ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [previewArgs, setPreviewArgs] = useState<string[]>([]);
  const [argsInput, setArgsInput] = useState('');
  const [interactive, setInteractive] = useState(false);
  const [previewInvalid, setPreviewInvalid] = useState(false);

  const sanitizeName = (value: string) =>
    value.replace(/\s+/g, ' ').replace(/^\s+/, '').slice(0, 32);
  const cleanName = sanitizeName(name);
  const tagNameHint = cleanName || 'my tag';
  const triggerEnabled = triggerMode !== 'off';
  const anywhereTrigger = triggerMode === 'anywhere';
  const previewMessage = triggerEnabled
    ? anywhereTrigger
      ? `Hey ${tagNameHint}!`
      : cleanName
    : `!tag ${tagNameHint}`;
  const isScript = type === 'script';
  const busy = submitting || !!saving;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const finalName = cleanName;
    if (!finalName) {
      showErrorToast('Error', { description: 'Tag name is required.' });
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
      const check = validateRuneScript(content, {
        user,
        guild,
        messageContent: triggerEnabled
          ? anywhereTrigger
            ? `Hey ${finalName}!`
            : finalName
          : `!tag ${finalName}`,
      });
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
        trigger: triggerMode === 'trigger',
        anyTrigger: triggerMode === 'anywhere',
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
        ?.map((part) => part.replace(/^"|"$/g, '')) ?? [];
    if (parts.length) {
      setPreviewArgs(parts);
      setArgsInput('');
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
              {isScript ? 'Rune script with live preview' : 'Custom community responses'}
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
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Tag Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(sanitizeName(event.target.value))}
                className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                placeholder="my tag"
                maxLength={32}
                autoComplete="off"
                spellCheck={false}
                required
              />
              <p className="mt-1 text-[10px] text-white/25">
                Spaces allowed · max 32 characters
              </p>
            </div>

            <div
              className={`grid items-start gap-4 ${
                isScript ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              <SelectDropdown
                label="Type"
                value={type}
                onChange={(value) => {
                  const next = value as 'text' | 'embed' | 'script';
                  setType(next);
                  if (next !== 'script') {
                    setPreviewInvalid(false);
                    setInteractive(false);
                  }
                }}
                options={[
                  { value: 'text', label: '📝 Text' },
                  { value: 'embed', label: '📄 Embed' },
                  { value: 'script', label: '⚡ Rune' },
                ]}
              />

              {isScript && !interactive && !triggerEnabled && (
                <div className="flex flex-col">
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Test Arguments
                  </label>
                  <div className="flex h-[42px] gap-2">
                    <input
                      type="text"
                      value={argsInput}
                      onChange={(event) => setArgsInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
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
                      {previewArgs.map((argument, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70"
                        >
                          <span className="text-white/30">args[{index}]</span>
                          {argument}
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewArgs((previous) =>
                                previous.filter((_, itemIndex) => itemIndex !== index)
                              )
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
                        className="px-1 text-[10px] text-white/30 hover:text-white/60"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/70">Trigger mode</p>
                  <p className="mt-0.5 text-[10px] text-white/30">
                    {triggerMode === 'off'
                      ? 'Only runs with the tag command.'
                      : triggerMode === 'trigger'
                        ? `Runs when “${tagNameHint}” is sent on its own. Triggers receive no arguments.`
                        : `Runs when “${tagNameHint}” appears anywhere in a message or embed. Triggers receive no arguments.`}
                  </p>
                </div>
                <div
                  className="grid flex-shrink-0 grid-cols-3 gap-1 rounded-lg bg-black/20 p-1"
                  role="group"
                  aria-label="Trigger mode"
                >
                  {TRIGGER_MODES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={triggerMode === option.value}
                      onClick={() => setTriggerMode(option.value)}
                      className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                        triggerMode === option.value
                          ? 'bg-orange/20 text-orange-warm'
                          : 'text-white/35 hover:bg-white/5 hover:text-white/70'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!isScript ? (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  {type === 'text' ? 'Content' : 'Embed Description'}
                </label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={6}
                  spellCheck={false}
                  className="w-full resize-none rounded-lg bg-white/5 px-3 py-3 font-mono text-sm leading-relaxed text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                  placeholder={
                    type === 'text' ? 'Hello!' : 'Welcome to the community!'
                  }
                  required
                />
              </div>
            ) : (
              <TagRuneEditor
                content={content}
                onChange={setContent}
                tagName={cleanName}
                triggerMode={triggerMode}
                previewArgs={previewArgs}
                interactive={interactive}
                onInteractiveChange={setInteractive}
                user={user}
                guild={guild}
                disabled={busy}
                onInvalidChange={setPreviewInvalid}
              />
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
                (isScript && !interactive && previewInvalid)
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

export function DeleteTagModal({
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
          <h2 className="text-lg font-bold text-white">Delete tag?</h2>
          <p className="mt-0.5 text-xs text-white/30">This action cannot be undone.</p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="truncate text-sm font-medium text-white/80">
              {tag.name}{' '}
              <span className="text-xs text-white/40">({tag.type})</span>
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

export function TagViewModal({
  tag,
  profile,
  onClose,
}: {
  tag: TagEntry;
  profile?: UserProfile | null;
  onClose: () => void;
}) {
  const content =
    tag.type === 'text' || tag.type === 'script'
      ? tag.content
      : tag.embedData?.description;
  const typeLabel =
    tag.type === 'script'
      ? '⚡ Rune tag'
      : tag.type === 'embed'
        ? '📄 Embed tag'
        : '📝 Text tag';

  const isScript = tag.type === 'script';
  const source = content ?? '';
  const lines = source.split('\n');
  const padY = RUNE_VERTICAL_PADDING_PX / 2;
  const editorHeight =
    Math.min(Math.max(lines.length, 1), RUNE_MAX_VISIBLE_LINES) *
      RUNE_LINE_HEIGHT_PX +
    RUNE_VERTICAL_PADDING_PX;

  const gutterRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = source;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full overflow-visible rounded-2xl bg-[#160a0a] shadow-2xl ${
          isScript ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#2A1313] px-6 pb-4 pt-5">
          <div>
            <h2 className="text-lg font-bold text-white">{tag.name}</h2>
            <p className="mt-0.5 text-xs text-white/30">
              {typeLabel}
              {(tag.trigger || tag.anyTrigger) &&
                ` · 🔔 ${tag.anyTrigger ? 'anywhere trigger' : 'trigger word'}`}
              {(tag.uses ?? 0) > 0 &&
                ` · ${tag.uses} use${tag.uses === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-white/40 transition-colors hover:text-white/80"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-white/50">
                {tag.type === 'script'
                  ? 'Source'
                  : tag.type === 'text'
                    ? 'Content'
                    : 'Embed Description'}
              </label>
              {isScript && source && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
                >
                  {copied ? 'Copied!' : 'Copy all'}
                </button>
              )}
            </div>
            {isScript ? (
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
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
                  <pre
                    ref={codeRef}
                    onScroll={(event) => {
                      if (gutterRef.current) {
                        gutterRef.current.scrollTop = event.currentTarget.scrollTop;
                      }
                    }}
                    className="h-full w-full overflow-y-auto bg-transparent font-mono text-sm text-white/85"
                    style={{
                      paddingTop: padY,
                      paddingBottom: padY,
                      paddingLeft: 12,
                      paddingRight: 12,
                      lineHeight: `${RUNE_LINE_HEIGHT_PX}px`,
                      whiteSpace: 'pre',
                      overflowWrap: 'normal',
                      wordBreak: 'normal',
                      margin: 0,
                    }}
                  >
                    {source || (
                      <span className="italic text-white/25">No content</span>
                    )}
                  </pre>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-3 py-1">
                  <span className="font-mono text-[11px] text-white/25">
                    {lines.length} line{lines.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="min-h-[80px] w-full whitespace-pre-wrap rounded-lg bg-white/5 px-3 py-3 font-mono text-sm leading-relaxed text-white/85">
                {content || (
                  <span className="italic text-white/25">No content</span>
                )}
              </div>
            )}
          </div>
          {tag.createdBy && (
            <div className="flex items-center gap-4 pt-1">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  Created by
                </p>
                <UserBadge
                  userId={tag.createdBy}
                  profile={profile}
                  inline
                  size="sm"
                  className="mt-1"
                />
              </div>
              {tag.createdAt && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">
                    Created
                  </p>
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
