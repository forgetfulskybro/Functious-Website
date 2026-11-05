'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import TranslationModeration from '@/components/translate/TranslationModeration';
import type { UserProfile } from '@/lib/types';
import type {
  TranslationImportResult,
  TranslationLanguageSummary,
  Translator,
} from '@/lib/translationTypes';

function profileAvatar(
  userId: string,
  profile: { avatar?: string | null; avatarUrl?: string | null } | null,
): string | null {
  if (!profile) return null;
  if (profile.avatarUrl) return profile.avatarUrl;
  if (!profile.avatar) return null;
  const ext = profile.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://fluxerusercontent.com/avatars/${userId}/${profile.avatar}.${ext}?size=128`;
}

interface Props {
  initialTranslators: Translator[];
  languages: TranslationLanguageSummary[];
  currentUserId: string;
  canManageAccess: boolean;
  isOwner: boolean;
}

type PermissionKey = 'developer' | 'moderator' | 'proofreader';

const PERMISSION_OPTIONS: {
  key: PermissionKey;
  label: string;
  hint: string;
  ownerOnly?: boolean;
}[] = [
  {
    key: 'developer',
    label: 'Developer',
    hint: 'Full console and moderation access',
    ownerOnly: true,
  },
  {
    key: 'moderator',
    label: 'Moderator',
    hint: 'Can remove notes and translations',
  },
  {
    key: 'proofreader',
    label: 'Proofreader',
    hint: 'Can approve and review translations',
  },
];

