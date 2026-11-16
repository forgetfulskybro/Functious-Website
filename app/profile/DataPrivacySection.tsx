'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import CommunityFilterDropdown from '@/app/profile/CommunityFilterDropdown';
import type { FluxerUser } from '@/lib/types';

type Counts = {
  pollsOwned: number;
  pollsVoted: number;
  giveawaysOwned: number;
  giveawaysEntered: number;
  eventsHosted: number;
  eventRsvps: number;
  formsCreated: number;
  formSubmissions: number;
  translations: number;
  guildReferences: number;
};

interface PollRecord {
  _id?: string;
  owner?: string;
  serverId?: string;
  channelId?: string;
  messageId?: string;
  desc?: string;
  question?: string;
  ended?: boolean;
  relationship?: { owned?: boolean; voted?: boolean };
}

interface GiveawayRecord {
  _id?: string;
  owner?: string;
  serverId?: string;
  channelId?: string;
  messageId?: string;
  prize?: string;
  winners?: number;
  ended?: boolean;
  relationship?: {
    owned?: boolean;
    entered?: boolean;
    picking?: boolean;
    won?: boolean;
  };
}

interface EventRecord {
  _id?: string;
  guildId?: string;
  channelId?: string;
  messageId?: string;
  title?: string;
  status?: string;
  startAt?: number;
}

interface RsvpRecord {
  _id?: string;
  eventId?: string;
  guildId?: string;
  response?: string;
  waitlisted?: boolean;
  event?: EventRecord | null;
}

interface FormRecord {
  _id?: string;
  guildId?: string;
  name?: string;
  status?: string;
}

interface SubmissionRecord {
  _id?: string;
  formId?: string;
  guildId?: string;
  status?: string;
  submittedAt?: number | null;
  relationship?: { submitted?: boolean; reviewed?: boolean };
  form?: FormRecord | null;
}

interface TranslationRecord {
  _id?: string;
  language?: string;
  key?: string;
  value?: string;
  status?: string;
}

interface GuildRecord {
  id?: string;
  name?: string | null;
  usersJoined?: Array<Record<string, unknown>>;
  userTimezones?: Array<Record<string, unknown>>;
  stickyRoles?: Array<Record<string, unknown>>;
  birthdayBlacklist?: unknown[];
  birthdayPendingRemovals?: Array<Record<string, unknown>>;
  tags?: Array<Record<string, unknown>>;
  stickies?: Array<Record<string, unknown>>;
  scheduledMessages?: Array<Record<string, unknown>>;
  tempChannels?: Array<Record<string, unknown>>;
}

interface UserDataResponse {
  cached: boolean;
  cachedAt: number;
  expiresAt: number;
  counts: Counts;
  data: {
    user: Record<string, unknown> | null;
    polls: PollRecord[];
    giveaways: GiveawayRecord[];
    events: { hosted: EventRecord[]; rsvps: RsvpRecord[] };
    forms: { created: FormRecord[]; submissions: SubmissionRecord[] };
    translations: TranslationRecord[];
    guilds: GuildRecord[];
  };
}

type Category =
  | 'account'
  | 'polls'
  | 'giveaways'
  | 'events'
  | 'rsvps'
  | 'forms'
  | 'submissions'
  | 'translations'
  | 'communities';

type FilterCategory = 'all' | Category;
type ChipTone = 'neutral' | 'orange' | 'red';

type ChipSpec = {
  label: string;
  tone?: ChipTone;
};

type DeleteTarget =
  | {
      type:
        | 'poll'
        | 'giveaway'
        | 'event'
        | 'rsvp'
        | 'form'
        | 'submission'
        | 'translation';
      id: string;
    }
  | { type: 'guild'; guildId: string };

interface ViewRecord {
  key: string;
  category: Category;
  title: string;
  meta?: string;
  chips?: ChipSpec[];
  guildId?: string;
  searchText: string;
  deleteTarget?: DeleteTarget;
}

type SelectedRecord = ViewRecord & { deleteTarget: DeleteTarget };

interface GuildOption {
  id: string;
  name: string;
}

const CONFIRM_PHRASE = 'DELETE EVERYTHING';
const PAGE_SIZE = 15;
const MAX_SELECTED_ITEMS = 100;

