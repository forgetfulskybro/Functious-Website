'use client';

import { useEffect, useState } from 'react';
import type {
  GuildEvent,
  GuildEventDetail,
  EventRecurrence,
  EventReminder,
  EventStatus,
} from '@/lib/types';
import {
  DateTimePicker,
  formatDt,
} from '@/components/ui/DateTimerPicker';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import RolesDropdown from '@/components/ui/RolesDropdown';
import SelectDropdown from '@/components/ui/SelectDropdown';
import ChannelBadge from '@/components/ui/ChannelBadge';
import UserBadge from '@/components/ui/UserBadge';
import ColorPicker from '@/components/ui/ColorPicker';
import NumberInput from '@/components/ui/NumberInput';
import { Toggle } from '@/components/ui/Toggle';
import { Pagination } from '@/components/ui/Pagination';
import { showErrorToast } from '@/components/ui/Toast';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useChannelProfiles, type KnownChannel } from '@/hooks/useChannelProfiles';

export interface EventPayload {
  title: string;
  description: string | null;
  channelId: string;
  startAt: number;
  endAt: number | null;
  timezone: string;
  location: string | null;
  imageUrl: string | null;
  color: string | null;
  capacity: number | null;
  waitlistEnabled: boolean;
  attendeeRoleId: string | null;
  signupCutoffAt: number | null;
  postAt: number | null;
  reminders: {
    offsetMs: number;
    mode: EventReminder['mode'];
    message: string | null;
  }[];
  pingRoleId: string | null;
  requiredRoleIds: string[];
  recurrence: EventRecurrence | null;
  status?: EventStatus;
}

interface ChannelOption {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
}

function defaultStart() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return formatDt(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  );
}

function defaultPostTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 5, 0, 0);
  return formatDt(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  );
}

function toPickerValue(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return formatDt(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  );
}

function pickerToTimestamp(value: string): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function addHour(value: string): string {
  const date = new Date(pickerToTimestamp(value) ?? Date.now());
  date.setHours(date.getHours() + 1);
  return formatDt(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  );
}

function recurrenceLabel(frequency: string) {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

function formatDate(timestamp: number | null, timezone?: string | null) {
  if (!timestamp) return '-';
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone || undefined,
    });
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

type ReminderUnit = 'minutes' | 'hours' | 'days';

interface ReminderDraft {
  id: string;
  amount: string;
  unit: ReminderUnit;
  mode: EventReminder['mode'];
  message: string;
}

const REMINDERS_PER_PAGE = 3;

