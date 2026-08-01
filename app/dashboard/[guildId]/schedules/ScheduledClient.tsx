'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useGuildData } from '@/hooks/useGuildData';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { formatTimestamp, DateTimePicker, formatDt } from '@/components/ui/DateTimerPicker';
import SelectDropdown from '@/components/ui/SelectDropdown';
import ChannelDropdown from '@/components/ui/ChannelDropdown';

interface ScheduledEntry {
  id: string;
  type: 'content' | 'embed' | 'command';
  channelId: string;
  timestamp: number;
  content?: string | null;
  embedData?: any;
  commandName?: string;
  commandArgs?: string[];
  recurring?: string;
  webhook?: any;
  createdBy?: string;
  createdAt?: number;
  sendCount?: number;
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type?: number }[];
}

function mapScheduled(raw: any[]): ScheduledEntry[] {
  return (raw || []).map((s: any) => ({
    id: s.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: s.type || 'content',
    channelId: s.channelId,
    timestamp: Number(s.timestamp),
    content: s.content ?? null,
    embedData: s.embedData ?? null,
    commandName: s.commandName,
    commandArgs: s.commandArgs,
    recurring: s.recurring || 'none',
    webhook: s.webhook ?? null,
    createdBy: s.createdBy,
    createdAt: s.createdAt,
    sendCount: s.sendCount ?? 1,
  }));
}

function makeScheduleId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function ScheduleRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 bg-white/[0.03] flex items-center gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

