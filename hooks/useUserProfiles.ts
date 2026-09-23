'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';

interface CacheEntry {
  profile: UserProfile;
  at: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const inFlight = new Set<string>();

function cachedProfile(id: string): UserProfile | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(id);
    return null;
  }
  return entry.profile;
}

async function requestProfiles(ids: string[]): Promise<Record<string, UserProfile>> {
  const unique = [...new Set(ids)].filter((id) => !cachedProfile(id) && !inFlight.has(id));
  if (unique.length === 0) return {};

  unique.forEach((id) => inFlight.add(id));
  try {
    const res = await fetch('/api/users/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: unique }),
    });
    if (!res.ok) return {};
    const data = await res.json();

    const out: Record<string, UserProfile> = {};
    for (const [id, raw] of Object.entries(data.profiles ?? {})) {
      const profile = raw as UserProfile;
      if (profile?.pending) continue;
      cache.set(id, { profile, at: Date.now() });
      out[id] = profile;
    }
    return out;
  } catch {
    return {};
  } finally {
    unique.forEach((id) => inFlight.delete(id));
  }
}

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 20;

export function useUserProfiles(ids: string[]): Record<string, UserProfile | undefined> {
  const [profiles, setProfiles] = useState<Record<string, UserProfile | undefined>>({});
  const key = ids.join(',');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const snapshot = () => {
      const next: Record<string, UserProfile | undefined> = {};
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return profiles;
}