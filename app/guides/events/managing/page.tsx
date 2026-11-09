import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { EVENTS_GUIDE, findChapter } from '@/data/guides';

export default function EventsManaging() {
  const chapter = findChapter(EVENTS_GUIDE, 'managing')!;

  return (
    <GuidePage
      guide={EVENTS_GUIDE}
      chapter={chapter}
      description="Find events, review attendees, edit details, add reminders, and close an event without losing its history."
    >
      <GuideSection title="Event commands">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!events list [upcoming|past|all]', 'Browse events. Defaults to upcoming events.'],
            ['f!events view <messageId>', 'Post the current event card and live counts.'],
            ['f!events who <messageId>', 'Show a paginated list of every RSVP and its status.'],
            ['f!events edit <messageId> [flags]', 'Change the event using the same flags as event creation.'],
            ['f!events remind <messageId> <offset> [dm]', 'Add a reminder before the event. Use `dm` to send it by DM too.'],
            ['f!events remind <messageId> none', 'Clear every reminder on the event.'],
            ['f!events cancel <messageId> [reason]', 'Mark the event cancelled and optionally add a reason.'],
            ['f!events delete <messageId>', 'Permanently delete the event, its RSVPs, and its card.'],
          ]}
        />
        <p>
          Replace <code className="font-mono text-orange-light">&lt;messageId&gt;</code> with the
          ID of the event card. The event channel must still be accessible to the bot.
        </p>
      </GuideSection>

      <GuideSection title="Editing an event">
        <p>
          <code className="font-mono text-orange-light">f!events edit</code> accepts the same flags
          as creation, so you can change the description, time, location, capacity, reminders,
          colors, RSVP options, or recurrence. Use{' '}
          <code className="font-mono text-orange-light">title:</code> to rename the event.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!events edit 123456789012345678 | capacity:30 | remind:48h,2h\nf!events edit 123456789012345678 | title:Community Game Night | location:Voice Lounge`}
        />
        <p>
          If you change <code className="font-mono text-orange-light">channel:</code>, the bot moves
          the card to the new channel and keeps the existing RSVPs. The old card is deleted.
        </p>
        <Callout title="Host or Manage Guild">
          The event host and members with Manage Guild can edit an event. Other members can view it
          but cannot change it.
        </Callout>
      </GuideSection>

      <GuideSection title="Reminders">
        <p>
          Add a reminder by sending an offset before the start time. The minimum offset is one
          minute, and <code className="font-mono text-orange-light">dm</code> sends the reminder by
          DM as well as posting it in the channel.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!events remind 123456789012345678 24h\nf!events remind 123456789012345678 1h dm\nf!events remind 123456789012345678 none`}
        />
        <p>
          Run the command without an offset to list the current reminders. Use{' '}
          <code className="font-mono text-orange-light">none</code> to clear them all.
        </p>
      </GuideSection>

      <GuideSection title="Cancelling or deleting">
        <p>
          Cancelling keeps the card and its RSVP history, updates the status, and optionally adds
          your reason to the description. Use it when the event is called off but you still want
          members to see what happened.
        </p>
        <p>
          Deleting removes the event card, every RSVP, and any event attendee roles. This cannot be
          undone.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!events cancel 123456789012345678 Severe weather warning\nf!events delete 123456789012345678`}
        />
        <p>
          Both commands are available to the event host and members with Manage Guild. Cancelled
          and ended events cannot be edited or reminded again.
        </p>
      </GuideSection>

      <GuideSection title="Recurring event maintenance">
        <p>
          A recurring event keeps its frequency and optional end date. When the next occurrence is
          created, the new card starts with fresh RSVP counts, while the original event remains in
          the past-events list. Cancel or delete the current event if you want to stop future
          occurrences.
        </p>
      </GuideSection>

      <GuideSection title="Dashboard">
        <p>
          The dashboard Events page supports the same management flow without command IDs. Use it
          to review upcoming and past events, edit event details, check RSVPs, and remove events
          that are no longer needed.
        </p>
      </GuideSection>
    </GuidePage>
  );
}
