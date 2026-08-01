'use client';

import { useState, useEffect, useRef } from 'react';
import type { BotStatus } from '@/lib/types';

interface UseHealthWsResult {
  status: BotStatus | null;
  connected: boolean;
}

export function useHealthWs(): UseHealthWsResult {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_BOT_WS_URL;
    if (!wsUrl) return;

    let destroyed = false;

    function connect() {
      if (destroyed) return;

      const ws = new WebSocket(`${wsUrl}/health/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (destroyed) { ws.close(); return; }
        setConnected(true);
        retryDelay.current = 1000;
      };

      ws.onmessage = (event) => {
        if (destroyed) return;
        try {
          const data: BotStatus = JSON.parse(event.data);
          setStatus(data);
        } catch {
        }
      };

      ws.onclose = () => {
        if (destroyed) return;
        setConnected(false);
        retryRef.current = setTimeout(() => {
          retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
          connect();
        }, retryDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { status, connected };
}
