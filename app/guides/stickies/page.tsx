import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { STICKIES_GUIDE, findChapter } from '@/data/guides';

export default function StickiesOverview() {
  const chapter = findChapter(STICKIES_GUIDE, '')!;

  return (
    <GuidePage
      guide={STICKIES_GUIDE}
      chapter={chapter}
      description="Keep rules, links, or welcome notes at the bottom of a channel. The bot removes the old sticky and reposts it whenever a new message arrives."
    >
      <GuideSection title="What Sticky Messages can do">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-white">Always visible</span> - the sticky is
            reposted at the bottom of the channel when new messages push it up.
          </li>
          <li>
            <span className="font-semibold text-white">Three formats</span> - plain text, a rich
            embed, or a Rune script.
          </li>
          <li>
            <span className="font-semibold text-white">Per-sticky controls</span> - set the repost
            delay, mention policy, channel, and enabled state independently.
          </li>
          <li>
            <span className="font-semibold text-white">Dashboard management</span> - create and
            edit stickies from the Stickies page without using commands.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          Creating and managing sticky messages requires Manage Guild. Members do not need any
          permission to see the sticky.
        </Callout>
      </GuideSection>

      <GuideSection title="Creating a sticky">
        <p>Open the editor in the current channel:</p>
        <CodeBlock title="Fluxer" code="f!sticky create" />
        <p>Or choose the target channel when you start:</p>
        <CodeBlock title="Fluxer" code="f!sticky create #rules" />
        <p>
          The editor asks you to choose a type. React with 1 for a plain message, 2 for an embed,
          or 3 for a Rune script. Type <code className="font-mono text-orange-light">stop</code>{' '}
          at any time to cancel an open editor.
        </p>
        <p>
          Run <code className="font-mono text-orange-light">f!sticky</code> with no subcommand to
          see the command overview.
        </p>
      </GuideSection>

      <GuideSection title="Sticky types">
        <ProseTable
          headers={['Type', 'Best for']}
          rows={[
            ['Message', 'Rules, links, welcome text, or a short announcement.'],
            ['Embed', 'A formatted card with a title, description, color, image, footer, and author.'],
            ['Rune script', 'Dynamic content built with values, conditions, loops, and the Rune API.'],
          ]}
        />
        <p>
          Message and embed fields support placeholders:{' '}
          <code className="font-mono text-orange-light">{'{community}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{members}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{user}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{username}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{channel}'}</code>, and{' '}
          <code className="font-mono text-orange-light">{'{count}'}</code>.
        </p>
        <CodeBlock
          title="Rune example"
          code={`say("Welcome to " + $guild.name)\nsay(embed().title("Rules").description("Be kind and have fun.").color("blurple"))`}
        />
      </GuideSection>

      <GuideSection title="Mentions and delays">
        <p>
          Sticky messages do not ping anyone by default. Use{' '}
          <code className="font-mono text-orange-light">f!sticky mentions &lt;number&gt; none</code>{' '}
          to keep it that way, or allow <code className="font-mono text-orange-light">users</code>,{' '}
          <code className="font-mono text-orange-light">roles</code>, or{' '}
          <code className="font-mono text-orange-light">everyone</code>.
        </p>
        <p>
          The repost delay controls how long the bot waits after the triggering message before it
          removes the old sticky and posts a fresh one. Delays can be between{' '}
          <span className="font-semibold text-white">1 and 60 seconds</span>.
        </p>
      </GuideSection>

      <GuideSection title="Limits">
        <ul className="list-disc space-y-2 pl-5">
          <li>Up to <span className="font-semibold text-white">10 stickies</span> per community.</li>
          <li>Only <span className="font-semibold text-white">one sticky per channel</span>.</li>
          <li>Delays can be between <span className="font-semibold text-white">1 and 60 seconds</span>.</li>
          <li>The bot needs permission to send messages and manage its old sticky messages in the channel.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Dashboard">
        <p>
          The Stickies page in the dashboard supports creating and managing stickies without
          commands. It is available from your community&apos;s dashboard sidebar.
        </p>
      </GuideSection>
    </GuidePage>
  );
}
