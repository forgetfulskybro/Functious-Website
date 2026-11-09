'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  CommandCatalogEntry,
  CommandSetting,
  GuildChannel,
  GuildRole,
} from '@/lib/types';
import { Toggle } from '@/components/ui/Toggle';
import { showErrorToast } from '@/components/ui/Toast';
import MultiSelect from './MultiSelect';

const MAX_COOLDOWN_SECONDS = 3600;

function blankSetting(name: string): CommandSetting {
  return {
    name,
    enabled: true,
    cooldownMs: null,
    allowedChannels: [],
    allowedRoles: [],
    deleteInvocation: false,
  };
}

function formatCooldown(ms: number) {
  if (!ms) return 'none';
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function PolicySection({
  title,
  description,
  badge,
  children,
  className = '',
}: {
  title: string;
  description: string;
  badge: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        'flex h-full flex-col rounded-lg border border-white/[0.05] bg-black/10 p-3',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-white/75">{title}</h4>
          <p className="mt-0.5 text-[11px] leading-snug text-white/35">
            {description}
          </p>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium text-white/40">
          {badge}
        </span>
      </div>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function PolicyCard({
  command,
  policy,
  channels,
  roles,
  prefix,
  open,
  saving,
  onToggle,
  onUpdate,
  onReset,
}: {
  command: CommandCatalogEntry;
  policy: CommandSetting | undefined;
  channels: GuildChannel[];
  roles: GuildRole[];
  prefix: string;
  open: boolean;
  saving: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<CommandSetting>) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const effective = policy ?? blankSetting(command.name);
  const minimumCooldownMs = Math.max(0, Number(command.cooldownMs) || 0);
  const minimumCooldown = formatCooldown(minimumCooldownMs);
  const configuredCooldown = effective.cooldownMs;
  const normalizedCooldown =
    configuredCooldown == null
      ? null
      : Math.max(minimumCooldownMs, configuredCooldown);
  const [cooldown, setCooldown] = useState(
    normalizedCooldown == null ? '' : String(normalizedCooldown / 1000)
  );

  useEffect(() => {
    setCooldown(
      normalizedCooldown == null ? '' : String(normalizedCooldown / 1000)
    );
  }, [normalizedCooldown]);

  const channelOptions = useMemo(
    () =>
      channels
        .filter((channel) => channel.type === 0)
        .map((channel) => ({
          id: channel.id,
          label: `#${channel.name}`,
          hint: channel.id,
        })),
    [channels]
  );

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id,
        label: role.name,
        hint: role.id,
      })),
    [roles]
  );

  const customCooldown = normalizedCooldown != null;
  const effectiveCooldown = normalizedCooldown ?? minimumCooldownMs;
  const channelCount = effective.allowedChannels.length;
  const roleCount = effective.allowedRoles.length;
  const summary = [
    effectiveCooldown > 0
      ? `${formatCooldown(effectiveCooldown)} cooldown`
      : 'No cooldown',
    channelCount
      ? `${channelCount} channel${channelCount === 1 ? '' : 's'}`
      : 'All channels',
    roleCount
      ? `${roleCount} allowed role${roleCount === 1 ? '' : 's'}`
      : 'No role requirement',
    ...(effective.deleteInvocation ? ['Deletes invocation'] : []),
  ];

  function commitCooldown() {
    const value = cooldown.trim();
    if (!value) {
      onUpdate({ cooldownMs: null }).catch(() => {});
      return;
    }

    const seconds = Number(value);
    if (
      !Number.isFinite(seconds) ||
      seconds < minimumCooldownMs / 1000 ||
      seconds > MAX_COOLDOWN_SECONDS
    ) {
      showErrorToast('Invalid cooldown', {
        description:
          minimumCooldownMs > 0
            ? `Enter at least ${minimumCooldown} (maximum ${MAX_COOLDOWN_SECONDS}s), or leave it empty to use the global cooldown.`
            : `Use 0-${MAX_COOLDOWN_SECONDS} seconds, or leave it empty for no cooldown.`,
      });
      setCooldown(
        normalizedCooldown == null ? '' : String(normalizedCooldown / 1000)
      );
      return;
    }

    onUpdate({ cooldownMs: Math.round(seconds * 1000) }).catch(() => {});
  }

  return (
    <li
      className={[
        'rounded-xl border bg-white/[0.02] transition-colors',
        open
          ? 'border-orange/20 bg-white/[0.035]'
          : 'border-white/[0.05] hover:border-white/10',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-xl p-3.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-mono text-[13px] font-semibold text-white/90">
              {prefix}
              {command.name}
            </h3>
            {command.category && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] capitalize text-white/35">
                {command.category}
              </span>
            )}
            {command.permissions && (
              <span className="rounded-full border border-orange/15 bg-orange/[0.06] px-2 py-0.5 text-[9px] text-orange-warm/80">
                {command.permissions}
              </span>
            )}
            {command.aliases.length > 0 && (
              <span className="truncate font-mono text-[10px] text-white/20">
                {command.aliases
                  .map((alias) => `${prefix}${alias}`)
                  .join(' · ')}
              </span>
            )}
          </div>

          <p className="mt-1 max-w-2xl text-xs leading-snug text-white/35">
            {command.description ??
              'Configure who can use this command and where it can run.'}
          </p>

          <p className="mt-1.5 text-[10px] text-white/30">
            {summary.join(' · ')}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px]',
              effective.enabled
                ? 'border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-300/80'
                : 'border-white/10 bg-white/[0.03] text-white/35',
            ].join(' ')}
          >
            <span
              className={[
                'h-1.5 w-1.5 rounded-full',
                effective.enabled ? 'bg-emerald-400/80' : 'bg-white/25',
              ].join(' ')}
            />
            {effective.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <svg
            className={[
              'h-3.5 w-3.5 transition-transform',
              open ? 'rotate-180 text-orange-warm/70' : 'text-white/30',
            ].join(' ')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.05] px-3.5 pb-3.5 pt-3">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/75">
                  Command availability
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/35">
                  When disabled, this command is ignored for everyone in this
                  community, including owners.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span
                  className={[
                    'text-[10px]',
                    effective.enabled ? 'text-white/45' : 'text-white/30',
                  ].join(' ')}
                >
                  {effective.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <Toggle
                  value={effective.enabled}
                  disabled={saving}
                  onChangeAction={(enabled) =>
                    onUpdate({ enabled }).catch(() => {})
                  }
                />
              </div>
            </div>

            <div className="grid items-stretch gap-2.5 md:grid-cols-2">
              <PolicySection
                title="Allowed channels"
                description="Limit where this command can be used."
                badge={channelCount ? `${channelCount} selected` : 'All channels'}
              >
                <MultiSelect
                  options={channelOptions}
                  values={effective.allowedChannels}
                  disabled={saving}
                  placeholder="All text channels"
                  searchPlaceholder="Search text channels…"
                  onChange={(allowedChannels) =>
                    onUpdate({ allowedChannels }).catch(() => {})
                  }
                />
                <p className="mt-1.5 text-[10px] leading-snug text-white/25">
                  Empty means every text channel.
                </p>
              </PolicySection>

              <PolicySection
                title="Allowed roles"
                description="Require one of these roles to use this command."
                badge={roleCount ? `${roleCount} selected` : 'No restriction'}
              >
                <MultiSelect
                  options={roleOptions}
                  values={effective.allowedRoles}
                  disabled={saving}
                  placeholder="No extra role requirement"
                  searchPlaceholder="Search roles…"
                  onChange={(allowedRoles) =>
                    onUpdate({ allowedRoles }).catch(() => {})
                  }
                />
                <p className="mt-1.5 text-[10px] leading-snug text-white/25">
                  Empty means no extra role requirement.
                </p>
              </PolicySection>
            </div>

            <div className="grid items-stretch gap-2.5 md:grid-cols-2">
              <PolicySection
                title="Custom cooldown"
                description="Override the global cooldown. It can't be shorter."
                badge={
                  customCooldown
                    ? 'Custom'
                    : minimumCooldownMs > 0
                      ? 'Global'
                      : 'None'
                }
              >
                <div className="relative">
                  <input
                    type="number"
                    min={minimumCooldownMs / 1000}
                    max={MAX_COOLDOWN_SECONDS}
                    step={0.5}
                    value={cooldown}
                    disabled={saving}
                    onChange={(event) => setCooldown(event.target.value)}
                    onBlur={commitCooldown}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur();
                      }
                    }}
                    placeholder={
                      minimumCooldownMs > 0 ? minimumCooldown : '0'
                    }
                    aria-label={`${command.name} cooldown in seconds`}
                    className="h-10 w-full rounded-lg bg-white/5 px-3 pr-16 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-orange disabled:opacity-50"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-white/25">
                    seconds
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] leading-snug text-white/25">
                  {customCooldown
                    ? minimumCooldownMs > 0
                      ? `Custom cooldown active. It can't be lower than the global ${minimumCooldown} cooldown.`
                      : 'Custom cooldown active. There is no global minimum.'
                    : minimumCooldownMs > 0
                      ? `Empty uses the global ${minimumCooldown} cooldown.`
                      : 'No global cooldown is set. Leave empty for no cooldown.'}
                </p>
              </PolicySection>

              <PolicySection
                title="Invocation cleanup"
                description="Remove the message that triggered the command."
                badge={effective.deleteInvocation ? 'On' : 'Off'}
              >
                <div className="flex min-h-[40px] items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                  <span className="text-xs text-white/50">
                    {effective.deleteInvocation
                      ? 'Trigger messages are deleted'
                      : 'Trigger messages are kept'}
                  </span>
                  <Toggle
                    value={effective.deleteInvocation}
                    disabled={saving}
                    onChangeAction={(deleteInvocation) =>
                      onUpdate({ deleteInvocation }).catch(() => {})
                    }
                  />
                </div>
                <p className="mt-1.5 text-[10px] leading-snug text-white/25">
                  Applies after the command finishes running.
                </p>
              </PolicySection>
            </div>

            {policy && (
              <div className="flex justify-end border-t border-white/[0.04] pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onReset().catch(() => {})}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] text-white/30 transition-colors hover:bg-white/5 hover:text-white/60 disabled:opacity-40"
                >
                  Reset to defaults
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function CommandPolicies({
  catalog,
  settings,
  channels,
  roles,
  prefix,
  saving,
  onSave,
}: {
  catalog: CommandCatalogEntry[];
  settings: CommandSetting[];
  channels: GuildChannel[];
  roles: GuildRole[];
  prefix: string;
  saving: boolean;
  onSave: (next: CommandSetting[]) => Promise<void>;
}) {
  const [local, setLocal] = useState<CommandSetting[]>(settings ?? []);
  const [openName, setOpenName] = useState<string | null>(null);

  useEffect(() => {
    setLocal(settings ?? []);
  }, [settings]);

  const byName = useMemo(
    () => new Map(local.map((setting) => [setting.name, setting])),
    [local]
  );

  async function update(
    name: string,
    patch: Partial<CommandSetting>
  ): Promise<void> {
    const previous = local;
    const current = byName.get(name) ?? blankSetting(name);
    const next = [
      ...local.filter((setting) => setting.name !== name),
      { ...current, ...patch, name },
    ];
    setLocal(next);

    try {
      await onSave(next);
    } catch {
      setLocal(previous);
      throw new Error('Failed to save command policy');
    }
  }

  async function reset(name: string): Promise<void> {
    const previous = local;
    const next = local.filter((setting) => setting.name !== name);
    setLocal(next);
    try {
      await onSave(next);
    } catch {
      setLocal(previous);
      throw new Error('Failed to reset command policy');
    }
  }

  if (catalog.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card p-8 text-center">
        <p className="text-sm text-white/35">No configurable commands found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="rounded-xl border border-orange/10 bg-orange/[0.04] px-4 py-3 text-xs leading-relaxed text-white/45">
        Policies apply to everyone using prefix commands, including owners.
        Allowed channels and roles only narrow access; they never grant extra
        permissions.
      </div>

      <ul className="space-y-2">
        {catalog.map((command) => (
          <PolicyCard
            key={command.name}
            command={command}
            policy={byName.get(command.name)}
            channels={channels}
            roles={roles}
            prefix={prefix}
            open={openName === command.name}
            saving={saving}
            onToggle={() =>
              setOpenName((current) =>
                current === command.name ? null : command.name
              )
            }
            onUpdate={(patch) => update(command.name, patch)}
            onReset={() => reset(command.name)}
          />
        ))}
      </ul>
    </div>
  );
}
