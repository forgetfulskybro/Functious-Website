import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { TEMP_CHANNELS_GUIDE, findChapter } from '@/data/guides';

export default function TempChannelsSetup() {
  const chapter = findChapter(TEMP_CHANNELS_GUIDE, 'setup')!;
  return (
    <GuidePage guide={TEMP_CHANNELS_GUIDE} chapter={chapter} description="Create a default temp channels setup or a fully customised one in a single command.">

      <GuideSection title="Default setup">
        <p>
          The quickest way to get started. Creates a "Temp Channels" category and a
          "Join To Create" voice channel inside it with sensible defaults:
        </p>
        <CodeBlock title="Fluxer" code="f!tc set default" />
        <Callout>
          If temp channels are already configured, add <code className="font-mono text-orange-light">{'{reset}'}</code> to
          wipe the existing setup first:
          <br />
          <code className="font-mono text-orange-light">f!tc set default {'{reset}'}</code>
        </Callout>
      </GuideSection>

      <GuideSection title="Custom setup">
        <p>
          Use <code className="font-mono text-orange-light">set config</code> to combine options in one command.
          All fields are optional - include only what you want to change from the defaults.
        </p>
        <CodeBlock title="Fluxer" code={`f!tc set config {name:🎮 Room} {limit:5} {counting} {manage}`} />
        <p>Options available during setup:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><code className="font-mono text-orange-light">{'{name:…}'}</code> - base name for created channels.</li>
          <li><code className="font-mono text-orange-light">{'{limit:N}'}</code> - max users per channel (0 = unlimited, max 99).</li>
          <li><code className="font-mono text-orange-light">{'{counting}'}</code> - appends a number to the channel name (Room 1, Room 2…).</li>
          <li><code className="font-mono text-orange-light">{'{category:Name or ID}'}</code> - use an existing category instead of creating a new one.</li>
          <li><code className="font-mono text-orange-light">{'{manage}'}</code> - create a management panel channel (see the Manage Panel chapter).</li>
        </ul>
      </GuideSection>

      <GuideSection title="Resetting">
        <p>Delete everything - category, "Join To Create" channel, all active temp channels, and config:</p>
        <CodeBlock title="Fluxer" code="f!tc set config {reset}" />
        <p>Reset and immediately create a new default setup:</p>
        <CodeBlock title="Fluxer" code="f!tc set default {reset}" />
      </GuideSection>

      <GuideSection title="Viewing current config">
        <CodeBlock title="Fluxer" code="f!tc view" />
      </GuideSection>
    </GuidePage>
  );
}
