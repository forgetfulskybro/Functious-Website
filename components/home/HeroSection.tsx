'use client';

import GradientBackground from '@/components/ui/GradientBackground';
import InviteButton from '@/components/ui/InviteButton';

export default function HeroSection() {
  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center"
      aria-label="Hero"
    >
      <div className="absolute inset-0 z-0">
        <GradientBackground />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className="font-display text-6xl font-light tracking-tight text-white sm:text-7xl md:text-8xl">
          Functious
        </h1>

        <p className="max-w-xl text-base text-white/80 sm:text-lg md:text-xl">
          A simple yet useful Fluxer companion for your community.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <InviteButton size="lg" />
          <a
            href="/dashboard"
            className={[
              'group inline-flex items-center justify-center gap-3 rounded-2xl font-semibold',
              'bg-white/10 border border-white/20',
              'text-white/90 shadow-xl shadow-black/30',
              'hover:bg-white/15 hover:border-white/30 hover:text-white',
              'active:scale-[0.97]',
              'transition-all duration-200 ease-out',
              'focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
              'px-9 py-4 text-lg',
            ].join(' ')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/70 group-hover:text-white transition-colors"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="group-hover:text-white transition-colors">Dashboard</span>
          </a>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-48 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, #0D0505 100%)',
        }}
        aria-hidden="true"
      />
    </section>
  );
}
