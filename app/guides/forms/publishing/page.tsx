import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { FORMS_GUIDE, findChapter } from '@/data/guides';

export default function FormsPublishing() {
  const chapter = findChapter(FORMS_GUIDE, 'publishing')!;
  return (
    <GuidePage
      guide={FORMS_GUIDE}
      chapter={chapter}
      description="Open a form, publish its reaction panel, and review the submissions your team receives."
    >
      <GuideSection title="Before you open a form">
        <ul className="list-disc space-y-2 pl-5">
          <li>Add at least one question.</li>
          <li>Set a panel channel where members can see and react to the form.</li>
          <li>Set a review channel where your team will receive submissions.</li>
          <li>Optionally configure reviewer roles, required roles, cooldowns, and message templates.</li>
          <li>Preview the panel to check the title, description, color, image, and emoji.</li>
        </ul>
        <CodeBlock
          title="Fluxer"
          code={`f!forms preview StaffApp\nf!forms open StaffApp\nf!forms panel StaffApp`}
        />
        <Callout title="Draft status">
          A new form starts as a draft. The preview footer shows Draft until the form is opened,
          then Open or Closed as its status changes.
        </Callout>
      </GuideSection>

      <GuideSection title="Publishing the panel">
        <p>
          Opening a form makes it available to members, but it does not post the panel by itself.
          Run <code className="font-mono text-orange-light">f!forms panel &lt;form&gt;</code> to
          publish it. The bot posts a panel with the configured emoji reaction and can send it to a
          different channel if you include a channel argument.
        </p>
        <p>
          Re-running the command replaces the existing panel in the configured panel channel. This
          is useful after changing the form name, description, color, image, or emoji.
        </p>
      </GuideSection>

      <GuideSection title="What members see">
        <p>
          Members react to the panel with its emoji. The bot opens a DM, introduces the form, and
          asks each question in order. Answers are collected privately and sent to the review
          channel when the last question is answered.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Short-text and paragraph questions are answered by replying in the DM.</li>
          <li>Choice questions can be answered by reacting to an option or replying with its number.</li>
          <li>Type <code className="font-mono text-orange-light">back</code> to revisit the previous question.</li>
          <li>Type <code className="font-mono text-orange-light">skip</code> to leave an optional question blank.</li>
          <li>Type <code className="font-mono text-orange-light">cancel</code> to withdraw the draft.</li>
        </ul>
        <Callout title="DMs must be open">
          The form is completed in DMs, so members need to allow direct messages from the community.
          If the bot cannot create a DM, the member sees an error and cannot start the form.
        </Callout>
      </GuideSection>

      <GuideSection title="Submission rules">
        <p>
          Before a member starts, the bot checks the form status, required roles, pending or
          in-progress submissions, the per-member accepted limit, and the cooldown. A member with an
          unfinished draft resumes it instead of starting over.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><span className="font-semibold text-white">Multiple submissions</span> - when off, a member with a pending submission cannot start another.</li>
          <li><span className="font-semibold text-white">Accepted limit</span> - 0 means unlimited; otherwise the cap applies to that member.</li>
          <li><span className="font-semibold text-white">Cooldown</span> - measured from the member&apos;s latest submission.</li>
          <li><span className="font-semibold text-white">Required roles</span> - members without one of the configured roles cannot start.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Reviewing a submission">
        <p>
          Finished submissions are posted in the review channel. Reviewers can use the reaction
          controls directly on the review message, or manage reviews with commands. Review messages
          show up to ten questions per page; the arrow reactions page through longer submissions.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><span className="font-semibold text-white">✅ Accept</span> - approves the submission and updates the review embed.</li>
          <li><span className="font-semibold text-white">❌ Decline</span> - asks the reviewer for a reason, then declines the submission.</li>
          <li><span className="font-semibold text-white">Reason</span> - saved with the submission and included in the decline DM.</li>
          <li><span className="font-semibold text-white">Repost</span> - restores a pending review message if the original was deleted.</li>
        </ul>
        <CodeBlock
          title="Review commands"
          code={`f!forms submissions StaffApp\nf!forms submission 123456789012345678\nf!forms reason 123456789012345678 Not enough availability\nf!forms repost 123456789012345678\nf!forms withdraw 123456789012345678`}
        />
        <Callout title="Applicant notifications">
          Accepted and declined applicants are DMed when applicant decision DMs are enabled. Custom
          accept and decline templates can include <code className="font-mono text-orange-light">{'{form}'}</code>,
          <code className="font-mono text-orange-light"> {'{user}'}</code>, and{' '}
          <code className="font-mono text-orange-light">{'{reason}'}</code>.
        </Callout>
      </GuideSection>

      <GuideSection title="Closing, editing, and deleting">
        <p>
          Closing a form stops new submissions but lets pending reviews finish. You can reopen it
          later with <code className="font-mono text-orange-light">f!forms open &lt;form&gt;</code>.
          Deleting a form is permanent and also removes its panel and submissions.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!forms close StaffApp\nf!forms list\nf!forms view StaffApp\nf!forms delete StaffApp confirm`}
        />
        <Callout>
          To change questions or settings after publishing, open Form Menu again with{' '}
          <code className="font-mono text-orange-light">f!forms edit &lt;form&gt;</code>. Republish
          the panel afterward if the panel content changed.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
