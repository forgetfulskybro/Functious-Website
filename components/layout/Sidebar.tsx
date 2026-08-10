'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useHealthWs } from '@/hooks/useHealthWs';
import type { FluxerUser, DashboardGuild } from '@/lib/types';

function guildIconUrl(id: string, icon: string | null): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://fluxerusercontent.com/icons/${id}/${icon}.${ext}?size=64`;
}

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const GUILD_NAV_LINKS: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: 'Overview', href: '',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    label: 'Configuration', href: 'configuration',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round"/></svg>,
  },
  {
    label: 'Roles & Permissions', href: 'roles-permissions',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: 'Reaction Roles', href: 'reaction-roles',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 10.5h.01M15.5 10.5h.01" /><path d="M8.8 14.5c1.2 1.4 3.2 1.8 5.4 0" /><path d="M18 4.5l1.2 2.4 2.6.4-1.9 1.9.5 2.6L18 10.5l-2.4 1.3.5-2.6-1.9-1.9 2.6-.4L18 4.5z" /></svg>,
  },
  {
    label: 'Temp Channels', href: 'tempchannels',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: 'Tags', href: 'tags',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round"/><line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round"/></svg>,
  },
  {
    label: 'Giveaways', href: 'giveaways',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  },
  {
    label: 'Polls', href: 'polls',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    label: 'Schedules', href: 'schedules',
    icon: <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
];

interface SidebarProps {
  user: FluxerUser;
  guilds?: DashboardGuild[];
  activeGuildId?: string;
  currentPage: 'dashboard' | 'profile';
}

export default function Sidebar({ user, guilds, activeGuildId, currentPage }: SidebarProps) {
  const { status } = useHealthWs();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const activeGuild = guilds?.find(g => g.id === activeGuildId);

  const backHref = currentPage === 'profile' ? '/dashboard' : activeGuildId ? '/dashboard' : '/';
  const backLabel = currentPage === 'profile' ? 'Dashboard' : activeGuildId ? 'All servers' : 'Homepage';

  const SidebarContent = (
    <>
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Image
            src="/Functious.png"
            alt="Functious logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg flex-shrink-0"
            priority
          />
          <div>
            <p className="text-orange-warm font-bold text-sm leading-none">Functious</p>
            <p className={['text-xs mt-0.5', status?.online ? 'text-green-400' : 'text-white/35'].join(' ')}>
              {status?.online ? '● Online' : '○ Offline'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-3 flex-1 min-h-0 overflow-y-auto">
        <Link
          href={backHref}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange/20 hover:border-orange/40 bg-orange/[0.04] hover:bg-orange/[0.08] text-white/70 hover:text-orange-warm text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {backLabel}
        </Link>

        {guilds && (
          <div className="relative mt-2" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center justify-between w-full gap-2 px-3 py-2 rounded-lg border border-orange/20 hover:border-orange/40 bg-orange/[0.04] hover:bg-orange/[0.08] text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
            >
              {activeGuild ? (
                <span className="flex items-center gap-2 min-w-0">
                  {guildIconUrl(activeGuild.id, activeGuild.icon) ? (
                    <Image src={guildIconUrl(activeGuild.id, activeGuild.icon)!} alt={activeGuild.name} width={18} height={18} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-4.5 h-4.5 rounded-full bg-orange/20 flex items-center justify-center text-orange-warm text-[9px] font-bold flex-shrink-0">
                      {initials(activeGuild.name)}
                    </div>
                  )}
                  <span className="truncate text-xs font-medium">{activeGuild.name}</span>
                </span>
              ) : (
                <span className="text-white/40 text-xs">Select a community</span>
              )}
              <svg
                className={['w-3 h-3 text-white/30 flex-shrink-0 transition-transform duration-200', dropdownOpen ? 'rotate-180' : ''].join(' ')}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-lg bg-[#1a0e0e]/95 backdrop-blur-md shadow-xl py-1.5 z-20">
                <p className="text-white/30 text-[10px] px-3 mb-1 uppercase tracking-widest font-semibold">Communities</p>
                {guilds.filter(g => g.botPresent).map(guild => (
                  <Link
                    key={guild.id}
                    href={`/dashboard/${guild.id}`}
                    onClick={() => {
                      setDropdownOpen(false);
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/65 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:bg-white/5"
                  >
                    {guildIconUrl(guild.id, guild.icon) ? (
                      <Image src={guildIconUrl(guild.id, guild.icon)!} alt={guild.name} width={18} height={18} className="rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-orange/20 flex items-center justify-center text-orange-warm text-[9px] font-bold flex-shrink-0">
                        {initials(guild.name)}
                      </div>
                    )}
                    <span className="truncate flex-1">{guild.name}</span>
                    {activeGuildId === guild.id && (
                      <svg className="w-3 h-3 text-orange-warm flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </Link>
                ))}
                <div className="border-t border-[#401B1B] my-1" />
                <Link
                  href="/dashboard"
                  onClick={() => {
                    setDropdownOpen(false);
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none"
                >
                  <svg className="w-3.5 h-3.5 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.36-2.64L3 16M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  All communities
                </Link>
              </div>
            )}
          </div>
        )}

        {activeGuildId && (
          <div className="mt-3 border-t border-white/5 pt-3">
            <p className="text-white/25 text-[10px] px-3 mb-1.5 uppercase tracking-widest font-semibold">Server</p>
            <ul className="flex flex-col gap-0.5">
              {GUILD_NAV_LINKS.map(link => {
                const href = `/dashboard/${activeGuildId}${link.href ? `/${link.href}` : ''}`;
                const isActive = pathname === href || (link.href === '' && pathname === `/dashboard/${activeGuildId}`);
                return (
                  <li key={link.label}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange',
                        isActive
                          ? 'bg-orange/12 text-orange-warm font-semibold border border-orange/20'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                      ].join(' ')}
                    >
                      <span className="text-white/30">{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl border border-transparent hover:border-orange/30 hover:bg-orange/[0.04] transition-all group">
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 flex-1 min-w-0 focus-visible:outline-none"
          >
            <Image
              src={user.avatar
                ? `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.png?size=64`
                : `https://fluxerstatic.com/avatars/${Number(BigInt(user.id) >> BigInt(22)) % 6}.png`}
              alt={user.username}
              width={26}
              height={26}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white/75 group-hover:text-orange-warm text-xs font-medium truncate transition-colors">
                {user.global_name ?? user.username}
              </p>
              <p className="text-white/25 text-[10px] truncate">@{user.username}</p>
            </div>
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-[#160a0a]/90 border border-white/10 text-white/70 hover:text-white hover:bg-[#1a0e0e] transition-colors shadow-lg backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
        </svg>
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden overscroll-none">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
      
          <aside className="absolute left-0 top-0 h-full max-h-[100dvh] w-[260px] max-w-[85vw] bg-[#110808] border-r border-white/5 flex flex-col overflow-hidden shadow-2xl animate-slideIn">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors focus-visible:outline-none z-10"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          
            {SidebarContent}
          </aside>
        </div>
      )}

      <aside className="hidden md:flex w-[220px] shrink-0 flex-col bg-[#110808] border-r border-white/5 h-screen sticky top-0">
        {SidebarContent}
      </aside>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.22s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </>
  );
}