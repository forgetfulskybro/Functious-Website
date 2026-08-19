import { useState } from 'react';
import SelectDropdown from '@/components/ui/SelectDropdown';
import RolesDropdown from '@/components/ui/RolesDropdown';
import NumberInput from '@/components/ui/NumberInput';

export interface BypassEntry {
  role: string;
  commands: string[];
}

export interface JoinRoleEntry {
  role: string;
  type: 'join' | 'timed';
  durationMs?: number;
}

export interface StickyEntry {
  user: string;
  roles: string[];
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

const DURATION_UNITS = [
  { value: 'minutes', label: 'Minutes', ms: 60_000 },
  { value: 'hours', label: 'Hours', ms: 3_600_000 },
  { value: 'days', label: 'Days', ms: 86_400_000 },
  { value: 'weeks', label: 'Weeks', ms: 604_800_000 },
] as const;
type DurationUnit = typeof DURATION_UNITS[number]['value'];

export function msToDisplay(ms: number): { amount: number; unit: DurationUnit } {
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

export function JoinRoleModal({
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

export function StickyEditModal({
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

export function BypassModal({
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