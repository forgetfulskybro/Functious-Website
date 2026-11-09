import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { EVENTS_GUIDE, findChapter } from '@/data/guides';

export default function EventsOverview() {
  const chapter = findChapter(EVENTS_GUIDE, '')!;

  return (
    <GuidePage
      guide={EVENTS_GUIDE}
      chapter={chapter}
      description="Create a community event once, collect Going, Maybe, and Declined RSVPs, and keep attendees updated with reminders, capacity limits, and recurrence."
    >
      <GuideSection title="What Events can do">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-white">Live RSVP cards</span> - members react with
            Going, Maybe, or Declined, and the event message updates its counts.
          </li>
          <li>
            <span className="font-semibold text-white">Capacity and waitlists</span> - set a Going
            limit and show waitlist totals when the event fills up.
          </li>
          <li>
            <span className="font-semibold text-white">Automatic reminders</span> - post reminders
            before the event, in the event channel or by DM.
          </li>
          <li>
            <span className="font-semibold text-white">Recurring events</span> - repeat daily,
            weekly, or monthly until an optional end date.
          </li>
          <li>
            <span className="font-semibold text-white">Dashboard management</span> - create and
            manage events from the Events page without using commands.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          Creating an event, previewing it, and using the setup wizard require Manage Guild. The
          event host or a member with Manage Guild can edit, remind, cancel, or delete an event.
          Everyone can list, view, and check the attendee list for an event.
        </Callout>
      </GuideSection>

      <GuideSection title="Quick start">
        <p>Open the guided setup and answer the prompts in the channel:</p>
        <CodeBlock title="Fluxer" code="f!events setup" />
        <p>
          Send <code className="font-mono text-orange-light">skip</code> to leave an optional
          prompt blank, or <code className="font-mono text-orange-light">cancel</code> to stop.
          After the questions, the bot posts a preview and asks you to confirm it.
        </p>
        <p>You can also create an event in one command:</p>
        <CodeBlock
          title="Fluxer"
          code={`f!events create Game Night | 2026-11-14 20:00 | tz:Europe/London | channel:#events | capacity:20 | remind:24h,1h`}
        />
        <p>
          The command form is <code className="font-mono text-orange-light">f!events create &lt;title&gt; | &lt;when&gt; | [flags]</code>.
          Use <code className="font-mono text-orange-light">f!events preview</code> with the same
          arguments to preview without creating anything.
        </p>
      </GuideSection>

      <GuideSection title="Event flags">
        <ProseTable
          headers={['Flag', 'What it does']}
          rows={[
            ['`desc:`', 'Description shown on the event card.'],
            ['`end:`', 'End time. Required for recurring events.'],
            ['`tz:`', 'IANA timezone for the event, such as `Europe/London`.'],
            ['`channel:`', 'Channel where the event card is posted. Defaults to the current channel.'],
            ['`location:`', 'Location shown on the card.'],
            ['`capacity:`', 'Maximum number of Going RSVPs, from 1 to 1000.'],
            ['`waitlist:`', 'Enable or disable the waitlist with `yes` or `no`.'],
            ['`remind:`', 'Comma-separated reminder offsets, such as `24h,1h`. Minimum offset is 1 minute.'],
            ['`dm:`', 'Also send reminders by DM.'],
            ['`ping:`', 'Role to ping for the event.'],
            ['`require:`', 'Role required to RSVP.'],
            ['`repeat:`', '`daily`, `weekly`, or `monthly`.'],
            ['`repeatuntil:`', 'Stop recurring after this time.'],
            ['`color:`', 'Event accent color, such as `#A52F05`.'],
            ['`image:`', 'HTTP or HTTPS image URL for the event card.'],
            ['`footer:`', 'Custom footer template for the card.'],
            ['`going:` `maybe:` `declined:`', 'Custom emojis for the three RSVP reactions.'],
            ['`goinglabel:` `maybelabel:` `declinedlabel:`', 'Custom labels for the RSVP choices.'],
          ]}
        />
        <p>
          Description and footer templates support{' '}
          <code className="font-mono text-orange-light">{'{title}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{host}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{start}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{end}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{location}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{capacity}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{going}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{waitlist}'}</code>, and{' '}
          <code className="font-mono text-orange-light">{'{requirements}'}</code>.
        </p>
      </GuideSection>

      <GuideSection title="Time formats">
        <p>The start and end time accept any of these formats:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><code className="font-mono text-orange-light">YYYY-MM-DD HH:mm</code> - a date and time.</li>
          <li><code className="font-mono text-orange-light">YYYY-MM-DD</code> - a date at midnight.</li>
          <li>A Unix timestamp, such as <code className="font-mono text-orange-light">&lt;t:1763150400&gt;</code>.</li>
          <li>A relative duration, such as <code className="font-mono text-orange-light">2h</code> or <code className="font-mono text-orange-light">3d</code>.</li>
        </ul>
        <p>
          Add <code className="font-mono text-orange-light">tz:</code> when the time should be read
          in a timezone other than the host&apos;s saved timezone.
        </p>
      </GuideSection>

      <GuideSection title="RSVPs, capacity, and waitlists">
        <p>
          Members react with the configured Going, Maybe, and Declined emojis. The card keeps the
          counts up to date and the <code className="font-mono text-orange-light">who</code>{' '}
          command shows the full attendee list.
        </p>
        <p>
          With <code className="font-mono text-orange-light">capacity:</code> set, the card shows
          Going against the limit and tracks waitlisted members. Set{' '}
          <code className="font-mono text-orange-light">waitlist:no</code> if you do not want a
          waitlist. Use <code className="font-mono text-orange-light">require:</code> to limit
          RSVPs to a role.
        </p>
      </GuideSection>

      <GuideSection title="Recurring events">
        <p>
          Add <code className="font-mono text-orange-light">repeat:daily</code>,{' '}
          <code className="font-mono text-orange-light">repeat:weekly</code>, or{' '}
          <code className="font-mono text-orange-light">repeat:monthly</code> to run an event more
          than once. Recurring events need an <code className="font-mono text-orange-light">end:</code>{' '}
          time, and the bot schedules the next occurrence automatically.
        </p>
        <p>
          Add <code className="font-mono text-orange-light">repeatuntil:</code> to stop after a
          specific time. Without it, the event keeps repeating until you cancel or delete it.
        </p>
      </GuideSection>

      <GuideSection title="Limits and channel permissions">
        <ul className="list-disc space-y-2 pl-5">
          <li>Up to <span className="font-semibold text-white">25 active events</span> per community.</li>
          <li>Capacity can be between <span className="font-semibold text-white">1 and 1000</span>.</li>
          <li>An event can last up to <span className="font-semibold text-white">30 days</span>.</li>
          <li>
            The bot needs View Channel, Send Messages, Embed Links, and Add Reactions in the event
            channel.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Dashboard">
        <p>
          The Events page in the dashboard can create, edit, and manage events alongside the
          Discord commands. Open it from your community&apos;s dashboard sidebar under Events.
        </p>
      </GuideSection>
    </GuidePage>
  );
}
