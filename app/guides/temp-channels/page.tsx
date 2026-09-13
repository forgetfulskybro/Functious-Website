import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { TEMP_CHANNELS_GUIDE, findChapter, chapterHref } from '@/data/guides';

export default function TempChannelsOverview() {
  const chapter = findChapter(TEMP_CHANNELS_GUIDE, '')!;
  return (
    <GuidePage guide={TEMP_CHANNELS_GUIDE} chapter={chapter} description="Temp channels create a private voice channel for each member the moment they join a designated 'Join to Create' channel -and delete it when they leave.">
      <GuideSection title="How it works">
        <p>
          The bot creates a single voice channel called "Join To Create". When any member joins
          it, a new temporary channel is automatically created for them and they are moved into
          it. When the last person leaves, the channel is deleted. No stale channels accumulate.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><span className="font-semibold text-white">Automatic creation and deletion</span> - the bot handles the whole lifecycle.</li>
          <li><span className="font-semibold text-white">Custom names</span> - set a base name; add <code className="font-mono text-orange-light">{'{counting}'}</code> to number them.</li>
          <li><span className="font-semibold text-white">Manage panel</span> - an optional channel where owners can rename, limit, block users, and more.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild + Manage Channels + Move Members">
          The setup command requires Manage Guild from you, and the bot needs Manage Channels and
          Move Members to create and move users into temporary channels.
        </Callout>
      </GuideSection>

      <GuideSection title="Quick start">
        <p>The fastest setup - creates a category, a "Join To Create" channel, and saves the config in one step:</p>
        <CodeBlock title="Fluxer" code="f!tc set default" />
        <p>Custom name with a user limit and a management panel:</p>
        <CodeBlock title="Fluxer" code="f!tc set config {name:🎮 Room} {limit:5} {manage}" />
      </GuideSection>

      <GuideSection title="Chapters in this guide">
        <ul className="list-none space-y-3">
          {TEMP_CHANNELS_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(TEMP_CHANNELS_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">{String(TEMP_CHANNELS_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}</span>
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
