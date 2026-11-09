'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type {
  DashboardGuild,
  FluxerGuild,
  FluxerUser,
  GuildChannel,
  GuildData,
  GuildEvent,
  GuildEventDetail,
  GuildRole,
} from '@/lib/types';
import { useGuildData } from '@/hooks/useGuildData';
import { useDashboardToasts } from '@/hooks/useDashboardToasts';
import { useChannelProfiles } from '@/hooks/useChannelProfiles';
import Sidebar from '@/components/layout/Sidebar';
import ChannelBadge from '@/components/ui/ChannelBadge';
import ItemActions from '@/components/ui/ItemActions';
import { RowSkeleton } from '@/components/ui/Skeletons';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import {
  DeleteEventModal,
  EventDetailsModal,
  EventModal,
  type EventPayload,
} from './Modals';

type EventFilter = 'upcoming' | 'past' | 'all';

const FILTERS: { value: EventFilter; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'border-orange/20 bg-orange/10 text-orange-warm',
  live: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  ended: 'border-white/10 bg-white/[0.04] text-white/40',
  cancelled: 'border-red-500/15 bg-red-500/[0.06] text-red-300/80',
};

function eventKey(event: GuildEvent): string {
  return event.messageId || event.id;
}

function formatEventDate(timestamp: number | null, timezone?: string | null) {
  if (!timestamp) return 'No date';
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone || undefined,
    });
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

function statusLabel(status: string | null) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}

