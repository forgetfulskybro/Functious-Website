import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { GIVEAWAY_GUIDE, findChapter } from '@/data/guides';

export default function GiveawayCreating() {
  const chapter = findChapter(GIVEAWAY_GUIDE, 'creating')!;
  return (
    <GuidePage
      guide={GIVEAWAY_GUIDE}
      chapter={chapter}
      description="The full command format and every available option for customising a giveaway."
    >
      <GuideSection title="Basic format">
        <p>
          Separate the three required parts with <code className="font-mono text-orange-light">|</code>:
          duration, winner count, then prize.
        </p>
        <CodeBlock title="Fluxer" code="f!giveaway 20m | 3 | A t-shirt" />
        <p>Time formats accepted:</p>
        <CodeBlock title="Examples" code={'30m\n2h\n1d\n1h30m'} />
        <Callout>
          Minimum duration is 2 minutes. Maximum is 365 days. Winner count can be up to 50.
        </Callout>
      </GuideSection>

      <GuideSection title="Sending to a different channel">
        <p>
          Add <code className="font-mono text-orange-light">channel:#channelname</code> (or a channel ID) after the prize to post in a specific channel:
        </p>
        <CodeBlock title="Fluxer" code="f!giveaway 1h | 1 | Plutonium | channel:#giveaways" />
        <p>
          If you use a channel ID, put it after any requirement text so the parser does not
          confuse it with the prize.
        </p>
      </GuideSection>

      <GuideSection title="Optional flags">
        <p>
          Append any number of these flags after the prize, each separated by <code className="font-mono text-orange-light">|</code>:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="font-mono text-orange-light">dm:yes</code> / <code className="font-mono text-orange-light">dm:no</code> - DM winners when the giveaway ends (default: off).
          </li>
          <li>
            <code className="font-mono text-orange-light">ping:yes</code> / <code className="font-mono text-orange-light">ping:no</code> - Ping winners in the channel announcement (default: on).
          </li>
          <li>
            <code className="font-mono text-orange-light">multiwin:yes</code> - Allow the same user to win multiple times (default: off).
          </li>
          <li>
            <code className="font-mono text-orange-light">image:https://...</code> - Attach an image to the giveaway embed.
          </li>
          <li>
            Any other text after the prize (and before named flags) is treated as an entry <span className="font-semibold text-white">requirement</span>, shown on the embed.
          </li>
        </ul>
        <CodeBlock
          title="Fluxer - full example"
          code="f!giveaway 24h | 2 | Steam key | Must be level 5 | channel:#giveaways | dm:yes | ping:no | image:https://example.com/prize.png"
        />
      </GuideSection>

      <GuideSection title="Reactions while live">
        <p>
          Members react with the confetti emoji to enter. The bot owner (you) can react with the
          stop emoji to end the giveaway early - it picks winners immediately.
        </p>
        <Callout>
          Reactions have a 3-second per-user cooldown to prevent reaction spam affecting entry
          counts.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
