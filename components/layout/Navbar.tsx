'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BOT_INVITE_URL } from '@/lib/constants';
import InviteButton from '@/components/ui/InviteButton';
import type { FluxerUser } from '@/lib/types';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Commands', href: '/commands' },
  { label: 'Support',  href: 'https://fluxer.gg/YnINU09E' },
] as const;

function avatarUrl(user: FluxerUser): string {
  if (!user.avatar) {
    const index = Number(BigInt(user.id) >> BigInt(22)) % 6;
    return `https://fluxerstatic.com/avatars/${index}.png`;
  }
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.${ext}?size=64`;
}

function UserMenu({ user }: { user: FluxerUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const displayName = user.global_name ?? user.username;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${displayName} — account menu`}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange group"
      >
        <Image
          src={avatarUrl(user)}
          alt={displayName}
          width={24}
          height={24}
          className="rounded-full ring-1 ring-white/20 group-hover:ring-orange/50 transition-all"
        />
        <span className="text-white/80 group-hover:text-white text-sm font-medium transition-colors max-w-[100px] truncate">
          {displayName}
        </span>

        <svg
          className={[
            'w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-all duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#1a0e0e]/95 backdrop-blur-md shadow-2xl shadow-black/60 py-1.5 z-50"
        >
          <div className="px-4 py-3 border-b border-[#3B1919]">
            <p className="text-white/90 text-sm font-semibold truncate">{displayName}</p>
            <p className="text-white/35 text-xs truncate">@{user.username}</p>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-colors focus-visible:outline-none focus-visible:bg-white/6"
            >
              <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dashboard
            </Link>

            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-colors focus-visible:outline-none focus-visible:bg-white/6"
            >
              <svg 
                className="w-4 h-4 text-white/40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </Link>

            <a
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-colors focus-visible:outline-none focus-visible:bg-white/6"
            >
              <svg className="w-4 h-4 text-white/40" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                <path d="M256 0C397.385 0 512 114.615 512 256C512 397.385 397.385 512 256 512C114.615 512 0 397.385 0 256C0 114.615 114.615 0 256 0ZM187.53 266.057C171.987 266.057 157.206 269.562 143.187 276.571C129.321 283.581 118.044 294.781 109.359 310.171C103.743 320.3 100.041 332.574 98.2529 346.993C96.5986 360.334 107.829 371.2 121.271 371.2C135.049 371.2 145.336 359.626 148.673 346.259C150.564 338.68 153.612 332.67 157.815 328.229C165.891 319.695 176.101 315.429 188.444 315.429C196.673 315.429 204.216 317.486 211.073 321.6C217.93 325.562 226.844 332.343 237.815 341.943C254.577 356.724 269.359 367.467 282.159 374.171C294.959 380.724 309.13 384 324.673 384C340.216 384 354.997 380.495 369.016 373.486C383.035 366.476 394.387 355.276 403.073 339.886C408.811 329.718 412.521 317.389 414.202 302.899C415.745 289.597 404.498 278.857 391.106 278.857C377.243 278.858 366.904 290.561 363.218 303.927C361.421 310.442 358.706 315.952 355.073 320.457C347.454 329.905 337.016 334.629 323.759 334.629C315.53 334.629 308.063 332.647 301.359 328.686C294.806 324.571 285.816 317.714 274.387 308.114C257.473 293.943 242.615 283.429 229.815 276.571C217.168 269.562 203.073 266.057 187.53 266.057ZM187.53 128C171.987 128 157.206 131.505 143.187 138.514C129.321 145.524 118.044 156.724 109.359 172.114C103.743 182.243 100.041 194.517 98.2529 208.935C96.5985 222.276 107.829 233.142 121.271 233.143C135.049 233.143 145.336 221.569 148.673 208.202C150.564 200.623 153.612 194.613 157.815 190.171C165.891 181.638 176.101 177.371 188.444 177.371C196.673 177.371 204.216 179.429 211.073 183.543C217.93 187.505 226.844 194.286 237.815 203.886C254.577 218.667 269.359 229.41 282.159 236.114C294.959 242.667 309.13 245.943 324.673 245.943C340.216 245.943 354.997 242.438 369.016 235.429C383.035 228.419 394.387 217.219 403.073 201.829C408.811 191.661 412.521 179.332 414.202 164.842C415.745 151.539 404.498 140.8 391.106 140.8C377.243 140.8 366.904 152.504 363.218 165.87C361.421 172.385 358.706 177.895 355.073 182.4C347.454 191.848 337.016 196.571 323.759 196.571C315.53 196.571 308.063 194.59 301.359 190.629C294.806 186.514 285.816 179.657 274.387 170.057C257.473 155.886 242.615 145.371 229.815 138.514C217.168 131.505 203.073 128 187.53 128Z" />
              </svg>
              Add to Fluxer
            </a>
          </div>

          <div className="border-t border-[#3B1919] pt-1">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                role="menuitem"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/8 transition-colors focus-visible:outline-none focus-visible:bg-red-500/8"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser]             = useState<FluxerUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setAuthLoaded(true));
  }, []);

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
        scrolled ? 'bg-[#0D0505]/80 backdrop-blur-md' : 'bg-transparent',
      ].join(' ')}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">

          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            aria-label="Functious home"
          >
            <Image
              src="/Functious.png"
              alt="Functious logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg flex-shrink-0"
              priority
            />
            <span className="text-orange-warm font-bold text-xl tracking-wide">Functious</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-orange-light/80 hover:text-orange-warm transition-colors duration-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {authLoaded && (
              user
                ? <UserMenu user={user} />
                : <InviteButton size="esm" />
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(prev => !prev)}
            className="md:hidden flex flex-col justify-center items-center gap-1.5 w-9 h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <span className={['block w-6 h-0.5 bg-orange-warm transition-all duration-300', mobileOpen ? 'translate-y-2 rotate-45' : ''].join(' ')} />
            <span className={['block w-6 h-0.5 bg-orange-warm transition-all duration-300', mobileOpen ? 'opacity-0' : ''].join(' ')} />
            <span className={['block w-6 h-0.5 bg-orange-warm transition-all duration-300', mobileOpen ? '-translate-y-2 -rotate-45' : ''].join(' ')} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className={[
            'md:hidden w-full',
            scrolled ? 'bg-[#0D0505]/80 backdrop-blur-md' : 'bg-[#0D0505]/95',
          ].join(' ')}
        >
          <nav aria-label="Mobile navigation">
            <ul className="flex flex-col px-6 py-4 gap-4">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-orange-light/80 hover:text-orange-warm transition-colors duration-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  >
                    {label}
                  </Link>
                </li>
              ))}

              {authLoaded && (
                user ? (
                  <>
                    <li className="flex items-center gap-3 py-1 border-t border-white/10 pt-4">
                      <Image
                        src={avatarUrl(user)}
                        alt={user.username}
                        width={28}
                        height={28}
                        className="rounded-full ring-1 ring-white/20"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-sm font-medium truncate">{user.global_name ?? user.username}</p>
                        <p className="text-white/35 text-xs truncate">@{user.username}</p>
                      </div>
                    </li>
                    <li>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="block text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                      >
                        Dashboard →
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="block text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                      >
                        Profile →
                      </Link>
                    </li>
                    <li>
                      <form action="/api/auth/logout" method="POST">
                        <button
                          type="submit"
                          className="text-sm text-red-400/80 hover:text-red-300 transition-colors focus-visible:outline-none"
                        >
                          Sign out
                        </button>
                      </form>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <a
                        href={BOT_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="inline-block bg-orange text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-orange-bright transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                      >
                        Invite Bot
                      </a>
                    </li>
                    <li>
                      <a
                        href="/api/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="text-sm text-white/50 hover:text-white/80 transition-colors focus-visible:outline-none"
                      >
                        Sign in with Fluxer
                      </a>
                    </li>
                  </>
                )
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}