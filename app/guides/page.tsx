import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES, guideRoot } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Guides | Functious',
  description:
    'Documentation for Functious. Learn Rune, the tag scripting language, and browse the guides that follow.',
};

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-bg-dark">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Guides</h1>
          <p className="mt-4 text-lg text-white/60">
            Step-by-step documentation for the tools behind Functious. Each guide is a short
            series of chapters you can read in order.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={guideRoot(guide)}
              className="group rounded-xl border border-white/10 bg-[#140b08] p-5 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              <span className="block text-lg font-semibold text-white transition-colors group-hover:text-orange-light">
                {guide.title}
              </span>
              <span className="block text-sm text-orange-light/80">{guide.tagline}</span>
              <span className="mt-3 block text-sm leading-relaxed text-white/60">
                {guide.description}
              </span>
              <span className="mt-4 block text-xs text-white/40">
                {guide.chapters.length} chapters
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
