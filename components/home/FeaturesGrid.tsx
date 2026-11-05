'use client';

import { useState } from 'react';
import { FEATURES } from '@/data/features';
import FeatureCard from '@/components/features/FeatureCard';

const MOBILE_FEATURE_LIMIT = 4;

export default function FeaturesGrid() {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(FEATURES.length - MOBILE_FEATURE_LIMIT, 0);

  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="features-heading"
    >
      <div className="mb-10 max-w-2xl">
        <h2
          id="features-heading"
          className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl"
        >
          Useful features for community needs
        </h2>
      </div>

      <div
        id="features-grid"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((feature, index) => (
          <div
            key={feature.slug}
            className={
              index >= MOBILE_FEATURE_LIMIT && !expanded
                ? 'hidden sm:block'
                : undefined
            }
          >
            <FeatureCard feature={feature} />
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-6 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-controls="features-grid"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#140b08] px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-orange/40 hover:text-orange-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
            <svg
              className={[
                'h-4 w-4 transition-transform',
                expanded ? 'rotate-180' : '',
              ].join(' ')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="m6 9 6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
