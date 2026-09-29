import Link from 'next/link';
import type { FeatureData } from '@/data/features';

interface FeatureCardProps {
  feature: FeatureData;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const { slug, name, shortDescription, relatedCommands } = feature;
  const mainCommand = relatedCommands?.[0];

  return (
    <Link
      href={`/features/${slug}`}
      className="group flex h-full flex-col rounded-xl border border-white/10 bg-[#140b08] p-5 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      aria-label={`Learn more about ${name}`}
    >
      <span className="text-base font-semibold text-white transition-colors group-hover:text-orange-light">
        {name}
      </span>

      <span className="mt-2 block text-sm leading-relaxed text-white/60">
        {shortDescription}
      </span>

      <span className="mt-4 flex items-center justify-between gap-3">
        {mainCommand ? (
          <span className="inline-flex w-fit items-center rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-orange-light/80 transition-colors group-hover:bg-orange/10 group-hover:text-orange">
            f!{mainCommand}
          </span>
        ) : (
          <span />
        )}
        <span
          className="text-xs text-white/20 transition-colors group-hover:text-orange-light/70"
          aria-hidden
        >
          →
        </span>
      </span>
    </Link>
  );
}
