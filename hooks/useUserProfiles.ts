'use client';

import { useState, useEffect } from 'react';
import type { UserProfile, FluxerUser } from '@/lib/types';

interface CacheEntry {
  profile: UserProfile;
  at: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const inFlight = new Map<string, Promise<BatchStatus>>();

let currentUserCache: { user: FluxerUser; at: number } | null = null;
const CURRENT_USER_TTL_MS = 24 * 60 * 60 * 1000;

let guestUntil = 0;
const GUEST_TTL_MS = 60 * 1000;
let inFlightUser: Promise<FluxerUser | null> | null = null;

type BatchStatus = 'ok' | 'auth' | 'error';

function cachedProfile(id: string): UserProfile | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(id);
    return null;
  }
  return entry.profile;
}

function sessionProfile(user: FluxerUser): UserProfile {
  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name,
    avatar: user.avatar,
    avatarUrl: null,
  };
}

async function probeCurrentUser(): Promise<FluxerUser | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.status === 401) {
      guestUntil = Date.now() + GUEST_TTL_MS;
      return null;
    }
    if (!res.ok) return null;

    const data = await res.json();
    const user: FluxerUser | null = data?.user ?? null;
    if (user) currentUserCache = { user, at: Date.now() };
    else guestUntil = Date.now() + GUEST_TTL_MS;
    return user;
  } catch {
    return null;
  }
}

async function getCurrentUser(): Promise<FluxerUser | null> {
  if (currentUserCache && Date.now() - currentUserCache.at < CURRENT_USER_TTL_MS) {
    return currentUserCache.user;
  }
  if (Date.now() < guestUntil) return null;
  if (!inFlightUser) {
    inFlightUser = probeCurrentUser().finally(() => {
      inFlightUser = null;
    });
  }
  return inFlightUser;
}

async function fetchBatch(ids: string[]): Promise<BatchStatus> {
  try {
    const res = await fetch('/api/users/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids }),
    });
    if (res.status === 401 || res.status === 403) return 'auth';
    if (!res.ok) return 'error';
    const data = await res.json();

    for (const [id, raw] of Object.entries(data.profiles ?? {})) {
      const profile = raw as UserProfile;
      if (profile?.pending) continue;
      cache.set(id, { profile, at: Date.now() });
    }
    return 'ok';
  } catch {
    return 'error';
  }
}

function startFetch(ids: string[]): void {
  const resolveFns = new Map<string, (status: BatchStatus) => void>();
  for (const id of ids) {
    inFlight.set(
      id,
      new Promise<BatchStatus>((resolve) => {
        resolveFns.set(id, resolve);
      })
    );
  }
  void (async () => {
    let status: BatchStatus = 'error';
    try {
      status = await fetchBatch(ids);
    } finally {
      for (const id of ids) {
        inFlight.delete(id);
        resolveFns.get(id)?.(status);
      }
    }
  })();
}

function buildResult(ids: string[]): Record<string, UserProfile> {
  const out: Record<string, UserProfile> = {};
  for (const id of ids) {
    const profile = cachedProfile(id);
    if (profile) out[id] = profile;
  }
  return out;
}

async function requestProfiles(
  ids: string[],
): Promise<{ profiles: Record<string, UserProfile>; retryable: boolean }> {
  const unique = [...new Set(ids)];

  const current = await getCurrentUser();
  if (!current) {
    return { profiles: buildResult(unique), retryable: false };
  }
  cache.set(current.id, { profile: sessionProfile(current), at: Date.now() });

  const missing = unique.filter((id) => !cachedProfile(id));
  if (missing.length === 0) {
    return { profiles: buildResult(unique), retryable: true };
  }

  const toFetch = missing.filter((id) => !inFlight.has(id));
  if (toFetch.length > 0) startFetch(toFetch);

  const statuses = await Promise.all(
    missing
      .map((id) => inFlight.get(id))
      .filter(Boolean) as Promise<BatchStatus>[],
  );

  return {
    profiles: buildResult(unique),
    retryable: !statuses.includes('auth'),
  };
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

      const { profiles: resolved, retryable } = await requestProfiles(stillMissing);
      if (cancelled) return;

      if (Object.keys(resolved).length > 0) {
        snapshot();
      }

      if (!retryable) return;

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