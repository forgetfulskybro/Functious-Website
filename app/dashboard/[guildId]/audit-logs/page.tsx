import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession, getSessionGuilds } from '@/lib/auth';
import { filterBotGuilds } from '@/lib/api';
import { vanta } from '@/lib/vanta';
import { filter, and, timeRange } from '@vanta-dev/node';
import AuditLogsPage from './AuditLogsClient';

export const metadata: Metadata = {
  title: 'Audit Logs',
  description: 'Guild setting changes and configuration history.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export type AuditLogEvent = {
  id: string;
  type: string;
  userId: string | null;
  groupId: string | null;
  timestamp: string;
  data: Record<string, unknown>;
  source?: string | null;
};

function unwrapEvents(res: unknown): any[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.events)) return o.events;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.results)) return o.results;
    if (Array.isArray(o.items)) return o.items;
  }
  return [];
}

function normalizeEvent(raw: any): AuditLogEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? raw.eventId ?? raw._id ?? '');
  const type = String(raw.type ?? raw.event ?? '');
  if (!type) return null;

  const ts =
    raw.timestamp ??
    raw.createdAt ??
    raw.time ??
    raw.receivedAt ??
    null;

  let data: Record<string, unknown> = {};
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    data = raw.data as Record<string, unknown>;
  }

  return {
    id: id || `${type}-${ts ?? Math.random()}`,
    type,
    userId: raw.userId != null ? String(raw.userId) : null,
    groupId: raw.groupId != null ? String(raw.groupId) : null,
    timestamp: ts
      ? typeof ts === 'number'
        ? new Date(ts > 1e12 ? ts : ts * 1000).toISOString()
        : String(ts)
      : new Date().toISOString(),
    data,
    source: raw.source != null ? String(raw.source) : null,
  };
}

async function loadAuditLogs(guildId: string): Promise<AuditLogEvent[]> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    const res = await (vanta as any).queryEvents({
      filters: and(
        filter('type', 'equals', 'setting.updated'),
        filter('groupId', 'equals', guildId)
      ),
      time: timeRange(start.toISOString(), end.toISOString()),
      sort: [{ field: 'timestamp', direction: 'desc' }],
      pagination: { limit: 100 },
    });

    return unwrapEvents(res)
      .map(normalizeEvent)
      .filter(Boolean) as AuditLogEvent[];
  } catch (err) {
    console.error('loadAuditLogs failed', err);
    return [];
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { guildId } = await params;

  const guilds = await getSessionGuilds(session.accessToken);
  const botGuildIds = await filterBotGuilds(guilds.map((g) => g.id));
  const botGuildSet = new Set(botGuildIds);

  const dashboardGuilds = guilds
    .filter((g) => {
      const userPermissions = BigInt(g.permissions);
      const MANAGE_GUILD = 1n << 5n;
      const ADMINISTRATOR = 1n << 3n;
      if (g.owner_id === session.user.id) {
        g.owner = true;
        return true;
      }
      return (
        (userPermissions & MANAGE_GUILD) === MANAGE_GUILD ||
        (userPermissions & ADMINISTRATOR) === ADMINISTRATOR
      );
    })
    .map((g) => ({
      ...g,
      botPresent: botGuildSet.has(g.id),
    }));

  const events = await loadAuditLogs(guildId);

  return (
    <AuditLogsPage
      user={session.user}
      guilds={dashboardGuilds}
      activeGuildId={guildId}
      events={events}
    />
  );
}