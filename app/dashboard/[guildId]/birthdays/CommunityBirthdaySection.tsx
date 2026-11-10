'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  CommunityBirthdaySettings,
  GuildChannel,
  GuildRole,
} from '@/lib/types';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import RolesDropdown from '@/components/ui/RolesDropdown';
import TimezonePicker from '@/components/ui/TimezonePicker';
import { Toggle } from '@/components/ui/Toggle';
import { showErrorToast } from '@/components/ui/Toast';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DEFAULT_TIMEZONE = 'America/New_York';

function emptySettings(): CommunityBirthdaySettings {
  return {
    month: null,
    day: null,
    year: null,
    enabled: false,
    channelId: null,
    roleId: null,
    ping: false,
    message: null,
    timezone: DEFAULT_TIMEZONE,
    lastAnnouncedYear: null,
  };
}

function normalizeSettings(
  value: CommunityBirthdaySettings | null,
): CommunityBirthdaySettings {
  if (!value) return emptySettings();
  return {
    ...value,
    timezone: value.timezone?.trim() || DEFAULT_TIMEZONE,
  };
}

function datePartsInTimeZone(timestamp: number, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date(timestamp));
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    const year = get('year');
    const month = get('month');
    const day = get('day');
    return year && month && day ? { year, month, day } : null;
  } catch {
    return null;
  }
}

function formatDateInTimeZone(timestamp: number, timeZone: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || DEFAULT_TIMEZONE,
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return null;
  }
}

function formatStoredDate(settings: CommunityBirthdaySettings) {
  if (!settings.month || !settings.day) return null;
  return `${MONTHS[settings.month - 1]} ${settings.day}${
    settings.year ? `, ${settings.year}` : ''
  }`;
}

export default function CommunityBirthdaySection({
  value,
  channels,
  roles,
  guildCreatedAt,
  saving,
  onSave,
}: {
  value: CommunityBirthdaySettings | null;
  channels: GuildChannel[];
  roles: GuildRole[];
  guildCreatedAt?: number | null;
  saving: boolean;
  onSave: (value: CommunityBirthdaySettings | null) => void | Promise<void>;
}) {
  const [settings, setSettings] = useState<CommunityBirthdaySettings>(() =>
    normalizeSettings(value),
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSettings(normalizeSettings(value));
  }, [value]);

  const channelOptions = useMemo(
    () =>
      (channels as any[])
        .filter((channel) => channel.type === 0)
        .map((channel) => ({
          id: String(channel.id),
          name: String(channel.name),
          type: Number(channel.type ?? 0),
          parentId: channel.parentId ? String(channel.parentId) : null,
        })),
    [channels],
  );

  const roleOptions = useMemo(
    () =>
      (roles as any[]).map((role) => ({
        id: String(role.id),
        name: String(role.name),
        color: Number(role.color ?? 0),
      })),
    [roles],
  );

  const busy = saving || submitting;
  const detectedDate = guildCreatedAt
    ? formatDateInTimeZone(guildCreatedAt, settings.timezone)
    : null;
  const creationLabel =
    detectedDate ?? formatStoredDate(settings) ?? 'Unavailable';

  function patch(next: Partial<CommunityBirthdaySettings>) {
    setSettings((previous) => ({ ...previous, ...next }));
  }

  async function handleSave() {
    if (busy) return;

    const creation = guildCreatedAt
      ? datePartsInTimeZone(guildCreatedAt, settings.timezone)
      : null;

    if (settings.enabled) {
      if (!creation && (!settings.month || !settings.day)) {
        showErrorToast('Creation date unavailable', {
          description: "Could not read this server's creation date. Please try again.",
        });
        return;
      }
      if (!settings.channelId) {
        showErrorToast('Channel required', {
          description: 'Choose where the community birthday is announced.',
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      await onSave({
        ...settings,
        ...(creation ?? {}),
        message: settings.message?.trim() || null,
        timezone: settings.timezone.trim() || DEFAULT_TIMEZONE,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-bg-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
            Community Birthday
          </h2>
          <p className="mt-0.5 text-[10px] text-white/20">
            The community&apos;s own birthday, separate from member birthdays.
          </p>
        </div>
        <Toggle
          value={settings.enabled}
          onChangeAction={(enabled) => patch({ enabled })}
          disabled={busy}
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-xs font-medium text-white/50">Server creation date</p>
            <p className="mt-0.5 text-sm text-white/75">{creationLabel}</p>
          </div>
          <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-white/25 sm:mt-0 sm:text-right">
            Detected automatically from this server&apos;s creation date.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Announcement channel
            </label>
            <ChannelDropdown
              channels={channelOptions}
              value={settings.channelId ?? ''}
              onChangeAction={(channelId) =>
                patch({ channelId: channelId || null })
              }
              types={[0]}
              placeholder="Select a channel"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Birthday role <span className="text-white/25">(optional)</span>
            </label>
            <RolesDropdown
              roles={roleOptions}
              value={settings.roleId ?? ''}
              onChange={(roleId) => patch({ roleId: roleId || null })}
              placeholder="No role"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Announcement message <span className="text-white/25">(optional)</span>
            </label>
            <textarea
              value={settings.message ?? ''}
              onChange={(event) => patch({ message: event.target.value })}
              rows={3}
              maxLength={1000}
              placeholder="Happy birthday, {community}! 🎂"
              className="w-full resize-y rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Timezone
              </label>
              <TimezonePicker
                value={settings.timezone || DEFAULT_TIMEZONE}
                onChangeAction={(timezone) => patch({ timezone })}
                disabled={busy}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-xs text-white/55">Ping role</span>
              <Toggle
                value={settings.ping}
                onChangeAction={(ping) => patch({ ping })}
                disabled={busy}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
          <p className="text-[10px] text-white/25">
            {value
              ? `Last announced: ${settings.lastAnnouncedYear ?? 'not yet'}`
              : 'Not configured yet.'}
          </p>
          <div className="flex gap-2">
            {value && (
              <button
                type="button"
                onClick={() => onSave(null)}
                disabled={busy}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/45 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="rounded-lg bg-orange/15 px-3 py-1.5 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/25 disabled:opacity-40"
            >
              {busy ? 'Saving…' : 'Save community birthday'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
