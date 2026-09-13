import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { GIVEAWAY_GUIDE, findChapter } from '@/data/guides';

export default function GiveawayManaging() {
  const chapter = findChapter(GIVEAWAY_GUIDE, 'managing')!;
  return (
    <GuidePage
      guide={GIVEAWAY_GUIDE}
      chapter={chapter}
      description="Delete a live giveaway or reroll winners after it has ended."
    >
      <GuideSection title="Getting the message ID">
        <p>
          Both <code className="font-mono text-orange-light">delete</code> and{' '}
          <code className="font-mono text-orange-light">reroll</code> need the giveaway message ID.
          Right-click (or long-press on mobile) the giveaway message and copy its ID. Developer
          Mode must be enabled in Fluxer settings.
        </p>
      </GuideSection>

      <GuideSection title="Deleting a giveaway">
        <p>
          Ends the giveaway immediately without picking winners and deletes the message. Only the
          giveaway creator can delete it.
        </p>
        <CodeBlock title="Fluxer" code="f!giveaway delete 1234567890123456789" />
      </GuideSection>

      <GuideSection title="Rerolling winners">
        <p>
          Pick a new winner (or all winners) from the original entry pool after the giveaway has
          ended. Only the giveaway creator can reroll.
        </p>
        <CodeBlock title="Fluxer - reroll one winner" code="f!giveaway reroll 1234567890123456789 | 1" />
        <CodeBlock title="Fluxer - reroll all winners" code="f!giveaway reroll 1234567890123456789 | all" />
        <p>
          When rerolling a specific position (e.g. winner 2), provide the number matching that
          slot. Using <code className="font-mono text-orange-light">all</code> replaces every winner at once.
        </p>
        <Callout>
          The reroll pool is the full original entry list. Already-picked winners are excluded
          unless <code className="font-mono text-orange-light">multiwin</code> was enabled when the giveaway was created.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
