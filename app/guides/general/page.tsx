import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import { GENERAL_GUIDE, findChapter, chapterHref } from '@/data/guides';

export default function GeneralOverview() {
  const chapter = findChapter(GENERAL_GUIDE, '')!;
  return (
    <GuidePage guide={GENERAL_GUIDE} chapter={chapter} description="Quick reference for commands that don't need a dedicated guide.">
      <GuideSection title="What's covered">
        <p>
          These commands are straightforward but have a few options worth knowing. Rather than a
          long walkthrough, each chapter gives you the key options and examples you actually need.
        </p>
      </GuideSection>

      <GuideSection title="Chapters in this guide">
        <ul className="list-none space-y-3">
          {GENERAL_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(GENERAL_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">{String(GENERAL_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block text-sm font-semibold text-white transition-colors group-hover:text-orange-light">{item.title}</span>
                  <span className="block text-xs text-white/40">{item.short}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </GuideSection>
    </GuidePage>
  );
}
