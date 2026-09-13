import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { SCHEDULE_GUIDE, findChapter } from '@/data/guides';

export default function ScheduleRecurring() {
  const chapter = findChapter(SCHEDULE_GUIDE, 'recurring')!;
  return (
    <GuidePage guide={SCHEDULE_GUIDE} chapter={chapter} description="Make a scheduled message repeat automatically, or send it through a webhook with a custom name and avatar.">

      <GuideSection title="Recurring schedules">
        <p>
          After content and send time are set, the bot asks how often it should repeat.
          Type one of the options - or <code className="font-mono text-orange-light">none</code> to send once.
        </p>
        <CodeBlock title="Options" code={'none - send once (default)\ndaily - every 24 hours\nweekly - every 7 days\nmonthly - every 30 days'} />
        <p>For fine-grained control, use a cron expression:</p>
        <CodeBlock title="Cron format" code={'cron:min hour dom mon dow\n\n# Examples:\ncron:0 9 * * 1 - every Monday at 9 AM\ncron:30 18 1 * * - 1st of every month at 6:30 PM\ncron:*/10 * * * * - every 10 minutes (minimum interval)'} />
        <Callout title="Minimum interval">
          The shortest allowed recurring interval is 10 minutes (<code className="font-mono text-orange-light">cron:*/10 * * * *</code>).
        </Callout>
      </GuideSection>

      <GuideSection title="Webhooks">
        <p>
          After the recurring choice, the bot asks if you want to send via a webhook. Webhooks
          let the message appear under a custom name and avatar instead of the bot&apos;s profile.
        </p>
        <p>Type <code className="font-mono text-orange-light">yes</code> to configure, or <code className="font-mono text-orange-light">no</code> to skip.</p>
        <p>If you choose yes, the bot asks for:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-semibold text-white">Name</span> - displayed as the sender name. Type <code className="font-mono text-orange-light">skip</code> to use the bot&apos;s name.</li>
          <li><span className="font-semibold text-white">Avatar URL</span> - a direct image link (<code className="font-mono text-orange-light">https://…png</code>). Type <code className="font-mono text-orange-light">skip</code> to use the bot&apos;s avatar.</li>
        </ul>
        <Callout>
          The bot creates the webhook, sends the message through it, then deletes the webhook.
          No permanent webhooks are left in your channel.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
