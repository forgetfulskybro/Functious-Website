'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GuildData } from '@/lib/types';

interface CacheEntry {
  data: GuildData;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

function getCached(guildId: string): GuildData | null {
  const entry = cache.get(guildId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry.data;
}

function setCached(guildId: string, data: GuildData) {
  cache.set(guildId, { data, fetchedAt: Date.now() });
}

function patchCached(guildId: string, updates: Partial<GuildData>) {
  const entry = cache.get(guildId);
  if (entry) cache.set(guildId, { ...entry, data: { ...entry.data, ...updates } });
}

interface TempSetupOptions {
  customCategoryId?: string | null;
  manage?: boolean;
  channelName?: string;
  channelLimit?: number;
  counting?: boolean;
  reset?: boolean;
}

interface UseGuildDataResult {
  guild: GuildData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  save: (updates: Partial<GuildData>) => Promise<void>;
  saving: boolean;
  setupTempChannels: (options?: TempSetupOptions) => Promise<void>;
  resetTempChannels: () => Promise<void>;
}

export function useGuildData(guildId: string): UseGuildDataResult {
  const [guild, setGuild] = useState<GuildData | null>(() => getCached(guildId));
  const [loading, setLoading] = useState(() => getCached(guildId) === null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guildIdRef = useRef(guildId);
  useEffect(() => { guildIdRef.current = guildId; }, [guildId]);

  const fetchGuild = useCallback(
    async (background = false) => {
      if (!background) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch(`/api/bot/guilds/${guildId}`, {
          credentials: 'include',
        });
        if (res.status === 401) { setError('Not authorised.'); return; }
        if (res.status === 404) { setError('Failed to load: 404'); return; }
        if (!res.ok) { setError('Failed to load server settings.'); return; }

        const data: GuildData = await res.json();

        if (guildIdRef.current === guildId) {
          setCached(guildId, data);
          setGuild(data);
          setError(null);
        }
      } catch {
        if (!background) setError('Could not reach the server. Try again later.');
      } finally {
        if (!background && guildIdRef.current === guildId) setLoading(false);
      }
    },
    [guildId]
  );

  useEffect(() => {
    const cached = getCached(guildId);
    if (cached) {
      setGuild(cached);
      setLoading(false);
      fetchGuild(true);
    } else {
      fetchGuild(false);
    }
  }, [guildId, fetchGuild]);

  const save = useCallback(
    async (updates: Partial<GuildData>) => {
      setSaving(true);
      setError(null);
      setGuild(prev => (prev ? { ...prev, ...updates } : prev));
      patchCached(guildId, updates);

      try {
        const res = await fetch(`/api/bot/guilds/${guildId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const rollback = getCached(guildId);
          if (rollback) setGuild(rollback);
          throw new Error('Save failed');
        }
      } catch {
        setError('Failed to save changes. Please try again.');
        throw new Error('Save failed');
      } finally {
        setSaving(false);
      }
    },
    [guildId]
  );

  const setupTempChannels = useCallback(
    async (options: TempSetupOptions = {}) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/bot/guilds/${guildId}/tempchannels/setup`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Setup failed');
        }
        cache.delete(guildId);
        await fetchGuild(false);
      } catch (err: any) {
        setError(err?.message || 'Failed to setup temp channels.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [guildId, fetchGuild]
  );

  const resetTempChannels = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/tempchannels/reset`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Reset failed');
      }
      cache.delete(guildId);
      await fetchGuild(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset temp channels.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [guildId, fetchGuild]);

  return {
    guild,
    loading,
    error,
    refresh: () => { cache.delete(guildId); fetchGuild(false); },
    save,
    saving,
    setupTempChannels,
    resetTempChannels,
  };
}
