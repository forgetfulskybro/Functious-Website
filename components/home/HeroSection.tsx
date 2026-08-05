'use client';

import { motion } from 'framer-motion';
import GradientBackground from '@/components/ui/GradientBackground';
import InviteButton from '@/components/ui/InviteButton';
import { staggerContainerVariants, fadeUpVariants, useMotionConfig } from '@/lib/motion';

export default function HeroSection() {
  const motionConfig = useMotionConfig();

  const containerVariants = motionConfig.transition.duration === 0
    ? { hidden: {}, visible: {} }
    : staggerContainerVariants;

  const itemVariants = motionConfig.transition.duration === 0
    ? { hidden: {}, visible: {} }
    : fadeUpVariants;

  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center"
      aria-label="Hero"
    >
      <div className="absolute inset-0 z-0">
        <GradientBackground />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={itemVariants}
          className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Functious
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="max-w-xl text-base font-medium text-white/80 sm:text-lg md:text-xl"
        >
          A simple yet useful Fluxer companion.
        </motion.p>

        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <InviteButton size="lg" />
            <div
              className={[
                'relative inline-flex items-center justify-center gap-3 rounded-2xl font-semibold',
                'bg-white/10 border border-white/20',
                'text-white/50 shadow-xl shadow-black/30',
                'cursor-not-allowed select-none',
                'px-9 py-4 text-lg',
              ].join(' ')}
              aria-disabled="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/40"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Dashboard</span>

              <span
                className="absolute -right-2 top-1/2 -translate-y-1/2 origin-center rotate-90 whitespace-nowrap rounded bg-orange-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
              >
                Coming Soon
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
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