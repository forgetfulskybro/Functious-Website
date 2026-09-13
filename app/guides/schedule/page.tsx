import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ScheduledMessagesDemo from '@/components/home/SchedulesDemo';
import { SCHEDULE_GUIDE, findChapter, chapterHref } from '@/data/guides';

export default function ScheduleOverview() {
  const chapter = findChapter(SCHEDULE_GUIDE, '')!;
  return (
    <GuidePage guide={SCHEDULE_GUIDE} chapter={chapter} description="Schedule any message to fire once or on a recurring schedule - plain text, rich embeds, polls, giveaways, or reminders.">
      <GuideSection title="What you can schedule">
        <ul className="list-disc space-y-2 pl-5">
          <li><span className="font-semibold text-white">Text messages</span> - any plain message, supports dynamic variables like <code className="font-mono text-orange-light">{'{members}'}</code> and <code className="font-mono text-orange-light">{'{time}'}</code>.</li>
          <li><span className="font-semibold text-white">Rich embeds</span> - full embeds with title, description, image, author, footer, and color.</li>
          <li><span className="font-semibold text-white">Polls</span> - schedule a timed poll to start at a future time.</li>
          <li><span className="font-semibold text-white">Giveaways</span> - schedule a giveaway to start automatically.</li>
          <li><span className="font-semibold text-white">Reminders</span> - personal reminders sent to you in DM or the current channel.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          All <code className="font-mono text-orange-light">f!schedule</code> subcommands require
          Manage Guild. Up to 10 scheduled messages are allowed per server.
        </Callout>
      </GuideSection>

      <GuideSection title="Quick start">
        <p>Start a text message setup in <code className="font-mono text-orange-light">#announcements</code>:</p>
        <CodeBlock title="Fluxer" code="f!schedule content #announcements" />
        <p>The bot prompts you to type your message, then asks for the send time in natural language:</p>
        <CodeBlock title="Fluxer" code="tomorrow at 9am" />
        <p>You can also use short formats:</p>
        <CodeBlock title="Fluxer" code="2h30m" />
        <p>When done, it asks whether to make it recurring and whether to use a webhook.</p>
      </GuideSection>

      <ScheduledMessagesDemo />


      <GuideSection title="Chapters in this guide">
        <ul className="list-none space-y-3">
          {SCHEDULE_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(SCHEDULE_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">{String(SCHEDULE_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}</span>
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
