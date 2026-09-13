import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { GIVEAWAY_GUIDE, findChapter, chapterHref } from '@/data/guides';

export default function GiveawayOverview() {
  const chapter = findChapter(GIVEAWAY_GUIDE, '')!;
  return (
    <GuidePage
      guide={GIVEAWAY_GUIDE}
      chapter={chapter}
      description="Giveaways let members enter by reacting to a message. The bot picks winners randomly when the timer ends."
    >
      <GuideSection title="How it works">
        <p>
          Run the command with a duration, winner count, and prize. The bot posts an embed in the
          target channel and adds a confetti reaction. Members click the reaction to enter. When
          the timer expires the bot picks winners at random, announces them, and DMs them if that
          option is on.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><span className="font-semibold text-white">Up to 15 active giveaways</span> per server at a time.</li>
          <li><span className="font-semibold text-white">Up to 50 winners</span> per giveaway.</li>
          <li><span className="font-semibold text-white">Optional flags</span> - channel redirect, DM winners, ping winners, entry requirement, image, and more.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          Creating, deleting, and rerolling giveaways requires the Manage Guild permission.
          Members do not need any special permission to enter.
        </Callout>
      </GuideSection>

      <GuideSection title="Quick start">
        <p>A basic 20-minute giveaway with 3 winners:</p>
        <CodeBlock title="Fluxer" code="f!giveaway 20m | 3 | A t-shirt" />
        <p>To post in a different channel, add <code className="font-mono text-orange-light">channel:#giveaways</code>:</p>
        <CodeBlock title="Fluxer" code="f!giveaway 20m | 3 | A t-shirt | channel:#giveaways" />
      </GuideSection>

      <GuideSection title="Chapters in this guide">
        <ul className="list-none space-y-3">
          {GIVEAWAY_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(GIVEAWAY_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">
                  {String(GIVEAWAY_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white transition-colors group-hover:text-orange-light">
                    {item.title}
                  </span>
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