function PermissionMenu({
  value,
  owner,
  canGrantDeveloper,
  disabled,
  onChange,
}: {
  value: Record<PermissionKey, boolean>;
  owner: boolean;
  canGrantDeveloper: boolean;
  disabled: boolean;
  onChange: (key: PermissionKey, checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = PERMISSION_OPTIONS.filter((option) => value[option.key]);
  const summary =
    active.length === 0
      ? 'Translator only'
      : active.map((option) => option.label).join(' · ');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        className={[
          'flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors',
          open
            ? 'border-orange/35 bg-orange/[0.06] text-orange-light'
            : 'border-white/10 text-white/55 hover:border-white/20 hover:text-white/80',
          disabled ? 'cursor-not-allowed opacity-40' : '',
        ].join(' ')}
      >
        <span className="max-w-56 truncate">
          {owner ? 'Owner access' : summary}
        </span>
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label="Close permissions menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="menu"
            aria-label="User permissions"
            className="absolute left-0 z-30 mt-1 w-72 rounded-lg border border-white/10 bg-bg-card p-1 shadow-2xl"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">
              Permissions
            </p>
            {PERMISSION_OPTIONS.map((option) => {
              const checked = value[option.key];
              const ownerLocked = option.ownerOnly && !canGrantDeveloper;
              const optionDisabled = ownerLocked;

              return (
                <button
                  key={option.key}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  disabled={optionDisabled}
                  onClick={() => onChange(option.key, !checked)}
                  className={[
                    'flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                    optionDisabled
                      ? 'cursor-not-allowed opacity-45'
                      : 'hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border',
                      checked
                        ? 'border-orange/50 bg-orange/20 text-orange-light'
                        : 'border-white/15 text-transparent',
                    ].join(' ')}
                  >
                    <svg
                      className="h-2.5 w-2.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden="true"
                    >
                      <path
                        d="m5 13 4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-white/75">
                      {option.label}
                    </span>
                    <span className="block text-[11px] leading-snug text-white/35">
                      {ownerLocked
                        ? 'Only the owner can change developer access'
                        : option.hint}
                    </span>
                  </span>
                </button>
              );
            })}
            {!canGrantDeveloper && (
              <p className="mt-1 border-t border-white/[0.06] px-2.5 py-2 text-[11px] leading-snug text-white/30">
                Developer access is controlled by the owner.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LanguageMenu({
  value,
  languages,
  disabled,
  onChange,
}: {
  value: string[];
  languages: TranslationLanguageSummary[];
  disabled: boolean;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = languages.filter((language) => value.includes(language.code));
  const summary = disabled
    ? 'All languages'
    : active.length === 0
      ? 'No languages'
      : active.length === languages.length
        ? 'All languages'
        : active.map((language) => language.native).join(', ');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        className={[
          'flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors',
          open
            ? 'border-orange/35 bg-orange/[0.06] text-orange-light'
            : 'border-white/10 text-white/55 hover:border-white/20 hover:text-white/80',
          disabled ? 'cursor-not-allowed opacity-40' : '',
        ].join(' ')}
      >
        <span className="max-w-56 truncate">{summary}</span>
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label="Close language menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="menu"
            aria-label="Translator languages"
            className="absolute left-0 z-30 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-white/10 bg-bg-card p-1 shadow-2xl"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">
              Languages
            </p>
            {languages.map((language) => {
              const checked = value.includes(language.code);

              return (
                <button
                  key={language.code}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  onClick={() => onChange(language.code)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span
                    className={[
                      'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border',
                      checked
                        ? 'border-orange/50 bg-orange/20 text-orange-light'
                        : 'border-white/15 text-transparent',
                    ].join(' ')}
                  >
                    <svg
                      className="h-2.5 w-2.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden="true"
                    >
                      <path
                        d="m5 13 4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-white/75">
                      {language.native}
                    </span>
                    <span className="block text-[10px] text-white/30">
                      {language.code}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TranslatorRow({
  translator,
  profile,
  languages,
  currentUserId,
  canGrantDeveloper,
  onRemoved,
}: {
  translator: Translator;
  profile?: UserProfile;
  languages: TranslationLanguageSummary[];
  currentUserId: string;
  canGrantDeveloper: boolean;
  onRemoved: (userId: string) => void;
}) {
  const [languagesForUser, setLanguagesForUser] = useState<string[]>(
    translator.permissions.languages,
  );
  const [proofreader, setProofreader] = useState(translator.permissions.proofreader);
  const [moderator, setModerator] = useState(translator.permissions.moderator);
  const [developer, setDeveloper] = useState(translator.permissions.developer);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemoving, setConfirmRemoving] = useState(false);
  const [baseline, setBaseline] = useState({
    languages: translator.permissions.languages,
    proofreader: translator.permissions.proofreader,
    moderator: translator.permissions.moderator,
    developer: translator.permissions.developer,
  });
  const [requested, setRequested] = useState(
    translator.permissions.requestedLanguages,
  );

  const resolvedProfile = profile ?? translator.profile ?? null;
  const displayName =
    resolvedProfile?.globalName ||
    resolvedProfile?.username ||
    `User ${translator.userId.slice(-4)}`;
  const handle = resolvedProfile?.username
    ? `@${resolvedProfile.username}`
    : translator.userId;
  const avatar = profileAvatar(translator.userId, resolvedProfile);
  const locked = translator.owner;
  const ownerLockedRemoval = !canGrantDeveloper && developer;

  const dirty =
    [...languagesForUser].sort().join(',') !==
      [...baseline.languages].sort().join(',') ||
    proofreader !== baseline.proofreader ||
    moderator !== baseline.moderator ||
    developer !== baseline.developer;

  function toggleLanguage(code: string) {
    setLanguagesForUser((current) =>
      current.includes(code)
        ? current.filter((entry) => entry !== code)
        : [...current, code],
    );
  }

  async function save() {
    setSaving(true);
    try {
      const updates: {
        languages?: string[];
        proofreader?: boolean;
        moderator?: boolean;
        developer?: boolean;
      } = {};

      if (
        [...languagesForUser].sort().join(',') !==
        [...baseline.languages].sort().join(',')
      ) {
        updates.languages = languagesForUser;
      }
      if (proofreader !== baseline.proofreader) {
        updates.proofreader = proofreader;
      }
      if (moderator !== baseline.moderator) {
        updates.moderator = moderator;
      }
      if (developer !== baseline.developer) {
        updates.developer = developer;
      }

      if (updates.developer !== undefined && !canGrantDeveloper) {
        showErrorToast('Only the owner can change developer access');
        return;
      }
      if (Object.keys(updates).length === 0) return;

      const res = await fetch(
        `/api/translations/translators/${translator.userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Could not update this translator');
      }

      const updated = data.translator;
      setLanguagesForUser(updated.permissions.languages);
      setProofreader(updated.permissions.proofreader);
      setModerator(updated.permissions.moderator);
      setDeveloper(updated.permissions.developer);
      setBaseline({
        languages: updated.permissions.languages,
        proofreader: updated.permissions.proofreader,
        moderator: updated.permissions.moderator,
        developer: updated.permissions.developer,
      });
      setRequested(updated.permissions.requestedLanguages);
      showToast('Translator updated');
    } catch (error) {
      showErrorToast('Could not update translator', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/translations/translators/${translator.userId}`,
        { method: 'DELETE' },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Could not remove this translator');
      }

      onRemoved(translator.userId);
    } catch (error) {
      showErrorToast('Could not remove translator', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
      setConfirmRemoving(false);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange/15 text-sm font-semibold text-orange-warm ring-1 ring-white/10">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">
                {displayName}
                {translator.userId === currentUserId && (
                  <span className="ml-1.5 text-xs font-normal text-white/40">
                    (you)
                  </span>
                )}
              </p>
              {translator.owner ? (
                <span className="rounded border border-orange/30 bg-orange/15 px-2 py-0.5 text-[10px] font-medium text-orange-bright">
                  Owner
                </span>
              ) : (
                <>
                  {developer && (
                    <span className="rounded border border-orange/25 bg-orange/10 px-2 py-0.5 text-[10px] font-medium text-orange-light">
                      Developer
                    </span>
                  )}
                  {moderator && (
                    <span className="rounded border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                      Moderator
                    </span>
                  )}
                  {proofreader && (
                    <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      Proofreader
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-white/45">{handle}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
              <span className="text-white/35">ID</span>
              <span className="select-all font-mono text-white/55">
                {translator.userId}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              {translator.contributions.approved} approved ·{' '}
              {translator.contributions.total} edits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {removing ? (
            <span className="text-xs text-white/40">Removing…</span>
          ) : confirmRemoving ? (
            <>
              <button
                type="button"
                onClick={remove}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemoving(false)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white/80"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRemoving(true)}
              disabled={
                saving ||
                locked ||
                translator.userId === currentUserId ||
                ownerLockedRemoval
              }
              title={
                locked
                  ? 'Owners cannot be removed'
                  : translator.userId === currentUserId
                    ? 'You cannot remove yourself'
                    : ownerLockedRemoval
                      ? 'Only the owner can remove developer access'
                      : undefined
              }
              className="rounded-lg border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-200/70 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving || locked}
            className="rounded-lg bg-orange px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-bright disabled:cursor-not-allowed disabled:opacity-30"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-white/10 pt-3">
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/35">
            Permissions
          </p>
          <PermissionMenu
            value={{ developer, moderator, proofreader }}
            owner={translator.owner}
            canGrantDeveloper={canGrantDeveloper}
            disabled={locked}
            onChange={(key, checked) => {
              if (key === 'developer') setDeveloper(checked);
              if (key === 'moderator') setModerator(checked);
              if (key === 'proofreader') setProofreader(checked);
            }}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/35">
            Languages
          </p>
          <LanguageMenu
            value={languagesForUser}
            languages={languages}
            disabled={locked || developer}
            onChange={toggleLanguage}
          />
        </div>
        {!canGrantDeveloper && !translator.owner && (
          <p className="max-w-xs text-xs leading-relaxed text-white/35">
            Only the owner can add or remove developer access.
          </p>
        )}
      </div>

      {requested.length > 0 && (
        <p className="mt-2 text-xs text-white/40">
          Requested:{' '}
          <span className="text-orange-light/70">
            {requested
              .map(
                (code) =>
                  languages.find((language) => language.code === code)?.native ??
                  code,
              )
              .join(', ')}
          </span>
        </p>
      )}
    </div>
  );
}

export default function DeveloperPanel({
  initialTranslators,
  languages,
  currentUserId,
  canManageAccess,
  isOwner,
}: Props) {
  const router = useRouter();
  const importInput = useRef<HTMLInputElement>(null);
  const [translators, setTranslators] = useState<Translator[]>(initialTranslators);
  const [newUserId, setNewUserId] = useState('');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    languages.map((language) => language.code),
  );
  const [includePending, setIncludePending] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'access' | 'moderation'>(
    canManageAccess ? 'access' : 'moderation',
  );

  const unresolvedIds = useMemo(
    () =>
      translators
        .filter((translator) => !translator.profile || translator.profile.pending)
        .map((translator) => translator.userId),
    [translators],
  );
  const profiles = useUserProfiles(unresolvedIds);

  async function addTranslator(event: React.FormEvent) {
    event.preventDefault();
    const userId = newUserId.trim();

    if (!/^\d{17,20}$/.test(userId)) {
      showErrorToast('Enter a valid Fluxer user ID');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/translations/translators/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: [] }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Could not add that translator');
      }

      const added: Translator = {
        ...data.translator,
        contributions: { approved: 0, total: 0 },
      };

      setTranslators((current) => {
        const exists = current.some((entry) => entry.userId === userId);
        return exists
          ? current.map((entry) => (entry.userId === userId ? { ...entry, ...added } : entry))
          : [...current, added];
      });
      setNewUserId('');
      showToast('Translator added');
    } catch (error) {
      showErrorToast('Could not add translator', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setAdding(false);
    }
  }

  function handleRemoved(userId: string) {
    setTranslators((current) =>
      current.filter((translator) => translator.userId !== userId),
    );
    showToast('Translator removed');
  }

  function toggleExportLanguage(code: string) {
    setSelectedLanguages((current) =>
      current.includes(code)
        ? current.filter((entry) => entry !== code)
        : [...current, code],
    );
  }

  async function downloadExport() {
    if (selectedLanguages.length === 0) {
      showErrorToast('Pick at least one language to export');
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('languages', selectedLanguages.join(','));
      if (includePending) params.set('includePending', '1');

      const res = await fetch(`/api/translations/export?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Export failed');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') ?? '';
      const filename =
        disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
        'functious-translations.zip';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast('Translation archive downloaded');
    } catch (error) {
      showErrorToast('Could not export translations', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setExporting(false);
    }
  }

  async function refreshFiles() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/translations/refresh', { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Refresh failed');
      }

      showToast('Translation files refreshed');
      router.refresh();
    } catch (error) {
      showErrorToast('Could not refresh translation files', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (chosen.length === 0) return;

    setImporting(true);
    try {
      const form = new FormData();
      for (const file of chosen) form.append('files', file);

      const res = await fetch('/api/translations/import', {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Import failed');
      }

      const result = data as TranslationImportResult;
      const stringCount = result.strings ?? 0;
      const languageCount = result.languages?.length ?? 0;
      const warnings = result.errors?.length ?? 0;

      showToast(
        `Imported ${stringCount.toLocaleString('en-US')} string${stringCount === 1 ? '' : 's'} across ${languageCount} language${languageCount === 1 ? '' : 's'}${warnings > 0 ? ` · ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}`,
      );
      router.refresh();
    } catch (error) {
      showErrorToast('Could not import translations', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
      <nav className="flex items-center gap-2 text-sm text-white/40">
        <Link
          href="/translate"
          className="transition-colors hover:text-orange-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          Translate
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-white/60">Console</span>
      </nav>

      <header className="mt-5">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Translator console
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          {canManageAccess
            ? 'Manage access, moderate translations, and move language files in and out.'
            : 'Review and remove notes or translations authored by translators.'}
        </p>
      </header>

      {canManageAccess && (
        <div className="mt-5 inline-flex rounded-lg border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setView('access')}
            aria-pressed={view === 'access'}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'access'
                ? 'bg-white/[0.07] text-white'
                : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            Access
          </button>
          <button
            type="button"
            onClick={() => setView('moderation')}
            aria-pressed={view === 'moderation'}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'moderation'
                ? 'bg-white/[0.07] text-white'
                : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            Moderation
          </button>
        </div>
      )}

      {canManageAccess && view === 'access' ? (
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">People</h2>
            <span className="text-sm tabular-nums text-white/40">
              {translators.length}
            </span>
          </div>

          <form
            onSubmit={addTranslator}
            className="mb-3 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-bg-card p-3"
          >
            <input
              value={newUserId}
              onChange={(event) => setNewUserId(event.target.value)}
              placeholder="Fluxer user ID"
              inputMode="numeric"
              className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:border-orange/45 focus:outline-none focus:ring-1 focus:ring-orange/30"
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {adding ? 'Adding…' : 'Add translator'}
            </button>
          </form>

          <div className="space-y-3">
            {translators.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-bg-card px-5 py-12 text-center">
                <p className="text-sm font-medium text-white/60">
                  No translators yet.
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Share the translate page, or add someone by user ID.
                </p>
              </div>
            ) : (
              translators.map((translator) => (
                <TranslatorRow
                  key={translator.userId}
                  translator={translator}
                  profile={profiles[translator.userId]}
                  languages={languages}
                  currentUserId={currentUserId}
                  canGrantDeveloper={isOwner}
                  onRemoved={handleRemoved}
                />
              ))
            )}
          </div>
        </section>

        <aside className="h-fit lg:sticky lg:top-24">
          <section className="rounded-xl border border-white/10 bg-bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">
                Export &amp; import
              </h2>
              <button
                type="button"
                onClick={() =>
                  setSelectedLanguages(
                    selectedLanguages.length === languages.length
                      ? []
                      : languages.map((language) => language.code),
                  )
                }
                className="text-xs text-white/45 transition-colors hover:text-orange-light"
              >
                {selectedLanguages.length === languages.length
                  ? 'Clear all'
                  : 'Select all'}
              </button>
            </div>


            <div className="mt-3 space-y-1">
              {languages.map((language) => {
                const active = selectedLanguages.includes(language.code);

                return (
                  <label
                    key={language.code}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleExportLanguage(language.code)}
                      className="h-3.5 w-3.5 rounded border-white/15 bg-transparent accent-orange"
                    />
                    <span className="flex-1 truncate text-sm text-white/65">
                      {language.native}
                    </span>
                    <span className="text-xs tabular-nums text-white/40">
                      {language.stats.approvedPercent.toFixed(0)}%
                    </span>
                  </label>
                );
              })}
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-white/10 pt-3">
              <input
                type="checkbox"
                checked={includePending}
                onChange={(event) => setIncludePending(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/15 bg-transparent accent-orange"
              />
              <span className="text-sm text-white/55">
                Include awaiting review
              </span>
            </label>

            <input
              ref={importInput}
              type="file"
              accept=".json,.zip,application/json,application/zip"
              multiple
              className="hidden"
              onChange={handleImport}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => importInput.current?.click()}
                disabled={importing || exporting || refreshing}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
              <button
                type="button"
                onClick={downloadExport}
                disabled={exporting || importing || refreshing}
                className="flex-1 rounded-lg bg-orange px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-bright disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exporting ? 'Preparing archive…' : 'Download ZIP'}
              </button>
            </div>

            <button
              type="button"
              onClick={refreshFiles}
              disabled={refreshing || importing || exporting}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {refreshing ? 'Refreshing…' : 'Refresh translation files'}
            </button>


          </section>
        </aside>
      </div>
      ) : (
        <div className="mt-8">
          <TranslationModeration
            translators={translators}
            profiles={profiles}
            languages={languages}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}
