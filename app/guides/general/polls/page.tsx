import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import PollsDemo from '@/components/home/PollsDemo';
import { GENERAL_GUIDE, findChapter } from '@/data/guides';

export default function PollsGuide() {
  const chapter = findChapter(GENERAL_GUIDE, 'polls')!;
  return (
    <GuidePage guide={GENERAL_GUIDE} chapter={chapter} description="Create timed polls with live percentage bars that update as members vote.">

      <PollsDemo />

      <GuideSection title="Creating a poll">
        <p>
          Use <code className="font-mono text-orange-light">|</code> to separate the duration, question, and options.
          You need at least two options; up to ten are supported.
        </p>
        <CodeBlock title="Fluxer" code="f!polls 30m | Best programming language? | Python | TypeScript | Rust" />
        <Callout>
          Duration formats: <code className="font-mono text-orange-light">30m</code>,{' '}
          <code className="font-mono text-orange-light">2h</code>,{' '}
          <code className="font-mono text-orange-light">1d</code>,{' '}
          <code className="font-mono text-orange-light">1h30m</code>. Minimum is 30 seconds, maximum is 30 days.
        </Callout>
        <p>You can have up to 5 active polls per user at a time.</p>
      </GuideSection>

      <GuideSection title="Viewing your polls">
        <p>See all your currently running polls:</p>
        <CodeBlock title="Fluxer" code="f!polls view" />
      </GuideSection>

      <GuideSection title="Ending a poll early">
        <p>End one of your polls before its time is up. Use the poll number from <code className="font-mono text-orange-light">f!polls view</code>:</p>
        <CodeBlock title="Fluxer" code="f!polls delete 1" />
      </GuideSection>

      <GuideSection title="Locking polls behind a permission">
        <p>
          By default any member can create a poll. Toggle the permission lock to require
          Manage Guild:
        </p>
        <CodeBlock title="Fluxer" code="f!polls toggle" />
      </GuideSection>
    </GuidePage>
  );
}
