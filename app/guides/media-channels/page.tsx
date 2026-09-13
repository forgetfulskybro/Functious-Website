import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { MEDIA_CHANNELS_GUIDE, findChapter, chapterHref } from '@/data/guides';

export default function MediaChannelsOverview() {
  const chapter = findChapter(MEDIA_CHANNELS_GUIDE, '')!;
  return (
    <GuidePage guide={MEDIA_CHANNELS_GUIDE} chapter={chapter} description="Turn any text channel into a media-only zone. The bot silently deletes anything that doesn't match your allowed content types.">
      <GuideSection title="What it does">
        <p>
          Once a channel is configured, every message is checked. If it contains no attachment or
          link that matches the allowed types, it is deleted automatically. The sender is not
          notified -the message simply disappears, keeping the channel clean.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><span className="font-semibold text-white">Filter by type</span> - any attachment, images only, videos only, files only, or links.</li>
          <li><span className="font-semibold text-white">Content rating</span> - adds ⬆️/⬇️ reactions; auto-deletes when downvotes exceed a threshold.</li>
          <li><span className="font-semibold text-white">Sticky message</span> - re-posts a reminder after each new post with a short delay.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          All <code className="font-mono text-orange-light">f!mc</code> subcommands require
          Manage Guild. Members do not need any special permission to post.
        </Callout>
      </GuideSection>

      <GuideSection title="Quick start">
        <p>Add a channel with one command. Without any flags it defaults to allowing any attachment.</p>
        <CodeBlock title="Fluxer" code="f!mc add #media" />
        <p>To restrict to images only and add rating reactions:</p>
        <CodeBlock title="Fluxer" code="f!mc add #media --images --rating" />
        <p>Remove a channel when you want to stop enforcing it:</p>
        <CodeBlock title="Fluxer" code="f!mc remove #media" />
      </GuideSection>

      <GuideSection title="Chapters in this guide">
        <ul className="list-none space-y-3">
          {MEDIA_CHANNELS_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(MEDIA_CHANNELS_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">{String(MEDIA_CHANNELS_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}</span>
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
