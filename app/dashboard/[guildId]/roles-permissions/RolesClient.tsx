'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useGuildData } from '@/hooks/useGuildData';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import SelectDropdown from '@/components/ui/SelectDropdown';
import type { FluxerUser, FluxerGuild, GuildData, DashboardGuild } from '@/lib/types';

interface BypassEntry {
  role: string;
  commands: string[];
}

interface JoinRoleEntry {
  role: string;
  type: 'join' | 'timed';
  durationMs?: number;
}

// interface ReactionMapping {
//   emoji: string;
//   roleId: string;
// }

// interface ReactionRoleEntry {
//   id: string;
//   message: string;
//   reactions: ReactionMapping[];
// }

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
      <input
        type="number"
        min={1}
        max={unit === 'minutes' ? 59 : unit === 'hours' ? 23 : unit === 'days' ? 29 : 52}
        value={amount}
        onChange={e => {
          const v = Math.max(1, Number(e.target.value) || 1);
          setAmount(v);
          emit(v, unit);
        }}
        className="w-24 bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange"
      />
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
  'roles',
  'bypass',
  'tags',
  'remind',
  'poll',
  'giveaway',
  'schedule',
  'prefix',
  'timezone',
] as const;

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className={['relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark', value ? 'bg-orange' : 'bg-white/10'].join(' ')}>
      <span className={['block w-3.5 h-3.5 rounded-full bg-white shadow top-[3px] absolute transition-transform duration-200', value ? 'translate-x-[22px]' : 'translate-x-1'].join(' ')} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-medium">{label}</p>
        {description && <p className="text-white/40 text-xs mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function SettingRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-10 rounded-full flex-shrink-0" />
    </div>
  );
}

function RoleRowSkeleton() {
  return (
    <li className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white/[0.03]">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-7 w-7 rounded-md flex-shrink-0" />
    </li>
  );
}

