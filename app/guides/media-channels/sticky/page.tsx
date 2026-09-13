import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { MEDIA_CHANNELS_GUIDE, findChapter } from '@/data/guides';

export default function MediaChannelsSticky() {
  const chapter = findChapter(MEDIA_CHANNELS_GUIDE, 'sticky')!;
  return (
    <GuidePage guide={MEDIA_CHANNELS_GUIDE} chapter={chapter} description="Post a reminder message that automatically re-posts itself to stay at the bottom of the channel after each new post.">

      <GuideSection title="How the sticky works">
        <p>
          When sticky is enabled, a short timer (5 seconds) starts after each new post. When the
          timer fires, the bot deletes its previous sticky message and sends a new one. This keeps
          the reminder visible at the bottom of the channel without spamming it.
        </p>
        <p>
          If multiple posts arrive in quick succession, the timer resets each time - only one
          sticky is ever sent.
        </p>
      </GuideSection>

      <GuideSection title="Enabling sticky">
        <CodeBlock title="Fluxer" code="f!mc add #media --images --sticky" />
        <CodeBlock title="Fluxer -editing an existing channel" code="f!mc edit #media --images --sticky" />
      </GuideSection>

      <GuideSection title="Custom sticky text">
        <p>
          By default the bot generates a message listing the allowed content types. To use your
          own text, add <code className="font-mono text-orange-light">--stickytext</code> followed by the message
          (everything after the flag is used as the text):
        </p>
        <CodeBlock title="Fluxer" code="f!mc add #fan-art --images --sticky --stickytext 📌 Fan art only! No memes, no screenshots." />
        <Callout>
          The sticky text has a 500-character limit. Leave it out to use the auto-generated
          default that lists the allowed types.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
