import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { SCHEDULE_GUIDE, findChapter } from '@/data/guides';

export default function ScheduleContent() {
  const chapter = findChapter(SCHEDULE_GUIDE, 'content')!;
  return (
    <GuidePage guide={SCHEDULE_GUIDE} chapter={chapter} description="Schedule a plain text message or a fully customised rich embed to be sent at any future time.">

      <GuideSection title="Scheduling a text message">
        <p>
          Start the setup by specifying the type and optionally a target channel. If you omit the
          channel, the message will be sent in the channel where you run the command.
        </p>
        <CodeBlock title="Fluxer" code="f!schedule content" />
        <CodeBlock title="Fluxer -different channel" code="f!schedule content #announcements" />
        <p>
          The bot deletes your command and posts a prompt asking for the message content. Type
          any message - you can use the dynamic variables listed in the{' '}
          <a className="text-orange-light underline-offset-4 hover:underline" href="/guides/schedule/recurring">
            Recurring & Webhooks
          </a>{' '}
          chapter.
        </p>
      </GuideSection>

      <GuideSection title="Scheduling a rich embed">
        <p>Use <code className="font-mono text-orange-light">embed</code> instead of <code className="font-mono text-orange-light">content</code> to build an embed interactively:</p>
        <CodeBlock title="Fluxer" code="f!schedule embed #announcements" />
        <p>
          The bot posts a live preview embed alongside the setup instructions. Work through the
          fields using the edit tags listed below. Say <code className="font-mono text-orange-light">skip</code> to skip a field. React ✅ when the embed looks right.
        </p>
        <Callout title="Edit tags for embeds">
          <code className="font-mono text-orange-light">{'{title:...}'}</code> · <code className="font-mono text-orange-light">{'{desc:...}'}</code> · <code className="font-mono text-orange-light">{'{footer:...}'}</code> · <code className="font-mono text-orange-light">{'{image:URL}'}</code> · <code className="font-mono text-orange-light">{'{thumb:URL}'}</code> · <code className="font-mono text-orange-light">{'{author:...}'}</code> · <code className="font-mono text-orange-light">{'{color:#HEX}'}</code> · <code className="font-mono text-orange-light">{'{url:URL}'}</code>
        </Callout>
      </GuideSection>

      <GuideSection title="Setting the send time">
        <p>
          After content is set, the bot asks when to send it. You can use natural language or
          short formats:
        </p>
        <CodeBlock title="Natural language" code={'tomorrow at 9am\nnext Monday at 8pm\nin 2 hours 30 minutes'} />
        <CodeBlock title="Short formats" code={'2h30m\n1d\n30m'} />
        <Callout>
          Set your timezone with <code className="font-mono text-orange-light">f!timezone set America/New_York</code> for
          accurate time parsing. Without a timezone the bot assumes UTC.
        </Callout>
      </GuideSection>

      <GuideSection title="Dynamic variables">
        <p>Use these placeholders inside your message -they are replaced when the message is sent:</p>
        <CodeBlock title="Variables" code={'{user} - mention of the creator\n{username} - name\n{server} - server name\n{members} - member count\n{channel} - target channel\n{time} - current timestamp\n{count} - how many times this recurring message has fired'} />
        <p>You can also define custom variables:</p>
        <CodeBlock title="Custom variable" code={'{winner = "Alice"}\nCongrats {winner}!'} />
      </GuideSection>
    </GuidePage>
  );
}