const REMINDER_UNITS: { value: ReminderUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const DEFAULT_EVENT_REMINDERS: EventReminder[] = [
  { offsetMs: 24 * 60 * 60 * 1000, mode: 'channel', message: null },
  { offsetMs: 60 * 60 * 1000, mode: 'channel', message: null },
];

function reminderToDraft(reminder: EventReminder, index: number): ReminderDraft {
  const minutes = Math.max(1, Math.round(Number(reminder.offsetMs) / 60000));
  const unit: ReminderUnit = minutes % 1440 === 0
    ? 'days'
    : minutes % 60 === 0
      ? 'hours'
      : 'minutes';
  const divisor = unit === 'days' ? 1440 : unit === 'hours' ? 60 : 1;
  return {
    id: `${reminder.offsetMs}-${index}`,
    amount: String(Math.max(1, Math.round(minutes / divisor))),
    unit,
    mode: reminder.mode,
    message: reminder.message ?? '',
  };
}

function reminderOffsetLabel(offsetMs: number) {
  const minutes = Math.max(1, Math.round(offsetMs / 60000));
  if (minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
}

export function EventModal({
  initial,
  channels,
  roles,
  busy,
  onSave,
  onClose,
}: {
  initial?: GuildEvent;
  channels: ChannelOption[];
  roles: { id: string; name: string; color?: number }[];
  busy?: boolean;
  onSave: (payload: EventPayload) => void | Promise<void>;
  onClose: () => void;
}) {
  const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [channelId, setChannelId] = useState(initial?.channelId ?? '');
  const [startAt, setStartAt] = useState(() =>
    initial?.startAt ? toPickerValue(initial.startAt) : defaultStart(),
  );
  const [endAt, setEndAt] = useState(() =>
    initial?.endAt ? toPickerValue(initial.endAt) : '',
  );
  const [timezone, setTimezone] = useState(
    initial?.timezone ?? browserTimezone,
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [capacity, setCapacity] = useState(
    initial?.capacity != null ? String(initial.capacity) : '',
  );
  const [waitlistEnabled, setWaitlistEnabled] = useState(
    initial?.waitlistEnabled !== false,
  );
  const [attendeeRoleId, setAttendeeRoleId] = useState(
    initial?.attendeeRoleId ?? '',
  );
  const [signupCutoffAt, setSignupCutoffAt] = useState(() =>
    initial?.signupCutoffAt ? toPickerValue(initial.signupCutoffAt) : '',
  );
  const [schedulePost, setSchedulePost] = useState(() =>
    Boolean(initial?.postAt && initial?.postedAt == null),
  );
  const [postAt, setPostAt] = useState(() =>
    initial?.postAt ? toPickerValue(initial.postAt) : '',
  );
  const [reminders, setReminders] = useState<ReminderDraft[]>(() => {
    const source = initial ? initial.reminders ?? [] : DEFAULT_EVENT_REMINDERS;
    return source.map(reminderToDraft);
  });
  const [reminderPage, setReminderPage] = useState(0);
  const [pingRoleId, setPingRoleId] = useState(initial?.pingRoleId ?? '');
  const [requiredRoleIds, setRequiredRoleIds] = useState<string[]>(
    initial?.requiredRoleIds ?? [],
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [color, setColor] = useState(initial?.color ?? '');
  const [status, setStatus] = useState<EventStatus>(
    initial?.status ?? 'scheduled',
  );
  const [recurrence, setRecurrence] = useState(
    initial?.recurrence?.frequency ?? 'none',
  );
  const [recurrenceUntil, setRecurrenceUntil] = useState(
    initial?.recurrence?.until ? toPickerValue(initial.recurrence.until) : '',
  );
  const [submitting, setSubmitting] = useState(false);

  const isBusy = submitting || !!busy;
  const posted = Boolean(initial && (!initial.postAt || initial.postedAt != null));
  const reminderTotalPages = Math.max(
    1,
    Math.ceil(reminders.length / REMINDERS_PER_PAGE),
  );
  const reminderStart = reminderPage * REMINDERS_PER_PAGE;
  const visibleReminders = reminders.slice(
    reminderStart,
    reminderStart + REMINDERS_PER_PAGE,
  );

  useEffect(() => {
    setReminderPage((current) =>
      Math.min(current, reminderTotalPages - 1),
    );
  }, [reminderTotalPages]);

  function updateReminder(id: string, patch: Partial<ReminderDraft>) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id ? { ...reminder, ...patch } : reminder,
      ),
    );
  }

  function addReminder() {
    if (reminders.length >= 10) return;
    setReminderPage(Math.floor(reminders.length / REMINDERS_PER_PAGE));
    setReminders((current) => [
      ...current,
      {
        id: `reminder-${Date.now()}`,
        amount: '1',
        unit: 'hours',
        mode: 'channel',
        message: '',
      },
    ]);
  }

  function removeReminder(id: string) {
    const nextLength = reminders.length - 1;
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
    setReminderPage((current) =>
      Math.min(
        current,
        Math.max(0, Math.ceil(nextLength / REMINDERS_PER_PAGE) - 1),
      ),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isBusy) return;

    if (!title.trim()) {
      showErrorToast('Title required', {
        description: 'Give the event a name.',
      });
      return;
    }
    if (!channelId) {
      showErrorToast('Channel required', {
        description: 'Choose a text channel for the event message.',
      });
      return;
    }

    const startTimestamp = pickerToTimestamp(startAt);
    if (!startTimestamp) {
      showErrorToast('Start time required', {
        description: 'Choose when the event starts.',
      });
      return;
    }

    const endTimestamp = endAt ? pickerToTimestamp(endAt) : null;
    if (endAt && !endTimestamp) {
      showErrorToast('Invalid end time', {
        description: 'Choose a valid end time or leave it empty.',
      });
      return;
    }
    if (endTimestamp != null && endTimestamp <= startTimestamp) {
      showErrorToast('Invalid end time', {
        description: 'The event must end after it starts.',
      });
      return;
    }

    if (recurrence !== 'none' && !endTimestamp) {
      showErrorToast('End time required', {
        description: 'Recurring events need an end time.',
      });
      return;
    }

    let postTimestamp: number | null = null;
    if (schedulePost) {
      postTimestamp = pickerToTimestamp(postAt);
      if (!postTimestamp) {
        showErrorToast('Post time required', {
          description: 'Choose when the event should be posted.',
        });
        return;
      }
      if (postTimestamp <= Date.now()) {
        showErrorToast('Invalid post time', {
          description: 'The post time must be in the future.',
        });
        return;
      }
      if (postTimestamp >= startTimestamp) {
        showErrorToast('Invalid post time', {
          description: 'The event must be posted before it starts.',
        });
        return;
      }
    }

    let signupCutoffTimestamp: number | null = null;
    if (signupCutoffAt) {
      signupCutoffTimestamp = pickerToTimestamp(signupCutoffAt);
      if (!signupCutoffTimestamp) {
        showErrorToast('Invalid signup cutoff', {
          description: 'Choose a valid time or clear the cutoff.',
        });
        return;
      }
    }

    const reminderPayload: EventPayload['reminders'] = [];
    for (const reminder of reminders) {
      const amount = Number(reminder.amount);
      if (!Number.isInteger(amount) || amount < 1) {
        showErrorToast('Invalid reminder', {
          description: 'Each reminder needs a whole number greater than zero.',
        });
        return;
      }
      const unitMs = reminder.unit === 'days'
        ? 24 * 60 * 60 * 1000
        : reminder.unit === 'hours'
          ? 60 * 60 * 1000
          : 60 * 1000;
      const offsetMs = amount * unitMs;
      if (offsetMs < 60000) {
        showErrorToast('Invalid reminder', {
          description: 'Reminders must be at least one minute before the event.',
        });
        return;
      }
      reminderPayload.push({
        offsetMs,
        mode: reminder.mode,
        message: reminder.message.trim().slice(0, 500) || null,
      });
    }

    const parsedCapacity = capacity.trim() ? Number(capacity) : null;
    if (
      parsedCapacity != null &&
      (!Number.isInteger(parsedCapacity) ||
        parsedCapacity < 1 ||
        parsedCapacity > 1000)
    ) {
      showErrorToast('Invalid capacity', {
        description: 'Capacity must be between 1 and 1000, or empty.',
      });
      return;
    }

    const recurrenceUntilTimestamp = recurrenceUntil
      ? pickerToTimestamp(recurrenceUntil)
      : null;

    const nextRecurrence =
      recurrence === 'none'
        ? null
        : {
            frequency: recurrence as EventRecurrence['frequency'],
            until: recurrenceUntilTimestamp,
          };

    try {
      setSubmitting(true);
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        channelId,
        startAt: startTimestamp,
        endAt: endTimestamp,
        timezone: timezone.trim() || 'UTC',
        location: location.trim() || null,
        imageUrl: imageUrl.trim() || null,
        color: color.trim() || null,
        capacity: parsedCapacity,
        waitlistEnabled,
        attendeeRoleId: attendeeRoleId || null,
        signupCutoffAt: signupCutoffTimestamp,
        postAt: postTimestamp,
        reminders: reminderPayload,
        pingRoleId: pingRoleId || null,
        requiredRoleIds,
        recurrence: nextRecurrence,
        ...(initial ? { status } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />

      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2A1313] px-5 pb-3 pt-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {initial ? 'Edit Event' : 'Create Event'}
            </h2>
            <p className="mt-0.5 text-xs text-white/30">
              The bot posts an RSVP message in the selected channel.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
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
                Event title
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={256}
                placeholder="Community game night"
                className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Description <span className="text-white/25">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={4096}
                placeholder="What should members expect?"
                className="w-full resize-y rounded-lg bg-white/5 px-3 py-2.5 text-sm leading-relaxed text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
              />
              <p className="mt-1 text-[10px] text-white/25">
                Supports {'{title}'}, {'{host}'}, {'{start}'}, {'{end}'},{' '}
                {'{location}'}, {'{capacity}'}, {'{going}'}, {'{waitlist}'} and{' '}
                {'{requirements}'}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Channel
                </label>
                <ChannelDropdown
                  channels={channels}
                  value={channelId}
                  onChangeAction={setChannelId}
                  types={[0]}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  placeholder="Europe/London"
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Starts at
                </label>
                <DateTimePicker value={startAt} onChangeAction={setStartAt} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Ends at <span className="text-white/25">(optional)</span>
                </label>
                {endAt ? (
                  <>
                    <DateTimePicker value={endAt} onChangeAction={setEndAt} />
                    <button
                      type="button"
                      onClick={() => setEndAt('')}
                      className="mt-1 text-[10px] text-white/30 hover:text-white/60"
                    >
                      Clear end time
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEndAt(addHour(startAt))}
                    className="flex min-h-[42px] w-full items-center justify-center rounded-lg bg-white/5 px-3 text-xs text-white/40 transition-colors hover:bg-white/8 hover:text-white/65"
                  >
                    + Add end time
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Location <span className="text-white/25">(optional)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={1024}
                  placeholder="Voice channel or address"
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Capacity <span className="text-white/25">(optional)</span>
                </label>
                <NumberInput
                  value={capacity === '' ? 0 : Number(capacity)}
                  onChange={(value) => setCapacity(value === 0 ? '' : String(value))}
                  min={0}
                  max={1000}
                  placeholder="Unlimited"
                />
                <p className="mt-1 text-[10px] text-white/25">
                  0 means unlimited.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Ping role <span className="text-white/25">(optional)</span>
                </label>
                <RolesDropdown
                  roles={roles}
                  value={pingRoleId}
                  onChange={setPingRoleId}
                  placeholder="No role ping"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Required roles
                </label>
                <RolesDropdown
                  roles={roles}
                  multiple
                  multiValue={requiredRoleIds}
                  onMultiChange={setRequiredRoleIds}
                  placeholder="Everyone can RSVP"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Image URL <span className="text-white/25">(optional)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Accent color <span className="text-white/25">(optional)</span>
                </label>
                <ColorPicker
                  value={color}
                  onChange={setColor}
                  placeholder="#A52F05"
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Repeat
                  </label>
                  <SelectDropdown
                    label=""
                    value={recurrence}
                    onChange={setRecurrence}
                    options={[
                      { value: 'none', label: 'Does not repeat' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                  />
                </div>
                {recurrence !== 'none' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Repeat until <span className="text-white/25">(optional)</span>
                    </label>
                    {recurrenceUntil ? (
                      <>
                        <DateTimePicker
                          value={recurrenceUntil}
                          onChangeAction={setRecurrenceUntil}
                        />
                        <button
                          type="button"
                          onClick={() => setRecurrenceUntil('')}
                          className="mt-1 text-[10px] text-white/30 hover:text-white/60"
                        >
                          Clear repeat end
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setRecurrenceUntil(addHour(endAt || startAt))
                        }
                        className="flex min-h-[42px] w-full items-center justify-center rounded-lg bg-white/5 px-3 text-xs text-white/40 transition-colors hover:bg-white/8 hover:text-white/65"
                      >
                        + Set repeat end
                      </button>
                    )}
                  </div>
                )}
              </div>
              {recurrence !== 'none' && (
                <p className="mt-2 text-[10px] text-white/25">
                  Recurring events require an end time and can repeat{' '}
                  {recurrenceLabel(recurrence).toLowerCase()}.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Publishing & access
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Post time
                  </label>
                  {posted ? (
                    <div className="rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs text-white/45">
                      {initial?.postedAt
                        ? `Posted ${formatDate(initial.postedAt)}`
                        : 'Posted when created'}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
                        <div>
                          <p className="text-sm text-white/75">Schedule post</p>
                          <p className="text-[10px] text-white/30">
                            Hold the event card until a later time.
                          </p>
                        </div>
                        <Toggle
                          value={schedulePost}
                          onChangeAction={(value) => {
                            setSchedulePost(value);
                            if (value && !postAt) setPostAt(defaultPostTime());
                          }}
                          disabled={isBusy || !!initial}
                        />
                      </div>
                      {schedulePost && (
                        <div className="mt-2">
                          <DateTimePicker
                            value={postAt}
                            onChangeAction={setPostAt}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Signups close
                  </label>
                  {signupCutoffAt ? (
                    <>
                      <DateTimePicker
                        value={signupCutoffAt}
                        onChangeAction={setSignupCutoffAt}
                      />
                      <button
                        type="button"
                        onClick={() => setSignupCutoffAt('')}
                        className="mt-1 text-[10px] text-white/30 hover:text-white/60"
                      >
                        Clear cutoff
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSignupCutoffAt(startAt || defaultStart())}
                      className="flex min-h-[42px] w-full items-center justify-center rounded-lg bg-white/5 px-3 text-xs text-white/40 transition-colors hover:bg-white/8 hover:text-white/65"
                    >
                      + Add cutoff
                    </button>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Attendee role
                  </label>
                  <RolesDropdown
                    roles={roles}
                    value={attendeeRoleId}
                    onChange={setAttendeeRoleId}
                    placeholder="No attendee role"
                  />
                  <p className="mt-1 text-[10px] text-white/25">
                    Granted while someone is going. Functious requires Manage Roles.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                    Reminders
                  </p>
                  <p className="mt-1 text-[10px] text-white/25">
                    Up to 10 reminders, measured before the event starts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addReminder}
                  disabled={isBusy || reminders.length >= 10}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] text-white/55 transition-colors hover:bg-white/10 hover:text-white/80 disabled:opacity-40"
                >
                  + Add reminder
                </button>
              </div>
              {reminders.length === 0 ? (
                <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs text-white/30">
                  No reminders configured.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {visibleReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="grid grid-cols-2 gap-2 rounded-lg bg-white/[0.03] p-2.5 sm:grid-cols-[80px_105px_minmax(0,1fr)_auto]"
                    >
                      <input
                        type="number"
                        min={1}
                        value={reminder.amount}
                        onChange={(event) =>
                          updateReminder(reminder.id, {
                            amount: event.target.value,
                          })
                        }
                        className="h-[38px] rounded-lg bg-white/5 px-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange"
                        aria-label="Reminder amount"
                      />
                      <SelectDropdown
                        label=""
                        value={reminder.unit}
                        onChange={(value) =>
                          updateReminder(reminder.id, {
                            unit: value as ReminderUnit,
                          })
                        }
                        options={REMINDER_UNITS}
                      />
                      <SelectDropdown
                        label=""
                        value={reminder.mode}
                        onChange={(value) =>
                          updateReminder(reminder.id, {
                            mode: value as EventReminder['mode'],
                          })
                        }
                        options={[
                          { value: 'channel', label: 'Channel' },
                          { value: 'dm', label: 'DMs' },
                          { value: 'both', label: 'Channel + DMs' },
                        ]}
                      />
                      <button
                        type="button"
                        onClick={() => removeReminder(reminder.id)}
                        className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        aria-label="Remove reminder"
                      >
                        ✕
                      </button>
                      <input
                        type="text"
                        value={reminder.message}
                        onChange={(event) =>
                          updateReminder(reminder.id, {
                            message: event.target.value,
                          })
                        }
                        maxLength={500}
                        placeholder="Optional custom reminder message"
                        className="col-span-2 h-[38px] rounded-lg bg-white/5 px-3 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange sm:col-span-4"
                      />
                    </div>
                  ))}
                  <Pagination
                    page={reminderPage}
                    totalPages={reminderTotalPages}
                    total={reminders.length}
                    pageSize={REMINDERS_PER_PAGE}
                    onChange={setReminderPage}
                  />
                </div>
              )}
            </div>

            {initial && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Status
                  </label>
                  <SelectDropdown
                    label=""
                    value={status}
                    onChange={(value) => setStatus(value as EventStatus)}
                    options={[
                      { value: 'scheduled', label: 'Scheduled' },
                      { value: 'live', label: 'Live' },
                      { value: 'ended', label: 'Ended' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] px-3 py-2.5">
                  <div>
                    <p className="text-sm text-white/75">Waitlist</p>
                    <p className="text-[10px] text-white/30">
                      Allow RSVPs after capacity is reached.
                    </p>
                  </div>
                  <Toggle
                    value={waitlistEnabled}
                    onChangeAction={setWaitlistEnabled}
                    disabled={isBusy}
                  />
                </div>
              </div>
            )}

            {!initial && (
              <div className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] px-3 py-2.5">
                <div>
                  <p className="text-sm text-white/75">Waitlist</p>
                  <p className="text-[10px] text-white/30">
                    Allow RSVPs after capacity is reached.
                  </p>
                </div>
                <Toggle
                  value={waitlistEnabled}
                  onChangeAction={setWaitlistEnabled}
                  disabled={isBusy}
                />
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 gap-3 border-t border-white/5 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy || !title.trim() || !channelId}
              className="flex-1 rounded-xl bg-orange py-3 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50"
            >
              {isBusy ? 'Saving…' : initial ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const RSVP_STYLES: Record<string, string> = {
  going: 'border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-300/80',
  maybe: 'border-orange/15 bg-orange/[0.06] text-orange-warm/80',
  declined: 'border-white/10 bg-white/[0.03] text-white/40',
};

export function EventDetailsModal({
  detail,
  channels,
  roles,
  busy,
  onCancel,
  onEdit,
  onClose,
}: {
  detail: GuildEventDetail;
  channels: ChannelOption[];
  roles: { id: string; name: string; color?: number }[];
  busy?: boolean;
  onCancel: () => void | Promise<void>;
  onEdit: () => void;
  onClose: () => void;
}) {
  const { event, rsvps } = detail;
  const profiles = useUserProfiles(rsvps.map((rsvp) => rsvp.userId));
  const channelProfiles = useChannelProfiles(
    event.channelId ? [event.channelId] : [],
    channels as KnownChannel[],
  );
  const counts = event.rsvpCounts ?? {
    going: 0,
    maybe: 0,
    declined: 0,
    waitlist: 0,
  };
  const roleName = (id: string | null) =>
    id ? roles.find((role) => role.id === id)?.name ?? id : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex h-[min(560px,90dvh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#2A1313] px-6 pb-4 pt-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-white">
                {event.title || 'Untitled event'}
              </h2>
              <span className="rounded-full border border-orange/15 bg-orange/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wide text-orange-warm/80">
                {event.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/35">
              {formatDate(event.startAt, event.timezone)}
              {event.endAt
                ? ` – ${formatDate(event.endAt, event.timezone)}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-white/40 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          {event.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/65">
              {event.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-white/25">
                Going
              </p>
              <p className="mt-0.5 text-lg font-semibold text-emerald-300">
                {counts.going}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-white/25">
                Maybe
              </p>
              <p className="mt-0.5 text-lg font-semibold text-orange-warm">
                {counts.maybe}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-white/25">
                Waitlist
              </p>
              <p className="mt-0.5 text-lg font-semibold text-white/70">
                {counts.waitlist}
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-white/[0.03] px-4 py-3 text-xs text-white/45">
            {event.channelId && (
              <div className="flex items-center gap-2">
                <span className="w-20 flex-shrink-0 text-white/25">Channel</span>
                <ChannelBadge
                  channelId={event.channelId}
                  profile={channelProfiles[event.channelId]}
                  inline
                  showId={false}
                />
              </div>
            )}
            {event.location && (
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-white/25">Location</span>
                <span className="text-white/60">{event.location}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="w-20 flex-shrink-0 text-white/25">Timezone</span>
              <span className="text-white/60">{event.timezone || 'UTC'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-20 flex-shrink-0 text-white/25">Capacity</span>
              <span className="text-white/60">
                {event.capacity ?? 'Unlimited'}
                {event.waitlistEnabled ? ' · waitlist enabled' : ''}
              </span>
            </div>
            {event.postAt && !event.postedAt && (
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-white/25">Posts</span>
                <span className="text-white/60">
                  {formatDate(event.postAt, event.timezone)}
                </span>
              </div>
            )}
            {event.attendeeRoleId && (
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-white/25">Attendee role</span>
                <span className="text-white/60">{roleName(event.attendeeRoleId)}</span>
              </div>
            )}
            {event.signupCutoffAt && (
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-white/25">Signups close</span>
                <span className="text-white/60">
                  {formatDate(event.signupCutoffAt, event.timezone)}
                </span>
              </div>
            )}
            {event.reminders?.length ? (
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-white/25">Reminders</span>
                <span className="text-white/60">
                  {event.reminders
                    .map((reminder) => `${reminderOffsetLabel(reminder.offsetMs)} before`)
                    .join(', ')}
                </span>
              </div>
            ) : null}
            {event.recurrence && (
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-white/25">Repeats</span>
                <span className="text-white/60">
                  {recurrenceLabel(event.recurrence.frequency)}
                  {event.recurrence.until
                    ? ` until ${formatDate(event.recurrence.until, event.timezone)}`
                    : ''}
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
              RSVPs
            </p>
            {rsvps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/5 bg-white/[0.015] px-4 py-8 text-center">
                <p className="text-xs font-medium text-white/35">No RSVPs yet</p>
                <p className="mt-1 text-[11px] text-white/20">
                  Responses will appear here as members reply.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {rsvps.map((rsvp) => (
                  <li
                    key={`${rsvp.userId}-${rsvp.response}`}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2"
                  >
                    <UserBadge
                      userId={rsvp.userId}
                      profile={profiles[rsvp.userId]}
                      inline
                      size="sm"
                      className="min-w-0 flex-1"
                    />
                    <span
                      className={[
                        'rounded-full border px-2 py-0.5 text-[10px]',
                        RSVP_STYLES[rsvp.response] ?? RSVP_STYLES.declined,
                      ].join(' ')}
                    >
                      {rsvp.response}
                      {rsvp.waitlisted ? ' · waitlist' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-2 border-t border-white/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/10"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/10"
          >
            Edit
          </button>
          {(event.status === 'scheduled' || event.status === 'live') && (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
            >
              {busy ? 'Cancelling…' : 'Cancel event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeleteEventModal({
  event,
  busy,
  onConfirm,
  onClose,
}: {
  event: GuildEvent;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
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
          <h2 className="text-lg font-bold text-white">Delete event?</h2>
          <p className="mt-0.5 text-xs text-white/30">
            This removes the event record, its RSVPs and the channel message.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="truncate text-sm font-medium text-white/80">
              {event.title || 'Untitled event'}
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              {formatDate(event.startAt, event.timezone)} · {event.status}
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
            onClick={onConfirm}
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
