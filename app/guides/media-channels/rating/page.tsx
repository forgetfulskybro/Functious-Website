import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { MEDIA_CHANNELS_GUIDE, findChapter } from '@/data/guides';

export default function MediaChannelsRating() {
  const chapter = findChapter(MEDIA_CHANNELS_GUIDE, 'rating')!;
  return (
    <GuidePage guide={MEDIA_CHANNELS_GUIDE} chapter={chapter} description="Let members vote on content quality with ⬆️/⬇️ reactions, and optionally delete posts that receive too many downvotes.">

      <GuideSection title="Enabling ratings">
        <p>
          Add <code className="font-mono text-orange-light">--rating</code> when adding or editing a channel.
          The bot automatically adds ⬆️ and ⬇️ reactions to every allowed post.
        </p>
        <CodeBlock title="Fluxer" code="f!mc add #media --images --rating" />
        <CodeBlock title="Fluxer -editing an existing channel" code="f!mc edit #media --images --rating" />
      </GuideSection>

      <GuideSection title="Auto-delete threshold">
        <p>
          Pair <code className="font-mono text-orange-light">--rating</code> with <code className="font-mono text-orange-light">--delete N</code> to
          auto-delete a post when its net downvotes (⬇️ minus ⬆️) reach N:
        </p>
        <CodeBlock title="Fluxer -delete when net -5" code="f!mc add #media --images --rating --delete 5" />
        <Callout>
          Net downvotes = total ⬇️ reactions minus total ⬆️ reactions (the bot&apos;s own
          initial reactions are excluded from the count). A threshold of 0 disables auto-delete
          while keeping the reactions.
        </Callout>
      </GuideSection>

      <GuideSection title="How voting works">
        <p>
          Members react ⬆️ or ⬇️. The bot watches both reactions. When a removal is triggered,
          the message is deleted silently. The original poster is not notified.
        </p>
        <p>
          The rating system works alongside all content-type filters - only messages that pass
          the filter get reactions added at all.
        </p>
      </GuideSection>
    </GuidePage>
  );
}
