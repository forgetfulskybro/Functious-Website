import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { REACTION_ROLES_GUIDE, findChapter } from '@/data/guides';

export default function ReactionRolesExclusive() {
  const chapter = findChapter(REACTION_ROLES_GUIDE, 'exclusive')!;
  return (
    <GuidePage guide={REACTION_ROLES_GUIDE} chapter={chapter} description="Exclusive mode limits a panel so each member can only hold one role from it at a time.">

      <GuideSection title="What exclusive mode does">
        <p>
          When exclusive mode is on, reacting with a new emoji automatically removes the reaction
          and role from any emoji the member previously had on that panel. This is useful for
          color roles, pronoun roles, or any set where members should only pick one.
        </p>
      </GuideSection>

      <GuideSection title="Toggling exclusive mode">
        <p>
          Run the exclusive command with the panel&apos;s message ID to toggle it on or off:
        </p>
        <CodeBlock title="Fluxer" code="f!roles exclusive 1234567890" />
        <Callout>
          Exclusive mode is per-panel. You can have some panels exclusive and others not within
          the same server.
        </Callout>
      </GuideSection>

      <GuideSection title="Checking current state">
        <p>
          <code className="font-mono text-orange-light">f!roles view</code> shows whether exclusive is enabled for each panel:
        </p>
        <CodeBlock title="Fluxer" code="f!roles view" />
      </GuideSection>
    </GuidePage>
  );
}
