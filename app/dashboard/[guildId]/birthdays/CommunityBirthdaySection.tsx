'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  CommunityBirthdaySettings,
  GuildChannel,
  GuildRole,
} from '@/lib/types';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import NumberInput from '@/components/ui/NumberInput';
import RolesDropdown from '@/components/ui/RolesDropdown';
import SelectDropdown from '@/components/ui/SelectDropdown';
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

const MONTH_OPTIONS = MONTHS.map((label, index) => ({
  value: String(index + 1),
  label,
}));

const DEFAULT_TIMEZONE = 'America/New_York';
const CURRENT_YEAR = new Date().getFullYear();

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

function daysInMonth(month: number | null) {
  if (!month) return 31;
  return new Date(Date.UTC(2024, month, 0)).getUTCDate();
}

export default function CommunityBirthdaySection({
  value,
  channels,
  roles,
  saving,
  onSave,
}: {
  value: CommunityBirthdaySettings | null;
  channels: GuildChannel[];
  roles: GuildRole[];
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
  const maxDay = daysInMonth(settings.month);
  const dayOptions = useMemo(
    () =>
      Array.from({ length: maxDay }, (_, index) => ({
        value: String(index + 1),
        label: String(index + 1),
      })),
    [maxDay],
  );

  function patch(next: Partial<CommunityBirthdaySettings>) {
    setSettings((previous) => ({ ...previous, ...next }));
  }

  async function handleSave() {
    if (busy) return;

    if (settings.enabled) {
      if (!settings.month || !settings.day) {
        showErrorToast('Date required', {
          description: 'Choose the month and day for the community birthday.',
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectDropdown
            label="Month"
            value={settings.month ? String(settings.month) : ''}
            onChange={(month) =>
              patch({
                month: month ? Number(month) : null,
                day:
                  settings.day && month
                    ? Math.min(settings.day, daysInMonth(Number(month)))
                    : settings.day,
              })
            }
            options={MONTH_OPTIONS}
            placeholder="Select month"
            disabled={busy}
          />

          <SelectDropdown
            label="Day"
            value={settings.day ? String(settings.day) : ''}
            onChange={(day) =>
              patch({
                day: day ? Number(day) : null,
              })
            }
            options={dayOptions}
            placeholder={settings.month ? 'Select day' : 'Choose month first'}
            disabled={busy || !settings.month}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="block text-xs font-medium text-white/50">
                Year <span className="text-white/25">(optional)</span>
              </label>
              {settings.year != null && (
                <button
                  type="button"
                  onClick={() => patch({ year: null })}
                  disabled={busy}
                  className="text-[10px] text-white/30 transition-colors hover:text-white/60 disabled:opacity-40"
                >
                  Clear
                </button>
              )}
            </div>
            {settings.year != null ? (
              <NumberInput
                value={settings.year}
                onChange={(year) => patch({ year })}
                min={2000}
                max={CURRENT_YEAR}
                placeholder="e.g. 2021"
                disabled={busy}
              />
            ) : (
              <button
                type="button"
                onClick={() => patch({ year: CURRENT_YEAR })}
                disabled={busy}
                className="flex min-h-[42px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 text-xs text-white/35 transition-colors hover:border-orange/30 hover:text-orange-warm/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add birth year
              </button>
            )}
          </div>
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
