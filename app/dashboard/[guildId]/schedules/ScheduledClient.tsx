'use client';
import EmbedBuilderForm, { type EmbedData, emptyEmbedData, normalizeEmbedData, embedHasContent, EmbedDataSummary } from '@/components/ui/EmbedBuilderForm';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels } from '@/lib/types';
import { formatTimestamp, DateTimePicker, formatDt } from '@/components/ui/DateTimerPicker';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleRowSkeleton } from '@/components/ui/Skeletons';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';


interface ScheduledEntry {
  id: string;
  type: 'content' | 'embed' | 'command';
  channelId: string;
  timestamp: number;
  content?: string | null;
  embedData?: EmbedData | null;
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
  guildChannels?: { id: string; name: string; type: number; parentId: string }[];
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

export default function ScheduledClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? [];

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
    guildChannels.find((c: Channels) => c.id === id)?.name ?? id;

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
          prefix={(data as any).prefix || 'f!'}
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
        <div className="px-6 pt-5 pb-4 border-b border-[#2A1313]">
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
  channels: { id: string; name: string; type: number; parentId: string }[];
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
  const [embedData, setEmbedData] = useState<EmbedData>(() => {
    if (initial?.embedData) {
      return {
        ...emptyEmbedData(),
        ...initial.embedData,
        footer: initial.embedData.footer ? { ...initial.embedData.footer } : null,
        author: initial.embedData.author ? { ...initial.embedData.author } : null,
      };
    }
    return emptyEmbedData();
  });
  const [recurring, setRecurring] = useState(initial?.recurring || 'none');
  const [commandName, setCommandName] = useState(initial?.commandName || '');
  const [submitting, setSubmitting] = useState(false);
  const [pollDuration, setPollDuration] = useState('');
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [gwDuration, setGwDuration] = useState('');
  const [gwWinners, setGwWinners] = useState('1');
  const [gwPrize, setGwPrize] = useState('');
  const [gwRequirement, setGwRequirement] = useState('');
  const [gwDmWinners, setGwDmWinners] = useState(false);
  const [gwPingWinners, setGwPingWinners] = useState(true);
  const [gwAllowMultipleWins, setGwAllowMultipleWins] = useState(false);
  const [gwImageUrl, setGwImageUrl] = useState('');
  const [remindDuration, setRemindDuration] = useState('');
  const [remindMessage, setRemindMessage] = useState('');

  useEffect(() => {
    if (!initial || initial.type !== 'command') return;
    const args = initial.commandArgs ?? [];
    if (initial.commandName === 'polls') {
      setPollDuration(args[0] ?? '');
      setPollTitle(args[1] ?? '');
      setPollOptions(args.slice(2).length >= 2 ? args.slice(2) : ['', '']);
    } else if (initial.commandName === 'giveaway') {
      setGwDuration(args[0] ?? '');
      setGwWinners(args[1] ?? '1');
      setGwPrize(args[2] ?? '');
      for (const flag of args.slice(3)) {
        const f = flag.toLowerCase();
        if (/^dm:(yes|true|1)$/i.test(f)) setGwDmWinners(true);
        if (/^ping:(no|false|0)$/i.test(f)) setGwPingWinners(false);
        if (/^multiwin:(yes|true|1)$/i.test(f)) setGwAllowMultipleWins(true);
        if (/^image:/i.test(flag)) setGwImageUrl(flag.replace(/^image:/i, ''));
        if (/^requirement:/i.test(flag)) setGwRequirement(flag.replace(/^requirement:/i, ''));
      }
    } else if (initial.commandName === 'remind') {
      const full = args[0] ?? '';
      const spaceIdx = full.indexOf(' ');
      if (spaceIdx !== -1) {
        setRemindDuration(full.slice(0, spaceIdx));
        setRemindMessage(full.slice(spaceIdx + 1));
      } else {
        setRemindDuration(full);
      }
    }
  }, []);

  const AVAILABLE_COMMANDS = [
    { value: 'polls', label: 'Poll' },
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
      showErrorToast('Error', { description: 'Please choose a time in the future.' });
      return;
    }

