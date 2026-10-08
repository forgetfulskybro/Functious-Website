import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { TEMP_CHANNELS_GUIDE, findChapter } from '@/data/guides';

export default function TempChannelsManage() {
  const chapter = findChapter(TEMP_CHANNELS_GUIDE, 'manage')!;
  return (
    <GuidePage guide={TEMP_CHANNELS_GUIDE} chapter={chapter} description="An optional management panel that lets channel owners control their own temp channel by reacting to a message.">

      <GuideSection title="What the manage panel does">
        <p>
          When enabled, the bot posts a message with management reaction emojis. The owner of a
          temp channel reacts to start a short conversation where they can make changes.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>✏️ Rename the channel</li>
          <li>👥 Set a user limit</li>
          <li>🔒 Toggle privacy (public / private)</li>
          <li>🚫 Block a user from joining</li>
          <li>✅ Unblock a user</li>
          <li>🌍 Change region</li>
          <li>🔁 Transfer ownership</li>
          <li>❌ Close the channel</li>
        </ul>
        <Callout>
          With a separate manage channel the bot sends a DM asking for the new value after the
          owner reacts. Members must have DMs from community members enabled for this to work -
          if they don't, the bot posts a short notice in the panel's channel instead. With{' '}
          <code className="font-mono text-orange-light">{'{managevc}'}</code> no DMs are involved
          at all.
        </Callout>
      </GuideSection>

      <GuideSection title="Posting the panel inside the temp channel">
        <p>
          Instead of a separate manage channel, add{' '}
          <code className="font-mono text-orange-light">{'{managevc}'}</code> to have the bot post
          the same panel inside each newly created temporary voice channel's text chat. Nothing is
          stored or re-fetched on restart - the panel lives and reacts right in the channel it
          belongs to.
        </p>
        <CodeBlock title="Fluxer" code="f!tc set config {managevc}" />
        <p>
          In this mode the bot asks for input in the voice channel's text chat instead of by DM,
          so owners never need their DMs open. A separate manage channel (if you also enable{' '}
          <code className="font-mono text-orange-light">{'{manage}'}</code>) keeps using DMs.
        </p>
        <p>
          Toggle it later with{' '}
          <code className="font-mono text-orange-light">f!tc edit {'{managevc}'}</code> and turn it
          off with <code className="font-mono text-orange-light">f!tc delete {'{managevc}'}</code>.
          It applies to new temp channels - existing ones are left untouched.
        </p>
      </GuideSection>

      <GuideSection title="Enabling during setup">
        <p>Include <code className="font-mono text-orange-light">{'{manage}'}</code> when running the setup or config command:</p>
        <CodeBlock title="Fluxer" code="f!tc set default {manage}" />
        <CodeBlock title="Fluxer" code="f!tc set config {name:Room} {manage}" />
      </GuideSection>

      <GuideSection title="Toggling after setup">
        <p>
          If temp channels are already configured, use <code className="font-mono text-orange-light">f!tc edit</code> to
          add or remove the panel. Adding it when none exists creates the channel and message.
          Removing it when one exists deletes that channel.
        </p>
        <CodeBlock title="Fluxer" code="f!tc edit {manage}" />
      </GuideSection>
    </GuidePage>
  );
}
