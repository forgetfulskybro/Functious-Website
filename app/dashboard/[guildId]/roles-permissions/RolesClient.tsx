'use client';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild, Roles } from '@/lib/types';
import { RoleRowSkeleton, Skeleton } from '@/components/ui/Skeletons';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import SelectDropdown from '@/components/ui/SelectDropdown';
import RolesDropdown from '@/components/ui/RolesDropdown';
import { SettingRow } from '@/components/ui/SettingRow';
import NumberInput from '@/components/ui/NumberInput';
import { useGuildData } from '@/hooks/useGuildData';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Toggle } from '@/components/ui/Toggle';
import Image from 'next/image';

interface BypassEntry {
  role: string;
  commands: string[];
}

interface JoinRoleEntry {
  role: string;
  type: 'join' | 'timed';
  durationMs?: number;
}

const DURATION_UNITS = [
  { value: 'minutes', label: 'Minutes', ms: 60_000 },
  { value: 'hours', label: 'Hours', ms: 3_600_000 },
  { value: 'days', label: 'Days', ms: 86_400_000 },
  { value: 'weeks', label: 'Weeks', ms: 604_800_000 },
] as const;
type DurationUnit = typeof DURATION_UNITS[number]['value'];

function msToDisplay(ms: number): { amount: number; unit: DurationUnit } {
  if (ms >= 604_800_000 && ms % 604_800_000 === 0) return { amount: ms / 604_800_000, unit: 'weeks' };
  if (ms >= 86_400_000 && ms % 86_400_000 === 0) return { amount: ms / 86_400_000, unit: 'days' };
  if (ms >= 3_600_000 && ms % 3_600_000 === 0) return { amount: ms / 3_600_000, unit: 'hours' };
  return { amount: Math.round(ms / 60_000), unit: 'minutes' };
}

