import { getSession, getSessionGuilds } from '@/lib/auth';
import { getBotGuild, filterBotGuilds } from '@/lib/api';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import RolesClient from './RolesClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ guildId: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guildId } = await params;
  const guild = await getBotGuild(guildId).catch(() => null);
  return { title: guild?.name ? `${guild.name} — Roles & Permissions` : 'Roles & Permissions' };
}
export default async function RolesPage({ params }: Props) {
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
  const guildData = await getBotGuild(guildId).catch(() => null);
  if (!guildData) notFound();

  return <RolesClient user={session.user} guilds={dashboardGuilds} activeGuildId={guildId} userGuild={userGuild} initialData={guildData} guildRoles={guildData.guildRoles ?? []} />;
}
