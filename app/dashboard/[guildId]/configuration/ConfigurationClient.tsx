'use client';

import type {
  CommandSetting,
  FluxerUser,
  FluxerGuild,
  GuildData,
  DashboardGuild,
} from '@/lib/types';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import { RowSkeleton, SettingRowSkeleton } from '@/components/ui/Skeletons';
import { SettingRow } from '@/components/ui/SettingRow';
import { useGuildData } from '@/hooks/useGuildData';
import { useDashboardToasts } from '@/hooks/useDashboardToasts';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Toggle } from '@/components/ui/Toggle';
import Image from 'next/image';
import { ThemeModal } from './Modals';
import { CheckupModal } from './CheckupModal';
import CommandPolicies from '../commands/CommandPolicies';

const LANGUAGES = [
  { value: 'en_EN', label: 'English' },
  { value: 'ar_AR', label: 'Arabic' },
  { value: 'de_DE', label: 'German' },
  { value: 'es_ES', label: 'Spanish' },
  { value: 'fr_FR', label: 'French' },
  { value: 'pl_PL', label: 'Polish' },
  { value: 'pt_BR', label: 'Portuguese' },
  { value: 'tr_TR', label: 'Turkish' },
];

type Tab = 'general' | 'policies';

const TABS: { value: Tab; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'policies', label: 'Command policies' },
];