    let builtCommandArgs: string[] | undefined = initial?.commandArgs;
    if (type === 'command') {
      if (commandName === 'polls') {
        const opts = pollOptions.map((o) => o.trim()).filter((o) => o);
        if (!pollDuration.trim() || !pollTitle.trim() || opts.length < 2) {
          showErrorToast('Error', { description: 'Poll needs a duration, title, and at least 2 options.' });
          return;
        }
        builtCommandArgs = [pollDuration.trim(), pollTitle.trim(), ...opts];
      } else if (commandName === 'giveaway') {
        const w = parseInt(gwWinners, 10);
        if (!gwDuration.trim() || isNaN(w) || w < 1 || w > 50 || !gwPrize.trim()) {
          showErrorToast('Error', { description: 'Giveaway needs a duration, winner count (1-50), and prize.' });
          return;
        }
        builtCommandArgs = [gwDuration.trim(), String(w), gwPrize.trim()];
        if (gwRequirement.trim()) builtCommandArgs.push(`requirement:${gwRequirement.trim()}`);
        if (gwDmWinners) builtCommandArgs.push('dm:yes');
        if (!gwPingWinners) builtCommandArgs.push('ping:no');
        if (gwAllowMultipleWins) builtCommandArgs.push('multiwin:yes');
        if (gwImageUrl.trim()) builtCommandArgs.push(`image:${gwImageUrl.trim()}`);
      } else if (commandName === 'remind') {
        if (!remindDuration.trim() || !remindMessage.trim()) {
          showErrorToast('Error', { description: 'Reminder needs a duration and message.' });
          return;
        }
        builtCommandArgs = [`${remindDuration.trim()} ${remindMessage.trim()}`];
      }
    }

    if (type === 'embed' && !embedHasContent(embedData)) {
      showErrorToast('Error', { description: 'Embed needs at least a title, description, or media.' });
      return;
    }

