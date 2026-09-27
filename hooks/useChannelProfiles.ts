'use client';

import { useState, useEffect } from 'react';
import type { ChannelProfile } from '@/lib/types';

export type KnownChannel = {
  id: string;
  name?: string | null;
  type?: number | null;
};

interface CacheEntry {
  profile: ChannelProfile;
  at: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const inFlight = new Map<string, Promise<void>>();

function cachedProfile(id: string): ChannelProfile | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(id);
    return null;
  }
  return entry.profile;
}

async function fetchBatch(ids: string[]): Promise<void> {
  try {
    const res = await fetch('/api/channels/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return;
    const data = await res.json();

    for (const [id, raw] of Object.entries(data.channels ?? {})) {
      const profile = raw as ChannelProfile;
      if (profile?.pending) continue;
      cache.set(id, { profile, at: Date.now() });
    }
  } catch { }
}

function startFetch(ids: string[]): void {
  const resolveFns = new Map<string, () => void>();
  for (const id of ids) {
    inFlight.set(
      id,
      new Promise<void>((resolve) => {
        resolveFns.set(id, resolve);
      })
    );
  }
  void (async () => {
    try {
      await fetchBatch(ids);
    } finally {
      for (const id of ids) {
        inFlight.delete(id);
        resolveFns.get(id)?.();
      }
    }
  })();
}

function buildResult(ids: string[]): Record<string, ChannelProfile> {
  const out: Record<string, ChannelProfile> = {};
  for (const id of ids) {
    const profile = cachedProfile(id);
    if (profile) out[id] = profile;
  }
  return out;
}

async function requestProfiles(ids: string[]): Promise<Record<string, ChannelProfile>> {
  const unique = [...new Set(ids)];
  const missing = unique.filter((id) => !cachedProfile(id));
  if (missing.length === 0) return buildResult(unique);

  const toFetch = missing.filter((id) => !inFlight.has(id));
  if (toFetch.length > 0) startFetch(toFetch);

  await Promise.all(missing.map((id) => inFlight.get(id)).filter(Boolean) as Promise<void>[]);
  return buildResult(unique);
}

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 20;

export function useChannelProfiles(
  ids: string[],
  knownChannels: KnownChannel[] = []
): Record<string, ChannelProfile | undefined> {
  const [profiles, setProfiles] = useState<Record<string, ChannelProfile | undefined>>({});
  const key = [
    JSON.stringify([...new Set(ids)].sort()),
    knownChannels
      .map((c) => `${c.id}:${c.name ?? ''}:${c.type ?? ''}`)
      .sort()
      .join('|'),
  ].join('~');

  useEffect(() => {
    for (const ch of knownChannels) {
      if (!ch?.id || ch.name == null) continue;
      cache.set(ch.id, {
        profile: { id: ch.id, name: ch.name, type: ch.type ?? null },
        at: Date.now(),
      });
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const snapshot = () => {
      const next: Record<string, ChannelProfile | undefined> = {};
      for (const id of ids) {
        const profile = cachedProfile(id);
        if (profile) next[id] = profile;
      }
      if (!cancelled) setProfiles(next);
    };
    snapshot();

    const remaining = [...new Set(ids)].filter((id) => !cachedProfile(id));
    if (remaining.length === 0) return;

    const cycle = async () => {
      if (cancelled) return;
      const stillMissing = [...new Set(ids)].filter((id) => !cachedProfile(id));
      if (stillMissing.length === 0) return;

      const resolved = await requestProfiles(stillMissing);
      if (cancelled) return;

      if (Object.keys(resolved).length > 0) {
        snapshot();
      }

      if ([...new Set(ids)].some((id) => !cachedProfile(id))) {
        attempts += 1;
        if (attempts < MAX_ATTEMPTS) {
          timer = setTimeout(cycle, POLL_INTERVAL_MS);
        }
      }
    };

    cycle();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [key]);

  return profiles;
}