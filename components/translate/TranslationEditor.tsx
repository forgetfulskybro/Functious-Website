'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import UserBadge from '@/components/ui/UserBadge';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { placeholderError } from '@/lib/translationPlaceholders';
import type {
  TranslationBulkAction,
  TranslationBulkResult,
  TranslationLanguageMeta,
  TranslationMutationResponse,
  TranslationPermissions,
  TranslationPreviousVersion,
  TranslationStats,
  TranslationStatus,
  TranslationString,
} from '@/lib/translationTypes';
import { CoverageBar, SourceTarget } from './TranslateChrome';

type Filter = 'all' | 'untranslated' | 'pending' | 'approved' | 'outdated' | 'notes';

type SortKey = 'default' | 'edited' | 'approved' | 'notes' | 'noted' | 'key';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'untranslated', label: 'Untranslated' },
  { key: 'pending', label: 'Awaiting review' },
  { key: 'approved', label: 'Approved' },
  { key: 'outdated', label: 'Outdated' },
  { key: 'notes', label: 'Has notes' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Source order' },
  { key: 'edited', label: 'Last edited' },
  { key: 'approved', label: 'Last approved' },
  { key: 'notes', label: 'Most notes' },
  { key: 'noted', label: 'Recently noted' },
  { key: 'key', label: 'Key A–Z' },
];

const STATUS_STYLES: Record<TranslationStatus, string> = {
  approved: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  pending: 'border-orange/25 bg-orange/10 text-orange-warm',
  outdated: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
  untranslated: 'border-white/10 bg-white/[0.04] text-white/40',
};

const STATUS_DOTS: Record<TranslationStatus, string> = {
  approved: 'bg-emerald-400',
  pending: 'bg-orange',
  outdated: 'bg-rose-400',
  untranslated: 'bg-white/20',
};

