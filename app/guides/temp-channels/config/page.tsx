import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { TEMP_CHANNELS_GUIDE, findChapter } from '@/data/guides';

export default function TempChannelsConfig() {
  const chapter = findChapter(TEMP_CHANNELS_GUIDE, 'config')!;
  return (
    <GuidePage guide={TEMP_CHANNELS_GUIDE} chapter={chapter} description="Change channel names, user limits, counting, and categories without touching the existing setup.">

      <GuideSection title="Editing config live">
        <p>
          <code className="font-mono text-orange-light">f!tc edit</code> modifies the saved configuration
          without deleting and re-creating channels. Changes apply to all new temporary channels
          from that point on.
        </p>
        <CodeBlock title="Fluxer" code="f!tc edit {name:Private Room} {limit:2}" />
        <p>Toggle counting on or off (it flips its current state each time):</p>
        <CodeBlock title="Fluxer" code="f!tc edit {counting}" />
        <p>Point to a different category (by name or ID):</p>
        <CodeBlock title="Fluxer" code="f!tc edit {category:My Category}" />
      </GuideSection>

      <GuideSection title="Removing specific settings">
        <p>
          <code className="font-mono text-orange-light">f!tc delete</code> removes individual config fields,
          reverting them to the default. The channels themselves are not affected.
        </p>
        <CodeBlock title="Fluxer" code="f!tc delete {name} {limit} {counting}" />
        <p>All deletable fields:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code className="font-mono text-orange-light">{'{name}'}</code> - reverts to the default channel name.</li>
          <li><code className="font-mono text-orange-light">{'{limit}'}</code> - removes the user limit.</li>
          <li><code className="font-mono text-orange-light">{'{counting}'}</code> - disables numbering.</li>
          <li><code className="font-mono text-orange-light">{'{category}'}</code> - removes the custom category override.</li>
          <li><code className="font-mono text-orange-light">{'{manage}'}</code> - removes the manage panel reference.</li>
        </ul>
        <Callout>
          Deleting a field from config does not delete the Fluxer channel - it only removes the
          setting from the bot.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