const CATEGORY_LABELS: Record<Category, string> = {
  account: 'Account',
  polls: 'Polls',
  giveaways: 'Giveaways',
  events: 'Events',
  rsvps: 'RSVPs',
  forms: 'Forms',
  submissions: 'Submissions',
  translations: 'Translations',
  communities: 'Communities',
};

const CATEGORY_ORDER: Category[] = [
  'account',
  'polls',
  'giveaways',
  'events',
  'rsvps',
  'forms',
  'submissions',
  'translations',
  'communities',
];

const GUILD_REFERENCE_FIELDS = [
  ['Joined member record', 'usersJoined'],
  ['Timezone', 'userTimezones'],
  ['Sticky role', 'stickyRoles'],
  ['Birthday blacklist', 'birthdayBlacklist'],
  ['Pending birthday removal', 'birthdayPendingRemovals'],
  ['Tag', 'tags'],
  ['Sticky message', 'stickies'],
  ['Scheduled message', 'scheduledMessages'],
  ['Temporary channel', 'tempChannels'],
] as const;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function scalarText(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function joinMeta(...values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).join(' · ');
}

function formatCacheTime(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRecordDate(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return '';
  const ms = value < 1_000_000_000_000 ? value * 1000 : value;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: ChipTone;
}) {
  const tones = {
    neutral: 'border-white/5 bg-white/[0.04] text-white/40',
    orange: 'border-orange/20 bg-orange/10 text-orange-warm',
    red: 'border-red-500/20 bg-red-500/10 text-red-300',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function RecordRow({
  record,
  selected,
  onToggle,
}: {
  record: ViewRecord;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-2.5 transition-colors ${
        selected ? 'bg-red-500/[0.025]' : ''
      }`}
    >
      {record.deleteTarget ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${record.title}`}
          className="mt-1 h-3.5 w-3.5 shrink-0 accent-orange"
        />
      ) : (
        <span className="mt-1 h-3.5 w-3.5 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/25">
            {CATEGORY_LABELS[record.category]}
          </span>
          <p
            className="line-clamp-2 min-w-0 flex-1 break-words text-sm leading-snug text-white/75"
            title={record.title}
          >
            {record.title}
          </p>
        </div>

        {record.chips && record.chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {record.chips.map((chip, index) => (
              <Chip key={`${chip.label}-${index}`} tone={chip.tone}>
                {chip.label}
              </Chip>
            ))}
          </div>
        )}

        {record.meta && (
          <p
            className="line-clamp-2 mt-1 break-all text-[11px] leading-snug text-white/25"
            title={record.meta}
          >
            {record.meta}
          </p>
        )}
      </div>
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2">
      <p className="text-base font-semibold leading-none text-white tabular-nums">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-wider text-white/25">{label}</p>
    </div>
  );
}

function RawJson({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/[0.04] bg-black/20 p-3 text-[11px] leading-relaxed text-white/45">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function RawJsonDetails({
  value,
  onDownload,
}: {
  value: unknown;
  onDownload: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="group mt-3 rounded-xl border border-white/[0.04] bg-white/[0.02]"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange [&::-webkit-details-marker]:hidden">
        <span className="flex-1 text-sm font-medium text-white/65">Raw JSON</span>
        <span className="text-[10px] text-white/25">Full payload</span>
        <svg
          className="h-3.5 w-3.5 shrink-0 text-white/25 transition-transform group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      {open && (
        <div className="border-t border-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <a className="text-[10px] text-white/25"></a>
            <button
              type="button"
              onClick={onDownload}
              className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white/75"
            >
              Download JSON
            </button>
          </div>
          <RawJson value={value} />
        </div>
      )}
    </details>
  );
}

