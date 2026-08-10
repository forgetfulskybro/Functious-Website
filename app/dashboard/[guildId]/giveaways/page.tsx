import { filterBotGuilds, emptyGuildData } from '@/lib/api';
import { getSession, getSessionGuilds } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import GiveawaysClient from './GiveawaysClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ guildId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Giveaways' };
}

export default async function GiveawaysPage({ params }: Props) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const guilds = await getSessionGuilds(session.accessToken);
  const botGuildIds = await filterBotGuilds(guilds.map(g => g.id));
  const botGuildSet = new Set(botGuildIds);

  const dashboardGuilds = guilds
    .filter(g => {
      const p = BigInt(g.permissions);
      return g.owner || (p & 0x20n) === 0x20n || (p & 0x8n) === 0x8n;
    })
    .map(g => ({ ...g, botPresent: botGuildSet.has(g.id) }));

  const userGuild = dashboardGuilds.find(g => g.id === guildId);
  if (!userGuild) notFound();

  const empty = emptyGuildData(guildId);

  return (
    <GiveawaysClient
      user={session.user}
      guilds={dashboardGuilds}
      activeGuildId={guildId}
      userGuild={userGuild}
      initialData={empty as any}
      guildRoles={[]}
      guildChannels={[]}
    />
  );
}