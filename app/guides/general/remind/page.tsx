import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { GENERAL_GUIDE, findChapter } from '@/data/guides';

export default function RemindGuide() {
  const chapter = findChapter(GENERAL_GUIDE, 'remind')!;
  return (
    <GuidePage
      guide={GENERAL_GUIDE}
      chapter={chapter}
      description="Set a personal reminder and Functious will ping you in the channel or via DM when the time comes."
    >
      <GuideSection title="Setting a reminder">
        <p>
          Provide a time and then your reminder message. Natural language and short formats both
          work:
        </p>
        <CodeBlock title="Natural language" code={'f!remind in 2 hours Take a break\nf!remind tomorrow at 9am Team meeting\nf!remind next Monday at 5pm Submit report'} />
        <CodeBlock title="Short formats" code={'f!remind 30m Check the oven\nf!remind 1h30m Review pull request\nf!remind 2d Renew subscription'} />
      </GuideSection>

      <GuideSection title="DM reminders">
        <p>
          Add <code className="font-mono text-orange-light">dm</code> as the first argument to receive the reminder
          as a DM instead of in the channel. The command message is deleted and a confirmation
          DM is sent immediately:
        </p>
        <CodeBlock title="Fluxer" code="f!remind dm 1h Take a break" />
        <Callout>
          DM reminders require that you have DMs from server members enabled in your Fluxer
          privacy settings.
        </Callout>
      </GuideSection>

      <GuideSection title="Viewing your reminders">
        <CodeBlock title="Fluxer" code="f!remind list" />
        <p>You can have up to 10 active reminders at a time.</p>
      </GuideSection>

      <GuideSection title="Deleting a reminder">
        <p>
          Use the index number shown in <code className="font-mono text-orange-light">f!remind list</code>:
        </p>
        <CodeBlock title="Fluxer" code="f!remind delete 2" />
      </GuideSection>

      <GuideSection title="Limits">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Minimum time: 1 minute in the future.</li>
          <li>Maximum time: 2 years.</li>
          <li>Maximum message length: 500 characters.</li>
          <li>Maximum active reminders per user: 10.</li>
        </ul>
      </GuideSection>
    </GuidePage>
  );
}
