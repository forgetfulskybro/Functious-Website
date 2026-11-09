import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { FORMS_GUIDE, findChapter, chapterHref } from '@/data/guides';

export default function FormsOverview() {
  const chapter = findChapter(FORMS_GUIDE, '')!;
  return (
    <GuidePage
      guide={FORMS_GUIDE}
      chapter={chapter}
      description="Build private application forms, collect answers in DMs, and review every submission with your team."
    >
      <GuideSection title="What Forms can do">
        <p>
          Forms turns a reaction panel into a private application flow. Members react to start,
          answer questions in DMs, and your reviewers receive each finished submission in a
          private review channel. Reviewers can accept or decline, and applicants can be notified
          by DM.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-white">Form Menu</span> - build and edit forms from
            one paginated reaction menu instead of running a separate command for every setting.
          </li>
          <li>
            <span className="font-semibold text-white">Three question types</span> - short text,
            paragraph, and multiple choice.
          </li>
          <li>
            <span className="font-semibold text-white">Private submissions</span> - members answer
            in DMs, with required-answer validation and draft resume support.
          </li>
          <li>
            <span className="font-semibold text-white">Access controls</span> - choose the panel and
            review channels, reviewer roles, and roles required to start the form.
          </li>
          <li>
            <span className="font-semibold text-white">Review workflow</span> - accept or decline
            with reactions, add a decline reason, repost reviews, and withdraw submissions.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          Creating and changing forms requires Manage Guild. Reviewer commands are available to
          members with a configured reviewer role, and administrators can always review. Members
          need no special permission to submit, but they must allow DMs from the community.
        </Callout>
      </GuideSection>

      <GuideSection title="Form limits">
        <ul className="list-disc space-y-2 pl-5">
          <li>Up to <span className="font-semibold text-white">25 forms</span> per community.</li>
          <li>Up to <span className="font-semibold text-white">50 questions</span> per form.</li>
          <li>Up to <span className="font-semibold text-white">10 choices</span> per multiple-choice question.</li>
          <li>Cooldowns can be between <span className="font-semibold text-white">1 hour and 30 days</span>.</li>
          <li>The accepted-submission limit is per member and accepts <span className="font-semibold text-white">0-1000</span>; 0 means unlimited.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Quick start">
        <p>Create a form. Form Menu opens as soon as the draft is created:</p>
        <CodeBlock title="Fluxer" code="f!forms create StaffApp" />
        <p>
          Add questions from the menu, or use the command form if you already know what you
          want:
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!forms question add StaffApp text | Why do you want to join?\nf!forms question add StaffApp choice | Availability | Weekdays | Weekends | Both`}
        />
        <p>Set the two channels, open the form, and publish its panel:</p>
        <CodeBlock
          title="Fluxer"
          code={`f!forms channel StaffApp #apply\nf!forms review StaffApp #staff-review\nf!forms open StaffApp\nf!forms panel StaffApp`}
        />
        <Callout title="The short path">
          You do not need every command. <code className="font-mono text-orange-light">f!forms setup</code>{' '}
          and <code className="font-mono text-orange-light">f!forms edit &lt;form&gt;</code> open the
          same menu, where channels, questions, behavior, messages, and publishing are all on
          reaction pages.
        </Callout>
      </GuideSection>

      <GuideSection title="Chapters in this guide">
        <ul className="list-none space-y-3">
          {FORMS_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(FORMS_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">
                  {String(FORMS_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white transition-colors group-hover:text-orange-light">
                    {item.title}
                  </span>
                  <span className="block text-xs text-white/40">{item.short}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </GuideSection>
    </GuidePage>
  );
}
