'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuildData } from '@/lib/types';

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
  const [guild, setGuild] = useState<GuildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuild = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setError('Not authorised.');
        return;
      }
      if (res.status === 404) {
        setError('Failed to load: 404');
        return;
      }

      if (!res.ok) {
        setError('Failed to load server settings.');
        return;
      }
      const data: GuildData = await res.json();
      setGuild(data);
    } catch {
      setError('Could not reach the server. Try again later.');
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchGuild();
  }, [fetchGuild]);

  const save = useCallback(
    async (updates: Partial<GuildData>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/bot/guilds/${guildId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Save failed');
        setGuild(prev => (prev ? { ...prev, ...updates } : prev));
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
        await fetchGuild();
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
      await fetchGuild();
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
    refresh: fetchGuild,
    save,
    saving,
    setupTempChannels,
    resetTempChannels,
  };
}