    try {
      setSubmitting(true);

      const finalEmbed = type === 'embed' ? normalizeEmbedData(embedData) : null;

      const newItem: ScheduledEntry = {
        id: initial?.id || makeScheduleId(),
        type,
        channelId,
        timestamp: ts,
        content:
          type === 'content'
            ? content?.slice(0, 1960) || null
            : type === 'embed'
              ? finalEmbed?.description || null
              : null,
        embedData: finalEmbed,
        commandName: type === 'command' ? commandName : undefined,
        commandArgs: type === 'command' ? builtCommandArgs : undefined,
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
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col min-w-0">
              <label className="block text-white/50 text-xs font-medium mb-1.5">Type</label>
              <div className="h-10 [&_>_*]:!h-10 [&_>_*]:!min-h-[40px] [&_button]:!h-10 [&_button]:!min-h-[40px]">
                <SelectDropdown
                  label=""
                  value={type}
                  onChange={(v) => {
                    setType(v as any);
                    if (v !== 'command') setCommandName('');
                    if (v === 'embed' && !embedData.description && content) {
                      setEmbedData((prev) => ({ ...prev, description: content }));
                    }
                  }}
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
              Scheduled Time
            </label>
            <DateTimePicker value={timestampStr} onChangeAction={setTimestampStr} />
          </div>

          {type === 'content' && (
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full bg-white/5 rounded-lg px-3 py-3 text-sm text-white placeholder-white/30 resize-y focus:outline-none focus:ring-1 focus:ring-orange"
                placeholder="Message content..."
              />
            </div>
          )}

          {type === 'embed' && (
            <EmbedBuilderForm value={embedData} onChange={setEmbedData} />
          )}

          {type === 'command' && (
            <div className="space-y-4">
              <SelectDropdown
                label="Command to Run"
                value={commandName}
                onChange={(v) => {
                  setCommandName(v);
                }}
                options={AVAILABLE_COMMANDS}
              />

              {commandName === 'polls' && (
                <div className="rounded-xl bg-white/[0.03] p-4 space-y-3">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Poll Settings</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/50 text-xs font-medium mb-1.5">
                        Duration
                        <span className="text-white/25 ml-1">e.g. 30m, 2h, 1d</span>
                      </label>
                      <input
                        type="text"
                        value={pollDuration}
                        onChange={(e) => setPollDuration(e.target.value)}
                        placeholder="30m"
                        className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs font-medium mb-1.5">Question / Title</label>
                      <input
                        type="text"
                        value={pollTitle}
                        onChange={(e) => setPollTitle(e.target.value)}
                        placeholder="What's your favourite color?"
                        maxLength={256}
                        className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-white/50 text-xs font-medium">
                        Options <span className="text-white/25">(2–10)</span>
                      </label>
                      {pollOptions.length < 10 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions((p) => [...p, ''])}
                          className="text-xs text-orange-warm hover:text-orange px-2 py-0.5 rounded bg-orange/10 hover:bg-orange/20 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-4 text-right flex-shrink-0">{i + 1}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              setPollOptions((p) => p.map((o, j) => (j === i ? e.target.value : o)))
                            }
                            placeholder={`Option ${i + 1}`}
                            maxLength={100}
                            className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))}
                              className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {commandName === 'giveaway' && (
                <div className="rounded-xl bg-white/[0.03] p-4 space-y-3">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Giveaway Settings</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/50 text-xs font-medium mb-1.5">
                        Duration
                        <span className="text-white/25 ml-1">e.g. 20m, 2h</span>
                      </label>
                      <input
                        type="text"
                        value={gwDuration}
                        onChange={(e) => setGwDuration(e.target.value)}
                        placeholder="20m"
                        className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs font-medium mb-1.5">Winners</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={gwWinners}
                        onChange={(e) => setGwWinners(e.target.value)}
                        className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Prize</label>
                    <input
                      type="text"
                      value={gwPrize}
                      onChange={(e) => setGwPrize(e.target.value)}
                      placeholder="A Fluxer t-shirt"
                      maxLength={500}
                      className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">
                      Requirement <span className="text-white/25">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={gwRequirement}
                      onChange={(e) => setGwRequirement(e.target.value)}
                      placeholder="Must boost the server"
                      maxLength={500}
                      className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">
                      Banner Image URL <span className="text-white/25">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={gwImageUrl}
                      onChange={(e) => setGwImageUrl(e.target.value)}
                      placeholder="https://example.com/banner.png"
                      className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                    />
                  </div>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-white/70 text-xs">Ping winners</p>
                        <p className="text-white/25 text-[10px]">Mention winners in channel on end</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGwPingWinners((v) => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${gwPingWinners ? 'bg-orange' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${gwPingWinners ? 'translate-x-4' : ''}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-white/70 text-xs">DM winners</p>
                        <p className="text-white/25 text-[10px]">Send each winner a direct message</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGwDmWinners((v) => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${gwDmWinners ? 'bg-orange' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${gwDmWinners ? 'translate-x-4' : ''}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-white/70 text-xs">Allow multiple wins</p>
                        <p className="text-white/25 text-[10px]">One user can win more than one slot</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGwAllowMultipleWins((v) => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${gwAllowMultipleWins ? 'bg-orange' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${gwAllowMultipleWins ? 'translate-x-4' : ''}`} />
                      </button>
                    </label>
                  </div>
                </div>
              )}

              {commandName === 'remind' && (
                <div className="rounded-xl bg-white/[0.03] p-4 space-y-3">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Reminder Settings</p>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">
                      Remind after
                      <span className="text-white/25 ml-1">e.g. 30m, 1h, 2d</span>
                    </label>
                    <input
                      type="text"
                      value={remindDuration}
                      onChange={(e) => setRemindDuration(e.target.value)}
                      placeholder="1h"
                      className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Message</label>
                    <textarea
                      value={remindMessage}
                      onChange={(e) => setRemindMessage(e.target.value)}
                      rows={3}
                      placeholder="Don't forget to check the announcements!"
                      maxLength={1000}
                      className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange resize-y"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
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
              disabled={
                !channelId ||
                (type === 'command' && !commandName) ||
                (type === 'command' &&
                  commandName === 'polls' &&
                  (pollOptions.filter((o) => o.trim()).length < 2 ||
                    !pollTitle.trim() ||
                    !pollDuration.trim())) ||
                (type === 'command' &&
                  commandName === 'giveaway' &&
                  (!gwDuration.trim() || !gwPrize.trim())) ||
                (type === 'command' &&
                  commandName === 'remind' &&
                  (!remindDuration.trim() || !remindMessage.trim())) ||
                busy
              }
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
  prefix,
  onClose,
}: {
  item: ScheduledEntry;
  channelName: string;
  prefix: string;
  onClose: () => void;
}) {
  function buildCommandPreview(): string | null {
    if (item.type !== 'command' || !item.commandName || !item.commandArgs) return null;
    const args = item.commandArgs;
    const cmd = item.commandName;

    if (cmd === 'polls') {
      return `${prefix}polls ${args.join(' | ')}`;
    }
    if (cmd === 'giveaway') {
      return `${prefix}giveaway ${args.join(' | ')}`;
    }
    if (cmd === 'remind') {
      return `${prefix}remind ${args[0] ?? ''}`;
    }
    return `${prefix}${cmd} ${args.join(' | ')}`;
  }

  function parseGiveawayFlags() {
    if (item.commandName !== 'giveaway' || !item.commandArgs) return null;
    const args = item.commandArgs;
    const flags: Record<string, string> = {};
    for (const f of args.slice(3)) {
      const [key, ...rest] = f.split(':');
      flags[key.toLowerCase()] = rest.join(':');
    }
    return {
      duration: args[0],
      winners: args[1],
      prize: args[2],
      requirement: flags['requirement'] ?? null,
      dm: ['yes', 'true', '1'].includes(flags['dm'] ?? ''),
      ping: !['no', 'false', '0'].includes(flags['ping'] ?? 'yes'),
      multiwin: ['yes', 'true', '1'].includes(flags['multiwin'] ?? ''),
      image: flags['image'] ?? null,
    };
  }

  function parsePollArgs() {
    if (item.commandName !== 'polls' || !item.commandArgs) return null;
    const args = item.commandArgs;
    return {
      duration: args[0],
      title: args[1],
      options: args.slice(2),
    };
  }

  const commandPreview = buildCommandPreview();
  const giveawayFlags = parseGiveawayFlags();
  const pollArgs = parsePollArgs();

  const typeLabel: Record<string, string> = {
    content: 'Text Message',
    embed: 'Embed',
    command: item.commandName
      ? ({ polls: 'Poll', giveaway: 'Giveaway', remind: 'Reminder' }[item.commandName] ??
        item.commandName)
      : 'Command',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#160a0a] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white text-lg font-bold">Scheduled Message</h2>
            <p className="text-white/30 text-xs mt-0.5">{typeLabel[item.type] ?? item.type}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl"
          >
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
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Fires at</p>
              <p className="text-white font-medium">
                {new Date(item.timestamp * 1000).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          {item.recurring && item.recurring !== 'none' && (
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Recurring</p>
              <p className="text-white capitalize font-medium">{item.recurring}</p>
            </div>
          )}

          {item.sendCount !== undefined && item.sendCount > 1 && (
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Send count</p>
              <p className="text-white font-medium">{item.sendCount}</p>
            </div>
          )}

          {item.type === 'content' && item.content && (
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">
                Message Content
              </p>
              <div className="bg-white/[0.03] rounded-xl p-3 text-white/80 whitespace-pre-wrap text-xs leading-relaxed max-h-48 overflow-y-auto">
                {item.content}
              </div>
            </div>
          )}

          {item.type === 'embed' && item.embedData && (
            <EmbedDataSummary data={item.embedData} />
          )}

          {item.type === 'command' && (
            <div className="space-y-3">
              {commandPreview && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Command preview</p>
                  <div className="bg-black/40 rounded-xl px-3 py-2.5 font-mono text-xs text-orange-warm break-all">
                    {commandPreview}
                  </div>
                </div>
              )}

              {pollArgs && (
                <div className="rounded-xl bg-white/[0.03] divide-y divide-white/5">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <p className="text-white/40 text-xs w-20 flex-shrink-0">Duration</p>
                    <p className="text-white/80 text-xs font-medium">{pollArgs.duration}</p>
                  </div>
                  <div className="flex items-start gap-3 px-3 py-2">
                    <p className="text-white/40 text-xs w-20 flex-shrink-0 pt-px">Question</p>
                    <p className="text-white/80 text-xs">{pollArgs.title}</p>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-white/40 text-xs mb-1.5">Options</p>
                    <div className="space-y-1">
                      {pollArgs.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-white/25 text-xs w-4 text-right">{i + 1}.</span>
                          <span className="text-white/70 text-xs">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {giveawayFlags && (
                <div className="rounded-xl bg-white/[0.03] divide-y divide-white/5">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <p className="text-white/40 text-xs w-28 flex-shrink-0">Duration</p>
                    <p className="text-white/80 text-xs font-medium">{giveawayFlags.duration}</p>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <p className="text-white/40 text-xs w-28 flex-shrink-0">Winners</p>
                    <p className="text-white/80 text-xs">{giveawayFlags.winners}</p>
                  </div>
                  <div className="flex items-start gap-3 px-3 py-2">
                    <p className="text-white/40 text-xs w-28 flex-shrink-0 pt-px">Prize</p>
                    <p className="text-white/80 text-xs">{giveawayFlags.prize}</p>
                  </div>
                  {giveawayFlags.requirement && (
                    <div className="flex items-start gap-3 px-3 py-2">
                      <p className="text-white/40 text-xs w-28 flex-shrink-0 pt-px">Requirement</p>
                      <p className="text-white/80 text-xs">{giveawayFlags.requirement}</p>
                    </div>
                  )}
                  {giveawayFlags.image && (
                    <div className="flex items-start gap-3 px-3 py-2">
                      <p className="text-white/40 text-xs w-28 flex-shrink-0 pt-px">Banner</p>
                      <p className="text-white/50 text-xs break-all font-mono">{giveawayFlags.image}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-0 divide-x divide-white/5">
                    {[
                      { label: 'Ping winners', value: giveawayFlags.ping },
                      { label: 'DM winners', value: giveawayFlags.dm },
                      { label: 'Multi-win', value: giveawayFlags.multiwin },
                    ].map((f) => (
                      <div key={f.label} className="px-3 py-2 text-center">
                        <p className="text-white/30 text-[10px]">{f.label}</p>
                        <p className={`text-xs font-medium mt-0.5 ${f.value ? 'text-green-400' : 'text-white/30'}`}>
                          {f.value ? 'On' : 'Off'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.commandName === 'remind' && item.commandArgs && (
                <div className="rounded-xl bg-white/[0.03] divide-y divide-white/5">
                  {(() => {
                    const full = item.commandArgs[0] ?? '';
                    const spaceIdx = full.indexOf(' ');
                    const duration = spaceIdx !== -1 ? full.slice(0, spaceIdx) : full;
                    const msg = spaceIdx !== -1 ? full.slice(spaceIdx + 1) : '';
                    return (
                      <>
                        <div className="flex items-center gap-3 px-3 py-2">
                          <p className="text-white/40 text-xs w-20 flex-shrink-0">After</p>
                          <p className="text-white/80 text-xs font-medium">{duration}</p>
                        </div>
                        {msg && (
                          <div className="flex items-start gap-3 px-3 py-2">
                            <p className="text-white/40 text-xs w-20 flex-shrink-0 pt-px">Message</p>
                            <p className="text-white/80 text-xs">{msg}</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {item.webhook?.name && (
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <svg className="w-3.5 h-3.5 text-white/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider leading-none mb-0.5">Webhook</p>
                <p className="text-white/70 text-xs">{item.webhook.name}</p>
              </div>
            </div>
          )}
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