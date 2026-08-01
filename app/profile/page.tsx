import type { Metadata } from 'next';
import { getSession, getSessionGuilds } from '@/lib/auth';
import { filterBotGuilds } from '@/lib/api';
import { redirect } from 'next/navigation';
import ProfilePage from './ProfilePage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your Functious profile settings.',
};

export default async function Profile() {
  const session = await getSession();
  if (!session) redirect('/login');

  const guilds = await getSessionGuilds(session.accessToken);
  const botGuildIds = await filterBotGuilds(guilds.map(g => g.id));
  const botGuildSet = new Set(botGuildIds);

  const dashboardGuilds = guilds
    .filter(g => {
      const userPermissions = BigInt(g.permissions);
      const MANAGE_GUILD = 1n << 5n;
      const ADMINISTRATOR = 1n << 3n;

      if (g.owner_id === session.user.id) {
        g.owner = true;
        return true;
      };
      return (userPermissions & MANAGE_GUILD) === MANAGE_GUILD || (userPermissions & ADMINISTRATOR) === ADMINISTRATOR;
    })
    .map(g => ({
      ...g,
      botPresent: botGuildSet.has(g.id),
    }));

  return <ProfilePage user={session.user} guilds={dashboardGuilds} currentPage="profile" />;
}