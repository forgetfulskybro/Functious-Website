'use client';

import { useState, useEffect } from 'react';
import type { BotStatus } from '@/lib/types';

interface UseBotStatusResult {
  status: BotStatus | null;
  loading: boolean;
}

export function useBotStatus(): UseBotStatusResult {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch('/api/bot/health', { credentials: 'include' });
        if (!cancelled && res.ok) {
          const data: BotStatus = await res.json();
          setStatus(data);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { status, loading };
}