function tabFromQuery(value: string | null): Tab {
  if (value === 'policies' || value === 'commands') return 'policies';
  return 'general';
}

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = LANGUAGES.find((language) => language.value === value);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-44 items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-left transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
      >
        <span className="truncate text-sm text-white">
          {selected?.label ?? 'Select…'}
        </span>
        <svg
          className={[
            'h-3.5 w-3.5 flex-shrink-0 text-white/30 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-xl bg-[#221616] shadow-2xl">
          <div className="py-1">
            {LANGUAGES.map((language) => (
              <button
                key={language.value}
                type="button"
                onClick={() => {
                  onChange(language.value);
                  setOpen(false);
                }}
                className={[
                  'w-full px-4 py-2.5 text-left text-sm transition-colors',
                  language.value === value
                    ? 'bg-orange/10 text-orange-warm'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}

export default function ConfigurationClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    tabFromQuery(searchParams.get('tab'))
  );

  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [checkupOpen, setCheckupOpen] = useState(false);
  const [themeCooldownUntil, setThemeCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useDashboardToasts(loading, error);

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    if (themeCooldownUntil <= Date.now()) {
      setCooldownLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((themeCooldownUntil - Date.now()) / 1000)
      );
      setCooldownLeft(left);
      if (left <= 0) setThemeCooldownUntil(0);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [themeCooldownUntil]);

  async function handleSave(updates: Partial<GuildData>) {
    try {
      await save(updates);
      showToast('Settings saved', {
        description: 'Your changes have been applied.',
      });
    } catch {
      showErrorToast('Failed to save', { description: 'Please try again.' });
    }
  }

  async function saveCommandSettings(next: CommandSetting[]) {
    try {
      await save({ commandSettings: next });
      showToast('Command policy saved', {
        description: 'The selected command settings are now active.',
      });
    } catch {
      showErrorToast('Failed to save command policy', {
        description: 'Please try again.',
      });
      throw new Error('Save failed');
    }
  }

  function changeTab(next: Tab) {
    setTab(next);
    window.history.replaceState(
      null,
      '',
      `/dashboard/${activeGuildId}/configuration?tab=${next}`
    );
  }

  const handleThemeSaved = useCallback((hex: string) => {
    setThemeCooldownUntil(Date.now() + 15_000);
    showToast('Theme updated', { description: `Bot theme set to ${hex}` });
  }, []);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const currentTheme = (data as any).theme || '#A52F05';
  const isOnCooldown = cooldownLeft > 0;
  const catalog = data.commandCatalog ?? [];
  const channels = data.guildChannels ?? [];
  const roles = data.guildRoles ?? [];

  return (
    <div className="flex min-h-screen bg-bg-dark">
      <Sidebar
        user={user}
        guilds={guilds}
        activeGuildId={activeGuildId}
        currentPage="dashboard"
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
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
            <h1 className="text-xl font-extrabold text-white">Configuration</h1>
            <p className="mt-0.5 text-xs text-white/40">{userGuild.name}</p>
          </div>
        </div>

        <div
          className="mb-6 flex flex-wrap items-center gap-2 rounded-xl bg-bg-card p-1.5"
          role="tablist"
          aria-label="Configuration sections"
        >
          {TABS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              role="tab"
              aria-selected={tab === entry.value}
              onClick={() => changeTab(entry.value)}
              className={[
                'flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors',
                tab === entry.value
                  ? 'bg-orange/15 text-orange-warm'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70',
              ].join(' ')}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <div className="mx-auto max-w-2xl">
            <section className="rounded-2xl bg-bg-card px-6 py-1">
              {loading ? (
                <>
                  <SettingRowSkeleton controlWidth="w-24" />
                  <SettingRowSkeleton controlWidth="w-44" />
                  <SettingRowSkeleton controlWidth="w-10" />
                  <SettingRowSkeleton controlWidth="w-28" />
                </>
              ) : (
                <>
                  <SettingRow
                    label="Command Prefix"
                    description="The prefix used before bot commands, e.g. f!help"
                  >
                    <input
                      type="text"
                      defaultValue={data.prefix}
                      maxLength={5}
                      onBlur={(event) =>
                        handleSave({ prefix: event.target.value.trim() })
                      }
                      className="w-24 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange"
                      aria-label="Command prefix"
                    />
                  </SettingRow>

                  <SettingRow
                    label="Language"
                    description="Language used for bot responses in this community."
                  >
                    <LanguageSelect
                      value={data.language || 'en_EN'}
                      onChange={(value) => handleSave({ language: value })}
                    />
                  </SettingRow>

                  <SettingRow
                    label="Timezone Conversion"
                    description="Automatically convert times mentioned in chat."
                  >
                    <Toggle
                      value={data.timezoneConvert}
                      onChangeAction={(value) =>
                        handleSave({ timezoneConvert: value })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    label="Theme"
                    description="Customize the bot's avatar, banner and accent color for this community."
                  >
                    <button
                      type="button"
                      onClick={() => setThemeModalOpen(true)}
                      disabled={isOnCooldown}
                      className={[
                        'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                        isOnCooldown
                          ? 'cursor-not-allowed bg-white/5 text-white/40'
                          : 'bg-orange/15 text-orange-warm hover:bg-orange/25',
                      ].join(' ')}
                    >
                      {isOnCooldown
                        ? `Cooldown (${cooldownLeft}s)`
                        : 'Configure'}
                    </button>
                  </SettingRow>

                  <SettingRow
                    label="Health Checkup"
                    description="Run the same audit as f!checkup: bot access, roles, reaction roles, channels, forms and active features."
                  >
                    <button
                      type="button"
                      onClick={() => setCheckupOpen(true)}
                      className="rounded-lg bg-orange/15 px-4 py-1.5 text-sm font-medium text-orange-warm transition-colors hover:bg-orange/25"
                    >
                      Run checkup
                    </button>
                  </SettingRow>
                </>
              )}
            </section>
          </div>
        )}

        {tab === 'policies' && (
          loading ? (
            <div className="space-y-2 rounded-2xl bg-bg-card p-4">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : (
            <CommandPolicies
              catalog={catalog}
              settings={data.commandSettings ?? []}
              channels={channels}
              roles={roles}
              prefix={data.prefix}
              saving={saving}
              onSave={saveCommandSettings}
            />
          )
        )}

      </main>

      {themeModalOpen && (
        <ThemeModal
          guildId={activeGuildId}
          currentTheme={currentTheme}
          onClose={() => setThemeModalOpen(false)}
          onSaved={(hex) => {
            handleThemeSaved(hex);
            setThemeModalOpen(false);
          }}
        />
      )}

      {checkupOpen && (
        <CheckupModal
          guildId={activeGuildId}
          guildName={userGuild.name}
          onClose={() => setCheckupOpen(false)}
        />
      )}
    </div>
  );
}