export default function ScheduledClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
  guildChannels = [],
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;

  const [scheduled, setScheduled] = useState<ScheduledEntry[]>(() =>
    mapScheduled((data as any).scheduledMessages || [])
  );

  useEffect(() => {
    if (saving) return;
    const raw = (data as any).scheduledMessages;
    if (Array.isArray(raw)) {
      setScheduled(mapScheduled(raw));
    }
  }, [data, saving]);

  const [modal, setModal] = useState<'create' | ScheduledEntry | null>(null);
  const [viewItem, setViewItem] = useState<ScheduledEntry | null>(null);
  const [deleteItem, setDeleteItem] = useState<ScheduledEntry | null>(null);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const handleSave = useCallback(
    async (newList: ScheduledEntry[]): Promise<boolean> => {
      const previous = scheduled;
      setScheduled(newList);

      try {
        await save({ scheduledMessages: newList } as any);
        showToast('Schedule updated', {
          description: 'Your scheduled messages have been saved.',
        });
        return true;
      } catch (err) {
        setScheduled(previous);
        showErrorToast('Error', {
          description: 'Failed saving scheduled messages.',
        });
        return false;
      }
    },
    [scheduled, save]
  );

  const channelName = (id: string) =>
    guildChannels.find((c) => c.id === id)?.name ?? id;

  const shownLoading = useRef(false);
  const shownError = useRef<string | null>(null);

  useEffect(() => {
    if (loading && !shownLoading.current) {
      shownLoading.current = true;
      showToast('Loading', { description: 'Loading data...' });
    }
    if (!loading) {
      shownLoading.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (error && error !== shownError.current) {
      shownError.current = error;
      showErrorToast('Error', { description: error });
    }
    if (!error) {
      shownError.current = null;
    }
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
            <h1 className="text-xl font-extrabold text-white">Scheduled Messages</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">
                Scheduled Messages
              </h2>
              <p className="text-white/20 text-[10px] mt-0.5">Create, edit, view & delete</p>
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
                New Schedule
              </button>
            )}
          </div>

          {loading ? (
            <ul className="space-y-2">
              <ScheduleRowSkeleton />
              <ScheduleRowSkeleton />
              <ScheduleRowSkeleton />
            </ul>
          ) : scheduled.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">No scheduled messages yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {scheduled.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl px-4 py-3 bg-white/[0.03] group flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 font-medium truncate">
                      {item.type === 'command' && item.commandName
                        ? item.commandName.toUpperCase()
                        : item.type.toUpperCase()}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {formatTimestamp(item.timestamp)} • #{channelName(item.channelId)}
                      {item.recurring && item.recurring !== 'none' && ` • ${item.recurring}`}
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
          )}
        </section>
      </main>

      {modal && (
        <ScheduleModal
          initial={modal === 'create' ? undefined : modal}
          channels={guildChannels}
          userId={user.id}
          saving={saving}
          onSave={async (updated) => {
            const newList =
              modal === 'create'
                ? [...scheduled, updated]
                : scheduled.map((s) => (s.id === updated.id ? updated : s));

            const ok = await handleSave(newList);
            if (ok) setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {viewItem && (
        <ViewModal
          item={viewItem}
          channelName={channelName(viewItem.channelId)}
          onClose={() => setViewItem(null)}
        />
      )}

      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          channelName={channelName(deleteItem.channelId)}
          saving={saving}
          onConfirm={async () => {
            const ok = await handleSave(
              scheduled.filter((s) => s.id !== deleteItem.id)
            );
            if (ok) setDeleteItem(null);
          }}
          onClose={() => setDeleteItem(null)}
        />
      )}
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
  item: ScheduledEntry;
  channelName: string;
  saving?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const busy = deleting || !!saving;

  const label =
    item.type === 'command' && item.commandName
      ? item.commandName.toUpperCase()
      : item.type.toUpperCase();

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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <h2 className="text-white font-bold text-lg">Delete scheduled message?</h2>
          <p className="text-white/30 text-xs mt-0.5">This action cannot be undone.</p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-white/80 font-medium text-sm truncate">{label}</p>
            <p className="text-white/30 text-xs mt-0.5">
              {formatTimestamp(item.timestamp)} • #{channelName}
              {item.recurring && item.recurring !== 'none' && ` • ${item.recurring}`}
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

function ScheduleModal({
  initial,
  channels,
  userId,
  saving,
  onSave,
  onClose,
}: {
  initial?: ScheduledEntry;
  channels: { id: string; name: string; type?: number }[];
  userId: string;
  saving?: boolean;
  onSave: (item: ScheduledEntry) => void | Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<'content' | 'embed' | 'command'>(
    initial?.type || 'content'
  );
  const [channelId, setChannelId] = useState(initial?.channelId || '');
  const [timestampStr, setTimestampStr] = useState(
    initial
      ? formatDt(
          new Date(initial.timestamp * 1000).getFullYear(),
          new Date(initial.timestamp * 1000).getMonth(),
          new Date(initial.timestamp * 1000).getDate(),
          new Date(initial.timestamp * 1000).getHours(),
          new Date(initial.timestamp * 1000).getMinutes()
        )
      : formatDt(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date().getHours() + 1,
          0
        )
  );
  const [content, setContent] = useState(initial?.content || '');
  const [recurring, setRecurring] = useState(initial?.recurring || 'none');
  const [commandName, setCommandName] = useState(initial?.commandName || '');
  const [submitting, setSubmitting] = useState(false);

  const AVAILABLE_COMMANDS = [
    { value: 'poll', label: 'Poll' },
    { value: 'giveaway', label: 'Giveaway' },
    { value: 'remind', label: 'Reminder' },
  ];

  const typeOptions = [
    { value: 'content', label: 'Text Message' },
    { value: 'embed', label: 'Embed' },
    { value: 'command', label: 'Run Command' },
  ];

  const recurringOptions = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || (type === 'command' && !commandName) || submitting || saving) return;

    const ts = Math.floor(new Date(timestampStr).getTime() / 1000);
    if (!Number.isFinite(ts) || ts <= Math.floor(Date.now() / 1000)) {
      showErrorToast('Error', {
        description: 'Please choose a time in the future.',
      });
      return;
    }

    try {
      setSubmitting(true);

      const newItem: ScheduledEntry = {
        id: initial?.id || makeScheduleId(),
        type,
        channelId,
        timestamp: ts,
        content:
          type === 'content' || type === 'embed'
            ? content?.slice(0, 1960) || null
            : null,
        embedData:
          type === 'embed'
            ? initial?.embedData
              ? { ...initial.embedData, description: content?.slice(0, 4040) || '' }
              : { description: content?.slice(0, 4040) || '' }
            : null,
        commandName: type === 'command' ? commandName : undefined,
        commandArgs: type === 'command' ? initial?.commandArgs : undefined,
        recurring: recurring || 'none',
        webhook: initial?.webhook ?? null,
        createdAt: initial?.createdAt ?? Math.floor(Date.now() / 1000),
        createdBy: initial?.createdBy ?? userId,
        sendCount: initial?.sendCount ?? 1,
      };

      await onSave(newItem);
    } catch {
      showErrorToast('Error', {
        description: 'Failed to save scheduled message.',
      });
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl overflow-visible">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <div>
            <h2 className="text-white font-bold text-lg">
              {initial ? 'Edit Scheduled Message' : 'New Scheduled Message'}
            </h2>
            <p className="text-white/30 text-xs mt-0.5">
              Automated message / command execution
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SelectDropdown
              label="Type"
              value={type}
              onChange={(v) => {
                setType(v as any);
                if (v !== 'command') setCommandName('');
              }}
              options={typeOptions}
            />
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Channel</label>
              <ChannelDropdown
                channels={channels}
                value={channelId}
                onChange={setChannelId}
              />
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Scheduled Time
            </label>
            <DateTimePicker value={timestampStr} onChangeAction={setTimestampStr} />
          </div>

          {(type === 'content' || type === 'embed') && (
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full bg-white/5 rounded-lg px-3 py-3 text-sm text-white placeholder-white/30 resize-y"
                placeholder="Message content..."
              />
            </div>
          )}

          {type === 'command' && (
            <SelectDropdown
              label="Command to Run"
              value={commandName}
              onChange={setCommandName}
              options={AVAILABLE_COMMANDS}
            />
          )}

          <SelectDropdown
            label="Recurring"
            value={recurring}
            onChange={setRecurring}
            options={recurringOptions}
          />

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
              disabled={!channelId || (type === 'command' && !commandName) || busy}
              className="flex-1 py-3 bg-orange hover:bg-orange-bright disabled:opacity-50 rounded-xl font-semibold text-white"
            >
              {busy ? 'Saving…' : initial ? 'Save Changes' : 'Schedule Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewModal({
  item,
  channelName,
  onClose,
}: {
  item: ScheduledEntry;
  channelName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#160a0a] rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="text-white text-xl font-bold">Scheduled Message</h2>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div>
            <p className="text-white/50">Type</p>
            <p className="text-white">{item.type}</p>
          </div>
          <div>
            <p className="text-white/50">Channel</p>
            <p className="text-white">#{channelName}</p>
          </div>
          <div>
            <p className="text-white/50">Time</p>
            <p className="text-white">
              {new Date(item.timestamp * 1000).toLocaleString()}
            </p>
          </div>
          {item.recurring && item.recurring !== 'none' && (
            <div>
              <p className="text-white/50">Recurring</p>
              <p className="text-white capitalize">{item.recurring}</p>
            </div>
          )}
          {item.type === 'command' && item.commandName && (
            <div>
              <p className="text-white/50">Command</p>
              <p className="text-white">{item.commandName}</p>
            </div>
          )}
          {item.content && (
            <div>
              <p className="text-white/50">Content</p>
              <div className="bg-black/30 p-3 rounded text-white/90 whitespace-pre-wrap text-xs">
                {item.content}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}