'use client';

import { useEffect, useState } from 'react';
import type { FluxerUser } from '@/lib/types';

let currentUserCache: FluxerUser | null = null;
let inFlight: Promise<FluxerUser | null> | null = null;

async function fetchCurrentUser(): Promise<FluxerUser | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    const user: FluxerUser | null = data?.user ?? null;
    if (user) currentUserCache = user;
    return user;
  } catch {
    return null;
  }
}

function requestCurrentUser(): Promise<FluxerUser | null> {
  if (currentUserCache) return Promise.resolve(currentUserCache);
  if (!inFlight) {
    inFlight = fetchCurrentUser().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export function useSessionUser(): FluxerUser | null {
  const [user, setUser] = useState<FluxerUser | null>(currentUserCache);

  useEffect(() => {
    let cancelled = false;
    if (currentUserCache) {
      setUser(currentUserCache);
      return;
    }
    void requestCurrentUser().then(resolved => {
      if (!cancelled && resolved) setUser(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}
