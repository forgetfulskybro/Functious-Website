import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { POLICIES_GUIDE, findChapter } from '@/data/guides';

export default function PoliciesEditor() {
  const chapter = findChapter(POLICIES_GUIDE, 'editor')!;

  return (
    <GuidePage
      guide={POLICIES_GUIDE}
      chapter={chapter}
      description="Use the reaction menu to toggle a command, choose its channels and roles, set a cooldown, or reset it."
    >
      <GuideSection title="Editor controls">
        <ProseTable
          headers={['Reaction', 'Action']}
          rows={[
            ['🔁', 'Enable or disable the command.'],
            ['📢', 'Edit the allowed text channels.'],
            ['🎭', 'Edit the allowed roles.'],
            ['⏱️', 'Set a custom cooldown.'],
            ['🧹', 'Toggle trigger-message cleanup.'],
            ['♻️', 'Reset the command to its defaults. Only shown when a custom policy exists.'],
            ['❌', 'Close the editor.'],
          ]}
        />
        <p>
          The editor saves each change immediately. It closes after five minutes or when you react
          with ❌.
        </p>
      </GuideSection>

      <GuideSection title="Allowed channels">
        <p>
          React with 📢 and send one or more channel names, IDs, or #channel mentions. Separate
          multiple channels with commas or new lines. The new selection replaces the old one.
        </p>
        <CodeBlock
          title="Channel selection"
          code={`#bot-commands, #staff-commands\n123456789012345678, 234567890123456789\n*`}
        />
        <p>
          Send <code className="font-mono text-orange-light">*</code> to allow every text channel.
          If no channels are selected, the command is allowed everywhere.
        </p>
      </GuideSection>

      <GuideSection title="Allowed roles">
        <p>
          React with 🎭 and send one or more role names, IDs, or @role mentions. Separate multiple
          roles with commas or new lines. The new selection replaces the old one.
        </p>
        <CodeBlock
          title="Role selection"
          code={`@Staff, @Moderator\nStaff, Moderator\n*`}
        />
        <p>
          Send <code className="font-mono text-orange-light">*</code> to remove the role
          requirement. If no roles are selected, everyone who can see the channel can use the
          command.
        </p>
        <Callout title="Channel and role checks">
          If both lists are configured, members need access to an allowed channel and one of the
          allowed roles. Policies still apply to owners.
        </Callout>
      </GuideSection>

      <GuideSection title="Custom cooldowns">
        <p>
          React with ⏱️ and send a duration. The editor accepts short units, combinations, and a
          plain number of seconds.
        </p>
        <ProseTable
          headers={['Input', 'Result']}
          rows={[
            ['45s', '45 seconds.'],
            ['2m', '2 minutes.'],
            ['1h', '1 hour.'],
            ['1m 30s', '90 seconds.'],
            ['120', '120 seconds.'],
            ['default', 'Use the command\'s global cooldown.'],
          ]}
        />
        <p>
          Custom cooldowns cannot be longer than one hour. They also cannot be shorter than the
          command&apos;s built-in cooldown; if you enter a shorter value, the built-in cooldown is
          used instead.
        </p>
      </GuideSection>

      <GuideSection title="Cleanup">
        <p>
          React with 🧹 to toggle invocation cleanup. When enabled, the bot deletes the message that
          triggered the command after reading it. The bot&apos;s response is not deleted.
        </p>
      </GuideSection>

      <GuideSection title="Resetting and closing">
        <p>
          React with ♻️ to reset the command. The bot asks for confirmation, then restores enabled,
          all channels, no role requirement, the global cooldown, and cleanup off.
        </p>
        <p>
          React with ❌ to close the editor. If the editor times out, run{' '}
          <code className="font-mono text-orange-light">f!policy &lt;command&gt;</code> again to
          reopen it.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!policy giveaway\nf!policy gw\nf!policy polls`}
        />
      </GuideSection>

      <GuideSection title="Dashboard">
        <p>
          The dashboard exposes the same settings without reactions. Open Configuration, choose
          Command policies, then select the command you want to edit. Changes made in the dashboard
          apply immediately.
        </p>
      </GuideSection>
    </GuidePage>
  );
}
