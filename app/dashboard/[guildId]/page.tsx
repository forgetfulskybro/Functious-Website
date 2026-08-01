import type { Metadata } from 'next';
import { getSession, getSessionGuilds } from '@/lib/auth';
import { getBotGuild, filterBotGuilds } from '@/lib/api';
import { redirect, notFound } from 'next/navigation';
import GuildDashboard from './GuildDashboard';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ guildId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guildId } = await params;
  const guild = await getBotGuild(guildId).catch(() => null);
  return {
    title: guild?.name ? `${guild.name} — Dashboard` : 'Server Dashboard',
  };
}

export default async function GuildPage({ params }: Props) {
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

  const guildData = await getBotGuild(guildId).catch(() => null);

  if (!guildData) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-3">Bot is not in this server</h1>
        <p className="text-white/60 text-sm">
          Make sure Functious is added and try again.
        </p>
      </div>
    );
  }

  return (
    <GuildDashboard
      user={session.user}
      guilds={dashboardGuilds}
      activeGuildId={guildId}
      userGuild={userGuild}
      initialData={guildData}
    />
  );
}
