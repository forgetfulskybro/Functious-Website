'use client';

import { useEffect, useMemo, useState } from 'react';
import UserBadge from '@/components/ui/UserBadge';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import type { UserProfile } from '@/lib/types';
import type {
  TranslationLanguageSummary,
  TranslationMutationResponse,
  TranslationStatus,
  Translator,
  TranslatorContribution,
} from '@/lib/translationTypes';

const MODERATION_LIMIT = 30;

type ModerationScope = 'all' | 'notes' | 'translations';
type BulkDeleteAction = 'notes' | 'translations';

const SCOPES: { key: ModerationScope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'notes', label: 'Has notes' },
  { key: 'translations', label: 'Translated' },
];

const STATUS_LABELS: Record<TranslationStatus, string> = {
  approved: 'Approved',
  pending: 'Awaiting review',
  outdated: 'Outdated',
  untranslated: 'Untranslated',
};

const STATUS_STYLES: Record<TranslationStatus, string> = {
  approved: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  pending: 'border-orange/25 bg-orange/10 text-orange-warm',
  outdated: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
  untranslated: 'border-white/10 bg-white/[0.04] text-white/40',
};

function formatDate(timestamp: number): string {
  if (!timestamp) return 'Unknown date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function resolvedProfile(
  translator: Translator,
  profiles: Record<string, UserProfile | undefined>,
): UserProfile | null {
  const profile = profiles[translator.userId] ?? translator.profile;
  if (!profile) return null;

  return {
    id: profile.id,
    username: profile.username ?? null,
    globalName: profile.globalName ?? null,
    avatar: profile.avatar ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    pending: profile.pending,
  };
}

