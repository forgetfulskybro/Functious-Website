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
          When enabled, the bot creates a read-only text channel containing a message with
          management reaction emojis. The owner of a temp channel reacts to trigger a DM-based
          conversation where they can make changes.
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
          The bot sends a DM asking for the new value after the owner reacts. Members must have
          DMs from server members enabled for this to work.
        </Callout>
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
