'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardGuild } from '@/lib/types';

interface PresenceEntry {
  botGuildIds: Set<string>;
  fetchedAt: number;
}

let presenceCache: PresenceEntry | null = null;
const PRESENCE_TTL_MS = 60_000;

export function useBotPresence(guilds: DashboardGuild[]): DashboardGuild[] {
  const [updatedGuilds, setUpdatedGuilds] = useState<DashboardGuild[]>(guilds);

  const check = useCallback(async () => {
    if (presenceCache && Date.now() - presenceCache.fetchedAt < PRESENCE_TTL_MS) {
      setUpdatedGuilds(
        guilds.map(g => ({ ...g, botPresent: presenceCache!.botGuildIds.has(g.id) }))
      );
      return;
    }

    try {
      const res = await fetch('/api/bot/guilds/filter', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildIds: guilds.map(g => g.id) }),
      });
      if (!res.ok) return;

      const { present } = await res.json() as { present: string[] };
      const botGuildIds = new Set(present);

      presenceCache = { botGuildIds, fetchedAt: Date.now() };

      setUpdatedGuilds(
        guilds.map(g => ({ ...g, botPresent: botGuildIds.has(g.id) }))
      );
    } catch {
    }
  }, [guilds]);

  useEffect(() => {
    check();
  }, [check]);

  return updatedGuilds;
}

export function invalidatePresenceCache() {
  presenceCache = null;
}