function DurationPicker({ value, onChange }: { value: number; onChange: (ms: number) => void }) {
  const { amount: initAmount, unit: initUnit } = msToDisplay(value || 3_600_000);
  const [amount, setAmount] = useState(initAmount);
  const [unit, setUnit] = useState<DurationUnit>(initUnit);

  function emit(a: number, u: DurationUnit) {
    const ms = DURATION_UNITS.find(x => x.value === u)!.ms;
    onChange(a * ms);
  }

  return (
    <div className="flex gap-2">
    <div className="w-24 flex-shrink-0">
      <NumberInput
        value={amount}
        onChange={e => {
          setAmount(e);
          emit(e, unit);
        }}
        min={1}
        max={unit === 'minutes' ? 59 : unit === 'hours' ? 23 : unit === 'days' ? 29 : 52} />
    </div>
      <div className="flex-1">
        <SelectDropdown
          label=""
          value={unit}
          onChange={u => {
            setUnit(u as DurationUnit);
            emit(amount, u as DurationUnit);
          }}
          options={DURATION_UNITS.map(u => ({ value: u.value, label: u.label }))}
        />
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const { amount, unit } = msToDisplay(ms);
  return `${amount} ${unit}`;
}

const BYPASS_COMMANDS = [
  'autoroles',
  'bypass',
  'polls',
  'giveaway',
  'language',
  'prefix',
  'roles',
  'schedule',
  'tags',
  'tempchannels',
  'timezone'
] as const;

function BypassModal({
  roles,
  initial,
  onSave,
  onClose,
}: {
  roles: { id: string; name: string; color?: number }[];
  initial?: BypassEntry;
  onSave: (entry: BypassEntry) => void;
  onClose: () => void;
}) {
  const [role, setrole] = useState(initial?.role ?? '');
  const [commands, setCommands] = useState<string[]>(
    (initial?.commands ?? []).map(c => c.toLowerCase())
  );

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!role) return;
    onSave({ role, commands: commands.length === 0 ? ['all'] : commands });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-base">{initial ? 'Edit bypass role' : 'New bypass role'}</h2>
            <p className="text-white/30 text-xs mt-0.5">Bypass permission locks on commands</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Role</label>
            <RolesDropdown roles={roles} value={role} onChange={setrole} />
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Commands this role can bypass</label>
            <SelectDropdown
              multiple
              label=""
              value={commands}
              onChange={setCommands}
              options={BYPASS_COMMANDS.map(c => ({ value: c, label: c }))}
              placeholder="Select commands…"
            />
            <p className="text-white/25 text-[10px] mt-2">Leave empty to bypass all commands.</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-white/60 text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={!role} className="flex-1 px-4 py-2 rounded-lg bg-orange hover:bg-orange-bright disabled:opacity-40 text-white font-semibold text-sm transition-colors">
              {initial ? 'Save changes' : 'Add bypass role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinRoleModal({
  roles,
  initial,
  onSave,
  onClose,
}: {
  roles: { id: string; name: string; color?: number }[];
  initial?: JoinRoleEntry;
  onSave: (entry: JoinRoleEntry) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState(initial?.role ?? '');
  const [type, setType] = useState<'join' | 'timed'>(initial?.type ?? 'join');
  const [durationMs, setDurationMs] = useState(initial?.durationMs ?? 3_600_000);

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!role) return;
    onSave({ role, type, durationMs: type === 'timed' ? durationMs : undefined });
    onClose();
  }

  const TYPE_OPTIONS = [
    { value: 'join',  label: 'Permanent - assigned immediately on join' },
    { value: 'timed', label: 'Timed - assigned after a delay' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-base">{initial ? 'Edit join role' : 'New join role'}</h2>
            <p className="text-white/30 text-xs mt-0.5">Automatically assign a role when members join</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Role</label>
            <RolesDropdown roles={roles} value={role} onChange={setRole} />
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Assignment type</label>
            <SelectDropdown
              label=""
              value={type}
              onChange={v => setType(v as 'join' | 'timed')}
              options={TYPE_OPTIONS}
            />
          </div>

          {type === 'timed' && (
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Delay before assigning</label>
              <DurationPicker value={durationMs} onChange={setDurationMs} />
              <p className="text-white/25 text-[10px] mt-1.5">
                Role is given to the member after this amount of time from when they join.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-white/60 text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!role}
              className="flex-1 px-4 py-2 rounded-lg bg-orange hover:bg-orange-bright disabled:opacity-40 text-white font-semibold text-sm transition-colors">
              {initial ? 'Save changes' : 'Add join role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function saveJoinRoles(entries: JoinRoleEntry[]) {
  const joinRoles = entries
    .filter(e => e.type === 'join')
    .map(e => String(e.role));

  const timedRoles = entries
    .filter(e => e.type === 'timed')
    .map(e => ({
      id: String(e.role),
      time: Number(e.durationMs ?? 3_600_000),
    }));
  return { joinRoles, timedRoles };
}

interface StickyEntry {
  user: string;
  roles: string[];
}

const PAGE_SIZE = 5;

function StickyEditModal({
  entry,
  guildRoles,
  onSave,
  onClose,
}: {
  entry: StickyEntry;
  guildRoles: { id: string; name: string; color?: number }[];
  onSave: (updated: StickyEntry) => void;
  onClose: () => void;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(entry.roles);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-base">Edit saved roles</h2>
            <p className="text-white/30 text-xs mt-0.5 font-mono">{entry.user}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Roles to restore on rejoin
            </label>
            <RolesDropdown
              multiple
              roles={guildRoles}
              multiValue={selectedRoles}
              onMultiChange={setSelectedRoles}
              placeholder="Select roles…"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-white/60 text-sm transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onSave({ ...entry, roles: selectedRoles }); onClose(); }}
              className="flex-1 px-4 py-2 rounded-lg bg-orange hover:bg-orange-bright text-white font-semibold text-sm transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StickyRolesPanel({
  entries,
  guildRoles,
  loading,
  onChange,
}: {
  entries: StickyEntry[];
  guildRoles: { id: string; name: string; color?: number }[];
  loading: boolean;
  onChange: (next: StickyEntry[]) => void;
}) {
  const [page, setPage] = useState(0);
  const [editEntry, setEditEntry] = useState<StickyEntry | null>(null);
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const paginated = entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function roleName(id: string) {
    return guildRoles.find(r => r.id === id)?.name ?? id;
  }

  function handleDelete(userId: string) {
    onChange(entries.filter(e => e.user !== userId));
  }

  function handleEdit(updated: StickyEntry) {
    onChange(entries.map(e => e.user === updated.user ? updated : e));
  }

  return (
    <>
      <section className="rounded-2xl bg-bg-card p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">Sticky Role Log</h2>
          <p className="text-white/20 text-[10px] mt-0.5">Members with saved roles</p>
        </div>

        {loading ? (
          <ul className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="rounded-xl px-3 py-2.5 bg-white/[0.03] space-y-1.5 animate-pulse">
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="h-2.5 w-32 rounded bg-white/[0.04]" />
              </li>
            ))}
          </ul>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/25 text-xs">No sticky role entries yet.</p>
            <p className="text-white/15 text-[10px] mt-1">Entries appear when members with roles leave.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-1.5">
              {paginated.map((entry) => (
                <li key={entry.user} className="rounded-xl px-3 py-2.5 bg-white/[0.03] group">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-white/70 text-xs font-mono truncate">{entry.user}</p>
                      <p className="text-white/30 text-[10px] mt-0.5 truncate">
                        {entry.roles.length === 0
                          ? 'No roles saved'
                          : entry.roles.slice(0, 3).map(roleName).join(', ') +
                            (entry.roles.length > 3 ? ` +${entry.roles.length - 3}` : '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditEntry(entry)}
                        className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                        title="Edit roles"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.user)}
                        className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete entry"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-white/20 text-[10px]">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, entries.length)} of {entries.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i)}
                      className={[
                        'w-5 h-5 rounded text-[10px] font-medium transition-colors',
                        i === page ? 'bg-orange/20 text-orange-warm' : 'text-white/25 hover:text-white/60 hover:bg-white/5',
                      ].join(' ')}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {editEntry && (
        <StickyEditModal
          entry={editEntry}
          guildRoles={guildRoles}
          onSave={handleEdit}
          onClose={() => setEditEntry(null)}
        />
      )}
    </>
  );
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildRoles?: { id: string; name: string; color?: number }[];
}

