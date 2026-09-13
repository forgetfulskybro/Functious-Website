import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { REACTION_ROLES_GUIDE, findChapter } from '@/data/guides';

export default function ReactionRolesEditing() {
  const chapter = findChapter(REACTION_ROLES_GUIDE, 'editing')!;
  return (
    <GuidePage guide={REACTION_ROLES_GUIDE} chapter={chapter} description="Edit an existing panel or repair reactions that have gone missing.">

      <GuideSection title="Finding the message ID">
        <p>
          Most subcommands need the message ID of the panel. Run <code className="font-mono text-orange-light">f!roles view</code> to
          see all your panels and their IDs:
        </p>
        <CodeBlock title="Fluxer" code="f!roles view" />
      </GuideSection>

      <GuideSection title="Editing a panel">
        <p>
          Edit re-opens the same setup flow as create, but pre-fills the existing message text so
          you can see and change it. The flow is identical -update the text, re-react to set new
          emojis, then ✅ to save.
        </p>
        <CodeBlock title="Fluxer" code="f!roles edit 1234567890" />
        <Callout>
          If the panel is in a different channel from where you run the command, the bot will
          send the edit prompt in that channel and let you know.
        </Callout>
      </GuideSection>

      <GuideSection title="Deleting a panel">
        <p>
          Deletes the panel message and removes it from the bot&apos;s database. Members will lose
          any roles the bot gave them if they unreact later, but existing role assignments are kept.
        </p>
        <CodeBlock title="Fluxer" code="f!roles delete 1234567890" />
      </GuideSection>

      <GuideSection title="Fixing reactions">
        <p>
          If reactions go missing -for example after a bot restart or a permissions change —
          the fix command removes all reactions from the panel and re-adds the correct ones.
        </p>
        <CodeBlock title="Fluxer" code="f!roles fix 1234567890" />
      </GuideSection>
    </GuidePage>
  );
}
