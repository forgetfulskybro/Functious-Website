import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { REACTION_ROLES_GUIDE, findChapter } from '@/data/guides';

export default function ReactionRolesSetup() {
  const chapter = findChapter(REACTION_ROLES_GUIDE, 'setup')!;
  return (
    <GuidePage guide={REACTION_ROLES_GUIDE} chapter={chapter} description="Walk through creating a reaction role panel from scratch, step by step.">

      <GuideSection title="Starting the flow">
        <p>
          Run the create command. The bot deletes your command message and posts a setup prompt
          with ✅ and ❌ reactions. You now have 10 minutes to send your panel message.
        </p>
        <CodeBlock title="Fluxer" code="f!roles create" />
        <p>To post the panel in a different channel, mention it:</p>
        <CodeBlock title="Fluxer" code="f!roles create #role-menu" />
        <p>The message type defaults to <code className="font-mono text-orange-light">content</code>. For a rich embed instead:</p>
        <CodeBlock title="Fluxer" code="f!roles create embed #role-menu" />
      </GuideSection>

      <GuideSection title="Writing your panel message">
        <p>
          Send any message you like. Use the <code className="font-mono text-orange-light">{'{role:Name}'}</code> placeholder
          wherever you want a role to appear. The bot will replace it with the emoji you react
          with next to the role name.
        </p>
        <CodeBlock title="Your message" code={`🎨 Color Roles\n\n{role:Blue}\n{role:Red}\n{role:Purple}`} />
        <p>
          To use role mentions (<code className="font-mono text-orange-light">@Role</code>) instead of just the name,
          add <code className="font-mono text-orange-light">{'{mention}'}</code> anywhere in the message. It is removed
          from the final panel but tells the bot to use mentions.
        </p>
        <CodeBlock title="With mentions" code={`{mention}\nColor Roles\n{role:Blue}\n{role:Red}`} />
      </GuideSection>

      <GuideSection title="Reacting to assign emojis">
        <p>
          After you send your message, the bot copies it. React to the bot&apos;s copy with one
          emoji per role, in the same order the roles appear in the message. So if Blue is first,
          react first, then Red, then Purple.
        </p>
        <Callout title="Order matters">
          The bot assigns emojis to roles in the order you react. Make sure the order of your
          reactions matches the order of <code className="font-mono text-orange-light">{'{role:…}'}</code> placeholders in your message.
        </Callout>
        <p>
          When all roles have an emoji assigned, react ✅ to finish. The bot posts the final
          panel message and the system goes live immediately.
        </p>
      </GuideSection>

      <GuideSection title="Cancelling mid-setup">
        <p>React ❌ on the setup message at any time, or run:</p>
        <CodeBlock title="Fluxer" code="f!roles stop" />
      </GuideSection>

      <GuideSection title="Enabling DM confirmations">
        <p>
          The bot can DM members when a role is added or removed. Toggle it with:
        </p>
        <CodeBlock title="Fluxer" code="f!roles dm" />
      </GuideSection>
    </GuidePage>
  );
}