export default function EventsClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? ([] as GuildChannel[]);
  const guildRoles = (data as any).guildRoles ?? ([] as GuildRole[]);

  const [filter, setFilter] = useState<EventFilter>('upcoming');
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<'create' | GuildEvent | null>(null);
  const [detail, setDetail] = useState<GuildEventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuildEvent | null>(null);

  useDashboardToasts(loading, error);

  const loadEvents = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/events?filter=${filter}`,
        { credentials: 'include' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load events');
      setEvents(Array.isArray(json.events) ? json.events : []);
    } catch (err) {
      showErrorToast('Failed to load events', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
      setEvents([]);
    } finally {
      setListLoading(false);
    }
  }, [activeGuildId, filter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const channelProfiles = useChannelProfiles(
    events.map((event) => event.channelId).filter((id): id is string => !!id),
    guildChannels,
  );

  const editing = modal && modal !== 'create' ? modal : null;
  const liveDeleteTarget = deleteTarget
    ? events.find((event) => event.id === deleteTarget.id) ?? deleteTarget
    : null;

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  const channelOptions = useMemo(
    () =>
      (guildChannels as any[])
        .filter((channel) => channel.type === 0)
        .map((channel) => ({
          id: String(channel.id),
          name: String(channel.name),
          type: Number(channel.type ?? 0),
          parentId: channel.parentId ? String(channel.parentId) : null,
        })),
    [guildChannels],
  );

  async function createEvent(payload: EventPayload) {
    setBusy(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/events`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to create event');
      setModal(null);
      showToast('Event created', {
        description: payload.postAt
          ? 'The event will be posted in the selected channel at the scheduled time.'
          : 'The event has been posted in the selected channel.',
      });
      await loadEvents();
    } catch (err) {
      showErrorToast('Failed to create event', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function updateEvent(event: GuildEvent, payload: EventPayload) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/events/${encodeURIComponent(eventKey(event))}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update event');
      setModal(null);
      showToast('Event updated', {
        description: 'The event message and details have been updated.',
      });
      await loadEvents();
    } catch (err) {
      showErrorToast('Failed to update event', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function cancelEvent(event: GuildEvent) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/events/${encodeURIComponent(eventKey(event))}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to cancel event');
      setDetail(null);
      showToast('Event cancelled');
      await loadEvents();
    } catch (err) {
      showErrorToast('Failed to cancel event', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeEvent(event: GuildEvent) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/events/${encodeURIComponent(eventKey(event))}`,
        { method: 'DELETE', credentials: 'include' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to delete event');
      setDeleteTarget(null);
      setDetail(null);
      showToast('Event deleted');
      await loadEvents();
    } catch (err) {
      showErrorToast('Failed to delete event', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function openDetail(event: GuildEvent) {
    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/events/${encodeURIComponent(eventKey(event))}`,
        { credentials: 'include' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load event');
      setDetail(json);
    } catch (err) {
      showErrorToast('Failed to load event', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg-dark">
      <Sidebar
        user={user}
        guilds={guilds}
        activeGuildId={activeGuildId}
        currentPage="dashboard"
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-8 flex items-center gap-4 border-b border-white/5 pb-5">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={userGuild.name ?? ''}
              width={40}
              height={40}
              className="rounded-xl"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/15 font-bold text-orange-warm">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Events</h1>
            <p className="mt-0.5 text-xs text-white/40">{userGuild.name}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-orange/10 bg-orange/[0.04] px-4 py-3 text-xs leading-relaxed text-white/50">
          Events post an RSVP message in a text channel. Members react to attend,
          and the dashboard can create, edit, cancel or delete events. Recurring
          events use the selected timezone.
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
                Community Events
              </h2>
              <p className="mt-0.5 text-[10px] text-white/20">
                {events.length} event{events.length !== 1 ? 's' : ''} in this view
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-white/[0.04] p-0.5">
                {FILTERS.map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => setFilter(entry.value)}
                    className={[
                      'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                      filter === entry.value
                        ? 'bg-orange/15 text-orange-warm'
                        : 'text-white/35 hover:text-white/65',
                    ].join(' ')}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={() => setModal('create')}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-orange/10 px-3 py-1.5 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/20 disabled:opacity-50"
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  New Event
                </button>
              )}
            </div>
          </div>

          {loading || listLoading ? (
            <ul className="space-y-2">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </ul>
          ) : events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/30">No events in this view.</p>
              <p className="mt-1 text-xs text-white/20">
                Create an event to start collecting RSVPs.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => {
                const counts = event.rsvpCounts;
                return (
                  <li
                    key={event.id}
                    className="group flex flex-col gap-3 rounded-xl bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-white/85">
                          {event.title || 'Untitled event'}
                        </p>
                        <span
                          className={[
                            'rounded-full border px-2 py-0.5 text-[10px]',
                            STATUS_STYLES[event.status ?? ''] ??
                              'border-white/10 bg-white/[0.03] text-white/35',
                          ].join(' ')}
                        >
                          {statusLabel(event.status)}
                        </span>
                        {event.postAt && !event.postedAt && (
                          <span className="rounded-full bg-orange/10 px-2 py-0.5 text-[10px] text-orange-warm/80">
                            Post scheduled
                          </span>
                        )}
                        {event.recurrence && (
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35">
                            {event.recurrence.frequency}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-white/35">
                        {formatEventDate(event.startAt, event.timezone)}
                        {event.endAt
                          ? ` – ${formatEventDate(event.endAt, event.timezone)}`
                          : ''}
                        {event.postAt && !event.postedAt
                          ? ` · posts ${formatEventDate(event.postAt, event.timezone)}`
                          : ''}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/30">
                        {event.channelId && (
                          <ChannelBadge
                            channelId={event.channelId}
                            profile={channelProfiles[event.channelId]}
                            inline
                            showId={false}
                          />
                        )}
                        {counts && (
                          <>
                            <span className="text-white/15">·</span>
                            <span>{counts.going} going</span>
                            <span className="text-white/15">·</span>
                            <span>{counts.maybe} maybe</span>
                            {counts.waitlist > 0 && (
                              <>
                                <span className="text-white/15">·</span>
                                <span>{counts.waitlist} waitlisted</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <ItemActions
                      label="Event actions"
                      className="self-end sm:self-center"
                      actions={[
                        {
                          label: 'View event',
                          icon: 'view',
                          onSelect: () => openDetail(event),
                        },
                        {
                          label: 'Edit event',
                          icon: 'edit',
                          disabled: busy || detailLoading,
                          onSelect: () => setModal(event),
                        },
                        ...(event.status === 'scheduled' || event.status === 'live'
                          ? [
                              {
                                label: 'Cancel event',
                                icon: 'cancel' as const,
                                disabled: busy,
                                onSelect: () => cancelEvent(event),
                              },
                            ]
                          : []),
                        {
                          label: 'Delete event',
                          icon: 'delete',
                          danger: true,
                          disabled: busy,
                          onSelect: () => setDeleteTarget(event),
                        },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {modal && (
        <EventModal
          initial={editing ?? undefined}
          channels={channelOptions}
          roles={(guildRoles as any[]).map((role) => ({
            id: String(role.id),
            name: String(role.name),
            color: Number(role.color ?? 0),
          }))}
          busy={busy}
          onSave={(payload) =>
            editing ? updateEvent(editing, payload) : createEvent(payload)
          }
          onClose={() => setModal(null)}
        />
      )}

      {detail && (
        <EventDetailsModal
          detail={detail}
          busy={busy}
          channels={channelOptions}
          roles={(guildRoles as any[]).map((role) => ({
            id: String(role.id),
            name: String(role.name),
            color: Number(role.color ?? 0),
          }))}
          onClose={() => setDetail(null)}
          onCancel={() => cancelEvent(detail.event)}
          onEdit={() => {
            const target = events.find((event) => event.id === detail.event.id);
            setDetail(null);
            setModal(target ?? detail.event);
          }}
        />
      )}

      {liveDeleteTarget && (
        <DeleteEventModal
          event={liveDeleteTarget}
          busy={busy}
          onConfirm={() => removeEvent(liveDeleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
