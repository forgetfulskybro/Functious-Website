'use client';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import { SettingRowSkeleton } from '@/components/ui/Skeletons';
import { SettingRow } from '@/components/ui/SettingRow';
import { useGuildData } from '@/hooks/useGuildData';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Toggle } from '@/components/ui/Toggle';
import Image from 'next/image';

const LANGUAGES = [
  { value: 'en_EN', label: 'English' },
  { value: 'es_ES', label: 'Spanish' },
  { value: 'pt_BR', label: 'Portuguese (BR)' },
  { value: 'ar_AR', label: 'Arabic' },
];

function LanguageSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = LANGUAGES.find(l => l.value === value);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 w-44 bg-white/5 rounded-lg px-3 py-1.5 text-left hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
      >
        <span className="text-white text-sm truncate">{selected?.label ?? 'Select…'}</span>
        <svg
          className={['w-3.5 h-3.5 text-white/30 transition-transform flex-shrink-0', open ? 'rotate-180' : ''].join(' ')}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-40 w-44 rounded-xl bg-[#221616] shadow-2xl overflow-hidden">
          <div className="py-1">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                type="button"
                onClick={() => { onChange(lang.value); setOpen(false); }}
                className={[
                  'w-full px-4 py-2.5 text-left text-sm transition-colors',
                  lang.value === value
                    ? 'bg-orange/10 text-orange-warm'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                {lang.label}
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
  user, guilds, activeGuildId, userGuild, initialData,
}: Props) {
  const { guild, loading, error, save } = useGuildData(initialData.id);
  const data = guild ?? initialData;

  const shownLoading = useRef(false);
  const shownError   = useRef<string | null>(null);

  useEffect(() => {
    if (loading && !shownLoading.current) {
      shownLoading.current = true;
    }
    if (!loading) shownLoading.current = false;
  }, [loading]);

  useEffect(() => {
    if (error && error !== shownError.current) {
      shownError.current = error;
      showErrorToast('Error', { description: error });
    }
    if (!error) shownError.current = null;
  }, [error]);

  async function handleSave(updates: Partial<GuildData>) {
    try {
      await save(updates);
      showToast('Settings saved', { description: 'Your changes have been applied.' });
    } catch {
      showErrorToast('Failed to save', { description: 'Please try again.' });
    }
  }

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user} guilds={guilds} activeGuildId={activeGuildId} currentPage="dashboard" />

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 pb-5 border-b border-white/5">
          {iconUrl ? (
            <Image src={iconUrl} alt={userGuild.name ?? ''} width={40} height={40} className="rounded-xl" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange/15 flex items-center justify-center text-orange-warm font-bold">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Configuration</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <section className="rounded-2xl bg-bg-card px-6 py-1">
          {loading ? (
            <>
              <SettingRowSkeleton controlWidth="w-24" />
              <SettingRowSkeleton controlWidth="w-44" />
              <SettingRowSkeleton controlWidth="w-10" />
            </>
          ) : (
            <>
              <SettingRow label="Command Prefix" description="The prefix used before bot commands, e.g. f!help">
                <input
                  type="text"
                  defaultValue={data.prefix}
                  maxLength={5}
                  onBlur={e => handleSave({ prefix: e.target.value.trim() })}
                  className="w-24 bg-white/5 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange"
                  aria-label="Command prefix"
                />
              </SettingRow>

              <SettingRow label="Language" description="Language used for bot responses in this server.">
                <LanguageSelect
                  value={data.language || 'en_EN'}
                  onChange={v => handleSave({ language: v })}
                />
              </SettingRow>

              <SettingRow label="Timezone Conversion" description="Automatically convert times mentioned in chat.">
                <Toggle value={data.timezoneConvert} onChangeAction={v => handleSave({ timezoneConvert: v })} />
              </SettingRow>
            </>
          )}
        </section>

      </main>
    </div>
  );
}
