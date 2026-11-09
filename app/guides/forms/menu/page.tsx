import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { FORMS_GUIDE, findChapter } from '@/data/guides';

export default function FormsMenu() {
  const chapter = findChapter(FORMS_GUIDE, 'menu')!;
  return (
    <GuidePage
      guide={FORMS_GUIDE}
      chapter={chapter}
      description="Form Menu puts every form setting on a paginated reaction menu, so you can build and edit a form without memorising a command for each field."
    >
      <GuideSection title="Opening the menu">
        <p>
          Form Menu opens automatically after a form is created, or whenever you run{' '}
          <code className="font-mono text-orange-light">f!forms setup</code> or{' '}
          <code className="font-mono text-orange-light">f!forms edit &lt;form&gt;</code>. If the
          community has more than one form, <code className="font-mono text-orange-light">f!forms setup</code>{' '}
          opens a paginated picker first.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!forms create StaffApp\nf!forms setup\nf!forms setup StaffApp\nf!forms edit StaffApp`}
        />
        <Callout title="One editor, fewer commands">
          The existing field commands still work, but the menu is the fastest way to change
          several settings in a row.
        </Callout>
      </GuideSection>

      <GuideSection title="Moving around">
        <p>
          Use the arrows to move between pages. The footer shows your current page and section.
          Question lists are split into pages of five, and those question pages are part of the
          same arrow navigation.
        </p>
        <ProseTable
          headers={['Reaction', 'Action']}
          rows={[
            ['⏪', 'Jump to the first page.'],
            ['⬅️', 'Previous page.'],
            ['➡️', 'Next page.'],
            ['⏩', 'Jump to the last page.'],
            ['❌', 'Close the menu from a normal page.'],
          ]}
        />
        <p>
          When a question is open, the same arrows browse individual questions instead of moving
          between sections. React ↩️ to return to the question list.
        </p>
      </GuideSection>

      <GuideSection title="What each page edits">
        <ProseTable
          headers={['Page', 'Settings']}
          rows={[
            ['Basics', 'Name, description, panel color, panel image, and panel emoji.'],
            ['Questions', 'Add, edit, reorder, and delete questions. Questions are shown five per page.'],
            ['Access', 'Panel channel, review channel, reviewer roles, and roles required to submit.'],
            ['Behavior', 'Cooldown, multiple submissions, accepted-submission limit, reviewer pings, applicant DMs, and anonymous review.'],
            ['Messages', 'Intro, confirmation, accept, and decline message templates.'],
            ['Publish', 'Preview the panel, open or close the form, and publish the reaction panel.'],
          ]}
        />
      </GuideSection>

      <GuideSection title="Editing Basics">
        <p>
          React <code className="font-mono text-orange-light">1️⃣</code> through{' '}
          <code className="font-mono text-orange-light">5️⃣</code> to edit the matching value:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-semibold text-white">1 Name</span> - the form and panel title.</li>
          <li><span className="font-semibold text-white">2 Description</span> - shown on the published panel.</li>
          <li><span className="font-semibold text-white">3 Panel color</span> - a six-digit hex color such as <code className="font-mono text-orange-light">#A52F05</code>.</li>
          <li><span className="font-semibold text-white">4 Panel image</span> - an http(s) image URL.</li>
          <li><span className="font-semibold text-white">5 Panel emoji</span> - the reaction members use to start the form.</li>
        </ul>
        <p>
          When a setting needs free text, the menu replaces the reactions with a prompt. Reply in
          the same channel; type <code className="font-mono text-orange-light">cancel</code> to leave
          the setting unchanged. Optional values also accept{' '}
          <code className="font-mono text-orange-light">clear</code>.
        </p>
      </GuideSection>

      <GuideSection title="Building questions">
        <p>
          On the Questions page, react with a number to open a question or with{' '}
          <code className="font-mono text-orange-light">➕</code> to add one. Choosing a type opens a
          prompt for the question text; choice questions use the same pipe-separated format as the
          command fallback:
        </p>
        <CodeBlock title="Choice format" code="Prompt | Option 1 | Option 2" />
        <p>
          At least two choices are required, and up to ten are supported. New questions start as
          required; use the required toggle in the question detail view to mark one optional.
        </p>
        <ProseTable
          headers={['Control', 'Action']}
          rows={[
            ['1️⃣', 'Edit the prompt.'],
            ['2️⃣', 'Change the type between short text, paragraph, and multiple choice.'],
            ['3️⃣', 'Toggle required on or off.'],
            ['4️⃣', 'Edit the choices on a multiple-choice question.'],
            ['5️⃣', 'Move the question up one position.'],
            ['6️⃣', 'Move the question down one position.'],
            ['🗑️', 'Delete the question after confirming with ✅.'],
            ['↩️', 'Return to the question list.'],
            ['⏪ ⬅️ ➡️ ⏩', 'Browse individual questions.'],
          ]}
        />
        <Callout>
          If you change a multiple-choice question to another type, its choices are cleared. If
          you switch another question to multiple choice, the menu asks for the choices before
          saving the change.
        </Callout>
      </GuideSection>

      <GuideSection title="Access and Behavior">
        <p>
          The Access page sets the panel channel, review channel, reviewer roles, and roles required
          to start the form. For channels, send a mention or channel ID; for roles, send role
          mentions or IDs. Use <code className="font-mono text-orange-light">clear</code> to remove a
          channel or clear all roles from that field.
        </p>
        <p>
          The Behavior page toggles multiple submissions, reviewer pings, applicant decision DMs,
          and anonymous review. It also edits the cooldown and the per-member accepted-submission
          limit. Cooldowns accept values such as{' '}
          <code className="font-mono text-orange-light">24h</code> and{' '}
          <code className="font-mono text-orange-light">7d</code>; enter{' '}
          <code className="font-mono text-orange-light">0</code> or{' '}
          <code className="font-mono text-orange-light">unlimited</code> for no accepted-submission
          limit.
        </p>
      </GuideSection>

      <GuideSection title="Message templates">
        <p>
          The Messages page edits the intro, submission-confirmation, acceptance, and decline
          messages. Templates support <code className="font-mono text-orange-light">{'{form}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{user}'}</code>, and{' '}
          <code className="font-mono text-orange-light">{'{reason}'}</code>. Type{' '}
          <code className="font-mono text-orange-light">reset</code> to restore the default text.
        </p>
      </GuideSection>

      <GuideSection title="Publishing from the menu">
        <p>
          The Publish page lets you preview the panel, open or close the form, and publish the panel
          without leaving the editor. Preview the panel first; the footer tells you whether the form
          is a draft, open, or closed.
        </p>
        <p>
          Opening a form requires at least one question, a panel channel, and a review channel.
          Publishing the panel also requires the form to be open.
        </p>
      </GuideSection>
    </GuidePage>
  );
}
