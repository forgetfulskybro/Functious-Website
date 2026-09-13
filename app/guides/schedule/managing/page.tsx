import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { SCHEDULE_GUIDE, findChapter } from '@/data/guides';

export default function ScheduleManaging() {
  const chapter = findChapter(SCHEDULE_GUIDE, 'managing')!;
  return (
    <GuidePage guide={SCHEDULE_GUIDE} chapter={chapter} description="View, edit, and delete scheduled messages.">

      <GuideSection title="Viewing scheduled messages">
        <p>List all pending schedules for the server:</p>
        <CodeBlock title="Fluxer" code="f!schedule view" />
        <p>View full details of a specific entry by its number:</p>
        <CodeBlock title="Fluxer" code="f!schedule view 2" />
        <p>
          The list shows the type, target channel, send time, and icons for recurring (🔁) and
          webhook (🕸) entries.
        </p>
      </GuideSection>

      <GuideSection title="Editing a scheduled message">
        <p>
          Open an interactive edit menu for any entry by its list number. The menu lets you
          change the content, send time, recurring setting, or webhook:
        </p>
        <CodeBlock title="Fluxer" code="f!schedule edit 1" />
        <p>
          React with the numbered emoji for the field you want to change. The bot walks you
          through that field the same way as during creation. React ❌ to cancel without saving.
        </p>
        <Callout>
          Only one edit session can be open at a time per user. Run{' '}
          <code className="font-mono text-orange-light">f!schedule stop</code> to cancel an active session.
        </Callout>
      </GuideSection>

      <GuideSection title="Deleting scheduled messages">
        <p>Delete by list number. Multiple numbers can be comma-separated:</p>
        <CodeBlock title="Fluxer" code={'f!schedule delete 3\nf!schedule delete 1,2,4'} />
      </GuideSection>

      <GuideSection title="Cancelling a setup in progress">
        <p>If you started a schedule but want to abandon it:</p>
        <CodeBlock title="Fluxer" code="f!schedule stop" />
      </GuideSection>
    </GuidePage>
  );
}
