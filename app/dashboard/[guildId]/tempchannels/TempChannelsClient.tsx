'use client';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Channels } from '@/lib/types';
import { FieldSkeleton, Skeleton } from '@/components/ui/Skeletons';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import { useState, useEffect, useRef } from 'react';
import { useGuildData } from '@/hooks/useGuildData';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';


interface TempConfig {
  channelName?: string;
  channelLimit?: number;
  counting?: boolean;
  customParent?: string | null;
  manage?: string | null;
  manageMessage?: string | null;
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildChannels?: { id: string; name: string; type: number, parentId: string }[];
}

type ConfirmAction = 'setup' | 'reset' | 'manage' | null;

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'orange',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'orange' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-lg">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-white/40 hover:text-white text-xl disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              'flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-colors',
              confirmVariant === 'danger'
                ? 'bg-red-500/80 hover:bg-red-500'
                : 'bg-orange hover:bg-orange-bright',
            ].join(' ')}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TempChannelsClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error, save, saving, refresh } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? [];

  const [config, setConfig] = useState<TempConfig>(() => ({
    channelName: data.config?.channelName || '',
    channelLimit: data.config?.channelLimit ?? 0,
    counting: data.config?.counting || false,
    customParent: data.config?.customParent || null,
    manage: data.config?.manage || null,
  }));

  const [limitInput, setLimitInput] = useState(String(data.config?.channelLimit ?? 0));
  const [limitError, setLimitError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [dirty, setDirty] = useState(false);

  const parentChannel = data.parentChannel || '';
  const childChannel = data.childChannel || '';
  const isSetup = !!(parentChannel && childChannel);

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const channelName = (id: string) => guildChannels.find((c: Channels) => c.id === id)?.name ?? id;

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty) return;
    if (!isSetup) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        await save({
          config: {
            ...data.config,
            channelName: config.channelName || null,
            channelLimit: config.channelLimit ?? 0,
            counting: !!config.counting,
            customParent: config.customParent || null,
          },
        } as any);
        setDirty(false);
        showToast('Settings saved', {
          description: 'Temporary channels configuration has been updated.',
        });
      } catch {
        showErrorToast('Error', {
          description: 'Failed saving temp channels configuration.',
        });
      }
    }, 600);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [config.channelName, config.channelLimit, config.counting, config.customParent, dirty]);

  const shownLoading = useRef(false);
  const shownError = useRef<string | null>(null);

  useEffect(() => {
    if (loading && !shownLoading.current) {
      shownLoading.current = true;
      showToast('Loading', { description: 'Loading data...' });
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

  const handleLimitChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setLimitInput(digits);
    setDirty(true);

    if (digits === '') {
      setLimitError(false);
      setConfig(c => ({ ...c, channelLimit: 0 }));
      return;
    }

    const num = parseInt(digits, 10);
    if (num < 0 || num > 99) {
      setLimitError(true);
      return;
    }

    setLimitError(false);
    setConfig(c => ({ ...c, channelLimit: num }));
  };

  async function callTempApi(path: 'setup' | 'reset', body?: object) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/tempchannels/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `${path} failed`);
      }

      refresh();
      showToast('Success', {
        description:
          path === 'setup'
            ? 'Temp channels have been set up.'
            : 'Temp channels have been reset.',
      });
    } catch (err: any) {
      showErrorToast('Error', {
        description: err?.message || `${path} failed.`,
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  const handleConfirm = () => {
    if (confirmAction === 'setup') {
      callTempApi('setup', {
        customCategoryId: config.customParent || null,
        manage: !!config.manage,
        channelName: config.channelName || undefined,
        channelLimit: config.channelLimit ?? 0,
        counting: !!config.counting,
        reset: isSetup,
      });
    } else if (confirmAction === 'reset') {
      callTempApi('reset');
    } else if (confirmAction === 'manage') {
      callTempApi('setup', {
        customCategoryId: config.customParent || null,
        manage: !config.manage,
        channelName: config.channelName || undefined,
        channelLimit: config.channelLimit ?? 0,
        counting: !!config.counting,
        reset: true,
      });
    }
  };

  const handleSetupClick = () => {
    if (isSetup) {
      setConfirmAction('setup');
    } else {
      callTempApi('setup', {
        customCategoryId: config.customParent || null,
        manage: !!config.manage,
        channelName: config.channelName || undefined,
        channelLimit: config.channelLimit ?? 0,
        counting: !!config.counting,
        reset: false,
      });
    }
  };

  const handleResetClick = () => {
    setConfirmAction('reset');
  };

  const toggleManage = () => {
    if (!isSetup) {
      setConfig(c => ({ ...c, manage: c.manage ? null : 'pending' }));
      return;
    }
    setConfirmAction('manage');
  };

  const confirmMeta: Record<
    Exclude<ConfirmAction, null>,
    { title: string; description: string; confirmLabel: string; confirmVariant: 'orange' | 'danger' }
  > = {
    setup: {
      title: 'Re-setup Temporary Channels',
      description:
        'This will remove the current setup and create a new join-to-create channel with your current settings. Existing temporary voice channels may be deleted.',
      confirmLabel: 'Re-setup',
      confirmVariant: 'orange',
    },
    reset: {
      title: 'Reset Temporary Channels',
      description:
        'This will delete all temporary voice channels, the join-to-create channel, the manage channel (if any), and clear the configuration. This cannot be undone.',
      confirmLabel: 'Reset',
      confirmVariant: 'danger',
    },
    manage: {
      title: 'Toggle Manage Channel',
      description:
        'Toggling the manage channel will re-apply the full setup so the panel can be created or removed. Continue?',
      confirmLabel: 'Continue',
      confirmVariant: 'orange',
    },
  };

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user} guilds={guilds} activeGuildId={activeGuildId} currentPage="dashboard" />

      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          {iconUrl ? (
            <Image src={iconUrl} alt={userGuild.name ?? ''} width={44} height={44} className="rounded-xl flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-orange/15 flex items-center justify-center text-orange-warm font-bold flex-shrink-0">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-white leading-tight">Temporary Channels</h1>
            <p className="text-white/35 text-xs mt-0.5">{userGuild.name}</p>
          </div>
          {(saving || actionLoading) && (
            <span className="text-white/30 text-xs flex-shrink-0">
              {actionLoading ? 'Working…' : 'Saving…'}
            </span>
          )}
        </div>

        <div className="space-y-4">

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.03] px-5 py-4">
                <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={['w-2 h-2 rounded-full flex-shrink-0', isSetup ? 'bg-orange' : 'bg-white/20'].join(' ')} />
                  <p className={['text-sm font-semibold', isSetup ? 'text-orange-warm' : 'text-white/40'].join(' ')}>
                    {isSetup ? 'Active' : 'Not set up'}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.03] px-5 py-4">
                <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-1">Join-to-Create</p>
                <p className="text-white/80 text-sm font-medium truncate">
                  {childChannel ? `#${channelName(childChannel)}` : '-'}
                </p>
              </div>
              {isSetup && (
                <>
                  <div className="rounded-2xl bg-white/[0.03] px-5 py-4">
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-1">Category</p>
                    <p className="text-white/80 text-sm font-medium truncate">
                      {parentChannel ? `#${channelName(parentChannel)}` : '-'}
                      {config.customParent && <span className="text-white/30 ml-1 text-xs">(custom)</span>}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] px-5 py-4">
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-1">Manage Panel</p>
                    <p className="text-white/80 text-sm font-medium truncate">
                      {config.manage && config.manage !== 'pending' ? `#${channelName(config.manage)}` : '-'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <section className="rounded-2xl bg-bg-card p-6">
            <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-5">Configuration</p>

            {loading ? (
              <div className="space-y-4">
                <FieldSkeleton />
                <FieldSkeleton />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-14 rounded-xl" />
                  <Skeleton className="h-14 rounded-xl" />
                </div>
                <FieldSkeleton />
              </div>
            ) : (
              <div className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={config.channelName || ''}
                      onChange={e => {
                        setConfig(c => ({ ...c, channelName: e.target.value.slice(0, 26) }));
                        setDirty(true);
                      }}
                      placeholder="Private Room"
                      maxLength={26}
                      className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                    />
                    <p className="text-white/20 text-[10px] mt-1.5">Max 26 chars</p>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">
                      User Limit <span className="text-white/25">(0 = unlimited)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limitInput}
                      onChange={e => handleLimitChange(e.target.value)}
                      maxLength={2}
                      placeholder="0"
                      className={[
                        'w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 transition-colors',
                        limitError ? 'bg-red-500/10 focus:ring-red-400' : 'bg-white/5 focus:ring-orange',
                      ].join(' ')}
                    />
                    {limitError
                      ? <p className="text-red-400 text-[10px] mt-1.5">Must be 0–99.</p>
                      : <p className="text-white/20 text-[10px] mt-1.5">Max 99 users</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setConfig(c => ({ ...c, counting: !c.counting })); setDirty(true); }}
                    className={[
                      'flex items-start gap-3 text-left px-4 py-3.5 rounded-xl transition-colors',
                      config.counting ? 'bg-orange/10' : 'bg-white/[0.03] hover:bg-white/[0.05]',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      config.counting ? 'bg-orange border-orange' : 'border-white/20',
                    ].join(' ')}>
                      {config.counting && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={['text-sm font-medium', config.counting ? 'text-orange-warm' : 'text-white/80'].join(' ')}>Counting</p>
                      <p className="text-white/35 text-xs mt-0.5">Number each channel (1), (2)…</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={toggleManage}
                    className={[
                      'flex items-start gap-3 text-left px-4 py-3.5 rounded-xl transition-colors',
                      config.manage ? 'bg-orange/10' : 'bg-white/[0.03] hover:bg-white/[0.05]',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      config.manage ? 'bg-orange border-orange' : 'border-white/20',
                    ].join(' ')}>
                      {config.manage && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={['text-sm font-medium', config.manage ? 'text-orange-warm' : 'text-white/80'].join(' ')}>Manage Panel</p>
                      <p className="text-white/35 text-xs mt-0.5">Channel panel for VC owners</p>
                    </div>
                  </button>
                </div>

                <div>
                  <label className="block text-white/50 text-xs font-medium mb-1.5">
                    Custom Category <span className="text-white/25">(optional)</span>
                  </label>
                  <ChannelDropdown
                    channels={guildChannels}
                    value={config.customParent || ''}
                    onChangeAction={id => { setConfig(c => ({ ...c, customParent: id || null })); setDirty(true); }}
                    placeholder="Use bot-created category…"
                    types={[4]}
                  />
                  <p className="text-white/20 text-[10px] mt-1.5">
                    Leave empty and the bot will create a category automatically.
                  </p>
                </div>
              </div>
            )}
          </section>

          {!loading && (
            <section className="rounded-2xl bg-bg-card p-6">
              <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-4">Actions</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSetupClick}
                  className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-orange hover:bg-orange-bright disabled:opacity-50 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  {isSetup ? 'Re-setup' : 'Setup Default'}
                </button>
                {isSetup && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleResetClick}
                    className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-white/[0.03] hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50 text-white/55 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                  >
                    Reset Everything
                  </button>
                )}
              </div>
              <p className="text-white/20 text-[10px] mt-3 leading-relaxed">
                {isSetup
                  ? 'Re-setup applies your current settings and recreates the channels. Reset removes all temp channels and clears config.'
                  : 'Setup creates a "Join to Create" voice channel and a category with your current settings.'}
              </p>
            </section>
          )}

        </div>
      </main>

      {confirmAction && (
        <ConfirmModal
          open={!!confirmAction}
          title={confirmMeta[confirmAction].title}
          description={confirmMeta[confirmAction].description}
          confirmLabel={confirmMeta[confirmAction].confirmLabel}
          confirmVariant={confirmMeta[confirmAction].confirmVariant}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => { if (!actionLoading) setConfirmAction(null); }}
        />
      )}
    </div>
  );
}
