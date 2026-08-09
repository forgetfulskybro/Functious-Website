'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Guide } from '@/data/guides';
import { guideRoot, chapterHref } from '@/data/guides';

function ChapterLinks({ guide, activePath }: { guide: Guide; activePath: string }) {
  return (
    <ol className="flex gap-2 lg:flex-col lg:gap-1">
      {guide.chapters.map((chapter, index) => {
        const href = chapterHref(guide, chapter);
        const active = activePath === href;
        return (
          <li key={chapter.slug || 'overview'} className="flex-shrink-0 lg:flex-shrink">
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange',
                active
                  ? 'bg-orange/15 font-medium text-orange-warm'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              <span
                className={[
                  'font-mono text-xs',
                  active ? 'text-orange' : 'text-white/35',
                ].join(' ')}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              {chapter.title}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export default function GuideSidebar({ guide }: { guide: Guide }) {
  const pathname = usePathname();

  return (
    <>
      <div className="lg:hidden">
        <div className="mb-6">
          <span className="block text-sm font-bold text-white">{guide.title}</span>
          <span className="block text-xs text-white/40">{guide.tagline}</span>
        </div>
        <nav aria-label={`${guide.title} guide chapters`} className="-mx-4 overflow-x-auto px-4 pb-1">
          <ChapterLinks guide={guide} activePath={pathname} />
        </nav>
      </div>

      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <div className="sticky top-24">
          <Link
            href={guideRoot(guide)}
            className="mb-5 block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <span className="block text-sm font-bold text-white">{guide.title}</span>
            <span className="block text-xs text-white/40">{guide.tagline}</span>
          </Link>

          <nav aria-label={`${guide.title} guide chapters`}>
            <ChapterLinks guide={guide} activePath={pathname} />
          </nav>
        </div>
      </aside>
    </>
  );
}