function DataBrowser({
  records,
  guildOptions,
  selectionResetToken,
  onDeleteSelected,
}: {
  records: ViewRecord[];
  guildOptions: GuildOption[];
  selectionResetToken: number;
  onDeleteSelected: (records: SelectedRecord[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [guild, setGuild] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [records, query, category, guild, selectionResetToken]);

  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: records.length,
      account: 0,
      polls: 0,
      giveaways: 0,
      events: 0,
      rsvps: 0,
      forms: 0,
      submissions: 0,
      translations: 0,
      communities: 0,
    };

    for (const record of records) {
      counts[record.category] += 1;
    }

    return counts;
  }, [records]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return records.filter((record) => {
      if (category !== 'all' && record.category !== category) return false;
      if (guild !== 'all' && record.guildId !== guild) return false;
      if (needle && !record.searchText.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [records, query, category, guild]);

  const filteredDeletable = useMemo(
    () => filtered.filter((record): record is SelectedRecord => Boolean(record.deleteTarget)),
    [filtered],
  );
  const selectedRecords = useMemo(
    () =>
      records.filter(
        (record): record is SelectedRecord =>
          selectedKeys.has(record.key) && Boolean(record.deleteTarget),
      ),
    [records, selectedKeys],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visibleRecords = filtered.slice(start, start + PAGE_SIZE);
  const pageSelectable = visibleRecords.filter(
    (record): record is SelectedRecord => Boolean(record.deleteTarget),
  );
  const allPageSelected =
    pageSelectable.length > 0 &&
    pageSelectable.every((record) => selectedKeys.has(record.key));
  const hasFilters = query.trim() !== '' || category !== 'all' || guild !== 'all';

  function toggleRecord(key: string) {
    if (!selectedKeys.has(key) && selectedKeys.size >= MAX_SELECTED_ITEMS) {
      showErrorToast('Selection limit reached', {
        description: `You can delete up to ${MAX_SELECTED_ITEMS} records at once.`,
      });
      return;
    }

    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  }

  function togglePage() {
    const keys = pageSelectable.map((record) => record.key);
    const next = new Set(selectedKeys);

    if (keys.every((key) => next.has(key))) {
      for (const key of keys) next.delete(key);
      setSelectedKeys(next);
      return;
    }

    const missing = keys.filter((key) => !next.has(key));
    if (next.size + missing.length > MAX_SELECTED_ITEMS) {
      showErrorToast('Selection limit reached', {
        description: `You can delete up to ${MAX_SELECTED_ITEMS} records at once.`,
      });
      return;
    }

    for (const key of keys) next.add(key);
    setSelectedKeys(next);
  }

  function selectAllFiltered() {
    if (filteredDeletable.length > MAX_SELECTED_ITEMS) {
      showErrorToast('Too many records', {
        description: 'Filter the list further before selecting everything.',
      });
      return;
    }
    setSelectedKeys(new Set(filteredDeletable.map((record) => record.key)));
  }

  function clearFilters() {
    setQuery('');
    setCategory('all');
    setGuild('all');
    setPage(1);
  }

  return (
    <>
      <div className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/25">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search names, IDs, guilds, statuses…"
              aria-label="Search your data"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-white/5 bg-white/[0.04] py-2 pl-9 pr-9 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/25 transition-colors hover:bg-white/5 hover:text-white/60"
                aria-label="Clear search"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {guildOptions.length > 0 && (
            <div className="w-full sm:w-52">
              <CommunityFilterDropdown
                value={guild}
                onChange={(value) => {
                  setGuild(value);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All communities' },
                  ...guildOptions.map((option) => ({
                    value: option.id,
                    label: option.name,
                  })),
                ]}
                placeholder="All communities"
              />
            </div>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {(['all', ...CATEGORY_ORDER] as FilterCategory[])
            .filter((value) => value === 'all' || categoryCounts[value] > 0)
            .map((value) => {
              const active = category === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setCategory(value);
                    setPage(1);
                  }}
                  aria-pressed={active}
                  className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors ${
                    active
                      ? 'border-orange/30 bg-orange/10 text-orange-warm'
                      : 'border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white/65'
                  }`}
                >
                  {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
                  <span
                    className={`ml-1.5 rounded px-1 py-0.5 text-[9px] tabular-nums ${
                      active ? 'bg-orange/15 text-orange-warm' : 'bg-white/[0.04] text-white/30'
                    }`}
                  >
                    {categoryCounts[value]}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {selectedRecords.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-red-200/70">{selectedRecords.length} selected</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedKeys(new Set())}
              className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/75"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => onDeleteSelected(selectedRecords)}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20"
            >
              Delete selected
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.04] bg-black/10">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.04] px-3.5 py-2.5">
          {pageSelectable.length > 0 && (
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={togglePage}
                aria-label="Select all deletable records on this page"
                className="h-3.5 w-3.5 accent-orange"
              />
              <span className="text-[10px] text-white/30">Select page</span>
            </label>
          )}
          {filteredDeletable.length > pageSelectable.length &&
            filteredDeletable.length <= MAX_SELECTED_ITEMS && (
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-[10px] font-medium text-orange-warm/70 transition-colors hover:text-orange-warm"
              >
                Select all {filteredDeletable.length}
              </button>
            )}
          <p className="text-[11px] text-white/35">
            {filtered.length === 0
              ? 'No matching records'
              : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </p>
          <p className="ml-auto text-[10px] tabular-nums text-white/20">
            {filtered.length === 0 ? '0 results' : `${categoryCounts.all} total`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-white/40">No records match those filters.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/70"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="max-h-[26rem] divide-y divide-white/[0.04] overflow-y-auto scrollbar-thin">
              {visibleRecords.map((record) => (
                <RecordRow
                  key={record.key}
                  record={record}
                  selected={selectedKeys.has(record.key)}
                  onToggle={() => toggleRecord(record.key)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-white/[0.04] px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-[10px] tabular-nums text-white/30">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function DeleteDataModal({
  user,
  counts,
  onClose,
  onDeleted,
}: {
  user: FluxerUser;
  counts?: Counts;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = acknowledged;

  const currentCounts = counts
    ? [
        counts.pollsOwned > 0 ? `${counts.pollsOwned} owned poll${counts.pollsOwned === 1 ? '' : 's'}` : null,
        counts.giveawaysOwned > 0 ? `${counts.giveawaysOwned} owned giveaway${counts.giveawaysOwned === 1 ? '' : 's'}` : null,
        counts.eventsHosted > 0 ? `${counts.eventsHosted} hosted event${counts.eventsHosted === 1 ? '' : 's'}` : null,
        counts.formsCreated > 0 ? `${counts.formsCreated} created form${counts.formsCreated === 1 ? '' : 's'}` : null,
        counts.translations > 0 ? `${counts.translations} translation record${counts.translations === 1 ? '' : 's'}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  async function handleDelete() {
    if (!canDelete || busy) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/users/data', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: true,
          confirmation: CONFIRM_PHRASE,
          confirmUserId: user.id,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Could not delete your data.');
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-data-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/5 bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="delete-data-title" className="text-lg font-bold text-white">
                Delete everything?
              </h2>
              <p className="mt-0.5 text-xs text-white/30">
                This action is permanent and cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/5 hover:text-white/70 disabled:opacity-50"
              aria-label="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[70dvh] overflow-y-auto px-6 py-5">
          <div className="space-y-4">
              <p className="text-sm leading-relaxed text-white/60">
                This permanently deletes all Functious database and queue data
                connected to your user ID, including:
              </p>

              <ul className="grid gap-1.5 text-xs text-white/45 sm:grid-cols-2">
                <li>Polls you created and votes you cast</li>
                <li>Giveaways you created and entries you made</li>
                <li>Events you host and your RSVPs</li>
                <li>Forms you created and submissions you sent</li>
                <li>Translation credits, history, and notes</li>
                <li>Reminders, birthdays, timezones, tags, stickies, schedules, and temporary channels</li>
              </ul>

              {currentCounts && (
                <p className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-xs text-white/35">
                  Currently linked: {currentCounts}
                </p>
              )}


              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  disabled={busy}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-orange"
                />
                <span className="text-xs leading-relaxed text-white/55">
                  I understand that this deletes all database and queue data connected
                  to my user ID and that it cannot be undone.
                </span>
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2 text-xs leading-relaxed text-red-300/80"
                >
                  {error}
                </p>
              )}
            </div>
        </div>

        <div className="flex gap-3 border-t border-white/5 px-6 pb-6 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || busy}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Deleting…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteSelectedModal({
  records,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  records: SelectedRecord[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const countsByCategory = records.reduce<Record<string, number>>((counts, record) => {
    counts[record.category] = (counts[record.category] ?? 0) + 1;
    return counts;
  }, {});
  const preview = records.slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-selected-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/5 bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="delete-selected-title" className="text-lg font-bold text-white">
                Delete selected data?
              </h2>
              <p className="mt-0.5 text-xs text-white/30">
                This permanently removes the selected records and your relationship to them.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/5 hover:text-white/70 disabled:opacity-50"
              aria-label="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[70dvh] overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(countsByCategory).map(([category, count]) => (
                <Chip key={category} tone="red">
                  {count} {CATEGORY_LABELS[category as Category]}
                </Chip>
              ))}
            </div>

            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-white/[0.04] bg-white/[0.02] p-2">
              {preview.map((record) => (
                <div
                  key={record.key}
                  className="flex items-start gap-2 rounded-lg bg-white/[0.025] px-2.5 py-2"
                >
                  <span className="mt-0.5 shrink-0 text-[9px] font-medium uppercase tracking-wider text-white/25">
                    {CATEGORY_LABELS[record.category]}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-xs text-white/55"
                    title={record.title}
                  >
                    {record.title}
                  </span>
                </div>
              ))}
              {records.length > preview.length && (
                <p className="px-2.5 py-1 text-[10px] text-white/25">
                  +{records.length - preview.length} more selected records
                </p>
              )}
            </div>

            <ul className="space-y-1.5 text-xs leading-relaxed text-white/35">
              <li>
                Deleting a poll, giveaway, event, or form you own also removes its votes, entries, RSVPs, or submissions, and may remove its Functious messages.
              </li>
              <li>
                Your votes, entries, RSVPs, or reviews on other people&apos;s items are removed without deleting those items.
              </li>
              <li>
                Deleting a community record removes all your stored references in that community.
              </li>
              <li>Translation records lose your attribution and notes.</li>
            </ul>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2 text-xs leading-relaxed text-red-300/80"
              >
                {error}
              </p>
            )}

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                disabled={busy}
                className="mt-0.5 h-4 w-4 shrink-0 accent-orange"
              />
              <span className="text-xs leading-relaxed text-white/55">
                I understand that the selected data will be permanently deleted and this cannot be undone.
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/5 px-6 pb-6 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged || busy}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Deleting…' : `Delete ${records.length} selected`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataPrivacySection({ user }: { user: FluxerUser }) {
  const [data, setData] = useState<UserDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<SelectedRecord[] | null>(null);
  const [selectedDeleteError, setSelectedDeleteError] = useState<string | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectionResetToken, setSelectionResetToken] = useState(0);

  const guildNames = useMemo(() => {
    const names = new Map<string, string>();
    if (!data) return names;

    for (const guild of asArray<GuildRecord>(data.data.guilds)) {
      if (guild.id) names.set(guild.id, guild.name || guild.id);
    }

    return names;
  }, [data]);

  const records = useMemo<ViewRecord[]>(() => {
    if (!data) return [];

    const list: ViewRecord[] = [];
    const account = data.data.user;

    if (account) {
      const username = typeof account.username === 'string' ? account.username : '';
      const globalName = typeof account.global_name === 'string' ? account.global_name : '';
      const accountId = typeof account.id === 'string' ? account.id : user.id;
      const timezone = typeof account.timezone === 'string' ? account.timezone : '';
      const searchParts = Object.entries(account).map(
        ([key, value]) => `${key} ${scalarText(value)}`,
      );

      list.push({
        key: 'account',
        category: 'account',
        title: globalName || (username ? `@${username}` : 'Account record'),
        meta: joinMeta(accountId, timezone),
        searchText: [globalName, username, accountId, timezone, ...searchParts].join(' '),
      });
    }

    asArray<PollRecord>(data.data.polls).forEach((poll, index) => {
      const guildId = poll.serverId;
      const guildName = guildId ? guildNames.get(guildId) ?? guildId : '';
      const chips: ChipSpec[] = [];

      if (poll.relationship?.owned) chips.push({ label: 'Owned', tone: 'orange' });
      if (poll.relationship?.voted) chips.push({ label: 'Voted' });
      if (poll.ended) chips.push({ label: 'Ended' });

      list.push({
        key: `poll:${poll._id ?? poll.messageId ?? index}`,
        category: 'polls',
        title: poll.desc || poll.question || 'Untitled poll',
        meta: joinMeta(guildName, poll.messageId),
        guildId,
        deleteTarget: poll._id ? { type: 'poll', id: String(poll._id) } : undefined,
        chips,
        searchText: [
          poll.desc,
          poll.question,
          poll.serverId,
          poll.channelId,
          poll.messageId,
          poll._id,
          guildName,
        ]
          .filter(Boolean)
          .join(' '),
      });
    });

    asArray<GiveawayRecord>(data.data.giveaways).forEach((giveaway, index) => {
      const guildId = giveaway.serverId;
      const guildName = guildId ? guildNames.get(guildId) ?? guildId : '';
      const chips: ChipSpec[] = [];

      if (giveaway.relationship?.owned) chips.push({ label: 'Owned', tone: 'orange' });
      if (giveaway.relationship?.entered) chips.push({ label: 'Entered' });
      if (giveaway.relationship?.picking) chips.push({ label: 'Winner selection' });
      if (giveaway.relationship?.won) chips.push({ label: 'Won', tone: 'orange' });
      if (giveaway.ended) chips.push({ label: 'Ended' });

      list.push({
        key: `giveaway:${giveaway._id ?? giveaway.messageId ?? index}`,
        category: 'giveaways',
        title: giveaway.prize || 'Untitled giveaway',
        meta: joinMeta(guildName, giveaway.messageId),
        guildId,
        deleteTarget: giveaway._id
          ? { type: 'giveaway', id: String(giveaway._id) }
          : undefined,
        chips,
        searchText: [
          giveaway.prize,
          giveaway.serverId,
          giveaway.channelId,
          giveaway.messageId,
          giveaway._id,
          guildName,
        ]
          .filter(Boolean)
          .join(' '),
      });
    });

    asArray<EventRecord>(data.data.events.hosted).forEach((event, index) => {
      const guildName = event.guildId ? guildNames.get(event.guildId) ?? event.guildId : '';
      const when = formatRecordDate(event.startAt);
      const chips: ChipSpec[] = [];

      if (event.status) chips.push({ label: event.status });
      if (when) chips.push({ label: when });

      list.push({
        key: `event:${event._id ?? event.messageId ?? index}`,
        category: 'events',
        title: event.title || 'Untitled event',
        meta: joinMeta(guildName, event.messageId),
        guildId: event.guildId,
        deleteTarget: event._id
          ? { type: 'event', id: String(event._id) }
          : undefined,
        chips,
        searchText: [event.title, event.status, event.guildId, event.messageId, guildName, when]
          .filter(Boolean)
          .join(' '),
      });
    });

    asArray<RsvpRecord>(data.data.events.rsvps).forEach((rsvp, index) => {
      const event = rsvp.event;
      const guildName = rsvp.guildId ? guildNames.get(rsvp.guildId) ?? rsvp.guildId : '';
      const when = formatRecordDate(event?.startAt);
      const chips: ChipSpec[] = [];

      if (rsvp.response) chips.push({ label: rsvp.response });
      if (rsvp.waitlisted) chips.push({ label: 'Waitlisted', tone: 'orange' });
      if (when) chips.push({ label: when });

      list.push({
        key: `rsvp:${rsvp._id ?? `${rsvp.eventId}-${index}`}`,
        category: 'rsvps',
        title: event?.title || 'Event RSVP',
        meta: joinMeta(guildName, rsvp.eventId),
        guildId: rsvp.guildId,
        deleteTarget: rsvp._id ? { type: 'rsvp', id: String(rsvp._id) } : undefined,
        chips,
        searchText: [
          event?.title,
          event?.status,
          event?.guildId,
          rsvp.guildId,
          rsvp.eventId,
          rsvp.response,
          when,
        ]
          .filter(Boolean)
          .join(' '),
      });
    });

    asArray<FormRecord>(data.data.forms.created).forEach((form, index) => {
      const guildName = form.guildId ? guildNames.get(form.guildId) ?? form.guildId : '';
      const chips: ChipSpec[] = [];

      if (form.status) chips.push({ label: form.status });

      list.push({
        key: `form:${form._id ?? index}`,
        category: 'forms',
        title: form.name || 'Untitled form',
        meta: joinMeta(guildName, form._id),
        guildId: form.guildId,
        deleteTarget: form._id ? { type: 'form', id: String(form._id) } : undefined,
        chips,
        searchText: [form.name, form.status, form.guildId, form._id, guildName]
          .filter(Boolean)
          .join(' '),
      });
    });

    asArray<SubmissionRecord>(data.data.forms.submissions).forEach((submission, index) => {
      const guildName = submission.guildId
        ? guildNames.get(submission.guildId) ?? submission.guildId
        : '';
      const submittedAt = formatRecordDate(submission.submittedAt);
      const chips: ChipSpec[] = [];

      if (submission.status) chips.push({ label: submission.status });
      if (submission.relationship?.submitted) chips.push({ label: 'Submitted', tone: 'orange' });
      if (submission.relationship?.reviewed) chips.push({ label: 'Reviewed' });
      if (submittedAt) chips.push({ label: submittedAt });

      list.push({
        key: `submission:${submission._id ?? index}`,
        category: 'submissions',
        title: submission.form?.name || submission.formId || 'Form submission',
        meta: joinMeta(guildName, submission._id),
        guildId: submission.guildId,
        deleteTarget: submission._id
          ? { type: 'submission', id: String(submission._id) }
          : undefined,
        chips,
        searchText: [
          submission.form?.name,
          submission.formId,
          submission.status,
          submission.guildId,
          submission._id,
          guildName,
          submittedAt,
        ]
          .filter(Boolean)
          .join(' '),
      });
    });

    asArray<TranslationRecord>(data.data.translations).forEach((translation, index) => {
      const chips: ChipSpec[] = [];

      if (translation.status) chips.push({ label: translation.status });

      list.push({
        key: `translation:${translation.language ?? 'language'}-${translation.key ?? index}`,
        category: 'translations',
        title:
          translation.language && translation.key
            ? `${translation.language} · ${translation.key}`
            : translation.key || 'Translation',
        meta: translation.value,
        deleteTarget: translation._id
          ? { type: 'translation', id: String(translation._id) }
          : undefined,
        chips,
        searchText: [
          translation.language,
          translation.key,
          translation.value,
          translation.status,
        ]
          .filter(Boolean)
          .join(' '),
      });
    });

    asArray<GuildRecord>(data.data.guilds).forEach((guild, index) => {
      const referenceChips: ChipSpec[] = [];

      for (const [label, key] of GUILD_REFERENCE_FIELDS) {
        const count = asArray(guild[key]).length;
        if (count > 0) referenceChips.push({ label: `${label} ${count}` });
      }

      const chips = referenceChips.slice(0, 4);
      if (referenceChips.length > 4) {
        chips.push({ label: `+${referenceChips.length - 4} more` });
      }
      if (chips.length === 0) {
        chips.push({ label: 'No references' });
      }

      list.push({
        key: `community:${guild.id ?? index}`,
        category: 'communities',
        title: guild.name || guild.id || 'Unknown community',
        meta: guild.id,
        guildId: guild.id,
        deleteTarget: guild.id ? { type: 'guild', guildId: guild.id } : undefined,
        chips,
        searchText: [
          guild.name,
          guild.id,
          ...GUILD_REFERENCE_FIELDS.map(
            ([label, key]) => `${label} ${asArray(guild[key]).length}`,
          ),
        ]
          .filter(Boolean)
          .join(' '),
      });
    });

    return list;
  }, [data, guildNames, user.id]);

  const guildOptions = useMemo<GuildOption[]>(() => {
    const options = new Map<string, string>();

    for (const record of records) {
      if (!record.guildId) continue;
      options.set(record.guildId, guildNames.get(record.guildId) ?? record.guildId);
    }

    return [...options.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records, guildNames]);

  async function loadData() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/users/data', {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Could not load your data.');
      }
      setData(payload as UserDataResponse);
    } catch (err) {
      showErrorToast('Could not load your data', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleDeleted() {
    setShowDelete(false);
    setData(null);
    setDeleted(true);
    showToast('Your data has been deleted', {
      description: 'All database and queue data connected to your user ID has been removed.',
    });
  }

  async function deleteSelected() {
    if (!selectedToDelete || deletingSelected) return;

    const recordsToDelete = selectedToDelete;
    setDeletingSelected(true);
    setSelectedDeleteError(null);

    try {
      const res = await fetch('/api/users/data', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: true,
          confirmation: 'DELETE SELECTED',
          confirmUserId: user.id,
          items: recordsToDelete.map((record) => record.deleteTarget),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Could not delete the selected data.');
      }

      const changedKeys = [
        'pollsOwned',
        'pollVotesRemoved',
        'giveawaysOwned',
        'giveawayEntriesRemoved',
        'eventsHosted',
        'eventRsvpsRemoved',
        'formsCreated',
        'formSubmissionsRemoved',
        'formReviewsAnonymized',
        'translationsTouched',
        'guildsUpdated',
      ];
      const changed = changedKeys.some((key) => Number(payload?.[key]) > 0);

      setSelectedToDelete(null);
      setSelectionResetToken((value) => value + 1);
      if (changed) {
        showToast('Selected data deleted', {
          description: 'Only the selected records and your relationship to them were removed.',
        });
      } else {
        showToast('No matching data found', {
          description: 'The selected records may already have been removed. Refreshing the list.',
        });
      }
      await loadData();
    } catch (err) {
      setSelectedDeleteError(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setDeletingSelected(false);
    }
  }

  function downloadJson() {
    if (!data) return;

    const blob = new Blob([JSON.stringify({ counts: data.counts, data: data.data }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `functious-data-${user.id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (deleted) {
    return (
      <section className="rounded-2xl border border-emerald-500/15 bg-bg-card p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Data &amp; privacy
        </h2>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-3.5 py-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <svg className="h-3.5 w-3.5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-200/85">Your data has been deleted</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/35">
              All database and queue data connected to your user ID has been removed.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const counts = data?.counts;

  return (
    <section className="rounded-2xl border border-white/[0.04] bg-bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Data &amp; privacy
          </h2>
          <p className="mt-0.5 text-[11px] text-white/25">
            See everything stored against your user ID in the bot&apos;s database and queues, or permanently remove it.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white/90 disabled:opacity-50"
          >
            {loading ? 'Loading…' : data ? 'Check again' : 'View my data'}
          </button>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="rounded-xl border border-red-500/15 bg-red-500/[0.06] px-3.5 py-2 text-xs font-medium text-red-300/80 transition-colors hover:bg-red-500/15 hover:text-red-200"
          >
            Delete everything
          </button>
        </div>
      </div>

      {data && (
        <>
          {counts && (
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              <CountCard label="Polls owned" value={counts.pollsOwned} />
              <CountCard label="Polls voted" value={counts.pollsVoted} />
              <CountCard label="Giveaways owned" value={counts.giveawaysOwned} />
              <CountCard label="Giveaways entered" value={counts.giveawaysEntered} />
              <CountCard label="Events hosted" value={counts.eventsHosted} />
              <CountCard label="Event RSVPs" value={counts.eventRsvps} />
              <CountCard label="Forms created" value={counts.formsCreated} />
              <CountCard label="Form submissions" value={counts.formSubmissions} />
              <CountCard label="Translations" value={counts.translations} />
              <CountCard label="Communities" value={counts.guildReferences} />
            </div>
          )}

          <DataBrowser
            records={records}
            guildOptions={guildOptions}
            selectionResetToken={selectionResetToken}
            onDeleteSelected={(selected) => {
              setSelectedDeleteError(null);
              setSelectedToDelete(selected);
            }}
          />

          <RawJsonDetails value={data.data} onDownload={downloadJson} />
        </>
      )}

      {showDelete && (
        <DeleteDataModal
          user={user}
          counts={counts}
          onClose={() => setShowDelete(false)}
          onDeleted={handleDeleted}
        />
      )}

      {selectedToDelete && (
        <DeleteSelectedModal
          records={selectedToDelete}
          busy={deletingSelected}
          error={selectedDeleteError}
          onClose={() => {
            if (deletingSelected) return;
            setSelectedToDelete(null);
            setSelectedDeleteError(null);
          }}
          onConfirm={deleteSelected}
        />
      )}
    </section>
  );
}
