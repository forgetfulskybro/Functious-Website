import type { Metadata } from 'next';
import { getSession, getSessionGuilds } from '@/lib/auth';
import { filterBotGuilds } from '@/lib/api';
import { redirect } from 'next/navigation';
import ProfilePage from './ProfilePage';
import { vanta } from '@/lib/vanta';
import { timeRange, filter, and } from '@vanta-dev/node';
import { COMMANDS } from '@/data/commands';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your Functious profile settings.',
};

type CommandStat = { name: string; count: number };

function buildAliasLookup(): Map<string, string> {
  const map = new Map<string, string>();
  for (const cmd of COMMANDS) {
    const canonical = cmd.name.toLowerCase();
    map.set(canonical, canonical);
    for (const alias of cmd.aliases) {
      map.set(alias.toLowerCase(), canonical);
    }
  }
  return map;
}

const ALIAS_TO_CANONICAL = buildAliasLookup();

function resolveCommandName(raw: string): string {
  const key = raw.replace(/^\//, '').trim().toLowerCase();
  return ALIAS_TO_CANONICAL.get(key) ?? key;
}

async function loadCommandUsage(userId: string): Promise<{
  commands: CommandStat[];
  total: number;
}> {
  const empty = { commands: [] as CommandStat[], total: 0 };

  try {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    const result = await vanta.groupBy({
      groupBy: ['command'],
      filters: and(
        filter('type', 'equals', 'command.used'),
        filter('userId', 'equals', userId)
      ),
      time: timeRange(start.toISOString(), end.toISOString()),
    });

    const groups: any[] = Array.isArray(result?.groups)
      ? result.groups
      : Array.isArray(result)
        ? result
        : [];

    if (groups.length === 0) return empty;

    const counts = new Map<string, number>();
    for (const g of groups) {
      const raw = String(g.value ?? g.command ?? g.name ?? '').trim();
      if (!raw) continue;
      const name = resolveCommandName(raw);
      const n = Math.max(0, Math.round(Number(g.count ?? 0) || 0));
      if (n <= 0) continue;
      counts.set(name, (counts.get(name) ?? 0) + n);
    }

    const commands = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      commands,
      total: commands.reduce((s, c) => s + c.count, 0),
    };
  } catch (err) {
    console.error('loadCommandUsage failed', err);
    return empty;
  }
}

export default async function Profile() {
  const session = await getSession();
  if (!session) redirect('/login');

  const guilds = await getSessionGuilds(session.accessToken);
  const botGuildIds = await filterBotGuilds(guilds.map((g) => g.id));
  const botGuildSet = new Set(botGuildIds);

  const allGuilds = guilds.map((g) => ({
    ...g,
    botPresent: botGuildSet.has(g.id),
  }));

  const { commands, total: commandsTotal } = await loadCommandUsage(
    String(session.user.id)
  );

  return (
    <ProfilePage
      user={session.user}
      guilds={allGuilds}
      currentPage="profile"
      commands={commands}
      commandsTotal={commandsTotal}
    />
  );
}