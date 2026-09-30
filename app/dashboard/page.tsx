import type { Metadata } from 'next';
import { getSession, getSessionGuilds, canManageGuild } from '@/lib/auth';
import { filterBotGuilds } from '@/lib/api';
import { redirect } from 'next/navigation';
import DashboardHome from './DashboardHome';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Pick a community to configure Functious.',
};

export default async function DashboardPage() {
  let session = await getSession();
  if (!session) redirect('/login');

  const guilds = await getSessionGuilds(session.accessToken);
  const botGuildIds = await filterBotGuilds(guilds.map(g => g.id));
  const botGuildSet = new Set(botGuildIds);

  const dashboardGuilds = guilds
    .filter(g => canManageGuild(g, String(session.user.id)))
    .map(g => ({
      ...g,
      botPresent: botGuildSet.has(g.id),
    }));

  return <DashboardHome user={session.user} guilds={dashboardGuilds} currentPage="dashboard" />;
}