const STATUS_LABELS: Record<TranslationStatus, string> = {
  approved: 'Approved',
  pending: 'Awaiting review',
  outdated: 'Outdated',
  untranslated: 'Untranslated',
};

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function StatusBadge({ status }: { status: TranslationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1 w-1 rounded-full ${STATUS_DOTS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function SourceText({
  value,
  onInsert,
}: {
  value: string;
  onInsert?: (token: string) => void;
}) {
  const parts = value.split(/(\{\w+\})/g);
  const tokenClass =
    'inline rounded bg-orange/15 px-1 font-mono text-orange-warm ring-1 ring-inset ring-orange/25';

  return (
    <>
      {parts.map((part, index) => {
        if (!/^\{\w+\}$/.test(part)) {
          return <span key={`text-${index}`}>{part}</span>;
        }

        if (!onInsert) {
          return (
            <mark key={`${part}-${index}`} className={tokenClass}>
              {part}
            </mark>
          );
        }

        return (
          <button
            key={`${part}-${index}`}
            type="button"
            onClick={() => onInsert(part)}
            title={`Insert ${part} at the cursor`}
            aria-label={`Insert ${part}`}
            className={`${tokenClass} cursor-pointer transition-colors hover:bg-orange/25 hover:text-orange-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange`}
          >
            {part}
          </button>
        );
      })}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[96px] rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
      <p className="text-lg font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-xs text-white/45">{label}</p>
    </div>
  );
}

function formatNoteDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function lastNoteAt(entry: TranslationString): number {
  return entry.notes.reduce(
    (latest, note) => Math.max(latest, note.createdAt),
    0,
  );
}

function lastEditedAt(entry: TranslationString): number {
  return entry.editedAt ?? entry.updatedAt ?? 0;
}

function approvedAt(entry: TranslationString): number {
  return (
    entry.approvedAt ??
    (entry.status === 'approved'
      ? entry.updatedAt ?? 0
      : entry.previous?.updatedAt ??
        (entry.status === 'outdated' ? entry.updatedAt ?? 0 : 0))
  );
}

function sortMetaFor(entry: TranslationString, sort: SortKey): string | null {
  if (sort === 'edited') {
    const timestamp = lastEditedAt(entry);
    return timestamp ? `Edited ${formatNoteDate(timestamp)}` : 'Never edited';
  }
  if (sort === 'approved') {
    const timestamp = approvedAt(entry);
    return timestamp ? `Approved ${formatNoteDate(timestamp)}` : 'Not approved';
  }
  if (sort === 'notes' || sort === 'noted') {
    const timestamp = lastNoteAt(entry);
    return timestamp ? `Noted ${formatNoteDate(timestamp)}` : null;
  }
  return null;
}

function SortValue({
  entry,
  sort,
}: {
  entry: TranslationString;
  sort: SortKey;
}) {
  const label = sortMetaFor(entry, sort);
  if (!label) return null;

  return (
    <span className="text-[10px] tabular-nums text-white/30">{label}</span>
  );
}

interface Props {
  language: TranslationLanguageMeta;
  initialStrings: TranslationString[];
  initialStats: TranslationStats;
  permissions: TranslationPermissions | null;
  userId: string | null;
  canEdit: boolean;
  canReview: boolean;
  loginHref: string;
}

export default function TranslationEditor({
  language,
  initialStrings,
  initialStats,
  permissions,
  userId,
  canEdit,
  canReview,
  loginHref,
}: Props) {
  const [strings, setStrings] = useState<TranslationString[]>(initialStrings);
  const [stats, setStats] = useState<TranslationStats>(initialStats);
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialStrings[0]?.key ?? null,
  );
  const [draft, setDraft] = useState(initialStrings[0]?.value ?? '');
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<TranslationBulkAction>('unreview');
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<string | null>(null);
  const valueRef = useRef<HTMLTextAreaElement | null>(null);
  const caretRef = useRef<{ start: number; end: number } | null>(null);

  const isDeveloper = Boolean(permissions?.developer);
  const canBulk = isDeveloper && !language.isBase;

  const selected = useMemo(
    () => strings.find((entry) => entry.key === selectedKey) ?? null,
    [strings, selectedKey],
  );

  const noteUserIds = useMemo(
    () => [...new Set((selected?.notes ?? []).map((note) => note.userId))],
    [selected],
  );
  const noteProfiles = useUserProfiles(noteUserIds);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of strings) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [strings]);

  const counts = useMemo(
    () => ({
      all: strings.length,
      untranslated: stats.untranslated,
      pending: stats.pending,
      approved: stats.approved,
      outdated: stats.outdated,
      notes: strings.filter((entry) => entry.notes.length > 0).length,
    }),
    [strings, stats],
  );

  const canNote = canEdit || canReview;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return strings.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (filter === 'notes' && entry.notes.length === 0) return false;
      if (filter !== 'all' && filter !== 'notes' && entry.status !== filter) {
        return false;
      }
      if (query) {
        const haystack = `${entry.key} ${entry.baseValue} ${entry.value}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [strings, category, filter, search]);

  const sortedVisible = useMemo(() => {
    const list = [...visible];

    switch (sort) {
      case 'edited':
        return list.sort(
          (a, b) =>
            lastEditedAt(b) - lastEditedAt(a) ||
            a.key.localeCompare(b.key),
        );
      case 'approved':
        return list.sort(
          (a, b) =>
            approvedAt(b) - approvedAt(a) || a.key.localeCompare(b.key),
        );
      case 'notes':
        return list.sort(
          (a, b) =>
            b.notes.length - a.notes.length || a.key.localeCompare(b.key),
        );
      case 'noted':
        return list.sort(
          (a, b) =>
            lastNoteAt(b) - lastNoteAt(a) ||
            b.notes.length - a.notes.length ||
            a.key.localeCompare(b.key),
        );
      case 'key':
        return list.sort((a, b) => a.key.localeCompare(b.key));
      default:
        return list;
    }
  }, [visible, sort]);

  const currentSort = SORTS.find((option) => option.key === sort) ?? SORTS[0];

  const bulkCandidates = useMemo(
    () =>
      strings.filter((entry) => entry.value.trim() && entry.value !== entry.baseValue),
    [strings],
  );

  const bulkVisible = useMemo(() => {
    const query = bulkSearch.trim().toLowerCase();
    if (!query) return bulkCandidates;

    return bulkCandidates.filter((entry) =>
      `${entry.key} ${entry.baseValue} ${entry.value}`
        .toLowerCase()
        .includes(query),
    );
  }, [bulkCandidates, bulkSearch]);

  function applyResult(result: TranslationMutationResponse) {
    setStrings((previous) =>
      previous.map((entry) =>
        entry.key === result.string.key ? result.string : entry,
      ),
    );
    setStats(result.stats);
    setDraft(result.string.value);
    caretRef.current = null;
  }

  function selectString(key: string) {
    setSelectedKey(key);
    setDraft(strings.find((entry) => entry.key === key)?.value ?? '');
    caretRef.current = null;
    setNoteOpen(false);
    setNoteText('');
    setPreviousOpen(false);
    setRevertOpen(false);
    setConfirmDeleteNote(null);

    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      window.setTimeout(() => {
        document
          .getElementById('translation-editor')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  function openBulk() {
    setBulkAction('unreview');
    setBulkSelected(new Set(bulkCandidates.map((entry) => entry.key)));
    setBulkSearch('');
    setBulkOpen(true);
  }

  function toggleBulkKey(key: string) {
    setBulkSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllBulk() {
    setBulkSelected((current) => {
      const next = new Set(current);
      for (const entry of bulkVisible) next.add(entry.key);
      return next;
    });
  }

  function clearBulk() {
    setBulkSelected(new Set());
  }

  function applyBulkResult(result: TranslationBulkResult) {
    const updated = new Map(result.strings.map((entry) => [entry.key, entry]));
    setStrings((previous) =>
      previous.map((entry) => updated.get(entry.key) ?? entry),
    );
    setStats(result.stats);
  }

  async function applyBulk() {
    if (!canBulk || bulkSelected.size === 0 || bulkSaving) return;

    setBulkSaving(true);
    try {
      const res = await fetch(`/api/translations/${language.code}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          keys: [...bulkSelected],
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Bulk edit failed');
      }

      const result = data as TranslationBulkResult;
      applyBulkResult(result);

      const noun = result.changed === 1 ? 'string' : 'strings';
      const skipped =
        result.skipped > 0 ? ` · ${result.skipped} skipped` : '';
      showToast(
        `${result.changed} ${noun} ${
          bulkAction === 'approve' ? 'approved' : 'marked unreviewed'
        }${skipped}`,
      );
      setBulkOpen(false);
    } catch (error) {
      showErrorToast('Could not bulk edit translations', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setBulkSaving(false);
    }
  }

  function insertPlaceholder(token: string) {
    if (!canEdit || language.isBase) return;

    const start = Math.min(caretRef.current?.start ?? draft.length, draft.length);
    const end = Math.min(caretRef.current?.end ?? start, draft.length);
    const caret = start + token.length;

    setDraft(`${draft.slice(0, start)}${token}${draft.slice(end)}`);
    caretRef.current = { start: caret, end: caret };

    requestAnimationFrame(() => {
      const textarea = valueRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  async function handleSave() {
    if (!selected || !canEdit || saving || reverting) return;
    if (placeholderProblem) {
      showErrorToast('Placeholders cannot be changed', {
        description: placeholderProblem,
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/translations/${language.code}/${encodeURIComponent(selected.key)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: draft }),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to save the translation');
      }

      applyResult(data);
      showToast('Translation saved for review');
    } catch (error) {
      showErrorToast('Could not save translation', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!selected || !canReview || saving || reverting) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/translations/${language.code}/${encodeURIComponent(selected.key)}/approve`,
        { method: 'POST' },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to approve the translation');
      }

      setPreviousOpen(false);
      applyResult(data);
      showToast('Translation approved');
    } catch (error) {
      showErrorToast('Could not approve translation', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  function discardDraft() {
    if (!selected) return;

    setDraft(selected.value);
    caretRef.current = null;
    setRevertOpen(false);
    showToast('Unsaved changes discarded');
  }

  async function handleRevert() {
    if (!selected || !canReview || saving || reverting) return;

    const hadPrevious = Boolean(selected.previous?.value.trim());
    if (selected.status !== 'pending' && !hadPrevious) return;

    const undoing = selected.status !== 'pending';

    setRevertOpen(false);
    setReverting(true);
    try {
      const res = await fetch(
        `/api/translations/${language.code}/${encodeURIComponent(selected.key)}/revert`,
        { method: 'POST' },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to revert the string');
      }

      setPreviousOpen(false);
      applyResult(data);
      showToast(
        undoing
          ? 'Restored the value from before the revert'
          : hadPrevious
            ? 'Reverted to the previous approved string'
            : 'Draft removed from review',
      );
    } catch (error) {
      showErrorToast('Could not revert translation', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setReverting(false);
    }
  }

  async function handleAddNote() {
    if (!selected || !canNote || !userId || noteSaving) return;

    const text = noteText.trim();
    if (!text) return;

    setNoteSaving(true);
    try {
      const res = await fetch(
        `/api/translations/${language.code}/${encodeURIComponent(selected.key)}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to add the note');
      }

      applyResult(data);
      setNoteText('');
      showToast('Note added');
    } catch (error) {
      showErrorToast('Could not add note', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!selected) return;

    setConfirmDeleteNote(null);
    try {
      const res = await fetch(
        `/api/translations/${language.code}/${encodeURIComponent(selected.key)}/notes/${encodeURIComponent(noteId)}`,
        { method: 'DELETE' },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to delete the note');
      }

      applyResult(data);
      showToast('Note deleted');
    } catch (error) {
      showErrorToast('Could not delete note', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }

  const percent = Math.max(0, Math.min(100, stats.percent));
  const dirty = selected ? draft !== selected.value : false;
  const placeholderProblem = selected
    ? placeholderError(selected.baseValue, draft)
    : null;
  const approvalReady = Boolean(
    selected &&
      selected.value.trim() &&
      selected.value !== selected.baseValue &&
      selected.status !== 'approved' &&
      !placeholderError(selected.baseValue, selected.value),
  );

  function getPreviousVersion(): TranslationPreviousVersion | null {
    if (!selected) return null;

    if (
      dirty &&
      selected.status === 'approved' &&
      selected.value.trim() &&
      selected.value !== selected.baseValue
    ) {
      return {
        value: selected.value,
        status: selected.status,
        updatedAt: selected.updatedAt,
      };
    }

    const stored = selected.previous;
    if (stored && stored.value.trim() && stored.value !== selected.value) {
      return stored;
    }

    return null;
  }

  const previousVersion = getPreviousVersion();
  const canDiscardDraft = canEdit && dirty;
  const hasPreviousSnapshot = Boolean(selected?.previous?.value.trim());
  const undoingRevert = Boolean(
    canReview &&
      selected &&
      hasPreviousSnapshot &&
      (selected.status === 'approved'
        ? selected.previous?.status === 'pending'
        : selected.status === 'untranslated'),
  );
  const canRevertFromReview =
    canReview &&
    Boolean(selected && (selected.status === 'pending' || undoingRevert));
  const canRestorePrevious = canRevertFromReview && hasPreviousSnapshot;
  const canRemoveFromReview =
    selected?.status === 'pending' && !canRestorePrevious;
  const showRevertMenu = canDiscardDraft || canRevertFromReview;

  return (
    <main className="min-h-screen bg-bg-dark pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-white/40">
          <Link
            href="/translate"
            className="transition-colors hover:text-orange-light"
          >
            Translate
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white/60">{language.native}</span>
        </nav>

        <header className="mt-5 rounded-xl border border-white/10 bg-bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SourceTarget code={language.code} />
                {language.isBase && (
                  <span className="rounded border border-white/15 px-2 py-0.5 text-xs text-white/50">
                    Source language
                  </span>
                )}
              </div>
              <h1 className="mt-2 truncate text-3xl font-semibold text-white">
                {language.native}
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {language.name} · {language.code}
              </p>
            </div>

            <div className="flex flex-wrap items-start gap-2">
              <Stat
                label="Translated"
                value={`${stats.percent.toFixed(stats.percent % 1 === 0 ? 0 : 1)}%`}
              />
              <Stat label="Approved" value={formatNumber(stats.approved)} />
              <Stat label="In review" value={formatNumber(stats.pending)} />
            </div>
          </div>

          <div className="mt-5">
            <CoverageBar percent={percent} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
              <span>
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70 align-middle" />
                {formatNumber(stats.approved)} approved
              </span>
              <span>
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange align-middle" />
                {formatNumber(stats.pending)} in review
              </span>
              <span>
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-400/60 align-middle" />
                {formatNumber(stats.outdated)} outdated
              </span>
              <span>
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white/20 align-middle" />
                {formatNumber(stats.untranslated)} untranslated
              </span>
            </div>
          </div>
        </header>

        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/55">
          {language.isBase ? (
            <>This is the source language. Source strings live in the bot&apos;s en_EN file.</>
          ) : !userId ? (
            <>
              You can browse every string.{' '}
              <a
                href={loginHref}
                className="font-medium text-orange-light underline underline-offset-2 hover:text-orange-warm"
              >
                Log in with Fluxer
              </a>{' '}
              to translate or leave notes once you have access.
            </>
          ) : !canEdit ? (
            <>
              You don&apos;t have access to {language.native} yet.{' '}
              <Link
                href="/translate/languages"
                className="font-medium text-orange-light underline underline-offset-2 hover:text-orange-warm"
              >
                Pick it on your languages page
              </Link>{' '}
              and a developer will approve it.
              {permissions?.requestedLanguages.includes(language.code) && (
                <span className="ml-1 text-white/40">Request pending.</span>
              )}
            </>
          ) : (
            <>
              Changes are saved as{' '}
              <span className="font-medium text-orange-light">awaiting review</span>.
              A proofreader approves them before they ship.
            </>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-xl border border-white/10 bg-bg-card p-2">
              <p className="px-2.5 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-white/40">
                Categories
              </p>
              <div className="flex gap-1 overflow-x-auto lg:flex-col">
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className={[
                    'shrink-0 rounded-lg px-2.5 py-2 text-left text-sm transition-colors lg:w-full',
                    category === 'all'
                      ? 'bg-orange/10 text-orange-light'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>All strings</span>
                    <span className="text-xs tabular-nums text-white/35">
                      {formatNumber(strings.length)}
                    </span>
                  </span>
                </button>

                {categories.map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCategory(name)}
                    className={[
                      'shrink-0 rounded-lg px-2.5 py-2 text-left text-sm capitalize transition-colors lg:w-full',
                      category === name
                        ? 'bg-orange/10 text-orange-light'
                        : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
                    ].join(' ')}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate">{name}</span>
                      <span className="text-xs tabular-nums text-white/35">
                        {formatNumber(count)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="rounded-xl border border-white/10 bg-bg-card p-3">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={[
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                      filter === item.key
                        ? 'border-orange/40 bg-orange/10 text-orange-light'
                        : 'border-white/10 text-white/55 hover:border-white/20 hover:text-white/80',
                    ].join(' ')}
                  >
                    {item.label}
                    <span
                      className={[
                        'ml-1.5 tabular-nums',
                        filter === item.key ? 'text-orange-light/60' : 'text-white/30',
                      ].join(' ')}
                    >
                      {formatNumber(counts[item.key])}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative mt-3">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search keys and text"
                  className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-orange/45 focus:outline-none focus:ring-1 focus:ring-orange/30"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="rounded-xl border border-white/10 bg-bg-card">
                <div className="relative z-20 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white/80">Strings</p>
                    {canBulk && (
                      <button
                        type="button"
                        onClick={openBulk}
                        title="Select strings to approve or mark unreviewed"
                        className="inline-flex items-center gap-1.5 rounded-md border border-orange/25 bg-orange/[0.08] px-2 py-1 text-[11px] font-medium text-orange-light transition-colors hover:border-orange/45 hover:bg-orange/[0.14] hover:text-orange-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                      >
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path
                            d="M9 6h11M9 12h11M9 18h11"
                            strokeLinecap="round"
                          />
                          <path
                            d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Bulk edit
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-white/40">
                      {formatNumber(sortedVisible.length)} shown
                    </p>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSortOpen((open) => !open)}
                        aria-haspopup="menu"
                        aria-expanded={sortOpen}
                        className={[
                          'flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
                          sortOpen || sort !== 'default'
                            ? 'border-orange/40 bg-orange/10 text-orange-light'
                            : 'border-white/10 text-white/55 hover:border-white/20 hover:text-white/80',
                        ].join(' ')}
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 6h16M4 12h10M4 18h6"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="whitespace-nowrap">
                          {currentSort.label}
                        </span>
                        <svg
                          className="h-3 w-3"
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

                      {sortOpen && (
                        <>
                          <button
                            type="button"
                            aria-label="Close sort menu"
                            tabIndex={-1}
                            onClick={() => setSortOpen(false)}
                            className="fixed inset-0 z-20 cursor-default"
                          />
                          <div
                            role="menu"
                            aria-label="Sort strings"
                            className="absolute right-0 z-30 mt-1 w-48 rounded-lg border border-white/10 bg-bg-card p-1 shadow-2xl"
                          >
                            {SORTS.map((option) => (
                              <button
                                key={option.key}
                                type="button"
                                role="menuitemradio"
                                aria-checked={sort === option.key}
                                onClick={() => {
                                  setSort(option.key);
                                  setSortOpen(false);
                                }}
                                className={[
                                  'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                                  sort === option.key
                                    ? 'bg-orange/10 text-orange-light'
                                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
                                ].join(' ')}
                              >
                                {option.label}
                                {sort === option.key && (
                                  <svg
                                    className="h-3.5 w-3.5"
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
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto xl:max-h-[calc(100vh-360px)]">
                  {sortedVisible.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <p className="text-sm font-medium text-white/55">
                        No strings match this view.
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        Try another filter, category, or search.
                      </p>
                    </div>
                  ) : (
                    sortedVisible.map((entry) => (
                      <button
                        key={entry.key}
                        type="button"
                        onClick={() => selectString(entry.key)}
                        className={[
                          'w-full border-b border-white/[0.05] px-4 py-3 text-left transition-colors last:border-b-0',
                          selectedKey === entry.key
                            ? 'bg-orange/[0.08]'
                            : 'hover:bg-white/[0.03]',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOTS[entry.status]}`}
                          />
                          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-white/40">
                            {entry.key}
                          </span>
                          <div className="flex shrink-0 items-center gap-2">
                            {entry.notes.length > 0 && (
                              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/45">
                                {entry.notes.length} note
                                {entry.notes.length === 1 ? '' : 's'}
                              </span>
                            )}
                            <SortValue entry={entry} sort={sort} />
                          </div>
                        </div>
                        <p className="mt-1 truncate text-sm text-white/80">
                          {entry.baseValue}
                        </p>
                        {entry.value && entry.status !== 'untranslated' && (
                          <p className="mt-0.5 truncate text-xs text-orange-light/60">
                            {entry.value}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <aside
                id="translation-editor"
                className="h-fit scroll-mt-24 rounded-xl border border-white/10 bg-bg-card xl:sticky xl:top-24"
              >
                {!selected ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-sm text-white/55">
                      Pick a string from the list.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white/80">Edit string</p>
                      <StatusBadge status={selected.status} />
                    </div>

                    <div className="mt-3 rounded-lg bg-black/20 px-3 py-2">
                      <p className="break-all font-mono text-[11px] text-orange-light/70">
                        {selected.key}
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-white/35">
                        {selected.category}
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-white/45">
                          English source
                        </p>
                        <span className="text-xs tabular-nums text-white/30">
                          {formatNumber(selected.baseValue.length)} chars
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm leading-relaxed text-white/75">
                        <SourceText
                          value={selected.baseValue}
                          onInsert={canEdit ? insertPlaceholder : undefined}
                        />
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <label
                          htmlFor="translation-value"
                          className="text-xs font-medium uppercase tracking-wide text-white/45"
                        >
                          Translation · {language.code.replace('_', '-')}
                        </label>
                        <span className="text-xs tabular-nums text-white/30">
                          {formatNumber(draft.length)} chars
                        </span>
                      </div>
                      <textarea
                        id="translation-value"
                        ref={valueRef}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onSelect={(event) => {
                          caretRef.current = {
                            start: event.currentTarget.selectionStart,
                            end: event.currentTarget.selectionEnd,
                          };
                        }}
                        onBlur={(event) => {
                          caretRef.current = {
                            start: event.currentTarget.selectionStart,
                            end: event.currentTarget.selectionEnd,
                          };
                        }}
                        disabled={!canEdit}
                        rows={5}
                        placeholder={
                          language.isBase
                            ? 'Source strings cannot be edited here.'
                            : canEdit
                              ? 'Write the translation…'
                              : 'Log in and request this language to translate.'
                        }
                        className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-orange/45 focus:outline-none focus:ring-1 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      {placeholderProblem ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-rose-300">
                          {placeholderProblem}
                        </p>
                      ) : (
                        !language.isBase && (
                          <p className="mt-1.5 text-xs leading-relaxed text-white/35">
                            Keep placeholders such as{' '}
                            <span className="font-mono text-orange-light/70">
                              {'{prefix}'}
                            </span>{' '}
                            exactly as they appear in the source.
                          </p>
                        )
                      )}
                    </div>

                    {(canEdit ||
                      canReview ||
                      previousVersion ||
                      (canNote && userId && !language.isBase) ||
                      showRevertMenu) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={
                              saving ||
                              reverting ||
                              !dirty ||
                              Boolean(placeholderProblem)
                            }
                            className="min-w-0 grow basis-[calc(50%_-_0.25rem)] rounded-lg bg-orange px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-bright disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        )}

                        {canReview && (
                          <button
                            type="button"
                            onClick={handleApprove}
                            disabled={saving || reverting || !approvalReady}
                            className="min-w-0 grow basis-[calc(50%_-_0.25rem)] rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            Approve
                          </button>
                        )}

                        {previousVersion && (
                          <button
                            type="button"
                            onClick={() => setPreviousOpen((open) => !open)}
                            aria-expanded={previousOpen}
                            className={`min-w-0 grow basis-[calc(50%_-_0.25rem)] rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                              previousOpen
                                ? 'border-white/25 bg-white/[0.06] text-white/85'
                                : 'border-white/10 text-white/55 hover:border-white/20 hover:bg-white/[0.03] hover:text-white/80'
                            }`}
                          >
                            {previousOpen ? 'Hide previous' : 'View previous'}
                          </button>
                        )}

                        {canNote && userId && !language.isBase && (
                          <button
                            type="button"
                            onClick={() => setNoteOpen((open) => !open)}
                            aria-expanded={noteOpen}
                            className={`min-w-0 grow basis-[calc(50%_-_0.25rem)] rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                              noteOpen
                                ? 'border-white/25 bg-white/[0.06] text-white/85'
                                : 'border-white/10 text-white/55 hover:border-white/20 hover:bg-white/[0.03] hover:text-white/80'
                            }`}
                          >
                            {noteOpen ? 'Close note' : 'Add note'}
                          </button>
                        )}

                        {showRevertMenu && (
                          <div className="relative min-w-0 grow basis-[calc(50%_-_0.25rem)]">
                            <button
                              type="button"
                              onClick={() => setRevertOpen((open) => !open)}
                              aria-haspopup="menu"
                              aria-expanded={revertOpen}
                              disabled={saving || reverting}
                              title="Choose what to revert"
                              className={[
                                'w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35',
                                revertOpen
                                  ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                                  : 'border-rose-500/25 text-rose-300/90 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200',
                              ].join(' ')}
                            >
                              {reverting ? 'Reverting…' : 'Revert'}
                            </button>

                            {revertOpen && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Close revert menu"
                                  tabIndex={-1}
                                  onClick={() => setRevertOpen(false)}
                                  className="fixed inset-0 z-20 cursor-default"
                                />
                                <div
                                  role="menu"
                                  aria-label="Revert options"
                                  className="absolute bottom-full right-0 z-30 mb-2 w-72 rounded-lg border border-white/10 bg-bg-card p-1 shadow-2xl"
                                >
                                  <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">
                                    Revert string
                                  </p>

                                  {canDiscardDraft && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={discardDraft}
                                      className="block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                                    >
                                      <span className="block text-xs font-medium text-white/80">
                                        Discard unsaved changes
                                      </span>
                                      <span className="mt-0.5 block text-[11px] leading-relaxed text-white/40">
                                        Go back to the saved translation you had before you started editing.
                                      </span>
                                    </button>
                                  )}

                                  {canRestorePrevious && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={handleRevert}
                                      className="block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                                    >
                                      <span className="block text-xs font-medium text-white/80">
                                        {undoingRevert
                                          ? 'Undo revert'
                                          : 'Restore previous version'}
                                      </span>
                                      <span className="mt-0.5 block text-[11px] leading-relaxed text-white/40">
                                        {undoingRevert
                                          ? 'Bring back the draft this revert replaced.'
                                          : `Bring back the ${
                                              selected.previous?.status === 'pending'
                                                ? 'value from the last review'
                                                : 'approved value'
                                            } that this edit replaced.`}
                                      </span>
                                    </button>
                                  )}

                                  {canRemoveFromReview && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={handleRevert}
                                      className="block w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                                    >
                                      <span className="block text-xs font-medium text-white/80">
                                        Remove from review
                                      </span>
                                      <span className="mt-0.5 block text-[11px] leading-relaxed text-white/40">
                                        Clear this draft and mark the string untranslated again.
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {previousOpen && previousVersion && (
                      <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-white/45">
                            Previous version
                          </p>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={previousVersion.status} />
                            {previousVersion.updatedAt && (
                              <span className="text-xs tabular-nums text-white/30">
                                {formatNoteDate(previousVersion.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/65">
                          {previousVersion.value}
                        </p>
                      </div>
                    )}

                    {noteOpen && canNote && userId && (
                      <div className="mt-3">
                        <textarea
                          value={noteText}
                          onChange={(event) => setNoteText(event.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="Leave context for other translators…"
                          className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-orange/45 focus:outline-none focus:ring-1 focus:ring-orange/30"
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs tabular-nums text-white/35">
                            {noteText.length} / 500
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setNoteOpen(false)}
                              className="rounded-lg px-2.5 py-1.5 text-sm text-white/45 hover:text-white/75"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddNote}
                              disabled={!noteText.trim() || noteSaving}
                              className="rounded-lg bg-orange px-2.5 py-1.5 text-sm font-medium text-white hover:bg-orange-bright disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              {noteSaving ? 'Adding…' : 'Add note'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selected.notes.length > 0 && (
                      <div className="mt-4 border-t border-white/10 pt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-white/45">
                          Notes
                        </p>
                        <ul className="mt-2 space-y-2">
                          {selected.notes.map((note) => (
                            <li
                              key={note.id}
                              className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                                  {noteProfiles[note.userId] ? (
                                    <UserBadge
                                      userId={note.userId}
                                      profile={noteProfiles[note.userId]}
                                      showId={false}
                                      inline
                                    />
                                  ) : (
                                    <span className="text-xs text-white/45">
                                      {note.userId === userId
                                        ? 'You'
                                        : `Translator ${note.userId.slice(-4)}`}
                                    </span>
                                  )}
                                  {note.userId === userId &&
                                    noteProfiles[note.userId] && (
                                      <span className="text-xs text-white/35">
                                        (you)
                                      </span>
                                    )}
                                  <span className="text-xs text-white/35">
                                    · {formatNoteDate(note.createdAt)}
                                  </span>
                                </div>
                                {(note.userId === userId || canReview) &&
                                  (confirmDeleteNote === note.id ? (
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteNote(null)}
                                        className="rounded border border-white/10 px-2 py-0.5 text-xs font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white/80"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteNote(note.id)}
                                      className="shrink-0 text-xs text-white/35 transition-colors hover:text-rose-300"
                                    >
                                      Delete
                                    </button>
                                  ))}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/70">
                                {note.text}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>

      {bulkOpen && canBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-edit-title"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-white/10 bg-bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <h2
                  id="bulk-edit-title"
                  className="text-lg font-semibold text-white"
                >
                  Bulk edit {language.native}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-white/50">
                  Change the review status of many strings at once. Uncheck any
                  string you don&apos;t want to change.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                aria-label="Close bulk edit"
                className="rounded-lg border border-white/10 px-2.5 py-1 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-white/10 p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setBulkAction('unreview')}
                  aria-pressed={bulkAction === 'unreview'}
                  className={[
                    'rounded-lg border p-3 text-left transition-colors',
                    bulkAction === 'unreview'
                      ? 'border-orange/45 bg-orange/10'
                      : 'border-white/10 hover:border-white/20',
                  ].join(' ')}
                >
                  <span className="text-sm font-medium text-white/85">
                    Mark unreviewed
                  </span>
                  <span className="mt-0.5 block text-xs text-white/45">
                    Send translated strings back to the review queue.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkAction('approve')}
                  aria-pressed={bulkAction === 'approve'}
                  className={[
                    'rounded-lg border p-3 text-left transition-colors',
                    bulkAction === 'approve'
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/10 hover:border-white/20',
                  ].join(' ')}
                >
                  <span className="text-sm font-medium text-white/85">
                    Approve
                  </span>
                  <span className="mt-0.5 block text-xs text-white/45">
                    Approve translated strings that keep source placeholders.
                  </span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <input
                    type="search"
                    value={bulkSearch}
                    onChange={(event) => setBulkSearch(event.target.value)}
                    placeholder="Search strings"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange/45 focus:outline-none focus:ring-1 focus:ring-orange/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={selectAllBulk}
                  className="rounded-lg border border-white/10 px-2.5 py-2 text-xs font-medium text-white/60 hover:border-white/20 hover:text-white"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearBulk}
                  className="rounded-lg border border-white/10 px-2.5 py-2 text-xs font-medium text-white/60 hover:border-white/20 hover:text-white"
                >
                  Clear
                </button>
                <span className="text-xs tabular-nums text-white/45">
                  {formatNumber(bulkSelected.size)} selected
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {bulkVisible.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-white/45">
                  No translated strings match this search.
                </p>
              ) : (
                bulkVisible.map((entry) => (
                  <label
                    key={entry.key}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelected.has(entry.key)}
                      onChange={() => toggleBulkKey(entry.key)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent accent-orange"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[11px] text-white/40">
                        {entry.key}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-white/80">
                        {entry.value}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-white/35">
                        {entry.baseValue}
                      </span>
                    </span>
                    <StatusBadge status={entry.status} />
                  </label>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
              <p className="text-xs text-white/40">
                Untranslated strings are skipped.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/55 transition-colors hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyBulk}
                  disabled={bulkSaving || bulkSelected.size === 0}
                  className="rounded-lg bg-orange px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-bright disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {bulkSaving
                    ? 'Applying…'
                    : `Apply to ${formatNumber(bulkSelected.size)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