function RoleDropdown({
  roles,
  value,
  onChange,
}: {
  roles: { id: string; name: string; color?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  const selected = roles.find(r => r.id === value);
  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search)
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2.5 text-left  hover:bg-white/8 transition-colors"
      >
        <span className={selected ? 'text-white text-sm' : 'text-white/30 text-sm'}>
          {selected ? selected.name : 'Select a role…'}
        </span>
        <svg className={['w-3.5 h-3.5 text-white/30 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl bg-[#160a0a] shadow-2xl overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <input
              type="text"
              placeholder="Search roles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto pb-2">
            {filtered.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">No roles found.</p>
            ) : filtered.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => { onChange(role.id); setOpen(false); setSearch(''); }}
                className={[
                  'w-full flex items-center gap-2 px-4 py-2 text-xs text-left transition-colors',
                  role.id === value ? 'bg-orange/10 text-orange-warm' : 'text-white/65 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#888' }}
                />
                <span className="truncate font-medium">{role.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommandDropdown({
  value,
  onChange,
}: {
  value: string[];
  onChange: (cmds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  const filtered = BYPASS_COMMANDS.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(cmd: string) {
    if (value.includes(cmd)) onChange(value.filter(c => c !== cmd));
    else onChange([...value, cmd]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2.5 text-left  hover:bg-white/8 transition-colors"
      >
        <span className={value.length ? 'text-white text-sm truncate' : 'text-white/30 text-sm'}>
          {value.length ? value.join(', ') : 'Select commands…'}
        </span>
        <svg className={['w-3.5 h-3.5 text-white/30 transition-transform flex-shrink-0', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl bg-[#160a0a] shadow-2xl overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <input
              type="text"
              placeholder="Search commands…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto pb-2">
            {filtered.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">No commands found.</p>
            ) : filtered.map(cmd => {
              const selected = value.includes(cmd);
              return (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => toggle(cmd)}
                  className={[
                    'w-full flex items-center gap-2 px-4 py-2 text-xs text-left transition-colors',
                    selected ? 'bg-orange/10 text-orange-warm' : 'text-white/65 hover:bg-white/5 hover:text-white',
                  ].join(' ')}
                >
                  <span className={[
                    'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0',
                    selected ? 'border-orange/50 bg-orange/20' : 'border-white/20',
                  ].join(' ')}>
                    {selected && (
                      <svg className="w-2.5 h-2.5 text-orange-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className="font-mono">{cmd}</span>
                </button>
              );
            })}
          </div>
          {value.length > 0 && (
            <div className="border-t border-white/5 px-3 py-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-white/30 hover:text-white/60 text-[10px] transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// function MessageWithRoleMentions({
//   value,
//   onChange,
//   roles,
// }: {
//   value: string;
//   onChange: (v: string) => void;
//   roles: { id: string; name: string; color?: number }[];
// }) {
//   const taRef = useRef<HTMLTextAreaElement>(null);
//   const [dropdown, setDropdown] = useState<{ start: number; query: string } | null>(null);

//   const filtered = useMemo(() => {
//     if (!dropdown) return [];
//     const q = dropdown.query.toLowerCase();
//     return roles.filter(r =>
//       r.name.toLowerCase().includes(q) || r.id.includes(q)
//     ).slice(0, 8);
//   }, [dropdown, roles]);

//   function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
//     const v = e.target.value;
//     const pos = e.target.selectionStart ?? v.length;
//     onChange(v);

//     const before = v.slice(0, pos);
//     const match = before.match(/role:([^\s{]*)$/i);
//     if (match) {
//       setDropdown({ start: match.index!, query: match[1] });
//     } else {
//       setDropdown(null);
//     }
//   }

//   function insertRole(role: { id: string; name: string }) {
//     if (!dropdown || !taRef.current) return;
//     const before = value.slice(0, dropdown.start);
//     const after = value.slice(taRef.current.selectionStart);
//     const inserted = `{role:${role.name}}`;
//     const next = before + inserted + after;
//     onChange(next);
//     setDropdown(null);
//     requestAnimationFrame(() => {
//       const pos = before.length + inserted.length;
//       taRef.current?.setSelectionRange(pos, pos);
//       taRef.current?.focus();
//     });
//   }

//   return (
//     <div className="relative">
//       <textarea
//         ref={taRef}
//         value={value}
//         onChange={handleChange}
//         onBlur={() => setTimeout(() => setDropdown(null), 150)}
//         rows={4}
//         placeholder={'React for roles!\nrole:  ← type this to pick a role'}
//         className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20  resize-none font-mono"
//       />
//       {dropdown && filtered.length > 0 && (
//         <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-[#160a0a] shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
//           {filtered.map(role => (
//             <button
//               key={role.id}
//               type="button"
//               onMouseDown={e => e.preventDefault()}
//               onClick={() => insertRole(role)}
//               className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-white/70 hover:bg-white/5 hover:text-white transition-colors"
//             >
//               <span
//                 className="w-2.5 h-2.5 rounded-full flex-shrink-0"
//                 style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#888' }}
//               />
//               <span className="truncate font-medium">{role.name}</span>
//             </button>
//           ))}
//         </div>
//       )}
//       <p className="text-white/25 text-[10px] mt-1.5">
//         Type <code className="text-orange-light/70">role:</code> to insert a role mention.
//       </p>
//     </div>
//   );
// }

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
  const [commands, setCommands] = useState<string[]>(initial?.commands ?? []);

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
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
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
            <RoleDropdown roles={roles} value={role} onChange={setrole} />
          </div>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Commands this role can bypass</label>
            <CommandDropdown value={commands} onChange={setCommands} />
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    onSave({ role, type, durationMs: type === 'timed' ? durationMs : undefined });
    onClose();
  }

  const TYPE_OPTIONS = [
    { value: 'join',  label: 'Permanent — assigned immediately on join' },
    { value: 'timed', label: 'Timed — assigned after a delay' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
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
            <RoleDropdown roles={roles} value={role} onChange={setRole} />
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

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
  guildRoles?: { id: string; name: string; color?: number }[];
}

export default function RolesClient({ user, guilds, activeGuildId, userGuild, initialData, guildRoles = [] }: Props) {
  const { guild, loading, error, save } = useGuildData(initialData.id);
  const data = guild ?? initialData;

  const [bypass, setBypass] = useState<BypassEntry[]>(() =>
    (data.bypassRoles ?? []).map((r: any) =>
      typeof r === 'string' || typeof r === 'number'
        ? { role: String(r), commands: [] }
        : { role: String(r.role ?? ''), commands: Array.isArray(r.commands) ? r.commands.map(String) : [] }
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

  const [bypassModal, setBypassModal] = useState<'create' | BypassEntry | null>(null);
  const [joinModal, setJoinModal] = useState<'create' | JoinRoleEntry | null>(null);
  // const [reactionModal, setReactionModal] = useState<'create' | ReactionRoleEntry | null>(null);

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
    return guildRoles.find(r => r.id === id)?.name ?? id;
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
            <h1 className="text-xl font-extrabold text-white">Roles & Permissions</h1>
            <p className="text-white/40 text-xs mt-0.5">{userGuild.name}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl bg-bg-card px-6 py-1">
            {loading ? (
              <SettingRowSkeleton />
            ) : (
              <SettingRow label="Sticky Roles" description="Re-assign roles to members when they rejoin.">
                <Toggle value={data.stickyRolesEnabled} onChange={v => handleSave({ stickyRolesEnabled: v })} />
              </SettingRow>
            )}
          </div>

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
              <ul className="space-y-2">
                <RoleRowSkeleton />
                <RoleRowSkeleton />
              </ul>
            ) : joinRoles.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-white/30 text-sm">No join roles configured.</p>
                <button type="button" onClick={() => setJoinModal('create')} className="mt-2 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors">
                  Add one →
                </button>
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
                      <button type="button" onClick={() => setJoinModal(entry)}
                        className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          persistJoinRoles(prev => prev.filter((_, x) => x !== i));
                        }}
                        className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
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
              <ul className="space-y-2">
                <RoleRowSkeleton />
                <RoleRowSkeleton />
              </ul>
            ) : bypass.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-white/30 text-sm">No bypass roles configured.</p>
                <button type="button" onClick={() => setBypassModal('create')} className="mt-2 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors">
                  Add one →
                </button>
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
                      <button type="button" onClick={() => setBypassModal(entry)}
                        className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBypass(prev => {
                            const next = prev.filter((_, x) => x !== i);
                            handleSave({ bypassRoles: next as any });
                            return next;
                          });
                        }}
                        className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
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