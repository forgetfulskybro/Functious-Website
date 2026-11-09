import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { FORMS_GUIDE, findChapter } from '@/data/guides';

export default function FormsCommands() {
  const chapter = findChapter(FORMS_GUIDE, 'commands')!;
  return (
    <GuidePage
      guide={FORMS_GUIDE}
      chapter={chapter}
      description="Every Forms command, from creating a form and adding questions to publishing a panel and reviewing submissions."
    >
      <GuideSection title="Command reference">
        <p>
          All commands use the <code className="font-mono text-orange-light">f!forms</code> prefix;
          {' '}<code className="font-mono text-orange-light">f!form</code> is also an alias. Form names
          can be used in place of IDs.
        </p>
        <Callout title="Permissions">
          Setup and management commands require Manage Guild. Review commands require a reviewer
          role or Manage Guild. Members can use the panel and submit forms without either
          permission.
        </Callout>
      </GuideSection>

      <GuideSection title="Setup and management">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!forms', 'Show the command overview.'],
            ['f!forms setup [form]', 'Open Form Menu. Without a form, show a paginated picker or open the only form.'],
            ['f!forms create <name>', 'Create a draft form and open it in Form Menu.'],
            ['f!forms edit <form>', 'Open Form Menu for an existing form.'],
            ['f!forms edit <form> <field>:<value>', 'Quick-edit one field: name, description, color, image, emoji, cooldown, multiple, ping, dm, or anonymous.'],
            ['f!forms description <form> [text]', 'Set the form description. Omit the text to clear it.'],
            ['f!forms list', 'List all forms in the community, with pagination.'],
            ['f!forms view <form>', 'Show the form summary and question list.'],
            ['f!forms delete <form> confirm', 'Permanently delete the form, its panel, and its submissions.'],
          ]}
        />
      </GuideSection>

      <GuideSection title="Questions">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!forms question add <form>', 'Open the question-type picker.'],
            ['f!forms question add <form> <type> | <prompt>', 'Add a required question. Type is text, paragraph, or choice.'],
            ['f!forms question add <form> choice | <prompt> | <option> | <option>', 'Add a multiple-choice question with at least two options and up to ten.'],
            ['f!forms question remove <form> <number>', 'Remove a question by its 1-based number.'],
            ['f!forms question move <form> <number> <new number>', 'Move a question to another position.'],
          ]}
        />
        <Callout>
          Choice options use the <code className="font-mono text-orange-light">|</code> separator.
          Questions created through the command are required; use Form Menu to make one optional.
        </Callout>
        <CodeBlock
          title="Question examples"
          code={`f!forms question add StaffApp text | Why do you want to join?\nf!forms question add StaffApp choice | Availability | Weekdays | Weekends | Both`}
        />
      </GuideSection>

      <GuideSection title="Access, appearance, and behavior">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!forms channel <form> <#channel|clear>', 'Set or clear the channel where the panel is published.'],
            ['f!forms review <form> <#channel|clear>', 'Set or clear the channel where submissions are reviewed.'],
            ['f!forms reviewer <form> <@role|clear>', 'Add a reviewer role. Clear removes all reviewer roles.'],
            ['f!forms require <form> <@role|clear>', 'Add a role required to start the form. Clear removes all required roles.'],
            ['f!forms emoji <form> [emoji]', 'Set the panel reaction. Omit the emoji to choose from a reaction picker.'],
            ['f!forms color <form> <#hex>', 'Set the panel accent color.'],
            ['f!forms image <form> <url|clear>', 'Set or clear the panel image.'],
            ['f!forms cooldown <form> [duration]', 'Set the per-member cooldown. Omit the duration to show the current value.'],
            ['f!forms multiple <form> <yes|no>', 'Allow more than one pending submission.'],
            ['f!forms ping <form> <yes|no>', 'Ping reviewer roles when a new review is posted.'],
            ['f!forms dm <form> <yes|no>', 'DM applicants when a submission is accepted or declined.'],
            ['f!forms anonymous <form> <yes|no>', 'Hide the applicant name in review embeds.'],
            ['f!forms max <form> <number|unlimited>', 'Set the per-member accepted-submission limit. 0 means unlimited.'],
          ]}
        />
        <p>
          Cooldowns must be between one hour and thirty days. The accepted-submission limit accepts
          values from 0 to 1000. <code className="font-mono text-orange-light">reviewer</code> and{' '}
          <code className="font-mono text-orange-light">require</code> add one role per command; use{' '}
          <code className="font-mono text-orange-light">clear</code> to remove all roles from that
          field.
        </p>
      </GuideSection>

      <GuideSection title="Messages">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!forms message <form> intro <text|reset>', 'Set the message members see when they start the form.'],
            ['f!forms message <form> confirmation <text|reset>', 'Set the message shown after a submission is sent.'],
            ['f!forms message <form> accept <text|reset>', 'Set the acceptance DM template.'],
            ['f!forms message <form> decline <text|reset>', 'Set the decline DM template.'],
          ]}
        />
        <p>
          Templates support <code className="font-mono text-orange-light">{'{form}'}</code>,{' '}
          <code className="font-mono text-orange-light">{'{user}'}</code>, and{' '}
          <code className="font-mono text-orange-light">{'{reason}'}</code>.
        </p>
      </GuideSection>

      <GuideSection title="Preview, open, and publish">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!forms preview <form>', 'Preview the panel embed before publishing it.'],
            ['f!forms open <form>', 'Open the form. Requires at least one question and both channels.'],
            ['f!forms panel <form> [channel]', 'Publish the reaction panel. Re-running refreshes the existing panel.'],
            ['f!forms close <form>', 'Stop new submissions while allowing pending reviews to finish.'],
          ]}
        />
        <CodeBlock
          title="Publish checklist"
          code={`f!forms preview StaffApp\nf!forms open StaffApp\nf!forms panel StaffApp`}
        />
      </GuideSection>

      <GuideSection title="Reviewing submissions">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!forms submissions <form> [status]', 'List submissions. The default is pending; use all, in_progress, accepted, declined, or withdrawn for another view.'],
            ['f!forms submission <id>', 'Show a submission and all of its answers.'],
            ['f!forms reason <id> <reason>', 'Decline a pending submission and save the reason.'],
            ['f!forms repost <id>', 'Repost a pending review message if the original was lost.'],
            ['f!forms withdraw <id>', 'Withdraw your own in-progress or pending submission. Admins can withdraw any submission.'],
          ]}
        />
        <p>
          Reviewers can also use the reaction controls on the review message: ✅ accepts, ❌ starts a
          decline, and the arrows browse long submissions. If the bot cannot DM a reviewer for a
          decline reason, use the <code className="font-mono text-orange-light">reason</code>{' '}
          command instead.
        </p>
        <CodeBlock
          title="Review examples"
          code={`f!forms submissions StaffApp\nf!forms submission 123456789012345678\nf!forms reason 123456789012345678 Not enough availability`}
        />
      </GuideSection>
    </GuidePage>
  );
}
