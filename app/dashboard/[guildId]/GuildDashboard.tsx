'use client';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useBotPresence } from '@/hooks/useBotPresence';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';
import Link from 'next/link';

const syncCooldowns = new Map<string, { channels: number; roles: number }>();
const SYNC_COOLDOWN_MS = 30_000;

function getSyncCooldowns(guildId: string) {
  if (!syncCooldowns.has(guildId)) syncCooldowns.set(guildId, { channels: 0, roles: 0 });
  return syncCooldowns.get(guildId)!;
}

function SyncButton({
  label,
  icon,
  cooldownUntil,
  onSync,
}: {
  label: string;
  icon: React.ReactNode;
  cooldownUntil: number;
  onSync: () => void;
}) {
  const [, rerender] = useState(0);

  const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  const disabled = remaining > 0;

  useEffect(() => {
    if (!disabled) return;
    const id = setInterval(() => rerender(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [disabled]);

  return (
    <button
      type="button"
      onClick={onSync}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/50"
    >
      <span className={disabled ? 'opacity-60' : ''}>{icon}</span>
      {disabled ? `${label} (${remaining}s)` : label}
    </button>
  );
}

function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function StatCard({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="bg-white/[0.03] rounded-2xl px-5 py-4">
      <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-white">{value ?? '-'}</p>
    </div>
  );
}

function NavCard({ label, desc, href, icon }: {
  label: string; desc: string; href: string; icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-orange/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
    >
      <div className="w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center text-orange/70 group-hover:text-orange group-hover:scale-110 transition-all flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/85 font-semibold text-sm group-hover:text-orange-warm transition-colors">{label}</p>
        <p className="text-white/35 text-xs mt-0.5">{desc}</p>
      </div>
      <span className="text-orange/25 group-hover:text-orange/60 transition-colors text-sm flex-shrink-0">→</span>
    </Link>
  );
}

const icons = {
  config: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round"/>
    </svg>
  ),
  roles: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  channels: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  tags: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round"/>
    </svg>
  ),
  giveaways: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  polls: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  schedules: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

export default function GuildDashboard({
  user, guilds, activeGuildId, userGuild, initialData,
}: {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}) {
  const { guild, loading, error, refresh } = useGuildData(initialData.id);
  const liveGuilds = useBotPresence(guilds);
  const data = guild ?? initialData;

  const [, rerender] = useState(0);

  const handleSyncChannels = useCallback(() => {
    const cd = getSyncCooldowns(activeGuildId);
    if (Date.now() < cd.channels) return;
    cd.channels = Date.now() + SYNC_COOLDOWN_MS;
    rerender(n => n + 1);
    refresh();
    showToast('Channels synced', { description: 'Channel list has been refreshed.' });
  }, [activeGuildId, refresh]);

  const handleSyncRoles = useCallback(() => {
    const cd = getSyncCooldowns(activeGuildId);
    if (Date.now() < cd.roles) return;
    cd.roles = Date.now() + SYNC_COOLDOWN_MS;
    rerender(n => n + 1);
    refresh();
    showToast('Roles synced', { description: 'Role list has been refreshed.' });
  }, [activeGuildId, refresh]);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const totalPolls = ((data as any).activePolls ?? []).length;
  const totalGiveaways = ((data as any).activeGiveaways ?? []).length;
  const totalSchedules = (data.scheduledMessages ?? []).length;
  const totalTags = (data.tags ?? []).length;

  const shownError = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== shownError.current) {
      shownError.current = error;
      showErrorToast('Error', { description: error });
    }
    if (!error) shownError.current = null;
  }, [error]);

  const base = `/dashboard/${activeGuildId}`;

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user} guilds={liveGuilds} activeGuildId={activeGuildId} currentPage="dashboard" />

      <main className="flex-1 px-6 py-10 w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-5 mb-10 pb-7 border-b border-white/5">
          {iconUrl ? (
            <Image src={iconUrl} alt={userGuild.name ?? 'Server'} width={52} height={52} className="rounded-2xl flex-shrink-0" />
          ) : (
            <div className="w-[52px] h-[52px] rounded-2xl bg-orange/15 flex items-center justify-center text-orange-warm text-2xl font-bold flex-shrink-0">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-white leading-tight truncate">{userGuild.name}</h1>
            <p className="text-white/30 text-xs font-mono mt-0.5">{userGuild.id}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SyncButton
              label="Sync Channels"
              cooldownUntil={getSyncCooldowns(activeGuildId).channels}
              onSync={handleSyncChannels}
              icon={
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <SyncButton
              label="Sync Roles"
              cooldownUntil={getSyncCooldowns(activeGuildId).roles}
              onSync={handleSyncRoles}
              icon={
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/[0.03] rounded-2xl px-5 py-4">
                <Sk className="h-2.5 w-16 mb-3" />
                <Sk className="h-7 w-10" />
              </div>
            ))
          ) : (
            <>
              <StatCard label="Active Polls" value={totalPolls} />
              <StatCard label="Giveaways" value={totalGiveaways} />
              <StatCard label="Schedules" value={totalSchedules} />
              <StatCard label="Tags" value={totalTags} />
            </>
          )}
        </div>

        <div className="mb-8">
          <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-4">Setup</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03]">
                  <Sk className="w-9 h-9 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Sk className="h-3.5 w-28" />
                    <Sk className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NavCard href={`${base}/configuration`} label="Configuration" desc="Prefix, language, DM settings" icon={icons.config} />
              <NavCard href={`${base}/roles-permissions`} label="Roles & Permissions"  desc="Join roles, bypass, sticky roles" icon={icons.roles} />
              <NavCard href={`${base}/tempchannels`} label="Temp Channels"  desc="Voice channels that auto-create on join" icon={icons.channels} />
              <NavCard href={`${base}/tags`} label="Tags" desc="Custom server shortcuts and commands" icon={icons.tags} />
            </div>
          )}
        </div>

        <div>
          <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-4">Features</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03]">
                  <Sk className="w-9 h-9 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Sk className="h-3.5 w-20" />
                    <Sk className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NavCard href={`${base}/giveaways`} label="Giveaways" desc="Create & manage giveaways" icon={icons.giveaways} />
              <NavCard href={`${base}/polls`} label="Polls" desc="Live polls with reactions" icon={icons.polls} />
              <NavCard href={`${base}/schedules`} label="Schedules" desc="Automated scheduled messages" icon={icons.schedules} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