export default function RolesClient({ user, guilds, activeGuildId, userGuild, initialData, guildRoles: guildRolesProp = [] }: Props) {
  const { guild, loading, error, save } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildRoles = (data as any).guildRoles ?? guildRolesProp;

  const [bypass, setBypass] = useState<BypassEntry[]>(() =>
    (data.bypassRoles ?? []).map((r: any) =>
      typeof r === 'string' || typeof r === 'number'
        ? { role: String(r), commands: [] }
        : { role: String(r.role ?? ''), commands: Array.isArray(r.commands) ? r.commands.map((c: any) => String(c).toLowerCase()) : [] }
    ).filter((r: BypassEntry) => r.role)
  );

  const [joinRoles, setJoinRoles] = useState<JoinRoleEntry[]>(() => {
    const permanent = (data.joinRoles ?? []).map((r: any) => ({
      role: String(typeof r === 'object' ? (r.role ?? r.id ?? '') : r),
      type: 'join' as const,
    })).filter((r: JoinRoleEntry) => r.role);

    const timed = (data.timedRoles ?? []).map((r: any) => ({
      role: String(r.id ?? r.role ?? r),
      type: 'timed' as const,
      durationMs: Number(r.time ?? r.durationMs ?? 3_600_000),
    })).filter((r: JoinRoleEntry) => r.role);

    return [...permanent, ...timed];
  });

  const [stickyEntries, setStickyEntries] = useState<StickyEntry[]>(() =>
    ((data as any).stickyRoles ?? []).map((r: any) => ({
      user: String(r.user ?? ''),
      roles: Array.isArray(r.roles) ? r.roles.map(String) : [],
    })).filter((r: StickyEntry) => r.user)
  );

  useEffect(() => {
    const raw = (data as any).stickyRoles;
    if (Array.isArray(raw)) {
      setStickyEntries(raw.map((r: any) => ({
        user: String(r.user ?? ''),
        roles: Array.isArray(r.roles) ? r.roles.map(String) : [],
      })).filter((r: StickyEntry) => r.user));
    }
  }, [data]);

  const [bypassModal, setBypassModal] = useState<'create' | BypassEntry | null>(null);
  const [joinModal, setJoinModal] = useState<'create' | JoinRoleEntry | null>(null);

  async function handleSave(updates: Partial<GuildData>) {
    try {
      await save(updates);
      showToast('Settings saved', {
        description: 'Your role configuration has been updated.',
      });
    } catch (err) {
      showErrorToast('Error', {
        description: 'Failed to save configuration settings.',
      });
    }
  }

  function persistJoinRoles(
    entriesOrUpdater: JoinRoleEntry[] | ((prev: JoinRoleEntry[]) => JoinRoleEntry[])
  ) {
    setJoinRoles(prev => {
      const next =
        typeof entriesOrUpdater === 'function'
          ? entriesOrUpdater(prev)
          : entriesOrUpdater;
      const { joinRoles: jr, timedRoles: tr } = saveJoinRoles(next);
      handleSave({ joinRoles: jr as any, timedRoles: tr as any });
      return next;
    });
  }

  function roleName(id: string) {
    return guildRoles.find((r: Roles) => r.id === id)?.name ?? id;
  }

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

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
      <Sidebar user={user} guilds={guilds} activeGuildId={activeGuildId} currentPage="dashboard" />
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 pb-5 border-b border-white/5">
          {iconUrl ? (
            <Image src={iconUrl} alt={userGuild.name ?? ''} width={40} height={40} className="rounded-xl" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange/15 flex items-center justify-center text-orange-warm font-bold">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Roles & Permissions</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <div className="rounded-xl bg-bg-card px-6 py-1 mb-5">
          {loading ? (
            <div className="py-3.5"><Skeleton className="h-5 w-full" /></div>
          ) : (
            <SettingRow label="Sticky Roles" description="Re-assign roles to members when they rejoin.">
              <Toggle value={data.stickyRolesEnabled} onChangeAction={v => handleSave({ stickyRolesEnabled: v })} />
            </SettingRow>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div className="w-full lg:w-96 lg:flex-shrink-0">
            <StickyRolesPanel
              entries={stickyEntries}
              guildRoles={guildRoles}
              loading={loading}
              onChange={next => {
                setStickyEntries(next);
                handleSave({ stickyRoles: next as any });
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-5">
            <section className="rounded-2xl bg-bg-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">Join Roles</h2>
                  <p className="text-white/20 text-[10px] mt-0.5">Automatically assigned when a member joins</p>
                </div>
                {!loading && (
                  <button
                    type="button"
                    onClick={() => setJoinModal('create')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    New join role
                  </button>
                )}
              </div>

              {loading ? (
                <ul className="space-y-2"><RoleRowSkeleton /><RoleRowSkeleton /></ul>
              ) : joinRoles.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/30 text-sm">No join roles configured.</p>
                  <button type="button" onClick={() => setJoinModal('create')} className="mt-2 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors">Add one →</button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {joinRoles.map((entry, i) => (
                    <li key={`${entry.role}-${i}`} className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03] group">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">{roleName(entry.role)}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          {entry.type === 'timed'
                            ? `Timed · assigned after ${formatDuration(entry.durationMs ?? 3_600_000)}`
                            : 'Automatically assigned'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setJoinModal(entry)} className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button type="button" onClick={() => persistJoinRoles(prev => prev.filter((_, x) => x !== i))} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl bg-bg-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">Bypass Roles</h2>
                  <p className="text-white/20 text-[10px] mt-0.5">Bypass permission locks on commands</p>
                </div>
                {!loading && (
                  <button
                    type="button"
                    onClick={() => setBypassModal('create')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    New bypass role
                  </button>
                )}
              </div>

              {loading ? (
                <ul className="space-y-2"><RoleRowSkeleton /><RoleRowSkeleton /></ul>
              ) : bypass.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/30 text-sm">No bypass roles configured.</p>
                  <button type="button" onClick={() => setBypassModal('create')} className="mt-2 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors">Add one →</button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {bypass.map((entry, i) => (
                    <li key={`${entry.role}-${i}`} className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03] group">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">{roleName(entry.role)}</p>
                        <p className="text-white/30 text-xs mt-0.5 truncate">
                          {entry.commands.length === 0 || entry.commands.includes('all')
                            ? 'Bypasses all restrictions'
                            : entry.commands.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setBypassModal(entry)} className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button type="button" onClick={() => { setBypass(prev => { const next = prev.filter((_, x) => x !== i); handleSave({ bypassRoles: next as any }); return next; }); }} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>

      {bypassModal === 'create' && (
        <BypassModal
          roles={guildRoles}
          onSave={entry => {
            setBypass(prev => {
              const next = [...prev, entry];
              handleSave({ bypassRoles: next as any });
              return next;
            });
          }}
          onClose={() => setBypassModal(null)}
        />
      )}

      {bypassModal && bypassModal !== 'create' && (
        <BypassModal
          roles={guildRoles}
          initial={bypassModal}
          onSave={entry => {
            setBypass(prev => {
              const next = prev.map(b =>
                b.role === bypassModal.role ? entry : b
              );
              handleSave({ bypassRoles: next as any });
              return next;
            });
          }}
          onClose={() => setBypassModal(null)}
        />
      )}

      {joinModal === 'create' && (
        <JoinRoleModal
          roles={guildRoles}
          onSave={entry => persistJoinRoles(prev => [...prev, entry])}
          onClose={() => setJoinModal(null)}
        />
      )}

      {joinModal && joinModal !== 'create' && (
        <JoinRoleModal
          roles={guildRoles}
          initial={joinModal}
          onSave={entry => {
            persistJoinRoles(prev =>
              prev.map(j => (j.role === joinModal.role ? entry : j))
            );
          }}
          onClose={() => setJoinModal(null)}
        />
      )}
    </div>
  );
}
