import Link from 'next/link';
import type { Guide, GuideChapter } from '@/data/guides';
import { chapterHref } from '@/data/guides';

interface GuidePagerProps {
  guide: Guide;
  prev: GuideChapter | null;
  next: GuideChapter | null;
}

export default function GuidePager({ guide, prev, next }: GuidePagerProps) {
  return (
    <nav
      aria-label="Chapter navigation"
      className="mt-16 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={chapterHref(guide, prev)}
          className="group rounded-xl border border-white/10 bg-[#140b08] p-4 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-white/40">
            <span aria-hidden="true">←</span> Previous
          </span>
          <span className="mt-1 block text-sm font-semibold text-white transition-colors group-hover:text-orange-light">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={chapterHref(guide, next)}
          className="group rounded-xl border border-orange/30 bg-[#1a0d08] p-4 text-right transition-colors hover:border-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          <span className="flex items-center justify-end gap-1 text-xs font-medium uppercase tracking-wide text-orange-light/70">
            Next <span aria-hidden="true">→</span>
          </span>
          <span className="mt-1 block text-sm font-semibold text-white transition-colors group-hover:text-orange-light">
            {next.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
