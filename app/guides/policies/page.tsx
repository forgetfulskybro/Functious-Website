import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { POLICIES_GUIDE, findChapter } from '@/data/guides';

export default function PoliciesOverview() {
  const chapter = findChapter(POLICIES_GUIDE, '')!;

  return (
    <GuidePage
      guide={POLICIES_GUIDE}
      chapter={chapter}
      description="Give each command its own availability, channel, role, cooldown, and cleanup rules without changing anyone's Fluxer permissions."
    >
      <GuideSection title="What Command Policies can do">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-white">Disable commands</span> - hide commands your
            community does not use.
          </li>
          <li>
            <span className="font-semibold text-white">Restrict channels and roles</span> - only
            allow a command where and for whom it makes sense.
          </li>
          <li>
            <span className="font-semibold text-white">Add cooldowns</span> - slow down commands
            without changing the bot&apos;s built-in limits.
          </li>
          <li>
            <span className="font-semibold text-white">Clean up invocations</span> - delete the
            trigger message after the command runs.
          </li>
          <li>
            <span className="font-semibold text-white">Reset safely</span> - remove all custom
            rules for one command and return it to its defaults.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          Command policies require Manage Guild. Policies apply to everyone in the community,
          including owners.
        </Callout>
      </GuideSection>

      <GuideSection title="Opening the policy editor">
        <p>
          Run <code className="font-mono text-orange-light">f!policy</code> with no command to see
          the overview, or add a command name to open its policy editor:
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!policy\nf!policy giveaway\nf!policy polls`}
        />
        <p>
          Command aliases work too. For example,{' '}
          <code className="font-mono text-orange-light">f!policy gw</code> opens the policy for
          Giveaways. Use <code className="font-mono text-orange-light">f!help</code> if you are not
          sure which command name to use.
        </p>
        <p>
          The same settings are available in the dashboard under Configuration, on the Command
          policies tab.
        </p>
      </GuideSection>

      <GuideSection title="Policy settings">
        <ProseTable
          headers={['Setting', 'Default', 'What it controls']}
          rows={[
            ['Enabled', 'On', 'Whether the command can be used at all.'],
            ['Allowed channels', 'All text channels', 'The channels where the command is accepted. An empty selection means every text channel.'],
            ['Allowed roles', 'No role requirement', 'The roles that may use the command. An empty selection means no role requirement.'],
            ['Cooldown', 'The command\'s global cooldown', 'An optional longer cooldown, up to one hour.'],
            ['Invocation cleanup', 'Off', 'Delete the message that triggered the command.'],
          ]}
        />
        <p>
          Only commands that are available to the community can be configured. Owner-only commands
          are not part of the policy list.
        </p>
      </GuideSection>

      <GuideSection title="What cleanup does">
        <p>
          Invocation cleanup deletes the <span className="font-semibold text-white">trigger message</span>{' '}
          after the bot reads the command. It does not delete the bot&apos;s response. This is
          useful for keeping a commands channel tidy without removing the result.
        </p>
      </GuideSection>

      <GuideSection title="Disabled commands in help">
        <p>
          Commands disabled by policy are separated in the help menu, so members can see that the
          command exists but is unavailable in this community. Re-enable it from the policy editor
          or the dashboard when you need it again.
        </p>
      </GuideSection>

      <GuideSection title="Common uses">
        <ul className="list-disc space-y-2 pl-5">
          <li>Keep giveaway creation inside a staff-only channel.</li>
          <li>Disable commands that your community does not use without removing the bot.</li>
          <li>Allow reaction roles only for members with a verified role.</li>
          <li>Add a longer cooldown to a command that is being spammed.</li>
          <li>Delete trigger messages in a commands channel while keeping bot responses visible.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Resetting a command">
        <p>
          The reset option restores a command to its defaults: enabled, all text channels, no role
          requirement, the global cooldown, and cleanup off. It only affects the command you are
          editing and removes its custom policy record.
        </p>
      </GuideSection>

      <GuideSection title="Dashboard">
        <p>
          Open your community&apos;s dashboard and go to Configuration, then Command policies.
          Select a command to edit the same settings without running a command.
        </p>
      </GuideSection>
    </GuidePage>
  );
}
