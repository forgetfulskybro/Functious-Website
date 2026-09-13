import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { GENERAL_GUIDE, findChapter } from '@/data/guides';

export default function BypassGuide() {
  const chapter = findChapter(GENERAL_GUIDE, 'bypass')!;
  return (
    <GuidePage guide={GENERAL_GUIDE} chapter={chapter} description="Grant specific roles the ability to use permission-locked commands without needing the underlying Fluxer permission.">

      <GuideSection title="What bypass roles do">
        <p>
          Commands like <code className="font-mono text-orange-light">f!giveaway</code>,{' '}
          <code className="font-mono text-orange-light">f!polls</code>, and{' '}
          <code className="font-mono text-orange-light">f!roles</code> normally require Manage Guild.
          Bypass roles let you grant specific roles access to individual commands - or all
          permission-locked commands at once - without giving out the full Fluxer permission.
        </p>
        <Callout title="Requires Administrator">
          Managing bypass roles requires the Administrator permission. Up to 15 bypass roles are
          allowed per server.
        </Callout>
      </GuideSection>

      <GuideSection title="Adding a bypass">
        <p>
          Separate the role name from the command list with <code className="font-mono text-orange-light">|</code>, and
          separate individual commands with commas:
        </p>
        <CodeBlock title="Fluxer" code="f!bypass add Moderator | giveaway, polls" />
        <p>To grant access to every permission-locked command at once:</p>
        <CodeBlock title="Fluxer" code="f!bypass add Moderator | all" />
      </GuideSection>

      <GuideSection title="Editing a bypass">
        <p>Replace the command list for an existing bypass role:</p>
        <CodeBlock title="Fluxer" code="f!bypass edit Moderator | giveaway, roles, tempchannels" />
      </GuideSection>

      <GuideSection title="Removing a bypass">
        <CodeBlock title="Fluxer" code="f!bypass remove Moderator" />
      </GuideSection>

      <GuideSection title="Viewing all bypasses">
        <CodeBlock title="Fluxer" code="f!bypass view" />
      </GuideSection>
    </GuidePage>
  );
}