function TranslatorMenu({
  translators,
  profiles,
  value,
  currentUserId,
  disabled,
  onChange,
}: {
  translators: Translator[];
  profiles: Record<string, UserProfile | undefined>;
  value: string;
  currentUserId: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = translators.find((translator) => translator.userId === value);
  const currentProfile = current ? resolvedProfile(current, profiles) : null;

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
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
        {current ? (
          <UserBadge
            userId={current.userId}
            profile={currentProfile}
            inline
            showId={false}
            className="max-w-48"
          />
        ) : (
          <span className="max-w-48 truncate">
            {translators.length === 0
              ? 'No translators'
              : 'Select translator'}
          </span>
        )}
        {current?.userId === currentUserId && (
          <span className="rounded bg-white/[0.06] px-1 text-[10px] text-white/40">
            You
          </span>
        )}
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
            aria-label="Close translator menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="menu"
            aria-label="Select translator"
            className="absolute right-0 z-30 mt-1 max-h-72 w-72 overflow-y-auto rounded-lg border border-white/10 bg-bg-card p-1 shadow-2xl"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">
              Translator
            </p>
            {translators.map((translator) => {
              const checked = value === translator.userId;
              const profile = resolvedProfile(translator, profiles);

              return (
                <button
                  key={translator.userId}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  onClick={() => select(translator.userId)}
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                    checked
                      ? 'bg-orange/10 text-orange-light'
                      : 'text-white/65 hover:bg-white/[0.04] hover:text-white',
                  ].join(' ')}
                >
                  <UserBadge
                    userId={translator.userId}
                    profile={profile}
                    size="sm"
                    showId={false}
                    className="flex-1"
                  />
                  {translator.userId === currentUserId && (
                    <span className="shrink-0 rounded bg-white/[0.06] px-1 text-[10px] text-white/40">
                      You
                    </span>
                  )}
                  {checked && (
                    <svg
                      className="h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path
                        d="m5 13 4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function languageLabel(
  languages: TranslationLanguageSummary[],
  code: string,
): string {
  return languages.find((language) => language.code === code)?.native ?? code;
}

function contributionKey(language: string, key: string): string {
  return `${language}:${key}`;
}

function updateContribution(
  language: string,
  key: string,
  result: TranslationMutationResponse,
  translatorId: string,
): TranslatorContribution | null {
  const string = result.string;
  if (!string) return null;

  const notes = string.notes.filter((note) => note.userId === translatorId);
  const ownsTranslation =
    Boolean(string.value.trim()) &&
    string.value !== string.baseValue &&
    (string.translatedBy === translatorId ||
      (!string.translatedBy && string.updatedBy === translatorId));

  if (!ownsTranslation && notes.length === 0) return null;

  return {
    language,
    key,
    baseValue: string.baseValue,
    value: string.value,
    status: string.status,
    updatedAt: string.updatedAt,
    translatedBy: string.translatedBy,
    updatedBy: string.updatedBy,
    ownsTranslation,
    notes,
  };
}

function ModerationEntry({
  entry,
  languages,
  selected,
  pendingAction,
  confirmNote,
  confirmRemoval,
  onToggleSelected,
  onConfirmNote,
  onConfirmRemoval,
  onDeleteNote,
  onRemoveTranslation,
}: {
  entry: TranslatorContribution;
  languages: TranslationLanguageSummary[];
  selected: boolean;
  pendingAction: string | null;
  confirmNote: string | null;
  confirmRemoval: string | null;
  onToggleSelected: () => void;
  onConfirmNote: (value: string | null) => void;
  onConfirmRemoval: (value: string | null) => void;
  onDeleteNote: (language: string, key: string, noteId: string) => void;
  onRemoveTranslation: (language: string, key: string) => void;
}) {
  const entryKey = contributionKey(entry.language, entry.key);
  const removalAction = `${entryKey}:translation`;
  const removalBusy = pendingAction === removalAction;
  const busy = pendingAction !== null;

  return (
    <div
      className={`rounded-xl border p-4 ${
        selected
          ? 'border-orange/25 bg-orange/[0.04]'
          : 'border-white/10 bg-black/15'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            disabled={busy}
            aria-label={`Select ${entry.key} in ${entry.language}`}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-transparent accent-orange disabled:cursor-not-allowed disabled:opacity-35"
          />
          <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/45">
              {languageLabel(languages, entry.language)}
            </span>
            <span className="font-mono text-[10px] text-white/25">
              {entry.language}
            </span>
          </div>
          <p className="mt-1 break-all font-mono text-[11px] text-orange-light/70">
            {entry.key}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {entry.baseValue || 'No source text'}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-xs text-white/45">
            {entry.value || 'Untranslated'}
          </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[entry.status]}`}
          >
            {STATUS_LABELS[entry.status]}
          </span>

          {entry.ownsTranslation &&
            (removalBusy ? (
              <span className="text-xs text-white/40">Removing…</span>
            ) : confirmRemoval === entryKey ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onRemoveTranslation(entry.language, entry.key)
                  }
                  disabled={busy}
                  className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmRemoval(null)}
                  disabled={busy}
                  className="rounded border border-white/10 px-2 py-1 text-xs font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmRemoval(entryKey)}
                disabled={busy}
                className="rounded border border-rose-500/25 px-2 py-1 text-xs font-medium text-rose-200/75 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove translation
              </button>
            ))}
        </div>
      </div>

      {entry.notes.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {entry.notes.map((note) => {
            const noteKey = `${entryKey}:note:${note.id}`;
            const noteBusy = pendingAction === noteKey;

            return (
              <div
                key={note.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-[11px] text-white/40">
                    Note · {formatDate(note.createdAt)}
                  </span>

                  {noteBusy ? (
                    <span className="text-xs text-white/40">Deleting…</span>
                  ) : confirmNote === noteKey ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteNote(entry.language, entry.key, note.id)
                        }
                        disabled={busy}
                        className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => onConfirmNote(null)}
                        disabled={busy}
                        className="rounded border border-white/10 px-2 py-0.5 text-xs font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onConfirmNote(noteKey)}
                      disabled={busy}
                      className="shrink-0 text-xs text-white/35 transition-colors hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete note
                    </button>
                  )}
                </div>

                {note.text && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-white/60">
                    {note.text}
                  </p>
                )}

                {note.imageUrl && (
                  <a
                    href={note.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-orange-light/80 transition-colors hover:text-orange-warm"
                  >
                    View attached image
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TranslationModeration({
  translators,
  profiles,
  languages,
  currentUserId,
}: {
  translators: Translator[];
  profiles: Record<string, UserProfile | undefined>;
  languages: TranslationLanguageSummary[];
  currentUserId: string;
}) {
  const initialTranslatorId =
    translators.find((translator) => translator.userId !== currentUserId)
      ?.userId ??
    translators[0]?.userId ??
    '';
  const [translatorId, setTranslatorId] = useState(initialTranslatorId);
  const [contributions, setContributions] = useState<TranslatorContribution[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ModerationScope>('all');
  const [limit, setLimit] = useState(MODERATION_LIMIT);
  const [reload, setReload] = useState(0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState<string | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<BulkDeleteAction | null>(null);

  const selectedTranslator = translators.find(
    (translator) => translator.userId === translatorId,
  );

  useEffect(() => {
    if (translators.length === 0) {
      setTranslatorId('');
      return;
    }

    if (
      !translators.some((translator) => translator.userId === translatorId)
    ) {
      setTranslatorId(
        translators.find(
          (translator) => translator.userId !== currentUserId,
        )?.userId ?? translators[0].userId,
      );
    }
  }, [translators, translatorId, currentUserId]);

  useEffect(() => {
    if (!translatorId) {
      setContributions([]);
      setLoading(false);
      setError('');
      return;
    }

    let ignore = false;
    setLoading(true);
    setError('');
    setContributions([]);

    fetch(
      `/api/translations/translators/${encodeURIComponent(translatorId)}/contributions`,
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            body?.error ?? 'Could not load this translator’s contributions',
          );
        }
        if (!ignore) {
          setContributions(
            Array.isArray(body?.contributions) ? body.contributions : [],
          );
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Could not load this translator’s contributions',
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [translatorId, reload]);

  useEffect(() => {
    setLimit(MODERATION_LIMIT);
    setConfirmNote(null);
    setConfirmRemoval(null);
    setSelectedKeys(new Set<string>());
    setBulkConfirm(null);
  }, [translatorId, search, scope]);

  const entries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contributions.filter((entry) => {
      if (scope === 'notes' && entry.notes.length === 0) return false;
      if (scope === 'translations' && !entry.ownsTranslation) return false;
      if (!query) return true;

      const noteText = entry.notes.map((note) => note.text).join(' ');
      return `${entry.key} ${entry.baseValue} ${entry.value} ${noteText}`
        .toLowerCase()
        .includes(query);
    });
  }, [contributions, scope, search]);

  const selectedEntries = useMemo(
    () =>
      entries.filter((entry) =>
        selectedKeys.has(contributionKey(entry.language, entry.key)),
      ),
    [entries, selectedKeys],
  );
  const selectedNoteCount = useMemo(
    () =>
      selectedEntries.reduce(
        (total, entry) => total + entry.notes.length,
        0,
      ),
    [selectedEntries],
  );
  const selectedNoteEntryCount = selectedEntries.filter(
    (entry) => entry.notes.length > 0,
  ).length;
  const selectedTranslationCount = selectedEntries.filter(
    (entry) => entry.ownsTranslation,
  ).length;

  const visible = entries.slice(0, limit);
  const noteCount = useMemo(
    () =>
      contributions.reduce(
        (total, entry) => total + entry.notes.length,
        0,
      ),
    [contributions],
  );
  const translationCount = contributions.filter(
    (entry) => entry.ownsTranslation,
  ).length;

  function applyMutation(
    language: string,
    key: string,
    result: TranslationMutationResponse,
  ) {
    const updated = updateContribution(
      language,
      key,
      result,
      translatorId,
    );

    setContributions((current) => {
      const existing = current.find(
        (entry) => entry.language === language && entry.key === key,
      );

      if (!updated) {
        return current.filter(
          (entry) => entry.language !== language || entry.key !== key,
        );
      }

      if (!existing) return [...current, updated];

      return current.map((entry) =>
        entry.language === language && entry.key === key ? updated : entry,
      );
    });
  }

  async function deleteNote(language: string, key: string, noteId: string) {
    setConfirmNote(null);
    setPendingAction(`${contributionKey(language, key)}:note:${noteId}`);

    try {
      const response = await fetch(
        `/api/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}/notes/${encodeURIComponent(noteId)}`,
        { method: 'DELETE' },
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error ?? 'Could not delete the note');
      }

      applyMutation(language, key, body);
      showToast('Note deleted');
    } catch (requestError) {
      showErrorToast('Could not delete note', {
        description:
          requestError instanceof Error
            ? requestError.message
            : 'Please try again.',
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function removeTranslation(language: string, key: string) {
    setConfirmRemoval(null);
    setPendingAction(`${contributionKey(language, key)}:translation`);

    try {
      const response = await fetch(
        `/api/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}`,
        { method: 'DELETE' },
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error ?? 'Could not remove the translation');
      }

      applyMutation(language, key, body);
      showToast('Translation removed');
    } catch (requestError) {
      showErrorToast('Could not remove translation', {
        description:
          requestError instanceof Error
            ? requestError.message
            : 'Please try again.',
      });
    } finally {
      setPendingAction(null);
    }
  }

  function toggleSelected(language: string, key: string) {
    const keyValue = contributionKey(language, key);
    setBulkConfirm(null);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(keyValue)) next.delete(keyValue);
      else next.add(keyValue);
      return next;
    });
  }

  function selectAllEntries() {
    setBulkConfirm(null);
    setSelectedKeys(
      new Set(
        entries.map((entry) => contributionKey(entry.language, entry.key)),
      ),
    );
  }

  function clearSelected() {
    setSelectedKeys(new Set<string>());
    setBulkConfirm(null);
  }

  async function bulkDelete(action: BulkDeleteAction) {
    if (
      !translatorId ||
      selectedEntries.length === 0 ||
      pendingAction !== null
    ) {
      return;
    }

    setBulkConfirm(null);
    setPendingAction('bulk');

    try {
      const response = await fetch(
        `/api/translations/translators/${encodeURIComponent(translatorId)}/bulk-delete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            items: selectedEntries.map((entry) => ({
              language: entry.language,
              key: entry.key,
            })),
          }),
        },
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error ?? 'Could not delete the selected items');
      }

      const removed =
        action === 'notes'
          ? Number(body?.removedNotes ?? 0)
          : Number(body?.removedTranslations ?? 0);
      const noun = action === 'notes' ? 'note' : 'translation';

      setSelectedKeys(new Set<string>());
      setReload((current) => current + 1);

      if (removed === 0) {
        showToast('No matching contributions were removed');
      } else {
        showToast(
          `${removed.toLocaleString('en-US')} ${noun}${removed === 1 ? '' : 's'} deleted`,
        );
      }
    } catch (requestError) {
      showErrorToast(
        action === 'notes'
          ? 'Could not delete notes'
          : 'Could not remove translations',
        {
          description:
            requestError instanceof Error
              ? requestError.message
              : 'Please try again.',
        },
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section
      id="moderation"
      aria-labelledby="moderation-heading"
      className="rounded-xl border border-white/10 bg-bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="moderation-heading"
            className="text-lg font-semibold text-white"
          >
            Translator moderation
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/45">
            Review and remove notes or translations authored by a translator.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-1 sm:items-end">
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/35">
            Translator
          </span>
          <TranslatorMenu
            translators={translators}
            profiles={profiles}
            value={translatorId}
            currentUserId={currentUserId}
            disabled={translators.length === 0 || pendingAction !== null}
            onChange={setTranslatorId}
          />
        </div>
      </div>

      {selectedTranslator && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
          <span className="break-all font-mono text-white/35">
            {selectedTranslator.userId}
          </span>
          <span>
            {translationCount.toLocaleString('en-US')} translation
            {translationCount === 1 ? '' : 's'}
          </span>
          <span>
            {noteCount.toLocaleString('en-US')} note
            {noteCount === 1 ? '' : 's'}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search keys, translations, or notes"
          className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange/45 focus:outline-none focus:ring-1 focus:ring-orange/30"
        />

        <div className="inline-flex rounded-lg border border-white/10 p-0.5">
          {SCOPES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setScope(option.key)}
              aria-pressed={scope === option.key}
              className={[
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                scope === option.key
                  ? 'bg-white/[0.07] text-white'
                  : 'text-white/40 hover:text-white/70',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setReload((current) => current + 1)}
          disabled={loading || pendingAction !== null || !translatorId}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {!loading && !error && entries.length > 0 && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/15 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/35">
              Bulk delete
            </span>
            <button
              type="button"
              onClick={selectAllEntries}
              disabled={pendingAction !== null}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearSelected}
              disabled={selectedEntries.length === 0 || pendingAction !== null}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
            <span className="text-xs tabular-nums text-white/45">
              {selectedEntries.length.toLocaleString('en-US')} selected
            </span>
            <span className="text-xs tabular-nums text-white/30">
              {selectedNoteCount.toLocaleString('en-US')} note
              {selectedNoteCount === 1 ? '' : 's'} ·{' '}
              {selectedTranslationCount.toLocaleString('en-US')} translation
              {selectedTranslationCount === 1 ? '' : 's'}
            </span>

            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBulkConfirm('notes')}
                disabled={
                  selectedNoteCount === 0 || pendingAction !== null
                }
                className="rounded-lg border border-rose-500/25 px-2.5 py-1.5 text-xs font-medium text-rose-200/75 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {pendingAction === 'bulk'
                  ? 'Deleting…'
                  : `Delete notes${selectedNoteCount ? ` (${selectedNoteCount.toLocaleString('en-US')})` : ''}`}
              </button>
              <button
                type="button"
                onClick={() => setBulkConfirm('translations')}
                disabled={
                  selectedTranslationCount === 0 || pendingAction !== null
                }
                className="rounded-lg border border-rose-500/25 px-2.5 py-1.5 text-xs font-medium text-rose-200/75 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {pendingAction === 'bulk'
                  ? 'Deleting…'
                  : `Remove translations${selectedTranslationCount ? ` (${selectedTranslationCount.toLocaleString('en-US')})` : ''}`}
              </button>
            </div>
          </div>

          {bulkConfirm === 'notes' && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-rose-500/20 bg-rose-950/20 px-3 py-2">
              <p className="text-xs text-rose-100/75">
                Delete {selectedNoteCount.toLocaleString('en-US')} notes from{' '}
                {selectedNoteEntryCount.toLocaleString('en-US')} strings?
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => bulkDelete('notes')}
                  disabled={pendingAction !== null}
                  className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete notes
                </button>
                <button
                  type="button"
                  onClick={() => setBulkConfirm(null)}
                  disabled={pendingAction !== null}
                  className="rounded border border-white/10 px-2 py-1 text-xs font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {bulkConfirm === 'translations' && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-rose-500/20 bg-rose-950/20 px-3 py-2">
              <p className="text-xs text-rose-100/75">
                Remove {selectedTranslationCount.toLocaleString('en-US')}{' '}
                translations?
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => bulkDelete('translations')}
                  disabled={pendingAction !== null}
                  className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setBulkConfirm(null)}
                  disabled={pendingAction !== null}
                  className="rounded border border-white/10 px-2 py-1 text-xs font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {translators.length === 0 && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/15 px-4 py-10 text-center">
          <p className="text-sm text-white/55">No translators to moderate yet.</p>
        </div>
      )}

      {translators.length > 0 && loading && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/15 px-4 py-10 text-center text-sm text-white/40">
          Loading contributions…
        </div>
      )}

      {translators.length > 0 && !loading && error && (
        <div className="mt-3 rounded-lg border border-rose-500/25 bg-rose-950/20 px-4 py-6 text-center">
          <p className="text-sm text-rose-100/70">{error}</p>
          <button
            type="button"
            onClick={() => setReload((current) => current + 1)}
            className="mt-2 text-xs font-medium text-rose-200 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {translators.length > 0 &&
        !loading &&
        !error &&
        entries.length === 0 && (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/15 px-4 py-10 text-center">
            <p className="text-sm text-white/55">
              No contributions match this view.
            </p>
            <p className="mt-1 text-xs text-white/35">
              Try another scope or clear the search.
            </p>
          </div>
        )}

      {translators.length > 0 &&
        !loading &&
        !error &&
        visible.length > 0 && (
          <div className="mt-3 space-y-3">
            {visible.map((entry) => (
              <ModerationEntry
                key={contributionKey(entry.language, entry.key)}
                entry={entry}
                languages={languages}
                selected={selectedKeys.has(
                  contributionKey(entry.language, entry.key),
                )}
                pendingAction={pendingAction}
                confirmNote={confirmNote}
                confirmRemoval={confirmRemoval}
                onToggleSelected={() =>
                  toggleSelected(entry.language, entry.key)
                }
                onConfirmNote={setConfirmNote}
                onConfirmRemoval={setConfirmRemoval}
                onDeleteNote={deleteNote}
                onRemoveTranslation={removeTranslation}
              />
            ))}
          </div>
        )}

      {!loading && entries.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((current) => current + MODERATION_LIMIT)}
          className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/55 transition-colors hover:border-white/20 hover:text-white/80"
        >
          Show {(entries.length - limit).toLocaleString('en-US')} more
        </button>
      )}
    </section>
  );
}
