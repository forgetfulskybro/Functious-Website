import { filterBotGuilds, emptyGuildData } from '@/lib/api';
import { getSession, getSessionGuilds, canManageGuild } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import FormsClient from './FormsClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ guildId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Forms' };
}

export default async function FormsPage({ params }: Props) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const guilds = await getSessionGuilds(session.accessToken);
  const botGuildIds = await filterBotGuilds(guilds.map((guild) => guild.id));
  const botGuildSet = new Set(botGuildIds);

  const dashboardGuilds = guilds
    .filter((guild) => canManageGuild(guild, String(session.user.id)))
    .map((guild) => ({ ...guild, botPresent: botGuildSet.has(guild.id) }));

  const userGuild = dashboardGuilds.find((guild) => guild.id === guildId);
  if (!userGuild) notFound();

  return (
    <FormsClient
      user={session.user}
      guilds={dashboardGuilds}
      activeGuildId={guildId}
      userGuild={userGuild}
      initialData={emptyGuildData(guildId) as any}
    />
  );
}
