'use client';

import Link from 'next/link';
import type { FeatureData } from '@/data/features';

interface FeatureCardProps {
  feature: FeatureData;
  index: number;
}

export default function FeatureCard({ feature, index }: FeatureCardProps) {
  const { slug, name, shortDescription, relatedCommands } = feature;
  const mainCommand = relatedCommands?.[0];

  const col = index % 3;

  const accentClass =
    col === 0
      ? 'left-0 bg-gradient-to-r from-orange to-transparent'
      : col === 1
        ? 'left-1/2 -translate-x-1/2 bg-orange'
        : 'right-0 bg-gradient-to-l from-orange to-transparent';

  return (
    <Link
      href={`/features/${slug}`}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/[0.06] bg-[#161110]/80 p-4 transition-all duration-200 hover:border-orange/35 hover:bg-[#1c1410] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      aria-label={`Learn more about ${name}`}
    >
      <span
        className={[
          'absolute top-0 h-[2px] w-12 opacity-50 transition-opacity duration-200 group-hover:opacity-100',
          accentClass,
        ].join(' ')}
        aria-hidden
      />

      <div>
        <h3 className="text-sm font-semibold text-white/90 transition-colors group-hover:text-white">
          {name}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-white/40 line-clamp-2 group-hover:text-white/55 transition-colors">
          {shortDescription}
        </p>
      </div>

      {mainCommand && (
        <span className="mt-3 inline-flex w-fit items-center rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-orange/60 transition-colors group-hover:bg-orange/10 group-hover:text-orange">
          f!{mainCommand}
        </span>
      )}
    </Link>
  );
}