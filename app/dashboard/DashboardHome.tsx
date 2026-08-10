'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BOT_INVITE_URL } from '@/lib/constants';
import type { FluxerUser, DashboardGuild } from '@/lib/types';
import Sidebar from '@/components/layout/Sidebar';

function guildIconUrl(id: string, icon: string | null): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://fluxerusercontent.com/icons/${id}/${icon}.${ext}?size=64`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const COOLDOWN_KEY = 'dashboard-refresh-cooldown';
const COUNT_KEY = 'dashboard-refresh-count';
const BASE_COOLDOWN_MS = 15_000;
const MAX_COOLDOWN_MS = 5 * 60_000;
const RESET_AFTER_MS = 5 * 60_000;
const GUILDS_PER_PAGE = 6;

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  currentPage: String;
}

export default function DashboardHome({ user, guilds, currentPage }: Props) {
  const botGuilds = guilds.filter(g => g.botPresent);
  const otherGuilds = guilds.filter(g => !g.botPresent);

  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
      const now = Date.now();

      if (until > now) {
        setCooldownLeft(Math.ceil((until - now) / 1000));
      } else if (now - until > RESET_AFTER_MS) {
        localStorage.setItem(COUNT_KEY, '0');
      }
    } catch {
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => {
      setCooldownLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  const handleRefresh = useCallback(() => {
    if (cooldownLeft > 0) return;
    try {
      const prevCount = Number(localStorage.getItem(COUNT_KEY) || 0);
      const nextCount = prevCount + 1;
      const duration = Math.min(
        BASE_COOLDOWN_MS * Math.pow(1.5, nextCount - 1),
        MAX_COOLDOWN_MS
      );
      localStorage.setItem(COUNT_KEY, String(nextCount));
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + duration));
    } catch {
    }
    window.location.reload();
  }, [cooldownLeft]);

  const [botPage, setBotPage] = useState(0);
  const [otherPage, setOtherPage] = useState(0);

  const totalBotPages = Math.max(1, Math.ceil(botGuilds.length / GUILDS_PER_PAGE));
  const totalOtherPages = Math.max(1, Math.ceil(otherGuilds.length / GUILDS_PER_PAGE));

  useEffect(() => {
    setBotPage(p => Math.min(p, totalBotPages - 1));
  }, [totalBotPages]);

  useEffect(() => {
    setOtherPage(p => Math.min(p, totalOtherPages - 1));
  }, [totalOtherPages]);

  const pagedBotGuilds = useMemo(() => {
    const start = botPage * GUILDS_PER_PAGE;
    return botGuilds.slice(start, start + GUILDS_PER_PAGE);
  }, [botGuilds, botPage]);

  const pagedOtherGuilds = useMemo(() => {
    const start = otherPage * GUILDS_PER_PAGE;
    return otherGuilds.slice(start, start + GUILDS_PER_PAGE);
  }, [otherGuilds, otherPage]);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user} guilds={guilds} currentPage="dashboard" />

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Your communities
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {botGuilds.length > 0
                ? `Functious is active in ${botGuilds.length} of your servers.`
                : "Add Functious to a server to get started."}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={!ready || cooldownLeft > 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/60"
          >
            <svg
              className={`w-3.5 h-3.5 ${cooldownLeft > 0 ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.36-2.64L3 16M3 21v-5h5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : "Refresh"}
          </button>
        </div>

        {botGuilds.length > 0 && (
          <section aria-label="Active communities" className="mb-8">
            {botGuilds.length > GUILDS_PER_PAGE && (
              <div className="flex items-center justify-end mb-3">
                <p className="text-white/30 text-xs">
                  {botGuilds.length} servers
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pagedBotGuilds.map((guild) => (
                <Link
                  key={guild.id}
                  href={`/dashboard/${guild.id}`}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl bg-bg-card hover:border-orange/40 hover:bg-bg-card/80 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange border border-transparent"
                >
                  {guildIconUrl(guild.id, guild.icon) ? (
                    <Image
                      src={guildIconUrl(guild.id, guild.icon)!}
                      alt={guild.name}
                      width={40}
                      height={40}
                      className="rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-orange/20 flex items-center justify-center text-orange-warm text-sm font-bold flex-shrink-0">
                      {initials(guild.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate group-hover:text-orange-warm transition-colors">
                      {guild.name}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {guild.owner ? "Owner" : "Admin"}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-white/20 group-hover:text-orange/60 transition-colors flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>

            {totalBotPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setBotPage((p) => Math.max(0, p - 1))}
                  disabled={botPage === 0}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  Previous
                </button>
                <span className="text-white/40 text-xs tabular-nums">
                  {botPage + 1} / {totalBotPages}
                </span>
                <button
                  onClick={() =>
                    setBotPage((p) => Math.min(totalBotPages - 1, p + 1))
                  }
                  disabled={botPage >= totalBotPages - 1}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}

        {otherGuilds.length > 0 && (
          <section aria-label="Communities without Functious">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                Add Functious to a server
              </h2>
              {otherGuilds.length > GUILDS_PER_PAGE && (
                <p className="text-white/30 text-xs">
                  {otherGuilds.length} servers
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pagedOtherGuilds.map((guild) => (
                <a
                  key={guild.id}
                  href={`${BOT_INVITE_URL}&guild_id=${guild.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-5 py-4 rounded-xl border border-dashed border-white/10 hover:border-orange/30 hover:bg-white/[0.02] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  {guildIconUrl(guild.id, guild.icon) ? (
                    <Image
                      src={guildIconUrl(guild.id, guild.icon)!}
                      alt={guild.name}
                      width={40}
                      height={40}
                      className="rounded-xl flex-shrink-0 opacity-50 group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 text-sm font-bold flex-shrink-0">
                      {initials(guild.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 font-semibold text-sm truncate group-hover:text-white/70 transition-colors">
                      {guild.name}
                    </p>
                    <p className="text-white/25 text-xs mt-0.5">
                      Click to add Functious
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-white/15 group-hover:text-orange/40 transition-colors flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              ))}
            </div>

            {totalOtherPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setOtherPage((p) => Math.max(0, p - 1))}
                  disabled={otherPage === 0}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  Previous
                </button>
                <span className="text-white/40 text-xs tabular-nums">
                  {otherPage + 1} / {totalOtherPages}
                </span>
                <button
                  onClick={() =>
                    setOtherPage((p) => Math.min(totalOtherPages - 1, p + 1))
                  }
                  disabled={otherPage >= totalOtherPages - 1}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}

        {guilds.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">No servers found.</p>
            <a
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-orange text-white font-semibold text-sm hover:bg-orange-bright transition-colors"
            >
              Add Functious to a server
            </a>
          </div>
        )}
      </main>
    </div>
  );
}