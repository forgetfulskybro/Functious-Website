import Link from 'next/link';
import type { Guide, GuideChapter } from '@/data/guides';
import { getNeighbors, guideRoot } from '@/data/guides';
import GuidePager from './GuidePager';

interface GuidePageProps {
  guide: Guide;
  chapter: GuideChapter;
  description: string;
  children: React.ReactNode;
}

export default function GuidePage({ guide, chapter, description, children }: GuidePageProps) {
  const { prev, next } = getNeighbors(guide, chapter.slug);

  return (
    <article>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm">
        <Link
          href={guideRoot(guide)}
          className="rounded text-white/50 transition-colors hover:text-orange-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          {guide.title} Guide
        </Link>
        <span className="text-white/25" aria-hidden="true">/</span>
        <span className="text-white/80">{chapter.title}</span>
      </nav>

      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {chapter.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-white/60">{description}</p>

      <div className="mt-10">{children}</div>

      <GuidePager guide={guide} prev={prev} next={next} />
    </article>
  );
}
