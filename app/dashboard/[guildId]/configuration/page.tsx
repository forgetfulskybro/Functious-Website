import { getSession, getSessionGuilds } from '@/lib/auth';
import { filterBotGuilds, emptyGuildData } from '@/lib/api';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ConfigurationClient from './ConfigurationClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ guildId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Configuration' };
}

export default async function ConfigurationPage({ params }: Props) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const guilds = await getSessionGuilds(session.accessToken);
  const botGuildIds = await filterBotGuilds(guilds.map(g => g.id));
  const botGuildSet = new Set(botGuildIds);

  const dashboardGuilds = guilds
    .filter(g => { const p = BigInt(g.permissions); return g.owner || (p & 0x20n) === 0x20n || (p & 0x8n) === 0x8n; })
    .map(g => ({ ...g, botPresent: botGuildSet.has(g.id) }));

  const userGuild = dashboardGuilds.find(g => g.id === guildId);
  if (!userGuild) notFound();

  return <ConfigurationClient user={session.user} guilds={dashboardGuilds} activeGuildId={guildId} userGuild={userGuild} initialData={emptyGuildData(guildId) as any} />;
}
