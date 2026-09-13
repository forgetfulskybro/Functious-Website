import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { SCHEDULE_GUIDE, findChapter } from '@/data/guides';

export default function ScheduleCommands() {
  const chapter = findChapter(SCHEDULE_GUIDE, 'commands')!;
  return (
    <GuidePage guide={SCHEDULE_GUIDE} chapter={chapter} description="Schedule a poll, giveaway, or personal reminder to fire at any future time.">

      <GuideSection title="Scheduling a poll">
        <p>
          Use the same pipe-separated format as <code className="font-mono text-orange-light">f!polls</code>, but
          prefix it with <code className="font-mono text-orange-light">f!schedule poll</code>. The bot asks for the
          send time after you provide the arguments.
        </p>
        <CodeBlock title="Fluxer" code="f!schedule poll 1h | Favourite colour? | Red | Blue | Green" />
        <Callout>
          The poll duration starts from the scheduled send time, not from when you run the
          command. A 1h poll scheduled for tomorrow will run for 1 hour starting tomorrow.
        </Callout>
      </GuideSection>

      <GuideSection title="Scheduling a giveaway">
        <p>
          Use <code className="font-mono text-orange-light">f!schedule giveaway</code> followed by duration, winner
          count, and prize separated by <code className="font-mono text-orange-light">|</code>:
        </p>
        <CodeBlock title="Fluxer" code="f!schedule giveaway 24h | 3 | Plutonium" />
        <p>
          As with polls, the giveaway duration begins at the scheduled send time.
        </p>
      </GuideSection>

      <GuideSection title="Scheduling a reminder">
        <p>
          Reminders are sent to the channel where the command is run (or via DM if you
          use <code className="font-mono text-orange-light">f!remind dm</code>). Schedule one ahead of time with:
        </p>
        <CodeBlock title="Fluxer" code="f!schedule remind Don't forget to post the weekly update" />
        <p>The bot then asks you when to send it.</p>
      </GuideSection>

      <GuideSection title="Sending to a different channel">
        <p>
          Mention a channel before the arguments to send the scheduled command output there:
        </p>
        <CodeBlock title="Fluxer" code="f!schedule giveaway #giveaways 24h | 1 | Steam key" />
      </GuideSection>
    </GuidePage>
  );
}
